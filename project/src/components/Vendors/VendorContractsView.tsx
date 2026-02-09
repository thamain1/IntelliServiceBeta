import { useState, useEffect } from 'react';
import { FileText, Plus, Search, DollarSign, AlertCircle, CheckCircle, Clock, XCircle, type LucideIcon } from 'lucide-react';
import { VendorContractService } from '../../services/VendorContractService';
import type { Database } from '../../lib/database.types';
import { NewVendorContractModal } from './NewVendorContractModal';
import { VendorContractDetailModal } from './VendorContractDetailModal';

type VendorContract = Database['public']['Tables']['vendor_contracts']['Row'] & {
  vendors?: { name: string; vendor_code: string };
};

interface VendorContractsViewProps {
  vendorId?: string;
  showVendorColumn?: boolean;
}

export function VendorContractsView({ vendorId, showVendorColumn = true }: VendorContractsViewProps) {
  const [contracts, setContracts] = useState<VendorContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<VendorContract | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [stats, setStats] = useState({
    activeContracts: 0,
    totalValue: 0,
    expiringNext30Days: 0,
  });

  useEffect(() => {
    loadContracts();
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId, statusFilter, typeFilter, searchTerm]);

  const loadContracts = async () => {
    try {
      const data = await VendorContractService.listContracts({
        vendorId,
        status: statusFilter,
        type: typeFilter,
        search: searchTerm,
      });
      setContracts(data);
    } catch (error) {
      console.error('Error loading vendor contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await VendorContractService.getContractStats(vendorId);
      setStats(data);
    } catch (error) {
      console.error('Error loading vendor contract stats:', error);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const badges: Record<string, { className: string; icon: LucideIcon }> = {
      active: { className: 'badge badge-green', icon: CheckCircle },
      draft: { className: 'badge badge-gray', icon: Clock },
      expired: { className: 'badge badge-orange', icon: AlertCircle },
      terminated: { className: 'badge badge-red', icon: XCircle },
      suspended: { className: 'badge badge-yellow', icon: AlertCircle },
    };
    const config = badges[status || ''] || badges.draft;
    const Icon = config.icon;
    return (
      <span className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const getContractTypeBadge = (type: string | null) => {
    const colors: Record<string, string> = {
      pricing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      service: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      warranty: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      rebate: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      distribution: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      msa: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200',
      other: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
    };
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[type ?? ''] || colors.other}`}>
        {(type ?? 'other').toUpperCase()}
      </span>
    );
  };

  const filteredContracts = contracts.filter((contract) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      contract.contract_number?.toLowerCase().includes(term) ||
      contract.vendors?.name?.toLowerCase().includes(term) ||
      contract.vendors?.vendor_code?.toLowerCase().includes(term) ||
      contract.notes?.toLowerCase().includes(term)
    );
  });

  const formatCurrency = (value: number | string | null) => {
    if (!value) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(Number(value));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysUntilExpiration = (endDate: string | null) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Contracts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.activeContracts}
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Value</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-blue-500" />
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expiring in 30 Days</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {stats.expiringNext30Days}
              </p>
            </div>
            <AlertCircle className="w-12 h-12 text-orange-500" />
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              {vendorId ? 'Vendor Contracts' : 'All Vendor Contracts'}
            </h2>
            <button
              onClick={() => setShowNewModal(true)}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Contract
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search contracts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input w-full sm:w-48"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="expired">Expired</option>
              <option value="terminated">Terminated</option>
              <option value="suspended">Suspended</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input w-full sm:w-48"
            >
              <option value="all">All Types</option>
              <option value="pricing">Pricing</option>
              <option value="service">Service</option>
              <option value="warranty">Warranty</option>
              <option value="rebate">Rebate</option>
              <option value="distribution">Distribution</option>
              <option value="msa">MSA</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredContracts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No contracts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {vendorId
                  ? 'Create your first contract for this vendor.'
                  : 'Get started by creating a vendor contract.'}
              </p>
              <button
                onClick={() => setShowNewModal(true)}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Contract
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Contract Number</th>
                  {showVendorColumn && <th>Vendor</th>}
                  <th>Type</th>
                  <th>Status</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Value</th>
                  <th>Expires In</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.map((contract) => {
                  const daysUntilExpiration = getDaysUntilExpiration(contract.end_date);
                  return (
                    <tr key={contract.id}>
                      <td>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {contract.contract_number}
                        </div>
                        {contract.notes && (
                          <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {contract.notes}
                          </div>
                        )}
                      </td>
                      {showVendorColumn && (
                        <td>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {contract.vendors?.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {contract.vendors?.vendor_code}
                          </div>
                        </td>
                      )}
                      <td>{getContractTypeBadge(contract.contract_type)}</td>
                      <td>{getStatusBadge(contract.status)}</td>
                      <td>{formatDate(contract.start_date)}</td>
                      <td>{formatDate(contract.end_date)}</td>
                      <td>{formatCurrency(contract.contract_value)}</td>
                      <td>
                        {daysUntilExpiration === null ? (
                          <span className="text-gray-500">-</span>
                        ) : daysUntilExpiration < 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            Expired
                          </span>
                        ) : daysUntilExpiration <= 30 ? (
                          <span className="text-orange-600 dark:text-orange-400 font-medium">
                            {daysUntilExpiration} days
                          </span>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400">
                            {daysUntilExpiration} days
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showNewModal && (
        <NewVendorContractModal
          vendorId={vendorId}
          onClose={() => {
            setShowNewModal(false);
            loadContracts();
            loadStats();
          }}
        />
      )}

      {selectedContract && (
        <VendorContractDetailModal
          contract={selectedContract}
          onClose={() => {
            setSelectedContract(null);
            loadContracts();
            loadStats();
          }}
        />
      )}
    </div>
  );
}
