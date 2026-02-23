import { useEffect, useState, useCallback } from 'react';
import { Download, Calendar, AlertCircle, DollarSign, PieChart } from 'lucide-react';
import { PayrollService } from '../../../services/PayrollService';
import { ExportService, ExportData, ExportFormat } from '../../../services/ExportService';

interface DeductionsReportData {
  by_type: { type: string; pre_tax_total: number; post_tax_total: number }[];
  by_employee: { employee_name: string; total_deductions: number }[];
  total_pre_tax: number;
  total_post_tax: number;
}

export function DeductionsReport() {
  const [deductionsData, setDeductionsData] = useState<DeductionsReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(0);
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'type' | 'employee'>('type');

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PayrollService.getDeductionsReport(startDate, endDate);
      setDeductionsData(data);
    } catch (error) {
      console.error('Error loading deductions report:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExport = (format: ExportFormat) => {
    if (!deductionsData) return;

    const exportData: ExportData = {
      title: 'Deductions Report',
      subtitle: viewMode === 'type' ? 'By deduction type' : 'By employee',
      dateRange: { start: new Date(startDate), end: new Date(endDate) },
      columns: viewMode === 'type'
        ? [
            { header: 'Deduction Type', key: 'type' },
            { header: 'Pre-Tax Total', key: 'pre_tax_total', format: 'currency' },
            { header: 'Post-Tax Total', key: 'post_tax_total', format: 'currency' },
          ]
        : [
            { header: 'Employee', key: 'employee_name' },
            { header: 'Total Deductions', key: 'total_deductions', format: 'currency' },
          ],
      rows: viewMode === 'type' ? deductionsData.by_type : deductionsData.by_employee,
      summary: {
        total_pre_tax: deductionsData.total_pre_tax,
        total_post_tax: deductionsData.total_post_tax,
        grand_total: deductionsData.total_pre_tax + deductionsData.total_post_tax,
      },
      generatedAt: new Date(),
    };

    ExportService.export(exportData, format);
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'tax':
        return 'bg-red-100 dark:bg-red-900/20 text-red-600';
      case 'insurance':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600';
      case 'retirement':
        return 'bg-green-100 dark:bg-green-900/20 text-green-600';
      case 'garnishment':
        return 'bg-orange-100 dark:bg-orange-900/20 text-orange-600';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const totalDeductions = deductionsData
    ? deductionsData.total_pre_tax + deductionsData.total_post_tax
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-red-100 dark:bg-red-900/20 text-red-600 p-3 rounded-lg">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Deductions Report</h2>
            <p className="text-gray-600 dark:text-gray-400">Pre-tax and post-tax deductions breakdown</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-outline flex items-center space-x-2"
            disabled={!deductionsData}
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="btn btn-outline flex items-center space-x-2"
            disabled={!deductionsData}
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-gray-400" />
            <div className="flex items-center space-x-2">
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
            <button onClick={loadReport} className="btn btn-primary">
              Apply
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode('type')}
              className={`btn ${viewMode === 'type' ? 'btn-primary' : 'btn-outline'}`}
            >
              By Type
            </button>
            <button
              onClick={() => setViewMode('employee')}
              className={`btn ${viewMode === 'employee' ? 'btn-primary' : 'btn-outline'}`}
            >
              By Employee
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : deductionsData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Pre-Tax Deductions</p>
                  <p className="text-xl font-bold text-green-600">
                    ${deductionsData.total_pre_tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {totalDeductions > 0 ? ((deductionsData.total_pre_tax / totalDeductions) * 100).toFixed(1) : 0}% of total
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-600 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Post-Tax Deductions</p>
                  <p className="text-xl font-bold text-orange-600">
                    ${deductionsData.total_post_tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {totalDeductions > 0 ? ((deductionsData.total_post_tax / totalDeductions) * 100).toFixed(1) : 0}% of total
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 rounded-lg">
                  <PieChart className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Deductions</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    ${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data Tables */}
          {viewMode === 'type' ? (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Deductions by Type</h3>
              </div>
              {deductionsData.by_type.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No deduction data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Pre-Tax Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Post-Tax Total
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Combined Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {deductionsData.by_type.map((type, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4">
                            <span className={`badge capitalize ${getTypeColor(type.type)}`}>
                              {type.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-green-600">
                            ${type.pre_tax_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right text-orange-600">
                            ${type.post_tax_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                            ${(type.pre_tax_total + type.post_tax_total).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">Totals</td>
                        <td className="px-6 py-4 text-right font-bold text-green-600">
                          ${deductionsData.total_pre_tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-orange-600">
                          ${deductionsData.total_post_tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">
                          ${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Deductions by Employee</h3>
              </div>
              {deductionsData.by_employee.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No deduction data available</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total Deductions
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          % of Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {deductionsData.by_employee
                        .sort((a, b) => b.total_deductions - a.total_deductions)
                        .map((emp, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                              {emp.employee_name}
                            </td>
                            <td className="px-6 py-4 text-right text-red-600">
                              ${emp.total_deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                              {totalDeductions > 0
                                ? ((emp.total_deductions / totalDeductions) * 100).toFixed(1)
                                : 0}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">Total</td>
                        <td className="px-6 py-4 text-right font-bold text-red-600">
                          ${totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-gray-600 dark:text-gray-400">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No deductions data available</p>
        </div>
      )}
    </div>
  );
}
