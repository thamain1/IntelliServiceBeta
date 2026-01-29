import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, DollarSign, BarChart3, ArrowUp, ArrowDown } from 'lucide-react';
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

export function RevenueTrendsInsight() {
  const { dateRange, setDateRange, start, end } = useBIDateRange();
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    currentRevenue: 0,
    priorRevenue: 0,
    percentChange: 0,
    avgInvoiceValue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      const periodLength = end.getTime() - start.getTime();
      const priorStart = new Date(start.getTime() - periodLength);

      const { data: currentInvoices } = await supabase
        .from('invoices')
        .select('total')
        .gte('invoice_date', start.toISOString())
        .lte('invoice_date', end.toISOString());

      const { data: priorInvoices } = await supabase
        .from('invoices')
        .select('total')
        .gte('invoice_date', priorStart.toISOString())
        .lt('invoice_date', start.toISOString());

      const currentRevenue =
        currentInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      const priorRevenue = priorInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

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

      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Revenue Trend Line
        </h2>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Chart Visualization</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Revenue over time with trend analysis
            </p>
          </div>
        </div>
      </div>
    </BIPageLayout>
  );
}
