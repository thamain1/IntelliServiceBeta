import { useEffect, useState } from 'react';
import { Clock, User, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { TicketDetailModal } from './TicketDetailModal';

type TicketAssignment = {
  technician_id: string;
  role: string | null;
  profiles: { full_name: string } | null;
};

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  customers?: { name: string };
  profiles?: { full_name: string };
  ticket_assignments?: TicketAssignment[];
};

// Helper to get effective assigned tech name
const getAssignedTechName = (ticket: Ticket): string | null => {
  if (ticket.profiles?.full_name) {
    return ticket.profiles.full_name;
  }
  if (ticket.ticket_assignments && ticket.ticket_assignments.length > 0) {
    const lead = ticket.ticket_assignments.find(ta => ta.role === 'lead');
    if (lead?.profiles?.full_name) return lead.profiles.full_name;
    const first = ticket.ticket_assignments[0];
    if (first?.profiles?.full_name) return first.profiles.full_name;
  }
  return null;
};

type Profile = Database['public']['Tables']['profiles']['Row'];

interface DispatchBoardProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DispatchBoard({ selectedDate, onDateChange }: DispatchBoardProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTicket, setDraggedTicket] = useState<Ticket | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate]);

  const loadData = async () => {
    try {
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const [scheduledTicketsResult, unscheduledTicketsResult, techsResult] = await Promise.all([
        supabase
          .from('tickets')
          .select('*, customers!tickets_customer_id_fkey(name), profiles!tickets_assigned_to_fkey(full_name), ticket_assignments(technician_id, role, profiles!ticket_assignments_technician_id_fkey(full_name))')
          .gte('scheduled_date', startOfDay.toISOString())
          .lte('scheduled_date', endOfDay.toISOString())
          .order('scheduled_date', { ascending: true }),
        supabase
          .from('tickets')
          .select('*, customers!tickets_customer_id_fkey(name), profiles!tickets_assigned_to_fkey(full_name), ticket_assignments(technician_id, role, profiles!ticket_assignments_technician_id_fkey(full_name))')
          .is('scheduled_date', null)
          .in('status', ['open', 'scheduled'])
          .order('priority', { ascending: false }),
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'technician')
          .order('full_name', { ascending: true }),
      ]);

      if (scheduledTicketsResult.error) throw scheduledTicketsResult.error;
      if (unscheduledTicketsResult.error) throw unscheduledTicketsResult.error;
      if (techsResult.error) throw techsResult.error;

      const allTickets = [...((scheduledTicketsResult.data as Ticket[]) || []), ...((unscheduledTicketsResult.data as Ticket[]) || [])];
      setTickets(allTickets as Ticket[]);
      setTechnicians(techsResult.data || []);
    } catch (error) {
      console.error('Error loading dispatch board data:', error);
    } finally {
      setLoading(false);
    }
  };

  const previousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    onDateChange(newDate);
  };

  const nextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    onDateChange(newDate);
  };

  const goToToday = () => {
    onDateChange(new Date());
  };

  const handleDragStart = (ticket: Ticket) => {
    setDraggedTicket(ticket);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (technicianId: string, timeSlot: number) => {
    if (!draggedTicket) return;

    try {
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(timeSlot, 0, 0, 0);

      const { data, error } = await supabase
        .from('tickets')
        .update({
          assigned_to: technicianId,
          scheduled_date: scheduledDate.toISOString(),
          status: 'scheduled',
        })
        .eq('id', draggedTicket.id)
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', { code: error.code, message: error.message, details: error.details, hint: error.hint });
        throw error;
      }

      if (!data) {
        throw new Error('No ticket was updated. You may not have permission to modify this ticket.');
      }

      await loadData();
    } catch (error: unknown) {
      console.error('Error updating ticket:', error);
      let errorMessage = 'Failed to assign ticket. Please try again.';
      const err = error as { message?: string; code?: string };
      if (err?.message) {
        if (err.message.includes('permission denied') || err.message.includes('policy') || err.code === 'PGRST116') {
          errorMessage = 'You do not have permission to update this ticket. Please contact your administrator.';
        } else {
          errorMessage = `Failed to assign ticket: ${err.message}`;
        }
      }
      alert(errorMessage);
    } finally {
      setDraggedTicket(null);
    }
  };

  const getTicketsForTechnicianAtTime = (technicianId: string, hour: number) => {
    return tickets.filter((ticket) => {
      if (!ticket.scheduled_date || ticket.assigned_to !== technicianId) return false;
      const ticketDate = new Date(ticket.scheduled_date);
      const ticketHour = ticketDate.getHours();
      const duration = ticket.estimated_duration || 120;
      const endHour = ticketHour + Math.ceil(duration / 60);
      return hour >= ticketHour && hour < endHour;
    });
  };

  const unscheduledTickets = tickets.filter((t) => !t.scheduled_date);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-500',
      scheduled: 'bg-blue-500',
      in_progress: 'bg-yellow-500',
      completed: 'bg-green-500',
      cancelled: 'bg-gray-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityBorder = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'border-l-4 border-red-500',
      high: 'border-l-4 border-yellow-500',
      normal: 'border-l-4 border-blue-500',
      low: 'border-l-4 border-gray-500',
    };
    return colors[priority] || colors.normal;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  };

  const businessHours = Array.from({ length: 15 }, (_, i) => i + 6);

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={previousDay}
          className="btn btn-outline p-2"
          aria-label="Previous day"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedDate.toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </h2>
          <button onClick={goToToday} className="btn btn-outline">
            Today
          </button>
        </div>

        <button onClick={nextDay} className="btn btn-outline p-2" aria-label="Next day">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-2 space-y-3">
          <div className="card p-4">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">To Schedule</h3>
              <span className="badge badge-red">{unscheduledTickets.length}</span>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {unscheduledTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  draggable
                  onDragStart={() => handleDragStart(ticket)}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`${getPriorityBorder(ticket.priority ?? '')} p-3 bg-white dark:bg-gray-800 rounded-lg cursor-move hover:shadow-md transition-shadow select-none`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status ?? '')}`}></div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {ticket.ticket_number}
                    </span>
                  </div>
                  <p className="text-xs text-gray-900 dark:text-white font-medium line-clamp-2">
                    {ticket.title}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {ticket.customers?.name}
                  </p>
                  {getAssignedTechName(ticket) && (
                    <div className="flex items-center space-x-1 mt-1">
                      <User className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-600 dark:text-blue-400">
                        {getAssignedTechName(ticket)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-1 mt-2">
                    <Clock className="w-3 h-3 text-gray-400" />
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDuration(ticket.estimated_duration || 120)}
                    </span>
                  </div>
                </div>
              ))}
              {unscheduledTickets.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  All tickets scheduled
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-10 card p-4 overflow-x-auto">
          <div className="flex min-w-max">
            <div className="w-20 flex-shrink-0 pr-2">
              <div className="h-12"></div>
              {businessHours.map((hour) => (
                <div key={hour} className="h-24 flex items-start pt-1">
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {formatHour(hour)}
                  </span>
                </div>
              ))}
            </div>

            {technicians.map((tech) => (
              <div key={tech.id} className="flex-1 min-w-[200px] border-l border-gray-200 dark:border-gray-700">
                <div className="h-12 flex items-center justify-center border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="text-center">
                    <div className="flex items-center space-x-2 justify-center">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {tech.full_name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {tickets.filter((t) => t.assigned_to === tech.id).length} jobs
                    </span>
                  </div>
                </div>

                {businessHours.map((hour) => {
                  const hourTickets = getTicketsForTechnicianAtTime(tech.id, hour);
                  const isFirstSlot = hourTickets.length > 0 &&
                    new Date(hourTickets[0].scheduled_date!).getHours() === hour;

                  return (
                    <div
                      key={hour}
                      className="h-24 border-b border-gray-200 dark:border-gray-700 p-1 relative"
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(tech.id, hour)}
                    >
                      {isFirstSlot && hourTickets[0] && (
                        <div
                          draggable
                          onDragStart={() => handleDragStart(hourTickets[0])}
                          onClick={() => setSelectedTicketId(hourTickets[0].id)}
                          className={`${getPriorityBorder(hourTickets[0].priority ?? '')} absolute inset-x-1 bg-blue-100 dark:bg-blue-900/30 rounded p-2 cursor-move hover:shadow-md transition-shadow z-10 select-none`}
                          style={{
                            height: `${Math.min((hourTickets[0].estimated_duration || 120) / 60 * 96, 384)}px`,
                          }}
                        >
                          <div className="flex items-center space-x-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(hourTickets[0].status ?? '')}`}></div>
                            <span className="text-sm font-semibold text-gray-900 dark:text-white">
                              {hourTickets[0].ticket_number}
                            </span>
                          </div>
                          <p className="text-xs text-gray-900 dark:text-white font-medium line-clamp-2">
                            {hourTickets[0].title}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {hourTickets[0].customers?.name}
                          </p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Clock className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              {formatDuration(hourTickets[0].estimated_duration || 120)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <TicketDetailModal
        isOpen={selectedTicketId !== null}
        onClose={() => setSelectedTicketId(null)}
        ticketId={selectedTicketId || ''}
        onUpdate={loadData}
      />
    </div>
  );
}
