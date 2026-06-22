import { create } from "zustand";
import { integrationsApi, Integration } from "@/lib/api/integrations";
import { supabase } from "@/lib/supabase";
import { integrationsV2Api, IntegrationDB, UserIntegrationConfig } from "@/lib/api/integrationsV2";
import { integrationRegistry } from "@/lib/integrations";

interface IntegrationsState {
  // Estado original
  integrations: Integration[];
  loading: boolean;

  // Estado V2
  dbIntegrations: IntegrationDB[];
  userConfigs: UserIntegrationConfig[];

  // Actions originais
  loadIntegrations: (userId: string) => Promise<void>;
  connectIntegration: (
    userId: string,
    platform: string,
    credentials?: any,
  ) => Promise<void>;
  disconnectIntegration: (userId: string, platform: string) => Promise<void>;
  isIntegrationConnected: (platform: string) => boolean;

  // Actions V2
  loadV2Integrations: (userId: string) => Promise<void>;
  connectV2Integration: (
    userId: string,
    integrationId: string,
    credentials?: any,
  ) => Promise<void>;
  disconnectV2Integration: (userId: string, integrationId: string) => Promise<void>;
  syncV2Integration: (userId: string, integrationId: string) => Promise<any>;
  testConnectionV2: (userId: string, integrationId: string) => Promise<boolean>;
}

