import { supabase } from '../lib/supabase';
import { AHSSettingsService } from './AHSSettingsService';
import { AHSTicketService } from './AHSTicketService';
import type { TablesInsert } from '../lib/dbTypes';

export interface BillingBreakdown {
  ahsTotal: number;
  customerTotal: number;
  diagnosisFee: number;
  ahsLabor: number;
  ahsParts: number;
  customerLabor: number;
  customerParts: number;
}

export interface InvoiceCreateResult {
  success: boolean;
  invoiceId: string | null;
  invoiceNumber: string | null;
  error?: string;
}

export class AHSInvoiceService {
  /**
   * Get billing breakdown for an AHS ticket
   */
  static async getTicketBillingBreakdown(ticketId: string): Promise<BillingBreakdown> {
    try {
      const { data, error } = await supabase.rpc('fn_get_ahs_billing_breakdown', {
        p_ticket_id: ticketId,
      });

      if (error) {
        console.error('Error getting billing breakdown:', error);
        return {
          ahsTotal: 0,
          customerTotal: 0,
          diagnosisFee: 0,
          ahsLabor: 0,
          ahsParts: 0,
          customerLabor: 0,
          customerParts: 0,
        };
      }

      // Data returns as array from table-returning function
      const result = Array.isArray(data) ? data[0] : data;

      return {
        ahsTotal: Number(result?.ahs_total) || 0,
        customerTotal: Number(result?.customer_total) || 0,
        diagnosisFee: Number(result?.diagnosis_fee) || 0,
        ahsLabor: Number(result?.ahs_labor) || 0,
        ahsParts: Number(result?.ahs_parts) || 0,
        customerLabor: Number(result?.customer_labor) || 0,
        customerParts: Number(result?.customer_parts) || 0,
      };
    } catch (error) {
      console.error('Error in getTicketBillingBreakdown:', error);
      return {
        ahsTotal: 0,
        customerTotal: 0,
        diagnosisFee: 0,
        ahsLabor: 0,
        ahsParts: 0,
        customerLabor: 0,
        customerParts: 0,
      };
    }
  }

