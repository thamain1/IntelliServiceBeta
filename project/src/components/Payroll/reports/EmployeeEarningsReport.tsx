import { useEffect, useState, useCallback } from 'react';
import { Download, Calendar, Users, DollarSign, Clock } from 'lucide-react';
import { PayrollService } from '../../../services/PayrollService';
import { ExportService, ExportData, ExportFormat } from '../../../services/ExportService';

interface EmployeeEarning {
  employee_id: string;
  employee_name: string;
  total_gross: number;
  total_net: number;
  total_hours: number;
  total_ot_hours: number;
  pay_periods: number;
}

export function EmployeeEarningsReport() {
  const [earningsData, setEarningsData] = useState<EmployeeEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(0);
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [sortBy, setSortBy] = useState<'name' | 'gross' | 'hours'>('gross');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const data = await PayrollService.getEmployeeEarningsReport(startDate, endDate);
      setEarningsData(data);
    } catch (error) {
      console.error('Error loading employee earnings:', error);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleExport = (format: ExportFormat) => {
    const exportData: ExportData = {
      title: 'Employee Earnings Report',
      subtitle: 'Year-to-date earnings by employee',
      dateRange: { start: new Date(startDate), end: new Date(endDate) },
      columns: [
        { header: 'Employee', key: 'employee_name' },
        { header: 'Pay Periods', key: 'pay_periods' },
        { header: 'Regular Hours', key: 'total_hours', format: 'number' },
        { header: 'OT Hours', key: 'total_ot_hours', format: 'number' },
        { header: 'Gross Pay', key: 'total_gross', format: 'currency' },
        { header: 'Net Pay', key: 'total_net', format: 'currency' },
      ],
      rows: sortedData,
      summary: {
        total_employees: earningsData.length,
        total_gross_pay: totals.gross,
        total_net_pay: totals.net,
        total_hours: totals.hours,
      },
      generatedAt: new Date(),
    };

    ExportService.export(exportData, format);
  };

  const sortedData = [...earningsData].sort((a, b) => {
    let comparison = 0;
    switch (sortBy) {
      case 'name':
        comparison = a.employee_name.localeCompare(b.employee_name);
        break;
      case 'gross':
        comparison = a.total_gross - b.total_gross;
        break;
      case 'hours':
        comparison = (a.total_hours + a.total_ot_hours) - (b.total_hours + b.total_ot_hours);
        break;
    }
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  const totals = {
    gross: earningsData.reduce((sum, e) => sum + e.total_gross, 0),
    net: earningsData.reduce((sum, e) => sum + e.total_net, 0),
    hours: earningsData.reduce((sum, e) => sum + e.total_hours, 0),
    otHours: earningsData.reduce((sum, e) => sum + e.total_ot_hours, 0),
    periods: earningsData.reduce((sum, e) => sum + e.pay_periods, 0),
  };

  const handleSort = (column: 'name' | 'gross' | 'hours') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 p-3 rounded-lg">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Employee Earnings Report</h2>
            <p className="text-gray-600 dark:text-gray-400">Year-to-date earnings breakdown by employee</p>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-2 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Employees</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{earningsData.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-2 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Gross</p>
              <p className="text-xl font-bold text-green-600">
                ${totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Net</p>
              <p className="text-xl font-bold text-blue-600">
                ${totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 p-2 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Hours</p>
              <p className="text-xl font-bold text-purple-600">{totals.hours.toFixed(1)}</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-600 p-2 rounded-lg">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">OT Hours</p>
              <p className="text-xl font-bold text-orange-600">{totals.otHours.toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : earningsData.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No earnings data found for the selected period</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('name')}
                  >
                    Employee {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Pay Periods
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('hours')}
                  >
                    Regular Hrs {sortBy === 'hours' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    OT Hrs
                  </th>
                  <th
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => handleSort('gross')}
                  >
                    Gross Pay {sortBy === 'gross' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Net Pay
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avg/Period
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sortedData.map((employee) => (
                  <tr key={employee.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {employee.employee_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-900 dark:text-white">
                      {employee.pay_periods}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                      {employee.total_hours.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-right text-purple-600">
                      {employee.total_ot_hours.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-green-600">
                      ${employee.total_gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-blue-600">
                      ${employee.total_net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                      ${employee.pay_periods > 0
                        ? (employee.total_gross / employee.pay_periods).toLocaleString(undefined, { minimumFractionDigits: 2 })
                        : '0.00'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">Totals</td>
                  <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white">{totals.periods}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900 dark:text-white">{totals.hours.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right font-bold text-purple-600">{totals.otHours.toFixed(1)}</td>
                  <td className="px-6 py-4 text-right font-bold text-green-600">
                    ${totals.gross.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-blue-600">
                    ${totals.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
