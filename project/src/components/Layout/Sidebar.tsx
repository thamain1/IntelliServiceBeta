import {
  LayoutDashboard,
  Ticket,
  Calendar,
  MapPin,
  Map,
  Package,
  Wrench,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Moon,
  Sun,
  FolderKanban,
  FileText,
  Clock,
  DollarSign,
  Calculator,
  ClipboardList,
  Building2,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useState, useEffect } from 'react';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const menuItems = [
    { id: 'dashboard',  label: 'Dashboard',    icon: LayoutDashboard, roles: ['admin', 'office_manager', 'dispatcher', 'accounting', 'lead_tech', 'technician'] },
    { id: 'tickets',   label: 'Tickets',       icon: Ticket,          roles: ['admin', 'office_manager', 'dispatcher', 'lead_tech', 'technician'] },
    { id: 'estimates', label: 'Estimates',     icon: ClipboardList,   roles: ['admin', 'office_manager', 'dispatcher', 'lead_tech', 'technician'] },
    { id: 'dispatch',  label: 'Dispatch',      icon: Calendar,        roles: ['admin', 'office_manager', 'dispatcher', 'lead_tech'] },
    { id: 'tracking',  label: 'Tech Tracking', icon: MapPin,          roles: ['admin', 'office_manager', 'dispatcher', 'lead_tech'] },
    { id: 'mapping',   label: 'Call Map',      icon: Map,             roles: ['admin', 'office_manager', 'dispatcher'] },
    { id: 'parts',     label: 'Parts',         icon: Package,         roles: ['admin', 'office_manager', 'dispatcher', 'lead_tech', 'technician'] },
    { id: 'equipment', label: 'Equipment',     icon: Wrench,          roles: ['admin', 'office_manager', 'dispatcher', 'lead_tech', 'technician'] },
    { id: 'vendors',   label: 'Vendors',       icon: Building2,       roles: ['admin', 'office_manager', 'dispatcher'] },
    { id: 'projects',  label: 'Projects',      icon: FolderKanban,    roles: ['admin', 'office_manager', 'dispatcher'] },
    { id: 'customers', label: 'Customers',     icon: Users,           roles: ['admin', 'office_manager', 'dispatcher', 'accounting', 'lead_tech'] },
    { id: 'invoicing', label: 'Invoicing',     icon: FileText,        roles: ['admin', 'office_manager', 'dispatcher', 'accounting'] },
    { id: 'timeclock', label: 'Time Clock',    icon: Clock,           roles: ['admin', 'office_manager', 'dispatcher', 'lead_tech', 'technician'] },
    { id: 'accounting',label: 'Accounting',    icon: Calculator,      roles: ['admin', 'office_manager', 'accounting'] },
    { id: 'payroll',   label: 'Payroll',       icon: DollarSign,      roles: ['admin'] },
    { id: 'reports',   label: 'Reports',       icon: BarChart3,       roles: ['admin', 'office_manager', 'dispatcher', 'accounting', 'lead_tech'] },
    { id: 'settings',  label: 'Settings',      icon: Settings,        roles: ['admin'] },
  ];

  const visibleItems = menuItems.filter((item) =>
    item.roles.includes(profile?.role || '')
  );

  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-red-600 rounded-lg flex items-center justify-center">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-gray-900 dark:text-white">Dunaway</h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">H&C Services</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {profile?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {profile?.full_name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 capitalize">
                {profile?.role}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span className="text-sm">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        <button
          onClick={signOut}
          className="w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
