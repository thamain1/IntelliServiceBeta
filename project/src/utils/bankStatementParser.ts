/**
 * Bank Statement Parser Utility
 * Handles parsing CSV and OFX/QFX bank statement files
 */

export interface ParsedBankLine {
  transactionDate: string;
  postDate?: string;
  description: string;
  amount: number;
  checkNumber?: string;
  referenceNumber?: string;
  transactionType?: 'debit' | 'credit';
  rawData?: Record<string, any>;
}

export interface ParseResult {
  success: boolean;
  lines: ParsedBankLine[];
  errors: string[];
  format: 'csv' | 'ofx' | 'unknown';
  accountInfo?: {
    accountNumber?: string;
    bankId?: string;
    accountType?: string;
  };
}

export interface CSVColumnMapping {
  date: string;
  description: string;
  amount: string;
  debit?: string;
  credit?: string;
  checkNumber?: string;
  referenceNumber?: string;
}

/**
 * Detect file format from content
 */
export function detectFormat(content: string): 'csv' | 'ofx' | 'unknown' {
  const trimmed = content.trim();

  // Check for OFX/QFX format
  if (trimmed.includes('OFXHEADER') || trimmed.includes('<OFX>') || trimmed.includes('<OFX ')) {
    return 'ofx';
  }

  // Check for CSV-like content (has commas or tabs and multiple lines)
  const lines = trimmed.split('\n');
  if (lines.length > 1) {
    const firstLine = lines[0];
    if (firstLine.includes(',') || firstLine.includes('\t') || firstLine.includes(';')) {
      return 'csv';
    }
  }

  return 'unknown';
}

/**
 * Parse CSV bank statement with column mapping
 */
export function parseCSV(content: string, mapping: CSVColumnMapping): ParseResult {
  const result: ParseResult = {
    success: false,
    lines: [],
    errors: [],
    format: 'csv',
  };

  try {
    const { delimiter } = detectDelimiter(content);
    const lines = content.trim().split('\n');

    if (lines.length < 2) {
      result.errors.push('File must have at least a header row and one data row');
      return result;
    }

    // Parse header row
    const headers = parseCSVLine(lines[0], delimiter);
    const headerMap: Record<string, number> = {};
    headers.forEach((header, index) => {
      headerMap[header.trim().toLowerCase()] = index;
    });

    // Find column indices
    const dateIndex = findColumnIndex(headerMap, mapping.date);
    const descIndex = findColumnIndex(headerMap, mapping.description);
    const amountIndex = mapping.amount ? findColumnIndex(headerMap, mapping.amount) : -1;
    const debitIndex = mapping.debit ? findColumnIndex(headerMap, mapping.debit) : -1;
    const creditIndex = mapping.credit ? findColumnIndex(headerMap, mapping.credit) : -1;
    const checkIndex = mapping.checkNumber ? findColumnIndex(headerMap, mapping.checkNumber) : -1;
    const refIndex = mapping.referenceNumber
      ? findColumnIndex(headerMap, mapping.referenceNumber)
      : -1;

    if (dateIndex === -1) {
      result.errors.push(`Date column "${mapping.date}" not found`);
      return result;
    }
    if (descIndex === -1) {
      result.errors.push(`Description column "${mapping.description}" not found`);
      return result;
    }
    if (amountIndex === -1 && debitIndex === -1 && creditIndex === -1) {
      result.errors.push('Amount column not found. Specify amount, debit, or credit column.');
      return result;
    }

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      try {
        const values = parseCSVLine(line, delimiter);

        const dateValue = values[dateIndex]?.trim();
        const descValue = values[descIndex]?.trim();

        if (!dateValue || !descValue) continue;

        // Parse amount
        let amount = 0;
        let transactionType: 'debit' | 'credit' | undefined;

        if (amountIndex >= 0) {
          amount = parseCurrency(values[amountIndex] || '0');
        } else {
          const debit = debitIndex >= 0 ? parseCurrency(values[debitIndex] || '0') : 0;
          const credit = creditIndex >= 0 ? parseCurrency(values[creditIndex] || '0') : 0;

          if (debit !== 0) {
            amount = -Math.abs(debit);
            transactionType = 'debit';
          } else if (credit !== 0) {
            amount = Math.abs(credit);
            transactionType = 'credit';
          }
        }

        const parsed: ParsedBankLine = {
          transactionDate: parseDate(dateValue),
          description: descValue,
          amount,
          transactionType,
          checkNumber: checkIndex >= 0 ? values[checkIndex]?.trim() : undefined,
          referenceNumber: refIndex >= 0 ? values[refIndex]?.trim() : undefined,
          rawData: Object.fromEntries(headers.map((h, idx) => [h, values[idx]])),
        };

        result.lines.push(parsed);
      } catch (err: any) {
        result.errors.push(`Row ${i + 1}: ${err.message}`);
      }
    }

    result.success = result.lines.length > 0;
  } catch (err: any) {
    result.errors.push('Failed to parse CSV: ' + err.message);
  }

  return result;
}

