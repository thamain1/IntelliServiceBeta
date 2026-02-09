import { useState, useEffect } from 'react';
import { X, Package, MapPin, Hash, Calendar, CheckCircle, Ticket } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';

type PurchaseOrder = Database['public']['Tables']['purchase_orders']['Row'] & {
  vendors?: { name: string } | null;
};
type PurchaseOrderLine = Database['public']['Tables']['purchase_order_lines']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];
type StockLocation = Database['public']['Tables']['stock_locations']['Row'];

interface LinkedTicketInfo {
  ticket_number: string;
  title: string;
  customers?: { name: string } | null;
}

interface POLineWithPart extends Omit<PurchaseOrderLine, 'linked_ticket_id' | 'linked_request_id'> {
  parts: Part;
  quantity_received_total?: number;
  linked_ticket_id?: string | null;
  linked_request_id?: string | null;
  tickets?: LinkedTicketInfo | null;
}

interface ReceivingItem {
  line_id: string;
  quantity_received: number;
  quantity_damaged: number;
  stock_location_id: string;
  serial_numbers: string[];
  warranty_start_date: string;
  warranty_end_date: string;
}

interface ReceivingModalProps {
  purchaseOrderId: string;
  onClose: () => void;
  onComplete: () => void;
}

export function ReceivingModal({ purchaseOrderId, onClose, onComplete }: ReceivingModalProps) {
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [lines, setLines] = useState<POLineWithPart[]>([]);
  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [receivingData, setReceivingData] = useState<Record<string, ReceivingItem>>({});

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [purchaseOrderId]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [poResult, linesResult, locationsResult] = await Promise.all([
        supabase
          .from('purchase_orders')
          .select('*, vendors(*)')
          .eq('id', purchaseOrderId)
          .single(),
        supabase
          .from('purchase_order_lines')
          .select('*, parts(*), tickets!purchase_order_lines_linked_ticket_id_fkey(ticket_number, title, customers(name))')
          .eq('po_id', purchaseOrderId)
          .order('line_number'),
        supabase
          .from('stock_locations')
          .select('*')
          .eq('is_active', true)
          .order('name'),
      ]);

      if (poResult.error) throw poResult.error;
      if (linesResult.error) throw linesResult.error;
      if (locationsResult.error) throw locationsResult.error;

      setPO(poResult.data);
      setLines(linesResult.data as unknown as POLineWithPart[]);
      setStockLocations(locationsResult.data);

      const initialData: Record<string, ReceivingItem> = {};
      linesResult.data.forEach((line) => {
        initialData[line.id] = {
          line_id: line.id,
          quantity_received: line.quantity_ordered,
          quantity_damaged: 0,
          stock_location_id: locationsResult.data[0]?.id || '',
          serial_numbers: [],
          warranty_start_date: new Date().toISOString().split('T')[0],
          warranty_end_date: '',
        };
      });
      setReceivingData(initialData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load purchase order details');
    } finally {
      setLoading(false);
    }
  };

  const updateReceivingItem = (lineId: string, field: keyof ReceivingItem, value: string | number | string[]) => {
    setReceivingData((prev) => ({
      ...prev,
      [lineId]: {
        ...prev[lineId],
        [field]: value,
      },
    }));
  };

  const addSerialNumber = (lineId: string) => {
    const currentSerials = receivingData[lineId]?.serial_numbers || [];
    updateReceivingItem(lineId, 'serial_numbers', [...currentSerials, '']);
  };

  const updateSerialNumber = (lineId: string, index: number, value: string) => {
    const currentSerials = [...(receivingData[lineId]?.serial_numbers || [])];
    currentSerials[index] = value;
    updateReceivingItem(lineId, 'serial_numbers', currentSerials);
  };

  const removeSerialNumber = (lineId: string, index: number) => {
    const currentSerials = receivingData[lineId]?.serial_numbers || [];
    updateReceivingItem(
      lineId,
      'serial_numbers',
      currentSerials.filter((_, i) => i !== index)
    );
  };

  const handleReceive = async () => {
    try {
      setSaving(true);

      for (const line of lines) {
        const receivingItem = receivingData[line.id];
        if (!receivingItem || receivingItem.quantity_received === 0) continue;

        if (!receivingItem.stock_location_id) {
          alert('Please select a stock location for all items');
          return;
        }

        const part = line.parts;
        if (part.is_serialized && receivingItem.serial_numbers.length !== receivingItem.quantity_received) {
          alert(`Part ${part.name} requires ${receivingItem.quantity_received} serial numbers`);
          return;
        }

        // Note: Inventory receipt updates are handled by database triggers on po_receipt insert

        if (part.is_serialized) {
          const serializedParts = receivingItem.serial_numbers.map((serial) => ({
            part_id: line.part_id,
            serial_number: serial,
            current_location_id: receivingItem.stock_location_id,
            vendor_id: po?.vendor_id || null,
            po_id: purchaseOrderId,
            po_line_id: line.id,
            purchase_date: po?.order_date || new Date().toISOString().split('T')[0],
            received_date: new Date().toISOString().split('T')[0],
            unit_cost: line.unit_price,
            warranty_start_date: receivingItem.warranty_start_date || null,
            warranty_end_date: receivingItem.warranty_end_date || null,
            status: 'in_stock' as const,
          }));

          const { error: serialError } = await supabase
            .from('serialized_parts')
            .insert(serializedParts);

          if (serialError) throw serialError;
        }

        const { error: lineError } = await supabase
          .from('purchase_order_lines')
          .update({
            quantity_received: (line.quantity_received || 0) + receivingItem.quantity_received,
            quantity_damaged: (line.quantity_damaged || 0) + receivingItem.quantity_damaged,
          })
          .eq('id', line.id);

        if (lineError) throw lineError;
      }

      const allReceived = lines.every((line) => {
        const receivingItem = receivingData[line.id];
        const totalReceived = (line.quantity_received || 0) + (receivingItem?.quantity_received || 0);
        return totalReceived >= line.quantity_ordered;
      });

      const anyReceived = lines.some((line) => {
        const receivingItem = receivingData[line.id];
        return (receivingItem?.quantity_received || 0) > 0;
      });

      if (allReceived) {
        await supabase
          .from('purchase_orders')
          .update({ status: 'received' })
          .eq('id', purchaseOrderId);
      } else if (anyReceived) {
        await supabase
          .from('purchase_orders')
          .update({ status: 'partial' })
          .eq('id', purchaseOrderId);
      }

      alert('Parts received successfully!');
      onComplete();
    } catch (error: unknown) {
      console.error('Error receiving parts:', error);
      const err = error as { message?: string; hint?: string };
      const errorMessage = err?.message || err?.hint || 'Failed to receive parts. Please try again.';
      alert(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (!po) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Receive Parts</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              PO: {po.po_number} | Vendor: {po.vendors?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {lines.map((line) => {
            const receivingItem = receivingData[line.id];
            const part = line.parts;
            const remainingQty = line.quantity_ordered - (line.quantity_received || 0);

            return (
              <div key={line.id} className="card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {part.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Part #: {part.part_number}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-sm">
                      <span className="text-gray-600 dark:text-gray-400">
                        Ordered: <span className="font-medium">{line.quantity_ordered}</span>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Previously Received: <span className="font-medium">{line.quantity_received || 0}</span>
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        Remaining: <span className="font-medium text-blue-600">{remainingQty}</span>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {part.is_serialized && (
                      <span className="badge badge-blue">
                        <Hash className="w-3 h-3 mr-1" />
                        Serialized
                      </span>
                    )}
                    {line.linked_ticket_id && (
                      <span className="badge badge-green">
                        <Ticket className="w-3 h-3 mr-1" />
                        Linked to Ticket
                      </span>
                    )}
                  </div>
                </div>

                {/* Show linked ticket info if present */}
                {line.tickets && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2">
                      <Ticket className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800 dark:text-green-300">
                        Parts for Ticket: {line.tickets.ticket_number}
                      </span>
                    </div>
                    <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                      {line.tickets.title}
                      {line.tickets.customers?.name && (
                        <span className="ml-2">• {line.tickets.customers.name}</span>
                      )}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                      When received, this ticket will automatically be updated and ready for scheduling.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity Received
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={remainingQty}
                      value={receivingItem?.quantity_received || 0}
                      onChange={(e) =>
                        updateReceivingItem(line.id, 'quantity_received', parseInt(e.target.value) || 0)
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Quantity Damaged
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={receivingItem?.quantity_damaged || 0}
                      onChange={(e) =>
                        updateReceivingItem(line.id, 'quantity_damaged', parseInt(e.target.value) || 0)
                      }
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Stock Location
                    </label>
                    <select
                      value={receivingItem?.stock_location_id || ''}
                      onChange={(e) => updateReceivingItem(line.id, 'stock_location_id', e.target.value)}
                      className="input"
                    >
                      <option value="">Select location...</option>
                      {stockLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.location_type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {part.is_serialized && receivingItem && receivingItem.quantity_received > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        <Hash className="w-4 h-4 inline mr-1" />
                        Serial Numbers ({receivingItem.serial_numbers.length} / {receivingItem.quantity_received})
                      </label>
                      <button
                        onClick={() => addSerialNumber(line.id)}
                        disabled={receivingItem.serial_numbers.length >= receivingItem.quantity_received}
                        className="btn-outline text-sm py-1 px-3"
                      >
                        Add Serial
                      </button>
                    </div>

                    {receivingItem.serial_numbers.map((serial, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={serial}
                          onChange={(e) => updateSerialNumber(line.id, idx, e.target.value)}
                          placeholder={`Serial number ${idx + 1}`}
                          className="input flex-1"
                        />
                        <button
                          onClick={() => removeSerialNumber(line.id, idx)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Warranty Start
                        </label>
                        <input
                          type="date"
                          value={receivingItem.warranty_start_date}
                          onChange={(e) => updateReceivingItem(line.id, 'warranty_start_date', e.target.value)}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Warranty End
                        </label>
                        <input
                          type="date"
                          value={receivingItem.warranty_end_date}
                          onChange={(e) => updateReceivingItem(line.id, 'warranty_end_date', e.target.value)}
                          className="input"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
              <Package className="w-4 h-4 mr-1" />
              <span>{lines.length} line items</span>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="btn-outline" disabled={saving}>
              Cancel
            </button>
            <button onClick={handleReceive} className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Receiving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Complete Receiving
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
