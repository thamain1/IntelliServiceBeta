import { supabase } from '../lib/supabase';
import { Tables } from '../lib/dbTypes';

// Composite type for AHS audit log with joined profile data
type AHSAuditLogWithPerformer = Tables<'ahs_audit_log'> & {
  performer: { full_name: string | null } | null;
};

// Type for the JSON values stored in old_value/new_value columns
interface AHSSettingValue {
  key: string;
  value: string | null;
}

export interface AHSDefaults {
  diagnosisFee: number;
  laborRate: number;
  billToCustomerId: string | null;
}

export interface AHSSettingHistory {
  id: string;
  settingKey: string;
  oldValue: string | null;
  newValue: string;
  changedBy: string;
  changedAt: string;
}

export class AHSSettingsService {
  /**
   * Get all AHS default settings
   */
  static async getAHSDefaults(): Promise<AHSDefaults> {
    try {
      const { data, error } = await supabase
        .from('accounting_settings')
        .select('setting_key, setting_value')
        .in('setting_key', [
          'ahs_default_diagnosis_fee',
          'ahs_default_labor_rate',
          'ahs_bill_to_customer_id',
        ]);

      if (error) {
        console.error('Error fetching AHS defaults:', error);
        throw new Error(`Failed to fetch AHS settings: ${error.message}`);
      }

      const defaults: AHSDefaults = {
        diagnosisFee: 94.0,
        laborRate: 94.0,
        billToCustomerId: null,
      };

      data?.forEach((setting) => {
        const value = setting.setting_value;
        switch (setting.setting_key) {
          case 'ahs_default_diagnosis_fee':
            defaults.diagnosisFee = parseFloat(value) || 94.0;
            break;
          case 'ahs_default_labor_rate':
            defaults.laborRate = parseFloat(value) || 94.0;
            break;
          case 'ahs_bill_to_customer_id':
            defaults.billToCustomerId = value && value.trim() !== '' ? value : null;
            break;
        }
      });

      return defaults;
    } catch (error) {
      console.error('Error in getAHSDefaults:', error);
      throw error;
    }
  }

  /**
   * Update a single AHS setting
   */
  static async updateAHSSetting(
    key: string,
    value: string,
    userId: string
  ): Promise<void> {
    try {
      // Get current value for audit log
      const { data: currentSetting } = await supabase
        .from('accounting_settings')
        .select('setting_value')
        .eq('setting_key', key)
        .maybeSingle();

      const oldValue = currentSetting?.setting_value || null;

      // Update the setting
      const { error: updateError } = await supabase
        .from('accounting_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        })
        .eq('setting_key', key);

      if (updateError) {
        console.error('Error updating AHS setting:', updateError);
        throw new Error(`Failed to update setting: ${updateError.message}`);
      }

      // Log to AHS audit log
      await supabase.from('ahs_audit_log').insert({
        entity_type: 'settings',
        action: 'setting_updated',
        old_value: { key, value: oldValue },
        new_value: { key, value },
        performed_by: userId,
      });
    } catch (error) {
      console.error('Error in updateAHSSetting:', error);
      throw error;
    }
  }

  /**
   * Get AHS settings change history
   */
  static async getAHSSettingsHistory(): Promise<AHSSettingHistory[]> {
    try {
      const { data, error } = await supabase
        .from('ahs_audit_log')
        .select(`
          id,
          old_value,
          new_value,
          performed_by,
          performed_at,
          performer:profiles!ahs_audit_log_performed_by_fkey(full_name)
        `)
        .eq('entity_type', 'settings')
        .eq('action', 'setting_updated')
        .order('performed_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching AHS settings history:', error);
        return [];
      }

      return ((data || []) as unknown as AHSAuditLogWithPerformer[]).map((entry) => {
        const newValue = entry.new_value as unknown as AHSSettingValue | null;
        const oldValue = entry.old_value as unknown as AHSSettingValue | null;
        return {
          id: entry.id,
          settingKey: newValue?.key || '',
          oldValue: oldValue?.value || null,
          newValue: newValue?.value || '',
          changedBy: entry.performer?.full_name || 'Unknown',
          changedAt: entry.performed_at || new Date().toISOString(),
        };
      });
    } catch (error) {
      console.error('Error in getAHSSettingsHistory:', error);
      return [];
    }
  }

  /**
   * Get display name for a setting key
   */
  static getSettingDisplayName(key: string): string {
    switch (key) {
      case 'ahs_default_diagnosis_fee':
        return 'Default Diagnosis Fee';
      case 'ahs_default_labor_rate':
        return 'Default Labor Rate/Hour';
      case 'ahs_bill_to_customer_id':
        return 'AHS Bill-To Customer';
      default:
        return key;
    }
  }

  /**
   * Validate AHS settings
   */
  static validateSettings(defaults: Partial<AHSDefaults>): string[] {
    const errors: string[] = [];

    if (defaults.diagnosisFee !== undefined) {
      if (defaults.diagnosisFee < 0) {
        errors.push('Diagnosis fee cannot be negative');
      }
      if (defaults.diagnosisFee > 10000) {
        errors.push('Diagnosis fee seems unusually high');
      }
    }

    if (defaults.laborRate !== undefined) {
      if (defaults.laborRate < 0) {
        errors.push('Labor rate cannot be negative');
      }
      if (defaults.laborRate > 1000) {
        errors.push('Labor rate seems unusually high');
      }
    }

    return errors;
  }
}
