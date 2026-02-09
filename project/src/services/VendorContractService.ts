import { supabase } from '../lib/supabase';
import type { Tables, TablesInsert } from '../lib/dbTypes';

/** Base vendor contract row type */
type VendorContractRow = Tables<'vendor_contracts'>;

/** Vendor contract with joined vendor data from query */
type VendorContractWithVendor = VendorContractRow & {
  vendors?: { name: string; vendor_code: string } | null;
};

/** SLA row type */
type VendorContractSLA = Tables<'vendor_contract_slas'>;

export interface ContractFilters {
  vendorId?: string;
  status?: string;
  type?: string;
  search?: string;
}

export interface ContractStats {
  activeContracts: number;
  totalValue: number;
  expiringNext30Days: number;
}

export class VendorContractService {
  static async listContracts(filters: ContractFilters = {}): Promise<VendorContractWithVendor[]> {
    try {
      let query = supabase
        .from('vendor_contracts')
        .select(`
          *,
          vendors(name, vendor_code)
        `)
        .order('created_at', { ascending: false });

      if (filters.vendorId) {
        query = query.eq('vendor_id', filters.vendorId);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.type && filters.type !== 'all') {
        query = query.eq('contract_type', filters.type);
      }

      const { data, error } = await query;

      if (error) throw error;

      let results = data || [];

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        results = results.filter(contract =>
          contract.contract_number?.toLowerCase().includes(searchLower) ||
          contract.notes?.toLowerCase().includes(searchLower) ||
          contract.vendors?.name?.toLowerCase().includes(searchLower)
        );
      }

      return results;
    } catch (error) {
      console.error('Error loading contracts:', error);
      throw error;
    }
  }

  static async getContractStats(vendorId?: string): Promise<ContractStats> {
    try {
      let activeQuery = supabase
        .from('vendor_contracts')
        .select('id, contract_value')
        .eq('status', 'active');

      if (vendorId) {
        activeQuery = activeQuery.eq('vendor_id', vendorId);
      }

      const { data: activeData, error: activeError } = await activeQuery;
      if (activeError) throw activeError;

      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

      let expiringQuery = supabase
        .from('vendor_contracts')
        .select('id')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0]);

      if (vendorId) {
        expiringQuery = expiringQuery.eq('vendor_id', vendorId);
      }

      const { data: expiringData, error: expiringError } = await expiringQuery;
      if (expiringError) throw expiringError;

      const totalValue = (activeData || []).reduce((sum, contract) => sum + Number(contract.contract_value || 0), 0);

      return {
        activeContracts: activeData?.length || 0,
        totalValue,
        expiringNext30Days: expiringData?.length || 0,
      };
    } catch (error) {
      console.error('Error loading contract stats:', error);
      return {
        activeContracts: 0,
        totalValue: 0,
        expiringNext30Days: 0,
      };
    }
  }

  static async getSLAsForContract(contractId: string): Promise<VendorContractSLA[]> {
    try {
      const { data, error } = await supabase
        .from('vendor_contract_slas')
        .select('*')
        .eq('vendor_contract_id', contractId)
        .order('metric');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error loading SLAs:', error);
      return [];
    }
  }

  static async upsertSLA(sla: Partial<VendorContractSLA> & { vendor_contract_id: string; metric: string }): Promise<VendorContractSLA | null> {
    try {
      const { data: existing } = await supabase
        .from('vendor_contract_slas')
        .select('id')
        .eq('vendor_contract_id', sla.vendor_contract_id)
        .eq('metric', sla.metric)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('vendor_contract_slas')
          .update({
            ...sla,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('vendor_contract_slas')
          .insert(sla as unknown as TablesInsert<'vendor_contract_slas'>)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error upserting SLA:', error);
      throw error;
    }
  }

  static async deleteSLA(slaId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('vendor_contract_slas')
        .delete()
        .eq('id', slaId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting SLA:', error);
      throw error;
    }
  }
}
