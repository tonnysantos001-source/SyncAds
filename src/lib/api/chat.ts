import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Tables, TablesInsert } from '../database.types';

export type ChatMessage = Tables<'ChatMessage'>;
export type ChatMessageInsert = TablesInsert<'ChatMessage'>;

export const chatApi = {
  // Get all messages for a conversation
  getConversationMessages: async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('ChatMessage')
        .select('*')
        .eq('conversationId', conversationId)
        .order('createdAt', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get conversation messages error:', error);
      throw error;
    }
  },

  // Get all conversations for a user
  getUserConversations: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('ChatMessage')
        .select('conversationId, createdAt')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) throw error;

      // Group by conversation ID and get the latest message timestamp
      const conversations = data.reduce((acc: any[], message) => {
        const existing = acc.find(c => c.id === message.conversationId);
        if (!existing) {
          acc.push({
            id: message.conversationId,
            lastMessageAt: message.createdAt,
          });
        }
        return acc;
      }, []);

      return conversations;
    } catch (error) {
      console.error('Get user conversations error:', error);
      throw error;
    }
  },

  // Create a new message
  createMessage: async (
    userId: string,
    conversationId: string,
    role: ChatMessage['role'],
    content: string,
    model?: string,
    tokens?: number
  ) => {
    try {
      const newMessage: ChatMessageInsert = {
        id: uuidv4(),
        userId,
        conversationId,
        role,
        content,
        model: model || null,
        tokens: tokens || null,
        createdAt: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('ChatMessage')
        .insert(newMessage)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create message error:', error);
      throw error;
    }
  },

  // Delete all messages from a conversation
  deleteConversation: async (conversationId: string) => {
    try {
      const { error } = await supabase
        .from('ChatMessage')
        .delete()
        .eq('conversationId', conversationId);

      if (error) throw error;
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  },
};
