import { useEffect, useState } from 'react';
import { Plus, Search, DollarSign, TrendingUp, TrendingDown, Calendar, FileText, X, Filter, AlertCircle, Wallet, Download } from 'lucide-react';
import { ExportService, ExportFormat } from '../../services/ExportService';
import { supabase } from '../../lib/supabase';
import { LaborRatesSettings } from './LaborRatesSettings';
import { ReconciliationSession } from './ReconciliationSession';
import { ReconciliationService } from '../../services/ReconciliationService';
import { CashFlowReportView } from './CashFlowReportView';
import { JobPLReportView } from './JobPLReportView';
import { NewBillModal, BillDetailModal, RecordPaymentModal, APAgingReport } from '../AP';
import { APService, Bill, APSummary } from '../../services/APService';

// Note: gl_accounts, journal_entries, and journal_entry_lines are database views, not tables
type GLAccount = {
  id: string;
  account_number: string;
  account_name: string;
  account_type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  account_subtype: string | null;
  parent_account_id: string | null;
  is_active: boolean;
  description: string | null;
  normal_balance: 'debit' | 'credit';
  debit_balance: number;
  credit_balance: number;
  current_balance: number;
  created_at: string;
  updated_at: string;
};

type JournalEntry = {
  id: string;
  reference_number: string;
  entry_date: string;
  description: string;
  total_debits: number;
  total_credits: number;
  status: string;
  created_by: string;
  created_at: string;
  profiles?: { full_name: string };
};

type GLEntry = {
  id: string;
  entry_number: string;
  entry_date: string;
  account_id: string;
  debit_amount: number;
  credit_amount: number;
  description: string;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
  chart_of_accounts?: {
    account_code: string;
    account_name: string;
  };
};

type ARInvoice = {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  balance_due: number;
  days_overdue: number;
};

type ARSummary = {
  total: number;
  current: number;
  days_1_30: number;
  days_31_60: number;
  days_61_90: number;
  days_90_plus: number;
};

type BankReconciliation = {
  id: string;
  account_id: string;
  reconciliation_date: string;
  statement_balance?: number;
  book_balance?: number;
  difference?: number;
  status: string;
  account_name?: string;
  statement_end_date?: string;
  cleared_balance?: number;
  statement_ending_balance?: number;
};

interface AccountingViewProps {
  initialView?: string;
}

