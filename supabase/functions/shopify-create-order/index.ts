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
const FRONTEND_URL =
  Deno.env.get("FRONTEND_URL") || "https://syncads-dun.vercel.app";

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

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `ORD-${timestamp}-${random}`;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Parse request body
    const body: any = await req.json();
    log("info", "Request body parsed", { body });

    // Aceitar tanto shopDomain quanto shopifyDomain
    const shopDomain = body.shopDomain || body.shopifyDomain;
    const products = body.products || body.items || [];
    const customer = body.customer || {};
    const metadata = body.metadata || {};

    log("info", "Creating order from Shopify", {
      shopDomain,
      productsCount: products?.length,
    });

    // 🔍 DEBUG: Log dos produtos recebidos
    console.log("🔍 [DEBUG] Produtos recebidos na Edge Function:", {
      products: products,
      firstProduct: products[0],
      productsDetalhados: products.map((p) => ({
        productId: p.productId,
        variantId: p.variantId,
        name: p.name,
        image: p.image,
        price: p.price,
        hasName: !!p.name,
        hasImage: !!p.image,
      })),
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
    // Buscar integração Shopify pelo domínio da loja
    // IMPORTANTE: Não requer autenticação, busca pelo shopDomain público
    const { data: integration, error: integrationError } = await supabase
      .from("ShopifyIntegration")
      .select("id, userId, shopDomain, accessToken")
      .eq("shopDomain", shopDomain)
      .eq("isActive", true)
      .single();

    if (integrationError || !integration) {
      log("error", "Shopify integration not found", {
        shopDomain,
        error: integrationError,
        message: integrationError?.message,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Shopify integration not found or inactive",
          shopDomain,
          hint: "Configure a integração Shopify no painel SyncAds",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userId = integration.userId;
    log("info", "Integration found", { userId, shopDomain });
    // Calcular totais
    const subtotal = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    const tax = subtotal * 0.17; // 17% de impostos
    const shipping = 0; // Será calculado no checkout
    const total = subtotal + tax + shipping;

    // Gerar IDs
    const orderId = crypto.randomUUID();
    const customerId = null; // Sem cliente no momento, será preenchido no checkout
    const orderNumber = generateOrderNumber();

    // Preparar dados do cliente
    const customerEmail = customer?.email || "nao-informado@syncads.com.br";
    const customerName =
      customer?.firstName && customer?.lastName
        ? `${customer.firstName} ${customer.lastName}`
        : customer?.firstName || "Cliente";
    const customerPhone = customer?.phone || "";

    // Preparar items (formato jsonb)
    const items = products.map((p) => {
      const item = {
        productId: p.productId,
        variantId: p.variantId || null,
        name: p.name || "Produto",
        price: p.price,
        quantity: p.quantity,
        image: p.image || null,
        sku: p.sku || null,
        total: p.price * p.quantity,
      };

      // 🔍 DEBUG: Verificar se name ou image estão vazios
      if (!p.name || !p.image) {
        console.warn("⚠️ [DEBUG] Produto com dados faltando:", {
          productId: p.productId,
          hasName: !!p.name,
          hasImage: !!p.image,
          receivedName: p.name,
          receivedImage: p.image,
        });
      }

      return item;
    });

    console.log("✅ [DEBUG] Items preparados para o banco:", {
      items: items,
      firstItem: items[0],
      allHaveNames: items.every((i) => i.name && i.name !== "Produto"),
      allHaveImages: items.every((i) => i.image),
    });

    // Endereço padrão (será preenchido no checkout)
    const shippingAddress = {
      street: "",
      number: "",
      complement: "",
      neighborhood: "",
      city: "",
      state: "",
      zipCode: "",
      country: "BR",
    };

    // Criar pedido no banco
    console.log("💾 [DEBUG] Inserindo pedido no banco com items:", {
      orderId: orderId,
      items: items,
      metadata: {
        source: "shopify",
        shopDomain: shopDomain,
        originalProducts: products,
      },
    });

    const { data: order, error: orderError } = await supabase
      .from("Order")
      .insert({
        id: orderId,
        orderNumber: orderNumber,
        customerId: customerId,
        userId: integration.userId,
        customerEmail: customerEmail,
        customerName: customerName,
        customerPhone: customerPhone || null,
        customerCpf: null,
        shippingAddress: shippingAddress,
        billingAddress: null,
        items: items,
        subtotal: subtotal,
        discount: 0,
        shipping: shipping,
        tax: tax,
        total: total,
        couponCode: null,
        couponDiscount: null,
        paymentMethod: "PENDING", // Será escolhido no checkout
        paymentStatus: "PENDING",
        paidAt: null,
        status: "PENDING",
        trackingCode: null,
        shippingCarrier: null,
        shippedAt: null,
        deliveredAt: null,
        utmSource: metadata?.referrer || null,
        utmMedium: "shopify",
        utmCampaign: "shopify_checkout",
        notes: null,
        metadata: {
          source: "shopify",
          shopDomain: shopDomain,
          shopifyIntegrationId: integration.id,
          originalProducts: products,
          ...metadata,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) {
      console.error("🔴 [DEBUG] Erro ao criar pedido:", {
        error: orderError,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
        items: items,
      });
      log("error", "Failed to create order", {
        error: orderError,
        message: orderError.message,
        details: orderError.details,
        hint: orderError.hint,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to create order",
          details: orderError.message,
          hint: orderError.hint,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Gerar URL do checkout
    const checkoutUrl = `${FRONTEND_URL}/checkout/${orderId}`;

    console.log("✅ [DEBUG] Pedido criado com sucesso:", {
      orderId,
      orderNumber,
      itemsSalvos: order?.items,
      metadataSalvo: order?.metadata,
    });

    log("info", "Order created successfully", {
      orderId,
      orderNumber,
      checkoutUrl,
      total,
      duration: Date.now() - startTime,
    });

    return new Response(
      JSON.stringify({
        success: true,
        orderId: orderId,
        orderNumber: orderNumber,
        checkoutUrl: checkoutUrl,
        order: {
          id: orderId,
          orderNumber: orderNumber,
          total: total,
          subtotal: subtotal,
          tax: tax,
          shipping: shipping,
          currency: "BRL",
          status: "PENDING",
          items: items,
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
