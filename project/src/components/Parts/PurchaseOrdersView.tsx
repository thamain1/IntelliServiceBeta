import { useEffect, useState } from 'react';
import { Plus, Search, ShoppingCart, X, Package, Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ReceivingModal } from './ReceivingModal';

type PurchaseOrder = {
  id: string;
  po_number: string;
  vendor_id: string;
  order_date: string;
  expected_delivery_date: string | null;
  status: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  total_amount: number;
  notes: string | null;
  created_at: string;
  vendors: {
    name: string;
    vendor_code: string;
  } | null;
};

type Vendor = {
  id: string;
  vendor_code: string;
  name: string;
  is_active: boolean;
};

type Part = {
  id: string;
  part_number: string;
  name: string;
  unit_price: number;
  is_serialized: boolean;
  item_type: string;
};

type POLineItem = {
  id: string;
  part_id: string;
  description: string;
  quantity_ordered: number;
  unit_price: number;
  line_total: number;
  linked_ticket_id?: string;
  linked_request_id?: string;
  request_line_id?: string;
};

type ItemType = 'part' | 'tool';

interface LinkedPartsRequest {
  request_id: string;
  ticket_id: string;
  ticket_number: string;
  customer_name: string;
  parts_requested: Array<{
    line_id: string;
    part_id: string;
    part_number: string;
    part_name: string;
    quantity_requested: number;
  }>;
}

interface PurchaseOrdersViewProps {
  itemType?: ItemType;
  linkedRequest?: LinkedPartsRequest;
  onClearLinkedRequest?: () => void;
}

