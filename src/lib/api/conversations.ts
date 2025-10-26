import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Tables, TablesInsert, TablesUpdate } from '../database.types';

export type ChatConversation = Tables<'ChatConversation'>;
export type ChatConversationInsert = TablesInsert<'ChatConversation'>;
export type ChatConversationUpdate = TablesUpdate<'ChatConversation'>;

export const conversationsApi = {
  // Get all conversations for a user
  getConversations: async (userId: string): Promise<ChatConversation[]> => {
    try {
      const { data, error } = await supabase
        .from('ChatConversation')
        .select('*')
        .eq('userId', userId)
        .order('updatedAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get conversations error:', error);
      throw error;
    }
  },

  // Create a new conversation (SIMPLIFIED - sem organizationId necessário)
  createConversation: async (
    userId: string,
    title: string
  ): Promise<ChatConversation> => {
    try {
      const now = new Date().toISOString();
      const newConversation: ChatConversationInsert = {
        id: uuidv4(),
        userId,
        title,
        createdAt: now,
        updatedAt: now,
        // organizationId não é mais obrigatório
      };

      const { data, error } = await supabase
        .from('ChatConversation')
        .insert(newConversation)
        .select()
        .single();

      if (error) {
        console.error('Create conversation error:', error);
        throw error;
      }
      return data;
    } catch (error: any) {
      console.error('Create conversation error:', error);
      // Se erro é "organization required", criar sem organization
      if (error.message?.includes('organization') || error.message?.includes('Usuário sem organização')) {
        console.warn('Retrying without organization...');
        // Retry simplified
        const now = new Date().toISOString();
        const { data, error: retryError } = await supabase
          .from('ChatConversation')
          .insert({
            id: uuidv4(),
            userId,
            title,
            createdAt: now,
            updatedAt: now,
          })
          .select()
          .single();
        
        if (retryError) {
          throw retryError;
        }
        return data;
      }
      throw error;
    }
  },

  // Update conversation title
  updateConversation: async (
    id: string,
    title: string
  ): Promise<ChatConversation> => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('ChatConversation')
        .update({
          title,
          updatedAt: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update conversation error:', error);
      throw error;
    }
  },

  // Delete a conversation (this will cascade delete all messages)
  deleteConversation: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('ChatConversation')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete conversation error:', error);
      throw error;
    }
  },

  // Touch conversation (update updatedAt timestamp)
  touchConversation: async (id: string): Promise<void> => {
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('ChatConversation')
        .update({ updatedAt: now })
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Touch conversation error:', error);
      throw error;
    }
  },
};
