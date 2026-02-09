import { useState, useEffect } from 'react';
import { X, Shield, AlertCircle, Phone, FileText, DollarSign, Calendar } from 'lucide-react';
import { WarrantyService, type CreateClaimInput, type WarrantyClaimSummary } from '../../services/WarrantyService';

interface WarrantyClaimModalProps {
  onClose: () => void;
  onSuccess: () => void;
  // Pre-fill from warranty record
  warrantyRecord?: {
    id: string;
    serial_number: string;
    part_name: string;
    warranty_provider: string | null;
    vendor_name: string | null;
  };
  // Or edit existing claim
  existingClaim?: WarrantyClaimSummary;
}

export function WarrantyClaimModal({
  onClose,
  onSuccess,
  warrantyRecord,
  existingClaim,
}: WarrantyClaimModalProps) {
  const isEditing = !!existingClaim;
  const providers = WarrantyService.getCommonProviders();

  const [formData, setFormData] = useState<CreateClaimInput>({
    serialized_part_id: warrantyRecord?.id || existingClaim?.serialized_part_id || null,
    equipment_id: existingClaim?.equipment_id || null,
    claim_type: existingClaim?.claim_type || 'repair',
    description: existingClaim?.description || '',
    failure_description: existingClaim?.failure_description || '',
    failure_date: existingClaim?.failure_date || new Date().toISOString().split('T')[0],
    provider_name: warrantyRecord?.warranty_provider || warrantyRecord?.vendor_name || existingClaim?.provider_name || '',
    provider_contact: existingClaim?.provider_contact || '',
    provider_phone: existingClaim?.provider_phone || '',
    provider_email: existingClaim?.provider_email || '',
    claim_amount: existingClaim?.claim_amount || undefined,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  // Update provider info when selecting from common providers
  useEffect(() => {
    if (selectedProvider) {
      const provider = providers.find((p) => p.name === selectedProvider);
      if (provider) {
        setFormData((prev) => ({
          ...prev,
          provider_name: provider.name,
          provider_phone: provider.phone || '',
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProvider]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.description.trim()) {
      setError('Please provide a claim description');
      return;
    }
    if (!formData.provider_name.trim()) {
      setError('Please select or enter a warranty provider');
      return;
    }

    setSaving(true);

    try {
      if (isEditing && existingClaim) {
        const result = await WarrantyService.updateClaim(existingClaim.id, formData);
        if (!result.success) throw new Error(result.error);
      } else {
        const result = await WarrantyService.createClaim(formData);
        if (!result.success) throw new Error(result.error);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save claim');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitClaim = async () => {
    if (!existingClaim) return;

    setSaving(true);
    try {
      const result = await WarrantyService.submitClaim(existingClaim.id);
      if (!result.success) throw new Error(result.error);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit claim');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {isEditing ? 'Edit Warranty Claim' : 'New Warranty Claim'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center space-x-3 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Item Info */}
          {warrantyRecord && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Filing claim for:
              </p>
              <p className="text-blue-800 dark:text-blue-200 mt-1">
                {warrantyRecord.part_name} - SN: {warrantyRecord.serial_number}
              </p>
            </div>
          )}

          {existingClaim && (
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Claim Number</p>
                  <p className="font-mono font-bold text-gray-900 dark:text-white">
                    {existingClaim.claim_number}
                  </p>
                </div>
                <span className={`badge ${WarrantyService.getStatusDisplay(existingClaim.status).color}`}>
                  {WarrantyService.getStatusDisplay(existingClaim.status).label}
                </span>
              </div>
            </div>
          )}

          {/* Claim Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Claim Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(['repair', 'replacement', 'refund', 'labor'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, claim_type: type })}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                    formData.claim_type === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {WarrantyService.getClaimTypeDisplay(type)}
                </button>
              ))}
            </div>
          </div>

          {/* Provider Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Warranty Provider *
            </label>
            <div className="space-y-2">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="input"
              >
                <option value="">Select a provider or enter custom...</option>
                {providers.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={formData.provider_name}
                onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
                className="input"
                placeholder="Or enter provider name"
              />
            </div>
          </div>

          {/* Provider Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Phone className="w-4 h-4 inline mr-1" />
                Provider Phone
              </label>
              <input
                type="tel"
                value={formData.provider_phone}
                onChange={(e) => setFormData({ ...formData, provider_phone: e.target.value })}
                className="input"
                placeholder="1-800-XXX-XXXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Provider Email
              </label>
              <input
                type="email"
                value={formData.provider_email}
                onChange={(e) => setFormData({ ...formData, provider_email: e.target.value })}
                className="input"
                placeholder="warranty@provider.com"
              />
            </div>
          </div>

          {/* Failure Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Failure Date
              </label>
              <input
                type="date"
                value={formData.failure_date}
                onChange={(e) => setFormData({ ...formData, failure_date: e.target.value })}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Claim Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.claim_amount || ''}
                onChange={(e) =>
                  setFormData({ ...formData, claim_amount: parseFloat(e.target.value) || undefined })
                }
                className="input"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Claim Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input"
              rows={3}
              placeholder="Describe what you are claiming and why..."
              required
            />
          </div>

          {/* Failure Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Failure Details
            </label>
            <textarea
              value={formData.failure_description}
              onChange={(e) => setFormData({ ...formData, failure_description: e.target.value })}
              className="input"
              rows={2}
              placeholder="Describe how the part/equipment failed..."
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={saving}
            >
              Cancel
            </button>
            <div className="flex items-center space-x-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : isEditing ? 'Update Claim' : 'Save as Draft'}
              </button>
              {isEditing && existingClaim?.status === 'draft' && (
                <button
                  type="button"
                  onClick={handleSubmitClaim}
                  className="btn bg-green-600 hover:bg-green-700 text-white"
                  disabled={saving}
                >
                  Submit Claim
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
