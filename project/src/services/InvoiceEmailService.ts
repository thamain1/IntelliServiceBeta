import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import { InvoiceLineItemRow } from '../lib/dbTypes';

// Type for jsPDF extended with autoTable's lastAutoTable property
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

export interface InvoiceEmailData {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  dueDate: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    line_total: number;
    taxable: boolean;
  }>;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountAmount: number;
  balanceDue: number;
  customerNotes?: string;
}

export interface EmailComposition {
  to: string;
  subject: string;
  body: string;
  attachPdf: boolean;
}

export class InvoiceEmailService {
  /**
   * Generate invoice PDF as a Blob
   */
  static async generateInvoicePDF(data: InvoiceEmailData): Promise<Blob> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Company Header (would come from settings in production)
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, 20, { align: 'center' });

    // Invoice details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    // Invoice Number and Date
    doc.text(`Invoice #: ${data.invoiceNumber}`, 14, 35);
    doc.text(`Due Date: ${new Date(data.dueDate).toLocaleDateString()}`, 14, 42);

    // Bill To
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 14, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(data.customerName, 14, 62);
    if (data.customerEmail) {
      doc.text(data.customerEmail, 14, 69);
    }

    // Line Items Table
    const tableData = data.lineItems.map((item) => [
      item.description,
      item.quantity.toString(),
      `$${item.unit_price.toFixed(2)}`,
      `$${item.line_total.toFixed(2)}`,
    ]);

    autoTable(doc, {
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      startY: 80,
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'right', cellWidth: 35 },
        3: { halign: 'right', cellWidth: 35 },
      },
    });

    // Totals
    const finalY = (doc as unknown as jsPDFWithAutoTable).lastAutoTable.finalY || 80;

    doc.setFontSize(10);
    const totalsX = pageWidth - 70;

    doc.text('Subtotal:', totalsX, finalY + 15);
    doc.text(`$${data.subtotal.toFixed(2)}`, pageWidth - 14, finalY + 15, { align: 'right' });

    doc.text(`Tax (${data.taxRate}%):`, totalsX, finalY + 22);
    doc.text(`$${data.taxAmount.toFixed(2)}`, pageWidth - 14, finalY + 22, { align: 'right' });

    if (data.discountAmount > 0) {
      doc.text('Discount:', totalsX, finalY + 29);
      doc.text(`-$${data.discountAmount.toFixed(2)}`, pageWidth - 14, finalY + 29, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const totalY = data.discountAmount > 0 ? finalY + 40 : finalY + 33;
    doc.text('Total Due:', totalsX, totalY);
    doc.text(`$${data.balanceDue.toFixed(2)}`, pageWidth - 14, totalY, { align: 'right' });

    // Customer Notes
    if (data.customerNotes) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Notes:', 14, totalY + 15);
      doc.text(data.customerNotes, 14, totalY + 22, { maxWidth: pageWidth - 28 });
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      'Thank you for your business!',
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 15,
      { align: 'center' }
    );

    return doc.output('blob');
  }

  /**
   * Get default email composition for an invoice
   */
  static getDefaultEmailComposition(data: InvoiceEmailData): EmailComposition {
    return {
      to: data.customerEmail,
      subject: `Invoice ${data.invoiceNumber} from Your Company`,
      body: `Dear ${data.customerName},

Please find attached Invoice ${data.invoiceNumber} for $${data.totalAmount.toFixed(2)}.

Due Date: ${new Date(data.dueDate).toLocaleDateString()}

If you have any questions about this invoice, please don't hesitate to contact us.

Thank you for your business!

Best regards,
Your Company`,
      attachPdf: true,
    };
  }

  /**
   * Send invoice email via Supabase Edge Function
   * Falls back to opening mailto link if function is not available
   */
  static async sendInvoiceEmail(
    data: InvoiceEmailData,
    composition: EmailComposition
  ): Promise<{ success: boolean; message: string; method: 'function' | 'mailto' }> {
    try {
      // Try to send via Supabase Edge Function
      const { data: result, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          to: composition.to,
          subject: composition.subject,
          body: composition.body,
          invoiceId: data.invoiceId,
          attachPdf: composition.attachPdf,
        },
      });

      if (error) {
        throw error;
      }

      if (result?.success) {
        // Update invoice status to sent
        await supabase
          .from('invoices')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
          .eq('id', data.invoiceId);

        return {
          success: true,
          message: 'Invoice sent successfully!',
          method: 'function',
        };
      }

      throw new Error(result?.error || 'Failed to send email');
    } catch (_error) {
      // Edge function not available or failed, use mailto fallback
      console.log('Edge function not available, falling back to mailto');
      return this.openMailtoLink(data, composition);
    }
  }

  /**
   * Open mailto link as fallback
   */
  static openMailtoLink(
    _data: InvoiceEmailData,
    composition: EmailComposition
  ): { success: boolean; message: string; method: 'mailto' } {
    const mailtoLink = `mailto:${encodeURIComponent(composition.to)}?subject=${encodeURIComponent(
      composition.subject
    )}&body=${encodeURIComponent(composition.body)}`;

    window.open(mailtoLink, '_blank');

    return {
      success: true,
      message: 'Email client opened. Please attach the downloaded PDF manually.',
      method: 'mailto',
    };
  }

  /**
   * Download invoice PDF
   */
  static async downloadInvoicePDF(data: InvoiceEmailData): Promise<void> {
    const pdfBlob = await this.generateInvoicePDF(data);
    const url = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Invoice-${data.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Load invoice data for email
   */
  static async loadInvoiceEmailData(invoiceId: string): Promise<InvoiceEmailData | null> {
    try {
      // Load invoice
      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        throw new Error('Invoice not found');
      }

      // Load customer
      const { data: customer } = await supabase
        .from('customers')
        .select('name, email')
        .eq('id', invoice.customer_id)
        .single();

      // Load line items
      const { data: lineItems } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoiceId)
        .order('sort_order');

      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoice_number,
        customerName: customer?.name || 'Customer',
        customerEmail: customer?.email || '',
        totalAmount: invoice.total_amount,
        dueDate: invoice.due_date,
        lineItems: (lineItems || []).map((item: InvoiceLineItemRow) => ({
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          line_total: item.line_total,
          taxable: item.taxable ?? false,
        })),
        subtotal: invoice.subtotal,
        taxRate: invoice.tax_rate,
        taxAmount: invoice.tax_amount,
        discountAmount: invoice.discount_amount,
        balanceDue: invoice.balance_due,
        customerNotes: invoice.customer_notes ?? undefined,
      };
    } catch (error) {
      console.error('Error loading invoice email data:', error);
      return null;
    }
  }
}
