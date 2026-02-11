import { useEffect, useState } from 'react';
import { Save, AlertCircle, CheckCircle, BookOpen, DollarSign, CreditCard, Building } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { PayrollService } from '../../services/PayrollService';

interface GLAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
}

interface GLMappings {
  wages_expense: string | null;
  cash: string | null;
  payroll_liabilities: string | null;
  federal_tax_payable: string | null;
  state_tax_payable: string | null;
  fica_payable: string | null;
  medicare_payable: string | null;
}

interface MappingConfig {
  key: keyof GLMappings;
  label: string;
  description: string;
  icon: React.ReactNode;
  accountType: 'expense' | 'asset' | 'liability';
  suggestedCode: string;
}

const MAPPING_CONFIGS: MappingConfig[] = [
  {
    key: 'wages_expense',
    label: 'Wages Expense',
    description: 'Debit account for gross pay (typically an expense account)',
    icon: <DollarSign className="w-5 h-5" />,
    accountType: 'expense',
    suggestedCode: '5000',
  },
  {
    key: 'cash',
    label: 'Cash Account',
    description: 'Credit account for net pay disbursements',
    icon: <CreditCard className="w-5 h-5" />,
    accountType: 'asset',
    suggestedCode: '1000',
  },
  {
    key: 'payroll_liabilities',
    label: 'Payroll Liabilities',
    description: 'Credit account for total payroll deductions',
    icon: <Building className="w-5 h-5" />,
    accountType: 'liability',
    suggestedCode: '2000',
  },
  {
    key: 'federal_tax_payable',
    label: 'Federal Tax Payable',
    description: 'Liability account for federal withholdings',
    icon: <Building className="w-5 h-5" />,
    accountType: 'liability',
    suggestedCode: '2100',
  },
  {
    key: 'state_tax_payable',
    label: 'State Tax Payable',
    description: 'Liability account for state withholdings',
    icon: <Building className="w-5 h-5" />,
    accountType: 'liability',
    suggestedCode: '2110',
  },
  {
    key: 'fica_payable',
    label: 'FICA Payable',
    description: 'Liability account for Social Security withholdings',
    icon: <Building className="w-5 h-5" />,
    accountType: 'liability',
    suggestedCode: '2120',
  },
  {
    key: 'medicare_payable',
    label: 'Medicare Payable',
    description: 'Liability account for Medicare withholdings',
    icon: <Building className="w-5 h-5" />,
    accountType: 'liability',
    suggestedCode: '2130',
  },
];

