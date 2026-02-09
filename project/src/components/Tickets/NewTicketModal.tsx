import { useState, useEffect } from 'react';
import { X, AlertTriangle, Shield } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { AHSSettingsService } from '../../services/AHSSettingsService';
import type { Database } from '../../lib/database.types';

type CustomerRow = Database['public']['Tables']['customers']['Row'];
type Equipment = Database['public']['Tables']['equipment']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

// Extended Customer type with site contact fields
type Customer = CustomerRow & {
  site_contact_name?: string | null;
  site_contact_phone?: string | null;
};

// Ticket insert data structure
interface TicketInsertData {
  ticket_type: string;
  customer_id: string;
  priority: string;
  title: string;
  description: string;
  service_type: string;
  status: string;
  created_by?: string;
  project_id?: string;
  equipment_id?: string;
  assigned_to?: string;
  scheduled_date?: string;
  estimated_duration?: number;
  phase_milestone?: string;
  technician_notes?: string;
  site_contact_name?: string;
  site_contact_phone?: string;
  problem_code?: string;
  ahs_dispatch_number?: string;
  ahs_diagnosis_fee_amount?: number;
  ahs_labor_rate_per_hour?: number;
}

interface StandardCode {
  code: string;
  label: string;
  description: string | null;
  category: string | null;
  is_critical_safety: boolean;
}

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultType?: 'PRJ' | 'SVC' | 'WARRANTY_AHS';
  projectId?: string;
}

