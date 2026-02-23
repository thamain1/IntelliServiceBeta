import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface GenerateInvoiceRequest {
  ticket_id: string;
  issue_date?: string;
  due_days?: number;
  notes?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user is admin or dispatcher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'dispatcher'].includes(profile.role)) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const requestData: GenerateInvoiceRequest = await req.json();
    const { ticket_id, issue_date, due_days = 30, notes } = requestData;

    if (!ticket_id) {
      return new Response(
        JSON.stringify({ error: 'ticket_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Fetch ticket details
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        *,
        customers(id, name, email, phone, address)
      `)
      .eq('id', ticket_id)
      .single();

    if (ticketError || !ticket) {
      return new Response(
        JSON.stringify({ error: 'Ticket not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate ticket is ready to invoice
    if (ticket.status !== 'ready_to_invoice') {
      return new Response(
        JSON.stringify({ 
          error: 'Ticket must be in ready_to_invoice status',
          current_status: ticket.status
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!ticket.billable) {
      return new Response(
        JSON.stringify({ error: 'Ticket is not billable' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if already invoiced
    if (ticket.invoice_id) {
      return new Response(
        JSON.stringify({ 
          error: 'Ticket already has an invoice',
          invoice_id: ticket.invoice_id
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get labor costs from time logs
    const { data: timeLogs } = await supabase
      .from('time_logs')
      .select('*')
      .eq('ticket_id', ticket_id)
      .eq('status', 'approved');

    // Get accounting settings for default tax rate
    const { data: accountingSettings } = await supabase
      .from('accounting_settings')
      .select('*')
      .limit(1)
      .single();

    const defaultTaxRate = accountingSettings?.sales_tax_rate || 0;

    // Calculate totals
    let subtotal = 0;
    const lineItems: Record<string, unknown>[] = [];

    // Add labor line items
    if (timeLogs && timeLogs.length > 0) {
      for (const log of timeLogs) {
        const laborAmount = log.total_billed_amount || 0;
        if (laborAmount > 0) {
          subtotal += laborAmount;
          lineItems.push({
            item_type: 'labor',
            description: `Labor - ${log.total_hours || 0} hours`,
            quantity: log.total_hours || 0,
            unit_price: log.billing_rate_applied || 0,
            line_total: laborAmount,
            taxable: true,
            ticket_id: ticket_id,
            time_log_id: log.id,
          });
        }
      }
    }

    // If no billable items, return error
    if (subtotal === 0) {
      return new Response(
        JSON.stringify({ error: 'No billable items found for this ticket' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Calculate tax and total
    const taxAmount = subtotal * defaultTaxRate;
    const totalAmount = subtotal + taxAmount;

    // Generate invoice number
    const { data: lastInvoice } = await supabase
      .from('invoices')
      .select('invoice_number')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    let invoiceNumber = 'INV-001';
    if (lastInvoice?.invoice_number) {
      const match = lastInvoice.invoice_number.match(/INV-(\d+)/);
      if (match) {
        const nextNum = parseInt(match[1]) + 1;
        invoiceNumber = `INV-${String(nextNum).padStart(3, '0')}`;
      }
    }

    // Create invoice
    const invoiceDate = issue_date ? new Date(issue_date) : new Date();
    const dueDate = new Date(invoiceDate);
    dueDate.setDate(dueDate.getDate() + due_days);

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: ticket.customer_id,
        site_id: ticket.site_id,
        ticket_id: ticket_id,
        source_ticket_id: ticket_id,
        source_type: ticket.ticket_type || 'SVC',
        project_id: ticket.project_id,
        status: 'draft',
        issue_date: invoiceDate.toISOString().split('T')[0],
        due_date: dueDate.toISOString().split('T')[0],
        subtotal: subtotal,
        tax_rate: defaultTaxRate,
        tax_amount: taxAmount,
        discount_amount: 0,
        total_amount: totalAmount,
        amount_paid: 0,
        balance_due: totalAmount,
        notes: notes || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (invoiceError) {
      console.error('Error creating invoice:', invoiceError);
      return new Response(
        JSON.stringify({ error: 'Failed to create invoice', details: invoiceError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create invoice line items
    const lineItemsWithInvoiceId = lineItems.map((item, index) => ({
      ...item,
      invoice_id: invoice.id,
      sort_order: index + 1,
    }));

    const { error: lineItemsError } = await supabase
      .from('invoice_line_items')
      .insert(lineItemsWithInvoiceId);

    if (lineItemsError) {
      console.error('Error creating line items:', lineItemsError);
      // Try to rollback invoice creation
      await supabase.from('invoices').delete().eq('id', invoice.id);
      
      return new Response(
        JSON.stringify({ error: 'Failed to create invoice line items', details: lineItemsError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update ticket status and link to invoice
    const { error: ticketUpdateError } = await supabase
      .from('tickets')
      .update({
        invoice_id: invoice.id,
        status: 'closed_billed',
        billed_at: new Date().toISOString(),
      })
      .eq('id', ticket_id);

    if (ticketUpdateError) {
      console.error('Error updating ticket:', ticketUpdateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice: invoice,
        message: `Invoice ${invoiceNumber} created successfully`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