export function AccountingView({ initialView = 'dashboard' }: AccountingViewProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'journal' | 'reports' | 'settings' | 'reconciliations'>('dashboard');
  const [glAccounts, setGlAccounts] = useState<GLAccount[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showJournalModal, setShowJournalModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('all');
  const [journalLines, setJournalLines] = useState<Array<{
    gl_account_id: string;
    debit_amount: number;
    credit_amount: number;
    description: string;
  }>>([]);

  // GL Report state
  const [glEntries, setGlEntries] = useState<GLEntry[]>([]);
  const [glStartDate, setGlStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [glEndDate, setGlEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [glAccountFilter, setGlAccountFilter] = useState<string>('all');
  const [glReferenceFilter, setGlReferenceFilter] = useState<string>('all');
  const [glLoading, setGlLoading] = useState(false);

  // AR/AP state
  const [arInvoices, setArInvoices] = useState<ARInvoice[]>([]);
  const [arSummary, setArSummary] = useState<ARSummary>({
    total: 0,
    current: 0,
    days_1_30: 0,
    days_31_60: 0,
    days_61_90: 0,
    days_90_plus: 0,
  });
  const [arLoading, setArLoading] = useState(false);

  // Reconciliations state
  const [cashAccounts, setCashAccounts] = useState<GLAccount[]>([]);
  const [reconciliations, setReconciliations] = useState<BankReconciliation[]>([]);
  const [reconLoading, setReconLoading] = useState(false);
  const [showStartReconciliationModal, setShowStartReconciliationModal] = useState(false);
  const [selectedAccountForRecon, setSelectedAccountForRecon] = useState<GLAccount | null>(null);
  const [activeReconciliationId, setActiveReconciliationId] = useState<string | null>(null);

  // AP state
  const [apSummary, setApSummary] = useState<APSummary | null>(null);
  const [showNewBillModal, setShowNewBillModal] = useState(false);
  const [showBillDetailModal, setShowBillDetailModal] = useState(false);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [selectedVendorIdForPayment, setSelectedVendorIdForPayment] = useState<string | undefined>();
  const [selectedBillIdForPayment, setSelectedBillIdForPayment] = useState<string | undefined>();

  const [accountFormData, setAccountFormData] = useState({
    account_number: '',
    account_name: '',
    account_type: 'asset' as const,
    parent_account_id: '',
    description: '',
    is_active: true,
  });

  const [journalFormData, setJournalFormData] = useState({
    entry_date: new Date().toISOString().split('T')[0],
    description: '',
    reference_number: '',
  });

  useEffect(() => {
    loadGLAccounts();
    loadJournalEntries();
  }, []);

  // Handle initialView routing
  useEffect(() => {
    if (!initialView) return;

    switch (initialView) {
      case 'dashboard':
        setActiveTab('dashboard');
        setSelectedReport(null);
        break;
      case 'general-ledger':
        setActiveTab('reports');
        setSelectedReport('general-ledger');
        loadGLEntries();
        break;
      case 'ar-ap':
        setActiveTab('reports');
        setSelectedReport('ar-ap');
        loadARData();
        loadAPData();
        break;
      case 'chart-of-accounts':
        setActiveTab('accounts');
        setSelectedReport(null);
        break;
      case 'reconciliations':
        setActiveTab('reconciliations');
        setSelectedReport(null);
        loadReconciliationsData();
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialView]);

  const loadGLAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('gl_accounts')
        .select('*')
        .order('account_number', { ascending: true });

      if (error) throw error;
      setGlAccounts((data as GLAccount[]) || []);
    } catch (error) {
      console.error('Error loading GL accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJournalEntries = async () => {
    try {
      // journal_entries is a view, not a table - cast through unknown
      const { data, error } = await (supabase
        .from('journal_entries') as unknown as ReturnType<typeof supabase.from<'gl_entries'>>)
        .select('*, profiles(full_name)')
        .order('entry_date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setJournalEntries((data as unknown as JournalEntry[]) || []);
    } catch (error) {
      console.error('Error loading journal entries:', error);
    }
  };

  const loadGLEntries = async () => {
    setGlLoading(true);
    try {
      let query = supabase
        .from('gl_entries')
        .select('*, chart_of_accounts(account_code, account_name)')
        .gte('entry_date', glStartDate)
        .lte('entry_date', glEndDate)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (glAccountFilter !== 'all') {
        query = query.eq('account_id', glAccountFilter);
      }

      if (glReferenceFilter !== 'all') {
        query = query.eq('reference_type', glReferenceFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setGlEntries((data as GLEntry[]) || []);
    } catch (error) {
      console.error('Error loading GL entries:', error);
    } finally {
      setGlLoading(false);
    }
  };

  const exportGLReport = (format: ExportFormat) => {
    const exportData = {
      title: 'General Ledger Report',
      dateRange: {
        start: new Date(glStartDate),
        end: new Date(glEndDate),
      },
      columns: [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Account', key: 'account', width: 30 },
        { header: 'Description', key: 'description', width: 40 },
        { header: 'Reference', key: 'reference', width: 15 },
        { header: 'Debit', key: 'debit', width: 15 },
        { header: 'Credit', key: 'credit', width: 15 },
      ],
      rows: glEntries.map((entry) => ({
        date: new Date(entry.entry_date).toLocaleDateString(),
        account: `${entry.chart_of_accounts?.account_code || ''} - ${entry.chart_of_accounts?.account_name || ''}`,
        description: entry.description || '',
        reference: entry.reference_type || '',
        debit: entry.debit_amount > 0 ? `$${entry.debit_amount.toFixed(2)}` : '',
        credit: entry.credit_amount > 0 ? `$${entry.credit_amount.toFixed(2)}` : '',
      })),
      summary: {
        totalDebits: glEntries.reduce((sum, e) => sum + (e.debit_amount || 0), 0),
        totalCredits: glEntries.reduce((sum, e) => sum + (e.credit_amount || 0), 0),
      },
    };

    ExportService.export(exportData, format);
  };

  const exportARAPReport = (format: ExportFormat) => {
    const exportData = {
      title: 'Accounts Receivable Aging Report',
      dateRange: {
        start: new Date(),
        end: new Date(),
      },
      columns: [
        { header: 'Customer', key: 'customer', width: 30 },
        { header: 'Invoice #', key: 'invoice', width: 15 },
        { header: 'Issue Date', key: 'issueDate', width: 12 },
        { header: 'Due Date', key: 'dueDate', width: 12 },
        { header: 'Aging', key: 'aging', width: 12 },
        { header: 'Balance Due', key: 'balanceDue', width: 15 },
      ],
      rows: arInvoices.map((invoice) => ({
        customer: invoice.customer_name,
        invoice: invoice.invoice_number,
        issueDate: new Date(invoice.issue_date).toLocaleDateString(),
        dueDate: new Date(invoice.due_date).toLocaleDateString(),
        aging: getAgingBucketLabel(invoice.days_overdue),
        balanceDue: `$${invoice.balance_due.toFixed(2)}`,
      })),
      summary: {
        total: arSummary.total,
        current: arSummary.current,
        days_1_30: arSummary.days_1_30,
        days_31_60: arSummary.days_31_60,
        days_61_90: arSummary.days_61_90,
        days_90_plus: arSummary.days_90_plus,
      },
    };

    ExportService.export(exportData, format);
  };

  const loadARData = async () => {
    setArLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('id, invoice_number, customer_id, issue_date, due_date, balance_due, customers(name)')
        .gt('balance_due', 0)
        .neq('status', 'cancelled')
        .order('due_date', { ascending: true });

      if (error) throw error;

      const today = new Date();
      type InvoiceWithCustomer = {
        id: string;
        invoice_number: string;
        customer_id: string;
        issue_date: string;
        due_date: string;
        balance_due: number;
        customers: { name: string } | null;
      };
      const invoices: ARInvoice[] = ((data || []) as unknown as InvoiceWithCustomer[]).map((inv) => {
        const dueDate = new Date(inv.due_date);
        const diffTime = today.getTime() - dueDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const daysOverdue = diffDays > 0 ? diffDays : 0;

        return {
          id: inv.id,
          invoice_number: inv.invoice_number,
          customer_id: inv.customer_id,
          customer_name: inv.customers?.name || 'Unknown',
          issue_date: inv.issue_date,
          due_date: inv.due_date,
          balance_due: inv.balance_due,
          days_overdue: daysOverdue,
        };
      });

      setArInvoices(invoices);

      // Calculate summary
      const summary: ARSummary = {
        total: 0,
        current: 0,
        days_1_30: 0,
        days_31_60: 0,
        days_61_90: 0,
        days_90_plus: 0,
      };

      invoices.forEach(inv => {
        summary.total += inv.balance_due;
        if (inv.days_overdue === 0) {
          summary.current += inv.balance_due;
        } else if (inv.days_overdue <= 30) {
          summary.days_1_30 += inv.balance_due;
        } else if (inv.days_overdue <= 60) {
          summary.days_31_60 += inv.balance_due;
        } else if (inv.days_overdue <= 90) {
          summary.days_61_90 += inv.balance_due;
        } else {
          summary.days_90_plus += inv.balance_due;
        }
      });

      setArSummary(summary);
    } catch (error) {
      console.error('Error loading AR data:', error);
    } finally {
      setArLoading(false);
    }
  };

  const loadAPData = async () => {
    try {
      const summary = await APService.getAPSummary();
      setApSummary(summary);
    } catch (error) {
      console.error('Error loading AP data:', error);
    }
  };

  const handleRecordPayment = (vendorId?: string, billId?: string) => {
    if (billId) {
      // If opening from a specific bill, get vendor from bill
      APService.getBillById(billId).then((bill) => {
        if (bill) {
          setSelectedVendorIdForPayment(bill.vendor_id);
          setSelectedBillIdForPayment(billId);
          setShowRecordPaymentModal(true);
        }
      });
    } else {
      setSelectedVendorIdForPayment(vendorId);
      setSelectedBillIdForPayment(undefined);
      setShowRecordPaymentModal(true);
    }
  };

  const handleAPDataRefresh = () => {
    loadAPData();
    setShowNewBillModal(false);
    setShowBillDetailModal(false);
    setShowRecordPaymentModal(false);
    setSelectedBill(null);
  };

  const loadReconciliationsData = async () => {
    setReconLoading(true);
    try {
      // Load cash accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('gl_accounts')
        .select('*')
        .eq('account_type', 'asset')
        .or('account_name.ilike.%cash%,account_name.ilike.%bank%')
        .order('account_number', { ascending: true });

      if (accountsError) throw accountsError;
      setCashAccounts((accounts as GLAccount[]) || []);

      // Load recent reconciliations using the service
      const recons = await ReconciliationService.getReconciliations();
      const reconsWithAccountNames = await Promise.all(
        recons.map(async (r) => {
          const { data: account } = await supabase
            .from('chart_of_accounts')
            .select('account_name')
            .eq('id', r.account_id)
            .single();
          return {
            ...r,
            account_name: account?.account_name || 'Unknown Account',
          };
        })
      );
      setReconciliations(reconsWithAccountNames.slice(0, 10) as BankReconciliation[]);
    } catch (error) {
      console.error('Error loading reconciliation data:', error);
    } finally {
      setReconLoading(false);
    }
  };

  const handleStartReconciliation = (account: GLAccount) => {
    setSelectedAccountForRecon(account);
    setShowStartReconciliationModal(true);
  };

  const handleReconciliationCreated = (reconciliationId: string) => {
    setShowStartReconciliationModal(false);
    setSelectedAccountForRecon(null);
    setActiveReconciliationId(reconciliationId);
  };

  const handleReconciliationComplete = async () => {
    setActiveReconciliationId(null);
    await loadReconciliationsData();
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Note: gl_accounts is a view, but we can still insert to chart_of_accounts
      const { error } = await supabase.from('chart_of_accounts').insert([{
        account_code: accountFormData.account_number,
        account_name: accountFormData.account_name,
        account_type: accountFormData.account_type,
        parent_account_id: accountFormData.parent_account_id || null,
        description: accountFormData.description,
        is_active: accountFormData.is_active,
        normal_balance: accountFormData.account_type === 'asset' || accountFormData.account_type === 'expense' ? 'debit' as const : 'credit' as const,
      }]);

      if (error) throw error;

      setShowAccountModal(false);
      setAccountFormData({
        account_number: '',
        account_name: '',
        account_type: 'asset',
        parent_account_id: '',
        description: '',
        is_active: true,
      });
      loadGLAccounts();
    } catch (error) {
      console.error('Error creating account:', error);
      alert('Failed to create account. Please try again.');
    }
  };

  const addJournalLine = () => {
    setJournalLines([...journalLines, {
      gl_account_id: '',
      debit_amount: 0,
      credit_amount: 0,
      description: '',
    }]);
  };

  const updateJournalLine = (index: number, field: string, value: string | number) => {
    const updated = [...journalLines];
    updated[index] = { ...updated[index], [field]: value };
    setJournalLines(updated);
  };

  const removeJournalLine = (index: number) => {
    setJournalLines(journalLines.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const totalDebits = journalLines.reduce((sum, line) => sum + line.debit_amount, 0);
    const totalCredits = journalLines.reduce((sum, line) => sum + line.credit_amount, 0);
    return { totalDebits, totalCredits, difference: totalDebits - totalCredits };
  };

  const handleCreateJournalEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    const totals = calculateTotals();
    if (Math.abs(totals.difference) > 0.01) {
      alert('Journal entry must balance. Debits and credits must be equal.');
      return;
    }

    if (journalLines.length < 2) {
      alert('Journal entry must have at least 2 lines.');
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Create GL entries directly (journal_entries is a view)
      const fiscalYear = new Date(journalFormData.entry_date).getFullYear();
      const fiscalPeriod = new Date(journalFormData.entry_date).getMonth() + 1;

      // Generate a unique entry number
      const entryNumber = `JE-${Date.now()}`;

      // Insert GL entries for each line
      const entriesToInsert = journalLines.map((line) => ({
        entry_number: entryNumber,
        entry_date: journalFormData.entry_date,
        account_id: line.gl_account_id,
        debit_amount: line.debit_amount,
        credit_amount: line.credit_amount,
        description: journalFormData.description,
        reference_type: 'manual',
        posted_by: userData.user.id,
        is_posted: true,
        fiscal_year: fiscalYear,
        fiscal_period: fiscalPeriod,
      }));

      const { error: entriesError } = await supabase
        .from('gl_entries')
        .insert(entriesToInsert);

      if (entriesError) throw entriesError;

      setShowJournalModal(false);
      resetJournalForm();
      loadJournalEntries();
      loadGLAccounts();
    } catch (error) {
      console.error('Error creating journal entry:', error);
      alert('Failed to create journal entry. Please try again.');
    }
  };

  const resetJournalForm = () => {
    setJournalFormData({
      entry_date: new Date().toISOString().split('T')[0],
      description: '',
      reference_number: '',
    });
    setJournalLines([]);
  };

  // Helper functions
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getAgingBucketColor = (daysOverdue: number) => {
    if (daysOverdue === 0) return 'bg-green-100 text-green-600 dark:bg-green-900/20';
    if (daysOverdue <= 30) return 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20';
    if (daysOverdue <= 60) return 'bg-orange-100 text-orange-600 dark:bg-orange-900/20';
    if (daysOverdue <= 90) return 'bg-red-100 text-red-600 dark:bg-red-900/20';
    return 'bg-red-200 text-red-700 dark:bg-red-900/40';
  };

  const getAgingBucketLabel = (daysOverdue: number) => {
    if (daysOverdue === 0) return 'Current';
    if (daysOverdue <= 30) return '1-30 Days';
    if (daysOverdue <= 60) return '31-60 Days';
    if (daysOverdue <= 90) return '61-90 Days';
    return '90+ Days';
  };

  const formatReferenceDisplay = (entry: GLEntry) => {
    if (!entry.reference_type) return 'Manual Entry';
    if (entry.reference_type === 'invoice') return `Invoice`;
    if (entry.reference_type === 'payment') return `Payment`;
    return entry.reference_type.charAt(0).toUpperCase() + entry.reference_type.slice(1);
  };

  const getAccountTypeColor = (type: string) => {
    switch (type) {
      case 'asset':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'liability':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'equity':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      case 'revenue':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'expense':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-700';
    }
  };

  const filteredAccounts = glAccounts.filter((account) => {
    const matchesSearch =
      account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.account_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = accountTypeFilter === 'all' || account.account_type === accountTypeFilter;

    return matchesSearch && matchesType;
  });

  const totalAssets = glAccounts
    .filter(acc => acc.account_type === 'asset')
    .reduce((sum, acc) => sum + acc.current_balance, 0);

  const totalLiabilities = glAccounts
    .filter(acc => acc.account_type === 'liability')
    .reduce((sum, acc) => sum + acc.current_balance, 0);

  const totalEquity = glAccounts
    .filter(acc => acc.account_type === 'equity')
    .reduce((sum, acc) => sum + acc.current_balance, 0);

  const totalRevenue = glAccounts
    .filter(acc => acc.account_type === 'revenue')
    .reduce((sum, acc) => sum + acc.current_balance, 0);

  const totalExpenses = glAccounts
    .filter(acc => acc.account_type === 'expense')
    .reduce((sum, acc) => sum + acc.current_balance, 0);

  const netIncome = totalRevenue - totalExpenses;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Accounting</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            General ledger and financial reporting
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAccountModal(true)}
            className="btn btn-outline flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Account</span>
          </button>
          <button
            onClick={() => setShowJournalModal(true)}
            className="btn btn-primary flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>New Journal Entry</span>
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto scrollbar-thin">
        <nav className="flex space-x-8 min-w-max px-1">
          {(['dashboard', 'accounts', 'journal', 'reports', 'reconciliations', 'settings'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Assets</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    ${totalAssets.toLocaleString()}
                  </p>
                </div>
                <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Liabilities</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    ${totalLiabilities.toLocaleString()}
                  </p>
                </div>
                <div className="bg-red-100 dark:bg-red-900/20 text-red-600 p-3 rounded-lg">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Equity</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    ${totalEquity.toLocaleString()}
                  </p>
                </div>
                <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    ${totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Expenses</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    ${totalExpenses.toLocaleString()}
                  </p>
                </div>
                <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-600 p-3 rounded-lg">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Net Income</p>
                  <p className={`text-3xl font-bold mt-2 ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${netIncome.toLocaleString()}
                  </p>
                </div>
                <div className={`${netIncome >= 0 ? 'bg-green-100 dark:bg-green-900/20 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600'} p-3 rounded-lg`}>
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Balance Sheet Equation</h3>
            <div className="flex items-center justify-center space-x-4 text-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Assets</p>
                <p className="text-2xl font-bold text-blue-600">${totalAssets.toLocaleString()}</p>
              </div>
              <span className="text-2xl font-bold text-gray-400">=</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Liabilities</p>
                <p className="text-2xl font-bold text-red-600">${totalLiabilities.toLocaleString()}</p>
              </div>
              <span className="text-2xl font-bold text-gray-400">+</span>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Equity</p>
                <p className="text-2xl font-bold text-purple-600">${totalEquity.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-center">
              <p className={`text-sm ${Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
                  ? '✓ Balanced'
                  : `⚠ Out of Balance by $${Math.abs(totalAssets - (totalLiabilities + totalEquity)).toFixed(2)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search accounts..."
                  className="input pl-10"
                />
              </div>

              <select
                value={accountTypeFilter}
                onChange={(e) => setAccountTypeFilter(e.target.value)}
                className="input md:w-64"
              >
                <option value="all">All Types</option>
                <option value="asset">Assets</option>
                <option value="liability">Liabilities</option>
                <option value="equity">Equity</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expenses</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Account #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Account Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Debit Balance
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Credit Balance
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Current Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No accounts found
                      </td>
                    </tr>
                  ) : (
                    filteredAccounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {account.account_number}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 dark:text-white">{account.account_name}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${getAccountTypeColor(account.account_type)}`}>
                            {account.account_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-900 dark:text-white">
                            ${account.debit_balance.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-gray-900 dark:text-white">
                            ${account.credit_balance.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium text-gray-900 dark:text-white">
                            ${account.current_balance.toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'journal' && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Debits
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {journalEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No journal entries found
                    </td>
                  </tr>
                ) : (
                  journalEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">{entry.reference_number || '-'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-gray-900 dark:text-white">{entry.description}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${entry.total_debits.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${entry.total_credits.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`badge ${entry.status === 'posted' ? 'badge-green' : 'badge-gray'}`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'reports' && !selectedReport && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            onClick={() => setSelectedReport('balance-sheet')}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-4 rounded-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Balance Sheet</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Assets, liabilities, and equity</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedReport('income-statement')}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-4 rounded-lg">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Income Statement</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Revenue and expenses</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedReport('cash-flow')}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 dark:bg-purple-900/20 text-purple-600 p-4 rounded-lg">
                <DollarSign className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cash Flow</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cash inflows and outflows</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedReport('trial-balance')}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-600 p-4 rounded-lg">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Trial Balance</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Debit and credit totals</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedReport('general-ledger')}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-red-100 dark:bg-red-900/20 text-red-600 p-4 rounded-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">General Ledger</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">All account transactions</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => { setSelectedReport('ar-ap'); loadARData(); loadAPData(); }}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 p-4 rounded-lg">
                <Wallet className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">AR / AP</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Receivables and payables</p>
              </div>
            </div>
          </div>

          <div
            onClick={() => setSelectedReport('pl-by-job')}
            className="card p-6 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-teal-100 dark:bg-teal-900/20 text-teal-600 p-4 rounded-lg">
                <TrendingUp className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">P&L by Job</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Profit by project</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reports' && selectedReport && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedReport(null)}
                className="btn btn-outline"
              >
                ← Back to Reports
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedReport === 'balance-sheet' && 'Balance Sheet'}
                {selectedReport === 'income-statement' && 'Income Statement'}
                {selectedReport === 'cash-flow' && 'Cash Flow Statement'}
                {selectedReport === 'trial-balance' && 'Trial Balance'}
                {selectedReport === 'general-ledger' && 'General Ledger'}
                {selectedReport === 'ar-ap' && 'Accounts Receivable / Accounts Payable'}
                {selectedReport === 'pl-by-job' && 'Profit & Loss by Job'}
              </h2>
            </div>
            {selectedReport === 'ar-ap' ? (
              <div className="relative group">
                <button
                  className="btn btn-primary flex items-center space-x-2"
                  disabled={arInvoices.length === 0}
                >
                  <Download className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => exportARAPReport('pdf')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => exportARAPReport('excel')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as Excel
                  </button>
                  <button
                    onClick={() => exportARAPReport('csv')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                  >
                    Export as CSV
                  </button>
                </div>
              </div>
            ) : selectedReport === 'general-ledger' ? (
              <div className="relative group">
                <button
                  className="btn btn-primary flex items-center space-x-2"
                  disabled={glEntries.length === 0}
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => exportGLReport('pdf')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                  >
                    Export as PDF
                  </button>
                  <button
                    onClick={() => exportGLReport('excel')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Export as Excel
                  </button>
                  <button
                    onClick={() => exportGLReport('csv')}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                  >
                    Export as CSV
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => window.print()}
                className="btn btn-primary flex items-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Export PDF</span>
              </button>
            )}
          </div>

          {selectedReport === 'balance-sheet' && (
            <div className="card p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Dunaway Heating & Cooling</h3>
                <p className="text-gray-600 dark:text-gray-400">Balance Sheet</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">As of {new Date().toLocaleDateString()}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">ASSETS</h4>
                  <div className="space-y-2">
                    {glAccounts.filter(acc => acc.account_type === 'asset').map(account => (
                      <div key={account.id} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-900 dark:text-white">{account.account_name}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${account.current_balance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold border-t-2 border-gray-900 dark:border-white">
                      <span className="text-gray-900 dark:text-white">Total Assets</span>
                      <span className="text-gray-900 dark:text-white">${totalAssets.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">LIABILITIES</h4>
                  <div className="space-y-2">
                    {glAccounts.filter(acc => acc.account_type === 'liability').map(account => (
                      <div key={account.id} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-900 dark:text-white">{account.account_name}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${account.current_balance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold">
                      <span className="text-gray-900 dark:text-white">Total Liabilities</span>
                      <span className="text-gray-900 dark:text-white">${totalLiabilities.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">EQUITY</h4>
                  <div className="space-y-2">
                    {glAccounts.filter(acc => acc.account_type === 'equity').map(account => (
                      <div key={account.id} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-900 dark:text-white">{account.account_name}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${account.current_balance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold">
                      <span className="text-gray-900 dark:text-white">Total Equity</span>
                      <span className="text-gray-900 dark:text-white">${totalEquity.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-gray-900 dark:border-white pt-4">
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Total Liabilities & Equity</span>
                    <span className="text-gray-900 dark:text-white">${(totalLiabilities + totalEquity).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'income-statement' && (
            <div className="card p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Dunaway Heating & Cooling</h3>
                <p className="text-gray-600 dark:text-gray-400">Income Statement</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">For the period ending {new Date().toLocaleDateString()}</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-bold text-green-600 mb-3">REVENUE</h4>
                  <div className="space-y-2">
                    {glAccounts.filter(acc => acc.account_type === 'revenue').map(account => (
                      <div key={account.id} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-900 dark:text-white">{account.account_name}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${account.current_balance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold">
                      <span className="text-gray-900 dark:text-white">Total Revenue</span>
                      <span className="text-green-600">${totalRevenue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-lg font-bold text-orange-600 mb-3">EXPENSES</h4>
                  <div className="space-y-2">
                    {glAccounts.filter(acc => acc.account_type === 'expense').map(account => (
                      <div key={account.id} className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-700">
                        <span className="text-gray-900 dark:text-white">{account.account_name}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${account.current_balance.toLocaleString()}
                        </span>
                      </div>
                    ))}
                    <div className="flex justify-between py-2 font-bold">
                      <span className="text-gray-900 dark:text-white">Total Expenses</span>
                      <span className="text-orange-600">${totalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-gray-900 dark:border-white pt-4">
                  <div className="flex justify-between py-2 text-lg font-bold">
                    <span className="text-gray-900 dark:text-white">Net Income</span>
                    <span className={netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                      ${netIncome.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {netIncome >= 0 ? 'Profit' : 'Loss'} for the period
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedReport === 'trial-balance' && (
            <div className="card p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Dunaway Heating & Cooling</h3>
                <p className="text-gray-600 dark:text-gray-400">Trial Balance</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">As of {new Date().toLocaleDateString()}</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white">
                        Account
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                        Debit
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                        Credit
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {glAccounts.map(account => (
                      <tr key={account.id}>
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {account.account_number} - {account.account_name}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                          ${account.debit_balance.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                          ${account.credit_balance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t-2 border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <td className="px-4 py-3 text-lg font-bold text-gray-900 dark:text-white">
                        Totals
                      </td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-gray-900 dark:text-white">
                        ${glAccounts.reduce((sum, acc) => sum + acc.debit_balance, 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-lg font-bold text-gray-900 dark:text-white">
                        ${glAccounts.reduce((sum, acc) => sum + acc.credit_balance, 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {selectedReport === 'general-ledger' && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={loadGLEntries}
                      className="btn btn-primary flex items-center space-x-2"
                    >
                      <Filter className="w-4 h-4" />
                      <span>Apply Filters</span>
                    </button>
                    <div className="relative group">
                      <button
                        className="btn btn-outline flex items-center space-x-2"
                        disabled={glEntries.length === 0}
                      >
                        <Download className="w-4 h-4" />
                        <span>Export</span>
                      </button>
                      <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                        <button
                          onClick={() => exportGLReport('pdf')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
                        >
                          Export as PDF
                        </button>
                        <button
                          onClick={() => exportGLReport('excel')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Export as Excel
                        </button>
                        <button
                          onClick={() => exportGLReport('csv')}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
                        >
                          Export as CSV
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={glStartDate}
                      onChange={(e) => setGlStartDate(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={glEndDate}
                      onChange={(e) => setGlEndDate(e.target.value)}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Account
                    </label>
                    <select
                      value={glAccountFilter}
                      onChange={(e) => setGlAccountFilter(e.target.value)}
                      className="input"
                    >
                      <option value="all">All Accounts</option>
                      {glAccounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.account_number} - {account.account_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reference Type
                    </label>
                    <select
                      value={glReferenceFilter}
                      onChange={(e) => setGlReferenceFilter(e.target.value)}
                      className="input"
                    >
                      <option value="all">All Types</option>
                      <option value="invoice">Invoices</option>
                      <option value="payment">Payments</option>
                      <option value="manual">Manual Entries</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="card overflow-hidden">
                {glLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Account
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Reference
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Debit
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Credit
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {glEntries.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                              No GL entries found for selected filters
                            </td>
                          </tr>
                        ) : (
                          glEntries.map((entry) => (
                            <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                {new Date(entry.entry_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                {entry.chart_of_accounts?.account_code} - {entry.chart_of_accounts?.account_name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                {entry.description}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                {formatReferenceDisplay(entry)}
                              </td>
                              <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                                {entry.debit_amount > 0 ? formatCurrency(entry.debit_amount) : '-'}
                              </td>
                              <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                                {entry.credit_amount > 0 ? formatCurrency(entry.credit_amount) : '-'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot className="border-t-2 border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <td colSpan={4} className="px-6 py-3 text-lg font-bold text-gray-900 dark:text-white">
                            Totals
                          </td>
                          <td className="px-6 py-3 text-lg font-bold text-right text-gray-900 dark:text-white">
                            {formatCurrency(glEntries.reduce((sum, e) => sum + e.debit_amount, 0))}
                          </td>
                          <td className="px-6 py-3 text-lg font-bold text-right text-gray-900 dark:text-white">
                            {formatCurrency(glEntries.reduce((sum, e) => sum + e.credit_amount, 0))}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedReport === 'ar-ap' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="card p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total AR</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    {formatCurrency(arSummary.total)}
                  </p>
                </div>
                <div className="card p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current</p>
                  <p className="text-2xl font-bold text-green-600 mt-2">
                    {formatCurrency(arSummary.current)}
                  </p>
                </div>
                <div className="card p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">1-30 Days</p>
                  <p className="text-2xl font-bold text-yellow-600 mt-2">
                    {formatCurrency(arSummary.days_1_30)}
                  </p>
                </div>
                <div className="card p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">31-60 Days</p>
                  <p className="text-2xl font-bold text-orange-600 mt-2">
                    {formatCurrency(arSummary.days_31_60)}
                  </p>
                </div>
                <div className="card p-6">
                  <p className="text-sm text-gray-600 dark:text-gray-400">60+ Days</p>
                  <p className="text-2xl font-bold text-red-600 mt-2">
                    {formatCurrency(arSummary.days_61_90 + arSummary.days_90_plus)}
                  </p>
                </div>
              </div>

              <div className="card overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Accounts Receivable Aging</h3>
                </div>
                {arLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Invoice #
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Issue Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Due Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Aging
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Balance Due
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {arInvoices.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                              No outstanding invoices
                            </td>
                          </tr>
                        ) : (
                          arInvoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                {invoice.customer_name}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                {invoice.invoice_number}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                {new Date(invoice.issue_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                                {new Date(invoice.due_date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`badge ${getAgingBucketColor(invoice.days_overdue)}`}>
                                  {getAgingBucketLabel(invoice.days_overdue)}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                                {formatCurrency(invoice.balance_due)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                      <tfoot className="border-t-2 border-gray-900 dark:border-white bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <td colSpan={5} className="px-6 py-3 text-lg font-bold text-gray-900 dark:text-white">
                            Total Outstanding
                          </td>
                          <td className="px-6 py-3 text-lg font-bold text-right text-gray-900 dark:text-white">
                            {formatCurrency(arSummary.total)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>

              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Accounts Payable</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowNewBillModal(true)}
                      className="btn btn-primary btn-sm"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      New Bill
                    </button>
                    <button
                      onClick={() => handleRecordPayment()}
                      className="btn btn-outline btn-sm"
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Record Payment
                    </button>
                  </div>
                </div>

                {/* AP Summary Cards */}
                {apSummary && (
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Outstanding</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(apSummary.total_outstanding)}
                      </p>
                      <p className="text-xs text-gray-500">{apSummary.bills_count} open bills</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                      <p className="text-sm text-red-600 dark:text-red-400">Overdue</p>
                      <p className="text-xl font-bold text-red-600 dark:text-red-400">
                        {formatCurrency(apSummary.total_overdue)}
                      </p>
                      <p className="text-xs text-red-500">{apSummary.overdue_count} overdue</p>
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                      <p className="text-sm text-yellow-600 dark:text-yellow-400">Due This Week</p>
                      <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                        {formatCurrency(apSummary.due_this_week)}
                      </p>
                    </div>
                  </div>
                )}

                {/* AP Aging Report */}
                <APAgingReport
                  onViewVendorBills={(vendorId) => {
                    // Could filter bills by vendor here
                    console.log('View bills for vendor:', vendorId);
                  }}
                />
              </div>

              {/* AP Modals */}
              <NewBillModal
                isOpen={showNewBillModal}
                onClose={() => setShowNewBillModal(false)}
                onBillCreated={handleAPDataRefresh}
              />

              <BillDetailModal
                isOpen={showBillDetailModal}
                bill={selectedBill}
                onClose={() => {
                  setShowBillDetailModal(false);
                  setSelectedBill(null);
                }}
                onBillUpdated={handleAPDataRefresh}
                onRecordPayment={(billId) => handleRecordPayment(undefined, billId)}
              />

              <RecordPaymentModal
                isOpen={showRecordPaymentModal}
                onClose={() => {
                  setShowRecordPaymentModal(false);
                  setSelectedVendorIdForPayment(undefined);
                  setSelectedBillIdForPayment(undefined);
                }}
                onPaymentRecorded={handleAPDataRefresh}
                preselectedVendorId={selectedVendorIdForPayment}
                preselectedBillId={selectedBillIdForPayment}
              />
            </div>
          )}

          {selectedReport === 'cash-flow' && (
            <CashFlowReportView />
          )}

          {selectedReport === 'pl-by-job' && (
            <JobPLReportView />
          )}
        </div>
      )}

      {activeTab === 'reconciliations' && (
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Bank Reconciliations</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Reconcile bank statements with GL cash accounts
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cash & Bank Accounts</h4>
            {reconLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : cashAccounts.length === 0 ? (
              <div className="card p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No cash or bank accounts found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cashAccounts.map((account) => (
                  <div key={account.id} className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{account.account_number}</p>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">{account.account_name}</h4>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">GL Balance</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(account.current_balance)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleStartReconciliation(account)}
                      className="btn btn-outline w-full"
                    >
                      Start Reconciliation
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {reconciliations.length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Reconciliations</h4>
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Account
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Book Balance
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Statement Balance
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Difference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {reconciliations.map((recon) => (
                        <tr
                          key={recon.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                          onClick={() => setActiveReconciliationId(recon.id)}
                        >
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {recon.statement_end_date ? new Date(recon.statement_end_date).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                            {recon.account_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                            {formatCurrency(recon.cleared_balance || 0)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                            {formatCurrency(recon.statement_ending_balance || 0)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">
                            {formatCurrency(recon.difference || 0)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                              recon.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' :
                              recon.status === 'in_progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-400' :
                              recon.status === 'cancelled' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'
                            }`}>
                              {recon.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <LaborRatesSettings />
      )}

      {showAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New GL Account</h2>
              <button
                onClick={() => setShowAccountModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountFormData.account_number}
                    onChange={(e) => setAccountFormData({ ...accountFormData, account_number: e.target.value })}
                    className="input"
                    placeholder="e.g., 1000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Type *
                  </label>
                  <select
                    required
                    value={accountFormData.account_type}
                    onChange={(e) => setAccountFormData({ ...accountFormData, account_type: e.target.value as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' })}
                    className="input"
                  >
                    <option value="asset">Asset</option>
                    <option value="liability">Liability</option>
                    <option value="equity">Equity</option>
                    <option value="revenue">Revenue</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Account Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountFormData.account_name}
                    onChange={(e) => setAccountFormData({ ...accountFormData, account_name: e.target.value })}
                    className="input"
                    placeholder="e.g., Cash - Operating Account"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={accountFormData.description}
                    onChange={(e) => setAccountFormData({ ...accountFormData, description: e.target.value })}
                    className="input"
                    rows={2}
                    placeholder="Account description"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={accountFormData.is_active}
                      onChange={(e) => setAccountFormData({ ...accountFormData, is_active: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showJournalModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Journal Entry</h2>
              <button
                onClick={() => {
                  setShowJournalModal(false);
                  resetJournalForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateJournalEntry} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Entry Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={journalFormData.entry_date}
                    onChange={(e) => setJournalFormData({ ...journalFormData, entry_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reference Number
                  </label>
                  <input
                    type="text"
                    value={journalFormData.reference_number}
                    onChange={(e) => setJournalFormData({ ...journalFormData, reference_number: e.target.value })}
                    className="input"
                    placeholder="e.g., INV-001"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={journalFormData.description}
                    onChange={(e) => setJournalFormData({ ...journalFormData, description: e.target.value })}
                    className="input"
                    placeholder="Journal entry description"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Journal Lines</h3>
                  <button
                    type="button"
                    onClick={addJournalLine}
                    className="btn btn-outline flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Line</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {journalLines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-4">
                        <select
                          value={line.gl_account_id}
                          onChange={(e) => updateJournalLine(index, 'gl_account_id', e.target.value)}
                          className="input text-sm"
                          required
                        >
                          <option value="">Select Account</option>
                          {glAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.account_number} - {account.account_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.debit_amount}
                          onChange={(e) => updateJournalLine(index, 'debit_amount', parseFloat(e.target.value) || 0)}
                          placeholder="Debit"
                          className="input text-sm"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.credit_amount}
                          onChange={(e) => updateJournalLine(index, 'credit_amount', parseFloat(e.target.value) || 0)}
                          placeholder="Credit"
                          className="input text-sm"
                        />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeJournalLine(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {journalLines.length > 0 && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Debits:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${calculateTotals().totalDebits.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Total Credits:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${calculateTotals().totalCredits.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-300 dark:border-gray-600 pt-2">
                      <span className="text-gray-600 dark:text-gray-400">Difference:</span>
                      <span className={`font-bold ${Math.abs(calculateTotals().difference) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(calculateTotals().difference).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowJournalModal(false);
                    resetJournalForm();
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Post Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Start Reconciliation Modal */}
      {showStartReconciliationModal && selectedAccountForRecon && (
        <StartReconciliationModal
          account={selectedAccountForRecon}
          onClose={() => {
            setShowStartReconciliationModal(false);
            setSelectedAccountForRecon(null);
          }}
          onCreate={handleReconciliationCreated}
        />
      )}

      {/* Reconciliation Session */}
      {activeReconciliationId && (
        <ReconciliationSession
          reconciliationId={activeReconciliationId}
          onClose={() => setActiveReconciliationId(null)}
          onComplete={handleReconciliationComplete}
        />
      )}
    </div>
  );
}

// Start Reconciliation Modal Component
function StartReconciliationModal({
  account,
  onClose,
  onCreate,
}: {
  account: GLAccount;
  onClose: () => void;
  onCreate: (reconciliationId: string) => void;
}) {
  const [formData, setFormData] = useState({
    statement_start_date: new Date(new Date().setDate(1)).toISOString().split('T')[0],
    statement_end_date: new Date().toISOString().split('T')[0],
    statement_ending_balance: 0,
    notes: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const reconciliation = await ReconciliationService.startReconciliation({
        account_id: account.id,
        ...formData,
      });

      onCreate(reconciliation.id);
    } catch (error) {
      console.error('Error starting reconciliation:', error);
      alert('Failed to start reconciliation: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Start Bank Reconciliation
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {account.account_number} - {account.account_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="font-semibold">Before you begin:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Have your bank statement ready</li>
                  <li>Note the statement ending date and balance</li>
                  <li>You'll mark GL entries that appear on your statement as "cleared"</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statement Start Date
              </label>
              <input
                type="date"
                value={formData.statement_start_date}
                onChange={(e) =>
                  setFormData({ ...formData, statement_start_date: e.target.value })
                }
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Statement End Date *
              </label>
              <input
                type="date"
                value={formData.statement_end_date}
                onChange={(e) =>
                  setFormData({ ...formData, statement_end_date: e.target.value })
                }
                className="input"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statement Ending Balance *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                value={formData.statement_ending_balance}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    statement_ending_balance: parseFloat(e.target.value) || 0,
                  })
                }
                className="input pl-8"
                placeholder="0.00"
                required
              />
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enter the ending balance from your bank statement
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="input"
              placeholder="Add any notes about this reconciliation..."
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Starting...</span>
                </div>
              ) : (
                'Start Reconciliation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
