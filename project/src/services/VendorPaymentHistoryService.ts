import { supabase } from '../lib/supabase';
import { Views } from '../lib/dbTypes';

export interface VendorApKpis {
  vendorId: string | null;
  vendorName: string;
  totalPaid: number;
  pendingBalance: number;
  overdueBalance: number;
  billCount: number;
  paidBillCount: number;
  overdueBillCount: number;
}

export interface PaymentHistoryRecord {
  documentId: string;
  documentType: 'bill' | 'payment';
  vendorId: string;
  vendorName: string;
  documentNumber: string;
  documentDate: string;
  dueDate: string | null;
  amount: number;
  openBalance: number;
  status: string;
  paymentMethod: string | null;
  reference: string | null;
  category: string | null;
  description: string | null;
  isOverdue: boolean;
  createdAt: string;
}

export interface GetVendorApKpisParams {
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface GetVendorPaymentHistoryParams {
  vendorId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
}

export class VendorPaymentHistoryService {
  static async getVendorApKpis(params: GetVendorApKpisParams = {}): Promise<VendorApKpis[]> {
    try {
      let query = supabase
        .from('vw_vendor_ap_kpis')
        .select('*');

      if (params.vendorId) {
        query = query.eq('vendor_id', params.vendorId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching vendor AP KPIs:', error);
        throw new Error(`Failed to fetch vendor AP KPIs: ${error.message}`);
      }

      return (data || []).map((row: Views<'vw_vendor_ap_kpis'>) => ({
        vendorId: row.vendor_id,
        vendorName: row.vendor_name || 'Unknown Vendor',
        totalPaid: parseFloat(String(row.total_paid || 0)),
        pendingBalance: parseFloat(String(row.pending_balance || 0)),
        overdueBalance: parseFloat(String(row.overdue_balance || 0)),
        billCount: parseInt(String(row.bill_count || 0)),
        paidBillCount: parseInt(String(row.paid_bill_count || 0)),
        overdueBillCount: parseInt(String(row.overdue_bill_count || 0)),
      }));
    } catch (error) {
      console.error('Error in getVendorApKpis:', error);
      throw error;
    }
  }

  static async getVendorPaymentHistory(
    params: GetVendorPaymentHistoryParams = {}
  ): Promise<PaymentHistoryRecord[]> {
    try {
      let query = supabase
        .from('vw_vendor_payment_history')
        .select('*')
        .order('document_date', { ascending: false });

      if (params.vendorId) {
        query = query.eq('vendor_id', params.vendorId);
      }

      if (params.dateFrom) {
        query = query.gte('document_date', params.dateFrom);
      }

      if (params.dateTo) {
        query = query.lte('document_date', params.dateTo);
      }

      if (params.status && params.status !== 'all') {
        if (params.status === 'open') {
          query = query.in('status', ['unpaid', 'partial']);
        } else if (params.status === 'overdue') {
          query = query.eq('is_overdue', true);
        } else if (params.status === 'paid') {
          query = query.eq('status', 'paid');
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching payment history:', error);
        throw new Error(`Failed to fetch payment history: ${error.message}`);
      }

      return (data || []).map((row: Views<'vw_vendor_payment_history'>) => ({
        documentId: row.document_id || '',
        documentType: (row.document_type || 'bill') as 'bill' | 'payment',
        vendorId: row.vendor_id || '',
        vendorName: row.vendor_name || 'Unknown Vendor',
        documentNumber: row.document_number || '',
        documentDate: row.document_date || '',
        dueDate: row.due_date,
        amount: parseFloat(String(row.amount || 0)),
        openBalance: parseFloat(String(row.open_balance || 0)),
        status: row.status || '',
        paymentMethod: row.payment_method,
        reference: row.reference,
        category: row.category,
        description: row.description,
        isOverdue: row.is_overdue || false,
        createdAt: row.created_at || '',
      }));
    } catch (error) {
      console.error('Error in getVendorPaymentHistory:', error);
      throw error;
    }
  }

  static async getOverallKpis(params: GetVendorApKpisParams = {}): Promise<{
    totalPaid: number;
    pendingBalance: number;
    overdueBalance: number;
  }> {
    try {
      const kpis = await this.getVendorApKpis(params);

      const totals = kpis.reduce(
        (acc, vendor) => ({
          totalPaid: acc.totalPaid + vendor.totalPaid,
          pendingBalance: acc.pendingBalance + vendor.pendingBalance,
          overdueBalance: acc.overdueBalance + vendor.overdueBalance,
        }),
        { totalPaid: 0, pendingBalance: 0, overdueBalance: 0 }
      );

      return totals;
    } catch (error) {
      console.error('Error in getOverallKpis:', error);
      throw error;
    }
  }
}
