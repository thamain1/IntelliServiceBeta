import { useEffect, useState } from 'react';
import { Plus, Search, Package, AlertTriangle, TrendingDown, X, Warehouse, MapPin, Wrench, Edit2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { WarehouseLocationsView } from './WarehouseLocationsView';
import { PartInventoryModal } from './PartInventoryModal';

interface Vendor {
  id: string;
  name: string;
}

interface VendorMapping {
  id?: string;
  vendor_id: string;
  vendor_part_number: string;
  standard_cost: number;
  lead_time_days: number;
  minimum_order_qty: number;
  is_preferred_vendor: boolean;
}

type Part = Database['public']['Tables']['parts']['Row'] & {
  item_type?: string;
  is_returnable?: boolean;
  tool_category?: string;
  asset_tag?: string;
  requires_registration?: boolean;
  registration_url?: string | null;
};

type PartWithInventory = Part & {
  part_inventory: Array<{
    quantity: number;
    stock_locations: {
      id: string;
      name: string;
    } | null;
  }>;
};

type ItemType = 'part' | 'tool';

interface PartsViewProps {
  itemType?: ItemType;
}

export function PartsView({ itemType = 'part' }: PartsViewProps) {
  const isTool = itemType === 'tool';
  const itemLabel = isTool ? 'Tool' : 'Part';
  const itemLabelPlural = isTool ? 'Tools' : 'Parts';
  const ItemIcon = isTool ? Wrench : Package;
  const [parts, setParts] = useState<PartWithInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [reorderAlertCount, setReorderAlertCount] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'inventory' | 'warehouses'>('inventory');
  const [selectedPartForInventory, setSelectedPartForInventory] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [editingPart, setEditingPart] = useState<PartWithInventory | null>(null);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorMapping, setVendorMapping] = useState<VendorMapping>({
    vendor_id: '',
    vendor_part_number: '',
    standard_cost: 0,
    lead_time_days: 7,
    minimum_order_qty: 1,
    is_preferred_vendor: true,
  });
  const getInitialFormData = () => ({
    part_number: '',
    name: '',
    description: '',
    manufacturer: '',
    category: '',
    quantity_on_hand: 0,
    reorder_level: 0,
    unit_price: 0,
    location: '',
    warranty_period_months: null as number | null,
    is_serialized: false,
    default_warranty_months: 12,
    vendor_part_number: '',
    reorder_point: 0,
    reorder_quantity: 0,
    item_type: itemType,
    is_returnable: isTool,
    tool_category: '' as string,
    asset_tag: '' as string,
    requires_registration: false,
    registration_url: '',
  });

  const [formData, setFormData] = useState(getInitialFormData());

  useEffect(() => {
    loadParts();
    loadVendors();
    loadReorderAlertCount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemType]);

  const loadReorderAlertCount = async () => {
    try {
      const { data, error } = await supabase
        .from('vw_reorder_alerts')
        .select('part_id')
        .eq('below_reorder_point', true);

      if (error) throw error;

      // Count unique parts (view may have multiple locations per part)
      const uniqueParts = new Set(data?.map((r) => r.part_id) || []);
      setReorderAlertCount(uniqueParts.size);
    } catch (error) {
      console.error('Error loading reorder alert count:', error);
    }
  };

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  const loadParts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*, part_inventory(quantity, stock_locations(name))')
        .eq('item_type', itemType)
        .order('name', { ascending: true });

      if (error) throw error;
      setParts((data as unknown as PartWithInventory[]) || []);
    } catch (error) {
      console.error(`Error loading ${itemLabelPlural.toLowerCase()}:`, error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = async (part: PartWithInventory) => {
    setEditingPart(part);
    setFormData({
      part_number: part.part_number,
      name: part.name,
      description: part.description || '',
      manufacturer: part.manufacturer || '',
      category: part.category || '',
      quantity_on_hand: part.quantity_on_hand ?? 0,
      reorder_level: part.reorder_level ?? 0,
      unit_price: part.unit_price ?? 0,
      location: part.location || '',
      warranty_period_months: part.warranty_period_months || 0,
      is_serialized: part.is_serialized || false,
      default_warranty_months: part.default_warranty_months || 12,
      vendor_part_number: part.vendor_part_number || '',
      reorder_point: part.reorder_point || 0,
      reorder_quantity: part.reorder_quantity || 0,
      item_type: (part.item_type || itemType) as ItemType,
      is_returnable: part.is_returnable || false,
      tool_category: part.tool_category || '',
      asset_tag: part.asset_tag || '',
      requires_registration: part.requires_registration || false,
      registration_url: part.registration_url || '',
    });

    // Load existing vendor mapping
    try {
      const { data, error } = await supabase
        .from('vendor_part_mappings')
        .select('*')
        .eq('part_id', part.id)
        .eq('is_preferred_vendor', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setVendorMapping({
          id: data.id,
          vendor_id: data.vendor_id,
          vendor_part_number: data.vendor_part_number || '',
          standard_cost: data.standard_cost || 0,
          lead_time_days: data.lead_time_days || 7,
          minimum_order_qty: data.minimum_order_qty || 1,
          is_preferred_vendor: true,
        });
      } else {
        setVendorMapping({
          vendor_id: '',
          vendor_part_number: '',
          standard_cost: 0,
          lead_time_days: 7,
          minimum_order_qty: 1,
          is_preferred_vendor: true,
        });
      }
    } catch (error) {
      console.error('Error loading vendor mapping:', error);
    }
  };

  const handleUpdatePart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart) return;

    try {
      // Update the part
      const { error: partError } = await supabase
        .from('parts')
        .update({
          part_number: formData.part_number,
          name: formData.name,
          description: formData.description || null,
          manufacturer: formData.manufacturer || null,
          category: formData.category || null,
          quantity_on_hand: formData.quantity_on_hand,
          reorder_level: formData.reorder_level,
          unit_price: formData.unit_price,
          location: formData.location || null,
          warranty_period_months: formData.warranty_period_months,
          is_serialized: formData.is_serialized,
          default_warranty_months: formData.default_warranty_months,
          vendor_part_number: formData.vendor_part_number || null,
          reorder_point: formData.reorder_point,
          reorder_quantity: formData.reorder_quantity,
          is_returnable: formData.is_returnable,
          tool_category: formData.tool_category || null,
          asset_tag: formData.asset_tag || null,
          requires_registration: formData.requires_registration,
          registration_url: formData.requires_registration ? formData.registration_url : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingPart.id);

      if (partError) throw partError;

      // Handle vendor mapping
      if (vendorMapping.vendor_id) {
        if (vendorMapping.id) {
          // Update existing mapping
          const { error: mappingError } = await supabase
            .from('vendor_part_mappings')
            .update({
              vendor_id: vendorMapping.vendor_id,
              vendor_part_number: vendorMapping.vendor_part_number || null,
              standard_cost: vendorMapping.standard_cost,
              lead_time_days: vendorMapping.lead_time_days,
              minimum_order_qty: vendorMapping.minimum_order_qty,
              is_preferred_vendor: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', vendorMapping.id);

          if (mappingError) throw mappingError;
        } else {
          // First, unset any existing preferred vendor
          await supabase
            .from('vendor_part_mappings')
            .update({ is_preferred_vendor: false })
            .eq('part_id', editingPart.id)
            .eq('is_preferred_vendor', true);

          // Create new mapping
          const { error: mappingError } = await supabase
            .from('vendor_part_mappings')
            .insert({
              part_id: editingPart.id,
              vendor_id: vendorMapping.vendor_id,
              vendor_part_number: vendorMapping.vendor_part_number || null,
              standard_cost: vendorMapping.standard_cost,
              lead_time_days: vendorMapping.lead_time_days,
              minimum_order_qty: vendorMapping.minimum_order_qty,
              is_preferred_vendor: true,
            });

          if (mappingError) throw mappingError;
        }
      }

      setEditingPart(null);
      setFormData(getInitialFormData());
      loadParts();
    } catch (error) {
      console.error('Error updating part:', error);
      alert('Failed to update part. Please try again.');
    }
  };

  const categories = Array.from(new Set(parts.map((p) => p.category).filter(Boolean)));

  const filteredParts = parts.filter((part) => {
    const matchesSearch =
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.part_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || part.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const lowStockParts = parts.filter((p) => (p.quantity_on_hand ?? 0) <= (p.reorder_level ?? 0));
  const totalValue = parts.reduce((sum, p) => sum + (p.quantity_on_hand ?? 0) * (p.unit_price ?? 0), 0);

  const getStockStatus = (part: Part) => {
    if ((part.quantity_on_hand ?? 0) === 0) {
      return { text: 'Out of Stock', class: 'badge badge-red' };
    } else if ((part.quantity_on_hand ?? 0) <= (part.reorder_level ?? 0)) {
      return { text: 'Low Stock', class: 'badge badge-yellow' };
    } else {
      return { text: 'In Stock', class: 'badge badge-green' };
    }
  };

  const handleAddPart = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { error } = await supabase.from('parts').insert([formData]);

      if (error) throw error;

      setShowAddModal(false);
      setFormData(getInitialFormData());
      loadParts();
    } catch (error) {
      console.error('Error adding part:', error);
      alert('Failed to add part. Please try again.');
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{itemLabelPlural} Inventory</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isTool ? 'Track and manage tools and equipment' : 'Track and manage HVAC parts and supplies'}
          </p>
        </div>
        {activeTab === 'inventory' && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add {itemLabel}</span>
          </button>
        )}
      </div>

      <div className="card p-1">
        <div className="flex space-x-1">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <ItemIcon className="w-5 h-5" />
            <span>{itemLabelPlural} Inventory</span>
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
              activeTab === 'warehouses'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Warehouse className="w-5 h-5" />
            <span>Warehouse Locations</span>
          </button>
        </div>
      </div>

      {activeTab === 'warehouses' ? (
        <WarehouseLocationsView />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total {itemLabelPlural}</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {parts.length}
              </p>
            </div>
            <div className={`${isTool ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600'} p-3 rounded-lg`}>
              <ItemIcon className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Low Stock Items</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{reorderAlertCount}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 text-red-600 p-3 rounded-lg">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inventory Value</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                ${totalValue.toFixed(2)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
              <TrendingDown className="w-6 h-6" />
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
              placeholder={`Search ${itemLabelPlural.toLowerCase()}, ${isTool ? 'item' : 'part'} numbers, manufacturers...`}
              className="input pl-10"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="input md:w-64"
          >
            <option value="all">All Categories</option>
            {categories.map((cat: string) => (
              <option key={cat} value={cat}>
                {cat}
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
                  {itemLabel} Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Manufacturer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Unit Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-700 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredParts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No {itemLabelPlural.toLowerCase()} found
                  </td>
                </tr>
              ) : (
                filteredParts.map((part) => {
                  const status = getStockStatus(part);
                  return (
                    <tr
                      key={part.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {part.part_number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="text-gray-900 dark:text-white">{part.name}</span>
                          {part.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {part.description}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">
                          {part.manufacturer || 'N/A'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">
                          {part.category || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {part.quantity_on_hand ?? 0}
                          </span>
                          {(part.quantity_on_hand ?? 0) <= (part.reorder_level ?? 0) && (
                            <p className="text-xs text-red-600 mt-1">
                              Reorder at: {part.reorder_level ?? 0}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">
                          ${(part.unit_price ?? 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={status.class}>{status.text}</span>
                      </td>
                      <td className="px-6 py-4">
                        {part.part_inventory && part.part_inventory.length > 0 ? (
                          <div className="space-y-1">
                            {part.part_inventory.map((inv, idx) => (
                              <div key={idx} className="text-xs">
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {inv.stock_locations?.name || 'Unknown'}
                                </span>
                                <span className="text-gray-500 dark:text-gray-400 ml-1">
                                  ({inv.quantity})
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-xs">
                            Not assigned
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 sticky right-0 bg-white dark:bg-gray-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(part)}
                            className="btn btn-primary p-2 flex items-center space-x-1"
                            title="Edit part details"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="text-xs">Edit</span>
                          </button>
                          <button
                            onClick={() =>
                              setSelectedPartForInventory({ id: part.id, name: part.name })
                            }
                            className="btn btn-outline p-2 flex items-center space-x-1"
                            title="Manage inventory by location"
                          >
                            <MapPin className="w-4 h-4" />
                            <span className="text-xs">Locations</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {reorderAlertCount > 0 && (
        <div className="card p-6 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-red-900 dark:text-red-200">Low Stock Alert</h3>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                {reorderAlertCount} {itemLabelPlural.toLowerCase()} need to be reordered
              </p>
              <div className="mt-3 space-y-1">
                {lowStockParts.slice(0, 5).map((part) => (
                  <p key={part.id} className="text-sm text-red-600 dark:text-red-400">
                    {part.name} ({part.part_number}) - Only {part.quantity_on_hand} remaining
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add New {itemLabel}</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddPart} className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {itemLabel} Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.part_number}
                    onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                    className="input"
                    placeholder={isTool ? 'e.g., TL-001-DRL' : 'e.g., CAP-123-XYZ'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {itemLabel} Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder={isTool ? 'e.g., Cordless Drill' : 'e.g., Compressor Capacitor'}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Enter part description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="input"
                    placeholder="e.g., Carrier"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                    placeholder="e.g., Electrical"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity on Hand *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.quantity_on_hand}
                    onChange={(e) =>
                      setFormData({ ...formData, quantity_on_hand: parseInt(e.target.value) || 0 })
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reorder Level *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) =>
                      setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unit Price *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) =>
                      setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })
                    }
                    className="input"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Storage Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="input"
                    placeholder="e.g., Warehouse A, Shelf 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    OEM Warranty Period (Months)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.warranty_period_months ?? ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        warranty_period_months: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    className="input"
                    placeholder="e.g., 12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vendor Part Number
                  </label>
                  <input
                    type="text"
                    value={formData.vendor_part_number}
                    onChange={(e) => setFormData({ ...formData, vendor_part_number: e.target.value })}
                    className="input"
                    placeholder="Vendor's part number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_serialized}
                      onChange={(e) => setFormData({ ...formData, is_serialized: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Track by Serial Number
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                    Enable this for parts that require individual serial number tracking (e.g., compressors, condensers)
                  </p>
                </div>

                {formData.is_serialized && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Default Warranty (Months)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.default_warranty_months}
                      onChange={(e) =>
                        setFormData({ ...formData, default_warranty_months: parseInt(e.target.value) || 12 })
                      }
                      className="input"
                      placeholder="12"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Default warranty period for serialized units
                    </p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.requires_registration}
                      onChange={(e) => setFormData({ ...formData, requires_registration: e.target.checked, registration_url: e.target.checked ? formData.registration_url : '' })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Requires Registration
                    </span>
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                    Enable this for parts that require warranty registration with the manufacturer
                  </p>
                </div>

                {formData.requires_registration && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Registration URL *
                    </label>
                    <input
                      type="url"
                      required
                      value={formData.registration_url}
                      onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                      className="input"
                      placeholder="https://manufacturer.com/warranty-registration"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      URL where warranty registration can be completed
                    </p>
                  </div>
                )}

                {isTool && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tool Category
                      </label>
                      <input
                        type="text"
                        value={formData.tool_category}
                        onChange={(e) => setFormData({ ...formData, tool_category: e.target.value })}
                        className="input"
                        placeholder="e.g., Power Tools, Hand Tools, Safety"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Asset Tag
                      </label>
                      <input
                        type="text"
                        value={formData.asset_tag}
                        onChange={(e) => setFormData({ ...formData, asset_tag: e.target.value })}
                        className="input"
                        placeholder="e.g., AST-2024-001"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.is_returnable}
                          onChange={(e) => setFormData({ ...formData, is_returnable: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Returnable / Check-in Required
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                        Enable this for tools that should be tracked when checked out and returned
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Add {itemLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPartForInventory && (
        <PartInventoryModal
          partId={selectedPartForInventory.id}
          partName={selectedPartForInventory.name}
          onClose={() => setSelectedPartForInventory(null)}
        />
      )}

      {editingPart && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit {itemLabel}</h2>
              <button
                onClick={() => {
                  setEditingPart(null);
                  setFormData(getInitialFormData());
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdatePart} className="p-6 overflow-y-auto flex-1">
              <div className="space-y-6">
                {/* Basic Info Section */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {itemLabel} Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.part_number}
                        onChange={(e) => setFormData({ ...formData, part_number: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {itemLabel} Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="input"
                        rows={2}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Manufacturer
                      </label>
                      <input
                        type="text"
                        value={formData.manufacturer}
                        onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Unit Price *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) =>
                          setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })
                        }
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Reorder Level
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.reorder_level}
                        onChange={(e) =>
                          setFormData({ ...formData, reorder_level: parseInt(e.target.value) || 0 })
                        }
                        className="input"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.is_serialized}
                          onChange={(e) => setFormData({ ...formData, is_serialized: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Track by Serial Number
                        </span>
                      </label>
                    </div>

                    <div className="md:col-span-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.requires_registration}
                          onChange={(e) => setFormData({ ...formData, requires_registration: e.target.checked, registration_url: e.target.checked ? formData.registration_url : '' })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Requires Registration
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                        Enable this for parts that require warranty registration with the manufacturer
                      </p>
                    </div>

                    {formData.requires_registration && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Registration URL *
                        </label>
                        <input
                          type="url"
                          required
                          value={formData.registration_url}
                          onChange={(e) => setFormData({ ...formData, registration_url: e.target.value })}
                          className="input"
                          placeholder="https://manufacturer.com/warranty-registration"
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          URL where warranty registration can be completed
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preferred Vendor Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Preferred Vendor</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vendor
                      </label>
                      <select
                        value={vendorMapping.vendor_id}
                        onChange={(e) => setVendorMapping({ ...vendorMapping, vendor_id: e.target.value })}
                        className="input"
                      >
                        <option value="">-- Select Vendor --</option>
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>
                            {vendor.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {vendorMapping.vendor_id && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Vendor Part Number
                          </label>
                          <input
                            type="text"
                            value={vendorMapping.vendor_part_number}
                            onChange={(e) =>
                              setVendorMapping({ ...vendorMapping, vendor_part_number: e.target.value })
                            }
                            className="input"
                            placeholder="Vendor's part number"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Standard Cost
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={vendorMapping.standard_cost}
                            onChange={(e) =>
                              setVendorMapping({
                                ...vendorMapping,
                                standard_cost: parseFloat(e.target.value) || 0,
                              })
                            }
                            className="input"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Lead Time (Days)
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={vendorMapping.lead_time_days}
                            onChange={(e) =>
                              setVendorMapping({
                                ...vendorMapping,
                                lead_time_days: parseInt(e.target.value) || 7,
                              })
                            }
                            className="input"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Minimum Order Qty
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={vendorMapping.minimum_order_qty}
                            onChange={(e) =>
                              setVendorMapping({
                                ...vendorMapping,
                                minimum_order_qty: parseInt(e.target.value) || 1,
                              })
                            }
                            className="input"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPart(null);
                    setFormData(getInitialFormData());
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
