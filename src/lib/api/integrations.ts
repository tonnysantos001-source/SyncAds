import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';
import type { Tables, TablesInsert } from '../database.types';

export type Integration = Tables<'Integration'>;
export type IntegrationInsert = TablesInsert<'Integration'>;

export const integrationsApi = {
  // Get all integrations for the current user
  getIntegrations: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('Integration')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get integrations error:', error);
      throw error;
    }
  },

  // Create or update an integration
  upsertIntegration: async (
    userId: string,
    platform: Integration['platform'],
    isConnected: boolean,
    credentials?: any
  ) => {
    try {
      // Check if integration already exists
      const { data: existing } = await supabase
        .from('Integration')
        .select('id')
        .eq('userId', userId)
        .eq('platform', platform)
        .single();

      const now = new Date().toISOString();

      if (existing) {
        // Update existing integration
        const { data, error } = await supabase
          .from('Integration')
          .update({
            isConnected,
            credentials: credentials || null,
            updatedAt: now,
            lastSyncAt: isConnected ? now : null,
            syncStatus: isConnected ? 'success' : null,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new integration
        const newIntegration: IntegrationInsert = {
          id: uuidv4(),
          userId,
          platform,
          isConnected,
          credentials: credentials || null,
          createdAt: now,
          updatedAt: now,
          lastSyncAt: isConnected ? now : null,
          syncStatus: isConnected ? 'success' : null,
        };

        const { data, error } = await supabase
          .from('Integration')
          .insert(newIntegration)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Upsert integration error:', error);
      throw error;
    }
  },

  // Delete an integration
  deleteIntegration: async (id: string) => {
    try {
      const { error } = await supabase
        .from('Integration')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Delete integration error:', error);
      throw error;
    }
  },
};
