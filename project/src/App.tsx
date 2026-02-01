import { useState, useEffect, lazy, Suspense } from 'react';
import { LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { EstimatePortalView } from './components/Estimates/EstimatePortalView';
import { SidebarNew } from './components/Layout/SidebarNew';

// Lazy-loaded view components
const DashboardView = lazy(() => import('./components/Dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const TicketsView = lazy(() => import('./components/Tickets/TicketsView').then(m => ({ default: m.TicketsView })));
const DispatchView = lazy(() => import('./components/Dispatch/DispatchView').then(m => ({ default: m.DispatchView })));
const TrackingView = lazy(() => import('./components/Tracking/TrackingView').then(m => ({ default: m.TrackingView })));
const MappingView = lazy(() => import('./components/Mapping/MappingView').then(m => ({ default: m.MappingView })));
const DispatchMapView = lazy(() => import('./components/Mapping/DispatchMapView').then(m => ({ default: m.DispatchMapView })));
const PartsManagementView = lazy(() => import('./components/Parts/PartsManagementView').then(m => ({ default: m.PartsManagementView })));
const EquipmentView = lazy(() => import('./components/Equipment/EquipmentView').then(m => ({ default: m.EquipmentView })));
const VendorsView = lazy(() => import('./components/Vendors/VendorsView').then(m => ({ default: m.VendorsView })));
const ProjectsView = lazy(() => import('./components/Projects/ProjectsView').then(m => ({ default: m.ProjectsView })));
const CustomersView = lazy(() => import('./components/Customers/CustomersView').then(m => ({ default: m.CustomersView })));
const InvoicingView = lazy(() => import('./components/Invoicing/InvoicingView').then(m => ({ default: m.InvoicingView })));
const TimeClockView = lazy(() => import('./components/Tracking/TimeClockView').then(m => ({ default: m.TimeClockView })));
const AccountingView = lazy(() => import('./components/Accounting/AccountingView').then(m => ({ default: m.AccountingView })));
const PayrollView = lazy(() => import('./components/Payroll/PayrollView').then(m => ({ default: m.PayrollView })));
const ReportsView = lazy(() => import('./components/Reports/ReportsView').then(m => ({ default: m.ReportsView })));
const SettingsView = lazy(() => import('./components/Settings/SettingsView').then(m => ({ default: m.SettingsView })));
const EstimatesViewContainer = lazy(() => import('./components/Estimates/EstimatesViewContainer').then(m => ({ default: m.EstimatesViewContainer })));
const DataImportView = lazy(() => import('./components/DataImport/DataImportView').then(m => ({ default: m.DataImportView })));
const ServiceContractsView = lazy(() => import('./components/Contracts/ServiceContractsView').then(m => ({ default: m.ServiceContractsView })));
const ContractPlansView = lazy(() => import('./components/Contracts/ContractPlansView').then(m => ({ default: m.ContractPlansView })));
const VendorCatalogsView = lazy(() => import('./components/Parts/VendorCatalogsView').then(m => ({ default: m.VendorCatalogsView })));
const ReorderAlertsView = lazy(() => import('./components/Parts/ReorderAlertsView').then(m => ({ default: m.ReorderAlertsView })));
const LeadTimeReportsView = lazy(() => import('./components/Parts/LeadTimeReportsView').then(m => ({ default: m.LeadTimeReportsView })));
const FinancialsReport = lazy(() => import('./components/BI/FinancialsReport').then(m => ({ default: m.FinancialsReport })));
const TechnicianMetricsReport = lazy(() => import('./components/BI/TechnicianMetricsReport').then(m => ({ default: m.TechnicianMetricsReport })));
const ProjectMarginsReport = lazy(() => import('./components/BI/ProjectMarginsReport').then(m => ({ default: m.ProjectMarginsReport })));
const RevenueTrendsInsight = lazy(() => import('./components/BI/RevenueTrendsInsight').then(m => ({ default: m.RevenueTrendsInsight })));
const CustomerValueInsight = lazy(() => import('./components/BI/CustomerValueInsight').then(m => ({ default: m.CustomerValueInsight })));
const DSOInsight = lazy(() => import('./components/BI/DSOInsight').then(m => ({ default: m.DSOInsight })));
const LaborEfficiencyInsight = lazy(() => import('./components/BI/LaborEfficiencyInsight').then(m => ({ default: m.LaborEfficiencyInsight })));
const HelpView = lazy(() => import('./components/Help/HelpView').then(m => ({ default: m.HelpView })));
const CRMView = lazy(() => import('./components/CRM/CRMView').then(m => ({ default: m.CRMView })));

// Loading spinner for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

function AppContent() {
  const { user, loading, signOut } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [viewFilter, setViewFilter] = useState<string | undefined>(undefined);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [portalToken, setPortalToken] = useState<string | null>(null);

  useEffect(() => {
    const path = window.location.pathname;
    const portalMatch = path.match(/\/estimate-portal\/([^\/]+)/);
    if (portalMatch) {
      setPortalToken(portalMatch[1]);
    }
  }, []);

  if (portalToken) {
    return <EstimatePortalView token={portalToken} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setViewFilter(undefined);
    setIsMobileMenuOpen(false);
  };

  const handleNavigateWithFilter = (view: string, filter?: string) => {
    setCurrentView(view);
    setViewFilter(filter);
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    try {
      console.log('Sign out button clicked');
      await signOut();
      console.log('Sign out successful');
    } catch (error) {
      console.error('Error signing out:', error);
      alert('Failed to sign out. Please try again. Error: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView onNavigate={handleNavigateWithFilter} />;
      case 'tickets':
        return <TicketsView initialFilter={viewFilter} />;
      case 'estimates':
        return <EstimatesViewContainer />;
      case 'dispatch':
        return <DispatchView />;
      case 'tracking':
      case 'mapping':
        return <MappingView />;
      case 'dispatch-map':
        return <DispatchMapView />;
      case 'parts':
      case 'parts-inventory':
      case 'parts-purchase-orders':
      case 'parts-transfers':
      case 'parts-receiving':
      case 'parts-receipts':
        return <PartsManagementView initialView={currentView} itemType="part" />;
      case 'tools':
      case 'tools-inventory':
      case 'tools-purchase-orders':
      case 'tools-transfers':
      case 'tools-receiving':
      case 'tools-receipts':
        return <PartsManagementView initialView={currentView} itemType="tool" />;
      case 'equipment':
      case 'equipment-installed':
      case 'equipment-parts':
      case 'equipment-warranty':
        return <EquipmentView />;
      case 'vendors':
      case 'vendors-list':
        return <VendorsView initialTab="vendors-list" onViewChange={handleViewChange} />;
      case 'vendors-contracts':
        return <VendorsView initialTab="vendors-contracts" onViewChange={handleViewChange} />;
      case 'vendors-performance':
        return <VendorsView initialTab="vendors-performance" onViewChange={handleViewChange} />;
      case 'vendors-payments':
        return <VendorsView initialTab="vendors-payments" onViewChange={handleViewChange} />;
      case 'vendor-details':
      case 'vendor-contracts':
      case 'vendor-performance':
      case 'vendor-payments':
        return <VendorsView initialTab={currentView} onViewChange={handleViewChange} />;
      case 'parts-ordering':
      case 'parts-ordering-catalogs':
        return <VendorCatalogsView />;
      case 'parts-ordering-reorder':
        return <ReorderAlertsView />;
      case 'parts-ordering-leadtime':
        return <LeadTimeReportsView />;
      case 'projects':
      case 'projects-overview':
      case 'projects-gantt':
      case 'projects-budget':
        return <ProjectsView />;
      case 'customers':
        return <CustomersView />;
      case 'service-contracts':
        return <ServiceContractsView />;
      case 'invoicing':
        return <InvoicingView />;
      case 'timeclock':
        return <TimeClockView />;
      case 'accounting':
        return <AccountingView initialView="dashboard" />;
      case 'accounting-ledger':
        return <AccountingView initialView="general-ledger" />;
      case 'accounting-ar-ap':
        return <AccountingView initialView="ar-ap" />;
      case 'accounting-chart':
        return <AccountingView initialView="chart-of-accounts" />;
      case 'accounting-reconciliation':
        return <AccountingView initialView="reconciliations" />;
      case 'payroll':
      case 'payroll-runs':
      case 'payroll-time-cost':
      case 'payroll-stubs':
        return <PayrollView />;
      case 'reports':
      case 'reports-job-cost':
        return <ReportsView />;
      case 'reports-financials':
        return <FinancialsReport />;
      case 'reports-technician':
        return <TechnicianMetricsReport />;
      case 'reports-margins':
        return <ProjectMarginsReport />;
      case 'insights':
      case 'insights-revenue':
        return <RevenueTrendsInsight />;
      case 'insights-customer':
        return <CustomerValueInsight />;
      case 'insights-dso':
        return <DSOInsight />;
      case 'insights-labor':
        return <LaborEfficiencyInsight />;
      case 'settings':
      case 'settings-users':
      case 'settings-labor-rates':
      case 'settings-notifications':
      case 'settings-permissions':
        return <SettingsView initialTab={currentView} />;
      case 'settings-contract-plans':
        return <ContractPlansView />;
      case 'data-import':
        return <DataImportView />;
      case 'help':
        return <HelpView />;
      case 'crm-pipeline':
        return <CRMView initialTab="pipeline" />;
      case 'crm-leads':
        return <CRMView initialTab="leads" />;
      case 'crm-opportunities':
        return <CRMView initialTab="opportunities" />;
      case 'crm-interactions':
        return <CRMView initialTab="interactions" />;
      case 'crm-analytics':
      case 'crm-analytics-pareto':
      case 'crm-analytics-callbacks':
      case 'crm-analytics-equipment':
      case 'crm-analytics-tech-quality':
        return <CRMView initialTab="analytics" />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile by default, slides in when menu is open */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <SidebarNew currentView={currentView} onViewChange={handleViewChange} />
      </div>

      {/* Main content area */}
      <main className="flex-1 overflow-auto w-full">
        {/* Mobile header with hamburger menu */}
        <div className="md:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between sticky top-0 z-30">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <svg
              className="w-6 h-6 text-gray-900 dark:text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
          <img
            src="/image.png"
            alt="Dunaway Logo"
            className="h-12 w-auto object-contain"
          />
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
            title="Sign Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-8">
          <Suspense fallback={<LoadingSpinner />}>
            {renderView()}
          </Suspense>
        </div>
        <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 px-4 sm:px-8">
          <p className="text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            Powered by <span className="font-semibold text-gray-900 dark:text-white">4wardmotion Solutions, Inc.</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
