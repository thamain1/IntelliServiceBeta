import { useEffect, useState } from 'react';
import { Plus, Edit2, History, X, DollarSign, Clock, Users, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PayrollService, EmployeePayRateWithProfile } from '../../services/PayrollService';
import type { Database } from '../../lib/database.types';

type EmployeePayRate = Database['public']['Tables']['employee_pay_rates']['Row'];

interface PayRateFormData {
  user_id: string;
  hourly_rate: number;
  overtime_rate: number;
  ot_threshold: number;
  salary_amount: number | null;
  pay_frequency: 'weekly' | 'bi_weekly' | 'semi_monthly' | 'monthly';
  effective_date: string;
  end_date: string | null;
  bonus_eligible: boolean;
  per_diem_rate: number | null;
}

export function EmployeePayRatesView() {
  const [payRates, setPayRates] = useState<EmployeePayRateWithProfile[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string; email: string; role: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [rateHistory, setRateHistory] = useState<EmployeePayRate[]>([]);
  const [editingRate, setEditingRate] = useState<EmployeePayRate | null>(null);

  const [formData, setFormData] = useState<PayRateFormData>({
    user_id: '',
    hourly_rate: 25,
    overtime_rate: 37.5,
    ot_threshold: 40,
    salary_amount: null,
    pay_frequency: 'bi_weekly',
    effective_date: new Date().toISOString().split('T')[0],
    end_date: null,
    bonus_eligible: false,
    per_diem_rate: null,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ratesData, employeesData] = await Promise.all([
        PayrollService.getAllEmployeePayRates(),
        loadEmployees(),
      ]);
      setPayRates(ratesData);
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEmployees = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .in('role', ['technician', 'dispatcher', 'admin'])
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data || [];
  };

  const loadRateHistory = async (userId: string) => {
    setSelectedEmployee(userId);
    const history = await PayrollService.getPayRateHistory(userId);
    setRateHistory(history);
    setShowHistoryModal(true);
  };

  const handleOpenModal = (rate?: EmployeePayRateWithProfile) => {
    if (rate) {
      setEditingRate(rate);
      setFormData({
        user_id: rate.user_id,
        hourly_rate: rate.hourly_rate || 25,
        overtime_rate: rate.overtime_rate || (rate.hourly_rate || 25) * 1.5,
        ot_threshold: rate.ot_threshold || 40,
        salary_amount: rate.salary_amount,
        pay_frequency: (rate.pay_frequency as PayRateFormData['pay_frequency']) || 'bi_weekly',
        effective_date: rate.effective_date,
        end_date: rate.end_date,
        bonus_eligible: rate.bonus_eligible || false,
        per_diem_rate: rate.per_diem_rate,
      });
    } else {
      setEditingRate(null);
      setFormData({
        user_id: '',
        hourly_rate: 25,
        overtime_rate: 37.5,
        ot_threshold: 40,
        salary_amount: null,
        pay_frequency: 'bi_weekly',
        effective_date: new Date().toISOString().split('T')[0],
        end_date: null,
        bonus_eligible: false,
        per_diem_rate: null,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await PayrollService.upsertEmployeePayRate({
        id: editingRate?.id,
        ...formData,
      });

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving pay rate:', error);
      alert('Failed to save pay rate. Please try again.');
    }
  };

  const handleHourlyRateChange = (value: number) => {
    setFormData({
      ...formData,
      hourly_rate: value,
      overtime_rate: value * 1.5,
    });
  };

  // Get employees without a current pay rate
  const employeesWithoutRate = employees.filter(
    (emp) => !payRates.some((rate) => rate.user_id === emp.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Pay Rates</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure hourly rates, overtime thresholds, and compensation settings
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Pay Rate</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Configured Rates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{payRates.length}</p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Hourly Rate</p>
              <p className="text-2xl font-bold text-green-600">
                ${payRates.length > 0
                  ? (payRates.reduce((sum, r) => sum + (r.hourly_rate || 0), 0) / payRates.length).toFixed(2)
                  : '0.00'}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg OT Threshold</p>
              <p className="text-2xl font-bold text-purple-600">
                {payRates.length > 0
                  ? (payRates.reduce((sum, r) => sum + (r.ot_threshold || 40), 0) / payRates.length).toFixed(0)
                  : '40'} hrs
              </p>
            </div>
            <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 p-3 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Missing Rates</p>
              <p className="text-2xl font-bold text-orange-600">{employeesWithoutRate.length}</p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-600 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Employees without rates warning */}
      {employeesWithoutRate.length > 0 && (
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800 dark:text-orange-200">
                {employeesWithoutRate.length} employee(s) without configured pay rates
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                These employees will use the default rate of $25/hour: {employeesWithoutRate.map((e) => e.full_name).join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pay Rates Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Hourly Rate
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  OT Rate
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  OT Threshold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Pay Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Effective Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Bonus Eligible
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {payRates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No pay rates configured. Click "Add Pay Rate" to create one.
                  </td>
                </tr>
              ) : (
                payRates.map((rate) => (
                  <tr key={rate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {rate.profiles?.full_name || 'Unknown'}
                        </span>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {rate.profiles?.role}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-green-600">
                        ${(rate.hourly_rate || 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-purple-600">
                        ${(rate.overtime_rate || (rate.hourly_rate || 0) * 1.5).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-900 dark:text-white">
                        {rate.ot_threshold || 40} hrs
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="badge badge-gray capitalize">
                        {(rate.pay_frequency || 'bi_weekly').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white">
                        {new Date(rate.effective_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`badge ${rate.bonus_eligible ? 'badge-green' : 'badge-gray'}`}>
                        {rate.bonus_eligible ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => loadRateHistory(rate.user_id)}
                          className="btn btn-outline p-2"
                          title="View History"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenModal(rate)}
                          className="btn btn-outline p-2"
                          title="Edit Rate"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {editingRate ? 'Edit Pay Rate' : 'Add Pay Rate'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Employee *
                  </label>
                  <select
                    required
                    value={formData.user_id}
                    onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                    className="input"
                    disabled={!!editingRate}
                  >
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.full_name} ({emp.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Hourly Rate ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.hourly_rate}
                    onChange={(e) => handleHourlyRateChange(parseFloat(e.target.value) || 0)}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Overtime Rate ($) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.overtime_rate}
                    onChange={(e) => setFormData({ ...formData, overtime_rate: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Default: 1.5x hourly rate</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    OT Threshold (hours) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    value={formData.ot_threshold}
                    onChange={(e) => setFormData({ ...formData, ot_threshold: parseInt(e.target.value) || 40 })}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Hours after which OT rate applies (default: 40)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pay Frequency *
                  </label>
                  <select
                    required
                    value={formData.pay_frequency}
                    onChange={(e) => setFormData({ ...formData, pay_frequency: e.target.value as PayRateFormData['pay_frequency'] })}
                    className="input"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="bi_weekly">Bi-Weekly</option>
                    <option value="semi_monthly">Semi-Monthly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Salary Amount (optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.salary_amount || ''}
                    onChange={(e) => setFormData({ ...formData, salary_amount: e.target.value ? parseFloat(e.target.value) : null })}
                    className="input"
                    placeholder="For salaried employees"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Per Diem Rate (optional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.per_diem_rate || ''}
                    onChange={(e) => setFormData({ ...formData, per_diem_rate: e.target.value ? parseFloat(e.target.value) : null })}
                    className="input"
                    placeholder="Daily per diem allowance"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.effective_date}
                    onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.end_date || ''}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for current rate</p>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.bonus_eligible}
                      onChange={(e) => setFormData({ ...formData, bonus_eligible: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Bonus Eligible</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  {editingRate ? 'Update Rate' : 'Create Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Pay Rate History
              </h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              {rateHistory.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                  No rate history available
                </p>
              ) : (
                <div className="space-y-4">
                  {rateHistory.map((rate, index) => (
                    <div
                      key={rate.id}
                      className={`p-4 rounded-lg border ${
                        index === 0
                          ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {index === 0 && (
                            <span className="badge badge-blue">Current</span>
                          )}
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(rate.effective_date).toLocaleDateString()}
                            {rate.end_date && ` - ${new Date(rate.end_date).toLocaleDateString()}`}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Hourly Rate</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ${(rate.hourly_rate || 0).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">OT Rate</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            ${(rate.overtime_rate || (rate.hourly_rate || 0) * 1.5).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">OT Threshold</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {rate.ot_threshold || 40} hrs
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Frequency</p>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {(rate.pay_frequency || 'bi_weekly').replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
