import { useState, useEffect } from 'react';
import { Building2, DollarSign, TrendingUp, MapPin, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface MasterProject {
  master_project_id: string;
  project_number: string;
  project_name: string;
  customer_id: string;
  customer_name: string;
  status: string;
  contract_value_total: number;
  total_sites: number;
  sites_completed: number;
  sites_in_progress: number;
  percent_complete_units: number;
  total_billed: number;
  total_deposits: number;
  total_deposits_unreleased: number;
  total_revenue_recognized: number;
  total_cost: number;
  total_gross_profit: number;
  total_unbilled: number;
  gross_margin_percent: number;
  start_date: string;
  end_date: string | null;
}

interface SiteJob {
  site_job_id: string;
  master_project_id: string;
  site_project_number: string;
  site_project_name: string;
  site_name: string | null;
  site_address: string | null;
  sequence_number: number | null;
  site_status: string;
  contract_value: number;
  billed_to_date: number;
  revenue_recognized: number;
  cost_to_date: number;
  gross_profit: number;
  unbilled_amount: number;
  total_milestones: number;
  completed_milestones: number;
  milestone_completion_percent: number;
}

interface MasterProjectViewProps {
  projectId: string;
  onClose: () => void;
}

export function MasterProjectView({ projectId, onClose }: MasterProjectViewProps) {
  const [masterProject, setMasterProject] = useState<MasterProject | null>(null);
  const [siteJobs, setSiteJobs] = useState<SiteJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sites' | 'financials'>('overview');

  useEffect(() => {
    loadMasterProjectData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadMasterProjectData = async () => {
    try {
      const { data: masterData, error: masterError } = await supabase
        .from('v_master_project_rollup')
        .select('*')
        .eq('master_project_id', projectId)
        .single();

      if (masterError) throw masterError;
      setMasterProject(masterData as unknown as MasterProject);

      const { data: sitesData, error: sitesError } = await supabase
        .from('v_site_jobs_summary')
        .select('*')
        .eq('master_project_id', projectId)
        .order('sequence_number', { ascending: true, nullsFirst: false });

      if (sitesError) throw sitesError;
      setSiteJobs((sitesData as unknown as SiteJob[]) || []);
    } catch (error) {
      console.error('Error loading master project:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number | null) => {
    if (value === null || value === undefined) return '0%';
    return `${value.toFixed(1)}%`;
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { className: string; icon: React.ElementType }> = {
      completed: { className: 'badge badge-green', icon: CheckCircle },
      in_progress: { className: 'badge badge-blue', icon: Clock },
      planning: { className: 'badge badge-yellow', icon: AlertCircle },
      on_hold: { className: 'badge badge-orange', icon: AlertCircle },
      cancelled: { className: 'badge badge-red', icon: AlertCircle },
    };
    const config = badges[status] || badges.planning;
    const Icon = config.icon;
    return (
      <span className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {status.replace('_', ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!masterProject) {
    return (
      <div className="card p-8 text-center">
        <AlertCircle className="w-16 h-16 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">Master project not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={onClose} className="btn btn-outline flex items-center space-x-2">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Projects</span>
      </button>

      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-6 h-6" />
                {masterProject.project_name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {masterProject.project_number} | {masterProject.customer_name}
              </p>
            </div>
            {getStatusBadge(masterProject.status)}
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wide">
                Contract Value
              </p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-2">
                {formatCurrency(masterProject.contract_value_total)}
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">
                Total Sites
              </p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-2">
                {masterProject.total_sites}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                {masterProject.sites_completed} completed, {masterProject.sites_in_progress} in progress
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wide">
                Completion
              </p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-2">
                {formatPercent(masterProject.percent_complete_units)}
              </p>
              <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2 mt-2">
                <div
                  className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full transition-all"
                  style={{ width: `${masterProject.percent_complete_units}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <p className="text-xs text-orange-600 dark:text-orange-400 font-medium uppercase tracking-wide">
                Gross Margin
              </p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100 mt-2">
                {formatPercent(masterProject.gross_margin_percent)}
              </p>
              <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                {formatCurrency(masterProject.total_gross_profit)} profit
              </p>
            </div>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
            <nav className="flex space-x-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('sites')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'sites'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Site Jobs ({siteJobs.length})
              </button>
              <button
                onClick={() => setActiveTab('financials')}
                className={`py-3 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'financials'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Financials
              </button>
            </nav>
          </div>

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Revenue</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Revenue Recognized</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(masterProject.total_revenue_recognized)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Billed</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(masterProject.total_billed)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Unbilled Amount</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(masterProject.total_unbilled)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Deposits</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Deposits Billed</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(masterProject.total_deposits)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Unreleased</span>
                    <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                      {formatCurrency(masterProject.total_deposits_unreleased)}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Costs & Profit</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Total Cost</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(masterProject.total_cost)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Gross Profit</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(masterProject.total_gross_profit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sites' && (
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Site</th>
                    <th>Status</th>
                    <th>Contract Value</th>
                    <th>Billed</th>
                    <th>Revenue</th>
                    <th>Cost</th>
                    <th>Profit</th>
                    <th>Milestones</th>
                  </tr>
                </thead>
                <tbody>
                  {siteJobs.map((site) => (
                    <tr key={site.site_job_id}>
                      <td>
                        <div className="flex items-start">
                          <MapPin className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">
                              {site.site_name || site.site_project_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {site.site_project_number}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>{getStatusBadge(site.site_status)}</td>
                      <td>{formatCurrency(site.contract_value)}</td>
                      <td>{formatCurrency(site.billed_to_date)}</td>
                      <td>{formatCurrency(site.revenue_recognized)}</td>
                      <td>{formatCurrency(site.cost_to_date)}</td>
                      <td>
                        <span className={site.gross_profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                          {formatCurrency(site.gross_profit)}
                        </span>
                      </td>
                      <td>
                        <div className="text-sm">
                          {site.completed_milestones} / {site.total_milestones}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatPercent(site.milestone_completion_percent)}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'financials' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Revenue Breakdown
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Contract Value</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(masterProject.contract_value_total)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600 dark:text-gray-400">100%</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Revenue Recognized</p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(masterProject.total_revenue_recognized)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-green-600 dark:text-green-400">
                        {formatPercent((masterProject.total_revenue_recognized / (masterProject.contract_value_total || 1)) * 100)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div>
                      <p className="text-sm text-orange-600 dark:text-orange-400">Unbilled Amount</p>
                      <p className="text-xl font-bold text-orange-900 dark:text-orange-100">
                        {formatCurrency(masterProject.total_unbilled)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        {formatPercent((masterProject.total_unbilled / (masterProject.contract_value_total || 1)) * 100)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Profitability
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(masterProject.total_revenue_recognized)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div>
                      <p className="text-sm text-red-600 dark:text-red-400">Total Cost</p>
                      <p className="text-xl font-bold text-red-900 dark:text-red-100">
                        {formatCurrency(masterProject.total_cost)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div>
                      <p className="text-sm text-green-600 dark:text-green-400">Gross Profit</p>
                      <p className="text-xl font-bold text-green-900 dark:text-green-100">
                        {formatCurrency(masterProject.total_gross_profit)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {formatPercent(masterProject.gross_margin_percent)}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">Margin</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
