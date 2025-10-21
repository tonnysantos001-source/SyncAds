import { supabase } from '../supabase';

// ============================================
// TYPES
// ============================================

export interface CheckoutCustomization {
  id: string;
  organizationId: string;
  name: string;
  logo?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fontFamily?: string;
  headerText?: string;
  footerText?: string;
  customCss?: string;
  customJs?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSection {
  id: string;
  checkoutId: string;
  type: 'CONTACT' | 'SHIPPING' | 'PAYMENT' | 'SUMMARY' | 'CUSTOM';
  name: string;
  content?: string;
  position: number;
  isVisible: boolean;
  isRequired: boolean;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Pixel {
  id: string;
  organizationId: string;
  name: string;
  platform: 'FACEBOOK' | 'GOOGLE' | 'TIKTOK' | 'SNAPCHAT' | 'TWITTER' | 'PINTEREST' | 'CUSTOM';
  pixelId: string;
  isActive: boolean;
  createdAt: string;
}

export interface PixelEvent {
  id: string;
  pixelId: string;
  eventType: 'PAGE_VIEW' | 'ADD_TO_CART' | 'INITIATE_CHECKOUT' | 'PURCHASE' | 'LEAD' | 'CUSTOM';
  eventName?: string;
  triggerOn: 'PAGE_LOAD' | 'BUTTON_CLICK' | 'FORM_SUBMIT' | 'CUSTOM';
  customTrigger?: string;
  parameters?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
}

export interface SocialProof {
  id: string;
  organizationId: string;
  type: 'RECENT_PURCHASE' | 'LIVE_VISITORS' | 'REVIEWS' | 'TRUST_BADGE' | 'COUNTDOWN';
  message?: string;
  icon?: string;
  position: 'TOP' | 'BOTTOM' | 'FLOATING';
  displayDuration?: number;
  isActive: boolean;
  settings?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface Banner {
  id: string;
  organizationId: string;
  name: string;
  type: 'ANNOUNCEMENT' | 'PROMOTION' | 'WARNING' | 'INFO';
  message: string;
  position: 'TOP' | 'BOTTOM';
  backgroundColor?: string;
  textColor?: string;
  link?: string;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Shipping {
  id: string;
  organizationId: string;
  name: string;
  carrier?: string;
  method: string;
  estimatedDays?: number;
  price: number;
  freeShippingThreshold?: number;
  conditions?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// CHECKOUT CUSTOMIZATION API
// ============================================

export const checkoutCustomizationApi = {
  async getAll(organizationId: string) {
    const { data, error } = await supabase
      .from('CheckoutCustomization')
      .select('*')
      .eq('organizationId', organizationId);
    if (error) throw error;
    return data as CheckoutCustomization[];
  },

  async getDefault(organizationId: string) {
    const { data, error } = await supabase
      .from('CheckoutCustomization')
      .select('*')
      .eq('organizationId', organizationId)
      .eq('isDefault', true)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data as CheckoutCustomization | null;
  },

  async create(customization: Omit<CheckoutCustomization, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('CheckoutCustomization')
      .insert(customization)
      .select()
      .single();
    if (error) throw error;
    return data as CheckoutCustomization;
  },

  async update(id: string, updates: Partial<CheckoutCustomization>) {
    const { data, error } = await supabase
      .from('CheckoutCustomization')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as CheckoutCustomization;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('CheckoutCustomization')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ============================================
// PIXELS API
// ============================================

export const pixelsApi = {
  async getAll(organizationId: string) {
    const { data, error } = await supabase
      .from('Pixel')
      .select('*, events:PixelEvent(*)')
      .eq('organizationId', organizationId);
    if (error) throw error;
    return data;
  },

  async create(pixel: Omit<Pixel, 'id' | 'createdAt'>) {
    const { data, error } = await supabase
      .from('Pixel')
      .insert(pixel)
      .select()
      .single();
    if (error) throw error;
    return data as Pixel;
  },

  async update(id: string, updates: Partial<Pixel>) {
    const { data, error } = await supabase
      .from('Pixel')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Pixel;
  },

  async delete(id: string) {
    const { error } = await supabase.from('Pixel').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================
// SOCIAL PROOF API
// ============================================

export const socialProofApi = {
  async getAll(organizationId: string) {
    const { data, error } = await supabase
      .from('SocialProof')
      .select('*')
      .eq('organizationId', organizationId);
    if (error) throw error;
    return data as SocialProof[];
  },

  async getActive(organizationId: string) {
    const { data, error } = await supabase
      .from('SocialProof')
      .select('*')
      .eq('organizationId', organizationId)
      .eq('isActive', true);
    if (error) throw error;
    return data as SocialProof[];
  },

  async create(proof: Omit<SocialProof, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('SocialProof')
      .insert(proof)
      .select()
      .single();
    if (error) throw error;
    return data as SocialProof;
  },

  async update(id: string, updates: Partial<SocialProof>) {
    const { data, error } = await supabase
      .from('SocialProof')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as SocialProof;
  },

  async delete(id: string) {
    const { error } = await supabase.from('SocialProof').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================
// BANNERS API
// ============================================

export const bannersApi = {
  async getAll(organizationId: string) {
    const { data, error } = await supabase
      .from('Banner')
      .select('*')
      .eq('organizationId', organizationId);
    if (error) throw error;
    return data as Banner[];
  },

  async getActive(organizationId: string) {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('Banner')
      .select('*')
      .eq('organizationId', organizationId)
      .eq('isActive', true)
      .or(`startsAt.is.null,startsAt.lte.${now}`)
      .or(`expiresAt.is.null,expiresAt.gte.${now}`);
    if (error) throw error;
    return data as Banner[];
  },

  async create(banner: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('Banner')
      .insert(banner)
      .select()
      .single();
    if (error) throw error;
    return data as Banner;
  },

  async update(id: string, updates: Partial<Banner>) {
    const { data, error } = await supabase
      .from('Banner')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Banner;
  },

  async delete(id: string) {
    const { error } = await supabase.from('Banner').delete().eq('id', id);
    if (error) throw error;
  },
};

// ============================================
// SHIPPING API
// ============================================

export const shippingApi = {
  async getAll(organizationId: string) {
    const { data, error } = await supabase
      .from('Shipping')
      .select('*')
      .eq('organizationId', organizationId);
    if (error) throw error;
    return data as Shipping[];
  },

  async getActive(organizationId: string) {
    const { data, error } = await supabase
      .from('Shipping')
      .select('*')
      .eq('organizationId', organizationId)
      .eq('isActive', true);
    if (error) throw error;
    return data as Shipping[];
  },

  async create(shipping: Omit<Shipping, 'id' | 'createdAt' | 'updatedAt'>) {
    const { data, error } = await supabase
      .from('Shipping')
      .insert(shipping)
      .select()
      .single();
    if (error) throw error;
    return data as Shipping;
  },

  async update(id: string, updates: Partial<Shipping>) {
    const { data, error } = await supabase
      .from('Shipping')
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Shipping;
  },

  async delete(id: string) {
    const { error } = await supabase.from('Shipping').delete().eq('id', id);
    if (error) throw error;
  },
};

export default {
  customization: checkoutCustomizationApi,
  pixels: pixelsApi,
  socialProof: socialProofApi,
  banners: bannersApi,
  shipping: shippingApi,
};
