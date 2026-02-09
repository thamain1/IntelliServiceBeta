import { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { ImportEntityType, DataImportService } from '../../services/DataImportService';

interface StepUploadFileProps {
  entityType: ImportEntityType;
  onNext: (data: { file: File; content: string; parsedRows: Record<string, unknown>[] }) => void;
  onBack: () => void;
}

export function StepUploadFile({ entityType, onNext, onBack }: StepUploadFileProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [fileStats, setFileStats] = useState<{ rows: number; columns: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedFormats = '.csv,.tsv,.txt';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    setParsing(true);

    try {
      // Read file content
      const content = await readFileContent(selectedFile);

      // Detect format
      const { delimiter } = DataImportService.detectFileFormat(content);

      // Parse CSV
      const parsedRows = DataImportService.parseCSV(content, delimiter);

      if (parsedRows.length === 0) {
        throw new Error('No data rows found in file');
      }

      // Get column headers
      const headers = Object.keys(parsedRows[0] || {});

      setFileStats({
        rows: parsedRows.length,
        columns: headers.length,
      });

      setParsing(false);
    } catch (error: unknown) {
      console.error('Parse error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to parse file';
      setParseError(errorMessage);
      setParsing(false);
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const content = e.target?.result as string;
        resolve(content);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      // Try UTF-8 first
      reader.readAsText(file, 'UTF-8');
    });
  };

  const handleContinue = async () => {
    if (!file) return;

    try {
      const content = await readFileContent(file);
      const { delimiter } = DataImportService.detectFileFormat(content);
      const parsedRows = DataImportService.parseCSV(content, delimiter);

      onNext({ file, content, parsedRows });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
      setParseError(errorMessage);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setFileStats(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getEntityExampleText = () => {
    switch (entityType) {
      case 'customers':
        return 'Customer list with name, email, phone, address, etc.';
      case 'ar':
        return 'AR aging report with customer, invoice #, balance, due date, etc.';
      default:
        return 'Data export from your previous system';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Upload Your File
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {getEntityExampleText()}
        </p>
      </div>

      {!file ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
            dragActive
              ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />

          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Drop your CSV file here
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            or click to browse
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats}
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn btn-outline"
          >
            Select File
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
            Supported formats: CSV, TSV, TXT (comma or tab-separated)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {file.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>

                  {parsing && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Parsing file...
                      </span>
                    </div>
                  )}

                  {fileStats && !parsing && (
                    <div className="flex items-center space-x-2 mt-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span>
                        {fileStats.rows} rows, {fileStats.columns} columns detected
                      </span>
                    </div>
                  )}

                  {parseError && (
                    <div className="flex items-center space-x-2 mt-2 text-sm text-red-600 dark:text-red-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>{parseError}</span>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleRemoveFile}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {entityType === 'ar' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                    AR Aging File Tips
                  </h4>
                  <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                    <li>Ensure file includes customer ID or name for matching</li>
                    <li>Include invoice numbers for each open balance</li>
                    <li>Total rows will be automatically skipped</li>
                    <li>Balance amounts will be normalized (strips $, commas, handles parentheses)</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between pt-4">
        <button onClick={onBack} className="btn btn-outline flex items-center space-x-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </button>

        <button
          onClick={handleContinue}
          disabled={!file || !!parseError || parsing || !fileStats}
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
