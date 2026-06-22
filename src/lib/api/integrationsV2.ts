import { supabase } from '../supabase';

export interface IntegrationDB {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  logo_url: string | null;
  status: string;
  implemented: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserIntegrationConfig {
  id: string;
  user_id: string;
  integration_id: string;
  credentials_encrypted: string | null;
  status: 'connected' | 'disconnected' | 'pending' | 'failed';
  last_test_at: string | null;
  created_at: string;
  updated_at: string;
}

export const integrationsV2Api = {
  // Fetch all active integrations from the DB
  getAvailableIntegrations: async (): Promise<IntegrationDB[]> => {
    try {
      const { data, error } = await supabase
        .from('integrations')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching available integrations:', error);
      return [];
    }
  },

  // Fetch the user configs from the DB
  getUserConfigs: async (userId: string): Promise<UserIntegrationConfig[]> => {
    try {
      const { data, error } = await supabase
        .from('integration_configs')
        .select('*')
        .eq('user_id', userId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user configs:', error);
      return [];
    }
  },

  // Save/Update user config
  upsertUserConfig: async (
    userId: string,
    integrationId: string,
    status: UserIntegrationConfig['status'],
    credentials?: any
  ): Promise<UserIntegrationConfig | null> => {
    try {
      const credentials_encrypted = credentials ? JSON.stringify(credentials) : null;
      
      const { data: existing } = await supabase
        .from('integration_configs')
        .select('id')
        .eq('user_id', userId)
        .eq('integration_id', integrationId)
        .maybeSingle();

      const now = new Date().toISOString();

      if (existing) {
        const { data, error } = await supabase
          .from('integration_configs')
          .update({
            status,
            credentials_encrypted,
            updated_at: now,
          })
          .eq('id', existing.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('integration_configs')
          .insert({
            user_id: userId,
            integration_id: integrationId,
            status,
            credentials_encrypted,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error upserting user integration config:', error);
      throw error;
    }
  },

  // Remove/disconnect user config
  disconnectConfig: async (userId: string, integrationId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('integration_configs')
        .delete()
        .eq('user_id', userId)
        .eq('integration_id', integrationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error disconnecting integration config:', error);
      throw error;
    }
  }
};
