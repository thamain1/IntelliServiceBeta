import { supabase } from '../lib/supabase';
import type { Enums } from '../lib/dbTypes';

export type JobType = 'project' | 'ticket' | 'both';
export type JobStatus = 'all' | 'open' | 'in_progress' | 'completed' | 'closed';

// Map generic JobStatus to actual project statuses
function mapToProjectStatus(status: JobStatus): Enums<'project_status'> | null {
  switch (status) {
    case 'open': return 'planning'; // Map 'open' to 'planning' for projects
    case 'in_progress': return 'in_progress';
    case 'completed': return 'completed';
    case 'closed': return 'completed'; // Map 'closed' to 'completed' for projects
    default: return null;
  }
}

// Map generic JobStatus to actual ticket statuses
function mapToTicketStatus(status: JobStatus): Enums<'ticket_status'> | null {
  switch (status) {
    case 'open': return 'open';
    case 'in_progress': return 'in_progress';
    case 'completed': return 'completed';
    case 'closed': return 'closed_billed'; // Map 'closed' to 'closed_billed' for tickets
    default: return null;
  }
}

export interface JobPLFilters {
  startDate: string;
  endDate: string;
  jobType?: JobType;
  jobStatus?: JobStatus;
  customerId?: string;
  minRevenue?: number;
}

export interface JobPLLine {
  job_id: string;
  job_number: string;
  job_name: string;
  job_type: 'Project' | 'Service Ticket';
  customer_id: string;
  customer_name: string;
  status: string;
  site_name?: string;
  revenue: number;
  labor_cost: number;
  parts_cost: number;
  other_cost: number;
  total_cost: number;
  gross_profit: number;
  gross_margin_pct: number;
}

export interface JobPLSummary {
  jobs: JobPLLine[];
  unassigned?: JobPLLine;
  totals: {
    revenue: number;
    labor_cost: number;
    parts_cost: number;
    other_cost: number;
    total_cost: number;
    gross_profit: number;
    gross_margin_pct: number;
  };
}

export class JobPLService {
  /**
   * Get Profit & Loss by Job report
   */
  static async getJobProfitAndLoss(filters: JobPLFilters): Promise<JobPLSummary> {
    const { startDate, endDate, jobType = 'both', jobStatus = 'all', customerId, minRevenue = 0 } = filters;

    const [projectJobs, ticketJobs, unassignedRevenue, unassignedCosts] = await Promise.all([
      jobType === 'ticket' ? [] : this.getProjectJobs(startDate, endDate, jobStatus, customerId),
      jobType === 'project' ? [] : this.getTicketJobs(startDate, endDate, jobStatus, customerId),
      this.getUnassignedRevenue(startDate, endDate),
      this.getUnassignedCosts(startDate, endDate),
    ]);

    let jobs = [...projectJobs, ...ticketJobs];

    if (minRevenue > 0) {
      jobs = jobs.filter((j) => j.revenue >= minRevenue);
    }

    jobs.sort((a, b) => b.revenue - a.revenue);

    const totals = {
      revenue: 0,
      labor_cost: 0,
      parts_cost: 0,
      other_cost: 0,
      total_cost: 0,
      gross_profit: 0,
      gross_margin_pct: 0,
    };

    for (const job of jobs) {
      totals.revenue += job.revenue;
      totals.labor_cost += job.labor_cost;
      totals.parts_cost += job.parts_cost;
      totals.other_cost += job.other_cost;
      totals.total_cost += job.total_cost;
      totals.gross_profit += job.gross_profit;
    }

    let unassigned: JobPLLine | undefined;
    if (unassignedRevenue > 0 || unassignedCosts.labor > 0 || unassignedCosts.parts > 0) {
      const unassignedTotalCost = unassignedCosts.labor + unassignedCosts.parts + unassignedCosts.other;
      const unassignedGrossProfit = unassignedRevenue - unassignedTotalCost;

      unassigned = {
        job_id: 'unassigned',
        job_number: 'N/A',
        job_name: 'Unassigned / Non-job Activity',
        job_type: 'Service Ticket',
        customer_id: '',
        customer_name: 'Various',
        status: '',
        revenue: unassignedRevenue,
        labor_cost: unassignedCosts.labor,
        parts_cost: unassignedCosts.parts,
        other_cost: unassignedCosts.other,
        total_cost: unassignedTotalCost,
        gross_profit: unassignedGrossProfit,
        gross_margin_pct: unassignedRevenue > 0 ? (unassignedGrossProfit / unassignedRevenue) * 100 : 0,
      };

      totals.revenue += unassignedRevenue;
      totals.labor_cost += unassignedCosts.labor;
      totals.parts_cost += unassignedCosts.parts;
      totals.other_cost += unassignedCosts.other;
      totals.total_cost += unassignedTotalCost;
      totals.gross_profit += unassignedGrossProfit;
    }

    totals.gross_margin_pct = totals.revenue > 0 ? (totals.gross_profit / totals.revenue) * 100 : 0;

    return { jobs, unassigned, totals };
  }

