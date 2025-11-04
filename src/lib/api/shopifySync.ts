import { supabase } from "../supabase";

// ============================================
// TYPES
// ============================================

interface SyncResult {
  success: boolean;
  message: string;
  synced?: number;
  errors?: number;
  details?: any;
}

interface ShopifyIntegration {
  id: string;
  userId: string;
  shopName: string;
  shopDomain: string;
  accessToken: string;
  isActive: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
}

// ============================================
// API
// ============================================

export const shopifySyncApi = {
  /**
   * Busca integração Shopify ativa do usuário
   */
  async getShopifyIntegration(
    userId: string,
  ): Promise<ShopifyIntegration | null> {
    try {
      const { data, error } = await supabase
        .from("ShopifyIntegration")
        .select("*")
        .eq("userId", userId)
        .eq("isActive", true)
        .single();

      if (error) {
        console.error("Error getting Shopify integration:", error);
        return null;
      }

      return data;
    } catch (error) {
      console.error("Error getting Shopify integration:", error);
      return null;
    }
  },

  /**
   * Sincroniza produtos da Shopify
   */
  async syncProducts(
    userId: string,
    organizationId?: string,
  ): Promise<SyncResult> {
    try {
      const integration = await this.getShopifyIntegration(userId);

      if (!integration) {
        return {
          success: false,
          message:
            "Integração Shopify não encontrada. Configure a integração em Integrações primeiro.",
          synced: 0,
          errors: 1,
        };
      }

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke("shopify-sync", {
        body: {
          integrationId: integration.id,
          action: "sync-products",
          limit: 250,
        },
      });

      if (error) {
        console.error("Error calling shopify-sync:", error);
        return {
          success: false,
          message: `Erro ao sincronizar: ${error.message}`,
          synced: 0,
          errors: 1,
        };
      }

      const result = data?.results?.products || {};

      if (result.success) {
        return {
          success: true,
          message: `${result.synced || 0} produtos sincronizados com sucesso!`,
          synced: result.synced || 0,
          errors: 0,
        };
      } else {
        return {
          success: false,
          message: result.error || "Erro ao sincronizar produtos",
          synced: 0,
          errors: 1,
        };
      }
    } catch (error: any) {
      console.error("Error in syncProducts:", error);
      return {
        success: false,
        message: error.message || "Erro desconhecido ao sincronizar produtos",
        synced: 0,
        errors: 1,
      };
    }
  },

  /**
   * Sincroniza pedidos da Shopify
   */
  async syncOrders(
    userId: string,
    organizationId?: string,
  ): Promise<SyncResult> {
    try {
      const integration = await this.getShopifyIntegration(userId);

      if (!integration) {
        return {
          success: false,
          message:
            "Integração Shopify não encontrada. Configure a integração em Integrações primeiro.",
          synced: 0,
          errors: 1,
        };
      }

      // Chamar Edge Function
      const { data, error } = await supabase.functions.invoke("shopify-sync", {
        body: {
          integrationId: integration.id,
          action: "sync-orders",
          limit: 250,
        },
      });

      if (error) {
        console.error("Error calling shopify-sync:", error);
        return {
          success: false,
          message: `Erro ao sincronizar: ${error.message}`,
          synced: 0,
          errors: 1,
        };
      }

      const result = data?.results?.orders || {};

      if (result.success) {
        return {
          success: true,
          message: `${result.synced || 0} pedidos sincronizados com sucesso!`,
          synced: result.synced || 0,
          errors: 0,
        };
      } else {
        return {
          success: false,
          message: result.error || "Erro ao sincronizar pedidos",
          synced: 0,
          errors: 1,
        };
      }
    } catch (error: any) {
      console.error("Error in syncOrders:", error);
      return {
        success: false,
        message: error.message || "Erro desconhecido ao sincronizar pedidos",
        synced: 0,
        errors: 1,
      };
    }
  },

  /**
   * Sincroniza clientes da Shopify
   */
  async syncCustomers(userId: string): Promise<SyncResult> {
    try {
      const integration = await this.getShopifyIntegration(userId);

      if (!integration) {
        return {
          success: false,
          message:
            "Integração Shopify não encontrada. Configure a integração em Integrações primeiro.",
          synced: 0,
          errors: 1,
        };
      }

      const { data, error } = await supabase.functions.invoke("shopify-sync", {
        body: {
          integrationId: integration.id,
          action: "sync-customers",
          limit: 250,
        },
      });

      if (error) {
        console.error("Error calling shopify-sync:", error);
        return {
          success: false,
          message: `Erro ao sincronizar: ${error.message}`,
          synced: 0,
          errors: 1,
        };
      }

      const result = data?.results?.customers || {};

      if (result.success) {
        return {
          success: true,
          message: `${result.synced || 0} clientes sincronizados com sucesso!`,
          synced: result.synced || 0,
          errors: 0,
        };
      } else {
        return {
          success: false,
          message: result.error || "Erro ao sincronizar clientes",
          synced: 0,
          errors: 1,
        };
      }
    } catch (error: any) {
      console.error("Error in syncCustomers:", error);
      return {
        success: false,
        message: error.message || "Erro desconhecido ao sincronizar clientes",
        synced: 0,
        errors: 1,
      };
    }
  },

  /**
   * Sincroniza carrinhos abandonados da Shopify
   */
  async syncAbandonedCarts(userId: string): Promise<SyncResult> {
    try {
      const integration = await this.getShopifyIntegration(userId);

      if (!integration) {
        return {
          success: false,
          message:
            "Integração Shopify não encontrada. Configure a integração em Integrações primeiro.",
          synced: 0,
          errors: 1,
        };
      }

      const { data, error } = await supabase.functions.invoke("shopify-sync", {
        body: {
          integrationId: integration.id,
          action: "sync-carts",
          limit: 250,
        },
      });

      if (error) {
        console.error("Error calling shopify-sync:", error);
        return {
          success: false,
          message: `Erro ao sincronizar: ${error.message}`,
          synced: 0,
          errors: 1,
        };
      }

      const result = data?.results?.abandonedCarts || {};

      if (result.success) {
        return {
          success: true,
          message: `${result.synced || 0} carrinhos abandonados sincronizados com sucesso!`,
          synced: result.synced || 0,
          errors: 0,
        };
      } else {
        return {
          success: false,
          message: result.error || "Erro ao sincronizar carrinhos abandonados",
          synced: 0,
          errors: 1,
        };
      }
    } catch (error: any) {
      console.error("Error in syncAbandonedCarts:", error);
      return {
        success: false,
        message: error.message || "Erro desconhecido ao sincronizar carrinhos",
        synced: 0,
        errors: 1,
      };
    }
  },

  /**
   * Sincroniza tudo (produtos, pedidos, clientes, carrinhos)
   */
  async syncAll(userId: string): Promise<SyncResult> {
    try {
      const integration = await this.getShopifyIntegration(userId);

      if (!integration) {
        return {
          success: false,
          message:
            "Integração Shopify não encontrada. Configure a integração em Integrações primeiro.",
          synced: 0,
          errors: 1,
        };
      }

      const { data, error } = await supabase.functions.invoke("shopify-sync", {
        body: {
          integrationId: integration.id,
          action: "sync-all",
          limit: 250,
        },
      });

      if (error) {
        console.error("Error calling shopify-sync:", error);
        return {
          success: false,
          message: `Erro ao sincronizar: ${error.message}`,
          synced: 0,
          errors: 1,
        };
      }

      const results = data?.results || {};
      const totalSynced =
        (results.products?.synced || 0) +
        (results.orders?.synced || 0) +
        (results.customers?.synced || 0) +
        (results.abandonedCarts?.synced || 0);

      const hasErrors =
        !results.products?.success ||
        !results.orders?.success ||
        !results.customers?.success ||
        !results.abandonedCarts?.success;

      if (data?.success) {
        return {
          success: true,
          message: `Sincronização completa! ${totalSynced} itens sincronizados.`,
          synced: totalSynced,
          errors: 0,
          details: results,
        };
      } else {
        return {
          success: false,
          message: "Sincronização completada com erros",
          synced: totalSynced,
          errors: 1,
          details: results,
        };
      }
    } catch (error: any) {
      console.error("Error in syncAll:", error);
      return {
        success: false,
        message: error.message || "Erro desconhecido ao sincronizar",
        synced: 0,
        errors: 1,
      };
    }
  },

  /**
   * Obtém estatísticas de sincronização
   */
  async getSyncStats(userId: string) {
    try {
      // Buscar produtos da Shopify sincronizados
      const { data: products, count: productsCount } = await supabase
        .from("ShopifyProduct")
        .select("*", { count: "exact" })
        .eq("userId", userId);

      // Buscar pedidos da Shopify sincronizados
      const { data: orders, count: ordersCount } = await supabase
        .from("ShopifyOrder")
        .select("*", { count: "exact" })
        .eq("userId", userId);

      // Buscar clientes da Shopify sincronizados
      const { data: customers, count: customersCount } = await supabase
        .from("ShopifyCustomer")
        .select("*", { count: "exact" })
        .eq("userId", userId);

      // Buscar carrinhos abandonados da Shopify
      const { data: carts, count: cartsCount } = await supabase
        .from("ShopifyAbandonedCart")
        .select("*", { count: "exact" })
        .eq("userId", userId);

      // Buscar última sincronização
      const { data: integration } = await supabase
        .from("ShopifyIntegration")
        .select("lastSyncAt, lastSyncStatus")
        .eq("userId", userId)
        .single();

      return {
        totalProducts: productsCount || 0,
        totalOrders: ordersCount || 0,
        totalCustomers: customersCount || 0,
        totalAbandonedCarts: cartsCount || 0,
        lastSync: integration?.lastSyncAt || null,
        lastSyncStatus: integration?.lastSyncStatus || null,
      };
    } catch (error) {
      console.error("Error getting sync stats:", error);
      return {
        totalProducts: 0,
        totalOrders: 0,
        totalCustomers: 0,
        totalAbandonedCarts: 0,
        lastSync: null,
        lastSyncStatus: null,
      };
    }
  },

  /**
   * Busca logs de sincronização
   */
  async getSyncLogs(userId: string, limit: number = 10) {
    try {
      const { data, error } = await supabase
        .from("ShopifySyncLog")
        .select("*")
        .eq("userId", userId)
        .order("createdAt", { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error getting sync logs:", error);
      return [];
    }
  },
};

// Exports
export const shopifySync = shopifySyncApi;
export default shopifySyncApi;
