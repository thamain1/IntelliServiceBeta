import { useState, useEffect, useCallback } from 'react';
import { Clock, CheckCircle, AlertCircle, Package } from 'lucide-react';
import { PartsOrderingService, VendorLeadTimeMetrics } from '../../services/PartsOrderingService';
import { supabase } from '../../lib/supabase';

interface Vendor {
  id: string;
  name: string;
}

export function LeadTimeReportsView() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<VendorLeadTimeMetrics[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState('all');

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);

      const data = await PartsOrderingService.getVendorLeadTimeMetrics({
        vendorId: selectedVendor !== 'all' ? selectedVendor : undefined,
      });

      setMetrics(data);
    } catch (error) {
      console.error('Error loading lead time metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedVendor]);

  useEffect(() => {
    loadVendors();
    loadMetrics();
  }, [selectedVendor, loadMetrics]);

  const loadVendors = async () => {
    try {
      const { data, error } = await supabase
        .from('vendors')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error loading vendors:', error);
    }
  };

  // Unused date formatting - kept for future use

  const getPerformanceBadge = (onTimePct: number | null) => {
    if (onTimePct === null) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-50 dark:bg-gray-900/20 text-gray-600 dark:text-gray-400">
          No Data
        </span>
      );
    }

    if (onTimePct >= 95) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          Excellent
        </span>
      );
    }

    if (onTimePct >= 85) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
          <CheckCircle className="w-3 h-3 mr-1" />
          Good
        </span>
      );
    }

    if (onTimePct >= 70) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
          <Clock className="w-3 h-3 mr-1" />
          Fair
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
        <AlertCircle className="w-3 h-3 mr-1" />
        Poor
      </span>
    );
  };

  const overallAvgLeadTime = metrics.length > 0
    ? (metrics.reduce((sum, m) => sum + (m.avgLeadDays || 0), 0) / metrics.length).toFixed(1)
    : '0';

  const overallOnTimePct = metrics.length > 0
    ? (metrics.reduce((sum, m) => sum + (m.onTimePct || 0), 0) / metrics.length).toFixed(1)
    : '0';

  const overallFillRatePct = metrics.length > 0
    ? (metrics.reduce((sum, m) => sum + (m.fillRatePct || 0), 0) / metrics.length).toFixed(1)
    : '0';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Lead Time Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track and analyze vendor delivery performance and reliability
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Lead Time</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {overallAvgLeadTime} days
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">On-Time Delivery</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {overallOnTimePct}%
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Fill Rate</p>
                <p className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                  {overallFillRatePct}%
                </p>
              </div>
              <div className="p-3 bg-teal-50 dark:bg-teal-900/20 rounded-lg">
                <Package className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            className="input md:w-64"
          >
            <option value="all">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {metrics.length === 0 ? (
        <div className="card p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No lead time data available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Lead time metrics will appear once purchase orders are received from vendors
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
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Performance
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    PO Lines
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Avg Lead
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Median
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    P90
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Range
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    On-Time %
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Fill Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {metrics.map((metric) => (
                  <tr key={metric.vendorId} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {metric.vendorName}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {metric.vendorCode}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {getPerformanceBadge(metric.onTimePct)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {metric.receivedPoLines} / {metric.totalPoLines}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {metric.avgLeadDays?.toFixed(1) || '-'} d
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {metric.medianLeadDays?.toFixed(1) || '-'} d
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {metric.p90LeadDays?.toFixed(1) || '-'} d
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {metric.minLeadDays || '-'} - {metric.maxLeadDays || '-'} d
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-sm font-medium ${
                        (metric.onTimePct || 0) >= 85
                          ? 'text-green-600 dark:text-green-400'
                          : (metric.onTimePct || 0) >= 70
                          ? 'text-yellow-600 dark:text-yellow-400'
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {metric.onTimePct?.toFixed(1) || '-'}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {metric.fillRatePct?.toFixed(1) || '-'}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {metrics.length} vendor{metrics.length !== 1 ? 's' : ''}
        </span>
        <span className="text-xs">
          Based on PO data from the last 365 days
        </span>
      </div>
    </div>
  );
}
