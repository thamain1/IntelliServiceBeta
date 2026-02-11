import { useState } from 'react';
import { Download, FileText, Table, FileSpreadsheet, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { PayrollService } from '../../../services/PayrollService';
import { ExportService, ExportData, ExportFormat } from '../../../services/ExportService';

type ExportType = 'summary' | 'details' | 'tax' | 'earnings' | 'deductions' | 'stubs';

interface ExportOption {
  id: ExportType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export function PayrollExportView() {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(0);
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedExports, setSelectedExports] = useState<ExportType[]>([]);
  const [exporting, setExporting] = useState(false);
  const [exportResults, setExportResults] = useState<{ type: ExportType; success: boolean }[]>([]);

  const exportOptions: ExportOption[] = [
    {
      id: 'summary',
      label: 'Payroll Summary',
      description: 'Period-by-period summary of all payroll runs',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'details',
      label: 'Payroll Details',
      description: 'Detailed breakdown of each payroll run with employee data',
      icon: <Table className="w-5 h-5" />,
    },
    {
      id: 'tax',
      label: 'Tax Report',
      description: 'Federal, state, and FICA tax withholdings',
      icon: <FileSpreadsheet className="w-5 h-5" />,
    },
    {
      id: 'earnings',
      label: 'Employee Earnings',
      description: 'YTD earnings breakdown by employee',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'deductions',
      label: 'Deductions Report',
      description: 'All deductions by type and employee',
      icon: <FileText className="w-5 h-5" />,
    },
    {
      id: 'stubs',
      label: 'Pay Stubs',
      description: 'Individual pay stub data for all employees',
      icon: <FileText className="w-5 h-5" />,
    },
  ];

  const toggleExport = (type: ExportType) => {
    setSelectedExports((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const selectAll = () => {
    setSelectedExports(exportOptions.map((o) => o.id));
  };

  const clearAll = () => {
    setSelectedExports([]);
  };

  const handleExport = async (format: ExportFormat) => {
    if (selectedExports.length === 0) {
      alert('Please select at least one report to export');
      return;
    }

    setExporting(true);
    setExportResults([]);

    const results: { type: ExportType; success: boolean }[] = [];

    for (const exportType of selectedExports) {
      try {
        let exportData: ExportData | null = null;

        switch (exportType) {
          case 'summary': {
            const summaryData = await PayrollService.getPayrollSummaryReport(startDate, endDate);
            exportData = {
              title: 'Payroll Summary Report',
              dateRange: { start: new Date(startDate), end: new Date(endDate) },
              columns: [
                { header: 'Period Start', key: 'period_start', format: 'date' },
                { header: 'Period End', key: 'period_end', format: 'date' },
                { header: 'Employees', key: 'employee_count' },
                { header: 'Gross Pay', key: 'total_gross_pay', format: 'currency' },
                { header: 'Deductions', key: 'total_deductions', format: 'currency' },
                { header: 'Net Pay', key: 'total_net_pay', format: 'currency' },
              ],
              rows: summaryData,
              generatedAt: new Date(),
            };
            break;
          }

          case 'details': {
            const runs = await PayrollService.getPayrollRuns({ startDate, endDate });
            const allDetails: Record<string, unknown>[] = [];

            for (const run of runs) {
              const details = await PayrollService.getPayrollDetails(run.id);
              for (const detail of details) {
                allDetails.push({
                  run_number: run.run_number,
                  period: `${run.period_start_date} - ${run.period_end_date}`,
                  pay_date: run.pay_date,
                  employee: detail.profiles?.full_name || 'Unknown',
                  regular_hours: detail.regular_hours,
                  overtime_hours: detail.overtime_hours,
                  gross_pay: detail.gross_pay,
                  deductions: detail.total_deductions,
                  net_pay: detail.net_pay,
                });
              }
            }

            exportData = {
              title: 'Payroll Details Report',
              dateRange: { start: new Date(startDate), end: new Date(endDate) },
              columns: [
                { header: 'Run #', key: 'run_number' },
                { header: 'Period', key: 'period' },
                { header: 'Pay Date', key: 'pay_date', format: 'date' },
                { header: 'Employee', key: 'employee' },
                { header: 'Regular Hrs', key: 'regular_hours', format: 'number' },
                { header: 'OT Hrs', key: 'overtime_hours', format: 'number' },
                { header: 'Gross Pay', key: 'gross_pay', format: 'currency' },
                { header: 'Deductions', key: 'deductions', format: 'currency' },
                { header: 'Net Pay', key: 'net_pay', format: 'currency' },
              ],
              rows: allDetails,
              generatedAt: new Date(),
            };
            break;
          }

          case 'tax': {
            const taxData = await PayrollService.getTaxReport(startDate, endDate);
            exportData = {
              title: 'Tax Withholdings Report',
              dateRange: { start: new Date(startDate), end: new Date(endDate) },
              columns: [
                { header: 'Quarter', key: 'quarter' },
                { header: 'Federal Tax', key: 'federal', format: 'currency' },
                { header: 'State Tax', key: 'state', format: 'currency' },
                { header: 'Social Security', key: 'fica', format: 'currency' },
                { header: 'Medicare', key: 'medicare', format: 'currency' },
              ],
              rows: taxData.by_quarter,
              summary: {
                total_federal: taxData.federal_tax,
                total_state: taxData.state_tax,
                total_fica: taxData.social_security,
                total_medicare: taxData.medicare,
              },
              generatedAt: new Date(),
            };
            break;
          }

          case 'earnings': {
            const earningsData = await PayrollService.getEmployeeEarningsReport(startDate, endDate);
            exportData = {
              title: 'Employee Earnings Report',
              dateRange: { start: new Date(startDate), end: new Date(endDate) },
              columns: [
                { header: 'Employee', key: 'employee_name' },
                { header: 'Pay Periods', key: 'pay_periods' },
                { header: 'Regular Hours', key: 'total_hours', format: 'number' },
                { header: 'OT Hours', key: 'total_ot_hours', format: 'number' },
                { header: 'Gross Pay', key: 'total_gross', format: 'currency' },
                { header: 'Net Pay', key: 'total_net', format: 'currency' },
              ],
              rows: earningsData,
              generatedAt: new Date(),
            };
            break;
          }

          case 'deductions': {
            const deductionsData = await PayrollService.getDeductionsReport(startDate, endDate);
            exportData = {
              title: 'Deductions Report',
              dateRange: { start: new Date(startDate), end: new Date(endDate) },
              columns: [
                { header: 'Employee', key: 'employee_name' },
                { header: 'Total Deductions', key: 'total_deductions', format: 'currency' },
              ],
              rows: deductionsData.by_employee,
              summary: {
                total_pre_tax: deductionsData.total_pre_tax,
                total_post_tax: deductionsData.total_post_tax,
              },
              generatedAt: new Date(),
            };
            break;
          }

          case 'stubs': {
            const stubs = await PayrollService.getPayStubs({ startDate, endDate });
            exportData = {
              title: 'Pay Stubs Export',
              dateRange: { start: new Date(startDate), end: new Date(endDate) },
              columns: [
                { header: 'Run #', key: 'run_number' },
                { header: 'Period', key: 'period_start_date', format: 'date' },
                { header: 'Pay Date', key: 'pay_date', format: 'date' },
                { header: 'Employee', key: 'employee_name' },
                { header: 'Regular Hrs', key: 'regular_hours', format: 'number' },
                { header: 'OT Hrs', key: 'overtime_hours', format: 'number' },
                { header: 'Gross Pay', key: 'gross_pay', format: 'currency' },
                { header: 'Deductions', key: 'total_deductions', format: 'currency' },
                { header: 'Net Pay', key: 'net_pay', format: 'currency' },
              ],
              rows: stubs,
              generatedAt: new Date(),
            };
            break;
          }
        }

        if (exportData) {
          ExportService.export(exportData, format);
          results.push({ type: exportType, success: true });
        }

        // Small delay between exports to prevent browser issues
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error exporting ${exportType}:`, error);
        results.push({ type: exportType, success: false });
      }
    }

    setExportResults(results);
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 p-3 rounded-lg">
            <Download className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Export Payroll Data</h2>
            <p className="text-gray-600 dark:text-gray-400">Bulk export payroll reports in multiple formats</p>
          </div>
        </div>
      </div>

      {/* Date Range */}
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
        </div>
      </div>

      {/* Export Options */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Select Reports to Export</h3>
          <div className="flex items-center space-x-2">
            <button onClick={selectAll} className="btn btn-outline text-sm">
              Select All
            </button>
            <button onClick={clearAll} className="btn btn-outline text-sm">
              Clear All
            </button>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => toggleExport(option.id)}
              className={`p-4 rounded-lg border-2 text-left transition-colors ${
                selectedExports.includes(option.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`p-2 rounded-lg ${
                    selectedExports.includes(option.id)
                      ? 'bg-blue-100 dark:bg-blue-800 text-blue-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">{option.label}</span>
                    {selectedExports.includes(option.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Export Buttons */}
      <div className="card p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedExports.length} report(s) selected
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleExport('pdf')}
              disabled={exporting || selectedExports.length === 0}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export as PDF</span>
            </button>
            <button
              onClick={() => handleExport('excel')}
              disabled={exporting || selectedExports.length === 0}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export as Excel</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              disabled={exporting || selectedExports.length === 0}
              className="btn btn-outline flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export as CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Export Status */}
      {exporting && (
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700 dark:text-gray-300">Exporting reports...</span>
          </div>
        </div>
      )}

      {/* Export Results */}
      {exportResults.length > 0 && (
        <div className="card p-4">
          <h4 className="font-medium text-gray-900 dark:text-white mb-3">Export Results</h4>
          <div className="space-y-2">
            {exportResults.map((result) => {
              const option = exportOptions.find((o) => o.id === result.type);
              return (
                <div
                  key={result.type}
                  className={`flex items-center justify-between p-2 rounded-lg ${
                    result.success
                      ? 'bg-green-50 dark:bg-green-900/20'
                      : 'bg-red-50 dark:bg-red-900/20'
                  }`}
                >
                  <span className="text-gray-700 dark:text-gray-300">{option?.label}</span>
                  {result.success ? (
                    <span className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Exported
                    </span>
                  ) : (
                    <span className="flex items-center text-red-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Failed
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
