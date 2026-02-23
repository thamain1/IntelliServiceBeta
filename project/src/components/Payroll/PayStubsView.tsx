import { useEffect, useState, useCallback } from 'react';
import { Download, FileText, Calendar, Users, Eye, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PayrollService, PayStub, YTDTotals } from '../../services/PayrollService';
import { PayStubPDF } from './PayStubPDF';

export function PayStubsView() {
  const [payStubs, setPayStubs] = useState<PayStub[]>([]);
  const [employees, setEmployees] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStub, setSelectedStub] = useState<PayStub | null>(null);
  const [ytdTotals, setYtdTotals] = useState<YTDTotals | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Filters
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('role', ['technician', 'dispatcher'])
          .order('full_name', { ascending: true });

        if (error) throw error;
        setEmployees(data || []);
      } catch (error) {
        console.error('Error loading employees:', error);
      }
    };
    loadInitialData();
  }, []);

  const loadPayStubs = useCallback(async () => {
    setLoading(true);
    try {
      const stubs = await PayrollService.getPayStubs({
        employeeId: selectedEmployee || undefined,
        startDate,
        endDate,
      });
      setPayStubs(stubs);
    } catch (error) {
      console.error('Error loading pay stubs:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedEmployee, startDate, endDate]);

  useEffect(() => {
    loadPayStubs();
  }, [loadPayStubs]);

  const handleViewStub = async (stub: PayStub) => {
    setSelectedStub(stub);

    // Load YTD totals for this employee
    const totals = await PayrollService.getEmployeeYTDTotals(
      stub.employee_id,
      stub.pay_date
    );
    setYtdTotals(totals);
    setShowPreview(true);
  };

  const handleDownloadPDF = (stub: PayStub) => {
    PayStubPDF.generatePDF(stub, ytdTotals);
  };

  // Group stubs by employee
  const groupedStubs = payStubs.reduce((acc, stub) => {
    if (!acc[stub.employee_name]) {
      acc[stub.employee_name] = [];
    }
    acc[stub.employee_name].push(stub);
    return acc;
  }, {} as Record<string, PayStub[]>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Pay Stubs</h2>
            <p className="text-gray-600 dark:text-gray-400">View and download individual pay stubs</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-gray-400" />
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="input w-48"
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.full_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input"
            />
          </div>

          <button onClick={loadPayStubs} className="btn btn-primary">
            Apply Filters
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Stubs</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{payStubs.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Gross Pay</p>
          <p className="text-2xl font-bold text-green-600">
            ${payStubs.reduce((sum, s) => sum + s.gross_pay, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Net Pay</p>
          <p className="text-2xl font-bold text-blue-600">
            ${payStubs.reduce((sum, s) => sum + s.net_pay, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {Object.keys(groupedStubs).length}
          </p>
        </div>
      </div>

      {/* Pay Stubs List */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : payStubs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No pay stubs found for the selected criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pay Period
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pay Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hours
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {payStubs.map((stub) => (
                  <tr key={stub.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {stub.employee_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {new Date(stub.period_start_date).toLocaleDateString()} - {new Date(stub.period_end_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      {new Date(stub.pay_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-900 dark:text-white">{stub.regular_hours.toFixed(1)}</span>
                      {stub.overtime_hours > 0 && (
                        <span className="text-purple-600 ml-1">(+{stub.overtime_hours.toFixed(1)} OT)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      ${stub.gross_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-red-600">
                      ${stub.total_deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-blue-600">
                      ${stub.net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewStub(stub)}
                          className="btn btn-outline p-2"
                          title="View Pay Stub"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedStub(stub);
                            PayStubPDF.generatePDF(stub, null);
                          }}
                          className="btn btn-outline p-2"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedStub && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Pay Stub - {selectedStub.run_number}
              </h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDownloadPDF(selectedStub)}
                  className="btn btn-primary flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Header */}
              <div className="text-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  IntelliService - Pay Statement
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Pay Period: {new Date(selectedStub.period_start_date).toLocaleDateString()} - {new Date(selectedStub.period_end_date).toLocaleDateString()}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Pay Date: {new Date(selectedStub.pay_date).toLocaleDateString()}
                </p>
              </div>

              {/* Employee Info */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Employee Information</h4>
                <p className="text-gray-700 dark:text-gray-300">{selectedStub.employee_name}</p>
              </div>

              {/* Earnings */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Earnings</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div className="font-medium text-gray-600 dark:text-gray-400">Description</div>
                    <div className="font-medium text-gray-600 dark:text-gray-400 text-right">Hours</div>
                    <div className="font-medium text-gray-600 dark:text-gray-400 text-right">Rate</div>
                    <div className="font-medium text-gray-600 dark:text-gray-400 text-right">Amount</div>

                    <div className="text-gray-900 dark:text-white">Regular Pay</div>
                    <div className="text-gray-900 dark:text-white text-right">{selectedStub.regular_hours.toFixed(2)}</div>
                    <div className="text-gray-900 dark:text-white text-right">
                      ${selectedStub.regular_hours > 0 ? (selectedStub.regular_pay / selectedStub.regular_hours).toFixed(2) : '0.00'}
                    </div>
                    <div className="text-gray-900 dark:text-white text-right">${selectedStub.regular_pay.toFixed(2)}</div>

                    {selectedStub.overtime_hours > 0 && (
                      <>
                        <div className="text-gray-900 dark:text-white">Overtime Pay</div>
                        <div className="text-gray-900 dark:text-white text-right">{selectedStub.overtime_hours.toFixed(2)}</div>
                        <div className="text-gray-900 dark:text-white text-right">
                          ${selectedStub.overtime_hours > 0 ? (selectedStub.overtime_pay / selectedStub.overtime_hours).toFixed(2) : '0.00'}
                        </div>
                        <div className="text-gray-900 dark:text-white text-right">${selectedStub.overtime_pay.toFixed(2)}</div>
                      </>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-900 dark:text-white">Gross Pay</span>
                      <span className="text-green-600">${selectedStub.gross_pay.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="mb-6">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Deductions</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600 dark:text-gray-400">Total Deductions</span>
                    <span className="text-red-600">${selectedStub.total_deductions.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">Net Pay</span>
                  <span className="text-2xl font-bold text-blue-600">${selectedStub.net_pay.toFixed(2)}</span>
                </div>
              </div>

              {/* YTD Summary */}
              {ytdTotals && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Year-to-Date Summary</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">YTD Gross</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${ytdTotals.total_gross_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">YTD Net</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ${ytdTotals.total_net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">YTD Hours</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ytdTotals.total_regular_hours.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">YTD OT Hours</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ytdTotals.total_overtime_hours.toFixed(1)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
