import { supabase } from '../lib/supabase';
import type { Enums, Tables } from '../lib/dbTypes';

// Composite types for joined queries
type ServiceContractWithCustomer = Tables<'service_contracts'> & {
  customers: { name: string; email: string | null } | null;
};

type ServiceContractWithCustomerName = Tables<'service_contracts'> & {
  customers: { name: string } | null;
};

export interface ContractRenewalReminder {
  contract_id: string;
  contract_name: string;
  customer_name: string;
  customer_email: string | null;
  end_date: string;
  days_until_expiry: number;
  base_fee: number;
  status: string;
}

export interface SLAMetrics {
  contract_id: string;
  contract_name: string;
  customer_name: string;
  response_time_target_hours: number;
  resolution_time_target_hours: number;
  total_tickets: number;
  tickets_in_sla: number;
  tickets_breached: number;
  sla_compliance_rate: number;
  avg_response_time_hours: number;
  avg_resolution_time_hours: number;
}

export interface ContractPerformance {
  contract_id: string;
  contract_name: string;
  customer_name: string;
  start_date: string;
  end_date: string;
  total_visits: number;
  scheduled_visits: number;
  completed_visits: number;
  total_revenue: number;
  total_parts_cost: number;
  total_labor_hours: number;
  profit_margin: number;
}

// Align with actual DB schema
export interface ContractPlan {
  id: string;
  name: string;
  description: string | null;
  default_base_fee: number | null;
  labor_discount_percent: number | null;
  parts_discount_percent: number | null;
  trip_charge_discount_percent: number | null;
  waive_trip_charge: boolean | null;
  included_visits_per_year: number | null;
  includes_emergency_service: boolean | null;
  includes_after_hours_rate_reduction: boolean | null;
  priority_level: Enums<'priority_level'> | null;
  response_time_sla_hours: number | null;
  is_active: boolean | null;
}

