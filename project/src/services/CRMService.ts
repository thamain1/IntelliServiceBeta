/**
 * CRM Service
 * Handles customer interactions, deal pipelines, and sales tracking
 */

import { supabase } from '../lib/supabase';
import { Tables, Views } from '../lib/dbTypes';

// Types - allow nulls to match DB schema
export interface DealPipeline {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  stages?: DealStage[];
}

export interface DealStage {
  id: string;
  pipeline_id: string;
  name: string;
  description: string | null;
  probability: number | null;
  sort_order: number | null;
  is_won: boolean | null;
  is_lost: boolean | null;
  color: string | null;
  created_at: string | null;
}

export interface CustomerInteraction {
  id: string;
  customer_id: string;
  interaction_type: string | null;
  direction: string | null;
  subject: string | null;
  notes: string | null;
  duration_minutes: number | null;
  outcome: string | null;
  follow_up_date: string | null;
  related_ticket_id: string | null;
  related_estimate_id: string | null;
  created_by: string | null;
  created_at: string | null;
  creator?: { full_name: string } | null;
}

export interface CustomerTimelineEvent {
  customer_id: string | null;
  customer_name: string | null;
  event_type: string | null;
  event_id: string | null;
  event_subtype: string | null;
  event_title: string | null;
  event_description: string | null;
  event_date: string | null;
  created_by_name: string | null;
}

export interface Lead {
  id: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  lead_source: string | null;
  created_at: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  interaction_count: number | null;
  last_interaction: string | null;
  estimate_count: number | null;
  pending_estimate_value: number | null;
}

export interface SalesPipelineItem {
  estimate_id: string | null;
  estimate_number: string | null;
  title: string | null;
  total_amount: number | null;
  status: string | null;
  deal_stage_id: string | null;
  stage_name: string | null;
  probability: number | null;
  stage_order: number | null;
  pipeline_name: string | null;
  expected_close_date: string | null;
  days_in_stage: number | null;
  stage_entered_at: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Customer360 {
  customer: Tables<'customers'>;
  stats: {
    total_tickets: number;
    open_tickets: number;
    total_estimates: number;
    pending_estimates: number;
    total_revenue: number;
    lifetime_value: number;
    avg_ticket_value: number;
    last_service_date?: string | null;
  };
  timeline: CustomerTimelineEvent[];
  equipment: Tables<'equipment'>[];
}

export type InteractionType = 'call' | 'email' | 'sms' | 'meeting' | 'note' | 'site_visit';

/** Customer with equipment for prospect queries */
export type CustomerWithEquipment = Tables<'customers'> & {
  equipment: Pick<Tables<'equipment'>, 'id' | 'manufacturer' | 'model_number' | 'installation_date' | 'equipment_type'>[];
};

export interface CreateInteractionInput {
  customer_id: string;
  interaction_type: InteractionType;
  direction?: 'inbound' | 'outbound';
  subject?: string;
  notes?: string;
  duration_minutes?: number;
  outcome?: string;
  follow_up_date?: string;
  related_ticket_id?: string;
  related_estimate_id?: string;
}

export class CRMService {
  // ========== Pipeline Operations ==========

