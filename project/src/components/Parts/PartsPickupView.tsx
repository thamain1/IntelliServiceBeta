import { useState, useEffect } from 'react';
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  User,
  Calendar,
  ChevronDown,
  ChevronUp,
  PackageCheck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PickListItem {
  item_id: string;
  part_id: string;
  part_number: string;
  part_name: string;
  quantity: number;
  location: string;
  picked_up: boolean;
}

interface PickList {
  pick_list_id: string;
  ticket_id: string;
  ticket_number: string;
  ticket_title: string;
  assigned_to: string | null;
  assigned_tech_name: string | null;
  scheduled_date: string | null;
  customer_name: string;
  pick_list_status: string;
  created_at: string;
  items: PickListItem[];
  total_items: number;
  picked_items: number;
}

export function PartsPickupView() {
  const { profile } = useAuth();
  const [pickLists, setPickLists] = useState<PickList[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedList, setExpandedList] = useState<string | null>(null);
  const [pickingUp, setPickingUp] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'mine'>('mine');

  useEffect(() => {
    loadPickLists();
  }, [profile]);

  const loadPickLists = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vw_parts_ready_for_pickup')
        .select('*');

      if (error) throw error;
      setPickLists((data as unknown as PickList[]) || []);
    } catch (error) {
      console.error('Error loading pick lists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePickup = async (pickList: PickList) => {
    if (!profile?.default_vehicle_id) {
      alert('You do not have a truck assigned. Please contact your dispatcher to assign a vehicle to your profile.');
      return;
    }

    if (!confirm(`Pick up all parts for ticket ${pickList.ticket_number}? Parts will be transferred to your truck inventory.`)) {
      return;
    }

    try {
      setPickingUp(pickList.pick_list_id);

      const { data, error } = await supabase.rpc('fn_pickup_parts_for_ticket', {
        p_ticket_id: pickList.ticket_id,
        p_destination_location_id: profile.default_vehicle_id,
      });

      if (error) throw error;

      const result = data as unknown as { items_transferred?: number } | null;
      alert(`Successfully picked up ${result?.items_transferred ?? 0} item(s). Parts have been added to your truck inventory.`);
      loadPickLists();
    } catch (error: unknown) {
      console.error('Error picking up parts:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to pick up parts: ${message}`);
    } finally {
      setPickingUp(null);
    }
  };

  const filteredPickLists = pickLists.filter((pl) => {
    if (filter === 'mine') {
      return pl.assigned_to === profile?.id;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Parts Ready for Pickup</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Parts staged in Job Staging area waiting for technician pickup
          </p>
        </div>
        <button
          onClick={loadPickLists}
          className="btn btn-outline"
        >
          Refresh
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setFilter('mine')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'mine'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          My Pickups ({pickLists.filter((pl) => pl.assigned_to === profile?.id).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          All Pickups ({pickLists.length})
        </button>
      </div>

      {/* Pick Lists */}
      <div className="space-y-4">
        {filteredPickLists.length === 0 ? (
          <div className="card p-12 text-center">
            <PackageCheck className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Parts Waiting
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {filter === 'mine'
                ? 'You have no parts waiting for pickup.'
                : 'There are no parts staged for pickup at this time.'}
            </p>
          </div>
        ) : (
          filteredPickLists.map((pickList) => {
            const isExpanded = expandedList === pickList.pick_list_id;
            const isPickingUp = pickingUp === pickList.pick_list_id;
            const isMyPickup = pickList.assigned_to === profile?.id;

            return (
              <div
                key={pickList.pick_list_id}
                className={`card overflow-hidden ${
                  isMyPickup ? 'border-l-4 border-l-blue-500' : ''
                }`}
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  onClick={() => setExpandedList(isExpanded ? null : pickList.pick_list_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <Package className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-blue-600 dark:text-blue-400">
                            {pickList.ticket_number}
                          </span>
                          <span className="badge badge-green">
                            {pickList.total_items} items ready
                          </span>
                          {isMyPickup && (
                            <span className="badge badge-blue">Assigned to You</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {pickList.ticket_title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {pickList.customer_name}
                        </p>
                        {pickList.scheduled_date && (
                          <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(pickList.scheduled_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Assignment Info */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Assignment
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Assigned To:</span>
                            <span className="text-gray-900 dark:text-white font-medium">
                              {pickList.assigned_tech_name || 'Unassigned'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Staged:</span>
                            <span className="text-gray-900 dark:text-white">
                              {new Date(pickList.created_at).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-400">Location:</span>
                            <span className="text-gray-900 dark:text-white">Job Staging - Parts Ready</span>
                          </div>
                        </div>
                      </div>

                      {/* Parts List */}
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                          Parts to Pick Up
                        </h4>
                        <div className="space-y-2">
                          {pickList.items?.map((item) => (
                            <div
                              key={item.item_id}
                              className={`flex items-center justify-between p-2 rounded ${
                                item.picked_up
                                  ? 'bg-green-50 dark:bg-green-900/20'
                                  : 'bg-white dark:bg-gray-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {item.picked_up ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Package className="w-4 h-4 text-gray-400" />
                                )}
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {item.part_name}
                                  </p>
                                  <p className="text-xs text-gray-500">{item.part_number}</p>
                                </div>
                              </div>
                              <span className="font-medium text-gray-900 dark:text-white">
                                x{item.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      {(isMyPickup || profile?.role === 'admin' || profile?.role === 'dispatcher') && (
                        <button
                          onClick={() => handlePickup(pickList)}
                          disabled={isPickingUp}
                          className="btn btn-primary flex items-center space-x-2"
                        >
                          {isPickingUp ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              <span>Processing...</span>
                            </>
                          ) : (
                            <>
                              <Truck className="w-4 h-4" />
                              <span>Pickup Parts</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
