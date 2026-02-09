import { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Send,
  Calendar,
  DollarSign,
  User,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Estimate = {
  id: string;
  estimate_number: string;
  customer_id: string;
  job_title: string;
  job_description: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'converted';
  total_amount: number;
  estimate_date: string;
  expiration_date: string;
  customers?: { name: string };
  profiles?: { full_name: string };
  created_at: string;
};

interface EstimatesViewProps {
  onViewEstimate: (estimateId: string) => void;
  onCreateEstimate: () => void;
}

export function EstimatesView({ onViewEstimate, onCreateEstimate }: EstimatesViewProps) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [filteredEstimates, setFilteredEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadEstimates();
  }, []);

  useEffect(() => {
    filterEstimates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estimates, searchTerm, statusFilter]);

  const loadEstimates = async () => {
    try {
      const { data, error } = await (supabase
        .from('estimates') as unknown as ReturnType<typeof supabase.from>)
        .select(`
          *,
          customers(name),
          profiles:assigned_to(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEstimates((data as unknown as Estimate[]) || []);
    } catch (error) {
      console.error('Error loading estimates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEstimates = () => {
    let filtered = estimates;

    if (statusFilter !== 'all') {
      filtered = filtered.filter(est => est.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(est =>
        est.estimate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.customers?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        est.job_title.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEstimates(filtered);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      draft: 'badge-gray',
      sent: 'badge-blue',
      viewed: 'badge-purple',
      accepted: 'badge-green',
      rejected: 'badge-red',
      expired: 'badge-yellow',
      converted: 'badge-green'
    };
    return badges[status as keyof typeof badges] || 'badge-gray';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <FileText className="w-4 h-4" />;
      case 'sent': return <Send className="w-4 h-4" />;
      case 'viewed': return <Eye className="w-4 h-4" />;
      case 'accepted': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'expired': return <Clock className="w-4 h-4" />;
      case 'converted': return <CheckCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const isExpiringSoon = (expirationDate: string, status: string) => {
    if (status === 'accepted' || status === 'rejected' || status === 'expired' || status === 'converted') {
      return false;
    }
    const daysUntilExpiration = Math.ceil(
      (new Date(expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiration <= 7 && daysUntilExpiration > 0;
  };

  const isExpired = (expirationDate: string, status: string) => {
    if (status === 'accepted' || status === 'rejected' || status === 'expired' || status === 'converted') {
      return false;
    }
    return new Date(expirationDate) < new Date();
  };

  const stats = {
    total: estimates.length,
    draft: estimates.filter(e => e.status === 'draft').length,
    sent: estimates.filter(e => e.status === 'sent' || e.status === 'viewed').length,
    accepted: estimates.filter(e => e.status === 'accepted').length,
    expired: estimates.filter(e => isExpired(e.expiration_date, e.status)).length,
    totalValue: estimates.reduce((sum, e) => sum + Number(e.total_amount || 0), 0),
    acceptedValue: estimates.filter(e => e.status === 'accepted').reduce((sum, e) => sum + Number(e.total_amount || 0), 0)
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading estimates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Estimates</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage quotes and proposals for pre-job services
          </p>
        </div>
        <button
          onClick={onCreateEstimate}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Estimate</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Estimates</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Awaiting Response</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.sent}</p>
            </div>
            <Send className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Accepted</p>
              <p className="text-2xl font-bold text-green-600">{stats.accepted}</p>
              <p className="text-xs text-gray-500">${stats.acceptedValue.toLocaleString()}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.expired}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by estimate #, customer, or job..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="viewed">Viewed</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="expired">Expired</option>
                <option value="converted">Converted</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Estimate #
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Job Title
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Expires
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEstimates.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchTerm || statusFilter !== 'all'
                        ? 'No estimates found matching your filters'
                        : 'No estimates yet. Create your first estimate to get started.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredEstimates.map((estimate) => {
                  const expiringSoon = isExpiringSoon(estimate.expiration_date, estimate.status);
                  const expired = isExpired(estimate.expiration_date, estimate.status);

                  return (
                    <tr
                      key={estimate.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => onViewEstimate(estimate.id)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(estimate.status)}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {estimate.estimate_number}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {estimate.customers?.name || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-900 dark:text-white">{estimate.job_title}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${getStatusBadge(estimate.status)}`}>
                          {estimate.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {Number(estimate.total_amount || 0).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {new Date(estimate.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className={`text-sm ${
                            expired ? 'text-red-600 font-medium' :
                            expiringSoon ? 'text-yellow-600 font-medium' :
                            'text-gray-600 dark:text-gray-400'
                          }`}>
                            {new Date(estimate.expiration_date).toLocaleDateString()}
                          </span>
                          {(expired || expiringSoon) && (
                            <AlertCircle className={`w-4 h-4 ${expired ? 'text-red-600' : 'text-yellow-600'}`} />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onViewEstimate(estimate.id);
                          }}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
