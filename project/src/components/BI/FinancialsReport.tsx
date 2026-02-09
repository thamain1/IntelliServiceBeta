import { useEffect, useState, useCallback } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { BIPageLayout } from './BIPageLayout';
import { DateRangeSelector } from './DateRangeSelector';
import { useBIDateRange } from '../../hooks/useBIDateRange';
import { supabase } from '../../lib/supabase';
import { ExportData } from '../../services/ExportService';

interface FinancialsMetrics {
  totalRevenue: number;
  paidAmount: number;
  outstandingAmount: number;
  overdueCount: number;
  overdueAmount: number;
}

interface DailyRevenue {
  date: string;
  revenue: number;
}

export function FinancialsReport() {
  const { dateRange, setDateRange, start, end } = useBIDateRange();
  const [metrics, setMetrics] = useState<FinancialsMetrics>({
    totalRevenue: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
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

      // Use correct column names: issue_date, total_amount
      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .gte('issue_date', start.toISOString())
        .lte('issue_date', end.toISOString())
        .not('status', 'in', '(draft,cancelled,written_off)');

      const totalRevenue = invoices?.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
      const paidAmount =
        invoices?.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0) || 0;
      const outstandingAmount =
        invoices?.filter((inv) => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0) || 0;

      const overdueInvoices =
        invoices?.filter(
          (inv) =>
            inv.status !== 'paid' &&
            inv.status !== 'cancelled' &&
            inv.due_date &&
            new Date(inv.due_date) < new Date()
        ) || [];

      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + Number(inv.balance_due || 0), 0);

      setMetrics({
        totalRevenue,
        paidAmount,
        outstandingAmount,
        overdueCount: overdueInvoices.length,
        overdueAmount,
      });

      // Group by date for chart
      const dailyMap = new Map<string, number>();
      invoices?.forEach((inv) => {
        const date = new Date(inv.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = dailyMap.get(date) || 0;
        dailyMap.set(date, existing + Number(inv.total_amount || 0));
      });

      const chartData: DailyRevenue[] = Array.from(dailyMap.entries()).map(([date, revenue]) => ({
        date,
        revenue,
      }));

      setDailyRevenue(chartData);
    } catch (error) {
      console.error('Error loading financials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = useCallback((): ExportData => {
    return {
      title: 'Financial Report',
      subtitle: 'Revenue, payments, and outstanding balances',
      dateRange: { start, end },
      columns: [
        { header: 'Metric', key: 'metric' },
        { header: 'Amount', key: 'amount', format: 'currency' },
      ],
      rows: [
        { metric: 'Total Revenue', amount: metrics.totalRevenue },
        { metric: 'Paid Amount', amount: metrics.paidAmount },
        { metric: 'Outstanding Amount', amount: metrics.outstandingAmount },
        { metric: 'Overdue Amount', amount: metrics.overdueAmount },
      ],
      summary: {
        total_invoices: `${metrics.overdueCount} overdue invoices`,
        period: dateRange,
      },
    };
  }, [metrics, start, end, dateRange]);

  const statCards = [
    {
      title: 'Total Revenue',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Paid',
      value: `$${metrics.paidAmount.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Outstanding',
      value: `$${metrics.outstandingAmount.toLocaleString()}`,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      title: 'Overdue',
      value: `$${metrics.overdueAmount.toLocaleString()}`,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      subtitle: `${metrics.overdueCount} invoices`,
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
      title="Financial Report"
      subtitle="Revenue, payments, and outstanding balances"
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
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div className={`${card.bgColor} ${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Revenue Over Time
          </h2>
          <div className="h-80">
            {dailyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorFinRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
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
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue'] as unknown as [string, string]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#colorFinRevenue)"
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
            Payment Status
          </h2>
          <div className="h-80">
            {metrics.totalRevenue > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Paid', value: metrics.paidAmount, color: '#10B981' },
                      { name: 'Outstanding', value: metrics.outstandingAmount - metrics.overdueAmount, color: '#F59E0B' },
                      { name: 'Overdue', value: metrics.overdueAmount, color: '#EF4444' },
                    ].filter(d => d.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {[
                      { name: 'Paid', value: metrics.paidAmount, color: '#10B981' },
                      { name: 'Outstanding', value: metrics.outstandingAmount - metrics.overdueAmount, color: '#F59E0B' },
                      { name: 'Overdue', value: metrics.overdueAmount, color: '#EF4444' },
                    ].filter(d => d.value > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#F9FAFB' }}
                    labelStyle={{ color: '#F9FAFB' }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`] as unknown as [string]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No data for selected period
              </div>
            )}
          </div>
        </div>
      </div>
    </BIPageLayout>
  );
}