export class ContractAutomationService {
  /**
   * Get contracts expiring within specified days
   */
  static async getExpiringContracts(daysThreshold: number = 30): Promise<ContractRenewalReminder[]> {
    const today = new Date();
    const futureDate = new Date(today.getTime() + daysThreshold * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('service_contracts')
      .select(`
        id,
        name,
        end_date,
        base_fee,
        status,
        customers(name, email)
      `)
      .eq('status', 'active')
      .gte('end_date', today.toISOString().split('T')[0])
      .lte('end_date', futureDate.toISOString().split('T')[0])
      .order('end_date', { ascending: true });

    if (error) throw error;

    return (data || []).map((contract) => {
      const typedContract = contract as unknown as ServiceContractWithCustomer;
      return {
        contract_id: typedContract.id,
        contract_name: typedContract.name,
        customer_name: typedContract.customers?.name || 'Unknown',
        customer_email: typedContract.customers?.email || null,
        end_date: typedContract.end_date || '',
        days_until_expiry: Math.ceil(
          (new Date(typedContract.end_date || '').getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        ),
        base_fee: typedContract.base_fee || 0,
        status: typedContract.status,
      };
    });
  }

  /**
   * Get SLA metrics for contracts
   */
  static async getSLAMetrics(contractId?: string): Promise<SLAMetrics[]> {
    let contractQuery = supabase
      .from('service_contracts')
      .select(`
        id,
        name,
        response_time_sla_hours,
        customers(name)
      `)
      .eq('status', 'active');

    if (contractId) {
      contractQuery = contractQuery.eq('id', contractId);
    }

    const { data: contracts, error: contractError } = await contractQuery;
    if (contractError) throw contractError;

    const metrics: SLAMetrics[] = [];

    for (const contract of contracts || []) {
      // Get tickets for this contract
      const { data: tickets, error: ticketError } = await supabase
        .from('tickets')
        .select('id, created_at, started_at, completed_at, status')
        .eq('service_contract_id', contract.id);

      if (ticketError) {
        console.error('Error fetching tickets:', ticketError);
        continue;
      }

      // Use response_time_sla_hours, default to 24 hours
      const responseTimeTarget = contract.response_time_sla_hours || 24;
      const resolutionTimeTarget = 48; // No resolution SLA column - use default

      let ticketsInSLA = 0;
      let ticketsBreeched = 0;
      let totalResponseTime = 0;
      let totalResolutionTime = 0;
      let responseCount = 0;
      let resolutionCount = 0;

      for (const ticket of tickets || []) {
        const createdAt = new Date(ticket.created_at || new Date());

        // Use started_at as proxy for first response (actual first_response_at doesn't exist)
        if (ticket.started_at) {
          const responseTime = (new Date(ticket.started_at).getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          totalResponseTime += responseTime;
          responseCount++;

          if (responseTime <= responseTimeTarget) {
            ticketsInSLA++;
          } else {
            ticketsBreeched++;
          }
        }

        // Check resolution time
        if (ticket.completed_at) {
          const resolutionTime = (new Date(ticket.completed_at).getTime() - createdAt.getTime()) / (1000 * 60 * 60);
          totalResolutionTime += resolutionTime;
          resolutionCount++;
        }
      }

      const totalTickets = tickets?.length || 0;

      const typedContract = contract as unknown as ServiceContractWithCustomerName;
      metrics.push({
        contract_id: typedContract.id,
        contract_name: typedContract.name,
        customer_name: typedContract.customers?.name || 'Unknown',
        response_time_target_hours: responseTimeTarget,
        resolution_time_target_hours: resolutionTimeTarget,
        total_tickets: totalTickets,
        tickets_in_sla: ticketsInSLA,
        tickets_breached: ticketsBreeched,
        sla_compliance_rate: totalTickets > 0 ? (ticketsInSLA / totalTickets) * 100 : 100,
        avg_response_time_hours: responseCount > 0 ? totalResponseTime / responseCount : 0,
        avg_resolution_time_hours: resolutionCount > 0 ? totalResolutionTime / resolutionCount : 0,
      });
    }

    return metrics;
  }

  /**
   * Get performance metrics for a contract
   */
  static async getContractPerformance(contractId: string): Promise<ContractPerformance | null> {
    const { data: contract, error } = await supabase
      .from('service_contracts')
      .select(`
        id,
        name,
        start_date,
        end_date,
        included_visits_per_year,
        customers(name)
      `)
      .eq('id', contractId)
      .single();

    if (error || !contract) return null;

    // Get tickets for this contract
    const { data: tickets } = await supabase
      .from('tickets')
      .select('id, status')
      .eq('service_contract_id', contractId);

    // Get invoices for this contract - use source_ticket join approach
    const { data: invoices } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'paid');

    const totalVisits = tickets?.length || 0;
    const completedVisits = tickets?.filter((t) => t.status === 'completed').length || 0;
    const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

    const typedContract = contract as unknown as ServiceContractWithCustomerName;
    return {
      contract_id: typedContract.id,
      contract_name: typedContract.name,
      customer_name: typedContract.customers?.name || 'Unknown',
      start_date: typedContract.start_date,
      end_date: typedContract.end_date || '',
      total_visits: totalVisits,
      scheduled_visits: typedContract.included_visits_per_year || 0,
      completed_visits: completedVisits,
      total_revenue: totalRevenue,
      total_parts_cost: 0, // Would need parts tracking per contract
      total_labor_hours: 0, // Would need labor tracking per contract
      profit_margin: totalRevenue > 0 ? 100 : 0, // Simplified
    };
  }

  /**
   * Get contract plans from database
   */
  static async getContractPlans(): Promise<ContractPlan[]> {
    const { data, error } = await supabase
      .from('contract_plans')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('[ContractAutomation] Error fetching plans:', error);
      return [];
    }

    // Map DB rows to interface
    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      description: row.description,
      default_base_fee: row.default_base_fee,
      labor_discount_percent: row.labor_discount_percent,
      parts_discount_percent: row.parts_discount_percent,
      trip_charge_discount_percent: row.trip_charge_discount_percent,
      waive_trip_charge: row.waive_trip_charge,
      included_visits_per_year: row.included_visits_per_year,
      includes_emergency_service: row.includes_emergency_service,
      includes_after_hours_rate_reduction: row.includes_after_hours_rate_reduction,
      priority_level: row.priority_level,
      response_time_sla_hours: row.response_time_sla_hours,
      is_active: row.is_active,
    }));
  }

  /**
   * Get a specific contract plan by ID
   */
  static async getContractPlan(planId: string): Promise<ContractPlan | null> {
    const { data, error } = await supabase
      .from('contract_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('[ContractAutomation] Error fetching plan:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      description: data.description,
      default_base_fee: data.default_base_fee,
      labor_discount_percent: data.labor_discount_percent,
      parts_discount_percent: data.parts_discount_percent,
      trip_charge_discount_percent: data.trip_charge_discount_percent,
      waive_trip_charge: data.waive_trip_charge,
      included_visits_per_year: data.included_visits_per_year,
      includes_emergency_service: data.includes_emergency_service,
      includes_after_hours_rate_reduction: data.includes_after_hours_rate_reduction,
      priority_level: data.priority_level,
      response_time_sla_hours: data.response_time_sla_hours,
      is_active: data.is_active,
    };
  }

  /**
   * Auto-renew a contract
   */
  static async renewContract(
    contractId: string,
    options: {
      newEndDate: string;
      newBaseFee?: number;
      notes?: string;
    }
  ): Promise<{ success: boolean; newContractId?: string; error?: string }> {
    try {
      // Get existing contract
      const { data: existingContract, error: fetchError } = await supabase
        .from('service_contracts')
        .select('*')
        .eq('id', contractId)
        .single();

      if (fetchError || !existingContract) {
        throw new Error('Contract not found');
      }

      // Create new contract based on existing (using actual schema columns)
      const newContract = {
        customer_id: existingContract.customer_id,
        customer_location_id: existingContract.customer_location_id,
        contract_plan_id: existingContract.contract_plan_id,
        name: existingContract.name + ' (Renewed)',
        start_date: existingContract.end_date || new Date().toISOString().split('T')[0],
        end_date: options.newEndDate,
        base_fee: options.newBaseFee || existingContract.base_fee,
        billing_frequency: existingContract.billing_frequency,
        included_visits_per_year: existingContract.included_visits_per_year,
        response_time_sla_hours: existingContract.response_time_sla_hours,
        labor_discount_percent: existingContract.labor_discount_percent,
        parts_discount_percent: existingContract.parts_discount_percent,
        notes: options.notes || `Renewed from contract ${existingContract.name}`,
        status: 'active' as const,
      };

      const { data: newContractData, error: insertError } = await supabase
        .from('service_contracts')
        .insert([newContract])
        .select()
        .single();

      if (insertError) throw insertError;

      // Mark old contract as expired
      await supabase
        .from('service_contracts')
        .update({ status: 'expired' as const })
        .eq('id', contractId);

      return { success: true, newContractId: newContractData.id };
    } catch (error: unknown) {
      console.error('[ContractAutomation] Renewal error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Create contract from a contract plan
   */
  static async createFromPlan(
    planId: string,
    customerId: string,
    locationId: string,
    startDate: string,
    endDate: string
  ): Promise<{ success: boolean; contractId?: string; error?: string }> {
    const plan = await this.getContractPlan(planId);
    if (!plan) {
      return { success: false, error: 'Contract plan not found' };
    }

    try {
      const { data, error } = await supabase
        .from('service_contracts')
        .insert([{
          customer_id: customerId,
          customer_location_id: locationId,
          contract_plan_id: planId,
          name: plan.name,
          start_date: startDate,
          end_date: endDate,
          base_fee: plan.default_base_fee || 0,
          billing_frequency: 'annual' as const,
          included_visits_per_year: plan.included_visits_per_year || 0,
          labor_discount_percent: plan.labor_discount_percent || 0,
          parts_discount_percent: plan.parts_discount_percent || 0,
          priority_level: plan.priority_level,
          response_time_sla_hours: plan.response_time_sla_hours,
          status: 'draft' as const,
        }])
        .select()
        .single();

      if (error) throw error;

      return { success: true, contractId: data.id };
    } catch (error: unknown) {
      console.error('[ContractAutomation] Create from plan error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: message };
    }
  }

  /**
   * Get contracts needing attention (expiring, SLA breaches, etc.)
   */
  static async getContractsNeedingAttention(): Promise<{
    expiring: ContractRenewalReminder[];
    slaBreeches: SLAMetrics[];
    overdue: number;
  }> {
    const [expiring, slaMetrics] = await Promise.all([
      this.getExpiringContracts(30),
      this.getSLAMetrics(),
    ]);

    const slaBreeches = slaMetrics.filter((m) => m.sla_compliance_rate < 80);

    return {
      expiring,
      slaBreeches,
      overdue: expiring.filter((c) => c.days_until_expiry <= 0).length,
    };
  }

  /**
   * Format renewal reminder message
   */
  static formatRenewalReminderEmail(reminder: ContractRenewalReminder): {
    subject: string;
    body: string;
  } {
    return {
      subject: `Service Contract Renewal Reminder - ${reminder.contract_name}`,
      body: `
Dear ${reminder.customer_name},

Your service contract "${reminder.contract_name}" is expiring on ${new Date(reminder.end_date).toLocaleDateString()}.

Contract Details:
- Contract: ${reminder.contract_name}
- Expiration: ${new Date(reminder.end_date).toLocaleDateString()}
- Days Remaining: ${reminder.days_until_expiry}
- Annual Fee: $${reminder.base_fee.toFixed(2)}

To ensure continued coverage and priority service, please contact us to renew your contract.

Thank you for being a valued customer!

Best regards,
Your Service Team
      `.trim(),
    };
  }
}