/**
 * Parse OFX/QFX bank statement
 */
export function parseOFX(content: string): ParseResult {
  const result: ParseResult = {
    success: false,
    lines: [],
    errors: [],
    format: 'ofx',
  };

  try {
    // Extract account info
    const bankId = extractOFXValue(content, 'BANKID');
    const acctId = extractOFXValue(content, 'ACCTID');
    const acctType = extractOFXValue(content, 'ACCTTYPE');

    result.accountInfo = {
      bankId: bankId || undefined,
      accountNumber: acctId || undefined,
      accountType: acctType || undefined,
    };

    // Find all STMTTRN blocks
    const transactionRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
    let match;

    while ((match = transactionRegex.exec(content)) !== null) {
      try {
        const block = match[1];

        const trnType = extractOFXValue(block, 'TRNTYPE') || '';
        const dtPosted = extractOFXValue(block, 'DTPOSTED') || '';
        const trnAmt = extractOFXValue(block, 'TRNAMT') || '0';
        const name = extractOFXValue(block, 'NAME') || '';
        const memo = extractOFXValue(block, 'MEMO') || '';
        const checkNum = extractOFXValue(block, 'CHECKNUM');
        const refNum = extractOFXValue(block, 'REFNUM');
        const fitId = extractOFXValue(block, 'FITID');

        const date = parseOFXDate(dtPosted);
        const amount = parseFloat(trnAmt);
        const description = memo ? `${name} - ${memo}` : name;

        const parsed: ParsedBankLine = {
          transactionDate: date,
          description,
          amount,
          transactionType: amount < 0 ? 'debit' : 'credit',
          checkNumber: checkNum || undefined,
          referenceNumber: refNum || fitId || undefined,
          rawData: {
            trnType,
            dtPosted,
            trnAmt,
            name,
            memo,
            checkNum,
            refNum,
            fitId,
          },
        };

        result.lines.push(parsed);
      } catch (err: any) {
        result.errors.push('Failed to parse transaction: ' + err.message);
      }
    }

    result.success = result.lines.length > 0;
  } catch (err: any) {
    result.errors.push('Failed to parse OFX: ' + err.message);
  }

  return result;
}

/**
 * Auto-parse a bank statement file
 */
export function parseFile(content: string, mapping?: CSVColumnMapping): ParseResult {
  const format = detectFormat(content);

  if (format === 'ofx') {
    return parseOFX(content);
  } else if (format === 'csv' && mapping) {
    return parseCSV(content, mapping);
  } else if (format === 'csv') {
    // Try to auto-detect CSV columns
    const autoMapping = autoDetectCSVMapping(content);
    if (autoMapping) {
      return parseCSV(content, autoMapping);
    }
    return {
      success: false,
      lines: [],
      errors: ['CSV file detected but column mapping is required'],
      format: 'csv',
    };
  }

  return {
    success: false,
    lines: [],
    errors: ['Unknown file format'],
    format: 'unknown',
  };
}

/**
 * Validate parsed bank lines
 */
export function validateBankLines(lines: ParsedBankLine[]): { valid: ParsedBankLine[]; errors: string[] } {
  const valid: ParsedBankLine[] = [];
  const errors: string[] = [];

  lines.forEach((line, index) => {
    const rowNum = index + 1;

    if (!line.transactionDate) {
      errors.push(`Row ${rowNum}: Missing or invalid date`);
      return;
    }

    if (!line.description) {
      errors.push(`Row ${rowNum}: Missing description`);
      return;
    }

    if (typeof line.amount !== 'number' || isNaN(line.amount)) {
      errors.push(`Row ${rowNum}: Invalid amount`);
      return;
    }

    valid.push(line);
  });

  return { valid, errors };
}

