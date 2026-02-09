import { useEffect, useState } from 'react';
import { Award, Plus, Search, Edit2, Archive, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables, Enums } from '../../lib/dbTypes';

type ContractPlan = Tables<'contract_plans'>;
type ContractPriorityLevel = Enums<'priority_level'>;

export function ContractPlansView() {
  const [plans, setPlans] = useState<ContractPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ContractPlan | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInactive]);

  const loadPlans = async () => {
    try {
      let query = supabase.from('contract_plans').select('*').order('name');

      if (!showInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePlanStatus = async (plan: ContractPlan) => {
    try {
      const { error } = await supabase
        .from('contract_plans')
        .update({ is_active: !plan.is_active })
        .eq('id', plan.id);

      if (error) throw error;

      alert(`Plan ${plan.is_active ? 'deactivated' : 'activated'} successfully!`);
      loadPlans();
    } catch (error: unknown) {
      console.error('Error toggling plan status:', error);
      alert(`Failed to update plan: ${(error as Error).message}`);
    }
  };

  const filteredPlans = plans.filter((plan) => {
    const matchesSearch =
      plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (plan.description || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Contract Plans</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage service contract plan templates (Silver, Gold, Platinum, and custom plans)
          </p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary">
          <Plus className="w-5 h-5 mr-2" />
          New Plan
        </button>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Show inactive plans
                </span>
              </label>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Plan Name</th>
                <th>Description</th>
                <th>Base Fee</th>
                <th>Labor Discount</th>
                <th>Parts Discount</th>
                <th>Included Visits</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12">
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      {searchTerm ? 'No plans found matching your search' : 'No contract plans yet'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className={!plan.is_active ? 'opacity-50' : ''}>
                    <td>
                      <div className="flex items-center">
                        <Award className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          {plan.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                        {plan.description || '-'}
                      </div>
                    </td>
                    <td>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(plan.default_base_fee)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-blue">
                        {plan.labor_discount_percent}%
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-green">
                        {plan.parts_discount_percent}%
                      </span>
                    </td>
                    <td>
                      <span className="text-gray-900 dark:text-white">
                        {plan.included_visits_per_year} / year
                      </span>
                    </td>
                    <td>
                      {plan.is_active ? (
                        <span className="badge badge-green">Active</span>
                      ) : (
                        <span className="badge badge-gray">Inactive</span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingPlan(plan)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          title="Edit plan"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => togglePlanStatus(plan)}
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium"
                          title={plan.is_active ? 'Deactivate' : 'Activate'}
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingPlan && (
        <EditPlanModal
          plan={editingPlan}
          onClose={() => {
            setEditingPlan(null);
            loadPlans();
          }}
        />
      )}

      {showNewModal && (
        <NewPlanModal
          onClose={() => {
            setShowNewModal(false);
            loadPlans();
          }}
        />
      )}
    </div>
  );
}

function EditPlanModal({ plan, onClose }: { plan: ContractPlan; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: plan.name,
    description: plan.description || '',
    labor_discount_percent: plan.labor_discount_percent?.toString() || '0',
    parts_discount_percent: plan.parts_discount_percent?.toString() || '0',
    trip_charge_discount_percent: plan.trip_charge_discount_percent?.toString() || '0',
    waive_trip_charge: plan.waive_trip_charge,
    included_visits_per_year: plan.included_visits_per_year?.toString() || '0',
    default_base_fee: plan.default_base_fee?.toString() || '0',
    includes_emergency_service: plan.includes_emergency_service,
    includes_after_hours_rate_reduction: plan.includes_after_hours_rate_reduction,
    priority_level: plan.priority_level,
    response_time_sla_hours: plan.response_time_sla_hours?.toString() || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const { error } = await supabase
        .from('contract_plans')
        .update({
          name: formData.name,
          description: formData.description,
          labor_discount_percent: parseFloat(formData.labor_discount_percent),
          parts_discount_percent: parseFloat(formData.parts_discount_percent),
          trip_charge_discount_percent: parseFloat(formData.trip_charge_discount_percent),
          waive_trip_charge: formData.waive_trip_charge,
          included_visits_per_year: parseInt(formData.included_visits_per_year),
          default_base_fee: parseFloat(formData.default_base_fee),
          includes_emergency_service: formData.includes_emergency_service,
          includes_after_hours_rate_reduction: formData.includes_after_hours_rate_reduction,
          priority_level: formData.priority_level as unknown as ContractPriorityLevel,
          response_time_sla_hours: formData.response_time_sla_hours ? parseFloat(formData.response_time_sla_hours) : null,
        })
        .eq('id', plan.id);

      if (error) throw error;

      alert('Plan updated successfully!');
      onClose();
    } catch (error: unknown) {
      console.error('Error updating plan:', error);
      alert(`Failed to update plan: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Edit Plan: {plan.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plan Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Base Fee
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.default_base_fee}
                onChange={(e) => setFormData({ ...formData, default_base_fee: e.target.value })}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Labor Discount %
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.labor_discount_percent}
                onChange={(e) => setFormData({ ...formData, labor_discount_percent: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parts Discount %
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.parts_discount_percent}
                onChange={(e) => setFormData({ ...formData, parts_discount_percent: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trip Charge Discount %
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.trip_charge_discount_percent}
                onChange={(e) => setFormData({ ...formData, trip_charge_discount_percent: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Included Visits / Year
              </label>
              <input
                type="number"
                value={formData.included_visits_per_year}
                onChange={(e) => setFormData({ ...formData, included_visits_per_year: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority Level
              </label>
              <select
                value={formData.priority_level || ''}
                onChange={(e) => setFormData({ ...formData, priority_level: e.target.value as unknown as ContractPriorityLevel })}
                className="input"
              >
                <option value="normal">Normal</option>
                <option value="priority">Priority</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Response SLA (hours)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.response_time_sla_hours}
                onChange={(e) => setFormData({ ...formData, response_time_sla_hours: e.target.value })}
                className="input"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.waive_trip_charge ?? false}
                  onChange={(e) => setFormData({ ...formData, waive_trip_charge: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Waive trip charge
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includes_emergency_service ?? false}
                  onChange={(e) => setFormData({ ...formData, includes_emergency_service: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Includes emergency service
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includes_after_hours_rate_reduction ?? false}
                  onChange={(e) => setFormData({ ...formData, includes_after_hours_rate_reduction: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  After-hours rate reduction
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-outline" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NewPlanModal({ onClose }: { onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    labor_discount_percent: '0',
    parts_discount_percent: '0',
    trip_charge_discount_percent: '0',
    waive_trip_charge: false,
    included_visits_per_year: '0',
    default_base_fee: '0',
    includes_emergency_service: false,
    includes_after_hours_rate_reduction: false,
    priority_level: 'normal' as ContractPriorityLevel,
    response_time_sla_hours: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);

      const { error } = await supabase.from('contract_plans').insert([
        {
          name: formData.name,
          description: formData.description,
          labor_discount_percent: parseFloat(formData.labor_discount_percent),
          parts_discount_percent: parseFloat(formData.parts_discount_percent),
          trip_charge_discount_percent: parseFloat(formData.trip_charge_discount_percent),
          waive_trip_charge: formData.waive_trip_charge,
          included_visits_per_year: parseInt(formData.included_visits_per_year),
          default_base_fee: parseFloat(formData.default_base_fee),
          includes_emergency_service: formData.includes_emergency_service,
          includes_after_hours_rate_reduction: formData.includes_after_hours_rate_reduction,
          priority_level: formData.priority_level,
          response_time_sla_hours: formData.response_time_sla_hours ? parseFloat(formData.response_time_sla_hours) : null,
        },
      ]);

      if (error) throw error;

      alert('Plan created successfully!');
      onClose();
    } catch (error: unknown) {
      console.error('Error creating plan:', error);
      alert(`Failed to create plan: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Contract Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Plan Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Base Fee
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.default_base_fee}
                onChange={(e) => setFormData({ ...formData, default_base_fee: e.target.value })}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Labor Discount %
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.labor_discount_percent}
                onChange={(e) => setFormData({ ...formData, labor_discount_percent: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Parts Discount %
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.parts_discount_percent}
                onChange={(e) => setFormData({ ...formData, parts_discount_percent: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Trip Charge Discount %
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.trip_charge_discount_percent}
                onChange={(e) => setFormData({ ...formData, trip_charge_discount_percent: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Included Visits / Year
              </label>
              <input
                type="number"
                value={formData.included_visits_per_year}
                onChange={(e) => setFormData({ ...formData, included_visits_per_year: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority Level
              </label>
              <select
                value={formData.priority_level || ''}
                onChange={(e) => setFormData({ ...formData, priority_level: e.target.value as unknown as ContractPriorityLevel })}
                className="input"
              >
                <option value="normal">Normal</option>
                <option value="priority">Priority</option>
                <option value="vip">VIP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Response SLA (hours)
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.response_time_sla_hours}
                onChange={(e) => setFormData({ ...formData, response_time_sla_hours: e.target.value })}
                className="input"
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.waive_trip_charge ?? false}
                  onChange={(e) => setFormData({ ...formData, waive_trip_charge: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Waive trip charge
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includes_emergency_service ?? false}
                  onChange={(e) => setFormData({ ...formData, includes_emergency_service: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Includes emergency service
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includes_after_hours_rate_reduction ?? false}
                  onChange={(e) => setFormData({ ...formData, includes_after_hours_rate_reduction: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  After-hours rate reduction
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-outline" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creating...' : 'Create Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
