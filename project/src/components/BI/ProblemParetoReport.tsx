import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingUp, BarChart3 } from 'lucide-react';
import { Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Legend } from 'recharts';
import { BIPageLayout } from './BIPageLayout';
import { DateRangeSelector } from './DateRangeSelector';
import { useBIDateRange } from '../../hooks/useBIDateRange';
import { supabase } from '../../lib/supabase';
import { ExportData } from '../../services/ExportService';

interface ParetoData {
  code: string;
  label: string;
  category: string | null;
  severity: number;
  ticket_count: number;
  total_revenue: number;
  avg_ticket_value: number;
  percentage_of_total: number;
  cumulative_percentage: number;
}

interface SummaryStats {
  totalProblems: number;
  topProblem: string;
  topProblemCount: number;
  avgTicketValue: number;
  salesOpportunities: number;
}

type ParetoTooltipFormatterValue = [string, string] | [string | number, string];
type ParetoTooltipFormatter = (value: number, name: string) => ParetoTooltipFormatterValue;

export function ProblemParetoReport() {
  const { dateRange, setDateRange, start, end } = useBIDateRange();
  const [paretoData, setParetoData] = useState<ParetoData[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalProblems: 0,
    topProblem: '-',
    topProblemCount: 0,
    avgTicketValue: 0,
    salesOpportunities: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParetoData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadParetoData = async () => {
    try {
      setLoading(true);

      // Get tickets with problem codes in date range
      const { data: tickets, error } = await supabase
        .from('tickets')
        .select('problem_code, billed_amount, sales_opportunity_flag')
        .not('problem_code', 'is', null)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (error) throw error;

      // Get standard codes for labels
      const { data: codes } = await supabase
        .from('standard_codes')
        .select('code, label, category, severity')
        .eq('code_type', 'problem')
        .eq('is_active', true);

      const codeMap = new Map(codes?.map(c => [c.code, c]) || []);

      // Aggregate by problem code
      const aggregated: Record<string, {
        count: number;
        revenue: number;
        label: string;
        category: string | null;
        severity: number;
      }> = {};

      let salesOpps = 0;

      tickets?.forEach(t => {
        const code = t.problem_code;
        if (!code) return;

        if (!aggregated[code]) {
          const codeInfo = codeMap.get(code);
          aggregated[code] = {
            count: 0,
            revenue: 0,
            label: codeInfo?.label || code,
            category: codeInfo?.category || null,
            severity: codeInfo?.severity || 5,
          };
        }
        aggregated[code].count++;
        aggregated[code].revenue += Number(t.billed_amount) || 0;

        if (t.sales_opportunity_flag) salesOpps++;
      });

      // Sort by count descending
      const sorted = Object.entries(aggregated)
        .sort((a, b) => b[1].count - a[1].count);

      const totalTickets = tickets?.length || 0;
      let cumulativeCount = 0;

      const paretoRows: ParetoData[] = sorted.map(([code, data]) => {
        cumulativeCount += data.count;
        return {
          code,
          label: data.label,
          category: data.category,
          severity: data.severity,
          ticket_count: data.count,
          total_revenue: data.revenue,
          avg_ticket_value: data.count > 0 ? data.revenue / data.count : 0,
          percentage_of_total: totalTickets > 0 ? (data.count / totalTickets) * 100 : 0,
          cumulative_percentage: totalTickets > 0 ? (cumulativeCount / totalTickets) * 100 : 0,
        };
      });

      setParetoData(paretoRows.slice(0, 15)); // Top 15

      // Calculate summary
      const topProblem = paretoRows[0];
      const totalRevenue = paretoRows.reduce((sum, p) => sum + p.total_revenue, 0);

      setSummary({
        totalProblems: totalTickets,
        topProblem: topProblem?.label || '-',
        topProblemCount: topProblem?.ticket_count || 0,
        avgTicketValue: totalTickets > 0 ? totalRevenue / totalTickets : 0,
        salesOpportunities: salesOpps,
      });
    } catch (error) {
      console.error('Error loading pareto data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = (): ExportData | null => {
    if (paretoData.length === 0) return null;
    return {
      title: 'Problem Code Pareto Analysis',
      dateRange: { start, end },
      columns: [
        { header: 'Code', key: 'code', width: 25 },
        { header: 'Problem', key: 'label', width: 30 },
        { header: 'Category', key: 'category', width: 15 },
        { header: 'Count', key: 'ticket_count', width: 10 },
        { header: '% of Total', key: 'percentage_of_total', width: 12 },
        { header: 'Cumulative %', key: 'cumulative_percentage', width: 12 },
        { header: 'Revenue', key: 'total_revenue', width: 15 },
      ],
      rows: paretoData,
      summary: {
        'Total Problems': summary.totalProblems,
        'Top Problem': summary.topProblem,
        'Sales Opportunities': summary.salesOpportunities,
      },
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const getCategoryColor = (category: string | null) => {
    const colors: Record<string, string> = {
      electrical: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      airflow: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      refrigerant: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
      safety: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      usage: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      drainage: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
      mechanical: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    };
    return colors[category || ''] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
  };

  return (
    <BIPageLayout
      title="Problem Code Analysis"
      subtitle="Pareto analysis of service issues - identify the vital few causing most problems"
      getExportData={getExportData}
      exportEnabled={paretoData.length > 0}
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
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Problems</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalProblems}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Top Problem</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{summary.topProblem}</p>
                  <p className="text-xs text-gray-500">{summary.topProblemCount} occurrences</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sales Opportunities</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.salesOpportunities}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg Ticket Value</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(summary.avgTicketValue)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pareto Chart */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Problem Frequency Pareto Chart
            </h3>
            {paretoData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={paretoData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="label"
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" />
                    <Tooltip
                      formatter={((value: number, name: string) => {
                        if (name === 'Count') return [value, 'Occurrences'];
                        if (name === 'Cumulative %') return [`${value.toFixed(1)}%`, 'Cumulative'];
                        return [value, name];
                      }) as unknown as ParetoTooltipFormatter}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="ticket_count" name="Count" fill="#3b82f6" />
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="cumulative_percentage"
                      name="Cumulative %"
                      stroke="#ef4444"
                      strokeWidth={2}
                      dot={{ fill: '#ef4444' }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No problem code data available for the selected period.
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              The red line shows cumulative percentage. Problems above 80% line are the "vital few" causing most issues.
            </p>
          </div>

          {/* Data Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Problem Code Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Code</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Problem</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Category</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Count</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">% of Total</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Cumulative</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {paretoData.map((row) => (
                    <tr key={row.code} className={row.cumulative_percentage <= 80 ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900 dark:text-white">
                        {row.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {row.label}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(row.category)}`}>
                          {row.category || 'other'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                        {row.ticket_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                        {row.percentage_of_total.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                        {row.cumulative_percentage.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                        {formatCurrency(row.total_revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {paretoData.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No data available. Complete tickets with problem codes to see analytics.
              </div>
            )}
          </div>
        </>
      )}
    </BIPageLayout>
  );
}
