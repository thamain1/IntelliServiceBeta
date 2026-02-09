import { useState, useCallback } from 'react';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  Clock,
  AlertCircle,
  TrendingUp,
  Package,
  Wrench,
  Plus,
  X,
  FileText,
  Kanban as KanbanIcon,
  Building2,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/dbTypes';
import { NewTicketModal } from '../Tickets/NewTicketModal';
import { ProjectBillingSchedule } from './ProjectBillingSchedule';
import { DepositReleasePanel } from './DepositReleasePanel';
import { MasterProjectView } from './MasterProjectView';
import { GanttChart } from './GanttChart';
import { useAuth } from '../../contexts/AuthContext';

type ProjectRow = Tables<'projects'> & {
  customers?: { name: string };
  profiles?: { full_name: string };
  parent_project?: { project_number: string; name: string };
};

type ProjectDetailViewProps = {
  projectId: string;
  onBack: () => void;
};

type Phase = {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  budget_amount: number;
  actual_amount: number;
  status: string;
  percent_complete: number;
  phase_order: number;
};

type Task = {
  id: string;
  phase_id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  assigned_to: string;
  estimated_hours: number;
  actual_hours: number;
  parts_cost: number;
  equipment_cost: number;
  status: string;
  completion_percent: number;
  priority: string;
  profiles?: { full_name: string };
};

type ChangeOrder = {
  id: string;
  change_number: string;
  description: string;
  reason: string;
  cost_impact: number;
  time_impact_days: number;
  status: string;
  requested_date: string;
  approved_date: string;
  profiles?: { full_name: string };
};

type Issue = {
  id: string;
  issue_number: string;
  type: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  impact_cost: number;
  impact_schedule_days: number;
  created_at: string;
  profiles?: { full_name: string };
};

type TicketRow = Tables<'tickets'> & {
  profiles?: { full_name: string };
  customers?: { name: string };
};

