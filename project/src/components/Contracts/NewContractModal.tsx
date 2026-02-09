import { useState, useEffect, useCallback } from 'react';
import { X, FileText, Calendar, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables, Enums } from '../../lib/dbTypes';

type ContractPlan = Tables<'contract_plans'>;
type Customer = Tables<'customers'>;
type CustomerLocation = Tables<'customer_locations'>;
type ContractStatus = Enums<'service_contract_status'>;

interface NewContractModalProps {
  onClose: () => void;
  preselectedCustomerId?: string;
}

export function NewContractModal({ onClose, preselectedCustomerId }: NewContractModalProps) {
  const [plans, setPlans] = useState<ContractPlan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [locations, setLocations] = useState<CustomerLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: preselectedCustomerId || '',
    customer_location_id: '',
    contract_plan_id: '',
    name: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    auto_renew: true,
    base_fee: '0',
    status: 'draft' as const,
  });

  const loadCustomerLocations = useCallback(async (customerId: string) => {
    try {
      const { data, error } = await supabase
        .from('customer_locations')
        .select('*')
        .eq('customer_id', customerId)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [plansResult, customersResult] = await Promise.all([
        supabase.from('contract_plans').select('*').eq('is_active', true).order('name'),
        supabase.from('customers').select('*').order('name'),
      ]);

      if (plansResult.error) throw plansResult.error;
      if (customersResult.error) throw customersResult.error;

      setPlans(plansResult.data || []);
      setCustomers(customersResult.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (formData.customer_id) {
      loadCustomerLocations(formData.customer_id);
    } else {
      setLocations([]);
    }
  }, [formData.customer_id, loadCustomerLocations]);

  useEffect(() => {
    const selectedPlan = plans.find((p) => p.id === formData.contract_plan_id);
    if (selectedPlan && formData.customer_id) {
      const customer = customers.find((c) => c.id === formData.customer_id);
      if (customer) {
        setFormData((prev) => ({
          ...prev,
          name: `${customer.name} - ${selectedPlan.name} ${new Date().getFullYear()}`,
          base_fee: selectedPlan.default_base_fee?.toString() || '0',
        }));
      }
    }
  }, [formData.contract_plan_id, formData.customer_id, plans, customers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_id || !formData.contract_plan_id || !formData.name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);

      const selectedPlan = plans.find((p) => p.id === formData.contract_plan_id);
      if (!selectedPlan) {
        alert('Selected plan not found');
        return;
      }

      const contractData = {
        customer_id: formData.customer_id,
        customer_location_id: formData.customer_location_id || null,
        contract_plan_id: formData.contract_plan_id,
        name: formData.name,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        auto_renew: formData.auto_renew,
        base_fee: parseFloat(formData.base_fee),
        billing_frequency: selectedPlan.billing_frequency,
        labor_rate_type: selectedPlan.labor_rate_type,
        labor_discount_percent: selectedPlan.labor_discount_percent,
        labor_fixed_rate: selectedPlan.labor_fixed_rate,
        parts_discount_percent: selectedPlan.parts_discount_percent,
        trip_charge_discount_percent: selectedPlan.trip_charge_discount_percent,
        waive_trip_charge: selectedPlan.waive_trip_charge,
        includes_emergency_service: selectedPlan.includes_emergency_service,
        includes_after_hours_rate_reduction: selectedPlan.includes_after_hours_rate_reduction,
        included_visits_per_year: selectedPlan.included_visits_per_year,
        priority_level: selectedPlan.priority_level,
        response_time_sla_hours: selectedPlan.response_time_sla_hours,
      };

      const { error } = await supabase.from('service_contracts').insert([contractData]);

      if (error) throw error;

      alert('Contract created successfully!');
      onClose();
    } catch (error: unknown) {
      console.error('Error creating contract:', error);
      alert(`Failed to create contract: ${(error as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full my-8">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <FileText className="w-6 h-6 text-blue-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Service Contract</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer *
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="input"
                required
                disabled={!!preselectedCustomerId}
              >
                <option value="">Select customer...</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location (Optional)
              </label>
              <select
                value={formData.customer_location_id}
                onChange={(e) => setFormData({ ...formData, customer_location_id: e.target.value })}
                className="input"
                disabled={!formData.customer_id}
              >
                <option value="">All locations</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.location_name || location.name || 'Unnamed Location'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to apply contract to all customer locations
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contract Plan *
              </label>
              <select
                value={formData.contract_plan_id}
                onChange={(e) => setFormData({ ...formData, contract_plan_id: e.target.value })}
                className="input"
                required
              >
                <option value="">Select plan...</option>
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name} - {plan.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contract Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                placeholder="e.g., Smith Residence - Gold Plan 2025"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Base Fee
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.base_fee}
                onChange={(e) => setFormData({ ...formData, base_fee: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ContractStatus })}
                className="input"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.auto_renew}
                  onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Auto-renew contract
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button type="button" onClick={onClose} className="btn-outline" disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Contract'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
