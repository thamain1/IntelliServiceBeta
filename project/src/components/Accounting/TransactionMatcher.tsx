import { useState, useEffect } from 'react';
import { Link, CheckCircle, XCircle, Zap, ArrowRight } from 'lucide-react';
import {
  ReconciliationService,
  BankStatementLine,
  GLEntryForReconciliation,
  AutoMatchSuggestion,
} from '../../services/ReconciliationService';

interface TransactionMatcherProps {
  reconciliationId: string;
  bankLines: BankStatementLine[];
  glEntries: GLEntryForReconciliation[];
  onRefresh: () => void;
  readOnly: boolean;
}

export function TransactionMatcher({
  reconciliationId,
  bankLines,
  glEntries,
  onRefresh,
  readOnly,
}: TransactionMatcherProps) {
  const [selectedBankLine, setSelectedBankLine] = useState<string | null>(null);
  const [selectedGLEntry, setSelectedGLEntry] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<AutoMatchSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [matching, setMatching] = useState(false);

  // Filter unmatched items
  const unmatchedBankLines = bankLines.filter((l) => l.match_status === 'unmatched');
  const unmatchedGLEntries = glEntries.filter((e) => !e.reconciliation_id);

  useEffect(() => {
    loadSuggestions();
  }, [reconciliationId]);

  const loadSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const data = await ReconciliationService.getAutoMatchSuggestions(reconciliationId);
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleMatch = async () => {
    if (!selectedBankLine || !selectedGLEntry) return;

    setMatching(true);
    try {
      await ReconciliationService.matchBankLineToGLEntry(
        selectedBankLine,
        selectedGLEntry,
        reconciliationId
      );

      setSelectedBankLine(null);
      setSelectedGLEntry(null);
      onRefresh();
      loadSuggestions();
    } catch (error: any) {
      console.error('Match failed:', error);
      alert('Failed to match: ' + error.message);
    } finally {
      setMatching(false);
    }
  };

  const handleAutoMatch = async () => {
    if (suggestions.length === 0) return;

    setMatching(true);
    try {
      let matched = 0;
      for (const suggestion of suggestions) {
        try {
          await ReconciliationService.matchBankLineToGLEntry(
            suggestion.bank_line_id,
            suggestion.gl_entry_id,
            reconciliationId
          );
          matched++;
        } catch (error) {
          console.error('Failed to match suggestion:', error);
        }
      }

      alert(`Auto-matched ${matched} transactions`);
      onRefresh();
      loadSuggestions();
    } catch (error: any) {
      console.error('Auto-match failed:', error);
      alert('Auto-match failed: ' + error.message);
    } finally {
      setMatching(false);
    }
  };

  const handleUnmatch = async (bankLineId: string) => {
    try {
      await ReconciliationService.unmatchBankLine(bankLineId);
      onRefresh();
      loadSuggestions();
    } catch (error: any) {
      console.error('Unmatch failed:', error);
      alert('Failed to unmatch: ' + error.message);
    }
  };

  const applySuggestion = async (suggestion: AutoMatchSuggestion) => {
    setMatching(true);
    try {
      await ReconciliationService.matchBankLineToGLEntry(
        suggestion.bank_line_id,
        suggestion.gl_entry_id,
        reconciliationId
      );
      onRefresh();
      loadSuggestions();
    } catch (error: any) {
      console.error('Failed to apply suggestion:', error);
      alert('Failed to match: ' + error.message);
    } finally {
      setMatching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Auto-Match Suggestions */}
      {suggestions.length > 0 && !readOnly && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-blue-900 dark:text-blue-100">
                {suggestions.length} Auto-Match Suggestions
              </h4>
            </div>
            <button
              onClick={handleAutoMatch}
              disabled={matching}
              className="btn btn-sm bg-blue-600 hover:bg-blue-700 text-white"
            >
              {matching ? 'Matching...' : 'Apply All'}
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {suggestions.slice(0, 5).map((suggestion) => (
              <div
                key={suggestion.bank_line_id}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-600 dark:text-gray-400">
                    {new Date(suggestion.bank_line_date).toLocaleDateString()}
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${Math.abs(suggestion.amount).toFixed(2)}
                  </span>
                  <span className="text-gray-500 truncate max-w-xs">
                    {suggestion.bank_line_description}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      suggestion.confidence === 'high'
                        ? 'bg-green-100 text-green-800'
                        : suggestion.confidence === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {suggestion.confidence}
                  </span>
                  <button
                    onClick={() => applySuggestion(suggestion)}
                    disabled={matching}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Matching Interface */}
      <div className="grid grid-cols-2 gap-4">
        {/* Bank Lines Panel */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <span>Bank Statement</span>
            <span className="text-sm font-normal text-gray-500">
              ({unmatchedBankLines.length} unmatched)
            </span>
          </h4>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            {unmatchedBankLines.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>All bank lines matched</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                  <tr>
                    <th className="w-8 px-2 py-2"></th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {unmatchedBankLines.map((line) => (
                    <tr
                      key={line.id}
                      onClick={() => !readOnly && setSelectedBankLine(line.id)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedBankLine === line.id
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                    >
                      <td className="px-2 py-2">
                        <input
                          type="radio"
                          checked={selectedBankLine === line.id}
                          onChange={() => setSelectedBankLine(line.id)}
                          disabled={readOnly}
                          className="w-4 h-4 text-blue-600"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {new Date(line.transaction_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white truncate max-w-[150px]">
                        {line.description}
                      </td>
                      <td
                        className={`px-3 py-2 text-sm text-right whitespace-nowrap font-medium ${
                          line.amount < 0 ? 'text-red-600' : 'text-green-600'
                        }`}
                      >
                        ${Math.abs(line.amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* GL Entries Panel */}
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
            <span>GL Entries</span>
            <span className="text-sm font-normal text-gray-500">
              ({unmatchedGLEntries.length} uncleared)
            </span>
          </h4>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            {unmatchedGLEntries.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                <p>All GL entries cleared</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                  <tr>
                    <th className="w-8 px-2 py-2"></th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {unmatchedGLEntries.map((entry) => (
                    <tr
                      key={entry.id}
                      onClick={() => !readOnly && setSelectedGLEntry(entry.id)}
                      className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        selectedGLEntry === entry.id
                          ? 'bg-blue-50 dark:bg-blue-900/20'
                          : ''
                      }`}
                    >
                      <td className="px-2 py-2">
                        <input
                          type="radio"
                          checked={selectedGLEntry === entry.id}
                          onChange={() => setSelectedGLEntry(entry.id)}
                          disabled={readOnly}
                          className="w-4 h-4 text-blue-600"
                        />
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                        {new Date(entry.entry_date).toLocaleDateString()}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 dark:text-white truncate max-w-[150px]">
                        {entry.description}
                      </td>
                      <td
                        className={`px-3 py-2 text-sm text-right whitespace-nowrap font-medium ${
                          entry.net_amount >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        ${Math.abs(entry.net_amount).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Match Action */}
      {!readOnly && (
        <div className="flex justify-center">
          <button
            onClick={handleMatch}
            disabled={!selectedBankLine || !selectedGLEntry || matching}
            className="btn btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <Link className="w-5 h-5" />
            <span>Match Selected</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Matched Transactions */}
      {bankLines.filter((l) => l.match_status === 'matched').length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
            Matched Transactions
          </h4>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Bank Line
                  </th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                    Match
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    GL Entry
                  </th>
                  {!readOnly && (
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {bankLines
                  .filter((l) => l.match_status === 'matched')
                  .map((line) => (
                    <tr key={line.id}>
                      <td className="px-4 py-2 text-sm">
                        <div className="text-gray-900 dark:text-white">
                          {new Date(line.transaction_date).toLocaleDateString()}
                        </div>
                        <div className="text-gray-500 text-xs truncate max-w-[200px]">
                          {line.description}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <CheckCircle className="w-5 h-5 text-green-500 inline" />
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <div className="text-gray-900 dark:text-white">
                          ${Math.abs(line.amount).toFixed(2)}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {line.matched_gl_entry_id ? 'GL Entry Linked' : ''}
                        </div>
                      </td>
                      {!readOnly && (
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => handleUnmatch(line.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Unmatch"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
