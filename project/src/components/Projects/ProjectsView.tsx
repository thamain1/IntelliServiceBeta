import { useEffect, useState } from 'react';
import { Plus, Search, FolderKanban, Calendar, DollarSign, TrendingUp, Clock, X, Building2, Layers, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../lib/database.types';
import type { Tables } from '../../lib/dbTypes';
import { ProjectDetailView } from './ProjectDetailView';
import { MasterProjectView } from './MasterProjectView';

type Project = Database['public']['Tables']['projects']['Row'] & {
  customers?: { name: string };
  profiles?: { full_name: string };
  project_milestones?: Array<{ status: string }>;
  parent_project?: { project_number: string; name: string };
};

type Customer = Pick<Tables<'customers'>, 'id' | 'name'>;
type Manager = Pick<Tables<'profiles'>, 'id' | 'full_name'>;

export function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectTypeFilter, setProjectTypeFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [formData, setFormData] = useState({
    project_number: '',
    name: '',
    description: '',
    customer_id: '',
    status: 'planning' as const,
    priority: 'normal' as const,
    project_type: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    budget: 0,
    estimated_hours: 0,
    profit_margin: 0,
    manager_id: '',
    is_master_project: false,
    parent_project_id: '',
    contract_value_total: 0,
    contract_value_site: 0,
    site_name: '',
    site_address: '',
  });

  useEffect(() => {
    loadProjects();
    loadCustomers();
    loadManagers();
  }, []);

  const loadProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*, customers(name), profiles:manager_id(full_name), project_milestones(status), parent_project:parent_project_id(project_number, name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects((data as unknown as Project[]) || []);
    } catch (error) {
      console.error('Error loading projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const loadManagers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('role', ['admin', 'dispatcher'])
        .eq('is_active', true)
        .order('full_name', { ascending: true });

      if (error) throw error;
      setManagers(data || []);
    } catch (error) {
      console.error('Error loading managers:', error);
    }
  };

  const generateProjectNumber = () => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `PRJ-${year}${month}-${random}`;
  };

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const projectNumber = formData.project_number || generateProjectNumber();

      const { error } = await supabase.from('projects').insert([{
        ...formData,
        project_number: projectNumber,
        created_by: userData.user.id,
        end_date: formData.end_date || null,
        manager_id: formData.manager_id || null,
        parent_project_id: formData.parent_project_id || null,
        contract_value_total: formData.is_master_project ? formData.contract_value_total : null,
        contract_value_site: formData.parent_project_id ? formData.contract_value_site : null,
        site_name: formData.parent_project_id ? formData.site_name : null,
        site_address: formData.parent_project_id ? formData.site_address : null,
      }]);

      if (error) throw error;

      setShowAddModal(false);
      setFormData({
        project_number: '',
        name: '',
        description: '',
        customer_id: '',
        status: 'planning',
        priority: 'normal',
        project_type: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        budget: 0,
        estimated_hours: 0,
        profit_margin: 0,
        manager_id: '',
        is_master_project: false,
        parent_project_id: '',
        contract_value_total: 0,
        contract_value_site: 0,
        site_name: '',
        site_address: '',
      });
      loadProjects();
    } catch (error) {
      console.error('Error adding project:', error);
      alert('Failed to add project. Please try again.');
    }
  };

  const handleDeleteProject = async (projectId: string, projectName: string) => {
    if (!confirm(`Are you sure you want to delete project "${projectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      loadProjects();
    } catch (error: unknown) {
      console.error('Error deleting project:', error);
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('foreign key')) {
        alert('Cannot delete this project because it has associated records (tickets, invoices, etc.). Please remove those first.');
      } else {
        alert('Failed to delete project. Please try again.');
      }
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.project_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.customers?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;

    const matchesProjectType =
      projectTypeFilter === 'all' ||
      (projectTypeFilter === 'master' && project.is_master_project) ||
      (projectTypeFilter === 'sites' && project.parent_project_id !== null) ||
      (projectTypeFilter === 'standalone' && !project.is_master_project && project.parent_project_id === null);

    return matchesSearch && matchesStatus && matchesProjectType;
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'planning':
        return 'badge-gray';
      case 'in_progress':
        return 'badge-blue';
      case 'on_hold':
        return 'badge-yellow';
      case 'completed':
        return 'badge-green';
      case 'cancelled':
        return 'badge-red';
      default:
        return 'badge-gray';
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'normal':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const calculateProgress = (project: Project) => {
    if (!project.project_milestones || project.project_milestones.length === 0) return 0;
    const completed = project.project_milestones.filter(m => m.status === 'completed').length;
    return Math.round((completed / project.project_milestones.length) * 100);
  };

  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const totalActualCost = projects.reduce((sum, p) => sum + (p.actual_cost || 0), 0);
  const activeProjects = projects.filter(p => p.status === 'in_progress').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (selectedProject) {
    if (selectedProject.is_master_project) {
      return (
        <MasterProjectView
          projectId={selectedProject.id}
          onClose={() => setSelectedProject(null)}
        />
      );
    }

    return (
      <ProjectDetailView
        projectId={selectedProject.id}
        onBack={() => setSelectedProject(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Project Management</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage large installations and multi-phase jobs
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Project</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {projects.length}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
              <FolderKanban className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Projects</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{activeProjects}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Budget</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                ${totalBudget.toLocaleString()}
              </p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 p-3 rounded-lg">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Actual Cost</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                ${totalActualCost.toLocaleString()}
              </p>
            </div>
            <div className="bg-red-100 dark:bg-red-900/20 text-red-600 p-3 rounded-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search projects, customers..."
              className="input pl-10"
            />
          </div>

          <select
            value={projectTypeFilter}
            onChange={(e) => setProjectTypeFilter(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Projects</option>
            <option value="master">Master Projects</option>
            <option value="sites">Site Jobs</option>
            <option value="standalone">Standalone</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Status</option>
            <option value="planning">Planning</option>
            <option value="in_progress">In Progress</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProjects.length === 0 ? (
          <div className="col-span-2 card p-12 text-center">
            <FolderKanban className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No projects found</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const progress = calculateProgress(project);
            const isOverBudget = (project.actual_cost || 0) > (project.budget || 0);

            return (
              <div
                key={project.id}
                onClick={() => setSelectedProject(project)}
                className="card p-6 hover:shadow-lg transition-shadow cursor-pointer relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(project.id, project.name);
                  }}
                  className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-start justify-between mb-4 pr-8">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {project.name}
                      </h3>
                      {project.is_master_project && (
                        <span className="badge badge-green text-xs flex items-center space-x-1">
                          <Layers className="w-3 h-3" />
                          <span>Master</span>
                        </span>
                      )}
                      {project.parent_project_id && (
                        <span className="badge badge-blue text-xs flex items-center space-x-1">
                          <Building2 className="w-3 h-3" />
                          <span>Site</span>
                        </span>
                      )}
                      <span className={`badge ${getStatusColor(project.status)} text-xs`}>
                        {(project.status ?? 'active').replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {project.project_number}
                    </p>
                    {project.parent_project_id && project.parent_project && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        → Part of: {project.parent_project.project_number}
                      </p>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${getPriorityColor(project.priority)}`}>
                    {(project.priority ?? 'normal').toUpperCase()}
                  </span>
                </div>

                {project.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {project.description}
                  </p>
                )}

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Customer</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.customers?.name || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Project Manager</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.profiles?.full_name || 'Unassigned'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="font-medium text-gray-900 dark:text-white">{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        progress === 100 ? 'bg-green-600' : 'bg-blue-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Budget</p>
                      <p className={`text-sm font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900 dark:text-white'}`}>
                        ${(project.budget || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Hours</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.actual_hours || 0}/{project.estimated_hours || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'TBD'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Project</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddProject} className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Number
                  </label>
                  <input
                    type="text"
                    value={formData.project_number}
                    onChange={(e) => setFormData({ ...formData, project_number: e.target.value })}
                    className="input"
                    placeholder="Auto-generated if left blank"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Customer *
                  </label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    placeholder="e.g., Complete HVAC System Installation"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input"
                    rows={3}
                    placeholder="Project details and scope"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Type
                  </label>
                  <input
                    type="text"
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    className="input"
                    placeholder="e.g., Installation, Maintenance Contract"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Project Manager
                  </label>
                  <select
                    value={formData.manager_id}
                    onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                    className="input"
                  >
                    <option value="">Select Manager</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.full_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as typeof formData.status })}
                    className="input"
                  >
                    <option value="planning">Planning</option>
                    <option value="in_progress">In Progress</option>
                    <option value="on_hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as typeof formData.priority })}
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
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    End Date
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
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.estimated_hours}
                    onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profit Margin (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={formData.profit_margin}
                    onChange={(e) => setFormData({ ...formData, profit_margin: parseFloat(e.target.value) || 0 })}
                    className="input"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Project Type</h3>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      id="is_master_project"
                      checked={formData.is_master_project}
                      onChange={(e) => setFormData({
                        ...formData,
                        is_master_project: e.target.checked,
                        parent_project_id: e.target.checked ? '' : formData.parent_project_id
                      })}
                      disabled={!!formData.parent_project_id}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <div className="flex-1">
                      <label htmlFor="is_master_project" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Master Project (Multi-Site)
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        This is a master project that contains multiple site jobs
                      </p>
                    </div>
                  </div>

                  {formData.is_master_project && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Total Contract Value ($)
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.contract_value_total}
                        onChange={(e) => setFormData({ ...formData, contract_value_total: parseFloat(e.target.value) || 0 })}
                        className="input"
                        placeholder="Total value across all sites"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Parent Master Project (Optional)
                    </label>
                    <select
                      value={formData.parent_project_id}
                      onChange={(e) => setFormData({
                        ...formData,
                        parent_project_id: e.target.value,
                        is_master_project: e.target.value ? false : formData.is_master_project
                      })}
                      disabled={formData.is_master_project}
                      className="input"
                    >
                      <option value="">None - Standalone Project</option>
                      {projects.filter(p => p.is_master_project).map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.project_number} - {project.name}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Select a master project if this is a site job
                    </p>
                  </div>

                  {formData.parent_project_id && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Site Contract Value ($)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={formData.contract_value_site}
                          onChange={(e) => setFormData({ ...formData, contract_value_site: parseFloat(e.target.value) || 0 })}
                          className="input"
                          placeholder="Value for this site"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Site Name
                        </label>
                        <input
                          type="text"
                          value={formData.site_name}
                          onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
                          className="input"
                          placeholder="e.g., Building A, North Campus"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Site Address
                        </label>
                        <input
                          type="text"
                          value={formData.site_address}
                          onChange={(e) => setFormData({ ...formData, site_address: e.target.value })}
                          className="input"
                          placeholder="Physical address of this site"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary flex-1">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
