import { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Wrench,
  Package,
  Calendar,
  AlertOctagon,
  PackageX,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface DashboardStats {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  completedToday: number;
  activeTechnicians: number;
  lowStockParts: number;
  scheduledToday: number;
  awaitingParts: number;
  issuesReported: number;
}

interface DashboardViewProps {
  onNavigate?: (view: string, filter?: string) => void;
}

interface RecentTicket {
  id: string;
  ticket_number?: string;
  title?: string;
  status?: string;
  priority?: string;
  created_at?: string;
  customers?: { name: string } | null;
  assigned_to_profile?: { full_name: string } | null;
}

interface ReorderAlertRow {
  part_id: string;
}

export function DashboardView({ onNavigate }: DashboardViewProps = {}) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalTickets: 0,
    openTickets: 0,
    inProgressTickets: 0,
    completedToday: 0,
    activeTechnicians: 0,
    lowStockParts: 0,
    scheduledToday: 0,
    awaitingParts: 0,
    issuesReported: 0,
  });
  const [recentTickets, setRecentTickets] = useState<RecentTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [profile]);

  const loadDashboardData = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        ticketsRes,
        completedRes,
        activeTechsRes,
        reorderAlertsRes,
        recentRes,
        scheduledRes,
        holdMetricsRes,
        inProgressActiveRes,
      ] = await Promise.all([
        supabase.from('tickets').select('status', { count: 'exact' }),
        supabase
          .from('tickets')
          .select('*', { count: 'exact' })
          .eq('status', 'completed')
          .gte('completed_date', today.toISOString()),
        supabase
          .from('vw_active_technicians')
          .select('*', { count: 'exact' }),
        supabase
          .from('vw_reorder_alerts')
          .select('part_id', { count: 'exact' })
          .eq('below_reorder_point', true),
        supabase
          .from('tickets')
          .select('*, customers!tickets_customer_id_fkey(name), assigned_to_profile:profiles!tickets_assigned_to_fkey(full_name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('vw_scheduled_tickets_today')
          .select('*', { count: 'exact' }),
        supabase
          .from('vw_dashboard_hold_metrics')
          .select('*')
          .single(),
        supabase
          .from('vw_tickets_in_progress_active')
          .select('*', { count: 'exact' }),
      ]);

      const openCount = ticketsRes.data?.filter((t) => t.status === 'open').length || 0;

      // Count unique parts below reorder point (view may have multiple locations per part)
      const uniquePartsLowStock = new Set(reorderAlertsRes.data?.map((r: ReorderAlertRow) => r.part_id) || []);
      const lowStockCount = uniquePartsLowStock.size;

      const holdMetrics = holdMetricsRes.data;

      setStats({
        totalTickets: ticketsRes.count || 0,
        openTickets: openCount,
        inProgressTickets: inProgressActiveRes.count || 0,
        completedToday: completedRes.count || 0,
        activeTechnicians: activeTechsRes.count || 0,
        lowStockParts: lowStockCount,
        scheduledToday: scheduledRes.count || 0,
        awaitingParts: holdMetrics?.awaiting_parts_count || 0,
        issuesReported: holdMetrics?.issues_reported_count || 0,
      });

      setRecentTickets(recentRes.data || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (filter: string) => {
    if (onNavigate) {
      onNavigate('tickets', filter);
    }
  };

  const statCards = [
    {
      title: 'Open Tickets',
      value: stats.openTickets,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      onClick: () => handleCardClick('open'),
    },
    {
      title: 'Scheduled Today',
      value: stats.scheduledToday,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      onClick: () => onNavigate && onNavigate('dispatch', 'today'),
    },
    {
      title: 'In Progress',
      value: stats.inProgressTickets,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      onClick: () => handleCardClick('in_progress'),
    },
    {
      title: 'Completed Today',
      value: stats.completedToday,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      onClick: () => handleCardClick('completed_today'),
    },
    {
      title: 'Clocked In',
      value: stats.activeTechnicians,
      icon: Users,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100 dark:bg-teal-900/20',
      onClick: () => handleCardClick('active_technicians'),
      subtitle: 'technicians',
    },
    {
      title: 'Awaiting Parts',
      value: stats.awaitingParts,
      icon: PackageX,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20',
      onClick: () => handleCardClick('hold_parts'),
    },
    {
      title: 'Issues Reported',
      value: stats.issuesReported,
      icon: AlertOctagon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      onClick: () => handleCardClick('hold_issue'),
    },
  ];

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      open: 'badge badge-red',
      scheduled: 'badge badge-blue',
      in_progress: 'badge badge-yellow',
      completed: 'badge badge-green',
      cancelled: 'badge badge-gray',
      closed_billed: 'badge badge-green',
    };
    return badges[status] || 'badge badge-gray';
  };

  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, string> = {
      urgent: 'badge badge-red',
      high: 'badge badge-yellow',
      normal: 'badge badge-blue',
      low: 'badge badge-gray',
    };
    return badges[priority] || 'badge badge-gray';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Welcome back, {profile?.full_name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="card p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={card.onClick}
            >
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Recent Tickets
          </h2>
          <div className="space-y-3">
            {recentTickets.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                No tickets found
              </p>
            ) : (
              recentTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {ticket.ticket_number}
                      </span>
                      <span className={getPriorityBadge(ticket.priority)}>
                        {ticket.priority}
                      </span>
                      <span className={getStatusBadge(ticket.status)}>
                        {ticket.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {ticket.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Customer: {ticket.customers?.name || 'N/A'}
                    </p>
                  </div>
                  {ticket.assigned_to_profile && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {ticket.assigned_to_profile.full_name}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Quick Stats
              </h2>
              <Activity className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-4">
              <div
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-colors"
                onClick={() => onNavigate && onNavigate('tickets')}
              >
                <div className="flex items-center space-x-2">
                  <Wrench className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Total Tickets
                  </span>
                </div>
                <span className="font-bold text-gray-900 dark:text-white">
                  {stats.totalTickets}
                </span>
              </div>
              <div
                className="flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 p-2 rounded transition-colors"
                onClick={() => onNavigate && onNavigate('parts', 'low_stock')}
              >
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Low Stock Parts
                  </span>
                </div>
                <span className="font-bold text-red-600">{stats.lowStockParts}</span>
              </div>
              <div className="flex items-center justify-between p-2">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Completion Rate
                  </span>
                </div>
                <span className="font-bold text-green-600">
                  {stats.totalTickets > 0
                    ? Math.round((stats.completedToday / stats.totalTickets) * 100)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </div>

          {stats.lowStockParts > 0 && (
            <div
              className="card p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate && onNavigate('parts', 'low_stock')}
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-bold text-red-900 dark:text-red-200">
                    Low Stock Alert
                  </h3>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {stats.lowStockParts} parts are below reorder level
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
