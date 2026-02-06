import { useState, useEffect } from 'react';
import { Users, Building, Bell, Shield, DollarSign } from 'lucide-react';
import { UserManagement } from './UserManagement';
import { CompanySettings } from './CompanySettings';
import { NotificationsSettings } from './NotificationsSettings';
import { PermissionsSettings } from './PermissionsSettings';
import { LaborRatesSettings } from './LaborRatesSettings';
import { AHSSettingsPanel } from './AHSSettingsPanel';

type SettingsTab = 'users' | 'company' | 'notifications' | 'permissions' | 'labor-rates' | 'ahs-warranty';

interface SettingsViewProps {
  initialTab?: string;
}

export function SettingsView({ initialTab }: SettingsViewProps) {
  // Map navigation IDs to internal tab IDs
  const getTabFromNavId = (navId?: string): SettingsTab => {
    switch (navId) {
      case 'settings-users': return 'users';
      case 'settings-labor-rates': return 'labor-rates';
      case 'settings-notifications': return 'notifications';
      case 'settings-permissions': return 'permissions';
      default: return 'users';
    }
  };

  const [activeTab, setActiveTab] = useState<SettingsTab>(getTabFromNavId(initialTab));

  // Update active tab when initialTab prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(getTabFromNavId(initialTab));
    }
  }, [initialTab]);

  const tabs = [
    { id: 'users' as SettingsTab, label: 'Users', icon: Users },
    { id: 'company' as SettingsTab, label: 'Company', icon: Building },
    { id: 'labor-rates' as SettingsTab, label: 'Labor Rates', icon: DollarSign },
    { id: 'ahs-warranty' as SettingsTab, label: 'AHS Warranty', icon: Shield },
    { id: 'notifications' as SettingsTab, label: 'Notifications', icon: Bell },
    { id: 'permissions' as SettingsTab, label: 'Permissions', icon: Shield },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'company':
        return <CompanySettings />;
      case 'labor-rates':
        return <LaborRatesSettings />;
      case 'ahs-warranty':
        return <AHSSettingsPanel />;
      case 'notifications':
        return <NotificationsSettings />;
      case 'permissions':
        return <PermissionsSettings />;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Manage system configuration and users
        </p>
      </div>

      <div className="card p-1">
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 min-w-[140px] py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {renderContent()}
    </div>
  );
}
