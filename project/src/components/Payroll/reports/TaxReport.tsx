import { useEffect, useState } from 'react';
import { Download, FileText, Calendar, DollarSign, Building2 } from 'lucide-react';
import { PayrollService } from '../../../services/PayrollService';
import { ExportService, ExportData, ExportFormat } from '../../../services/ExportService';

interface TaxReportData {
  federal_tax: number;
  state_tax: number;
  social_security: number;
  medicare: number;
  total: number;
  by_quarter: { quarter: string; federal: number; state: number; fica: number; medicare: number }[];
}

export function TaxReport() {
  const [taxData, setTaxData] = useState<TaxReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(0);
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadReport();
  }, [startDate, endDate]);

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await PayrollService.getTaxReport(startDate, endDate);
      setTaxData(data);
    } catch (error) {
      console.error('Error loading tax report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: ExportFormat) => {
    if (!taxData) return;

    const exportData: ExportData = {
      title: 'Payroll Tax Report',
      subtitle: 'Tax withholdings by category and quarter',
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
        total_federal_tax: taxData.federal_tax,
        total_state_tax: taxData.state_tax,
        total_social_security: taxData.social_security,
        total_medicare: taxData.medicare,
        grand_total: taxData.total,
      },
      generatedAt: new Date(),
    };

    ExportService.export(exportData, format);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tax Report</h2>
            <p className="text-gray-600 dark:text-gray-400">Federal, State, Social Security & Medicare withholdings</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-outline flex items-center space-x-2"
            disabled={!taxData}
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="btn btn-outline flex items-center space-x-2"
            disabled={!taxData}
          >
            <Download className="w-4 h-4" />
            <span>Excel</span>
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

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : taxData ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-red-100 dark:bg-red-900/20 text-red-600 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Federal Tax</p>
                  <p className="text-xl font-bold text-red-600">
                    ${taxData.federal_tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  <p className="text-sm text-gray-600 dark:text-gray-400">State Tax</p>
                  <p className="text-xl font-bold text-orange-600">
                    ${taxData.state_tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Social Security</p>
                  <p className="text-xl font-bold text-blue-600">
                    ${taxData.social_security.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Medicare</p>
                  <p className="text-xl font-bold text-purple-600">
                    ${taxData.medicare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
            <div className="card p-4 bg-gray-50 dark:bg-gray-700">
              <div className="flex items-center space-x-3">
                <div className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 p-2 rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Withholdings</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    ${taxData.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Quarterly Breakdown */}
          <div className="card overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quarterly Breakdown</h3>
            </div>
            {taxData.by_quarter.length === 0 ? (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No quarterly data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Quarter
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Federal Tax
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        State Tax
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Social Security
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Medicare
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {taxData.by_quarter.map((quarter, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {quarter.quarter}
                        </td>
                        <td className="px-6 py-4 text-right text-red-600">
                          ${quarter.federal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right text-orange-600">
                          ${quarter.state.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right text-blue-600">
                          ${quarter.fica.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right text-purple-600">
                          ${quarter.medicare.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white">
                          ${(quarter.federal + quarter.state + quarter.fica + quarter.medicare).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tax Rates Reference */}
          <div className="card p-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Standard Tax Rates Reference</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">Federal Income Tax</p>
                <p className="font-medium text-gray-900 dark:text-white">~22% (avg)</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">State Income Tax</p>
                <p className="font-medium text-gray-900 dark:text-white">~5% (avg)</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">Social Security</p>
                <p className="font-medium text-gray-900 dark:text-white">6.2%</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400">Medicare</p>
                <p className="font-medium text-gray-900 dark:text-white">1.45%</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No tax data available</p>
        </div>
      )}
    </div>
  );
}
