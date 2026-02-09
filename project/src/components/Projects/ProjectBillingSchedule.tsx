import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, Clock, Plus, FileText, AlertTriangle, type LucideIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { MilestoneInvoiceService } from '../../services/MilestoneInvoiceService';

interface BillingSchedule {
  id: string;
  project_id: string;
  sequence: number;
  name: string;
  description: string | null;
  billing_type: 'fixed_amount' | 'percent_of_contract';
  amount: number | null;
  percent_of_contract: number | null;
  is_deposit: boolean;
  is_retainage: boolean;
  status: 'planned' | 'ready_to_bill' | 'billed' | 'partially_billed' | 'cancelled';
  target_event: string | null;
  target_date: string | null;
  invoice_id: string | null;
  billed_amount: number;
  created_at: string;
}

interface ProjectBillingScheduleProps {
  projectId: string;
  contractValue: number | null;
  customerId?: string;
}

interface Project {
  id: string;
  customer_id: string;
}

export function ProjectBillingSchedule({ projectId, contractValue, customerId }: ProjectBillingScheduleProps) {
  const { profile } = useAuth();
  const [schedules, setSchedules] = useState<BillingSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingMilestone, setBillingMilestone] = useState<BillingSchedule | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [_showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadBillingSchedules();
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, customer_id')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error('Error loading project:', error);
    }
  };

  const loadBillingSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('project_billing_schedules')
        .select('*')
        .eq('project_id', projectId)
        .order('sequence');

      if (error) throw error;
      setSchedules((data as BillingSchedule[]) || []);
    } catch (error) {
      console.error('Error loading billing schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAmount = (schedule: BillingSchedule): number => {
    if (schedule.billing_type === 'fixed_amount' && schedule.amount) {
      return schedule.amount;
    } else if (schedule.billing_type === 'percent_of_contract' && schedule.percent_of_contract && contractValue) {
      return (contractValue * schedule.percent_of_contract) / 100;
    }
    return 0;
  };

  const handleStatusChange = async (scheduleId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('project_billing_schedules')
        .update({
          status: newStatus as 'planned' | 'ready_to_bill' | 'billed' | 'partially_billed' | 'cancelled',
          updated_by: profile?.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (error) throw error;
      loadBillingSchedules();
    } catch (error) {
      console.error('Error updating milestone status:', error);
      alert('Failed to update milestone status');
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; icon: LucideIcon }> = {
      planned: { className: 'badge badge-gray', icon: Clock },
      ready_to_bill: { className: 'badge badge-blue', icon: AlertTriangle },
      billed: { className: 'badge badge-green', icon: CheckCircle },
      partially_billed: { className: 'badge badge-yellow', icon: Clock },
      cancelled: { className: 'badge badge-red', icon: AlertTriangle },
    };
    const config = badges[status] || badges.planned;
    const Icon = config.icon;
    return (
      <span className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  const getMilestoneTypeLabel = (schedule: BillingSchedule) => {
    if (schedule.is_deposit) return <span className="text-xs px-2 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 rounded">Deposit</span>;
    if (schedule.is_retainage) return <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">Retainage</span>;
    return <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">Progress</span>;
  };

  const totalScheduled = schedules.reduce((sum, s) => sum + calculateAmount(s), 0);
  const totalBilled = schedules.reduce((sum, s) => sum + s.billed_amount, 0);
  const percentScheduled = contractValue ? (totalScheduled / contractValue) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Contract Value</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {formatCurrency(contractValue)}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Scheduled Billing</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">
            {formatCurrency(totalScheduled)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {percentScheduled.toFixed(1)}% of contract
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Already Billed</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">
            {formatCurrency(totalBilled)}
          </p>
        </div>

        <div className="card p-4">
          <p className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wide">Remaining</p>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">
            {formatCurrency((contractValue || 0) - totalBilled)}
          </p>
        </div>
      </div>

      {percentScheduled > 105 && (
        <div className="card p-4 bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500">
          <div className="flex items-start">
            <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3 mt-0.5" />
            <div>
              <p className="font-medium text-orange-900 dark:text-orange-100">Over-scheduled</p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                Total scheduled milestones ({formatCurrency(totalScheduled)}) exceed contract value by{' '}
                {formatCurrency(totalScheduled - (contractValue || 0))}.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Billing Milestones
            </h3>
            <button
              onClick={() => setShowNewModal(true)}
              className="btn btn-primary btn-sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Milestone
            </button>
          </div>
        </div>

        {schedules.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No billing milestones defined
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Set up a billing schedule to track progress payments and deposits.
            </p>
            <button
              onClick={() => setShowNewModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create First Milestone
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Milestone</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Target</th>
                  <th>Status</th>
                  <th>Billed</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule) => (
                  <tr key={schedule.id}>
                    <td>{schedule.sequence}</td>
                    <td>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {schedule.name}
                        </div>
                        {schedule.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {schedule.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{getMilestoneTypeLabel(schedule)}</td>
                    <td>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(calculateAmount(schedule))}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {schedule.billing_type === 'percent_of_contract'
                          ? `${schedule.percent_of_contract}%`
                          : 'Fixed'}
                      </div>
                    </td>
                    <td>
                      {schedule.target_event && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {schedule.target_event}
                        </div>
                      )}
                      {schedule.target_date && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(schedule.target_date)}
                        </div>
                      )}
                    </td>
                    <td>{getStatusBadge(schedule.status)}</td>
                    <td>
                      {schedule.billed_amount > 0 ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {formatCurrency(schedule.billed_amount)}
                        </span>
                      ) : (
                        <span className="text-gray-400">$0.00</span>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {schedule.status === 'planned' && (
                          <button
                            onClick={() => handleStatusChange(schedule.id, 'ready_to_bill')}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            Mark Ready
                          </button>
                        )}
                        {schedule.status === 'ready_to_bill' && (
                          <button
                            onClick={() => setBillingMilestone(schedule)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 text-sm flex items-center"
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            Bill
                          </button>
                        )}
                        {schedule.invoice_id && (
                          <a
                            href={`#/invoices/${schedule.invoice_id}`}
                            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 text-sm"
                          >
                            View Invoice
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 dark:bg-gray-800">
                  <td colSpan={3} className="text-right font-medium">Total:</td>
                  <td className="font-bold">{formatCurrency(totalScheduled)}</td>
                  <td colSpan={2}></td>
                  <td className="font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(totalBilled)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {billingMilestone && project && (
        <BillMilestoneModal
          milestone={billingMilestone}
          projectId={projectId}
          customerId={customerId || project.customer_id}
          contractValue={contractValue}
          onClose={() => setBillingMilestone(null)}
          onSuccess={() => {
            setBillingMilestone(null);
            loadBillingSchedules();
          }}
        />
      )}
    </div>
  );
}

interface BillMilestoneModalProps {
  milestone: BillingSchedule;
  projectId: string;
  customerId: string;
  contractValue: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

function BillMilestoneModal({
  milestone,
  projectId,
  customerId,
  contractValue,
  onClose,
  onSuccess
}: BillMilestoneModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null);

  useEffect(() => {
    validateMilestone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [milestone.id]);

  const validateMilestone = async () => {
    try {
      const result = await MilestoneInvoiceService.validateMilestoneForBilling(milestone.id);
      setValidation(result);
    } catch (error) {
      console.error('Error validating milestone:', error);
    }
  };

  const calculateAmount = (): number => {
    if (milestone.billing_type === 'fixed_amount' && milestone.amount) {
      return milestone.amount;
    } else if (milestone.billing_type === 'percent_of_contract' && milestone.percent_of_contract && contractValue) {
      return (contractValue * milestone.percent_of_contract) / 100;
    }
    return 0;
  };

  const handleCreateInvoice = async () => {
    if (!profile) {
      alert('You must be logged in to create an invoice');
      return;
    }

    if (validation && !validation.valid) {
      alert('Cannot bill this milestone: ' + validation.errors.join(', '));
      return;
    }

    setLoading(true);
    try {
      const invoice = await MilestoneInvoiceService.createInvoiceFromMilestone({
        milestoneId: milestone.id,
        projectId: projectId,
        customerId: customerId,
        createdBy: profile.id
      });

      alert(`Invoice ${invoice.invoice_number} created successfully!`);
      onSuccess();
    } catch (error: unknown) {
      console.error('Error creating invoice:', error);
      alert(`Failed to create invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const amount = calculateAmount();
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bill Milestone
          </h2>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Milestone</label>
            <p className="text-lg font-semibold text-gray-900 dark:text-white mt-1">{milestone.name}</p>
            {milestone.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{milestone.description}</p>
            )}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-blue-700 dark:text-blue-300">Invoice Amount</span>
              <span className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(amount)}
              </span>
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              {milestone.billing_type === 'percent_of_contract'
                ? `${milestone.percent_of_contract}% of contract value`
                : 'Fixed amount'}
            </div>
          </div>

          {milestone.is_deposit && (
            <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900 dark:text-orange-100">Deposit Invoice</p>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    This amount will be posted to Contract Liability (unearned revenue) until the work is performed and the deposit is released.
                  </p>
                </div>
              </div>
            </div>
          )}

          {milestone.is_retainage && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500 p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-purple-600 dark:text-purple-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">Retainage Invoice</p>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    This amount represents retained funds to be invoiced upon project completion.
                  </p>
                </div>
              </div>
            </div>
          )}

          {validation && validation.warnings.length > 0 && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-900 dark:text-yellow-100">Warnings</p>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 mt-1 list-disc list-inside">
                    {validation.warnings.map((warning, idx) => (
                      <li key={idx}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {validation && validation.errors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4">
              <div className="flex items-start">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900 dark:text-red-100">Errors</p>
                  <ul className="text-sm text-red-700 dark:text-red-300 mt-1 list-disc list-inside">
                    {validation.errors.map((error, idx) => (
                      <li key={idx}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p>An invoice will be created in draft status. You can review and send it from the Invoicing screen.</p>
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
            onClick={handleCreateInvoice}
            className="btn btn-primary flex-1"
            disabled={loading || (validation ? !validation.valid : false)}
          >
            {loading ? 'Creating Invoice...' : 'Create Invoice'}
          </button>
        </div>
      </div>
    </div>
  );
}
