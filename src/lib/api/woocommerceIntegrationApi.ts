import { supabase } from '@/lib/supabase';

export const woocommerceIntegrationApi = {
  async connect(siteUrl: string, consumerKey: string, consumerSecret: string) {
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/woocommerce-connect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify({ siteUrl, consumerKey, consumerSecret }),
        }
      );
      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to connect to WooCommerce');
    }
  },

  async getStatus() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return null;

      const { data, error } = await supabase
        .from('WooCommerceIntegration')
        .select('*')
        .eq('userId', user.user.id)
        .eq('isActive', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      return null;
    }
  },

  async sync(action = 'sync-all') {
    try {
      const integration = await this.getStatus();
      if (!integration) throw new Error('No active integration');

      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/woocommerce-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify({ integrationId: integration.id, action }),
        }
      );
      return await response.json();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to sync');
    }
  },

  async disconnect() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('WooCommerceIntegration')
        .update({ isActive: false, updatedAt: new Date().toISOString() })
        .eq('userId', user.user.id)
        .eq('isActive', true);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to disconnect');
    }
  },

  async getProducts(limit = 50) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('WooCommerceProduct')
        .select('*')
        .eq('userId', user.user.id)
        .order('updatedAt', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      return [];
    }
  },

  async getOrders(limit = 50) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      const { data, error } = await supabase
        .from('WooCommerceOrder')
        .select('*')
        .eq('userId', user.user.id)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      return [];
    }
  },
};
