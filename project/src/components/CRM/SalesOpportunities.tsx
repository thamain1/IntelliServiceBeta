import { useState, useEffect } from 'react';
import {
  Target,
  Phone,
  Mail,
  Wrench,
  Calendar,
  User,
  AlertTriangle,
  ChevronRight,
  Search,
  Filter,
  Clock,
} from 'lucide-react';
import { CRMService } from '../../services/CRMService';

interface SalesOpportunity {
  ticket_id: string;
  ticket_number: string;
  title: string;
  problem_code: string;
  problem_label: string;
  resolution_code: string;
  resolution_label: string;
  completed_at: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  equipment_manufacturer: string;
  equipment_model: string;
  equipment_install_date: string;
  equipment_age_years: number;
  technician_id: string;
  technician_name: string;
}

interface SalesOpportunitiesProps {
  onRefresh?: () => void;
}

export function SalesOpportunities({ onRefresh }: SalesOpportunitiesProps) {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<SalesOpportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAge, setFilterAge] = useState<string>('all');

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    setLoading(true);
    try {
      const data = await CRMService.getSalesOpportunities();
      setOpportunities(data);
    } catch (err) {
      console.error('Failed to load opportunities:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch =
      opp.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      opp.problem_label?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      filterAge === 'all' ||
      (filterAge === '10+' && opp.equipment_age_years >= 10) ||
      (filterAge === '15+' && opp.equipment_age_years >= 15);

    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input w-full pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={filterAge}
            onChange={(e) => setFilterAge(e.target.value)}
            className="input"
          >
            <option value="all">All Equipment Ages</option>
            <option value="10+">10+ Years Old</option>
            <option value="15+">15+ Years Old</option>
          </select>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 dark:text-blue-100">Sales Opportunities</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              These tickets have been flagged as potential sales opportunities based on problem codes,
              equipment age, or technician observations. Follow up to convert to estimates.
            </p>
          </div>
        </div>
      </div>

      {/* Opportunities List */}
      {filteredOpportunities.length === 0 ? (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Opportunities Found</h3>
          <p className="text-gray-500 mt-2">
            {searchTerm || filterAge !== 'all'
              ? 'No opportunities match your filters'
              : 'No flagged sales opportunities yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOpportunities.map((opp) => (
            <div key={opp.ticket_id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {opp.ticket_number}
                    </span>
                    <h3 className="font-medium text-gray-900 dark:text-white">{opp.customer_name}</h3>
                    {opp.equipment_age_years >= 10 && (
                      <span className="flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                        <AlertTriangle className="w-3 h-3" />
                        {opp.equipment_age_years}yr old equipment
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{opp.title}</p>

                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Problem:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {opp.problem_label || opp.problem_code || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Resolution:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {opp.resolution_label || opp.resolution_code || '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Equipment:</span>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {opp.equipment_manufacturer} {opp.equipment_model || ''}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Technician:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{opp.technician_name || '-'}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                    {opp.customer_phone && (
                      <a href={`tel:${opp.customer_phone}`} className="flex items-center gap-1 hover:text-blue-600">
                        <Phone className="w-4 h-4" />
                        {opp.customer_phone}
                      </a>
                    )}
                    {opp.customer_email && (
                      <a href={`mailto:${opp.customer_email}`} className="flex items-center gap-1 hover:text-blue-600">
                        <Mail className="w-4 h-4" />
                        {opp.customer_email}
                      </a>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Completed {new Date(opp.completed_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button className="btn btn-primary btn-sm flex items-center gap-1">
                  Create Estimate
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