// Helper functions

function detectDelimiter(content: string): { delimiter: string; encoding: string } {
  const firstLine = content.split('\n')[0] || '';
  const tabCount = (firstLine.match(/\t/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;

  let delimiter = ',';
  if (tabCount > commaCount && tabCount > semicolonCount) {
    delimiter = '\t';
  } else if (semicolonCount > commaCount) {
    delimiter = ';';
  }

  return { delimiter, encoding: 'utf-8' };
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result.map((v) => v.replace(/^"|"$/g, ''));
}

function findColumnIndex(headerMap: Record<string, number>, columnName: string): number {
  const normalizedName = columnName.toLowerCase().trim();

  // Exact match first
  if (headerMap[normalizedName] !== undefined) {
    return headerMap[normalizedName];
  }

  // Partial match
  for (const [header, index] of Object.entries(headerMap)) {
    if (header.includes(normalizedName) || normalizedName.includes(header)) {
      return index;
    }
  }

  return -1;
}

function parseCurrency(value: string): number {
  if (!value) return 0;

  let normalized = value.toString().trim();

  // Check if value is in parentheses (negative)
  const isNegative = normalized.startsWith('(') && normalized.endsWith(')');
  if (isNegative) {
    normalized = normalized.slice(1, -1);
  }

  // Check for minus sign
  const hasMinusSign = normalized.startsWith('-');

  // Remove currency symbols and commas
  normalized = normalized.replace(/[$,\s-]/g, '');

  const num = parseFloat(normalized);
  if (isNaN(num)) return 0;

  return (isNegative || hasMinusSign) ? -Math.abs(num) : num;
}

function parseDate(value: string): string {
  if (!value) return '';

  // Try various date formats
  const date = new Date(value);

  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  // Try MM/DD/YYYY
  const parts = value.split(/[/-]/);
  if (parts.length === 3) {
    const [a, b, c] = parts;
    // Guess MM/DD/YYYY or DD/MM/YYYY based on values
    if (parseInt(a) <= 12) {
      const date = new Date(parseInt(c), parseInt(a) - 1, parseInt(b));
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
  }

  return value;
}

function parseOFXDate(value: string): string {
  if (!value) return '';

  // OFX dates are YYYYMMDD or YYYYMMDDHHMMSS
  const year = value.substring(0, 4);
  const month = value.substring(4, 6);
  const day = value.substring(6, 8);

  return `${year}-${month}-${day}`;
}

function extractOFXValue(content: string, tag: string): string | null {
  // Try XML-style tags first
  const xmlRegex = new RegExp(`<${tag}>([^<]*)</${tag}>`, 'i');
  let match = xmlRegex.exec(content);
  if (match) return match[1].trim();

  // Try SGML-style tags (no closing tag)
  const sgmlRegex = new RegExp(`<${tag}>([^<\\n]*)`, 'i');
  match = sgmlRegex.exec(content);
  if (match) return match[1].trim();

  return null;
}

function autoDetectCSVMapping(content: string): CSVColumnMapping | null {
  const { delimiter } = detectDelimiter(content);
  const lines = content.trim().split('\n');
  if (lines.length < 1) return null;

  const headers = parseCSVLine(lines[0], delimiter).map((h) => h.toLowerCase());

  const datePatterns = ['date', 'transaction date', 'trans date', 'posted', 'post date'];
  const descPatterns = ['description', 'memo', 'payee', 'name', 'details'];
  const amountPatterns = ['amount', 'transaction amount'];
  const debitPatterns = ['debit', 'withdrawal', 'withdrawals'];
  const creditPatterns = ['credit', 'deposit', 'deposits'];

  const findMatch = (patterns: string[]) => {
    for (const pattern of patterns) {
      const match = headers.find((h) => h.includes(pattern));
      if (match) return match;
    }
    return '';
  };

  const date = findMatch(datePatterns);
  const description = findMatch(descPatterns);
  const amount = findMatch(amountPatterns);
  const debit = findMatch(debitPatterns);
  const credit = findMatch(creditPatterns);

  if (!date || !description) return null;
  if (!amount && !debit && !credit) return null;

  return {
    date,
    description,
    amount,
    debit: debit || undefined,
    credit: credit || undefined,
  };
}
