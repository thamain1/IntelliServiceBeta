import { useEffect, useState } from 'react';
import { Shield, Users, Check, X, Save, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

interface RolePermission {
  role: string;
  permissions: string[];
}

const PERMISSIONS: Permission[] = [
  // Tickets
  { id: 'tickets.view', name: 'View Tickets', description: 'View all tickets', category: 'Tickets' },
  { id: 'tickets.create', name: 'Create Tickets', description: 'Create new tickets', category: 'Tickets' },
  { id: 'tickets.edit', name: 'Edit Tickets', description: 'Edit existing tickets', category: 'Tickets' },
  { id: 'tickets.delete', name: 'Delete Tickets', description: 'Delete tickets', category: 'Tickets' },
  { id: 'tickets.assign', name: 'Assign Tickets', description: 'Assign tickets to technicians', category: 'Tickets' },

  // Customers
  { id: 'customers.view', name: 'View Customers', description: 'View customer information', category: 'Customers' },
  { id: 'customers.create', name: 'Create Customers', description: 'Add new customers', category: 'Customers' },
  { id: 'customers.edit', name: 'Edit Customers', description: 'Edit customer information', category: 'Customers' },
  { id: 'customers.delete', name: 'Delete Customers', description: 'Delete customers', category: 'Customers' },

  // Invoicing
  { id: 'invoices.view', name: 'View Invoices', description: 'View all invoices', category: 'Invoicing' },
  { id: 'invoices.create', name: 'Create Invoices', description: 'Create new invoices', category: 'Invoicing' },
  { id: 'invoices.edit', name: 'Edit Invoices', description: 'Edit invoices', category: 'Invoicing' },
  { id: 'invoices.send', name: 'Send Invoices', description: 'Send invoices to customers', category: 'Invoicing' },
  { id: 'invoices.void', name: 'Void Invoices', description: 'Void/cancel invoices', category: 'Invoicing' },

  // Accounting
  { id: 'accounting.view', name: 'View Accounting', description: 'View accounting records', category: 'Accounting' },
  { id: 'accounting.journal', name: 'Create Journal Entries', description: 'Create journal entries', category: 'Accounting' },
  { id: 'accounting.reconcile', name: 'Bank Reconciliation', description: 'Perform reconciliations', category: 'Accounting' },
  { id: 'accounting.reports', name: 'Financial Reports', description: 'View financial reports', category: 'Accounting' },

  // Inventory
  { id: 'inventory.view', name: 'View Inventory', description: 'View parts inventory', category: 'Inventory' },
  { id: 'inventory.adjust', name: 'Adjust Inventory', description: 'Adjust stock levels', category: 'Inventory' },
  { id: 'inventory.order', name: 'Create Orders', description: 'Create purchase orders', category: 'Inventory' },

  // Dispatch
  { id: 'dispatch.view', name: 'View Dispatch', description: 'View dispatch board', category: 'Dispatch' },
  { id: 'dispatch.schedule', name: 'Schedule Jobs', description: 'Schedule and assign jobs', category: 'Dispatch' },

  // Reports
  { id: 'reports.view', name: 'View Reports', description: 'View all reports', category: 'Reports' },
  { id: 'reports.export', name: 'Export Reports', description: 'Export reports to PDF/Excel', category: 'Reports' },

  // Settings
  { id: 'settings.users', name: 'Manage Users', description: 'Add/edit/deactivate users', category: 'Settings' },
  { id: 'settings.company', name: 'Company Settings', description: 'Edit company settings', category: 'Settings' },
  { id: 'settings.permissions', name: 'Manage Permissions', description: 'Edit role permissions', category: 'Settings' },
];

const DEFAULT_ROLE_PERMISSIONS: RolePermission[] = [
  {
    role: 'admin',
    permissions: PERMISSIONS.map(p => p.id), // Admin has all permissions
  },
  {
    role: 'office_manager',
    permissions: [
      'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.assign',
      'customers.view', 'customers.create', 'customers.edit',
      'invoices.view', 'invoices.create', 'invoices.edit', 'invoices.send',
      'accounting.view', 'accounting.reports',
      'inventory.view', 'inventory.adjust', 'inventory.order',
      'dispatch.view', 'dispatch.schedule',
      'reports.view', 'reports.export',
    ],
  },
  {
    role: 'dispatcher',
    permissions: [
      'tickets.view', 'tickets.create', 'tickets.edit', 'tickets.assign',
      'customers.view',
      'dispatch.view', 'dispatch.schedule',
      'reports.view',
    ],
  },
  {
    role: 'technician',
    permissions: [
      'tickets.view', 'tickets.edit',
      'customers.view',
      'inventory.view',
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrator',
  office_manager: 'Office Manager',
  dispatcher: 'Dispatcher',
  technician: 'Technician',
  material_handler: 'Material Handler',
};

export function PermissionsSettings() {
  const { profile, loading: authLoading } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(DEFAULT_ROLE_PERMISSIONS);
  const [selectedRole, setSelectedRole] = useState<string>('technician');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('role_permissions')
        .select('role, permissions');

      if (error && error.code !== 'PGRST116') throw error;

      if (data && data.length > 0) {
        setRolePermissions(data as RolePermission[]);
      }
    } catch (error) {
      console.error('Error loading permissions:', error);
      // Use defaults if table doesn't exist
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Upsert each role's permissions
      for (const rp of rolePermissions) {
        const { data: existing } = await supabase
          .from('role_permissions')
          .select('id')
          .eq('role', rp.role)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('role_permissions')
            .update({ permissions: rp.permissions })
            .eq('role', rp.role);
        } else {
          await supabase
            .from('role_permissions')
            .insert({ role: rp.role, permissions: rp.permissions });
        }
      }

      setMessage({ type: 'success', text: 'Permissions saved successfully!' });
    } catch (error) {
      console.error('Error saving permissions:', error);
      setMessage({ type: 'error', text: 'Failed to save permissions. Changes stored locally.' });
      localStorage.setItem('role_permissions', JSON.stringify(rolePermissions));
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (role: string, permissionId: string) => {
    setRolePermissions((prev) =>
      prev.map((rp) => {
        if (rp.role !== role) return rp;

        const hasPermission = rp.permissions.includes(permissionId);
        return {
          ...rp,
          permissions: hasPermission
            ? rp.permissions.filter((p) => p !== permissionId)
            : [...rp.permissions, permissionId],
        };
      })
    );
  };

  const getRolePermissions = (role: string): string[] => {
    return rolePermissions.find((rp) => rp.role === role)?.permissions || [];
  };

  const hasPermission = (role: string, permissionId: string): boolean => {
    return getRolePermissions(role).includes(permissionId);
  };

  const categories = [...new Set(PERMISSIONS.map((p) => p.category))];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`p-4 rounded-lg flex items-center space-x-3 ${
            message.type === 'success'
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-900 dark:text-blue-100">About Role Permissions</h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Configure what each role can access in the system. Only administrators can modify permissions.
              Changes apply to all users with the selected role.
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
              Your role: <span className="font-semibold">{profile?.role || 'Loading...'}</span>
              {!isAdmin && !authLoading && (
                <span className="ml-2 text-amber-600 dark:text-amber-400">(Admin access required to edit)</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Role Selector */}
      <div className="card p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Select Role to Configure</h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(ROLE_LABELS).map(([role, label]) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedRole === role
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {ROLE_LABELS[selectedRole]} Permissions
            </h2>
          </div>
          {selectedRole === 'admin' && (
            <span className="text-sm text-amber-600 dark:text-amber-400 italic font-medium flex items-center">
              <AlertCircle className="w-4 h-4 mr-1" />
              Modifying Administrator permissions may affect system stability
            </span>
          )}
        </div>

        <div className="space-y-6">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PERMISSIONS.filter((p) => p.category === category).map((permission) => (
                  <div
                    key={permission.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      hasPermission(selectedRole, permission.id)
                        ? 'bg-green-50 dark:bg-green-900/20'
                        : 'bg-gray-50 dark:bg-gray-700/50'
                    }`}
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{permission.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{permission.description}</p>
                    </div>
                    <button
                      onClick={() => togglePermission(selectedRole, permission.id)}
                      disabled={authLoading || !isAdmin}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        hasPermission(selectedRole, permission.id)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'
                      } ${(authLoading || !isAdmin) ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                    >
                      {hasPermission(selectedRole, permission.id) ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Permission Overview Table */}
      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Permission Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Permission
                </th>
                {Object.entries(ROLE_LABELS).map(([role, label]) => (
                  <th
                    key={role}
                    className="text-center py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <>
                  <tr key={`cat-${category}`} className="bg-gray-100 dark:bg-gray-700">
                    <td colSpan={6} className="py-2 px-4 font-semibold text-gray-900 dark:text-white">
                      {category}
                    </td>
                  </tr>
                  {PERMISSIONS.filter((p) => p.category === category).map((permission) => (
                    <tr
                      key={permission.id}
                      className="border-b border-gray-100 dark:border-gray-800"
                    >
                      <td className="py-2 px-4 text-sm text-gray-900 dark:text-white">
                        {permission.name}
                      </td>
                      {Object.keys(ROLE_LABELS).map((role) => (
                        <td key={role} className="py-2 px-4 text-center">
                          {hasPermission(role, permission.id) ? (
                            <Check className="w-4 h-4 text-green-600 mx-auto" />
                          ) : (
                            <X className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary flex items-center space-x-2"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Permissions</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}