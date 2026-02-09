import { useState, useEffect, useCallback } from 'react';
import { Upload, AlertCircle, CheckCircle, Clock, XCircle, Eye, Ban, LucideIcon } from 'lucide-react';
import { DataImportService, ImportBatch, ImportEntityType } from '../../services/DataImportService';
import { ImportWizard } from './ImportWizard';
import { BatchDetailView } from './BatchDetailView';

export function DataImportView() {
  const [imports, setImports] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<ImportEntityType | 'all'>('all');

  const loadImports = useCallback(async () => {
    setLoading(true);
    try {
      const data = filterType === 'all'
        ? await DataImportService.getImportBatches()
        : await DataImportService.getImportBatches(filterType);
      setImports(data);
    } catch (error) {
      console.error('Error loading imports:', error);
    } finally {
      setLoading(false);
    }
  }, [filterType]);

  useEffect(() => {
    loadImports();
  }, [loadImports]);

  const getStatusBadge = (status: string, importBatch: ImportBatch) => {
    // Use phase for more accurate status display
    const phaseStatus = importBatch.phase || status;

    const badges: { [key: string]: { icon: LucideIcon; color: string; label: string } } = {
      uploading: { icon: Clock, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', label: 'Uploading' },
      mapping: { icon: Clock, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', label: 'Mapping' },
      pending: { icon: Clock, color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300', label: 'Pending' },
      validating: { icon: Clock, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400', label: 'Validating' },
      ready_to_commit: { icon: CheckCircle, color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400', label: 'Ready' },
      validated: { icon: CheckCircle, color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400', label: 'Validated' },
      committing: { icon: Clock, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400', label: 'Importing' },
      importing: { icon: Clock, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400', label: 'Importing' },
      completed: { icon: CheckCircle, color: 'bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400', label: 'Completed' },
      failed: { icon: XCircle, color: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400', label: 'Failed' },
      cancelled: { icon: Ban, color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400', label: 'Cancelled' },
      rolled_back: { icon: AlertCircle, color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400', label: 'Rolled Back' },
    };

    const badge = badges[phaseStatus] || badges.pending;
    const Icon = badge.icon;

    // Show progress info for in-progress statuses
    const isInProgress = ['validating', 'committing', 'importing'].includes(phaseStatus);
    const progressInfo = isInProgress
      ? `${importBatch.validated_rows || 0} / ${importBatch.rows_total || 0}`
      : '';

    return (
      <span
        className={`inline-flex items-center space-x-1 px-2 py-1 rounded text-xs font-medium ${badge.color}`}
        title={progressInfo || badge.label}
      >
        <Icon className="w-3 h-3" />
        <span>{badge.label}</span>
        {isInProgress && progressInfo && (
          <span className="ml-1 text-xs opacity-75">({progressInfo})</span>
        )}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Data Import</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Import customer data, open AR, and other information from your previous ERP system
          </p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Upload className="w-5 h-5" />
          <span>New Import</span>
        </button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Safe Import Process
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              All imports go through staging tables first. Data is validated before committing to your live system. You can roll back any import if needed.
            </p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Filter by Type:
        </label>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as unknown as ImportEntityType | 'all')}
          className="input text-sm"
        >
          <option value="all">All Types</option>
          <option value="customers">Customers</option>
          <option value="ar">Open AR</option>
          <option value="vendors">Vendors</option>
          <option value="items">Items</option>
          <option value="history">History</option>
        </select>
      </div>

      {/* Import List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : imports.length === 0 ? (
        <div className="card p-12 text-center">
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No Imports Yet
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Get started by creating your first data import
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="btn btn-primary"
          >
            Start First Import
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Batch #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Rows
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {imports.map((importBatch) => (
                <tr
                  key={importBatch.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => setSelectedBatchId(importBatch.id)}
                >
                  <td className="px-6 py-4 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline">
                    {importBatch.batch_number}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm capitalize text-gray-900 dark:text-white">
                      {importBatch.entity_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {importBatch.file_name}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(importBatch.status, importBatch)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {importBatch.rows_imported || 0} / {importBatch.rows_total || 0}
                      </div>
                      {importBatch.rows_error > 0 && (
                        <div className="text-xs text-red-600 dark:text-red-400">
                          {importBatch.rows_error} errors
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(importBatch.started_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBatchId(importBatch.id);
                        }}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Wizard Modal */}
      {showWizard && (
        <ImportWizard
          onClose={() => {
            setShowWizard(false);
            loadImports();
          }}
        />
      )}

      {/* Batch Detail View */}
      {selectedBatchId && (
        <BatchDetailView
          batchId={selectedBatchId}
          onClose={() => setSelectedBatchId(null)}
          onRefresh={loadImports}
        />
      )}
    </div>
  );
}
