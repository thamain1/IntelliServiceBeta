import { useEffect, useState, useRef } from 'react';
import { Clock, LogIn, LogOut, User, CheckCircle, XCircle, MapPin, MapPinOff } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { GeolocationService, GeolocationPosition } from '../../services/GeolocationService';
import type { Database } from '../../lib/database.types';

type TimeLog = Database['public']['Tables']['time_logs']['Row'] & {
  profiles?: { full_name: string };
  tickets?: { title: string; ticket_number: string };
  projects?: { name: string };
};

export function TimeClockView() {
  const { profile } = useAuth();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>([]);
  const [activeLog, setActiveLog] = useState<TimeLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [clockActionLoading, setClockActionLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filterDate, setFilterDate] = useState(new Date().toISOString().split('T')[0]);
  const [showAllUsers, setShowAllUsers] = useState(false);

  // Location sharing state
  const [isLocationSharing, setIsLocationSharing] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [lastLocation, setLastLocation] = useState<GeolocationPosition | null>(null);
  const locationSharingStarted = useRef(false);

  const isAdmin = profile?.role === 'admin' || profile?.role === 'dispatcher';

  // 15-minute interval for location updates (900000ms)
  const LOCATION_UPDATE_INTERVAL = 15 * 60 * 1000;

  // Start location sharing with 15-minute intervals
  const startLocationSharing = async () => {
    if (!profile || locationSharingStarted.current) return;

    setLocationError(null);

    const success = await GeolocationService.startAutoUpdates(
      profile.id,
      LOCATION_UPDATE_INTERVAL,
      (position) => {
        setLastLocation(position);
        setIsLocationSharing(true);
        setLocationError(null);
        console.log('[TimeClockView] Location update:', position);
      },
      (error) => {
        console.error('[TimeClockView] Location error:', error);
        setLocationError(error.message);
        setIsLocationSharing(false);
      }
    );

    if (success) {
      locationSharingStarted.current = true;
      setIsLocationSharing(true);
      console.log('[TimeClockView] Location sharing started with 15-minute interval');
    }
  };

  // Stop location sharing
  const stopLocationSharing = () => {
    GeolocationService.stopAutoUpdates();
    locationSharingStarted.current = false;
    setIsLocationSharing(false);
    setLastLocation(null);
    console.log('[TimeClockView] Location sharing stopped');
  };

  useEffect(() => {
    loadTimeLogs();
    checkActiveLog();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate, showAllUsers]);

  // Auto-resume location sharing if already clocked in
  useEffect(() => {
    if (activeLog && profile && !locationSharingStarted.current) {
      console.log('[TimeClockView] Already clocked in, auto-resuming location sharing');
      startLocationSharing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLog, profile]);

  // Cleanup location sharing on unmount
  useEffect(() => {
    return () => {
      if (locationSharingStarted.current) {
        stopLocationSharing();
      }
    };
  }, []);

  const loadTimeLogs = async () => {
    try {
      let query = supabase
        .from('time_logs')
        .select('*, profiles!time_logs_user_id_fkey(full_name), tickets(title, ticket_number), projects(name)')
        .gte('clock_in_time', `${filterDate}T00:00:00`)
        .lte('clock_in_time', `${filterDate}T23:59:59`)
        .order('clock_in_time', { ascending: false });

      if (!showAllUsers && profile) {
        query = query.eq('user_id', profile.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTimeLogs((data as unknown as TimeLog[]) || []);
    } catch (error) {
      console.error('Error loading time logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkActiveLog = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('time_logs')
        .select('*, tickets(title, ticket_number), projects(name)')
        .eq('user_id', profile.id)
        .eq('status', 'active')
        .order('clock_in_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setActiveLog((data as unknown as TimeLog));
    } catch (error) {
      console.error('Error checking active log:', error);
    }
  };

  const handleClockIn = async () => {
    if (!profile || clockActionLoading) return;

    setClockActionLoading(true);
    try {
      const { data: existingActiveLog, error: checkError } = await supabase
        .from('time_logs')
        .select('id')
        .eq('user_id', profile.id)
        .is('clock_out_time', null)
        .maybeSingle();

      if (checkError) {
        console.error('Error checking for active log:', checkError);
        throw checkError;
      }

      if (existingActiveLog) {
        alert('You\'re already clocked in. Please clock out before starting a new shift.');
        return;
      }

      const { error } = await supabase.from('time_logs').insert([{
        user_id: profile.id,
        clock_in_time: new Date().toISOString(),
        status: 'active',
        time_type: 'regular',
      }]);

      if (error) throw error;
      await checkActiveLog();
      await loadTimeLogs();

      // Start location sharing when clocking in
      await startLocationSharing();
    } catch (error) {
      console.error('Error clocking in:', error);
      alert('Failed to clock in. Please try again.');
    } finally {
      setClockActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!activeLog || clockActionLoading) return;

    setClockActionLoading(true);
    try {
      const clockOutTime = new Date();
      const clockInTime = new Date(activeLog.clock_in_time);
      const totalHours = (clockOutTime.getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
      const roundedHours = Math.round(totalHours * 100) / 100;

      console.log('[TimeClockView] Clock out - ID:', activeLog.id);
      console.log('[TimeClockView] Clock in time:', clockInTime);
      console.log('[TimeClockView] Clock out time:', clockOutTime);
      console.log('[TimeClockView] Total hours calculated:', roundedHours);

      const { data, error } = await supabase
        .from('time_logs')
        .update({
          clock_out_time: clockOutTime.toISOString(),
          total_hours: roundedHours,
          status: 'completed',
        })
        .eq('id', activeLog.id)
        .select();

      if (error) {
        console.error('[TimeClockView] Clock out error:', error);
        throw error;
      }

      console.log('[TimeClockView] Clock out success - updated record:', data);

      // Stop location sharing when clocking out
      stopLocationSharing();

      setActiveLog(null);
      await loadTimeLogs();
    } catch (error) {
      console.error('Error clocking out:', error);
      alert('Failed to clock out. Please try again.');
    } finally {
      setClockActionLoading(false);
    }
  };

  const calculateElapsedTime = () => {
    if (!activeLog) return '00:00:00';

    const clockInTime = new Date(activeLog.clock_in_time);
    const diff = currentTime.getTime() - clockInTime.getTime();

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDuration = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const calculateDayTotal = () => {
    return timeLogs
      .filter(log => log.status === 'completed' || log.status === 'approved')
      .reduce((sum, log) => sum + (log.total_hours || 0), 0);
  };

  const approveTimeLog = async (logId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('time_logs')
        .update({
          status: 'approved',
          approved_by: profile?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', logId);

      if (error) throw error;
      await loadTimeLogs();
    } catch (error) {
      console.error('Error approving time log:', error);
      alert('Failed to approve time log');
    }
  };

  const rejectTimeLog = async (logId: string) => {
    if (!isAdmin) return;

    try {
      const { error } = await supabase
        .from('time_logs')
        .update({ status: 'rejected' })
        .eq('id', logId);

      if (error) throw error;
      await loadTimeLogs();
    } catch (error) {
      console.error('Error rejecting time log:', error);
      alert('Failed to reject time log');
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'badge-green';
      case 'completed':
        return 'badge-blue';
      case 'approved':
        return 'badge-green';
      case 'rejected':
        return 'badge-red';
      default:
        return 'badge-gray';
    }
  };

  const getTimeTypeColor = (type: string | null) => {
    switch (type) {
      case 'regular':
        return 'text-blue-600';
      case 'overtime':
        return 'text-orange-600';
      case 'travel':
        return 'text-purple-600';
      case 'on_site':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const dayTotal = calculateDayTotal();
  const completedLogs = timeLogs.filter(log => log.status === 'completed').length;
  const pendingApproval = timeLogs.filter(log => log.status === 'completed').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Time Clock</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Track work hours for payroll and job costing
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-gray-900 dark:text-white font-mono">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {activeLog ? (
        <div className="card p-4 md:p-8 bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-500">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Currently Clocked In</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Since {new Date(activeLog.clock_in_time).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-3xl md:text-5xl font-bold text-green-600 font-mono">
                {calculateElapsedTime()}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Elapsed Time</p>
            </div>
          </div>

          {activeLog.tickets && (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">Working on</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {activeLog.tickets.ticket_number} - {activeLog.tickets.title}
              </p>
            </div>
          )}

          {/* Location Sharing Status */}
          <div className={`rounded-lg p-4 mb-4 flex items-center justify-between ${
            isLocationSharing
              ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700'
              : locationError
                ? 'bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700'
                : 'bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-300 dark:border-yellow-700'
          }`}>
            <div className="flex items-center space-x-3">
              {isLocationSharing ? (
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
              ) : (
                <MapPinOff className="w-5 h-5 text-red-600 dark:text-red-400" />
              )}
              <div>
                <p className={`text-sm font-medium ${
                  isLocationSharing
                    ? 'text-green-800 dark:text-green-300'
                    : locationError
                      ? 'text-red-800 dark:text-red-300'
                      : 'text-yellow-800 dark:text-yellow-300'
                }`}>
                  {isLocationSharing
                    ? 'Location Sharing Active'
                    : locationError
                      ? 'Location Sharing Error'
                      : 'Starting Location Sharing...'}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {isLocationSharing
                    ? `Updates every 15 minutes${lastLocation ? ` • Last update: ${new Date(lastLocation.timestamp).toLocaleTimeString()}` : ''}`
                    : locationError
                      ? locationError
                      : 'Requesting location permission...'}
                </p>
              </div>
            </div>
            {isLocationSharing && lastLocation && (
              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                <p>Accuracy: {Math.round(lastLocation.accuracy)}m</p>
              </div>
            )}
          </div>

          <button
            onClick={handleClockOut}
            disabled={clockActionLoading}
            className="btn bg-red-600 hover:bg-red-700 text-white w-full py-4 text-lg flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clockActionLoading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <LogOut className="w-6 h-6" />
                <span>Clock Out</span>
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="card p-8 text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Not Clocked In</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click below to start tracking your time
          </p>
          <button
            onClick={handleClockIn}
            disabled={clockActionLoading}
            className="btn btn-primary w-full md:w-auto px-12 py-4 text-lg flex items-center justify-center space-x-3 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {clockActionLoading ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>Processing...</span>
              </>
            ) : (
              <>
                <LogIn className="w-6 h-6" />
                <span>Clock In</span>
              </>
            )}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Today's Hours</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                {dayTotal.toFixed(2)}
              </p>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900/20 text-blue-600 p-3 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completed Logs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{completedLogs}</p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/20 text-green-600 p-3 rounded-lg">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Approval</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{pendingApproval}</p>
            </div>
            <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 p-3 rounded-lg">
              <Clock className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              View Date
            </label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="input"
            />
          </div>

          {isAdmin && (
            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showAllUsers}
                  onChange={(e) => setShowAllUsers(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">Show all users</span>
              </label>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {showAllUsers && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Employee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Clock In
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Clock Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Total Hours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {timeLogs.length === 0 ? (
                <tr>
                  <td colSpan={showAllUsers ? 8 : 7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No time logs for this date
                  </td>
                </tr>
              ) : (
                timeLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {showAllUsers && (
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-900 dark:text-white">
                            {log.profiles?.full_name || 'Unknown'}
                          </span>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white">
                        {new Date(log.clock_in_time).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-900 dark:text-white">
                        {log.clock_out_time
                          ? new Date(log.clock_out_time).toLocaleTimeString()
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {log.total_hours ? formatDuration(log.total_hours) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${getTimeTypeColor(log.time_type)}`}>
                        {(log.time_type ?? 'work').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {log.tickets
                          ? `${log.tickets.ticket_number}`
                          : log.projects
                          ? log.projects.name
                          : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`badge ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4">
                        {log.status === 'completed' && (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => approveTimeLog(log.id)}
                              className="btn btn-primary p-2"
                              title="Approve"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => rejectTimeLog(log.id)}
                              className="btn btn-outline p-2 text-red-600"
                              title="Reject"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {timeLogs.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Total for {new Date(filterDate).toLocaleDateString()}:
            </span>
            <span className="text-xl font-bold text-blue-600">
              {dayTotal.toFixed(2)} hours
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
