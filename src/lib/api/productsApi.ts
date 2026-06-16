import { supabase } from "../supabase";

// Paginação padrão
const DEFAULT_PAGE_SIZE = 50;

// ============================================
// TYPES
// ============================================

export interface Product {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number;
  cost?: number;
  sku?: string;
  barcode?: string;
  stock: number;
  lowStockThreshold: number;
  trackStock: boolean;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  isFeatured: boolean;
  categoryId?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  sku?: string;
  barcode?: string;
  price?: number;
  comparePrice?: number;
  cost?: number;
  stock: number;
  trackStock: boolean;
  options?: Record<string, any>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  productId: string;
  variantId?: string;
  url: string;
  altText?: string;
  position: number;
  createdAt: string;
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  position: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// PRODUCTS API
// ============================================

export const productsApi = {
  // Lista todos os produtos
  async list(filters?: {
    status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
    categoryId?: string;
    search?: string;
  }) {
    try {
      let query = supabase
        .from("Product")
        .select("*, Category(*)")
        .order("createdAt", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.categoryId) {
        query = query.eq("categoryId", filters.categoryId);
      }

      if (filters?.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`,
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Product[];
    } catch (error) {
      console.error("Error listing products:", error);
      throw error;
    }
  },

  // Lista produtos sincronizados da Shopify
  async listFromShopify(
    userId: string,
    filters?: {
      status?: string;
      search?: string;
    },
  ) {
    try {
      let query = supabase
        .from("ShopifyProduct")
        .select("*")
        .eq("userId", userId)
        .order("updatedAt", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.search) {
        query = query.or(
          `title.ilike.%${filters.search}%,handle.ilike.%${filters.search}%`,
        );
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transformar produtos Shopify para formato compatível
      return (data || []).map((p: any) => ({
        id: String(p.id),
        userId: p.userId,
        name: p.title,
        slug: p.handle,
        description: p.description,
        shortDescription: p.description?.substring(0, 200),
        price: p.shopifyData?.variants?.[0]?.price || 0,
        comparePrice: p.shopifyData?.variants?.[0]?.compare_at_price || 0,
        sku: p.shopifyData?.variants?.[0]?.sku || "",
        stock: p.totalInventory || 0,
        lowStockThreshold: 10,
        trackStock: true,
        status:
          p.status === "active"
            ? "ACTIVE"
            : p.status === "draft"
              ? "DRAFT"
              : "ARCHIVED",
        isFeatured: false,
        tags: p.tags || [],
        metadata: {
          shopifyId: p.id,
          shopifyData: p.shopifyData,
          images: p.images,
          vendor: p.vendor,
          productType: p.productType,
        },
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      })) as Product[];
    } catch (error) {
      console.error("Error listing Shopify products:", error);
      throw error;
    }
  },

  // Busca um produto por ID
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from("Product")
        .select("*, Category(*), ProductVariant(*), ProductImage(*)")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error("Error getting product:", error);
      throw error;
    }
  },

  // Cria um novo produto
  async create(product: Omit<Product, "id" | "createdAt" | "updatedAt">) {
    try {
      const { data, error } = await supabase
        .from("Product")
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  },

  // Atualiza um produto
  async update(id: string, updates: Partial<Product>) {
    try {
      const { data, error } = await supabase
        .from("Product")
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  },

  // Deleta um produto
  async delete(id: string) {
    try {
      const { error } = await supabase.from("Product").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  },

  // Atualiza o estoque
  async updateStock(id: string, quantity: number) {
    try {
      const { data, error } = await supabase
        .from("Product")
        .update({ stock: quantity, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error("Error updating stock:", error);
      throw error;
    }
  },

  // Coleções Locais
  collections: {
    async list(userId: string) {
      try {
        const { data, error } = await supabase
          .from("Collection")
          .select("*")
          .or(`userId.eq.${userId},userId.is.null`)
          .order("createdAt", { ascending: false });

        if (error) throw error;
        
        return (data || []).map((c: any) => ({
          id: String(c.id),
          userId: c.userId,
          name: c.name,
          slug: c.slug,
          description: c.description || "",
          imageUrl: c.imageUrl || null,
          productIds: c.productIds || [],
          isActive: c.isPublished ?? true,
          productCount: (c.productIds || []).length,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
        }));
      } catch (error) {
        console.error("Error listing local collections:", error);
        throw error;
      }
    },

    async create(collection: {
      name: string;
      slug: string;
      description?: string;
      isActive: boolean;
      productIds?: string[];
      organizationId?: string;
      userId?: string;
    }) {
      try {
        const { data, error } = await supabase
          .from("Collection")
          .insert({
            name: collection.name,
            slug: collection.slug,
            description: collection.description,
            isPublished: collection.isActive,
            productIds: collection.productIds || [],
            userId: collection.userId,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error creating local collection:", error);
        throw error;
      }
    },

    async update(
      id: string,
      updates: {
        name?: string;
        slug?: string;
        description?: string;
        isActive?: boolean;
        productIds?: string[];
      }
    ) {
      try {
        const payload: any = {};
        if (updates.name !== undefined) payload.name = updates.name;
        if (updates.slug !== undefined) payload.slug = updates.slug;
        if (updates.description !== undefined) payload.description = updates.description;
        if (updates.productIds !== undefined) payload.productIds = updates.productIds;
        if (updates.isActive !== undefined) payload.isPublished = updates.isActive;

        const { data, error } = await supabase
          .from("Collection")
          .update({
            ...payload,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error updating local collection:", error);
        throw error;
      }
    },

    async delete(id: string) {
      try {
        const { error } = await supabase
          .from("Collection")
          .delete()
          .eq("id", id);

        if (error) throw error;
      } catch (error) {
        console.error("Error deleting local collection:", error);
        throw error;
      }
    },
  },

  // Kits Locais
  kits: {
    async list(userId: string) {
      try {
        // Buscar os kits do usuário
        const { data: kits, error: kitsError } = await supabase
          .from("Kit")
          .select("*")
          .or(`userId.eq.${userId},userId.is.null`)
          .order("createdAt", { ascending: false });

        if (kitsError) throw kitsError;

        if (!kits || kits.length === 0) return [];

        const kitIds = kits.map((k) => k.id);

        // Buscar todos os KitItem associados e os produtos
        const { data: items, error: itemsError } = await supabase
          .from("KitItem")
          .select("*, Product(*)")
          .in("kitId", kitIds);

        if (itemsError) throw itemsError;

        return kits.map((kit) => {
          const kitItems = (items || [])
            .filter((item) => item.kitId === kit.id)
            .map((item) => ({
              id: item.id,
              kitId: item.kitId,
              productId: item.productId,
              quantity: item.quantity || 1,
              product: item.Product,
            }));

          return {
            id: kit.id,
            name: kit.name,
            slug: kit.slug,
            description: kit.description || "",
            imageUrl: kit.imageUrl || null,
            totalPrice: Number(kit.totalPrice || 0),
            discount: Number(kit.discount || 0),
            price: Number(kit.finalPrice || kit.totalPrice || 0), // preço exibido
            isActive: kit.status === "ACTIVE",
            items: kitItems,
            createdAt: kit.createdAt,
            updatedAt: kit.updatedAt,
          };
        });
      } catch (error) {
        console.error("Error listing local kits:", error);
        throw error;
      }
    },

    async create(kit: {
      name: string;
      description?: string;
      price: number;
      isActive: boolean;
      items: { productId: string; quantity: number }[];
      userId: string;
    }) {
      try {
        // Calcular totalPrice dos produtos do kit
        const totalPrice = kit.price; // simplificado ou informado pelo usuário

        const { data: createdKit, error: kitError } = await supabase
          .from("Kit")
          .insert({
            name: kit.name,
            slug: kit.name
              .toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "")
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, ""),
            description: kit.description || "",
            totalPrice: totalPrice,
            discount: 0,
            finalPrice: kit.price,
            status: kit.isActive ? "ACTIVE" : "INACTIVE",
            userId: kit.userId,
          })
          .select()
          .single();

        if (kitError) throw kitError;

        if (kit.items && kit.items.length > 0) {
          const kitItemsPayload = kit.items.map((item) => ({
            kitId: createdKit.id,
            productId: item.productId,
            quantity: item.quantity || 1,
          }));

          const { error: itemsError } = await supabase
            .from("KitItem")
            .insert(kitItemsPayload);

          if (itemsError) throw itemsError;
        }

        return createdKit;
      } catch (error) {
        console.error("Error creating local kit:", error);
        throw error;
      }
    },

    async update(
      id: string,
      updates: {
        name: string;
        description?: string;
        price: number;
        isActive: boolean;
        items: { productId: string; quantity: number }[];
      }
    ) {
      try {
        const { data: updatedKit, error: kitError } = await supabase
          .from("Kit")
          .update({
            name: updates.name,
            description: updates.description || "",
            totalPrice: updates.price,
            finalPrice: updates.price,
            status: updates.isActive ? "ACTIVE" : "INACTIVE",
            updatedAt: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (kitError) throw kitError;

        // Deletar os itens antigos do kit
        const { error: deleteError } = await supabase
          .from("KitItem")
          .delete()
          .eq("kitId", id);

        if (deleteError) throw deleteError;

        // Inserir os novos itens
        if (updates.items && updates.items.length > 0) {
          const kitItemsPayload = updates.items.map((item) => ({
            kitId: id,
            productId: item.productId,
            quantity: item.quantity || 1,
          }));

          const { error: itemsError } = await supabase
            .from("KitItem")
            .insert(kitItemsPayload);

          if (itemsError) throw itemsError;
        }

        return updatedKit;
      } catch (error) {
        console.error("Error updating local kit:", error);
        throw error;
      }
    },

    async delete(id: string) {
      try {
        // Deletar itens primeiro
        await supabase.from("KitItem").delete().eq("kitId", id);
        
        const { error } = await supabase
          .from("Kit")
          .delete()
          .eq("id", id);

        if (error) throw error;
      } catch (error) {
        console.error("Error deleting local kit:", error);
        throw error;
      }
    },
  },
};

// ============================================
// CATEGORIES API
// ============================================

export const categoriesApi = {
  // Lista todas as categorias
  async list() {
    try {
      const { data, error } = await supabase
        .from("Category")
        .select("*")
        .order("position", { ascending: true });

      if (error) throw error;
      return data as Category[];
    } catch (error) {
      console.error("Error listing categories:", error);
      throw error;
    }
  },

  // Cria uma nova categoria
  async create(category: Omit<Category, "id" | "createdAt" | "updatedAt">) {
    try {
      const { data, error } = await supabase
        .from("Category")
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  },

  // Atualiza uma categoria
  async update(id: string, updates: Partial<Category>) {
    try {
      const { data, error } = await supabase
        .from("Category")
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  },

  // Deleta uma categoria
  async delete(id: string) {
    try {
      const { error } = await supabase.from("Category").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting category:", error);
      throw error;
    }
  },
};

// ============================================
// PRODUCT VARIANTS API
// ============================================

export const variantsApi = {
  // Lista variações de um produto
  async listByProduct(productId: string) {
    try {
      const { data, error } = await supabase
        .from("ProductVariant")
        .select("*")
        .eq("productId", productId);

      if (error) throw error;
      return data as ProductVariant[];
    } catch (error) {
      console.error("Error listing variants:", error);
      throw error;
    }
  },

  // Cria uma nova variação
  async create(
    variant: Omit<ProductVariant, "id" | "createdAt" | "updatedAt">,
  ) {
    try {
      const { data, error } = await supabase
        .from("ProductVariant")
        .insert(variant)
        .select()
        .single();

      if (error) throw error;
      return data as ProductVariant;
    } catch (error) {
      console.error("Error creating variant:", error);
      throw error;
    }
  },

  // Atualiza uma variação
  async update(id: string, updates: Partial<ProductVariant>) {
    try {
      const { data, error } = await supabase
        .from("ProductVariant")
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as ProductVariant;
    } catch (error) {
      console.error("Error updating variant:", error);
      throw error;
    }
  },

  // Deleta uma variação
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from("ProductVariant")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting variant:", error);
      throw error;
    }
  },
};

// ============================================
// PRODUCT IMAGES API
// ============================================

export const productImagesApi = {
  // Lista imagens de um produto
  async listByProduct(productId: string) {
    try {
      const { data, error } = await supabase
        .from("ProductImage")
        .select("*")
        .eq("productId", productId)
        .order("position", { ascending: true });

      if (error) throw error;
      return data as ProductImage[];
    } catch (error) {
      console.error("Error listing images:", error);
      throw error;
    }
  },

  // Adiciona uma imagem
  async create(image: Omit<ProductImage, "id" | "createdAt">) {
    try {
      const { data, error } = await supabase
        .from("ProductImage")
        .insert(image)
        .select()
        .single();

      if (error) throw error;
      return data as ProductImage;
    } catch (error) {
      console.error("Error creating image:", error);
      throw error;
    }
  },

  // Deleta uma imagem
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from("ProductImage")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting image:", error);
      throw error;
    }
  },
};
