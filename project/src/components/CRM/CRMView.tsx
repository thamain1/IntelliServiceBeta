import { useState, useEffect } from 'react';
import {
  Target,
  Kanban,
  UserPlus,
  MessageSquare,
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  Clock,
  Phone,
  Mail,
  Calendar,
  ChevronRight,
  Plus,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { SalesPipeline } from './SalesPipeline';
import { LeadsInbox } from './LeadsInbox';
import { SalesOpportunities } from './SalesOpportunities';
import { InteractionsView } from './InteractionsView';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { CRMService } from '../../services/CRMService';

type CRMTab = 'pipeline' | 'leads' | 'opportunities' | 'interactions' | 'analytics';

interface CRMViewProps {
  initialTab?: string;
}

export function CRMView({ initialTab = 'pipeline' }: CRMViewProps) {
  const [activeTab, setActiveTab] = useState<CRMTab>(() => {
    if (initialTab.includes('pipeline')) return 'pipeline';
    if (initialTab.includes('leads')) return 'leads';
    if (initialTab.includes('opportunities')) return 'opportunities';
    if (initialTab.includes('interactions')) return 'interactions';
    if (initialTab.includes('analytics')) return 'analytics';
    return 'pipeline';
  });
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pipelineValue: 0,
    activeLeads: 0,
    opportunities: 0,
    pendingFollowUps: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [pipeline, leads, opportunities, followUps] = await Promise.all([
        CRMService.getSalesPipeline(),
        CRMService.getLeadsInbox(),
        CRMService.getSalesOpportunities(),
        CRMService.getUpcomingFollowUps(7),
      ]);

      setStats({
        pipelineValue: pipeline.reduce((sum, item) => sum + (item.total_amount || 0), 0),
        activeLeads: leads.length,
        opportunities: opportunities.length,
        pendingFollowUps: followUps.length,
      });
    } catch (err) {
      console.error('Failed to load CRM stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'pipeline' as CRMTab, label: 'Sales Pipeline', icon: Kanban },
    { id: 'leads' as CRMTab, label: 'Leads', icon: UserPlus },
    { id: 'opportunities' as CRMTab, label: 'Opportunities', icon: Target },
    { id: 'interactions' as CRMTab, label: 'Interactions', icon: MessageSquare },
    { id: 'analytics' as CRMTab, label: 'Analytics', icon: BarChart3 },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'pipeline':
        return <SalesPipeline onRefresh={loadStats} />;
      case 'leads':
        return <LeadsInbox onRefresh={loadStats} />;
      case 'opportunities':
        return <SalesOpportunities onRefresh={loadStats} />;
      case 'interactions':
        return <InteractionsView />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <SalesPipeline onRefresh={loadStats} />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Target className="w-7 h-7 text-blue-600" />
            CRM & Sales
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage leads, track opportunities, and monitor sales performance
          </p>
        </div>
        <button
          onClick={loadStats}
          className="btn btn-outline flex items-center gap-2"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pipeline Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${stats.pipelineValue.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Leads</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.activeLeads}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sales Opportunities</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.opportunities}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Target className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Follow-ups</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.pendingFollowUps}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
}
