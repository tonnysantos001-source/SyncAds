import { supabase } from '@/lib/supabase';

export const mercadolivreIntegrationApi = {
  async startOAuth() {
    const session = await supabase.auth.getSession();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercadolivre-oauth?action=start`,
      {
        headers: {
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
      }
    );
    return await response.json();
  },

  async getStatus() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    const { data } = await supabase
      .from('MercadoLivreIntegration')
      .select('*')
      .eq('userId', user.user.id)
      .eq('isActive', true)
      .single();

    return data;
  },

  async sync() {
    const integration = await this.getStatus();
    if (!integration) throw new Error('No active integration');

    const session = await supabase.auth.getSession();
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mercadolivre-sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.data.session?.access_token}`,
        },
        body: JSON.stringify({ integrationId: integration.id }),
      }
    );
    return await response.json();
  },

  async disconnect() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('MercadoLivreIntegration')
      .update({ isActive: false })
      .eq('userId', user.user.id);

    if (error) throw error;
    return { success: true };
  },
};
