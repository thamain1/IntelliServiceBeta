import { useState, useEffect } from 'react';
import { DollarSign, Clock, AlertCircle, Save, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type LaborRateProfile = {
  id: string;
  profile_name: string;
  standard_rate: number;
  after_hours_rate: number;
  emergency_rate: number;
  standard_hours_start: string;
  standard_hours_end: string;
  description: string;
  notes: string;
  updated_at?: string;
};

export function LaborRatesSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<LaborRateProfile | null>(null);
  const [formData, setFormData] = useState({
    standard_rate: 120.00,
    after_hours_rate: 160.00,
    emergency_rate: 200.00,
    standard_hours_start: '08:00:00',
    standard_hours_end: '17:00:00',
    notes: '',
  });

  useEffect(() => {
    loadLaborRates();
  }, []);

  const loadLaborRates = async () => {
    try {
      const { data, error } = await supabase
        .from('labor_rate_profile')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setProfile(data);
        setFormData({
          standard_rate: Number(data.standard_rate),
          after_hours_rate: Number(data.after_hours_rate),
          emergency_rate: Number(data.emergency_rate),
          standard_hours_start: data.standard_hours_start || '',
          standard_hours_end: data.standard_hours_end || '',
          notes: data.notes || '',
        });
      }
    } catch (error) {
      console.error('Error loading labor rates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (profile) {
        const { error } = await supabase
          .from('labor_rate_profile')
          .update({
            standard_rate: formData.standard_rate,
            after_hours_rate: formData.after_hours_rate,
            emergency_rate: formData.emergency_rate,
            standard_hours_start: formData.standard_hours_start,
            standard_hours_end: formData.standard_hours_end,
            notes: formData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('labor_rate_profile')
          .insert({
            profile_name: 'Global Billing Rates',
            standard_rate: formData.standard_rate,
            after_hours_rate: formData.after_hours_rate,
            emergency_rate: formData.emergency_rate,
            standard_hours_start: formData.standard_hours_start,
            standard_hours_end: formData.standard_hours_end,
            notes: formData.notes,
            description: 'Company-wide customer billing rates',
            is_active: true,
          });

        if (error) throw error;
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
                value={formData.standard_rate}
                onChange={(e) => setFormData({ ...formData, standard_rate: parseFloat(e.target.value) || 0 })}
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
                value={formData.after_hours_rate}
                onChange={(e) => setFormData({ ...formData, after_hours_rate: parseFloat(e.target.value) || 0 })}
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
                value={formData.emergency_rate}
                onChange={(e) => setFormData({ ...formData, emergency_rate: parseFloat(e.target.value) || 0 })}
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

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
            placeholder="Add any notes about your labor rate policy..."
            className="input"
          />
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

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {profile && profile.updated_at && (
            <span>
              Last updated: {new Date(profile.updated_at).toLocaleString()}
            </span>
          )}
        </div>
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
