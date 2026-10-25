import { supabase } from '../supabase';
import { Notification } from '../../types/database';

export const notificationsApi = {
  async getNotifications(userId?: string): Promise<Notification[]> {
    let currentUserId = userId;
    if (!currentUserId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];
      currentUserId = user.id;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Failed to fetch notifications from Supabase:', e);
      return [];
    }
  },

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    } catch (e) {
      console.warn('Failed to mark notification as read:', e);
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Failed to mark all notifications as read:', e);
    }
  },

  async clearNotifications(userId: string): Promise<void> {
    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);
    } catch (e) {
      console.warn('Failed to clear notifications:', e);
    }
  },
};
