import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type PayrollRun = Database['public']['Tables']['payroll_runs']['Row'];
type PayrollRunInsert = Database['public']['Tables']['payroll_runs']['Insert'];
type PayrollDetail = Database['public']['Tables']['payroll_details']['Row'];
type PayrollDetailInsert = Database['public']['Tables']['payroll_details']['Insert'];
type EmployeePayRate = Database['public']['Tables']['employee_pay_rates']['Row'];
type PayrollDeduction = Database['public']['Tables']['payroll_deductions']['Row'];
type EmployeeDeduction = Database['public']['Tables']['employee_deductions']['Row'];

export interface PayrollRunWithDetails extends PayrollRun {
  payroll_details?: (PayrollDetail & { profiles?: { full_name: string } })[];
}

export interface EmployeePayRateWithProfile extends EmployeePayRate {
  profiles?: { full_name: string; email: string; role: string };
}

export interface EmployeeHours {
  regular_hours: number;
  overtime_hours: number;
}

export interface PayrollCalculation {
  regular_hours: number;
  overtime_hours: number;
  regular_pay: number;
  overtime_pay: number;
  gross_pay: number;
  deductions: DeductionBreakdown[];
  total_deductions: number;
  net_pay: number;
}

export interface DeductionBreakdown {
  deduction_id: string;
  deduction_name: string;
  deduction_type: string;
  amount: number;
  is_pre_tax: boolean;
}

export interface PayrollSummary {
  period_start: string;
  period_end: string;
  total_gross_pay: number;
  total_deductions: number;
  total_net_pay: number;
  employee_count: number;
  total_regular_hours: number;
  total_overtime_hours: number;
}

export interface PayStub {
  id: string;
  payroll_run_id: string;
  run_number: string;
  period_start_date: string;
  period_end_date: string;
  pay_date: string;
  employee_name: string;
  employee_id: string;
  regular_hours: number;
  overtime_hours: number;
  regular_pay: number;
  overtime_pay: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  deductions?: DeductionBreakdown[];
}

export interface YTDTotals {
  total_gross_pay: number;
  total_net_pay: number;
  total_regular_hours: number;
  total_overtime_hours: number;
  total_deductions: number;
  federal_tax_ytd: number;
  state_tax_ytd: number;
  fica_ytd: number;
  medicare_ytd: number;
}

export interface PayrollFilters {
  startDate?: string;
  endDate?: string;
  employeeId?: string;
  status?: string;
}

const DEFAULT_OT_THRESHOLD = 40;
const DEFAULT_HOURLY_RATE = 25; // Fallback if no rate configured

export class PayrollService {
  /**
   * Get the effective pay rate for an employee on a given date
   */
  static async getEmployeePayRate(
    userId: string,
    effectiveDate: string
  ): Promise<EmployeePayRate | null> {
    try {
      const { data, error } = await supabase
        .from('employee_pay_rates')
        .select('*')
        .eq('user_id', userId)
        .lte('effective_date', effectiveDate)
        .or(`end_date.is.null,end_date.gte.${effectiveDate}`)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching employee pay rate:', error);
      return null;
    }
  }

