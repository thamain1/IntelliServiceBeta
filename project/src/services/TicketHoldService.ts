import { supabase } from '../lib/supabase';
import type { Json } from '../lib/database.types';

export interface HoldForPartsPayload {
  ticketId: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  notes: string;
  summary?: string;
  parts: Array<{
    part_id: string;
    quantity: number;
    notes?: string;
    preferred_source_location_id?: string;
  }>;
}

export interface ReportIssuePayload {
  ticketId: string;
  category: 'equipment_failure' | 'access_denied' | 'safety_concern' | 'scope_change' | 'customer_unavailable' | 'technical_limitation' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  summary?: string;
  metadata?: { [key: string]: Json | undefined };
}

export interface HoldResponse {
  success: boolean;
  hold_id?: string;
  request_id?: string;
  report_id?: string;
  time_entry_stopped?: boolean;
  message?: string;
  error?: string;
}

/**
 * Hold ticket for parts request
 * Atomically stops timer, creates hold, and requests parts
 */
export async function holdTicketForParts(payload: HoldForPartsPayload): Promise<HoldResponse> {
  try {
    const { data, error } = await supabase.rpc('fn_ticket_hold_for_parts', {
      p_ticket_id: payload.ticketId,
      p_urgency: payload.urgency,
      p_notes: payload.notes,
      p_summary: payload.summary || 'Waiting for parts',
      p_parts: payload.parts,
    });

    if (error) {
      console.error('Error holding ticket for parts:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as unknown as HoldResponse;
  } catch (error) {
    console.error('Exception holding ticket for parts:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Report issue on ticket
 * Atomically stops timer, creates hold, and reports issue
 */
export async function reportTicketIssue(payload: ReportIssuePayload): Promise<HoldResponse> {
  try {
    const { data, error } = await supabase.rpc('fn_ticket_report_issue', {
      p_ticket_id: payload.ticketId,
      p_category: payload.category,
      p_severity: payload.severity,
      p_description: payload.description,
      p_summary: payload.summary || `Issue reported - ${payload.category}`,
      p_metadata: payload.metadata || {},
    });

    if (error) {
      console.error('Error reporting ticket issue:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as unknown as HoldResponse;
  } catch (error) {
    console.error('Exception reporting ticket issue:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Resume ticket from hold
 * Only admins and dispatchers can resume
 */
export async function resumeTicket(ticketId: string, resolutionNotes?: string): Promise<HoldResponse> {
  try {
    const { data, error } = await supabase.rpc('fn_ticket_resume', {
      p_ticket_id: ticketId,
      p_resolution_notes: resolutionNotes ?? undefined,
    });

    if (error) {
      console.error('Error resuming ticket:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    return data as unknown as HoldResponse;
  } catch (error) {
    console.error('Exception resuming ticket:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get hold metrics for dashboard
 */
export async function getHoldMetrics() {
  try {
    const { data, error } = await supabase
      .from('vw_dashboard_hold_metrics')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching hold metrics:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception fetching hold metrics:', error);
    return null;
  }
}

/**
 * Get tickets on hold for parts
 */
export async function getTicketsOnHoldForParts() {
  try {
    const { data, error } = await supabase
      .from('vw_tickets_on_hold_parts')
      .select('*')
      .order('hold_started_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets on hold for parts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching tickets on hold for parts:', error);
    return [];
  }
}

/**
 * Get tickets on hold with issues
 */
export async function getTicketsOnHoldForIssue() {
  try {
    const { data, error } = await supabase
      .from('vw_tickets_on_hold_issue')
      .select('*')
      .order('hold_started_at', { ascending: false });

    if (error) {
      console.error('Error fetching tickets on hold for issue:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception fetching tickets on hold for issue:', error);
    return [];
  }
}
