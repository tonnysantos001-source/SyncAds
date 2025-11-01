// ============================================
// SHOPIFY CREATE ORDER - EDGE FUNCTION
// ============================================
//
// Recebe dados de produtos da Shopify e cria
// um pedido no checkout customizado SyncAds
//
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "https://syncads-dun.vercel.app";

interface ShopifyProduct {
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

interface CreateOrderRequest {
  shopDomain: string;
  products: ShopifyProduct[];
  customer?: {
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
}

function log(level: string, message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };
  console.log(JSON.stringify(logEntry));
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const body: CreateOrderRequest = await req.json();
    const { shopDomain, products, customer, metadata } = body;

    log("info", "Creating order from Shopify", {
      shopDomain,
      productsCount: products?.length,
    });

    // Validações
    if (!shopDomain) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "shopDomain is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!products || products.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "products array is required and cannot be empty",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Buscar integração Shopify
    const { data: integration, error: integrationError } = await supabase
      .from("ShopifyIntegration")
      .select("*")
      .eq("shopDomain", shopDomain)
      .eq("isActive", true)
      .single();

    if (integrationError || !integration) {
      log("error", "Shopify integration not found", {
        shopDomain,
        error: integrationError,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Shopify integration not found or inactive",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Calcular totais
    const subtotal = products.reduce(
      (sum, p) => sum + p.price * p.quantity,
      0,
    );
    const tax = subtotal * 0.17; // 17% de impostos (ajustar conforme necessário)
    const shipping = 0; // Calcular frete se necessário
    const total = subtotal + tax + shipping;

    // Gerar ID único para o pedido
    const orderId = crypto.randomUUID();

    // Criar pedido no banco
    const { data: order, error: orderError } = await supabase
      .from("Order")
      .insert({
        id: orderId,
        userId: integration.userId,
        organizationId: integration.organizationId || null,
        status: "PENDING",
        totalAmount: total,
        subtotal: subtotal,
        tax: tax,
        shippingCost: shipping,
        currency: "BRL",
        paymentStatus: "PENDING",
        customerEmail: customer?.email || null,
        customerName:
          customer?.firstName && customer?.lastName
            ? `${customer.firstName} ${customer.lastName}`
            : customer?.firstName || null,
        customerPhone: customer?.phone || null,
        metadata: {
          source: "shopify",
          shopDomain: shopDomain,
          shopifyIntegrationId: integration.id,
          products: products,
          ...metadata,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      log("error", "Failed to create order", { error: orderError });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create order",
          details: orderError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Criar itens do pedido
    const orderItems = products.map((product) => ({
      orderId: orderId,
      productId: product.productId,
      productName: product.name,
      quantity: product.quantity,
      unitPrice: product.price,
      totalPrice: product.price * product.quantity,
      metadata: {
        variantId: product.variantId,
        image: product.image,
        sku: product.sku,
      },
    }));

    const { error: itemsError } = await supabase
      .from("OrderItem")
      .insert(orderItems);

    if (itemsError) {
      log("warn", "Failed to create order items", { error: itemsError });
    }

    // Gerar URL do checkout
    const checkoutUrl = `${FRONTEND_URL}/checkout/${orderId}`;

    log("info", "Order created successfully", {
      orderId,
      checkoutUrl,
      total,
      duration: Date.now() - startTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderId,
        checkoutUrl: checkoutUrl,
        order: {
          id: orderId,
          total: total,
          subtotal: subtotal,
          tax: tax,
          shipping: shipping,
          currency: "BRL",
          status: "PENDING",
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    log("error", "Unexpected error", {
      error: error.message,
      stack: error.stack,
      duration,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
