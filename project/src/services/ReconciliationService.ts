import { supabase } from '../lib/supabase';
import type { Tables, TablesUpdate, Enums, GLEntryRow } from '../lib/dbTypes';

export type ReconciliationStatus = Enums<'reconciliation_status'>;
export type BankLineMatchStatus = Enums<'bank_line_match_status'>;
export type AdjustmentType = 'bank_fee' | 'interest_income' | 'nsf' | 'correction' | 'other';

// Use DB types directly
export type BankReconciliation = Tables<'bank_reconciliations'>;

export interface GLEntryForReconciliation {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  reference_type: string;
  reference_id?: string;
  debit_amount: number;
  credit_amount: number;
  net_amount: number;
  reconciliation_id?: string;
  cleared_at?: string;
  cleared_by_user_id?: string;
  created_at: string;
}

// Use DB types directly
export type BankStatementLine = Tables<'bank_statement_lines'>;

// Use DB types directly
export type ReconciliationAdjustment = Tables<'reconciliation_adjustments'>;

export interface ReconciliationSummary {
  id: string;
  account_id: string;
  account_number: string;
  account_name: string;
  statement_start_date: string;
  statement_end_date: string;
  statement_ending_balance: number;
  cleared_balance: number;
  difference: number;
  status: ReconciliationStatus;
  created_by: string;
  created_by_name: string;
  created_at: string;
  completed_at?: string;
  completed_by?: string;
  completed_by_name?: string;
  cleared_entries_count: number;
  bank_lines_count: number;
  matched_lines_count: number;
  adjustments_count: number;
}

