import { useState, useEffect } from 'react';
import {
  X,
  Check,
  RefreshCw,
  Save,
  Ban,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Upload,
  Plus,
} from 'lucide-react';
import {
  ReconciliationService,
  BankReconciliation,
  GLEntryForReconciliation,
  BankStatementLine,
  ReconciliationAdjustment,
  AdjustmentType,
} from '../../services/ReconciliationService';
import { BankStatementImport } from './BankStatementImport';
import { TransactionMatcher } from './TransactionMatcher';
import { AdjustmentForm } from './AdjustmentForm';

interface ReconciliationSessionProps {
  reconciliationId: string;
  onClose: () => void;
  onComplete?: () => void;
}

type TabType = 'gl_entries' | 'bank_statement' | 'adjustments' | 'summary';

export function ReconciliationSession({
  reconciliationId,
  onClose,
  onComplete,
}: ReconciliationSessionProps) {
  const [loading, setLoading] = useState(true);
  const [reconciliation, setReconciliation] = useState<BankReconciliation | null>(null);
  const [glEntries, setGLEntries] = useState<GLEntryForReconciliation[]>([]);
  const [bankLines, setBankLines] = useState<BankStatementLine[]>([]);
  const [adjustments, setAdjustments] = useState<ReconciliationAdjustment[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('gl_entries');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    loadReconciliationData();
  }, [reconciliationId]);

  const loadReconciliationData = async () => {
    try {
      setLoading(true);
      const [reconData, glData, bankData, adjData] = await Promise.all([
        ReconciliationService.getReconciliation(reconciliationId),
        ReconciliationService.getGLEntriesForReconciliation(reconciliationId),
        ReconciliationService.getBankStatementLines(reconciliationId),
        ReconciliationService.getAdjustments(reconciliationId),
      ]);

      setReconciliation(reconData);
      setGLEntries(glData);
      setBankLines(bankData);
      setAdjustments(adjData);

      // Pre-select cleared entries
      const clearedIds = new Set(
        glData.filter((e) => e.reconciliation_id === reconciliationId).map((e) => e.id)
      );
      setSelectedEntries(clearedIds);
    } catch (error: any) {
      console.error('Error loading reconciliation:', error);
      alert('Failed to load reconciliation: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEntry = async (entryId: string) => {
    if (!reconciliation) return;

    const entry = glEntries.find((e) => e.id === entryId);
    if (!entry) return;

    try {
      const isCleared = selectedEntries.has(entryId);
      const newReconciliationId = isCleared ? null : reconciliation.id;

      await ReconciliationService.updateGLEntryCleared(entryId, newReconciliationId);

      // Update local state
      const newSelected = new Set(selectedEntries);
      if (isCleared) {
        newSelected.delete(entryId);
      } else {
        newSelected.add(entryId);
      }
      setSelectedEntries(newSelected);

      // Reload to get updated balances
      await loadReconciliationData();
    } catch (error: any) {
      console.error('Error toggling entry:', error);
      alert('Failed to update entry: ' + error.message);
    }
  };

  const handleCompleteReconciliation = async () => {
    if (!reconciliation) return;

    const tolerance = 0.01;
    if (Math.abs(reconciliation.difference) > tolerance) {
      alert(
        `Cannot complete: Difference of $${reconciliation.difference.toFixed(2)} exceeds tolerance. Please clear additional entries or create adjustments.`
      );
      return;
    }

    if (
      !confirm(
        `Complete reconciliation for ${reconciliation.statement_end_date}?\n\nThis will lock the cleared entries and mark the reconciliation as complete.`
      )
    ) {
      return;
    }

    setActionInProgress('Completing');
    try {
      await ReconciliationService.completeReconciliation(reconciliationId);
      alert('Reconciliation completed successfully!');
      if (onComplete) onComplete();
      onClose();
    } catch (error: any) {
      console.error('Error completing reconciliation:', error);
      alert('Failed to complete reconciliation: ' + error.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancelReconciliation = async () => {
    setShowCancelModal(false);
    setActionInProgress('Cancelling');
    try {
      await ReconciliationService.cancelReconciliation(reconciliationId);
      if (onComplete) onComplete();
      onClose();
    } catch (error: any) {
      console.error('Error cancelling reconciliation:', error);
      alert('Failed to cancel reconciliation: ' + error.message);
    } finally {
      setActionInProgress(null);
    }
  };

  if (loading || !reconciliation) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading reconciliation...</p>
        </div>
      </div>
    );
  }

  const isCompleted = reconciliation.status === 'completed';
  const isInProgress = reconciliation.status === 'in_progress';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Bank Reconciliation
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Statement Period: {reconciliation.statement_start_date} to{' '}
              {reconciliation.statement_end_date}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={!!actionInProgress}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Balance Summary */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Statement Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${reconciliation.statement_ending_balance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Cleared Balance</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${reconciliation.cleared_balance.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Difference</p>
              <p
                className={`text-2xl font-bold ${
                  Math.abs(reconciliation.difference) < 0.01
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                ${reconciliation.difference.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
              <div className="flex items-center space-x-2 mt-1">
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                )}
                <span className="text-lg font-semibold text-gray-900 dark:text-white capitalize">
                  {reconciliation.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-thin">
          <div className="flex space-x-8 px-6 min-w-max">
            <button
              onClick={() => setActiveTab('gl_entries')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'gl_entries'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>GL Entries</span>
                <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">
                  {glEntries.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('bank_statement')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'bank_statement'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Upload className="w-4 h-4" />
                <span>Bank Statement</span>
                <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">
                  {bankLines.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('adjustments')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'adjustments'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Adjustments</span>
                <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs">
                  {adjustments.length}
                </span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'summary'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Summary</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'gl_entries' && (
            <GLEntriesTab
              entries={glEntries}
              selectedEntries={selectedEntries}
              onToggleEntry={handleToggleEntry}
              readOnly={isCompleted}
            />
          )}

          {activeTab === 'bank_statement' && (
            <BankStatementTab
              reconciliationId={reconciliationId}
              bankLines={bankLines}
              onRefresh={loadReconciliationData}
              readOnly={isCompleted}
            />
          )}

          {activeTab === 'adjustments' && (
            <AdjustmentsTab
              reconciliationId={reconciliationId}
              accountId={reconciliation.account_id}
              adjustments={adjustments}
              onRefresh={loadReconciliationData}
              readOnly={isCompleted}
            />
          )}

          {activeTab === 'summary' && (
            <SummaryTab reconciliation={reconciliation} clearedCount={selectedEntries.size} />
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {selectedEntries.size} of {glEntries.length} entries cleared
          </div>
          <div className="flex items-center space-x-3">
            {actionInProgress && (
              <span className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{actionInProgress}...</span>
              </span>
            )}

            {isInProgress && (
              <>
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="btn btn-outline flex items-center space-x-2"
                  disabled={!!actionInProgress}
                >
                  <Ban className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleCompleteReconciliation}
                  className="btn btn-primary flex items-center space-x-2"
                  disabled={!!actionInProgress || Math.abs(reconciliation.difference) > 0.01}
                >
                  <Check className="w-4 h-4" />
                  <span>Complete Reconciliation</span>
                </button>
              </>
            )}

            {isCompleted && (
              <button onClick={onClose} className="btn btn-primary">
                Close
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start space-x-3 mb-4">
              <div className="flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Cancel this reconciliation?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  All GL entries marked as cleared in this reconciliation will be unmarked, and any
                  imported bank statement lines for this statement will be deleted.
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Your general ledger will not be changed or deleted. You can start a new
                  reconciliation for this account later.
                </p>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCancelModal(false)}
                className="btn btn-outline"
                disabled={!!actionInProgress}
              >
                Keep Working
              </button>
              <button
                onClick={handleCancelReconciliation}
                className="btn bg-red-600 hover:bg-red-700 text-white"
                disabled={!!actionInProgress}
              >
                <Ban className="w-4 h-4 mr-2" />
                Cancel Reconciliation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// GL Entries Tab Component
function GLEntriesTab({
  entries,
  selectedEntries,
  onToggleEntry,
  readOnly,
}: {
  entries: GLEntryForReconciliation[];
  selectedEntries: Set<string>;
  onToggleEntry: (id: string) => void;
  readOnly: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Instructions:</strong> Check the box next to each GL entry that appears on your
          bank statement to mark it as cleared. The cleared balance will update automatically.
        </p>
      </div>

      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="w-12 px-6 py-3"></th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Entry #
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                  No GL entries found for this reconciliation period
                </td>
              </tr>
            ) : (
              entries.map((entry) => {
                const isCleared = selectedEntries.has(entry.id);
                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isCleared ? 'bg-green-50 dark:bg-green-900/20' : ''
                    }`}
                  >
                    <td className="px-6 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isCleared}
                        onChange={() => onToggleEntry(entry.id)}
                        disabled={readOnly}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {new Date(entry.entry_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                      {entry.entry_number}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {entry.description}
                    </td>
                    <td
                      className={`px-6 py-4 text-sm text-right whitespace-nowrap font-medium ${
                        entry.net_amount >= 0
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}
                    >
                      ${Math.abs(entry.net_amount).toFixed(2)}
                      {entry.net_amount >= 0 ? ' DR' : ' CR'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Bank Statement Tab Component
function BankStatementTab({
  reconciliationId,
  bankLines,
  glEntries,
  onRefresh,
  readOnly,
}: {
  reconciliationId: string;
  bankLines: BankStatementLine[];
  glEntries: GLEntryForReconciliation[];
  onRefresh: () => void;
  readOnly: boolean;
}) {
  const [showImport, setShowImport] = useState(false);
  const [activeView, setActiveView] = useState<'list' | 'match'>('list');

  const handleImportComplete = () => {
    setShowImport(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveView('list')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeView === 'list'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              Statement Lines
            </button>
            <button
              onClick={() => setActiveView('match')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                activeView === 'match'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              Match Transactions
            </button>
          </div>
          <button
            onClick={() => setShowImport(!showImport)}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import Statement</span>
          </button>
        </div>
      )}

      {/* Import Section */}
      {showImport && !readOnly && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <BankStatementImport
            reconciliationId={reconciliationId}
            onImportComplete={handleImportComplete}
            onCancel={() => setShowImport(false)}
          />
        </div>
      )}

      {/* Main Content */}
      {activeView === 'list' && (
        <>
          {bankLines.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Bank Statement Loaded
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Import your bank statement to compare against GL entries.
              </p>
              {!readOnly && (
                <button
                  onClick={() => setShowImport(true)}
                  className="btn btn-primary"
                >
                  Import Bank Statement
                </button>
              )}
            </div>
          ) : (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {bankLines.map((line) => (
                    <tr key={line.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {new Date(line.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {line.description}
                      </td>
                      <td
                        className={`px-6 py-4 text-sm text-right whitespace-nowrap font-medium ${
                          line.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        ${Math.abs(line.amount).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                            line.match_status === 'matched'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}
                        >
                          {line.match_status.replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeView === 'match' && (
        <TransactionMatcher
          reconciliationId={reconciliationId}
          bankLines={bankLines}
          glEntries={glEntries}
          onRefresh={onRefresh}
          readOnly={readOnly}
        />
      )}
    </div>
  );
}

// Adjustments Tab Component
function AdjustmentsTab({
  reconciliationId,
  accountId,
  adjustments,
  onRefresh,
  readOnly,
}: {
  reconciliationId: string;
  accountId: string;
  adjustments: ReconciliationAdjustment[];
  onRefresh: () => void;
  readOnly: boolean;
}) {
  const [showForm, setShowForm] = useState(false);

  const handleAdjustmentCreated = () => {
    setShowForm(false);
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Adjustments:</strong> Create journal entries for bank fees, interest, NSF items,
          or other adjustments needed to reconcile. These will automatically be marked as cleared.
        </p>
      </div>

      {!readOnly && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="btn btn-outline flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Adjustment</span>
        </button>
      )}

      {showForm && !readOnly && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <AdjustmentForm
            reconciliationId={reconciliationId}
            accountId={accountId}
            onAdjustmentCreated={handleAdjustmentCreated}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {adjustments.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {adjustments.map((adj) => (
                <tr key={adj.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white capitalize">
                    {adj.adjustment_type.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {adj.description}
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white whitespace-nowrap">
                    ${adj.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                    {new Date(adj.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {adjustments.length === 0 && !showForm && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No adjustments yet</p>
          {!readOnly && (
            <p className="text-sm mt-2">Click "New Adjustment" to add bank fees, interest, or corrections</p>
          )}
        </div>
      )}
    </div>
  );
}

// Summary Tab Component
function SummaryTab({
  reconciliation,
  clearedCount,
}: {
  reconciliation: BankReconciliation;
  clearedCount: number;
}) {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Reconciliation Summary
        </h3>

        <div className="space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Statement Period:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {reconciliation.statement_start_date} to {reconciliation.statement_end_date}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Statement Ending Balance:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${reconciliation.statement_ending_balance.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Cleared Transactions:</span>
            <span className="font-medium text-gray-900 dark:text-white">{clearedCount}</span>
          </div>

          <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Cleared Balance:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              ${reconciliation.cleared_balance.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-lg font-semibold text-gray-900 dark:text-white">Difference:</span>
            <span
              className={`text-2xl font-bold ${
                Math.abs(reconciliation.difference) < 0.01
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              ${reconciliation.difference.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {Math.abs(reconciliation.difference) < 0.01 ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-800 dark:text-green-200">
                Ready to Complete
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                The difference is within acceptable tolerance. You can complete this reconciliation.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                Additional Work Needed
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                The difference must be within $0.01 to complete. Review the GL Entries tab to clear
                additional transactions, or add adjustments for bank fees, interest, or corrections.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
