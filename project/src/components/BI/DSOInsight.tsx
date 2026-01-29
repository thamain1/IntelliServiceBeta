import { useEffect, useState, useCallback } from 'react';
import { Clock, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { BIPageLayout } from './BIPageLayout';
import { DateRangeSelector } from './DateRangeSelector';
import { useBIDateRange } from '../../hooks/useBIDateRange';
import { supabase } from '../../lib/supabase';
import { ExportData } from '../../services/ExportService';

interface AgingBucket {
  label: string;
  amount: number;
  count: number;
}

interface DSOMetrics {
  dso: number;
  totalAR: number;
  avgDailySales: number;
  agingBuckets: AgingBucket[];
}

export function DSOInsight() {
  const { dateRange, setDateRange, start, end } = useBIDateRange();
  const [metrics, setMetrics] = useState<DSOMetrics>({
    dso: 0,
    totalAR: 0,
    avgDailySales: 0,
    agingBuckets: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      const { data: openInvoices } = await supabase
        .from('invoices')
        .select('*')
        .neq('status', 'paid')
        .neq('status', 'void');

      const totalAR =
        openInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

      const { data: allInvoices } = await supabase
        .from('invoices')
        .select('total, invoice_date')
        .gte('invoice_date', start.toISOString())
        .lte('invoice_date', end.toISOString());

      const totalSales =
        allInvoices?.reduce((sum, inv) => sum + (inv.total || 0), 0) || 0;

      const periodDays = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );
      const avgDailySales = periodDays > 0 ? totalSales / periodDays : 0;

      const dso = avgDailySales > 0 ? totalAR / avgDailySales : 0;

      const now = new Date();
      const agingBuckets: AgingBucket[] = [
        { label: 'Current', amount: 0, count: 0 },
        { label: '1-30 days', amount: 0, count: 0 },
        { label: '31-60 days', amount: 0, count: 0 },
        { label: '61-90 days', amount: 0, count: 0 },
        { label: '90+ days', amount: 0, count: 0 },
      ];

      openInvoices?.forEach((invoice) => {
        if (!invoice.due_date) return;

        const dueDate = new Date(invoice.due_date);
        const daysOverdue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        let bucketIndex = 0;
        if (daysOverdue < 0) {
          bucketIndex = 0;
        } else if (daysOverdue <= 30) {
          bucketIndex = 1;
        } else if (daysOverdue <= 60) {
          bucketIndex = 2;
        } else if (daysOverdue <= 90) {
          bucketIndex = 3;
        } else {
          bucketIndex = 4;
        }

        agingBuckets[bucketIndex].amount += invoice.total || 0;
        agingBuckets[bucketIndex].count += 1;
      });

      setMetrics({
        dso,
        totalAR,
        avgDailySales,
        agingBuckets,
      });
    } catch (error) {
      console.error('Error loading DSO:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = useCallback((): ExportData => {
    return {
      title: 'Days Sales Outstanding (DSO) Report',
      subtitle: 'Cash collection efficiency analysis',
      dateRange: { start, end },
      columns: [
        { header: 'Aging Bucket', key: 'label' },
        { header: 'Invoice Count', key: 'count', format: 'number' },
        { header: 'Amount', key: 'amount', format: 'currency' },
        { header: '% of Total', key: 'percentage', format: 'percent' },
      ],
      rows: metrics.agingBuckets.map((bucket) => ({
        label: bucket.label,
        count: bucket.count,
        amount: bucket.amount,
        percentage: metrics.totalAR > 0 ? bucket.amount / metrics.totalAR : 0,
      })),
      summary: {
        dso: `${Math.round(metrics.dso)} days`,
        total_ar: `$${metrics.totalAR.toLocaleString()}`,
        avg_daily_sales: `$${Math.round(metrics.avgDailySales).toLocaleString()}`,
        dso_target: '30 days',
      },
    };
  }, [metrics, start, end]);

  const statCards = [
    {
      title: 'Days Sales Outstanding',
      value: Math.round(metrics.dso),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      suffix: 'days',
    },
    {
      title: 'Total AR',
      value: `$${metrics.totalAR.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Avg Daily Sales',
      value: `$${Math.round(metrics.avgDailySales).toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
    {
      title: 'DSO Target',
      value: '30',
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      suffix: 'days',
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
      title="Days Sales Outstanding (DSO)"
      subtitle="Cash collection efficiency analysis"
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
                    {card.suffix && (
                      <span className="text-lg text-gray-600 dark:text-gray-400 ml-1">
                        {card.suffix}
                      </span>
                    )}
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
          AR Aging Analysis
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Aging Bucket
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Invoice Count
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Amount
                </th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  % of Total AR
                </th>
              </tr>
            </thead>
            <tbody>
              {metrics.agingBuckets.map((bucket, index) => {
                const percentage =
                  metrics.totalAR > 0 ? (bucket.amount / metrics.totalAR) * 100 : 0;
                return (
                  <tr
                    key={index}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4 text-sm font-medium text-gray-900 dark:text-white">
                      {bucket.label}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                      {bucket.count}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${bucket.amount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-400">
                      {percentage.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">About DSO</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              DSO measures the average number of days it takes to collect payment after a sale.
              Lower DSO indicates faster cash collection. Industry best practice is typically
              30-45 days.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span className="font-medium">Formula:</span> DSO = (Total AR / Total Credit Sales) ×
              Number of Days
            </p>
          </div>
        </div>
      </div>
    </BIPageLayout>
  );
}