  /**
   * Create an AHS invoice (for AHS-payer line items only)
   */
  static async createAHSInvoice(
    ticketId: string,
    userId: string
  ): Promise<InvoiceCreateResult> {
    try {
      // Get AHS bill-to customer from settings
      const defaults = await AHSSettingsService.getAHSDefaults();

      if (!defaults.billToCustomerId) {
        return {
          success: false,
          invoiceId: null,
          invoiceNumber: null,
          error: 'AHS Bill-To Customer not configured in settings',
        };
      }

      // Get ticket data
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('id, ticket_number, customer_id, ahs_dispatch_number')
        .eq('id', ticketId)
        .maybeSingle();

      if (ticketError || !ticket) {
        return {
          success: false,
          invoiceId: null,
          invoiceNumber: null,
          error: 'Ticket not found',
        };
      }

      // Get diagnosis fee
      const diagnosisFee = await AHSTicketService.getDiagnosisFee(ticketId);

      // Get AHS-payer estimate line items (if converted from estimate)
      const { data: estimateItems } = await supabase
        .from('estimate_line_items')
        .select(`
          description,
          item_type,
          quantity,
          unit_price,
          line_total,
          part_id,
          payer_type,
          estimate:estimates!inner(ticket_id)
        `)
        .eq('payer_type', 'AHS')
        .eq('estimate.ticket_id', ticketId);

      // Calculate line items
      const lineItems: Omit<TablesInsert<'invoice_line_items'>, 'invoice_id'>[] = [];
      let sortOrder = 0;

      // Add diagnosis fee as first line item
      if (diagnosisFee.exists && diagnosisFee.amount > 0) {
        lineItems.push({
          description: 'AHS Diagnosis Fee',
          item_type: 'service',
          quantity: 1,
          unit_price: diagnosisFee.amount,
          line_total: diagnosisFee.amount,
          payer_type: 'AHS',
          sort_order: sortOrder++,
          ticket_id: ticketId,
        });
      }

      // Add AHS-payer line items from estimate
      if (estimateItems && estimateItems.length > 0) {
        for (const item of estimateItems) {
          const itemType = (item.item_type || 'service') as TablesInsert<'invoice_line_items'>['item_type'];
          lineItems.push({
            description: item.description || 'Line Item',
            item_type: itemType,
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            line_total: item.line_total || 0,
            part_id: item.part_id,
            payer_type: 'AHS',
            sort_order: sortOrder++,
            ticket_id: ticketId,
          });
        }
      }

      if (lineItems.length === 0) {
        return {
          success: false,
          invoiceId: null,
          invoiceNumber: null,
          error: 'No AHS-billable items found',
        };
      }

      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Net 30

      const invoiceData: TablesInsert<'invoices'> = {
        invoice_number: invoiceNumber,
        customer_id: defaults.billToCustomerId,
        source_ticket_id: ticketId,
        subtotal,
        tax_amount: 0,
        total_amount: subtotal,
        status: 'draft',
        notes: `AHS Warranty - Dispatch #${ticket.ahs_dispatch_number || 'N/A'} - Ticket ${ticket.ticket_number}`,
        created_by: userId,
        issue_date: today,
        due_date: dueDate,
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) {
        console.error('Error creating AHS invoice:', invoiceError);
        return {
          success: false,
          invoiceId: null,
          invoiceNumber: null,
          error: `Failed to create invoice: ${invoiceError.message}`,
        };
      }

      // Add invoice_id to line items and insert
      const lineItemsWithInvoice = lineItems.map((item) => ({
        ...item,
        invoice_id: invoice.id,
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsWithInvoice);

      if (lineItemsError) {
        console.error('Error creating invoice line items:', lineItemsError);
        // Clean up the invoice
        await supabase.from('invoices').delete().eq('id', invoice.id);
        return {
          success: false,
          invoiceId: null,
          invoiceNumber: null,
          error: `Failed to create line items: ${lineItemsError.message}`,
        };
      }

      // Log to audit
      await supabase.from('ahs_audit_log').insert({
        entity_type: 'ticket',
        entity_id: ticketId,
        action: 'ahs_invoice_created',
        new_value: { invoiceId: invoice.id, invoiceNumber, total: subtotal },
        performed_by: userId,
      });

      return {
        success: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
      };
    } catch (error) {
      console.error('Error in createAHSInvoice:', error);
      return {
        success: false,
        invoiceId: null,
        invoiceNumber: null,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Create a customer invoice (for customer-payer line items only)
   */
  static async createCustomerInvoice(
    ticketId: string,
    userId: string
  ): Promise<InvoiceCreateResult> {
    try {
      // Get ticket data with customer
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('id, ticket_number, customer_id, ahs_dispatch_number')
        .eq('id', ticketId)
        .maybeSingle();

      if (ticketError || !ticket) {
        return {
          success: false,
          invoiceId: null,
          invoiceNumber: null,
          error: 'Ticket not found',
        };
      }

      // Get customer-payer estimate line items
      const { data: estimateItems } = await supabase
        .from('estimate_line_items')
        .select(`
          description,
          item_type,
          quantity,
          unit_price,
          line_total,
          part_id,
          payer_type,
          estimate:estimates!inner(ticket_id)
        `)
        .eq('payer_type', 'CUSTOMER')
        .eq('estimate.ticket_id', ticketId);

      if (!estimateItems || estimateItems.length === 0) {
        return {
          success: false,
          invoiceId: null,
          invoiceNumber: null,
          error: 'No customer-billable items found',
        };
      }

      // Build line items
      const lineItems: Omit<TablesInsert<'invoice_line_items'>, 'invoice_id'>[] = estimateItems.map((item, index) => {
        const itemType = (item.item_type || 'service') as TablesInsert<'invoice_line_items'>['item_type'];
        return {
          description: item.description || 'Line Item',
          item_type: itemType,
          quantity: item.quantity || 1,
          unit_price: item.unit_price || 0,
          line_total: item.line_total || 0,
          part_id: item.part_id,
          payer_type: 'CUSTOMER' as const,
          sort_order: index,
          ticket_id: ticketId,
        };
      });

      // Calculate totals
      const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Create invoice
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Net 30

      if (!ticket.customer_id) {
        return {
          success: false,
          invoiceId: null,
          invoiceNumber: null,
          error: 'Ticket has no customer assigned',
        };
      }

      const invoiceData: TablesInsert<'invoices'> = {
        invoice_number: invoiceNumber,
        customer_id: ticket.customer_id,
        source_ticket_id: ticketId,
        subtotal,
        tax_amount: 0,
        total_amount: subtotal,
        status: 'draft',
        notes: `Customer responsibility - AHS Warranty Ticket ${ticket.ticket_number}`,
        created_by: userId,
        issue_date: today,
        due_date: dueDate,
      };

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert(invoiceData)
        .select()
        .single();

      if (invoiceError) {
        console.error('Error creating customer invoice:', invoiceError);
        return {
          success: false,
          invoiceId: null,
          invoiceNumber: null,
          error: `Failed to create invoice: ${invoiceError.message}`,
        };
      }

      // Add invoice_id to line items and insert
      const lineItemsWithInvoice = lineItems.map((item) => ({
        ...item,
        invoice_id: invoice.id,
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsWithInvoice);

      if (lineItemsError) {
        console.error('Error creating invoice line items:', lineItemsError);
        await supabase.from('invoices').delete().eq('id', invoice.id);
        return {
          success: false,
          invoiceId: null,
          invoiceNumber: null,
          error: `Failed to create line items: ${lineItemsError.message}`,
        };
      }

      // Log to audit
      await supabase.from('ahs_audit_log').insert({
        entity_type: 'ticket',
        entity_id: ticketId,
        action: 'customer_invoice_created',
        new_value: { invoiceId: invoice.id, invoiceNumber, total: subtotal },
        performed_by: userId,
      });

      return {
        success: true,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
      };
    } catch (error) {
      console.error('Error in createCustomerInvoice:', error);
      return {
        success: false,
        invoiceId: null,
        invoiceNumber: null,
        error: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Get existing invoices for an AHS ticket
   */
  static async getTicketInvoices(
    ticketId: string
  ): Promise<{ ahsInvoices: any[]; customerInvoices: any[] }> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select(`
          id,
          invoice_number,
          customer_id,
          total_amount,
          status,
          created_at
        `)
        .or(`ticket_id.eq.${ticketId},source_ticket_id.eq.${ticketId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching ticket invoices:', error);
        return { ahsInvoices: [], customerInvoices: [] };
      }

      // Get AHS bill-to customer ID
      const defaults = await AHSSettingsService.getAHSDefaults();

      const ahsInvoices: any[] = [];
      const customerInvoices: any[] = [];

      for (const invoice of invoices || []) {
        if (defaults.billToCustomerId && invoice.customer_id === defaults.billToCustomerId) {
          ahsInvoices.push(invoice);
        } else {
          customerInvoices.push(invoice);
        }
      }

      return { ahsInvoices, customerInvoices };
    } catch (error) {
      console.error('Error in getTicketInvoices:', error);
      return { ahsInvoices: [], customerInvoices: [] };
    }
  }

  /**
   * Generate a unique invoice number using database sequence (race-condition safe)
   */
  private static async generateInvoiceNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_invoice_number');

    if (error) {
      console.error('Error generating invoice number:', error);
      throw new Error(`Failed to generate invoice number: ${error.message}`);
    }

    return data as string;
  }
}
