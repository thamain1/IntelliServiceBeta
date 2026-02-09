import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, List, Grid, Clock, X, LayoutGrid, Filter, Package, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { TicketDetailModal } from './TicketDetailModal';
import { DispatchBoard } from './DispatchBoard';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  customers?: { name: string };
  profiles?: { full_name: string };
};

type HoldFilter = 'all' | 'parts' | 'issues';

export function DispatchView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'board'>('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [heldTicketsCount, setHeldTicketsCount] = useState({ parts: 0, issues: 0 });
  const [holdFilter, setHoldFilter] = useState<HoldFilter | null>(null);

  useEffect(() => {
    loadTickets();
    loadHeldTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, holdFilter]);

  const loadTickets = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      let query = supabase
        .from('tickets')
        .select('*, customers!tickets_customer_id_fkey(name), profiles!tickets_assigned_to_fkey(full_name)');

      if (holdFilter) {
        query = query.eq('hold_active', true);
        if (holdFilter === 'parts') {
          query = query.eq('hold_type', 'parts');
        } else if (holdFilter === 'issues') {
          query = query.eq('hold_type', 'issue');
        }
      } else {
        query = query
          .gte('scheduled_date', startOfMonth.toISOString())
          .lte('scheduled_date', endOfMonth.toISOString());
      }

      query = query.order('scheduled_date', { ascending: true });

      const { data, error } = await query;

      if (error) throw error;
      setTickets((data as Ticket[]) || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadHeldTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, hold_type')
        .eq('hold_active', true);

      if (error) throw error;

      const counts = {
        parts: data?.filter((t) => t.hold_type === 'parts').length || 0,
        issues: data?.filter((t) => t.hold_type === 'issue').length || 0,
      };

      setHeldTicketsCount(counts);
    } catch (error) {
      console.error('Error loading held tickets:', error);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getTicketsForDay = (date: Date) => {
    return tickets.filter((ticket) => {
      if (!ticket.scheduled_date) return false;
      const ticketDate = new Date(ticket.scheduled_date);
      return (
        ticketDate.getDate() === date.getDate() &&
        ticketDate.getMonth() === date.getMonth() &&
        ticketDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

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

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'border-red-500',
      high: 'border-yellow-500',
      normal: 'border-blue-500',
      low: 'border-gray-500',
    };
    return colors[priority] || 'border-gray-500';
  };

  const days = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dispatch Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Schedule and manage service appointments
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`btn ${
              viewMode === 'calendar' ? 'btn-primary' : 'btn-outline'
            } flex items-center space-x-2`}
          >
            <Grid className="w-5 h-5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('board')}
            className={`btn ${
              viewMode === 'board' ? 'btn-primary' : 'btn-outline'
            } flex items-center space-x-2`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span>Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`btn ${
              viewMode === 'list' ? 'btn-primary' : 'btn-outline'
            } flex items-center space-x-2`}
          >
            <List className="w-5 h-5" />
            <span>List</span>
          </button>
        </div>
      </div>

      {/* Held Tickets Filter Bar */}
      {(heldTicketsCount.parts > 0 || heldTicketsCount.issues > 0 || holdFilter) && (
        <div className="card p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              <div>
                <h3 className="font-semibold text-orange-900 dark:text-orange-100">
                  Tickets On Hold
                  {holdFilter && (
                    <span className="ml-2 text-sm font-normal">
                      (Filtered: {holdFilter === 'parts' ? 'Parts Only' : holdFilter === 'issues' ? 'Issues Only' : 'All Holds'})
                    </span>
                  )}
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-200">
                  {heldTicketsCount.parts > 0 && `${heldTicketsCount.parts} waiting for parts`}
                  {heldTicketsCount.parts > 0 && heldTicketsCount.issues > 0 && ' • '}
                  {heldTicketsCount.issues > 0 && `${heldTicketsCount.issues} with reported issues`}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setHoldFilter(holdFilter === 'all' ? null : 'all')}
                className={`btn btn-sm flex items-center space-x-2 ${
                  holdFilter === 'all'
                    ? 'btn-primary'
                    : 'bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span>All Holds</span>
              </button>
              {heldTicketsCount.parts > 0 && (
                <button
                  onClick={() => setHoldFilter(holdFilter === 'parts' ? null : 'parts')}
                  className={`btn btn-sm flex items-center space-x-2 ${
                    holdFilter === 'parts'
                      ? 'btn-primary'
                      : 'bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>Parts ({heldTicketsCount.parts})</span>
                </button>
              )}
              {heldTicketsCount.issues > 0 && (
                <button
                  onClick={() => setHoldFilter(holdFilter === 'issues' ? null : 'issues')}
                  className={`btn btn-sm flex items-center space-x-2 ${
                    holdFilter === 'issues'
                      ? 'btn-primary'
                      : 'bg-white dark:bg-gray-800 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/40'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Issues ({heldTicketsCount.issues})</span>
                </button>
              )}
              {holdFilter && (
                <button
                  onClick={() => setHoldFilter(null)}
                  className="btn btn-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'board' ? (
        <DispatchBoard
          selectedDate={currentDate}
          onDateChange={setCurrentDate}
        />
      ) : (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={previousMonth}
              className="btn btn-outline p-2"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{monthYear}</h2>
              <button onClick={goToToday} className="btn btn-outline">
                Today
              </button>
            </div>

            <button onClick={nextMonth} className="btn btn-outline p-2" aria-label="Next month">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {viewMode === 'calendar' ? (
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <div
                key={day}
                className="text-center font-bold text-gray-700 dark:text-gray-300 py-2"
              >
                {day}
              </div>
            ))}

            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="min-h-32 p-2"></div>;
              }

              const dayTickets = getTicketsForDay(day);
              const isToday =
                day.getDate() === new Date().getDate() &&
                day.getMonth() === new Date().getMonth() &&
                day.getFullYear() === new Date().getFullYear();

              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-32 p-2 border-2 rounded-lg ${
                    isToday
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  } hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer`}
                  onClick={() => setSelectedDay(day)}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayTickets.slice(0, 3).map((ticket) => (
                      <button
                        key={ticket.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedTicketId(ticket.id);
                        }}
                        className={`w-full text-left text-xs p-1 rounded border-l-2 ${getPriorityColor(
                          ticket.priority ?? ''
                        )} ${
                          ticket.hold_active
                            ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-400'
                            : 'bg-white dark:bg-gray-800'
                        } hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer`}
                      >
                        <div className="flex items-center space-x-1">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status ?? '')}`}></div>
                          <span className="truncate text-gray-900 dark:text-white">
                            {ticket.ticket_number}
                          </span>
                          {ticket.hold_active && (
                            <Clock className="w-3 h-3 text-orange-600 dark:text-orange-400" />
                          )}
                        </div>
                        <div className="text-gray-600 dark:text-gray-400 truncate">
                          {ticket.customers?.name}
                        </div>
                      </button>
                    ))}
                    {dayTickets.length > 3 && (
                      <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        +{dayTickets.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                {holdFilter
                  ? `No tickets on hold for ${holdFilter === 'parts' ? 'parts' : holdFilter === 'issues' ? 'issues' : 'any reason'}`
                  : 'No scheduled appointments for this month'}
              </p>
            ) : (
              tickets.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicketId(ticket.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg transition-colors cursor-pointer text-left ${
                    ticket.hold_active
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-2 border-orange-300 dark:border-orange-700'
                      : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(ticket.status ?? '')}`}></div>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {ticket.ticket_number}
                      </span>
                      <span className="badge badge-blue">{ticket.priority}</span>
                      {ticket.hold_active && (
                        <span className="badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>On Hold: {ticket.hold_type === 'parts' ? 'Parts' : 'Issue'}</span>
                        </span>
                      )}
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-900 dark:text-white">{ticket.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Customer: {ticket.customers?.name || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {ticket.scheduled_date
                        ? new Date(ticket.scheduled_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Not scheduled'}
                    </p>
                    {ticket.profiles && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {ticket.profiles.full_name}
                      </p>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Scheduled</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">In Progress</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Completed</span>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm text-gray-700 dark:text-gray-300">Open/Urgent</span>
          </div>
        </div>
      </div>

      <TicketDetailModal
        isOpen={selectedTicketId !== null}
        onClose={() => setSelectedTicketId(null)}
        ticketId={selectedTicketId || ''}
        onUpdate={loadTickets}
      />

      {selectedDay && (
        <DayScheduleView
          date={selectedDay}
          tickets={getTicketsForDay(selectedDay)}
          onClose={() => setSelectedDay(null)}
          onTicketClick={(ticketId) => {
            setSelectedDay(null);
            setSelectedTicketId(ticketId);
          }}
        />
      )}
    </div>
  );
}

interface DayScheduleViewProps {
  date: Date;
  tickets: Ticket[];
  onClose: () => void;
  onTicketClick: (ticketId: string) => void;
}

function DayScheduleView({ date, tickets, onClose, onTicketClick }: DayScheduleViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getTicketsForHour = (hour: number) => {
    return tickets.filter((ticket) => {
      if (!ticket.scheduled_date) return false;
      const ticketDate = new Date(ticket.scheduled_date);
      return ticketDate.getHours() === hour;
    });
  };

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

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[priority] || colors.normal;
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  const businessHours = hours.filter(h => h >= 6 && h <= 20);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {tickets.length} appointment{tickets.length !== 1 ? 's' : ''} scheduled
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-1">
            {businessHours.map((hour) => {
              const hourTickets = getTicketsForHour(hour);
              return (
                <div
                  key={hour}
                  className="flex border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="w-32 flex-shrink-0 py-4 px-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {formatHour(hour)}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 py-3 px-4">
                    {hourTickets.length === 0 ? (
                      <div className="text-sm text-gray-400 dark:text-gray-600 italic py-1">
                        No appointments
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {hourTickets.map((ticket) => (
                          <button
                            key={ticket.id}
                            onClick={() => onTicketClick(ticket.id)}
                            className="w-full text-left p-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <div className={`w-3 h-3 rounded-full ${getStatusColor(ticket.status ?? '')}`}></div>
                                  <span className="font-semibold text-gray-900 dark:text-white">
                                    {ticket.ticket_number}
                                  </span>
                                  <span className={`text-xs px-2 py-1 rounded ${getPriorityBadge(ticket.priority ?? '')}`}>
                                    {ticket.priority}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">
                                  {ticket.title}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                                  <span>Customer: {ticket.customers?.name || 'N/A'}</span>
                                  {ticket.profiles && (
                                    <span>Tech: {ticket.profiles.full_name}</span>
                                  )}
                                  {ticket.scheduled_date && (
                                    <span>
                                      {new Date(ticket.scheduled_date).toLocaleTimeString('en-US', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
