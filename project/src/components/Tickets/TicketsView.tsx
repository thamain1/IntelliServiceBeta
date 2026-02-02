import { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Download,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';
import { NewTicketModal } from './NewTicketModal';
import { TicketDetailModal } from '../Dispatch/TicketDetailModal';
import { TechnicianTicketView } from './TechnicianTicketView';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  customers?: { name: string };
  profiles?: { full_name: string };
  equipment?: { model_number: string; manufacturer: string };
  hold_active?: boolean;
  hold_type?: string | null;
  hold_parts_active?: boolean;
  hold_issue_active?: boolean;
  revisit_required?: boolean;
};

interface TicketsViewProps {
  initialFilter?: string;
}

export function TicketsView({ initialFilter }: TicketsViewProps = {}) {
  const { profile } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter || 'all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  if (profile?.role === 'technician') {
    return <TechnicianTicketView />;
  }

  useEffect(() => {
    loadTickets();
  }, [profile]);

  useEffect(() => {
    if (initialFilter && initialFilter !== 'all') {
      setStatusFilter(initialFilter);
    }
  }, [initialFilter]);

  const loadTickets = async () => {
    try {
      let query = supabase
        .from('tickets')
        .select('*, customers!tickets_customer_id_fkey(name), profiles!tickets_assigned_to_fkey(full_name), equipment(model_number, manufacturer), hold_active, hold_type, hold_parts_active, hold_issue_active, revisit_required')
        .order('created_at', { ascending: false });

      if (profile?.role === 'technician') {
        query = query.eq('assigned_to', profile.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error loading tickets:', error);
        alert(`Error loading tickets: ${error.message}`);
        throw error;
      }

      console.log('Loaded tickets:', data);
      setTickets(data || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketNumber: string) => {
    if (!confirm(`Are you sure you want to delete ticket ${ticketNumber}? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (error) throw error;

      await loadTickets();
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket. Please try again.');
    }
  };

  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      alert('No tickets to export');
      return;
    }

    const headers = ['Ticket Number', 'Title', 'Customer', 'Status', 'Priority', 'Assigned To', 'Scheduled Date', 'Created Date'];
    const rows = filteredTickets.map(ticket => [
      ticket.ticket_number,
      ticket.title || '',
      ticket.customers?.name || '',
      ticket.status || '',
      ticket.priority || '',
      ticket.profiles?.full_name || 'Unassigned',
      ticket.scheduled_date || '',
      ticket.created_at || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `tickets_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed_today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        matchesStatus = (ticket.status === 'completed' || ticket.status === 'closed_billed') &&
          ticket.completed_date &&
          new Date(ticket.completed_date) >= today;
      } else if (statusFilter === 'active_technicians') {
        matchesStatus = ticket.assigned_to !== null && ticket.status === 'in_progress';
      } else if (statusFilter === 'on_hold') {
        matchesStatus = ticket.hold_active === true;
      } else if (statusFilter === 'hold_parts') {
        matchesStatus = ticket.hold_parts_active === true;
      } else if (statusFilter === 'hold_issue') {
        matchesStatus = ticket.hold_issue_active === true;
      } else if (statusFilter === 'in_progress') {
        // Match dashboard behavior: exclude tickets on hold
        matchesStatus = ticket.status === 'in_progress' && ticket.hold_active === false;
      } else {
        matchesStatus = ticket.status === statusFilter;
      }
    }

    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusIcon = (status: string) => {
    const icons: Record<string, any> = {
      open: AlertCircle,
      scheduled: Clock,
      in_progress: Clock,
      completed: CheckCircle,
      cancelled: XCircle,
      closed_billed: CheckCircle,
    };
    return icons[status] || AlertCircle;
  };

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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Service Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage and track all service requests
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            className="btn btn-outline flex items-center space-x-2"
            disabled={filteredTickets.length === 0}
          >
            <Download className="w-5 h-5" />
            <span>Export CSV</span>
          </button>
          {(profile?.role === 'admin' || profile?.role === 'dispatcher') && (
            <button
              onClick={() => setShowNewTicketModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>New Ticket</span>
            </button>
          )}
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tickets, customers..."
              className="input pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold (All)</option>
            <option value="hold_parts">On Hold - Parts</option>
            <option value="hold_issue">On Hold - Issue</option>
            <option value="completed">Completed</option>
            <option value="closed_billed">Closed Billed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No tickets found
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => {
                  const StatusIcon = getStatusIcon(ticket.status);
                  return (
                    <tr
                      key={ticket.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="flex items-center space-x-2">
                            <StatusIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white">
                              {ticket.ticket_number}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {ticket.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">
                          {ticket.customers?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadge(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={getPriorityBadge(ticket.priority)}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">
                          {ticket.profiles?.full_name || 'Unassigned'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(ticket.scheduled_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedTicketId(ticket.id)}
                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Edit ticket"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {(profile?.role === 'admin' || profile?.role === 'dispatcher') && (
                            <button
                              onClick={() => handleDeleteTicket(ticket.id, ticket.ticket_number)}
                              className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete ticket"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {filteredTickets.length} of {tickets.length} tickets
        </span>
      </div>

      <NewTicketModal
        isOpen={showNewTicketModal}
        onClose={() => setShowNewTicketModal(false)}
        onSuccess={loadTickets}
      />

      <TicketDetailModal
        isOpen={selectedTicketId !== null}
        onClose={() => setSelectedTicketId(null)}
        ticketId={selectedTicketId || ''}
        onUpdate={loadTickets}
      />
    </div>
  );
}
