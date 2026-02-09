import { useState, useEffect } from 'react';
import { DollarSign, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MilestoneInvoiceService } from '../../services/MilestoneInvoiceService';

interface DepositReleasePanelProps {
  projectId: string;
}

interface DepositSummary {
  contract_value: number;
  billed_to_date: number;
  deposits_billed: number;
  deposits_unreleased: number;
  revenue_recognized: number;
  unbilled_amount: number;
}

interface DepositRelease {
  id: string;
  release_amount: number;
  release_date: string;
  release_reason: string;
  gl_posted: boolean;
  created_at: string;
}

export function DepositReleasePanel({ projectId }: DepositReleasePanelProps) {
  useAuth();
  const [summary, setSummary] = useState<DepositSummary | null>(null);
  const [releases, setReleases] = useState<DepositRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReleaseModal, setShowReleaseModal] = useState(false);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadData = async () => {
    try {
      const depositSummary = await MilestoneInvoiceService.getProjectDepositSummary(projectId);
      setSummary(depositSummary as DepositSummary);

      const { data: releasesData, error: releasesError } = await supabase
        .from('project_deposit_releases')
        .select('*')
        .eq('project_id', projectId)
        .order('release_date', { ascending: false });

      if (releasesError) throw releasesError;
      setReleases((releasesData as DepositRelease[]) || []);
    } catch (error) {
      console.error('Error loading deposit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="card p-6 text-center">
        <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 dark:text-gray-400">Unable to load deposit information</p>
      </div>
    );
  }

  const hasDeposits = summary.deposits_billed > 0;
  const hasUnreleasedDeposits = summary.deposits_unreleased > 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Deposits Billed
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                {formatCurrency(summary.deposits_billed)}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 p-3 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Released to Revenue
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
                {formatCurrency(summary.deposits_billed - summary.deposits_unreleased)}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                Unreleased (Liability)
              </p>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
                {formatCurrency(summary.deposits_unreleased)}
              </p>
            </div>
            <div className="bg-orange-100 dark:bg-orange-900/20 p-3 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {!hasDeposits && (
        <div className="card p-8 text-center">
          <DollarSign className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No deposit invoices for this project</p>
        </div>
      )}

      {hasDeposits && hasUnreleasedDeposits && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Deposit Management
            </h3>
            <button
              onClick={() => setShowReleaseModal(true)}
              className="btn btn-primary btn-sm"
            >
              Release Deposit
            </button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-start">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Deposit Available for Release
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  You have {formatCurrency(summary.deposits_unreleased)} in unearned revenue that can be
                  released to revenue as work is performed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {releases.length > 0 && (
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Deposit Release History
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Reason</th>
                  <th>GL Status</th>
                </tr>
              </thead>
              <tbody>
                {releases.map((release) => (
                  <tr key={release.id}>
                    <td>{formatDate(release.release_date)}</td>
                    <td className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(release.release_amount)}
                    </td>
                    <td className="text-sm text-gray-600 dark:text-gray-400">
                      {release.release_reason}
                    </td>
                    <td>
                      {release.gl_posted ? (
                        <span className="badge badge-green">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Posted
                        </span>
                      ) : (
                        <span className="badge badge-gray">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showReleaseModal && summary && (
        <ReleaseDepositModal
          projectId={projectId}
          maxAmount={summary.deposits_unreleased}
          onClose={() => setShowReleaseModal(false)}
          onSuccess={() => {
            setShowReleaseModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

interface ReleaseDepositModalProps {
  projectId: string;
  maxAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

function ReleaseDepositModal({
  projectId,
  maxAmount,
  onClose,
  onSuccess
}: ReleaseDepositModalProps) {
  const { profile } = useAuth();
  const [releaseAmount, setReleaseAmount] = useState<string>(maxAmount.toString());
  const [releaseReason, setReleaseReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRelease = async () => {
    if (!profile) {
      alert('You must be logged in to release deposits');
      return;
    }

    const amount = parseFloat(releaseAmount);
    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (amount > maxAmount) {
      alert(`Amount cannot exceed ${formatCurrency(maxAmount)}`);
      return;
    }

    if (!releaseReason.trim()) {
      alert('Please provide a reason for the release');
      return;
    }

    setLoading(true);
    try {
      await MilestoneInvoiceService.releaseDeposit({
        projectId: projectId,
        releaseAmount: amount,
        releaseReason: releaseReason,
        createdBy: profile.id
      });

      alert(`Deposit of ${formatCurrency(amount)} released successfully!`);
      onSuccess();
    } catch (error: unknown) {
      console.error('Error releasing deposit:', error);
      alert(`Failed to release deposit: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Release Deposit to Revenue
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Maximum amount available: <span className="font-bold">{formatCurrency(maxAmount)}</span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Release Amount *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={releaseAmount}
                onChange={(e) => setReleaseAmount(e.target.value)}
                className="input pl-8"
                min="0"
                max={maxAmount}
                step="0.01"
                required
              />
            </div>
            <button
              type="button"
              onClick={() => setReleaseAmount(maxAmount.toString())}
              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
            >
              Release full amount
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Reason for Release *
            </label>
            <textarea
              value={releaseReason}
              onChange={(e) => setReleaseReason(e.target.value)}
              className="input"
              rows={3}
              placeholder="E.g., Work completed for System Online milestone"
              required
            />
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border-l-4 border-yellow-500">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
              <div className="text-sm text-yellow-700 dark:text-yellow-300">
                <p className="font-medium">This action will:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Reduce Contract Liability (Account 2350)</li>
                  <li>Increase Project Revenue (Account 4100)</li>
                  <li>Create a journal entry in the GL</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex space-x-3 p-6 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="btn btn-outline flex-1"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleRelease}
            className="btn btn-primary flex-1"
            disabled={loading}
          >
            {loading ? 'Releasing...' : 'Release Deposit'}
          </button>
        </div>
      </div>
    </div>
  );
}
