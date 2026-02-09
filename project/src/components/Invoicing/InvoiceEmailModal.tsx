import { useState, useEffect } from 'react';
import { X, Send, Download, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { InvoiceEmailService, InvoiceEmailData, EmailComposition } from '../../services/InvoiceEmailService';

interface InvoiceEmailModalProps {
  invoiceId: string;
  onClose: () => void;
  onSent: () => void;
}

export function InvoiceEmailModal({ invoiceId, onClose, onSent }: InvoiceEmailModalProps) {
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceEmailData | null>(null);
  const [composition, setComposition] = useState<EmailComposition>({
    to: '',
    subject: '',
    body: '',
    attachPdf: true,
  });
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadInvoiceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const loadInvoiceData = async () => {
    setLoading(true);
    const data = await InvoiceEmailService.loadInvoiceEmailData(invoiceId);
    if (data) {
      setInvoiceData(data);
      setComposition(InvoiceEmailService.getDefaultEmailComposition(data));
    }
    setLoading(false);
  };

  const handleSend = async () => {
    if (!invoiceData) return;

    if (!composition.to) {
      setResult({ success: false, message: 'Please enter a recipient email address.' });
      return;
    }

    setSending(true);
    setResult(null);

    try {
      // If attaching PDF, download it first
      if (composition.attachPdf) {
        await InvoiceEmailService.downloadInvoicePDF(invoiceData);
      }

      // Send email
      const sendResult = await InvoiceEmailService.sendInvoiceEmail(invoiceData, composition);
      setResult({ success: sendResult.success, message: sendResult.message });

      if (sendResult.success && sendResult.method === 'function') {
        // Email was sent via function, close after delay
        setTimeout(() => {
          onSent();
          onClose();
        }, 2000);
      }
    } catch (_error) {
      setResult({ success: false, message: 'Failed to send email. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!invoiceData) return;
    await InvoiceEmailService.downloadInvoicePDF(invoiceData);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoiceData) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Failed to load invoice data.</p>
          <button onClick={onClose} className="btn btn-primary mt-4 w-full">
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Mail className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Send Invoice {invoiceData.invoiceNumber}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Invoice Summary */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Customer:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {invoiceData.customerName}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Amount:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  ${invoiceData.totalAmount.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Due Date:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  {new Date(invoiceData.dueDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">Balance:</span>
                <span className="ml-2 text-gray-900 dark:text-white font-medium">
                  ${invoiceData.balanceDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Email Form */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To *
            </label>
            <input
              type="email"
              value={composition.to}
              onChange={(e) => setComposition({ ...composition, to: e.target.value })}
              className="input"
              placeholder="customer@email.com"
            />
            {!invoiceData.customerEmail && (
              <p className="text-xs text-yellow-600 mt-1">
                No email on file for this customer. Please enter an email address.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={composition.subject}
              onChange={(e) => setComposition({ ...composition, subject: e.target.value })}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              value={composition.body}
              onChange={(e) => setComposition({ ...composition, body: e.target.value })}
              className="input"
              rows={8}
            />
          </div>

          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="attachPdf"
              checked={composition.attachPdf}
              onChange={(e) => setComposition({ ...composition, attachPdf: e.target.checked })}
              className="rounded text-blue-600"
            />
            <label htmlFor="attachPdf" className="text-sm text-gray-700 dark:text-gray-300">
              Download PDF attachment (attach manually to email)
            </label>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`p-4 rounded-lg flex items-center space-x-3 ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <button
            onClick={handleDownloadPdf}
            className="btn btn-outline flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          <div className="flex gap-3">
            <button onClick={onClose} className="btn btn-outline">
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={sending || !composition.to}
              className="btn btn-primary flex items-center gap-2"
            >
              {sending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
