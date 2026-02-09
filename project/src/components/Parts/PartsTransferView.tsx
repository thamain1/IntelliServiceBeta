import { useEffect, useState } from 'react';
import { ArrowRightLeft, Search, Plus, Truck, Warehouse } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type Part = Database['public']['Tables']['parts']['Row'];
type StockLocation = Database['public']['Tables']['stock_locations']['Row'];
type PartInventory = {
  part_id: string;
  stock_location_id: string;
  quantity: number;
  parts?: Part;
  stock_locations?: StockLocation;
};

type MovementType = 'receipt' | 'transfer' | 'installation' | 'return' | 'adjustment' | 'disposal';
type ItemType = 'part' | 'tool';

interface PartsTransferViewProps {
  itemType?: ItemType;
}

export function PartsTransferView({ itemType = 'part' }: PartsTransferViewProps) {
  const isTool = itemType === 'tool';
  const itemLabel = isTool ? 'Tool' : 'Part';
  const itemLabelPlural = isTool ? 'Tools' : 'Parts';
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [inventory, setInventory] = useState<PartInventory[]>([]);
  const [movements, setMovements] = useState<{
    id: string;
    movement_date: string;
    quantity: number;
    parts?: { name: string; part_number: string } | null;
    from_location?: { name: string } | null;
    to_location?: { name: string } | null;
    moved_by_profile?: { full_name: string } | null;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [transferData, setTransferData] = useState({
    part_id: '',
    from_location_id: '',
    to_location_id: '',
    quantity: 1,
    notes: '',
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemType]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [locationsRes, partsRes, inventoryRes, movementsRes] = await Promise.all([
        supabase
          .from('stock_locations')
          .select('*')
          .eq('is_active', true)
          .order('location_type')
          .order('name'),
        supabase
          .from('parts')
          .select('*')
          .eq('item_type', itemType)
          .order('name'),
        supabase
          .from('part_inventory')
          .select('*, parts!inner(*), stock_locations(*)'),
        supabase
          .from('inventory_movements')
          .select(`
            *,
            parts(name, part_number),
            from_location:stock_locations!from_location_id(name),
            to_location:stock_locations!to_location_id(name),
            moved_by_profile:profiles!moved_by(full_name)
          `)
          .eq('movement_type', 'transfer')
          .order('movement_date', { ascending: false })
          .limit(50),
      ]);

      if (locationsRes.error) throw locationsRes.error;
      if (partsRes.error) throw partsRes.error;
      if (inventoryRes.error) throw inventoryRes.error;
      if (movementsRes.error) throw movementsRes.error;

      setLocations(locationsRes.data || []);
      setParts(partsRes.data || []);
      // Filter inventory data that was retrieved without filters
      const filteredInventory = (inventoryRes.data || []).filter((inv) =>
        inv.parts?.item_type === itemType && inv.quantity > 0
      );
      setInventory(filteredInventory as unknown as PartInventory[]);
      setMovements(movementsRes.data || []);
    } catch (error) {
      console.error('Error loading transfer data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableQuantity = (partId: string, locationId: string) => {
    const item = inventory.find(
      (inv) => inv.part_id === partId && inv.stock_location_id === locationId
    );
    return item?.quantity || 0;
  };

  const handleTransfer = async () => {
    if (!transferData.part_id || !transferData.from_location_id || !transferData.to_location_id) {
      alert('Please fill in all required fields');
      return;
    }

    if (transferData.from_location_id === transferData.to_location_id) {
      alert('Source and destination locations must be different');
      return;
    }

    const availableQty = getAvailableQuantity(transferData.part_id, transferData.from_location_id);
    if (transferData.quantity > availableQty) {
      alert(`Insufficient quantity. Available: ${availableQty}`);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Note: Part inventory updates are handled by database triggers on inventory_movements insert

      const { error } = await supabase.from('inventory_movements').insert({
        movement_type: 'transfer' as MovementType,
        movement_date: new Date().toISOString(),
        part_id: transferData.part_id,
        quantity: transferData.quantity,
        from_location_id: transferData.from_location_id,
        to_location_id: transferData.to_location_id,
        moved_by: user.id,
        notes: transferData.notes || null,
      });

      if (error) throw error;

      alert('Transfer completed successfully!');
      setShowTransferModal(false);
      setTransferData({
        part_id: '',
        from_location_id: '',
        to_location_id: '',
        quantity: 1,
        notes: '',
      });
      loadData();
    } catch (error) {
      console.error('Error creating transfer:', error);
      alert('Failed to create transfer');
    }
  };

  const filteredParts = parts.filter((part) =>
    part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.part_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLocationIcon = (locationType: string) => {
    return locationType === 'truck' ? Truck : Warehouse;
  };

  const selectedPart = parts.find((p) => p.id === transferData.part_id);
  const fromLocation = locations.find((l) => l.id === transferData.from_location_id);
  const availableQty = transferData.part_id && transferData.from_location_id
    ? getAvailableQuantity(transferData.part_id, transferData.from_location_id)
    : 0;

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{itemLabelPlural} Transfers</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Transfer {itemLabelPlural.toLowerCase()} between warehouses and vehicles
          </p>
        </div>
        <button
          onClick={() => setShowTransferModal(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Transfer</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {locations.map((location) => {
          const Icon = getLocationIcon(location.location_type);
          const locationInventory = inventory.filter(
            (inv) => inv.stock_location_id === location.id
          );
          const totalParts = locationInventory.reduce((sum, inv) => sum + inv.quantity, 0);
          const uniqueParts = locationInventory.length;

          return (
            <div key={location.id} className="card p-4">
              <div className="flex items-start space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                    {location.name}
                  </h3>
                  <div className="mt-2 space-y-1 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      {uniqueParts} part types
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {totalParts} total units
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Transfers
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Part
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  From
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <ArrowRightLeft className="w-4 h-4 mx-auto" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  To
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  By
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No transfers recorded yet
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {new Date(movement.movement_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {movement.parts?.name}
                      </div>
                      <div className="text-gray-500 dark:text-gray-400">
                        {movement.parts?.part_number}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {movement.from_location?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <ArrowRightLeft className="w-4 h-4 text-gray-400 mx-auto" />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {movement.to_location?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {movement.quantity}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {movement.moved_by_profile?.full_name || 'Unknown'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                New {itemLabelPlural} Transfer
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {itemLabel} *
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search ${itemLabelPlural.toLowerCase()}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10"
                  />
                </div>
                <select
                  value={transferData.part_id}
                  onChange={(e) => setTransferData({ ...transferData, part_id: e.target.value })}
                  className="input"
                  required
                >
                  <option value="">Select a {itemLabel.toLowerCase()}</option>
                  {filteredParts.map((part) => (
                    <option key={part.id} value={part.id}>
                      {part.name} ({part.part_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Location *
                </label>
                <select
                  value={transferData.from_location_id}
                  onChange={(e) =>
                    setTransferData({ ...transferData, from_location_id: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="">Select source location</option>
                  {locations.map((location) => {
                    const qty = transferData.part_id
                      ? getAvailableQuantity(transferData.part_id, location.id)
                      : 0;
                    return (
                      <option key={location.id} value={location.id}>
                        {location.name}
                        {transferData.part_id && ` (${qty} available)`}
                      </option>
                    );
                  })}
                </select>
                {transferData.part_id && transferData.from_location_id && (
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    Available: {availableQty} units
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Location *
                </label>
                <select
                  value={transferData.to_location_id}
                  onChange={(e) =>
                    setTransferData({ ...transferData, to_location_id: e.target.value })
                  }
                  className="input"
                  required
                >
                  <option value="">Select destination location</option>
                  {locations
                    .filter((loc) => loc.id !== transferData.from_location_id)
                    .map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="1"
                  max={availableQty}
                  value={transferData.quantity}
                  onChange={(e) =>
                    setTransferData({ ...transferData, quantity: parseInt(e.target.value) || 1 })
                  }
                  className="input"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes
                </label>
                <textarea
                  value={transferData.notes}
                  onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                  rows={3}
                  className="input"
                  placeholder="Optional transfer notes..."
                />
              </div>

              {selectedPart && fromLocation && transferData.to_location_id && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm text-blue-900 dark:text-blue-100">
                    <ArrowRightLeft className="w-4 h-4" />
                    <span className="font-medium">Transfer Summary:</span>
                  </div>
                  <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
                    Moving <strong>{transferData.quantity}x {selectedPart.name}</strong> from{' '}
                    <strong>{fromLocation.name}</strong> to{' '}
                    <strong>
                      {locations.find((l) => l.id === transferData.to_location_id)?.name}
                    </strong>
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowTransferModal(false);
                  setTransferData({
                    part_id: '',
                    from_location_id: '',
                    to_location_id: '',
                    quantity: 1,
                    notes: '',
                  });
                  setSearchTerm('');
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button onClick={handleTransfer} className="btn-primary">
                Complete Transfer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
