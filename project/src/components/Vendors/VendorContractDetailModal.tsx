import { useState, useEffect } from 'react';
import { X, FileText, Edit2, Save, Package, TrendingUp, FileCheck, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { VendorContractService } from '../../services/VendorContractService';
import type { Database } from '../../lib/database.types';

type VendorContract = Database['public']['Tables']['vendor_contracts']['Row'] & {
  vendors?: { name: string; vendor_code: string };
};

interface ContractItem {
  id: string;
  part_id: string;
  parts?: { part_number: string; name: string };
}

interface ContractSLA {
  id: string;
  metric: string;
  metric_description: string | null;
  target_value: number;
  target_unit: string;
  breach_threshold: number | null;
  notes: string | null;
}

interface ContractDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_url: string;
}

interface VendorContractDetailModalProps {
  contract: VendorContract;
  onClose: () => void;
}

export function VendorContractDetailModal({ contract: initialContract, onClose }: VendorContractDetailModalProps) {
  const [contract, setContract] = useState(initialContract);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'items' | 'slas' | 'documents'>('details');
  const [formData, setFormData] = useState({
    status: contract.status,
    contract_type: contract.contract_type,
    start_date: contract.start_date,
    end_date: contract.end_date || '',
    auto_renew: contract.auto_renew || false,
    renewal_term_months: contract.renewal_term_months?.toString() || '',
    payment_terms: contract.payment_terms || '',
    freight_terms: contract.freight_terms || '',
    minimum_order_value: contract.minimum_order_value?.toString() || '',
    free_freight_threshold: contract.free_freight_threshold?.toString() || '',
    standard_lead_time_days: contract.standard_lead_time_days?.toString() || '',
    rush_lead_time_days: contract.rush_lead_time_days?.toString() || '',
    return_policy: contract.return_policy || '',
    warranty_terms: contract.warranty_terms || '',
    is_preferred_vendor: contract.is_preferred_vendor || false,
    contract_value: contract.contract_value?.toString() || '',
    notes: contract.notes || '',
  });

  const [items, setItems] = useState<ContractItem[]>([]);
  const [slas, setSlas] = useState<ContractSLA[]>([]);
  const [documents, setDocuments] = useState<ContractDocument[]>([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  const [editingSLA, setEditingSLA] = useState<ContractSLA | null>(null);
  const [showNewSLAForm, setShowNewSLAForm] = useState(false);
  const [slaFormData, setSlaFormData] = useState({
    metric: 'on_time_delivery',
    metric_description: '',
    target_value: '',
    target_unit: '%',
    breach_threshold: '',
    notes: '',
  });

  useEffect(() => {
    if (activeTab === 'items') {
      loadContractItems();
    } else if (activeTab === 'slas') {
      loadContractSLAs();
    } else if (activeTab === 'documents') {
      loadContractDocuments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, contract.id]);

  const loadContractItems = async () => {
    setLoadingRelated(true);
    try {
      const { data, error } = await supabase
        .from('vendor_contract_items')
        .select(`
          *,
          parts(part_number, name)
        `)
        .eq('vendor_contract_id', contract.id)
        .order('created_at');

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading contract items:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const loadContractSLAs = async () => {
    setLoadingRelated(true);
    try {
      const data = await VendorContractService.getSLAsForContract(contract.id);
      setSlas(data);
    } catch (error) {
      console.error('Error loading contract SLAs:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleSaveSLA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await VendorContractService.upsertSLA({
        vendor_contract_id: contract.id,
        metric: slaFormData.metric,
        metric_description: slaFormData.metric_description || null,
        target_value: parseFloat(slaFormData.target_value),
        target_unit: slaFormData.target_unit,
        breach_threshold: slaFormData.breach_threshold ? parseFloat(slaFormData.breach_threshold) : null,
        notes: slaFormData.notes || null,
      });

      setShowNewSLAForm(false);
      setEditingSLA(null);
      setSlaFormData({
        metric: 'on_time_delivery',
        metric_description: '',
        target_value: '',
        target_unit: '%',
        breach_threshold: '',
        notes: '',
      });
      loadContractSLAs();
    } catch (error) {
      console.error('Error saving SLA:', error);
      alert('Failed to save SLA');
    }
  };

  const handleDeleteSLA = async (slaId: string) => {
    if (!confirm('Are you sure you want to delete this SLA?')) return;

    try {
      await VendorContractService.deleteSLA(slaId);
      loadContractSLAs();
    } catch (error) {
      console.error('Error deleting SLA:', error);
      alert('Failed to delete SLA');
    }
  };

  const handleEditSLA = (sla: ContractSLA) => {
    setEditingSLA(sla);
    setSlaFormData({
      metric: sla.metric,
      metric_description: sla.metric_description || '',
      target_value: sla.target_value.toString(),
      target_unit: sla.target_unit,
      breach_threshold: sla.breach_threshold?.toString() || '',
      notes: sla.notes || '',
    });
    setShowNewSLAForm(true);
  };

  const loadContractDocuments = async () => {
    setLoadingRelated(true);
    try {
      const { data, error } = await supabase
        .from('vendor_contract_documents')
        .select('*')
        .eq('vendor_contract_id', contract.id)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error loading contract documents:', error);
    } finally {
      setLoadingRelated(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = {
        status: formData.status,
        contract_type: formData.contract_type,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        auto_renew: formData.auto_renew,
        renewal_term_months: formData.renewal_term_months ? parseInt(formData.renewal_term_months) : null,
        payment_terms: formData.payment_terms || null,
        freight_terms: formData.freight_terms || null,
        minimum_order_value: formData.minimum_order_value ? parseFloat(formData.minimum_order_value) : null,
        free_freight_threshold: formData.free_freight_threshold ? parseFloat(formData.free_freight_threshold) : null,
        standard_lead_time_days: formData.standard_lead_time_days ? parseInt(formData.standard_lead_time_days) : null,
        rush_lead_time_days: formData.rush_lead_time_days ? parseInt(formData.rush_lead_time_days) : null,
        return_policy: formData.return_policy || null,
        warranty_terms: formData.warranty_terms || null,
        is_preferred_vendor: formData.is_preferred_vendor,
        contract_value: formData.contract_value ? parseFloat(formData.contract_value) : null,
        notes: formData.notes || null,
      };

      const { error } = await supabase
        .from('vendor_contracts')
        .update(updates)
        .eq('id', contract.id);

      if (error) throw error;

      const { data: updated, error: fetchError } = await supabase
        .from('vendor_contracts')
        .select(`
          *,
          vendors(name, vendor_code)
        `)
        .eq('id', contract.id)
        .single();

      if (fetchError) throw fetchError;

      setContract(updated);
      setEditing(false);
    } catch (error) {
      console.error('Error updating contract:', error);
      alert('Failed to update contract. Please try again.');
    } finally {
      setSaving(false);
    }
  };

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
      month: 'long',
      day: 'numeric',
    });
  };

  const renderDetailsTab = () => {
    if (editing) {
      return (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status *
              </label>
              <select
                value={formData.status ?? ''}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="input w-full"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contract Type *
              </label>
              <select
                value={formData.contract_type ?? ''}
                onChange={(e) => setFormData({ ...formData, contract_type: e.target.value })}
                className="input w-full"
              >
                <option value="pricing">Pricing Agreement</option>
                <option value="service">Service Agreement</option>
                <option value="warranty">Warranty Agreement</option>
                <option value="rebate">Rebate Program</option>
                <option value="distribution">Distribution Agreement</option>
                <option value="msa">Master Service Agreement</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contract Value
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.contract_value}
                onChange={(e) => setFormData({ ...formData, contract_value: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mt-7">
                <input
                  type="checkbox"
                  checked={formData.auto_renew}
                  onChange={(e) => setFormData({ ...formData, auto_renew: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Auto-Renew</span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Payment Terms
              </label>
              <input
                type="text"
                value={formData.payment_terms}
                onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Freight Terms
              </label>
              <input
                type="text"
                value={formData.freight_terms}
                onChange={(e) => setFormData({ ...formData, freight_terms: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Standard Lead Time (days)
              </label>
              <input
                type="number"
                value={formData.standard_lead_time_days}
                onChange={(e) => setFormData({ ...formData, standard_lead_time_days: e.target.value })}
                className="input w-full"
              />
            </div>

            <div>
              <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 dark:text-gray-300 mt-7">
                <input
                  type="checkbox"
                  checked={formData.is_preferred_vendor}
                  onChange={(e) => setFormData({ ...formData, is_preferred_vendor: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span>Preferred Vendor</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                className="input w-full"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vendor</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {contract.vendors?.name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {contract.vendors?.vendor_code}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contract Number</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {contract.contract_number}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {(contract.contract_type ?? 'standard').toUpperCase()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {(contract.status ?? 'active').toUpperCase()}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Start Date</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {formatDate(contract.start_date)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">End Date</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {formatDate(contract.end_date)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contract Value</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {formatCurrency(contract.contract_value)}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Auto-Renew</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {contract.auto_renew ? 'Yes' : 'No'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment Terms</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {contract.payment_terms || 'Not specified'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Lead Time</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {contract.standard_lead_time_days ? `${contract.standard_lead_time_days} days` : 'Not specified'}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Preferred Vendor</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {contract.is_preferred_vendor ? 'Yes' : 'No'}
            </p>
          </div>

          {contract.notes && (
            <div className="md:col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Notes</p>
              <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                {contract.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderItemsTab = () => {
    if (loadingRelated) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No contract items defined yet.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Part Number</th>
              <th>Description</th>
              <th>Price Type</th>
              <th>Price</th>
              <th>Discount %</th>
              <th>Qty Break Start</th>
              <th>Lead Time</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.parts?.part_number || item.part_category || 'Category-wide'}</td>
                <td>{item.parts?.name || item.item_description_override || '-'}</td>
                <td className="capitalize">{item.price_type.replace('_', ' ')}</td>
                <td>{item.contract_price ? formatCurrency(item.contract_price) : '-'}</td>
                <td>{item.discount_percent ? `${item.discount_percent}%` : '-'}</td>
                <td>{item.start_quantity_break}</td>
                <td>{item.lead_time_days_override ? `${item.lead_time_days_override} days` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSLAsTab = () => {
    if (loadingRelated) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Service Level Agreements</h3>
          <button
            onClick={() => {
              setShowNewSLAForm(true);
              setEditingSLA(null);
              setSlaFormData({
                metric: 'on_time_delivery',
                metric_description: '',
                target_value: '',
                target_unit: '%',
                breach_threshold: '',
                notes: '',
              });
            }}
            className="btn btn-primary btn-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add SLA
          </button>
        </div>

        {showNewSLAForm && (
          <div className="card p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4">
              {editingSLA ? 'Edit SLA Target' : 'Add New SLA Target'}
            </h4>
            <form onSubmit={handleSaveSLA} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Metric *
                  </label>
                  <select
                    required
                    value={slaFormData.metric}
                    onChange={(e) => setSlaFormData({ ...slaFormData, metric: e.target.value })}
                    className="input"
                  >
                    <option value="on_time_delivery">On-Time Delivery</option>
                    <option value="fill_rate">Fill Rate</option>
                    <option value="quality_defect_rate">Quality Defect Rate</option>
                    <option value="invoice_accuracy">Invoice Accuracy</option>
                    <option value="response_time">Response Time</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={slaFormData.metric_description}
                    onChange={(e) => setSlaFormData({ ...slaFormData, metric_description: e.target.value })}
                    className="input"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Value *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={slaFormData.target_value}
                      onChange={(e) => setSlaFormData({ ...slaFormData, target_value: e.target.value })}
                      className="input flex-1"
                      placeholder="95"
                    />
                    <input
                      type="text"
                      required
                      value={slaFormData.target_unit}
                      onChange={(e) => setSlaFormData({ ...slaFormData, target_unit: e.target.value })}
                      className="input w-20"
                      placeholder="%"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Breach Threshold
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={slaFormData.breach_threshold}
                    onChange={(e) => setSlaFormData({ ...slaFormData, breach_threshold: e.target.value })}
                    className="input"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={slaFormData.notes}
                  onChange={(e) => setSlaFormData({ ...slaFormData, notes: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Additional notes about this SLA..."
                />
              </div>

              <div className="flex space-x-2">
                <button type="submit" className="btn btn-primary btn-sm">
                  <Save className="w-4 h-4 mr-1" />
                  Save SLA
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewSLAForm(false);
                    setEditingSLA(null);
                  }}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {slas.length === 0 && !showNewSLAForm ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">No SLA targets defined yet.</p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Click "Add SLA" to configure performance targets for this contract.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {slas.map((sla) => (
              <div key={sla.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white capitalize">
                        {sla.metric.replace(/_/g, ' ')}
                      </h4>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {sla.target_value}{sla.target_unit}
                      </span>
                    </div>
                    {sla.metric_description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {sla.metric_description}
                      </p>
                    )}
                    {sla.breach_threshold && (
                      <p className="text-sm text-orange-600 dark:text-orange-400">
                        Breach threshold: {sla.breach_threshold}{sla.target_unit}
                      </p>
                    )}
                    {sla.notes && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {sla.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleEditSLA(sla)}
                      className="btn btn-outline btn-sm"
                      title="Edit SLA"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSLA(sla.id)}
                      className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 dark:text-red-400"
                      title="Delete SLA"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 mt-4">
          <div className="flex items-start space-x-3">
            <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                About Performance Tracking
              </h5>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Actual performance against these SLA targets will be calculated automatically from purchase orders, receiving records, and quality inspections. Visit the Performance tab to see real-time metrics once data is available.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDocumentsTab = () => {
    if (loadingRelated) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <div className="text-center py-12">
          <FileCheck className="w-12 h-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No documents attached yet.</p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {documents.map((doc) => (
          <div key={doc.id} className="card p-4 flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-500 mr-3" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{doc.file_name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                  {doc.document_type.replace(/_/g, ' ')}
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-600 dark:text-gray-400">
              {new Date(doc.uploaded_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Contract Details
          </h2>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setEditing(false);
                    setFormData({
                      status: contract.status,
                      contract_type: contract.contract_type,
                      start_date: contract.start_date,
                      end_date: contract.end_date || '',
                      auto_renew: contract.auto_renew || false,
                      renewal_term_months: contract.renewal_term_months?.toString() || '',
                      payment_terms: contract.payment_terms || '',
                      freight_terms: contract.freight_terms || '',
                      minimum_order_value: contract.minimum_order_value?.toString() || '',
                      free_freight_threshold: contract.free_freight_threshold?.toString() || '',
                      standard_lead_time_days: contract.standard_lead_time_days?.toString() || '',
                      rush_lead_time_days: contract.rush_lead_time_days?.toString() || '',
                      return_policy: contract.return_policy || '',
                      warranty_terms: contract.warranty_terms || '',
                      is_preferred_vendor: contract.is_preferred_vendor || false,
                      contract_value: contract.contract_value?.toString() || '',
                      notes: contract.notes || '',
                    });
                  }}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={saving}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="btn btn-secondary"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex space-x-4 px-6">
            <button
              onClick={() => setActiveTab('details')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'details'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('items')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'items'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Pricing Items
            </button>
            <button
              onClick={() => setActiveTab('slas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'slas'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              SLAs
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              Documents
            </button>
          </nav>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && renderDetailsTab()}
          {activeTab === 'items' && renderItemsTab()}
          {activeTab === 'slas' && renderSLAsTab()}
          {activeTab === 'documents' && renderDocumentsTab()}
        </div>
      </div>
    </div>
  );
}
