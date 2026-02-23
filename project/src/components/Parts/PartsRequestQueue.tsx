import { useState, useEffect } from 'react';
import {
  Package,
  Clock,
  AlertTriangle,
  ShoppingCart,
  CheckCircle,
  Eye,
  ChevronDown,
  ChevronUp,
  Truck,
  FileText,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PartRequestLine {
  line_id: string;
  part_id: string;
  part_number: string;
  part_name: string;
  quantity_requested: number;
  quantity_fulfilled: number;
  notes: string | null;
}

interface PartsRequest {
  request_id: string;
  ticket_id: string;
  ticket_number: string;
  ticket_title: string;
  ticket_priority: string;
  customer_name: string;
  customer_phone: string | null;
  urgency: string;
  request_status: string;
  request_notes: string | null;
  po_id: string | null;
  po_number: string | null;
  requested_at: string;
  requested_by_name: string;
  days_waiting: number;
  parts_requested: PartRequestLine[];
  parts_count: number;
  total_quantity_requested: number;
}

interface ProcurementMetrics {
  pending_requests: number;
  ordered_requests: number;
  received_this_week: number;
  avg_days_to_fulfill: number | null;
  sla_breaches: number;
  requests_by_urgency: Record<string, number> | null;
}

interface PartsRequestQueueProps {
  onCreatePO?: (request: PartsRequest) => void;
  onViewTicket?: (ticketId: string) => void;
  onViewPO?: (poId: string) => void;
}

export function PartsRequestQueue({ onCreatePO, onViewTicket, onViewPO }: PartsRequestQueueProps) {
  const [requests, setRequests] = useState<PartsRequest[]>([]);
  const [metrics, setMetrics] = useState<ProcurementMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'ordered'>('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [requestsResult, metricsResult] = await Promise.all([
        supabase
          .from('vw_parts_request_queue')
          .select('*')
          .order('requested_at', { ascending: true }),
        supabase
          .from('vw_procurement_metrics')
          .select('*')
          .single(),
      ]);

      if (requestsResult.error) {
        console.error('Error loading requests:', requestsResult.error);
      } else {
        setRequests((requestsResult.data as unknown as PartsRequest[]) || []);
      }

      if (metricsResult.error && metricsResult.error.code !== 'PGRST116') {
        console.error('Error loading metrics:', metricsResult.error);
      } else {
        setMetrics((metricsResult.data as unknown as ProcurementMetrics));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    const badges: Record<string, string> = {
      critical: 'badge badge-red',
      high: 'badge badge-yellow',
      medium: 'badge badge-blue',
      low: 'badge badge-gray',
    };
    return badges[urgency] || 'badge badge-gray';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { class: string; label: string }> = {
      open: { class: 'badge badge-yellow', label: 'Pending' },
      ordered: { class: 'badge badge-blue', label: 'Ordered' },
      received: { class: 'badge badge-green', label: 'Received' },
    };
    return badges[status] || { class: 'badge badge-gray', label: status };
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === 'all') return true;
    return req.request_status === filter;
  });

  const handleCreatePO = (request: PartsRequest) => {
    if (onCreatePO) {
      onCreatePO(request);
    } else {
      // Navigate to PO creation or show modal
      alert('Create PO functionality will link to Purchase Orders module');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{metrics?.pending_requests || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600 opacity-50" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">On Order</p>
              <p className="text-2xl font-bold text-blue-600">{metrics?.ordered_requests || 0}</p>
            </div>
            <Truck className="w-8 h-8 text-blue-600 opacity-50" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Received (7d)</p>
              <p className="text-2xl font-bold text-green-600">{metrics?.received_this_week || 0}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600 opacity-50" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Days</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {metrics?.avg_days_to_fulfill?.toFixed(1) || '—'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-gray-400 opacity-50" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">SLA Breaches</p>
              <p className={`text-2xl font-bold ${(metrics?.sla_breaches || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {metrics?.sla_breaches || 0}
              </p>
            </div>
            <AlertTriangle className={`w-8 h-8 ${(metrics?.sla_breaches || 0) > 0 ? 'text-red-600' : 'text-green-600'} opacity-50`} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All Requests ({requests.length})
        </button>
        <button
          onClick={() => setFilter('open')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'open'
              ? 'bg-yellow-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          Pending ({requests.filter((r) => r.request_status === 'open').length})
        </button>
        <button
          onClick={() => setFilter('ordered')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'ordered'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          On Order ({requests.filter((r) => r.request_status === 'ordered').length})
        </button>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Parts Requests
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'all'
                ? 'There are no pending parts requests at this time.'
                : `No ${filter} requests found.`}
            </p>
          </div>
        ) : (
          filteredRequests.map((request) => {
            const isExpanded = expandedRequest === request.request_id;
            const statusBadge = getStatusBadge(request.request_status);

            return (
              <div
                key={request.request_id}
                className={`card overflow-hidden ${
                  request.days_waiting > 5 && request.request_status === 'open'
                    ? 'border-l-4 border-l-red-500'
                    : request.urgency === 'critical'
                    ? 'border-l-4 border-l-red-500'
                    : request.urgency === 'high'
                    ? 'border-l-4 border-l-yellow-500'
                    : ''
                }`}
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => setExpandedRequest(isExpanded ? null : request.request_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {request.ticket_number}
                          </span>
                          <span className={getUrgencyBadge(request.urgency)}>
                            {request.urgency}
                          </span>
                          <span className={statusBadge.class}>
                            {statusBadge.label}
                          </span>
                          {request.days_waiting > 5 && request.request_status === 'open' && (
                            <span className="badge badge-red">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {request.days_waiting} days waiting
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {request.ticket_title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {request.customer_name}
                        </p>
                        <p className="text-xs text-gray-500">{request.parts_count} parts needed</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Request Details */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Request Details
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Requested By:</span>
                            <span className="text-gray-900 dark:text-white">{request.requested_by_name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Requested:</span>
                            <span className="text-gray-900 dark:text-white">
                              {new Date(request.requested_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Days Waiting:</span>
                            <span className={`font-medium ${request.days_waiting > 5 ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                              {request.days_waiting} days
                            </span>
                          </div>
                          {request.po_number && (
                            <div className="flex justify-between">
                              <span className="text-gray-600 dark:text-gray-400">PO Number:</span>
                              <span className="text-blue-600 font-medium">{request.po_number}</span>
                            </div>
                          )}
                          {request.request_notes && (
                            <div className="mt-3">
                              <span className="text-gray-600 dark:text-gray-400">Notes:</span>
                              <p className="mt-1 text-gray-900 dark:text-white bg-white dark:bg-gray-700 p-2 rounded">
                                {request.request_notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Parts List */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Parts Requested
                        </h4>
                        <div className="space-y-2">
                          {request.parts_requested?.map((part) => (
                            <div
                              key={part.line_id}
                              className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded"
                            >
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                  {part.part_name}
                                </p>
                                <p className="text-xs text-gray-500">{part.part_number}</p>
                              </div>
                              <div className="text-right">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {part.quantity_requested}
                                </span>
                                <span className="text-gray-500 text-sm"> qty</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      {onViewTicket && (
                        <button
                          onClick={() => onViewTicket(request.ticket_id)}
                          className="btn btn-outline py-2 px-4 text-sm flex items-center space-x-2"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Ticket</span>
                        </button>
                      )}
                      {request.request_status === 'open' && (
                        <button
                          onClick={() => handleCreatePO(request)}
                          className="btn btn-primary py-2 px-4 text-sm flex items-center space-x-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          <span>Create Purchase Order</span>
                        </button>
                      )}
                      {request.request_status === 'ordered' && request.po_id && (
                        <button
                          onClick={() => onViewPO && onViewPO(request.po_id!)}
                          className="btn btn-outline py-2 px-4 text-sm flex items-center space-x-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View PO</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
