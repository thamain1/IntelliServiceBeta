import { useState, useEffect } from 'react';
import { Clock, Building2, DollarSign, Download, RefreshCw } from 'lucide-react';
import { APService, APAgingRow } from '../../services/APService';

interface APAgingReportProps {
  onViewVendorBills?: (vendorId: string) => void;
}

export function APAgingReport({ onViewVendorBills }: APAgingReportProps) {
  const [agingData, setAgingData] = useState<APAgingRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgingData();
  }, []);

  const loadAgingData = async () => {
    setLoading(true);
    try {
      const data = await APService.getAPAging();
      setAgingData(data);
    } catch (error) {
      console.error('Failed to load AP aging:', error);
    } finally {
      setLoading(false);
    }
  };

  const totals = agingData.reduce(
    (acc, row) => ({
      current: acc.current + (row.current_amount || 0),
      days_1_30: acc.days_1_30 + (row.days_1_30 || 0),
      days_31_60: acc.days_31_60 + (row.days_31_60 || 0),
      days_61_90: acc.days_61_90 + (row.days_61_90 || 0),
      over_90: acc.over_90 + (row.days_over_90 || 0),
      total: acc.total + (row.total_balance || 0),
    }),
    { current: 0, days_1_30: 0, days_31_60: 0, days_61_90: 0, over_90: 0, total: 0 }
  );

  const exportToCSV = () => {
    const headers = ['Vendor', 'Current', '1-30 Days', '31-60 Days', '61-90 Days', 'Over 90', 'Total'];
    const rows = agingData.map((row) => [
      row.vendor_name,
      row.current_amount.toFixed(2),
      row.days_1_30.toFixed(2),
      row.days_31_60.toFixed(2),
      row.days_61_90.toFixed(2),
      row.days_over_90.toFixed(2),
      row.total_balance.toFixed(2),
    ]);

    rows.push([
      'TOTAL',
      totals.current.toFixed(2),
      totals.days_1_30.toFixed(2),
      totals.days_31_60.toFixed(2),
      totals.days_61_90.toFixed(2),
      totals.over_90.toFixed(2),
      totals.total.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ap_aging_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    });
  };

  const getAgingColor = (bucket: string, value: number) => {
    if (value === 0) return 'text-gray-400';
    if (bucket === 'current') return 'text-green-600 dark:text-green-400';
    if (bucket === 'days_1_30') return 'text-yellow-600 dark:text-yellow-400';
    if (bucket === 'days_31_60') return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">AP Aging Summary</h3>
              <p className="text-sm text-gray-500">Outstanding payables by aging bucket</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadAgingData}
              disabled={loading}
              className="btn btn-outline btn-sm flex items-center space-x-1"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={agingData.length === 0}
              className="btn btn-outline btn-sm flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-6 gap-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Current</p>
          <p className="text-lg font-bold text-green-600 dark:text-green-400">
            {formatCurrency(totals.current)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">1-30 Days</p>
          <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
            {formatCurrency(totals.days_1_30)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">31-60 Days</p>
          <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
            {formatCurrency(totals.days_31_60)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">61-90 Days</p>
          <p className="text-lg font-bold text-red-500">
            {formatCurrency(totals.days_61_90)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wider">Over 90</p>
          <p className="text-lg font-bold text-red-600 dark:text-red-400">
            {formatCurrency(totals.over_90)}
          </p>
        </div>
        <div className="text-center bg-blue-50 dark:bg-blue-900/20 -m-4 p-4 rounded-r-lg">
          <p className="text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wider font-medium">Total</p>
          <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(totals.total)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading aging data...</p>
          </div>
        ) : agingData.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Outstanding Payables</h3>
            <p className="text-gray-500">All vendor bills have been paid.</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  1-30 Days
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  31-60 Days
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  61-90 Days
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Over 90
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {agingData.map((row) => (
                <tr
                  key={row.vendor_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => onViewVendorBills?.(row.vendor_id)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {row.vendor_name}
                        </div>
                        {row.vendor_code && (
                          <div className="text-xs text-gray-500">{row.vendor_code}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-medium ${getAgingColor('current', row.current_amount)}`}>
                    {row.current_amount > 0 ? formatCurrency(row.current_amount) : '-'}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-medium ${getAgingColor('days_1_30', row.days_1_30)}`}>
                    {row.days_1_30 > 0 ? formatCurrency(row.days_1_30) : '-'}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-medium ${getAgingColor('days_31_60', row.days_31_60)}`}>
                    {row.days_31_60 > 0 ? formatCurrency(row.days_31_60) : '-'}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-medium ${getAgingColor('days_61_90', row.days_61_90)}`}>
                    {row.days_61_90 > 0 ? formatCurrency(row.days_61_90) : '-'}
                  </td>
                  <td className={`px-4 py-4 whitespace-nowrap text-sm text-right font-medium ${getAgingColor('over_90', row.days_over_90)}`}>
                    {row.days_over_90 > 0 ? formatCurrency(row.days_over_90) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900 dark:text-white">
                    {formatCurrency(row.total_balance)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-gray-900 font-bold">
              <tr>
                <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">TOTAL</td>
                <td className={`px-4 py-3 text-sm text-right ${getAgingColor('current', totals.current)}`}>
                  {formatCurrency(totals.current)}
                </td>
                <td className={`px-4 py-3 text-sm text-right ${getAgingColor('days_1_30', totals.days_1_30)}`}>
                  {formatCurrency(totals.days_1_30)}
                </td>
                <td className={`px-4 py-3 text-sm text-right ${getAgingColor('days_31_60', totals.days_31_60)}`}>
                  {formatCurrency(totals.days_31_60)}
                </td>
                <td className={`px-4 py-3 text-sm text-right ${getAgingColor('days_61_90', totals.days_61_90)}`}>
                  {formatCurrency(totals.days_61_90)}
                </td>
                <td className={`px-4 py-3 text-sm text-right ${getAgingColor('over_90', totals.over_90)}`}>
                  {formatCurrency(totals.over_90)}
                </td>
                <td className="px-6 py-3 text-sm text-right text-blue-600 dark:text-blue-400">
                  {formatCurrency(totals.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
