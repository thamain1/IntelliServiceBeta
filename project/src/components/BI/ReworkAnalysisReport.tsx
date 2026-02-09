import { useEffect, useState } from 'react';
import { RefreshCw, User, Clock, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BIPageLayout } from './BIPageLayout';
import { DateRangeSelector } from './DateRangeSelector';
import { useBIDateRange } from '../../hooks/useBIDateRange';
import { supabase } from '../../lib/supabase';
import { ExportData } from '../../services/ExportService';

interface ReworkRecord {
  original_ticket_id: string;
  original_ticket: string;
  original_problem: string | null;
  original_resolution: string | null;
  original_completed: string;
  callback_ticket_id: string;
  callback_ticket: string;
  callback_problem: string | null;
  callback_date: string;
  technician_id: string | null;
  technician_name: string | null;
  customer_name: string | null;
  days_between: number;
}

interface ProfileData {
  full_name: string | null;
}

interface CustomerData {
  name: string | null;
}

interface TechReworkStats {
  technician_id: string;
  technician_name: string;
  total_callbacks: number;
  total_completed: number;
  callback_rate: number;
}

interface SummaryStats {
  totalCallbacks: number;
  avgDaysBetween: number;
  worstTech: string;
  worstTechRate: number;
  mostCommonFailedResolution: string;
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export function ReworkAnalysisReport() {
  const { dateRange, setDateRange, start, end } = useBIDateRange();
  const [reworkData, setReworkData] = useState<ReworkRecord[]>([]);
  const [techStats, setTechStats] = useState<TechReworkStats[]>([]);
  const [resolutionStats, setResolutionStats] = useState<Array<{ name: string; value: number }>>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalCallbacks: 0,
    avgDaysBetween: 0,
    worstTech: '-',
    worstTechRate: 0,
    mostCommonFailedResolution: '-',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReworkData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadReworkData = async () => {
    try {
      setLoading(true);

      // Get tickets completed in date range
      const { data: completedTickets, error: ticketsError } = await supabase
        .from('tickets')
        .select(`
          id,
          ticket_number,
          problem_code,
          resolution_code,
          completed_at,
          assigned_to,
          customer_id,
          equipment_id,
          profiles!tickets_assigned_to_fkey(full_name),
          customers!tickets_customer_id_fkey(name)
        `)
        .eq('status', 'completed')
        .not('completed_at', 'is', null)
        .gte('completed_at', start.toISOString())
        .lte('completed_at', end.toISOString());

      if (ticketsError) throw ticketsError;

      // For each completed ticket, check for callbacks within 30 days
      const reworkRecords: ReworkRecord[] = [];
      const techCallbacks: Record<string, { name: string; callbacks: number; completed: number }> = {};
      const resolutionFailures: Record<string, number> = {};

      // Track tech completed counts
      completedTickets?.forEach(t => {
        if (t.assigned_to) {
          if (!techCallbacks[t.assigned_to]) {
            techCallbacks[t.assigned_to] = {
              name: (t.profiles as unknown as ProfileData)?.full_name || 'Unknown',
              callbacks: 0,
              completed: 0,
            };
          }
          techCallbacks[t.assigned_to].completed++;
        }
      });

      // Get potential callback tickets (created after original completed, within 30 days)
      for (const original of completedTickets || []) {
        if (!original.completed_at) continue;

        const completedDate = new Date(original.completed_at);
        const thirtyDaysLater = new Date(completedDate);
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

        // Find callbacks for same customer/equipment
        const { data: callbacks } = await supabase
          .from('tickets')
          .select('id, ticket_number, problem_code, created_at')
          .eq('customer_id', original.customer_id)
          .neq('id', original.id)
          .gt('created_at', original.completed_at)
          .lte('created_at', thirtyDaysLater.toISOString());

        if (callbacks && callbacks.length > 0) {
          callbacks.forEach(callback => {
            const daysBetween = Math.floor(
              (new Date(callback.created_at ?? new Date()).getTime() - completedDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            reworkRecords.push({
              original_ticket_id: original.id,
              original_ticket: original.ticket_number,
              original_problem: original.problem_code,
              original_resolution: original.resolution_code,
              original_completed: original.completed_at || new Date().toISOString(),
              callback_ticket_id: callback.id,
              callback_ticket: callback.ticket_number,
              callback_problem: callback.problem_code,
              callback_date: callback.created_at || new Date().toISOString(),
              technician_id: original.assigned_to,
              technician_name: (original.profiles as unknown as ProfileData)?.full_name || null,
              customer_name: (original.customers as unknown as CustomerData)?.name || null,
              days_between: daysBetween,
            });

            // Track tech callbacks
            if (original.assigned_to && techCallbacks[original.assigned_to]) {
              techCallbacks[original.assigned_to].callbacks++;
            }

            // Track failed resolutions
            if (original.resolution_code) {
              resolutionFailures[original.resolution_code] = (resolutionFailures[original.resolution_code] || 0) + 1;
            }
          });
        }
      }

      // Sort by callback date descending
      reworkRecords.sort((a, b) => new Date(b.callback_date).getTime() - new Date(a.callback_date).getTime());

      setReworkData(reworkRecords.slice(0, 50)); // Limit to 50

      // Calculate tech stats
      const techStatsArray: TechReworkStats[] = Object.entries(techCallbacks)
        .filter(([_id, stats]) => stats.completed > 0)
        .map(([id, stats]) => ({
          technician_id: id,
          technician_name: stats.name,
          total_callbacks: stats.callbacks,
          total_completed: stats.completed,
          callback_rate: (stats.callbacks / stats.completed) * 100,
        }))
        .sort((a, b) => b.callback_rate - a.callback_rate);

      setTechStats(techStatsArray);

      // Resolution stats for pie chart
      const resolutionArray = Object.entries(resolutionFailures)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);

      setResolutionStats(resolutionArray);

      // Calculate summary
      const avgDays = reworkRecords.length > 0
        ? reworkRecords.reduce((sum, r) => sum + r.days_between, 0) / reworkRecords.length
        : 0;

      const worstTech = techStatsArray[0];
      const mostFailedRes = resolutionArray[0];

      setSummary({
        totalCallbacks: reworkRecords.length,
        avgDaysBetween: avgDays,
        worstTech: worstTech?.technician_name || '-',
        worstTechRate: worstTech?.callback_rate || 0,
        mostCommonFailedResolution: mostFailedRes?.name || '-',
      });
    } catch (error) {
      console.error('Error loading rework data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = (): ExportData | null => {
    if (reworkData.length === 0) return null;
    return {
      title: 'Rework Analysis Report',
      dateRange: { start, end },
      columns: [
        { header: 'Original Ticket', key: 'original_ticket', width: 15 },
        { header: 'Original Problem', key: 'original_problem', width: 20 },
        { header: 'Original Resolution', key: 'original_resolution', width: 20 },
        { header: 'Callback Ticket', key: 'callback_ticket', width: 15 },
        { header: 'Callback Problem', key: 'callback_problem', width: 20 },
        { header: 'Days Between', key: 'days_between', width: 12 },
        { header: 'Technician', key: 'technician_name', width: 20 },
        { header: 'Customer', key: 'customer_name', width: 25 },
      ],
      rows: reworkData,
      summary: {
        'Total Callbacks': summary.totalCallbacks,
        'Avg Days Between': summary.avgDaysBetween.toFixed(1),
        'Highest Callback Rate Tech': `${summary.worstTech} (${summary.worstTechRate.toFixed(1)}%)`,
      },
    };
  };

  return (
    <BIPageLayout
      title="Rework Analysis"
      subtitle="Identify callbacks within 30 days to detect root cause failures and training needs"
      getExportData={getExportData}
      exportEnabled={reworkData.length > 0}
    >
      <DateRangeSelector value={dateRange} onChange={setDateRange} />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <RefreshCw className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Callbacks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalCallbacks}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Days to Callback</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.avgDaysBetween.toFixed(1)}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <User className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Highest Callback Rate</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{summary.worstTech}</p>
                  <p className="text-xs text-gray-500">{summary.worstTechRate.toFixed(1)}% rate</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Most Failed Resolution</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{summary.mostCommonFailedResolution}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Technician Callback Rates */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Technician Callback Rates
              </h3>
              {techStats.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={techStats.slice(0, 8)} layout="vertical" margin={{ left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis type="number" domain={[0, 'auto']} unit="%" />
                      <YAxis dataKey="technician_name" type="category" tick={{ fontSize: 12 }} width={80} />
                      <Tooltip
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'Callback Rate']}
                        labelFormatter={(label) => `Tech: ${label}`}
                      />
                      <Bar dataKey="callback_rate" fill="#ef4444" name="Callback Rate" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No callback data for the selected period.
                </p>
              )}
            </div>

            {/* Failed Resolutions Pie Chart */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Resolutions That Led to Callbacks
              </h3>
              {resolutionStats.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={resolutionStats}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${(name ?? '').replace('RES-', '')} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {resolutionStats.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No resolution data available.
                </p>
              )}
            </div>
          </div>

          {/* Callback Details Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Callbacks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Original</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Resolution Used</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Callback</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">New Problem</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Days</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Technician</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reworkData.map((row) => (
                    <tr key={`${row.original_ticket_id}-${row.callback_ticket_id}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        {row.original_ticket}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {row.original_resolution || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600 dark:text-red-400">
                        {row.callback_ticket}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {row.callback_problem || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          row.days_between <= 7
                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                            : row.days_between <= 14
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}>
                          {row.days_between}d
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {row.technician_name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {row.customer_name || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reworkData.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No callbacks found in the selected period. This is good news!
              </div>
            )}
          </div>
        </>
      )}
    </BIPageLayout>
  );
}