export function PurchaseOrdersView({ itemType = 'part', linkedRequest, onClearLinkedRequest }: PurchaseOrdersViewProps) {
  const isTool = itemType === 'tool';
  const itemLabel = isTool ? 'Tool' : 'Part';
  const itemLabelPlural = isTool ? 'Tools' : 'Parts';
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPO, setSelectedPO] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    vendor_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    notes: '',
    po_source: 'LOCAL_VENDOR' as 'LOCAL_VENDOR' | 'AHS_PORTAL',
  });

  const [lineItems, setLineItems] = useState<POLineItem[]>([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemType]);

  // Auto-open modal and pre-populate when linkedRequest is provided
  useEffect(() => {
    if (linkedRequest && parts.length > 0) {
      // Pre-populate line items from the linked request
      const prePopulatedItems: POLineItem[] = linkedRequest.parts_requested.map((reqPart) => {
        const part = parts.find((p) => p.id === reqPart.part_id);
        return {
          id: crypto.randomUUID(),
          part_id: reqPart.part_id,
          description: reqPart.part_name,
          quantity_ordered: reqPart.quantity_requested,
          unit_price: part?.unit_price || 0,
          line_total: reqPart.quantity_requested * (part?.unit_price || 0),
          linked_ticket_id: linkedRequest.ticket_id,
          linked_request_id: linkedRequest.request_id,
          request_line_id: reqPart.line_id,
        };
      });
      setLineItems(prePopulatedItems);
      setFormData({
        ...formData,
        notes: `Parts request for Ticket ${linkedRequest.ticket_number} - ${linkedRequest.customer_name}`,
      });
      setShowAddModal(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedRequest, parts]);

  const loadData = async () => {
    try {
      const [posResult, vendorsResult, partsResult] = await Promise.all([
        supabase
          .from('purchase_orders')
          .select('*, vendors(name, vendor_code)')
          .order('created_at', { ascending: false }),
        supabase
          .from('vendors')
          .select('id, vendor_code, name, is_active')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('parts')
          .select('id, part_number, name, unit_price, is_serialized, item_type')
          .eq('item_type', itemType)
          .order('name'),
      ]);

      if (posResult.error) throw posResult.error;
      if (vendorsResult.error) throw vendorsResult.error;
      if (partsResult.error) throw partsResult.error;

      setPurchaseOrders((posResult.data as PurchaseOrder[]) || []);
      setVendors((vendorsResult.data as Vendor[]) || []);
      setParts((partsResult.data as Part[]) || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        part_id: '',
        description: '',
        quantity_ordered: 1,
        unit_price: 0,
        line_total: 0,
      },
    ]);
  };

  const updateLineItem = (id: string, field: keyof POLineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) => {
        if (item.id !== id) return item;

        const updated = { ...item, [field]: value };

        if (field === 'part_id' && value) {
          const part = parts.find((p) => p.id === value);
          if (part) {
            updated.description = part.name;
            updated.unit_price = part.unit_price;
          }
        }

        updated.line_total = updated.quantity_ordered * updated.unit_price;

        return updated;
      })
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
    const tax = subtotal * 0.08;
    const shipping = 0;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  };

  const handleCreatePO = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lineItems.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    try {
      const totals = calculateTotals();
      const poNumber = `PO-${Date.now()}`;

      const { data: poData, error: poError } = await supabase
        .from('purchase_orders')
        .insert([
          {
            po_number: poNumber,
            vendor_id: formData.vendor_id,
            order_date: formData.order_date,
            expected_delivery_date: formData.expected_delivery_date || null,
            status: 'draft',
            subtotal: totals.subtotal,
            tax_amount: totals.tax,
            shipping_amount: totals.shipping,
            total_amount: totals.total,
            notes: formData.notes || null,
            po_source: formData.po_source,
          },
        ])
        .select()
        .single();

      if (poError) throw poError;

      const lineItemsToInsert = lineItems.map((item, index) => ({
        po_id: poData.id,
        line_number: index + 1,
        part_id: item.part_id,
        description: item.description,
        quantity_ordered: item.quantity_ordered,
        unit_price: item.unit_price,
        line_total: item.line_total,
        linked_ticket_id: item.linked_ticket_id || null,
        linked_request_id: item.linked_request_id || null,
      }));

      const { data: _insertedLines, error: linesError } = await supabase
        .from('purchase_order_lines')
        .insert(lineItemsToInsert)
        .select();

      if (linesError) throw linesError;

      // If this PO is linked to a parts request, update the request status
      if (linkedRequest) {
        const { error: updateError } = await supabase
          .from('ticket_parts_requests')
          .update({
            po_id: poData.id,
            status: 'ordered',
          })
          .eq('id', linkedRequest.request_id);

        if (updateError) {
          console.error('Error updating parts request:', updateError);
        }

        // Clear the linked request
        if (onClearLinkedRequest) {
          onClearLinkedRequest();
        }
      }

      setShowAddModal(false);
      setFormData({
        vendor_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        notes: '',
        po_source: 'LOCAL_VENDOR',
      });
      setLineItems([]);
      loadData();

      // Show success message with linked info
      if (linkedRequest) {
        alert(`Purchase Order ${poNumber} created and linked to Ticket ${linkedRequest.ticket_number}. When parts are received, the ticket will automatically be updated.`);
      }
    } catch (error) {
      console.error('Error creating PO:', error);
      alert('Failed to create purchase order. Please try again.');
    }
  };

  const updatePOStatus = async (poId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('purchase_orders')
        .update({ status: newStatus })
        .eq('id', poId);

      if (error) throw error;

      loadData();
    } catch (error) {
      console.error('Error updating PO status:', error);
      alert('Failed to update purchase order status. Please try again.');
    }
  };

  const filteredPOs = purchaseOrders.filter((po) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      po.po_number.toLowerCase().includes(searchLower) ||
      po.vendors?.name.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'badge-gray';
      case 'submitted':
        return 'badge-blue';
      case 'approved':
        return 'badge-green';
      case 'partial':
        return 'badge-yellow';
      case 'received':
        return 'badge-green';
      case 'cancelled':
        return 'badge-red';
      default:
        return 'badge-gray';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            setShowAddModal(true);
            setLineItems([]);
          }}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Purchase Order</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total POs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {purchaseOrders.length}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {purchaseOrders.filter((po) => po.status === 'submitted' || po.status === 'approved').length}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 p-3 rounded-lg">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Received</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {purchaseOrders.filter((po) => po.status === 'received').length}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                ${purchaseOrders.reduce((sum, po) => sum + po.total_amount, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-100 dark:bg-gray-700 text-gray-600 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search POs by number or vendor..."
            className="input pl-10"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  PO Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Vendor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Order Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Expected Delivery
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No purchase orders found
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => (
                  <tr
                    key={po.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-medium text-blue-600 dark:text-blue-400">
                        {po.po_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white">{po.vendors?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white">
                        {new Date(po.order_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white">
                        {po.expected_delivery_date
                          ? new Date(po.expected_delivery_date).toLocaleDateString()
                          : 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${getStatusColor(po.status)}`}>
                        {po.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${po.total_amount.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {po.status === 'draft' && (
                          <>
                            <button
                              onClick={() => updatePOStatus(po.id, 'submitted')}
                              className="btn btn-primary py-1 px-3 text-sm"
                            >
                              Submit
                            </button>
                            <button
                              onClick={() => updatePOStatus(po.id, 'approved')}
                              className="btn btn-outline py-1 px-3 text-sm"
                            >
                              Approve
                            </button>
                          </>
                        )}
                        {po.status === 'submitted' && (
                          <button
                            onClick={() => updatePOStatus(po.id, 'approved')}
                            className="btn btn-primary py-1 px-3 text-sm"
                          >
                            Approve
                          </button>
                        )}
                        {(po.status === 'approved' || po.status === 'partial') && (
                          <button
                            onClick={() => setSelectedPO(po.id)}
                            className="btn btn-primary py-1 px-3 text-sm"
                          >
                            Receive
                          </button>
                        )}
                        {po.status === 'received' && (
                          <button
                            onClick={() => setSelectedPO(po.id)}
                            className="btn btn-outline py-1 px-3 text-sm"
                          >
                            View
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Create Purchase Order
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreatePO} className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vendor *
                  </label>
                  <select
                    required
                    value={formData.vendor_id}
                    onChange={(e) => setFormData({ ...formData, vendor_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Select vendor...</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.name} ({vendor.vendor_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Order Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.order_date}
                    onChange={(e) => setFormData({ ...formData, order_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expected Delivery
                  </label>
                  <input
                    type="date"
                    value={formData.expected_delivery_date}
                    onChange={(e) =>
                      setFormData({ ...formData, expected_delivery_date: e.target.value })
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    PO Source
                  </label>
                  <select
                    value={formData.po_source}
                    onChange={(e) => setFormData({ ...formData, po_source: e.target.value as 'LOCAL_VENDOR' | 'AHS_PORTAL' })}
                    className="input"
                  >
                    <option value="LOCAL_VENDOR">Local Vendor</option>
                    <option value="AHS_PORTAL">AHS Portal</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Line Items</h3>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="btn btn-outline py-1 px-3 text-sm flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-12 gap-3 items-start p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="col-span-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          {itemLabel}
                        </label>
                        <select
                          value={item.part_id}
                          onChange={(e) => updateLineItem(item.id, 'part_id', e.target.value)}
                          className="input text-sm"
                          required
                        >
                          <option value="">Select {itemLabel.toLowerCase()}...</option>
                          {parts.map((part) => (
                            <option key={part.id} value={part.id}>
                              {part.name} ({part.part_number})
                              {part.is_serialized && ' [Serialized]'}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.quantity_ordered}
                          onChange={(e) =>
                            updateLineItem(item.id, 'quantity_ordered', parseFloat(e.target.value) || 1)
                          }
                          className="input text-sm"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Unit Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)
                          }
                          className="input text-sm"
                          required
                        />
                      </div>

                      <div className="col-span-3">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Line Total
                        </label>
                        <input
                          type="text"
                          value={`$${item.line_total.toFixed(2)}`}
                          disabled
                          className="input text-sm bg-gray-100 dark:bg-gray-600"
                        />
                      </div>

                      <div className="col-span-1 flex items-end">
                        <button
                          type="button"
                          onClick={() => removeLineItem(item.id)}
                          className="btn btn-outline p-2 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {lineItems.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No {itemLabelPlural.toLowerCase()} added yet</p>
                      <p className="text-sm">Click "Add Item" to start</p>
                    </div>
                  )}
                </div>
              </div>

              {lineItems.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${totals.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Tax (8%):</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${totals.tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Shipping:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${totals.shipping.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
                      <span className="font-bold text-gray-900 dark:text-white">Total:</span>
                      <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                        ${totals.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Add any notes or special instructions..."
                />
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedPO && (
        <ReceivingModal
          purchaseOrderId={selectedPO}
          onClose={() => setSelectedPO(null)}
          onComplete={() => {
            setSelectedPO(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
