import { useState, useEffect } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Wrench,
  Users,
  RefreshCw,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ParetoItem {
  code: string;
  label: string;
  category: string;
  severity: number;
  ticket_count: number;
  total_revenue: number;
  avg_ticket_value: number;
  percentage_of_total: number;
  cumulative_percentage: number;
}

interface ReworkItem {
  original_ticket_id: string;
  original_ticket: string;
  original_problem: string;
  original_resolution: string;
  callback_ticket: string;
  callback_problem: string;
  technician_name: string;
  customer_name: string;
  equipment_model: string;
  days_between: number;
}

interface EquipmentReliability {
  manufacturer: string;
  model_number: string;
  equipment_type: string;
  unit_count: number;
  total_service_calls: number;
  avg_days_between_failures: number;
  min_days_between: number;
  max_days_between: number;
  callbacks_within_30_days: number;
}

interface TechQuality {
  technician_id: string;
  technician_name: string;
  total_tickets: number;
  completed_tickets: number;
  callback_count: number;
  callback_rate: number;
  temp_fixes: number;
  temp_fix_rate: number;
  total_billed: number;
  avg_ticket_value: number;
}

interface AnalyticsDashboardProps {
  initialView?: 'pareto' | 'callbacks' | 'equipment' | 'techs';
}

