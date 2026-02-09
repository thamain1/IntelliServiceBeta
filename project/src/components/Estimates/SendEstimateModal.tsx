import { useState, useEffect } from 'react';
import { X, Mail, MessageSquare, Send, CheckCircle, AlertCircle, Clock, Eye, Copy, ExternalLink } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SendEstimateModalProps {
  estimateId: string;
  estimateNumber: string;
  customerId: string;
  customerEmail: string | null;
  customerPhone: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface CustomerContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  is_primary: boolean;
}

interface DeliveryAttempt {
  id: string;
  channel: string;
  to_address: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  error: string | null;
}

export function SendEstimateModal({
  estimateId,
  estimateNumber,
  customerId,
  customerEmail,
  customerPhone,
  isOpen,
  onClose,
  onSuccess,
}: SendEstimateModalProps) {
  const [sending, setSending] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendSMS, setSendSMS] = useState(false);
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [deliveryHistory, setDeliveryHistory] = useState<DeliveryAttempt[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Clear previous state
      setPortalUrl(null);
      setDeliveryHistory([]);
      setError(null);
      setSuccess(null);
      setCopied(false);

      // Load fresh data
      loadContacts();
      loadDeliveryHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, estimateId]);

  const loadContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_contacts')
        .select('*')
        .eq('customer_id', customerId)
        .eq('receive_estimates', true)
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setContacts((data as unknown as CustomerContact[]) || []);

      if (data && data.length > 0 && data[0].is_primary) {
        setSelectedContactId(data[0].id);
      }
    } catch (err) {
      console.error('Error loading contacts:', err);
    }
  };

  const loadDeliveryHistory = async () => {
    try {
      const { data: links } = await supabase
        .from('estimate_public_links')
        .select('id, token, expires_at')
        .eq('estimate_id', estimateId)
        .order('created_at', { ascending: false });

      if (!links || links.length === 0) {
        setDeliveryHistory([]);
        setPortalUrl(null);
        return;
      }

      // Set the portal URL from the most recent active link that has a token
      const activeLink = links.find(link =>
        link.token && (!link.expires_at || new Date(link.expires_at) > new Date())
      ) || links.find(link => link.token);

      if (activeLink && activeLink.token) {
        const url = `${window.location.origin}/estimate-portal/${activeLink.token}`;
        setPortalUrl(url);
      } else {
        setPortalUrl(null);
      }

      const linkIds = links.map(l => l.id);

      const { data, error } = await supabase
        .from('estimate_delivery_attempts')
        .select('*')
        .in('link_id', linkIds)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setDeliveryHistory((data || []).map(d => ({
        id: d.id,
        channel: d.channel,
        to_address: d.to_address,
        status: d.status,
        created_at: d.created_at || '',
        sent_at: d.sent_at || null,
        error: d.error || null,
      })));
    } catch (err) {
      console.error('Error loading delivery history:', err);
    }
  };

  const handleSend = async () => {
    if (!sendEmail && !sendSMS) {
      setError('Please select at least one delivery method');
      return;
    }

    try {
      setSending(true);
      setError(null);
      setSuccess(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-estimate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            estimate_id: estimateId,
            customer_id: customerId,
            contact_id: selectedContactId,
            send_email: sendEmail,
            send_sms: sendSMS,
            expiration_days: 30,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send estimate');
      }

      setSuccess(result.message || 'Estimate sent successfully!');
      setPortalUrl(result.portal_url);
      loadDeliveryHistory();
      onSuccess();

      // Don't auto-close so user can copy the portal URL
    } catch (err) {
      console.error('Error sending estimate:', err);
      setError(err instanceof Error ? err.message : 'Failed to send estimate');
    } finally {
      setSending(false);
    }
  };

  const handleCopyUrl = () => {
    if (portalUrl) {
      navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenPortal = () => {
    if (portalUrl) {
      window.open(portalUrl, '_blank');
    }
  };

  if (!isOpen) return null;

  const selectedContact = contacts.find(c => c.id === selectedContactId);
  const effectiveEmail = selectedContact?.email || customerEmail;
  const effectivePhone = selectedContact?.phone || selectedContact?.mobile || customerPhone;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Send Estimate {estimateNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded">
              <div className="flex items-start">
                <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium">{success}</div>
                </div>
              </div>
            </div>
          )}

          {portalUrl ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-4 rounded">
              <div className="space-y-3">
                <div className="flex items-center text-blue-700 dark:text-blue-400">
                  <Eye className="w-5 h-5 mr-2 flex-shrink-0" />
                  <div className="font-medium">Customer Portal Link</div>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white dark:bg-gray-900 px-3 py-2 rounded text-xs break-all border border-blue-300 dark:border-blue-700 text-gray-900 dark:text-gray-100">
                    {portalUrl}
                  </code>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyUrl}
                    className="btn btn-sm bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-gray-700"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copy Link
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleOpenPortal}
                    className="btn btn-sm bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-gray-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open Portal
                  </button>
                </div>
              </div>
            </div>
          ) : deliveryHistory.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-4 py-3 rounded">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-medium mb-1">Portal Link Not Available</div>
                  <div className="text-sm">
                    This estimate was sent before portal links were enabled. Send the estimate again below to generate a new portal link.
                  </div>
                </div>
              </div>
            </div>
          )}

          {contacts.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Send To Contact
              </label>
              <select
                value={selectedContactId || ''}
                onChange={(e) => setSelectedContactId(e.target.value || null)}
                className="input"
              >
                <option value="">Default (Customer Record)</option>
                {contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} {contact.is_primary ? '(Primary)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Delivery Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  disabled={!effectiveEmail}
                  className="rounded"
                />
                <Mail className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">Email</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {effectiveEmail || 'No email available'}
                  </div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendSMS}
                  onChange={(e) => setSendSMS(e.target.checked)}
                  disabled={!effectivePhone}
                  className="rounded"
                />
                <MessageSquare className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">SMS</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {effectivePhone || 'No phone available'}
                  </div>
                </div>
              </label>
            </div>
          </div>

          {deliveryHistory.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Delivery History
              </h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {deliveryHistory.map((attempt) => (
                  <div
                    key={attempt.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded"
                  >
                    <div className="flex items-center space-x-3">
                      {attempt.channel === 'email' ? (
                        <Mail className="w-4 h-4 text-gray-500" />
                      ) : (
                        <MessageSquare className="w-4 h-4 text-gray-500" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {attempt.to_address}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(attempt.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {attempt.status === 'sent' ? (
                        <span className="badge badge-success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Sent
                        </span>
                      ) : attempt.status === 'failed' ? (
                        <span className="badge badge-error" title={attempt.error || undefined}>
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Failed
                        </span>
                      ) : (
                        <span className="badge badge-gray">
                          <Clock className="w-3 h-3 mr-1" />
                          {attempt.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="btn btn-outline"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || (!sendEmail && !sendSMS)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{sending ? 'Sending...' : 'Send Estimate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
