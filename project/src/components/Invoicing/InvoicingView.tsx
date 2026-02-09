import { useEffect, useState, useCallback } from 'react';
import { Plus, Search, FileText, DollarSign, Clock, CheckCircle, AlertCircle, X, Send, Printer } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import { InvoiceEmailModal } from './InvoiceEmailModal';

type Invoice = Database['public']['Tables']['invoices']['Row'] & {
  customers?: { name: string };
  tickets?: { title: string };
  projects?: { name: string };
};

type Customer = Database['public']['Tables']['customers']['Row'];
type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  customers?: { name: string };
  profiles?: { full_name: string };
};

export function InvoicingView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string>('');
  const [lineItems, setLineItems] = useState<Array<{
    item_type: string;
    description: string;
    quantity: number;
    unit_price: number;
    taxable: boolean;
  }>>([]);

  const [formData, setFormData] = useState({
    customer_id: '',
    ticket_id: '',
    issue_date: new Date().toISOString().split('T')[0],
    due_date: '',
    payment_terms: 'Net 30',
    tax_rate: 7.5,
    discount_amount: 0,
    notes: '',
    customer_notes: '',
  });

  useEffect(() => {
    loadInvoices();
    loadCustomers();
    loadTickets();
  }, []);

  const loadInvoices = async () => {
    try {
      console.log('Starting to load invoices...');

      // First, try to load invoices without any joins
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading invoices:', error);
        throw error;
      }

      console.log('Raw invoices loaded:', data);

      if (!data || data.length === 0) {
        console.log('No invoices found');
        setInvoices([]);
        return;
      }

      // Load customer and ticket data separately
      const customerIds: string[] = [...new Set(data.map(inv => inv.customer_id).filter((id): id is string => !!id))];
      const ticketIds: string[] = [...new Set(data.map(inv => inv.ticket_id).filter((id): id is string => !!id))];

      const { data: customersData } = await supabase
        .from('customers')
        .select('id, name')
        .in('id', customerIds.length > 0 ? customerIds : ['']);

      const { data: ticketsData } = await supabase
        .from('tickets')
        .select('id, title')
        .in('id', ticketIds.length > 0 ? ticketIds : ['']);

      // Map the data
      const customersMap = new Map(customersData?.map(c => [c.id, c]) || []);
      const ticketsMap = new Map(ticketsData?.map(t => [t.id, t]) || []);

      const invoicesWithRelations = data.map(invoice => ({
        ...invoice,
        customers: invoice.customer_id ? customersMap.get(invoice.customer_id) : undefined,
        tickets: invoice.ticket_id ? ticketsMap.get(invoice.ticket_id) : undefined,
      }));

      console.log('Invoices with relations:', invoicesWithRelations);
      setInvoices(invoicesWithRelations);
    } catch (error: unknown) {
      console.error('Error loading invoices:', error);
      const err = error as { message?: string; details?: string; hint?: string };
      console.error('Error details:', err.message, err.details, err.hint);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadTickets = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, customers!tickets_customer_id_fkey(name), profiles!tickets_assigned_to_fkey(full_name)')
        .in('status', ['completed', 'ready_to_invoice'])
        .eq('billable', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets((data as Ticket[]) || []);
    } catch (error) {
      console.error('Error loading tickets:', error);
    }
  };

  const generateInvoiceNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}${month}-${random}`;
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxableAmount = lineItems
      .filter(item => item.taxable)
      .reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = (taxableAmount * formData.tax_rate) / 100;
    const total = subtotal + taxAmount - formData.discount_amount;

    return {
      subtotal,
      taxAmount,
      total,
      balanceDue: total,
    };
  };

  const addLineItem = () => {
    setLineItems([...lineItems, {
      item_type: 'service',
      description: '',
      quantity: 1,
      unit_price: 0,
      taxable: true,
    }]);
  };

  const updateLineItem = (index: number, field: string, value: string | number | boolean) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();

    if (lineItems.length === 0) {
      alert('Please add at least one line item');
      return;
    }

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const totals = calculateTotals();
      const invoiceNumber = generateInvoiceNumber();

      const dueDate = formData.due_date || (() => {
        const date = new Date(formData.issue_date);
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
      })();

      const { data: invoice, error: invoiceError } = await supabase
        .from('invoices')
        .insert([{
          invoice_number: invoiceNumber,
          customer_id: formData.customer_id,
          ticket_id: formData.ticket_id || null,
          source_ticket_id: formData.ticket_id || null,
          source_type: formData.ticket_id ? 'SVC' : null,
          issue_date: formData.issue_date,
          due_date: dueDate,
          payment_terms: formData.payment_terms,
          subtotal: totals.subtotal,
          tax_rate: formData.tax_rate,
          tax_amount: totals.taxAmount,
          discount_amount: formData.discount_amount,
          total_amount: totals.total,
          amount_paid: 0,
          balance_due: totals.balanceDue,
          notes: formData.notes,
          customer_notes: formData.customer_notes,
          status: 'draft',
          created_by: userData.user.id,
        }])
        .select()
        .single();

      if (invoiceError) throw invoiceError;

      const lineItemsToInsert = lineItems.map((item, index) => ({
        invoice_id: invoice.id,
        item_type: item.item_type,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        line_total: item.quantity * item.unit_price,
        taxable: item.taxable,
        sort_order: index,
        ticket_id: formData.ticket_id || null,
      }));

      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .insert(lineItemsToInsert);

      if (lineItemsError) throw lineItemsError;

      // If ticket was selected, update ticket status
      if (formData.ticket_id) {
        await supabase
          .from('tickets')
          .update({
            invoice_id: invoice.id,
            status: 'closed_billed',
            billed_at: new Date().toISOString(),
          })
          .eq('id', formData.ticket_id);
      }

      setShowAddModal(false);
      setSelectedTicketId('');
      resetForm();
      loadInvoices();
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    }
  };

  const handleTicketSelect = async (ticketId: string) => {
    setSelectedTicketId(ticketId);

    if (!ticketId) {
      setFormData({
        ...formData,
        ticket_id: '',
        customer_id: '',
        customer_notes: '',
      });
      setLineItems([]);
      return;
    }

    try {
      // Fetch ticket details
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select('*, customers!tickets_customer_id_fkey(id, name)')
        .eq('id', ticketId)
        .single();

      if (ticketError) {
        console.error('Ticket fetch error:', ticketError);
        throw ticketError;
      }

      // Fetch parts used on this ticket
      const { data: partsUsed, error: partsError } = await supabase
        .from('ticket_parts_used')
        .select('quantity, part_id')
        .eq('ticket_id', ticketId);

      if (partsError) {
        console.error('Parts used fetch error:', partsError);
        throw partsError;
      }

      console.log('Parts used found:', partsUsed);

      // Fetch part details separately
      let partsDetails: Array<{ id: string; name: string; part_number: string; unit_price: number }> = [];
      if (partsUsed && partsUsed.length > 0) {
        const partIds = partsUsed.map(pu => pu.part_id);
        console.log('Fetching part details for IDs:', partIds);

        const { data: parts, error: partsDetailError } = await supabase
          .from('parts')
          .select('id, name, part_number, unit_price')
          .in('id', partIds);

        if (partsDetailError) {
          console.error('Parts details fetch error:', partsDetailError);
        } else {
          console.log('Parts details fetched:', parts);
          partsDetails = parts || [];
        }
      }

      // Auto-populate customer
      setFormData({
        ...formData,
        ticket_id: ticketId,
        customer_id: ticket.customer_id,
        customer_notes: ticket.title || '',
      });

      // Auto-populate line items
      const items: Array<{ item_type: string; description: string; quantity: number; unit_price: number; taxable: boolean }> = [];

      // Add labor if hours_onsite exists
      if (ticket.hours_onsite && ticket.hours_onsite > 0) {
        // Get default labor rate from accounting settings
        const { data: laborRateSetting } = await supabase
          .from('accounting_settings')
          .select('value')
          .eq('key', 'default_labor_rate')
          .maybeSingle();

        const settingValue = laborRateSetting as { value?: string } | null;
        const laborRate = settingValue?.value ? parseFloat(settingValue.value) : 85;

        items.push({
          item_type: 'labor',
          description: `Service Labor - ${ticket.title} (${ticket.hours_onsite} hours)`,
          quantity: ticket.hours_onsite,
          unit_price: laborRate,
          taxable: true,
        });
      }

      // Add parts used
      console.log('Processing parts - partsUsed length:', partsUsed?.length, 'partsDetails length:', partsDetails.length);
      if (partsUsed && partsUsed.length > 0 && partsDetails.length > 0) {
        partsUsed.forEach((partUsed) => {
          const partDetail = partsDetails.find(p => p.id === partUsed.part_id);
          console.log('Looking for part:', partUsed.part_id, 'Found:', partDetail);
          if (partDetail) {
            items.push({
              item_type: 'part',
              description: `${partDetail.name} (${partDetail.part_number})`,
              quantity: partUsed.quantity || 1,
              unit_price: partDetail.unit_price || 0,
              taxable: true,
            });
          }
        });
      }

      console.log('Final line items:', items);

      // Add description as a service line if no items created
      if (items.length === 0 && ticket.title) {
        items.push({
          item_type: 'service',
          description: ticket.title || 'Service',
          quantity: 1,
          unit_price: 0,
          taxable: true,
        });
      }

      setLineItems(items);
    } catch (error: unknown) {
      console.error('Error loading ticket details:', error);
      const err = error as { message?: string; details?: string; hint?: string };
      console.error('Error details:', err.message, err.details, err.hint);
      alert(`Failed to load ticket details: ${err.message || 'Unknown error'}. Please try again.`);
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '',
      ticket_id: '',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: '',
      payment_terms: 'Net 30',
      tax_rate: 7.5,
      discount_amount: 0,
      notes: '',
      customer_notes: '',
    });
    setLineItems([]);
  };

  const updateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      const updates: Partial<Database['public']['Tables']['invoices']['Update']> = { status: newStatus };

      if (newStatus === 'paid') {
        updates.paid_date = new Date().toISOString().split('T')[0];
        updates.amount_paid = invoices.find(inv => inv.id === invoiceId)?.total_amount || 0;
        updates.balance_due = 0;
      }

      const { error } = await supabase
        .from('invoices')
        .update(updates)
        .eq('id', invoiceId);

      if (error) throw error;
      loadInvoices();
    } catch (error) {
      console.error('Error updating invoice status:', error);
      alert('Failed to update invoice status');
    }
  };

  const deleteInvoice = async (invoiceId: string) => {
    try {
      const { error: lineItemsError } = await supabase
        .from('invoice_line_items')
        .delete()
        .eq('invoice_id', invoiceId);

      if (lineItemsError) throw lineItemsError;

      const { error: invoiceError } = await supabase
        .from('invoices')
        .delete()
        .eq('id', invoiceId);

      if (invoiceError) throw invoiceError;

      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice.');
    }
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch =
      invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft':
        return 'badge-gray';
      case 'sent':
        return 'badge-blue';
      case 'paid':
        return 'badge-green';
      case 'overdue':
        return 'badge-red';
      case 'cancelled':
        return 'badge-red';
      default:
        return 'badge-gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4" />;
      case 'sent':
        return <Send className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
  const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount_paid, 0);
  const outstandingAmount = invoices.filter(inv => inv.status !== 'paid' && inv.status !== 'cancelled').reduce((sum, inv) => sum + inv.balance_due, 0);
  const overdueCount = invoices.filter(inv => inv.status === 'overdue').length;

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Invoicing & Billing</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Create and manage customer invoices
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Invoice</span>
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <div className="card p-6 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                ${totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg flex-shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Paid</p>
              <p className="text-2xl font-bold text-green-600 mt-2">
                ${paidAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg flex-shrink-0">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Outstanding</p>
              <p className="text-2xl font-bold text-yellow-600 mt-2">
                ${outstandingAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 p-3 rounded-lg flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6 flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-red-600 mt-2">{overdueCount}</p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 text-red-600 p-3 rounded-lg flex-shrink-0">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoices, customers..."
              className="input pl-10"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input md:w-64"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Invoice #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Issue Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Balance Due
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No invoices found
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(invoice.status ?? 'draft')}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {invoice.invoice_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white">
                        {invoice.customers?.name || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white">
                        {new Date(invoice.issue_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white">
                        {new Date(invoice.due_date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${invoice.total_amount.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-medium ${invoice.balance_due > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${invoice.balance_due.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${getStatusColor(invoice.status ?? 'draft')}`}>
                        {invoice.status ?? 'draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {invoice.status === 'draft' && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'sent')}
                            className="btn btn-outline p-2"
                            title="Send Invoice"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && (
                          <button
                            onClick={() => updateInvoiceStatus(invoice.id, 'paid')}
                            className="btn btn-primary p-2"
                            title="Mark as Paid"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedInvoice(invoice)}
                          className="btn btn-outline p-2"
                          title="View Details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Invoice</h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedTicketId('');
                  resetForm();
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Related Ticket (Optional)
                  </label>
                  <select
                    value={selectedTicketId}
                    onChange={(e) => handleTicketSelect(e.target.value)}
                    className="input"
                  >
                    <option value="">Select Ticket (optional)</option>
                    {tickets.map((ticket) => (
                      <option key={ticket.id} value={ticket.id}>
                        {ticket.ticket_number} - {ticket.title} ({ticket.customers?.name})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Select a ticket to auto-populate invoice details
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer *
                  </label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="input"
                    disabled={!!selectedTicketId}
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                  {selectedTicketId && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Auto-populated from selected ticket
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="input"
                  >
                    <option value="Due on Receipt">Due on Receipt</option>
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 60">Net 60</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.issue_date}
                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="input"
                    placeholder="Auto-calculated from payment terms"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Line Items</h3>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="btn btn-outline flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {lineItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-start">
                      <div className="col-span-2">
                        <select
                          value={item.item_type}
                          onChange={(e) => updateLineItem(index, 'item_type', e.target.value)}
                          className="input text-sm"
                        >
                          <option value="labor">Labor</option>
                          <option value="part">Part</option>
                          <option value="travel">Travel</option>
                          <option value="service">Service</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                          placeholder="Description"
                          className="input text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                          placeholder="Qty"
                          className="input text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                          placeholder="Price"
                          className="input text-sm"
                          required
                        />
                      </div>
                      <div className="col-span-1 flex items-center">
                        <label className="flex items-center space-x-1 text-xs">
                          <input
                            type="checkbox"
                            checked={item.taxable}
                            onChange={(e) => updateLineItem(index, 'taxable', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-gray-600 dark:text-gray-400">Tax</span>
                        </label>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeLineItem(index)}
                          className="text-red-600 hover:text-red-800 p-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes (Internal)
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="input"
                      rows={3}
                      placeholder="Internal notes not visible to customer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Customer Notes
                    </label>
                    <textarea
                      value={formData.customer_notes}
                      onChange={(e) => setFormData({ ...formData, customer_notes: e.target.value })}
                      className="input"
                      rows={3}
                      placeholder="Notes visible on invoice"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                      Tax Rate (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) || 0 })}
                      className="input flex-1"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 w-32">
                      Discount ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_amount}
                      onChange={(e) => setFormData({ ...formData, discount_amount: parseFloat(e.target.value) || 0 })}
                      className="input flex-1"
                    />
                  </div>
                  <div className="border-t border-gray-300 dark:border-gray-600 pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${calculateTotals().subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Tax:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${calculateTotals().taxAmount.toFixed(2)}
                      </span>
                    </div>
                    {formData.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Discount:</span>
                        <span className="font-medium text-red-600">
                          -${formData.discount_amount.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-300 dark:border-gray-600 pt-2">
                      <span className="text-gray-900 dark:text-white">Total:</span>
                      <span className="text-blue-600">
                        ${calculateTotals().total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onUpdateStatus={updateInvoiceStatus}
          onDelete={deleteInvoice}
        />
      )}
    </div>
  );
}

function InvoiceDetailModal({
  invoice,
  onClose,
  onUpdateStatus,
  onDelete
}: {
  invoice: Invoice;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [lineItems, setLineItems] = useState<Database['public']['Tables']['invoice_line_items']['Row'][]>([]);
  const [loading, setLoading] = useState(true);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const loadLineItems = useCallback(async () => {
    try {
      console.log('Loading line items for invoice:', invoice.id);
      const { data, error } = await supabase
        .from('invoice_line_items')
        .select('*')
        .eq('invoice_id', invoice.id)
        .order('sort_order');

      if (error) {
        console.error('Error loading line items:', error);
      } else {
        console.log('Line items loaded:', data);
        setLineItems(data || []);
      }
    } catch (err) {
      console.error('Exception loading line items:', err);
    } finally {
      setLoading(false);
    }
  }, [invoice.id]);

  useEffect(() => {
    loadLineItems();
  }, [loadLineItems]);

  const handlePrint = () => {
    window.print();
  };

  const handleSend = () => {
    setShowEmailModal(true);
  };

  const handleEmailSent = () => {
    onUpdateStatus(invoice.id, 'sent');
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this invoice?')) {
      onDelete(invoice.id);
      onClose();
    }
  };

  const statusColors = {
    draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };

  console.log('Rendering InvoiceDetailModal for invoice:', invoice);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Invoice {invoice.invoice_number}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Customer</h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {invoice.customers?.name || 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</h3>
              <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${statusColors[invoice.status as keyof typeof statusColors] || statusColors.draft}`}>
                {invoice.status?.toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Issue Date</h3>
              <p className="text-gray-900 dark:text-white">
                {new Date(invoice.issue_date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Due Date</h3>
              <p className="text-gray-900 dark:text-white">
                {new Date(invoice.due_date).toLocaleDateString()}
              </p>
            </div>
            {invoice.tickets && (
              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Related Ticket</h3>
                <p className="text-gray-900 dark:text-white">{invoice.tickets.title}</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Line Items</h3>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 text-sm font-medium text-gray-500 dark:text-gray-400">Description</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-500 dark:text-gray-400">Qty</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-500 dark:text-gray-400">Price</th>
                      <th className="text-right py-2 text-sm font-medium text-gray-500 dark:text-gray-400">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 text-gray-900 dark:text-white">
                          {item.description}
                          {item.taxable && <span className="ml-2 text-xs text-gray-500">(Taxable)</span>}
                        </td>
                        <td className="text-right text-gray-900 dark:text-white">{item.quantity}</td>
                        <td className="text-right text-gray-900 dark:text-white">
                          ${parseFloat(item.unit_price).toFixed(2)}
                        </td>
                        <td className="text-right text-gray-900 dark:text-white">
                          ${parseFloat(item.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Subtotal:</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${(Number(invoice.subtotal) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Tax ({invoice.tax_rate}%):</span>
                  <span className="text-gray-900 dark:text-white font-medium">
                    ${(Number(invoice.tax_amount) || 0).toFixed(2)}
                  </span>
                </div>
                {(Number(invoice.discount_amount) || 0) > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Discount:</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      -${(Number(invoice.discount_amount) || 0).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span className="text-gray-900 dark:text-white">Total:</span>
                  <span className="text-gray-900 dark:text-white">
                    ${(Number(invoice.total_amount) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Amount Paid:</span>
                  <span className="text-green-600 dark:text-green-400 font-medium">
                    ${(Number(invoice.amount_paid) || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Balance Due:</span>
                  <span className="text-gray-900 dark:text-white">
                    ${(Number(invoice.balance_due) || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {invoice.notes && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Internal Notes</h3>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}

          {invoice.customer_notes && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Customer Notes</h3>
              <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{invoice.customer_notes}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 p-6 bg-gray-50 dark:bg-gray-900 rounded-b-xl">
          <div className="flex gap-2">
            {invoice.status === 'draft' && (
              <>
                <button
                  onClick={handleSend}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send Invoice
                </button>
                <button
                  onClick={handleDelete}
                  className="btn btn-outline text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  Delete
                </button>
              </>
            )}
            {(invoice.status === 'sent' || invoice.status === 'overdue') && (
              <>
                <button
                  onClick={() => onUpdateStatus(invoice.id, 'paid')}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark as Paid
                </button>
                <button
                  onClick={handleSend}
                  className="btn btn-outline flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Resend
                </button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="btn btn-outline flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button
              onClick={onClose}
              className="btn btn-outline"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {showEmailModal && (
        <InvoiceEmailModal
          invoiceId={invoice.id}
          onClose={() => setShowEmailModal(false)}
          onSent={handleEmailSent}
        />
      )}
    </div>
  );
}
