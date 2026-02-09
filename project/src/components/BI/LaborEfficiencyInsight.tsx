import { useEffect, useState, useCallback } from 'react';
import { Clock, DollarSign, TrendingUp, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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

interface TimeLogRecord {
  user_id: string;
  ticket_id: string | null;
  clock_in_time: string;
  clock_out_time: string | null;
  total_hours: number | null;
  profiles: { full_name: string; role: string } | null;
  tickets: { title: string } | null;
}

type TooltipFormatterValue = [string];
type TooltipFormatter = (value: number, name: string) => TooltipFormatterValue;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      // Use correct column names: clock_in_time, clock_out_time
      // Time logged with a ticket_id is considered billable
      // Include role to filter for technicians only
      const { data: timeLogs, error } = await supabase
        .from('time_logs')
        .select('*, profiles!time_logs_user_id_fkey(full_name, role), tickets(title)')
        .gte('clock_in_time', start.toISOString())
        .lte('clock_in_time', end.toISOString())
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching time logs:', error);
        throw error;
      }

      let billableHours = 0;
      let nonBillableHours = 0;
      let laborCost = 0;
      let laborBilled = 0;

      const techStats: Record<
        string,
        { name: string; billable: number; nonBillable: number }
      > = {};

      // Process all completed time logs (all roles)
      (timeLogs || []).forEach((log: unknown) => {
        const timeLog = log as unknown as TimeLogRecord;
        if (!timeLog.clock_out_time) return;

        // Use total_hours if available, otherwise calculate
        const hours = timeLog.total_hours ||
          (new Date(timeLog.clock_out_time).getTime() - new Date(timeLog.clock_in_time).getTime()) /
          (1000 * 60 * 60);

        // Time logged against a ticket is considered billable
        const isBillable = !!timeLog.ticket_id;

        if (isBillable) {
          billableHours += hours;
          // Estimate labor billed at $95/hr (typical HVAC rate)
          laborBilled += hours * 95;
        } else {
          nonBillableHours += hours;
        }

        // Estimate labor cost at $35/hr (typical tech cost)
        laborCost += hours * 35;

        const techId = timeLog.user_id;
        const techName = timeLog.profiles?.full_name || 'Unknown';

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
          <div className="h-80">
            {metrics.techBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={metrics.techBreakdown.map(t => ({
                    name: t.name.split(' ')[0],
                    billable: parseFloat(t.billable.toFixed(1)),
                    nonBillable: parseFloat(t.nonBillable.toFixed(1)),
                  }))}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="name"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(value) => `${value}h`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1F2937',
                      border: 'none',
                      borderRadius: '8px',
                    }}
                    itemStyle={{ color: '#F9FAFB' }}
                    labelStyle={{ color: '#F9FAFB' }}
                    formatter={((value: number) => [`${value} hrs`]) as unknown as TooltipFormatter}
                  />
                  <Legend />
                  <Bar dataKey="billable" name="Billable" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="nonBillable" name="Non-Billable" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No time log data for selected period
              </div>
            )}
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
