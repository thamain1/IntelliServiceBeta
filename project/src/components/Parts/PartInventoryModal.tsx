import { useEffect, useState } from 'react';
import { X, Plus, Minus, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { inventoryService } from '../../services/InventoryService';

type StockLocation = Database['public']['Tables']['stock_locations']['Row'];
type PartInventory = Database['public']['Tables']['part_inventory']['Row'];

interface PartInventoryModalProps {
  partId: string;
  partName: string;
  onClose: () => void;
}

export function PartInventoryModal({ partId, partName, onClose }: PartInventoryModalProps) {
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [inventory, setInventory] = useState<PartInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    from_location_id: '',
    to_location_id: '',
    quantity: 0,
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partId]);

  const loadData = async () => {
    try {
      const [locationsRes, inventoryRes] = await Promise.all([
        supabase
          .from('stock_locations')
          .select('*')
          .eq('is_active', true)
          .order('location_type', { ascending: true }),
        supabase
          .from('part_inventory')
          .select('*')
          .eq('part_id', partId),
      ]);

      if (locationsRes.error) throw locationsRes.error;
      if (inventoryRes.error) throw inventoryRes.error;

      setLocations(locationsRes.data || []);
      setInventory(inventoryRes.data || []);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getQuantityAtLocation = (locationId: string) => {
    const inv = inventory.find((i) => i.stock_location_id === locationId);
    return inv?.quantity || 0;
  };

  const handleAdjustQuantity = async (locationId: string, adjustment: number) => {
    try {
      await inventoryService.adjustInventory({
        partId,
        locationId,
        quantity: Math.abs(adjustment),
        adjustmentType: adjustment > 0 ? 'add' : 'subtract',
      });

      await loadData();
    } catch (error) {
      console.error('Error adjusting quantity:', error);
      alert('Failed to adjust quantity. Please try again.');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await inventoryService.transferInventory({
        partId,
        fromLocationId: transferData.from_location_id,
        toLocationId: transferData.to_location_id,
        quantity: transferData.quantity,
      });

      setShowTransferModal(false);
      setTransferData({ from_location_id: '', to_location_id: '', quantity: 0 });
      await loadData();
    } catch (error: unknown) {
      console.error('Error transferring inventory:', error);
      alert((error as Error).message || 'Failed to transfer inventory. Please try again.');
    }
  };

  const getTotalQuantity = () => {
    return inventory.reduce((sum, inv) => sum + inv.quantity, 0);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Inventory by Location
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {partName} - Total: {getTotalQuantity()} units
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowTransferModal(true)}
                className="btn btn-outline flex items-center space-x-2"
              >
                <ArrowRight className="w-4 h-4" />
                <span>Transfer Between Locations</span>
              </button>
            </div>

            <div className="space-y-3">
              {locations.map((location) => {
                const quantity = getQuantityAtLocation(location.id);
                return (
                  <div
                    key={location.id}
                    className="card p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {location.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {location.location_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {quantity}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleAdjustQuantity(location.id, -1)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-red-600"
                          disabled={quantity === 0}
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAdjustQuantity(location.id, 1)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-green-600"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <button onClick={onClose} className="btn btn-primary w-full">
              Close
            </button>
          </div>
        </div>
      </div>

      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Transfer Inventory
              </h3>
              <button
                onClick={() => setShowTransferModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleTransfer} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From Location *
                </label>
                <select
                  required
                  value={transferData.from_location_id}
                  onChange={(e) =>
                    setTransferData({ ...transferData, from_location_id: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select source location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({getQuantityAtLocation(loc.id)} available)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To Location *
                </label>
                <select
                  required
                  value={transferData.to_location_id}
                  onChange={(e) =>
                    setTransferData({ ...transferData, to_location_id: e.target.value })
                  }
                  className="input"
                >
                  <option value="">Select destination location</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transferData.quantity || ''}
                  onChange={(e) =>
                    setTransferData({
                      ...transferData,
                      quantity: parseInt(e.target.value) || 0,
                    })
                  }
                  className="input"
                  placeholder="Enter quantity to transfer"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
