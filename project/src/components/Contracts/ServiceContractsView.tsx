import { useEffect, useState, useCallback } from 'react';
import { FileText, Plus, Search, Calendar, DollarSign, Users, AlertTriangle, RefreshCw, CheckCircle, Clock, BarChart2, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/dbTypes';
import { ContractDetailModal } from './ContractDetailModal';
import { NewContractModal } from './NewContractModal';
import { ContractAutomationService, type ContractRenewalReminder, type SLAMetrics, type ContractPlan } from '../../services/ContractAutomationService';

type ServiceContract = Tables<'service_contracts'> & {
  customers?: { name: string; email: string };
  customer_locations?: { location_name: string; address: string };
  contract_plans?: { name: string };
};

type ContractStatus = 'draft' | 'active' | 'expired' | 'cancelled' | 'suspended';

type TabType = 'contracts' | 'expiring' | 'sla';

export function ServiceContractsView() {
  const [contracts, setContracts] = useState<ServiceContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<ServiceContract | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('contracts');
  const [expiringContracts, setExpiringContracts] = useState<ContractRenewalReminder[]>([]);
  const [slaMetrics, setSlaMetrics] = useState<SLAMetrics[]>([]);
  const [contractPlans, setContractPlans] = useState<ContractPlan[]>([]);
  const [renewingContractId, setRenewingContractId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    activeContracts: 0,
    totalRevenue: 0,
    expiringNext30Days: 0,
    slaBreeches: 0,
  });

  const loadContractPlans = useCallback(async () => {
    try {
      const plans = await ContractAutomationService.getContractPlans();
      setContractPlans(plans);
    } catch (error) {
      console.error('Error loading contract plans:', error);
    }
  }, []);

  const loadContracts = useCallback(async () => {
    try {
      let query = supabase
        .from('service_contracts')
        .select(`
          *,
          customers(name, email),
          customer_locations(location_name, address),
          contract_plans(name)
        `);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter as ContractStatus);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setContracts((data as ServiceContract[]) || []);
    } catch (error) {
      console.error('Error loading contracts:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadStats = useCallback(async () => {
    try {
      const { data: activeData, error: activeError } = await supabase
        .from('service_contracts')
        .select('id, base_fee')
        .eq('status', 'active');

      if (activeError) throw activeError;

      const { data: expiringData, error: expiringError } = await supabase
        .from('service_contracts')
        .select('id')
        .eq('status', 'active')
        .gte('end_date', new Date().toISOString().split('T')[0])
        .lte('end_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

      if (expiringError) throw expiringError;

      const totalRevenue = (activeData || []).reduce((sum, contract) => sum + Number(contract.base_fee || 0), 0);

      setStats((prev) => ({
        ...prev,
        activeContracts: activeData?.length || 0,
        totalRevenue,
        expiringNext30Days: expiringData?.length || 0,
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }, []);

  const loadExpiringContracts = useCallback(async () => {
    try {
      const expiring = await ContractAutomationService.getExpiringContracts(60);
      setExpiringContracts(expiring);
    } catch (error) {
      console.error('Error loading expiring contracts:', error);
    }
  }, []);

  const loadSLAMetrics = useCallback(async () => {
    try {
      const metrics = await ContractAutomationService.getSLAMetrics();
      setSlaMetrics(metrics);
      const breeches = metrics.filter((m) => m.sla_compliance_rate < 80).length;
      setStats((prev) => ({ ...prev, slaBreeches: breeches }));
    } catch (error) {
      console.error('Error loading SLA metrics:', error);
    }
  }, []);

  useEffect(() => {
    loadContracts();
    loadStats();
    loadExpiringContracts();
    loadSLAMetrics();
    loadContractPlans();
  }, [statusFilter, loadContracts, loadStats, loadExpiringContracts, loadSLAMetrics, loadContractPlans]);

  const handleRenewContract = async (contractId: string, _daysUntilExpiry: number) => {
    setRenewingContractId(contractId);
    try {
      // Calculate new end date (1 year from current end date)
      const contract = expiringContracts.find((c) => c.contract_id === contractId);
      if (!contract) return;

      const currentEndDate = new Date(contract.end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);

      const result = await ContractAutomationService.renewContract(contractId, {
        newEndDate: newEndDate.toISOString().split('T')[0],
        notes: `Auto-renewed on ${new Date().toLocaleDateString()}`,
      });

      if (result.success) {
        alert('Contract renewed successfully!');
        loadContracts();
        loadStats();
        loadExpiringContracts();
      } else {
        alert(`Failed to renew: ${result.error}`);
      }
    } catch (error: unknown) {
      console.error('Error renewing contract:', error);
      alert(`Failed to renew contract: ${(error as Error).message}`);
    } finally {
      setRenewingContractId(null);
    }
  };

  const formatRenewalEmail = (reminder: ContractRenewalReminder) => {
    const emailData = ContractAutomationService.formatRenewalReminderEmail(reminder);
    // Open email client with pre-filled data
    const mailtoUrl = `mailto:${reminder.customer_email || ''}?subject=${encodeURIComponent(emailData.subject)}&body=${encodeURIComponent(emailData.body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const getStatusColor = (status: ContractStatus) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
      case 'expired':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'cancelled':
      case 'suspended':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  const formatStatus = (status: string | null) => {
    return (status ?? 'active').charAt(0).toUpperCase() + (status ?? 'active').slice(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Service Contracts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage customer maintenance agreements and service plans
          </p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          New Contract
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Contracts</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.activeContracts}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Annual Revenue</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="card p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('expiring')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Expiring Soon</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {stats.expiringNext30Days}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </div>

        <div className="card p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('sla')}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">SLA Issues</p>
              <p className={`text-3xl font-bold mt-1 ${stats.slaBreeches > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                {stats.slaBreeches}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stats.slaBreeches > 0 ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
              <BarChart2 className={`w-6 h-6 ${stats.slaBreeches > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'contracts'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          All Contracts
        </button>
        <button
          onClick={() => setActiveTab('expiring')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'expiring'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Expiring ({expiringContracts.length})
        </button>
        <button
          onClick={() => setActiveTab('sla')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'sla'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <BarChart2 className="w-4 h-4 inline mr-2" />
          SLA Monitor
        </button>
      </div>

      {/* Contracts Tab */}
      {activeTab === 'contracts' && (
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contracts or customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="input"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Contract Name</th>
                  <th>Customer</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Term</th>
                  <th>Next Billing</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContracts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">
                        {searchTerm ? 'No contracts found matching your search' : 'No contracts yet'}
                      </p>
                      {!searchTerm && (
                        <button
                          onClick={() => setShowNewModal(true)}
                          className="btn-primary mt-4"
                        >
                          <Plus className="w-5 h-5 mr-2" />
                          Create First Contract
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredContracts.map((contract) => (
                    <tr key={contract.id}>
                      <td>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {contract.name}
                        </div>
                        {contract.customer_locations && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {contract.customer_locations.location_name}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="text-gray-900 dark:text-white">
                          {contract.customers?.name}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {contract.customers?.email}
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-blue">
                          {contract.contract_plans?.name || 'Custom'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getStatusColor(contract.status as ContractStatus)}`}>
                          {formatStatus(contract.status)}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-1" />
                          {contract.start_date} to {contract.end_date || 'Ongoing'}
                        </div>
                      </td>
                      <td>
                        {contract.next_billing_date ? (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {contract.next_billing_date}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => setSelectedContract(contract)}
                          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expiring Contracts Tab */}
      {activeTab === 'expiring' && (
        <div className="space-y-6">
          {/* Contract Plans Quick Create */}
          {contractPlans.length > 0 && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Create from Plan
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {contractPlans.map((plan) => (
                  <div
                    key={plan.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
                    onClick={() => setShowNewModal(true)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white">{plan.name}</h4>
                      <span className={`badge text-xs ${
                        plan.priority_level === 'vip' ? 'badge-purple' :
                        plan.priority_level === 'priority' ? 'badge-orange' : 'badge-gray'
                      }`}>
                        {plan.priority_level}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{plan.description || 'No description'}</p>
                    <div className="mt-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {formatCurrency(plan.default_base_fee || 0)}
                          <span className="text-xs font-normal text-gray-500">/yr</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{plan.included_visits_per_year || 0} visits/yr</span>
                        {plan.response_time_sla_hours && (
                          <span>{plan.response_time_sla_hours}h SLA</span>
                        )}
                      </div>
                      {(plan.labor_discount_percent || plan.parts_discount_percent) ? (
                        <div className="flex items-center space-x-2 text-xs">
                          {plan.labor_discount_percent ? (
                            <span className="text-green-600 dark:text-green-400">{plan.labor_discount_percent}% labor</span>
                          ) : null}
                          {plan.parts_discount_percent ? (
                            <span className="text-green-600 dark:text-green-400">{plan.parts_discount_percent}% parts</span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Expiring Contracts List */}
          <div className="card">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Contracts Expiring in Next 60 Days
                </h3>
                <span className="badge badge-orange">{expiringContracts.length} contracts</span>
              </div>
            </div>

            {expiringContracts.length === 0 ? (
              <div className="p-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No contracts expiring soon</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {expiringContracts.map((contract) => (
                  <div key={contract.contract_id} className="p-6 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {contract.contract_name}
                        </h4>
                        <span
                          className={`badge ${
                            contract.days_until_expiry <= 7
                              ? 'badge-red'
                              : contract.days_until_expiry <= 30
                              ? 'badge-orange'
                              : 'badge-yellow'
                          }`}
                        >
                          {contract.days_until_expiry <= 0
                            ? 'Expired'
                            : `${contract.days_until_expiry} days left`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {contract.customer_name} &bull; Expires: {new Date(contract.end_date).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Annual Value: {formatCurrency(contract.base_fee)}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {contract.customer_email && (
                        <button
                          onClick={() => formatRenewalEmail(contract)}
                          className="btn-outline text-sm py-2"
                          title="Send renewal reminder"
                        >
                          <Mail className="w-4 h-4 mr-1" />
                          Remind
                        </button>
                      )}
                      <button
                        onClick={() => handleRenewContract(contract.contract_id, contract.days_until_expiry)}
                        disabled={renewingContractId === contract.contract_id}
                        className="btn-primary text-sm py-2"
                      >
                        {renewingContractId === contract.contract_id ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Renewing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Renew
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SLA Monitor Tab */}
      {activeTab === 'sla' && (
        <div className="card">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                SLA Compliance Monitor
              </h3>
              <button onClick={loadSLAMetrics} className="btn-outline text-sm py-2">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {slaMetrics.length === 0 ? (
            <div className="p-12 text-center">
              <BarChart2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No SLA data available</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                SLA metrics will appear as tickets are processed
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Contract</th>
                    <th>Customer</th>
                    <th>Total Tickets</th>
                    <th>Response Target</th>
                    <th>Avg Response</th>
                    <th>SLA Compliance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {slaMetrics.map((metric) => (
                    <tr key={metric.contract_id}>
                      <td className="font-medium text-gray-900 dark:text-white">
                        {metric.contract_name}
                      </td>
                      <td className="text-gray-600 dark:text-gray-400">
                        {metric.customer_name}
                      </td>
                      <td className="text-center">
                        <span className="badge badge-gray">{metric.total_tickets}</span>
                      </td>
                      <td className="text-center text-gray-600 dark:text-gray-400">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {metric.response_time_target_hours}h
                      </td>
                      <td className="text-center">
                        <span
                          className={`font-medium ${
                            metric.avg_response_time_hours <= metric.response_time_target_hours
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {metric.avg_response_time_hours.toFixed(1)}h
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center space-x-2">
                          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                metric.sla_compliance_rate >= 90
                                  ? 'bg-green-500'
                                  : metric.sla_compliance_rate >= 80
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, metric.sla_compliance_rate)}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-12 text-right">
                            {metric.sla_compliance_rate.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td>
                        {metric.sla_compliance_rate >= 90 ? (
                          <span className="badge badge-green">Excellent</span>
                        ) : metric.sla_compliance_rate >= 80 ? (
                          <span className="badge badge-yellow">Good</span>
                        ) : (
                          <span className="badge badge-red">At Risk</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* SLA Summary Cards */}
          {slaMetrics.length > 0 && (
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Contracts</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{slaMetrics.length}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                  <p className="text-xs text-green-600 dark:text-green-400">Meeting SLA</p>
                  <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                    {slaMetrics.filter((m) => m.sla_compliance_rate >= 80).length}
                  </p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                  <p className="text-xs text-red-600 dark:text-red-400">Below SLA</p>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                    {slaMetrics.filter((m) => m.sla_compliance_rate < 80).length}
                  </p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <p className="text-xs text-blue-600 dark:text-blue-400">Avg Compliance</p>
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                    {(slaMetrics.reduce((sum, m) => sum + m.sla_compliance_rate, 0) / slaMetrics.length).toFixed(0)}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {selectedContract && (
        <ContractDetailModal
          contract={selectedContract}
          onClose={() => {
            setSelectedContract(null);
            loadContracts();
            loadStats();
          }}
        />
      )}

      {showNewModal && (
        <NewContractModal
          onClose={() => {
            setShowNewModal(false);
            loadContracts();
            loadStats();
          }}
        />
      )}
    </div>
  );
}