export function ProjectDetailView({ projectId, onBack }: ProjectDetailViewProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'phases' | 'tasks' | 'budget' | 'gantt' | 'kanban' | 'changes' | 'issues' | 'workorders' | 'billing' | 'deposits'>('overview');
  const [project, setProject] = useState<ProjectRow | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [workOrders, setWorkOrders] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPhaseModal, setShowPhaseModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showChangeOrderModal, setShowChangeOrderModal] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [isMasterProject, setIsMasterProject] = useState(false);
  const [isSiteJob, setIsSiteJob] = useState(false);

  const [phaseFormData, setPhaseFormData] = useState({
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget_amount: 0,
  });

  const [taskFormData, setTaskFormData] = useState({
    phase_id: '',
    name: '',
    description: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    assigned_to: '',
    estimated_hours: 0,
    priority: 'normal' as const,
  });

  const [changeOrderFormData, setChangeOrderFormData] = useState({
    description: '',
    reason: '',
    cost_impact: 0,
    time_impact_days: 0,
  });

  const [issueFormData, setIssueFormData] = useState({
    type: 'issue' as const,
    title: '',
    description: '',
    severity: 'medium' as const,
    impact_cost: 0,
    impact_schedule_days: 0,
  });

  const _loadProjectDetails = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, customers(name), profiles:manager_id(full_name), parent_project:parent_project_id(project_number, name)')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      setProject(data);

      setIsMasterProject(data.is_master_project === true);
      setIsSiteJob(data.parent_project_id !== null);
    } catch (error) {
      console.error('Error loading project:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadPhases = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('project_phases')
        .select('*')
        .eq('project_id', projectId)
        .order('phase_order', { ascending: true });

      if (error) throw error;
      setPhases((data as unknown as Phase[]) || []);
    } catch (error) {
      console.error('Error loading phases:', error);
    }
  }, [projectId]);

  const loadTasks = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('project_tasks')
        .select('*, profiles:assigned_to(full_name)')
        .eq('project_id', projectId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setTasks((data as unknown as Task[]) || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  }, [projectId]);

  const loadChangeOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('project_change_orders')
        .select('*, profiles:requested_by(full_name)')
        .eq('project_id', projectId)
        .order('requested_date', { ascending: false });

      if (error) throw error;
      setChangeOrders((data as unknown as ChangeOrder[]) || []);
    } catch (error) {
      console.error('Error loading change orders:', error);
    }
  }, [projectId]);

  const loadIssues = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('project_issues')
        .select('*, profiles:created_by(full_name)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false});

      if (error) throw error;
      setIssues((data as unknown as Issue[]) || []);
    } catch (error) {
      console.error('Error loading issues:', error);
    }
  }, [projectId]);

  const loadWorkOrders = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          profiles:assigned_to(full_name),
          customers!tickets_customer_id_fkey(name)
        `)
        .eq('ticket_type', 'PRJ')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWorkOrders((data as unknown as TicketRow[]) || []);
    } catch (error) {
      console.error('Error loading work orders:', error);
    }
  }, [projectId]);

  const handleAddPhase = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const phaseOrder = phases.length;
      const { error } = await supabase.from('project_phases').insert([{
        ...phaseFormData,
        project_id: projectId,
        phase_order: phaseOrder,
      }]);

      if (error) throw error;
      setShowPhaseModal(false);
      setPhaseFormData({
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        budget_amount: 0,
      });
      loadPhases();
    } catch (error) {
      console.error('Error adding phase:', error);
      alert('Failed to add phase');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('project_tasks').insert([{
        ...taskFormData,
        project_id: projectId,
        assigned_to: taskFormData.assigned_to || null,
      }]);

      if (error) throw error;
      setShowTaskModal(false);
      setTaskFormData({
        phase_id: '',
        name: '',
        description: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        assigned_to: '',
        estimated_hours: 0,
        priority: 'normal',
      });
      loadTasks();
    } catch (error) {
      console.error('Error adding task:', error);
      alert('Failed to add task');
    }
  };

  const generateChangeOrderNumber = async () => {
    const { data, error } = await supabase
      .from('project_change_orders')
      .select('change_number')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error getting last change order number:', error);
      return 'CO-001';
    }

    if (!data || data.length === 0) {
      return 'CO-001';
    }

    const lastNumber = parseInt(data[0].change_number.split('-')[1]) || 0;
    return `CO-${String(lastNumber + 1).padStart(3, '0')}`;
  };

  const generateIssueNumber = async () => {
    const { data, error } = await supabase
      .from('project_issues')
      .select('issue_number')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error getting last issue number:', error);
      return 'ISS-001';
    }

    if (!data || data.length === 0) {
      return 'ISS-001';
    }

    const lastNumber = parseInt((data[0] as unknown as { issue_number: string })?.issue_number?.split('-')[1]) || 0;
    return `ISS-${String(lastNumber + 1).padStart(3, '0')}`;
  };

  const handleAddChangeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const changeNumber = await generateChangeOrderNumber();

      const { error } = await supabase.from('project_change_orders').insert([{
        ...changeOrderFormData,
        project_id: projectId,
        change_number: changeNumber,
        requested_by: userData.user.id,
      }]);

      if (error) throw error;

      setShowChangeOrderModal(false);
      setChangeOrderFormData({
        description: '',
        reason: '',
        cost_impact: 0,
        time_impact_days: 0,
      });
      loadChangeOrders();
    } catch (error) {
      console.error('Error adding change order:', error);
      alert('Failed to add change order');
    }
  };

  const handleAddIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const issueNumber = await generateIssueNumber();

      const { error } = await supabase.from('project_issues').insert([{
        ...issueFormData,
        project_id: projectId,
        issue_number: issueNumber,
        created_by: userData.user.id,
      }]);

      if (error) throw error;

      setShowIssueModal(false);
      setIssueFormData({
        type: 'issue',
        title: '',
        description: '',
        severity: 'medium',
        impact_cost: 0,
        impact_schedule_days: 0,
      });
      loadIssues();
    } catch (error) {
      console.error('Error adding issue:', error);
      alert('Failed to add issue');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'badge-green';
      case 'in_progress': return 'badge-yellow';
      case 'pending': return 'badge-gray';
      case 'blocked': return 'badge-red';
      default: return 'badge-gray';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600';
      case 'high': return 'text-orange-600';
      case 'normal': return 'text-blue-600';
      case 'low': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isMasterProject) {
    return (
      <MasterProjectView
        projectId={projectId}
        onClose={onBack}
      />
    );
  }

  const totalBudget = (project.budget_labor || 0) + (project.budget_parts || 0) +
                      (project.budget_equipment || 0) + (project.budget_travel || 0) +
                      (project.budget_overhead || 0);

  const contractValue = project.contract_value_site || project.contract_value_total || project.budget || 0;
  const canManageFinancials = profile?.role === 'admin' || profile?.role === 'dispatcher';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="btn btn-outline flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Projects</span>
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.name}</h1>
              {isSiteJob && (
                <span className="badge badge-blue text-xs flex items-center space-x-1">
                  <Building2 className="w-3 h-3" />
                  <span>Site Job</span>
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-gray-600 dark:text-gray-400">{project.project_number}</p>
              {isSiteJob && project.parent_project && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  → Part of: {project.parent_project.project_number}
                </span>
              )}
            </div>
          </div>
        </div>
        <span className={`badge ${getStatusColor(project.status)}`}>
          {project.status.replace('_', ' ')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Budget</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                ${totalBudget.toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Actual Cost</p>
              <p className="text-2xl font-bold text-orange-600">
                ${(project.actual_cost || 0).toLocaleString()}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Estimated Hours</p>
              <p className="text-2xl font-bold text-blue-600">
                {project.estimated_hours || 0}h
              </p>
            </div>
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Actual Hours</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.actual_hours || 0}h
              </p>
            </div>
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-6 overflow-x-auto">
          {['overview', 'workorders', ...(isSiteJob ? ['billing', 'deposits'] : []), 'phases', 'tasks', 'budget', 'gantt', 'kanban', 'changes', 'issues'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as typeof activeTab)}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
              }`}
            >
              {tab === 'workorders' ? 'Work Orders' :
               tab === 'billing' ? 'Billing Schedule' :
               tab === 'deposits' ? 'Deposits & Revenue' :
               tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Project Details</h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Description</p>
                  <p className="text-gray-900 dark:text-white">{project.description || 'No description'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                    <p className="text-gray-900 dark:text-white">
                      {new Date(project.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">End Date</p>
                    <p className="text-gray-900 dark:text-white">
                      {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set'}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Project Type</p>
                    <p className="text-gray-900 dark:text-white">{project.project_type || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Priority</p>
                    <p className={`font-medium ${getPriorityColor(project.priority)}`}>
                      {project.priority?.toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Budget Breakdown</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Labor</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${(project.budget_labor || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Parts</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${(project.budget_parts || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Equipment</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${(project.budget_equipment || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="text-gray-600 dark:text-gray-400">Travel</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    ${(project.budget_travel || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-t-2 border-blue-600">
                  <span className="font-bold text-gray-900 dark:text-white">Total Budget</span>
                  <span className="font-bold text-blue-600">
                    ${totalBudget.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Customer</h2>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {project.customers?.name}
                </span>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Project Manager</h2>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-gray-400" />
                <span className="font-medium text-gray-900 dark:text-white">
                  {project.profiles?.full_name || 'Not assigned'}
                </span>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Phases</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{phases.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Tasks</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{tasks.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Change Orders</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{changeOrders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Open Issues</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {issues.filter(i => i.status !== 'closed').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'workorders' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Work Orders (PRJ Tickets)</h2>
            <button
              onClick={() => setShowWorkOrderModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Work Order</span>
            </button>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <strong>PRJ Tickets</strong> are work orders linked to this project. Each ticket tracks labor, parts, and progress for a specific job or visit.
              Ticket IDs follow the format: <code className="bg-white dark:bg-gray-800 px-2 py-1 rounded">PRJ-YYMM-XXX-N</code>
            </p>
          </div>

          <div className="space-y-4">
            {workOrders.length === 0 ? (
              <div className="card p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Work Orders Yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create work orders to track individual jobs and technician visits for this project.
                </p>
                <button
                  onClick={() => setShowWorkOrderModal(true)}
                  className="btn btn-primary inline-flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Work Order</span>
                </button>
              </div>
            ) : (
              workOrders.map((ticket) => (
                <div key={ticket.id} className="card p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          {ticket.ticket_number}
                        </h3>
                        <span className={`badge ${
                          ticket.status === 'completed' ? 'badge-green' :
                          ticket.status === 'in_progress' ? 'badge-blue' :
                          ticket.status === 'on_hold' ? 'badge-yellow' : 'badge-gray'
                        }`}>
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span className={`badge ${
                          ticket.priority === 'urgent' ? 'badge-red' :
                          ticket.priority === 'high' ? 'badge-orange' :
                          ticket.priority === 'normal' ? 'badge-blue' : 'badge-gray'
                        }`}>
                          {ticket.priority}
                        </span>
                      </div>
                      <h4 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                        {ticket.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {ticket.description}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-b border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Customer</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {ticket.customers?.name || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Assigned To</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {ticket.profiles?.full_name || 'Unassigned'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Service Type</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {ticket.service_type || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phase/Milestone</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {ticket.phase_milestone || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Estimated</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {ticket.estimated_duration} min
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Actual Time</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {ticket.actual_duration_minutes ? `${ticket.actual_duration_minutes} min` : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {ticket.scheduled_date ? new Date(ticket.scheduled_date).toLocaleDateString() : 'Not scheduled'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Created</p>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {ticket.technician_notes && (
                    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Technician Notes:</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{ticket.technician_notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'phases' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Phases</h2>
            <button
              onClick={() => setShowPhaseModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Phase</span>
            </button>
          </div>

          <div className="space-y-4">
            {phases.length === 0 ? (
              <div className="card p-12 text-center">
                <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No phases defined yet</p>
              </div>
            ) : (
              phases.map((phase) => (
                <div key={phase.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{phase.name}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{phase.description}</p>
                    </div>
                    <span className={`badge ${getStatusColor(phase.status)}`}>
                      {phase.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(phase.start_date).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">End Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {phase.end_date ? new Date(phase.end_date).toLocaleDateString() : 'Not set'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Budget</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${(phase.budget_amount || 0).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Actual Cost</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${(phase.actual_amount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600 dark:text-gray-400">Completion</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {phase.percent_complete}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${phase.percent_complete}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Tasks</h2>
            <button
              onClick={() => setShowTaskModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Assigned To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Progress
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No tasks created yet
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{task.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{task.description}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900 dark:text-white">
                            {task.profiles?.full_name || 'Unassigned'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900 dark:text-white">
                              {new Date(task.start_date).toLocaleDateString()}
                            </p>
                            <p className="text-gray-600 dark:text-gray-400">
                              to {new Date(task.end_date).toLocaleDateString()}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <p className="text-gray-900 dark:text-white">
                              {task.actual_hours} / {task.estimated_hours}h
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`badge ${getStatusColor(task.status)}`}>
                            {task.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-24">
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-gray-600 dark:text-gray-400">{task.completion_percent}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                              <div
                                className="bg-blue-600 h-1.5 rounded-full"
                                style={{ width: `${task.completion_percent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Budget vs Actual</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Budget Allocation</h3>
              <div className="space-y-3">
                {[
                  { label: 'Labor', amount: project.budget_labor || 0, icon: Users },
                  { label: 'Parts', amount: project.budget_parts || 0, icon: Package },
                  { label: 'Equipment', amount: project.budget_equipment || 0, icon: Wrench },
                  { label: 'Travel', amount: project.budget_travel || 0, icon: Clock },
                  { label: 'Overhead', amount: project.budget_overhead || 0, icon: DollarSign },
                ].map((item) => {
                  const Icon = item.icon;
                  const percentage = totalBudget > 0 ? (item.amount / totalBudget) * 100 : 0;
                  return (
                    <div key={item.label} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${item.amount.toLocaleString()}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Cost Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Total Budget</span>
                  <span className="text-xl font-bold text-blue-600">
                    ${totalBudget.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Actual Cost</span>
                  <span className="text-xl font-bold text-orange-600">
                    ${(project.actual_cost || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Remaining</span>
                  <span className="text-xl font-bold text-green-600">
                    ${(totalBudget - (project.actual_cost || 0)).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="text-gray-600 dark:text-gray-400">Variance</span>
                  <span className={`text-xl font-bold ${
                    (project.actual_cost || 0) > totalBudget ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {(project.actual_cost || 0) > totalBudget ? '+' : ''}
                    {(((project.actual_cost || 0) / totalBudget - 1) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'gantt' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gantt Chart</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Visual timeline showing phases and tasks
              </p>
            </div>
          </div>

          <GanttChart
            phases={phases}
            tasks={tasks}
            projectStartDate={project.start_date}
            projectEndDate={project.end_date}
          />
        </div>
      )}

      {activeTab === 'kanban' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Kanban Board</h2>
            <button
              onClick={() => setShowTaskModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Task</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['pending', 'in_progress', 'blocked', 'completed'].map((status) => {
              const statusTasks = tasks.filter(task => task.status === status);
              const statusColors = {
                pending: 'border-gray-300 bg-gray-50 dark:bg-gray-800',
                in_progress: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20',
                blocked: 'border-red-300 bg-red-50 dark:bg-red-900/20',
                completed: 'border-green-300 bg-green-50 dark:bg-green-900/20'
              };
              const statusLabels = {
                pending: 'Pending',
                in_progress: 'In Progress',
                blocked: 'Blocked',
                completed: 'Completed'
              };

              return (
                <div key={status} className={`border-2 rounded-lg ${statusColors[status as keyof typeof statusColors]}`}>
                  <div className="p-4 border-b-2 border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {statusLabels[status as keyof typeof statusLabels]}
                      </h3>
                      <span className={`badge ${getStatusColor(status)}`}>
                        {statusTasks.length}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 space-y-3 min-h-[500px]">
                    {statusTasks.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                        No tasks
                      </p>
                    ) : (
                      statusTasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-move"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('taskId', task.id);
                            e.dataTransfer.setData('currentStatus', task.status);
                          }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={async (e) => {
                            e.preventDefault();
                            const draggedTaskId = e.dataTransfer.getData('taskId');
                            const currentStatus = e.dataTransfer.getData('currentStatus');

                            if (draggedTaskId !== task.id && currentStatus === status) {
                              return;
                            }

                            try {
                              const { error } = await supabase
                                .from('project_tasks')
                                .update({ status: status as 'pending' | 'in_progress' | 'blocked' | 'completed' })
                                .eq('id', draggedTaskId);

                              if (error) throw error;
                              loadTasks();
                            } catch (error) {
                              console.error('Error updating task:', error);
                              alert('Failed to move task');
                            }
                          }}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                {task.name}
                              </h4>
                              <span className={`badge badge-sm ${
                                task.priority === 'urgent' ? 'badge-red' :
                                task.priority === 'high' ? 'badge-orange' :
                                task.priority === 'normal' ? 'badge-blue' : 'badge-gray'
                              }`}>
                                {task.priority}
                              </span>
                            </div>

                            {task.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{task.estimated_hours}h</span>
                              </div>
                              {task.profiles?.full_name && (
                                <div className="flex items-center space-x-1">
                                  <Users className="w-3 h-3" />
                                  <span className="truncate max-w-[100px]">
                                    {task.profiles.full_name.split(' ')[0]}
                                  </span>
                                </div>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-600 dark:text-gray-400">Progress</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {task.completion_percent}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                <div
                                  className="bg-blue-600 h-1.5 rounded-full"
                                  style={{ width: `${task.completion_percent}%` }}
                                />
                              </div>
                            </div>

                            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500 dark:text-gray-400">
                                  Due: {new Date(task.end_date).toLocaleDateString()}
                                </span>
                                <button
                                  onClick={async () => {
                                    const newStatuses = {
                                      pending: 'in_progress',
                                      in_progress: 'completed',
                                      blocked: 'in_progress',
                                      completed: 'completed'
                                    };
                                    const newStatus = newStatuses[task.status as keyof typeof newStatuses];

                                    try {
                                      const { error } = await supabase
                                        .from('project_tasks')
                                        .update({ status: newStatus as 'pending' | 'in_progress' | 'blocked' | 'completed' })
                                        .eq('id', task.id);

                                      if (error) throw error;
                                      loadTasks();
                                    } catch (error) {
                                      console.error('Error updating task:', error);
                                    }
                                  }}
                                  className="text-blue-600 hover:text-blue-700 font-medium"
                                >
                                  {task.status === 'pending' && 'Start'}
                                  {task.status === 'in_progress' && 'Complete'}
                                  {task.status === 'blocked' && 'Resume'}
                                  {task.status === 'completed' && '✓'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div
                    className="p-4 border-t-2 border-gray-200 dark:border-gray-700 text-center"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      const draggedTaskId = e.dataTransfer.getData('taskId');

                      try {
                        const { error } = await supabase
                          .from('project_tasks')
                          .update({ status: status as 'pending' | 'in_progress' | 'blocked' | 'completed' })
                          .eq('id', draggedTaskId);

                        if (error) throw error;
                        loadTasks();
                      } catch (error) {
                        console.error('Error updating task:', error);
                        alert('Failed to move task');
                      }
                    }}
                  >
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Drop tasks here
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card p-4 bg-blue-50 dark:bg-blue-900/20">
            <div className="flex items-start space-x-3">
              <KanbanIcon className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Drag & Drop to Update Status
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  Drag tasks between columns to update their status. Click action buttons for quick status changes.
                  Tasks are organized by their current workflow status.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'changes' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Change Orders</h2>
            <button
              onClick={() => setShowChangeOrderModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Change Order</span>
            </button>
          </div>

          <div className="space-y-4">
            {changeOrders.length === 0 ? (
              <div className="card p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No change orders yet</p>
              </div>
            ) : (
              changeOrders.map((co) => (
                <div key={co.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{co.change_number}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{co.description}</p>
                    </div>
                    <span className={`badge ${getStatusColor(co.status)}`}>
                      {co.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cost Impact</p>
                      <p className={`font-medium ${co.cost_impact >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {co.cost_impact >= 0 ? '+' : ''}${co.cost_impact.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Schedule Impact</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {co.time_impact_days > 0 ? '+' : ''}{co.time_impact_days} days
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Requested By</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {co.profiles?.full_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'billing' && isSiteJob && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Billing Schedule</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Manage milestones and create invoices for this site job
              </p>
            </div>
          </div>

          <ProjectBillingSchedule
            projectId={projectId}
            contractValue={contractValue}
            customerId={project.customer_id}
          />
        </div>
      )}

      {activeTab === 'deposits' && isSiteJob && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Deposits & Revenue Recognition</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Track deposit invoices and release unearned revenue as work is performed
              </p>
            </div>
          </div>

          {!canManageFinancials && (
            <div className="card p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>View Only:</strong> You have read-only access to financial information. Only admins and project managers can release deposits.
              </p>
            </div>
          )}

          <DepositReleasePanel projectId={projectId} />
        </div>
      )}

      {activeTab === 'issues' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Issues & Risks</h2>
            <button
              onClick={() => setShowIssueModal(true)}
              className="btn btn-primary flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Log Issue</span>
            </button>
          </div>

          <div className="space-y-4">
            {issues.length === 0 ? (
              <div className="card p-12 text-center">
                <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No issues logged</p>
              </div>
            ) : (
              issues.map((issue) => (
                <div key={issue.id} className="card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          {issue.issue_number}
                        </span>
                        <span className={`badge badge-sm ${issue.type === 'risk' ? 'badge-yellow' : 'badge-red'}`}>
                          {issue.type}
                        </span>
                        <span className={`badge badge-sm ${
                          issue.severity === 'critical' ? 'badge-red' :
                          issue.severity === 'high' ? 'badge-orange' :
                          issue.severity === 'medium' ? 'badge-yellow' : 'badge-gray'
                        }`}>
                          {issue.severity}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">{issue.title}</h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">{issue.description}</p>
                    </div>
                    <span className={`badge ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Cost Impact</p>
                      <p className="font-medium text-red-600">
                        ${issue.impact_cost.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Schedule Impact</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {issue.impact_schedule_days} days
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Created By</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {issue.profiles?.full_name}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showPhaseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Phase</h2>
              <button onClick={() => setShowPhaseModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddPhase} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phase Name *
                </label>
                <input
                  type="text"
                  required
                  value={phaseFormData.name}
                  onChange={(e) => setPhaseFormData({ ...phaseFormData, name: e.target.value })}
                  className="input"
                  placeholder="e.g., Site Survey, Installation, Commissioning"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={phaseFormData.description}
                  onChange={(e) => setPhaseFormData({ ...phaseFormData, description: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={phaseFormData.start_date}
                    onChange={(e) => setPhaseFormData({ ...phaseFormData, start_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={phaseFormData.end_date}
                    onChange={(e) => setPhaseFormData({ ...phaseFormData, end_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Budget Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={phaseFormData.budget_amount}
                  onChange={(e) => setPhaseFormData({ ...phaseFormData, budget_amount: parseFloat(e.target.value) || 0 })}
                  className="input"
                  placeholder="Total budget for this phase"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowPhaseModal(false)} className="btn btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Phase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTaskModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Task</h2>
              <button onClick={() => setShowTaskModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phase
                </label>
                <select
                  value={taskFormData.phase_id}
                  onChange={(e) => setTaskFormData({ ...taskFormData, phase_id: e.target.value })}
                  className="input"
                >
                  <option value="">No Phase</option>
                  {phases.map((phase) => (
                    <option key={phase.id} value={phase.id}>{phase.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Name *
                </label>
                <input
                  type="text"
                  required
                  value={taskFormData.name}
                  onChange={(e) => setTaskFormData({ ...taskFormData, name: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={taskFormData.description}
                  onChange={(e) => setTaskFormData({ ...taskFormData, description: e.target.value })}
                  className="input"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={taskFormData.start_date}
                    onChange={(e) => setTaskFormData({ ...taskFormData, start_date: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={taskFormData.end_date}
                    onChange={(e) => setTaskFormData({ ...taskFormData, end_date: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.25"
                    value={taskFormData.estimated_hours}
                    onChange={(e) => setTaskFormData({ ...taskFormData, estimated_hours: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={taskFormData.priority}
                    onChange={(e) => setTaskFormData({ ...taskFormData, priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent' })}
                    className="input"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showChangeOrderModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Change Order</h2>
              <button onClick={() => setShowChangeOrderModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddChangeOrder} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={changeOrderFormData.description}
                  onChange={(e) => setChangeOrderFormData({ ...changeOrderFormData, description: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="What is changing..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason
                </label>
                <textarea
                  value={changeOrderFormData.reason}
                  onChange={(e) => setChangeOrderFormData({ ...changeOrderFormData, reason: e.target.value })}
                  className="input"
                  rows={2}
                  placeholder="Why is this change needed..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cost Impact ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={changeOrderFormData.cost_impact}
                    onChange={(e) => setChangeOrderFormData({ ...changeOrderFormData, cost_impact: parseFloat(e.target.value) || 0 })}
                    className="input"
                    placeholder="Positive = increase, Negative = decrease"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Use negative numbers for cost reductions
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Schedule Impact (Days)
                  </label>
                  <input
                    type="number"
                    value={changeOrderFormData.time_impact_days}
                    onChange={(e) => setChangeOrderFormData({ ...changeOrderFormData, time_impact_days: parseInt(e.target.value) || 0 })}
                    className="input"
                    placeholder="0 for no impact"
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Note:</strong> This change order will be created with "Pending" status and will require approval before being applied to the project budget and timeline.
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowChangeOrderModal(false)} className="btn btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Change Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showIssueModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Log New Issue</h2>
              <button onClick={() => setShowIssueModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddIssue} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type *
                  </label>
                  <select
                    required
                    value={issueFormData.type}
                    onChange={(e) => setIssueFormData({ ...issueFormData, type: e.target.value as 'issue' | 'risk' })}
                    className="input"
                  >
                    <option value="issue">Issue</option>
                    <option value="risk">Risk</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Severity *
                  </label>
                  <select
                    required
                    value={issueFormData.severity}
                    onChange={(e) => setIssueFormData({ ...issueFormData, severity: e.target.value as 'low' | 'medium' | 'high' | 'critical' })}
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
                  Title *
                </label>
                <input
                  type="text"
                  required
                  value={issueFormData.title}
                  onChange={(e) => setIssueFormData({ ...issueFormData, title: e.target.value })}
                  className="input"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  value={issueFormData.description}
                  onChange={(e) => setIssueFormData({ ...issueFormData, description: e.target.value })}
                  className="input"
                  rows={4}
                  placeholder="Detailed description of the issue and potential impacts..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cost Impact ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={issueFormData.impact_cost}
                    onChange={(e) => setIssueFormData({ ...issueFormData, impact_cost: parseFloat(e.target.value) || 0 })}
                    className="input"
                    placeholder="Estimated cost impact"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Schedule Impact (Days)
                  </label>
                  <input
                    type="number"
                    value={issueFormData.impact_schedule_days}
                    onChange={(e) => setIssueFormData({ ...issueFormData, impact_schedule_days: parseInt(e.target.value) || 0 })}
                    className="input"
                    placeholder="Estimated delay in days"
                  />
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                      Issue Tracking
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                      Issues are logged for visibility and resolution tracking. High and critical issues should be addressed immediately.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowIssueModal(false)} className="btn btn-outline flex-1">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Log Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <NewTicketModal
        isOpen={showWorkOrderModal}
        onClose={() => setShowWorkOrderModal(false)}
        onSuccess={() => {
          loadWorkOrders();
          setShowWorkOrderModal(false);
        }}
        defaultType="PRJ"
        projectId={projectId}
      />
    </div>
  );
}
