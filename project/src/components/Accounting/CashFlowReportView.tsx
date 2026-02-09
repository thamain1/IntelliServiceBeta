import { useEffect, useState, useCallback } from 'react';
import { Calendar, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { CashFlowService, CashFlowStatement } from '../../services/CashFlowService';

interface CashFlowReportViewProps {
  onExportPDF?: () => void;
}

export function CashFlowReportView({ onExportPDF }: CashFlowReportViewProps) {
  const [loading, setLoading] = useState(true);
  const [statement, setStatement] = useState<CashFlowStatement | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    setStartDate(firstDayOfMonth.toISOString().split('T')[0]);
    setEndDate(lastDayOfMonth.toISOString().split('T')[0]);
  }, []);

  const loadCashFlowStatement = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await CashFlowService.getCashFlowStatement(startDate, endDate);
      setStatement(data);
    } catch (err: unknown) {
      console.error('Error loading cash flow statement:', err);
      setError(err instanceof Error ? err.message : 'Failed to load cash flow statement');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    if (startDate && endDate) {
      loadCashFlowStatement();
    }
  }, [startDate, endDate, loadCashFlowStatement]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const reconciliationCheck = statement
    ? Math.abs(
        statement.beginning_cash + statement.net_change - statement.ending_cash
      )
    : 0;
  const isReconciled = reconciliationCheck < 0.01;

  if (loading) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading cash flow statement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-6">
        <div className="flex items-center justify-center py-12 text-red-600">
          <AlertCircle className="w-8 h-8 mr-3" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!statement) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">From:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input input-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">To:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input input-sm"
              />
            </div>
            <button
              onClick={loadCashFlowStatement}
              className="btn btn-outline btn-sm flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="btn btn-primary btn-sm flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          )}
        </div>
      </div>

      <div className="card p-8">
        <div className="text-center mb-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dunaway Heating & Cooling
          </h3>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Cash Flow Statement</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(statement.start_date)} to {formatDate(statement.end_date)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">(Direct Method)</p>
        </div>

        <div className="space-y-8">
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-gray-300 dark:border-gray-600">
              {statement.operating.title}
            </h4>
            <table className="w-full">
              <tbody>
                {statement.operating.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 text-gray-700 dark:text-gray-300 pl-4">
                      {item.description}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                {statement.operating.items.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-gray-500 dark:text-gray-400 italic">
                      No operating cash flows in this period
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                  <td className="py-3 text-gray-900 dark:text-white pl-4">
                    Net cash from operating activities
                  </td>
                  <td className={`py-3 text-right ${statement.operating.subtotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(statement.operating.subtotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-gray-300 dark:border-gray-600">
              {statement.investing.title}
            </h4>
            <table className="w-full">
              <tbody>
                {statement.investing.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 text-gray-700 dark:text-gray-300 pl-4">
                      {item.description}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                {statement.investing.items.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-gray-500 dark:text-gray-400 italic">
                      No investing cash flows in this period
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                  <td className="py-3 text-gray-900 dark:text-white pl-4">
                    Net cash from investing activities
                  </td>
                  <td className={`py-3 text-right ${statement.investing.subtotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(statement.investing.subtotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b-2 border-gray-300 dark:border-gray-600">
              {statement.financing.title}
            </h4>
            <table className="w-full">
              <tbody>
                {statement.financing.items.map((item, idx) => (
                  <tr key={idx} className="border-b border-gray-200 dark:border-gray-700">
                    <td className="py-2 text-gray-700 dark:text-gray-300 pl-4">
                      {item.description}
                    </td>
                    <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                      {formatCurrency(item.amount)}
                    </td>
                  </tr>
                ))}
                {statement.financing.items.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-gray-500 dark:text-gray-400 italic">
                      No financing cash flows in this period
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 font-bold">
                  <td className="py-3 text-gray-900 dark:text-white pl-4">
                    Net cash from financing activities
                  </td>
                  <td className={`py-3 text-right ${statement.financing.subtotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(statement.financing.subtotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {statement.unclassified_amount !== 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Unclassified Cash Flows
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    {formatCurrency(statement.unclassified_amount)} in cash flows could not be automatically classified.
                    These may be internal transfers or require manual review.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border-2 border-gray-300 dark:border-gray-600">
            <table className="w-full">
              <tbody>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <td className="py-2 text-gray-900 dark:text-white font-semibold">
                    Net increase (decrease) in cash
                  </td>
                  <td className={`py-2 text-right font-bold text-lg ${statement.net_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(statement.net_change)}
                  </td>
                </tr>
                <tr className="border-b border-gray-300 dark:border-gray-600">
                  <td className="py-2 text-gray-700 dark:text-gray-300">
                    Cash at beginning of period
                  </td>
                  <td className="py-2 text-right font-medium text-gray-900 dark:text-white">
                    {formatCurrency(statement.beginning_cash)}
                  </td>
                </tr>
                <tr className="border-t-2 border-gray-400 dark:border-gray-500">
                  <td className="py-3 text-gray-900 dark:text-white font-bold text-lg">
                    Cash at end of period
                  </td>
                  <td className="py-3 text-right font-bold text-xl text-blue-600">
                    {formatCurrency(statement.ending_cash)}
                  </td>
                </tr>
              </tbody>
            </table>

            {!isReconciled && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300">
                    Reconciliation difference: {formatCurrency(reconciliationCheck)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
