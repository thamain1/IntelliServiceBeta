import { useState, useEffect } from 'react';
import { X, Clock, User, Calendar, MapPin, Wrench, AlertCircle, Plus, Trash2, UserPlus, Pause, Package, Play, Tag, TrendingUp, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CodeSelector } from '../CRM/CodeSelector';
import type { Database } from '../../lib/database.types';

type Ticket = Database['public']['Tables']['tickets']['Row'] & {
  customers?: { name: string; phone: string; address: string; city: string; state: string };
  profiles?: { full_name: string };
  equipment?: {
    model_number: string;
    manufacturer: string;
    equipment_type: string;
    serial_number: string;
  };
};

type Part = Database['public']['Tables']['parts']['Row'];

type TicketAssignment = Database['public']['Tables']['ticket_assignments']['Row'] & {
  profiles?: { full_name: string };
};

type Profile = Database['public']['Tables']['profiles']['Row'];

interface TicketDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  onUpdate: () => void;
}

export function TicketDetailModal({ isOpen, onClose, ticketId, onUpdate }: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hoursOnsite, setHoursOnsite] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [problemCode, setProblemCode] = useState<string | null>(null);
  const [resolutionCode, setResolutionCode] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<TicketAssignment[]>([]);
  const [technicians, setTechnicians] = useState<Profile[]>([]);
  const [showAddTechnician, setShowAddTechnician] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    technician_id: '',
    role: '' as '' | 'lead' | 'helper',
    scheduled_start: '',
    scheduled_end: '',
  });

  // Hold-related state
  const [showNeedPartsModal, setShowNeedPartsModal] = useState(false);
  const [showReportIssueModal, setShowReportIssueModal] = useState(false);
  const [parts, setParts] = useState<Part[]>([]);
  const [partsRequest, setPartsRequest] = useState({
    urgency: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    notes: '',
    summary: '',
    parts: [] as Array<{ part_id: string; quantity: number; notes: string; preferred_source_location_id: string | null }>,
  });
  const [issueReport, setIssueReport] = useState({
    category: 'other' as 'equipment_failure' | 'access_denied' | 'safety_concern' | 'scope_change' | 'customer_unavailable' | 'technical_limitation' | 'other',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    description: '',
    summary: '',
  });

  useEffect(() => {
    if (isOpen && ticketId) {
      loadTicket();
      loadAssignments();
      loadTechnicians();
    }
  }, [isOpen, ticketId]);

  const loadTicket = async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          customers!tickets_customer_id_fkey(name, phone, address, city, state),
          profiles!tickets_assigned_to_fkey(full_name),
          equipment(model_number, manufacturer, equipment_type, serial_number)
        `)
        .eq('id', ticketId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setTicket(data);
        setHoursOnsite(data.hours_onsite?.toString() || '');
        setStatus(data.status);
        setProblemCode((data as any).problem_code || null);
        setResolutionCode((data as any).resolution_code || null);
      }
    } catch (error) {
      console.error('Error loading ticket:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('ticket_assignments')
        .select(`
          *,
          profiles!ticket_assignments_technician_id_fkey(full_name)
        `)
        .eq('ticket_id', ticketId)
        .order('created_at');

      if (error) throw error;
      if (data) {
        setAssignments(data);
      }
    } catch (error) {
      console.error('Error loading assignments:', error);
    }
  };

  const loadTechnicians = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'technician')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      if (data) {
        setTechnicians(data);
      }
    } catch (error) {
      console.error('Error loading technicians:', error);
    }
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.technician_id) {
      alert('Please select a technician');
      return;
    }

    try {
      const { error } = await supabase
        .from('ticket_assignments')
        .insert({
          ticket_id: ticketId,
          technician_id: newAssignment.technician_id,
          role: newAssignment.role || null,
          scheduled_start: newAssignment.scheduled_start || null,
          scheduled_end: newAssignment.scheduled_end || null,
        });

      if (error) throw error;

      setNewAssignment({
        technician_id: '',
        role: '',
        scheduled_start: '',
        scheduled_end: '',
      });
      setShowAddTechnician(false);
      loadAssignments();
    } catch (error) {
      console.error('Error adding assignment:', error);
      alert('Failed to add technician assignment. Please try again.');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string) => {
    if (!confirm('Remove this technician assignment?')) return;

    try {
      const { error} = await supabase
        .from('ticket_assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      loadAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment. Please try again.');
    }
  };

  const loadParts = async () => {
    try {
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('item_type', 'part')
        .order('name');

      if (error) throw error;
      if (data) setParts(data);
    } catch (error) {
      console.error('Error loading parts:', error);
    }
  };

  const handleNeedParts = async () => {
    if (partsRequest.parts.length === 0) {
      alert('Please add at least one part to the request');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('fn_ticket_hold_for_parts', {
        p_ticket_id: ticketId,
        p_urgency: partsRequest.urgency,
        p_notes: partsRequest.notes,
        p_summary: partsRequest.summary || 'Waiting for parts',
        p_parts: partsRequest.parts,
      });

      if (error) throw error;

      alert('Ticket placed on hold for parts. Timer stopped.');
      setShowNeedPartsModal(false);
      setPartsRequest({ urgency: 'medium', notes: '', summary: '', parts: [] });
      loadTicket();
      onUpdate();
    } catch (error: any) {
      console.error('Error creating parts hold:', error);
      alert(error?.message || 'Failed to place ticket on hold. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReportIssue = async () => {
    if (!issueReport.description.trim()) {
      alert('Please provide a description of the issue');
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('fn_ticket_report_issue', {
        p_ticket_id: ticketId,
        p_category: issueReport.category,
        p_severity: issueReport.severity,
        p_description: issueReport.description,
        p_summary: issueReport.summary || `Issue reported - ${issueReport.category}`,
        p_metadata: {},
      });

      if (error) throw error;

      alert('Issue reported and ticket placed on hold. Timer stopped.');
      setShowReportIssueModal(false);
      setIssueReport({ category: 'other', severity: 'medium', description: '', summary: '' });
      loadTicket();
      onUpdate();
    } catch (error: any) {
      console.error('Error reporting issue:', error);
      alert(error?.message || 'Failed to report issue. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResumeTicket = async () => {
    if (!confirm('Resume this ticket from hold status?')) return;

    setSaving(true);
    try {
      const { data, error } = await supabase.rpc('fn_ticket_resume', {
        p_ticket_id: ticketId,
        p_resolution_notes: null,
      });

      if (error) throw error;

      alert('Ticket resumed from hold');
      loadTicket();
      onUpdate();
    } catch (error: any) {
      console.error('Error resuming ticket:', error);
      alert(error?.message || 'Failed to resume ticket. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const addPartToRequest = () => {
    setPartsRequest({
      ...partsRequest,
      parts: [...partsRequest.parts, { part_id: '', quantity: 1, notes: '', preferred_source_location_id: null }],
    });
  };

  const updatePartInRequest = (index: number, field: string, value: any) => {
    const updated = [...partsRequest.parts];
    updated[index] = { ...updated[index], [field]: value };
    setPartsRequest({ ...partsRequest, parts: updated });
  };

  const removePartFromRequest = (index: number) => {
    setPartsRequest({
      ...partsRequest,
      parts: partsRequest.parts.filter((_, i) => i !== index),
    });
  };

  const handleUpdate = async () => {
    if (!ticket) return;

    setSaving(true);
    try {
      const updates: any = {
        status,
        hours_onsite: hoursOnsite ? parseFloat(hoursOnsite) : null,
        problem_code: problemCode,
        resolution_code: resolutionCode,
      };

      if (status === 'completed' && !ticket.completed_date) {
        updates.completed_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) {
        console.error('Error updating ticket:', error);

        let errorMessage = 'Failed to update ticket. Please try again.';

        if (error.message) {
          if (error.message.includes('permission denied') || error.message.includes('policy') || error.message.includes('Row level security')) {
            errorMessage = 'You do not have permission to update this ticket. Please contact your administrator.';
          } else if (error.message.includes('JSON object requested, multiple') || error.message.includes('0 rows')) {
            errorMessage = 'You do not have permission to update this ticket. Please contact your administrator.';
          } else if (error.message.includes('Cannot change status of billed ticket')) {
            errorMessage = 'Cannot change status of billed ticket. Invoice must be voided first.';
          } else if (error.message.includes('Cannot mark non-billable ticket')) {
            errorMessage = 'Cannot mark non-billable ticket as ready to invoice.';
          } else if (error.code === '23502') {
            errorMessage = 'Missing required field. Please ensure all required fields are filled.';
          } else if (error.code === '23503') {
            errorMessage = 'Invalid reference. Please check that all linked records exist.';
          } else if (error.code === 'PGRST116') {
            errorMessage = 'You do not have permission to update this ticket. Please contact your administrator.';
          } else {
            errorMessage = `Error: ${error.message}`;
          }
        }

        alert(errorMessage);
        return;
      }

      onUpdate();
      onClose();
    } catch (error: any) {
      console.error('Error updating ticket:', error);
      const errorMessage = error?.message || 'Failed to update ticket. Please try again.';
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return colors[priority] || colors.normal;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ticket Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : ticket ? (
          <div className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {ticket.ticket_number}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mt-1">{ticket.title}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
                <span className={`badge ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
                {ticket.hold_active && (
                  <span className="badge bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 flex items-center">
                    <Pause className="w-3 h-3 mr-1" />
                    On Hold ({ticket.hold_type === 'parts' ? 'Parts' : 'Issue'})
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Customer
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {ticket.customers?.name || 'N/A'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {ticket.customers?.phone || 'No phone'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {ticket.customers?.address && `${ticket.customers.address}, ${ticket.customers.city}, ${ticket.customers.state}`}
                    </p>
                    {((ticket as any).site_contact_name || (ticket as any).site_contact_phone) && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Site Contact</p>
                        {(ticket as any).site_contact_name && (
                          <p className="text-sm text-gray-900 dark:text-white">{(ticket as any).site_contact_name}</p>
                        )}
                        {(ticket as any).site_contact_phone && (
                          <a href={`tel:${(ticket as any).site_contact_phone}`} className="text-sm text-blue-600 hover:underline">
                            {(ticket as any).site_contact_phone}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                    <Wrench className="w-4 h-4 mr-2" />
                    Equipment
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    {ticket.equipment ? (
                      <>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {ticket.equipment.manufacturer} {ticket.equipment.model_number}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Type: {ticket.equipment.equipment_type}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          S/N: {ticket.equipment.serial_number}
                        </p>
                      </>
                    ) : (
                      <p className="text-gray-600 dark:text-gray-400">No equipment assigned</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center justify-between">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      Assigned Technicians
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowAddTechnician(!showAddTechnician)}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center"
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Add Tech
                    </button>
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 space-y-2">
                    {ticket.profiles?.full_name && (
                      <div className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 p-2 rounded">
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {ticket.profiles.full_name}
                          </span>
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">(Primary)</span>
                        </div>
                      </div>
                    )}
                    {assignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between text-sm bg-white dark:bg-gray-800 p-2 rounded">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {assignment.profiles?.full_name}
                            </span>
                            {assignment.role && (
                              <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded">
                                {assignment.role}
                              </span>
                            )}
                          </div>
                          {assignment.scheduled_start && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(assignment.scheduled_start).toLocaleString()}
                              {assignment.scheduled_end && ` - ${new Date(assignment.scheduled_end).toLocaleTimeString()}`}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAssignment(assignment.id)}
                          className="ml-2 p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {!ticket.profiles?.full_name && assignments.length === 0 && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">No technicians assigned</p>
                    )}
                  </div>

                  {showAddTechnician && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Technician *
                          </label>
                          <select
                            value={newAssignment.technician_id}
                            onChange={(e) => setNewAssignment({ ...newAssignment, technician_id: e.target.value })}
                            className="input text-sm"
                          >
                            <option value="">Select...</option>
                            {technicians.map((tech) => (
                              <option key={tech.id} value={tech.id}>
                                {tech.full_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Role
                          </label>
                          <select
                            value={newAssignment.role}
                            onChange={(e) => setNewAssignment({ ...newAssignment, role: e.target.value as '' | 'lead' | 'helper' })}
                            className="input text-sm"
                          >
                            <option value="">None</option>
                            <option value="lead">Lead</option>
                            <option value="helper">Helper</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Start Time
                          </label>
                          <input
                            type="datetime-local"
                            value={newAssignment.scheduled_start}
                            onChange={(e) => setNewAssignment({ ...newAssignment, scheduled_start: e.target.value })}
                            className="input text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            End Time
                          </label>
                          <input
                            type="datetime-local"
                            value={newAssignment.scheduled_end}
                            onChange={(e) => setNewAssignment({ ...newAssignment, scheduled_end: e.target.value })}
                            className="input text-sm"
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddTechnician(false);
                            setNewAssignment({ technician_id: '', role: '', scheduled_start: '', scheduled_end: '' });
                          }}
                          className="px-3 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddAssignment}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Scheduled:{' '}
                      {ticket.scheduled_date
                        ? new Date(ticket.scheduled_date).toLocaleString()
                        : 'Not scheduled'}
                    </p>
                    {ticket.completed_date && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Completed: {new Date(ticket.completed_date).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                    <Wrench className="w-4 h-4 mr-2" />
                    Service Type
                  </h4>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                    <p className="text-gray-900 dark:text-white">{ticket.service_type}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Problem and Resolution Codes */}
            {((ticket as any).problem_code || (ticket as any).resolution_code) && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                <h4 className="text-sm font-medium text-indigo-800 dark:text-indigo-200 mb-3 flex items-center">
                  <Tag className="w-4 h-4 mr-2" />
                  Diagnostic Codes
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(ticket as any).problem_code && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Problem Found</p>
                      <p className="font-medium text-gray-900 dark:text-white">{(ticket as any).problem_code}</p>
                    </div>
                  )}
                  {(ticket as any).resolution_code && (
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Resolution Applied</p>
                      <p className="font-medium text-gray-900 dark:text-white">{(ticket as any).resolution_code}</p>
                    </div>
                  )}
                </div>
                {/* Show flags if set */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {(ticket as any).sales_opportunity_flag && (
                    <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-medium rounded">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Sales Opportunity
                    </span>
                  )}
                  {(ticket as any).urgent_review_flag && (
                    <span className="inline-flex items-center px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium rounded">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Urgent Review Required
                    </span>
                  )}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                Description
              </h4>
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Update Ticket
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input"
                  >
                    <option value="open">Open</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Hours On-Site
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    placeholder="e.g., 2.5"
                    value={hoursOnsite}
                    onChange={(e) => setHoursOnsite(e.target.value)}
                    className="input"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Time spent on-site (in hours)
                  </p>
                </div>
              </div>

              {/* Problem/Resolution Codes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <CodeSelector
                  type="problem"
                  value={problemCode || undefined}
                  onChange={(code) => setProblemCode(code)}
                  label="Problem Code"
                />
                <CodeSelector
                  type="resolution"
                  value={resolutionCode || undefined}
                  onChange={(code) => setResolutionCode(code)}
                  label="Resolution Code"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Select codes to track issues and enable analytics. Resolution code is recommended when completing tickets.
              </p>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                {!ticket.hold_active ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        loadParts();
                        setShowNeedPartsModal(true);
                      }}
                      className="px-3 py-2 text-sm bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50 rounded-lg transition-colors flex items-center"
                    >
                      <Package className="w-4 h-4 mr-1" />
                      Need Parts
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowReportIssueModal(true)}
                      className="px-3 py-2 text-sm bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg transition-colors flex items-center"
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Report Issue
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={handleResumeTicket}
                    disabled={saving}
                    className="px-3 py-2 text-sm bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg transition-colors flex items-center"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Resume Ticket
                  </button>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-600 dark:text-gray-400">
            Ticket not found
          </div>
        )}
      </div>

      {/* Need Parts Modal */}
      {showNeedPartsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Parts</h3>
              <button
                onClick={() => setShowNeedPartsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Summary
                </label>
                <input
                  type="text"
                  value={partsRequest.summary}
                  onChange={(e) => setPartsRequest({ ...partsRequest, summary: e.target.value })}
                  className="input"
                  placeholder="Brief description of parts needed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Urgency
                </label>
                <select
                  value={partsRequest.urgency}
                  onChange={(e) => setPartsRequest({ ...partsRequest, urgency: e.target.value as any })}
                  className="input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Parts Needed
                  </label>
                  <button
                    type="button"
                    onClick={addPartToRequest}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Part
                  </button>
                </div>

                <div className="space-y-3">
                  {partsRequest.parts.map((part, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-start p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="col-span-5">
                        <select
                          value={part.part_id}
                          onChange={(e) => updatePartInRequest(index, 'part_id', e.target.value)}
                          className="input text-sm"
                          required
                        >
                          <option value="">Select part...</option>
                          {parts.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.part_number})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          min="1"
                          value={part.quantity}
                          onChange={(e) => updatePartInRequest(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="input text-sm"
                          placeholder="Qty"
                        />
                      </div>
                      <div className="col-span-4">
                        <input
                          type="text"
                          value={part.notes}
                          onChange={(e) => updatePartInRequest(index, 'notes', e.target.value)}
                          className="input text-sm"
                          placeholder="Notes (optional)"
                        />
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removePartFromRequest(index)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {partsRequest.parts.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No parts added yet</p>
                      <p className="text-sm">Click "Add Part" to start</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={partsRequest.notes}
                  onChange={(e) => setPartsRequest({ ...partsRequest, notes: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Additional context or special instructions..."
                />
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  This will stop your active timer and place the ticket on hold until parts arrive.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowNeedPartsModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleNeedParts}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Submitting...' : 'Submit Parts Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Issue Modal */}
      {showReportIssueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Report Issue</h3>
              <button
                onClick={() => setShowReportIssueModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Summary
                </label>
                <input
                  type="text"
                  value={issueReport.summary}
                  onChange={(e) => setIssueReport({ ...issueReport, summary: e.target.value })}
                  className="input"
                  placeholder="Brief summary of the issue"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category
                  </label>
                  <select
                    value={issueReport.category}
                    onChange={(e) => setIssueReport({ ...issueReport, category: e.target.value as any })}
                    className="input"
                  >
                    <option value="equipment_failure">Equipment Failure</option>
                    <option value="access_denied">Access Denied</option>
                    <option value="safety_concern">Safety Concern</option>
                    <option value="scope_change">Scope Change</option>
                    <option value="customer_unavailable">Customer Unavailable</option>
                    <option value="technical_limitation">Technical Limitation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Severity
                  </label>
                  <select
                    value={issueReport.severity}
                    onChange={(e) => setIssueReport({ ...issueReport, severity: e.target.value as any })}
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  value={issueReport.description}
                  onChange={(e) => setIssueReport({ ...issueReport, description: e.target.value })}
                  className="input"
                  rows={6}
                  placeholder="Detailed description of the issue, what happened, current situation, etc..."
                  required
                />
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-800 dark:text-red-200">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  This will stop your active timer and place the ticket on hold until the issue is resolved.
                </p>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowReportIssueModal(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReportIssue}
                disabled={saving}
                className="btn btn-primary"
              >
                {saving ? 'Reporting...' : 'Report Issue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
