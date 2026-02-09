import { useEffect, useState, useMemo } from 'react';
import {
  MapPin,
  Filter,
  User,
  Clock,
  Wrench,
  Eye,
  EyeOff,
  RefreshCw,
  X,
  Route,
  Navigation,
  ExternalLink,
  Zap,
  TrendingDown,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CallMapGoogle } from './CallMapGoogle';
import { TechnicianTimeline } from './TechnicianTimeline';
import { TicketDetailModal } from '../Dispatch/TicketDetailModal';
import { useTechnicianLocations } from '../../hooks/useTechnicianLocations';
import { RouteOptimizationService, type OptimizedRoute, type RouteStop } from '../../services/RouteOptimizationService';
import type { Database } from '../../lib/database.types';
import type { TechnicianMapData } from '../../types/map.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  customers?: {
    name: string;
    address: string;
    city: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
    place_id: string | null;
  };
  profiles?: { full_name: string };
};

export function DispatchMapView() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showTickets, setShowTickets] = useState(true);
  const [showTechnicians, setShowTechnicians] = useState(true);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const [selectedTechForDetails, setSelectedTechForDetails] = useState<TechnicianMapData | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [showRouteOptimizer, setShowRouteOptimizer] = useState(false);
  const [optimizedRoutes, setOptimizedRoutes] = useState<OptimizedRoute[]>([]);
  const [optimizing, setOptimizing] = useState(false);
  const [routeSavings, setRouteSavings] = useState<{ distanceSaved: number; timeSaved: number } | null>(null);

  const { technicians, loading: techLoading, error: _techError, refresh: refreshTechs } = useTechnicianLocations();

  useEffect(() => {
    loadTickets();
  }, []);

  // Listen for viewTicket events from map info windows
  useEffect(() => {
    const handleViewTicket = (event: CustomEvent<string>) => {
      setSelectedTicketId(event.detail);
    };

    window.addEventListener('viewTicket', handleViewTicket as EventListener);
    return () => {
      window.removeEventListener('viewTicket', handleViewTicket as EventListener);
    };
  }, []);

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, customers!tickets_customer_id_fkey(name, address, city, state, latitude, longitude, place_id), profiles!tickets_assigned_to_fkey(full_name)')
        .not('status', 'in', '(cancelled,closed_billed,completed)')
        .order('priority', { ascending: false });

      if (error) throw error;
      setTickets((data as Ticket[]) || []);
    } catch (error) {
      console.error('[DispatchMapView] Error loading tickets:', error);
    } finally {
      setTicketsLoading(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      return statusFilter === 'all' || ticket.status === statusFilter;
    });
  }, [tickets, statusFilter]);

  const stats = useMemo(() => {
    const onlineTechs = technicians.filter(t => t.status === 'online').length;
    const activeJobs = technicians.reduce((sum, t) => sum + t.activeTickets.length, 0);
    const utilization = technicians.length > 0
      ? Math.round((technicians.filter(t => t.activeTickets.length > 0).length / technicians.length) * 100)
      : 0;

    return {
      totalTechs: technicians.length,
      onlineTechs,
      activeJobs,
      utilization,
      openTickets: tickets.filter(t => t.status === 'open').length,
      scheduledTickets: tickets.filter(t => t.status === 'scheduled').length,
      inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
    };
  }, [technicians, tickets]);

  const handleTechnicianClick = (techId: string) => {
    setSelectedTechId(techId);
    // Also open tech details when clicking on timeline
    const tech = technicians.find(t => t.id === techId);
    if (tech) {
      setSelectedTechForDetails(tech);
      setShowTechDetails(true);
    }
  };

  const handleOptimizeRoutes = async () => {
    setOptimizing(true);
    try {
      // Convert technicians and their tickets to route optimization format
      const techsWithStops = technicians
        .filter((t) => t.location && t.activeTickets.length > 0)
        .map((tech) => ({
          id: tech.id,
          name: tech.full_name,
          location: tech.location,
          stops: tech.activeTickets
            .filter((ticket) => ticket.customer_latitude && ticket.customer_longitude)
            .map((ticket) => ({
              id: ticket.id,
              name: ticket.customer_name || ticket.title,
              address: ticket.customer_address || '',
              latitude: ticket.customer_latitude!,
              longitude: ticket.customer_longitude!,
              priority: ticket.priority as RouteStop['priority'],
              estimatedDuration: 60, // Default 1 hour per job
            })),
        }));

      const result = RouteOptimizationService.optimizeMultipleRoutes(techsWithStops);

      if (result.success) {
        setOptimizedRoutes(result.routes);
        setRouteSavings(result.totalSavings || null);
        setShowRouteOptimizer(true);
      } else {
        alert(`Route optimization failed: ${result.error}`);
      }
    } catch (error: unknown) {
      console.error('[DispatchMapView] Route optimization error:', error);
      alert(`Route optimization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setOptimizing(false);
    }
  };

  const getLastUpdateTime = (timestamp: string | undefined) => {
    if (!timestamp) return 'No location data';
    const lastUpdate = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  const getStatusDot = (status: TechnicianMapData['status']) => {
    const colors: Record<string, string> = {
      online: 'bg-green-500',
      recent: 'bg-yellow-500',
      offline: 'bg-red-500',
    };
    return <div className={`w-3 h-3 rounded-full ${colors[status]}`} />;
  };

  const loading = ticketsLoading || techLoading;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Dispatch Map
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time view of technicians and service calls
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleOptimizeRoutes}
            disabled={optimizing || technicians.filter(t => t.activeTickets.length > 0).length === 0}
            className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            {optimizing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Optimizing...</span>
              </>
            ) : (
              <>
                <Route className="w-4 h-4" />
                <span>Optimize Routes</span>
              </>
            )}
          </button>
          <button
            onClick={() => {
              loadTickets();
              refreshTechs();
            }}
            className="btn btn-outline flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="card p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">Technicians</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTechs}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">Online</p>
          <p className="text-2xl font-bold text-green-600">{stats.onlineTechs}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">Active Jobs</p>
          <p className="text-2xl font-bold text-blue-600">{stats.activeJobs}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">Utilization</p>
          <p className="text-2xl font-bold text-purple-600">{stats.utilization}%</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">Open</p>
          <p className="text-2xl font-bold text-red-600">{stats.openTickets}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">Scheduled</p>
          <p className="text-2xl font-bold text-blue-600">{stats.scheduledTickets}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400">In Progress</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.inProgressTickets}</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input w-40"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowTickets(!showTickets)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                showTickets
                  ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300'
                  : 'bg-gray-50 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
              }`}
            >
              {showTickets ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm font-medium">Tickets ({filteredTickets.length})</span>
            </button>

            <button
              onClick={() => setShowTechnicians(!showTechnicians)}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                showTechnicians
                  ? 'bg-green-50 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300'
                  : 'bg-gray-50 border-gray-300 text-gray-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400'
              }`}
            >
              {showTechnicians ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm font-medium">Technicians ({technicians.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="card p-4">
        <CallMapGoogle
          statusFilter={statusFilter}
          tickets={tickets}
          technicians={technicians}
          showTickets={showTickets}
          showTechnicians={showTechnicians}
          onTechnicianClick={handleTechnicianClick}
          selectedTechnicianId={selectedTechId}
          height="500px"
        />
      </div>

      {/* Technician Timeline Section */}
      <div className="card p-4">
        <TechnicianTimeline
          technicians={technicians}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          onTechnicianClick={handleTechnicianClick}
          selectedTechnicianId={selectedTechId}
        />
      </div>

      {/* Technician Details Modal */}
      {showTechDetails && selectedTechForDetails && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xl">
                    {selectedTechForDetails.full_name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {selectedTechForDetails.full_name}
                  </h2>
                  <div className="flex items-center space-x-2 mt-1">
                    {getStatusDot(selectedTechForDetails.status)}
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedTechForDetails.status === 'online' ? 'Online' :
                       selectedTechForDetails.status === 'recent' ? 'Recently Active' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowTechDetails(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                    {selectedTechForDetails.location ? (
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedTechForDetails.location.latitude.toFixed(6)},{' '}
                        {selectedTechForDetails.location.longitude.toFixed(6)}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-500">No location data</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Last Update</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {getLastUpdateTime(selectedTechForDetails.location?.timestamp)}
                    </p>
                  </div>
                </div>
                {selectedTechForDetails.phone && (
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-sm text-gray-900 dark:text-white">
                        {selectedTechForDetails.phone}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Wrench className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Active Jobs</p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {selectedTechForDetails.activeTickets.length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Wrench className="w-5 h-5" />
                  <span>Assigned Jobs ({selectedTechForDetails.activeTickets.length})</span>
                </h3>

                {selectedTechForDetails.activeTickets.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTechForDetails.activeTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm text-blue-600 dark:text-blue-400">
                                {ticket.ticket_number}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  ticket.status === 'in_progress'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                }`}
                              >
                                {ticket.status.replace('_', ' ')}
                              </span>
                            </div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mt-1">
                              {ticket.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {ticket.customer_name}
                            </p>
                            {ticket.customer_address && (
                              <p className="text-sm text-gray-500 dark:text-gray-500">
                                {ticket.customer_address}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    No active jobs assigned
                  </p>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex space-x-3">
              <button
                onClick={() => setShowTechDetails(false)}
                className="btn btn-outline flex-1"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedTechId(selectedTechForDetails.id);
                  setShowTechDetails(false);
                }}
                className="btn btn-outline flex-1"
              >
                Locate on Map
              </button>
              <button
                onClick={() => {
                  if (selectedTechForDetails.location) {
                    window.open(
                      `https://www.google.com/maps/dir/?api=1&destination=${selectedTechForDetails.location.latitude},${selectedTechForDetails.location.longitude}`,
                      '_blank'
                    );
                  }
                }}
                disabled={!selectedTechForDetails.location}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get Directions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicketId && (
        <TicketDetailModal
          isOpen={!!selectedTicketId}
          onClose={() => setSelectedTicketId(null)}
          ticketId={selectedTicketId}
          onUpdate={() => {
            loadTickets();
            refreshTechs();
          }}
        />
      )}

      {/* Route Optimization Panel */}
      {showRouteOptimizer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Route className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Optimized Routes
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {optimizedRoutes.length} technician route{optimizedRoutes.length !== 1 ? 's' : ''} optimized
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRouteOptimizer(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Savings Summary */}
            {routeSavings && (routeSavings.distanceSaved > 0 || routeSavings.timeSaved > 0) && (
              <div className="px-6 py-4 bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800">
                <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="font-medium text-green-800 dark:text-green-200">
                      Estimated Savings:
                    </span>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className="text-green-700 dark:text-green-300">
                      <strong>{routeSavings.distanceSaved}</strong> miles
                    </span>
                    <span className="text-green-700 dark:text-green-300">
                      <strong>{routeSavings.timeSaved}</strong> minutes
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 overflow-y-auto flex-1">
              {optimizedRoutes.length === 0 ? (
                <div className="text-center py-12">
                  <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">
                    No routes to optimize. Assign tickets to technicians first.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {optimizedRoutes.map((route) => (
                    <div
                      key={route.technicianId}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">
                              {route.technicianName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {route.technicianName}
                            </h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              {route.stops.length} stop{route.stops.length !== 1 ? 's' : ''} &bull;{' '}
                              {route.totalDistance} mi &bull; ~{Math.round(route.totalDuration / 60)}h total
                            </p>
                          </div>
                        </div>
                        <a
                          href={route.directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary text-sm py-2"
                        >
                          <Navigation className="w-4 h-4 mr-2" />
                          Open in Maps
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </div>

                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {route.stops.map((stop, index) => {
                          const eta = route.estimatedArrivalTimes.find((e) => e.stopId === stop.id);
                          return (
                            <div key={stop.id} className="px-4 py-3 flex items-center space-x-4">
                              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  <span className="font-medium text-gray-900 dark:text-white truncate">
                                    {stop.name}
                                  </span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${RouteOptimizationService.getPriorityColor(stop.priority)}`}>
                                    {stop.priority}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {stop.address}
                                </p>
                              </div>
                              <div className="flex-shrink-0 text-right">
                                {eta && (
                                  <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
                                    <Clock className="w-4 h-4" />
                                    <span>ETA: {eta.eta.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <button onClick={() => setShowRouteOptimizer(false)} className="btn btn-outline">
                Close
              </button>
              <button
                onClick={() => {
                  // Re-optimize with fresh data
                  setShowRouteOptimizer(false);
                  handleOptimizeRoutes();
                }}
                className="btn btn-primary"
              >
                <Zap className="w-4 h-4 mr-2" />
                Re-Optimize
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
