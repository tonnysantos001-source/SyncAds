import { supabase } from "@/lib/supabase";

// Paginação padrão
const DEFAULT_PAGE_SIZE = 50;

// ============================================
// TYPES
// ============================================

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  customerId: string;
  cartId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  customerCpf?: string;
  shippingAddress: Record<string, any>;
  billingAddress?: Record<string, any>;
  items: Record<string, any>;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  currency: string;
  paymentMethod:
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "PIX"
    | "BOLETO"
    | "PAYPAL"
    | "WALLET";
  paymentStatus:
    | "PENDING"
    | "PROCESSING"
    | "PAID"
    | "FAILED"
    | "REFUNDED"
    | "CANCELLED";
  fulfillmentStatus:
    | "PENDING"
    | "PROCESSING"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED";
  shippingMethod?: string;
  shippingCarrier?: string;
  trackingNumber?: string;
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  name: string;
  sku?: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface OrderHistory {
  id: string;
  orderId: string;
  action: string;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// ============================================
// ORDERS API
// ============================================

export const ordersApi = {
  // Get all orders
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from("Order")
      .select(
        `
        *,
        items:OrderItem(*),
        history:OrderHistory(*)
      `,
      )
      .eq("userId", userId)
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return data as (Order & { items: OrderItem[]; history: OrderHistory[] })[];
  },

  // Get order by ID
  async getById(id: string) {
    const { data, error } = await supabase
      .from("Order")
      .select(
        `
        *,
        items:OrderItem(*),
        history:OrderHistory(*)
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Order & { items: OrderItem[]; history: OrderHistory[] };
  },

  // Get orders by customer
  async getByCustomer(customerId: string) {
    const { data, error } = await supabase
      .from("Order")
      .select(
        `
        *,
        items:OrderItem(*)
      `,
      )
      .eq("customerId", customerId)
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return data as (Order & { items: OrderItem[] })[];
  },

  // Create order
  async create(order: Omit<Order, "id" | "createdAt" | "updatedAt">) {
    const { data, error } = await supabase
      .from("Order")
      .insert(order)
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  },

  // Update order
  async update(id: string, updates: Partial<Order>) {
    const { data, error } = await supabase
      .from("Order")
      .update({ ...updates, updatedAt: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  },

  // Update payment status
  async updatePaymentStatus(
    id: string,
    status: Order["paymentStatus"],
    paidAt?: string,
  ) {
    const updates: Partial<Order> = { paymentStatus: status };
    if (paidAt) updates.paidAt = paidAt;

    const { data, error } = await supabase
      .from("Order")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  },

  // Update fulfillment status
  async updateFulfillmentStatus(
    id: string,
    status: Order["fulfillmentStatus"],
    metadata?: {
      shippedAt?: string;
      deliveredAt?: string;
      cancelledAt?: string;
    },
  ) {
    const updates: Partial<Order> = { fulfillmentStatus: status, ...metadata };

    const { data, error } = await supabase
      .from("Order")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  },

  // Cancel order
  async cancel(id: string, reason?: string) {
    const updates: Partial<Order> = {
      paymentStatus: "CANCELLED",
      fulfillmentStatus: "CANCELLED",
      cancelledAt: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("Order")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Add to history
    if (data) {
      await ordersApi.addHistory(
        id,
        "ORDER_CANCELLED",
        reason || "Order cancelled",
      );
    }

    return data as Order;
  },

  // Delete order
  async delete(id: string) {
    const { error } = await supabase.from("Order").delete().eq("id", id);

    if (error) throw error;
  },
};

// ============================================
// ORDER ITEMS API
// ============================================

export const orderItemsApi = {
  // Get items by order
  async getByOrder(orderId: string) {
    const { data, error } = await supabase
      .from("OrderItem")
      .select("*")
      .eq("orderId", orderId);

    if (error) throw error;
    return data as OrderItem[];
  },

  // Add item
  async add(item: Omit<OrderItem, "id" | "createdAt">) {
    const { data, error } = await supabase
      .from("OrderItem")
      .insert(item)
      .select()
      .single();

    if (error) throw error;
    return data as OrderItem;
  },

  // Update item
  async update(id: string, updates: Partial<OrderItem>) {
    const { data, error } = await supabase
      .from("OrderItem")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as OrderItem;
  },

  // Remove item
  async remove(id: string) {
    const { error } = await supabase.from("OrderItem").delete().eq("id", id);

    if (error) throw error;
  },
};

// ============================================
// ORDER HISTORY API
// ============================================

export const orderHistoryApi = {
  // Get history by order
  async getByOrder(orderId: string) {
    const { data, error } = await supabase
      .from("OrderHistory")
      .select("*")
      .eq("orderId", orderId)
      .order("createdAt", { ascending: false });

    if (error) throw error;
    return data as OrderHistory[];
  },

  // Add history entry
  async add(
    orderId: string,
    action: string,
    description?: string,
    metadata?: Record<string, any>,
  ) {
    const { data, error } = await supabase
      .from("OrderHistory")
      .insert({
        orderId,
        action,
        description,
        metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return data as OrderHistory;
  },
};

// Export combined API
export default {
  orders: ordersApi,
  items: orderItemsApi,
  history: orderHistoryApi,
  // Convenience method to add history
  addHistory: orderHistoryApi.add,
};
