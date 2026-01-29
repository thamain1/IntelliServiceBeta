import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface ExportColumn {
  header: string;
  key: string;
  width?: number;
  format?: 'currency' | 'date' | 'number' | 'percent';
}

export interface ExportData {
  title: string;
  subtitle?: string;
  dateRange?: { start: Date; end: Date };
  columns: ExportColumn[];
  rows: Record<string, any>[];
  summary?: Record<string, any>;
  generatedAt?: Date;
}

export type ExportFormat = 'pdf' | 'excel' | 'csv';

export class ExportService {
  /**
   * Export data to PDF using jsPDF
   */
  static exportToPDF(data: ExportData): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(data.title, pageWidth / 2, 20, { align: 'center' });

    // Subtitle / Date Range
    let yPos = 28;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (data.subtitle) {
      doc.text(data.subtitle, pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
    }

    if (data.dateRange) {
      const dateRangeText = `${this.formatDate(data.dateRange.start)} - ${this.formatDate(data.dateRange.end)}`;
      doc.text(dateRangeText, pageWidth / 2, yPos, { align: 'center' });
      yPos += 6;
    }

    // Generated date
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(`Generated: ${this.formatDate(data.generatedAt || new Date())}`, pageWidth / 2, yPos, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    yPos += 10;

    // Prepare table data
    const headers = data.columns.map((col) => col.header);
    const rows = data.rows.map((row) =>
      data.columns.map((col) => this.formatValue(row[col.key], col.format))
    );

    // Add table
    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: yPos,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      columnStyles: this.getColumnStyles(data.columns),
    });

    // Add summary if present
    if (data.summary) {
      const finalY = (doc as any).lastAutoTable.finalY || yPos;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 14, finalY + 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);

      let summaryY = finalY + 22;
      Object.entries(data.summary).forEach(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        doc.text(`${formattedKey}: ${value}`, 14, summaryY);
        summaryY += 6;
      });
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(128, 128, 128);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    // Save the PDF
    const fileName = this.generateFileName(data.title, 'pdf');
    doc.save(fileName);
  }

  /**
   * Export data to Excel using xlsx
   */
  static exportToExcel(data: ExportData): void {
    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Prepare header row
    const headers = data.columns.map((col) => col.header);

    // Prepare data rows
    const rows = data.rows.map((row) =>
      data.columns.map((col) => {
        const value = row[col.key];
        // Keep raw values for Excel (formatting handled by Excel)
        if (col.format === 'currency' && typeof value === 'number') {
          return value;
        }
        if (col.format === 'date' && value) {
          return new Date(value);
        }
        return value;
      })
    );

    // Create worksheet data
    const wsData = [headers, ...rows];

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    const colWidths = data.columns.map((col) => ({
      wch: col.width || Math.max(col.header.length, 15),
    }));
    worksheet['!cols'] = colWidths;

    // Add summary if present
    if (data.summary) {
      const summaryStartRow = rows.length + 3;
      Object.entries(data.summary).forEach(([key, value], index) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        XLSX.utils.sheet_add_aoa(
          worksheet,
          [[formattedKey, value]],
          { origin: { r: summaryStartRow + index, c: 0 } }
        );
      });
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

    // Add metadata worksheet
    const metaData = [
      ['Report Title', data.title],
      ['Generated', this.formatDate(data.generatedAt || new Date())],
    ];
    if (data.dateRange) {
      metaData.push([
        'Date Range',
        `${this.formatDate(data.dateRange.start)} - ${this.formatDate(data.dateRange.end)}`,
      ]);
    }
    if (data.subtitle) {
      metaData.push(['Description', data.subtitle]);
    }
    const metaSheet = XLSX.utils.aoa_to_sheet(metaData);
    XLSX.utils.book_append_sheet(workbook, metaSheet, 'Info');

    // Generate Excel file
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // Save the file
    const fileName = this.generateFileName(data.title, 'xlsx');
    saveAs(blob, fileName);
  }

  /**
   * Export data to CSV (native implementation)
   */
  static exportToCSV(data: ExportData): void {
    const headers = data.columns.map((col) => this.escapeCSV(col.header));
    const headerRow = headers.join(',');

    const rows = data.rows.map((row) =>
      data.columns
        .map((col) => this.escapeCSV(this.formatValue(row[col.key], col.format)))
        .join(',')
    );

    // Build CSV content
    let csvContent = headerRow + '\n' + rows.join('\n');

    // Add summary if present
    if (data.summary) {
      csvContent += '\n\nSummary\n';
      Object.entries(data.summary).forEach(([key, value]) => {
        const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
        csvContent += `${this.escapeCSV(formattedKey)},${this.escapeCSV(String(value))}\n`;
      });
    }

    // Add metadata
    csvContent += '\n\nReport Information\n';
    csvContent += `Generated,${this.escapeCSV(this.formatDate(data.generatedAt || new Date()))}\n`;
    if (data.dateRange) {
      csvContent += `Date Range,${this.escapeCSV(
        `${this.formatDate(data.dateRange.start)} - ${this.formatDate(data.dateRange.end)}`
      )}\n`;
    }

    // Create blob and save
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const fileName = this.generateFileName(data.title, 'csv');
    saveAs(blob, fileName);
  }

  /**
   * Export data in the specified format
   */
  static export(data: ExportData, format: ExportFormat): void {
    switch (format) {
      case 'pdf':
        this.exportToPDF(data);
        break;
      case 'excel':
        this.exportToExcel(data);
        break;
      case 'csv':
        this.exportToCSV(data);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Format a value based on its type
   */
  static formatValue(value: any, format?: string): string {
    if (value === null || value === undefined) {
      return '';
    }

    switch (format) {
      case 'currency':
        return this.formatCurrency(Number(value));
      case 'date':
        return this.formatDate(new Date(value));
      case 'number':
        return Number(value).toLocaleString();
      case 'percent':
        return `${(Number(value) * 100).toFixed(1)}%`;
      default:
        return String(value);
    }
  }

  /**
   * Format currency value
   */
  static formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  /**
   * Format date value
   */
  static formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  /**
   * Generate a filename for the export
   */
  private static generateFileName(title: string, extension: string): string {
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const timestamp = new Date().toISOString().split('T')[0];
    return `${sanitizedTitle}-${timestamp}.${extension}`;
  }

  /**
   * Escape a value for CSV
   */
  private static escapeCSV(value: string): string {
    if (!value) return '';
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  /**
   * Get column styles for PDF table
   */
  private static getColumnStyles(columns: ExportColumn[]): Record<number, any> {
    const styles: Record<number, any> = {};
    columns.forEach((col, index) => {
      if (col.format === 'currency' || col.format === 'number' || col.format === 'percent') {
        styles[index] = { halign: 'right' };
      }
    });
    return styles;
  }
}