export interface AutoMatchSuggestion {
  bank_line_id: string;
  gl_entry_id: string;
  match_confidence?: number;
  bank_line_date?: string;
  amount?: number;
  bank_line_description?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export class ReconciliationService {
  /**
   * Get all reconciliations with optional filters
   */
  static async getReconciliations(filters?: {
    account_id?: string;
    status?: ReconciliationStatus;
    start_date?: string;
    end_date?: string;
  }): Promise<BankReconciliation[]> {
    let query = supabase
      .from('bank_reconciliations')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.account_id) {
      query = query.eq('account_id', filters.account_id);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.start_date) {
      query = query.gte('statement_end_date', filters.start_date);
    }
    if (filters?.end_date) {
      query = query.lte('statement_start_date', filters.end_date);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single reconciliation by ID
   */
  static async getReconciliation(id: string): Promise<BankReconciliation> {
    const { data, error } = await supabase
      .from('bank_reconciliations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Start a new reconciliation
   */
  static async startReconciliation(params: {
    account_id: string;
    statement_start_date: string;
    statement_end_date: string;
    statement_ending_balance: number;
    notes?: string;
  }): Promise<BankReconciliation> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Calculate book balance at end date
    const { data: bookBalanceData } = await supabase.rpc('get_account_balance', {
      p_account_id: params.account_id,
      p_as_of_date: params.statement_end_date,
    });

    const calculated_book_balance = bookBalanceData || 0;

    const { data, error } = await supabase
      .from('bank_reconciliations')
      .insert([{
        account_id: params.account_id,
        reconciliation_date: params.statement_end_date || new Date().toISOString().split('T')[0],
        statement_start_date: params.statement_start_date,
        statement_end_date: params.statement_end_date,
        statement_ending_balance: params.statement_ending_balance,
        calculated_book_balance,
        cleared_balance: 0,
        difference: params.statement_ending_balance - 0,
        status: 'in_progress',
        created_by: userId,
        notes: params.notes,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get unreconciled GL entries for an account
   */
  static async getUnreconciledGLEntries(
    accountId: string,
    endDate?: string
  ): Promise<GLEntryForReconciliation[]> {
    const { data, error } = await supabase.rpc('get_unreconciled_gl_entries', {
      p_account_id: accountId,
      p_end_date: endDate ?? undefined,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get GL entries for a reconciliation (both cleared and uncleared candidates)
   */
  static async getGLEntriesForReconciliation(
    reconciliationId: string
  ): Promise<GLEntryForReconciliation[]> {
    const reconciliation = await this.getReconciliation(reconciliationId);

    // Get cleared entries for this reconciliation
    const { data: clearedEntries, error: clearedError } = await supabase
      .from('gl_entries')
      .select('*')
      .eq('reconciliation_id', reconciliationId)
      .order('entry_date', { ascending: true });

    if (clearedError) throw clearedError;

    // Get unreconciled entries for this account
    const unreconciledEntries = await this.getUnreconciledGLEntries(
      reconciliation.account_id,
      reconciliation.statement_end_date ?? undefined
    );

    // Combine and format
    const allEntries = [
      ...(clearedEntries || []).map((entry: GLEntryRow) => ({
        ...entry,
        net_amount: (entry.debit_amount ?? 0) > 0 ? (entry.debit_amount ?? 0) : -(entry.credit_amount ?? 0),
      })),
      ...unreconciledEntries,
    ];

    return allEntries;
  }

  /**
   * Mark GL entries as cleared (or uncleared)
   */
  static async updateGLEntryCleared(
    entryId: string,
    reconciliationId: string | null
  ): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const updates: TablesUpdate<'gl_entries'> = {
      reconciliation_id: reconciliationId,
    };

    if (reconciliationId) {
      updates.cleared_at = new Date().toISOString();
      updates.cleared_by_user_id = userId;
    } else {
      updates.cleared_at = null;
      updates.cleared_by_user_id = null;
    }

    const { error } = await supabase
      .from('gl_entries')
      .update(updates)
      .eq('id', entryId);

    if (error) throw error;
  }

  /**
   * Bulk update GL entries cleared status
   */
  static async bulkUpdateGLEntriesCleared(
    entryIds: string[],
    reconciliationId: string | null
  ): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    const updates: TablesUpdate<'gl_entries'> = {
      reconciliation_id: reconciliationId,
    };

    if (reconciliationId) {
      updates.cleared_at = new Date().toISOString();
      updates.cleared_by_user_id = userId;
    } else {
      updates.cleared_at = null;
      updates.cleared_by_user_id = null;
    }

    const { error } = await supabase
      .from('gl_entries')
      .update(updates)
      .in('id', entryIds);

    if (error) throw error;
  }

  /**
   * Get bank statement lines for a reconciliation
   */
  static async getBankStatementLines(
    reconciliationId: string
  ): Promise<BankStatementLine[]> {
    const { data, error } = await supabase
      .from('bank_statement_lines')
      .select('*')
      .eq('reconciliation_id', reconciliationId)
      .order('transaction_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Add bank statement lines (bulk import)
   */
  static async addBankStatementLines(
    reconciliationId: string,
    lines: Array<{
      external_transaction_id?: string;
      transaction_date: string;
      description: string;
      amount: number;
      balance?: number;
    }>
  ): Promise<void> {
    const linesToInsert = lines.map((line) => ({
      reconciliation_id: reconciliationId,
      ...line,
      match_status: 'unmatched' as BankLineMatchStatus,
    }));

    const { error } = await supabase
      .from('bank_statement_lines')
      .insert(linesToInsert);

    if (error) throw error;
  }

  /**
   * Get auto-match suggestions
   */
  static async getAutoMatchSuggestions(
    reconciliationId: string
  ): Promise<AutoMatchSuggestion[]> {
    const { data, error } = await supabase.rpc('auto_match_bank_lines', {
      p_reconciliation_id: reconciliationId,
    });

    if (error) throw error;
    return data || [];
  }

  /**
   * Match a bank line to a GL entry
   */
  static async matchBankLineToGLEntry(
    bankLineId: string,
    glEntryId: string,
    isAutoMatch: boolean = false
  ): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    // Get the bank line to find reconciliation_id
    const { data: bankLine, error: fetchError } = await supabase
      .from('bank_statement_lines')
      .select('reconciliation_id')
      .eq('id', bankLineId)
      .single();

    if (fetchError) throw fetchError;

    // Update bank line
    const { error: lineError } = await supabase
      .from('bank_statement_lines')
      .update({
        matched_gl_entry_id: glEntryId,
        match_status: isAutoMatch ? 'auto_matched' : 'manually_matched',
        matched_at: new Date().toISOString(),
        matched_by: userId,
      })
      .eq('id', bankLineId);

    if (lineError) throw lineError;

    // Clear the GL entry
    await this.updateGLEntryCleared(glEntryId, bankLine.reconciliation_id);
  }

  /**
   * Unmatch a bank line
   */
  static async unmatchBankLine(bankLineId: string): Promise<void> {
    // Get the bank line to find the matched GL entry
    const { data: bankLine, error: fetchError } = await supabase
      .from('bank_statement_lines')
      .select('matched_gl_entry_id')
      .eq('id', bankLineId)
      .single();

    if (fetchError) throw fetchError;

    // Unclear the GL entry if matched
    if (bankLine.matched_gl_entry_id) {
      await this.updateGLEntryCleared(bankLine.matched_gl_entry_id, null);
    }

    // Update bank line
    const { error } = await supabase
      .from('bank_statement_lines')
      .update({
        matched_gl_entry_id: null,
        match_status: 'unmatched',
        matched_at: null,
        matched_by: null,
      })
      .eq('id', bankLineId);

    if (error) throw error;
  }

  /**
   * Create an adjustment journal entry
   */
  static async createAdjustment(params: {
    reconciliation_id: string;
    adjustment_type: AdjustmentType;
    description: string;
    amount: number;
    debit_account_id: string;
    credit_account_id: string;
    entry_date: string;
  }): Promise<ReconciliationAdjustment> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Get reconciliation info
    const reconciliation = await this.getReconciliation(params.reconciliation_id);

    // Generate entry number
    const { count: entryCount } = await supabase
      .from('gl_entries')
      .select('id', { count: 'exact', head: true });

    const entryNumber = `JE-${String(entryCount ?? 0).padStart(6, '0')}`;

    // Calculate fiscal period and year from entry date
    const entryDate = new Date(params.entry_date);
    const fiscalYear = entryDate.getFullYear();
    const fiscalPeriod = entryDate.getMonth() + 1;

    // Create GL entries (debit and credit)
    const glEntries = [
      {
        entry_number: entryNumber,
        entry_date: params.entry_date,
        account_id: params.debit_account_id,
        debit_amount: params.amount,
        credit_amount: 0,
        description: params.description,
        reference_type: 'adjustment',
        reference_id: params.reconciliation_id,
        created_by: userId,
        posted_by: userId,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod,
      },
      {
        entry_number: entryNumber,
        entry_date: params.entry_date,
        account_id: params.credit_account_id,
        debit_amount: 0,
        credit_amount: params.amount,
        description: params.description,
        reference_type: 'adjustment',
        reference_id: params.reconciliation_id,
        created_by: userId,
        posted_by: userId,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod,
      },
    ];

    const { data: createdEntries, error: glError } = await supabase
      .from('gl_entries')
      .insert(glEntries)
      .select();

    if (glError) throw glError;

    // Find the cash/bank account entry and mark it as cleared
    const cashEntry = createdEntries?.find(
      (e: GLEntryRow) => e.account_id === reconciliation.account_id
    );

    if (cashEntry) {
      await this.updateGLEntryCleared(cashEntry.id, params.reconciliation_id);
    }

    // Create adjustment record
    const { data, error } = await supabase
      .from('reconciliation_adjustments')
      .insert([{
        reconciliation_id: params.reconciliation_id,
        gl_entry_id: cashEntry?.id,
        adjustment_type: params.adjustment_type,
        description: params.description,
        amount: params.amount,
        debit_account_id: params.debit_account_id,
        credit_account_id: params.credit_account_id,
        created_by: userId,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get adjustments for a reconciliation
   */
  static async getAdjustments(
    reconciliationId: string
  ): Promise<ReconciliationAdjustment[]> {
    const { data, error } = await supabase
      .from('reconciliation_adjustments')
      .select('*')
      .eq('reconciliation_id', reconciliationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Complete a reconciliation
   */
  static async completeReconciliation(
    reconciliationId: string
  ): Promise<BankReconciliation> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    // Get reconciliation
    const reconciliation = await this.getReconciliation(reconciliationId);

    // Validate difference is within tolerance
    const tolerance = 0.01;
    const diff = reconciliation.difference ?? 0;
    if (Math.abs(diff) > tolerance) {
      throw new Error(
        `Cannot complete reconciliation: difference of $${diff.toFixed(2)} exceeds tolerance of $${tolerance.toFixed(2)}`
      );
    }

    // Update reconciliation
    const { data, error } = await supabase
      .from('bank_reconciliations')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        completed_by: userId,
      })
      .eq('id', reconciliationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Cancel a reconciliation
   * Uses transactional DB function to ensure all-or-nothing operation
   */
  static async cancelReconciliation(
    reconciliationId: string
  ): Promise<BankReconciliation> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    if (!userId) {
      throw new Error('User not authenticated');
    }

    // Call DB function that handles all steps in a single transaction:
    // 1. Validates reconciliation is in_progress
    // 2. Unmarks all cleared GL entries
    // 3. Deletes all bank statement lines
    // 4. Updates reconciliation status to cancelled
    const { data, error } = await supabase.rpc('cancel_bank_reconciliation', {
      p_reconciliation_id: reconciliationId,
      p_user_id: userId,
    });

    if (error) {
      // Provide user-friendly error messages
      if (error.message.includes('not found')) {
        throw new Error('Reconciliation not found');
      } else if (error.message.includes('Only in_progress')) {
        throw new Error('Only in-progress reconciliations can be cancelled');
      } else {
        throw new Error(`Failed to cancel reconciliation: ${error.message}`);
      }
    }

    return data;
  }

  /**
   * Rollback a completed reconciliation (Admin only)
   */
  static async rollbackReconciliation(
    reconciliationId: string
  ): Promise<BankReconciliation> {
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    // Get reconciliation
    const reconciliation = await this.getReconciliation(reconciliationId);

    if (reconciliation.status !== 'completed') {
      throw new Error('Can only rollback completed reconciliations');
    }

    // Unclear all GL entries (but don't delete them)
    const { error: unclearError } = await supabase
      .from('gl_entries')
      .update({
        reconciliation_id: null,
        cleared_at: null,
        cleared_by_user_id: null,
      })
      .eq('reconciliation_id', reconciliationId);

    if (unclearError) throw unclearError;

    // Delete bank statement lines
    const { error: linesError } = await supabase
      .from('bank_statement_lines')
      .delete()
      .eq('reconciliation_id', reconciliationId);

    if (linesError) throw linesError;

    // Note: We keep adjustment GL entries but unlink them from reconciliation
    // In a future enhancement, we could create reversing entries

    // Update reconciliation
    const { data, error } = await supabase
      .from('bank_reconciliations')
      .update({
        status: 'rolled_back',
        rolled_back_at: new Date().toISOString(),
        rolled_back_by: userId,
      })
      .eq('id', reconciliationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Get last reconciliation for an account
   */
  static async getLastReconciliation(
    accountId: string
  ): Promise<BankReconciliation | null> {
    const { data, error } = await supabase
      .from('bank_reconciliations')
      .select('*')
      .eq('account_id', accountId)
      .eq('status', 'completed')
      .order('statement_end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
}
