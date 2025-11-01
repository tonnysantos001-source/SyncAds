// ============================================
// SYNCADS - UNIVERSAL PAYMENT WEBHOOK HANDLER
// ============================================
//
// Recebe notificações de webhooks de TODOS os 53 gateways
// de pagamento e atualiza o status das transações automaticamente.
//
// Suporte Universal para:
// ✅ Stripe, Asaas, Mercado Pago (prioritários)
// ✅ Cielo, GetNet, Iugu, PagSeguro, PayPal, PicPay, Rede, Stone, Vindi
// ✅ Wirecard (Moip), SafetyPay, e mais 40 gateways
//
// Total: 53 gateways implementados
//
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// Importar registry de gateways
import { getGateway } from "../process-payment/gateways/registry.ts";

// ===== TIPOS =====

interface WebhookEvent {
  gateway: string;
  eventType: string;
  transactionId: string;
  gatewayTransactionId: string;
  status:
    | "pending"
    | "processing"
    | "approved"
    | "failed"
    | "cancelled"
    | "refunded"
    | "expired";
  amount?: number;
  currency?: string;
  metadata?: any;
}

// ===== LOGGING =====

function log(level: "info" | "warn" | "error", message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };

  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

// ===== GATEWAY CONFIG LOADER =====

async function loadGatewayConfig(supabaseClient: any, gatewaySlug: string) {
  try {
    const { data: gateway, error: gatewayError } = await supabaseClient
      .from("Gateway")
      .select("id")
      .eq("slug", gatewaySlug)
      .single();

    if (gatewayError || !gateway) {
      log("error", `Gateway not found: ${gatewaySlug}`, {
        error: gatewayError,
      });
      return null;
    }

    const { data: config, error: configError } = await supabaseClient
      .from("GatewayConfig")
      .select("*")
      .eq("gatewayId", gateway.id)
      .eq("isActive", true)
      .single();

    if (configError || !config) {
      log("error", `Active config not found for gateway: ${gatewaySlug}`, {
        error: configError,
      });
      return null;
    }

    return {
      gatewayId: gateway.id,
      credentials: config.credentials,
      testMode: config.testMode,
    };
  } catch (error) {
    log("error", "Error loading gateway config", { gatewaySlug, error });
    return null;
  }
}

// ===== UNIVERSAL WEBHOOK HANDLER =====

