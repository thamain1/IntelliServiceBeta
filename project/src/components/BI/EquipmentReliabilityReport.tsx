import { useEffect, useState } from 'react';
import { Wrench, Clock, AlertTriangle, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { BIPageLayout } from './BIPageLayout';
import { DateRangeSelector } from './DateRangeSelector';
import { useBIDateRange } from '../../hooks/useBIDateRange';
import { supabase } from '../../lib/supabase';
import { ExportData } from '../../services/ExportService';

interface ReliabilityData {
  manufacturer: string;
  model_number: string;
  equipment_type: string | null;
  unit_count: number;
  total_failures: number;
  avg_days_between_failures: number | null;
  min_days_between: number | null;
  max_days_between: number | null;
  callbacks_within_30_days: number;
  failure_rate: number; // failures per unit
}

interface ManufacturerStats {
  name: string;
  total_units: number;
  total_failures: number;
  avg_mtbf: number;
}

interface SummaryStats {
  totalEquipment: number;
  totalFailures: number;
  avgMTBF: number;
  mostReliable: string;
  leastReliable: string;
}

export function EquipmentReliabilityReport() {
  const { dateRange, setDateRange, start, end } = useBIDateRange();
  const [reliabilityData, setReliabilityData] = useState<ReliabilityData[]>([]);
  const [manufacturerStats, setManufacturerStats] = useState<ManufacturerStats[]>([]);
  const [summary, setSummary] = useState<SummaryStats>({
    totalEquipment: 0,
    totalFailures: 0,
    avgMTBF: 0,
    mostReliable: '-',
    leastReliable: '-',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReliabilityData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const loadReliabilityData = async () => {
    try {
      setLoading(true);

      // Get all equipment
      const { data: equipment, error: equipError } = await supabase
        .from('equipment')
        .select('id, manufacturer, model_number, equipment_type');

      if (equipError) throw equipError;

      // Get tickets with equipment in date range
      const { data: tickets, error: ticketsError } = await supabase
        .from('tickets')
        .select('id, equipment_id, created_at, completed_at, status')
        .not('equipment_id', 'is', null)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (ticketsError) throw ticketsError;

      // Build equipment map
      const equipmentMap = new Map(equipment?.map(e => [e.id, e]) || []);

      // Track failures per equipment
      const equipmentFailures: Record<string, Date[]> = {};

      tickets?.forEach(t => {
        if (!t.equipment_id) return;
        if (!equipmentFailures[t.equipment_id]) {
          equipmentFailures[t.equipment_id] = [];
        }
        equipmentFailures[t.equipment_id].push(new Date(t.created_at ?? new Date()));
      });

      // Calculate MTBF per model
      const modelStats: Record<string, {
        manufacturer: string;
        model_number: string;
        equipment_type: string | null;
        units: Set<string>;
        failures: number;
        daysBetween: number[];
        callbacks30: number;
      }> = {};

      Object.entries(equipmentFailures).forEach(([equipId, failureDates]) => {
        const equip = equipmentMap.get(equipId);
        if (!equip) return;

        const key = `${equip.manufacturer}|${equip.model_number}`;

        if (!modelStats[key]) {
          modelStats[key] = {
            manufacturer: equip.manufacturer || 'Unknown',
            model_number: equip.model_number || 'Unknown',
            equipment_type: equip.equipment_type,
            units: new Set(),
            failures: 0,
            daysBetween: [],
            callbacks30: 0,
          };
        }

        modelStats[key].units.add(equipId);
        modelStats[key].failures += failureDates.length;

        // Sort dates and calculate gaps
        const sorted = failureDates.sort((a, b) => a.getTime() - b.getTime());
        for (let i = 1; i < sorted.length; i++) {
          const daysBetween = Math.floor(
            (sorted[i].getTime() - sorted[i - 1].getTime()) / (1000 * 60 * 60 * 24)
          );
          modelStats[key].daysBetween.push(daysBetween);
          if (daysBetween <= 30) {
            modelStats[key].callbacks30++;
          }
        }
      });

      // Convert to array
      const reliabilityArray: ReliabilityData[] = Object.values(modelStats)
        .filter(m => m.failures > 0)
        .map(m => {
          const avgDays = m.daysBetween.length > 0
            ? m.daysBetween.reduce((a, b) => a + b, 0) / m.daysBetween.length
            : null;

          return {
            manufacturer: m.manufacturer,
            model_number: m.model_number,
            equipment_type: m.equipment_type,
            unit_count: m.units.size,
            total_failures: m.failures,
            avg_days_between_failures: avgDays,
            min_days_between: m.daysBetween.length > 0 ? Math.min(...m.daysBetween) : null,
            max_days_between: m.daysBetween.length > 0 ? Math.max(...m.daysBetween) : null,
            callbacks_within_30_days: m.callbacks30,
            failure_rate: m.failures / m.units.size,
          };
        })
        .sort((a, b) => (b.avg_days_between_failures || 0) - (a.avg_days_between_failures || 0));

      setReliabilityData(reliabilityArray);

      // Manufacturer aggregation
      const mfrStats: Record<string, ManufacturerStats> = {};
      reliabilityArray.forEach(r => {
        if (!mfrStats[r.manufacturer]) {
          mfrStats[r.manufacturer] = {
            name: r.manufacturer,
            total_units: 0,
            total_failures: 0,
            avg_mtbf: 0,
          };
        }
        mfrStats[r.manufacturer].total_units += r.unit_count;
        mfrStats[r.manufacturer].total_failures += r.total_failures;
      });

      // Calculate avg MTBF per manufacturer
      const mfrArray = Object.values(mfrStats).map(m => {
        const modelsForMfr = reliabilityArray.filter(r => r.manufacturer === m.name);
        const mtbfValues = modelsForMfr
          .filter(r => r.avg_days_between_failures !== null)
          .map(r => r.avg_days_between_failures as number);

        return {
          ...m,
          avg_mtbf: mtbfValues.length > 0 ? mtbfValues.reduce((a, b) => a + b, 0) / mtbfValues.length : 0,
        };
      }).sort((a, b) => b.avg_mtbf - a.avg_mtbf);

      setManufacturerStats(mfrArray);

      // Summary
      const totalEquip = equipment?.length || 0;
      const totalFailures = reliabilityArray.reduce((sum, r) => sum + r.total_failures, 0);
      const validMTBF = reliabilityArray.filter(r => r.avg_days_between_failures !== null);
      const avgMTBF = validMTBF.length > 0
        ? validMTBF.reduce((sum, r) => sum + (r.avg_days_between_failures || 0), 0) / validMTBF.length
        : 0;

      const mostReliable = reliabilityArray[0];
      const leastReliable = reliabilityArray[reliabilityArray.length - 1];

      setSummary({
        totalEquipment: totalEquip,
        totalFailures,
        avgMTBF,
        mostReliable: mostReliable ? `${mostReliable.manufacturer} ${mostReliable.model_number}` : '-',
        leastReliable: leastReliable ? `${leastReliable.manufacturer} ${leastReliable.model_number}` : '-',
      });
    } catch (error) {
      console.error('Error loading reliability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExportData = (): ExportData | null => {
    if (reliabilityData.length === 0) return null;
    return {
      title: 'Equipment Reliability Report (MTBF)',
      dateRange: { start, end },
      columns: [
        { header: 'Manufacturer', key: 'manufacturer', width: 20 },
        { header: 'Model', key: 'model_number', width: 20 },
        { header: 'Type', key: 'equipment_type', width: 15 },
        { header: 'Units', key: 'unit_count', width: 10 },
        { header: 'Failures', key: 'total_failures', width: 10 },
        { header: 'Avg MTBF (days)', key: 'avg_days_between_failures', width: 15 },
        { header: 'Callbacks <30d', key: 'callbacks_within_30_days', width: 15 },
      ],
      rows: reliabilityData,
      summary: {
        'Total Equipment': summary.totalEquipment,
        'Total Failures': summary.totalFailures,
        'Avg MTBF': `${summary.avgMTBF.toFixed(0)} days`,
        'Most Reliable': summary.mostReliable,
      },
    };
  };

  return (
    <BIPageLayout
      title="Equipment Reliability"
      subtitle="Mean Time Between Failures (MTBF) analysis by manufacturer and model"
      getExportData={getExportData}
      exportEnabled={reliabilityData.length > 0}
    >
      <DateRangeSelector value={dateRange} onChange={setDateRange} />

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Wrench className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Equipment</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalEquipment}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Failures</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.totalFailures}</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Avg MTBF</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.avgMTBF.toFixed(0)} days</p>
                </div>
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Most Reliable</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{summary.mostReliable}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Manufacturer Comparison Chart */}
          <div className="card p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Manufacturer MTBF Comparison
            </h3>
            {manufacturerStats.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={manufacturerStats.slice(0, 10)} margin={{ bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                    <XAxis
                      dataKey="name"
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(0)} days`, 'Avg MTBF']}
                    />
                    <Bar dataKey="avg_mtbf" name="Avg MTBF" fill="#22c55e" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No reliability data available.
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
              Higher MTBF = More reliable equipment. Longer time between service calls.
            </p>
          </div>

          {/* Model Details Table */}
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Model Reliability Rankings</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Sorted by MTBF (best to worst)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Manufacturer</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Model</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Type</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Units</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Failures</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">MTBF (days)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Callbacks &lt;30d</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {reliabilityData.map((row, index) => (
                    <tr key={`${row.manufacturer}-${row.model_number}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {index < 3 ? (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            index === 0 ? 'bg-yellow-100 text-yellow-800' :
                            index === 1 ? 'bg-gray-100 text-gray-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {index + 1}
                          </span>
                        ) : (
                          <span className="text-gray-500">{index + 1}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {row.manufacturer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {row.model_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {row.equipment_type || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {row.unit_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                        {row.total_failures}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <span className={`font-medium ${
                          (row.avg_days_between_failures || 0) >= 180 ? 'text-green-600 dark:text-green-400' :
                          (row.avg_days_between_failures || 0) >= 90 ? 'text-amber-600 dark:text-amber-400' :
                          'text-red-600 dark:text-red-400'
                        }`}>
                          {row.avg_days_between_failures?.toFixed(0) || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {row.callbacks_within_30_days > 0 ? (
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {row.callbacks_within_30_days}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reliabilityData.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No equipment failure data available for the selected period.
              </div>
            )}
          </div>
        </>
      )}
    </BIPageLayout>
  );
}
