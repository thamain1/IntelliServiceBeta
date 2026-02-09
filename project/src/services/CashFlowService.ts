import { supabase } from '../lib/supabase';
import { Tables } from '../lib/dbTypes';

/** GL entry with joined chart_of_accounts data for cash flow analysis */
type GLEntryWithAccount = Tables<'gl_entries'> & {
  chart_of_accounts: Pick<
    Tables<'chart_of_accounts'>,
    | 'account_code'
    | 'account_name'
    | 'account_type'
    | 'account_subtype'
    | 'is_cash_account'
    | 'cash_flow_section'
    | 'normal_balance'
  >;
};

export interface CashFlowLineItem {
  description: string;
  amount: number;
  details?: Array<{
    account_name: string;
    amount: number;
  }>;
}

export interface CashFlowSection {
  title: string;
  items: CashFlowLineItem[];
  subtotal: number;
}

export interface CashFlowStatement {
  start_date: string;
  end_date: string;
  beginning_cash: number;
  ending_cash: number;
  operating: CashFlowSection;
  investing: CashFlowSection;
  financing: CashFlowSection;
  net_change: number;
  unclassified_amount: number;
}

export interface JournalEntry {
  entry_number: string;
  entry_date: string;
  cash_lines: Array<{
    account_id: string;
    account_name: string;
    amount: number;
  }>;
  non_cash_lines: Array<{
    account_id: string;
    account_name: string;
    account_type: string;
    account_subtype: string | null;
    cash_flow_section: string | null;
    amount: number;
  }>;
  cash_change: number;
  classified_section: string;
}

export class CashFlowService {
  /**
   * Get list of cash account IDs
   */
  static async getCashAccounts(): Promise<string[]> {
    const { data, error } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('is_cash_account', true)
      .eq('is_active', true);

    if (error) throw error;
    return (data || []).map((a) => a.id);
  }

  /**
   * Get cash balance as of a specific date
   */
  static async getCashBalance(asOfDate: string, accountIds?: string[]): Promise<number> {
    let cashAccountIds = accountIds;
    if (!cashAccountIds) {
      cashAccountIds = await this.getCashAccounts();
    }

    if (cashAccountIds.length === 0) return 0;

    const { data, error } = await supabase.rpc('get_account_balances', {
      p_as_of_date: asOfDate,
    });

    if (error) throw error;

    const balances = data || [];
    let totalCash = 0;

    for (const balance of balances) {
      if (cashAccountIds.includes(balance.account_id)) {
        totalCash += Number(balance.balance) || 0;
      }
    }

    return totalCash;
  }

  /**
   * Classify a journal entry into Operating, Investing, or Financing
   */
  static classifyJournalEntry(entry: JournalEntry): string {
    if (entry.non_cash_lines.length === 0) {
      return 'operating';
    }

    let section = 'operating';
    let priority = 0;

    for (const line of entry.non_cash_lines) {
      let lineSection = line.cash_flow_section;
      let linePriority = 0;

      if (lineSection === 'investing') {
        linePriority = 3;
      } else if (lineSection === 'financing') {
        linePriority = 2;
      } else if (lineSection === 'operating') {
        linePriority = 1;
      } else if (lineSection === 'non_cash') {
        continue;
      } else {
        lineSection = this.deriveSection(line);
        if (lineSection === 'investing') linePriority = 3;
        else if (lineSection === 'financing') linePriority = 2;
        else linePriority = 1;
      }

      if (linePriority > priority) {
        section = lineSection;
        priority = linePriority;
      }
    }

    return section;
  }

  /**
   * Derive cash flow section from account type and subtype
   */
  static deriveSection(account: {
    account_type: string;
    account_subtype: string | null;
  }): string {
    const subtype = account.account_subtype?.toLowerCase() || '';
    const type = account.account_type.toLowerCase();

    if (
      subtype.includes('fixed asset') ||
      subtype.includes('property') ||
      subtype.includes('equipment') ||
      subtype.includes('vehicle') ||
      subtype.includes('building') ||
      subtype.includes('long-term investment')
    ) {
      return 'investing';
    }

    if (
      subtype.includes('long-term debt') ||
      subtype.includes('loan') ||
      subtype.includes('note payable') ||
      subtype.includes('mortgage') ||
      (type === 'equity' &&
        (subtype.includes('draw') ||
          subtype.includes('dividend') ||
          subtype.includes('distribution') ||
          subtype.includes('capital')))
    ) {
      return 'financing';
    }

    return 'operating';
  }

