import { useEffect, useState, useCallback } from 'react';
import { Download, FileText, Calendar } from 'lucide-react';
import { PayrollService, PayrollSummary } from '../../../services/PayrollService';
import { ExportService, ExportData, ExportFormat } from '../../../services/ExportService';

export function PayrollSummaryReport() {
  const [summaryData, setSummaryData] = useState<PayrollSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PayrollService.getPayrollSummaryReport(startDate, endDate);
      setSummaryData(data);
    } catch (error) {
      console.error('Error loading payroll summary:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExport = (format: ExportFormat) => {
    const exportData: ExportData = {
      title: 'Payroll Summary Report',
      subtitle: 'Period-by-period breakdown',
      dateRange: { start: new Date(startDate), end: new Date(endDate) },
      columns: [
        { header: 'Period Start', key: 'period_start', format: 'date' },
        { header: 'Period End', key: 'period_end', format: 'date' },
        { header: 'Employees', key: 'employee_count' },
        { header: 'Regular Hours', key: 'total_regular_hours', format: 'number' },
        { header: 'OT Hours', key: 'total_overtime_hours', format: 'number' },
        { header: 'Gross Pay', key: 'total_gross_pay', format: 'currency' },
        { header: 'Deductions', key: 'total_deductions', format: 'currency' },
        { header: 'Net Pay', key: 'total_net_pay', format: 'currency' },
      ],
      rows: summaryData,
      summary: {
        total_periods: summaryData.length,
        total_gross_pay: summaryData.reduce((sum, s) => sum + s.total_gross_pay, 0),
        total_net_pay: summaryData.reduce((sum, s) => sum + s.total_net_pay, 0),
        total_employees_paid: summaryData.reduce((sum, s) => sum + s.employee_count, 0),
      },
      generatedAt: new Date(),
    };

    ExportService.export(exportData, format);
  };

  const totals = {
    gross: summaryData.reduce((sum, s) => sum + s.total_gross_pay, 0),
    deductions: summaryData.reduce((sum, s) => sum + s.total_deductions, 0),
    net: summaryData.reduce((sum, s) => sum + s.total_net_pay, 0),
    regularHours: summaryData.reduce((sum, s) => sum + s.total_regular_hours, 0),
    otHours: summaryData.reduce((sum, s) => sum + s.total_overtime_hours, 0),
    employees: summaryData.reduce((sum, s) => sum + s.employee_count, 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Payroll Summary Report</h2>
            <p className="text-gray-600 dark:text-gray-400">Period-by-period breakdown of payroll costs</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="card p-4">
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
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Gross Pay</p>
          <p className="text-2xl font-bold text-green-600">${totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Deductions</p>
          <p className="text-2xl font-bold text-red-600">${totals.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Total Net Pay</p>
          <p className="text-2xl font-bold text-blue-600">${totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Regular Hours</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.regularHours.toFixed(1)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">OT Hours</p>
          <p className="text-2xl font-bold text-purple-600">{totals.otHours.toFixed(1)}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Pay Periods</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryData.length}</p>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : summaryData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No payroll data found for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Employees
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Regular Hrs
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    OT Hrs
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
                {summaryData.map((summary, index) => (
                  <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white">
                        {new Date(summary.period_start).toLocaleDateString()} - {new Date(summary.period_end).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-gray-900 dark:text-white">{summary.employee_count}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-gray-900 dark:text-white">{summary.total_regular_hours.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-purple-600">{summary.total_overtime_hours.toFixed(1)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-green-600">${summary.total_gross_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-red-600">${summary.total_deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-medium text-blue-600">${summary.total_net_pay.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">Totals</td>
                  <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">{totals.employees}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{totals.regularHours.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right font-bold text-purple-600">{totals.otHours.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">${totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right font-bold text-red-600">${totals.deductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">${totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
