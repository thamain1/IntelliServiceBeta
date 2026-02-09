import { useState } from 'react';
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  MapPin,
  FileText,
  AlertCircle,
  LucideIcon,
} from 'lucide-react';
import { CRMService, InteractionType, CreateInteractionInput } from '../../services/CRMService';

interface NewInteractionModalProps {
  customerId: string;
  customerName: string;
  relatedTicketId?: string;
  relatedEstimateId?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function NewInteractionModal({
  customerId,
  customerName,
  relatedTicketId,
  relatedEstimateId,
  onClose,
  onSaved,
}: NewInteractionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<CreateInteractionInput>({
    customer_id: customerId,
    interaction_type: 'call',
    direction: 'outbound',
    subject: '',
    notes: '',
    duration_minutes: undefined,
    outcome: '',
    follow_up_date: undefined,
    related_ticket_id: relatedTicketId,
    related_estimate_id: relatedEstimateId,
  });

  const interactionTypes: { value: InteractionType; label: string; icon: LucideIcon }[] = [
    { value: 'call', label: 'Phone Call', icon: Phone },
    { value: 'email', label: 'Email', icon: Mail },
    { value: 'sms', label: 'SMS/Text', icon: MessageSquare },
    { value: 'meeting', label: 'Meeting', icon: Calendar },
    { value: 'site_visit', label: 'Site Visit', icon: MapPin },
    { value: 'note', label: 'Note', icon: FileText },
  ];

  const outcomes = [
    'Left Voicemail',
    'Spoke with Customer',
    'Scheduled Appointment',
    'Sent Quote',
    'Customer Interested',
    'Customer Not Interested',
    'Follow-up Required',
    'Issue Resolved',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.subject?.trim() && !formData.notes?.trim()) {
      setError('Please enter a subject or notes');
      return;
    }

    setLoading(true);
    try {
      await CRMService.createInteraction(formData);
      onSaved();
    } catch (err: unknown) {
      console.error('Failed to create interaction:', err);
      setError(err instanceof Error ? err.message : 'Failed to save interaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Log Interaction</h3>
              <p className="text-sm text-gray-500">{customerName}</p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Interaction Type */}
            <div>
              <label className="label">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {interactionTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, interaction_type: type.value })}
                      className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-sm transition-colors ${
                        formData.interaction_type === type.value
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direction (for calls/emails) */}
            {['call', 'email', 'sms'].includes(formData.interaction_type) && (
              <div>
                <label className="label">Direction</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.direction === 'outbound'}
                      onChange={() => setFormData({ ...formData, direction: 'outbound' })}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Outbound</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      checked={formData.direction === 'inbound'}
                      onChange={() => setFormData({ ...formData, direction: 'inbound' })}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Inbound</span>
                  </label>
                </div>
              </div>
            )}

            {/* Subject */}
            <div>
              <label className="label">Subject</label>
              <input
                type="text"
                value={formData.subject || ''}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="input w-full"
                placeholder="Brief summary..."
              />
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="input w-full"
                rows={3}
                placeholder="Details of the interaction..."
              />
            </div>

            {/* Duration (for calls/meetings) */}
            {['call', 'meeting', 'site_visit'].includes(formData.interaction_type) && (
              <div>
                <label className="label">Duration (minutes)</label>
                <input
                  type="number"
                  value={formData.duration_minutes || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || undefined })
                  }
                  className="input w-32"
                  min="0"
                  placeholder="0"
                />
              </div>
            )}

            {/* Outcome */}
            <div>
              <label className="label">Outcome</label>
              <select
                value={formData.outcome || ''}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                className="input w-full"
              >
                <option value="">Select outcome...</option>
                {outcomes.map((outcome) => (
                  <option key={outcome} value={outcome}>
                    {outcome}
                  </option>
                ))}
              </select>
            </div>

            {/* Follow-up Date */}
            <div>
              <label className="label">Follow-up Date</label>
              <input
                type="date"
                value={formData.follow_up_date || ''}
                onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value || undefined })}
                className="input w-full"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Saving...' : 'Save Interaction'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
