import { useEffect, useState } from 'react';
import { X, Mail, Phone, MapPin, Edit, Trash2, Package, Wrench, FileText, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';
import {
  getCustomerFinancialSummary,
  formatCurrency,
  getInvoiceStatusBadge,
  getCustomerInstalledEquipment,
  getWarrantyStatusBadge,
  type CustomerFinancialSummary,
  type CustomerEquipmentByLocation
} from '../../services/CustomerFinancialService';

type Customer = Database['public']['Tables']['customers']['Row'] & {
  site_contact_name?: string;
  site_contact_phone?: string;
};
type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  profiles?: { full_name: string };
};
type InstalledPart = Database['public']['Tables']['customer_parts_installed']['Row'] & {
  parts?: { name: string; part_number: string };
  profiles?: { full_name: string };
};

interface CustomerDetailModalProps {
  customer: Customer;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function CustomerDetailModal({ customer, onClose, onEdit, onDelete }: CustomerDetailModalProps) {
  const { profile } = useAuth();
  const isTechnician = profile?.role === 'technician';
  const [activeTab, setActiveTab] = useState<'info' | 'equipment' | 'parts' | 'history' | 'financials'>('info');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [installedParts, setInstalledParts] = useState<InstalledPart[]>([]);
  const [installedEquipment, setInstalledEquipment] = useState<CustomerEquipmentByLocation[]>([]);
  const [financials, setFinancials] = useState<CustomerFinancialSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      loadServiceHistory();
    } else if (activeTab === 'parts') {
      loadInstalledParts();
    } else if (activeTab === 'equipment') {
      loadInstalledEquipment();
    } else if (activeTab === 'financials') {
      loadFinancials();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, customer.id]);

  const loadServiceHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from('tickets') as unknown as { select: (query: string) => { eq: (col: string, val: string) => { order: (col: string, opts: { ascending: boolean }) => Promise<{ data: Ticket[] | null; error: Error | null }> } } })
        .select('*, profiles:assigned_to(full_name)')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data as unknown as Ticket[]) || []);
    } catch (error) {
      console.error('Error loading service history:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledParts = async () => {
    console.log('Loading installed parts for customer:', customer.id);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('customer_parts_installed')
        .select('*, parts(name, part_number), profiles:installed_by(full_name)')
        .eq('customer_id', customer.id)
        .order('installation_date', { ascending: false });

      if (error) throw error;
      console.log('Installed parts loaded:', data?.length || 0);
      setInstalledParts((data as InstalledPart[]) || []);
    } catch (error) {
      console.error('Error loading installed parts:', error);
      alert('Error loading installed parts: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledEquipment = async () => {
    setLoading(true);
    try {
      const equipment = await getCustomerInstalledEquipment(customer.id);
      setInstalledEquipment(equipment);
    } catch (error) {
      console.error('Error loading installed equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFinancials = async () => {
    setLoading(true);
    try {
      const summary = await getCustomerFinancialSummary(customer.id);
      setFinancials(summary);
    } catch (error) {
      console.error('Error loading financials:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      open: 'badge badge-blue',
      scheduled: 'badge badge-yellow',
      in_progress: 'badge badge-orange',
      completed: 'badge badge-green',
      cancelled: 'badge badge-gray',
    };
    return badges[status as keyof typeof badges] || 'badge badge-gray';
  };

  const getPriorityBadge = (priority: string) => {
    const badges = {
      low: 'badge badge-gray',
      normal: 'badge badge-blue',
      high: 'badge badge-orange',
      urgent: 'badge badge-red',
    };
    return badges[priority as keyof typeof badges] || 'badge badge-gray';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-0 md:p-4">
      <div className="bg-white dark:bg-gray-800 md:rounded-xl shadow-2xl max-w-4xl w-full h-full md:h-auto md:max-h-[90vh] overflow-y-auto flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Customer Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-600 to-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-xl md:text-2xl">{customer.name.charAt(0)}</span>
            </div>
            <div>
              <h3 className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{customer.name}</h3>
              <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Customer since {new Date(customer.created_at ?? new Date()).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700 px-2 py-2 flex-shrink-0">
          <div className="flex flex-wrap gap-1 justify-center md:justify-start">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-1.5 px-2 md:py-2 md:px-3 font-medium text-xs md:text-sm transition-colors rounded-lg flex items-center space-x-1 ${
                activeTab === 'info'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Contact</span>
            </button>
            <button
              onClick={() => setActiveTab('equipment')}
              className={`py-1.5 px-2 md:py-2 md:px-3 font-medium text-xs md:text-sm transition-colors rounded-lg flex items-center space-x-1 ${
                activeTab === 'equipment'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Equip</span>
            </button>
            <button
              onClick={() => setActiveTab('parts')}
              className={`py-1.5 px-2 md:py-2 md:px-3 font-medium text-xs md:text-sm transition-colors rounded-lg flex items-center space-x-1 ${
                activeTab === 'parts'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Package className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>Parts</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-1.5 px-2 md:py-2 md:px-3 font-medium text-xs md:text-sm transition-colors rounded-lg flex items-center space-x-1 ${
                activeTab === 'history'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span>History</span>
            </button>
            {!isTechnician && (
              <button
                onClick={() => setActiveTab('financials')}
                className={`py-1.5 px-2 md:py-2 md:px-3 font-medium text-xs md:text-sm transition-colors rounded-lg flex items-center space-x-1 ${
                  activeTab === 'financials'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <DollarSign className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span>Finance</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-4 md:p-6 flex-1">
          {activeTab === 'info' && (
            <div className="space-y-4">
              {customer.email && (
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Mail className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Email</p>
                    <p className="text-gray-900 dark:text-white">{customer.email}</p>
                  </div>
                </div>
              )}

              {customer.phone && (
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                    <p className="text-gray-900 dark:text-white">{customer.phone}</p>
                  </div>
                </div>
              )}

              {(customer.site_contact_name || customer.site_contact_phone) && (
                <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Phone className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Site Contact</p>
                    {customer.site_contact_name && (
                      <p className="text-gray-900 dark:text-white font-medium">{customer.site_contact_name}</p>
                    )}
                    {customer.site_contact_phone && (
                      <a
                        href={`tel:${customer.site_contact_phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {customer.site_contact_phone}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {customer.address && (
                <div className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Address</p>
                    <p className="text-gray-900 dark:text-white">
                      {customer.address}
                      {customer.city && (
                        <>
                          <br />
                          {customer.city}
                          {customer.state && `, ${customer.state}`}
                          {customer.zip_code && ` ${customer.zip_code}`}
                        </>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {customer.notes && (
                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Notes</p>
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {customer.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'equipment' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : installedEquipment.length === 0 ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                  <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No installed equipment has been recorded for this customer yet.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {installedEquipment.map((location) => (
                    <div key={location.location_id}>
                      <div className="mb-4">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {location.location_name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {location.location_address}
                        </p>
                      </div>

                      <div className="space-y-3">
                        {location.equipment.map((equip) => {
                          const warrantyInfo = getWarrantyStatusBadge(equip.warranty_expiration);
                          return (
                            <div key={equip.id} className="card p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                      {equip.equipment_type}
                                    </h4>
                                    <span className={warrantyInfo.className}>
                                      {warrantyInfo.text}
                                    </span>
                                  </div>

                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <p className="text-gray-600 dark:text-gray-400">Manufacturer</p>
                                      <p className="text-gray-900 dark:text-white font-medium">
                                        {equip.manufacturer}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600 dark:text-gray-400">Model</p>
                                      <p className="text-gray-900 dark:text-white font-medium">
                                        {equip.model_number}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600 dark:text-gray-400">Serial Number</p>
                                      <p className="text-gray-900 dark:text-white font-medium">
                                        {equip.serial_number}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-gray-600 dark:text-gray-400">Install Date</p>
                                      <p className="text-gray-900 dark:text-white font-medium">
                                        {equip.installation_date
                                          ? new Date(equip.installation_date).toLocaleDateString()
                                          : 'Unknown'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
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
          )}

          {activeTab === 'parts' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : installedParts.length === 0 ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No parts installed yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {installedParts.map((item) => (
                    <div key={item.id} className="card p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {item.parts?.name}
                            </h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              ({item.parts?.part_number})
                            </span>
                          </div>
                          <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>
                                Installed: {new Date(item.installation_date).toLocaleDateString()}
                              </span>
                            </p>
                            {item.profiles && (
                              <p>Installed by: {item.profiles.full_name}</p>
                            )}
                            {item.location_notes && <p>Location: {item.location_notes}</p>}
                            {item.warranty_expiration && (
                              <p>
                                Warranty expires:{' '}
                                {new Date(item.warranty_expiration).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          {item.notes && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                              {item.notes}
                            </p>
                          )}
                        </div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white ml-4">
                          {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : tickets.length === 0 ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                  <Wrench className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No service history yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="card p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {ticket.title}
                            </h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              #{ticket.ticket_number}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {ticket.service_type}
                          </p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <span className={getStatusBadge(ticket.status ?? '')}>{ticket.status ?? ''}</span>
                          <span className={getPriorityBadge(ticket.priority ?? '')}>
                            {ticket.priority ?? ''}
                          </span>
                        </div>
                      </div>

                      {ticket.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {ticket.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div>
                          {ticket.profiles && (
                            <span>Assigned to: {ticket.profiles.full_name}</span>
                          )}
                        </div>
                        <div>
                          {ticket.completed_date ? (
                            <span>
                              Completed: {new Date(ticket.completed_date).toLocaleDateString()}
                            </span>
                          ) : ticket.scheduled_date ? (
                            <span>
                              Scheduled: {new Date(ticket.scheduled_date).toLocaleDateString()}
                            </span>
                          ) : (
                            <span>Created: {new Date(ticket.created_at ?? new Date()).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'financials' && (
            <div>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : !financials ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Unable to load financial data</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(financials.total_revenue_lifetime)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Lifetime</p>
                    </div>

                    <div className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">YTD Revenue</p>
                        <Calendar className="w-5 h-5 text-blue-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(financials.total_revenue_ytd)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {new Date().getFullYear()}
                      </p>
                    </div>

                    <div className="card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
                        <AlertCircle className="w-5 h-5 text-orange-600" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(financials.total_outstanding)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Balance Due</p>
                    </div>
                  </div>

                  {/* Last Invoice Date */}
                  {financials.last_invoice_date && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Last Invoice: {new Date(financials.last_invoice_date).toLocaleDateString()}
                    </div>
                  )}

                  {/* Invoices Table */}
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                      Invoices
                    </h3>
                    {financials.invoices.length === 0 ? (
                      <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No invoices yet</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                Invoice #
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                Issue Date
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                Due Date
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                Amount
                              </th>
                              <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                Balance Due
                              </th>
                              <th className="px-4 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {financials.invoices.map((invoice) => (
                              <tr
                                key={invoice.id}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                              >
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                  {invoice.invoice_number}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                  {new Date(invoice.issue_date).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                  {invoice.due_date
                                    ? new Date(invoice.due_date).toLocaleDateString()
                                    : '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(invoice.total_amount)}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                  {formatCurrency(invoice.balance_due)}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <span className={getInvoiceStatusBadge(invoice.status)}>
                                    {invoice.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {!isTechnician && (
          <div className="flex space-x-3 p-4 md:p-6 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800">
            <button
              onClick={onEdit}
              className="btn btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onDelete}
              className="btn btn-outline text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
