import { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, FileDown, ChevronDown } from 'lucide-react';
import { ExportService, ExportData, ExportFormat } from '../../services/ExportService';

interface ExportMenuProps {
  getExportData: () => ExportData | null;
  disabled?: boolean;
}

export function ExportMenu({ getExportData, disabled = false }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    setIsOpen(false);

    try {
      const data = getExportData();
      if (!data) {
        alert('No data available to export');
        return;
      }

      // Add generation timestamp
      data.generatedAt = new Date();

      // Perform export
      ExportService.export(data, format);
    } catch (error: any) {
      console.error('Export failed:', error);
      alert('Export failed: ' + error.message);
    } finally {
      setExporting(false);
    }
  };

  const exportOptions = [
    {
      format: 'pdf' as ExportFormat,
      label: 'Export as PDF',
      icon: FileText,
      description: 'Best for printing and sharing',
    },
    {
      format: 'excel' as ExportFormat,
      label: 'Export as Excel',
      icon: FileSpreadsheet,
      description: 'Best for data analysis',
    },
    {
      format: 'csv' as ExportFormat,
      label: 'Export as CSV',
      icon: FileDown,
      description: 'Universal compatibility',
    },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || exporting}
        className={`btn ${
          disabled || exporting
            ? 'btn-outline opacity-50 cursor-not-allowed'
            : 'btn-primary'
        } flex items-center space-x-2`}
        title={disabled ? 'Export not available' : 'Export Report'}
      >
        {exporting ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
        ) : (
          <Download className="w-5 h-5" />
        )}
        <span>Export</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && !disabled && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          <div className="py-1">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              return (
                <button
                  key={option.format}
                  onClick={() => handleExport(option.format)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-start space-x-3"
                >
                  <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
