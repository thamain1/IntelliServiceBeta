import { useEffect, useState } from 'react';
import { Bell, Mail, MessageSquare, Clock, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface UserPreferenceRow {
  id?: string;
  user_id: string;
  preferences: {
    notifications?: NotificationPreferences;
    [key: string]: unknown;
  };
}

interface NotificationPreferences {
  // Email Notifications
  email_ticket_assigned: boolean;
  email_ticket_updated: boolean;
  email_ticket_completed: boolean;
  email_invoice_created: boolean;
  email_payment_received: boolean;
  email_estimate_approved: boolean;
  email_contract_expiring: boolean;
  email_inventory_low: boolean;

  // In-App Notifications
  app_ticket_assigned: boolean;
  app_ticket_updated: boolean;
  app_schedule_change: boolean;
  app_customer_message: boolean;

  // Automation Settings
  auto_reminder_days: number;
  contract_reminder_days: number;
  invoice_reminder_days: number;

  // Quiet Hours
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_ticket_assigned: true,
  email_ticket_updated: true,
  email_ticket_completed: true,
  email_invoice_created: true,
  email_payment_received: true,
  email_estimate_approved: true,
  email_contract_expiring: true,
  email_inventory_low: true,

  app_ticket_assigned: true,
  app_ticket_updated: true,
  app_schedule_change: true,
  app_customer_message: true,

  auto_reminder_days: 3,
  contract_reminder_days: 30,
  invoice_reminder_days: 7,

  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '07:00',
};

export function NotificationsSettings() {
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      const prefData = data as unknown as UserPreferenceRow | null;
      if (prefData?.preferences?.notifications) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...prefData.preferences.notifications });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Check if preferences exist
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('id, preferences')
        .eq('user_id', userData.user.id)
        .maybeSingle();

      const existingData = existing as unknown as UserPreferenceRow | null;
      const newPreferences = {
        ...(existingData?.preferences || {}),
        notifications: preferences,
      };

      if (existingData) {
        await supabase
          .from('user_preferences')
          .update({ preferences: newPreferences })
          .eq('user_id', userData.user.id);
      } else {
        await supabase
          .from('user_preferences')
          .insert({ user_id: userData.user.id, preferences: newPreferences });
      }

      setMessage({ type: 'success', text: 'Notification preferences saved!' });
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences. Settings stored locally.' });
      // Store locally as fallback
      localStorage.setItem('notification_preferences', JSON.stringify(preferences));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleChange = (key: keyof NotificationPreferences, value: string | number) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
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
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Email Notifications */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Mail className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Notifications</h2>
        </div>

        <div className="space-y-4">
          <NotificationToggle
            label="Ticket Assigned"
            description="Receive email when a ticket is assigned to you"
            checked={preferences.email_ticket_assigned}
            onChange={() => handleToggle('email_ticket_assigned')}
          />
          <NotificationToggle
            label="Ticket Updated"
            description="Receive email when a ticket you're involved with is updated"
            checked={preferences.email_ticket_updated}
            onChange={() => handleToggle('email_ticket_updated')}
          />
          <NotificationToggle
            label="Ticket Completed"
            description="Receive email when a ticket is marked as completed"
            checked={preferences.email_ticket_completed}
            onChange={() => handleToggle('email_ticket_completed')}
          />
          <NotificationToggle
            label="Invoice Created"
            description="Receive email when a new invoice is created"
            checked={preferences.email_invoice_created}
            onChange={() => handleToggle('email_invoice_created')}
          />
          <NotificationToggle
            label="Payment Received"
            description="Receive email when a payment is recorded"
            checked={preferences.email_payment_received}
            onChange={() => handleToggle('email_payment_received')}
          />
          <NotificationToggle
            label="Estimate Approved"
            description="Receive email when a customer approves an estimate"
            checked={preferences.email_estimate_approved}
            onChange={() => handleToggle('email_estimate_approved')}
          />
          <NotificationToggle
            label="Contract Expiring"
            description="Receive email when a service contract is about to expire"
            checked={preferences.email_contract_expiring}
            onChange={() => handleToggle('email_contract_expiring')}
          />
          <NotificationToggle
            label="Low Inventory Alert"
            description="Receive email when parts fall below reorder point"
            checked={preferences.email_inventory_low}
            onChange={() => handleToggle('email_inventory_low')}
          />
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Bell className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">In-App Notifications</h2>
        </div>

        <div className="space-y-4">
          <NotificationToggle
            label="Ticket Assigned"
            description="Show notification when a ticket is assigned to you"
            checked={preferences.app_ticket_assigned}
            onChange={() => handleToggle('app_ticket_assigned')}
          />
          <NotificationToggle
            label="Ticket Updated"
            description="Show notification when tickets are updated"
            checked={preferences.app_ticket_updated}
            onChange={() => handleToggle('app_ticket_updated')}
          />
          <NotificationToggle
            label="Schedule Changes"
            description="Show notification when your schedule changes"
            checked={preferences.app_schedule_change}
            onChange={() => handleToggle('app_schedule_change')}
          />
          <NotificationToggle
            label="Customer Messages"
            description="Show notification for new customer communications"
            checked={preferences.app_customer_message}
            onChange={() => handleToggle('app_customer_message')}
          />
        </div>
      </div>

      {/* Automation Settings */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <MessageSquare className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reminder Settings</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Default Reminder (days before)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={preferences.auto_reminder_days}
              onChange={(e) => handleChange('auto_reminder_days', parseInt(e.target.value) || 3)}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">For appointment reminders</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Contract Expiry Reminder (days)
            </label>
            <input
              type="number"
              min="7"
              max="90"
              value={preferences.contract_reminder_days}
              onChange={(e) => handleChange('contract_reminder_days', parseInt(e.target.value) || 30)}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Days before contract expiration</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Invoice Due Reminder (days)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={preferences.invoice_reminder_days}
              onChange={(e) => handleChange('invoice_reminder_days', parseInt(e.target.value) || 7)}
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">Days before invoice due date</p>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Clock className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Quiet Hours</h2>
        </div>

        <div className="space-y-4">
          <NotificationToggle
            label="Enable Quiet Hours"
            description="Pause non-urgent notifications during specified hours"
            checked={preferences.quiet_hours_enabled}
            onChange={() => handleToggle('quiet_hours_enabled')}
          />

          {preferences.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4 mt-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          )}
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
              <span>Save Preferences</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
