import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, FileText, Calendar, DollarSign, Clock, AlertCircle, Loader } from 'lucide-react';

interface EstimatePortalProps {
  token: string;
}

export function EstimatePortalView({ token }: EstimatePortalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [estimate, setEstimate] = useState<Record<string, unknown> | null>(null);
  const [linkInfo, setLinkInfo] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDecisionForm, setShowDecisionForm] = useState(false);
  const [decisionType, setDecisionType] = useState<'accepted' | 'rejected'>('accepted');
  const [decidedName, setDecidedName] = useState('');
  const [comment, setComment] = useState('');
  const [confirmChecked, setConfirmChecked] = useState(false);

  useEffect(() => {
    loadEstimate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const loadEstimate = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-portal?token=${encodeURIComponent(token)}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load estimate');
      }

      setEstimate(data.estimate);
      setLinkInfo(data.link);
    } catch (err) {
      console.error('Error loading estimate:', err);
      setError(err instanceof Error ? err.message : 'Failed to load estimate');
    } finally {
      setLoading(false);
    }
  };

  const handleDecision = async () => {
    if (!decidedName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!confirmChecked) {
      setError('Please confirm your decision');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/estimate-decision`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token,
            decision: decisionType,
            decided_name: decidedName,
            comment: comment || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit decision');
      }

      await loadEstimate();
      setShowDecisionForm(false);
      setDecidedName('');
      setComment('');
      setConfirmChecked(false);
    } catch (err) {
      console.error('Error submitting decision:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit decision');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <div className="text-gray-600 dark:text-gray-400">Loading estimate...</div>
        </div>
      </div>
    );
  }

  if (error && !estimate) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            Unable to Load Estimate
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  const alreadyDecided = linkInfo?.decision;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Estimate {estimate?.estimate_number}
                </h1>
                <p className="text-blue-100">
                  {estimate?.customer_name}
                </p>
              </div>
              <FileText className="w-16 h-16 text-white opacity-50" />
            </div>
          </div>

          {alreadyDecided && (
            <div className={`px-8 py-4 ${linkInfo.decision === 'accepted' ? 'bg-green-50 dark:bg-green-900/20 border-b border-green-200 dark:border-green-800' : 'bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800'}`}>
              <div className="flex items-center">
                {linkInfo.decision === 'accepted' ? (
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" />
                )}
                <div>
                  <div className={`font-semibold ${linkInfo.decision === 'accepted' ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'}`}>
                    This estimate has been {linkInfo.decision}
                  </div>
                  <div className={`text-sm ${linkInfo.decision === 'accepted' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                    By {linkInfo.decided_name} on {new Date(linkInfo.decided_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {estimate?.job_title}
              </h2>
              {estimate?.job_description && (
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                  {estimate.job_description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                <Calendar className="w-5 h-5" />
                <div>
                  <div className="text-sm">Estimate Date</div>
                  <div className="font-semibold text-gray-900 dark:text-white">
                    {new Date(estimate?.estimate_date).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {estimate?.expiration_date && (
                <div className="flex items-center space-x-3 text-gray-600 dark:text-gray-400">
                  <Clock className="w-5 h-5" />
                  <div>
                    <div className="text-sm">Valid Until</div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {new Date(estimate.expiration_date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Line Items
              </h3>
              <div className="space-y-2">
                {(estimate?.line_items as Array<Record<string, unknown>> | undefined)?.map((item: Record<string, unknown>, index: number) => (
                  <div
                    key={(item.id as string) || index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {item.description as string}
                      </div>
                      {item.quantity && item.unit_price && (
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {item.quantity as number} × ${Number(item.unit_price).toFixed(2)}
                        </div>
                      )}
                    </div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      ${Number(item.line_total).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                  <span>Subtotal:</span>
                  <span className="font-medium">${Number(estimate?.subtotal || 0).toFixed(2)}</span>
                </div>
                {estimate?.discount_amount > 0 && (
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span>Discount:</span>
                    <span className="font-medium text-green-600">-${Number(estimate.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                {estimate?.tax_amount > 0 && (
                  <div className="flex items-center justify-between text-gray-600 dark:text-gray-400">
                    <span>Tax ({estimate.tax_rate}%):</span>
                    <span className="font-medium">${Number(estimate.tax_amount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-2xl font-bold text-gray-900 dark:text-white pt-4 border-t border-gray-300 dark:border-gray-600">
                  <span className="flex items-center">
                    <DollarSign className="w-6 h-6 mr-1" />
                    Total:
                  </span>
                  <span>${Number(estimate?.total_amount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {estimate?.notes && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Notes</h4>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-sm">
                  {estimate.notes}
                </p>
              </div>
            )}

            {estimate?.terms_and_conditions && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Terms & Conditions</h4>
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap text-sm">
                  {estimate.terms_and_conditions}
                </p>
              </div>
            )}

            {!alreadyDecided && !showDecisionForm && (
              <div className="flex items-center justify-center space-x-4 pt-6">
                <button
                  onClick={() => {
                    setDecisionType('accepted');
                    setShowDecisionForm(true);
                    setError(null);
                  }}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Accept Estimate</span>
                </button>
                <button
                  onClick={() => {
                    setDecisionType('rejected');
                    setShowDecisionForm(true);
                    setError(null);
                  }}
                  className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                  <span>Decline Estimate</span>
                </button>
              </div>
            )}

            {showDecisionForm && !alreadyDecided && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {decisionType === 'accepted' ? 'Accept' : 'Decline'} Estimate
                </h3>

                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded flex items-start">
                    <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={decidedName}
                    onChange={(e) => setDecidedName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Comment (Optional)
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={3}
                    placeholder="Add any comments or notes..."
                  />
                </div>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmChecked}
                    onChange={(e) => setConfirmChecked(e.target.checked)}
                    className="mt-1 rounded"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    I confirm that I want to {decisionType === 'accepted' ? 'accept' : 'decline'} this estimate.
                    {decisionType === 'accepted' && ' This indicates my intention to proceed with the proposed work.'}
                  </span>
                </label>

                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowDecisionForm(false);
                      setError(null);
                      setDecidedName('');
                      setComment('');
                      setConfirmChecked(false);
                    }}
                    disabled={submitting}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDecision}
                    disabled={submitting || !decidedName.trim() || !confirmChecked}
                    className={`px-6 py-2 ${
                      decisionType === 'accepted'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2`}
                  >
                    {submitting ? (
                      <>
                        <Loader className="w-4 h-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        {decisionType === 'accepted' ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : (
                          <XCircle className="w-4 h-4" />
                        )}
                        <span>Confirm {decisionType === 'accepted' ? 'Accept' : 'Decline'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>If you have any questions about this estimate, please contact us.</p>
        </div>
      </div>
    </div>
  );
}
