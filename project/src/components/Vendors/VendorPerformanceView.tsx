import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Tables } from '../../lib/dbTypes';

interface PerformanceMetric {
  metric: string;
  metricLabel: string;
  target: number;
  actual: number | null;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  status: 'good' | 'warning' | 'critical' | 'unknown';
}

interface VendorPerformanceViewProps {
  vendorId?: string;
}

export function VendorPerformanceView({ vendorId }: VendorPerformanceViewProps) {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [vendors, setVendors] = useState<Tables<'vendors'>[]>([]);

  useEffect(() => {
    loadPerformanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorId]);

  const loadPerformanceData = async () => {
    try {
      if (vendorId) {
        await loadVendorPerformance(vendorId);
      } else {
        await loadAllVendorsPerformance();
      }
    } catch (error) {
      console.error('Error loading performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadVendorPerformance = async (id: string) => {
    const { data: slas } = await supabase
      .from('vendor_contract_slas')
      .select(`
        *,
        vendor_contracts!inner(vendor_id, status)
      `)
      .eq('vendor_contracts.vendor_id', id)
      .eq('vendor_contracts.status', 'active');

    const performanceMetrics: PerformanceMetric[] = [];

    if (slas && slas.length > 0) {
      slas.forEach((sla: { metric: string; target_value: number; target_unit: string }) => {
        performanceMetrics.push({
          metric: sla.metric,
          metricLabel: formatMetricLabel(sla.metric),
          target: Number(sla.target_value),
          actual: null,
          unit: sla.target_unit,
          trend: 'stable',
          status: 'unknown',
        });
      });
    } else {
      performanceMetrics.push(
        {
          metric: 'on_time_delivery',
          metricLabel: 'On-Time Delivery',
          target: 95,
          actual: null,
          unit: '%',
          trend: 'stable',
          status: 'unknown',
        },
        {
          metric: 'fill_rate',
          metricLabel: 'Fill Rate',
          target: 98,
          actual: null,
          unit: '%',
          trend: 'stable',
          status: 'unknown',
        },
        {
          metric: 'quality_defect_rate',
          metricLabel: 'Quality Defect Rate',
          target: 2,
          actual: null,
          unit: '%',
          trend: 'stable',
          status: 'unknown',
        }
      );
    }

    setMetrics(performanceMetrics);
  };

  const loadAllVendorsPerformance = async () => {
    const { data } = await supabase
      .from('vendors')
      .select('id, display_name, vendor_code, rating, status')
      .eq('status', 'active')
      .order('display_name');

    setVendors(data || []);
  };

  const formatMetricLabel = (metric: string): string => {
    return metric
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'critical':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (vendorId) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Metrics</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Track vendor performance against contract SLAs
          </p>
        </div>

        {metrics.length === 0 ? (
          <div className="card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No SLA Metrics Configured
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Configure SLA targets in the vendor's contracts to track performance metrics.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.map((metric, index) => (
              <div key={index} className="card">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {metric.metricLabel}
                    </h3>
                    {getTrendIcon(metric.trend)}
                  </div>

                  <div className="mb-4">
                    {metric.actual !== null ? (
                      <>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                          {metric.actual}{metric.unit}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Target: {metric.target}{metric.unit}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-2xl font-medium text-gray-400 dark:text-gray-500">
                          N/A
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Insufficient data
                        </div>
                      </>
                    )}
                  </div>

                  <div className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getStatusColor(metric.status)}`}>
                    {metric.status === 'unknown' ? 'Not Measured' : metric.status.charAt(0).toUpperCase() + metric.status.slice(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card p-6 mt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Performance Data Requirements
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Actual performance metrics are calculated from purchase orders, receiving records, and quality inspections.
                Configure SLA targets in vendor contracts and ensure data is being captured in these modules to see real-time performance scores.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">All Vendor Performance Scores</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {vendors.length} active vendors
        </p>
      </div>

      {vendors.length === 0 ? (
        <div className="card p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Active Vendors
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Add vendors to track their performance metrics.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Overall Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {vendor.display_name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {vendor.vendor_code}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {vendor.rating ? (
                        <div className="flex items-center">
                          <span className="text-2xl font-bold text-gray-900 dark:text-white mr-2">
                            {vendor.rating.toFixed(1)}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">/ 5.0</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Not rated</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
