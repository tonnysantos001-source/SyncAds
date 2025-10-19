import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Tables, TablesInsert, TablesUpdate } from '../database.types';

export type AiConnection = Tables<'AiConnection'>;
export type AiConnectionInsert = TablesInsert<'AiConnection'>;
export type AiConnectionUpdate = TablesUpdate<'AiConnection'>;

export const aiConnectionsApi = {
  // Get all AI connections for the current user
  getConnections: async (userId: string): Promise<AiConnection[]> => {
    try {
      const { data, error } = await supabase
        .from('AiConnection')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Get AI connections error:', error);
      throw error;
    }
  },

  // Create a new AI connection
  createConnection: async (
    userId: string,
    connectionData: Omit<AiConnectionInsert, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
  ): Promise<AiConnection> => {
    try {
      const now = new Date().toISOString();
      const newConnection: AiConnectionInsert = {
        id: uuidv4(),
        userId,
        ...connectionData,
        createdAt: now,
        updatedAt: now,
      };

      const { data, error } = await supabase
        .from('AiConnection')
        .insert(newConnection)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Create AI connection error:', error);
      throw error;
    }
  },

  // Update an AI connection
  updateConnection: async (
    id: string,
    connectionData: Partial<Omit<AiConnection, 'id' | 'userId' | 'createdAt'>>
  ): Promise<AiConnection> => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('AiConnection')
        .update({
          ...connectionData,
          updatedAt: now,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Update AI connection error:', error);
      throw error;
    }
  },

  // Delete an AI connection
  deleteConnection: async (id: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('AiConnection')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete AI connection error:', error);
      throw error;
    }
  },
};
