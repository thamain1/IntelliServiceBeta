import { useEffect, useState } from 'react';
import { MapPin, Navigation, Clock, User, X, Wrench } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type TechnicianLocation = Database['public']['Tables']['technician_locations']['Row'];
type Ticket = Database['public']['Tables']['tickets']['Row'];
type Customer = Database['public']['Tables']['customers']['Row'];

interface TicketWithCustomer extends Ticket {
  customer?: Customer;
}

interface TechnicianWithLocation extends Profile {
  latest_location?: TechnicianLocation;
  active_tickets?: number;
  tickets?: TicketWithCustomer[];
}

export function TrackingView() {
  const [technicians, setTechnicians] = useState<TechnicianWithLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [_selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTech, setSelectedTech] = useState<TechnicianWithLocation | null>(null);

  useEffect(() => {
    loadTechnicians();
    const interval = setInterval(loadTechnicians, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadTechnicians = async () => {
    try {
      const { data: techData, error: techError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'technician')
        .eq('is_active', true);

      if (techError) throw techError;

      const techsWithData = await Promise.all(
        (techData || []).map(async (tech) => {
          const { data: locationData } = await supabase
            .from('technician_locations')
            .select('*')
            .eq('technician_id', tech.id)
            .order('timestamp', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { data: ticketData, count: ticketCount } = await supabase
            .from('tickets')
            .select('*, customer:customers!tickets_customer_id_fkey(*)', { count: 'exact' })
            .eq('assigned_to', tech.id)
            .in('status', ['scheduled', 'in_progress'])
            .order('scheduled_date', { ascending: true });

          return {
            ...tech,
            latest_location: locationData || undefined,
            active_tickets: ticketCount || 0,
            tickets: ticketData || [],
          };
        })
      );

      setTechnicians(techsWithData);
    } catch (error) {
      console.error('Error loading technicians:', error);
    } finally {
      setLoading(false);
    }
  };

  const getLastUpdateTime = (location?: TechnicianLocation) => {
    if (!location || !location.timestamp) return 'No location data';
    const lastUpdate = new Date(location.timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} min ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  };

  const getStatusColor = (location?: TechnicianLocation) => {
    if (!location || !location.timestamp) return 'bg-gray-400';
    const lastUpdate = new Date(location.timestamp);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / 60000);

    if (diffMinutes < 5) return 'bg-green-500';
    if (diffMinutes < 30) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const openDetailsModal = (tech: TechnicianWithLocation) => {
    setSelectedTech(tech);
    setShowDetailsModal(true);
  };

  const getStatusBadgeColor = (status: string | null) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Technician Tracking
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Real-time GPS tracking of field technicians
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Technicians</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {technicians.length}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
              <User className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Online Now</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {
                  technicians.filter((t) => {
                    if (!t.latest_location) return false;
                    const diffMinutes = Math.floor(
                      (new Date().getTime() - new Date(t.latest_location.timestamp).getTime()) /
                        60000
                    );
                    return diffMinutes < 5;
                  }).length
                }
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
              <MapPin className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Jobs</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {technicians.reduce((sum, t) => sum + (t.active_tickets || 0), 0)}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 p-3 rounded-lg">
              <Navigation className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Live Map</h2>
        <div className="bg-gradient-to-br from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-900 rounded-lg aspect-video relative overflow-hidden border-2 border-gray-300 dark:border-gray-700">
          <svg className="w-full h-full" viewBox="0 0 1000 600" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3"/>
              </pattern>
            </defs>

            <rect width="1000" height="600" fill="url(#grid)"/>

            <path d="M100,150 Q200,100 350,180 T650,200 L750,250"
                  stroke="#94a3b8" strokeWidth="40" fill="none" strokeLinecap="round" opacity="0.3"/>
            <path d="M200,400 Q350,380 500,420 T800,450"
                  stroke="#94a3b8" strokeWidth="40" fill="none" strokeLinecap="round" opacity="0.3"/>
            <path d="M150,50 L150,550"
                  stroke="#94a3b8" strokeWidth="35" fill="none" strokeLinecap="round" opacity="0.3"/>
            <path d="M500,100 L500,500"
                  stroke="#94a3b8" strokeWidth="35" fill="none" strokeLinecap="round" opacity="0.3"/>

            <rect x="80" y="200" width="60" height="80" fill="#60a5fa" opacity="0.6"/>
            <rect x="200" y="280" width="70" height="60" fill="#60a5fa" opacity="0.6"/>
            <rect x="320" y="150" width="50" height="90" fill="#60a5fa" opacity="0.6"/>
            <rect x="450" y="320" width="80" height="70" fill="#60a5fa" opacity="0.6"/>
            <rect x="600" y="180" width="65" height="85" fill="#60a5fa" opacity="0.6"/>
            <rect x="720" y="380" width="55" height="70" fill="#60a5fa" opacity="0.6"/>
            <rect x="380" y="440" width="90" height="60" fill="#60a5fa" opacity="0.6"/>

            <circle cx="250" cy="150" r="40" fill="#22c55e" opacity="0.4"/>
            <circle cx="650" cy="350" r="50" fill="#22c55e" opacity="0.4"/>
            <circle cx="420" cy="280" r="35" fill="#22c55e" opacity="0.4"/>

            <g>
              <circle cx="320" cy="420" r="20" fill="#ef4444"/>
              <circle cx="320" cy="420" r="20" fill="#ef4444" opacity="0.3">
                <animate attributeName="r" from="20" to="35" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="320" cy="420" r="12" fill="white"/>
              <text x="320" y="450" fontSize="14" fontWeight="bold" fill="#1f2937" textAnchor="middle">Scott</text>
            </g>

            <g>
              <circle cx="580" cy="240" r="20" fill="#10b981"/>
              <circle cx="580" cy="240" r="20" fill="#10b981" opacity="0.3">
                <animate attributeName="r" from="20" to="35" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="580" cy="240" r="12" fill="white"/>
              <text x="580" y="270" fontSize="14" fontWeight="bold" fill="#1f2937" textAnchor="middle">Jacob</text>
            </g>

            <g>
              <circle cx="750" cy="320" r="20" fill="#f59e0b"/>
              <circle cx="750" cy="320" r="20" fill="#f59e0b" opacity="0.3">
                <animate attributeName="r" from="20" to="35" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="750" cy="320" r="12" fill="white"/>
              <text x="750" y="350" fontSize="14" fontWeight="bold" fill="#1f2937" textAnchor="middle">Kammi</text>
            </g>

            <g>
              <circle cx="420" cy="180" r="20" fill="#8b5cf6"/>
              <circle cx="420" cy="180" r="20" fill="#8b5cf6" opacity="0.3">
                <animate attributeName="r" from="20" to="35" dur="2s" repeatCount="indefinite"/>
                <animate attributeName="opacity" from="0.3" to="0" dur="2s" repeatCount="indefinite"/>
              </circle>
              <circle cx="420" cy="180" r="12" fill="white"/>
              <text x="420" y="210" fontSize="14" fontWeight="bold" fill="#1f2937" textAnchor="middle">Owen</text>
            </g>

            <g opacity="0.5">
              <circle cx="200" cy="100" r="6" fill="#dc2626"/>
              <text x="210" y="105" fontSize="10" fill="#1f2937">Home Office</text>
            </g>
          </svg>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {technicians.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-600 dark:text-gray-400">
            No active technicians found
          </div>
        ) : (
          technicians.map((tech) => (
            <div key={tech.id} className="card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {tech.full_name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{tech.full_name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{tech.phone}</p>
                  </div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${getStatusColor(tech.latest_location)}`}
                  title={
                    tech.latest_location
                      ? getLastUpdateTime(tech.latest_location)
                      : 'Offline'
                  }
                ></div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {tech.latest_location ? (
                    <span className="text-gray-700 dark:text-gray-300">
                      {tech.latest_location.latitude.toFixed(6)},{' '}
                      {tech.latest_location.longitude.toFixed(6)}
                    </span>
                  ) : (
                    <span className="text-gray-500 dark:text-gray-500">
                      No location data
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {getLastUpdateTime(tech.latest_location)}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-sm">
                  <Navigation className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    {tech.active_tickets} active job{tech.active_tickets !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <button
                  onClick={() => openDetailsModal(tech)}
                  className="btn btn-primary w-full"
                >
                  View Details
                </button>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setSelectedTechId(tech.id)}
                    className="btn btn-outline flex-1"
                  >
                    Track
                  </button>
                  <button
                    onClick={() => {
                      if (tech.latest_location) {
                        const lat = tech.latest_location.latitude;
                        const lng = tech.latest_location.longitude;
                        window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
                      }
                    }}
                    disabled={!tech.latest_location}
                    className="btn btn-outline flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Directions
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-bold text-blue-900 dark:text-blue-200">GPS Tracking Info</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Location updates are received automatically from the mobile app. Green indicates
              active tracking (last 5 min), yellow indicates recent activity (last 30 min), and
              red indicates offline status.
            </p>
          </div>
        </div>
      </div>

      {showDetailsModal && selectedTech && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedTech.full_name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedTech.email} • {selectedTech.phone || 'No phone'}
                </p>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="space-y-4 mb-6">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  {selectedTech.latest_location ? (
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedTech.latest_location.latitude.toFixed(6)},{' '}
                      {selectedTech.latest_location.longitude.toFixed(6)}
                    </span>
                  ) : (
                    <span className="text-gray-500">No location data</span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700 dark:text-gray-300">
                    Last update: {getLastUpdateTime(selectedTech.latest_location)}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-3 h-3 rounded-full ${getStatusColor(selectedTech.latest_location)}`}
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Status: {selectedTech.latest_location ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <Wrench className="w-5 h-5" />
                  <span>Assigned Jobs ({selectedTech.tickets?.length || 0})</span>
                </h3>

                {selectedTech.tickets && selectedTech.tickets.length > 0 ? (
                  <div className="space-y-3">
                    {selectedTech.tickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {ticket.title}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {ticket.customer?.name || 'Unknown Customer'}
                            </p>
                            {ticket.customer?.address && (
                              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                                {ticket.customer.address}
                              </p>
                            )}
                          </div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusBadgeColor(
                              ticket.status
                            )}`}
                          >
                            {(ticket.status ?? 'unknown').replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>
                            {ticket.scheduled_date
                              ? new Date(ticket.scheduled_date).toLocaleDateString()
                              : 'Not scheduled'}
                          </span>
                          {ticket.estimated_duration && (
                            <span>{ticket.estimated_duration}h estimated</span>
                          )}
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
                onClick={() => setShowDetailsModal(false)}
                className="btn btn-outline flex-1"
              >
                Close
              </button>
              <button
                onClick={() => {
                  if (selectedTech.latest_location) {
                    const lat = selectedTech.latest_location.latitude;
                    const lng = selectedTech.latest_location.longitude;
                    window.open(
                      `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                      '_blank'
                    );
                  }
                }}
                disabled={!selectedTech.latest_location}
                className="btn btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Get Directions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
