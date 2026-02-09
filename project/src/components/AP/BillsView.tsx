import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  DollarSign,
  AlertTriangle,
  Calendar,
  Building2,
  ChevronRight,
  X,
} from 'lucide-react';
import { APService, Bill, BillFilters, APSummary, BillStatus } from '../../services/APService';
import { supabase } from '../../lib/supabase';

interface BillsViewProps {
  onNewBill: () => void;
  onViewBill: (bill: Bill) => void;
  onRecordPayment: (vendorId?: string) => void;
}

export function BillsView({ onNewBill, onViewBill, onRecordPayment }: BillsViewProps) {
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<APSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<BillFilters>({});
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    loadData();
    loadVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [billsData, summaryData] = await Promise.all([
        APService.getBills({ ...filters, search: searchQuery }),
        APService.getAPSummary(),
      ]);
      setBills(billsData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Failed to load AP data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVendors = async () => {
    try {
      const { data } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('is_active', true)
        .order('name');
      setVendors(data || []);
    } catch (error) {
      console.error('Failed to load vendors:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const getStatusBadge = (status: BillStatus | string | null) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      received: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      paid: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      void: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    };

    const displayStatus = status ?? 'draft';
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[displayStatus]}`}>
        {displayStatus.charAt(0).toUpperCase() + displayStatus.slice(1)}
      </span>
    );
  };

  const isOverdue = (bill: Bill) => {
    if (bill.status === 'paid' || bill.status === 'void') return false;
    return new Date(bill.due_date) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Outstanding</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${summary.total_outstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{summary.bills_count} open bills</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  ${summary.total_overdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">{summary.overdue_count} overdue bills</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Due This Week</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  ${summary.due_this_week.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col justify-between h-full">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Quick Actions</p>
              <div className="space-y-2">
                <button onClick={onNewBill} className="btn btn-primary btn-sm w-full flex items-center justify-center space-x-1">
                  <Plus className="w-4 h-4" />
                  <span>New Bill</span>
                </button>
                <button onClick={() => onRecordPayment()} className="btn btn-outline btn-sm w-full flex items-center justify-center space-x-1">
                  <DollarSign className="w-4 h-4" />
                  <span>Record Payment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bills by number or reference..."
                  className="input w-full pl-10"
                />
              </div>
            </form>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`btn ${showFilters ? 'btn-primary' : 'btn-outline'} flex items-center space-x-2`}
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Vendor
                  </label>
                  <select
                    value={filters.vendor_id || ''}
                    onChange={(e) => setFilters({ ...filters, vendor_id: e.target.value || undefined })}
                    className="input w-full"
                  >
                    <option value="">All Vendors</option>
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>{v.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={Array.isArray(filters.status) ? '' : filters.status || ''}
                    onChange={(e) => setFilters({ ...filters, status: (e.target.value || undefined) as BillStatus })}
                    className="input w-full"
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="received">Received</option>
                    <option value="approved">Approved</option>
                    <option value="partial">Partial</option>
                    <option value="paid">Paid</option>
                    <option value="void">Void</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due From
                  </label>
                  <input
                    type="date"
                    value={filters.due_date_from || ''}
                    onChange={(e) => setFilters({ ...filters, due_date_from: e.target.value || undefined })}
                    className="input w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due To
                  </label>
                  <input
                    type="date"
                    value={filters.due_date_to || ''}
                    onChange={(e) => setFilters({ ...filters, due_date_to: e.target.value || undefined })}
                    className="input w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <button onClick={clearFilters} className="btn btn-outline btn-sm flex items-center space-x-1">
                  <X className="w-4 h-4" />
                  <span>Clear Filters</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bills Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading bills...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Bills Found</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || Object.keys(filters).length > 0
                  ? 'Try adjusting your search or filters'
                  : 'Get started by creating your first bill'}
              </p>
              <button onClick={onNewBill} className="btn btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Bill
              </button>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bill #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {bills.map((bill) => (
                  <tr
                    key={bill.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
                      isOverdue(bill) ? 'bg-red-50 dark:bg-red-900/10' : ''
                    }`}
                    onClick={() => onViewBill(bill)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {bill.bill_number}
                        </span>
                      </div>
                      {bill.reference_number && (
                        <p className="text-xs text-gray-500 ml-6">Ref: {bill.reference_number}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {bill.vendor?.name || 'Unknown Vendor'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(bill.bill_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${isOverdue(bill) ? 'text-red-600 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                        {new Date(bill.due_date).toLocaleDateString()}
                        {isOverdue(bill) && (
                          <span className="ml-1 text-xs">(Overdue)</span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                      ${bill.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      <span className={bill.balance_due > 0 ? 'text-gray-900 dark:text-white' : 'text-green-600'}>
                        ${bill.balance_due.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(bill.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewBill(bill);
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
