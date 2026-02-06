import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { NotificationService, Notification } from '../services/NotificationService';

interface UseNotificationsOptions {
  pollInterval?: number; // in milliseconds
  useRealtime?: boolean;
}

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
  hasNew: boolean;
  clearHasNew: () => void;
}

export function useNotifications(
  userId: string | undefined,
  options: UseNotificationsOptions = {}
): UseNotificationsReturn {
  const { pollInterval = 30000, useRealtime = true } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasNew, setHasNew] = useState(false);
  const previousCountRef = useRef(0);

  const loadNotifications = useCallback(async () => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    try {
      const [unreadNotifications, count] = await Promise.all([
        NotificationService.getUnreadNotifications(userId),
        NotificationService.getUnreadCount(userId),
      ]);

      setNotifications(unreadNotifications);

      // Check if there are new notifications
      if (count > previousCountRef.current && previousCountRef.current > 0) {
        setHasNew(true);
      }
      previousCountRef.current = count;
      setUnreadCount(count);
      setError(null);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Initial load
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Polling
  useEffect(() => {
    if (!userId || pollInterval <= 0) return;

    const interval = setInterval(loadNotifications, pollInterval);
    return () => clearInterval(interval);
  }, [userId, pollInterval, loadNotifications]);

  // Realtime subscription
  useEffect(() => {
    if (!userId || !useRealtime) return;

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          const newNotification = payload.new as any;
          // Check if this notification is for the current user or is a broadcast
          if (newNotification.user_id === userId || newNotification.user_id === null) {
            setNotifications((prev) => [
              {
                id: newNotification.id,
                userId: newNotification.user_id,
                notificationType: newNotification.notification_type,
                title: newNotification.title,
                message: newNotification.message,
                metadata: newNotification.metadata || {},
                readAt: newNotification.read_at,
                createdAt: newNotification.created_at,
              },
              ...prev,
            ]);
            setUnreadCount((prev) => prev + 1);
            setHasNew(true);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, useRealtime]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const success = await NotificationService.markAsRead(notificationId);
      if (success) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    []
  );

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;

    const success = await NotificationService.markAllAsRead(userId);
    if (success) {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [userId]);

  const clearHasNew = useCallback(() => {
    setHasNew(false);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
    hasNew,
    clearHasNew,
  };
}
