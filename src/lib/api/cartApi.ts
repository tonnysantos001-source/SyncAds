import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export interface Cart {
  id: string;
  organizationId: string;
  sessionId?: string;
  customerId?: string;
  currency: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string;
  metadata?: Record<string, any>;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  price: number;
  quantity: number;
  discount: number;
  tax: number;
  total: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AbandonedCart {
  id: string;
  organizationId: string;
  cartId: string;
  customerEmail?: string;
  customerName?: string;
  items: Record<string, any>;
  subtotal: number;
  total: number;
  recoveryEmailSent: boolean;
  recoveryEmailSentAt?: string;
  recovered: boolean;
  recoveredAt?: string;
  recoveryOrderId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ============================================
// CART API
// ============================================

export const cartApi = {
  // Get cart by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('Cart')
      .select(`
        *,
        items:CartItem(*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Cart & { items: CartItem[] };
  },

  // Get cart by session
  async getBySession(sessionId: string) {
    const { data, error } = await supabase
      .from('Cart')
      .select(`
        *,
        items:CartItem(*)
      `)
      .eq('sessionId', sessionId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as Cart & { items: CartItem[] };
  },

  // Get cart by customer
  async getByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('Cart')
      .select(`
        *,
        items:CartItem(*)
      `)
      .eq('customerId', customerId)
      .order('createdAt', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as Cart & { items: CartItem[] };
  },

  // Create cart
  async create(cart: Omit<Cart, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('Cart')
      .insert(cart)
      .select()
      .single();

    if (error) throw error;
    return data as Cart;
  },

  // Update cart
  async update(id: string, updates: Partial<Cart>) {
    const { data, error } = await supabase
      .from('Cart')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Cart;
  },

  // Apply coupon
  async applyCoupon(id: string, couponCode: string, discount: number) {
    const { data, error } = await supabase
      .from('Cart')
      .update({ 
        couponCode, 
        discount,
        updatedAt: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Cart;
  },

  // Remove coupon
  async removeCoupon(id: string) {
    const { data, error } = await supabase
      .from('Cart')
      .update({ 
        couponCode: null, 
        discount: 0,
        updatedAt: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Cart;
  },

  // Clear cart (remove all items)
  async clear(id: string) {
    const { error: itemsError } = await supabase
      .from('CartItem')
      .delete()
      .eq('cartId', id);

    if (itemsError) throw itemsError;

    const { data, error } = await supabase
      .from('Cart')
      .update({ 
        subtotal: 0,
        discount: 0,
        shipping: 0,
        tax: 0,
        total: 0,
        updatedAt: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Cart;
  },

  // Delete cart
  async delete(id: string) {
    const { error } = await supabase
      .from('Cart')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Recalculate totals
  async recalculate(id: string) {
    const { data: cart, error: cartError } = await supabase
      .from('Cart')
      .select(`
        *,
        items:CartItem(*)
      `)
      .eq('id', id)
      .single();

    if (cartError) throw cartError;

    const items = cart.items || [];
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const discount = cart.discount || 0;
    const shipping = cart.shipping || 0;
    const tax = cart.tax || 0;
    const total = subtotal - discount + shipping + tax;

    const { data, error } = await supabase
      .from('Cart')
      .update({ 
        subtotal,
        total,
        updatedAt: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Cart;
  },
};

// ============================================
// CART ITEMS API
// ============================================

export const cartItemsApi = {
  // Get items by cart
  async getByCart(cartId: string) {
    const { data, error } = await supabase
      .from('CartItem')
      .select('*')
      .eq('cartId', cartId);

    if (error) throw error;
    return data as CartItem[];
  },

  // Add item
  async add(item: Omit<CartItem, 'id' | 'createdAt' | 'updatedAt'>) {
    // Check if item already exists
    const { data: existing } = await supabase
      .from('CartItem')
      .select('*')
      .eq('cartId', item.cartId)
      .eq('productId', item.productId)
      .eq('variantId', item.variantId || null)
      .single();

    if (existing) {
      // Update quantity
      return cartItemsApi.update(existing.id, {
        quantity: existing.quantity + item.quantity,
      });
    }

    // Add new item
    const { data, error } = await supabase
      .from('CartItem')
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as CartItem;
  },

  // Update item
  async update(id: string, updates: Partial<CartItem>) {
    const { data, error } = await supabase
      .from('CartItem')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CartItem;
  },

  // Update quantity
  async updateQuantity(id: string, quantity: number) {
    if (quantity <= 0) {
      return cartItemsApi.remove(id);
    }

    const { data, error } = await supabase
      .from('CartItem')
      .update({ 
        quantity,
        total: quantity * (await cartItemsApi.getById(id)).price,
        updatedAt: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CartItem;
  },

  // Get item by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('CartItem')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as CartItem;
  },

  // Remove item
  async remove(id: string) {
    const { error } = await supabase
      .from('CartItem')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// ABANDONED CART API
// ============================================

export const abandonedCartApi = {
  // Get all abandoned carts
  async getAll(organizationId: string) {
    const { data, error } = await supabase
      .from('AbandonedCart')
      .select('*')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as AbandonedCart[];
  },

  // Get abandoned cart by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('AbandonedCart')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as AbandonedCart;
  },

  // Create abandoned cart
  async create(cart: Omit<AbandonedCart, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('AbandonedCart')
      .insert(cart)
      .select()
      .single();

    if (error) throw error;
    return data as AbandonedCart;
  },

  // Mark recovery email sent
  async markEmailSent(id: string) {
    const { data, error } = await supabase
      .from('AbandonedCart')
      .update({ 
        recoveryEmailSent: true,
        recoveryEmailSentAt: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AbandonedCart;
  },

  // Mark as recovered
  async markRecovered(id: string, orderId: string) {
    const { data, error } = await supabase
      .from('AbandonedCart')
      .update({ 
        recovered: true,
        recoveredAt: new Date().toISOString(),
        recoveryOrderId: orderId 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AbandonedCart;
  },

  // Get unrecovered carts
  async getUnrecovered(organizationId: string) {
    const { data, error } = await supabase
      .from('AbandonedCart')
      .select('*')
      .eq('organizationId', organizationId)
      .eq('recovered', false)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as AbandonedCart[];
  },

  // Get carts needing recovery email
  async getNeedingEmail(organizationId: string) {
    const { data, error } = await supabase
      .from('AbandonedCart')
      .select('*')
      .eq('organizationId', organizationId)
      .eq('recoveryEmailSent', false)
      .eq('recovered', false)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as AbandonedCart[];
  },

  // Delete abandoned cart
  async delete(id: string) {
    const { error } = await supabase
      .from('AbandonedCart')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// Export combined API
export default {
  cart: cartApi,
  items: cartItemsApi,
  abandoned: abandonedCartApi,
};
