import { useEffect, useState, useCallback } from 'react';
import { Calendar, Download, RefreshCw, AlertCircle, Filter, Building2, Wrench } from 'lucide-react';
import { JobPLService, JobPLSummary, JobType, JobStatus } from '../../services/JobPLService';
import { supabase } from '../../lib/supabase';

interface JobPLReportViewProps {
  onExportPDF?: () => void;
}

interface Customer {
  id: string;
  name: string;
}

export function JobPLReportView({ onExportPDF }: JobPLReportViewProps) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<JobPLSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [jobType, setJobType] = useState<JobType>('both');
  const [jobStatus, setJobStatus] = useState<JobStatus>('all');
  const [customerId, setCustomerId] = useState<string>('');
  const [minRevenue, setMinRevenue] = useState<number>(0);
  const [showFilters, setShowFilters] = useState(false);

  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setEndDate(lastDayOfMonth.toISOString().split('T')[0]);

    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    const { data } = await supabase
      .from('customers')
      .select('id, name')
      .order('name');

    setCustomers(data || []);
  };

  const loadReport = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await JobPLService.getJobProfitAndLoss({
        startDate,
        endDate,
        jobType,
        jobStatus,
        customerId: customerId || undefined,
        minRevenue,
      });

      setReport(data);
    } catch (err: unknown) {
      console.error('Error loading job P&L:', err);
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, jobType, jobStatus, customerId, minRevenue]);

  useEffect(() => {
    if (startDate && endDate) {
      loadReport();
    }
  }, [startDate, endDate, jobType, jobStatus, customerId, minRevenue, loadReport]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercent = (pct: number) => {
    return `${pct.toFixed(1)}%`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading && !report) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading report...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="w-8 h-8 mr-3" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input input-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input input-sm"
              />
            </div>
            <button
              onClick={loadReport}
              className="btn btn-outline btn-sm flex items-center space-x-2"
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline btn-sm flex items-center space-x-2"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
            {onExportPDF && (
              <button
                onClick={onExportPDF}
                className="btn btn-primary btn-sm flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Type
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="input input-sm w-full"
              >
                <option value="both">Both Projects & Tickets</option>
                <option value="project">Projects Only</option>
                <option value="ticket">Service Tickets Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={jobStatus}
                onChange={(e) => setJobStatus(e.target.value as JobStatus)}
                className="input input-sm w-full"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer
              </label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="input input-sm w-full"
              >
                <option value="">All Customers</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Revenue
              </label>
              <input
                type="number"
                value={minRevenue}
                onChange={(e) => setMinRevenue(parseFloat(e.target.value) || 0)}
                placeholder="0"
                className="input input-sm w-full"
              />
            </div>
          </div>
        )}
      </div>

      {report && (
        <div className="card p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              Dunaway Heating & Cooling
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Profit & Loss by Job</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {formatDate(startDate)} to {formatDate(endDate)}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                  <th className="text-left py-3 px-2 text-sm font-bold text-gray-900 dark:text-white">
                    Job #
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-bold text-gray-900 dark:text-white">
                    Job Name
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-bold text-gray-900 dark:text-white">
                    Type
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-bold text-gray-900 dark:text-white">
                    Customer
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-gray-900 dark:text-white">
                    Revenue
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-gray-900 dark:text-white">
                    Labor Cost
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-gray-900 dark:text-white">
                    Parts Cost
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-gray-900 dark:text-white">
                    Total Cost
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-gray-900 dark:text-white">
                    Gross Profit
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-bold text-gray-900 dark:text-white">
                    Margin %
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.jobs.map((job) => (
                  <tr
                    key={job.job_id}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-2 px-2 text-sm">
                      <div className="flex items-center space-x-2">
                        {job.job_type === 'Project' ? (
                          <Building2 className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Wrench className="w-4 h-4 text-green-600" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {job.job_number}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-sm text-gray-700 dark:text-gray-300">
                      {job.job_name}
                    </td>
                    <td className="py-2 px-2 text-sm text-gray-600 dark:text-gray-400">
                      {job.job_type}
                    </td>
                    <td className="py-2 px-2 text-sm text-gray-700 dark:text-gray-300">
                      {job.customer_name}
                    </td>
                    <td className="py-2 px-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(job.revenue)}
                    </td>
                    <td className="py-2 px-2 text-sm text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(job.labor_cost)}
                    </td>
                    <td className="py-2 px-2 text-sm text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(job.parts_cost)}
                    </td>
                    <td className="py-2 px-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(job.total_cost)}
                    </td>
                    <td
                      className={`py-2 px-2 text-sm text-right font-bold ${
                        job.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(job.gross_profit)}
                    </td>
                    <td
                      className={`py-2 px-2 text-sm text-right font-medium ${
                        job.gross_margin_pct >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatPercent(job.gross_margin_pct)}
                    </td>
                  </tr>
                ))}

                {report.unassigned && (
                  <tr className="border-b border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/10">
                    <td className="py-2 px-2 text-sm" colSpan={4}>
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                        <span className="font-medium text-gray-700 dark:text-gray-300 italic">
                          {report.unassigned.job_name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(report.unassigned.revenue)}
                    </td>
                    <td className="py-2 px-2 text-sm text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(report.unassigned.labor_cost)}
                    </td>
                    <td className="py-2 px-2 text-sm text-right text-gray-700 dark:text-gray-300">
                      {formatCurrency(report.unassigned.parts_cost)}
                    </td>
                    <td className="py-2 px-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(report.unassigned.total_cost)}
                    </td>
                    <td
                      className={`py-2 px-2 text-sm text-right font-bold ${
                        report.unassigned.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatCurrency(report.unassigned.gross_profit)}
                    </td>
                    <td
                      className={`py-2 px-2 text-sm text-right font-medium ${
                        report.unassigned.gross_margin_pct >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {formatPercent(report.unassigned.gross_margin_pct)}
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-400 dark:border-gray-500 bg-gray-100 dark:bg-gray-800">
                  <td className="py-3 px-2 text-sm font-bold text-gray-900 dark:text-white" colSpan={4}>
                    TOTAL
                  </td>
                  <td className="py-3 px-2 text-sm text-right font-bold text-gray-900 dark:text-white">
                    {formatCurrency(report.totals.revenue)}
                  </td>
                  <td className="py-3 px-2 text-sm text-right font-bold text-gray-900 dark:text-white">
                    {formatCurrency(report.totals.labor_cost)}
                  </td>
                  <td className="py-3 px-2 text-sm text-right font-bold text-gray-900 dark:text-white">
                    {formatCurrency(report.totals.parts_cost)}
                  </td>
                  <td className="py-3 px-2 text-sm text-right font-bold text-gray-900 dark:text-white">
                    {formatCurrency(report.totals.total_cost)}
                  </td>
                  <td
                    className={`py-3 px-2 text-sm text-right font-bold text-lg ${
                      report.totals.gross_profit >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(report.totals.gross_profit)}
                  </td>
                  <td
                    className={`py-3 px-2 text-sm text-right font-bold ${
                      report.totals.gross_margin_pct >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatPercent(report.totals.gross_margin_pct)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {report.jobs.length === 0 && !report.unassigned && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                No job activity found for the selected period and filters.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
