import { useState } from 'react';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { ImportEntityType, DataImportService, ImportBatch } from '../../services/DataImportService';
import { supabase } from '../../lib/supabase';
import { TablesInsert, TablesUpdate } from '../../lib/dbTypes';

/** Type for staging row data from Supabase queries */
interface StagingRow extends Record<string, unknown> {
  id: string;
  row_number: number;
  raw_row_json: Record<string, unknown>;
  external_customer_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  validation_status?: string;
  external_invoice_number?: string;
  invoice_amount?: number;
  balance_due?: number;
  issue_date?: string;
  due_date?: string;
  vendor_code?: string;
  external_vendor_id?: string;
  postal_code?: string;
  payment_terms?: string;
  tax_id?: string;
  sku?: string;
  description?: string;
  category?: string;
  unit_cost?: string | number;
  unit_price?: string | number;
  reorder_point?: string | number;
  external_item_id?: string;
  record_type?: string;
  document_number?: string;
  document_date?: string;
  amount?: string | number;
  status?: string;
  priority?: string;
  ticket_type?: string;
  completed_date?: string;
}

interface StepImportProps {
  entityType: ImportEntityType;
  importBatch: ImportBatch;
  onComplete: () => void;
  onBack: () => void;
}

interface ImportProgress {
  current: number;
  total: number;
  status: 'processing' | 'completed' | 'failed';
  message: string;
}

interface ImportSummary {
  created: number;
  updated: number;
  skipped: number;
  errors: number;
}

