import { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  Edit3,
  Trash2,
  Check,
  Ban,
  Clock,
  AlertCircle,
  Save,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { APService, Bill, BillLineItem, BillStatus } from '../../services/APService';
import { supabase } from '../../lib/supabase';

interface BillDetailModalProps {
  isOpen: boolean;
  bill: Bill | null;
  onClose: () => void;
  onBillUpdated: () => void;
  onRecordPayment: (billId: string) => void;
}

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

export function BillDetailModal({
  isOpen,
  bill,
  onClose,
  onBillUpdated,
  onRecordPayment,
}: BillDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Editable fields
  const [editBillDate, setEditBillDate] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editReferenceNumber, setEditReferenceNumber] = useState('');
  const [editPaymentTerms, setEditPaymentTerms] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editTaxAmount, setEditTaxAmount] = useState('0');
  const [editLineItems, setEditLineItems] = useState<BillLineItem[]>([]);

  useEffect(() => {
    if (isOpen && bill) {
      loadBillDetails();
      loadAccounts();
      loadPaymentHistory();
    }
  }, [isOpen, bill?.id]);

  const loadBillDetails = async () => {
    if (!bill) return;

    try {
      const fullBill = await APService.getBillById(bill.id);
      if (fullBill) {
        setEditBillDate(fullBill.bill_date);
        setEditDueDate(fullBill.due_date);
        setEditReferenceNumber(fullBill.reference_number || '');
        setEditPaymentTerms(fullBill.payment_terms || '');
        setEditNotes(fullBill.notes || '');
        setEditTaxAmount(fullBill.tax_amount.toString());
        setEditLineItems(fullBill.line_items || []);
      }
    } catch (err) {
      console.error('Failed to load bill details:', err);
    }
  };

  const loadAccounts = async () => {
    try {
      const { data } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type')
        .eq('is_active', true)
        .in('account_type', ['expense', 'asset', 'cost_of_goods_sold'])
        .order('account_code');
      setAccounts(data || []);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    }
  };

  const loadPaymentHistory = async () => {
    if (!bill) return;

    try {
      const { data } = await supabase
        .from('vendor_payment_allocations')
        .select(`
          amount,
          payment:vendor_payments(id, payment_number, payment_date, payment_method)
        `)
        .eq('bill_id', bill.id);

      setPaymentHistory(data || []);
    } catch (err) {
      console.error('Failed to load payment history:', err);
    }
  };

  const handleSave = async () => {
    if (!bill) return;

    setLoading(true);
    setError('');

    try {
      await APService.updateBill(bill.id, {
        bill_date: editBillDate,
        due_date: editDueDate,
        reference_number: editReferenceNumber || undefined,
        payment_terms: editPaymentTerms || undefined,
        notes: editNotes || undefined,
        tax_amount: parseFloat(editTaxAmount) || 0,
      });

      // Update line items
      await APService.updateBillLineItems(bill.id, editLineItems);

      setIsEditing(false);
      onBillUpdated();
    } catch (err: any) {
      console.error('Failed to update bill:', err);
      setError(err.message || 'Failed to update bill');
    } finally {
      setLoading(false);
    }
  };

  const handlePostBill = async () => {
    if (!bill) return;

    setLoading(true);
    setError('');

    try {
      await APService.postBill(bill.id);
      onBillUpdated();
    } catch (err: any) {
      console.error('Failed to post bill:', err);
      setError(err.message || 'Failed to post bill');
    } finally {
      setLoading(false);
    }
  };

  const handleVoidBill = async () => {
    if (!bill) return;

    if (!confirm('Are you sure you want to void this bill? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await APService.voidBill(bill.id);
      onBillUpdated();
    } catch (err: any) {
      console.error('Failed to void bill:', err);
      setError(err.message || 'Failed to void bill');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBill = async () => {
    if (!bill) return;

    if (!confirm('Are you sure you want to delete this draft bill? This cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      await APService.deleteBill(bill.id);
      onBillUpdated();
      onClose();
    } catch (err: any) {
      console.error('Failed to delete bill:', err);
      setError(err.message || 'Failed to delete bill');
    } finally {
      setLoading(false);
    }
  };

  const addLineItem = () => {
    setEditLineItems([...editLineItems, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (editLineItems.length > 1) {
      setEditLineItems(editLineItems.filter((_, i) => i !== index));
    }
  };

  const updateLineItem = (index: number, field: keyof BillLineItem, value: any) => {
    const updated = [...editLineItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === 'quantity' || field === 'unit_price') {
      updated[index].amount = (updated[index].quantity || 0) * (updated[index].unit_price || 0);
    }

    setEditLineItems(updated);
  };

  const getStatusBadge = (status: BillStatus) => {
    const styles: Record<BillStatus, { bg: string; text: string; icon: any }> = {
      draft: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', icon: Edit3 },
      received: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', icon: Clock },
      approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', icon: Check },
      partial: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', icon: Clock },
      paid: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-400', icon: Check },
      void: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', icon: Ban },
    };

    const style = styles[status];
    const Icon = style.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-4 h-4 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const canEdit = bill?.status === 'draft' || bill?.status === 'received';
  const canPost = bill?.status === 'draft' || bill?.status === 'received';
  const canVoid = bill?.status !== 'void' && bill?.status !== 'paid' && (bill?.amount_paid || 0) === 0;
  const canDelete = bill?.status === 'draft';
  const canPay = bill?.status === 'approved' || bill?.status === 'partial';

  const subtotal = editLineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const tax = parseFloat(editTaxAmount) || 0;
  const total = subtotal + tax;

  if (!isOpen || !bill) return null;

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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bill {bill.bill_number}
                </h3>
                <p className="text-sm text-gray-500">{bill.vendor?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(bill.status)}
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Bill Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400">Vendor</label>
                <div className="flex items-center mt-1">
                  <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {bill.vendor?.name}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400">Bill Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editBillDate}
                    onChange={(e) => setEditBillDate(e.target.value)}
                    className="input w-full mt-1 text-sm"
                  />
                ) : (
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(bill.bill_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400">Due Date</label>
                {isEditing ? (
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="input w-full mt-1 text-sm"
                  />
                ) : (
                  <div className="flex items-center mt-1">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <span className={`text-sm font-medium ${
                      new Date(bill.due_date) < new Date() && bill.balance_due > 0
                        ? 'text-red-600'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {new Date(bill.due_date).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400">Reference #</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editReferenceNumber}
                    onChange={(e) => setEditReferenceNumber(e.target.value)}
                    className="input w-full mt-1 text-sm"
                    placeholder="Vendor invoice #"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {bill.reference_number || '-'}
                  </span>
                )}
              </div>
            </div>

            {/* Line Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Line Items
                </label>
                {isEditing && (
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="btn btn-sm btn-outline flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Line</span>
                  </button>
                )}
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
                      {isEditing && <th className="px-4 py-2 w-10"></th>}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {(isEditing ? editLineItems : bill.line_items || []).map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2">
                          {isEditing ? (
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                              className="input w-full text-sm"
                            />
                          ) : (
                            <span className="text-sm text-gray-900 dark:text-white">{item.description}</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          {isEditing ? (
                            <select
                              value={item.gl_account_id || ''}
                              onChange={(e) => updateLineItem(index, 'gl_account_id', e.target.value || undefined)}
                              className="input w-full text-sm"
                            >
                              <option value="">Select...</option>
                              {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                  {acc.account_code}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="text-sm text-gray-500">
                              {item.gl_account?.account_code || '-'}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                              className="input w-full text-sm text-right"
                              step="0.01"
                            />
                          ) : (
                            <span className="text-sm text-gray-900 dark:text-white">{item.quantity}</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {isEditing ? (
                            <input
                              type="number"
                              value={item.unit_price}
                              onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                              className="input w-full text-sm text-right"
                              step="0.01"
                            />
                          ) : (
                            <span className="text-sm text-gray-900 dark:text-white">
                              ${item.unit_price.toFixed(2)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                          ${item.amount.toFixed(2)}
                        </td>
                        {isEditing && (
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => removeLineItem(index)}
                              disabled={editLineItems.length === 1}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        )}
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
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${(isEditing ? subtotal : bill.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Tax:</span>
                  {isEditing ? (
                    <div className="relative w-24">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                      <input
                        type="number"
                        value={editTaxAmount}
                        onChange={(e) => setEditTaxAmount(e.target.value)}
                        className="input w-full text-sm text-right pl-6"
                        step="0.01"
                      />
                    </div>
                  ) : (
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${bill.tax_amount.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-medium text-gray-900 dark:text-white">Total:</span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    ${(isEditing ? total : bill.total_amount).toFixed(2)}
                  </span>
                </div>
                {bill.amount_paid > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Paid:</span>
                      <span>-${bill.amount_paid.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold">
                      <span className="text-gray-900 dark:text-white">Balance Due:</span>
                      <span className={bill.balance_due > 0 ? 'text-red-600' : 'text-green-600'}>
                        ${bill.balance_due.toFixed(2)}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Payment History */}
            {paymentHistory.length > 0 && (
              <div>
                <button
                  onClick={() => setShowPaymentHistory(!showPaymentHistory)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {showPaymentHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>Payment History ({paymentHistory.length})</span>
                </button>

                {showPaymentHistory && (
                  <div className="mt-2 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Payment #
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Method
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {paymentHistory.map((ph, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                              {ph.payment?.payment_number}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(ph.payment?.payment_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {ph.payment?.payment_method || '-'}
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-green-600">
                              ${ph.amount.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            {(isEditing || bill.notes) && (
              <div>
                <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1">Notes</label>
                {isEditing ? (
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={2}
                    className="input w-full"
                  />
                ) : (
                  <p className="text-sm text-gray-700 dark:text-gray-300">{bill.notes}</p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              {canDelete && (
                <button
                  onClick={handleDeleteBill}
                  disabled={loading}
                  className="btn btn-outline text-red-600 border-red-600 hover:bg-red-50 flex items-center space-x-1"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
              {canVoid && !canDelete && (
                <button
                  onClick={handleVoidBill}
                  disabled={loading}
                  className="btn btn-outline text-red-600 border-red-600 hover:bg-red-50 flex items-center space-x-1"
                >
                  <Ban className="w-4 h-4" />
                  <span>Void</span>
                </button>
              )}
            </div>

            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <button onClick={() => setIsEditing(false)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className="btn btn-primary flex items-center space-x-1"
                  >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                </>
              ) : (
                <>
                  {canEdit && (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="btn btn-outline flex items-center space-x-1"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  )}
                  {canPost && (
                    <button
                      onClick={handlePostBill}
                      disabled={loading}
                      className="btn btn-primary flex items-center space-x-1"
                    >
                      <Check className="w-4 h-4" />
                      <span>{loading ? 'Posting...' : 'Post Bill'}</span>
                    </button>
                  )}
                  {canPay && (
                    <button
                      onClick={() => onRecordPayment(bill.id)}
                      className="btn btn-primary flex items-center space-x-1"
                    >
                      <DollarSign className="w-4 h-4" />
                      <span>Record Payment</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