  /**
   * Get Cash Flow Statement for a date range
   */
  static async getCashFlowStatement(
    startDate: string,
    endDate: string,
    accountIds?: string[]
  ): Promise<CashFlowStatement> {
    const cashAccountIds = accountIds || (await this.getCashAccounts());

    if (cashAccountIds.length === 0) {
      return this.getEmptyStatement(startDate, endDate);
    }

    const dayBeforeStart = new Date(startDate);
    dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
    const dayBeforeStartStr = dayBeforeStart.toISOString().split('T')[0];

    const [beginningCash, endingCash, journalEntries] = await Promise.all([
      this.getCashBalance(dayBeforeStartStr, cashAccountIds),
      this.getCashBalance(endDate, cashAccountIds),
      this.getJournalEntriesAffectingCash(startDate, endDate, cashAccountIds),
    ]);

    const operating: CashFlowLineItem[] = [];
    const investing: CashFlowLineItem[] = [];
    const financing: CashFlowLineItem[] = [];
    let unclassified = 0;

    const operatingByCategory = new Map<string, number>();
    const investingByCategory = new Map<string, number>();
    const financingByCategory = new Map<string, number>();

    for (const entry of journalEntries) {
      const section = this.classifyJournalEntry(entry);

      if (entry.non_cash_lines.length === 0) {
        unclassified += entry.cash_change;
        continue;
      }

      const primaryAccount = entry.non_cash_lines[0];
      const category = this.getCategoryLabel(section, primaryAccount);

      if (section === 'operating') {
        operatingByCategory.set(
          category,
          (operatingByCategory.get(category) || 0) + entry.cash_change
        );
      } else if (section === 'investing') {
        investingByCategory.set(
          category,
          (investingByCategory.get(category) || 0) + entry.cash_change
        );
      } else if (section === 'financing') {
        financingByCategory.set(
          category,
          (financingByCategory.get(category) || 0) + entry.cash_change
        );
      }
    }

    operatingByCategory.forEach((amount, category) => {
      operating.push({ description: category, amount });
    });

    investingByCategory.forEach((amount, category) => {
      investing.push({ description: category, amount });
    });

    financingByCategory.forEach((amount, category) => {
      financing.push({ description: category, amount });
    });

    const operatingSubtotal = operating.reduce((sum, item) => sum + item.amount, 0);
    const investingSubtotal = investing.reduce((sum, item) => sum + item.amount, 0);
    const financingSubtotal = financing.reduce((sum, item) => sum + item.amount, 0);

    const netChange = operatingSubtotal + investingSubtotal + financingSubtotal + unclassified;

    return {
      start_date: startDate,
      end_date: endDate,
      beginning_cash: beginningCash,
      ending_cash: endingCash,
      operating: {
        title: 'Cash Flows from Operating Activities',
        items: operating,
        subtotal: operatingSubtotal,
      },
      investing: {
        title: 'Cash Flows from Investing Activities',
        items: investing,
        subtotal: investingSubtotal,
      },
      financing: {
        title: 'Cash Flows from Financing Activities',
        items: financing,
        subtotal: financingSubtotal,
      },
      net_change: netChange,
      unclassified_amount: unclassified,
    };
  }