  /**
   * Get P&L for all projects in the date range
   */
  private static async getProjectJobs(
    startDate: string,
    endDate: string,
    jobStatus: JobStatus,
    customerId?: string
  ): Promise<JobPLLine[]> {
    let query = supabase
      .from('projects')
      .select(
        `
        id,
        project_number,
        name,
        status,
        location,
        customer_id,
        customers!inner(name)
      `
      )
      .order('project_number', { ascending: false });

    if (jobStatus !== 'all') {
      const mappedStatus = mapToProjectStatus(jobStatus);
      if (mappedStatus) {
        query = query.eq('status', mappedStatus);
      }
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: projects, error } = await query;

    if (error) throw error;

    const projectLines: JobPLLine[] = [];

    for (const project of projects || []) {
      const [revenue, laborCost, partsCost] = await Promise.all([
        this.getProjectRevenue(project.id, startDate, endDate),
        this.getProjectLaborCost(project.id, startDate, endDate),
        this.getProjectPartsCost(project.id, startDate, endDate),
      ]);

      const totalCost = laborCost + partsCost;
      const grossProfit = revenue - totalCost;
      const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

      projectLines.push({
        job_id: project.id,
        job_number: project.project_number,
        job_name: project.name,
        job_type: 'Project',
        customer_id: project.customer_id,
        customer_name: (project.customers as any)?.name || 'Unknown',
        status: project.status || '',
        site_name: project.location || undefined,
        revenue,
        labor_cost: laborCost,
        parts_cost: partsCost,
        other_cost: 0,
        total_cost: totalCost,
        gross_profit: grossProfit,
        gross_margin_pct: grossMarginPct,
      });
    }

    return projectLines;
  }

  /**
   * Get P&L for all standalone tickets (not part of a project) in the date range
   */
  private static async getTicketJobs(
    startDate: string,
    endDate: string,
    jobStatus: JobStatus,
    customerId?: string
  ): Promise<JobPLLine[]> {
    let query = supabase
      .from('tickets')
      .select(
        `
        id,
        ticket_number,
        title,
        status,
        customer_id,
        customers!inner(name),
        customer_locations!tickets_site_id_fkey(location_name)
      `
      )
      .is('project_id', null)
      .order('ticket_number', { ascending: false });

    if (jobStatus !== 'all') {
      const mappedStatus = mapToTicketStatus(jobStatus);
      if (mappedStatus) {
        query = query.eq('status', mappedStatus);
      }
    }

    if (customerId) {
      query = query.eq('customer_id', customerId);
    }

    const { data: tickets, error } = await query;

    if (error) throw error;

    const ticketLines: JobPLLine[] = [];

    for (const ticket of tickets || []) {
      const [revenue, laborCost, partsCost] = await Promise.all([
        this.getTicketRevenue(ticket.id, startDate, endDate),
        this.getTicketLaborCost(ticket.id, startDate, endDate),
        this.getTicketPartsCost(ticket.id, startDate, endDate),
      ]);

      if (revenue === 0 && laborCost === 0 && partsCost === 0) {
        continue;
      }

      const totalCost = laborCost + partsCost;
      const grossProfit = revenue - totalCost;
      const grossMarginPct = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

      ticketLines.push({
        job_id: ticket.id,
        job_number: ticket.ticket_number,
        job_name: ticket.title,
        job_type: 'Service Ticket',
        customer_id: ticket.customer_id,
        customer_name: (ticket.customers as any)?.name || 'Unknown',
        status: ticket.status || '',
        site_name: (ticket.customer_locations as any)?.location_name || undefined,
        revenue,
        labor_cost: laborCost,
        parts_cost: partsCost,
        other_cost: 0,
        total_cost: totalCost,
        gross_profit: grossProfit,
        gross_margin_pct: grossMarginPct,
      });
    }

    return ticketLines;
  }

