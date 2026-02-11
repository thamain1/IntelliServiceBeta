import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PayStub, YTDTotals } from '../../services/PayrollService';

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export class PayStubPDF {
  static generatePDF(stub: PayStub, ytdTotals: YTDTotals | null): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Company Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('IntelliService', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Pay Statement', pageWidth / 2, 28, { align: 'center' });

    // Pay Period Info
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Pay Period: ${this.formatDate(stub.period_start_date)} - ${this.formatDate(stub.period_end_date)}`, pageWidth / 2, 36, { align: 'center' });
    doc.text(`Pay Date: ${this.formatDate(stub.pay_date)}`, pageWidth / 2, 42, { align: 'center' });
    doc.text(`Check #: ${stub.run_number}`, pageWidth / 2, 48, { align: 'center' });

    // Employee Info Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 55, 85, 25, 2, 2, 'FD');

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Employee', 18, 63);
    doc.setFont('helvetica', 'normal');
    doc.text(stub.employee_name, 18, 70);

    // Earnings Section
    let yPos = 90;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Earnings', 14, yPos);
    yPos += 5;

    const earningsData = [
      ['Regular Pay', stub.regular_hours.toFixed(2), this.formatCurrency(stub.regular_hours > 0 ? stub.regular_pay / stub.regular_hours : 0), this.formatCurrency(stub.regular_pay)],
    ];

    if (stub.overtime_hours > 0) {
      earningsData.push([
        'Overtime Pay',
        stub.overtime_hours.toFixed(2),
        this.formatCurrency(stub.overtime_hours > 0 ? stub.overtime_pay / stub.overtime_hours : 0),
        this.formatCurrency(stub.overtime_pay),
      ]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Hours', 'Rate', 'Amount']],
      body: earningsData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [59, 130, 246], textColor: 255 },
      columnStyles: {
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
      },
      foot: [['Gross Pay', '', '', this.formatCurrency(stub.gross_pay)]],
      footStyles: { fillColor: [240, 253, 244], textColor: [22, 163, 74], fontStyle: 'bold' },
    });

    yPos = (doc as unknown as JsPDFWithAutoTable).lastAutoTable?.finalY || yPos + 30;
    yPos += 10;

    // Deductions Section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Deductions', 14, yPos);
    yPos += 5;

    // Estimated deduction breakdown (in a real app, this would come from actual deduction data)
    const grossPay = stub.gross_pay;
    const totalDeductions = stub.total_deductions;

    // Approximate breakdown based on standard rates
    const federalTax = grossPay * 0.22 * (totalDeductions / (grossPay * 0.35));
    const stateTax = grossPay * 0.05 * (totalDeductions / (grossPay * 0.35));
    const socialSecurity = grossPay * 0.062 * (totalDeductions / (grossPay * 0.35));
    const medicare = grossPay * 0.0145 * (totalDeductions / (grossPay * 0.35));

    const deductionsData = [
      ['Federal Income Tax', this.formatCurrency(federalTax)],
      ['State Income Tax', this.formatCurrency(stateTax)],
      ['Social Security', this.formatCurrency(socialSecurity)],
      ['Medicare', this.formatCurrency(medicare)],
    ];

    autoTable(doc, {
      startY: yPos,
      head: [['Description', 'Amount']],
      body: deductionsData,
      theme: 'striped',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: [239, 68, 68], textColor: 255 },
      columnStyles: {
        1: { halign: 'right' },
      },
      foot: [['Total Deductions', this.formatCurrency(stub.total_deductions)]],
      footStyles: { fillColor: [254, 242, 242], textColor: [220, 38, 38], fontStyle: 'bold' },
    });

    yPos = (doc as unknown as JsPDFWithAutoTable).lastAutoTable?.finalY || yPos + 40;
    yPos += 15;

    // Net Pay Box
    doc.setFillColor(239, 246, 255);
    doc.setDrawColor(59, 130, 246);
    doc.roundedRect(14, yPos, pageWidth - 28, 25, 2, 2, 'FD');

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Net Pay', 20, yPos + 10);

    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text(this.formatCurrency(stub.net_pay), pageWidth - 20, yPos + 15, { align: 'right' });

    yPos += 35;

    // YTD Summary
    if (ytdTotals) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('Year-to-Date Summary', 14, yPos);
      yPos += 5;

      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Current', 'YTD']],
        body: [
          ['Gross Pay', this.formatCurrency(stub.gross_pay), this.formatCurrency(ytdTotals.total_gross_pay)],
          ['Total Deductions', this.formatCurrency(stub.total_deductions), this.formatCurrency(ytdTotals.total_deductions)],
          ['Net Pay', this.formatCurrency(stub.net_pay), this.formatCurrency(ytdTotals.total_net_pay)],
          ['Regular Hours', stub.regular_hours.toFixed(2), ytdTotals.total_regular_hours.toFixed(2)],
          ['Overtime Hours', stub.overtime_hours.toFixed(2), ytdTotals.total_overtime_hours.toFixed(2)],
        ],
        theme: 'striped',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [107, 114, 128], textColor: 255 },
        columnStyles: {
          1: { halign: 'right' },
          2: { halign: 'right' },
        },
      });
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('This is a confidential document. Please retain for your records.', pageWidth / 2, pageHeight - 20, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, pageHeight - 14, { align: 'center' });

    // Save
    const fileName = `PayStub_${stub.employee_name.replace(/\s+/g, '_')}_${stub.pay_date}.pdf`;
    doc.save(fileName);
  }

  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  }

  private static formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}
