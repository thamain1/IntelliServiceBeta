import { supabase } from '../lib/supabase';
import { AHSSettingsService } from './AHSSettingsService';

export interface AHSTicketData {
  id: string;
  dispatchNumber: string | null;
  portalSubmissionDate: string | null;
  authorizationDate: string | null;
  coveredAmount: number | null;
  diagnosisFeeAmount: number | null;
  laborRatePerHour: number | null;
  ticketType: string;
  status: string;
}

export interface DiagnosisFeeResult {
  success: boolean;
  alreadyExists: boolean;
  feeId: string | null;
  amount: number;
}

export interface AHSAuditEntry {
  id: string;
  action: string;
  oldValue: any;
  newValue: any;
  performedBy: string;
  performedAt: string;
  notes: string | null;
}

export class AHSTicketService {
  /**
   * Initialize an AHS ticket with default rates from settings
   */
  static async initializeAHSTicket(
    ticketId: string,
    dispatchNumber: string
  ): Promise<void> {
    try {
      // Get default AHS settings
      const defaults = await AHSSettingsService.getAHSDefaults();

      // Update ticket with AHS fields
      const { error } = await supabase
        .from('tickets')
        .update({
          ticket_type: 'WARRANTY_AHS',
          ahs_dispatch_number: dispatchNumber,
          ahs_diagnosis_fee_amount: defaults.diagnosisFee,
          ahs_labor_rate_per_hour: defaults.laborRate,
        })
        .eq('id', ticketId);

      if (error) {
        console.error('Error initializing AHS ticket:', error);
        throw new Error(`Failed to initialize AHS ticket: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in initializeAHSTicket:', error);
      throw error;
    }
  }

  /**
   * Get AHS-specific data for a ticket
   */
  static async getAHSTicketData(ticketId: string): Promise<AHSTicketData | null> {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          id,
          ticket_type,
          status,
          ahs_dispatch_number,
          ahs_portal_submission_date,
          ahs_authorization_date,
          ahs_covered_amount,
          ahs_diagnosis_fee_amount,
          ahs_labor_rate_per_hour
        `)
        .eq('id', ticketId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching AHS ticket data:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        dispatchNumber: data.ahs_dispatch_number,
        portalSubmissionDate: data.ahs_portal_submission_date,
        authorizationDate: data.ahs_authorization_date,
        coveredAmount: data.ahs_covered_amount,
        diagnosisFeeAmount: data.ahs_diagnosis_fee_amount,
        laborRatePerHour: data.ahs_labor_rate_per_hour,
        ticketType: data.ticket_type || '',
        status: data.status || '',
      };
    } catch (error) {
      console.error('Error in getAHSTicketData:', error);
      return null;
    }
  }

  /**
   * Add diagnosis fee (idempotent - uses database function)
   */
  static async addDiagnosisFee(
    ticketId: string,
    userId: string
  ): Promise<DiagnosisFeeResult> {
    try {
      const { data, error } = await supabase.rpc('fn_add_ahs_diagnosis_fee', {
        p_ticket_id: ticketId,
        p_user_id: userId,
      });

      if (error) {
        console.error('Error adding diagnosis fee:', error);
        throw new Error(`Failed to add diagnosis fee: ${error.message}`);
      }

      // Data returns as array from table-returning function
      const result = Array.isArray(data) ? data[0] : data;

      // Get the fee amount
      let amount = 0;
      if (result?.fee_id) {
        const { data: feeData } = await supabase
          .from('ticket_fees')
          .select('amount')
          .eq('id', result.fee_id)
          .maybeSingle();
        amount = feeData?.amount || 0;
      }

      return {
        success: result?.success || false,
        alreadyExists: result?.already_exists || false,
        feeId: result?.fee_id || null,
        amount,
      };
    } catch (error) {
      console.error('Error in addDiagnosisFee:', error);
      throw error;
    }
  }

  /**
   * Submit ticket to AHS portal
   */
  static async submitToAHSPortal(ticketId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('fn_submit_to_ahs_portal', {
        p_ticket_id: ticketId,
        p_user_id: userId,
      });

      if (error) {
        console.error('Error submitting to AHS portal:', error);
        throw new Error(`Failed to submit to AHS portal: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in submitToAHSPortal:', error);
      throw error;
    }
  }

  /**
   * Record AHS authorization
   */
  static async recordAHSAuthorization(
    ticketId: string,
    coveredAmount: number,
    userId: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('fn_record_ahs_authorization', {
        p_ticket_id: ticketId,
        p_covered_amount: coveredAmount,
        p_user_id: userId,
      });

      if (error) {
        console.error('Error recording AHS authorization:', error);
        throw new Error(`Failed to record authorization: ${error.message}`);
      }
    } catch (error) {
      console.error('Error in recordAHSAuthorization:', error);
      throw error;
    }
  }

  /**
   * Update AHS ticket rates (diagnosis fee and/or labor rate)
   */
  static async updateAHSTicketRates(
    ticketId: string,
    updates: {
      diagnosisFee?: number;
      laborRate?: number;
    },
    userId: string
  ): Promise<void> {
    try {
      // Get current values for audit log
      const { data: currentData } = await supabase
        .from('tickets')
        .select('ahs_diagnosis_fee_amount, ahs_labor_rate_per_hour')
        .eq('id', ticketId)
        .maybeSingle();

      const updateFields: any = {};
      if (updates.diagnosisFee !== undefined) {
        updateFields.ahs_diagnosis_fee_amount = updates.diagnosisFee;
      }
      if (updates.laborRate !== undefined) {
        updateFields.ahs_labor_rate_per_hour = updates.laborRate;
      }

      if (Object.keys(updateFields).length === 0) {
        return;
      }

      const { error } = await supabase
        .from('tickets')
        .update(updateFields)
        .eq('id', ticketId);

      if (error) {
        console.error('Error updating AHS ticket rates:', error);
        throw new Error(`Failed to update rates: ${error.message}`);
      }

      // Log to audit
      await supabase.from('ahs_audit_log').insert({
        entity_type: 'ticket',
        entity_id: ticketId,
        action: 'rates_updated',
        old_value: {
          diagnosisFee: currentData?.ahs_diagnosis_fee_amount,
          laborRate: currentData?.ahs_labor_rate_per_hour,
        },
        new_value: updates,
        performed_by: userId,
      });
    } catch (error) {
      console.error('Error in updateAHSTicketRates:', error);
      throw error;
    }
  }

  /**
   * Get diagnosis fee for a ticket
   */
  static async getDiagnosisFee(
    ticketId: string
  ): Promise<{ exists: boolean; amount: number; feeId: string | null }> {
    try {
      const { data, error } = await supabase
        .from('ticket_fees')
        .select('id, amount')
        .eq('ticket_id', ticketId)
        .eq('fee_type', 'ahs_diagnosis')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching diagnosis fee:', error);
      }

      return {
        exists: !!data,
        amount: data?.amount || 0,
        feeId: data?.id || null,
      };
    } catch (error) {
      console.error('Error in getDiagnosisFee:', error);
      return { exists: false, amount: 0, feeId: null };
    }
  }

  /**
   * Get AHS audit log for a ticket
   */
  static async getTicketAuditLog(ticketId: string): Promise<AHSAuditEntry[]> {
    try {
      const { data, error } = await supabase
        .from('ahs_audit_log')
        .select(`
          id,
          action,
          old_value,
          new_value,
          performed_at,
          notes,
          performer:profiles!ahs_audit_log_performed_by_fkey(full_name)
        `)
        .eq('entity_type', 'ticket')
        .eq('entity_id', ticketId)
        .order('performed_at', { ascending: false });

      if (error) {
        console.error('Error fetching ticket audit log:', error);
        return [];
      }

      return (data || []).map((entry) => ({
        id: entry.id,
        action: entry.action,
        oldValue: entry.old_value,
        newValue: entry.new_value,
        performedBy: (entry.performer as any)?.full_name || 'Unknown',
        performedAt: entry.performed_at,
        notes: entry.notes,
      }));
    } catch (error) {
      console.error('Error in getTicketAuditLog:', error);
      return [];
    }
  }

  /**
   * Check if a ticket is an AHS warranty ticket
   */
  static isAHSTicket(ticketType: string | null): boolean {
    return ticketType === 'WARRANTY_AHS';
  }

  /**
   * Get formatted status display for AHS workflow
   */
  static getAHSStatusDisplay(status: string): {
    label: string;
    color: string;
    description: string;
  } {
    switch (status) {
      case 'awaiting_ahs_authorization':
        return {
          label: 'Awaiting AHS Authorization',
          color: 'yellow',
          description: 'Submitted to AHS portal, waiting for authorization',
        };
      default:
        return {
          label: status,
          color: 'gray',
          description: '',
        };
    }
  }

  /**
   * Get action name for audit log display
   */
  static getActionDisplayName(action: string): string {
    switch (action) {
      case 'diagnosis_fee_added':
        return 'Diagnosis Fee Added';
      case 'portal_submitted':
        return 'Submitted to AHS Portal';
      case 'authorization_received':
        return 'AHS Authorization Received';
      case 'rates_updated':
        return 'Rates Updated';
      default:
        return action;
    }
  }
}
