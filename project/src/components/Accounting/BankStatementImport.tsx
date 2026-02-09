import { useState } from 'react';
import { Upload, FileText, AlertCircle, X, Settings } from 'lucide-react';
import {
  parseFile,
  parseCSV,
  detectFormat,
  ParsedBankLine,
  CSVColumnMapping,
} from '../../utils/bankStatementParser';
import { ReconciliationService } from '../../services/ReconciliationService';

interface BankStatementImportProps {
  reconciliationId: string;
  onImportComplete: () => void;
  onCancel?: () => void;
}

export function BankStatementImport({
  reconciliationId,
  onImportComplete,
}: BankStatementImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [format, setFormat] = useState<'csv' | 'ofx' | 'unknown'>('unknown');
  const [parsedLines, setParsedLines] = useState<ParsedBankLine[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing'>('upload');
  const [_importing, _setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });

  // CSV column mapping state
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<CSVColumnMapping>({
    date: '',
    description: '',
    amount: '',
    debit: '',
    credit: '',
    checkNumber: '',
    referenceNumber: '',
  });

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const processFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseErrors([]);
    setParsedLines([]);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setFileContent(content);

      const detectedFormat = detectFormat(content);
      setFormat(detectedFormat);

      if (detectedFormat === 'ofx') {
        // OFX can be parsed directly
        const result = parseFile(content);
        if (result.success) {
          setParsedLines(result.lines);
          setStep('preview');
        } else {
          setParseErrors(result.errors);
        }
      } else if (detectedFormat === 'csv') {
        // CSV needs column mapping
        const lines = content.trim().split('\n');
        if (lines.length > 0) {
          const delimiter = content.includes('\t') ? '\t' : content.includes(';') ? ';' : ',';
          const headers = lines[0].split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ''));
          setCsvHeaders(headers);

          // Try auto-detect mapping
          const autoMapping = autoDetectMapping(headers);
          setColumnMapping(autoMapping);

          setStep('mapping');
        }
      } else {
        setParseErrors(['Unknown file format. Please upload a CSV or OFX/QFX file.']);
      }
    };

    reader.onerror = () => {
      setParseErrors(['Failed to read file']);
    };

    reader.readAsText(selectedFile);
  };

  const autoDetectMapping = (headers: string[]): CSVColumnMapping => {
    const lowerHeaders = headers.map((h) => h.toLowerCase());

    const findHeader = (patterns: string[]) => {
      for (const pattern of patterns) {
        const index = lowerHeaders.findIndex((h) => h.includes(pattern));
        if (index !== -1) return headers[index];
      }
      return '';
    };

    return {
      date: findHeader(['date', 'trans', 'posted']),
      description: findHeader(['description', 'memo', 'payee', 'name']),
      amount: findHeader(['amount']),
      debit: findHeader(['debit', 'withdrawal']),
      credit: findHeader(['credit', 'deposit']),
      checkNumber: findHeader(['check', 'cheque']),
      referenceNumber: findHeader(['reference', 'ref']),
    };
  };

  const handleMappingComplete = () => {
    if (!columnMapping.date || !columnMapping.description) {
      setParseErrors(['Date and Description columns are required']);
      return;
    }

    if (!columnMapping.amount && !columnMapping.debit && !columnMapping.credit) {
      setParseErrors(['Amount, Debit, or Credit column is required']);
      return;
    }

    const result = parseCSV(fileContent, columnMapping);

    if (result.success) {
      setParsedLines(result.lines);
      setParseErrors(result.errors);
      setStep('preview');
    } else {
      setParseErrors(result.errors);
    }
  };

  const handleImport = async () => {
    if (parsedLines.length === 0) return;

    _setImporting(true);
    setStep('importing');
    setImportProgress({ current: 0, total: parsedLines.length });

    try {
      for (let i = 0; i < parsedLines.length; i++) {
        const line = parsedLines[i];

        await ReconciliationService.addBankStatementLines(reconciliationId, [{
          transaction_date: line.transactionDate,
          description: line.description,
          amount: line.amount,
          external_transaction_id: line.checkNumber || line.referenceNumber,
        }]);

        setImportProgress({ current: i + 1, total: parsedLines.length });
      }

      onImportComplete();
    } catch (error: unknown) {
      console.error('Import error:', error);
      setParseErrors(['Failed to import: ' + (error instanceof Error ? error.message : 'Unknown error')]);
      setStep('preview');
    } finally {
      _setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 'upload' && (
        <div
          onDrop={handleFileDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
        >
          <input
            type="file"
            accept=".csv,.ofx,.qfx,.txt"
            onChange={handleFileSelect}
            className="hidden"
            id="bank-statement-file"
          />
          <label htmlFor="bank-statement-file" className="cursor-pointer">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Drop your bank statement here
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              or click to browse
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Supports CSV, OFX, and QFX files
            </p>
          </label>
        </div>
      )}

      {step === 'mapping' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Map CSV Columns
              </h4>
            </div>
            <button onClick={() => setStep('upload')} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select which columns in your CSV correspond to each field.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date Column <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.date}
                onChange={(e) => setColumnMapping({ ...columnMapping, date: e.target.value })}
                className="input w-full"
              >
                <option value="">Select...</option>
                {csvHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description Column <span className="text-red-500">*</span>
              </label>
              <select
                value={columnMapping.description}
                onChange={(e) => setColumnMapping({ ...columnMapping, description: e.target.value })}
                className="input w-full"
              >
                <option value="">Select...</option>
                {csvHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Amount Column
              </label>
              <select
                value={columnMapping.amount}
                onChange={(e) => setColumnMapping({ ...columnMapping, amount: e.target.value })}
                className="input w-full"
              >
                <option value="">Select...</option>
                {csvHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Check Number Column
              </label>
              <select
                value={columnMapping.checkNumber}
                onChange={(e) => setColumnMapping({ ...columnMapping, checkNumber: e.target.value })}
                className="input w-full"
              >
                <option value="">Select...</option>
                {csvHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Debit/Withdrawal Column
              </label>
              <select
                value={columnMapping.debit}
                onChange={(e) => setColumnMapping({ ...columnMapping, debit: e.target.value })}
                className="input w-full"
              >
                <option value="">Select...</option>
                {csvHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credit/Deposit Column
              </label>
              <select
                value={columnMapping.credit}
                onChange={(e) => setColumnMapping({ ...columnMapping, credit: e.target.value })}
                className="input w-full"
              >
                <option value="">Select...</option>
                {csvHeaders.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-500">
            Use Amount column OR separate Debit/Credit columns.
          </p>

          <div className="flex justify-end space-x-3">
            <button onClick={() => setStep('upload')} className="btn btn-outline">
              Back
            </button>
            <button onClick={handleMappingComplete} className="btn btn-primary">
              Parse File
            </button>
          </div>
        </div>
      )}

      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">
                Preview ({parsedLines.length} transactions)
              </h4>
            </div>
            <button onClick={() => setStep('upload')} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {file && (
            <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4" />
              <span>{file.name}</span>
              <span className="text-gray-400">({format.toUpperCase()})</span>
            </div>
          )}

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Description
                  </th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {parsedLines.slice(0, 50).map((line, index) => (
                  <tr key={index}>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                      {line.transactionDate}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900 dark:text-white truncate max-w-xs">
                      {line.description}
                    </td>
                    <td
                      className={`px-4 py-2 text-sm text-right whitespace-nowrap font-medium ${
                        line.amount < 0 ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      ${Math.abs(line.amount).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {parsedLines.length > 50 && (
            <p className="text-xs text-gray-500 text-center">
              Showing first 50 of {parsedLines.length} transactions
            </p>
          )}

          <div className="flex justify-end space-x-3">
            <button onClick={() => setStep('upload')} className="btn btn-outline">
              Start Over
            </button>
            <button onClick={handleImport} className="btn btn-primary" disabled={parsedLines.length === 0}>
              Import {parsedLines.length} Transactions
            </button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Importing transactions...
          </p>
          <p className="text-sm text-gray-500">
            {importProgress.current} of {importProgress.total}
          </p>
          <div className="w-64 mx-auto mt-4 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{
                width: `${(importProgress.current / importProgress.total) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {parseErrors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-100">Parse Errors</h4>
              <ul className="text-sm text-red-700 dark:text-red-300 mt-1 list-disc list-inside">
                {parseErrors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
              {parseErrors.length > 5 && (
                <p className="text-xs text-red-600 mt-1">
                  ...and {parseErrors.length - 5} more errors
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
