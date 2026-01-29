import { useEffect, useState, useCallback } from 'react';
import { Clock, DollarSign, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { BIPageLayout } from './BIPageLayout';
import { DateRangeSelector } from './DateRangeSelector';
import { useBIDateRange } from '../../hooks/useBIDateRange';
import { supabase } from '../../lib/supabase';
import { ExportData } from '../../services/ExportService';

interface LaborMetrics {
  billableHours: number;
  nonBillableHours: number;
  utilizationPercent: number;
  laborCost: number;
  laborBilled: number;
  techBreakdown: Array<{
    name: string;
    billable: number;
    nonBillable: number;
    utilization: number;
  }>;
}

export function LaborEfficiencyInsight() {
  const { dateRange, setDateRange, start, end } = useBIDateRange();
  const [metrics, setMetrics] = useState<LaborMetrics>({
    billableHours: 0,
    nonBillableHours: 0,
    utilizationPercent: 0,
    laborCost: 0,
    laborBilled: 0,
    techBreakdown: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      const { data: timeLogs } = await supabase
        .from('time_logs')
        .select('*, profiles!time_logs_user_id_fkey(full_name)')
        .gte('clock_in', start.toISOString())
        .lte('clock_in', end.toISOString());

      let billableHours = 0;
      let nonBillableHours = 0;
      let laborCost = 0;
      let laborBilled = 0;

      const techStats: Record<
        string,
        { name: string; billable: number; nonBillable: number }
      > = {};

      timeLogs?.forEach((log: any) => {
        if (!log.clock_out) return;

        const hours =
          (new Date(log.clock_out).getTime() - new Date(log.clock_in).getTime()) /
          (1000 * 60 * 60);

        const isBillable = log.is_billable !== false;

        if (isBillable) {
          billableHours += hours;
          laborBilled += log.billing_amount || 0;
        } else {
          nonBillableHours += hours;
        }

        laborCost += log.cost_amount || 0;

        const techId = log.user_id;
        const techName = log.profiles?.full_name || 'Unknown';

        if (!techStats[techId]) {
          techStats[techId] = { name: techName, billable: 0, nonBillable: 0 };
        }

        if (isBillable) {
          techStats[techId].billable += hours;
        } else {
          techStats[techId].nonBillable += hours;
        }
      });

      const totalHours = billableHours + nonBillableHours;
      const utilizationPercent = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;

      const techBreakdown = Object.values(techStats).map((tech) => {
        const total = tech.billable + tech.nonBillable;
        const utilization = total > 0 ? (tech.billable / total) * 100 : 0;
        return {
          ...tech,
          utilization,
        };
      });

      techBreakdown.sort((a, b) => b.billable - a.billable);

      setMetrics({
        billableHours,
        nonBillableHours,
        utilizationPercent,
        laborCost,
        laborBilled,
        techBreakdown: techBreakdown.slice(0, 10),
      });
    } catch (error) {
      console.error('Error loading labor efficiency:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = useCallback((): ExportData => {
    return {
      title: 'Labor Efficiency Report',
      subtitle: 'Productivity and billable utilization analysis',
      dateRange: { start, end },
      columns: [
        { header: 'Technician', key: 'name' },
        { header: 'Billable Hours', key: 'billable', format: 'number' },
        { header: 'Non-Billable Hours', key: 'nonBillable', format: 'number' },
        { header: 'Utilization %', key: 'utilization', format: 'percent' },
      ],
      rows: metrics.techBreakdown.map((tech) => ({
        name: tech.name,
        billable: tech.billable,
        nonBillable: tech.nonBillable,
        utilization: tech.utilization / 100,
      })),
      summary: {
        total_billable_hours: `${Math.round(metrics.billableHours)} hrs`,
        total_non_billable_hours: `${Math.round(metrics.nonBillableHours)} hrs`,
        overall_utilization: `${metrics.utilizationPercent.toFixed(1)}%`,
        labor_revenue: `$${Math.round(metrics.laborBilled).toLocaleString()}`,
      },
    };
  }, [metrics, start, end]);

  const statCards = [
    {
      title: 'Billable Hours',
      value: Math.round(metrics.billableHours),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      suffix: 'hrs',
    },
    {
      title: 'Non-Billable Hours',
      value: Math.round(metrics.nonBillableHours),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      suffix: 'hrs',
    },
    {
      title: 'Utilization',
      value: `${metrics.utilizationPercent.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Labor Revenue',
      value: `$${Math.round(metrics.laborBilled).toLocaleString()}`,
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
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
      title="Labor Efficiency"
      subtitle="Productivity and billable utilization analysis"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Hours by Technician
          </h2>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Chart Visualization</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Billable vs non-billable hours
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Technician Utilization
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {metrics.techBreakdown.length > 0 ? (
              metrics.techBreakdown.map((tech, index) => (
                <div
                  key={index}
                  className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{tech.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {tech.billable.toFixed(1)} billable / {tech.nonBillable.toFixed(1)}{' '}
                          non-billable
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-bold ${
                          tech.utilization >= 80
                            ? 'text-green-600'
                            : tech.utilization >= 60
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}
                      >
                        {tech.utilization.toFixed(1)}%
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">utilization</p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        tech.utilization >= 80
                          ? 'bg-green-600'
                          : tech.utilization >= 60
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(tech.utilization, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No time log data for this period
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700">
        <div className="flex items-start space-x-3">
          <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              About Labor Efficiency
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Labor utilization measures the percentage of total hours that are billable to
              customers. Higher utilization indicates better productivity and revenue generation.
              Industry targets typically range from 70-85%.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span className="font-medium">Formula:</span> Utilization % = (Billable Hours /
              Total Hours) × 100
            </p>
          </div>
        </div>
      </div>
    </BIPageLayout>
  );
}