async function handleUniversalWebhook(
  req: Request,
  supabaseClient: any,
  gatewaySlug: string,
) {
  try {
    log("info", `Webhook received from ${gatewaySlug}`);

    // Carregar configuração do gateway
    const config = await loadGatewayConfig(supabaseClient, gatewaySlug);
    if (!config) {
      throw new Error(`Gateway ${gatewaySlug} not configured or inactive`);
    }

    // Obter processor do gateway
    const gatewayProcessor = getGateway(gatewaySlug);
    if (!gatewayProcessor) {
      throw new Error(`Gateway processor not found: ${gatewaySlug}`);
    }

    // Obter corpo e assinatura
    const body = await req.text();
    const signature =
      req.headers.get("x-signature") ||
      req.headers.get("stripe-signature") ||
      req.headers.get("x-hub-signature") ||
      req.headers.get("x-webhook-signature") ||
      undefined;

    // Processar webhook usando o handler do gateway
    let payload;
    try {
      payload = JSON.parse(body);
    } catch {
      payload = body;
    }

    const webhookResponse = await gatewayProcessor.handleWebhook(
      payload,
      signature,
    );

    if (!webhookResponse.success) {
      log("warn", "Webhook processing failed", {
        gateway: gatewaySlug,
        message: webhookResponse.message,
      });

      return new Response(
        JSON.stringify({
          error: webhookResponse.message,
          processed: false,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    // Atualizar transação no banco de dados
    if (webhookResponse.transactionId && webhookResponse.status) {
      await updateTransactionStatus(
        supabaseClient,
        webhookResponse.gatewayTransactionId || webhookResponse.transactionId,
        webhookResponse.status,
        {
          gateway: gatewaySlug,
          webhookData: payload,
          webhookResponse,
        },
      );
    }

    log("info", "Webhook processed successfully", {
      gateway: gatewaySlug,
      transactionId: webhookResponse.transactionId,
      status: webhookResponse.status,
    });

    return new Response(
      JSON.stringify({
        received: true,
        processed: true,
        transactionId: webhookResponse.transactionId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    log("error", `Webhook error for ${gatewaySlug}`, {
      error: error.message,
      stack: error.stack,
    });

    return new Response(
      JSON.stringify({
        error: error.message,
        gateway: gatewaySlug,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
}

// ===== UPDATE TRANSACTION STATUS =====

async function updateTransactionStatus(
  supabaseClient: any,
  gatewayTransactionId: string,
  status: string,
  webhookMetadata: any,
) {
  try {
    log("info", `Updating transaction ${gatewayTransactionId}`, { status });

    // Buscar transação pelo gatewayTransactionId
    const { data: transaction, error: findError } = await supabaseClient
      .from("Transaction")
      .select("id, orderId, userId, amount, status as currentStatus, metadata")
      .eq("gatewayTransactionId", gatewayTransactionId)
      .single();

    if (findError || !transaction) {
      // Tentar buscar pelo transactionId interno
      const { data: transactionByInternalId, error: findError2 } =
        await supabaseClient
          .from("Transaction")
          .select(
            "id, orderId, userId, amount, status as currentStatus, metadata",
          )
          .eq("id", gatewayTransactionId)
          .single();

      if (findError2 || !transactionByInternalId) {
        log("warn", "Transaction not found", { gatewayTransactionId });
        return;
      }

      // Usar transação encontrada por ID interno
      Object.assign(transaction, transactionByInternalId);
    }

    // Não atualizar se já está no mesmo status
    if (transaction.currentStatus === status) {
      log("info", "Transaction already in this status", {
        transactionId: transaction.id,
        status,
      });
      return;
    }

    // Atualizar status da transação
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString(),
      metadata: {
        ...transaction.metadata,
        webhookHistory: [
          ...(transaction.metadata?.webhookHistory || []),
          {
            timestamp: new Date().toISOString(),
            status,
            gateway: webhookMetadata.gateway,
          },
        ],
        lastWebhook: webhookMetadata,
      },
    };

    // Se aprovado, adicionar data de pagamento
    if (status === "approved") {
      updateData.paidAt = new Date().toISOString();
    }

    const { error: updateError } = await supabaseClient
      .from("Transaction")
      .update(updateData)
      .eq("id", transaction.id);

    if (updateError) {
      log("error", "Error updating transaction", { error: updateError });
      return;
    }

    log("info", `✅ Transaction ${transaction.id} updated to ${status}`);

    // Atualizar status do pedido baseado no status da transação
    if (transaction.orderId) {
      await updateOrderStatus(supabaseClient, transaction.orderId, status);
    }

    // Disparar eventos pós-pagamento
    if (status === "approved") {
      await handleApprovedPayment(supabaseClient, transaction);
    } else if (status === "failed") {
      await handleFailedPayment(supabaseClient, transaction);
    }
  } catch (error: any) {
    log("error", "Error in updateTransactionStatus", {
      error: error.message,
      stack: error.stack,
    });
  }
}

// ===== UPDATE ORDER STATUS =====

async function updateOrderStatus(
  supabaseClient: any,
  orderId: string,
  transactionStatus: string,
) {
  try {
    let orderStatus = "pending";

    switch (transactionStatus) {
      case "approved":
        orderStatus = "paid";
        break;
      case "failed":
      case "cancelled":
        orderStatus = "payment_failed";
        break;
      case "refunded":
        orderStatus = "refunded";
        break;
      case "processing":
        orderStatus = "processing";
        break;
    }

    const { error } = await supabaseClient
      .from("Order")
      .update({
        status: orderStatus,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      log("error", "Error updating order", { orderId, error });
      return;
    }

    log("info", `✅ Order ${orderId} updated to ${orderStatus}`);
  } catch (error: any) {
    log("error", "Error in updateOrderStatus", { error: error.message });
  }
}

// ===== POST-PAYMENT HANDLERS =====

async function handleApprovedPayment(supabaseClient: any, transaction: any) {
  try {
    log("info", "Processing approved payment", {
      transactionId: transaction.id,
    });

    // TODO: Implementar ações pós-aprovação
    // - Enviar email de confirmação
    // - Atualizar estoque
    // - Gerar nota fiscal
    // - Disparar webhooks customizados
    // - Notificar vendedor
    // - Iniciar fulfillment

    // Registrar log de evento
    await supabaseClient.from("PaymentEvent").insert({
      transactionId: transaction.id,
      orderId: transaction.orderId,
      userId: transaction.userId,
      eventType: "payment_approved",
      eventData: {
        amount: transaction.amount,
        approvedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    });

    log("info", "✅ Approved payment processed");
  } catch (error: any) {
    log("error", "Error handling approved payment", { error: error.message });
  }
}

async function handleFailedPayment(supabaseClient: any, transaction: any) {
  try {
    log("info", "Processing failed payment", { transactionId: transaction.id });

    // TODO: Implementar ações pós-falha
    // - Enviar email de falha
    // - Notificar vendedor
    // - Sugerir novos métodos de pagamento

    // Registrar log de evento
    await supabaseClient.from("PaymentEvent").insert({
      transactionId: transaction.id,
      orderId: transaction.orderId,
      userId: transaction.userId,
      eventType: "payment_failed",
      eventData: {
        amount: transaction.amount,
        failedAt: new Date().toISOString(),
      },
      createdAt: new Date().toISOString(),
    });

    log("info", "✅ Failed payment processed");
  } catch (error: any) {
    log("error", "Error handling failed payment", { error: error.message });
  }
}

// ===== GATEWAY SLUG NORMALIZATION =====

function normalizeGatewaySlug(slug: string): string {
  // Normalizar slugs comuns
  const slugMap: Record<string, string> = {
    mercadopago: "mercado-pago",
    mercado_pago: "mercado-pago",
    moip: "wirecard-moip",
    wirecard: "wirecard-moip",
    pagbank: "pagseguro", // PagBank é o novo nome do PagSeguro
    pagarme: "pagarme",
    "pagar.me": "pagarme",
  };

  const normalized = slugMap[slug.toLowerCase()] || slug.toLowerCase();
  return normalized;
}

// ===== WEBHOOK ROUTING =====

function extractGatewayFromRequest(req: Request): string | null {
  const url = new URL(req.url);

  // Tentar extrair do path: /payment-webhook/gateway-slug
  const pathParts = url.pathname.split("/").filter((p) => p);
  if (pathParts.length > 1) {
    return normalizeGatewaySlug(pathParts[pathParts.length - 1]);
  }

  // Tentar extrair do query param: ?gateway=slug
  const gatewayParam = url.searchParams.get("gateway");
  if (gatewayParam) {
    return normalizeGatewaySlug(gatewayParam);
  }

  // Tentar detectar do header User-Agent ou custom headers
  const userAgent = req.headers.get("user-agent") || "";
  if (userAgent.toLowerCase().includes("stripe")) return "stripe";
  if (userAgent.toLowerCase().includes("mercadopago")) return "mercado-pago";
  if (userAgent.toLowerCase().includes("pagseguro")) return "pagseguro";

  return null;
}

// ===== MAIN HANDLER =====

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Criar cliente Supabase com service role (bypass RLS)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Extrair gateway do request
    const gatewaySlug = extractGatewayFromRequest(req);

    if (!gatewaySlug) {
      log("warn", "Could not determine gateway from request", {
        url: req.url,
        userAgent: req.headers.get("user-agent"),
      });

      return new Response(
        JSON.stringify({
          error: "Gateway not specified",
          hint: "Use path /payment-webhook/{gateway-slug} or query param ?gateway={slug}",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        },
      );
    }

    log("info", `Processing webhook for gateway: ${gatewaySlug}`);

    // Processar webhook
    const response = await handleUniversalWebhook(
      req,
      supabaseClient,
      gatewaySlug,
    );

    const duration = Date.now() - startTime;
    log("info", `Webhook processed in ${duration}ms`, { gateway: gatewaySlug });

    return response;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    log("error", "Fatal webhook error", {
      error: error.message,
      stack: error.stack,
      duration,
    });

    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
        code: "WEBHOOK_ERROR",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});

// ===== HEALTH CHECK =====

// Se acessar sem gateway, retornar health check
// GET /payment-webhook -> retorna lista de gateways suportados
