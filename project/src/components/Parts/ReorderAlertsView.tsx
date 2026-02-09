import { useState, useEffect } from 'react';
import { AlertTriangle, Package, CheckCircle, XCircle, Clock, ShoppingCart, Zap, TrendingDown } from 'lucide-react';
import { PartsOrderingService, ReorderAlert } from '../../services/PartsOrderingService';
import { supabase } from '../../lib/supabase';

interface Location {
  id: string;
  name: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface GeneratedPO {
  out_po_id: string;
  out_po_number: string;
  out_vendor_id: string;
  out_vendor_name: string;
  out_line_count: number;
  out_total_amount: number;
}

export function ReorderAlertsView() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<ReorderAlert[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [creatingPO, setCreatingPO] = useState<string | null>(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState('all');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadLocations();
    loadVendors();
    loadAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLocation, selectedVendor, filterType]);

  const loadLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('stock_locations')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error loading locations:', error);
    }
  };

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

  const loadAlerts = async () => {
    try {
      setLoading(true);

      const params: { locationId?: string; vendorId?: string; criticalOnly?: boolean; belowRopOnly?: boolean; stockoutsOnly?: boolean } = {
        locationId: selectedLocation !== 'all' ? selectedLocation : undefined,
        vendorId: selectedVendor !== 'all' ? selectedVendor : undefined,
      };

      if (filterType === 'critical') {
        params.criticalOnly = true;
      } else if (filterType === 'below_rop') {
        params.belowRopOnly = true;
      } else if (filterType === 'stockout') {
        params.stockoutsOnly = true;
      }

      const data = await PartsOrderingService.getReorderAlerts(params);
      setAlerts(data);
    } catch (error) {
      console.error('Error loading reorder alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPOFromAlert = async (reorderAlert: ReorderAlert) => {
    if (!reorderAlert.vendorId) {
      window.alert('No preferred vendor configured for this part. Please set up a vendor mapping first.');
      return;
    }

    try {
      setCreatingPO(`${reorderAlert.partId}-${reorderAlert.locationId}`);

      const { data: _poData, error } = await supabase.rpc('fn_create_po_from_alert', {
        p_part_id: reorderAlert.partId,
        p_location_id: reorderAlert.locationId,
        p_quantity: Math.ceil(reorderAlert.suggestedOrderQty),
      });

      if (error) throw error;

      setSuccessMessage(`PO created for ${reorderAlert.partNumber}`);
      setTimeout(() => setSuccessMessage(null), 3000);

      // Refresh alerts
      loadAlerts();
    } catch (error: unknown) {
      console.error('Error creating PO:', error);
      window.alert(error instanceof Error ? error.message : 'Failed to create PO');
    } finally {
      setCreatingPO(null);
    }
  };

  const generateAllPOs = async () => {
    const alertsToProcess = alerts.filter(a => a.belowReorderPoint && a.vendorId);

    if (alertsToProcess.length === 0) {
      window.alert('No alerts with configured vendors to generate POs for.');
      return;
    }

    if (!confirm(`This will generate draft POs for ${alertsToProcess.length} items below reorder point. Continue?`)) {
      return;
    }

    try {
      setGeneratingAll(true);

      const { data, error } = await supabase.rpc('fn_generate_reorder_pos', {
        p_location_id: selectedLocation !== 'all' ? selectedLocation : null,
        p_vendor_id: selectedVendor !== 'all' ? selectedVendor : null,
      });

      if (error) throw error;

      const pos = data as GeneratedPO[];
      if (pos && pos.length > 0) {
        const totalLines = pos.reduce((sum, po) => sum + po.out_line_count, 0);
        const totalAmount = pos.reduce((sum, po) => sum + po.out_total_amount, 0);
        setSuccessMessage(
          `Generated ${pos.length} draft PO(s) with ${totalLines} line items totaling ${formatCurrency(totalAmount)}`
        );
      } else {
        setSuccessMessage('No POs were generated. All items may already have pending orders.');
      }

      setTimeout(() => setSuccessMessage(null), 5000);

      // Refresh alerts
      loadAlerts();
    } catch (error: unknown) {
      console.error('Error generating POs:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate POs');
    } finally {
      setGeneratingAll(false);
    }
  };

  const getStatusBadge = (alert: ReorderAlert) => {
    if (alert.isStockout) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <XCircle className="w-3 h-3 mr-1" />
          Stockout
        </span>
      );
    }

    if (alert.belowReorderPoint) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Below ROP
        </span>
      );
    }

    if (alert.onHand <= 10) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
          <Clock className="w-3 h-3 mr-1" />
          Low
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
        <CheckCircle className="w-3 h-3 mr-1" />
        OK
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const criticalAlerts = alerts.filter(a => a.isStockout || a.belowReorderPoint);
  const lowStockAlerts = alerts.filter(a => !a.isStockout && !a.belowReorderPoint && a.onHand <= 10);
  const alertsWithVendors = criticalAlerts.filter(a => a.vendorId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Reorder Alerts</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor inventory levels and receive reorder recommendations
          </p>
        </div>
        {alertsWithVendors.length > 0 && (
          <button
            onClick={generateAllPOs}
            disabled={generatingAll}
            className="btn btn-primary flex items-center gap-2"
          >
            {generatingAll ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate All POs ({alertsWithVendors.length})
              </>
            )}
          </button>
        )}
      </div>

      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2" />
            <span className="text-green-800 dark:text-green-200">{successMessage}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Critical Alerts</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {criticalAlerts.length}
                </p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                  {lowStockAlerts.length}
                </p>
              </div>
              <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Locations</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {locations.length}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Est. Reorder Value</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(
                    criticalAlerts.reduce((sum, a) => sum + (a.unitCost * a.suggestedOrderQty), 0)
                  )}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <TrendingDown className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="input md:w-64"
          >
            <option value="all">All Locations</option>
            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>

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

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="input md:w-48"
          >
            <option value="all">All Status</option>
            <option value="stockout">Stockouts Only</option>
            <option value="below_rop">Below Reorder Point</option>
            <option value="critical">Critical (≤5)</option>
          </select>
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="card p-8 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No alerts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            All inventory levels are within normal ranges for the selected filters
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Part
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    On Hand
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Reserved
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ROP
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Suggested
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Est. Cost
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-50 dark:bg-gray-700 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {alerts.map((alert, idx) => {
                  const alertKey = `${alert.partId}-${alert.locationId}`;
                  const isCreating = creatingPO === alertKey;

                  return (
                    <tr key={`${alertKey}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-4 py-4">
                        {getStatusBadge(alert)}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {alert.partNumber}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                          {alert.description}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {alert.locationName}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {alert.locationType}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`text-sm font-medium ${
                          alert.onHand === 0
                            ? 'text-red-600 dark:text-red-400'
                            : alert.onHand <= alert.reorderPoint
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {alert.onHand}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {alert.reserved}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {alert.reorderPoint}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                          {Math.ceil(alert.suggestedOrderQty)}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {alert.vendorName ? (
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {alert.vendorName}
                            </div>
                            {alert.leadDays > 0 && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {alert.leadDays}d lead time
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400 italic">No vendor</span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {formatCurrency(alert.unitCost * alert.suggestedOrderQty)}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center sticky right-0 bg-white dark:bg-gray-800 shadow-[-4px_0_6px_-2px_rgba(0,0,0,0.1)]">
                        {alert.belowReorderPoint && alert.vendorId ? (
                          <button
                            onClick={() => createPOFromAlert(alert)}
                            disabled={isCreating}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isCreating ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            ) : (
                              <>
                                <ShoppingCart className="w-3 h-3 mr-1" />
                                Create PO
                              </>
                            )}
                          </button>
                        ) : alert.belowReorderPoint && !alert.vendorId ? (
                          <span className="text-xs text-gray-400">Set vendor first</span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
        <span>
          Showing {alerts.length} alert{alerts.length !== 1 ? 's' : ''}
        </span>
        <span>
          {alertsWithVendors.length} item{alertsWithVendors.length !== 1 ? 's' : ''} ready for PO generation
        </span>
      </div>
    </div>
  );
}
