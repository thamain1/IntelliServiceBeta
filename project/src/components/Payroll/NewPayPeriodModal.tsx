import { X } from 'lucide-react';

interface NewPayPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: {
    period_start_date: string;
    period_end_date: string;
    pay_date: string;
  };
  onChange: (data: { period_start_date: string; period_end_date: string; pay_date: string }) => void;
}

export function NewPayPeriodModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
}: NewPayPeriodModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Payroll Period</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.period_start_date}
                onChange={(e) => onChange({ ...formData, period_start_date: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.period_end_date}
                onChange={(e) => onChange({ ...formData, period_end_date: e.target.value })}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Pay Date *
              </label>
              <input
                type="date"
                required
                value={formData.pay_date}
                onChange={(e) => onChange({ ...formData, pay_date: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Creating a new pay period will automatically generate payroll details for all employees
              with approved time logs during this period.
            </p>
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
              Create Period
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