  /**
   * Get revenue for a project from invoice lines
   */
  private static async getProjectRevenue(
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from('invoice_line_items')
      .select('line_total, invoices!inner(issue_date)')
      .eq('project_id', projectId)
      .gte('invoices.issue_date', startDate)
      .lte('invoices.issue_date', endDate);

    if (error) throw error;

    return (data || []).reduce((sum, line) => sum + parseFloat(String(line.line_total || 0)), 0);
  }

  /**
   * Get revenue for a ticket from invoice lines
   */
  private static async getTicketRevenue(
    ticketId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const { data, error } = await supabase
      .from('invoice_line_items')
      .select('line_total, invoices!inner(issue_date)')
      .eq('ticket_id', ticketId)
      .gte('invoices.issue_date', startDate)
      .lte('invoices.issue_date', endDate);

    if (error) throw error;

    return (data || []).reduce((sum, line) => sum + parseFloat(String(line.line_total || 0)), 0);
  }

  /**
   * Get labor cost for a project from tickets (hours_onsite × labor_cost_per_hour)
   */
  private static async getProjectLaborCost(
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    // First try to get labor cost from time_logs if they exist
    const { data: timeLogs, error: timeError } = await supabase
      .from('time_logs')
      .select('total_cost_amount, clock_in_time')
      .eq('project_id', projectId)
      .gte('clock_in_time', startDate)
      .lte('clock_in_time', endDate)
      .not('total_cost_amount', 'is', null);

    if (!timeError && timeLogs && timeLogs.length > 0) {
      return timeLogs.reduce((sum, log) => sum + parseFloat(String(log.total_cost_amount || 0)), 0);
    }

    // Fallback: calculate from tickets.hours_onsite × profiles.labor_cost_per_hour
    const { data: tickets, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        hours_onsite,
        completed_date,
        profiles!tickets_assigned_to_fkey(labor_cost_per_hour)
      `)
      .eq('project_id', projectId)
      .not('hours_onsite', 'is', null)
      .gte('completed_date', startDate)
      .lte('completed_date', endDate);

    if (ticketError) throw ticketError;

    let totalCost = 0;
    for (const ticket of tickets || []) {
      const hours = parseFloat(String(ticket.hours_onsite || 0));
      const costRate = parseFloat(String((ticket.profiles as any)?.labor_cost_per_hour || 45));
      totalCost += hours * costRate;
    }

    return totalCost;
  }

  /**
   * Get labor cost for a ticket from hours_onsite × labor_cost_per_hour
   */
  private static async getTicketLaborCost(
    ticketId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    // First try to get labor cost from time_logs if they exist
    const { data: timeLogs, error: timeError } = await supabase
      .from('time_logs')
      .select('total_cost_amount, clock_in_time')
      .eq('ticket_id', ticketId)
      .gte('clock_in_time', startDate)
      .lte('clock_in_time', endDate)
      .not('total_cost_amount', 'is', null);

    if (!timeError && timeLogs && timeLogs.length > 0) {
      return timeLogs.reduce((sum, log) => sum + parseFloat(String(log.total_cost_amount || 0)), 0);
    }

    // Fallback: calculate from ticket.hours_onsite × profile.labor_cost_per_hour
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .select(`
        hours_onsite,
        completed_date,
        profiles!tickets_assigned_to_fkey(labor_cost_per_hour)
      `)
      .eq('id', ticketId)
      .maybeSingle();

    if (ticketError) throw ticketError;

    if (!ticket || !ticket.hours_onsite) {
      return 0;
    }

    // Check if completed_date is within range
    if (ticket.completed_date) {
      const completedDate = new Date(ticket.completed_date);
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (completedDate < start || completedDate > end) {
        return 0;
      }
    }

    const hours = parseFloat(String(ticket.hours_onsite || 0));
    const costRate = parseFloat(String((ticket.profiles as any)?.labor_cost_per_hour || 45));

    return hours * costRate;
  }

  /**
   * Get parts cost for a project (sum of all tickets in the project)
   */
  private static async getProjectPartsCost(
    projectId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    const { data: tickets, error: ticketError } = await supabase
      .from('tickets')
      .select('id')
      .eq('project_id', projectId);

    if (ticketError) throw ticketError;

    if (!tickets || tickets.length === 0) return 0;

    const ticketIds = tickets.map((t) => t.id);

    // First try to get parts cost from ticket_parts_used table if records exist
    const { data: partsUsed, error: usageError } = await supabase
      .from('ticket_parts_used')
      .select(
        `
        quantity,
        created_at,
        part_id,
        parts!inner(id, unit_price, part_inventory(unit_cost))
      `
      )
      .in('ticket_id', ticketIds)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (!usageError && partsUsed && partsUsed.length > 0) {
      let totalCost = 0;
      for (const usage of partsUsed) {
        // Get unit_cost from parts relationship
        const unitCost = this.getPartCost(usage);
        totalCost += (usage.quantity || 0) * unitCost;
      }
      return totalCost;
    }

    // Fallback: calculate from invoice line items where item_type = 'part'
    const { data: partLines, error: invoiceError } = await supabase
      .from('invoice_line_items')
      .select(`
        quantity,
        unit_price,
        part_id,
        invoices!inner(issue_date)
      `)
      .in('ticket_id', ticketIds)
      .eq('item_type', 'part')
      .gte('invoices.issue_date', startDate)
      .lte('invoices.issue_date', endDate);

    if (invoiceError) throw invoiceError;

    let totalCost = 0;
    for (const line of partLines || []) {
      let unitCost = 0;

      // Try to get actual cost if part_id is available
      if (line.part_id) {
        unitCost = await this.getPartCostById(line.part_id);
      }

      // Fallback to 60% of selling price as cost
      if (unitCost === 0) {
        unitCost = parseFloat(String(line.unit_price || 0)) * 0.6;
      }

      const quantity = parseFloat(String(line.quantity || 1));
      totalCost += quantity * unitCost;
    }

    return totalCost;
  }

  /**
   * Get parts cost for a ticket
   */
  private static async getTicketPartsCost(
    ticketId: string,
    startDate: string,
    endDate: string
  ): Promise<number> {
    // First try to get parts cost from ticket_parts_used table if records exist
    const { data: partsUsed, error: usageError } = await supabase
      .from('ticket_parts_used')
      .select(
        `
        quantity,
        created_at,
        part_id,
        parts!inner(unit_price)
      `
      )
      .eq('ticket_id', ticketId)
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (!usageError && partsUsed && partsUsed.length > 0) {
      let totalCost = 0;
      for (const usage of partsUsed) {
        // Look up unit_cost from part_inventory
        const unitCost = await this.getPartCostById(usage.part_id);
        totalCost += (usage.quantity || 0) * unitCost;
      }
      return totalCost;
    }

    // Fallback: calculate from invoice line items where item_type = 'part'
    const { data: partLines, error: invoiceError } = await supabase
      .from('invoice_line_items')
      .select(`
        quantity,
        unit_price,
        part_id,
        invoices!inner(issue_date)
      `)
      .eq('ticket_id', ticketId)
      .eq('item_type', 'part')
      .gte('invoices.issue_date', startDate)
      .lte('invoices.issue_date', endDate);

    if (invoiceError) throw invoiceError;

    let totalCost = 0;
    for (const line of partLines || []) {
      let unitCost = 0;

      // Try to get actual cost if part_id is available
      if (line.part_id) {
        unitCost = await this.getPartCostById(line.part_id);
      }

      // Fallback to 60% of selling price as cost
      if (unitCost === 0) {
        unitCost = parseFloat(String(line.unit_price || 0)) * 0.6;
      }

      const quantity = parseFloat(String(line.quantity || 1));
      totalCost += quantity * unitCost;
    }

    return totalCost;
  }

  /**
   * Get part cost from part_inventory, fallback to parts.unit_price
   */
  private static getPartCost(usage: any): number {
    // Check if part_inventory exists through the parts relationship
    if (usage.parts?.part_inventory && Array.isArray(usage.parts.part_inventory) && usage.parts.part_inventory.length > 0) {
      const inventory = usage.parts.part_inventory[0];
      if (inventory.unit_cost) {
        return parseFloat(String(inventory.unit_cost));
      }
    }

    // Fallback to unit_price from parts (use 60% as cost)
    if (usage.parts?.unit_price) {
      return parseFloat(String(usage.parts.unit_price)) * 0.6;
    }

    return 0;
  }

  /**
   * Get part cost by part ID
   */
  private static async getPartCostById(partId: string): Promise<number> {
    const { data: inventory } = await supabase
      .from('part_inventory')
      .select('unit_cost')
      .eq('part_id', partId)
      .limit(1)
      .single();

    if (inventory?.unit_cost) {
      return parseFloat(String(inventory.unit_cost));
    }

    const { data: part } = await supabase
      .from('parts')
      .select('unit_price')
      .eq('id', partId)
      .single();

    if (part?.unit_price) {
      return parseFloat(String(part.unit_price)) * 0.6;
    }

    return 0;
  }

  /**
   * Get unassigned revenue (invoices with no ticket or project)
   */
  private static async getUnassignedRevenue(startDate: string, endDate: string): Promise<number> {
    const { data, error } = await supabase
      .from('invoice_line_items')
      .select('line_total, invoices!inner(issue_date)')
      .is('ticket_id', null)
      .is('project_id', null)
      .gte('invoices.issue_date', startDate)
      .lte('invoices.issue_date', endDate);

    if (error) throw error;

    return (data || []).reduce((sum, line) => sum + parseFloat(String(line.line_total || 0)), 0);
  }

  /**
   * Get unassigned costs (time logs and parts with no ticket or project)
   */
  private static async getUnassignedCosts(
    startDate: string,
    endDate: string
  ): Promise<{ labor: number; parts: number; other: number }> {
    const { data: laborData, error: laborError } = await supabase
      .from('time_logs')
      .select('total_cost_amount')
      .is('ticket_id', null)
      .is('project_id', null)
      .gte('clock_in_time', startDate)
      .lte('clock_in_time', endDate)
      .not('total_cost_amount', 'is', null);

    if (laborError) throw laborError;

    const labor = (laborData || []).reduce(
      (sum, log) => sum + parseFloat(String(log.total_cost_amount || 0)),
      0
    );

    // Calculate parts cost from invoice line items with no ticket or project
    const { data: partLines, error: partsError } = await supabase
      .from('invoice_line_items')
      .select(`
        quantity,
        unit_price,
        part_id,
        invoices!inner(issue_date)
      `)
      .is('ticket_id', null)
      .is('project_id', null)
      .eq('item_type', 'part')
      .gte('invoices.issue_date', startDate)
      .lte('invoices.issue_date', endDate);

    let partsCost = 0;
    if (!partsError && partLines) {
      for (const line of partLines) {
        let unitCost = 0;

        // Try to get actual cost if part_id is available
        if (line.part_id) {
          unitCost = await this.getPartCostById(line.part_id);
        }

        // Fallback to 60% of selling price as cost
        if (unitCost === 0) {
          unitCost = parseFloat(String(line.unit_price || 0)) * 0.6;
        }

        const quantity = parseFloat(String(line.quantity || 1));
        partsCost += quantity * unitCost;
      }
    }

    return { labor, parts: partsCost, other: 0 };
  }
}
