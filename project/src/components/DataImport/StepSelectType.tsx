import { useState } from 'react';
import { Users, DollarSign, Package, FileText, Clock } from 'lucide-react';
import { ImportEntityType } from '../../services/DataImportService';

interface StepSelectTypeProps {
  selectedType: ImportEntityType;
  onNext: (data: { entityType: ImportEntityType }) => void;
}

export function StepSelectType({ selectedType: initialType, onNext }: StepSelectTypeProps) {
  const [selectedType, setSelectedType] = useState<ImportEntityType>(initialType);

  const importTypes = [
    {
      id: 'customers' as ImportEntityType,
      icon: Users,
      title: 'Customers',
      description: 'Import customer master data including contact information and addresses',
      available: true,
    },
    {
      id: 'ar' as ImportEntityType,
      icon: DollarSign,
      title: 'Open AR (Unpaid Invoices)',
      description: 'Import accounts receivable aging report to establish opening balances',
      available: true,
    },
    {
      id: 'vendors' as ImportEntityType,
      icon: Package,
      title: 'Vendors',
      description: 'Import vendor master data for procurement management',
      available: true,
    },
    {
      id: 'items' as ImportEntityType,
      icon: FileText,
      title: 'Items / Parts',
      description: 'Import parts inventory and pricing from previous system',
      available: true,
    },
    {
      id: 'history' as ImportEntityType,
      icon: Clock,
      title: 'Historical Data',
      description: 'Import past invoices, payments, and service history (12-24 months)',
      available: true,
    },
  ];

  const handleContinue = () => {
    onNext({ entityType: selectedType });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Choose What to Import
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Select the type of data you want to import from your previous ERP system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {importTypes.map((type) => {
          const Icon = type.icon;
          const isSelected = selectedType === type.id;
          const isDisabled = !type.available;

          return (
            <button
              key={type.id}
              onClick={() => !isDisabled && setSelectedType(type.id)}
              disabled={isDisabled}
              className={`relative p-6 rounded-lg border-2 text-left transition-all ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
                  : isSelected
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                    isDisabled
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                      : isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-bold text-gray-900 dark:text-white">
                      {type.title}
                    </h4>
                    {isDisabled && (
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {type.description}
                  </p>
                </div>

                {isSelected && !isDisabled && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Safe & Reversible
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          All imports use staging tables first. You'll be able to review and validate data before it's committed to your system. You can also roll back any import if needed.
        </p>
      </div>

      <div className="flex justify-end pt-4">
        <button
          onClick={handleContinue}
          className="btn btn-primary flex items-center space-x-2"
        >
          <span>Continue</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
