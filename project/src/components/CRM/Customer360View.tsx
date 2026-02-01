import { useState, useEffect } from 'react';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Ticket,
  FileText,
  Wrench,
  MessageSquare,
  Clock,
  TrendingUp,
  AlertTriangle,
  Plus,
  ChevronRight,
  X,
} from 'lucide-react';
import { CRMService, Customer360, CustomerTimelineEvent } from '../../services/CRMService';
import { NewInteractionModal } from './NewInteractionModal';

interface Customer360ViewProps {
  customerId: string;
  onClose: () => void;
}

export function Customer360View({ customerId, onClose }: Customer360ViewProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Customer360 | null>(null);
  const [showInteractionModal, setShowInteractionModal] = useState(false);

  useEffect(() => {
    loadData();
  }, [customerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const customer360 = await CRMService.getCustomer360(customerId);
      setData(customer360);
    } catch (err) {
      console.error('Failed to load customer 360:', err);
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ticket':
        return Ticket;
      case 'estimate':
        return FileText;
      case 'interaction':
        return MessageSquare;
      default:
        return Calendar;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'ticket':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600';
      case 'estimate':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600';
      case 'interaction':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full p-6">
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Failed to Load</h3>
              <p className="text-gray-500 mt-2">Could not load customer data</p>
              <button onClick={onClose} className="btn btn-outline mt-4">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { customer, stats, timeline, equipment } = data;

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-center justify-center min-h-screen px-4 py-8">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} />
          <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <User className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{customer.name}</h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      customer.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-600'
                        : customer.status === 'lead'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                    }`}>
                      {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </span>
                    {customer.prospect_replacement_flag && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600">
                        <TrendingUp className="w-3 h-3" />
                        Sales Prospect
                      </span>
                    )}
                    <span>Customer since {new Date(customer.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Contact Info & Stats */}
                <div className="space-y-6">
                  {/* Contact Info */}
                  <div className="card p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Contact Information</h3>
                    <div className="space-y-3 text-sm">
                      {customer.phone && (
                        <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </a>
                      )}
                      {customer.email && (
                        <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </a>
                      )}
                      {(customer.address || customer.city) && (
                        <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                          <MapPin className="w-4 h-4 mt-0.5" />
                          <div>
                            {customer.address && <p>{customer.address}</p>}
                            {customer.city && (
                              <p>{[customer.city, customer.state].filter(Boolean).join(', ')}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="card p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-3">Customer Stats</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Lifetime Value</span>
                        <span className="font-bold text-green-600">${stats.lifetime_value.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Avg Ticket Value</span>
                        <span className="font-medium text-gray-900 dark:text-white">${stats.avg_ticket_value.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total Tickets</span>
                        <span className="font-medium text-gray-900 dark:text-white">{stats.total_tickets}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Open Tickets</span>
                        <span className={`font-medium ${stats.open_tickets > 0 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {stats.open_tickets}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Total Estimates</span>
                        <span className="font-medium text-gray-900 dark:text-white">{stats.total_estimates}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Last Service</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {stats.last_service_date
                            ? new Date(stats.last_service_date).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Equipment */}
                  {equipment.length > 0 && (
                    <div className="card p-4">
                      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Equipment</h3>
                      <div className="space-y-2">
                        {equipment.map((eq: any) => (
                          <div key={eq.id} className="flex items-center gap-2 text-sm">
                            <Wrench className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {eq.manufacturer} {eq.model_number}
                              </p>
                              <p className="text-xs text-gray-500">
                                {eq.equipment_type} {eq.installation_date && `- Installed ${new Date(eq.installation_date).getFullYear()}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <button
                    onClick={() => setShowInteractionModal(true)}
                    className="btn btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Log Interaction
                  </button>
                </div>

                {/* Right Column - Timeline */}
                <div className="lg:col-span-2">
                  <div className="card p-4">
                    <h3 className="font-medium text-gray-900 dark:text-white mb-4">Activity Timeline</h3>
                    {timeline.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No activity yet
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {timeline.slice(0, 20).map((event, index) => {
                          const Icon = getEventIcon(event.event_type);
                          return (
                            <div key={`${event.event_id}-${index}`} className="flex gap-3">
                              <div className={`p-2 rounded-lg ${getEventColor(event.event_type)} flex-shrink-0`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                                    {event.event_type}
                                    {event.event_subtype && (
                                      <span className="text-gray-500 font-normal"> - {event.event_subtype}</span>
                                    )}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(event.event_date).toLocaleDateString()}
                                  </span>
                                </div>
                                {event.event_title && (
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                                    {event.event_title}
                                  </p>
                                )}
                                {event.created_by_name && (
                                  <p className="text-xs text-gray-400 mt-1">
                                    by {event.created_by_name}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Interaction Modal */}
      {showInteractionModal && (
        <NewInteractionModal
          customerId={customerId}
          customerName={customer.name}
          onClose={() => setShowInteractionModal(false)}
          onSaved={() => {
            setShowInteractionModal(false);
            loadData();
          }}
        />
      )}
    </>
  );
}
