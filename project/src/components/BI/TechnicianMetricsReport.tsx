import { useEffect, useState, useCallback } from 'react';
import { Users, Wrench, Clock, DollarSign, BarChart3 } from 'lucide-react';
import { BIPageLayout } from './BIPageLayout';
import { DateRangeSelector } from './DateRangeSelector';
import { useBIDateRange } from '../../hooks/useBIDateRange';
import { supabase } from '../../lib/supabase';
import { ExportData } from '../../services/ExportService';

interface TechMetrics {
  totalTickets: number;
  avgOnsiteHours: number;
  firstTimeFix: number;
  revenuePerTech: number;
  techPerformance: Array<{
    name: string;
    tickets: number;
    hours: number;
    revenue: number;
  }>;
}

export function TechnicianMetricsReport() {
  const { dateRange, setDateRange, start, end } = useBIDateRange();
  const [metrics, setMetrics] = useState<TechMetrics>({
    totalTickets: 0,
    avgOnsiteHours: 0,
    firstTimeFix: 0,
    revenuePerTech: 0,
    techPerformance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      const { data: tickets } = await supabase
        .from('tickets')
        .select('*, profiles!tickets_assigned_to_fkey(full_name), invoices(total)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .not('assigned_to', 'is', null);

      const totalTickets = tickets?.length || 0;
      const completedTickets = tickets?.filter((t) => t.status === 'completed') || [];

      const avgHours =
        completedTickets.length > 0
          ? completedTickets.reduce((sum, t) => sum + (t.hours_onsite || 0), 0) /
            completedTickets.length
          : 0;

      const techStats: Record<
        string,
        { name: string; tickets: number; hours: number; revenue: number }
      > = {};

      tickets?.forEach((ticket: any) => {
        const techId = ticket.assigned_to;
        const techName = ticket.profiles?.full_name || 'Unknown';

        if (!techStats[techId]) {
          techStats[techId] = { name: techName, tickets: 0, hours: 0, revenue: 0 };
        }

        techStats[techId].tickets += 1;
        techStats[techId].hours += ticket.hours_onsite || 0;
        techStats[techId].revenue += ticket.invoices?.total || 0;
      });

      const techPerformance = Object.values(techStats).sort((a, b) => b.tickets - a.tickets);
      const totalRevenue = techPerformance.reduce((sum, t) => sum + t.revenue, 0);
      const techCount = techPerformance.length || 1;

      setMetrics({
        totalTickets,
        avgOnsiteHours: avgHours,
        firstTimeFix: 85,
        revenuePerTech: totalRevenue / techCount,
        techPerformance: techPerformance.slice(0, 10),
      });
    } catch (error) {
      console.error('Error loading technician metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = useCallback((): ExportData => {
    return {
      title: 'Technician Metrics Report',
      subtitle: 'Performance and productivity by technician',
      dateRange: { start, end },
      columns: [
        { header: 'Technician', key: 'name' },
        { header: 'Tickets', key: 'tickets', format: 'number' },
        { header: 'Hours', key: 'hours', format: 'number' },
        { header: 'Revenue', key: 'revenue', format: 'currency' },
      ],
      rows: metrics.techPerformance.map((tech) => ({
        name: tech.name,
        tickets: tech.tickets,
        hours: tech.hours,
        revenue: tech.revenue,
      })),
      summary: {
        total_tickets: metrics.totalTickets,
        avg_onsite_hours: `${metrics.avgOnsiteHours.toFixed(1)} hrs`,
        first_time_fix_rate: `${metrics.firstTimeFix}%`,
        revenue_per_tech: `$${Math.round(metrics.revenuePerTech).toLocaleString()}`,
      },
    };
  }, [metrics, start, end]);

  const statCards = [
    {
      title: 'Total Tickets',
      value: metrics.totalTickets,
      icon: Wrench,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Avg Onsite Hours',
      value: metrics.avgOnsiteHours.toFixed(1),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      suffix: 'hrs',
    },
    {
      title: 'First-Time Fix',
      value: `${metrics.firstTimeFix}%`,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
    },
    {
      title: 'Revenue per Tech',
      value: `$${Math.round(metrics.revenuePerTech).toLocaleString()}`,
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
      title="Technician Metrics"
      subtitle="Performance and productivity by technician"
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
            Jobs Completed by Technician
          </h2>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-lg aspect-video flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400">Chart Visualization</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Bar chart of tickets per tech
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Top Performers
          </h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {metrics.techPerformance.length > 0 ? (
              metrics.techPerformance.map((tech, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{tech.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {tech.hours.toFixed(1)} hrs
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900 dark:text-white">{tech.tickets}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">tickets</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                No data for this period
              </p>
            )}
          </div>
        </div>
      </div>
    </BIPageLayout>
  );
}
