import { useEffect, useState, useCallback } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  Wrench,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { supabase } from '../../lib/supabase';
import { ExportService, ExportData } from '../../services/ExportService';

interface ReportMetrics {
  totalTickets: number;
  completedTickets: number;
  avgCompletionTime: number;
  totalRevenue: number;
  topTechnician: string;
  topTechnicianJobs: number;
  mostUsedPart: string;
  mostUsedPartCount: number;
}

interface PartUsageRow {
  part_id: string;
  parts?: { name: string } | null;
  quantity: number;
}

interface TechnicianTicketRow {
  assigned_to: string;
  profiles?: { full_name: string } | null;
}

interface TicketRow {
  id: string;
  status: string;
  created_at: string;
  completed_date?: string | null;
}

interface DailyData {
  date: string;
  tickets: number;
  completed: number;
}

interface StatusData {
  name: string;
  value: number;
  color: string;
}

export function ReportsView() {
  const [metrics, setMetrics] = useState<ReportMetrics>({
    totalTickets: 0,
    completedTickets: 0,
    avgCompletionTime: 0,
    totalRevenue: 0,
    topTechnician: 'N/A',
    topTechnicianJobs: 0,
    mostUsedPart: 'N/A',
    mostUsedPartCount: 0,
  });
  const [dailyData, setDailyData] = useState<DailyData[]>([]);
  const [statusData, setStatusData] = useState<StatusData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    loadMetrics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const getDateRange = () => {
    const now = new Date();
    const ranges = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    };
    return ranges[dateRange];
  };

  const loadMetrics = async () => {
    try {
      const startDate = getDateRange();

      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('*')
        .gte('created_at', startDate.toISOString());

      const completedTickets = ticketsData?.filter((t) => t.status === 'completed') || [];

      const avgTime =
        completedTickets.length > 0
          ? completedTickets.reduce((sum, t) => {
              if (t.created_at && t.completed_date) {
                const created = new Date(t.created_at).getTime();
                const completed = new Date(t.completed_date).getTime();
                return sum + (completed - created);
              }
              return sum;
            }, 0) / completedTickets.length
          : 0;

      const { data: partsUsed } = await supabase
        .from('ticket_parts_used')
        .select('part_id, parts(name), quantity')
        .gte('created_at', startDate.toISOString());

      const partCounts: Record<string, { name: string; count: number }> = {};
      partsUsed?.forEach((usage: PartUsageRow) => {
        const partId = usage.part_id;
        const partName = usage.parts?.name || 'Unknown';
        if (!partCounts[partId]) {
          partCounts[partId] = { name: partName, count: 0 };
        }
        partCounts[partId].count += usage.quantity || 0;
      });

      const topPart = Object.values(partCounts).sort((a, b) => b.count - a.count)[0];

      const { data: technicianStats } = await supabase
        .from('tickets')
        .select('assigned_to, profiles!tickets_assigned_to_fkey(full_name)')
        .gte('created_at', startDate.toISOString())
        .not('assigned_to', 'is', null);

      const techCounts: Record<string, { name: string; count: number }> = {};
      technicianStats?.forEach((ticket: TechnicianTicketRow) => {
        const techId = ticket.assigned_to;
        const techName = ticket.profiles?.full_name || 'Unknown';
        if (!techCounts[techId]) {
          techCounts[techId] = { name: techName, count: 0 };
        }
        techCounts[techId].count += 1;
      });

      const topTech = Object.values(techCounts).sort((a, b) => b.count - a.count)[0];

      setMetrics({
        totalTickets: ticketsData?.length || 0,
        completedTickets: completedTickets.length,
        avgCompletionTime: avgTime / (1000 * 60 * 60),
        totalRevenue: completedTickets.length * 250,
        topTechnician: topTech?.name || 'N/A',
        topTechnicianJobs: topTech?.count || 0,
        mostUsedPart: topPart?.name || 'N/A',
        mostUsedPartCount: topPart?.count || 0,
      });

      // Compute daily breakdown for chart
      const dailyMap = new Map<string, { tickets: number; completed: number }>();
      ticketsData?.forEach((ticket: TicketRow) => {
        const date = new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const existing = dailyMap.get(date) || { tickets: 0, completed: 0 };
        existing.tickets += 1;
        if (ticket.status === 'completed') {
          existing.completed += 1;
        }
        dailyMap.set(date, existing);
      });

      const dailyChartData: DailyData[] = Array.from(dailyMap.entries())
        .slice(-14) // Last 14 data points
        .map(([date, data]) => ({
          date,
          tickets: data.tickets,
          completed: data.completed,
        }));
      setDailyData(dailyChartData);

      // Compute status breakdown for pie chart
      const statusCounts: Record<string, number> = {};
      ticketsData?.forEach((ticket: TicketRow) => {
        const status = ticket.status || 'unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });

      const statusColors: Record<string, string> = {
        open: '#3B82F6',
        scheduled: '#8B5CF6',
        in_progress: '#F59E0B',
        completed: '#10B981',
        closed_billed: '#06B6D4',
        closed_no_charge: '#6366F1',
        cancelled: '#EF4444',
      };

      const statusChartData: StatusData[] = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: statusColors[name] || '#9CA3AF',
      }));
      setStatusData(statusChartData);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = useCallback((): ExportData => {
    const startDate = getDateRange();
    return {
      title: 'Performance Report',
      subtitle: `${dateRange.charAt(0).toUpperCase() + dateRange.slice(1)} Summary`,
      dateRange: { start: startDate, end: new Date() },
      columns: [
        { header: 'Metric', key: 'metric' },
        { header: 'Value', key: 'value' },
      ],
      rows: [
        { metric: 'Total Tickets', value: metrics.totalTickets },
        { metric: 'Completed Tickets', value: metrics.completedTickets },
        { metric: 'Completion Rate', value: `${metrics.totalTickets > 0 ? ((metrics.completedTickets / metrics.totalTickets) * 100).toFixed(1) : 0}%` },
        { metric: 'Avg Completion Time', value: `${metrics.avgCompletionTime.toFixed(1)} hrs` },
        { metric: 'Estimated Revenue', value: `$${metrics.totalRevenue.toLocaleString()}` },
        { metric: 'Top Technician', value: `${metrics.topTechnician} (${metrics.topTechnicianJobs} jobs)` },
        { metric: 'Most Used Part', value: `${metrics.mostUsedPart} (${metrics.mostUsedPartCount} used)` },
      ],
      summary: {
        period: dateRange,
        generated_at: new Date().toISOString(),
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metrics, dateRange]);

  const handleExport = (format: 'pdf' | 'excel' | 'csv') => {
    const data = getExportData();
    ExportService.export(data, format);
    setShowExportMenu(false);
  };

  const statCards = [
    {
      title: 'Total Tickets',
      value: metrics.totalTickets,
      icon: Wrench,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      suffix: '',
    },
    {
      title: 'Completed',
      value: metrics.completedTickets,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      suffix: '',
    },
    {
      title: 'Avg Completion',
      value: metrics.avgCompletionTime.toFixed(1),
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      suffix: 'hrs',
    },
    {
      title: 'Est. Revenue',
      value: `$${metrics.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      suffix: '',
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Performance metrics and business insights
          </p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Download className="w-5 h-5" />
            <span>Export Report</span>
            <ChevronDown className="w-4 h-4" />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 rounded-t-lg"
              >
                <FileText className="w-4 h-4" />
                <span>Export as PDF</span>
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Export as Excel</span>
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 rounded-b-lg"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Export as CSV</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex items-center space-x-4">
          <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Date Range:</span>
          <div className="flex space-x-2">
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`btn ${
                  dateRange === range ? 'btn-primary' : 'btn-outline'
                } capitalize`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

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
            Tickets Over Time
          </h2>
          <div className="h-80">
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    stroke="#9CA3AF"
                    fontSize={11}
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
                      color: '#F9FAFB'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="tickets" name="Total Tickets" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No ticket data for selected period
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Top Performers
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-600 p-2 rounded-lg">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Top Technician</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {metrics.topTechnician}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {metrics.topTechnicianJobs}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">jobs</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-green-600 p-2 rounded-lg">
                    <Wrench className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Most Used Part</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {metrics.mostUsedPart}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-green-600">
                    {metrics.mostUsedPartCount}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">used</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-yellow-600 p-2 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {metrics.totalTickets > 0
                        ? ((metrics.completedTickets / metrics.totalTickets) * 100).toFixed(1)
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Export Options
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleExport('excel')}
            className="btn btn-outline flex items-center justify-center space-x-2"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Export to Excel</span>
          </button>
          <button
            onClick={() => handleExport('pdf')}
            className="btn btn-outline flex items-center justify-center space-x-2"
          >
            <FileText className="w-5 h-5" />
            <span>Export to PDF</span>
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="btn btn-outline flex items-center justify-center space-x-2"
          >
            <BarChart3 className="w-5 h-5" />
            <span>Export to CSV</span>
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Ticket Status Distribution
        </h2>
        <div className="h-80">
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} (${((percent ?? 0) * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {statusData.map((entry, index) => (
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
                  formatter={(value: number | undefined) => [value ?? 0, 'Tickets']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              No status data for selected period
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