  /**
   * Get all employee pay rates with profile information
   */
  static async getAllEmployeePayRates(): Promise<EmployeePayRateWithProfile[]> {
    try {
      const { data, error } = await supabase
        .from('employee_pay_rates')
        .select(`
          *,
          profiles(full_name, email, role)
        `)
        .is('end_date', null)
        .order('profiles(full_name)', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee pay rates:', error);
      return [];
    }
  }

  /**
   * Get pay rate history for an employee
   */
  static async getPayRateHistory(userId: string): Promise<EmployeePayRate[]> {
    try {
      const { data, error } = await supabase
        .from('employee_pay_rates')
        .select('*')
        .eq('user_id', userId)
        .order('effective_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pay rate history:', error);
      return [];
    }
  }

  /**
   * Create or update an employee pay rate
   */
  static async upsertEmployeePayRate(
    payRate: Partial<EmployeePayRate> & { user_id: string }
  ): Promise<EmployeePayRate | null> {
    try {
      // If updating an existing rate with a new effective date, end the current rate
      if (payRate.effective_date && !payRate.id) {
        const { data: currentRate } = await supabase
          .from('employee_pay_rates')
          .select('id')
          .eq('user_id', payRate.user_id)
          .is('end_date', null)
          .maybeSingle();

        if (currentRate) {
          const newEffectiveDate = new Date(payRate.effective_date);
          newEffectiveDate.setDate(newEffectiveDate.getDate() - 1);

          await supabase
            .from('employee_pay_rates')
            .update({ end_date: newEffectiveDate.toISOString().split('T')[0] })
            .eq('id', currentRate.id);
        }
      }

      if (payRate.id) {
        const { data, error } = await supabase
          .from('employee_pay_rates')
          .update(payRate)
          .eq('id', payRate.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('employee_pay_rates')
          .insert(payRate)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error upserting employee pay rate:', error);
      throw error;
    }
  }

  /**
   * Calculate pay for a single employee based on hours worked
   */
  static async calculatePayForEmployee(
    userId: string,
    hours: EmployeeHours,
    periodStart: string
  ): Promise<PayrollCalculation> {
    const payRate = await this.getEmployeePayRate(userId, periodStart);

    const hourlyRate = payRate?.hourly_rate || DEFAULT_HOURLY_RATE;
    const overtimeRate = payRate?.overtime_rate || hourlyRate * 1.5;
    const otThreshold = payRate?.ot_threshold || DEFAULT_OT_THRESHOLD;

    // Recalculate OT based on threshold if needed
    let regularHours = hours.regular_hours;
    let overtimeHours = hours.overtime_hours;

    // If total regular hours exceed threshold, convert to OT
    if (regularHours > otThreshold) {
      overtimeHours += regularHours - otThreshold;
      regularHours = otThreshold;
    }

    const regularPay = regularHours * hourlyRate;
    const overtimePay = overtimeHours * overtimeRate;
    const grossPay = regularPay + overtimePay;

    // Calculate deductions
    const deductionsResult = await this.calculateDeductions(grossPay, userId);

    return {
      regular_hours: regularHours,
      overtime_hours: overtimeHours,
      regular_pay: regularPay,
      overtime_pay: overtimePay,
      gross_pay: grossPay,
      deductions: deductionsResult.breakdown,
      total_deductions: deductionsResult.total,
      net_pay: grossPay - deductionsResult.total,
    };
  }

  /**
   * Calculate deductions for an employee based on gross pay
   */
  static async calculateDeductions(
    grossPay: number,
    userId: string
  ): Promise<{ total: number; breakdown: DeductionBreakdown[] }> {
    try {
      // Get all active deductions
      const { data: deductions, error: dedError } = await supabase
        .from('payroll_deductions')
        .select('*')
        .eq('is_active', true);

      if (dedError) throw dedError;

      // Get employee-specific deduction overrides
      const { data: employeeDeductions, error: empDedError } = await supabase
        .from('employee_deductions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true);

      if (empDedError) throw empDedError;

      const breakdown: DeductionBreakdown[] = [];
      let total = 0;

      // Create a map of employee overrides
      const overrideMap = new Map(
        (employeeDeductions || []).map((ed) => [ed.deduction_id, ed])
      );

      for (const deduction of deductions || []) {
        const override = overrideMap.get(deduction.id);

        let amount: number;
        if (override && override.amount !== null) {
          // Use employee-specific amount
          amount = override.amount;
        } else if (deduction.calculation_method === 'percentage') {
          amount = grossPay * (deduction.default_amount / 100);
        } else {
          amount = deduction.default_amount;
        }

        // Round to 2 decimal places
        amount = Math.round(amount * 100) / 100;

        breakdown.push({
          deduction_id: deduction.id,
          deduction_name: deduction.deduction_name,
          deduction_type: deduction.deduction_type,
          amount,
          is_pre_tax: deduction.is_pre_tax,
        });

        total += amount;
      }

      return { total: Math.round(total * 100) / 100, breakdown };
    } catch (error) {
      console.error('Error calculating deductions:', error);
      return { total: 0, breakdown: [] };
    }
  }

  /**
   * Get all active payroll deductions
   */
  static async getPayrollDeductions(): Promise<PayrollDeduction[]> {
    try {
      const { data, error } = await supabase
        .from('payroll_deductions')
        .select('*')
        .order('deduction_name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payroll deductions:', error);
      return [];
    }
  }

  /**
   * Get employee-specific deduction overrides
   */
  static async getEmployeeDeductions(userId: string): Promise<(EmployeeDeduction & { payroll_deductions?: PayrollDeduction })[]> {
    try {
      const { data, error } = await supabase
        .from('employee_deductions')
        .select(`
          *,
          payroll_deductions(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee deductions:', error);
      return [];
    }
  }

  /**
   * Upsert employee deduction override
   */
  static async upsertEmployeeDeduction(
    employeeDeduction: Partial<EmployeeDeduction> & { user_id: string; deduction_id: string }
  ): Promise<EmployeeDeduction | null> {
    try {
      const { data: existing } = await supabase
        .from('employee_deductions')
        .select('id')
        .eq('user_id', employeeDeduction.user_id)
        .eq('deduction_id', employeeDeduction.deduction_id)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('employee_deductions')
          .update(employeeDeduction)
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('employee_deductions')
          .insert(employeeDeduction)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error upserting employee deduction:', error);
      throw error;
    }
  }

  /**
   * Generate a new payroll run with details for all eligible employees
   */
  static async generatePayrollRun(
    periodStart: string,
    periodEnd: string,
    payDate: string,
    processedBy: string
  ): Promise<PayrollRun | null> {
    try {
      // Get existing runs to generate run number
      const { data: existingRuns } = await supabase
        .from('payroll_runs')
        .select('id')
        .order('created_at', { ascending: false });

      const runNumber = `PR-${new Date().getFullYear()}-${String((existingRuns?.length || 0) + 1).padStart(4, '0')}`;

      // Create the payroll run
      const runInsert: PayrollRunInsert = {
        run_number: runNumber,
        period_start_date: periodStart,
        period_end_date: periodEnd,
        pay_date: payDate,
        status: 'draft',
        processed_by: processedBy,
      };

      const { data: run, error: runError } = await supabase
        .from('payroll_runs')
        .insert(runInsert)
        .select()
        .single();

      if (runError) throw runError;

      // Get all eligible employees (technicians and dispatchers)
      const { data: employees, error: empError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['technician', 'dispatcher'])
        .order('full_name', { ascending: true });

      if (empError) throw empError;

      // Get time logs for the period
      const { data: timeLogs, error: timeError } = await supabase
        .from('time_logs')
        .select('user_id, total_hours, time_type')
        .gte('clock_in_time', periodStart)
        .lte('clock_in_time', periodEnd)
        .eq('status', 'approved');

      if (timeError) throw timeError;

      // Aggregate hours by employee
      const employeeHours: Record<string, EmployeeHours> = {};
      for (const log of timeLogs || []) {
        if (!employeeHours[log.user_id]) {
          employeeHours[log.user_id] = { regular_hours: 0, overtime_hours: 0 };
        }

        if (log.time_type === 'overtime') {
          employeeHours[log.user_id].overtime_hours += log.total_hours || 0;
        } else {
          employeeHours[log.user_id].regular_hours += log.total_hours || 0;
        }
      }

      // Generate payroll details for each employee with hours
      let totalGrossPay = 0;
      let totalDeductions = 0;
      let totalNetPay = 0;
      let employeeCount = 0;

      for (const employee of employees || []) {
        const hours = employeeHours[employee.id] || { regular_hours: 0, overtime_hours: 0 };

        if (hours.regular_hours > 0 || hours.overtime_hours > 0) {
          const calculation = await this.calculatePayForEmployee(
            employee.id,
            hours,
            periodStart
          );

          const detailInsert: PayrollDetailInsert = {
            payroll_run_id: run.id,
            user_id: employee.id,
            regular_hours: calculation.regular_hours,
            overtime_hours: calculation.overtime_hours,
            regular_pay: calculation.regular_pay,
            overtime_pay: calculation.overtime_pay,
            gross_pay: calculation.gross_pay,
            total_deductions: calculation.total_deductions,
            net_pay: calculation.net_pay,
          };

          const { error: detailError } = await supabase
            .from('payroll_details')
            .insert(detailInsert);

          if (detailError) {
            console.error('Error creating payroll detail:', detailError);
          } else {
            totalGrossPay += calculation.gross_pay;
            totalDeductions += calculation.total_deductions;
            totalNetPay += calculation.net_pay;
            employeeCount++;
          }
        }
      }

      // Update the run with totals
      const { error: updateError } = await supabase
        .from('payroll_runs')
        .update({
          total_gross_pay: totalGrossPay,
          total_deductions: totalDeductions,
          total_net_pay: totalNetPay,
          employee_count: employeeCount,
        })
        .eq('id', run.id);

      if (updateError) throw updateError;

      return {
        ...run,
        total_gross_pay: totalGrossPay,
        total_deductions: totalDeductions,
        total_net_pay: totalNetPay,
        employee_count: employeeCount,
      };
    } catch (error) {
      console.error('Error generating payroll run:', error);
      throw error;
    }
  }

  /**
   * Process (approve and mark as paid) a payroll run
   */
  static async processPayroll(
    runId: string,
    approvedBy: string
  ): Promise<PayrollRun | null> {
    try {
      const { data, error } = await supabase
        .from('payroll_runs')
        .update({
          status: 'paid',
          approved_by: approvedBy,
          approved_at: new Date().toISOString(),
        })
        .eq('id', runId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error processing payroll:', error);
      throw error;
    }
  }

  /**
   * Get all payroll runs with optional filters
   */
  static async getPayrollRuns(filters: PayrollFilters = {}): Promise<PayrollRun[]> {
    try {
      let query = supabase
        .from('payroll_runs')
        .select('*')
        .order('period_start_date', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.startDate) {
        query = query.gte('period_start_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('period_end_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payroll runs:', error);
      return [];
    }
  }

  /**
   * Get payroll details for a specific run
   */
  static async getPayrollDetails(runId: string): Promise<(PayrollDetail & { profiles?: { full_name: string } })[]> {
    try {
      const { data, error } = await supabase
        .from('payroll_details')
        .select('*, profiles(full_name)')
        .eq('payroll_run_id', runId)
        .order('profiles(full_name)', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payroll details:', error);
      return [];
    }
  }

  // ========== REPORT METHODS ==========

  /**
   * Get payroll summary report for a date range
   */
  static async getPayrollSummaryReport(
    startDate: string,
    endDate: string
  ): Promise<PayrollSummary[]> {
    try {
      const { data, error } = await supabase
        .from('payroll_runs')
        .select(`
          *,
          payroll_details(
            regular_hours,
            overtime_hours,
            gross_pay,
            total_deductions,
            net_pay
          )
        `)
        .gte('period_start_date', startDate)
        .lte('period_end_date', endDate)
        .eq('status', 'paid')
        .order('period_start_date', { ascending: true });

      if (error) throw error;

      return (data || []).map((run) => {
        const details = run.payroll_details || [];
        return {
          period_start: run.period_start_date,
          period_end: run.period_end_date,
          total_gross_pay: run.total_gross_pay || 0,
          total_deductions: run.total_deductions || 0,
          total_net_pay: run.total_net_pay || 0,
          employee_count: run.employee_count || 0,
          total_regular_hours: details.reduce((sum, d) => sum + (d.regular_hours || 0), 0),
          total_overtime_hours: details.reduce((sum, d) => sum + (d.overtime_hours || 0), 0),
        };
      });
    } catch (error) {
      console.error('Error fetching payroll summary report:', error);
      return [];
    }
  }

  /**
   * Get tax report with federal, state, SS, and Medicare totals
   */
  static async getTaxReport(
    startDate: string,
    endDate: string
  ): Promise<{
    federal_tax: number;
    state_tax: number;
    social_security: number;
    medicare: number;
    total: number;
    by_quarter: { quarter: string; federal: number; state: number; fica: number; medicare: number }[];
  }> {
    try {
      // This would need to be calculated from payroll_details with deduction breakdowns
      // For now, return estimated values based on standard rates
      const { data: runs, error } = await supabase
        .from('payroll_runs')
        .select('total_gross_pay, period_start_date')
        .gte('period_start_date', startDate)
        .lte('period_end_date', endDate)
        .eq('status', 'paid');

      if (error) throw error;

      let totalGross = 0;
      const quarterlyData: Record<string, { gross: number }> = {};

      for (const run of runs || []) {
        totalGross += run.total_gross_pay || 0;

        const date = new Date(run.period_start_date);
        const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${date.getFullYear()}`;

        if (!quarterlyData[quarter]) {
          quarterlyData[quarter] = { gross: 0 };
        }
        quarterlyData[quarter].gross += run.total_gross_pay || 0;
      }

      // Standard tax rates (approximate)
      const federalRate = 0.22; // ~22% average
      const stateRate = 0.05; // ~5% average
      const ssRate = 0.062; // 6.2%
      const medicareRate = 0.0145; // 1.45%

      return {
        federal_tax: totalGross * federalRate,
        state_tax: totalGross * stateRate,
        social_security: totalGross * ssRate,
        medicare: totalGross * medicareRate,
        total: totalGross * (federalRate + stateRate + ssRate + medicareRate),
        by_quarter: Object.entries(quarterlyData).map(([quarter, data]) => ({
          quarter,
          federal: data.gross * federalRate,
          state: data.gross * stateRate,
          fica: data.gross * ssRate,
          medicare: data.gross * medicareRate,
        })),
      };
    } catch (error) {
      console.error('Error fetching tax report:', error);
      return {
        federal_tax: 0,
        state_tax: 0,
        social_security: 0,
        medicare: 0,
        total: 0,
        by_quarter: [],
      };
    }
  }

  /**
   * Get employee earnings report (YTD by employee)
   */
  static async getEmployeeEarningsReport(
    startDate: string,
    endDate: string
  ): Promise<{
    employee_id: string;
    employee_name: string;
    total_gross: number;
    total_net: number;
    total_hours: number;
    total_ot_hours: number;
    pay_periods: number;
  }[]> {
    try {
      const { data, error } = await supabase
        .from('payroll_details')
        .select(`
          user_id,
          regular_hours,
          overtime_hours,
          gross_pay,
          net_pay,
          profiles(full_name),
          payroll_runs!inner(period_start_date, period_end_date, status)
        `)
        .gte('payroll_runs.period_start_date', startDate)
        .lte('payroll_runs.period_end_date', endDate)
        .eq('payroll_runs.status', 'paid');

      if (error) throw error;

      // Aggregate by employee
      const employeeMap = new Map<string, {
        employee_name: string;
        total_gross: number;
        total_net: number;
        total_hours: number;
        total_ot_hours: number;
        pay_periods: Set<string>;
      }>();

      for (const detail of data || []) {
        const current = employeeMap.get(detail.user_id) || {
          employee_name: detail.profiles?.full_name || 'Unknown',
          total_gross: 0,
          total_net: 0,
          total_hours: 0,
          total_ot_hours: 0,
          pay_periods: new Set<string>(),
        };

        current.total_gross += detail.gross_pay || 0;
        current.total_net += detail.net_pay || 0;
        current.total_hours += detail.regular_hours || 0;
        current.total_ot_hours += detail.overtime_hours || 0;
        current.pay_periods.add((detail as { payroll_runs?: { period_start_date: string } }).payroll_runs?.period_start_date || '');

        employeeMap.set(detail.user_id, current);
      }

      return Array.from(employeeMap.entries()).map(([employee_id, data]) => ({
        employee_id,
        employee_name: data.employee_name,
        total_gross: data.total_gross,
        total_net: data.total_net,
        total_hours: data.total_hours,
        total_ot_hours: data.total_ot_hours,
        pay_periods: data.pay_periods.size,
      }));
    } catch (error) {
      console.error('Error fetching employee earnings report:', error);
      return [];
    }
  }

  /**
   * Get deductions report
   */
  static async getDeductionsReport(
    startDate: string,
    endDate: string
  ): Promise<{
    by_type: { type: string; pre_tax_total: number; post_tax_total: number }[];
    by_employee: { employee_name: string; total_deductions: number }[];
    total_pre_tax: number;
    total_post_tax: number;
  }> {
    try {
      // Get all paid payroll runs in the date range
      const { data: runs, error: runsError } = await supabase
        .from('payroll_runs')
        .select(`
          id,
          payroll_details(
            total_deductions,
            profiles(full_name)
          )
        `)
        .gte('period_start_date', startDate)
        .lte('period_end_date', endDate)
        .eq('status', 'paid');

      if (runsError) throw runsError;

      // Get deduction definitions
      const { data: deductions, error: dedError } = await supabase
        .from('payroll_deductions')
        .select('*')
        .eq('is_active', true);

      if (dedError) throw dedError;

      // Calculate by type (approximate based on deduction definitions)
      const byType: Record<string, { pre_tax: number; post_tax: number }> = {};
      let totalPreTax = 0;
      let totalPostTax = 0;

      for (const ded of deductions || []) {
        if (!byType[ded.deduction_type]) {
          byType[ded.deduction_type] = { pre_tax: 0, post_tax: 0 };
        }
      }

      // Calculate by employee
      const byEmployee: Record<string, number> = {};

      for (const run of runs || []) {
        for (const detail of run.payroll_details || []) {
          const employeeName = (detail as { profiles?: { full_name?: string } }).profiles?.full_name || 'Unknown';
          byEmployee[employeeName] = (byEmployee[employeeName] || 0) + (detail.total_deductions || 0);
        }
      }

      // Estimate pre-tax vs post-tax split
      const totalDeductions = Object.values(byEmployee).reduce((sum, val) => sum + val, 0);
      totalPreTax = totalDeductions * 0.7; // Approximate
      totalPostTax = totalDeductions * 0.3;

      return {
        by_type: Object.entries(byType).map(([type, data]) => ({
          type,
          pre_tax_total: data.pre_tax,
          post_tax_total: data.post_tax,
        })),
        by_employee: Object.entries(byEmployee).map(([employee_name, total_deductions]) => ({
          employee_name,
          total_deductions,
        })),
        total_pre_tax: totalPreTax,
        total_post_tax: totalPostTax,
      };
    } catch (error) {
      console.error('Error fetching deductions report:', error);
      return {
        by_type: [],
        by_employee: [],
        total_pre_tax: 0,
        total_post_tax: 0,
      };
    }
  }

  // ========== PAY STUB METHODS ==========

  /**
   * Get pay stubs with filters
   */
  static async getPayStubs(filters: PayrollFilters = {}): Promise<PayStub[]> {
    try {
      let query = supabase
        .from('payroll_details')
        .select(`
          *,
          profiles(full_name),
          payroll_runs!inner(
            run_number,
            period_start_date,
            period_end_date,
            pay_date,
            status
          )
        `)
        .eq('payroll_runs.status', 'paid')
        .order('payroll_runs(pay_date)', { ascending: false });

      if (filters.employeeId) {
        query = query.eq('user_id', filters.employeeId);
      }

      if (filters.startDate) {
        query = query.gte('payroll_runs.period_start_date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('payroll_runs.period_end_date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((detail) => {
        const runData = detail.payroll_runs as unknown as {
          run_number: string;
          period_start_date: string;
          period_end_date: string;
          pay_date: string;
        };

        return {
          id: detail.id,
          payroll_run_id: detail.payroll_run_id,
          run_number: runData.run_number,
          period_start_date: runData.period_start_date,
          period_end_date: runData.period_end_date,
          pay_date: runData.pay_date,
          employee_name: detail.profiles?.full_name || 'Unknown',
          employee_id: detail.user_id,
          regular_hours: detail.regular_hours || 0,
          overtime_hours: detail.overtime_hours || 0,
          regular_pay: detail.regular_pay || 0,
          overtime_pay: detail.overtime_pay || 0,
          gross_pay: detail.gross_pay || 0,
          total_deductions: detail.total_deductions || 0,
          net_pay: detail.net_pay || 0,
        };
      });
    } catch (error) {
      console.error('Error fetching pay stubs:', error);
      return [];
    }
  }

  /**
   * Get a single pay stub by payroll detail ID
   */
  static async getPayStubById(payrollDetailId: string): Promise<PayStub | null> {
    try {
      const { data, error } = await supabase
        .from('payroll_details')
        .select(`
          *,
          profiles(full_name),
          payroll_runs(
            run_number,
            period_start_date,
            period_end_date,
            pay_date
          )
        `)
        .eq('id', payrollDetailId)
        .single();

      if (error) throw error;

      const runData = data.payroll_runs as unknown as {
        run_number: string;
        period_start_date: string;
        period_end_date: string;
        pay_date: string;
      };

      return {
        id: data.id,
        payroll_run_id: data.payroll_run_id,
        run_number: runData.run_number,
        period_start_date: runData.period_start_date,
        period_end_date: runData.period_end_date,
        pay_date: runData.pay_date,
        employee_name: data.profiles?.full_name || 'Unknown',
        employee_id: data.user_id,
        regular_hours: data.regular_hours || 0,
        overtime_hours: data.overtime_hours || 0,
        regular_pay: data.regular_pay || 0,
        overtime_pay: data.overtime_pay || 0,
        gross_pay: data.gross_pay || 0,
        total_deductions: data.total_deductions || 0,
        net_pay: data.net_pay || 0,
      };
    } catch (error) {
      console.error('Error fetching pay stub:', error);
      return null;
    }
  }

  /**
   * Get YTD totals for an employee
   */
  static async getEmployeeYTDTotals(
    userId: string,
    asOfDate: string
  ): Promise<YTDTotals> {
    try {
      const yearStart = `${new Date(asOfDate).getFullYear()}-01-01`;

      const { data, error } = await supabase
        .from('payroll_details')
        .select(`
          gross_pay,
          net_pay,
          regular_hours,
          overtime_hours,
          total_deductions,
          payroll_runs!inner(status, period_start_date)
        `)
        .eq('user_id', userId)
        .gte('payroll_runs.period_start_date', yearStart)
        .lte('payroll_runs.period_start_date', asOfDate)
        .eq('payroll_runs.status', 'paid');

      if (error) throw error;

      const totals: YTDTotals = {
        total_gross_pay: 0,
        total_net_pay: 0,
        total_regular_hours: 0,
        total_overtime_hours: 0,
        total_deductions: 0,
        federal_tax_ytd: 0,
        state_tax_ytd: 0,
        fica_ytd: 0,
        medicare_ytd: 0,
      };

      for (const detail of data || []) {
        totals.total_gross_pay += detail.gross_pay || 0;
        totals.total_net_pay += detail.net_pay || 0;
        totals.total_regular_hours += detail.regular_hours || 0;
        totals.total_overtime_hours += detail.overtime_hours || 0;
        totals.total_deductions += detail.total_deductions || 0;
      }

      // Estimate tax breakdowns (would need actual deduction details for accuracy)
      totals.federal_tax_ytd = totals.total_gross_pay * 0.22;
      totals.state_tax_ytd = totals.total_gross_pay * 0.05;
      totals.fica_ytd = totals.total_gross_pay * 0.062;
      totals.medicare_ytd = totals.total_gross_pay * 0.0145;

      return totals;
    } catch (error) {
      console.error('Error fetching YTD totals:', error);
      return {
        total_gross_pay: 0,
        total_net_pay: 0,
        total_regular_hours: 0,
        total_overtime_hours: 0,
        total_deductions: 0,
        federal_tax_ytd: 0,
        state_tax_ytd: 0,
        fica_ytd: 0,
        medicare_ytd: 0,
      };
    }
  }

  // ========== GL INTEGRATION METHODS ==========

  /**
   * Post payroll to General Ledger
   * Debit: Wages Expense (gross pay)
   * Credit: Cash (net pay)
   * Credit: Payroll Liabilities (deductions)
   */
  static async postPayrollToGL(
    runId: string,
    userId: string
  ): Promise<{ success: boolean; entry_ids?: string[]; error?: string }> {
    try {
      // Get the payroll run
      const { data: run, error: runError } = await supabase
        .from('payroll_runs')
        .select('*')
        .eq('id', runId)
        .single();

      if (runError) throw runError;

      if (run.gl_posted) {
        return { success: false, error: 'Payroll already posted to GL' };
      }

      if (run.status !== 'paid') {
        return { success: false, error: 'Payroll must be paid before posting to GL' };
      }

      // Get GL accounts for payroll
      const glAccounts = await this.getPayrollGLAccounts();

      if (!glAccounts.wages_expense || !glAccounts.cash || !glAccounts.payroll_liabilities) {
        return { success: false, error: 'GL accounts not configured for payroll' };
      }

      const entryIds: string[] = [];
      const entryDate = run.pay_date;
      const fiscalYear = new Date(entryDate).getFullYear();
      const fiscalPeriod = new Date(entryDate).getMonth() + 1;

      // Generate entry number
      const { data: lastEntry } = await supabase
        .from('gl_entries')
        .select('entry_number')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let entryNum = 1;
      if (lastEntry?.entry_number) {
        const match = lastEntry.entry_number.match(/\d+$/);
        if (match) {
          entryNum = parseInt(match[0]) + 1;
        }
      }

      // Create debit entry for Wages Expense
      const { data: debitEntry, error: debitError } = await supabase
        .from('gl_entries')
        .insert({
          entry_number: `JE-${fiscalYear}-${String(entryNum).padStart(6, '0')}`,
          entry_date: entryDate,
          account_id: glAccounts.wages_expense,
          debit_amount: run.total_gross_pay || 0,
          credit_amount: 0,
          description: `Payroll ${run.run_number} - Wages Expense`,
          reference_type: 'payroll',
          reference_id: runId,
          fiscal_year: fiscalYear,
          fiscal_period: fiscalPeriod,
          posted_by: userId,
          is_posted: true,
        })
        .select()
        .single();

      if (debitError) throw debitError;
      entryIds.push(debitEntry.id);
      entryNum++;

      // Create credit entry for Cash (net pay)
      const { data: cashEntry, error: cashError } = await supabase
        .from('gl_entries')
        .insert({
          entry_number: `JE-${fiscalYear}-${String(entryNum).padStart(6, '0')}`,
          entry_date: entryDate,
          account_id: glAccounts.cash,
          debit_amount: 0,
          credit_amount: run.total_net_pay || 0,
          description: `Payroll ${run.run_number} - Net Pay`,
          reference_type: 'payroll',
          reference_id: runId,
          fiscal_year: fiscalYear,
          fiscal_period: fiscalPeriod,
          posted_by: userId,
          is_posted: true,
        })
        .select()
        .single();

      if (cashError) throw cashError;
      entryIds.push(cashEntry.id);
      entryNum++;

      // Create credit entry for Payroll Liabilities (deductions)
      const { data: liabEntry, error: liabError } = await supabase
        .from('gl_entries')
        .insert({
          entry_number: `JE-${fiscalYear}-${String(entryNum).padStart(6, '0')}`,
          entry_date: entryDate,
          account_id: glAccounts.payroll_liabilities,
          debit_amount: 0,
          credit_amount: run.total_deductions || 0,
          description: `Payroll ${run.run_number} - Payroll Liabilities`,
          reference_type: 'payroll',
          reference_id: runId,
          fiscal_year: fiscalYear,
          fiscal_period: fiscalPeriod,
          posted_by: userId,
          is_posted: true,
        })
        .select()
        .single();

      if (liabError) throw liabError;
      entryIds.push(liabEntry.id);

      // Mark payroll run as posted
      const { error: updateError } = await supabase
        .from('payroll_runs')
        .update({ gl_posted: true })
        .eq('id', runId);

      if (updateError) throw updateError;

      return { success: true, entry_ids: entryIds };
    } catch (error) {
      console.error('Error posting payroll to GL:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Get GL account IDs for payroll posting
   */
  static async getPayrollGLAccounts(): Promise<{
    wages_expense: string | null;
    cash: string | null;
    payroll_liabilities: string | null;
    federal_tax_payable: string | null;
    state_tax_payable: string | null;
    fica_payable: string | null;
    medicare_payable: string | null;
  }> {
    try {
      // Look up standard accounts by account code
      const accountCodes = [
        '5000', // Wages Expense
        '1000', // Cash
        '2100', // Federal Tax Payable
        '2110', // State Tax Payable
        '2120', // FICA Payable
        '2130', // Medicare Payable
        '2000', // General Payroll Liabilities
      ];

      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code')
        .in('account_code', accountCodes);

      if (error) throw error;

      const accountMap = new Map((data || []).map((a) => [a.account_code, a.id]));

      return {
        wages_expense: accountMap.get('5000') || null,
        cash: accountMap.get('1000') || null,
        payroll_liabilities: accountMap.get('2000') || accountMap.get('2100') || null,
        federal_tax_payable: accountMap.get('2100') || null,
        state_tax_payable: accountMap.get('2110') || null,
        fica_payable: accountMap.get('2120') || null,
        medicare_payable: accountMap.get('2130') || null,
      };
    } catch (error) {
      console.error('Error fetching GL accounts:', error);
      return {
        wages_expense: null,
        cash: null,
        payroll_liabilities: null,
        federal_tax_payable: null,
        state_tax_payable: null,
        fica_payable: null,
        medicare_payable: null,
      };
    }
  }
}
