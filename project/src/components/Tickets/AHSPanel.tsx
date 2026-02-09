import { useState, useEffect } from 'react';
import {
  Shield,
  DollarSign,
  Calendar,
  Hash,
  CheckCircle,
  Clock,
  Send,
  FileText,
  Loader2,
  History,
} from 'lucide-react';
import { AHSTicketService, AHSTicketData, AHSAuditEntry } from '../../services/AHSTicketService';
import { AHSInvoiceService, BillingBreakdown } from '../../services/AHSInvoiceService';
import { useAuth } from '../../contexts/AuthContext';

interface AHSPanelProps {
  ticketId: string;
  onUpdate?: () => void;
}

export function AHSPanel({ ticketId, onUpdate }: AHSPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ahsData, setAhsData] = useState<AHSTicketData | null>(null);
  const [diagnosisFeeExists, setDiagnosisFeeExists] = useState(false);
  const [diagnosisFeeAmount, setDiagnosisFeeAmount] = useState(0);
  const [billingBreakdown, setBillingBreakdown] = useState<BillingBreakdown | null>(null);
  const [auditLog, setAuditLog] = useState<AHSAuditEntry[]>([]);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [coveredAmount, setCoveredAmount] = useState('');
  const [editingRates, setEditingRates] = useState(false);
  const [rateForm, setRateForm] = useState({
    diagnosisFee: '',
    laborRate: '',
  });

  useEffect(() => {
    loadAHSData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  const loadAHSData = async () => {
    setLoading(true);
    try {
      const [ahsTicketData, diagnosisFee, breakdown, audit] = await Promise.all([
        AHSTicketService.getAHSTicketData(ticketId),
        AHSTicketService.getDiagnosisFee(ticketId),
        AHSInvoiceService.getTicketBillingBreakdown(ticketId),
        AHSTicketService.getTicketAuditLog(ticketId),
      ]);

      setAhsData(ahsTicketData);
      setDiagnosisFeeExists(diagnosisFee.exists);
      setDiagnosisFeeAmount(diagnosisFee.amount);
      setBillingBreakdown(breakdown);
      setAuditLog(audit);

      if (ahsTicketData) {
        setRateForm({
          diagnosisFee: ahsTicketData.diagnosisFeeAmount?.toString() || '',
          laborRate: ahsTicketData.laborRatePerHour?.toString() || '',
        });
      }
    } catch (error) {
      console.error('Error loading AHS data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteDiagnosis = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const result = await AHSTicketService.addDiagnosisFee(ticketId, user.id);
      if (result.success) {
        setDiagnosisFeeExists(true);
        setDiagnosisFeeAmount(result.amount);
        await loadAHSData();
        onUpdate?.();
      }
    } catch (error) {
      console.error('Error adding diagnosis fee:', error);
      alert('Failed to add diagnosis fee');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitToPortal = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await AHSTicketService.submitToAHSPortal(ticketId, user.id);
      await loadAHSData();
      onUpdate?.();
    } catch (error) {
      console.error('Error submitting to portal:', error);
      alert('Failed to submit to AHS portal');
    } finally {
      setSaving(false);
    }
  };

  const handleRecordAuthorization = async () => {
    if (!user?.id || !coveredAmount) return;
    const amount = parseFloat(coveredAmount);
    if (isNaN(amount) || amount < 0) {
      alert('Please enter a valid covered amount');
      return;
    }

    setSaving(true);
    try {
      await AHSTicketService.recordAHSAuthorization(ticketId, amount, user.id);
      setShowAuthModal(false);
      setCoveredAmount('');
      await loadAHSData();
      onUpdate?.();
    } catch (error) {
      console.error('Error recording authorization:', error);
      alert('Failed to record authorization');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateRates = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      await AHSTicketService.updateAHSTicketRates(
        ticketId,
        {
          diagnosisFee: rateForm.diagnosisFee ? parseFloat(rateForm.diagnosisFee) : undefined,
          laborRate: rateForm.laborRate ? parseFloat(rateForm.laborRate) : undefined,
        },
        user.id
      );
      setEditingRates(false);
      await loadAHSData();
      onUpdate?.();
    } catch (error) {
      console.error('Error updating rates:', error);
      alert('Failed to update rates');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAHSInvoice = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const result = await AHSInvoiceService.createAHSInvoice(ticketId, user.id);
      if (result.success) {
        alert(`AHS Invoice ${result.invoiceNumber} created successfully`);
        await loadAHSData();
        onUpdate?.();
      } else {
        alert(result.error || 'Failed to create AHS invoice');
      }
    } catch (error) {
      console.error('Error creating AHS invoice:', error);
      alert('Failed to create AHS invoice');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCustomerInvoice = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const result = await AHSInvoiceService.createCustomerInvoice(ticketId, user.id);
      if (result.success) {
        alert(`Customer Invoice ${result.invoiceNumber} created successfully`);
        await loadAHSData();
        onUpdate?.();
      } else {
        alert(result.error || 'Failed to create customer invoice');
      }
    } catch (error) {
      console.error('Error creating customer invoice:', error);
      alert('Failed to create customer invoice');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number | null) => {
    if (amount === null || amount === undefined) return '-';
    return `$${amount.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          <span className="ml-2 text-blue-600">Loading AHS data...</span>
        </div>
      </div>
    );
  }

  if (!ahsData) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Shield className="h-5 w-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-blue-900">AHS Warranty</h3>
        </div>
        <button
          onClick={() => setShowAuditLog(!showAuditLog)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
        >
          <History className="h-4 w-4 mr-1" />
          {showAuditLog ? 'Hide History' : 'Show History'}
        </button>
      </div>

      {/* Status Banner */}
      {ahsData.status === 'awaiting_ahs_authorization' && (
        <div className="mb-4 flex items-center bg-yellow-100 border border-yellow-300 rounded-md px-3 py-2">
          <Clock className="h-4 w-4 text-yellow-600 mr-2" />
          <span className="text-sm text-yellow-800">Awaiting AHS Authorization</span>
        </div>
      )}

      {/* Main Info Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-3">
          <div className="flex items-center">
            <Hash className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Dispatch #:</span>
            <span className="ml-2 text-sm font-medium">{ahsData.dispatchNumber || '-'}</span>
          </div>

          <div className="flex items-center">
            <Calendar className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Portal Submitted:</span>
            <span className="ml-2 text-sm">{formatDate(ahsData.portalSubmissionDate)}</span>
          </div>

          <div className="flex items-center">
            <CheckCircle className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Authorization Date:</span>
            <span className="ml-2 text-sm">{formatDate(ahsData.authorizationDate)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Covered Amount:</span>
            <span className="ml-2 text-sm font-medium text-green-600">
              {formatCurrency(ahsData.coveredAmount)}
            </span>
          </div>

          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Diagnosis Fee:</span>
            <span className="ml-2 text-sm">
              {diagnosisFeeExists ? (
                <span className="text-green-600">{formatCurrency(diagnosisFeeAmount)}</span>
              ) : (
                <span className="text-gray-400">Not added</span>
              )}
            </span>
          </div>

          <div className="flex items-center">
            <DollarSign className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-600">Labor Rate/hr:</span>
            <span className="ml-2 text-sm">{formatCurrency(ahsData.laborRatePerHour)}</span>
          </div>
        </div>
      </div>

      {/* Billing Breakdown */}
      {billingBreakdown && (billingBreakdown.ahsTotal > 0 || billingBreakdown.customerTotal > 0) && (
        <div className="mb-4 p-3 bg-white border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Billing Breakdown</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-600">AHS Total:</span>
              <span className="ml-2 font-medium text-blue-600">{formatCurrency(billingBreakdown.ahsTotal)}</span>
            </div>
            <div>
              <span className="text-gray-600">Customer Total:</span>
              <span className="ml-2 font-medium">{formatCurrency(billingBreakdown.customerTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Rate Editing */}
      {editingRates ? (
        <div className="mb-4 p-3 bg-white border border-blue-200 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Edit Rates</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Diagnosis Fee</label>
              <input
                type="number"
                step="0.01"
                value={rateForm.diagnosisFee}
                onChange={(e) => setRateForm({ ...rateForm, diagnosisFee: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Labor Rate/Hour</label>
              <input
                type="number"
                step="0.01"
                value={rateForm.laborRate}
                onChange={(e) => setRateForm({ ...rateForm, laborRate: e.target.value })}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
              />
            </div>
          </div>
          <div className="flex justify-end mt-2 space-x-2">
            <button
              onClick={() => setEditingRates(false)}
              className="text-xs px-2 py-1 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateRates}
              disabled={saving}
              className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Rates'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setEditingRates(true)}
          className="text-xs text-blue-600 hover:text-blue-800 mb-4"
        >
          Edit Rates
        </button>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleCompleteDiagnosis}
          disabled={saving || diagnosisFeeExists}
          className={`flex items-center justify-center px-3 py-2 text-sm rounded-md ${
            diagnosisFeeExists
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          {diagnosisFeeExists ? (
            <>
              <CheckCircle className="h-4 w-4 mr-1" />
              Diagnosis Complete
            </>
          ) : (
            <>
              <DollarSign className="h-4 w-4 mr-1" />
              Complete Diagnosis
            </>
          )}
        </button>

        <button
          onClick={handleSubmitToPortal}
          disabled={saving || ahsData.portalSubmissionDate !== null}
          className={`flex items-center justify-center px-3 py-2 text-sm rounded-md ${
            ahsData.portalSubmissionDate
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          <Send className="h-4 w-4 mr-1" />
          {ahsData.portalSubmissionDate ? 'Submitted' : 'Submit to AHS Portal'}
        </button>

        <button
          onClick={() => setShowAuthModal(true)}
          disabled={saving || !ahsData.portalSubmissionDate || ahsData.authorizationDate !== null}
          className={`flex items-center justify-center px-3 py-2 text-sm rounded-md ${
            !ahsData.portalSubmissionDate || ahsData.authorizationDate
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-yellow-600 text-white hover:bg-yellow-700'
          }`}
        >
          <Shield className="h-4 w-4 mr-1" />
          {ahsData.authorizationDate ? 'Authorized' : 'Record Authorization'}
        </button>

        <button
          onClick={handleCreateAHSInvoice}
          disabled={saving}
          className="flex items-center justify-center px-3 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          <FileText className="h-4 w-4 mr-1" />
          Create AHS Invoice
        </button>

        <button
          onClick={handleCreateCustomerInvoice}
          disabled={saving}
          className="flex items-center justify-center col-span-2 px-3 py-2 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
        >
          <FileText className="h-4 w-4 mr-1" />
          Create Customer Invoice
        </button>
      </div>

      {/* Authorization Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Record AHS Authorization</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Covered Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={coveredAmount}
                  onChange={(e) => setCoveredAmount(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setCoveredAmount('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordAuthorization}
                disabled={saving || !coveredAmount}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Record Authorization'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {showAuditLog && auditLog.length > 0 && (
        <div className="mt-4 border-t border-blue-200 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Activity History</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {auditLog.map((entry) => (
              <div key={entry.id} className="text-xs bg-white p-2 rounded border border-gray-200">
                <div className="flex justify-between">
                  <span className="font-medium">
                    {AHSTicketService.getActionDisplayName(entry.action)}
                  </span>
                  <span className="text-gray-500">{formatDate(entry.performedAt)}</span>
                </div>
                <div className="text-gray-600">{entry.performedBy}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
