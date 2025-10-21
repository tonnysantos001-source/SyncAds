import { create } from 'zustand';
import { integrationsApi, Integration } from '@/lib/api/integrations';

interface IntegrationsState {
  // Estado
  integrations: Integration[];
  loading: boolean;

  // Actions
  loadIntegrations: (userId: string) => Promise<void>;
  connectIntegration: (userId: string, platform: string, credentials?: any) => Promise<void>;
  disconnectIntegration: (userId: string, platform: string) => Promise<void>;
  isIntegrationConnected: (platform: string) => boolean;
}

export const useIntegrationsStore = create<IntegrationsState>((set, get) => ({
  // Estado inicial
  integrations: [],
  loading: false,

  // Load Integrations do Supabase
  loadIntegrations: async (userId: string) => {
    set({ loading: true });
    try {
      const data = await integrationsApi.getIntegrations(userId);
      set({ integrations: data || [], loading: false });
    } catch (error) {
      console.error('Load integrations error:', error);
      set({ integrations: [], loading: false });
    }
  },

  // Connect Integration e salva no Supabase
  connectIntegration: async (userId: string, platform: string, credentials?: any) => {
    try {
      await integrationsApi.upsertIntegration(userId, platform as any, true, credentials);
      // Recarregar lista
      await get().loadIntegrations(userId);
    } catch (error) {
      console.error('Connect integration error:', error);
      throw error;
    }
  },

  // Disconnect Integration no Supabase
  disconnectIntegration: async (userId: string, platform: string) => {
    try {
      await integrationsApi.upsertIntegration(userId, platform as any, false);
      // Recarregar lista
      await get().loadIntegrations(userId);
    } catch (error) {
      console.error('Disconnect integration error:', error);
      throw error;
    }
  },

  // Check se integration está conectada
  isIntegrationConnected: (platform: string) => {
    const { integrations } = get();
    return integrations.some(i => i.platform === platform && i.isConnected);
  },
}));
