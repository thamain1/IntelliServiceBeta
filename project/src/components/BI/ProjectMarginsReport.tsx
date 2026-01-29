import { useEffect, useState, useCallback } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Percent } from 'lucide-react';
import { BIPageLayout } from './BIPageLayout';
import { DateRangeSelector } from './DateRangeSelector';
import { useBIDateRange } from '../../hooks/useBIDateRange';
import { supabase } from '../../lib/supabase';
import { ExportData } from '../../services/ExportService';

interface ProjectMargin {
  id: string;
  name: string;
  revenue: number;
  costs: number;
  profit: number;
  margin: number;
}

interface MarginMetrics {
  avgMargin: number;
  highestMarginProject: string;
  highestMargin: number;
  lowestMarginProject: string;
  lowestMargin: number;
  projects: ProjectMargin[];
}

export function ProjectMarginsReport() {
  const { dateRange, setDateRange, start, end } = useBIDateRange();
  const [metrics, setMetrics] = useState<MarginMetrics>({
    avgMargin: 0,
    highestMarginProject: 'N/A',
    highestMargin: 0,
    lowestMarginProject: 'N/A',
    lowestMargin: 0,
    projects: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [dateRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);

      const { data: projects } = await supabase
        .from('projects')
        .select('*')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const projectMargins: ProjectMargin[] = [];

      for (const project of projects || []) {
        const revenue = project.budget || 0;
        const costs = project.actual_cost || 0;
        const profit = revenue - costs;
        const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

        projectMargins.push({
          id: project.id,
          name: project.name,
          revenue,
          costs,
          profit,
          margin,
        });
      }

      projectMargins.sort((a, b) => b.margin - a.margin);

      const avgMargin =
        projectMargins.length > 0
          ? projectMargins.reduce((sum, p) => sum + p.margin, 0) / projectMargins.length
          : 0;

      const highest = projectMargins[0] || { name: 'N/A', margin: 0 };
      const lowest = projectMargins[projectMargins.length - 1] || { name: 'N/A', margin: 0 };

      setMetrics({
        avgMargin,
        highestMarginProject: highest.name,
        highestMargin: highest.margin,
        lowestMarginProject: lowest.name,
        lowestMargin: lowest.margin,
        projects: projectMargins,
      });
    } catch (error) {
      console.error('Error loading project margins:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = useCallback((): ExportData => {
    return {
      title: 'Project Margins Report',
      subtitle: 'Profitability analysis by project',
      dateRange: { start, end },
      columns: [
        { header: 'Project', key: 'name' },
        { header: 'Revenue', key: 'revenue', format: 'currency' },
        { header: 'Costs', key: 'costs', format: 'currency' },
        { header: 'Gross Profit', key: 'profit', format: 'currency' },
        { header: 'Margin %', key: 'margin', format: 'percent' },
      ],
      rows: metrics.projects.map((project) => ({
        name: project.name,
        revenue: project.revenue,
        costs: project.costs,
        profit: project.profit,
        margin: project.margin / 100,
      })),
      summary: {
        avg_margin: `${metrics.avgMargin.toFixed(1)}%`,
        highest_margin: `${metrics.highestMargin.toFixed(1)}% (${metrics.highestMarginProject})`,
        lowest_margin: `${metrics.lowestMargin.toFixed(1)}% (${metrics.lowestMarginProject})`,
        total_projects: metrics.projects.length,
      },
    };
  }, [metrics, start, end]);

  const statCards = [
    {
      title: 'Avg Margin',
      value: `${metrics.avgMargin.toFixed(1)}%`,
      icon: Percent,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    },
    {
      title: 'Highest Margin',
      value: `${metrics.highestMargin.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      subtitle: metrics.highestMarginProject,
    },
    {
      title: 'Lowest Margin',
      value: `${metrics.lowestMargin.toFixed(1)}%`,
      icon: TrendingDown,
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      subtitle: metrics.lowestMarginProject,
    },
    {
      title: 'Total Projects',
      value: metrics.projects.length,
      icon: DollarSign,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <BIPageLayout
      title="Project Margins"
      subtitle="Profitability analysis by project"
      exportEnabled={true}
      getExportData={getExportData}
    >
      <DateRangeSelector value={dateRange} onChange={setDateRange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.title} className="card p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{card.title}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 truncate max-w-[150px]">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div className={`${card.bgColor} ${card.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Project Financial Overview
        </h2>
        <div className="overflow-x-auto">
          {metrics.projects.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Project
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Revenue
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Costs
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Gross Profit
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Margin %
                  </th>
                </tr>
              </thead>
              <tbody>
                {metrics.projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                      {project.name}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                      ${project.revenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right text-gray-900 dark:text-white">
                      ${project.costs.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-gray-900 dark:text-white">
                      ${project.profit.toLocaleString()}
                    </td>
                    <td
                      className={`py-3 px-4 text-sm text-right font-bold ${
                        project.margin >= 20
                          ? 'text-green-600'
                          : project.margin >= 10
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {project.margin.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              No projects for this period
            </p>
          )}
        </div>
      </div>
    </BIPageLayout>
  );
}
