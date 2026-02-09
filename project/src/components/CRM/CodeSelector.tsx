import { useState, useEffect } from 'react';
import { AlertTriangle, Search, X, ChevronDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StandardCode {
  id: string;
  code: string;
  code_type: 'problem' | 'resolution';
  label?: string;
  description?: string | null;
  category?: string | null;
  severity?: number | null;
  triggers_sales_lead?: boolean | null;
  triggers_urgent_review?: boolean | null;
  is_critical_safety?: boolean | null;
  is_active?: boolean | null;
}

interface CodeSelectorProps {
  type: 'problem' | 'resolution';
  value?: string;
  onChange: (code: string | null) => void;
  label?: string;
  required?: boolean;
  disabled?: boolean;
}

export function CodeSelector({
  type,
  value,
  onChange,
  label,
  required = false,
  disabled = false,
}: CodeSelectorProps) {
  const [codes, setCodes] = useState<StandardCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCode, setSelectedCode] = useState<StandardCode | null>(null);

  useEffect(() => {
    loadCodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  useEffect(() => {
    if (value && codes.length > 0) {
      const found = codes.find((c) => c.code === value);
      setSelectedCode(found || null);
    } else {
      setSelectedCode(null);
    }
  }, [value, codes]);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('standard_codes')
        .select('*')
        .eq('code_type', type)
        .eq('is_active', true)
        .order('sort_order')
        .order('label');

      if (error) throw error;
      setCodes((data as StandardCode[]) || []);
    } catch (err) {
      console.error('Failed to load codes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (code: StandardCode) => {
    setSelectedCode(code);
    onChange(code.code);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedCode(null);
    onChange(null);
  };

  const filteredCodes = codes.filter(
    (code) =>
      code.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedCodes = filteredCodes.reduce((acc, code) => {
    const category = code.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(code);
    return acc;
  }, {} as Record<string, StandardCode[]>);

  const categoryOrder = ['electrical', 'refrigerant', 'airflow', 'safety', 'mechanical', 'usage', 'Other'];

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Selected Value Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`input w-full flex items-center justify-between text-left ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        }`}
      >
        {loading ? (
          <span className="text-gray-400">Loading...</span>
        ) : selectedCode ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedCode.is_critical_safety && (
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            )}
            <span className="truncate">{selectedCode.label}</span>
            {selectedCode.triggers_sales_lead && (
              <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded flex-shrink-0">
                Sales
              </span>
            )}
          </div>
        ) : (
          <span className="text-gray-400">
            Select {type === 'problem' ? 'problem' : 'resolution'} code...
          </span>
        )}
        <div className="flex items-center gap-1 flex-shrink-0">
          {selectedCode && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Safety Warning */}
      {selectedCode?.is_critical_safety && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Critical Safety Issue</span>
          </div>
          <p className="text-xs text-red-500 mt-1">
            This code indicates a safety concern. Follow all safety protocols.
          </p>
        </div>
      )}

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-80 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search codes..."
                  className="input w-full pl-9 py-1.5 text-sm"
                  autoFocus
                />
              </div>
            </div>

            {/* Code List */}
            <div className="overflow-y-auto max-h-60">
              {filteredCodes.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No codes found
                </div>
              ) : (
                categoryOrder
                  .filter((cat) => groupedCodes[cat]?.length > 0)
                  .map((category) => (
                    <div key={category}>
                      <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-500 uppercase sticky top-0">
                        {category}
                      </div>
                      {groupedCodes[category].map((code) => (
                        <button
                          key={code.id}
                          type="button"
                          onClick={() => handleSelect(code)}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            selectedCode?.id === code.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {code.is_critical_safety && (
                              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {code.label}
                              </p>
                              {code.description && (
                                <p className="text-xs text-gray-500 truncate">{code.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {code.triggers_sales_lead && (
                                <span className="px-1.5 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded">
                                  Sales
                                </span>
                              )}
                              {code.triggers_urgent_review && (
                                <span className="px-1.5 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded">
                                  Review
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