export function NewTicketModal({ isOpen, onClose, onSuccess, defaultType = 'SVC', projectId }: NewTicketModalProps) {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [problemCodes, setProblemCodes] = useState<StandardCode[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [filteredEquipment, setFilteredEquipment] = useState<Equipment[]>([]);
  const [showGasLeakWarning, setShowGasLeakWarning] = useState(false);

  const [formData, setFormData] = useState({
    ticket_type: defaultType,
    project_id: projectId || '',
    customer_id: '',
    equipment_id: '',
    assigned_to: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    title: '',
    description: '',
    service_type: '',
    scheduled_date: '',
    estimated_duration: '120',
    phase_milestone: '',
    technician_notes: '',
    site_contact_name: '',
    site_contact_phone: '',
    problem_code: '',
    // AHS fields
    ahs_dispatch_number: '',
  });
  const [ahsDefaults, setAhsDefaults] = useState<{ diagnosisFee: number; laborRate: number } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Load AHS defaults when WARRANTY_AHS type is selected
  useEffect(() => {
    if (formData.ticket_type === 'WARRANTY_AHS' && !ahsDefaults) {
      AHSSettingsService.getAHSDefaults().then((defaults) => {
        setAhsDefaults({ diagnosisFee: defaults.diagnosisFee, laborRate: defaults.laborRate });
      });
    }
  }, [formData.ticket_type, ahsDefaults]);

  useEffect(() => {
    if (selectedCustomer) {
      const customerEquipment = equipment.filter((eq) => eq.customer_id === selectedCustomer);
      setFilteredEquipment(customerEquipment);
    } else {
      setFilteredEquipment([]);
    }
  }, [selectedCustomer, equipment]);

  const loadData = async () => {
    try {
      const [customersRes, equipmentRes, techniciansRes, projectsRes, problemCodesRes] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('equipment').select('*'),
        supabase
          .from('profiles')
          .select('*')
          .eq('role', 'technician')
          .eq('is_active', true)
          .order('full_name'),
        supabase
          .from('projects')
          .select('*')
          .in('status', ['planning', 'in_progress'])
          .order('name'),
        supabase
          .from('standard_codes')
          .select('code, label, description, category, is_critical_safety')
          .eq('code_type', 'problem')
          .eq('is_active', true)
          .order('sort_order'),
      ]);

      if (customersRes.data) setCustomers(customersRes.data as Customer[]);
      if (equipmentRes.data) setEquipment(equipmentRes.data);
      if (techniciansRes.data) setTechnicians(techniciansRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (problemCodesRes.data) setProblemCodes(problemCodesRes.data as StandardCode[]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const insertData: TicketInsertData = {
        ticket_type: formData.ticket_type,
        customer_id: formData.customer_id,
        priority: formData.priority,
        title: formData.title,
        description: formData.description,
        service_type: formData.service_type,
        status: 'open',
        created_by: profile?.id,
      };

      // Only add optional fields if they have values
      if (formData.project_id) insertData.project_id = formData.project_id;
      if (formData.equipment_id) insertData.equipment_id = formData.equipment_id;
      if (formData.assigned_to) insertData.assigned_to = formData.assigned_to;
      if (formData.scheduled_date) insertData.scheduled_date = formData.scheduled_date;
      if (formData.estimated_duration) insertData.estimated_duration = parseInt(formData.estimated_duration);
      if (formData.phase_milestone) insertData.phase_milestone = formData.phase_milestone;
      if (formData.technician_notes) insertData.technician_notes = formData.technician_notes;
      if (formData.site_contact_name) insertData.site_contact_name = formData.site_contact_name;
      if (formData.site_contact_phone) insertData.site_contact_phone = formData.site_contact_phone;
      if (formData.problem_code) insertData.problem_code = formData.problem_code;

      // AHS fields
      if (formData.ticket_type === 'WARRANTY_AHS') {
        insertData.ahs_dispatch_number = formData.ahs_dispatch_number;
        if (ahsDefaults) {
          insertData.ahs_diagnosis_fee_amount = ahsDefaults.diagnosisFee;
          insertData.ahs_labor_rate_per_hour = ahsDefaults.laborRate;
        }
      }

      const { error } = await supabase.from('tickets').insert(insertData);

      if (error) {
        console.error('Database error:', error);
        const errorMessage = error.message || 'Unknown database error';
        alert(`Failed to create ticket: ${errorMessage}\n\nDetails: ${error.details || 'No additional details'}\n\nHint: ${error.hint || 'No hints available'}`);
        throw error;
      }

      setFormData({
        ticket_type: defaultType,
        project_id: projectId || '',
        customer_id: '',
        equipment_id: '',
        assigned_to: '',
        priority: 'normal',
        title: '',
        description: '',
        service_type: '',
        scheduled_date: '',
        estimated_duration: '120',
        phase_milestone: '',
        technician_notes: '',
        site_contact_name: '',
        site_contact_phone: '',
        problem_code: '',
        ahs_dispatch_number: '',
      });
      setSelectedCustomer('');
      setShowGasLeakWarning(false);
      setAhsDefaults(null);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] flex flex-col">
        <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between rounded-t-lg">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Create New Ticket</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 sm:p-4 rounded-lg mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Ticket Type *
                </label>
                <select
                  required
                  value={formData.ticket_type}
                  onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value as 'PRJ' | 'SVC' | 'WARRANTY_AHS', project_id: e.target.value === 'SVC' || e.target.value === 'WARRANTY_AHS' ? '' : formData.project_id })}
                  className="input"
                  disabled={!!projectId}
                >
                  <option value="SVC">SVC - Service Work Order</option>
                  <option value="PRJ">PRJ - Project Work Order</option>
                  <option value="WARRANTY_AHS">Warranty - AHS</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {formData.ticket_type === 'SVC' ? 'One-off service calls' : formData.ticket_type === 'PRJ' ? 'Linked to a project' : 'AHS warranty dispatch'}
                </p>
              </div>

              {formData.ticket_type === 'PRJ' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project *
                  </label>
                  <select
                    required
                    value={formData.project_id}
                    onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                    className="input"
                    disabled={!!projectId}
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Ticket will be linked to this project
                  </p>
                </div>
              )}

              {formData.ticket_type === 'WARRANTY_AHS' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <Shield className="w-4 h-4 inline mr-1" />
                    AHS Dispatch # *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.ahs_dispatch_number}
                    onChange={(e) => setFormData({ ...formData, ahs_dispatch_number: e.target.value })}
                    placeholder="Enter AHS dispatch number"
                    className="input"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Dispatch number from AHS warranty portal
                  </p>
                </div>
              )}
            </div>
          </div>

          {formData.ticket_type === 'WARRANTY_AHS' && ahsDefaults && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-2" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">AHS Warranty Defaults</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600 dark:text-gray-400">Diagnosis Fee: <span className="font-medium text-gray-900 dark:text-white">${ahsDefaults.diagnosisFee.toFixed(2)}</span></div>
                <div className="text-gray-600 dark:text-gray-400">Labor Rate: <span className="font-medium text-gray-900 dark:text-white">${ahsDefaults.laborRate.toFixed(2)}/hr</span></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">These rates can be adjusted after ticket creation in the AHS panel</p>
            </div>
          )}

          {formData.ticket_type === 'PRJ' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phase/Milestone (Optional)
              </label>
              <input
                type="text"
                value={formData.phase_milestone}
                onChange={(e) => setFormData({ ...formData, phase_milestone: e.target.value })}
                placeholder="e.g., Installation Phase 1, Site Survey"
                className="input"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Customer *
            </label>
            <select
              required
              value={formData.customer_id}
              onChange={(e) => {
                const customerId = e.target.value;
                const customer = customers.find(c => c.id === customerId);
                setFormData({
                  ...formData,
                  customer_id: customerId,
                  equipment_id: '',
                  site_contact_name: customer?.site_contact_name || '',
                  site_contact_phone: customer?.site_contact_phone || '',
                });
                setSelectedCustomer(customerId);
              }}
              className="input"
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Equipment (Optional)
            </label>
            <select
              value={formData.equipment_id}
              onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
              className="input"
              disabled={!selectedCustomer}
            >
              <option value="">No equipment selected</option>
              {filteredEquipment.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.manufacturer} {eq.model_number} - {eq.serial_number}
                </option>
              ))}
            </select>
            {!selectedCustomer && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Select a customer first
              </p>
            )}
          </div>

          {/* Site Contact Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Site Contact Name
              </label>
              <input
                type="text"
                value={formData.site_contact_name}
                onChange={(e) => setFormData({ ...formData, site_contact_name: e.target.value })}
                placeholder="On-site contact person"
                className="input"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pre-filled from customer if available
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Site Contact Phone
              </label>
              <input
                type="tel"
                value={formData.site_contact_phone}
                onChange={(e) => setFormData({ ...formData, site_contact_phone: e.target.value })}
                placeholder="Contact phone number"
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent',
                  })
                }
                className="input"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign To (Optional)
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="input"
              >
                <option value="">Unassigned</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Service Type *
              </label>
              <select
                required
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="input"
              >
                <option value="">Select service type</option>
                <option value="Preventive Maintenance">Preventive Maintenance</option>
                <option value="Repair">Repair</option>
                <option value="Installation">Installation</option>
                <option value="Emergency Service">Emergency Service</option>
                <option value="Inspection">Inspection</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Problem Code (Optional)
              </label>
              <select
                value={formData.problem_code}
                onChange={(e) => {
                  const code = e.target.value;
                  const selectedCode = problemCodes.find(c => c.code === code);
                  setFormData({ ...formData, problem_code: code });
                  if (selectedCode?.is_critical_safety) {
                    setShowGasLeakWarning(true);
                  } else {
                    setShowGasLeakWarning(false);
                  }
                }}
                className="input"
              >
                <option value="">Select problem code</option>
                {problemCodes.map((code) => (
                  <option key={code.code} value={code.code}>
                    {code.label}
                  </option>
                ))}
              </select>
              {formData.problem_code && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {problemCodes.find(c => c.code === formData.problem_code)?.description}
                </p>
              )}
            </div>
          </div>

          {showGasLeakWarning && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-red-800 dark:text-red-200">CRITICAL SAFETY ALERT</h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Gas leak detected. Follow all safety protocols. Evacuate if necessary and contact emergency services if required.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief description of the issue"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of the service request"
              rows={4}
              className="input"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scheduled Date (Optional)
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Estimated Duration *
              </label>
              <select
                required
                value={formData.estimated_duration}
                onChange={(e) => setFormData({ ...formData, estimated_duration: e.target.value })}
                className="input"
              >
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
                <option value="120">2 hours</option>
                <option value="180">3 hours</option>
                <option value="240">4 hours</option>
                <option value="480">8 hours (Full day)</option>
              </select>
            </div>
          </div>

          {formData.ticket_type === 'PRJ' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Technician Notes (Optional)
              </label>
              <textarea
                value={formData.technician_notes}
                onChange={(e) => setFormData({ ...formData, technician_notes: e.target.value })}
                placeholder="Additional notes for technicians working on this ticket"
                rows={3}
                className="input"
              />
            </div>
          )}

          <div className="flex-shrink-0 flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 sticky bottom-0 bg-white dark:bg-gray-800 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm sm:text-base text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary text-sm sm:text-base">
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
