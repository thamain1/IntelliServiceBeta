import { useEffect, useState } from 'react';
import { X, CheckCircle, XCircle, Edit2, Truck, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type StockLocation = Database['public']['Tables']['stock_locations']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

interface VehicleWithTechnician extends StockLocation {
  profiles: Pick<Profile, 'id' | 'full_name'> | null;
}

export function VehiclesSettings() {
  const [vehicles, setVehicles] = useState<VehicleWithTechnician[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<VehicleWithTechnician | null>(null);
  const [saving, setSaving] = useState(false);
  const [editFormData, setEditFormData] = useState({
    technician_id: '',
    vehicle_id: '',
    is_active: true,
  });

  useEffect(() => {
    loadVehicles();
    loadTechnicians();
  }, []);

  const loadVehicles = async () => {
    try {
      // Get all mobile/truck locations (check both location_type and is_mobile flag)
      const { data: locations, error: locError } = await supabase
        .from('stock_locations')
        .select('*')
        .or('location_type.eq.truck,is_mobile.eq.true')
        .order('name', { ascending: true });

      if (locError) throw locError;

      // Get all technician profiles
      const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'technician');

      if (profError) throw profError;

      // Create a map of technician profiles for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Map all vehicles with their profile data (if assigned)
      const allVehicles = (locations || []).map(loc => ({
        ...loc,
        profiles: loc.technician_id ? profileMap.get(loc.technician_id) || null : null
      })) as VehicleWithTechnician[];

      setVehicles(allVehicles);
    } catch (error) {
      console.error('Error loading vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'technician')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const getDisplayName = (vehicle: VehicleWithTechnician): string => {
    if (vehicle.profiles?.full_name) {
      const firstName = vehicle.profiles.full_name.split(' ')[0];
      return `${firstName}'s Truck`;
    }
    // For unassigned vehicles, just show the location name
    return vehicle.name;
  };

  const isAssigned = (vehicle: VehicleWithTechnician): boolean => {
    return !!(vehicle.technician_id && vehicle.profiles?.full_name);
  };

  const handleEditVehicle = (vehicle: VehicleWithTechnician) => {
    setEditingVehicle(vehicle);
    setEditFormData({
      technician_id: vehicle.technician_id || '',
      vehicle_id: vehicle.vehicle_id || '',
      is_active: vehicle.is_active ?? true,
    });
    setShowEditModal(true);
  };

  const handleUpdateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVehicle) return;

    setSaving(true);
    try {
      // Update the stock_locations record
      const { error: locationError } = await supabase
        .from('stock_locations')
        .update({
          technician_id: editFormData.technician_id || null,
          vehicle_id: editFormData.vehicle_id || null,
          is_active: editFormData.is_active,
        })
        .eq('id', editingVehicle.id);

      if (locationError) throw locationError;

      // If technician changed, update profiles.default_vehicle_id for sync
      if (editFormData.technician_id && editFormData.technician_id !== editingVehicle.technician_id) {
        // Clear old technician's default_vehicle_id if they had this vehicle
        if (editingVehicle.technician_id) {
          await supabase
            .from('profiles')
            .update({ default_vehicle_id: null })
            .eq('id', editingVehicle.technician_id)
            .eq('default_vehicle_id', editingVehicle.id);
        }

        // Set new technician's default_vehicle_id
        await supabase
          .from('profiles')
          .update({ default_vehicle_id: editingVehicle.id })
          .eq('id', editFormData.technician_id);
      }

      setShowEditModal(false);
      setEditingVehicle(null);
      loadVehicles();
    } catch (error) {
      console.error('Error updating vehicle:', error);
      alert('Failed to update vehicle. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (vehicleId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('stock_locations')
        .update({ is_active: !currentStatus })
        .eq('id', vehicleId);

      if (error) throw error;
      loadVehicles();
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      alert('Failed to update vehicle status. Please try again.');
    }
  };

  const handleDeleteVehicle = async (vehicle: VehicleWithTechnician) => {
    try {
      // Check if vehicle has inventory
      const { data: inventory, error: invError } = await supabase
        .from('part_inventory')
        .select('id, quantity')
        .eq('stock_location_id', vehicle.id)
        .gt('quantity', 0);

      if (invError) throw invError;

      if (inventory && inventory.length > 0) {
        const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
        const shouldDeactivate = confirm(
          `"${vehicle.name}" has ${totalItems} parts in inventory across ${inventory.length} line items.\n\n` +
          `You cannot delete a vehicle with inventory. Would you like to DEACTIVATE it instead?\n\n` +
          `Click OK to deactivate, or Cancel to go back.`
        );

        if (shouldDeactivate) {
          await supabase
            .from('stock_locations')
            .update({ is_active: false })
            .eq('id', vehicle.id);
          loadVehicles();
        }
        return;
      }

      // No inventory - confirm deletion
      const confirmMessage = vehicle.profiles?.full_name
        ? `Are you sure you want to delete "${vehicle.name}" (assigned to ${vehicle.profiles.full_name})?`
        : `Are you sure you want to delete "${vehicle.name}"?`;

      if (!confirm(confirmMessage)) return;

      // Clear technician's default_vehicle_id if this was their vehicle
      if (vehicle.technician_id) {
        await supabase
          .from('profiles')
          .update({ default_vehicle_id: null })
          .eq('id', vehicle.technician_id)
          .eq('default_vehicle_id', vehicle.id);
      }

      // Delete any zero-quantity inventory records
      await supabase
        .from('part_inventory')
        .delete()
        .eq('stock_location_id', vehicle.id);

      // Delete the stock location
      const { error } = await supabase
        .from('stock_locations')
        .delete()
        .eq('id', vehicle.id);

      if (error) throw error;
      loadVehicles();
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      alert('Failed to delete vehicle. Please try deactivating it instead.');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Vehicles</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {vehicles.filter(v => isAssigned(v)).length} assigned of {vehicles.length} total vehicle{vehicles.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Display Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  License / Asset #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {vehicles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <Truck className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No vehicles found</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Add vehicles through Stock Locations in Parts Management
                    </p>
                  </td>
                </tr>
              ) : (
                vehicles.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !isAssigned(vehicle) ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isAssigned(vehicle)
                            ? 'bg-blue-100 dark:bg-blue-900/30'
                            : 'bg-yellow-100 dark:bg-yellow-900/30'
                        }`}>
                          <Truck className={`w-5 h-5 ${
                            isAssigned(vehicle)
                              ? 'text-blue-600 dark:text-blue-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {getDisplayName(vehicle)}
                          </div>
                          <div className={`text-sm ${
                            isAssigned(vehicle)
                              ? 'text-gray-500 dark:text-gray-400'
                              : 'text-yellow-600 dark:text-yellow-400 font-medium'
                          }`}>
                            {vehicle.profiles?.full_name || 'Unassigned - Click Edit to assign'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white font-mono">
                        {vehicle.vehicle_id || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {vehicle.is_active ? (
                        <span className="flex items-center text-green-600 dark:text-green-400">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-red-600 dark:text-red-400">
                          <XCircle className="w-4 h-4 mr-1" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditVehicle(vehicle)}
                          className="btn btn-outline text-sm py-1 px-3 flex items-center space-x-1"
                          title="Edit Vehicle"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleToggleActive(vehicle.id, vehicle.is_active ?? true)}
                          className={`btn ${
                            vehicle.is_active ? 'btn-outline' : 'btn-primary'
                          } text-sm py-1 px-3`}
                        >
                          {vehicle.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(vehicle)}
                          className="btn btn-outline text-sm py-1 px-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                          title="Delete Vehicle"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEditModal && editingVehicle && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Vehicle</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingVehicle(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdateVehicle} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Vehicle Name
                </label>
                <input
                  type="text"
                  disabled
                  value={editingVehicle.name}
                  className="input bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Vehicle name is set in stock locations
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Assigned Technician *
                </label>
                <select
                  required
                  value={editFormData.technician_id}
                  onChange={(e) => setEditFormData({ ...editFormData, technician_id: e.target.value })}
                  className="input"
                >
                  <option value="">Select a technician</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  License Plate / Asset #
                </label>
                <input
                  type="text"
                  value={editFormData.vehicle_id}
                  onChange={(e) => setEditFormData({ ...editFormData, vehicle_id: e.target.value })}
                  className="input"
                  placeholder="e.g., ABC-1234 or ASSET-001"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={editFormData.is_active}
                  onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingVehicle(null);
                  }}
                  disabled={saving}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="btn btn-primary flex-1">
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
