import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SendEstimateNotificationRequest {
  estimate_id: string;
  decision: 'accepted' | 'rejected';
  decided_name?: string;
  send_email?: boolean;
}

interface BillingBreakdown {
  ahsTotal: number;
  customerTotal: number;
  total: number;
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

    const requestData: SendEstimateNotificationRequest = await req.json();
    const { estimate_id, decision, decided_name, send_email = true } = requestData;

    if (!estimate_id || !decision) {
      return new Response(
        JSON.stringify({ error: 'estimate_id and decision are required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!['accepted', 'rejected'].includes(decision)) {
      return new Response(
        JSON.stringify({ error: 'Decision must be "accepted" or "rejected"' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get estimate with customer and ticket details
    const { data: estimate, error: estimateError } = await supabase
      .from('estimates')
      .select(`
        *,
        customers(id, name, email, phone, address),
        tickets(
          id,
          ticket_number,
          ticket_type,
          ahs_dispatch_number,
          ahs_covered_amount,
          ahs_diagnosis_fee_amount
        )
      `)
      .eq('id', estimate_id)
      .single();

    if (estimateError || !estimate) {
      return new Response(
        JSON.stringify({ error: 'Estimate not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const isAHSTicket = estimate.tickets?.ticket_type === 'WARRANTY_AHS';
    let billingBreakdown: BillingBreakdown | null = null;

    // Calculate AHS billing breakdown if this is an AHS ticket
    if (isAHSTicket && estimate.tickets) {
      // Get line items with payer types
      const { data: lineItems } = await supabase
        .from('estimate_line_items')
        .select('*')
        .eq('estimate_id', estimate_id);

      if (lineItems) {
        const ahsTotal = lineItems
          .filter(item => item.payer_type === 'AHS')
          .reduce((sum, item) => sum + (item.total || 0), 0);

        const customerTotal = lineItems
          .filter(item => item.payer_type === 'CUSTOMER' || !item.payer_type)
          .reduce((sum, item) => sum + (item.total || 0), 0);

        billingBreakdown = {
          ahsTotal: ahsTotal + (estimate.tickets.ahs_diagnosis_fee_amount || 0),
          customerTotal,
          total: estimate.total_amount || 0,
        };
      }
    }

    // Get all dispatch and admin users for notifications
    const { data: staffUsers, error: staffError } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('role', ['admin', 'dispatcher']);

    if (staffError) {
      console.error('Error fetching staff users:', staffError);
    }

    const notificationResults = {
      inApp: { created: 0, failed: 0 },
      email: { sent: 0, failed: 0 },
    };

    // Create notification content
    const notificationTitle = decision === 'accepted'
      ? `Estimate ${estimate.estimate_number} Accepted`
      : `Estimate ${estimate.estimate_number} Declined`;

    let notificationMessage = '';
    if (decision === 'accepted') {
      notificationMessage = `${estimate.customers?.name || 'Customer'} has accepted estimate ${estimate.estimate_number}`;
      if (estimate.tickets) {
        notificationMessage += ` for Ticket #${estimate.tickets.ticket_number}`;
      }
      notificationMessage += `. Total: $${estimate.total_amount?.toFixed(2) || '0.00'}`;

      if (isAHSTicket && billingBreakdown) {
        notificationMessage += ` (AHS: $${billingBreakdown.ahsTotal.toFixed(2)}, Customer: $${billingBreakdown.customerTotal.toFixed(2)})`;
      }
    } else {
      notificationMessage = `${estimate.customers?.name || 'Customer'} has declined estimate ${estimate.estimate_number}`;
      if (estimate.tickets) {
        notificationMessage += ` for Ticket #${estimate.tickets.ticket_number}`;
      }
    }

    // Create in-app notifications for each staff user
    if (staffUsers && staffUsers.length > 0) {
      const notifications = staffUsers.map(user => ({
        user_id: user.id,
        notification_type: decision === 'accepted' ? 'estimate_accepted' : 'estimate_declined',
        title: notificationTitle,
        message: notificationMessage,
        metadata: {
          estimate_id: estimate.id,
          estimate_number: estimate.estimate_number,
          customer_id: estimate.customer_id,
          customer_name: estimate.customers?.name,
          ticket_id: estimate.ticket_id,
          ticket_number: estimate.tickets?.ticket_number,
          total_amount: estimate.total_amount,
          is_ahs_ticket: isAHSTicket,
          ahs_covered_amount: billingBreakdown?.ahsTotal,
          customer_responsibility: billingBreakdown?.customerTotal,
          decided_name: decided_name,
          decision,
        },
      }));

      const { data: insertedNotifications, error: notifError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (notifError) {
        console.error('Error creating notifications:', notifError);
        notificationResults.inApp.failed = notifications.length;
      } else {
        notificationResults.inApp.created = insertedNotifications?.length || 0;
      }
    }

    // Send email notifications if enabled
    if (send_email && staffUsers && staffUsers.length > 0) {
      const emailRecipients = staffUsers
        .filter(user => user.email)
        .map(user => user.email);

      if (emailRecipients.length > 0) {
        const emailSubject = notificationTitle;
        let emailBody = `
Hello,

${notificationMessage}

Estimate Details:
- Estimate Number: ${estimate.estimate_number}
- Job Title: ${estimate.job_title || 'N/A'}
- Customer: ${estimate.customers?.name || 'Unknown'}
- Total Amount: $${estimate.total_amount?.toFixed(2) || '0.00'}
`;

        if (estimate.tickets) {
          emailBody += `- Ticket: #${estimate.tickets.ticket_number}\n`;
        }

        if (isAHSTicket && billingBreakdown) {
          emailBody += `
AHS Warranty Breakdown:
- AHS Covered: $${billingBreakdown.ahsTotal.toFixed(2)}
- Customer Responsibility: $${billingBreakdown.customerTotal.toFixed(2)}
`;
          if (estimate.tickets?.ahs_dispatch_number) {
            emailBody += `- AHS Dispatch #: ${estimate.tickets.ahs_dispatch_number}\n`;
          }
        }

        if (decided_name) {
          emailBody += `\nDecision made by: ${decided_name}\n`;
        }

        emailBody += `
---
This is an automated notification from IntelliService.
        `;

        // Log email notification (simulated - actual email integration would go here)
        console.log('Email notification would be sent to:', emailRecipients);
        console.log('Subject:', emailSubject);
        console.log('Body:', emailBody);

        // Log email attempts
        for (const email of emailRecipients) {
          const { error: emailLogError } = await supabase
            .from('ahs_audit_log')
            .insert({
              entity_type: 'estimate',
              entity_id: estimate.id,
              action: 'notification_email_sent',
              new_value: {
                to: email,
                subject: emailSubject,
                decision,
                estimate_number: estimate.estimate_number,
              },
              notes: `Email notification sent to ${email} for estimate ${decision}`,
            });

          if (emailLogError) {
            console.error('Error logging email:', emailLogError);
            notificationResults.email.failed++;
          } else {
            notificationResults.email.sent++;
          }
        }
      }
    }

    // Log the notification event in AHS audit log
    await supabase
      .from('ahs_audit_log')
      .insert({
        entity_type: 'estimate',
        entity_id: estimate.id,
        action: decision === 'accepted' ? 'estimate_accepted_notification' : 'estimate_declined_notification',
        new_value: {
          estimate_number: estimate.estimate_number,
          customer_name: estimate.customers?.name,
          ticket_number: estimate.tickets?.ticket_number,
          total_amount: estimate.total_amount,
          is_ahs_ticket: isAHSTicket,
          billing_breakdown: billingBreakdown,
          decided_name,
          notifications_created: notificationResults.inApp.created,
          emails_sent: notificationResults.email.sent,
        },
        notes: `Notifications sent for estimate ${decision}`,
      });

    return new Response(
      JSON.stringify({
        success: true,
        estimate_id: estimate.id,
        estimate_number: estimate.estimate_number,
        decision,
        is_ahs_ticket: isAHSTicket,
        billing_breakdown: billingBreakdown,
        notification_results: notificationResults,
        message: `Notifications sent for ${decision} estimate`,
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
