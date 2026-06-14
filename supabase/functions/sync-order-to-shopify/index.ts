// ============================================
// SYNC ORDER TO SHOPIFY - ULTRA ROBUST VERSION
// ============================================
// Sincroniza pedidos do SyncAds para Shopify
// Com try-catch em CADA etapa
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
    function: "sync-order-to-shopify",
    message,
    data,
  };
  console.log(JSON.stringify(logEntry));
}

function formatPhoneE164(phone: string | null | undefined): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  if (phone.trim().startsWith("+") && digits.length >= 10) return phone.trim();
  if (digits.length === 10 || digits.length === 11) return `+55${digits}`;
  if (digits.length === 12 || digits.length === 13) return `+${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  return undefined;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  let orderId = "";
  let userId = "";

  try {
    // ============================================
    // ETAPA 1: PARSE DO BODY
    // ============================================
    let body: SyncOrderRequest;
    try {
      body = await req.json();
      orderId = body.orderId || "";
      userId = body.userId || "";

      log("info", "📨 Request recebido", {
        orderId,
        userId,
        hasOrderId: !!orderId,
        hasUserId: !!userId,
      });
    } catch (parseError: any) {
      log("error", "❌ Erro ao fazer parse do body", {
        error: parseError.message,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid request body",
          message: parseError.message,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validar orderId
    if (!orderId) {
      log("error", "❌ orderId não fornecido");
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

    // ============================================
    // ETAPA 2: CONECTAR AO SUPABASE
    // ============================================
    let supabase;
    try {
      supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      log("info", "✅ Conectado ao Supabase");
    } catch (supabaseError: any) {
      log("error", "❌ Erro ao conectar ao Supabase", {
        error: supabaseError.message,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to connect to database",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ============================================
    // ETAPA 3: BUSCAR PEDIDO
    // ============================================
    let order: any;
    try {
      const { data, error } = await supabase
        .from("Order")
        .select("*")
        .eq("id", orderId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Order not found in database");

      order = data;

      log("info", "✅ Pedido encontrado", {
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerEmail: order.customerEmail,
        customerName: order.customerName,
        total: order.total,
        userId: order.userId,
        paymentStatus: order.paymentStatus,
        itemsType: Array.isArray(order.items) ? "array" : typeof order.items,
        itemsCount: Array.isArray(order.items) ? order.items.length : 0,
      });
    } catch (orderError: any) {
      log("error", "❌ Erro ao buscar pedido", {
        orderId,
        error: orderError.message,
        details: orderError,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Order not found",
          orderId,
          message: orderError.message,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ============================================
    // ETAPA 4: BUSCAR INTEGRAÇÃO SHOPIFY
    // ============================================
    let integration: any;
    try {
      const { data, error } = await supabase
        .from("ShopifyIntegration")
        .select("*")
        .eq("userId", order.userId)
        .eq("isActive", true)
        .maybeSingle();

      if (error) {
        log("warn", "⚠️ Erro ao buscar integração", { error: error.message });
      }

      if (!data) {
        throw new Error("No active Shopify integration found");
      }

      integration = data;

      log("info", "✅ Integração Shopify encontrada", {
        shopDomain: integration.shopDomain,
        hasAccessToken: !!integration.accessToken,
        integrationId: integration.id,
      });
    } catch (integrationError: any) {
      log("error", "❌ Integração Shopify não encontrada", {
        userId: order.userId,
        error: integrationError.message,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Shopify integration not found or inactive",
          hint: "Configure a integração Shopify no painel em /integrations",
          userId: order.userId,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ============================================
    // VERIFICAÇÃO DE DUPLICIDADE / ATUALIZAÇÃO DE STATUS
    // ============================================
    if (order.metadata?.shopifyOrderId) {
      log("info", "Pedido já sincronizado com Shopify. Verificando atualização de status...", {
        shopifyOrderId: order.metadata.shopifyOrderId,
        paymentStatus: order.paymentStatus,
      });

      if (order.paymentStatus === "PAID") {
        // Criar transação de captura no Shopify para marcar o pedido como pago
        try {
          const shopifyTransactionUrl = `https://${integration.shopDomain}/admin/api/2024-01/orders/${order.metadata.shopifyOrderId}/transactions.json`;
          const transactionPayload = {
            transaction: {
              kind: "capture",
              status: "success",
              amount: String(order.total.toFixed(2)),
            }
          };

          log("info", "📤 Enviando transação de captura para Shopify", {
            url: shopifyTransactionUrl,
            shopifyOrderId: order.metadata.shopifyOrderId,
          });

          const response = await fetch(shopifyTransactionUrl, {
            method: "POST",
            headers: {
              "X-Shopify-Access-Token": integration.accessToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(transactionPayload),
          });

          if (response.ok) {
            log("info", "✅ Pedido marcado como PAGO na Shopify com sucesso!");
            return new Response(
              JSON.stringify({
                success: true,
                message: "Shopify order marked as PAID via capture transaction",
                shopifyOrderId: order.metadata.shopifyOrderId,
                shopifyOrderNumber: order.metadata.shopifyOrderNumber,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          } else {
            const errorText = await response.text();
            log("error", "❌ Falha ao marcar pedido como PAGO na Shopify", {
              status: response.status,
              error: errorText,
            });
          }
        } catch (captureError: any) {
          log("error", "❌ Erro ao tentar enviar captura para Shopify", {
            error: captureError.message,
          });
        }
      }

      // Se já sincronizado e não foi pago, ou se falhou a captura, apenas retorna sucesso sem duplicar
      return new Response(
        JSON.stringify({
          success: true,
          message: "Order already synced to Shopify previously",
          shopifyOrderId: order.metadata.shopifyOrderId,
          shopifyOrderNumber: order.metadata.shopifyOrderNumber,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ============================================
    // ETAPA 5: PREPARAR ITEMS
    // ============================================
    let items: any[] = [];
    try {
      if (Array.isArray(order.items)) {
        items = order.items;
      } else if (order.items && typeof order.items === "object") {
        // Se for objeto, tentar extrair array
        if (Array.isArray((order.items as any).items)) {
          items = (order.items as any).items;
        } else {
          items = [order.items];
        }
      }

      log("info", "📦 Items processados", {
        itemsCount: items.length,
        items: items.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          hasVariantId: !!i.variantId,
          hasProductId: !!i.productId,
        })),
      });

      // Se não tiver items, criar um item genérico
      if (items.length === 0) {
        log("warn", "⚠️ Pedido sem items, criando item genérico");
        items = [
          {
            name: "Produto SyncAds",
            price: order.total || 0,
            quantity: 1,
          },
        ];
      }
    } catch (itemsError: any) {
      log("error", "❌ Erro ao processar items", {
        error: itemsError.message,
        orderItems: order.items,
      });
      // Usar item genérico em caso de erro
      items = [
        {
          name: "Produto SyncAds",
          price: order.total || 0,
          quantity: 1,
        },
      ];
    }

    // ============================================
    // ETAPA 6: PREPARAR PAYLOAD SHOPIFY
    // ============================================
    let shopifyPayload: any;
    try {
      const lineItems = items.map((item: any) => {
        const lineItem: any = {
          title: item.name || "Produto",
          price: String((item.price || 0).toFixed(2)),
          quantity: item.quantity || 1,
          requires_shipping: true,
          taxable: false,
        };

        // Adicionar variant_id apenas se existir e for válido
        if (item.variantId) {
          const variantIdStr = String(item.variantId).trim();
          if (
            variantIdStr &&
            variantIdStr !== "null" &&
            variantIdStr !== "undefined"
          ) {
            lineItem.variant_id = Number(variantIdStr);
          }
        }

        return lineItem;
      });

      // Nome do cliente
      const customerName = order.customerName || "Cliente SyncAds";
      const nameParts = customerName.split(" ");
      const firstName = nameParts[0] || "Cliente";
      const lastName = nameParts.slice(1).join(" ") || "SyncAds";

      // Endereços de entrega e cobrança
      let shippingAddress: any = undefined;
      if (order.shippingAddress && typeof order.shippingAddress === "object") {
        const sa = order.shippingAddress;
        if (sa.street) {
          shippingAddress = {
            first_name: firstName,
            last_name: lastName,
            address1: `${sa.street}${sa.number ? `, ${sa.number}` : ""}`,
            address2: sa.complement || sa.neighborhood || undefined,
            city: sa.city || undefined,
            province: sa.state || undefined,
            zip: sa.zipCode || undefined,
            country: "Brazil",
            country_code: "BR",
            phone: formatPhoneE164(order.customerPhone),
          };
        }
      }

      let billingAddress: any = undefined;
      if (order.billingAddress && typeof order.billingAddress === "object") {
        const ba = order.billingAddress;
        if (ba.street) {
          billingAddress = {
            first_name: firstName,
            last_name: lastName,
            address1: `${ba.street}${ba.number ? `, ${ba.number}` : ""}`,
            address2: ba.complement || ba.neighborhood || undefined,
            city: ba.city || undefined,
            province: ba.state || undefined,
            zip: ba.zipCode || undefined,
            country: "Brazil",
            country_code: "BR",
            phone: formatPhoneE164(order.customerPhone),
          };
        }
      }

      shopifyPayload = {
        order: {
          line_items: lineItems,
          customer: {
            email: order.customerEmail || "cliente@syncads.com.br",
            first_name: firstName,
            last_name: lastName,
            phone: formatPhoneE164(order.customerPhone),
          },
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          financial_status: order.paymentStatus === "PAID" ? "paid" : "pending",
          note: `Pedido #${order.orderNumber} criado via SyncAds Checkout`,
          tags: "syncads,checkout-customizado",
          send_receipt: false,
          send_fulfillment_receipt: false,
          inventory_behaviour: "bypass",
        },
      };

      log("info", "📦 Payload preparado", {
        lineItemsCount: lineItems.length,
        customerEmail: shopifyPayload.order.customer.email,
        customerName: `${firstName} ${lastName}`,
        financialStatus: shopifyPayload.order.financial_status,
      });
    } catch (payloadError: any) {
      log("error", "❌ Erro ao preparar payload", {
        error: payloadError.message,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to prepare Shopify payload",
          message: payloadError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ============================================
    // ETAPA 7: ENVIAR PARA SHOPIFY
    // ============================================
    let shopifyOrderId: string;
    let shopifyOrderNumber: number;
    try {
      const shopifyApiUrl = `https://${integration.shopDomain}/admin/api/2024-01/orders.json`;

      log("info", "📤 Enviando para Shopify", {
        url: shopifyApiUrl,
        shopDomain: integration.shopDomain,
        hasAccessToken: !!integration.accessToken,
        accessTokenLength: integration.accessToken?.length,
      });

      let shopifyResponse = await fetch(shopifyApiUrl, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": integration.accessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(shopifyPayload),
      });

      let responseText = await shopifyResponse.text();

      log("info", "📥 Resposta da Shopify", {
        status: shopifyResponse.status,
        statusText: shopifyResponse.statusText,
        ok: shopifyResponse.ok,
        bodyLength: responseText.length,
      });

      // Se der erro 422 de conflito de telefone ("phone has already been taken" ou similar),
      // tentamos remover o telefone e enviar novamente.
      if (!shopifyResponse.ok && shopifyResponse.status === 422 && responseText.toLowerCase().includes("phone")) {
        log("warn", "⚠️ Conflito de telefone detectado na Shopify (422). Removendo campos de telefone e tentando novamente...", {
          originalPayload: {
            customerPhone: shopifyPayload.order.customer?.phone,
            shippingPhone: shopifyPayload.order.shipping_address?.phone,
            billingPhone: shopifyPayload.order.billing_address?.phone,
          }
        });

        // Remover telefone do cliente e dos endereços
        const retryPayload = JSON.parse(JSON.stringify(shopifyPayload));
        if (retryPayload.order.customer) {
          delete retryPayload.order.customer.phone;
        }
        if (retryPayload.order.shipping_address) {
          delete retryPayload.order.shipping_address.phone;
        }
        if (retryPayload.order.billing_address) {
          delete retryPayload.order.billing_address.phone;
        }

        log("info", "📤 Reenviando para Shopify sem telefone", {
          url: shopifyApiUrl,
          customerEmail: retryPayload.order.customer?.email,
        });

        shopifyResponse = await fetch(shopifyApiUrl, {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": integration.accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(retryPayload),
        });

        responseText = await shopifyResponse.text();

        log("info", "📥 Resposta da Shopify (Tentativa de recuperação)", {
          status: shopifyResponse.status,
          statusText: shopifyResponse.statusText,
          ok: shopifyResponse.ok,
          bodyLength: responseText.length,
        });
      }

      if (!shopifyResponse.ok) {
        let errorDetails;
        try {
          errorDetails = JSON.parse(responseText);
        } catch {
          errorDetails = responseText;
        }

        log("error", "❌ Shopify retornou erro", {
          status: shopifyResponse.status,
          statusText: shopifyResponse.statusText,
          error: errorDetails,
          payload: shopifyPayload,
        });

        return new Response(
          JSON.stringify({
            success: false,
            error: "Shopify API error",
            status: shopifyResponse.status,
            details: errorDetails,
            hint: "Verifique as credenciais da Shopify e permissões do app",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      const shopifyOrder = JSON.parse(responseText);
      shopifyOrderId = shopifyOrder.order?.id;
      shopifyOrderNumber = shopifyOrder.order?.order_number;

      log("info", "✅ Pedido criado na Shopify!", {
        shopifyOrderId,
        shopifyOrderNumber,
        adminUrl: `https://${integration.shopDomain}/admin/orders/${shopifyOrderId}`,
      });
    } catch (shopifyError: any) {
      log("error", "❌ Erro ao comunicar com Shopify", {
        error: shopifyError.message,
        stack: shopifyError.stack,
        shopDomain: integration?.shopDomain,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to communicate with Shopify",
          message: shopifyError.message,
          hint: "Verifique a conexão com a Shopify e as credenciais",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ============================================
    // ETAPA 8: ATUALIZAR METADATA DO PEDIDO
    // ============================================
    try {
      await supabase
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

      log("info", "✅ Metadata atualizado");
    } catch (metadataError: any) {
      log("warn", "⚠️ Erro ao atualizar metadata (não crítico)", {
        error: metadataError.message,
      });
      // Não falhar por causa disso
    }

    // ============================================
    // ETAPA 9: REGISTRAR NO HISTÓRICO
    // ============================================
    try {
      await supabase.from("OrderHistory").insert({
        orderId: orderId,
        action: "SYNCED_TO_SHOPIFY",
        description: `Pedido sincronizado com Shopify #${shopifyOrderNumber}`,
        metadata: {
          shopifyOrderId,
          shopifyOrderNumber,
        },
      });

      log("info", "✅ Histórico registrado");
    } catch (historyError: any) {
      log("warn", "⚠️ Erro ao registrar histórico (não crítico)", {
        error: historyError.message,
      });
      // Não falhar por causa disso
    }

    // ============================================
    // SUCESSO!
    // ============================================
    const duration = Date.now() - startTime;
    log("info", "🎉 Sincronização concluída com sucesso!", {
      orderId,
      shopifyOrderId,
      shopifyOrderNumber,
      duration,
    });

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
    // ============================================
    // ERRO GERAL NÃO TRATADO
    // ============================================
    const duration = Date.now() - startTime;
    log("error", "❌ Erro não tratado", {
      error: error.message,
      stack: error.stack,
      orderId,
      userId,
      duration,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: "Unexpected error",
        message: error.message,
        orderId,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
