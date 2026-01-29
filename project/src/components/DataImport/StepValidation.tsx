import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Download, ArrowRight } from 'lucide-react';
import { ImportEntityType, DataImportService, ImportBatch } from '../../services/DataImportService';
import { supabase } from '../../lib/supabase';

interface StepValidationProps {
  entityType: ImportEntityType;
  importBatch: ImportBatch;
  stagingRowIds: string[];
  onNext: () => void;
  onBack: () => void;
}

interface ValidationStats {
  total: number;
  valid: number;
  errors: number;
  warnings: number;
}

interface ErrorRow {
  row_number: number;
  errors: string[];
  data: any;
}

export function StepValidation({
  entityType,
  importBatch,
  stagingRowIds,
  onNext,
  onBack,
}: StepValidationProps) {
  const [validating, setValidating] = useState(true);
  const [stats, setStats] = useState<ValidationStats>({ total: 0, valid: 0, errors: 0, warnings: 0 });
  const [errorRows, setErrorRows] = useState<ErrorRow[]>([]);

  useEffect(() => {
    validateStagingRows();
  }, []);

  const validateStagingRows = async () => {
    setValidating(true);

    try {
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

      // Load all staging rows
      const { data: stagingRows, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('import_batch_id', importBatch.id)
        .order('row_number', { ascending: true });

      if (error) throw error;

      let validCount = 0;
      let errorCount = 0;
      const errors: ErrorRow[] = [];

      // Update batch to validating phase
      await DataImportService.updateBatchProgress(importBatch.id, {
        phase: 'validating',
      });

      // Validate each row
      for (let i = 0; i < (stagingRows || []).length; i++) {
        // Check if cancel was requested every 25 rows
        if (i % 25 === 0) {
          const cancelRequested = await DataImportService.isCancelRequested(importBatch.id);
          if (cancelRequested) {
            await DataImportService.logImportEvent(
              importBatch.id,
              'warning',
              `Validation cancelled at row ${i + 1} of ${stagingRows!.length}`
            );
            throw new Error('Import cancelled by user');
          }
        }

        const row = stagingRows![i];
        let validationErrors;

        if (entityType === 'customers') {
          validationErrors = DataImportService.validateCustomerRow(row as any);
        } else if (entityType === 'ar') {
          validationErrors = DataImportService.validateARRow(row as any);
        } else if (entityType === 'vendors') {
          validationErrors = DataImportService.validateVendorRow(row as any);
        } else if (entityType === 'items') {
          validationErrors = DataImportService.validateItemRow(row as any);
        } else if (entityType === 'history') {
          validationErrors = DataImportService.validateHistoryRow(row as any);
        } else {
          validationErrors = [];
        }

        // Update validation status in staging table
        const validationStatus = validationErrors.length > 0 ? 'error' : 'valid';

        await supabase
          .from(tableName)
          .update({
            validation_status: validationStatus,
            validation_errors: validationErrors,
          })
          .eq('id', row.id);

        if (validationErrors.length > 0) {
          errorCount++;
          errors.push({
            row_number: row.row_number,
            errors: validationErrors.map((e: any) => `${e.field}: ${e.message}`),
            data: row.raw_row_json,
          });
        } else {
          validCount++;
        }

        // Update progress every 50 rows or on last row
        if ((i + 1) % 50 === 0 || i === stagingRows!.length - 1) {
          await DataImportService.updateBatchProgress(importBatch.id, {
            validated_rows: validCount,
          });
        }
      }

      setStats({
        total: stagingRows?.length || 0,
        valid: validCount,
        errors: errorCount,
        warnings: 0,
      });

      setErrorRows(errors);

      // Update batch statistics
      await DataImportService.updateImportBatch(importBatch.id, {
        rows_total: stagingRows?.length || 0,
        rows_valid: validCount,
        rows_error: errorCount,
        status: errorCount === 0 ? 'validated' : 'validating',
      } as any);

      await DataImportService.logImportEvent(
        importBatch.id,
        errorCount > 0 ? 'warning' : 'info',
        `Validation complete: ${validCount} valid, ${errorCount} errors`
      );
    } catch (error: any) {
      console.error('Validation error:', error);
      alert('Failed to validate rows: ' + error.message);
    } finally {
      setValidating(false);
    }
  };

  const downloadErrorReport = () => {
    const csv = ['Row #,Errors,Data'].join('\n') + '\n' +
      errorRows.map(row => {
        const dataStr = JSON.stringify(row.data).replace(/"/g, '""');
        return `${row.row_number},"${row.errors.join('; ')}","${dataStr}"`;
      }).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-errors-${importBatch.batch_number}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Validation Results
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Review data quality before importing into your system
        </p>
      </div>

      {validating ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Validating rows...</p>
        </div>
      ) : (
        <>
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Rows</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.total}
              </p>
            </div>

            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Valid</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.valid}
              </p>
            </div>

            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Errors</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.errors}
              </p>
            </div>

            <div className="card p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">Will Import</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.valid}
              </p>
            </div>
          </div>

          {/* Validation Status */}
          {stats.errors === 0 ? (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div>
                  <h4 className="text-lg font-bold text-green-900 dark:text-green-100 mb-2">
                    All Rows Valid!
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {stats.valid} rows passed validation and are ready to import. Click "Import Now" to proceed.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                  <div>
                    <h4 className="text-lg font-bold text-yellow-900 dark:text-yellow-100 mb-2">
                      {stats.errors} Rows Have Errors
                    </h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                      {stats.valid} valid rows will be imported. Rows with errors will be skipped. Review errors below or download the error report to fix issues in your source file.
                    </p>
                  </div>
                </div>
                <button
                  onClick={downloadErrorReport}
                  className="btn btn-outline flex items-center space-x-2 flex-shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Errors</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Details */}
          {errorRows.length > 0 && errorRows.length <= 20 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h4 className="font-bold text-gray-900 dark:text-white">
                  Error Details (showing first {errorRows.length})
                </h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Row #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        Errors
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {errorRows.slice(0, 20).map((row) => (
                      <tr key={row.row_number}>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                          {row.row_number}
                        </td>
                        <td className="px-6 py-4">
                          <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                            {row.errors.map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {errorRows.length > 20 && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 text-sm text-gray-600 dark:text-gray-400">
                  {errorRows.length - 20} more errors not shown. Download the full error report above.
                </div>
              )}
            </div>
          )}

          {/* Import Preview */}
          {stats.valid > 0 && (
            <div className="card p-6">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">
                What Will Be Imported
              </h4>
              <div className="space-y-3 text-sm">
                {entityType === 'customers' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">New Customers</span>
                      <span className="font-medium text-gray-900 dark:text-white">{stats.valid}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Customers will be created with their contact information. Duplicate checking will occur based on external ID or name match.
                    </p>
                  </>
                )}
                {entityType === 'ar' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Open Invoices</span>
                      <span className="font-medium text-gray-900 dark:text-white">{stats.valid}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total AR Opening Balance</span>
                      <span className="font-medium text-gray-900 dark:text-white">To be calculated</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Invoices will be marked as "migrated opening balance" and will appear in your AR aging. GL entries can be created to record the opening AR balance.
                    </p>
                  </>
                )}
                {entityType === 'vendors' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">New Vendors</span>
                      <span className="font-medium text-gray-900 dark:text-white">{stats.valid}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Vendors will be created with their contact and payment information. Duplicate checking will occur based on vendor code or name match.
                    </p>
                  </>
                )}
                {entityType === 'items' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">New Parts/Items</span>
                      <span className="font-medium text-gray-900 dark:text-white">{stats.valid}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Parts will be created with pricing and inventory information. SKU uniqueness will be validated.
                    </p>
                  </>
                )}
                {entityType === 'history' && (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Historical Records</span>
                      <span className="font-medium text-gray-900 dark:text-white">{stats.valid}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Invoices, payments, and tickets will be imported as historical records. Customers must be imported first.
                    </p>
                  </>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          disabled={validating}
          className="btn btn-outline flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        <button
          onClick={onNext}
          disabled={validating || stats.valid === 0}
          className="btn btn-primary flex items-center space-x-2"
        >
          <span>Import Now ({stats.valid} rows)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
