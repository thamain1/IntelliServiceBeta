import { useState, useEffect, useCallback } from 'react';
import { DollarSign, Clock, AlertCircle, Save, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/dbTypes';

type AccountingSetting = {
  id: string;
  setting_key: string;
  setting_value: string;
  display_name: string;
  description: string | null;
  category?: string;
  created_at?: string | null;
  display_order?: number;
  is_editable?: boolean;
  setting_type?: "number" | "string" | "time" | "date";
  updated_at?: string | null;
  updated_by?: string | null;
};

export function LaborRatesSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Record<string, AccountingSetting>>({});
  const [formData, setFormData] = useState({
    standard_labor_rate: 120.00,
    after_hours_labor_rate: 160.00,
    emergency_labor_rate: 200.00,
    standard_hours_start: '08:00:00',
    standard_hours_end: '17:00:00',
  });

  const loadLaborRates = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('accounting_settings')
        .select('*')
        .in('setting_key', [
          'standard_labor_rate',
          'after_hours_labor_rate',
          'emergency_labor_rate',
          'standard_hours_start',
          'standard_hours_end',
        ]);

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, AccountingSetting> = {};
        (data as unknown as Tables<'accounting_settings'>[]).forEach((setting) => {
          settingsMap[setting.setting_key] = setting;
        });
        setSettings(settingsMap);

        setFormData({
          standard_labor_rate: parseFloat(settingsMap.standard_labor_rate?.setting_value || '120.00'),
          after_hours_labor_rate: parseFloat(settingsMap.after_hours_labor_rate?.setting_value || '160.00'),
          emergency_labor_rate: parseFloat(settingsMap.emergency_labor_rate?.setting_value || '200.00'),
          standard_hours_start: settingsMap.standard_hours_start?.setting_value || '08:00:00',
          standard_hours_end: settingsMap.standard_hours_end?.setting_value || '17:00:00',
        });
      }
    } catch (error) {
      console.error('Error loading labor rates:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLaborRates();
  }, [loadLaborRates]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = [
        {
          id: settings.standard_labor_rate?.id,
          setting_value: formData.standard_labor_rate.toString(),
        },
        {
          id: settings.after_hours_labor_rate?.id,
          setting_value: formData.after_hours_labor_rate.toString(),
        },
        {
          id: settings.emergency_labor_rate?.id,
          setting_value: formData.emergency_labor_rate.toString(),
        },
        {
          id: settings.standard_hours_start?.id,
          setting_value: formData.standard_hours_start,
        },
        {
          id: settings.standard_hours_end?.id,
          setting_value: formData.standard_hours_end,
        },
      ];

      for (const update of updates) {
        if (update.id) {
          const { error } = await supabase
            .from('accounting_settings')
            .update({ setting_value: update.setting_value })
            .eq('id', update.id);

          if (error) throw error;
        }
      }

      await loadLaborRates();
      alert('Labor rates saved successfully!');
    } catch (error) {
      console.error('Error saving labor rates:', error);
      alert('Failed to save labor rates. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading labor rates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Global Labor Billing Rates</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Configure company-wide customer-facing hourly rates. These rates apply to all technicians based on time of day.
        </p>
      </div>

      <div className="card p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <p className="font-medium mb-1">How Labor Billing Works:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><span className="font-medium">Standard Rate:</span> Applied during business hours (Mon-Fri, configured hours below)</li>
              <li><span className="font-medium">After-Hours Rate:</span> Applied evenings/early mornings on weekdays and daytime on weekends</li>
              <li><span className="font-medium">Emergency Rate:</span> Applied late nights on weekends and holidays</li>
            </ul>
            <p className="mt-2 text-blue-800 dark:text-blue-300">
              The system automatically determines which rate to apply based on when work is performed.
            </p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing Rate Tiers</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Standard Rate ($/hr)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.standard_labor_rate}
                onChange={(e) => setFormData({ ...formData, standard_labor_rate: parseFloat(e.target.value) || 0 })}
                className="input pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Business hours rate
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              After-Hours Rate ($/hr)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.after_hours_labor_rate}
                onChange={(e) => setFormData({ ...formData, after_hours_labor_rate: parseFloat(e.target.value) || 0 })}
                className="input pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Evenings & weekend days
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Emergency Rate ($/hr)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.emergency_labor_rate}
                onChange={(e) => setFormData({ ...formData, emergency_labor_rate: parseFloat(e.target.value) || 0 })}
                className="input pl-10"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Late nights & holidays
            </p>
          </div>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-md font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Standard Business Hours
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={formData.standard_hours_start}
                onChange={(e) => setFormData({ ...formData, standard_hours_start: e.target.value })}
                className="input"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                When standard rate begins (Mon-Fri)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Time
              </label>
              <input
                type="time"
                value={formData.standard_hours_end}
                onChange={(e) => setFormData({ ...formData, standard_hours_end: e.target.value })}
                className="input"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                When standard rate ends (Mon-Fri)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-yellow-900 dark:text-yellow-200">
            <p className="font-medium mb-1">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>These rates are used for all customer invoicing and estimates</li>
              <li>Changes apply to new time entries immediately</li>
              <li>Existing time logs retain their original rates</li>
              <li>Technician internal costs are managed separately in User Management</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Save className="w-5 h-5" />
          <span>{saving ? 'Saving...' : 'Save Labor Rates'}</span>
        </button>
      </div>
    </div>
  );
}
