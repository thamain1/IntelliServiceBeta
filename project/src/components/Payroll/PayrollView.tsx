import { useEffect, useState } from 'react';
import { Plus, DollarSign, Users, CheckCircle, AlertCircle, X, Download, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type PayrollRun = {
  id: string;
  run_number: string;
  period_start_date: string;
  period_end_date: string;
  pay_date: string;
  status: string;
  total_gross_pay: number;
  total_deductions: number;
  total_net_pay: number;
  employee_count: number;
  created_at: string;
};

type PayrollDetail = {
  id: string;
  payroll_run_id: string;
  user_id: string;
  regular_hours: number;
  overtime_hours: number;
  regular_pay: number;
  overtime_pay: number;
  gross_pay: number;
  total_deductions: number;
  net_pay: number;
  profiles?: { full_name: string };
};

type Deduction = {
  id: string;
  deduction_name: string;
  deduction_type: string;
  calculation_method: string;
  default_amount: number;
  is_pre_tax: boolean;
  is_active: boolean;
};

type Employee = {
  id: string;
  full_name: string;
  role: string;
  hourly_rate?: number;
};

type EmployeeHoursAccumulator = Record<string, { regular_hours: number; overtime_hours: number }>;

export function PayrollView() {
  const [activeTab, setActiveTab] = useState<'periods' | 'employees' | 'deductions' | 'reports'>('periods');
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [payrollDetails, setPayrollDetails] = useState<PayrollDetail[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPeriodModal, setShowPeriodModal] = useState(false);
  const [showDeductionModal, setShowDeductionModal] = useState(false);
  const [selectedRun, setSelectedRun] = useState<PayrollRun | null>(null);

  const [periodFormData, setPeriodFormData] = useState({
    period_start_date: '',
    period_end_date: '',
    pay_date: '',
  });

  const [deductionFormData, setDeductionFormData] = useState({
    deduction_name: '',
    deduction_type: 'tax' as const,
    calculation_method: 'percentage' as const,
    default_amount: 0,
    is_pre_tax: true,
  });

  useEffect(() => {
    loadPayrollRuns();
    loadDeductions();
    loadEmployees();
  }, []);

  const loadPayrollRuns = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_runs')
        .select('*')
        .order('period_start_date', { ascending: false });

      if (error) throw error;
      setPayrollRuns((data as PayrollRun[]) || []);
    } catch (error) {
      console.error('Error loading payroll runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPayrollDetails = async (runId: string) => {
    try {
      const { data, error } = await supabase
        .from('payroll_details')
        .select('*, profiles(full_name)')
        .eq('payroll_run_id', runId)
        .order('profiles(full_name)', { ascending: true });

      if (error) throw error;
      setPayrollDetails((data as unknown as PayrollDetail[]) || []);
    } catch (error) {
      console.error('Error loading payroll details:', error);
    }
  };

  const loadDeductions = async () => {
    try {
      const { data, error } = await supabase
        .from('payroll_deductions')
        .select('*')
        .order('deduction_name', { ascending: true });

      if (error) throw error;
      setDeductions((data as Deduction[]) || []);
    } catch (error) {
      console.error('Error loading deductions:', error);
    }
  };

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['technician', 'dispatcher'])
        .order('full_name', { ascending: true });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const runNumber = `PR-${new Date().getFullYear()}-${String(payrollRuns.length + 1).padStart(4, '0')}`;

      const { data: run, error: runError } = await supabase
        .from('payroll_runs')
        .insert([{
          run_number: runNumber,
          period_start_date: periodFormData.period_start_date,
          period_end_date: periodFormData.period_end_date,
          pay_date: periodFormData.pay_date,
          status: 'draft',
          processed_by: userData.user.id,
        }])
        .select()
        .single();

      if (runError) throw runError;

      await generatePayrollDetails(run.id);

      setShowPeriodModal(false);
      setPeriodFormData({
        period_start_date: '',
        period_end_date: '',
        pay_date: '',
      });
      loadPayrollRuns();
    } catch (error) {
      console.error('Error creating payroll period:', error);
      alert('Failed to create payroll period. Please try again.');
    }
  };

  const generatePayrollDetails = async (runId: string) => {
    try {
      const run = payrollRuns.find(r => r.id === runId);
      if (!run) return;

      const { data: timeLogs, error: timeError } = await supabase
        .from('time_logs')
        .select('user_id, total_hours, time_type')
        .gte('clock_in_time', run.period_start_date)
        .lte('clock_in_time', run.period_end_date)
        .eq('status', 'approved');

      if (timeError) throw timeError;

      const employeeHours = timeLogs?.reduce((acc: EmployeeHoursAccumulator, log) => {
        if (!acc[log.user_id]) {
          acc[log.user_id] = {
            regular_hours: 0,
            overtime_hours: 0,
          };
        }

        if (log.time_type === 'overtime') {
          acc[log.user_id].overtime_hours += log.total_hours || 0;
        } else {
          acc[log.user_id].regular_hours += log.total_hours || 0;
        }

        return acc;
      }, {});

      let totalGrossPay = 0;
      let totalDeductions = 0;
      let totalNetPay = 0;
      let employeeCount = 0;

      for (const employee of employees) {
        const hours = employeeHours?.[employee.id] || {
          regular_hours: 0,
          overtime_hours: 0,
        };

        const hourlyRate = 25;
        const overtimeRate = hourlyRate * 1.5;
        const regularPay = hours.regular_hours * hourlyRate;
        const overtimePay = hours.overtime_hours * overtimeRate;
        const grossPay = regularPay + overtimePay;

        const totalDeductionsAmt = deductions
          .filter(d => d.is_active)
          .reduce((sum, ded) => {
            if (ded.calculation_method === 'percentage') {
              return sum + (grossPay * ded.default_amount / 100);
            }
            return sum + ded.default_amount;
          }, 0);

        const netPay = grossPay - totalDeductionsAmt;

        if (hours.regular_hours > 0 || hours.overtime_hours > 0) {
          const { error: detailError } = await supabase
            .from('payroll_details')
            .insert([{
              payroll_run_id: runId,
              user_id: employee.id,
              regular_hours: hours.regular_hours,
              overtime_hours: hours.overtime_hours,
              regular_pay: regularPay,
              overtime_pay: overtimePay,
              gross_pay: grossPay,
              total_deductions: totalDeductionsAmt,
              net_pay: netPay,
            }]);

          if (detailError) console.error('Error creating payroll detail:', detailError);

          totalGrossPay += grossPay;
          totalDeductions += totalDeductionsAmt;
          totalNetPay += netPay;
          employeeCount++;
        }
      }

      await supabase
        .from('payroll_runs')
        .update({
          total_gross_pay: totalGrossPay,
          total_deductions: totalDeductions,
          total_net_pay: totalNetPay,
          employee_count: employeeCount,
        })
        .eq('id', runId);

    } catch (error) {
      console.error('Error generating payroll details:', error);
    }
  };

  const handleCreateDeduction = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('payroll_deductions').insert([{
        ...deductionFormData,
        is_active: true,
      }]);

      if (error) throw error;

      setShowDeductionModal(false);
      setDeductionFormData({
        deduction_name: '',
        deduction_type: 'tax',
        calculation_method: 'percentage',
        default_amount: 0,
        is_pre_tax: true,
      });
      loadDeductions();
    } catch (error) {
      console.error('Error creating deduction:', error);
      alert('Failed to create deduction. Please try again.');
    }
  };

  const processPayroll = async (runId: string) => {
    if (!confirm('Are you sure you want to process this payroll? This action cannot be undone.')) {
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { error: updateError } = await supabase
        .from('payroll_runs')
        .update({
          status: 'paid',
          approved_by: userData.user.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', runId);

      if (updateError) throw updateError;

      loadPayrollRuns();
      alert('Payroll processed successfully!');
    } catch (error) {
      console.error('Error processing payroll:', error);
      alert('Failed to process payroll. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'badge-gray';
      case 'processing':
        return 'badge-yellow';
      case 'approved':
        return 'badge-blue';
      case 'paid':
        return 'badge-green';
      case 'cancelled':
        return 'badge-red';
      default:
        return 'badge-gray';
    }
  };

  const getDeductionTypeColor = (type: string) => {
    switch (type) {
      case 'tax':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'insurance':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'retirement':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'garnishment':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const totalGrossPay = payrollDetails.reduce((sum, detail) => sum + (detail.gross_pay || 0), 0);
  const totalDeductions = payrollDetails.reduce((sum, detail) => sum + (detail.total_deductions || 0), 0);
  const totalNetPay = payrollDetails.reduce((sum, detail) => sum + (detail.net_pay || 0), 0);
  const totalEmployees = payrollDetails.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Payroll</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage employee payroll and compensation
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowDeductionModal(true)}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Deduction</span>
          </button>
          <button
            onClick={() => setShowPeriodModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Pay Period</span>
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-thin">
        <nav className="flex space-x-8 min-w-max px-1">
          {['periods', 'employees', 'deductions', 'reports'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as 'periods' | 'employees' | 'deductions' | 'reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'periods' && (
        <div className="space-y-6">
          {selectedRun && payrollDetails.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                      {totalEmployees}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gross Pay</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      ${totalGrossPay.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Deductions</p>
                    <p className="text-3xl font-bold text-red-600 mt-2">
                      ${totalDeductions.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/20 text-red-600 p-3 rounded-lg">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Net Pay</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">
                      ${totalNetPay.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Run Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Pay Date
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Employees
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Net Pay
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {payrollRuns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No payroll runs found. Click "New Pay Period" to create one.
                      </td>
                    </tr>
                  ) : (
                    payrollRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {run.run_number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 dark:text-white">
                            {new Date(run.period_start_date).toLocaleDateString()} - {new Date(run.period_end_date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 dark:text-white">
                            {new Date(run.pay_date).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-gray-900 dark:text-white">
                            {run.employee_count}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${run.total_net_pay.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${getStatusColor(run.status)}`}>
                            {run.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => {
                                setSelectedRun(run);
                                loadPayrollDetails(run.id);
                              }}
                              className="btn btn-outline p-2"
                              title="View Details"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            {run.status === 'draft' && (
                              <button
                                onClick={() => processPayroll(run.id)}
                                className="btn btn-primary p-2"
                                title="Process Payroll"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {selectedRun && payrollDetails.length > 0 && (
            <div className="card overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      Payroll Details - {selectedRun.run_number}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Pay Date: {new Date(selectedRun.pay_date).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRun(null)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Regular Hours
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        OT Hours
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Gross Pay
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Deductions
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Net Pay
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {payrollDetails.map((detail) => (
                      <tr key={detail.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {detail.profiles?.full_name || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-900 dark:text-white">
                            {detail.regular_hours.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-900 dark:text-white">
                            {detail.overtime_hours.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-green-600">
                            ${detail.gross_pay.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-red-600">
                            ${detail.total_deductions.toFixed(2)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-blue-600">
                            ${detail.net_pay.toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        Totals
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                        {payrollDetails.reduce((sum, d) => sum + d.regular_hours, 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                        {payrollDetails.reduce((sum, d) => sum + d.overtime_hours, 0).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-green-600">
                        ${totalGrossPay.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-red-600">
                        ${totalDeductions.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-600">
                        ${totalNetPay.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((employee) => (
            <div key={employee.id} className="card p-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 text-blue-600 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white">{employee.full_name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{employee.role}</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="text-gray-900 dark:text-white">{employee.email}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'deductions' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Deduction Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount/Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pre-Tax
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {deductions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No deductions found. Click "New Deduction" to create one.
                    </td>
                  </tr>
                ) : (
                  deductions.map((deduction) => (
                    <tr key={deduction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {deduction.deduction_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${getDeductionTypeColor(deduction.deduction_type)}`}>
                          {deduction.deduction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white capitalize">
                          {deduction.calculation_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {deduction.calculation_method === 'percentage'
                            ? `${deduction.default_amount}%`
                            : `$${deduction.default_amount.toFixed(2)}`}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${deduction.is_pre_tax ? 'badge-green' : 'badge-gray'}`}>
                          {deduction.is_pre_tax ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-4 rounded-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Payroll Summary</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Period-by-period breakdown</p>
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-4 rounded-lg">
                <DollarSign className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tax Report</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tax withholdings and filings</p>
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 p-4 rounded-lg">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Employee Earnings</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">YTD earnings by employee</p>
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 dark:bg-red-900/20 text-red-600 p-4 rounded-lg">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Deductions Report</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">All deductions breakdown</p>
              </div>
            </div>
          </div>

          <div className="card p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 p-4 rounded-lg">
                <Download className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Export Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Download payroll data</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPeriodModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Payroll Period</h2>
              <button
                onClick={() => setShowPeriodModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePeriod} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodFormData.period_start_date}
                    onChange={(e) => setPeriodFormData({ ...periodFormData, period_start_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodFormData.period_end_date}
                    onChange={(e) => setPeriodFormData({ ...periodFormData, period_end_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pay Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={periodFormData.pay_date}
                    onChange={(e) => setPeriodFormData({ ...periodFormData, pay_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPeriodModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Period
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeductionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Deduction</h2>
              <button
                onClick={() => setShowDeductionModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateDeduction} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deduction Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={deductionFormData.deduction_name}
                    onChange={(e) => setDeductionFormData({ ...deductionFormData, deduction_name: e.target.value })}
                    className="input"
                    placeholder="e.g., Federal Income Tax"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deduction Type *
                  </label>
                  <select
                    required
                    value={deductionFormData.deduction_type}
                    onChange={(e) => setDeductionFormData({ ...deductionFormData, deduction_type: e.target.value as 'tax' | 'insurance' | 'retirement' | 'garnishment' | 'other' })}
                    className="input"
                  >
                    <option value="tax">Tax</option>
                    <option value="insurance">Insurance</option>
                    <option value="retirement">Retirement</option>
                    <option value="garnishment">Garnishment</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Calculation Method *
                  </label>
                  <select
                    required
                    value={deductionFormData.calculation_method}
                    onChange={(e) => setDeductionFormData({ ...deductionFormData, calculation_method: e.target.value as 'percentage' | 'fixed_amount' })}
                    className="input"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Fixed Amount</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {deductionFormData.calculation_method === 'percentage' ? 'Percentage (%)' : 'Fixed Amount ($)'} *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={deductionFormData.default_amount}
                    onChange={(e) => setDeductionFormData({ ...deductionFormData, default_amount: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={deductionFormData.is_pre_tax}
                      onChange={(e) => setDeductionFormData({ ...deductionFormData, is_pre_tax: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Pre-Tax Deduction</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowDeductionModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Deduction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
