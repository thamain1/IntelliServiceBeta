import { useState, useEffect } from 'react';
import {
  X,
  DollarSign,
  Building2,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  Check,
} from 'lucide-react';
import { APService, Bill, CreatePaymentInput, PaymentMethod } from '../../services/APService';
import { supabase } from '../../lib/supabase';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentRecorded: () => void;
  preselectedVendorId?: string;
  preselectedBillId?: string;
}

interface Vendor {
  id: string;
  name: string;
  vendor_code?: string;
}

interface BankAccount {
  id: string;
  account_code: string;
  account_name: string;
}

interface BillAllocation {
  bill: Bill;
  amount: number;
  selected: boolean;
}

export function RecordPaymentModal({
  isOpen,
  onClose,
  onPaymentRecorded,
  preselectedVendorId,
  preselectedBillId,
}: RecordPaymentModalProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [vendorId, setVendorId] = useState(preselectedVendorId || '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('check');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [checkNumber, setCheckNumber] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [notes, setNotes] = useState('');

  // Bill allocations
  const [unpaidBills, setUnpaidBills] = useState<Bill[]>([]);
  const [allocations, setAllocations] = useState<BillAllocation[]>([]);
  const [loadingBills, setLoadingBills] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadVendors();
      loadBankAccounts();
      resetForm();
    }
  }, [isOpen]);

  useEffect(() => {
    if (vendorId) {
      loadUnpaidBills();
    } else {
      setUnpaidBills([]);
      setAllocations([]);
    }
  }, [vendorId]);

  useEffect(() => {
    // Pre-select bill if provided
    if (preselectedBillId && allocations.length > 0) {
      const updated = allocations.map((a) => ({
        ...a,
        selected: a.bill.id === preselectedBillId,
        amount: a.bill.id === preselectedBillId ? a.bill.balance_due : 0,
      }));
      setAllocations(updated);

      const bill = unpaidBills.find((b) => b.id === preselectedBillId);
      if (bill) {
        setPaymentAmount(bill.balance_due.toString());
      }
    }
  }, [preselectedBillId, unpaidBills]);

  const loadVendors = async () => {
    try {
      const { data } = await supabase
        .from('vendors')
        .select('id, name, vendor_code')
        .eq('is_active', true)
        .order('name');
      setVendors(data || []);
    } catch (err) {
      console.error('Failed to load vendors:', err);
    }
  };

  const loadBankAccounts = async () => {
    try {
      const { data } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name')
        .eq('is_active', true)
        .eq('account_type', 'asset')
        .ilike('account_name', '%bank%')
        .order('account_code');
      setBankAccounts(data || []);
    } catch (err) {
      console.error('Failed to load bank accounts:', err);
    }
  };

  const loadUnpaidBills = async () => {
    setLoadingBills(true);
    try {
      const bills = await APService.getUnpaidBillsForVendor(vendorId);
      setUnpaidBills(bills);
      setAllocations(
        bills.map((bill) => ({
          bill,
          amount: 0,
          selected: false,
        }))
      );
    } catch (err) {
      console.error('Failed to load unpaid bills:', err);
    } finally {
      setLoadingBills(false);
    }
  };

  const resetForm = () => {
    setVendorId(preselectedVendorId || '');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentAmount('');
    setPaymentMethod('check');
    setReferenceNumber('');
    setCheckNumber('');
    setBankAccountId('');
    setNotes('');
    setAllocations([]);
    setError('');
  };

  const toggleBillSelection = (index: number) => {
    const updated = [...allocations];
    updated[index].selected = !updated[index].selected;
    if (updated[index].selected) {
      updated[index].amount = updated[index].bill.balance_due;
    } else {
      updated[index].amount = 0;
    }
    setAllocations(updated);
  };

  const updateAllocationAmount = (index: number, amount: number) => {
    const updated = [...allocations];
    updated[index].amount = Math.min(amount, updated[index].bill.balance_due);
    updated[index].selected = amount > 0;
    setAllocations(updated);
  };

  const selectAllBills = () => {
    const totalDue = unpaidBills.reduce((sum, b) => sum + b.balance_due, 0);
    setAllocations(
      unpaidBills.map((bill) => ({
        bill,
        amount: bill.balance_due,
        selected: true,
      }))
    );
    setPaymentAmount(totalDue.toString());
  };

  const clearSelections = () => {
    setAllocations(
      unpaidBills.map((bill) => ({
        bill,
        amount: 0,
        selected: false,
      }))
    );
  };

  const totalAllocated = allocations.reduce((sum, a) => sum + (a.amount || 0), 0);
  const paymentAmountNum = parseFloat(paymentAmount) || 0;
  const unallocated = paymentAmountNum - totalAllocated;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!vendorId) {
      setError('Please select a vendor');
      return;
    }

    if (!paymentDate) {
      setError('Please enter a payment date');
      return;
    }

    if (!paymentAmountNum || paymentAmountNum <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    const selectedAllocations = allocations.filter((a) => a.selected && a.amount > 0);
    if (selectedAllocations.length === 0) {
      setError('Please select at least one bill to pay');
      return;
    }

    if (totalAllocated > paymentAmountNum) {
      setError('Total allocations cannot exceed payment amount');
      return;
    }

    setLoading(true);

    try {
      const input: CreatePaymentInput = {
        vendor_id: vendorId,
        payment_date: paymentDate,
        amount: paymentAmountNum,
        payment_method: paymentMethod,
        reference_number: referenceNumber || undefined,
        check_number: checkNumber || undefined,
        bank_account_id: bankAccountId || undefined,
        notes: notes || undefined,
        allocations: selectedAllocations.map((a) => ({
          bill_id: a.bill.id,
          amount: a.amount,
        })),
      };

      await APService.createPayment(input);

      onPaymentRecorded();
      onClose();
    } catch (err: any) {
      console.error('Failed to record payment:', err);
      setError(err.message || 'Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-3xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Record Payment</h3>
                <p className="text-sm text-gray-500">Pay vendor bills</p>
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-6 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Vendor <span className="text-red-500">*</span>
                </label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="input w-full"
                  required
                  disabled={!!preselectedVendorId}
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
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Payment Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    className="input w-full pl-8"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="input w-full"
                >
                  <option value="check">Check</option>
                  <option value="ach">ACH/Bank Transfer</option>
                  <option value="wire">Wire Transfer</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {paymentMethod === 'check' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Check Number
                  </label>
                  <input
                    type="text"
                    value={checkNumber}
                    onChange={(e) => setCheckNumber(e.target.value)}
                    placeholder="Check #"
                    className="input w-full"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  placeholder="Transaction reference"
                  className="input w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Bank Account
                </label>
                <select
                  value={bankAccountId}
                  onChange={(e) => setBankAccountId(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Select bank account...</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bill Allocations */}
            {vendorId && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Apply Payment to Bills
                  </label>
                  <div className="space-x-2">
                    <button
                      type="button"
                      onClick={selectAllBills}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={clearSelections}
                      className="text-xs text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {loadingBills ? (
                  <div className="p-4 text-center text-gray-500">Loading bills...</div>
                ) : unpaidBills.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 border border-gray-200 dark:border-gray-700 rounded-lg">
                    No unpaid bills for this vendor
                  </div>
                ) : (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                        <tr>
                          <th className="w-8 px-3 py-2"></th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Bill #
                          </th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                            Due Date
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                            Balance Due
                          </th>
                          <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-32">
                            Payment
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {allocations.map((alloc, index) => (
                          <tr
                            key={alloc.bill.id}
                            className={alloc.selected ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                          >
                            <td className="px-3 py-2">
                              <input
                                type="checkbox"
                                checked={alloc.selected}
                                onChange={() => toggleBillSelection(index)}
                                className="w-4 h-4 text-blue-600 rounded"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {alloc.bill.bill_number}
                              </span>
                              {alloc.bill.reference_number && (
                                <p className="text-xs text-gray-500">Ref: {alloc.bill.reference_number}</p>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <span className={`text-sm ${
                                new Date(alloc.bill.due_date) < new Date()
                                  ? 'text-red-600 font-medium'
                                  : 'text-gray-500'
                              }`}>
                                {new Date(alloc.bill.due_date).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="px-3 py-2 text-right text-sm font-medium text-gray-900 dark:text-white">
                              ${alloc.bill.balance_due.toFixed(2)}
                            </td>
                            <td className="px-3 py-2">
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                                <input
                                  type="number"
                                  value={alloc.amount || ''}
                                  onChange={(e) => updateAllocationAmount(index, parseFloat(e.target.value) || 0)}
                                  max={alloc.bill.balance_due}
                                  min="0"
                                  step="0.01"
                                  placeholder="0.00"
                                  className="input w-full text-sm text-right pl-6"
                                />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Allocation Summary */}
                {paymentAmountNum > 0 && (
                  <div className="mt-3 flex justify-end">
                    <div className="w-64 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Payment Amount:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${paymentAmountNum.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Total Allocated:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${totalAllocated.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-gray-200 dark:border-gray-700">
                        <span className="text-gray-500">Unallocated:</span>
                        <span className={`font-medium ${
                          unallocated < 0 ? 'text-red-600' : 'text-gray-900 dark:text-white'
                        }`}>
                          ${unallocated.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Payment notes..."
                className="input w-full"
              />
            </div>
          </form>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || totalAllocated === 0}
              className="btn btn-primary flex items-center space-x-2"
            >
              {loading ? (
                <span>Processing...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Record Payment</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