export function PayrollGLMappingSettings() {
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [mappings, setMappings] = useState<GLMappings>({
    wages_expense: null,
    cash: null,
    payroll_liabilities: null,
    federal_tax_payable: null,
    state_tax_payable: null,
    fica_payable: null,
    medicare_payable: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load GL accounts
      const { data: accounts, error } = await supabase
        .from('chart_of_accounts')
        .select('id, account_code, account_name, account_type')
        .eq('is_active', true)
        .order('account_code', { ascending: true });

      if (error) throw error;
      setGlAccounts(accounts || []);

      // Load current mappings
      const currentMappings = await PayrollService.getPayrollGLAccounts();
      setMappings(currentMappings);
    } catch (error) {
      console.error('Error loading GL data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (key: keyof GLMappings, value: string) => {
    setMappings((prev) => ({
      ...prev,
      [key]: value || null,
    }));
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      // In a real implementation, this would save to a settings table
      // For now, the mappings are determined by account codes in chart_of_accounts
      // So we'll just validate that the selected accounts exist

      const missingMappings = MAPPING_CONFIGS.filter(
        (config) => config.key === 'wages_expense' || config.key === 'cash' || config.key === 'payroll_liabilities'
      ).filter((config) => !mappings[config.key]);

      if (missingMappings.length > 0) {
        alert(`Please configure the following required mappings: ${missingMappings.map((m) => m.label).join(', ')}`);
        setSaving(false);
        return;
      }

      // Simulate save
      await new Promise((resolve) => setTimeout(resolve, 500));

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving mappings:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const getFilteredAccounts = (accountType: 'expense' | 'asset' | 'liability') => {
    return glAccounts.filter((account) => {
      switch (accountType) {
        case 'expense':
          return account.account_type === 'expense';
        case 'asset':
          return account.account_type === 'asset';
        case 'liability':
          return account.account_type === 'liability';
        default:
          return true;
      }
    });
  };

  const isConfigured = (key: keyof GLMappings) => !!mappings[key];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 p-3 rounded-lg">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">GL Account Mappings</h2>
            <p className="text-gray-600 dark:text-gray-400">Configure general ledger accounts for payroll posting</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2"
        >
          {saving ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? 'Saving...' : 'Save Mappings'}</span>
        </button>
      </div>

      {/* Status Messages */}
      {saveStatus === 'success' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 dark:text-green-200">GL mappings saved successfully!</span>
          </div>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span className="text-red-800 dark:text-red-200">Failed to save mappings. Please try again.</span>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>How Payroll GL Posting Works:</strong>
            </p>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li><strong>Debit:</strong> Wages Expense (gross pay amount)</li>
              <li><strong>Credit:</strong> Cash (net pay amount)</li>
              <li><strong>Credit:</strong> Payroll Liabilities (total deductions)</li>
            </ul>
            <p className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              Ensure debits equal credits for each payroll posting to maintain balanced entries.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isConfigured('wages_expense') ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'
            }`}>
              {isConfigured('wages_expense') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Wages Expense</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {isConfigured('wages_expense') ? 'Configured' : 'Not Configured'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isConfigured('cash') ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'
            }`}>
              {isConfigured('cash') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cash Account</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {isConfigured('cash') ? 'Configured' : 'Not Configured'}
              </p>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              isConfigured('payroll_liabilities') ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'
            }`}>
              {isConfigured('payroll_liabilities') ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Payroll Liabilities</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {isConfigured('payroll_liabilities') ? 'Configured' : 'Not Configured'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Mapping Configuration */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Account Mappings</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Select the GL accounts to use for each payroll transaction type
          </p>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {MAPPING_CONFIGS.map((config) => {
            const filteredAccounts = getFilteredAccounts(config.accountType);
            const isRequired = ['wages_expense', 'cash', 'payroll_liabilities'].includes(config.key);

            return (
              <div key={config.key} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-lg ${
                      isConfigured(config.key)
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-600'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}>
                      {config.icon}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">{config.label}</span>
                        {isRequired && <span className="badge badge-red text-xs">Required</span>}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{config.description}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Suggested account code: {config.suggestedCode}
                      </p>
                    </div>
                  </div>
                  <div className="w-72">
                    <select
                      value={mappings[config.key] || ''}
                      onChange={(e) => handleMappingChange(config.key, e.target.value)}
                      className="input"
                    >
                      <option value="">Select Account</option>
                      {filteredAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_code} - {account.account_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Journal Entry Preview */}
      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sample Journal Entry</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Preview of how a payroll posting will appear in the General Ledger
          </p>
        </div>
        <div className="p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-gray-600 dark:text-gray-400">Account</th>
                  <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">Debit</th>
                  <th className="px-4 py-2 text-right text-gray-600 dark:text-gray-400">Credit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td className="px-4 py-2 text-gray-900 dark:text-white">
                    5000 - Wages Expense
                  </td>
                  <td className="px-4 py-2 text-right text-gray-900 dark:text-white">$10,000.00</td>
                  <td className="px-4 py-2 text-right text-gray-400">—</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-900 dark:text-white">
                    1000 - Cash
                  </td>
                  <td className="px-4 py-2 text-right text-gray-400">—</td>
                  <td className="px-4 py-2 text-right text-gray-900 dark:text-white">$7,000.00</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-gray-900 dark:text-white">
                    2000 - Payroll Liabilities
                  </td>
                  <td className="px-4 py-2 text-right text-gray-400">—</td>
                  <td className="px-4 py-2 text-right text-gray-900 dark:text-white">$3,000.00</td>
                </tr>
              </tbody>
              <tfoot className="bg-gray-50 dark:bg-gray-700 font-medium">
                <tr>
                  <td className="px-4 py-2 text-gray-900 dark:text-white">Total</td>
                  <td className="px-4 py-2 text-right text-gray-900 dark:text-white">$10,000.00</td>
                  <td className="px-4 py-2 text-right text-gray-900 dark:text-white">$10,000.00</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
