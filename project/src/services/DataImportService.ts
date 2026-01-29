import { supabase } from '../lib/supabase';

export type ImportEntityType = 'customers' | 'ar' | 'vendors' | 'items' | 'history';
export type ImportBatchStatus = 'pending' | 'validating' | 'validated' | 'importing' | 'completed' | 'failed' | 'rolled_back';
export type ImportPhase = 'uploading' | 'mapping' | 'validating' | 'ready_to_commit' | 'committing' | 'completed' | 'failed' | 'cancelled' | 'rolled_back';
export type ValidationStatus = 'pending' | 'valid' | 'error';

export interface ImportBatch {
  id: string;
  batch_number: string;
  entity_type: ImportEntityType;
  file_name: string;
  file_size: number;
  file_encoding: string;
  status: ImportBatchStatus;
  phase: ImportPhase;
  mapping_config: ColumnMapping;
  created_by: string;
  started_at: string;
  completed_at?: string;
  rows_total: number;
  rows_valid: number;
  rows_error: number;
  rows_imported: number;
  validated_rows: number;
  committed_rows: number;
  last_error_at?: string;
  last_error_message?: string;
  error_summary?: string;
  is_cancel_requested: boolean;
  is_rollback_requested: boolean;
  supports_rollback: boolean;
  rolled_back_at?: string;
}

export interface RollbackResult {
  success: boolean;
  deleted_count: number;
  skipped_count: number;
  skipped_records: Array<{
    entity_type: string;
    entity_id: string;
    reason: string;
  }>;
  error?: string;
}

export interface BatchProgress {
  batch_id: string;
  batch_number: string;
  entity_type: ImportEntityType;
  file_name: string;
  phase: ImportPhase;
  status: ImportBatchStatus;
  started_at: string;
  completed_at?: string;
  rows_total: number;
  validated_rows: number;
  error_rows: number;
  committed_rows: number;
  progress_percentage: number;
  last_error_message?: string;
  last_error_at?: string;
}

export interface BatchLogEvent {
  id: string;
  import_batch_id: string;
  log_level: 'info' | 'warning' | 'error';
  message: string;
  details: any;
  created_at: string;
}

export interface ColumnMapping {
  [targetField: string]: string; // Maps target field name to source column name
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface CustomerStagingRow {
  id?: string;
  import_batch_id: string;
  row_number: number;
  raw_row_json: any;
  external_customer_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  customer_type?: string;
  notes?: string;
  validation_status: ValidationStatus;
  validation_errors: ValidationError[];
  imported_customer_id?: string;
}

export interface ARStagingRow {
  id?: string;
  import_batch_id: string;
  row_number: number;
  raw_row_json: any;
  external_customer_id?: string;
  external_invoice_number?: string;
  invoice_amount?: number;
  balance_due?: number;
  current_amount?: number;
  days_1_30?: number;
  days_31_60?: number;
  days_61_90?: number;
  days_90_plus?: number;
  issue_date?: string;
  due_date?: string;
  aging_bucket?: string;
  description?: string;
  validation_status: ValidationStatus;
  validation_errors: ValidationError[];
  imported_customer_id?: string;
  imported_invoice_id?: string;
}

export interface ImportStats {
  total: number;
  valid: number;
  errors: number;
  warnings: number;
}

export class DataImportService {
  /**
   * Parse CSV/TSV file content with support for various encodings
   */
  static parseCSV(content: string, delimiter: string = ','): any[] {
    const lines = content.trim().split('\n');
    if (lines.length === 0) return [];

    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.parseCSVLine(line, delimiter);
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      rows.push(row);
    }

    return rows;
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private static parseCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result.map(v => v.replace(/^"|"$/g, ''));
  }

