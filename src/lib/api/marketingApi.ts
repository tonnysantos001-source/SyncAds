import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export interface Coupon {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING';
  value: number;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CouponUsage {
  id: string;
  couponId: string;
  customerId: string;
  orderId: string;
  discountAmount: number;
  createdAt: string;
}

export interface Discount {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BUY_X_GET_Y';
  value: number;
  conditions?: Record<string, any>;
  productIds?: string[];
  categoryIds?: string[];
  minQuantity?: number;
  minPurchaseAmount?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrderBump {
  id: string;
  organizationId: string;
  name: string;
  productId: string;
  title: string;
  description?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  position: 'CHECKOUT' | 'CART';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Upsell {
  id: string;
  organizationId: string;
  name: string;
  fromProductId: string;
  toProductId: string;
  title: string;
  description?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  timing: 'CHECKOUT' | 'POST_PURCHASE' | 'THANK_YOU_PAGE';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrossSell {
  id: string;
  organizationId: string;
  name: string;
  productId: string;
  relatedProductIds: string[];
  title?: string;
  description?: string;
  discountType?: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue?: number;
  position: 'PRODUCT_PAGE' | 'CART' | 'CHECKOUT';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// COUPONS API
// ============================================

export const couponsApi = {
  // Get all coupons
  async getAll(organizationId: string) {
    const { data, error } = await supabase
      .from('Coupon')
      .select('*')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as Coupon[];
  },

  // Get coupon by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from('Coupon')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Coupon;
  },

  // Get coupon by code
  async getByCode(code: string, organizationId: string) {
    const { data, error } = await supabase
      .from('Coupon')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('organizationId', organizationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    return data as Coupon;
  },

  // Validate coupon
  async validate(code: string, organizationId: string, customerId?: string) {
    const coupon = await couponsApi.getByCode(code, organizationId);
    
    if (!coupon) return { valid: false, error: 'Coupon not found' };
    if (!coupon.isActive) return { valid: false, error: 'Coupon is inactive' };
    
    const now = new Date();
    if (coupon.startsAt && new Date(coupon.startsAt) > now) {
      return { valid: false, error: 'Coupon not yet active' };
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < now) {
      return { valid: false, error: 'Coupon has expired' };
    }
    
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    if (customerId && coupon.perCustomerLimit) {
      const { data: usage } = await supabase
        .from('CouponUsage')
        .select('id')
        .eq('couponId', coupon.id)
        .eq('customerId', customerId);
      
      if (usage && usage.length >= coupon.perCustomerLimit) {
        return { valid: false, error: 'Customer usage limit reached' };
      }
    }

    return { valid: true, coupon };
  },

  // Create coupon
  async create(coupon: Omit<Coupon, 'id' | 'usageCount' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('Coupon')
      .insert({ ...coupon, code: coupon.code.toUpperCase() })
      .select()
      .single();

    if (error) throw error;
    return data as Coupon;
  },

  // Update coupon
  async update(id: string, updates: Partial<Coupon>) {
    const { data, error } = await supabase
      .from('Coupon')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Coupon;
  },

  // Activate/Deactivate coupon
  async setActive(id: string, isActive: boolean) {
    return couponsApi.update(id, { isActive });
  },

  // Increment usage count
  async incrementUsage(id: string) {
    const { data, error } = await supabase.rpc('increment_coupon_usage', {
      coupon_id: id,
    });

    if (error) {
      // Fallback if RPC doesn't exist
      const coupon = await couponsApi.getById(id);
      return couponsApi.update(id, { usageCount: coupon.usageCount + 1 });
    }
    return data;
  },

  // Delete coupon
  async delete(id: string) {
    const { error } = await supabase
      .from('Coupon')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get active coupons
  async getActive(organizationId: string) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('Coupon')
      .select('*')
      .eq('organizationId', organizationId)
      .eq('isActive', true)
      .or(`startsAt.is.null,startsAt.lte.${now}`)
      .or(`expiresAt.is.null,expiresAt.gte.${now}`)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as Coupon[];
  },
};

// ============================================
// COUPON USAGE API
// ============================================

export const couponUsageApi = {
  // Record usage
  async record(usage: Omit<CouponUsage, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('CouponUsage')
      .insert(usage)
      .select()
      .single();

    if (error) throw error;
    return data as CouponUsage;
  },

  // Get usage by coupon
  async getByCoupon(couponId: string) {
    const { data, error } = await supabase
      .from('CouponUsage')
      .select('*')
      .eq('couponId', couponId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data as CouponUsage[];
  },

  // Get usage by customer
  async getByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from('CouponUsage')
      .select('*, coupon:Coupon(*)')
      .eq('customerId', customerId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },
};

// ============================================
// DISCOUNTS API
// ============================================

export const discountsApi = {
  // Get all discounts
  async getAll(organizationId: string) {
    const { data, error } = await supabase
      .from('Discount')
      .select('*')
      .eq('organizationId', organizationId)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data as Discount[];
  },

  // Get active discounts
  async getActive(organizationId: string) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('Discount')
      .select('*')
      .eq('organizationId', organizationId)
      .eq('isActive', true)
      .or(`startsAt.is.null,startsAt.lte.${now}`)
      .or(`expiresAt.is.null,expiresAt.gte.${now}`)
      .order('priority', { ascending: false });

    if (error) throw error;
    return data as Discount[];
  },

  // Create discount
  async create(discount: Omit<Discount, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('Discount')
      .insert(discount)
      .select()
      .single();

    if (error) throw error;
    return data as Discount;
  },

  // Update discount
  async update(id: string, updates: Partial<Discount>) {
    const { data, error } = await supabase
      .from('Discount')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Discount;
  },

  // Delete discount
  async delete(id: string) {
    const { error } = await supabase
      .from('Discount')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// ORDER BUMPS API
// ============================================

export const orderBumpsApi = {
  // Get all order bumps
  async getAll(organizationId: string) {
    const { data, error } = await supabase
      .from('OrderBump')
      .select('*, product:Product(*)')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get active order bumps
  async getActive(organizationId: string, position?: string) {
    let query = supabase
      .from('OrderBump')
      .select('*, product:Product(*)')
      .eq('organizationId', organizationId)
      .eq('isActive', true);

    if (position) {
      query = query.eq('position', position);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create order bump
  async create(bump: Omit<OrderBump, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('OrderBump')
      .insert(bump)
      .select()
      .single();

    if (error) throw error;
    return data as OrderBump;
  },

  // Update order bump
  async update(id: string, updates: Partial<OrderBump>) {
    const { data, error } = await supabase
      .from('OrderBump')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as OrderBump;
  },

  // Delete order bump
  async delete(id: string) {
    const { error } = await supabase
      .from('OrderBump')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// UPSELLS API
// ============================================

export const upsellsApi = {
  // Get all upsells
  async getAll(organizationId: string) {
    const { data, error } = await supabase
      .from('Upsell')
      .select(`
        *,
        fromProduct:Product!Upsell_fromProductId_fkey(*),
        toProduct:Product!Upsell_toProductId_fkey(*)
      `)
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get upsells for product
  async getByProduct(productId: string, timing?: string) {
    let query = supabase
      .from('Upsell')
      .select('*, toProduct:Product!Upsell_toProductId_fkey(*)')
      .eq('fromProductId', productId)
      .eq('isActive', true);

    if (timing) {
      query = query.eq('timing', timing);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Create upsell
  async create(upsell: Omit<Upsell, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('Upsell')
      .insert(upsell)
      .select()
      .single();

    if (error) throw error;
    return data as Upsell;
  },

  // Update upsell
  async update(id: string, updates: Partial<Upsell>) {
    const { data, error } = await supabase
      .from('Upsell')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Upsell;
  },

  // Delete upsell
  async delete(id: string) {
    const { error } = await supabase
      .from('Upsell')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// CROSS-SELLS API
// ============================================

export const crossSellsApi = {
  // Get all cross-sells
  async getAll(organizationId: string) {
    const { data, error } = await supabase
      .from('CrossSell')
      .select('*, product:Product(*)')
      .eq('organizationId', organizationId)
      .order('createdAt', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get cross-sells for product
  async getByProduct(productId: string, position?: string) {
    let query = supabase
      .from('CrossSell')
      .select('*')
      .eq('productId', productId)
      .eq('isActive', true);

    if (position) {
      query = query.eq('position', position);
    }

    const { data, error } = await query.order('createdAt', { ascending: false });

    if (error) throw error;
    return data as CrossSell[];
  },

  // Create cross-sell
  async create(crossSell: Omit<CrossSell, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('CrossSell')
      .insert(crossSell)
      .select()
      .single();

    if (error) throw error;
    return data as CrossSell;
  },

  // Update cross-sell
  async update(id: string, updates: Partial<CrossSell>) {
    const { data, error } = await supabase
      .from('CrossSell')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as CrossSell;
  },

  // Delete cross-sell
  async delete(id: string) {
    const { error } = await supabase
      .from('CrossSell')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};

// ============================================
// MARKETING API - Export agregado
// ============================================

export const marketingApi = {
  coupons: couponsApi,
  couponUsage: couponUsageApi,
  discounts: discountsApi,
  orderBumps: orderBumpsApi,
  upsells: upsellsApi,
  crossSells: crossSellsApi,
};

// Export combined API
export default {
  coupons: couponsApi,
  couponUsage: couponUsageApi,
  discounts: discountsApi,
  orderBumps: orderBumpsApi,
  upsells: upsellsApi,
  crossSells: crossSellsApi,
};
