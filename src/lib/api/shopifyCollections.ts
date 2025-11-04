import { supabase } from "../supabase";

// ============================================
// TYPES
// ============================================

export interface ShopifyCollection {
  id: string;
  userId: string;
  integrationId: string;
  title: string;
  handle: string;
  description?: string;
  bodyHtml?: string;
  sortOrder: string;
  templateSuffix?: string;
  published: boolean;
  publishedAt?: string;
  publishedScope: string;
  image?: {
    src: string;
    alt?: string;
    width?: number;
    height?: number;
  };
  productsCount: number;
  shopifyData: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  lastSyncAt: string;
}

export interface Collection {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  productsCount: number;
  published: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// SHOPIFY COLLECTIONS API
// ============================================

export const shopifyCollectionsApi = {
  /**
   * Lista coleções sincronizadas da Shopify
   */
  async listFromShopify(
    userId: string,
    filters?: {
      published?: boolean;
      search?: string;
    },
  ): Promise<Collection[]> {
    try {
      let query = supabase
        .from("ShopifyCollection")
        .select("*")
        .eq("userId", userId)
        .order("updatedAt", { ascending: false });

      if (filters?.published !== undefined) {
        query = query.eq("published", filters.published);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,handle.ilike.%${filters.search}%`,
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformar coleções Shopify para formato compatível
      return (data || []).map((c: any) => ({
        id: String(c.id),
        userId: c.userId,
        name: c.title,
        slug: c.handle,
        description: c.description || c.bodyHtml,
        imageUrl: c.image?.src || null,
        productsCount: c.productsCount || 0,
        published: c.published,
        metadata: {
          shopifyId: c.id,
          shopifyData: c.shopifyData,
          sortOrder: c.sortOrder,
          publishedScope: c.publishedScope,
          image: c.image,
        },
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })) as Collection[];
    } catch (error) {
      console.error("Error listing Shopify collections:", error);
      throw error;
    }
  },

  /**
   * Busca uma coleção específica da Shopify
   */
  async getById(userId: string, collectionId: string): Promise<Collection | null> {
    try {
      const { data, error } = await supabase
        .from("ShopifyCollection")
        .select("*")
        .eq("userId", userId)
        .eq("id", collectionId)
        .single();

      if (error) {
        console.error("Error getting Shopify collection:", error);
        return null;
      }

      if (!data) return null;

      return {
        id: String(data.id),
        userId: data.userId,
        name: data.title,
        slug: data.handle,
        description: data.description || data.bodyHtml,
        imageUrl: data.image?.src || null,
        productsCount: data.productsCount || 0,
        published: data.published,
        metadata: {
          shopifyId: data.id,
          shopifyData: data.shopifyData,
          sortOrder: data.sortOrder,
          publishedScope: data.publishedScope,
          image: data.image,
        },
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.error("Error getting Shopify collection:", error);
      return null;
    }
  },

  /**
   * Busca produtos de uma coleção
   */
  async getCollectionProducts(userId: string, collectionId: string) {
    try {
      // Buscar a coleção para pegar os IDs dos produtos
      const { data: collection, error: collectionError } = await supabase
        .from("ShopifyCollection")
        .select("shopifyData")
        .eq("userId", userId)
        .eq("id", collectionId)
        .single();

      if (collectionError || !collection) {
        console.error("Collection not found");
        return [];
      }

      // Se a coleção tem produtos no shopifyData, buscar eles
      const productIds = collection.shopifyData?.products?.map((p: any) => p.id) || [];

      if (productIds.length === 0) return [];

      const { data, error } = await supabase
        .from("ShopifyProduct")
        .select("*")
        .eq("userId", userId)
        .in("id", productIds);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error getting collection products:", error);
      return [];
    }
  },

  /**
   * Conta total de coleções sincronizadas
   */
  async count(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("ShopifyCollection")
        .select("*", { count: "exact", head: true })
        .eq("userId", userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error("Error counting Shopify collections:", error);
      return 0;
    }
  },

  /**
   * Busca estatísticas de coleções
   */
  async getStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from("ShopifyCollection")
        .select("published, productsCount")
        .eq("userId", userId);

      if (error) throw error;

      const total = data?.length || 0;
      const published = data?.filter((c) => c.published).length || 0;
      const totalProducts = data?.reduce((sum, c) => sum + (c.productsCount || 0), 0) || 0;

      return {
        total,
        published,
        draft: total - published,
        totalProducts,
        averageProducts: total > 0 ? Math.round(totalProducts / total) : 0,
      };
    } catch (error) {
      console.error("Error getting collection stats:", error);
      return {
        total: 0,
        published: 0,
        draft: 0,
        totalProducts: 0,
        averageProducts: 0,
      };
    }
  },
};

// Export default
export default shopifyCollectionsApi;
