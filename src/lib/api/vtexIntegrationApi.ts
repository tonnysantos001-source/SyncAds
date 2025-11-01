import { supabase } from '@/lib/supabase';

export interface VtexIntegration {
  id: string;
  userId: string;
  accountName: string;
  environment: string;
  appKey: string;
  appToken: string;
  isActive: boolean;
  lastSyncAt?: string;
  lastSyncStatus?: string;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
}

export interface VtexProduct {
  id: string;
  userId: string;
  integrationId: string;
  productId: string;
  name: string;
  description?: string;
  brandId?: string;
  brandName?: string;
  categoryId?: string;
  categoryName?: string;
  linkId?: string;
  isActive: boolean;
  vtexData: any;
  createdAt: string;
  updatedAt: string;
  lastSyncAt: string;
}

export interface VtexOrder {
  id: string;
  userId: string;
  integrationId: string;
  orderId: string;
  sequence?: string;
  status: string;
  value: number;
  currency: string;
  clientEmail?: string;
  clientName?: string;
  vtexData: any;
  createdAt: string;
  updatedAt: string;
  lastSyncAt: string;
}

export const vtexIntegrationApi = {
  async connect(accountName: string, appKey: string, appToken: string, environment: string = 'vtexcommercestable') {
    try {
      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vtex-connect`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify({
            accountName,
            appKey,
            appToken,
            environment,
          }),
        }
      );

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('VTEX connect error:', error);
      throw new Error(error.message || 'Failed to connect to VTEX');
    }
  },

  async getStatus() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('VtexIntegration')
        .select('*')
        .eq('userId', user.user.id)
        .eq('isActive', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error: any) {
      console.error('Get VTEX status error:', error);
      return null;
    }
  },

  async sync(action: 'sync-all' | 'sync-products' | 'sync-orders' = 'sync-all') {
    try {
      const integration = await this.getStatus();
      if (!integration) throw new Error('No active VTEX integration found');

      const session = await supabase.auth.getSession();
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/vtex-sync`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.data.session?.access_token}`,
          },
          body: JSON.stringify({
            integrationId: integration.id,
            action,
          }),
        }
      );

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('VTEX sync error:', error);
      throw new Error(error.message || 'Failed to sync VTEX data');
    }
  },

  async disconnect() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('VtexIntegration')
        .update({
          isActive: false,
          updatedAt: new Date().toISOString(),
        })
        .eq('userId', user.user.id)
        .eq('isActive', true);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('VTEX disconnect error:', error);
      throw new Error(error.message || 'Failed to disconnect VTEX');
    }
  },

  async getProducts(limit: number = 50) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('VtexProduct')
        .select('*')
        .eq('userId', user.user.id)
        .order('updatedAt', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Get VTEX products error:', error);
      throw new Error(error.message || 'Failed to fetch VTEX products');
    }
  },

  async getOrders(limit: number = 50) {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('VtexOrder')
        .select('*')
        .eq('userId', user.user.id)
        .order('createdAt', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Get VTEX orders error:', error);
      throw new Error(error.message || 'Failed to fetch VTEX orders');
    }
  },

  async getStats() {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const integration = await this.getStatus();

      const { count: productsCount } = await supabase
        .from('VtexProduct')
        .select('id', { count: 'exact', head: true })
        .eq('userId', user.user.id);

      const { count: ordersCount } = await supabase
        .from('VtexOrder')
        .select('id', { count: 'exact', head: true })
        .eq('userId', user.user.id);

      return {
        connected: !!integration,
        accountName: integration?.accountName,
        lastSync: integration?.lastSyncAt,
        productsCount: productsCount || 0,
        ordersCount: ordersCount || 0,
      };
    } catch (error: any) {
      console.error('Get VTEX stats error:', error);
      return {
        connected: false,
        productsCount: 0,
        ordersCount: 0,
      };
    }
  },
};
