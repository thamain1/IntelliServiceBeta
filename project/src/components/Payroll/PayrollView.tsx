import { useEffect, useState } from 'react';
import { Plus, DollarSign, Users, AlertCircle, Download, FileText, Settings, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PayrollService } from '../../services/PayrollService';
import { PayrollStatsCards } from './PayrollStatsCards';
import { PayrollRunsTable } from './PayrollRunsTable';
import { PayrollDetailsTable } from './PayrollDetailsTable';
import { NewPayPeriodModal } from './NewPayPeriodModal';
import { NewDeductionModal } from './NewDeductionModal';

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
  gl_posted?: boolean;
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

type TabType = 'periods' | 'employees' | 'deductions' | 'reports' | 'pay-rates' | 'stubs' | 'time-cost';

interface PayrollViewProps {
  initialView?: 'runs' | 'time-cost' | 'stubs' | 'pay-rates';
}

export function PayrollView({ initialView = 'runs' }: PayrollViewProps) {
  const getInitialTab = (): TabType => {
    switch (initialView) {
      case 'time-cost': return 'time-cost';
      case 'stubs': return 'stubs';
      case 'pay-rates': return 'pay-rates';
      default: return 'periods';
    }
  };

  const [activeTab, setActiveTab] = useState<TabType>(getInitialTab());
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [payrollDetails, setPayrollDetails] = useState<PayrollDetail[]>([]);
  const [deductions, setDeductions] = useState<Deduction[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string; email: string; role: string }[]>([]);
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
      setPayrollRuns(data || []);
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
      setPayrollDetails(data || []);
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
      setDeductions(data || []);
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

      const employeeHours = timeLogs?.reduce((acc: Record<string, { regular_hours: number; overtime_hours: number }>, log) => {
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

        if (hours.regular_hours > 0 || hours.overtime_hours > 0) {
          // Use PayrollService to calculate pay with actual employee rates
          const calculation = await PayrollService.calculatePayForEmployee(
            employee.id,
            hours,
            run.period_start_date
          );

          const { error: detailError } = await supabase
            .from('payroll_details')
            .insert([{
              payroll_run_id: runId,
              user_id: employee.id,
              regular_hours: calculation.regular_hours,
              overtime_hours: calculation.overtime_hours,
              regular_pay: calculation.regular_pay,
              overtime_pay: calculation.overtime_pay,
              gross_pay: calculation.gross_pay,
              total_deductions: calculation.total_deductions,
              net_pay: calculation.net_pay,
            }]);

          if (detailError) console.error('Error creating payroll detail:', detailError);

          totalGrossPay += calculation.gross_pay;
          totalDeductions += calculation.total_deductions;
          totalNetPay += calculation.net_pay;
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
          {[
            { key: 'periods', label: 'Pay Periods' },
            { key: 'employees', label: 'Employees' },
            { key: 'pay-rates', label: 'Pay Rates' },
            { key: 'deductions', label: 'Deductions' },
            { key: 'stubs', label: 'Pay Stubs' },
            { key: 'time-cost', label: 'Time & Cost' },
            { key: 'reports', label: 'Reports' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as TabType)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'periods' && (
        <div className="space-y-6">
          {selectedRun && payrollDetails.length > 0 && (
            <PayrollStatsCards
              totalEmployees={totalEmployees}
              totalGrossPay={totalGrossPay}
              totalDeductions={totalDeductions}
              totalNetPay={totalNetPay}
            />
          )}

          <PayrollRunsTable
            runs={payrollRuns}
            onViewDetails={(run) => {
              setSelectedRun(run);
              loadPayrollDetails(run.id);
            }}
            onProcessPayroll={processPayroll}
          />

          {selectedRun && payrollDetails.length > 0 && (
            <PayrollDetailsTable
              run={selectedRun}
              details={payrollDetails}
              onClose={() => setSelectedRun(null)}
            />
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

      {activeTab === 'pay-rates' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Employee Pay Rates</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Configure hourly rates, overtime rates, and compensation settings for each employee
                </p>
              </div>
              <button className="btn btn-primary flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Add Pay Rate</span>
              </button>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Settings className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    Employee pay rates are stored in the <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">employee_pay_rates</code> table.
                    This feature allows you to set individual rates that will be used when generating payroll.
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-2">
                    Employees without configured rates will use the default rate of $25/hour.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 text-center py-8 text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Pay rates configuration coming soon</p>
              <p className="text-sm">Use the EmployeePayRatesView component for full functionality</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stubs' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Pay Stubs</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View and download individual pay stubs for employees
                </p>
              </div>
              <div className="flex space-x-2">
                <select className="input w-48">
                  <option value="">All Employees</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
                <button className="btn btn-outline flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
            <div className="mt-6 text-center py-8 text-gray-500 dark:text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Pay stubs viewer coming soon</p>
              <p className="text-sm">Use the PayStubsView component for full functionality</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'time-cost' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Time & Cost Analysis</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analyze labor costs and time tracking data
                </p>
              </div>
              <div className="flex space-x-2">
                <input type="date" className="input" />
                <span className="text-gray-500 self-center">to</span>
                <input type="date" className="input" />
                <button className="btn btn-primary">Apply</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-blue-600 dark:text-blue-400">Total Hours</p>
                <p className="text-2xl font-bold text-blue-800 dark:text-blue-200">--</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-green-600 dark:text-green-400">Labor Cost</p>
                <p className="text-2xl font-bold text-green-800 dark:text-green-200">$--</p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-purple-600 dark:text-purple-400">Overtime Hours</p>
                <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">--</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <p className="text-sm text-orange-600 dark:text-orange-400">Avg Hourly Rate</p>
                <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">$--</p>
              </div>
            </div>
            <div className="mt-6 text-center py-8 text-gray-500 dark:text-gray-400">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Time & cost analysis coming soon</p>
              <p className="text-sm">Full reporting capabilities will be available in the reports section</p>
            </div>
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

      <NewPayPeriodModal
        isOpen={showPeriodModal}
        onClose={() => setShowPeriodModal(false)}
        onSubmit={handleCreatePeriod}
        formData={periodFormData}
        onChange={setPeriodFormData}
      />

      <NewDeductionModal
        isOpen={showDeductionModal}
        onClose={() => setShowDeductionModal(false)}
        onSubmit={handleCreateDeduction}
        formData={deductionFormData}
        onChange={setDeductionFormData}
      />
    </div>
  );
}