export function StepImport({
  entityType,
  importBatch,
  onComplete,
  onBack,
}: StepImportProps) {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress>({ current: 0, total: 0, status: 'processing', message: 'Initializing...' });
  const [summary, setSummary] = useState<ImportSummary>({ created: 0, updated: 0, skipped: 0, errors: 0 });
  const [completed, setCompleted] = useState(false);

  const startImport = async () => {
    setImporting(true);
    setProgress({ current: 0, total: 0, status: 'processing', message: 'Starting import...' });

    try {
      await DataImportService.updateImportBatch(importBatch.id, {
        status: 'importing',
      } as unknown as Partial<ImportBatch>);

      if (entityType === 'customers') {
        await importCustomers();
      } else if (entityType === 'ar') {
        await importAR();
      } else if (entityType === 'vendors') {
        await importVendors();
      } else if (entityType === 'items') {
        await importItems();
      } else if (entityType === 'history') {
        await importHistory();
      }

      await DataImportService.updateImportBatch(importBatch.id, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        rows_imported: summary.created + summary.updated,
      } as unknown as Partial<ImportBatch>);

      await DataImportService.logImportEvent(
        importBatch.id,
        'info',
        `Import completed: ${summary.created} created, ${summary.updated} updated, ${summary.errors} errors`
      );

      setProgress({ ...progress, status: 'completed', message: 'Import completed successfully!' });
      setCompleted(true);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Import error:', error);

      await DataImportService.updateImportBatch(importBatch.id, {
        status: 'failed',
        error_summary: errorMessage,
        completed_at: new Date().toISOString(),
      } as unknown as Partial<ImportBatch>);

      await DataImportService.logImportEvent(
        importBatch.id,
        'error',
        'Import failed: ' + errorMessage
      );

      setProgress({ ...progress, status: 'failed', message: 'Import failed: ' + errorMessage });
    } finally {
      setImporting(false);
    }
  };

  const importCustomers = async () => {
    const { data: stagingRows, error } = await supabase
      .from('import_customers_staging')
      .select('*')
      .eq('import_batch_id', importBatch.id)
      .eq('validation_status', 'valid')
      .order('row_number', { ascending: true });

    if (error) throw error;

    setProgress({ current: 0, total: stagingRows?.length || 0, status: 'processing', message: 'Importing customers...' });

    // Update batch to committing phase
    await DataImportService.updateBatchProgress(importBatch.id, {
      phase: 'committing',
    });

    let created = 0;
    let updated = 0;
    const _skipped = 0;
    let errors = 0;

    for (let i = 0; i < (stagingRows || []).length; i++) {
      // Check if cancel was requested every 10 rows
      if (i % 10 === 0) {
        const cancelRequested = await DataImportService.isCancelRequested(importBatch.id);
        if (cancelRequested) {
          await DataImportService.logImportEvent(
            importBatch.id,
            'warning',
            `Import cancelled at row ${i + 1} of ${stagingRows!.length}`
          );
          throw new Error('Import cancelled by user');
        }
      }

      const row = stagingRows![i] as StagingRow;

      try {
        // Check for existing customer
        let existingCustomer = null;

        if (row.external_customer_id) {
          const { data } = await supabase
            .from('customers')
            .select('id')
            .eq('external_customer_id', row.external_customer_id)
            .maybeSingle();
          existingCustomer = data;
        }

        if (existingCustomer) {
          // Update existing customer
          await supabase
            .from('customers')
            .update({
              name: row.name ?? undefined,
              email: row.email ?? undefined,
              phone: row.phone ?? undefined,
              address: row.address ?? undefined,
              city: row.city ?? undefined,
              state: row.state ?? undefined,
              zip_code: row.zip_code ?? undefined,
              notes: row.notes ?? undefined,
            })
            .eq('id', existingCustomer.id);

          await supabase
            .from('import_customers_staging')
            .update({
              imported_customer_id: existingCustomer.id,
              imported_at: new Date().toISOString(),
            })
            .eq('id', row.id);

          updated++;
        } else {
          // Create new customer
          const { data: newCustomer, error: insertError } = await supabase
            .from('customers')
            .insert([{
              name: row.name ?? 'Imported Customer',
              email: row.email ?? undefined,
              phone: row.phone ?? undefined,
              address: row.address ?? undefined,
              city: row.city ?? undefined,
              state: row.state ?? undefined,
              zip_code: row.zip_code ?? undefined,
              notes: row.notes ?? undefined,
              external_customer_id: row.external_customer_id,
              import_batch_id: importBatch.id,
              imported_at: new Date().toISOString(),
            } as unknown as TablesInsert<'customers'>])
            .select()
            .single();

          if (insertError) throw insertError;

          await supabase
            .from('import_customers_staging')
            .update({
              imported_customer_id: newCustomer.id,
              imported_at: new Date().toISOString(),
            })
            .eq('id', row.id);

          created++;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error importing customer row ${row.row_number}:`, error);
        errors++;

        await DataImportService.logImportEvent(
          importBatch.id,
          'error',
          `Failed to import customer at row ${row.row_number}`,
          { error: errorMessage, row: row.raw_row_json }
        );
      }

      setProgress({
        current: i + 1,
        total: stagingRows!.length,
        status: 'processing',
        message: `Importing customers... ${i + 1} of ${stagingRows!.length}`,
      });

      // Update batch progress every 20 rows or on last row
      if ((i + 1) % 20 === 0 || i === stagingRows!.length - 1) {
        await DataImportService.updateBatchProgress(importBatch.id, {
          committed_rows: created + updated,
        });
      }
    }

    setSummary({ created, updated, skipped: _skipped, errors });
  };

  const importAR = async () => {
    const { data: stagingRows, error } = await supabase
      .from('import_ar_staging')
      .select('*')
      .eq('import_batch_id', importBatch.id)
      .eq('validation_status', 'valid')
      .order('row_number', { ascending: true });

    if (error) throw error;

    setProgress({ current: 0, total: stagingRows?.length || 0, status: 'processing', message: 'Importing AR invoices...' });

    // Update batch to committing phase
    await DataImportService.updateBatchProgress(importBatch.id, {
      phase: 'committing',
    });

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < (stagingRows || []).length; i++) {
      // Check if cancel was requested every 10 rows
      if (i % 10 === 0) {
        const cancelRequested = await DataImportService.isCancelRequested(importBatch.id);
        if (cancelRequested) {
          await DataImportService.logImportEvent(
            importBatch.id,
            'warning',
            `Import cancelled at row ${i + 1} of ${stagingRows!.length}`
          );
          throw new Error('Import cancelled by user');
        }
      }

      const row = stagingRows![i] as StagingRow;

      try {
        // Find customer by external_customer_id
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('external_customer_id', row.external_customer_id ?? '')
          .maybeSingle();

        if (!customer) {
          throw new Error(`Customer not found with ID: ${row.external_customer_id}`);
        }

        // Check if invoice already exists
        const { data: existingInvoice } = await supabase
          .from('invoices')
          .select('id')
          .eq('external_invoice_number', row.external_invoice_number ?? '')
          .eq('customer_id', customer.id)
          .maybeSingle();

        if (existingInvoice) {
          skipped++;
          continue;
        }

        // Get current user for created_by
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData.user?.id;

        // Create invoice
        const { data: newInvoice, error: insertError } = await supabase
          .from('invoices')
          .insert([{
            customer_id: customer.id,
            invoice_number: row.external_invoice_number ?? `INV-${Date.now()}`,
            external_invoice_number: row.external_invoice_number,
            issue_date: row.issue_date ?? new Date().toISOString().split('T')[0],
            due_date: row.due_date ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            subtotal: (row.invoice_amount ?? row.balance_due) ?? 0,
            tax_amount: 0,
            total_amount: (row.invoice_amount ?? row.balance_due) ?? 0,
            balance_due: row.balance_due ?? 0,
            status: (row.balance_due ?? 0) > 0 ? 'sent' : 'paid',
            is_migrated_opening_balance: true,
            is_historical: false,
            import_batch_id: importBatch.id,
            imported_at: new Date().toISOString(),
            created_by: userId,
          } as unknown as TablesInsert<'invoices'>])
          .select()
          .single();

        if (insertError) throw insertError;

        await supabase
          .from('import_ar_staging')
          .update({
            imported_customer_id: customer.id,
            imported_invoice_id: newInvoice.id,
            imported_at: new Date().toISOString(),
          })
          .eq('id', row.id);

        created++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error importing AR row ${row.row_number}:`, error);
        errors++;

        await DataImportService.logImportEvent(
          importBatch.id,
          'error',
          `Failed to import AR at row ${row.row_number}`,
          { error: errorMessage, row: row.raw_row_json }
        );
      }

      setProgress({
        current: i + 1,
        total: stagingRows!.length,
        status: 'processing',
        message: `Importing invoices... ${i + 1} of ${stagingRows!.length}`,
      });

      // Update batch progress every 20 rows or on last row
      if ((i + 1) % 20 === 0 || i === stagingRows!.length - 1) {
        await DataImportService.updateBatchProgress(importBatch.id, {
          committed_rows: created,
        });
      }
    }

    setSummary({ created, updated: 0, skipped, errors });
  };

  const importVendors = async () => {
    const { data: stagingRows, error } = await supabase
      .from('import_vendors_staging')
      .select('*')
      .eq('import_batch_id', importBatch.id)
      .eq('validation_status', 'valid')
      .order('row_number', { ascending: true });

    if (error) throw error;

    setProgress({ current: 0, total: stagingRows?.length || 0, status: 'processing', message: 'Importing vendors...' });

    await DataImportService.updateBatchProgress(importBatch.id, {
      phase: 'committing',
    });

    let created = 0;
    let updated = 0;
    const _skipped = 0;
    let errors = 0;

    for (let i = 0; i < (stagingRows || []).length; i++) {
      if (i % 10 === 0) {
        const cancelRequested = await DataImportService.isCancelRequested(importBatch.id);
        if (cancelRequested) {
          throw new Error('Import cancelled by user');
        }
      }

      const row = stagingRows![i] as StagingRow;

      try {
        // Check for existing vendor by vendor_code or external_vendor_id
        let existingVendor = null;

        if (row.vendor_code) {
          const { data } = await supabase
            .from('vendors')
            .select('id')
            .eq('vendor_code', row.vendor_code)
            .maybeSingle();
          existingVendor = data;
        }

        if (!existingVendor && row.external_vendor_id) {
          const { data } = await supabase
            .from('vendors')
            .select('id')
            .eq('external_vendor_id', row.external_vendor_id)
            .maybeSingle();
          existingVendor = data;
        }

        if (existingVendor) {
          await supabase
            .from('vendors')
            .update({
              name: row.name ?? undefined,
              email: row.email ?? undefined,
              phone: row.phone ?? undefined,
              address: row.address ?? undefined,
              city: row.city ?? undefined,
              state: row.state ?? undefined,
              postal_code: row.postal_code ?? undefined,
              payment_terms: row.payment_terms ?? undefined,
              tax_id: row.tax_id ?? undefined,
              notes: row.notes ?? undefined,
            })
            .eq('id', existingVendor.id);

          await supabase
            .from('import_vendors_staging')
            .update({ imported_vendor_id: existingVendor.id })
            .eq('id', row.id);

          updated++;
        } else {
          const { data: newVendor, error: insertError } = await supabase
            .from('vendors')
            .insert([{
              name: row.name,
              vendor_code: row.vendor_code ?? null,
              email: row.email ?? undefined,
              phone: row.phone ?? undefined,
              address: row.address ?? undefined,
              city: row.city ?? undefined,
              state: row.state ?? undefined,
              postal_code: row.postal_code ?? undefined,
              payment_terms: row.payment_terms ?? undefined,
              tax_id: row.tax_id ?? undefined,
              notes: row.notes ?? undefined,
              external_vendor_id: row.external_vendor_id,
              import_batch_id: importBatch.id,
            } as unknown as TablesInsert<'vendors'>])
            .select()
            .single();

          if (insertError) throw insertError;

          await supabase
            .from('import_vendors_staging')
            .update({ imported_vendor_id: newVendor.id })
            .eq('id', row.id);

          created++;
        }
      } catch (error: unknown) {
        console.error(`Error importing vendor row ${row.row_number}:`, error);
        errors++;
      }

      setProgress({
        current: i + 1,
        total: stagingRows!.length,
        status: 'processing',
        message: `Importing vendors... ${i + 1} of ${stagingRows!.length}`,
      });

      if ((i + 1) % 20 === 0 || i === stagingRows!.length - 1) {
        await DataImportService.updateBatchProgress(importBatch.id, {
          committed_rows: created + updated,
        });
      }
    }

    setSummary({ created, updated, skipped: _skipped, errors });
  };

  const importItems = async () => {
    const { data: stagingRows, error } = await supabase
      .from('import_items_staging')
      .select('*')
      .eq('import_batch_id', importBatch.id)
      .eq('validation_status', 'valid')
      .order('row_number', { ascending: true });

    if (error) throw error;

    setProgress({ current: 0, total: stagingRows?.length || 0, status: 'processing', message: 'Importing items...' });

    await DataImportService.updateBatchProgress(importBatch.id, {
      phase: 'committing',
    });

    let created = 0;
    let updated = 0;
    const _skipped = 0;
    let errors = 0;

    for (let i = 0; i < (stagingRows || []).length; i++) {
      if (i % 10 === 0) {
        const cancelRequested = await DataImportService.isCancelRequested(importBatch.id);
        if (cancelRequested) {
          throw new Error('Import cancelled by user');
        }
      }

      const row = stagingRows![i] as StagingRow;

      try {
        // Check for existing part by SKU
        let existingPart = null;

        if (row.sku) {
          const { data } = await supabase
            .from('parts')
            .select('id')
            .eq('sku', row.sku)
            .maybeSingle();
          existingPart = data;
        }

        if (existingPart) {
          await supabase
            .from('parts')
            .update({
              name: row.name ?? undefined,
              description: row.description ?? undefined,
              category: row.category ?? undefined,
              unit_cost: row.unit_cost ? parseFloat(String(row.unit_cost)) : undefined,
              unit_price: row.unit_price ? parseFloat(String(row.unit_price)) : undefined,
              reorder_point: row.reorder_point ? parseInt(String(row.reorder_point)) : undefined,
            } as unknown as TablesUpdate<'parts'>)
            .eq('id', existingPart.id);

          await supabase
            .from('import_items_staging')
            .update({ imported_part_id: existingPart.id })
            .eq('id', row.id);

          updated++;
        } else {
          const { data: newPart, error: insertError } = await supabase
            .from('parts')
            .insert([{
              name: row.name,
              sku: row.sku ?? null,
              description: row.description ?? undefined,
              category: row.category ?? undefined,
              unit_cost: row.unit_cost ? parseFloat(String(row.unit_cost)) : undefined,
              unit_price: row.unit_price ? parseFloat(String(row.unit_price)) : undefined,
              reorder_point: row.reorder_point ? parseInt(String(row.reorder_point)) : undefined,
              external_item_id: row.external_item_id,
              import_batch_id: importBatch.id,
            } as unknown as TablesInsert<'parts'>])
            .select()
            .single();

          if (insertError) throw insertError;

          await supabase
            .from('import_items_staging')
            .update({ imported_part_id: newPart.id })
            .eq('id', row.id);

          created++;
        }
      } catch (error: unknown) {
        console.error(`Error importing item row ${row.row_number}:`, error);
        errors++;
      }

      setProgress({
        current: i + 1,
        total: stagingRows!.length,
        status: 'processing',
        message: `Importing items... ${i + 1} of ${stagingRows!.length}`,
      });

      if ((i + 1) % 20 === 0 || i === stagingRows!.length - 1) {
        await DataImportService.updateBatchProgress(importBatch.id, {
          committed_rows: created + updated,
        });
      }
    }

    setSummary({ created, updated, skipped: _skipped, errors });
  };

  const importHistory = async () => {
    const { data: stagingRows, error } = await supabase
      .from('import_history_staging')
      .select('*')
      .eq('import_batch_id', importBatch.id)
      .eq('validation_status', 'valid')
      .order('row_number', { ascending: true });

    if (error) throw error;

    setProgress({ current: 0, total: stagingRows?.length || 0, status: 'processing', message: 'Importing historical data...' });

    await DataImportService.updateBatchProgress(importBatch.id, {
      phase: 'committing',
    });

    let created = 0;
    let _skipped = 0;
    let errors = 0;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData.user?.id;

    for (let i = 0; i < (stagingRows || []).length; i++) {
      if (i % 10 === 0) {
        const cancelRequested = await DataImportService.isCancelRequested(importBatch.id);
        if (cancelRequested) {
          throw new Error('Import cancelled by user');
        }
      }

      const row = stagingRows![i] as StagingRow;

      try {
        // Find customer
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('external_customer_id', row.external_customer_id ?? '')
          .maybeSingle();

        if (!customer) {
          throw new Error(`Customer not found: ${row.external_customer_id}`);
        }

        const recordType = (row.record_type ?? '').toLowerCase();

        if (recordType === 'invoice') {
          const { data: newInvoice, error: insertError } = await supabase
            .from('invoices')
            .insert([{
              customer_id: customer.id,
              invoice_number: row.document_number ?? `INV-${Date.now()}`,
              external_invoice_number: row.document_number,
              invoice_date: row.document_date ?? new Date().toISOString().split('T')[0],
              due_date: (row.due_date ?? row.document_date) ?? new Date().toISOString().split('T')[0],
              subtotal: row.amount ? parseFloat(String(row.amount)) : undefined,
              total_amount: row.amount ? parseFloat(String(row.amount)) : undefined,
              balance_due: 0,
              status: row.status ?? 'paid',
              is_historical: true,
              import_batch_id: importBatch.id,
              created_by: userId,
            } as unknown as TablesInsert<'invoices'>])
            .select()
            .single();

          if (insertError) throw insertError;

          await supabase
            .from('import_history_staging')
            .update({
              matched_customer_id: customer.id,
              imported_invoice_id: newInvoice.id,
            })
            .eq('id', row.id);

          created++;
        } else if (recordType === 'ticket') {
          const { data: newTicket, error: insertError } = await supabase
            .from('tickets')
            .insert([{
              customer_id: customer.id,
              title: row.description ?? 'Historical Service',
              description: row.description ?? undefined,
              status: row.status ?? 'completed',
              priority: row.priority ?? 'medium',
              ticket_type: row.ticket_type ?? 'service',
              created_at: row.document_date ?? new Date().toISOString(),
              completed_date: row.completed_date ?? row.document_date,
              is_historical: true,
              import_batch_id: importBatch.id,
            } as unknown as TablesInsert<'tickets'>])
            .select()
            .single();

          if (insertError) throw insertError;

          await supabase
            .from('import_history_staging')
            .update({
              matched_customer_id: customer.id,
              imported_ticket_id: newTicket.id,
            })
            .eq('id', row.id);

          created++;
        } else if (recordType === 'payment') {
          // Payments need to be linked to invoices - skip if no matching invoice
          _skipped++;
        }
      } catch (error: unknown) {
        console.error(`Error importing history row ${row.row_number}:`, error);
        errors++;
      }

      setProgress({
        current: i + 1,
        total: stagingRows!.length,
        status: 'processing',
        message: `Importing historical data... ${i + 1} of ${stagingRows!.length}`,
      });

      if ((i + 1) % 20 === 0 || i === stagingRows!.length - 1) {
        await DataImportService.updateBatchProgress(importBatch.id, {
          committed_rows: created,
        });
      }
    }

    setSummary({ created, updated: 0, skipped: _skipped, errors });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          {completed ? 'Import Complete' : 'Importing Data'}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {completed
            ? 'Your data has been successfully imported'
            : 'Please wait while we import your data into the system'}
        </p>
      </div>

      {!completed && !importing && (
        <div className="card p-8 text-center">
          <div className="max-w-md mx-auto">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              Ready to Import
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Click the button below to start importing your validated data. This process may take a few minutes depending on the number of records.
            </p>
            <button
              onClick={startImport}
              className="btn btn-primary px-8 py-3 text-lg"
            >
              Start Import
            </button>
          </div>
        </div>
      )}

      {importing && (
        <div className="card p-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Loader className="w-12 h-12 text-blue-600 animate-spin" />
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {progress.message}
                </span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Please do not close this window or navigate away
            </p>
          </div>
        </div>
      )}

      {completed && (
        <>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <h4 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                  Import Completed Successfully!
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your data has been imported and is now available in the system.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Created</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {summary.created}
              </p>
            </div>

            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Updated</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {summary.updated}
              </p>
            </div>

            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Skipped</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {summary.skipped}
              </p>
            </div>

            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {summary.errors}
              </p>
            </div>
          </div>

          <div className="card p-6">
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">
              Import Summary - Batch #{importBatch.batch_number}
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Entity Type</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">{entityType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">File Name</span>
                <span className="font-medium text-gray-900 dark:text-white">{importBatch.file_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Import Date</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {summary.errors > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    Some Rows Failed
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    {summary.errors} rows encountered errors during import. Check the import logs for details.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <button
              onClick={onComplete}
              className="btn btn-primary px-8"
            >
              Finish
            </button>
          </div>
        </>
      )}

      {!completed && !importing && (
        <div className="flex justify-between pt-4">
          <button
            onClick={onBack}
            className="btn btn-outline flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>
      )}
    </div>
  );
}
