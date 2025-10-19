import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Tables, TablesInsert } from '../database.types';

export type Notification = Tables<'Notification'>;
export type NotificationInsert = TablesInsert<'Notification'>;

export const notificationsApi = {
  // Get all notifications for a user
  getNotifications: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('Notification')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  // Get unread notifications count
  getUnreadCount: async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('Notification')
        .select('*', { count: 'exact', head: true })
        .eq('userId', userId)
        .eq('isRead', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  },

  // Create a new notification
  createNotification: async (
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    actionUrl?: string,
    metadata?: any
  ) => {
    try {
      const newNotification: NotificationInsert = {
        id: uuidv4(),
        userId,
        type,
        title,
        message,
        actionUrl: actionUrl || null,
        metadata: metadata || null,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('Notification')
        .insert(newNotification)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create notification error:', error);
      throw error;
    }
  },

  // Mark a notification as read
  markAsRead: async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('Notification')
        .update({
          isRead: true,
          readAt: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Mark as read error:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  markAllAsRead: async (userId: string) => {
    try {
      const { error } = await supabase
        .from('Notification')
        .update({
          isRead: true,
          readAt: new Date().toISOString(),
        })
        .eq('userId', userId)
        .eq('isRead', false);

      if (error) throw error;
    } catch (error) {
      console.error('Mark all as read error:', error);
      throw error;
    }
  },

  // Delete a notification
  deleteNotification: async (id: string) => {
    try {
      const { error } = await supabase
        .from('Notification')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete notification error:', error);
      throw error;
    }
  },
};
