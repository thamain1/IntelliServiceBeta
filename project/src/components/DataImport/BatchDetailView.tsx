import { useState, useEffect } from 'react';
import { X, RefreshCw, Trash2, CheckCircle, AlertCircle, Clock, FileText, AlertTriangle, List, XCircle, Ban } from 'lucide-react';
import {
  DataImportService,
  ImportBatch,
  BatchProgress,
  BatchLogEvent,
  ImportPhase,
  RollbackResult,
  ImportEntityType,
} from '../../services/DataImportService';

// Interface for validation errors in import rows
interface ValidationError {
  field: string;
  message: string;
}

// Interface for import staging rows with common fields
interface ImportStagingRow {
  row_number: number;
  validation_errors?: ValidationError[];
  raw_row_json?: Record<string, unknown>;
  [key: string]: unknown;
}

interface BatchDetailViewProps {
  batchId: string;
  onClose: () => void;
  onRefresh?: () => void;
}

type TabType = 'preview' | 'errors' | 'logs';

export function BatchDetailView({ batchId, onClose, onRefresh }: BatchDetailViewProps) {
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<ImportBatch | null>(null);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('preview');
  const [previewRows, setPreviewRows] = useState<ImportStagingRow[]>([]);
  const [errorRows, setErrorRows] = useState<ImportStagingRow[]>([]);
  const [logs, setLogs] = useState<BatchLogEvent[]>([]);
  const [polling, setPolling] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  useEffect(() => {
    loadBatchDetails();
    // loadBatchDetails is intentionally excluded to prevent infinite re-renders since it depends on state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchId]);

  useEffect(() => {
    // Start polling if batch is in progress
    if (progress && isInProgress(progress.phase)) {
      setPolling(true);
      const interval = setInterval(() => {
        loadBatchProgress();
      }, 5000);

      return () => {
        clearInterval(interval);
        setPolling(false);
      };
    } else {
      setPolling(false);
    }
    // loadBatchProgress is stable and only needs to run when phase changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress?.phase]);

  const isInProgress = (phase: ImportPhase): boolean => {
    return ['uploading', 'mapping', 'validating', 'committing'].includes(phase);
  };

  const loadBatchDetails = async () => {
    setLoading(true);
    try {
      const [batchData, progressData] = await Promise.all([
        DataImportService.getImportBatch(batchId),
        DataImportService.getBatchProgress(batchId),
      ]);

      setBatch(batchData);
      setProgress(progressData);

      // Load tab data based on active tab
      await loadTabData(activeTab, batchData.entity_type);
    } catch (error) {
      console.error('Error loading batch details:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadBatchProgress = async () => {
    try {
      const progressData = await DataImportService.getBatchProgress(batchId);
      setProgress(progressData);
    } catch (error) {
      console.error('Error loading batch progress:', error);
    }
  };

  const loadTabData = async (tab: TabType, entityType: string) => {
    try {
      if (tab === 'preview') {
        const data = await DataImportService.getBatchPreviewRows(batchId, entityType as unknown as ImportEntityType);
        setPreviewRows(data as unknown as ImportStagingRow[]);
      } else if (tab === 'errors') {
        const data = await DataImportService.getBatchErrorRows(batchId, entityType as unknown as ImportEntityType);
        setErrorRows(data as unknown as ImportStagingRow[]);
      } else if (tab === 'logs') {
        const data = await DataImportService.getBatchLogs(batchId);
        setLogs(data);
      }
    } catch (error) {
      console.error(`Error loading ${tab} data:`, error);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (batch) {
      loadTabData(tab, batch.entity_type);
    }
  };

  const handleCancel = async () => {
    if (!batch) return;

    if (!confirm(`Cancel this import? Any rows not yet processed will not be committed. No live data will be created.`)) {
      return;
    }

    setActionInProgress('Cancelling');
    try {
      await DataImportService.cancelImportBatch(batchId);
      alert('Import cancelled successfully');
      if (onRefresh) onRefresh();
      await loadBatchDetails();
    } catch (error: unknown) {
      console.error('Error cancelling import:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to cancel import: ' + errorMessage);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleRollback = async () => {
    if (!batch) return;

    const message = `Are you sure you want to rollback import batch ${batch.batch_number}?\n\n` +
      `This will delete:\n` +
      `• All customers and locations created by this import (that have not been used)\n` +
      `• All invoices created by this import (that have no payments)\n` +
      `• Related GL entries\n\n` +
      `Records with tickets, payments, or other dependencies will be skipped and remain in the system.`;

    if (!confirm(message)) {
      return;
    }

    setActionInProgress('Rolling Back');
    try {
      const result: RollbackResult = await DataImportService.rollbackImportBatch(batchId);

      let message = `Rollback completed:\n• ${result.deleted_count} records deleted`;
      if (result.skipped_count > 0) {
        message += `\n• ${result.skipped_count} records skipped (have dependencies)`;
      }
      alert(message);

      if (onRefresh) onRefresh();
      await loadBatchDetails();
    } catch (error: unknown) {
      console.error('Error rolling back import:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to rollback import: ' + errorMessage);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleDelete = async () => {
    if (!batch) return;

    const message = `Are you sure you want to delete import batch ${batch.batch_number}?\n\n` +
      `This will permanently remove:\n` +
      `• Batch record and metadata\n` +
      `• All staging data\n` +
      `• Import logs\n\n` +
      `This action cannot be undone.`;

    if (!confirm(message)) {
      return;
    }

    setActionInProgress('Deleting');
    try {
      await DataImportService.deleteImportBatch(batchId);
      alert('Import batch deleted successfully');
      if (onRefresh) onRefresh();
      onClose();
    } catch (error: unknown) {
      console.error('Error deleting import batch:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert('Failed to delete import batch: ' + errorMessage);
    } finally {
      setActionInProgress(null);
    }
  };

  const getPhaseLabel = (phase: ImportPhase): string => {
    const labels: { [key in ImportPhase]: string } = {
      uploading: 'Uploading',
      mapping: 'Mapping Columns',
      validating: 'Validating',
      ready_to_commit: 'Ready to Commit',
      committing: 'Committing',
      completed: 'Completed',
      failed: 'Failed',
      cancelled: 'Cancelled',
      rolled_back: 'Rolled Back',
    };
    return labels[phase] || phase;
  };

  const getPhaseIcon = (phase: ImportPhase) => {
    if (phase === 'completed') return CheckCircle;
    if (phase === 'failed') return XCircle;
    if (phase === 'cancelled') return Ban;
    if (phase === 'rolled_back') return AlertCircle;
    return Clock;
  };

  const getPhaseColor = (phase: ImportPhase): string => {
    if (phase === 'completed') return 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400';
    if (phase === 'failed') return 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400';
    if (phase === 'cancelled') return 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400';
    if (phase === 'rolled_back') return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400';
    return 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400';
  };

  if (loading || !batch || !progress) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const PhaseIcon = getPhaseIcon(progress.phase);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {batch.batch_number}
              </h2>
              <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-sm font-medium ${getPhaseColor(progress.phase)}`}>
                <PhaseIcon className="w-4 h-4" />
                <span>{getPhaseLabel(progress.phase)}</span>
              </span>
              {polling && (
                <span className="inline-flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Live</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="capitalize">{batch.entity_type} Import</span>
              <span>•</span>
              <span>{batch.file_name}</span>
              <span>•</span>
              <span>{new Date(batch.started_at).toLocaleString()}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Section */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Progress
              </span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {progress.progress_percentage}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress.progress_percentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Rows</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {progress.rows_total}
              </p>
            </div>

            <div className="card p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Validated</p>
              <p className="text-2xl font-bold text-green-600">
                {progress.validated_rows}
              </p>
            </div>

            <div className="card p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Errors</p>
              <p className="text-2xl font-bold text-red-600">
                {progress.error_rows}
              </p>
            </div>

            <div className="card p-4">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Committed</p>
              <p className="text-2xl font-bold text-blue-600">
                {progress.committed_rows}
              </p>
            </div>
          </div>

          {progress.last_error_message && (
            <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-900 dark:text-red-100">Last Error</p>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    {progress.last_error_message}
                  </p>
                  {progress.last_error_at && (
                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                      {new Date(progress.last_error_at).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-thin">
          <div className="flex space-x-8 px-6 min-w-max">
            <button
              onClick={() => handleTabChange('preview')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'preview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Preview</span>
                <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-xs">
                  {progress.validated_rows}
                </span>
              </div>
            </button>

            <button
              onClick={() => handleTabChange('errors')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'errors'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Errors</span>
                {progress.error_rows > 0 && (
                  <span className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs">
                    {progress.error_rows}
                  </span>
                )}
              </div>
            </button>

            <button
              onClick={() => handleTabChange('logs')}
              className={`py-4 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'logs'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <List className="w-4 h-4" />
                <span>Logs</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'preview' && (
            <PreviewTab previewRows={previewRows} entityType={batch.entity_type} />
          )}

          {activeTab === 'errors' && (
            <ErrorsTab errorRows={errorRows} entityType={batch.entity_type} />
          )}

          {activeTab === 'logs' && (
            <LogsTab logs={logs} />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {batch.completed_at && (
              <span>Completed {new Date(batch.completed_at).toLocaleString()}</span>
            )}
            {batch.rolled_back_at && (
              <span>Rolled back {new Date(batch.rolled_back_at).toLocaleString()}</span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            {actionInProgress && (
              <span className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{actionInProgress}...</span>
              </span>
            )}

            {/* Cancel button for in-progress imports */}
            {['uploading', 'mapping', 'validating', 'committing'].includes(progress.phase) && !actionInProgress && (
              <button
                onClick={handleCancel}
                className="btn btn-outline flex items-center space-x-2 text-orange-600 border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20"
              >
                <Ban className="w-4 h-4" />
                <span>Cancel Import</span>
              </button>
            )}

            {/* Delete button for pre-commit or cancelled/failed batches */}
            {['ready_to_commit', 'cancelled', 'failed'].includes(progress.phase) && !actionInProgress && (
              <button
                onClick={handleDelete}
                className="btn btn-outline flex items-center space-x-2 text-gray-600 border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Batch</span>
              </button>
            )}

            {/* Rollback button for completed imports */}
            {progress.phase === 'completed' && batch.supports_rollback && !actionInProgress && (
              <button
                onClick={handleRollback}
                className="btn btn-outline flex items-center space-x-2 text-red-600 border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Rollback Import</span>
              </button>
            )}

            {/* Delete button for rolled back imports (if no records remain) */}
            {progress.phase === 'rolled_back' && !actionInProgress && (
              <button
                onClick={handleDelete}
                className="btn btn-outline flex items-center space-x-2 text-gray-600 border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-900/20"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Batch Record</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="btn btn-primary"
              disabled={!!actionInProgress}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewTab({ previewRows, entityType }: { previewRows: ImportStagingRow[]; entityType: string }) {
  if (previewRows.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No preview data available</p>
      </div>
    );
  }

  const getDisplayFields = () => {
    if (entityType === 'customers') {
      return ['row_number', 'name', 'email', 'phone', 'city', 'state'];
    } else if (entityType === 'ar') {
      return ['row_number', 'external_customer_id', 'external_invoice_number', 'balance_due', 'due_date'];
    }
    return Object.keys(previewRows[0]).filter(k => !k.includes('json') && k !== 'id');
  };

  const fields = getDisplayFields();

  return (
    <div>
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Preview of Valid Rows (showing first {previewRows.length})
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          These rows passed validation and are ready to be imported
        </p>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {fields.map((field) => (
                  <th
                    key={field}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
                  >
                    {field.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {previewRows.map((row, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  {fields.map((field) => (
                    <td key={field} className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {row[field] !== null && row[field] !== undefined ? String(row[field]) : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function ErrorsTab({ errorRows, entityType: _entityType }: { errorRows: ImportStagingRow[]; entityType: string }) {
  if (errorRows.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No errors found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Error Rows ({errorRows.length})
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          These rows failed validation and will be skipped during import
        </p>
      </div>

      <div className="space-y-4">
        {errorRows.map((row, index) => (
          <div
            key={index}
            className="card p-4 border-l-4 border-red-500"
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                Row #{row.row_number}
              </span>
              <span className="text-xs px-2 py-1 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                Error
              </span>
            </div>

            {row.validation_errors && row.validation_errors.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Validation Errors:
                </p>
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {row.validation_errors.map((error: ValidationError, i: number) => (
                    <li key={i}>• {error.field}: {error.message}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">Data: </span>
              {JSON.stringify(row.raw_row_json).substring(0, 200)}...
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LogsTab({ logs }: { logs: BatchLogEvent[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12">
        <List className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No logs available</p>
      </div>
    );
  }

  const getLogIcon = (level: string) => {
    if (level === 'error') return AlertCircle;
    if (level === 'warning') return AlertTriangle;
    return CheckCircle;
  };

  const getLogColor = (level: string) => {
    if (level === 'error') return 'text-red-600 dark:text-red-400';
    if (level === 'warning') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="font-medium text-gray-900 dark:text-white">
          Import Logs ({logs.length})
        </h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Chronological log of import events and operations
        </p>
      </div>

      <div className="space-y-2">
        {logs.map((log) => {
          const Icon = getLogIcon(log.log_level);
          const colorClass = getLogColor(log.log_level);

          return (
            <div
              key={log.id}
              className="card p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-start space-x-3">
                <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colorClass}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {log.message}
                    </p>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(log.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  {log.details && Object.keys(log.details).length > 0 && (
                    <pre className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
