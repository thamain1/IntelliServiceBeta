/**
 * Accounts Payable Service
 * Handles bills, payments, and AP-related operations
 */

import { supabase } from '../lib/supabase';

// Types
export interface Bill {
  id: string;
  bill_number: string;
  vendor_id: string;
  bill_date: string;
  due_date: string;
  received_date?: string;
  status: BillStatus;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_terms?: string;
  reference_number?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  vendor?: {
    id: string;
    name: string;
    vendor_code?: string;
  };
  line_items?: BillLineItem[];
}

export interface BillLineItem {
  id?: string;
  bill_id?: string;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  gl_account_id?: string;
  sort_order?: number;
  gl_account?: {
    id: string;
    account_number: string;
    account_name: string;
  };
}

export interface VendorPayment {
  id: string;
  payment_number: string;
  vendor_id: string;
  payment_date: string;
  amount: number;
  payment_method?: PaymentMethod;
  reference_number?: string;
  check_number?: string;
  bank_account_id?: string;
  notes?: string;
  created_by?: string;
  created_at: string;
  vendor?: {
    id: string;
    name: string;
    vendor_code?: string;
  };
  allocations?: PaymentAllocation[];
}

export interface PaymentAllocation {
  id?: string;
  payment_id?: string;
  bill_id: string;
  amount: number;
  bill?: {
    id: string;
    bill_number: string;
    total_amount: number;
    balance_due: number;
  };
}

export interface APAgingRow {
  vendor_id: string;
  vendor_name: string;
  vendor_code?: string;
  bill_count: number;
  current_amount: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_over_90: number;
  total_balance: number;
}

export interface APSummary {
  total_outstanding: number;
  total_overdue: number;
  due_this_week: number;
  bills_count: number;
  overdue_count: number;
}

export type BillStatus = 'draft' | 'received' | 'approved' | 'partial' | 'paid' | 'void';
export type PaymentMethod = 'check' | 'ach' | 'wire' | 'credit_card' | 'cash' | 'other';

export interface CreateBillInput {
  vendor_id: string;
  bill_date: string;
  due_date: string;
  received_date?: string;
  payment_terms?: string;
  reference_number?: string;
  notes?: string;
  tax_amount?: number;
  line_items: Omit<BillLineItem, 'id' | 'bill_id'>[];
}

export interface UpdateBillInput {
  vendor_id?: string;
  bill_date?: string;
  due_date?: string;
  received_date?: string;
  payment_terms?: string;
  reference_number?: string;
  notes?: string;
  tax_amount?: number;
  status?: BillStatus;
}

export interface CreatePaymentInput {
  vendor_id: string;
  payment_date: string;
  amount: number;
  payment_method?: PaymentMethod;
  reference_number?: string;
  check_number?: string;
  bank_account_id?: string;
  notes?: string;
  allocations: Omit<PaymentAllocation, 'id' | 'payment_id'>[];
}

export interface BillFilters {
  vendor_id?: string;
  status?: BillStatus | BillStatus[];
  date_from?: string;
  date_to?: string;
  due_date_from?: string;
  due_date_to?: string;
  search?: string;
}

export class APService {
  // ========== Bill Operations ==========

