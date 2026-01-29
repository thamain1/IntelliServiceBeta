import { useState, useEffect } from 'react';
import { X, Plus, Trash2, DollarSign, Building2, Calendar, FileText, AlertCircle } from 'lucide-react';
import { APService, CreateBillInput, BillLineItem } from '../../services/APService';
import { supabase } from '../../lib/supabase';

interface NewBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBillCreated: () => void;
  preselectedVendorId?: string;
}

interface Vendor {
  id: string;
  name: string;
  vendor_code?: string;
  payment_terms?: string;
}

interface Account {
  id: string;
  account_number: string;
  account_name: string;
  account_type: string;
}

export function NewBillModal({ isOpen, onClose, onBillCreated, preselectedVendorId }: NewBillModalProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [vendorId, setVendorId] = useState(preselectedVendorId || '');
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [receivedDate, setReceivedDate] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('');
  const [notes, setNotes] = useState('');
  const [taxAmount, setTaxAmount] = useState('0');
  const [lineItems, setLineItems] = useState<BillLineItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 },
  ]);

  useEffect(() => {
    if (isOpen) {
      loadVendors();
      loadAccounts();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    // Set default due date based on payment terms
    if (billDate) {
      const date = new Date(billDate);
      let days = 30;

      if (paymentTerms === 'net_15') days = 15;
      else if (paymentTerms === 'net_30') days = 30;
      else if (paymentTerms === 'net_45') days = 45;
      else if (paymentTerms === 'net_60') days = 60;
      else if (paymentTerms === 'due_on_receipt') days = 0;

      date.setDate(date.getDate() + days);
      setDueDate(date.toISOString().split('T')[0]);
    }
  }, [billDate, paymentTerms]);

  useEffect(() => {
    // Auto-set payment terms from vendor
    const vendor = vendors.find((v) => v.id === vendorId);
    if (vendor?.payment_terms) {
      setPaymentTerms(vendor.payment_terms);
    }
  }, [vendorId, vendors]);

  const loadVendors = async () => {
    try {
      const { data } = await supabase
        .from('vendors')
        .select('id, name, vendor_code, payment_terms')
        .eq('is_active', true)
        .order('name');
      setVendors(data || []);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  };

  const loadAccounts = async () => {
    try {
      const { data } = await supabase
        .from('chart_of_accounts')
        .select('id, account_number, account_name, account_type')
        .eq('is_active', true)
        .in('account_type', ['expense', 'asset', 'cost_of_goods_sold'])
        .order('account_number');
      setAccounts(data || []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const resetForm = () => {
    setVendorId(preselectedVendorId || '');
    setBillDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setReceivedDate('');
    setReferenceNumber('');
    setPaymentTerms('');
    setNotes('');
    setTaxAmount('0');
    setLineItems([{ description: '', quantity: 1, unit_price: 0, amount: 0 }]);
    setError('');
  };

  const addLineItem = () => {
    setLineItems([...lineItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof BillLineItem, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate amount
    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = (updated[index].quantity || 0) * (updated[index].unit_price || 0);
    }

    setLineItems(updated);
  };

  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const tax = parseFloat(taxAmount) || 0;
  const total = subtotal + tax;

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!vendorId) {
      setError('Please select a vendor');
      return;
    }

    if (!billDate) {
      setError('Please enter a bill date');
      return;
    }

    if (!dueDate) {
      setError('Please enter a due date');
      return;
    }

    const validLineItems = lineItems.filter((item) => item.description && item.amount > 0);
    if (validLineItems.length === 0) {
      setError('Please add at least one line item');
      return;
    }

    setLoading(true);

    try {
      const input: CreateBillInput = {
        vendor_id: vendorId,
        bill_date: billDate,
        due_date: dueDate,
        received_date: receivedDate || undefined,
        payment_terms: paymentTerms || undefined,
        reference_number: referenceNumber || undefined,
        notes: notes || undefined,
        tax_amount: tax,
        line_items: validLineItems,
      };

      const bill = await APService.createBill(input);

      // Post if not saving as draft
      if (!saveAsDraft) {
        await APService.postBill(bill.id);
      }

      onBillCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to create bill:', err);
      setError(err.message || 'Failed to create bill');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const groupedAccounts = accounts.reduce((acc, account) => {
    const type = account.account_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Bill</h3>
                <p className="text-sm text-gray-500">Enter vendor bill details</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={(e) => handleSubmit(e, false)} className="mt-4 space-y-6">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Bill Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="input w-full"
                  required
                >
                  <option value="">Select vendor...</option>
                  {vendors.map((vendor) => (
                    <option key={vendor.id} value={vendor.id}>
                      {vendor.vendor_code ? `${vendor.vendor_code} - ` : ''}{vendor.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Bill Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={billDate}
                  onChange={(e) => setBillDate(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Vendor invoice #"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Terms
                </label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select...</option>
                  <option value="due_on_receipt">Due on Receipt</option>
                  <option value="net_15">Net 15</option>
                  <option value="net_30">Net 30</option>
                  <option value="net_45">Net 45</option>
                  <option value="net_60">Net 60</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Received Date
                </label>
                <input
                  type="date"
                  value={receivedDate}
                  onChange={(e) => setReceivedDate(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Line Items
                </label>
                <button
                  type="button"
                  onClick={addLineItem}
                  className="btn btn-sm btn-outline flex items-center space-x-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Line</span>
                </button>
              </div>

              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase w-32">
                        Account
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-20">
                        Qty
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">
                        Price
                      </th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">
                        Amount
                      </th>
                      <th className="px-4 py-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {lineItems.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.description}
                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                            placeholder="Description"
                            className="input w-full text-sm"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <select
                            value={item.gl_account_id || ''}
                            onChange={(e) => updateLineItem(index, 'gl_account_id', e.target.value || undefined)}
                            className="input w-full text-sm"
                          >
                            <option value="">Select...</option>
                            {Object.entries(groupedAccounts).map(([type, accts]) => (
                              <optgroup key={type} label={type.replace(/_/g, ' ').toUpperCase()}>
                                {accts.map((acc) => (
                                  <option key={acc.id} value={acc.id}>
                                    {acc.account_number} - {acc.account_name}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </td>
                        <td className="px-4 py-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className="input w-full text-sm text-right"
                          />
                        </td>
                        <td className="px-4 py-2">
                          <div className="relative">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              className="input w-full text-sm text-right pl-6"
                            />
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                          ${item.amount.toFixed(2)}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => removeLineItem(index)}
                            disabled={lineItems.length === 1}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal:</span>
                  <span className="font-medium text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Tax:</span>
                  <div className="relative w-24">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      value={taxAmount}
                      onChange={(e) => setTaxAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      className="input w-full text-sm text-right pl-6"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-900 dark:text-white">Total:</span>
                  <span className="font-bold text-gray-900 dark:text-white">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Internal notes about this bill..."
                className="input w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button type="button" onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={loading}
                className="btn btn-outline"
              >
                Save as Draft
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary flex items-center space-x-2">
                {loading ? (
                  <span>Saving...</span>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4" />
                    <span>Post Bill</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
