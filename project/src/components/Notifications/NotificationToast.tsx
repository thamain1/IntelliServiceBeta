import { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle,
  XCircle,
  Shield,
  Pause,
  Package,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationService, Notification } from '../../services/NotificationService';
import { useAuth } from '../../contexts/AuthContext';

export function NotificationToast() {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    hasNew,
    clearHasNew,
    markAsRead,
    markAllAsRead,
  } = useNotifications(user?.id, { pollInterval: 30000, useRealtime: true });

  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);

  // Show toast when new notification arrives
  useEffect(() => {
    if (hasNew && notifications.length > 0) {
      setLatestNotification(notifications[0]);
      setShowToast(true);
      clearHasNew();

      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [hasNew, notifications, clearHasNew]);

  const getIcon = (type: string) => {
    const iconClass = 'h-5 w-5';
    switch (type) {
      case 'estimate_accepted':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'estimate_declined':
        return <XCircle className={`${iconClass} text-red-500`} />;
      case 'ahs_authorization':
        return <Shield className={`${iconClass} text-blue-500`} />;
      case 'ticket_hold':
        return <Pause className={`${iconClass} text-yellow-500`} />;
      case 'parts_request':
        return <Package className={`${iconClass} text-purple-500`} />;
      default:
        return <Bell className={`${iconClass} text-gray-500`} />;
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notificationDate.toLocaleDateString();
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);

    // Navigate based on notification type
    if (notification.metadata?.ticketId) {
      // Could integrate with router to navigate to ticket
      console.log('Navigate to ticket:', notification.metadata.ticketId);
    } else if (notification.metadata?.estimateId) {
      console.log('Navigate to estimate:', notification.metadata.estimateId);
    }
  };

  return (
    <>
      {/* Notification Bell Button */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Bell className="h-6 w-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Dropdown Panel */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-96">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No new notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification)}
                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-start">
                          <div className="flex-shrink-0 mt-1">
                            {getIcon(notification.notificationType)}
                          </div>
                          <div className="ml-3 flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatTime(notification.createdAt)}
                            </p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="ml-2 text-gray-400 hover:text-gray-600"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Toast Notification */}
      {showToast && latestNotification && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getIcon(latestNotification.notificationType)}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {latestNotification.title}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  {latestNotification.message}
                </p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="ml-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-3 flex space-x-2">
              <button
                onClick={() => {
                  handleNotificationClick(latestNotification);
                  setShowToast(false);
                }}
                className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View
              </button>
              <button
                onClick={() => {
                  markAsRead(latestNotification.id);
                  setShowToast(false);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSS for animation */}
      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
