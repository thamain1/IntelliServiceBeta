import { useState, useEffect } from 'react';
import { Shield, DollarSign, Save, Clock, User, History, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { AHSSettingsService, AHSDefaults, AHSSettingHistory } from '../../services/AHSSettingsService';
import { useAuth } from '../../contexts/AuthContext';

interface Customer {
  id: string;
  company_name?: string;
  name?: string;
}

export function AHSSettingsPanel() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [_defaults, _setDefaults] = useState<AHSDefaults>({
    diagnosisFee: 94.0,
    laborRate: 94.0,
    billToCustomerId: null,
  });
  const [formData, setFormData] = useState({
    diagnosisFee: '94.00',
    laborRate: '94.00',
    billToCustomerId: '',
  });
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [history, setHistory] = useState<AHSSettingHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ahsDefaults, historyData, customersData] = await Promise.all([
        AHSSettingsService.getAHSDefaults(),
        AHSSettingsService.getAHSSettingsHistory(),
        loadCustomers(),
      ]);

      _setDefaults(ahsDefaults);
      setFormData({
        diagnosisFee: ahsDefaults.diagnosisFee.toFixed(2),
        laborRate: ahsDefaults.laborRate.toFixed(2),
        billToCustomerId: ahsDefaults.billToCustomerId || '',
      });
      setHistory(historyData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error loading AHS settings:', error);
      setErrors(['Failed to load AHS settings']);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async (): Promise<Customer[]> => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading customers:', error);
      return [];
    }
  };

  const handleSave = async () => {
    if (!user?.id) return;

    // Validate
    const validationErrors = AHSSettingsService.validateSettings({
      diagnosisFee: parseFloat(formData.diagnosisFee),
      laborRate: parseFloat(formData.laborRate),
    });

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setSaving(true);
    setSuccessMessage('');

    try {
      // Update each setting
      const updates = [
        { key: 'ahs_default_diagnosis_fee', value: formData.diagnosisFee },
        { key: 'ahs_default_labor_rate', value: formData.laborRate },
        { key: 'ahs_bill_to_customer_id', value: formData.billToCustomerId },
      ];

      for (const update of updates) {
        await AHSSettingsService.updateAHSSetting(update.key, update.value, user.id);
      }

      setSuccessMessage('AHS settings saved successfully');
      await loadData();
    } catch (error) {
      console.error('Error saving AHS settings:', error);
      setErrors(['Failed to save settings. Please try again.']);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading AHS settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Shield className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">AHS Warranty Settings</h2>
        </div>
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <History className="h-4 w-4 mr-1" />
          {showHistory ? 'Hide History' : 'View History'}
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-center">
          <div className="h-5 w-5 text-green-600 mr-2">&#10003;</div>
          <span className="text-green-800">{successMessage}</span>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-center mb-2">
            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
            <span className="font-medium text-red-800">Please fix the following errors:</span>
          </div>
          <ul className="list-disc list-inside text-red-700 text-sm">
            {errors.map((error, i) => (
              <li key={i}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Diagnosis Fee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Default Diagnosis Fee
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.diagnosisFee}
                onChange={(e) => setFormData({ ...formData, diagnosisFee: e.target.value })}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Default fee charged for AHS diagnosis visits
            </p>
          </div>

          {/* Labor Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Clock className="h-4 w-4 inline mr-1" />
              Default Labor Rate/Hour
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.laborRate}
                onChange={(e) => setFormData({ ...formData, laborRate: e.target.value })}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Default hourly rate for AHS warranty labor
            </p>
          </div>

          {/* Bill-To Customer */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="h-4 w-4 inline mr-1" />
              AHS Bill-To Customer
            </label>
            <select
              value={formData.billToCustomerId}
              onChange={(e) => setFormData({ ...formData, billToCustomerId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select AHS Customer Account --</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.company_name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Customer account used for AHS warranty invoices. Create a customer named "American Home
              Shield" or similar.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Settings
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">How AHS Warranty Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>1. Create a ticket with type "Warranty - AHS" and enter the AHS dispatch number</li>
          <li>2. Complete diagnosis and add the diagnosis fee</li>
          <li>3. Submit to AHS portal and await authorization</li>
          <li>4. Record the authorization with the covered amount</li>
          <li>5. Create split estimates with AHS and Customer payer tags</li>
          <li>6. Generate separate invoices for AHS and Customer portions</li>
        </ul>
      </div>

      {/* History Section */}
      {showHistory && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Settings History</h3>
          {history.length === 0 ? (
            <p className="text-gray-500 text-sm">No changes recorded yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Setting
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Old Value
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      New Value
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Changed By
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {history.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-4 py-2 text-sm text-gray-900">
                        {AHSSettingsService.getSettingDisplayName(entry.settingKey)}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{entry.oldValue || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{entry.newValue}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{entry.changedBy}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {formatDate(entry.changedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
