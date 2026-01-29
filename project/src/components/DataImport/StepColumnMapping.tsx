import { useState, useEffect } from 'react';
import { ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';
import { ImportEntityType, DataImportService, ColumnMapping } from '../../services/DataImportService';

interface StepColumnMappingProps {
  entityType: ImportEntityType;
  file: File | null;
  fileContent: string;
  parsedRows: any[];
  onNext: (data: { mapping: ColumnMapping; batch: any; stagingRowIds: string[] }) => void;
  onBack: () => void;
}

interface TargetField {
  key: string;
  label: string;
  required: boolean;
  description: string;
}

export function StepColumnMapping({
  entityType,
  file,
  fileContent,
  parsedRows,
  onNext,
  onBack,
}: StepColumnMappingProps) {
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [sourceHeaders, setSourceHeaders] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);

  // Get target fields based on entity type
  const getTargetFields = (): TargetField[] => {
    if (entityType === 'customers') {
      return [
        { key: 'name', label: 'Customer Name', required: true, description: 'Full company or person name' },
        { key: 'external_customer_id', label: 'Customer ID', required: false, description: 'Unique ID from source system' },
        { key: 'email', label: 'Email', required: false, description: 'Primary email address' },
        { key: 'phone', label: 'Phone', required: false, description: 'Primary phone number' },
        { key: 'address', label: 'Street Address', required: false, description: 'Street address line' },
        { key: 'city', label: 'City', required: false, description: 'City name' },
        { key: 'state', label: 'State', required: false, description: 'State or province' },
        { key: 'zip_code', label: 'ZIP Code', required: false, description: 'Postal code' },
        { key: 'notes', label: 'Notes', required: false, description: 'Additional notes' },
      ];
    } else if (entityType === 'ar') {
      return [
        { key: 'external_customer_id', label: 'Customer ID', required: true, description: 'Customer identifier for matching' },
        { key: 'external_invoice_number', label: 'Invoice Number', required: true, description: 'Unique invoice identifier' },
        { key: 'balance_due', label: 'Balance Due', required: true, description: 'Outstanding balance amount' },
        { key: 'current_amount', label: 'Current (0-30 days)', required: false, description: 'Current aging bucket' },
        { key: 'days_1_30', label: '1-30 Days', required: false, description: '1-30 days aging bucket' },
        { key: 'days_31_60', label: '31-60 Days', required: false, description: '31-60 days aging bucket' },
        { key: 'days_61_90', label: '61-90 Days', required: false, description: '61-90 days aging bucket' },
        { key: 'days_90_plus', label: '90+ Days', required: false, description: 'Over 90 days aging bucket' },
        { key: 'issue_date', label: 'Issue Date', required: false, description: 'Invoice issue date' },
        { key: 'due_date', label: 'Due Date', required: false, description: 'Payment due date' },
        { key: 'description', label: 'Description', required: false, description: 'Invoice description' },
      ];
    } else if (entityType === 'vendors') {
      return [
        { key: 'name', label: 'Vendor Name', required: true, description: 'Full company name' },
        { key: 'vendor_code', label: 'Vendor Code', required: false, description: 'Unique vendor code/ID' },
        { key: 'external_vendor_id', label: 'External ID', required: false, description: 'ID from source system' },
        { key: 'email', label: 'Email', required: false, description: 'Primary email address' },
        { key: 'phone', label: 'Phone', required: false, description: 'Primary phone number' },
        { key: 'address', label: 'Street Address', required: false, description: 'Street address line' },
        { key: 'city', label: 'City', required: false, description: 'City name' },
        { key: 'state', label: 'State', required: false, description: 'State or province' },
        { key: 'postal_code', label: 'ZIP/Postal Code', required: false, description: 'Postal code' },
        { key: 'payment_terms', label: 'Payment Terms', required: false, description: 'Net 30, Net 60, etc.' },
        { key: 'tax_id', label: 'Tax ID', required: false, description: 'Tax identification number' },
        { key: 'notes', label: 'Notes', required: false, description: 'Additional notes' },
      ];
    } else if (entityType === 'items') {
      return [
        { key: 'name', label: 'Item Name', required: true, description: 'Part/item name' },
        { key: 'sku', label: 'SKU', required: false, description: 'Stock keeping unit' },
        { key: 'external_item_id', label: 'External ID', required: false, description: 'ID from source system' },
        { key: 'description', label: 'Description', required: false, description: 'Item description' },
        { key: 'category', label: 'Category', required: false, description: 'Item category' },
        { key: 'unit_cost', label: 'Unit Cost', required: false, description: 'Cost per unit' },
        { key: 'unit_price', label: 'Unit Price', required: false, description: 'Selling price per unit' },
        { key: 'quantity_on_hand', label: 'Quantity on Hand', required: false, description: 'Current inventory quantity' },
        { key: 'reorder_point', label: 'Reorder Point', required: false, description: 'Minimum stock level' },
        { key: 'vendor_code', label: 'Vendor Code', required: false, description: 'Primary vendor code' },
      ];
    } else if (entityType === 'history') {
      return [
        { key: 'record_type', label: 'Record Type', required: true, description: 'invoice, payment, or ticket' },
        { key: 'external_customer_id', label: 'Customer ID', required: true, description: 'Customer identifier' },
        { key: 'document_number', label: 'Document Number', required: true, description: 'Invoice/payment/ticket number' },
        { key: 'document_date', label: 'Document Date', required: true, description: 'Date of the record' },
        { key: 'amount', label: 'Amount', required: false, description: 'Total amount' },
        { key: 'description', label: 'Description', required: false, description: 'Description or notes' },
        { key: 'status', label: 'Status', required: false, description: 'Record status' },
        { key: 'external_id', label: 'External ID', required: false, description: 'ID from source system' },
        { key: 'due_date', label: 'Due Date', required: false, description: 'Payment due date (invoices)' },
        { key: 'payment_method', label: 'Payment Method', required: false, description: 'Check, ACH, etc. (payments)' },
      ];
    }
    return [];
  };

  const targetFields = getTargetFields();

  useEffect(() => {
    // Extract source headers from parsed rows
    if (parsedRows.length > 0) {
      const headers = Object.keys(parsedRows[0]);
      setSourceHeaders(headers);

      // Auto-map columns
      const autoMapping = DataImportService.autoMapColumns(headers, targetFields.map(f => f.key));
      setMapping(autoMapping);
    }
  }, [parsedRows, entityType]);

  const handleMappingChange = (targetField: string, sourceColumn: string) => {
    setMapping({
      ...mapping,
      [targetField]: sourceColumn,
    });
    setValidationErrors([]);
  };

  const validateMapping = (): boolean => {
    const errors: string[] = [];

    // Check required fields are mapped
    targetFields.forEach((field) => {
      if (field.required && !mapping[field.key]) {
        errors.push(`Required field "${field.label}" is not mapped`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleContinue = async () => {
    if (!validateMapping()) return;
    if (!file) return;

    setProcessing(true);

    try {
      // Create import batch
      const { delimiter, encoding } = DataImportService.detectFileFormat(fileContent);
      const batch = await DataImportService.createImportBatch(
        entityType,
        file.name,
        file.size,
        encoding
      );

      // Save mapping config to batch
      await DataImportService.updateImportBatch(batch.id, {
        mapping_config: mapping,
        status: 'validating',
      } as any);

      // Insert rows into staging table
      const stagingRowIds: string[] = [];

      for (let i = 0; i < parsedRows.length; i++) {
        const rawRow = parsedRows[i];

        // Skip rows if needed
        if (DataImportService.shouldSkipRow(rawRow, entityType)) {
          continue;
        }

        // Map source columns to target fields
        const mappedRow: any = {
          import_batch_id: batch.id,
          row_number: i + 1,
          raw_row_json: rawRow,
        };

        targetFields.forEach((field) => {
          const sourceColumn = mapping[field.key];
          if (sourceColumn && rawRow[sourceColumn] !== undefined) {
            let value = rawRow[sourceColumn];

            // Normalize values based on field type
            if (field.key.includes('amount') || field.key === 'balance_due') {
              value = DataImportService.normalizeCurrency(value);
            } else if (field.key.includes('date')) {
              value = DataImportService.normalizeDate(value);
            }

            mappedRow[field.key] = value;
          }
        });

        // Insert into appropriate staging table
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
          .insert([mappedRow])
          .select()
          .single();

        if (error) {
          console.error('Error inserting staging row:', error);
          await DataImportService.logImportEvent(
            batch.id,
            'error',
            `Failed to insert row ${i + 1}`,
            { error: error.message, row: rawRow }
          );
        } else if (data) {
          stagingRowIds.push(data.id);
        }
      }

      // Update batch stats
      await DataImportService.updateImportBatch(batch.id, {
        rows_total: parsedRows.length,
        status: 'validated',
      } as any);

      await DataImportService.logImportEvent(
        batch.id,
        'info',
        `Loaded ${stagingRowIds.length} rows into staging table`
      );

      onNext({ mapping, batch, stagingRowIds });
    } catch (error: any) {
      console.error('Error processing mapping:', error);
      alert('Failed to process import: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const getSampleValues = (sourceColumn: string): string[] => {
    return parsedRows
      .slice(0, 3)
      .map((row) => row[sourceColumn])
      .filter((v) => v && v.toString().trim() !== '')
      .map((v) => v.toString().substring(0, 30));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Map Your Columns
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Match your file's columns to our system fields. Auto-mapped fields are pre-selected.
        </p>
      </div>

      {validationErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-100 mb-1">
                Mapping Errors
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Target Field
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Source Column
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Sample Values
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {targetFields.map((field) => {
              const mappedSource = mapping[field.key];
              const sampleValues = mappedSource ? getSampleValues(mappedSource) : [];

              return (
                <tr key={field.key} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {field.label}
                        </span>
                        {field.required && (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                            Required
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {field.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={mappedSource || ''}
                      onChange={(e) => handleMappingChange(field.key, e.target.value)}
                      className="input text-sm"
                    >
                      <option value="">-- Not Mapped --</option>
                      {sourceHeaders.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    {sampleValues.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {sampleValues.map((value, index) => (
                          <span
                            key={index}
                            className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          >
                            {value}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">
                        No mapping
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Mapping Tips
            </h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
              <li>Fields marked as Required must be mapped</li>
              <li>Currency values (e.g., $1,234.56) will be automatically normalized</li>
              <li>Dates will be parsed and validated</li>
              <li>You can change mappings anytime before importing</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button onClick={onBack} disabled={processing} className="btn btn-outline flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        <button
          onClick={handleContinue}
          disabled={processing}
          className="btn btn-primary flex items-center space-x-2"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <span>Continue to Validation</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// Import supabase at the top of the file
import { supabase } from '../../lib/supabase';
