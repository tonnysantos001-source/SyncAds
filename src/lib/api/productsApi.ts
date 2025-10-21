import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export interface Product {
  id: string;
  organizationId: string;
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
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
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
  organizationId: string;
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
    status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
    categoryId?: string;
    search?: string;
  }) {
    try {
      let query = supabase
        .from('Product')
        .select('*, Category(*)')
        .order('createdAt', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.categoryId) {
        query = query.eq('categoryId', filters.categoryId);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Product[];
    } catch (error) {
      console.error('Error listing products:', error);
      throw error;
    }
  },

  // Busca um produto por ID
  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('Product')
        .select('*, Category(*), ProductVariant(*), ProductImage(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error('Error getting product:', error);
      throw error;
    }
  },

  // Cria um novo produto
  async create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data, error } = await supabase
        .from('Product')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  },

  // Atualiza um produto
  async update(id: string, updates: Partial<Product>) {
    try {
      const { data, error } = await supabase
        .from('Product')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  },

  // Deleta um produto
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('Product')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  // Atualiza o estoque
  async updateStock(id: string, quantity: number) {
    try {
      const { data, error } = await supabase
        .from('Product')
        .update({ stock: quantity, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Product;
    } catch (error) {
      console.error('Error updating stock:', error);
      throw error;
    }
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
        .from('Category')
        .select('*')
        .order('position', { ascending: true });

      if (error) throw error;
      return data as Category[];
    } catch (error) {
      console.error('Error listing categories:', error);
      throw error;
    }
  },

  // Cria uma nova categoria
  async create(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data, error } = await supabase
        .from('Category')
        .insert(category)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  },

  // Atualiza uma categoria
  async update(id: string, updates: Partial<Category>) {
    try {
      const { data, error } = await supabase
        .from('Category')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  },

  // Deleta uma categoria
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('Category')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting category:', error);
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
        .from('ProductVariant')
        .select('*')
        .eq('productId', productId);

      if (error) throw error;
      return data as ProductVariant[];
    } catch (error) {
      console.error('Error listing variants:', error);
      throw error;
    }
  },

  // Cria uma nova variação
  async create(variant: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const { data, error } = await supabase
        .from('ProductVariant')
        .insert(variant)
        .select()
        .single();

      if (error) throw error;
      return data as ProductVariant;
    } catch (error) {
      console.error('Error creating variant:', error);
      throw error;
    }
  },

  // Atualiza uma variação
  async update(id: string, updates: Partial<ProductVariant>) {
    try {
      const { data, error } = await supabase
        .from('ProductVariant')
        .update({ ...updates, updatedAt: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ProductVariant;
    } catch (error) {
      console.error('Error updating variant:', error);
      throw error;
    }
  },

  // Deleta uma variação
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('ProductVariant')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting variant:', error);
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
        .from('ProductImage')
        .select('*')
        .eq('productId', productId)
        .order('position', { ascending: true });

      if (error) throw error;
      return data as ProductImage[];
    } catch (error) {
      console.error('Error listing images:', error);
      throw error;
    }
  },

  // Adiciona uma imagem
  async create(image: Omit<ProductImage, 'id' | 'createdAt'>) {
    try {
      const { data, error } = await supabase
        .from('ProductImage')
        .insert(image)
        .select()
        .single();

      if (error) throw error;
      return data as ProductImage;
    } catch (error) {
      console.error('Error creating image:', error);
      throw error;
    }
  },

  // Deleta uma imagem
  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('ProductImage')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },
};
