import { useState, useEffect, useCallback } from 'react';
import { Plus, X, DollarSign, AlertCircle } from 'lucide-react';
import { ReconciliationService, AdjustmentType } from '../../services/ReconciliationService';
import { supabase } from '../../lib/supabase';

interface AdjustmentFormProps {
  reconciliationId: string;
  accountId: string;
  onAdjustmentCreated: () => void;
  onCancel: () => void;
}

interface Account {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

const ADJUSTMENT_TYPES: { value: AdjustmentType; label: string; description: string }[] = [
  {
    value: 'bank_fee',
    label: 'Bank Fee',
    description: 'Monthly fees, wire fees, etc.',
  },
  {
    value: 'interest_income',
    label: 'Interest Income',
    description: 'Interest earned on account',
  },
  {
    value: 'nsf',
    label: 'NSF (Returned Check)',
    description: 'Non-sufficient funds or bounced checks',
  },
  {
    value: 'correction',
    label: 'Error Correction',
    description: 'Correct previous entry errors',
  },
  {
    value: 'other',
    label: 'Other',
    description: 'Other adjustments',
  },
];

export function AdjustmentForm({
  reconciliationId,
  accountId,
  onAdjustmentCreated,
  onCancel,
}: AdjustmentFormProps) {
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('bank_fee');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [debitAccountId, setDebitAccountId] = useState('');
  const [creditAccountId, setCreditAccountId] = useState('');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadAccounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type')
        .eq('is_active', true)
        .order('account_code');

      if (error) throw error;
      setAccounts(data || []);
    } catch (err: unknown) {
      console.error('Failed to load accounts:', err);
    }
  }, []);

  const setDefaultAccounts = useCallback(() => {
    if (accounts.length === 0) return;

    // Find common accounts
    const bankFeeExpense = accounts.find(
      (a) => a.account_name.toLowerCase().includes('bank') && a.account_type === 'expense'
    );
    const interestIncome = accounts.find(
      (a) => a.account_name.toLowerCase().includes('interest') && a.account_type === 'income'
    );

    switch (adjustmentType) {
      case 'bank_fee':
        // Debit expense, credit bank
        setDebitAccountId(bankFeeExpense?.id || '');
        setCreditAccountId(accountId);
        break;
      case 'interest_income':
        // Debit bank, credit income
        setDebitAccountId(accountId);
        setCreditAccountId(interestIncome?.id || '');
        break;
      case 'nsf': {
        // Debit AR (or expense), credit bank
        const arAccount = accounts.find((a) => a.account_name.toLowerCase().includes('receivable'));
        setDebitAccountId(arAccount?.id || '');
        setCreditAccountId(accountId);
        break;
      }
      default:
        // Default: debit bank
        setDebitAccountId(accountId);
        setCreditAccountId('');
    }
  }, [accounts, adjustmentType, accountId]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    // Set default accounts based on adjustment type
    setDefaultAccounts();
  }, [setDefaultAccounts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setError('Please enter a valid positive amount');
      return;
    }

    if (!description.trim()) {
      setError('Please enter a description');
      return;
    }

    if (!debitAccountId || !creditAccountId) {
      setError('Please select both debit and credit accounts');
      return;
    }

    if (debitAccountId === creditAccountId) {
      setError('Debit and credit accounts must be different');
      return;
    }

    setLoading(true);

    try {
      await ReconciliationService.createAdjustment({
        reconciliation_id: reconciliationId,
        adjustment_type: adjustmentType,
        amount: amountNum,
        description: description.trim(),
        debit_account_id: debitAccountId,
        credit_account_id: creditAccountId,
        entry_date: new Date().toISOString().split('T')[0],
      });

      onAdjustmentCreated();
    } catch (err: unknown) {
      console.error('Failed to create adjustment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create adjustment');
    } finally {
      setLoading(false);
    }
  };

  const groupedAccounts = accounts.reduce((acc, account) => {
    const type = account.account_type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  const accountTypeOrder = ['asset', 'liability', 'equity', 'income', 'expense'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-5 h-5 text-blue-600" />
          <h4 className="font-semibold text-gray-900 dark:text-white">New Adjustment</h4>
        </div>
        <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Adjustment Type
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ADJUSTMENT_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setAdjustmentType(type.value)}
              className={`p-3 text-left rounded-lg border transition-colors ${
                adjustmentType === type.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm text-gray-900 dark:text-white">
                {type.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="input w-full pl-8"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Description
        </label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g., Monthly service fee"
          className="input w-full"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Debit Account
          </label>
          <select
            value={debitAccountId}
            onChange={(e) => setDebitAccountId(e.target.value)}
            className="input w-full"
            required
          >
            <option value="">Select account...</option>
            {accountTypeOrder.map((type) =>
              groupedAccounts[type]?.length ? (
                <optgroup key={type} label={type.charAt(0).toUpperCase() + type.slice(1)}>
                  {groupedAccounts[type].map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </optgroup>
              ) : null
            )}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Credit Account
          </label>
          <select
            value={creditAccountId}
            onChange={(e) => setCreditAccountId(e.target.value)}
            className="input w-full"
            required
          >
            <option value="">Select account...</option>
            {accountTypeOrder.map((type) =>
              groupedAccounts[type]?.length ? (
                <optgroup key={type} label={type.charAt(0).toUpperCase() + type.slice(1)}>
                  {groupedAccounts[type].map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.account_code} - {account.account_name}
                    </option>
                  ))}
                </optgroup>
              ) : null
            )}
          </select>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          This will create a journal entry that debits the first account and credits the second.
          The entry will automatically be marked as cleared for this reconciliation.
        </p>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button type="button" onClick={onCancel} className="btn btn-outline">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn btn-primary flex items-center space-x-2">
          {loading ? (
            <span>Creating...</span>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              <span>Create Adjustment</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
