// ============================================
// SYNC ORDER TO SHOPIFY - EDGE FUNCTION
// ============================================
//
// Sincroniza pedidos do SyncAds para Shopify
// usando a Shopify Orders API
//
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

interface SyncOrderRequest {
  orderId: string;
  userId?: string;
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
    const body: SyncOrderRequest = await req.json();
    const { orderId, userId } = body;

    log("info", "🔄 Iniciando sincronização com Shopify", { orderId, userId });

    if (!orderId) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "orderId is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Buscar pedido completo do banco
    const { data: order, error: orderError } = await supabase
      .from("Order")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      log("error", "Pedido não encontrado", { orderId, error: orderError });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order not found",
          orderId,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    log("info", "✅ Pedido encontrado", {
      orderNumber: order.orderNumber,
      customerEmail: order.customerEmail,
      total: order.total,
    });

    // 2. Buscar integração Shopify ativa do usuário
    const { data: integration, error: integrationError } = await supabase
      .from("ShopifyIntegration")
      .select("*")
      .eq("userId", order.userId)
      .eq("isActive", true)
      .single();

    if (integrationError || !integration) {
      log("error", "Integração Shopify não encontrada", {
        userId: order.userId,
        error: integrationError,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Shopify integration not found or inactive",
          hint: "Configure a integração Shopify no painel",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    log("info", "✅ Integração Shopify encontrada", {
      shopDomain: integration.shopDomain,
    });

    // 3. Preparar items do pedido
    const items = Array.isArray(order.items) ? order.items : [];

    log("info", "📦 Items do pedido", {
      itemsCount: items.length,
      items: items.map((i: any) => ({
        name: i.name,
        quantity: i.quantity,
        price: i.price,
      })),
    });

    // 4. Preparar payload para Shopify Orders API
    const shopifyPayload = {
      order: {
        line_items: items.map((item: any) => ({
          title: item.name || "Produto",
          price: (item.price || 0).toFixed(2),
          quantity: item.quantity || 1,
          sku: item.sku || undefined,
          variant_id: item.variantId || undefined,
          product_id: item.productId || undefined,
        })),
        customer: {
          email: order.customerEmail,
          first_name: order.customerName?.split(" ")[0] || "Cliente",
          last_name: order.customerName?.split(" ").slice(1).join(" ") || "",
          phone: order.customerPhone || undefined,
        },
        billing_address: order.billingAddress || order.shippingAddress || {},
        shipping_address: order.shippingAddress || {},
        financial_status: order.paymentStatus === "PAID" ? "paid" : "pending",
        fulfillment_status: null,
        note: `Pedido criado via SyncAds Checkout - ${order.orderNumber}`,
        tags: "syncads,checkout-customizado",
        source_name: "syncads",
        inventory_behaviour: "decrement_ignoring_policy",
        send_receipt: false,
        send_fulfillment_receipt: false,
        total_price: order.total.toFixed(2),
        subtotal_price: order.subtotal.toFixed(2),
        total_tax: (order.tax || 0).toFixed(2),
        currency: order.currency || "BRL",
        transactions: [
          {
            kind: order.paymentStatus === "PAID" ? "sale" : "authorization",
            status: order.paymentStatus === "PAID" ? "success" : "pending",
            amount: order.total.toFixed(2),
            currency: order.currency || "BRL",
            gateway: order.paymentMethod || "manual",
          },
        ],
      },
    };

    log("info", "📤 Enviando para Shopify", {
      shopDomain: integration.shopDomain,
      payload: shopifyPayload,
    });

    // 5. Enviar pedido para Shopify Orders API
    const shopifyApiUrl = `https://${integration.shopDomain}/admin/api/2024-01/orders.json`;

    const shopifyResponse = await fetch(shopifyApiUrl, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": integration.accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(shopifyPayload),
    });

    const responseText = await shopifyResponse.text();
    log("info", "📥 Resposta da Shopify", {
      status: shopifyResponse.status,
      statusText: shopifyResponse.statusText,
      body: responseText,
    });

    if (!shopifyResponse.ok) {
      log("error", "❌ Erro ao criar pedido na Shopify", {
        status: shopifyResponse.status,
        response: responseText,
      });

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create order in Shopify",
          details: responseText,
          status: shopifyResponse.status,
        }),
        {
          status: shopifyResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const shopifyOrder = JSON.parse(responseText);
    const shopifyOrderId = shopifyOrder.order?.id;
    const shopifyOrderNumber = shopifyOrder.order?.order_number;

    log("info", "✅ Pedido criado na Shopify com sucesso!", {
      shopifyOrderId,
      shopifyOrderNumber,
      adminUrl: `https://${integration.shopDomain}/admin/orders/${shopifyOrderId}`,
    });

    // 6. Atualizar pedido no SyncAds com shopifyOrderId
    const { error: updateError } = await supabase
      .from("Order")
      .update({
        metadata: {
          ...order.metadata,
          shopifyOrderId,
          shopifyOrderNumber,
          syncedToShopifyAt: new Date().toISOString(),
          shopifyAdminUrl: `https://${integration.shopDomain}/admin/orders/${shopifyOrderId}`,
        },
      })
      .eq("id", orderId);

    if (updateError) {
      log("warn", "⚠️ Erro ao atualizar metadata do pedido", {
        error: updateError,
      });
    }

    // 7. Registrar no histórico
    await supabase.from("OrderHistory").insert({
      orderId: orderId,
      action: "SYNCED_TO_SHOPIFY",
      description: `Pedido sincronizado com Shopify #${shopifyOrderNumber}`,
      metadata: {
        shopifyOrderId,
        shopifyOrderNumber,
      },
    });

    const duration = Date.now() - startTime;
    log("info", "🎉 Sincronização concluída", { duration });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Order synced to Shopify successfully",
        shopifyOrderId,
        shopifyOrderNumber,
        shopifyAdminUrl: `https://${integration.shopDomain}/admin/orders/${shopifyOrderId}`,
        duration,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    log("error", "❌ Erro inesperado", {
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
