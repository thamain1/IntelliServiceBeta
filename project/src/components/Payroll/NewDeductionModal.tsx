import { X } from 'lucide-react';

interface DeductionFormData {
  deduction_name: string;
  deduction_type: 'tax' | 'insurance' | 'retirement' | 'garnishment' | 'other';
  calculation_method: 'percentage' | 'fixed_amount';
  default_amount: number;
  is_pre_tax: boolean;
}

interface NewDeductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: DeductionFormData;
  onChange: (data: DeductionFormData) => void;
}

export function NewDeductionModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
}: NewDeductionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Deduction</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deduction Name *
              </label>
              <input
                type="text"
                required
                value={formData.deduction_name}
                onChange={(e) => onChange({ ...formData, deduction_name: e.target.value })}
                className="input"
                placeholder="e.g., Federal Income Tax"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deduction Type *
              </label>
              <select
                required
                value={formData.deduction_type}
                onChange={(e) => onChange({ ...formData, deduction_type: e.target.value as DeductionFormData['deduction_type'] })}
                className="input"
              >
                <option value="tax">Tax</option>
                <option value="insurance">Insurance</option>
                <option value="retirement">Retirement</option>
                <option value="garnishment">Garnishment</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Calculation Method *
              </label>
              <select
                required
                value={formData.calculation_method}
                onChange={(e) => onChange({ ...formData, calculation_method: e.target.value as 'percentage' | 'fixed_amount' })}
                className="input"
              >
                <option value="percentage">Percentage</option>
                <option value="fixed_amount">Fixed Amount</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {formData.calculation_method === 'percentage' ? 'Percentage (%)' : 'Fixed Amount ($)'} *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={formData.default_amount}
                onChange={(e) => onChange({ ...formData, default_amount: parseFloat(e.target.value) || 0 })}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.is_pre_tax}
                  onChange={(e) => onChange({ ...formData, is_pre_tax: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Pre-Tax Deduction</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Pre-tax deductions reduce taxable income (e.g., 401k contributions, health insurance premiums)
              </p>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1">
              Create Deduction
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
