import { useState, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Clock,
  User,
  Search,
  Filter,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { CRMService, CustomerInteraction } from '../../services/CRMService';
import { supabase } from '../../lib/supabase';

export function InteractionsView() {
  const [loading, setLoading] = useState(true);
  const [followUps, setFollowUps] = useState<CustomerInteraction[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'follow-ups' | 'recent'>('follow-ups');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [followUpsData, recentData] = await Promise.all([
        CRMService.getUpcomingFollowUps(14),
        loadRecentInteractions(),
      ]);

      setFollowUps(followUpsData);
      setRecentInteractions(recentData);
    } catch (err) {
      console.error('Failed to load interactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentInteractions = async () => {
    const { data, error } = await supabase
      .from('customer_interactions')
      .select(`
        *,
        customer:customers(id, name, phone, email),
        creator:profiles!created_by(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'call':
        return Phone;
      case 'email':
        return Mail;
      case 'sms':
        return MessageSquare;
      case 'meeting':
        return Calendar;
      case 'site_visit':
        return MapPin;
      case 'note':
        return FileText;
      default:
        return MessageSquare;
    }
  };

  const getInteractionColor = (type: string) => {
    switch (type) {
      case 'call':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600';
      case 'email':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600';
      case 'sms':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600';
      case 'meeting':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600';
      case 'site_visit':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600';
      case 'note':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600';
    }
  };

  const isOverdue = (date: string) => {
    return new Date(date) < new Date(new Date().toISOString().split('T')[0]);
  };

  const isToday = (date: string) => {
    return date === new Date().toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('follow-ups')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'follow-ups'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Upcoming Follow-ups
          {followUps.length > 0 && (
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600">
              {followUps.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'recent'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Recent Activity
        </button>
      </div>

      {/* Follow-ups Tab */}
      {activeTab === 'follow-ups' && (
        <div className="space-y-4">
          {followUps.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Pending Follow-ups</h3>
              <p className="text-gray-500 mt-2">All follow-ups are up to date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followUps.map((interaction) => {
                const Icon = getInteractionIcon(interaction.interaction_type);
                const overdue = isOverdue(interaction.follow_up_date!);
                const today = isToday(interaction.follow_up_date!);

                return (
                  <div
                    key={interaction.id}
                    className={`card p-4 border-l-4 ${
                      overdue
                        ? 'border-l-red-500'
                        : today
                        ? 'border-l-yellow-500'
                        : 'border-l-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getInteractionColor(interaction.interaction_type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {interaction.subject || 'Follow-up'}
                            </span>
                            {overdue && (
                              <span className="flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-red-100 dark:bg-red-900/30 text-red-600">
                                <AlertCircle className="w-3 h-3" />
                                Overdue
                              </span>
                            )}
                            {today && (
                              <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600">
                                Today
                              </span>
                            )}
                          </div>
                          {interaction.notes && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{interaction.notes}</p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(interaction.follow_up_date!).toLocaleDateString()}
                            </span>
                            {interaction.creator?.full_name && (
                              <span className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                {interaction.creator.full_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button className="btn btn-outline btn-sm">
                        Complete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Recent Activity Tab */}
      {activeTab === 'recent' && (
        <div className="space-y-3">
          {recentInteractions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Recent Interactions</h3>
              <p className="text-gray-500 mt-2">Start logging customer interactions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentInteractions.map((interaction) => {
                const Icon = getInteractionIcon(interaction.interaction_type);

                return (
                  <div key={interaction.id} className="card p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${getInteractionColor(interaction.interaction_type)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {interaction.customer?.name || 'Unknown Customer'}
                            </span>
                            <span className="text-gray-400 mx-2">-</span>
                            <span className="text-sm text-gray-500 capitalize">
                              {interaction.interaction_type.replace('_', ' ')}
                            </span>
                            {interaction.direction && (
                              <span className="text-sm text-gray-400 ml-1">
                                ({interaction.direction})
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(interaction.created_at).toLocaleString()}
                          </span>
                        </div>
                        {interaction.subject && (
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-1">
                            {interaction.subject}
                          </p>
                        )}
                        {interaction.notes && (
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">{interaction.notes}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          {interaction.outcome && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
                              {interaction.outcome}
                            </span>
                          )}
                          {interaction.duration_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {interaction.duration_minutes} min
                            </span>
                          )}
                          {interaction.creator?.full_name && (
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {interaction.creator.full_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