  /**
   * Get all bills with optional filters
   */
  static async getBills(filters?: BillFilters): Promise<Bill[]> {
    let query = supabase
      .from('bills')
      .select(`
        *,
        vendor:vendors(id, name, vendor_code)
      `)
      .order('bill_date', { ascending: false });

    if (filters?.vendor_id) {
      query = query.eq('vendor_id', filters.vendor_id);
    }

    if (filters?.status) {
      if (Array.isArray(filters.status)) {
        query = query.in('status', filters.status);
      } else {
        query = query.eq('status', filters.status);
      }
    }

    if (filters?.date_from) {
      query = query.gte('bill_date', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('bill_date', filters.date_to);
    }

    if (filters?.due_date_from) {
      query = query.gte('due_date', filters.due_date_from);
    }

    if (filters?.due_date_to) {
      query = query.lte('due_date', filters.due_date_to);
    }

    if (filters?.search) {
      query = query.or(
        `bill_number.ilike.%${filters.search}%,reference_number.ilike.%${filters.search}%`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single bill by ID with line items
   */
  static async getBillById(billId: string): Promise<Bill | null> {
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select(`
        *,
        vendor:vendors(id, name, vendor_code)
      `)
      .eq('id', billId)
      .single();

    if (billError) throw billError;
    if (!bill) return null;

    const { data: lineItems, error: lineItemsError } = await supabase
      .from('bill_line_items')
      .select(`
        *,
        gl_account:chart_of_accounts(id, account_number, account_name)
      `)
      .eq('bill_id', billId)
      .order('sort_order');

    if (lineItemsError) throw lineItemsError;

    return {
      ...bill,
      line_items: lineItems || [],
    };
  }

  /**
   * Generate next bill number
   */
  static async getNextBillNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_bill_number');
    if (error) throw error;
    return data;
  }

  /**
   * Create a new bill with line items
   */
  static async createBill(input: CreateBillInput): Promise<Bill> {
    const billNumber = await this.getNextBillNumber();

    // Calculate totals
    const subtotal = input.line_items.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = input.tax_amount || 0;
    const totalAmount = subtotal + taxAmount;

    // Create bill
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        bill_number: billNumber,
        vendor_id: input.vendor_id,
        bill_date: input.bill_date,
        due_date: input.due_date,
        received_date: input.received_date,
        payment_terms: input.payment_terms,
        reference_number: input.reference_number,
        notes: input.notes,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        balance_due: totalAmount,
        status: 'draft',
      })
      .select()
      .single();

    if (billError) throw billError;

    // Create line items
    if (input.line_items.length > 0) {
      const lineItemsToInsert = input.line_items.map((item, index) => ({
        bill_id: bill.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        gl_account_id: item.gl_account_id,
        sort_order: index,
      }));

      const { error: lineItemsError } = await supabase
        .from('bill_line_items')
        .insert(lineItemsToInsert);

      if (lineItemsError) throw lineItemsError;
    }

    return this.getBillById(bill.id) as Promise<Bill>;
  }

  /**
   * Update a bill
   */
  static async updateBill(billId: string, input: UpdateBillInput): Promise<Bill> {
    const { data, error } = await supabase
      .from('bills')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', billId)
      .select()
      .single();

    if (error) throw error;
    return this.getBillById(billId) as Promise<Bill>;
  }

  /**
   * Update bill line items
   */
  static async updateBillLineItems(
    billId: string,
    lineItems: Omit<BillLineItem, 'bill_id'>[]
  ): Promise<void> {
    // Delete existing line items
    const { error: deleteError } = await supabase
      .from('bill_line_items')
      .delete()
      .eq('bill_id', billId);

    if (deleteError) throw deleteError;

    // Insert new line items
    if (lineItems.length > 0) {
      const lineItemsToInsert = lineItems.map((item, index) => ({
        bill_id: billId,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        amount: item.amount,
        gl_account_id: item.gl_account_id,
        sort_order: index,
      }));

      const { error: insertError } = await supabase
        .from('bill_line_items')
        .insert(lineItemsToInsert);

      if (insertError) throw insertError;
    }

    // Recalculate tax if needed
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    await supabase
      .from('bills')
      .update({
        subtotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', billId);
  }

  /**
   * Post (approve) a bill - changes status from draft to approved
   */
  static async postBill(billId: string): Promise<Bill> {
    const bill = await this.getBillById(billId);
    if (!bill) throw new Error('Bill not found');
    if (bill.status !== 'draft' && bill.status !== 'received') {
      throw new Error('Only draft or received bills can be posted');
    }

    return this.updateBill(billId, { status: 'approved' });
  }

  /**
   * Void a bill
   */
  static async voidBill(billId: string): Promise<Bill> {
    const bill = await this.getBillById(billId);
    if (!bill) throw new Error('Bill not found');
    if (bill.amount_paid > 0) {
      throw new Error('Cannot void a bill with payments applied');
    }

    return this.updateBill(billId, { status: 'void' });
  }

  /**
   * Delete a draft bill
   */
  static async deleteBill(billId: string): Promise<void> {
    const bill = await this.getBillById(billId);
    if (!bill) throw new Error('Bill not found');
    if (bill.status !== 'draft') {
      throw new Error('Only draft bills can be deleted');
    }

    const { error } = await supabase.from('bills').delete().eq('id', billId);
    if (error) throw error;
  }

  // ========== Payment Operations ==========

  /**
   * Get vendor payments
   */
  static async getPayments(vendorId?: string): Promise<VendorPayment[]> {
    let query = supabase
      .from('vendor_payments')
      .select(`
        *,
        vendor:vendors(id, name, vendor_code)
      `)
      .order('payment_date', { ascending: false });

    if (vendorId) {
      query = query.eq('vendor_id', vendorId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single payment with allocations
   */
  static async getPaymentById(paymentId: string): Promise<VendorPayment | null> {
    const { data: payment, error: paymentError } = await supabase
      .from('vendor_payments')
      .select(`
        *,
        vendor:vendors(id, name, vendor_code)
      `)
      .eq('id', paymentId)
      .single();

    if (paymentError) throw paymentError;
    if (!payment) return null;

    const { data: allocations, error: allocationsError } = await supabase
      .from('vendor_payment_allocations')
      .select(`
        *,
        bill:bills(id, bill_number, total_amount, balance_due)
      `)
      .eq('payment_id', paymentId);

    if (allocationsError) throw allocationsError;

    return {
      ...payment,
      allocations: allocations || [],
    };
  }

  /**
   * Generate next payment number
   */
  static async getNextPaymentNumber(): Promise<string> {
    const { data, error } = await supabase.rpc('generate_vendor_payment_number');
    if (error) throw error;
    return data;
  }

  /**
   * Create a vendor payment with bill allocations
   */
  static async createPayment(input: CreatePaymentInput): Promise<VendorPayment> {
    const paymentNumber = await this.getNextPaymentNumber();

    // Validate allocation amounts
    const totalAllocated = input.allocations.reduce((sum, a) => sum + a.amount, 0);
    if (totalAllocated > input.amount) {
      throw new Error('Total allocations cannot exceed payment amount');
    }

    // Validate bills belong to vendor and have sufficient balance
    for (const allocation of input.allocations) {
      const bill = await this.getBillById(allocation.bill_id);
      if (!bill) throw new Error(`Bill ${allocation.bill_id} not found`);
      if (bill.vendor_id !== input.vendor_id) {
        throw new Error(`Bill ${bill.bill_number} does not belong to this vendor`);
      }
      if (allocation.amount > bill.balance_due) {
        throw new Error(`Allocation amount exceeds balance due for bill ${bill.bill_number}`);
      }
    }

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from('vendor_payments')
      .insert({
        payment_number: paymentNumber,
        vendor_id: input.vendor_id,
        payment_date: input.payment_date,
        amount: input.amount,
        payment_method: input.payment_method,
        reference_number: input.reference_number,
        check_number: input.check_number,
        bank_account_id: input.bank_account_id,
        notes: input.notes,
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Create allocations
    if (input.allocations.length > 0) {
      const allocationsToInsert = input.allocations.map((a) => ({
        payment_id: payment.id,
        bill_id: a.bill_id,
        amount: a.amount,
      }));

      const { error: allocationsError } = await supabase
        .from('vendor_payment_allocations')
        .insert(allocationsToInsert);

      if (allocationsError) throw allocationsError;
    }

    return this.getPaymentById(payment.id) as Promise<VendorPayment>;
  }

  /**
   * Delete a payment (reverses allocations)
   */
  static async deletePayment(paymentId: string): Promise<void> {
    const { error } = await supabase.from('vendor_payments').delete().eq('id', paymentId);
    if (error) throw error;
  }

  // ========== Reporting Operations ==========

  /**
   * Get AP aging report
   */
  static async getAPAging(): Promise<APAgingRow[]> {
    const { data, error } = await supabase
      .from('vw_ap_aging')
      .select('*')
      .order('total_balance', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get AP summary statistics
   */
  static async getAPSummary(): Promise<APSummary> {
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: bills, error } = await supabase
      .from('bills')
      .select('id, balance_due, due_date, status')
      .in('status', ['approved', 'partial', 'received']);

    if (error) throw error;

    const activeBills = bills || [];

    const total_outstanding = activeBills.reduce((sum, b) => sum + (b.balance_due || 0), 0);
    const overdueBills = activeBills.filter((b) => b.due_date < today);
    const total_overdue = overdueBills.reduce((sum, b) => sum + (b.balance_due || 0), 0);
    const dueThisWeekBills = activeBills.filter(
      (b) => b.due_date >= today && b.due_date <= weekFromNow
    );
    const due_this_week = dueThisWeekBills.reduce((sum, b) => sum + (b.balance_due || 0), 0);

    return {
      total_outstanding,
      total_overdue,
      due_this_week,
      bills_count: activeBills.length,
      overdue_count: overdueBills.length,
    };
  }

  /**
   * Get unpaid bills for a vendor
   */
  static async getUnpaidBillsForVendor(vendorId: string): Promise<Bill[]> {
    return this.getBills({
      vendor_id: vendorId,
      status: ['approved', 'partial', 'received'],
    });
  }

  /**
   * Get recent bills
   */
  static async getRecentBills(limit: number = 10): Promise<Bill[]> {
    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        vendor:vendors(id, name, vendor_code)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get overdue bills
   */
  static async getOverdueBills(): Promise<Bill[]> {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('bills')
      .select(`
        *,
        vendor:vendors(id, name, vendor_code)
      `)
      .in('status', ['approved', 'partial', 'received'])
      .lt('due_date', today)
      .order('due_date');

    if (error) throw error;
    return data || [];
  }
}