export const useIntegrationsStore = create<IntegrationsState>((set, get) => ({
  // Estado inicial
  integrations: [],
  loading: false,

  // Estado V2
  dbIntegrations: [],
  userConfigs: [],

  // Load Integrations do Supabase (Original)
  loadIntegrations: async (userId: string) => {
    set({ loading: true });
    try {
      const data = await integrationsApi.getIntegrations(userId);

      // Carregar também ShopifyIntegration
      const { data: shopifyData } = await supabase
        .from("ShopifyIntegration")
        .select("*")
        .eq("userId", userId)
        .eq("isActive", true)
        .maybeSingle();

      // Se tem Shopify ativo, adicionar à lista
      const allIntegrations = [...(data || [])];
      if (shopifyData) {
        allIntegrations.push({
          id: shopifyData.id,
          userId: shopifyData.userId,
          platform: "shopify" as any,
          isConnected: shopifyData.isActive,
          credentials: null,
          lastSyncAt: null,
          syncStatus: "success",
          createdAt: shopifyData.createdAt,
          updatedAt: shopifyData.updatedAt,
        });
      }

      set({ integrations: allIntegrations, loading: false });
    } catch (error) {
      console.error("Load integrations error:", error);
      set({ integrations: [], loading: false });
    }
  },

  // Connect Integration e salva no Supabase (Original)
  connectIntegration: async (
    userId: string,
    platform: string,
    credentials?: any,
  ) => {
    try {
      await integrationsApi.upsertIntegration(
        userId,
        platform as any,
        true,
        credentials,
      );
      // Recarregar lista
      await get().loadIntegrations(userId);
    } catch (error) {
      console.error("Connect integration error:", error);
      throw error;
    }
  },

  // Disconnect Integration no Supabase (Original)
  disconnectIntegration: async (userId: string, platform: string) => {
    try {
      await integrationsApi.upsertIntegration(userId, platform as any, false);
      // Recarregar lista
      await get().loadIntegrations(userId);
    } catch (error) {
      console.error("Disconnect integration error:", error);
      throw error;
    }
  },

  // Check se integration está conectada (Original)
  isIntegrationConnected: (platform: string) => {
    // Para manter compatibilidade com V2, verifica também nas configurações V2
    const isV1Connected = get().integrations.some((i) => i.platform === platform && i.isConnected);
    if (isV1Connected) return true;

    return get().userConfigs.some((c) => c.integration_id === platform && c.status === "connected");
  },

  // LOAD V2 INTEGRATIONS
  loadV2Integrations: async (userId: string) => {
    set({ loading: true });
    try {
      const [available, configs] = await Promise.all([
        integrationsV2Api.getAvailableIntegrations(),
        integrationsV2Api.getUserConfigs(userId),
      ]);

      // Check legacy ShopifyIntegration
      const { data: shopifyData } = await supabase
        .from("ShopifyIntegration")
        .select("*")
        .eq("userId", userId)
        .eq("isActive", true)
        .maybeSingle();

      // Check legacy WooCommerceIntegration
      const { data: wooData } = await supabase
        .from("WooCommerceIntegration")
        .select("*")
        .eq("userId", userId)
        .eq("isActive", true)
        .maybeSingle();

      const mergedConfigs = [...configs];

      if (shopifyData && !mergedConfigs.some(c => c.integration_id === 'shopify')) {
        mergedConfigs.push({
          id: shopifyData.id,
          user_id: userId,
          integration_id: 'shopify',
          credentials_encrypted: JSON.stringify({ shopDomain: shopifyData.shopDomain, accessToken: shopifyData.accessToken }),
          status: 'connected',
          last_test_at: null,
          created_at: shopifyData.createdAt,
          updated_at: shopifyData.updatedAt
        });
      }

      if (wooData && !mergedConfigs.some(c => c.integration_id === 'woocommerce')) {
        mergedConfigs.push({
          id: wooData.id,
          user_id: userId,
          integration_id: 'woocommerce',
          credentials_encrypted: JSON.stringify({ siteUrl: wooData.siteUrl, consumerKey: wooData.consumerKey, consumerSecret: wooData.consumerSecret }),
          status: 'connected',
          last_test_at: null,
          created_at: wooData.createdAt,
          updated_at: wooData.updatedAt
        });
      }

      set({ dbIntegrations: available, userConfigs: mergedConfigs, loading: false });
    } catch (error) {
      console.error("Load V2 integrations error:", error);
      set({ loading: false });
    }
  },

  // CONNECT V2 INTEGRATION
  connectV2Integration: async (userId: string, integrationId: string, credentials?: any) => {
    set({ loading: true });
    try {
      const provider = integrationRegistry.get(integrationId);
      if (provider) {
        try {
          await provider.connect(userId, credentials);
        } catch (e) {
          console.warn("Provider connection hook error or not implemented:", e);
        }
      }
      
      await integrationsV2Api.upsertUserConfig(userId, integrationId, "connected", credentials);
      await get().loadV2Integrations(userId);
    } catch (error) {
      console.error("Connect V2 integration error:", error);
      await integrationsV2Api.upsertUserConfig(userId, integrationId, "failed", credentials);
      await get().loadV2Integrations(userId);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // DISCONNECT V2 INTEGRATION
  disconnectV2Integration: async (userId: string, integrationId: string) => {
    set({ loading: true });
    try {
      const provider = integrationRegistry.get(integrationId);
      if (provider) {
        try {
          await provider.disconnect(userId);
        } catch (e) {
          console.warn("Provider disconnect warning:", e);
        }
      }
      await integrationsV2Api.disconnectConfig(userId, integrationId);
      await get().loadV2Integrations(userId);
    } catch (error) {
      console.error("Disconnect V2 integration error:", error);
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  // SYNC V2 INTEGRATION
  syncV2Integration: async (userId: string, integrationId: string) => {
    try {
      const provider = integrationRegistry.get(integrationId);
      if (!provider) throw new Error("Provider not found");
      return await provider.sync(userId);
    } catch (error) {
      console.error("Sync V2 integration error:", error);
      throw error;
    }
  },

  // TEST CONNECTION V2
  testConnectionV2: async (userId: string, integrationId: string) => {
    try {
      const provider = integrationRegistry.get(integrationId);
      if (!provider) return false;
      const isValid = await provider.healthCheck(userId);
      
      const status = isValid ? "connected" : "failed";
      const config = get().userConfigs.find(c => c.integration_id === integrationId);
      const credentials = config?.credentials_encrypted ? JSON.parse(config.credentials_encrypted) : undefined;
      
      await integrationsV2Api.upsertUserConfig(userId, integrationId, status, credentials);
      
      // Update last_test_at
      await supabase
        .from("integration_configs")
        .update({ last_test_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("integration_id", integrationId);

      await get().loadV2Integrations(userId);
      return isValid;
    } catch (error) {
      console.error("Test connection V2 error:", error);
      return false;
    }
  }
}));
