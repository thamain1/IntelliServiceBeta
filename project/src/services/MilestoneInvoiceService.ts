import { supabase } from '../lib/supabase';
import { Tables } from '../lib/dbTypes';

// Composite type for joined invoice line item with invoices
type InvoiceLineItemWithInvoice = Tables<'invoice_line_items'> & {
  invoices: Tables<'invoices'>;
};

export interface CreateMilestoneInvoiceParams {
  milestoneId: string;
  projectId: string;
  customerId: string;
  issuedDate?: string;
  paymentTerms?: string;
  notes?: string;
  createdBy: string;
}

export interface DepositReleaseParams {
  projectId: string;
  releaseAmount: number;
  releaseReason: string;
  relatedMilestoneId?: string;
  relatedInvoiceId?: string;
  createdBy: string;
}

export class MilestoneInvoiceService {
  static async createInvoiceFromMilestone(params: CreateMilestoneInvoiceParams) {
    const {
      milestoneId,
      projectId,
      customerId,
      issuedDate = new Date().toISOString().split('T')[0],
      paymentTerms = 'Net 30',
      notes,
      createdBy
    } = params;

    const { data: milestone, error: milestoneError } = await supabase
      .from('project_billing_schedules')
      .select('*, projects(*)')
      .eq('id', milestoneId)
      .single();

    if (milestoneError) throw milestoneError;
    if (!milestone) throw new Error('Milestone not found');

    if (milestone.status === 'billed') {
      throw new Error('Milestone has already been fully billed');
    }

    const { data: amountResult } = await supabase.rpc('calculate_milestone_amount', {
      p_billing_schedule_id: milestoneId
    });

    const milestoneAmount = amountResult || 0;

    if (milestoneAmount <= 0) {
      throw new Error('Milestone amount must be greater than zero');
    }

    const dueDate = this.calculateDueDate(issuedDate, paymentTerms);
    const taxRate = 0;
    const taxAmount = 0;
    const totalAmount = milestoneAmount;

    const invoiceNumber = await this.generateInvoiceNumber();

    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        customer_id: customerId,
        project_id: projectId,
        issue_date: issuedDate,
        due_date: dueDate,
        payment_terms: paymentTerms,
        subtotal: milestoneAmount,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        discount_amount: 0,
        total_amount: totalAmount,
        amount_paid: 0,
        balance_due: totalAmount,
        notes: notes || `Invoice for milestone: ${milestone.name}`,
        status: 'draft',
        created_by: createdBy,
      })
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const { error: lineItemError } = await supabase
      .from('invoice_line_items')
      .insert({
        invoice_id: invoice.id,
        project_id: projectId,
        project_billing_schedule_id: milestoneId,
        item_type: milestone.is_deposit ? 'service' : 'service',
        description: `${milestone.name}${milestone.description ? ' - ' + milestone.description : ''}`,
        quantity: 1,
        unit_price: milestoneAmount,
        line_total: milestoneAmount,
        taxable: false,
        is_deposit: milestone.is_deposit || false,
        is_retainage: milestone.is_retainage || false,
        sort_order: 0
      });

    if (lineItemError) throw lineItemError;

    const { error: updateError } = await supabase
      .from('project_billing_schedules')
      .update({
        status: 'billed',
        invoice_id: invoice.id,
        billed_amount: milestoneAmount,
        updated_at: new Date().toISOString(),
        updated_by: createdBy
      })
      .eq('id', milestoneId);

    if (updateError) throw updateError;

    return invoice;
  }

  static async releaseDeposit(params: DepositReleaseParams) {
    const {
      projectId,
      releaseAmount,
      releaseReason,
      relatedMilestoneId,
      relatedInvoiceId,
      createdBy
    } = params;

    const { data: unreleasedAmount } = await supabase.rpc('get_unreleased_deposit_amount', {
      p_project_id: projectId
    });

    const maxRelease = unreleasedAmount || 0;

    if (releaseAmount > maxRelease) {
      throw new Error(`Cannot release $${releaseAmount}. Only $${maxRelease} available for release.`);
    }

    if (releaseAmount <= 0) {
      throw new Error('Release amount must be greater than zero');
    }

    const { data: depositInvoices, error: depositError } = await supabase
      .from('invoice_line_items')
      .select('*, invoices!inner(*)')
      .eq('project_id', projectId)
      .eq('is_deposit', true)
      .neq('invoices.status', 'cancelled');

    if (depositError) throw depositError;

    if (!depositInvoices || depositInvoices.length === 0) {
      throw new Error('No deposit invoices found for this project');
    }

    const firstDepositInvoice = (depositInvoices[0] as unknown as InvoiceLineItemWithInvoice).invoices;
    const firstDepositLineItem = depositInvoices[0];

    const { data: depositRelease, error: releaseError } = await supabase
      .from('project_deposit_releases')
      .insert({
        project_id: projectId,
        deposit_invoice_id: firstDepositInvoice.id,
        deposit_invoice_line_id: firstDepositLineItem.id,
        deposit_amount: firstDepositLineItem.line_total,
        release_amount: releaseAmount,
        release_date: new Date().toISOString().split('T')[0],
        release_reason: releaseReason,
        related_milestone_id: relatedMilestoneId,
        related_invoice_id: relatedInvoiceId,
        created_by: createdBy,
        notes: releaseReason
      })
      .select()
      .single();

    if (releaseError) throw releaseError;

    return depositRelease;
  }

  static async getProjectDepositSummary(projectId: string) {
    const { data: summary } = await supabase.rpc('get_project_billing_summary', {
      p_project_id: projectId
    });

    const { data: unreleasedAmount } = await supabase.rpc('get_unreleased_deposit_amount', {
      p_project_id: projectId
    });

    return {
      ...summary,
      deposits_unreleased: unreleasedAmount || 0
    };
  }

  private static async generateInvoiceNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  }

  private static calculateDueDate(issueDate: string, paymentTerms: string): string {
    const date = new Date(issueDate);
    const daysToAdd = paymentTerms === 'Net 15' ? 15 :
                      paymentTerms === 'Net 30' ? 30 :
                      paymentTerms === 'Net 60' ? 60 : 30;

    date.setDate(date.getDate() + daysToAdd);
    return date.toISOString().split('T')[0];
  }

  static async validateMilestoneForBilling(milestoneId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const { data: milestone } = await supabase
      .from('project_billing_schedules')
      .select('*, projects(*)')
      .eq('id', milestoneId)
      .single();

    if (!milestone) {
      errors.push('Milestone not found');
      return { valid: false, errors, warnings };
    }

    if (milestone.status === 'billed') {
      errors.push('Milestone has already been billed');
    }

    if (milestone.status !== 'ready_to_bill' && milestone.status !== 'planned') {
      warnings.push(`Milestone status is ${milestone.status}`);
    }

    const { data: amountResult } = await supabase.rpc('calculate_milestone_amount', {
      p_billing_schedule_id: milestoneId
    });

    const amount = amountResult || 0;

    if (amount <= 0) {
      errors.push('Milestone amount is zero or invalid');
    }

    const { data: allMilestones } = await supabase
      .from('project_billing_schedules')
      .select('*')
      .eq('project_id', milestone.project_id);

    if (allMilestones && milestone.projects) {
      const totalScheduled = await Promise.all(
        allMilestones.map(async (m) => {
          const { data: amt } = await supabase.rpc('calculate_milestone_amount', {
            p_billing_schedule_id: m.id
          });
          return amt || 0;
        })
      );

      const sum = totalScheduled.reduce((a, b) => a + b, 0);
      const contractValue = milestone.projects.contract_value_site ||
                            milestone.projects.contract_value_total ||
                            milestone.projects.budget || 0;

      if (contractValue > 0 && sum > contractValue * 1.05) {
        warnings.push(`Total milestones ($${sum.toFixed(2)}) exceed contract value ($${contractValue.toFixed(2)}) by ${(((sum / contractValue) - 1) * 100).toFixed(1)}%`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }
}
