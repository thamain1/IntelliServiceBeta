import { useEffect, useState } from 'react';
import { Plus, Edit2, X, Users, DollarSign, Percent, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PayrollService } from '../../services/PayrollService';
import type { Database } from '../../lib/database.types';

type PayrollDeduction = Database['public']['Tables']['payroll_deductions']['Row'];
type EmployeeDeduction = Database['public']['Tables']['employee_deductions']['Row'];

interface EmployeeDeductionWithDetails extends EmployeeDeduction {
  payroll_deductions?: PayrollDeduction;
}

interface Employee {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export function EmployeeDeductionsView() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [deductions, setDeductions] = useState<PayrollDeduction[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [employeeDeductions, setEmployeeDeductions] = useState<EmployeeDeductionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeduction, setEditingDeduction] = useState<EmployeeDeductionWithDetails | null>(null);

  const [formData, setFormData] = useState({
    deduction_id: '',
    amount: 0,
    is_active: true,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadEmployeeDeductions(selectedEmployee);
    }
  }, [selectedEmployee]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [employeesData, deductionsData] = await Promise.all([
        loadEmployees(),
        PayrollService.getPayrollDeductions(),
      ]);
      setEmployees(employeesData);
      setDeductions(deductionsData);

      if (employeesData.length > 0) {
        setSelectedEmployee(employeesData[0].id);
      }
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

  const loadEmployeeDeductions = async (userId: string) => {
    const data = await PayrollService.getEmployeeDeductions(userId);
    setEmployeeDeductions(data);
  };

