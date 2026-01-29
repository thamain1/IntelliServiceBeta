import { useEffect, useState, useCallback } from 'react';
import { DollarSign, TrendingUp, AlertCircle, Clock, BarChart3 } from 'lucide-react';
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

export function FinancialsReport() {
  const { dateRange, setDateRange, start, end } = useBIDateRange();
  const [metrics, setMetrics] = useState<FinancialsMetrics>({
    totalRevenue: 0,
    paidAmount: 0,
    outstandingAmount: 0,
    overdueCount: 0,
    overdueAmount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      const { data: invoices } = await supabase
        .from('invoices')
        .select('*')
        .gte('invoice_date', start.toISOString())
        .lte('invoice_date', end.toISOString());

      const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      const paidAmount =
        invoices?.filter((inv) => inv.status === 'paid').reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;
      const outstandingAmount =
        invoices?.filter((inv) => inv.status !== 'paid' && inv.status !== 'void').reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

      const overdueInvoices =
        invoices?.filter(
          (inv) =>
            inv.status !== 'paid' &&
            inv.status !== 'void' &&
            inv.due_date &&
            new Date(inv.due_date) < new Date()
        ) || [];

      const overdueAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

      setMetrics({
        totalRevenue,
        paidAmount,
        outstandingAmount,
        overdueCount: overdueInvoices.length,
        overdueAmount,
      });
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

      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Revenue Over Time
        </h2>
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Chart Visualization</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Revenue trends by day/week/month
            </p>
          </div>
        </div>
      </div>
    </BIPageLayout>
  );
}
