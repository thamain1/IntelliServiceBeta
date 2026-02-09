import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, DollarSign, ArrowUp, ArrowDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { BIPageLayout } from './BIPageLayout';
import { DateRangeSelector } from './DateRangeSelector';
import { useBIDateRange } from '../../hooks/useBIDateRange';
import { supabase } from '../../lib/supabase';
import { ExportData } from '../../services/ExportService';

interface RevenueMetrics {
  currentRevenue: number;
  priorRevenue: number;
  percentChange: number;
  avgInvoiceValue: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
  invoiceCount: number;
}

type TooltipFormatterValue = [string, string] | [number, string];
type TooltipFormatter = (value: number, name?: string) => TooltipFormatterValue;

export function RevenueTrendsInsight() {
  const { dateRange, setDateRange, start, end } = useBIDateRange();
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    currentRevenue: 0,
    priorRevenue: 0,
    percentChange: 0,
    avgInvoiceValue: 0,
  });
  const [dailyRevenue, setDailyRevenue] = useState<DailyRevenue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      const periodLength = end.getTime() - start.getTime();
      const priorStart = new Date(start.getTime() - periodLength);

      // Use correct column names: issue_date, total_amount
      const { data: currentInvoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .gte('issue_date', start.toISOString())
        .lte('issue_date', end.toISOString())
        .not('status', 'in', '(draft,cancelled,written_off)');

      const { data: priorInvoices } = await supabase
        .from('invoices')
        .select('total_amount')
        .gte('issue_date', priorStart.toISOString())
        .lt('issue_date', start.toISOString())
        .not('status', 'in', '(draft,cancelled,written_off)');

      const currentRevenue =
        currentInvoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
      const priorRevenue = priorInvoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;

      const percentChange =
        priorRevenue > 0 ? ((currentRevenue - priorRevenue) / priorRevenue) * 100 : 0;

      const avgInvoiceValue =
        currentInvoices && currentInvoices.length > 0
          ? currentRevenue / currentInvoices.length
          : 0;

      setMetrics({
        currentRevenue,
        priorRevenue,
        percentChange,
        avgInvoiceValue,
      });

      // Fetch daily revenue data for chart
      const { data: dailyData } = await supabase
        .from('invoices')
        .select('issue_date, total_amount')
        .gte('issue_date', start.toISOString())
        .lte('issue_date', end.toISOString())
        .not('status', 'in', '(draft,cancelled,written_off)')
        .order('issue_date', { ascending: true });

      // Group by date
      const dailyMap = new Map<string, { revenue: number; count: number }>();
      dailyData?.forEach((inv) => {
        const date = new Date(inv.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = dailyMap.get(date) || { revenue: 0, count: 0 };
        dailyMap.set(date, {
          revenue: existing.revenue + Number(inv.total_amount || 0),
          count: existing.count + 1,
        });
      });

      const chartData: DailyRevenue[] = Array.from(dailyMap.entries()).map(([date, data]) => ({
        date,
        revenue: data.revenue,
        invoiceCount: data.count,
      }));

      setDailyRevenue(chartData);
    } catch (error) {
      console.error('Error loading revenue trends:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = useCallback((): ExportData => {
    return {
      title: 'Revenue Trends Report',
      subtitle: 'Revenue analysis and period comparison',
      dateRange: { start, end },
      columns: [
        { header: 'Metric', key: 'metric' },
        { header: 'Value', key: 'value', format: 'currency' },
      ],
      rows: [
        { metric: 'Current Period Revenue', value: metrics.currentRevenue },
        { metric: 'Prior Period Revenue', value: metrics.priorRevenue },
        { metric: 'Revenue Change', value: metrics.currentRevenue - metrics.priorRevenue },
        { metric: 'Average Invoice Value', value: metrics.avgInvoiceValue },
      ],
      summary: {
        current_period: `$${metrics.currentRevenue.toLocaleString()}`,
        prior_period: `$${metrics.priorRevenue.toLocaleString()}`,
        period_change: `${metrics.percentChange >= 0 ? '+' : ''}${metrics.percentChange.toFixed(1)}%`,
        avg_invoice: `$${Math.round(metrics.avgInvoiceValue).toLocaleString()}`,
      },
    };
  }, [metrics, start, end]);

  const statCards = [
    {
      title: 'Current Period Revenue',
      value: `$${metrics.currentRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Prior Period Revenue',
      value: `$${metrics.priorRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-700/20',
    },
    {
      title: 'Period Change',
      value: `${metrics.percentChange >= 0 ? '+' : ''}${metrics.percentChange.toFixed(1)}%`,
      icon: metrics.percentChange >= 0 ? ArrowUp : ArrowDown,
      color: metrics.percentChange >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor:
        metrics.percentChange >= 0
          ? 'bg-green-100 dark:bg-green-900/20'
          : 'bg-red-100 dark:bg-red-900/20',
    },
    {
      title: 'Avg Invoice Value',
      value: `$${Math.round(metrics.avgInvoiceValue).toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BIPageLayout
      title="Revenue Trends"
      subtitle="Revenue analysis and period comparison"
      exportEnabled={true}
      getExportData={getExportData}
    >
      <DateRangeSelector value={dateRange} onChange={setDateRange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {card.value}
                  </p>
                </div>
                <div className={`${card.bgColor} ${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Revenue Trend
          </h2>
          <div className="h-80">
            {dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#F9FAFB' }}
                    labelStyle={{ color: '#F9FAFB' }}
                    formatter={((value: number) => [`$${value.toLocaleString()}`, 'Revenue']) as unknown as TooltipFormatter}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No revenue data for selected period
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Daily Invoice Count
          </h2>
          <div className="h-80">
            {dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#F9FAFB' }}
                    labelStyle={{ color: '#F9FAFB' }}
                    formatter={((value: number) => [value, 'Invoices']) as unknown as TooltipFormatter}
                  />
                  <Bar dataKey="invoiceCount" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No invoice data for selected period
              </div>
            )}
          </div>
        </div>
      </div>
    </BIPageLayout>
  );
}
