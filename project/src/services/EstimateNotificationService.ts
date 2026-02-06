import { supabase } from '../lib/supabase';
import { NotificationService } from './NotificationService';
import { AHSTicketService } from './AHSTicketService';
import { AHSInvoiceService } from './AHSInvoiceService';

export interface EstimateAcceptanceDetails {
  estimateId: string;
  estimateNumber: string;
  ticketId: string | null;
  ticketNumber: string | null;
  customerName: string;
  total: number;
  acceptedAt: string;
  acceptedBy: string | null;
  isAHSTicket: boolean;
  ahsCoveredAmount: number | null;
  customerResponsibility: number | null;
}

export class EstimateNotificationService {
  /**
   * Handle estimate acceptance - creates notifications and optionally sends email
   */
  static async onEstimateAccepted(
    estimateId: string,
    acceptedBy?: string
  ): Promise<void> {
    try {
      // Get estimate details
      const details = await this.getEstimateDetails(estimateId);

      if (!details) {
        console.error('Could not find estimate details for notification');
        return;
      }

      // Calculate AHS split if applicable
      let ahsCoveredAmount: number | null = null;
      let customerResponsibility: number | null = null;

      if (details.isAHSTicket && details.ticketId) {
        const breakdown = await AHSInvoiceService.getTicketBillingBreakdown(
          details.ticketId
        );

        // If we don't have invoice data yet, calculate from estimate
        if (breakdown.ahsTotal === 0 && breakdown.customerTotal === 0) {
          const ahsTicketData = await AHSTicketService.getAHSTicketData(
            details.ticketId
          );
          ahsCoveredAmount = ahsTicketData?.coveredAmount || 0;
          customerResponsibility = Math.max(0, details.total - (ahsCoveredAmount || 0));
        } else {
          ahsCoveredAmount = breakdown.ahsTotal;
          customerResponsibility = breakdown.customerTotal;
        }
      }

      // Build notification message
      const message = this.buildNotificationMessage({
        ...details,
        ahsCoveredAmount,
        customerResponsibility,
      });

      // Create notification for dispatch/admin users
      await NotificationService.broadcastToRoles(['admin', 'dispatcher'], {
        notificationType: 'estimate_accepted',
        title: `Estimate ${details.estimateNumber} Accepted`,
        message,
        metadata: {
          estimateId,
          estimateNumber: details.estimateNumber,
          ticketId: details.ticketId,
          ticketNumber: details.ticketNumber,
          customerName: details.customerName,
          total: details.total,
          isAHSTicket: details.isAHSTicket,
          ahsCoveredAmount,
          customerResponsibility,
        },
      });

      // Log the notification
      console.log(
        `Estimate acceptance notification sent for ${details.estimateNumber}`
      );
    } catch (error) {
      console.error('Error in onEstimateAccepted:', error);
    }
  }

  /**
   * Handle estimate decline
   */
  static async onEstimateDeclined(
    estimateId: string,
    declinedBy?: string,
    reason?: string
  ): Promise<void> {
    try {
      const details = await this.getEstimateDetails(estimateId);

      if (!details) {
        console.error('Could not find estimate details for decline notification');
        return;
      }

      const message = reason
        ? `Estimate ${details.estimateNumber} for ${details.customerName} was declined. Reason: ${reason}`
        : `Estimate ${details.estimateNumber} for ${details.customerName} was declined.`;

      await NotificationService.broadcastToRoles(['admin', 'dispatcher'], {
        notificationType: 'estimate_declined',
        title: `Estimate ${details.estimateNumber} Declined`,
        message,
        metadata: {
          estimateId,
          estimateNumber: details.estimateNumber,
          ticketId: details.ticketId,
          customerName: details.customerName,
          total: details.total,
          reason,
        },
      });
    } catch (error) {
      console.error('Error in onEstimateDeclined:', error);
    }
  }

  /**
   * Get estimate details for notification
   */
  private static async getEstimateDetails(
    estimateId: string
  ): Promise<EstimateAcceptanceDetails | null> {
    try {
      const { data, error } = await supabase
        .from('estimates')
        .select(`
          id,
          estimate_number,
          total,
          accepted_at,
          decision_by,
          ticket_id,
          customer:customers(company_name),
          ticket:tickets(ticket_number, ticket_type)
        `)
        .eq('id', estimateId)
        .maybeSingle();

      if (error || !data) {
        console.error('Error fetching estimate details:', error);
        return null;
      }

      const customer = data.customer as any;
      const ticket = data.ticket as any;

      return {
        estimateId: data.id,
        estimateNumber: data.estimate_number,
        ticketId: data.ticket_id,
        ticketNumber: ticket?.ticket_number || null,
        customerName: customer?.company_name || 'Unknown Customer',
        total: data.total || 0,
        acceptedAt: data.accepted_at || new Date().toISOString(),
        acceptedBy: data.decision_by,
        isAHSTicket: AHSTicketService.isAHSTicket(ticket?.ticket_type),
        ahsCoveredAmount: null,
        customerResponsibility: null,
      };
    } catch (error) {
      console.error('Error in getEstimateDetails:', error);
      return null;
    }
  }

  /**
   * Build notification message for estimate acceptance
   */
  private static buildNotificationMessage(
    details: EstimateAcceptanceDetails
  ): string {
    const parts: string[] = [];

    parts.push(`Customer: ${details.customerName}`);

    if (details.ticketNumber) {
      parts.push(`Ticket: ${details.ticketNumber}`);
    }

    parts.push(`Total: $${details.total.toFixed(2)}`);

    if (details.isAHSTicket && details.ahsCoveredAmount !== null) {
      parts.push(`AHS Covered: $${details.ahsCoveredAmount.toFixed(2)}`);
      if (details.customerResponsibility !== null) {
        parts.push(
          `Customer Responsibility: $${details.customerResponsibility.toFixed(2)}`
        );
      }
    }

    return parts.join(' | ');
  }

  /**
   * Subscribe to estimate acceptance events (for realtime updates)
   * Returns unsubscribe function
   */
  static subscribeToEstimateAcceptance(
    callback: (details: EstimateAcceptanceDetails) => void
  ): () => void {
    const subscription = supabase
      .channel('estimate-acceptance')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'estimates',
          filter: 'status=eq.accepted',
        },
        async (payload) => {
          if (payload.new && payload.new.id) {
            const details = await this.getEstimateDetails(payload.new.id);
            if (details) {
              callback(details);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
}
