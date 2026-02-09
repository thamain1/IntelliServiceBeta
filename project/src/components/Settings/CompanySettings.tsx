import { useEffect, useState } from 'react';
import { Building, Mail, Phone, FileText, Save, Upload, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CompanySettingsData {
  company_name: string;
  company_address: string;
  company_city: string;
  company_state: string;
  company_zip: string;
  company_phone: string;
  company_email: string;
  company_website: string;
  company_logo_url: string;
  default_tax_rate: string;
  default_payment_terms: string;
  invoice_prefix: string;
  invoice_notes: string;
  email_from_name: string;
  email_signature: string;
}

const DEFAULT_SETTINGS: CompanySettingsData = {
  company_name: '',
  company_address: '',
  company_city: '',
  company_state: '',
  company_zip: '',
  company_phone: '',
  company_email: '',
  company_website: '',
  company_logo_url: '',
  default_tax_rate: '7.5',
  default_payment_terms: 'Net 30',
  invoice_prefix: 'INV',
  invoice_notes: 'Thank you for your business!',
  email_from_name: '',
  email_signature: '',
};

export function CompanySettings() {
  const [settings, setSettings] = useState<CompanySettingsData>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('accounting_settings')
        .select('setting_key, setting_value')
        .in('setting_key', Object.keys(DEFAULT_SETTINGS));

      if (error) throw error;

      const loadedSettings: CompanySettingsData = { ...DEFAULT_SETTINGS };
      data?.forEach((setting) => {
        const key = setting.setting_key as keyof CompanySettingsData;
        if (key in loadedSettings) {
          loadedSettings[key] = setting.setting_value || '';
        }
      });

      setSettings(loadedSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Upsert all settings
      for (const [key, value] of Object.entries(settings)) {
        const { data: existing } = await supabase
          .from('accounting_settings')
          .select('id')
          .eq('setting_key', key)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('accounting_settings')
            .update({ setting_value: value })
            .eq('setting_key', key);
        } else {
          await supabase
            .from('accounting_settings')
            .insert({ setting_key: key, setting_value: value });
        }
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof CompanySettingsData, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `company-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      handleChange('company_logo_url', publicUrl);
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Failed to upload logo. Please try again.' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        >
          <AlertCircle className="w-5 h-5" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Company Information */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Building className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Company Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={settings.company_name}
              onChange={(e) => handleChange('company_name', e.target.value)}
              className="input"
              placeholder="Your Company Name"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company Logo
            </label>
            <div className="flex items-center space-x-4">
              {settings.company_logo_url ? (
                <img
                  src={settings.company_logo_url}
                  alt="Company Logo"
                  className="h-16 w-auto object-contain bg-gray-100 dark:bg-gray-700 rounded-lg p-2"
                />
              ) : (
                <div className="h-16 w-32 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <Building className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <label className="btn btn-outline cursor-pointer flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Upload Logo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={settings.company_address}
              onChange={(e) => handleChange('company_address', e.target.value)}
              className="input"
              placeholder="123 Main Street"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City
            </label>
            <input
              type="text"
              value={settings.company_city}
              onChange={(e) => handleChange('company_city', e.target.value)}
              className="input"
              placeholder="City"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State
              </label>
              <input
                type="text"
                value={settings.company_state}
                onChange={(e) => handleChange('company_state', e.target.value)}
                className="input"
                placeholder="State"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ZIP Code
              </label>
              <input
                type="text"
                value={settings.company_zip}
                onChange={(e) => handleChange('company_zip', e.target.value)}
                className="input"
                placeholder="ZIP"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Phone className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contact Information</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              value={settings.company_phone}
              onChange={(e) => handleChange('company_phone', e.target.value)}
              className="input"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={settings.company_email}
              onChange={(e) => handleChange('company_email', e.target.value)}
              className="input"
              placeholder="info@company.com"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              type="url"
              value={settings.company_website}
              onChange={(e) => handleChange('company_website', e.target.value)}
              className="input"
              placeholder="https://www.yourcompany.com"
            />
          </div>
        </div>
      </div>

      {/* Invoice Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <FileText className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Invoice Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Tax Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={settings.default_tax_rate}
              onChange={(e) => handleChange('default_tax_rate', e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Payment Terms
            </label>
            <select
              value={settings.default_payment_terms}
              onChange={(e) => handleChange('default_payment_terms', e.target.value)}
              className="input"
            >
              <option value="Due on Receipt">Due on Receipt</option>
              <option value="Net 15">Net 15</option>
              <option value="Net 30">Net 30</option>
              <option value="Net 45">Net 45</option>
              <option value="Net 60">Net 60</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Invoice Number Prefix
            </label>
            <input
              type="text"
              value={settings.invoice_prefix}
              onChange={(e) => handleChange('invoice_prefix', e.target.value)}
              className="input"
              placeholder="INV"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Invoice Notes
            </label>
            <textarea
              value={settings.invoice_notes}
              onChange={(e) => handleChange('invoice_notes', e.target.value)}
              className="input"
              rows={3}
              placeholder="Notes to appear on all invoices"
            />
          </div>
        </div>
      </div>

      {/* Email Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Mail className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email From Name
            </label>
            <input
              type="text"
              value={settings.email_from_name}
              onChange={(e) => handleChange('email_from_name', e.target.value)}
              className="input"
              placeholder="Your Company Name"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Signature
            </label>
            <textarea
              value={settings.email_signature}
              onChange={(e) => handleChange('email_signature', e.target.value)}
              className="input"
              rows={4}
              placeholder="Best regards,&#10;Your Company Name&#10;Phone: (555) 123-4567"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
