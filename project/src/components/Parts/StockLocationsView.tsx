import { useEffect, useState } from 'react';
import { MapPin, Package, Truck, Warehouse, Building2, Plus, Search } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type StockLocation = Database['public']['Tables']['stock_locations']['Row'];
type PartInventory = Database['public']['Tables']['part_inventory']['Row'] & {
  parts?: {
    name: string;
    part_number: string;
    unit_price: number | null;
    item_type?: string;
  };
  stock_locations?: {
    name: string;
  };
};

type LocationType = 'warehouse' | 'truck' | 'project_site' | 'customer_site' | 'vendor' | 'main_warehouse' | 'vehicle';
type ItemType = 'part' | 'tool';

interface StockLocationsViewProps {
  itemType?: ItemType;
}

export function StockLocationsView({ itemType = 'part' }: StockLocationsViewProps) {
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<StockLocation | null>(null);
  const [inventory, setInventory] = useState<PartInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationTypeFilter, setLocationTypeFilter] = useState<string>('all');

  useEffect(() => {
    loadLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedLocation) {
      loadInventory(selectedLocation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, itemType]);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_locations')
        .select('*')
        .eq('is_active', true)
        .order('location_type')
        .order('name');

      if (error) throw error;
      setLocations(data || []);
      if (data && data.length > 0 && !selectedLocation) {
        setSelectedLocation(data[0]);
      }
    } catch (error) {
      console.error('Error loading locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInventory = async (locationId: string) => {
    setInventoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('part_inventory')
        .select(`
          *,
          parts!inner(name, part_number, unit_price, item_type),
          stock_locations(name)
        `)
        .eq('stock_location_id', locationId)
        .eq('parts.item_type', itemType)
        .gt('quantity', 0)
        .order('quantity', { ascending: false });

      if (error) throw error;
      setInventory((data || []) as PartInventory[]);
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setInventoryLoading(false);
    }
  };

  const filteredLocations = locations.filter((location) => {
    const matchesSearch =
      location.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = locationTypeFilter === 'all' || location.location_type === locationTypeFilter;

    return matchesSearch && matchesType;
  });

  const locationTypeCounts = {
    all: locations.length,
    main_warehouse: locations.filter((l) => l.location_type === 'warehouse').length,
    vehicle: locations.filter((l) => l.location_type === 'truck').length,
    warehouse: locations.filter((l) => l.location_type === 'warehouse').length,
    truck: locations.filter((l) => l.location_type === 'truck').length,
  };

  const getLocationIcon = (type: LocationType) => {
    switch (type) {
      case 'main_warehouse':
      case 'warehouse':
        return Warehouse;
      case 'vehicle':
      case 'truck':
        return Truck;
      case 'project_site':
      case 'customer_site':
        return Building2;
      default:
        return MapPin;
    }
  };

  const formatLocationType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getTotalInventoryValue = () => {
    return inventory.reduce((sum, item) => {
      const cost = item.parts?.unit_price || 0;
      return sum + cost * item.quantity;
    }, 0);
  };

  const getTotalParts = () => {
    return inventory.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Locations</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View inventory levels across all warehouses, trucks, and sites
          </p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
          <Plus className="w-5 h-5" />
          <span>Add Location</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { id: 'all', label: 'All Locations', count: locationTypeCounts.all, icon: MapPin },
          { id: 'main_warehouse', label: 'Warehouses', count: locationTypeCounts.main_warehouse, icon: Warehouse },
          { id: 'vehicle', label: 'Vehicles', count: locationTypeCounts.vehicle, icon: Truck },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.id}
              onClick={() => setLocationTypeFilter(stat.id)}
              className={`card p-4 text-left transition-all ${
                locationTypeFilter === stat.id
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                  : 'hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {stat.count}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
              {filteredLocations.length === 0 ? (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  No locations found
                </div>
              ) : (
                filteredLocations.map((location) => {
                  const Icon = getLocationIcon(location.location_type as LocationType);
                  const isSelected = selectedLocation?.id === location.id;

                  return (
                    <button
                      key={location.id}
                      onClick={() => setSelectedLocation(location)}
                      className={`w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected
                              ? 'bg-blue-100 dark:bg-blue-900/30'
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                        >
                          <Icon
                            className={`w-5 h-5 ${
                              isSelected
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-600 dark:text-gray-400'
                            }`}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-900 dark:text-white truncate">
                              {location.name}
                            </p>
                            {location.is_mobile && (
                              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                                Mobile
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            {location.location_type === 'truck' ? 'Mobile' : formatLocationType(location.location_type)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatLocationType(location.location_type)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedLocation ? (
            <div className="space-y-4">
              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      {(() => {
                        const Icon = getLocationIcon(selectedLocation.location_type as LocationType);
                        return <Icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />;
                      })()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedLocation.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {formatLocationType(selectedLocation.location_type)}
                      </p>
                      {selectedLocation.address && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {selectedLocation.address}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Parts</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      {getTotalParts()}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                      ${getTotalInventoryValue().toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <Package className="w-5 h-5" />
                    <span>Inventory at this Location</span>
                  </h3>
                </div>

                {inventoryLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Part Number
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Part Name
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Unit Cost
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Total Value
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {inventory.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                            >
                              No inventory at this location
                            </td>
                          </tr>
                        ) : (
                          inventory.map((item) => {
                            const unitCost = item.parts?.unit_price || 0;
                            const totalValue = unitCost * item.quantity;

                            return (
                              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                  {item.parts?.part_number}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                                  {item.parts?.name}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                  {item.quantity}
                                </td>
                                <td className="px-4 py-3 text-sm text-right text-gray-600 dark:text-gray-400">
                                  ${unitCost.toFixed(2)}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                                  ${totalValue.toFixed(2)}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="card p-12 text-center">
              <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                Select a location to view its inventory
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
