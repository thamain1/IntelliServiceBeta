import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  userId: string | null;
  notificationType: string;
  title: string;
  message: string;
  metadata: Record<string, any>;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationCreate {
  userId?: string | null; // null = broadcast to all admins/dispatchers
  notificationType: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Create a notification
   */
  static async createNotification(notification: NotificationCreate): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId || null,
          notification_type: notification.notificationType,
          title: notification.title,
          message: notification.message,
          metadata: notification.metadata || {},
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Error in createNotification:', error);
      return null;
    }
  }

  /**
   * Create multiple notifications (e.g., for broadcasting)
   */
  static async createNotifications(
    notifications: NotificationCreate[]
  ): Promise<number> {
    try {
      const records = notifications.map((n) => ({
        user_id: n.userId || null,
        notification_type: n.notificationType,
        title: n.title,
        message: n.message,
        metadata: n.metadata || {},
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(records)
        .select('id');

      if (error) {
        console.error('Error creating notifications:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in createNotifications:', error);
      return 0;
    }
  }

  /**
   * Get unread notifications for a user
   */
  static async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .or(`user_id.eq.${userId},user_id.is.null`)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching unread notifications:', error);
        return [];
      }

      return (data || []).map(this.mapNotification);
    } catch (error) {
      console.error('Error in getUnreadNotifications:', error);
      return [];
    }
  }

  /**
   * Get all notifications for a user (paginated)
   */
  static async getNotifications(
    userId: string,
    options: { limit?: number; offset?: number; unreadOnly?: boolean } = {}
  ): Promise<{ notifications: Notification[]; total: number }> {
    try {
      const { limit = 20, offset = 0, unreadOnly = false } = options;

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .or(`user_id.eq.${userId},user_id.is.null`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.is('read_at', null);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        return { notifications: [], total: 0 };
      }

      return {
        notifications: (data || []).map(this.mapNotification),
        total: count || 0,
      };
    } catch (error) {
      console.error('Error in getNotifications:', error);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Mark a notification as read
   */
  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        console.error('Error marking notification as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAsRead:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .or(`user_id.eq.${userId},user_id.is.null`)
        .is('read_at', null);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in markAllAsRead:', error);
      return false;
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},user_id.is.null`)
        .is('read_at', null);

      if (error) {
        console.error('Error getting unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error in getUnreadCount:', error);
      return 0;
    }
  }

  /**
   * Broadcast a notification to all users with specific roles
   */
  static async broadcastToRoles(
    roles: string[],
    notification: Omit<NotificationCreate, 'userId'>
  ): Promise<number> {
    try {
      // Get users with the specified roles
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id')
        .in('role', roles);

      if (usersError) {
        console.error('Error fetching users for broadcast:', usersError);
        return 0;
      }

      if (!users || users.length === 0) {
        return 0;
      }

      // Create notifications for each user
      const notifications = users.map((user) => ({
        ...notification,
        userId: user.id,
      }));

      return await this.createNotifications(notifications);
    } catch (error) {
      console.error('Error in broadcastToRoles:', error);
      return 0;
    }
  }

  /**
   * Map database record to Notification interface
   */
  private static mapNotification(record: any): Notification {
    return {
      id: record.id,
      userId: record.user_id,
      notificationType: record.notification_type,
      title: record.title,
      message: record.message,
      metadata: record.metadata || {},
      readAt: record.read_at,
      createdAt: record.created_at,
    };
  }

  /**
   * Get notification type display info
   */
  static getNotificationTypeInfo(type: string): {
    icon: string;
    color: string;
    label: string;
  } {
    switch (type) {
      case 'estimate_accepted':
        return { icon: 'CheckCircle', color: 'green', label: 'Estimate Accepted' };
      case 'estimate_declined':
        return { icon: 'XCircle', color: 'red', label: 'Estimate Declined' };
      case 'ahs_authorization':
        return { icon: 'Shield', color: 'blue', label: 'AHS Authorization' };
      case 'ticket_hold':
        return { icon: 'Pause', color: 'yellow', label: 'Ticket On Hold' };
      case 'parts_request':
        return { icon: 'Package', color: 'purple', label: 'Parts Request' };
      default:
        return { icon: 'Bell', color: 'gray', label: 'Notification' };
    }
  }
}