  /**
   * Detect file delimiter and encoding
   */
  static detectFileFormat(content: string): { delimiter: string; encoding: string } {
    // Check for tab-separated (TSV)
    const tabCount = (content.match(/\t/g) || []).length;
    const commaCount = (content.match(/,/g) || []).length;
    const semicolonCount = (content.match(/;/g) || []).length;

    let delimiter = ',';
    if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = '\t';
    } else if (semicolonCount > commaCount) {
      delimiter = ';';
    }

    // Simple encoding detection (basic heuristic)
    const encoding = content.includes('\uFFFD') || content.charCodeAt(0) === 0xFEFF ? 'utf-16' : 'utf-8';

    return { delimiter, encoding };
  }

  /**
   * Normalize currency values from various formats
   * Handles: $1,234.56, (123.45), $0.25, etc.
   */
  static normalizeCurrency(value: string): number {
    if (!value || value === '') return 0;

    let normalized = value.toString().trim();

    // Check if value is in parentheses (negative)
    const isNegative = normalized.startsWith('(') && normalized.endsWith(')');
    if (isNegative) {
      normalized = normalized.slice(1, -1);
    }

    // Remove currency symbols and commas
    normalized = normalized.replace(/[$,\s]/g, '');

    // Parse to number
    const num = parseFloat(normalized);
    return isNegative ? -Math.abs(num) : num;
  }

  /**
   * Normalize date from various formats
   */
  static normalizeDate(value: string): string | null {
    if (!value || value === '') return null;

    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return null;
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  /**
   * Create a new import batch
   */
  static async createImportBatch(
    entityType: ImportEntityType,
    fileName: string,
    fileSize: number,
    encoding: string = 'utf-8'
  ): Promise<ImportBatch> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('import_batches')
      .insert([{
        entity_type: entityType,
        file_name: fileName,
        file_size: fileSize,
        file_encoding: encoding,
        created_by: userData.user.id,
        status: 'pending',
      }])
      .select()
      .single();

    if (error) throw error;
    return data as ImportBatch;
  }

  /**
   * Update import batch status and stats
   */
  static async updateImportBatch(
    batchId: string,
    updates: Partial<ImportBatch>
  ): Promise<void> {
    const { error } = await supabase
      .from('import_batches')
      .update(updates as any)
      .eq('id', batchId);

    if (error) throw error;
  }

  /**
   * Log an import event
   */
  static async logImportEvent(
    batchId: string,
    level: 'info' | 'warning' | 'error',
    message: string,
    details: any = {}
  ): Promise<void> {
    await supabase.from('import_logs').insert([{
      import_batch_id: batchId,
      log_level: level,
      message,
      details,
    }]);
  }

  /**
   * Auto-map columns based on similarity
   */
  static autoMapColumns(sourceHeaders: string[], targetFields: string[]): ColumnMapping {
    const mapping: ColumnMapping = {};

    // Common field mappings
    const commonMappings: { [key: string]: string[] } = {
      name: ['name', 'customer_name', 'customer name', 'customername', 'company', 'company_name'],
      email: ['email', 'e-mail', 'email_address', 'emailaddress'],
      phone: ['phone', 'phone_number', 'phonenumber', 'telephone', 'tel'],
      address: ['address', 'street', 'address1', 'street_address'],
      city: ['city', 'town'],
      state: ['state', 'province', 'region'],
      zip_code: ['zip', 'zipcode', 'zip_code', 'postal', 'postal_code', 'postalcode'],
      external_customer_id: ['customer_id', 'customerid', 'id', 'customer #', 'customer#'],
      external_invoice_number: ['invoice', 'invoice_number', 'invoice #', 'invoice#', 'invoicenumber'],
      balance_due: ['balance', 'balance_due', 'amount_due', 'outstanding', 'overall_total', 'overall total'],
      invoice_amount: ['amount', 'total', 'invoice_amount', 'total_amount'],
      current_amount: ['current', '0 - 30'],
      days_1_30: ['1-30', '1 - 30', '31-60 days'],
      days_31_60: ['31-60', '31 - 60', '31-60 days'],
      days_61_90: ['61-90', '61 - 90', '61-90 days'],
      days_90_plus: ['90+', '90 plus', 'over 90', '> 90'],
      issue_date: ['date', 'invoice_date', 'issue_date', 'created_date'],
      due_date: ['due_date', 'due date', 'duedate'],
    };

    // Auto-map based on similarity
    for (const targetField of targetFields) {
      const possibleNames = commonMappings[targetField] || [targetField];

      for (const sourceHeader of sourceHeaders) {
        const normalizedHeader = sourceHeader.toLowerCase().trim();

        if (possibleNames.some(name => normalizedHeader.includes(name.toLowerCase()))) {
          mapping[targetField] = sourceHeader;
          break;
        }
      }
    }

    return mapping;
  }

  /**
   * Validate customer staging row
   */
  static validateCustomerRow(row: CustomerStagingRow): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required field: name
    if (!row.name || row.name.trim() === '') {
      errors.push({ field: 'name', message: 'Customer name is required' });
    }

    // Validate email format if provided
    if (row.email && row.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
    }

    // Validate phone format if provided (basic check)
    if (row.phone && row.phone.trim() !== '') {
      const phoneRegex = /^[\d\s()+-]+$/;
      if (!phoneRegex.test(row.phone) || row.phone.replace(/\D/g, '').length < 10) {
        errors.push({ field: 'phone', message: 'Invalid phone number' });
      }
    }

    return errors;
  }

  /**
   * Validate AR staging row
   */
  static validateARRow(row: ARStagingRow): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required: invoice number
    if (!row.external_invoice_number || row.external_invoice_number.trim() === '') {
      errors.push({ field: 'external_invoice_number', message: 'Invoice number is required' });
    }

    // Required: balance due
    if (row.balance_due === undefined || row.balance_due === null) {
      errors.push({ field: 'balance_due', message: 'Balance due is required' });
    } else if (row.balance_due < 0) {
      errors.push({ field: 'balance_due', message: 'Balance due cannot be negative' });
    }

    // Required: customer identifier
    if (!row.external_customer_id || row.external_customer_id.trim() === '') {
      errors.push({ field: 'external_customer_id', message: 'Customer ID is required' });
    }

    // Validate dates if provided
    if (row.issue_date) {
      const issueDate = new Date(row.issue_date);
      if (isNaN(issueDate.getTime())) {
        errors.push({ field: 'issue_date', message: 'Invalid issue date' });
      }
    }

    if (row.due_date) {
      const dueDate = new Date(row.due_date);
      if (isNaN(dueDate.getTime())) {
        errors.push({ field: 'due_date', message: 'Invalid due date' });
      }
    }

    return errors;
  }

  /**
   * Validate vendor staging row
   */
  static validateVendorRow(row: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required: name
    if (!row.name || row.name.trim() === '') {
      errors.push({ field: 'name', message: 'Vendor name is required' });
    }

    // Validate email format if provided
    if (row.email && row.email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email)) {
        errors.push({ field: 'email', message: 'Invalid email format' });
      }
    }

    // Validate phone format if provided (basic check)
    if (row.phone && row.phone.trim() !== '') {
      const phoneRegex = /^[\d\s()+-]+$/;
      if (!phoneRegex.test(row.phone) || row.phone.replace(/\D/g, '').length < 10) {
        errors.push({ field: 'phone', message: 'Invalid phone number' });
      }
    }

    return errors;
  }

  /**
   * Validate item staging row
   */
  static validateItemRow(row: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required: name
    if (!row.name || row.name.trim() === '') {
      errors.push({ field: 'name', message: 'Item name is required' });
    }

    // Validate unit cost if provided
    if (row.unit_cost !== undefined && row.unit_cost !== null && row.unit_cost !== '') {
      const cost = parseFloat(row.unit_cost);
      if (isNaN(cost)) {
        errors.push({ field: 'unit_cost', message: 'Invalid unit cost format' });
      } else if (cost < 0) {
        errors.push({ field: 'unit_cost', message: 'Unit cost cannot be negative' });
      }
    }

    // Validate unit price if provided
    if (row.unit_price !== undefined && row.unit_price !== null && row.unit_price !== '') {
      const price = parseFloat(row.unit_price);
      if (isNaN(price)) {
        errors.push({ field: 'unit_price', message: 'Invalid unit price format' });
      } else if (price < 0) {
        errors.push({ field: 'unit_price', message: 'Unit price cannot be negative' });
      }
    }

    // Validate quantity if provided
    if (row.quantity_on_hand !== undefined && row.quantity_on_hand !== null && row.quantity_on_hand !== '') {
      const qty = parseInt(row.quantity_on_hand);
      if (isNaN(qty)) {
        errors.push({ field: 'quantity_on_hand', message: 'Invalid quantity format' });
      } else if (qty < 0) {
        errors.push({ field: 'quantity_on_hand', message: 'Quantity cannot be negative' });
      }
    }

    return errors;
  }

  /**
   * Validate history staging row
   */
  static validateHistoryRow(row: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // Required: record_type
    const validRecordTypes = ['invoice', 'payment', 'ticket'];
    if (!row.record_type || !validRecordTypes.includes(row.record_type.toLowerCase())) {
      errors.push({ field: 'record_type', message: 'Record type must be invoice, payment, or ticket' });
    }

    // Required: customer identifier
    if (!row.external_customer_id || row.external_customer_id.trim() === '') {
      errors.push({ field: 'external_customer_id', message: 'Customer ID is required' });
    }

    // Required: document number
    if (!row.document_number || row.document_number.trim() === '') {
      errors.push({ field: 'document_number', message: 'Document number is required' });
    }

    // Required: document date
    if (!row.document_date) {
      errors.push({ field: 'document_date', message: 'Document date is required' });
    } else {
      const date = new Date(row.document_date);
      if (isNaN(date.getTime())) {
        errors.push({ field: 'document_date', message: 'Invalid document date format' });
      }
    }

    // Validate amount if provided
    if (row.amount !== undefined && row.amount !== null && row.amount !== '') {
      const amount = parseFloat(row.amount);
      if (isNaN(amount)) {
        errors.push({ field: 'amount', message: 'Invalid amount format' });
      }
    }

    return errors;
  }

  /**
   * Check if row should be skipped (e.g., total rows, empty rows)
   */
  static shouldSkipRow(rawRow: any, entityType: ImportEntityType): boolean {
    // Skip completely empty rows
    const hasData = Object.values(rawRow).some(v => v && v.toString().trim() !== '');
    if (!hasData) return true;

    // For AR imports, skip summary/total rows
    if (entityType === 'ar') {
      const invoiceField = rawRow['Invoice'] || rawRow['Invoice #'] || rawRow['Invoice#'] || '';
      const normalizedInvoice = invoiceField.toString().toLowerCase().trim();

      // Skip rows where invoice is "Total", "payment", or other non-invoice values
      if (normalizedInvoice === 'total' || normalizedInvoice === 'payment' || normalizedInvoice === '') {
        return true;
      }
    }

    return false;
  }

  /**
   * Get all import batches
   */
  static async getImportBatches(entityType?: ImportEntityType): Promise<ImportBatch[]> {
    let query = supabase
      .from('import_batches')
      .select('*')
      .order('created_at', { ascending: false });

    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data as ImportBatch[];
  }

  /**
   * Get import batch by ID
   */
  static async getImportBatch(batchId: string): Promise<ImportBatch> {
    const { data, error } = await supabase
      .from('import_batches')
      .select('*')
      .eq('id', batchId)
      .single();

    if (error) throw error;
    return data as ImportBatch;
  }

  /**
   * Get staging rows for a batch
   */
  static async getStagingRows(batchId: string, entityType: ImportEntityType): Promise<any[]> {
    const tableNameMap: Record<string, string> = {
      customers: 'import_customers_staging',
      ar: 'import_ar_staging',
      vendors: 'import_vendors_staging',
      items: 'import_items_staging',
      history: 'import_history_staging',
    };
    const tableName = tableNameMap[entityType];
    if (!tableName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('import_batch_id', batchId)
      .order('row_number', { ascending: true });

    if (error) throw error;
    return data || [];
  }


  /**
   * Get batch progress with detailed metrics
   */
  static async getBatchProgress(batchId: string): Promise<BatchProgress> {
    const batch = await this.getImportBatch(batchId);

    const progressPercentage = batch.rows_total > 0
      ? Math.round(((batch.validated_rows + batch.committed_rows) / (batch.rows_total * 2)) * 100)
      : 0;

    return {
      batch_id: batch.id,
      batch_number: batch.batch_number,
      entity_type: batch.entity_type,
      file_name: batch.file_name,
      phase: batch.phase,
      status: batch.status,
      started_at: batch.started_at,
      completed_at: batch.completed_at,
      rows_total: batch.rows_total,
      validated_rows: batch.validated_rows,
      error_rows: batch.rows_error,
      committed_rows: batch.committed_rows,
      progress_percentage: progressPercentage,
      last_error_message: batch.last_error_message,
      last_error_at: batch.last_error_at,
    };
  }

  /**
   * Get preview of valid staging rows for a batch
   */
  static async getBatchPreviewRows(batchId: string, entityType: ImportEntityType, limit: number = 50): Promise<any[]> {
    const tableNameMap: Record<string, string> = {
      customers: 'import_customers_staging',
      ar: 'import_ar_staging',
      vendors: 'import_vendors_staging',
      items: 'import_items_staging',
      history: 'import_history_staging',
    };
    const tableName = tableNameMap[entityType];
    if (!tableName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('import_batch_id', batchId)
      .eq('validation_status', 'valid')
      .order('row_number', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get error rows for a batch
   */
  static async getBatchErrorRows(batchId: string, entityType: ImportEntityType, limit: number = 100): Promise<any[]> {
    const tableNameMap: Record<string, string> = {
      customers: 'import_customers_staging',
      ar: 'import_ar_staging',
      vendors: 'import_vendors_staging',
      items: 'import_items_staging',
      history: 'import_history_staging',
    };
    const tableName = tableNameMap[entityType];
    if (!tableName) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }

    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('import_batch_id', batchId)
      .eq('validation_status', 'error')
      .order('row_number', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get log events for a batch
   */
  static async getBatchLogs(batchId: string, limit: number = 200): Promise<BatchLogEvent[]> {
    const { data, error } = await supabase
      .from('import_logs')
      .select('*')
      .eq('import_batch_id', batchId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as BatchLogEvent[];
  }

  /**
   * Update batch progress (called during import process)
   */
  static async updateBatchProgress(
    batchId: string,
    updates: {
      phase?: ImportPhase;
      validated_rows?: number;
      committed_rows?: number;
      last_error_message?: string;
    }
  ): Promise<void> {
    const updateData: any = { ...updates };

    if (updates.last_error_message) {
      updateData.last_error_at = new Date().toISOString();
    }

    await this.updateImportBatch(batchId, updateData);
  }

  /**
   * Request cancellation of an in-progress import
   */
  static async cancelImportBatch(batchId: string): Promise<void> {
    const batch = await this.getImportBatch(batchId);

    // Can only cancel if in progress
    const cancellablePhases: ImportPhase[] = ['uploading', 'mapping', 'validating', 'ready_to_commit', 'committing'];
    if (!cancellablePhases.includes(batch.phase)) {
      throw new Error(`Cannot cancel import in phase: ${batch.phase}`);
    }

    // Set cancel flag
    await this.updateImportBatch(batchId, {
      is_cancel_requested: true,
      phase: 'cancelled',
      status: 'failed',
      completed_at: new Date().toISOString(),
    } as any);

    await this.logImportEvent(batchId, 'warning', 'Import cancelled by user');
  }

  /**
   * Check if cancel was requested (called by import worker)
   */
  static async isCancelRequested(batchId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('import_batches')
      .select('is_cancel_requested')
      .eq('id', batchId)
      .single();

    if (error) throw error;
    return data?.is_cancel_requested || false;
  }

  /**
   * Rollback a completed import by deleting created records
   */
  static async rollbackImportBatch(batchId: string): Promise<RollbackResult> {
    const batch = await this.getImportBatch(batchId);

    // Can only rollback completed imports
    if (batch.phase !== 'completed') {
      throw new Error(`Cannot rollback import in phase: ${batch.phase}`);
    }

    if (!batch.supports_rollback) {
      throw new Error(`Rollback not supported for entity type: ${batch.entity_type}`);
    }

    const result: RollbackResult = {
      success: true,
      deleted_count: 0,
      skipped_count: 0,
      skipped_records: [],
    };

    try {
      // Set rollback flag
      await this.updateImportBatch(batchId, {
        is_rollback_requested: true,
      } as any);

      await this.logImportEvent(batchId, 'info', 'Starting rollback process');

      // Rollback based on entity type
      if (batch.entity_type === 'customers') {
        const customerResult = await this.rollbackCustomers(batchId);
        result.deleted_count += customerResult.deleted_count;
        result.skipped_count += customerResult.skipped_count;
        result.skipped_records.push(...customerResult.skipped_records);
      } else if (batch.entity_type === 'ar') {
        const arResult = await this.rollbackARInvoices(batchId);
        result.deleted_count += arResult.deleted_count;
        result.skipped_count += arResult.skipped_count;
        result.skipped_records.push(...arResult.skipped_records);
      }

      // Mark as rolled back
      await this.updateImportBatch(batchId, {
        phase: 'rolled_back',
        status: 'rolled_back',
        rolled_back_at: new Date().toISOString(),
      } as any);

      await this.logImportEvent(
        batchId,
        'info',
        `Rollback completed: ${result.deleted_count} deleted, ${result.skipped_count} skipped`
      );

      return result;
    } catch (error: any) {
      result.success = false;
      result.error = error.message;

      await this.logImportEvent(batchId, 'error', 'Rollback failed: ' + error.message);

      throw error;
    }
  }

  /**
   * Rollback imported customers
   */
  private static async rollbackCustomers(batchId: string): Promise<RollbackResult> {
    const result: RollbackResult = {
      success: true,
      deleted_count: 0,
      skipped_count: 0,
      skipped_records: [],
    };

    // Get all customers from this batch
    const { data: customers, error } = await supabase
      .from('customers')
      .select('id, name')
      .eq('import_batch_id', batchId);

    if (error) throw error;

    for (const customer of customers || []) {
      // Check if customer can be safely deleted
      const { data: canDelete } = await supabase.rpc('can_rollback_customer', {
        customer_id_param: customer.id,
      });

      if (canDelete) {
        // Delete customer locations first
        await supabase
          .from('customer_locations')
          .delete()
          .eq('customer_id', customer.id)
          .eq('import_batch_id', batchId);

        // Delete customer
        const { error: deleteError } = await supabase
          .from('customers')
          .delete()
          .eq('id', customer.id);

        if (!deleteError) {
          result.deleted_count++;

          // Log the deletion
          await supabase.from('import_rollback_logs').insert({
            import_batch_id: batchId,
            entity_type: 'customer',
            entity_id: customer.id,
            action: 'deleted',
          });
        }
      } else {
        result.skipped_count++;
        result.skipped_records.push({
          entity_type: 'customer',
          entity_id: customer.id,
          reason: `Customer "${customer.name}" has dependent records (tickets, invoices, or estimates)`,
        });

        // Log the skip
        await supabase.from('import_rollback_logs').insert({
          import_batch_id: batchId,
          entity_type: 'customer',
          entity_id: customer.id,
          action: 'skipped',
          reason: 'Has dependent records',
        });
      }
    }

    return result;
  }

  /**
   * Rollback imported AR invoices
   */
  private static async rollbackARInvoices(batchId: string): Promise<RollbackResult> {
    const result: RollbackResult = {
      success: true,
      deleted_count: 0,
      skipped_count: 0,
      skipped_records: [],
    };

    // Get all invoices from this batch
    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('id, invoice_number')
      .eq('import_batch_id', batchId);

    if (error) throw error;

    for (const invoice of invoices || []) {
      // Check if invoice can be safely deleted
      const { data: canDelete } = await supabase.rpc('can_rollback_invoice', {
        invoice_id_param: invoice.id,
      });

      if (canDelete) {
        // Delete GL entries created by this import
        await supabase
          .from('gl_entries')
          .delete()
          .eq('reference_type', 'invoice')
          .eq('reference_id', invoice.id)
          .eq('import_batch_id', batchId);

        // Delete invoice line items
        await supabase
          .from('invoice_line_items')
          .delete()
          .eq('invoice_id', invoice.id);

        // Delete invoice
        const { error: deleteError } = await supabase
          .from('invoices')
          .delete()
          .eq('id', invoice.id);

        if (!deleteError) {
          result.deleted_count++;

          // Log the deletion
          await supabase.from('import_rollback_logs').insert({
            import_batch_id: batchId,
            entity_type: 'invoice',
            entity_id: invoice.id,
            action: 'deleted',
          });
        }
      } else {
        result.skipped_count++;
        result.skipped_records.push({
          entity_type: 'invoice',
          entity_id: invoice.id,
          reason: `Invoice "${invoice.invoice_number}" has payments or GL entries`,
        });

        // Log the skip
        await supabase.from('import_rollback_logs').insert({
          import_batch_id: batchId,
          entity_type: 'invoice',
          entity_id: invoice.id,
          action: 'skipped',
          reason: 'Has payments or GL entries',
        });
      }
    }

    return result;
  }

  /**
   * Delete import batch and staging data (only for cancelled/failed/rolled_back)
   */
  static async deleteImportBatch(batchId: string): Promise<void> {
    const batch = await this.getImportBatch(batchId);

    // Can only delete if not completed or already rolled back
    const deletablePhases: ImportPhase[] = ['cancelled', 'failed', 'rolled_back', 'ready_to_commit'];
    if (!deletablePhases.includes(batch.phase)) {
      throw new Error(`Cannot delete import in phase: ${batch.phase}. Must rollback completed imports first.`);
    }

    // Verify no live records remain with this batch ID
    if (batch.phase === 'rolled_back' || batch.phase === 'completed') {
      const { data: customerCount } = await supabase
        .from('customers')
        .select('id', { count: 'exact', head: true })
        .eq('import_batch_id', batchId);

      const { data: invoiceCount } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('import_batch_id', batchId);

      if ((customerCount as any)?.count > 0 || (invoiceCount as any)?.count > 0) {
        throw new Error('Cannot delete batch: live records still exist. Complete rollback first.');
      }
    }

    // Delete staging rows
    const tableName = batch.entity_type === 'customers'
      ? 'import_customers_staging'
      : batch.entity_type === 'ar'
      ? 'import_ar_staging'
      : null;

    if (tableName) {
      await supabase
        .from(tableName)
        .delete()
        .eq('import_batch_id', batchId);
    }

    // Delete logs
    await supabase
      .from('import_logs')
      .delete()
      .eq('import_batch_id', batchId);

    // Delete rollback logs
    await supabase
      .from('import_rollback_logs')
      .delete()
      .eq('import_batch_id', batchId);

    // Delete batch record
    await supabase
      .from('import_batches')
      .delete()
      .eq('id', batchId);
  }

  /**
   * Get rollback logs for a batch
   */
  static async getRollbackLogs(batchId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('import_rollback_logs')
      .select('*')
      .eq('import_batch_id', batchId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}
