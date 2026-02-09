import { useEffect, useState } from 'react';
import { Warehouse, Truck, Plus, X, MapPin, Package, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type StockLocation = Database['public']['Tables']['stock_locations']['Row'] & {
  profiles?: { full_name: string };
};

type PartInventoryWithDetails = Database['public']['Tables']['part_inventory']['Row'] & {
  parts?: Database['public']['Tables']['parts']['Row'];
};

export function WarehouseLocationsView() {
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<StockLocation | null>(null);
  const [inventoryItems, setInventoryItems] = useState<PartInventoryWithDetails[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [technicians, setTechnicians] = useState<{ id: string; full_name: string }[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    location_type: 'warehouse' as 'warehouse' | 'truck' | 'customer_site',
    vehicle_id: '',
    technician_id: '',
    address: '',
    is_active: true,
  });

  useEffect(() => {
    loadLocations();
    loadTechnicians();
  }, []);

  const loadLocations = async () => {
    try {
      // Complex query with alias requires type assertion
      const { data, error } = await (supabase
        .from('stock_locations') as unknown as { select: (s: string) => ReturnType<typeof supabase.from> })
        .select('*, profiles:technician_id(full_name)')
        .order('location_type', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setLocations((data || []) as StockLocation[]);
    } catch (error) {
      console.error('Error loading warehouse locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('role', 'technician')
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setTechnicians(data || []);
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const insertData: Record<string, string | boolean | null> = {
        name: formData.name,
        location_type: formData.location_type,
        address: formData.address || null,
        is_active: formData.is_active,
      };

      if (formData.location_type === 'truck') {
        insertData.vehicle_id = formData.vehicle_id || null;
        insertData.technician_id = formData.technician_id || null;
      }

      const { error } = await supabase.from('stock_locations').insert([insertData]);

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        name: '',
        location_type: 'warehouse',
        vehicle_id: '',
        technician_id: '',
        address: '',
        is_active: true,
      });
      loadLocations();
    } catch (error) {
      console.error('Error adding location:', error);
      alert('Failed to add warehouse location. Please try again.');
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'warehouse':
      case 'main_warehouse':
        return <Warehouse className="w-5 h-5" />;
      case 'truck':
      case 'vehicle':
        return <Truck className="w-5 h-5" />;
      case 'customer_site':
        return <MapPin className="w-5 h-5" />;
      default:
        return <Warehouse className="w-5 h-5" />;
    }
  };

  const getLocationTypeLabel = (type: string) => {
    switch (type) {
      case 'warehouse':
      case 'main_warehouse':
        return 'Warehouse';
      case 'truck':
      case 'vehicle':
        return 'Truck';
      case 'customer_site':
        return 'Customer Site';
      default:
        return type;
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Warehouse Locations</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Add Location</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {locations.map((location) => (
          <div
            key={location.id}
            className="card p-4 hover:shadow-lg transition-shadow cursor-pointer"
            onClick={async () => {
              setSelectedLocation(location);
              setShowInventoryModal(true);
              setInventoryLoading(true);
              try {
                const { data, error } = await supabase
                  .from('part_inventory')
                  .select('*, parts(*)')
                  .eq('stock_location_id', location.id)
                  .order('quantity', { ascending: false });

                if (error) throw error;
                setInventoryItems(data || []);
              } catch (error) {
                console.error('Error loading inventory:', error);
              } finally {
                setInventoryLoading(false);
              }
            }}
          >
            <div className="flex items-start space-x-3">
              <div className={`p-3 rounded-lg ${
                location.location_type === 'warehouse'
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'
                  : location.location_type === 'truck'
                  ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                  : 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600'
              }`}>
                {getLocationIcon(location.location_type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">
                    {location.name}
                  </h3>
                  {!location.is_active && (
                    <span className="badge badge-gray text-xs">Inactive</span>
                  )}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {getLocationTypeLabel(location.location_type)}
                </p>
                {location.vehicle_id && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Vehicle: {location.vehicle_id}
                  </p>
                )}
                {location.profiles && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Assigned to: {location.profiles.full_name}
                  </p>
                )}
                {location.address && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {location.address}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Add Warehouse Location
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddLocation} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location Type *
                </label>
                <select
                  required
                  value={formData.location_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      location_type: e.target.value as 'warehouse' | 'truck' | 'customer_site' | 'project_site' | 'vendor',
                    })
                  }
                  className="input"
                >
                  <option value="warehouse">Warehouse</option>
                  <option value="truck">Truck</option>
                  <option value="customer_site">Customer Site</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Main Warehouse or Tech Vehicle 1"
                />
              </div>

              {formData.location_type === 'truck' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Vehicle ID
                    </label>
                    <input
                      type="text"
                      value={formData.vehicle_id}
                      onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                      className="input"
                      placeholder="e.g., VEH-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Assigned Technician
                    </label>
                    <select
                      value={formData.technician_id}
                      onChange={(e) =>
                        setFormData({ ...formData, technician_id: e.target.value })
                      }
                      className="input"
                    >
                      <option value="">Select Technician</option>
                      {technicians.map((tech) => (
                        <option key={tech.id} value={tech.id}>
                          {tech.full_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Enter physical address"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                  Location is active
                </label>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Add Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showInventoryModal && selectedLocation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedLocation.name}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {getLocationTypeLabel(selectedLocation.location_type)}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowInventoryModal(false);
                  setSelectedLocation(null);
                  setInventoryItems([]);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {inventoryLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : inventoryItems.length === 0 ? (
                <div className="text-center py-12 text-gray-600 dark:text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No inventory at this location</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="card p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {inventoryItems.length}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="card p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
                          <Package className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Quantity</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            {inventoryItems.reduce((sum, item) => sum + item.quantity, 0)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="card p-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 p-3 rounded-lg">
                          <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            $
                            {inventoryItems
                              .reduce(
                                (sum, item) =>
                                  sum + (item.parts?.unit_price || 0) * item.quantity,
                                0
                              )
                              .toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Part Number
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Category
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Quantity
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Unit Price
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Total Value
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {inventoryItems.map((item) => (
                            <tr
                              key={item.id}
                              className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.parts?.part_number}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div>
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                                    {item.parts?.name}
                                  </div>
                                  {item.parts?.manufacturer && (
                                    <div className="text-xs text-gray-500 dark:text-gray-400">
                                      {item.parts.manufacturer}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="badge badge-blue text-xs">
                                  {item.parts?.category}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {item.quantity}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="text-sm text-gray-900 dark:text-white">
                                  ${(item.parts?.unit_price ?? 0).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                  ${((item.parts?.unit_price || 0) * item.quantity).toFixed(2)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
