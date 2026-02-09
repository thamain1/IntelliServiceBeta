import { supabase } from '../lib/supabase';
import type { TablesInsert, Enums } from '../lib/dbTypes';

// DB types
type WarrantyClaimInsert = TablesInsert<'warranty_claims'>;
type WarrantyStatusEnum = Enums<'warranty_status'>;

// Extended interface for UI (includes fields from joins/views)
export interface WarrantyClaim {
  id: string;
  claim_number: string;
  serialized_part_id?: string | null;
  equipment_id?: string | null;
  claim_type: 'repair' | 'replacement' | 'refund' | 'labor';
  status: WarrantyStatusEnum | 'draft' | 'submitted' | 'in_review' | 'approved' | 'denied' | 'completed' | 'cancelled';
  description: string;
  failure_description?: string | null;
  failure_date?: string | null;
  provider_name: string;
  provider_contact?: string | null;
  provider_phone?: string | null;
  provider_email?: string | null;
  provider_claim_number?: string | null;
  claim_amount?: number | null;
  approved_amount?: number | null;
  submitted_date?: string | null;
  resolution_date?: string | null;
  resolution_notes?: string | null;
  ticket_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WarrantyClaimSummary extends WarrantyClaim {
  serial_number?: string | null;
  part_name?: string | null;
  part_number?: string | null;
  equipment_type?: string | null;
  equipment_model?: string | null;
  equipment_manufacturer?: string | null;
  customer_name?: string | null;
  item_description?: string | null;
  created_by_name?: string | null;
  attachment_count?: number;
}

export interface WarrantyClaimAttachment {
  id: string;
  claim_id: string;
  file_name: string;
  file_type?: string | null;
  file_size?: number | null;
  file_url: string;
  description?: string | null;
  uploaded_by?: string | null;
  created_at: string;
}

export interface CreateClaimInput {
  serialized_part_id?: string | null;
  equipment_id?: string | null;
  claim_type: WarrantyClaim['claim_type'];
  description: string;
  failure_description?: string;
  failure_date?: string;
  provider_name: string;
  provider_contact?: string;
  provider_phone?: string;
  provider_email?: string;
  claim_amount?: number;
  ticket_id?: string;
}

export class WarrantyService {
  /**
   * Get all warranty claims with summary info
   * Note: Uses warranty_claims table with joins since vw_warranty_claims_summary may not exist
   */
  static async getClaims(filters?: {
    status?: string;
    provider?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<WarrantyClaimSummary[]> {
    // Query the base table with type assertion for flexibility
    let query = supabase
      .from('warranty_claims')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status as WarrantyStatusEnum);
    }
    if (filters?.fromDate) {
      query = query.gte('created_at', filters.fromDate);
    }
    if (filters?.toDate) {
      query = query.lte('created_at', filters.toDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[WarrantyService] Error fetching claims:', error);
      throw error;
    }

    // Map DB rows to UI interface
    return (data || []).map(row => ({
      ...row,
      description: row.issue_description,
      provider_name: '',
      claim_type: 'repair' as const,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    })) as WarrantyClaimSummary[];
  }

  /**
   * Get a single claim by ID
   */
  static async getClaimById(id: string): Promise<WarrantyClaimSummary | null> {
    const { data, error } = await supabase
      .from('warranty_claims')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    if (!data) return null;

    return {
      ...data,
      description: data.issue_description,
      provider_name: '',
      claim_type: 'repair' as const,
      created_at: data.created_at || new Date().toISOString(),
      updated_at: data.updated_at || new Date().toISOString(),
    } as WarrantyClaimSummary;
  }

  /**
   * Get claims for a specific serialized part
   */
  static async getClaimsForPart(serializedPartId: string): Promise<WarrantyClaimSummary[]> {
    const { data, error } = await supabase
      .from('warranty_claims')
      .select('*')
      .eq('serialized_part_id', serializedPartId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(row => ({
      ...row,
      description: row.issue_description,
      provider_name: '',
      claim_type: 'repair' as const,
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
    })) as WarrantyClaimSummary[];
  }

  /**
   * Get claims for a specific equipment
   */
  static async getClaimsForEquipment(_equipmentId: string): Promise<WarrantyClaimSummary[]> {
    // Note: equipment_id column may not exist - return empty for now
    console.warn('[WarrantyService] getClaimsForEquipment: equipment_id column not in schema');
    return [];
  }

  /**
   * Create a new warranty claim
   */
  static async createClaim(input: CreateClaimInput): Promise<{ success: boolean; claim?: WarrantyClaim; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser();

      // Map input to actual DB schema
      const insertData: WarrantyClaimInsert = {
        claim_number: `WC-${Date.now()}`,
        issue_description: input.description,
        serialized_part_id: input.serialized_part_id || '',
        warranty_record_id: '', // Required - would need to be provided
        status: 'active' as WarrantyStatusEnum,
        submitted_by: userData.user?.id,
        ticket_id: input.ticket_id,
      };

      const { data, error } = await supabase
        .from('warranty_claims')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      // Map back to UI interface
      const claim: WarrantyClaim = {
        id: data.id,
        claim_number: data.claim_number,
        serialized_part_id: data.serialized_part_id,
        claim_type: input.claim_type,
        status: data.status || 'active',
        description: data.issue_description,
        provider_name: input.provider_name,
        ticket_id: data.ticket_id,
        created_by: data.submitted_by,
        created_at: data.created_at || new Date().toISOString(),
        updated_at: data.updated_at || new Date().toISOString(),
      };

      return { success: true, claim };
    } catch (error: unknown) {
      console.error('[WarrantyService] Error creating claim:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Update a warranty claim
   */
  static async updateClaim(
    id: string,
    updates: Partial<WarrantyClaim>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Map UI fields to DB fields
      const dbUpdates: Record<string, unknown> = {};
      if (updates.description !== undefined) dbUpdates.issue_description = updates.description;
      if (updates.resolution_notes !== undefined) dbUpdates.resolution_notes = updates.resolution_notes;
      if (updates.status !== undefined) {
        // Map UI status to DB enum
        const statusMap: Record<string, WarrantyStatusEnum> = {
          'draft': 'active',
          'submitted': 'claim_pending',
          'in_review': 'claim_pending',
          'approved': 'claim_approved',
          'denied': 'claim_denied',
          'completed': 'claim_approved',
          'cancelled': 'void',
        };
        dbUpdates.status = statusMap[updates.status] || updates.status;
      }

      const { error } = await supabase
        .from('warranty_claims')
        .update(dbUpdates)
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      console.error('[WarrantyService] Error updating claim:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Submit a draft claim
   */
  static async submitClaim(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('warranty_claims')
        .update({
          status: 'claim_pending' as WarrantyStatusEnum,
          claim_date: new Date().toISOString().split('T')[0],
          submitted_by: userData.user?.id,
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      console.error('[WarrantyService] Error submitting claim:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Approve or deny a claim
   */
  static async reviewClaim(
    id: string,
    approved: boolean,
    _approvedAmount?: number,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('warranty_claims')
        .update({
          status: (approved ? 'claim_approved' : 'claim_denied') as WarrantyStatusEnum,
          resolution_notes: notes,
          approved_by: userData.user?.id,
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      console.error('[WarrantyService] Error reviewing claim:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Complete a claim
   */
  static async completeClaim(id: string, notes?: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('warranty_claims')
        .update({
          status: 'claim_approved' as WarrantyStatusEnum,
          resolution_notes: notes,
        })
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: unknown) {
      console.error('[WarrantyService] Error completing claim:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Get claim attachments
   * Note: warranty_claim_attachments table may not exist - returns empty array
   */
  static async getClaimAttachments(_claimId: string): Promise<WarrantyClaimAttachment[]> {
    // Table doesn't exist in current schema
    console.warn('[WarrantyService] warranty_claim_attachments table not in schema');
    return [];
  }

  /**
   * Add attachment to claim
   * Note: warranty_claim_attachments table may not exist
   */
  static async addAttachment(
    _claimId: string,
    _file: File,
    _description?: string
  ): Promise<{ success: boolean; attachment?: WarrantyClaimAttachment; error?: string }> {
    // Table doesn't exist in current schema
    console.warn('[WarrantyService] warranty_claim_attachments table not in schema');
    return { success: false, error: 'Attachments not supported in current schema' };
  }

  /**
   * Get claim statistics
   */
  static async getClaimStats(): Promise<{
    total: number;
    byStatus: Record<string, number>;
    totalClaimed: number;
    totalApproved: number;
  }> {
    const { data, error } = await supabase
      .from('warranty_claims')
      .select('status');

    if (error) throw error;

    const claims = data || [];
    const byStatus: Record<string, number> = {};

    claims.forEach((claim) => {
      const status = claim.status || 'unknown';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    return {
      total: claims.length,
      byStatus,
      totalClaimed: 0, // Column doesn't exist
      totalApproved: 0, // Column doesn't exist
    };
  }

  /**
   * Get status display info
   */
  static getStatusDisplay(status: WarrantyClaim['status']): { label: string; color: string } {
    const statusMap: Record<string, { label: string; color: string }> = {
      draft: { label: 'Draft', color: 'badge-gray' },
      submitted: { label: 'Submitted', color: 'badge-blue' },
      in_review: { label: 'In Review', color: 'badge-yellow' },
      approved: { label: 'Approved', color: 'badge-green' },
      denied: { label: 'Denied', color: 'badge-red' },
      completed: { label: 'Completed', color: 'badge-green' },
      cancelled: { label: 'Cancelled', color: 'badge-gray' },
    };
    return statusMap[status] || { label: status, color: 'badge-gray' };
  }

  /**
   * Get claim type display
   */
  static getClaimTypeDisplay(type: WarrantyClaim['claim_type']): string {
    const typeMap: Record<string, string> = {
      repair: 'Repair Service',
      replacement: 'Part Replacement',
      refund: 'Refund Request',
      labor: 'Labor Coverage',
    };
    return typeMap[type] || type;
  }

  /**
   * Common HVAC warranty providers
   */
  static getCommonProviders(): Array<{ name: string; phone?: string; website?: string }> {
    return [
      { name: 'Carrier', phone: '1-800-227-7437', website: 'carrier.com' },
      { name: 'Trane', phone: '1-888-883-3220', website: 'trane.com' },
      { name: 'Lennox', phone: '1-800-953-6669', website: 'lennox.com' },
      { name: 'Rheem', phone: '1-866-720-2076', website: 'rheem.com' },
      { name: 'Goodman', phone: '1-877-254-4729', website: 'goodmanmfg.com' },
      { name: 'Daikin', phone: '1-800-432-1342', website: 'daikincomfort.com' },
      { name: 'York', phone: '1-877-874-7378', website: 'york.com' },
      { name: 'American Standard', phone: '1-800-554-8005', website: 'americanstandardair.com' },
    ];
  }
}