export function AnalyticsDashboard({ initialView }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'pareto' | 'callbacks' | 'equipment' | 'techs'>(initialView || 'pareto');

  // Update active view when initialView prop changes (from sidebar navigation)
  useEffect(() => {
    if (initialView) {
      setActiveView(initialView);
    }
  }, [initialView]);
  const [paretoData, setParetoData] = useState<ParetoItem[]>([]);
  const [reworkData, setReworkData] = useState<ReworkItem[]>([]);
  const [equipmentData, setEquipmentData] = useState<EquipmentReliability[]>([]);
  const [techData, setTechData] = useState<TechQuality[]>([]);

  useEffect(() => {
    loadData();
  }, [activeView]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeView) {
        case 'pareto':
          const { data: pareto } = await supabase
            .from('vw_problem_pareto')
            .select('*')
            .order('ticket_count', { ascending: false })
            .limit(20);
          setParetoData(pareto || []);
          break;
        case 'callbacks':
          const { data: rework } = await supabase
            .from('vw_rework_analysis')
            .select('*')
            .order('callback_date', { ascending: false })
            .limit(50);
          setReworkData(rework || []);
          break;
        case 'equipment':
          const { data: equipment } = await supabase
            .from('vw_equipment_reliability')
            .select('*')
            .order('avg_days_between_failures', { ascending: true })
            .limit(50);
          setEquipmentData(equipment || []);
          break;
        case 'techs':
          const { data: techs } = await supabase
            .from('vw_technician_quality')
            .select('*')
            .order('callback_rate', { ascending: false });
          setTechData(techs || []);
          break;
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const views = [
    { id: 'pareto' as const, label: 'Problem Analysis', icon: PieChart },
    { id: 'callbacks' as const, label: 'Callback Analysis', icon: Activity },
    { id: 'equipment' as const, label: 'Equipment Reliability', icon: Wrench },
    { id: 'techs' as const, label: 'Tech Quality', icon: Users },
  ];

  const getMaxTicketCount = () => {
    return Math.max(...paretoData.map((p) => p.ticket_count), 1);
  };

  const renderParetoView = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 dark:text-blue-100">Pareto Analysis (80/20 Rule)</h4>
        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
          Identify the vital few problem codes causing the majority of service calls.
          Focus on the top issues to maximize impact.
        </p>
      </div>

      {paretoData.length === 0 ? (
        <div className="text-center py-12">
          <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Data Available</h3>
          <p className="text-gray-500 mt-2">Start closing tickets with problem codes to see analysis</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Problem</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tickets</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cumulative</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">Distribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paretoData.map((item, index) => (
                <tr key={item.code} className={item.cumulative_percentage <= 80 ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.label || item.code}</p>
                      <p className="text-xs text-gray-500">{item.code}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 capitalize">
                      {item.category || 'Other'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                    {item.ticket_count}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {item.percentage_of_total?.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={item.cumulative_percentage <= 80 ? 'font-medium text-yellow-600' : 'text-gray-500'}>
                      {item.cumulative_percentage?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.ticket_count / getMaxTicketCount()) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderCallbacksView = () => (
    <div className="space-y-4">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <h4 className="font-medium text-red-900 dark:text-red-100">Callback Analysis (Rework Detection)</h4>
        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
          Identifies when a customer calls back within 30 days for the same equipment.
          Use this to detect root cause issues and training opportunities.
        </p>
      </div>

      {reworkData.length === 0 ? (
        <div className="text-center py-12">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Callbacks Detected</h3>
          <p className="text-gray-500 mt-2">Great job! No rework issues found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reworkData.map((item) => (
            <div key={item.original_ticket_id + item.callback_ticket} className="card p-4 border-l-4 border-l-red-500">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 dark:text-white">{item.customer_name}</span>
                    <span className="text-red-600 text-sm">
                      Callback in {item.days_between} days
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Original Ticket</p>
                      <p className="font-medium">{item.original_ticket}</p>
                      <p className="text-xs text-gray-400">{item.original_problem} → {item.original_resolution}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Callback Ticket</p>
                      <p className="font-medium">{item.callback_ticket}</p>
                      <p className="text-xs text-gray-400">{item.callback_problem}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                    <span>Tech: {item.technician_name || 'Unassigned'}</span>
                    <span>Equipment: {item.equipment_model || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderEquipmentView = () => (
    <div className="space-y-4">
      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
        <h4 className="font-medium text-purple-900 dark:text-purple-100">Equipment Reliability (MTBF)</h4>
        <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
          Mean Time Between Failures by equipment model. Lower numbers indicate less reliable equipment.
        </p>
      </div>

      {equipmentData.length === 0 ? (
        <div className="text-center py-12">
          <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Data Available</h3>
          <p className="text-gray-500 mt-2">Need more service history to calculate MTBF</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Equipment</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Units</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Service Calls</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Days Between</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">30-Day Callbacks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {equipmentData.map((item, index) => (
                <tr key={`${item.manufacturer}-${item.model_number}`}>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.manufacturer}</p>
                      <p className="text-xs text-gray-500">{item.model_number} - {item.equipment_type}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{item.unit_count}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{item.total_service_calls}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${
                      item.avg_days_between_failures < 90 ? 'text-red-600' :
                      item.avg_days_between_failures < 180 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {item.avg_days_between_failures} days
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {item.callbacks_within_30_days > 0 ? (
                      <span className="text-red-600 font-medium">{item.callbacks_within_30_days}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderTechsView = () => (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
        <h4 className="font-medium text-green-900 dark:text-green-100">Technician Quality Metrics</h4>
        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
          Performance metrics including callback rates and temporary fix usage.
          Use for training and quality improvement.
        </p>
      </div>

      {techData.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Data Available</h3>
          <p className="text-gray-500 mt-2">Need completed tickets to calculate metrics</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Technician</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Completed</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Callbacks</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Callback Rate</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Temp Fixes</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Avg Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {techData.map((tech) => (
                <tr key={tech.technician_id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900 dark:text-white">{tech.technician_name || 'Unknown'}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">{tech.completed_tickets}</td>
                  <td className="px-4 py-3 text-right">
                    {tech.callback_count > 0 ? (
                      <span className="text-red-600">{tech.callback_count}</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${
                      tech.callback_rate > 10 ? 'text-red-600' :
                      tech.callback_rate > 5 ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {tech.callback_rate?.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {tech.temp_fixes > 0 ? (
                      <span className="text-yellow-600">{tech.temp_fixes} ({tech.temp_fix_rate?.toFixed(1)}%)</span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                    ${tech.avg_ticket_value?.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* View Selector */}
      <div className="flex flex-wrap gap-2">
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeView === view.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {view.label}
            </button>
          );
        })}
        <button
          onClick={loadData}
          className="ml-auto flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {activeView === 'pareto' && renderParetoView()}
          {activeView === 'callbacks' && renderCallbacksView()}
          {activeView === 'equipment' && renderEquipmentView()}
          {activeView === 'techs' && renderTechsView()}
        </>
      )}
    </div>
  );
}
