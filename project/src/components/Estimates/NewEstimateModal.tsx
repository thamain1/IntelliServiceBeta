import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Database } from '../../lib/database.types';

type Customer = Database['public']['Tables']['customers']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];
type Equipment = Database['public']['Tables']['equipment']['Row'];

interface NewEstimateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (estimateData: {
    estimateId: string;
    estimateNumber: string;
    customerId: string;
    customerEmail: string | null;
    customerPhone: string | null;
  }) => void;
  initialCustomerId?: string;
  initialJobTitle?: string;
  initialJobDescription?: string;
}

type LaborRate = {
  key: string;
  name: string;
  rate: number;
};

type LineItem = {
  id: string;
  item_type: 'labor' | 'parts' | 'equipment' | 'discount' | 'other';
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  part_id?: string;
  equipment_id?: string;
};

export function NewEstimateModal({
  isOpen,
  onClose,
  onSuccess,
  initialCustomerId,
  initialJobTitle,
  initialJobDescription,
}: NewEstimateModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [laborRates, setLaborRates] = useState<LaborRate[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);

  const [formData, setFormData] = useState({
    customer_id: '',
    site_location: '',
    job_title: '',
    job_description: '',
    assigned_to: '',
    tax_rate: 7.5,
    notes: '',
    terms_and_conditions: 'This estimate is valid for 30 days from the date of issue. Payment is due upon completion of work.',
  });

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: crypto.randomUUID(),
      item_type: 'labor',
      description: '',
      quantity: 1,
      unit_price: 0,
      line_total: 0,
    }
  ]);

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Pre-fill form with initial values if provided
      if (initialCustomerId || initialJobTitle || initialJobDescription) {
        setFormData(prev => ({
          ...prev,
          customer_id: initialCustomerId || prev.customer_id,
          job_title: initialJobTitle || prev.job_title,
          job_description: initialJobDescription || prev.job_description,
        }));
      }
    }
  }, [isOpen, initialCustomerId, initialJobTitle, initialJobDescription]);

  const loadData = async () => {
    try {
      const [customersRes, techniciansRes, laborRatesRes, partsRes, equipmentRes] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'technician')
          .eq('is_active', true)
          .order('full_name'),
        supabase
          .from('labor_rate_profile')
          .select('*')
          .eq('is_active', true)
          .single(),
        supabase.from('parts').select('*').order('name'),
        supabase.from('equipment').select('*').order('manufacturer, model_number'),
      ]);

      if (customersRes.data) setCustomers(customersRes.data);
      if (techniciansRes.data) setTechnicians(techniciansRes.data);

      if (laborRatesRes.data) {
        const profile = laborRatesRes.data;
        const rates = [
          {
            key: 'standard',
            name: 'Standard Rate',
            rate: Number(profile.standard_rate)
          },
          {
            key: 'after_hours',
            name: 'After-Hours Rate',
            rate: Number(profile.after_hours_rate)
          },
          {
            key: 'emergency',
            name: 'Emergency Rate',
            rate: Number(profile.emergency_rate)
          }
        ];
        setLaborRates(rates);
      }

      if (partsRes.data) setParts(partsRes.data);
      if (equipmentRes.data) setEquipment(equipmentRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: crypto.randomUUID(),
        item_type: 'labor',
        description: '',
        quantity: 1,
        unit_price: 0,
        line_total: 0,
      }
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(lineItems.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
          updated.line_total = Number(updated.quantity) * Number(updated.unit_price);
        }
        return updated;
      }
      return item;
    }));
  };

  const handleLaborRateSelect = (itemId: string, rateKey: string) => {
    const rate = laborRates.find(r => r.key === rateKey);
    if (rate) {
      setLineItems(lineItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            description: rate.name,
            unit_price: rate.rate,
            line_total: Number(item.quantity) * Number(rate.rate)
          };
        }
        return item;
      }));
    }
  };

  const handlePartSelect = (itemId: string, partId: string) => {
    const part = parts.find(p => p.id === partId);
    if (part) {
      setLineItems(lineItems.map(item => {
        if (item.id === itemId) {
          const unitPrice = Number(part.unit_price || 0);
          return {
            ...item,
            part_id: partId,
            description: part.name,
            unit_price: unitPrice,
            line_total: Number(item.quantity) * unitPrice
          };
        }
        return item;
      }));
    }
  };

  const handleEquipmentSelect = (itemId: string, equipmentId: string) => {
    const equip = equipment.find(e => e.id === equipmentId);
    if (equip) {
      setLineItems(lineItems.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            equipment_id: equipmentId,
            description: `${equip.manufacturer} ${equip.model_number}`,
            unit_price: 0,
            line_total: 0
          };
        }
        return item;
      }));
    }
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) =>
      item.item_type !== 'discount' ? sum + Number(item.line_total) : sum, 0
    );
    const discount = lineItems.reduce((sum, item) =>
      item.item_type === 'discount' ? sum + Math.abs(Number(item.line_total)) : sum, 0
    );
    const taxAmount = (subtotal - discount) * (formData.tax_rate / 100);
    const total = subtotal - discount + taxAmount;

    return { subtotal, discount, taxAmount, total };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totals = calculateTotals();

      // Create estimate
      const { data: estimate, error: estimateError } = await (supabase
        .from('estimates') as unknown as ReturnType<typeof supabase.from>)
        .insert({
          customer_id: formData.customer_id,
          site_location: formData.site_location || null,
          job_title: formData.job_title,
          job_description: formData.job_description || null,
          assigned_to: formData.assigned_to || null,
          tax_rate: formData.tax_rate,
          subtotal: totals.subtotal,
          discount_amount: totals.discount,
          tax_amount: totals.taxAmount,
          total_amount: totals.total,
          notes: formData.notes || null,
          terms_and_conditions: formData.terms_and_conditions || null,
          status: 'draft',
          created_by: profile?.id,
        })
        .select()
        .single();

      if (estimateError) throw estimateError;

      // Create line items
      const estimateData = estimate as unknown as { id: string; estimate_number: string; customer_id: string };
      const lineItemsToInsert = lineItems
        .filter(item => item.description && item.description.trim() !== '')
        .map((item, index) => ({
          estimate_id: estimateData.id,
          line_order: index,
          item_type: item.item_type,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          part_id: item.part_id || null,
          equipment_id: item.equipment_id || null,
          labor_hours: item.item_type === 'labor' ? item.quantity : null,
          labor_rate: item.item_type === 'labor' ? item.unit_price : null,
        }));

      console.log('All line items before filter:', lineItems);
      console.log('Line items to insert after filter:', lineItemsToInsert);

      if (lineItemsToInsert.length > 0) {
        const { data: _insertedItems, error: lineItemsError } = await supabase
          .from('estimate_line_items')
          .insert(lineItemsToInsert)
          .select();

        if (lineItemsError) {
          console.error('Error inserting line items:', lineItemsError);
          throw lineItemsError;
        }

        console.log('Inserted line items:', _insertedItems);
      } else {
        console.warn('No line items to insert - all items filtered out');
      }

      // Get customer details
      const { data: customer } = await supabase
        .from('customers')
        .select('email, phone')
        .eq('id', formData.customer_id)
        .single();

      // Reset form
      setFormData({
        customer_id: '',
        site_location: '',
        job_title: '',
        job_description: '',
        assigned_to: '',
        tax_rate: 7.5,
        notes: '',
        terms_and_conditions: 'This estimate is valid for 30 days from the date of issue. Payment is due upon completion of work.',
      });
      setLineItems([
        {
          id: crypto.randomUUID(),
          item_type: 'labor',
          description: '',
          quantity: 1,
          unit_price: 0,
          line_total: 0,
        }
      ]);

      onClose();

      // Pass estimate data to trigger Send modal
      onSuccess({
        estimateId: estimateData.id,
        estimateNumber: estimateData.estimate_number,
        customerId: estimateData.customer_id,
        customerEmail: customer?.email || null,
        customerPhone: customer?.phone || null,
      });
    } catch (error) {
      console.error('Error creating estimate:', error);
      alert('Failed to create estimate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const totals = calculateTotals();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Estimate</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer *
              </label>
              <select
                required
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="input"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign To (Optional)
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="input"
              >
                <option value="">Unassigned</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Site Location (Optional)
            </label>
            <input
              type="text"
              value={formData.site_location}
              onChange={(e) => setFormData({ ...formData, site_location: e.target.value })}
              placeholder="If different from customer address"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Title *
            </label>
            <input
              type="text"
              required
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              placeholder="e.g., HVAC System Replacement"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Job Description
            </label>
            <textarea
              value={formData.job_description}
              onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
              placeholder="Detailed description of the work to be performed"
              rows={3}
              className="input"
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Line Items</h3>
              <button
                type="button"
                onClick={addLineItem}
                className="btn btn-outline flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Line Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {lineItems.map((item, _index) => (
                <div key={item.id} className="card p-4 bg-gray-50 dark:bg-gray-700/50">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Type
                      </label>
                      <select
                        value={item.item_type}
                        onChange={(e) => updateLineItem(item.id, 'item_type', e.target.value)}
                        className="input text-sm"
                      >
                        <option value="labor">Labor</option>
                        <option value="parts">Parts</option>
                        <option value="equipment">Equipment</option>
                        <option value="discount">Discount</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {item.item_type === 'labor' ? (
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Labor Rate
                        </label>
                        <select
                          onChange={(e) => handleLaborRateSelect(item.id, e.target.value)}
                          className="input text-sm"
                        >
                          <option value="">Select labor rate...</option>
                          {laborRates.map((rate) => (
                            <option key={rate.key} value={rate.key}>
                              {rate.name} (${rate.rate}/hr)
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : item.item_type === 'parts' ? (
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Part
                        </label>
                        <select
                          onChange={(e) => handlePartSelect(item.id, e.target.value)}
                          className="input text-sm"
                        >
                          <option value="">Select part...</option>
                          {parts.map((part) => (
                            <option key={part.id} value={part.id}>
                              {part.name} - ${part.unit_price || 0}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : item.item_type === 'equipment' ? (
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Equipment
                        </label>
                        <select
                          onChange={(e) => handleEquipmentSelect(item.id, e.target.value)}
                          className="input text-sm"
                        >
                          <option value="">Select equipment...</option>
                          {equipment.map((equip) => (
                            <option key={equip.id} value={equip.id}>
                              {equip.manufacturer} {equip.model_number} ({equip.serial_number})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="md:col-span-4">
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Description
                        </label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                          placeholder="Item description"
                          className="input text-sm"
                        />
                      </div>
                    )}

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {item.item_type === 'labor' ? 'Hours' : 'Quantity'}
                      </label>
                      <input
                        type="number"
                        step={item.item_type === 'labor' ? '0.25' : '0.01'}
                        min={item.item_type === 'labor' ? '1' : '0'}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || (item.item_type === 'labor' ? 1 : 0))}
                        className="input text-sm"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {item.item_type === 'labor' ? 'Rate/Hr' : 'Unit Price'}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_price}
                        onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                        className="input text-sm"
                      />
                    </div>

                    <div className="md:col-span-1">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total
                      </label>
                      <div className="px-3 py-2 bg-gray-100 dark:bg-gray-600 rounded-lg text-sm font-medium text-gray-900 dark:text-white">
                        ${item.line_total.toFixed(2)}
                      </div>
                    </div>

                    <div className="md:col-span-1 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeLineItem(item.id)}
                        disabled={lineItems.length === 1}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.tax_rate}
                  onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                  className="input"
                />
              </div>

              <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${totals.subtotal.toFixed(2)}
                  </span>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                    <span className="font-medium text-red-600">
                      -${totals.discount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tax ({formData.tax_rate}%):</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${totals.taxAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-blue-600">${totals.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (Internal)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes not visible to customer"
              rows={2}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Terms & Conditions
            </label>
            <textarea
              value={formData.terms_and_conditions}
              onChange={(e) => setFormData({ ...formData, terms_and_conditions: e.target.value })}
              placeholder="Terms and conditions for this estimate"
              rows={3}
              className="input"
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Creating...' : 'Create Estimate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