  /**
   * Get a friendly category label for a cash flow line item
   */
  static getCategoryLabel(
    section: string,
    account: {
      account_type: string;
      account_subtype: string | null;
      account_name: string;
    }
  ): string {
    const subtype = account.account_subtype?.toLowerCase() || '';
    const type = account.account_type.toLowerCase();
    const name = account.account_name.toLowerCase();

    if (section === 'operating') {
      if (type === 'revenue') return 'Cash received from customers';
      if (type === 'expense') {
        if (name.includes('payroll') || name.includes('wage') || name.includes('salary'))
          return 'Cash paid for payroll';
        if (name.includes('vendor') || name.includes('supplier') || name.includes('cost'))
          return 'Cash paid to vendors';
        return 'Cash paid for operating expenses';
      }
      if (subtype.includes('accounts receivable')) return 'Collection of accounts receivable';
      if (subtype.includes('accounts payable')) return 'Payment of accounts payable';
      if (subtype.includes('inventory')) return 'Purchase of inventory';
      return 'Other operating cash flows';
    }

    if (section === 'investing') {
      if (subtype.includes('fixed asset') || subtype.includes('equipment') || subtype.includes('vehicle'))
        return 'Purchase of property and equipment';
      if (name.includes('sale') || name.includes('disposal')) return 'Proceeds from sale of assets';
      return 'Other investing activities';
    }

    if (section === 'financing') {
      if (subtype.includes('loan') || subtype.includes('debt') || name.includes('loan'))
        return 'Proceeds from (payments on) debt';
      if (name.includes('draw') || name.includes('distribution')) return 'Owner draws';
      if (name.includes('capital') || name.includes('contribution')) return 'Owner contributions';
      return 'Other financing activities';
    }

    return 'Other cash flows';
  }

  /**
   * Get all journal entries that affect cash accounts in the period
   */
  static async getJournalEntriesAffectingCash(
    startDate: string,
    endDate: string,
    cashAccountIds: string[]
  ): Promise<JournalEntry[]> {
    const { data: allEntries, error } = await supabase
      .from('gl_entries')
      .select(
        `
        id,
        entry_number,
        entry_date,
        account_id,
        debit_amount,
        credit_amount,
        description,
        chart_of_accounts!inner(
          account_code,
          account_name,
          account_type,
          account_subtype,
          is_cash_account,
          cash_flow_section,
          normal_balance
        )
      `
      )
      .gte('entry_date', startDate)
      .lte('entry_date', endDate)
      .order('entry_date', { ascending: true })
      .order('entry_number', { ascending: true });

    if (error) throw error;

    const entriesByNumber = new Map<string, JournalEntry>();

    for (const entry of (allEntries || []) as unknown as GLEntryWithAccount[]) {
      const account = entry.chart_of_accounts;
      const isCash = cashAccountIds.includes(entry.account_id);

      const debit = Number(entry.debit_amount) || 0;
      const credit = Number(entry.credit_amount) || 0;

      let amount = 0;
      if (account.normal_balance === 'debit') {
        amount = debit - credit;
      } else {
        amount = credit - debit;
      }

      if (!entriesByNumber.has(entry.entry_number)) {
        entriesByNumber.set(entry.entry_number, {
          entry_number: entry.entry_number,
          entry_date: entry.entry_date,
          cash_lines: [],
          non_cash_lines: [],
          cash_change: 0,
          classified_section: 'operating',
        });
      }

      const journalEntry = entriesByNumber.get(entry.entry_number)!;

      if (isCash) {
        journalEntry.cash_lines.push({
          account_id: entry.account_id,
          account_name: account.account_name,
          amount,
        });
        journalEntry.cash_change += amount;
      } else {
        journalEntry.non_cash_lines.push({
          account_id: entry.account_id,
          account_name: account.account_name,
          account_type: account.account_type,
          account_subtype: account.account_subtype,
          cash_flow_section: account.cash_flow_section,
          amount,
        });
      }
    }

    const result: JournalEntry[] = [];
    entriesByNumber.forEach((entry) => {
      if (entry.cash_lines.length > 0) {
        entry.classified_section = this.classifyJournalEntry(entry);
        result.push(entry);
      }
    });

    return result;
  }

  /**
   * Get an empty cash flow statement (when no data available)
   */
  static getEmptyStatement(startDate: string, endDate: string): CashFlowStatement {
    return {
      start_date: startDate,
      end_date: endDate,
      beginning_cash: 0,
      ending_cash: 0,
      operating: {
        title: 'Cash Flows from Operating Activities',
        items: [],
        subtotal: 0,
      },
      investing: {
        title: 'Cash Flows from Investing Activities',
        items: [],
        subtotal: 0,
      },
      financing: {
        title: 'Cash Flows from Financing Activities',
        items: [],
        subtotal: 0,
      },
      net_change: 0,
      unclassified_amount: 0,
    };
  }
}