  const handleOpenModal = (empDeduction?: EmployeeDeductionWithDetails) => {
    if (empDeduction) {
      setEditingDeduction(empDeduction);
      setFormData({
        deduction_id: empDeduction.deduction_id,
        amount: empDeduction.amount || 0,
        is_active: empDeduction.is_active ?? true,
      });
    } else {
      setEditingDeduction(null);
      setFormData({
        deduction_id: '',
        amount: 0,
        is_active: true,
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEmployee) return;

    try {
      await PayrollService.upsertEmployeeDeduction({
        id: editingDeduction?.id,
        user_id: selectedEmployee,
        deduction_id: formData.deduction_id,
        amount: formData.amount,
        is_active: formData.is_active,
      });

      setShowModal(false);
      loadEmployeeDeductions(selectedEmployee);
    } catch (error) {
      console.error('Error saving employee deduction:', error);
      alert('Failed to save deduction override. Please try again.');
    }
  };

  const toggleDeductionActive = async (empDeduction: EmployeeDeductionWithDetails) => {
    if (!selectedEmployee) return;

    try {
      await PayrollService.upsertEmployeeDeduction({
        id: empDeduction.id,
        user_id: selectedEmployee,
        deduction_id: empDeduction.deduction_id,
        is_active: !empDeduction.is_active,
      });

      loadEmployeeDeductions(selectedEmployee);
    } catch (error) {
      console.error('Error toggling deduction:', error);
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

  // Get deductions that haven't been customized for this employee
  const availableDeductions = deductions.filter(
    (ded) => !employeeDeductions.some((ed) => ed.deduction_id === ded.id)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedEmployeeData = employees.find((e) => e.id === selectedEmployee);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Deductions</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configure employee-specific deduction overrides
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Employee List */}
        <div className="card p-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            Employees
          </h3>
          <div className="space-y-1">
            {employees.map((employee) => (
              <button
                key={employee.id}
                onClick={() => setSelectedEmployee(employee.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  selectedEmployee === employee.id
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="font-medium">{employee.full_name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                  {employee.role}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Deductions Panel */}
        <div className="lg:col-span-3">
          {selectedEmployeeData ? (
            <div className="space-y-4">
              <div className="card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {selectedEmployeeData.full_name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedEmployeeData.email} - {selectedEmployeeData.role}
                    </p>
                  </div>
                  <button
                    onClick={() => handleOpenModal()}
                    className="btn btn-primary flex items-center space-x-2"
                    disabled={availableDeductions.length === 0}
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Override</span>
                  </button>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      Employee deduction overrides allow you to customize amounts for specific employees.
                      If no override is set, the default deduction amount will be used.
                    </p>
                  </div>
                </div>
              </div>

              {/* Standard Deductions */}
              <div className="card overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white">All Deductions</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Deductions with custom amounts are highlighted
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Deduction
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Default Amount
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Custom Amount
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {deductions.map((deduction) => {
                        const override = employeeDeductions.find(
                          (ed) => ed.deduction_id === deduction.id
                        );
                        const hasOverride = !!override;

                        return (
                          <tr
                            key={deduction.id}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                              hasOverride ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                            }`}
                          >
                            <td className="px-6 py-4">
                              <span className="font-medium text-gray-900 dark:text-white">
                                {deduction.deduction_name}
                              </span>
                              {hasOverride && (
                                <span className="ml-2 badge badge-yellow text-xs">Custom</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`badge ${getDeductionTypeColor(deduction.deduction_type)}`}>
                                {deduction.deduction_type}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span className="text-gray-600 dark:text-gray-400 flex items-center justify-end">
                                {deduction.calculation_method === 'percentage' ? (
                                  <>
                                    <Percent className="w-3 h-3 mr-1" />
                                    {deduction.default_amount}%
                                  </>
                                ) : (
                                  <>
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    {deduction.default_amount.toFixed(2)}
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {hasOverride ? (
                                <span className="font-medium text-yellow-600 dark:text-yellow-400 flex items-center justify-end">
                                  {deduction.calculation_method === 'percentage' ? (
                                    <>
                                      <Percent className="w-3 h-3 mr-1" />
                                      {override?.amount}%
                                    </>
                                  ) : (
                                    <>
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      {(override?.amount || 0).toFixed(2)}
                                    </>
                                  )}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">—</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {hasOverride ? (
                                <button
                                  onClick={() => toggleDeductionActive(override!)}
                                  className={`badge cursor-pointer ${
                                    override?.is_active ? 'badge-green' : 'badge-red'
                                  }`}
                                >
                                  {override?.is_active ? 'Active' : 'Inactive'}
                                </button>
                              ) : (
                                <span className={`badge ${deduction.is_active ? 'badge-green' : 'badge-red'}`}>
                                  {deduction.is_active ? 'Active' : 'Inactive'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right">
                              {hasOverride ? (
                                <button
                                  onClick={() => handleOpenModal(override)}
                                  className="btn btn-outline p-2"
                                  title="Edit Override"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setFormData({
                                      deduction_id: deduction.id,
                                      amount: deduction.default_amount,
                                      is_active: true,
                                    });
                                    setEditingDeduction(null);
                                    setShowModal(true);
                                  }}
                                  className="btn btn-outline p-2"
                                  title="Add Override"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center text-gray-500 dark:text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Select an employee to manage their deductions</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Override Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingDeduction ? 'Edit Deduction Override' : 'Add Deduction Override'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Deduction *
                </label>
                <select
                  required
                  value={formData.deduction_id}
                  onChange={(e) => {
                    const ded = deductions.find((d) => d.id === e.target.value);
                    setFormData({
                      ...formData,
                      deduction_id: e.target.value,
                      amount: ded?.default_amount || 0,
                    });
                  }}
                  className="input"
                  disabled={!!editingDeduction}
                >
                  <option value="">Select Deduction</option>
                  {(editingDeduction ? deductions : availableDeductions).map((ded) => (
                    <option key={ded.id} value={ded.id}>
                      {ded.deduction_name} ({ded.deduction_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Custom Amount *
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
                {formData.deduction_id && (
                  <p className="text-xs text-gray-500 mt-1">
                    {deductions.find((d) => d.id === formData.deduction_id)?.calculation_method === 'percentage'
                      ? 'Enter percentage value (e.g., 5 for 5%)'
                      : 'Enter fixed dollar amount'}
                  </p>
                )}
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Inactive overrides will use the default deduction amount
                </p>
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
                  {editingDeduction ? 'Update Override' : 'Create Override'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