  /**
   * Get all deal pipelines with their stages
   */
  static async getPipelines(): Promise<DealPipeline[]> {
    const { data, error } = await supabase
      .from('deal_pipelines')
      .select(`
        *,
        stages:deal_stages(*)
      `)
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw error;

    // Sort stages within each pipeline
    return (data || []).map(pipeline => ({
      ...pipeline,
      stages: (pipeline.stages || []).sort((a: DealStage, b: DealStage) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    }));
  }

  /**
   * Get a single pipeline by ID
   */
  static async getPipelineById(pipelineId: string): Promise<DealPipeline | null> {
    const { data, error } = await supabase
      .from('deal_pipelines')
      .select(`
        *,
        stages:deal_stages(*)
      `)
      .eq('id', pipelineId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get default pipeline
   */
  static async getDefaultPipeline(): Promise<DealPipeline | null> {
    const { data, error } = await supabase
      .from('deal_pipelines')
      .select(`
        *,
        stages:deal_stages(*)
      `)
      .eq('is_default', true)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  // ========== Sales Pipeline Operations ==========

  /**
   * Get sales pipeline view (estimates grouped by stage)
   */
  static async getSalesPipeline(pipelineId?: string): Promise<SalesPipelineItem[]> {
    let query = supabase
      .from('vw_sales_pipeline')
      .select('*')
      .order('stage_order')
      .order('updated_at', { ascending: false });

    if (pipelineId) {
      // Filter by pipeline - need to join through stages
      const pipeline = await this.getPipelineById(pipelineId);
      if (pipeline?.stages) {
        const stageIds = pipeline.stages.map(s => s.id);
        query = query.in('deal_stage_id', stageIds);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Move estimate to a different stage
   */
  static async moveEstimateToStage(estimateId: string, stageId: string): Promise<void> {
    const { error } = await supabase
      .from('estimates')
      .update({
        deal_stage_id: stageId,
        stage_entered_at: new Date().toISOString(),
        days_in_stage: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', estimateId);

    if (error) throw error;
  }

  /**
   * Add estimate to pipeline
   */
  static async addEstimateToPipeline(estimateId: string, stageId: string, expectedCloseDate?: string): Promise<void> {
    const { error } = await supabase
      .from('estimates')
      .update({
        deal_stage_id: stageId,
        stage_entered_at: new Date().toISOString(),
        expected_close_date: expectedCloseDate,
        days_in_stage: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', estimateId);

    if (error) throw error;
  }

  /**
   * Mark estimate as lost
   */
  static async markEstimateLost(estimateId: string, reason: string, lostStageId: string): Promise<void> {
    const { error } = await supabase
      .from('estimates')
      .update({
        deal_stage_id: lostStageId,
        lost_reason: reason,
        status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', estimateId);

    if (error) throw error;
  }

  // ========== Customer Interaction Operations ==========

  /**
   * Get interactions for a customer
   */
  static async getCustomerInteractions(customerId: string): Promise<CustomerInteraction[]> {
    const { data, error } = await supabase
      .from('customer_interactions')
      .select(`
        *,
        creator:profiles!created_by(full_name)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Create a new interaction
   */
  static async createInteraction(input: CreateInteractionInput): Promise<CustomerInteraction> {
    const { data, error } = await supabase
      .from('customer_interactions')
      .insert({
        ...input,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get upcoming follow-ups
   */
  static async getUpcomingFollowUps(days: number = 7): Promise<CustomerInteraction[]> {
    const today = new Date().toISOString().split('T')[0];
    const futureDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('customer_interactions')
      .select(`
        *,
        creator:profiles!created_by(full_name)
      `)
      .gte('follow_up_date', today)
      .lte('follow_up_date', futureDate)
      .order('follow_up_date');

    if (error) throw error;
    return data || [];
  }

  // ========== Customer Timeline Operations ==========

  /**
   * Get customer timeline (360 view)
   */
  static async getCustomerTimeline(customerId: string, limit: number = 50): Promise<CustomerTimelineEvent[]> {
    const { data, error } = await supabase
      .from('vw_customer_timeline')
      .select('*')
      .eq('customer_id', customerId)
      .order('event_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get full Customer 360 data
   */
  static async getCustomer360(customerId: string): Promise<Customer360> {
    // Get customer details
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (customerError) throw customerError;

    // Get timeline
    const timeline = await this.getCustomerTimeline(customerId);

    // Get equipment
    const { data: equipment } = await supabase
      .from('equipment')
      .select('*')
      .eq('customer_id', customerId)
      .eq('is_active', true);

    // Get stats
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, status, billed_amount, completed_at')
      .eq('customer_id', customerId);

    const { data: estimates } = await supabase
      .from('estimates')
      .select('id, status, total_amount')
      .eq('customer_id', customerId);

    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount, status')
      .eq('customer_id', customerId)
      .eq('status', 'paid');

    const ticketList = tickets || [];
    const estimateList = estimates || [];
    const invoiceList = invoices || [];

    const completedTickets = ticketList.filter(t => t.status === 'completed');
    const lastService = completedTickets.length > 0
      ? completedTickets.sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]
      : null;

    const stats = {
      total_tickets: ticketList.length,
      open_tickets: ticketList.filter(t => !['completed', 'cancelled'].includes(t.status || '')).length,
      total_estimates: estimateList.length,
      pending_estimates: estimateList.filter(e => e.status === 'sent').length,
      total_revenue: invoiceList.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
      lifetime_value: invoiceList.reduce((sum, inv) => sum + (inv.total_amount || 0), 0),
      avg_ticket_value: completedTickets.length > 0
        ? completedTickets.reduce((sum, t) => sum + (t.billed_amount || 0), 0) / completedTickets.length
        : 0,
      last_service_date: lastService?.completed_at
    };

    return {
      customer,
      stats,
      timeline,
      equipment: equipment || []
    };
  }

  // ========== Leads Operations ==========

  /**
   * Get leads inbox
   */
  static async getLeadsInbox(): Promise<Lead[]> {
    const { data, error } = await supabase
      .from('vw_leads_inbox')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Convert lead to active customer
   */
  static async convertLead(customerId: string): Promise<void> {
    const { error } = await supabase
      .from('customers')
      .update({
        status: 'active',
        converted_at: new Date().toISOString()
      })
      .eq('id', customerId);

    if (error) throw error;
  }

  /**
   * Create new lead
   */
  static async createLead(input: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    lead_source?: string;
  }): Promise<Tables<'customers'>> {
    // Map postal_code to zip_code for database
    const { postal_code, ...rest } = input;
    const { data, error } = await supabase
      .from('customers')
      .insert({
        ...rest,
        zip_code: postal_code,
        status: 'lead'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // ========== Sales Opportunities ==========

  /**
   * Get flagged sales opportunities
   */
  static async getSalesOpportunities(): Promise<Views<'vw_sales_opportunities'>[]> {
    const { data, error } = await supabase
      .from('vw_sales_opportunities')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get prospects (customers flagged for replacement)
   */
  static async getProspects(): Promise<CustomerWithEquipment[]> {
    const { data, error } = await supabase
      .from('customers')
      .select(`
        *,
        equipment:equipment(id, manufacturer, model_number, installation_date, equipment_type)
      `)
      .eq('prospect_replacement_flag', true)
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return (data || []) as unknown as CustomerWithEquipment[];
  }
}
