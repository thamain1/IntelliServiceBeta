import { useEffect, useState } from 'react';
import { Plus, Search, Wrench, Shield, AlertCircle, X, Package, Calendar, User, MapPin } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Equipment = Database['public']['Tables']['equipment']['Row'] & {
  customers?: { name: string };
};

type InstalledPart = {
  installation_id: string;
  part_id: string;
  part_number: string;
  part_name: string;
  part_description: string | null;
  part_manufacturer: string | null;
  part_category: string | null;
  is_serialized: boolean;
  quantity: number;
  installation_date: string;
  installed_by: string | null;
  ticket_id: string | null;
  equipment_location_notes: string | null;
  installation_notes: string | null;
  serialized_part_id: string | null;
  serial_number: string | null;
  manufacture_date: string | null;
  warranty_start_date: string | null;
  warranty_end_date: string | null;
  warranty_months: number | null;
  warranty_status: string;
  installed_by_name: string | null;
  ticket_number: string | null;
  ticket_title: string | null;
};

export function EquipmentView() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [installedParts, setInstalledParts] = useState<InstalledPart[]>([]);
  const [partsLoading, setPartsLoading] = useState(false);

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment')
        .select('*, customers(name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEquipment((data as Equipment[]) || []);
    } catch (error) {
      console.error('Error loading equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInstalledParts = async (equipmentId: string) => {
    setPartsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vw_equipment_installed_parts')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('installation_date', { ascending: false });

      if (error) throw error;
      setInstalledParts((data as InstalledPart[]) || []);
    } catch (error) {
      console.error('Error loading installed parts:', error);
      setInstalledParts([]);
    } finally {
      setPartsLoading(false);
    }
  };

  const handleEquipmentClick = (item: Equipment) => {
    setSelectedEquipment(item);
    loadInstalledParts(item.id);
  };

  const types = Array.from(new Set(equipment.map((e) => e.equipment_type).filter(Boolean)));

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || item.equipment_type === typeFilter;

    return matchesSearch && matchesType;
  });

  const getWarrantyStatus = (item: Equipment) => {
    if (!item.warranty_expiration) {
      return { text: 'Unknown', class: 'badge badge-gray' };
    }

    const expirationDate = new Date(item.warranty_expiration);
    const today = new Date();
    const daysUntilExpiration = Math.floor(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiration < 0) {
      return { text: 'Expired', class: 'badge badge-red' };
    } else if (daysUntilExpiration < 90) {
      return { text: 'Expiring Soon', class: 'badge badge-yellow' };
    } else {
      return { text: 'Active', class: 'badge badge-green' };
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const expiringSoon = equipment.filter((item) => {
    if (!item.warranty_expiration) return false;
    const expirationDate = new Date(item.warranty_expiration);
    const today = new Date();
    const daysUntilExpiration = Math.floor(
      (expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiration >= 0 && daysUntilExpiration < 90;
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Equipment Tracking</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage HVAC equipment and warranty information
          </p>
        </div>
        <button className="btn btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Equipment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Equipment</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {equipment.length}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
              <Wrench className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Under Warranty</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {
                  equipment.filter((e) => {
                    const status = getWarrantyStatus(e);
                    return status.text === 'Active' || status.text === 'Expiring Soon';
                  }).length
                }
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{expiringSoon.length}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
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
              placeholder="Search serial numbers, models, manufacturers, customers..."
              className="input pl-10"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="input md:w-64"
          >
            <option value="all">All Equipment Types</option>
            {types.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Serial Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Model & Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Installation Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Warranty Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Warranty Expires
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No equipment found
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((item) => {
                  const warrantyStatus = getWarrantyStatus(item);
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleEquipmentClick(item)}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {item.serial_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-gray-900 dark:text-white">
                            {item.model_number}
                          </span>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {item.equipment_type}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">{item.manufacturer}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">
                          {item.customers?.name || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(item.installation_date)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={warrantyStatus.class}>{warrantyStatus.text}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {formatDate(item.warranty_expiration)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">
                          {item.location || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {expiringSoon.length > 0 && (
        <div className="card p-6 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-yellow-900 dark:text-yellow-200">
                Warranty Expiration Alert
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {expiringSoon.length} equipment warranties are expiring within 90 days
              </p>
            </div>
          </div>
        </div>
      )}

      {selectedEquipment && (
        <EquipmentDetailModal
          equipment={selectedEquipment}
          installedParts={installedParts}
          loading={partsLoading}
          onClose={() => setSelectedEquipment(null)}
        />
      )}
    </div>
  );
}

interface EquipmentDetailModalProps {
  equipment: Equipment;
  installedParts: InstalledPart[];
  loading: boolean;
  onClose: () => void;
}

function EquipmentDetailModal({ equipment, installedParts, loading, onClose }: EquipmentDetailModalProps) {
  const getWarrantyBadge = (status: string) => {
    const badges: Record<string, string> = {
      active: 'badge bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      expiring_soon: 'badge bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      expired: 'badge bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      unknown: 'badge badge-gray',
    };
    return badges[status] || badges.unknown;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {equipment.equipment_type}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {equipment.manufacturer} - {equipment.model_number}
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
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Equipment Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Serial Number</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {equipment.serial_number}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Customer</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {equipment.customers?.name || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Installation Date</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatDate(equipment.installation_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Warranty Expiration</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatDate(equipment.warranty_expiration)}
                  </p>
                </div>
                {equipment.location && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                    <p className="text-gray-900 dark:text-white font-medium">{equipment.location}</p>
                  </div>
                )}
                {equipment.notes && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                    <p className="text-gray-900 dark:text-white">{equipment.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <Package className="w-5 h-5" />
                  <span>Installed Parts ({installedParts.length})</span>
                </h3>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : installedParts.length === 0 ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No parts installed on this equipment yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {installedParts.map((part) => (
                    <div
                      key={part.installation_id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-bold text-gray-900 dark:text-white">
                              {part.part_name}
                            </h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {part.part_number}
                            </span>
                            {part.is_serialized && part.serial_number && (
                              <span className="badge badge-blue text-xs">
                                S/N: {part.serial_number}
                              </span>
                            )}
                            <span className={getWarrantyBadge(part.warranty_status)}>
                              {part.warranty_status === 'active' && 'Under Warranty'}
                              {part.warranty_status === 'expiring_soon' && 'Expiring Soon'}
                              {part.warranty_status === 'expired' && 'Expired'}
                              {part.warranty_status === 'unknown' && 'Unknown'}
                            </span>
                          </div>

                          {part.part_description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {part.part_description}
                            </p>
                          )}

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {part.part_manufacturer && (
                              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                <Wrench className="w-4 h-4" />
                                <span>{part.part_manufacturer}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4" />
                              <span>Installed: {formatDate(part.installation_date)}</span>
                            </div>
                            {part.installed_by_name && (
                              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                <User className="w-4 h-4" />
                                <span>{part.installed_by_name}</span>
                              </div>
                            )}
                            {part.equipment_location_notes && (
                              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                <span>{part.equipment_location_notes}</span>
                              </div>
                            )}
                            {part.warranty_end_date && (
                              <div className="col-span-2 text-gray-600 dark:text-gray-400">
                                <span>Warranty expires: {formatDate(part.warranty_end_date)}</span>
                              </div>
                            )}
                          </div>

                          {part.installation_notes && (
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic">
                              {part.installation_notes}
                            </p>
                          )}

                          {part.ticket_number && (
                            <div className="mt-2">
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                Installed via ticket: {part.ticket_number}
                                {part.ticket_title && ` - ${part.ticket_title}`}
                              </span>
                            </div>
                          )}
                        </div>

                        {!part.is_serialized && (
                          <div className="ml-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                {part.quantity}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400">qty</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          <button onClick={onClose} className="btn btn-outline">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
