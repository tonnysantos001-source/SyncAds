// ============================================
// SYNCADS - UNIVERSAL PAYMENT WEBHOOK HANDLER
// ============================================
//
// Recebe notificações de webhooks de gateways de pagamento,
// enfileira-os em webhook_events e sincroniza o status no banco.
//
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";
import { getGateway } from "../process-payment/gateways/registry.ts";

// ===== LOGGING =====
function log(level: "info" | "warn" | "error", message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
    service: "payment-webhook",
  };

  if (level === "error") {
    console.error(JSON.stringify(logEntry));
  } else if (level === "warn") {
    console.warn(JSON.stringify(logEntry));
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

// ===== UPDATE WEBHOOK EVENT IN FILA =====
async function updateWebhookEvent(
  supabaseClient: any,
  eventId: string,
  updates: {
    status: string;
    errorMessage?: string;
  }
) {
  try {
    const { error } = await supabaseClient
      .from("webhook_events")
      .update({
        status: updates.status,
        errorMessage: updates.errorMessage || null,
        processedAt: updates.status === "processed" ? new Date().toISOString() : null,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", eventId);

    if (error) {
      log("error", `Failed to update webhook event status for ${eventId}`, { error });
    }
  } catch (error) {
    log("error", `Error updating webhook event status ${eventId}`, { error });
  }
}

// ===== NORMALIZATION =====
function normalizeGatewaySlug(slug: string): string {
  const slugMap: Record<string, string> = {
    mercadopago: "mercado-pago",
    mercado_pago: "mercado-pago",
    moip: "wirecard-moip",
    wirecard: "wirecard-moip",
    pagbank: "pagseguro",
    pagarme: "pagarme",
    "pagar.me": "pagarme",
  };
  return slugMap[slug.toLowerCase()] || slug.toLowerCase();
}

function extractGatewayFromRequest(req: Request): string | null {
  const url = new URL(req.url);
  const pathParts = url.pathname.split("/").filter((p) => p);
  if (pathParts.length > 1) {
    return normalizeGatewaySlug(pathParts[pathParts.length - 1]);
  }
  const gatewayParam = url.searchParams.get("gateway");
  if (gatewayParam) {
    return normalizeGatewaySlug(gatewayParam);
  }
  const userAgent = req.headers.get("user-agent") || "";
  if (userAgent.toLowerCase().includes("stripe")) return "stripe";
  if (userAgent.toLowerCase().includes("mercadopago")) return "mercado-pago";
  if (userAgent.toLowerCase().includes("pagseguro")) return "pagseguro";
  return null;
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

// ===== UPDATE TRANSACTION STATUS =====
async function updateTransactionStatus(
  supabaseClient: any,
  gatewayTransactionId: string,
  status: string,
  webhookMetadata: any,
) {
  log("info", `Updating transaction status for ${gatewayTransactionId}`, { status });

  // Buscar transação pelo gatewayTransactionId ou pelo id interno
  let { data: transaction, error: findError } = await supabaseClient
    .from("Transaction")
    .select("id, orderId, userId, amount, status, metadata, paymentGatewayId, gatewayId")
    .eq("gatewayTransactionId", gatewayTransactionId)
    .maybeSingle();

  if (!transaction) {
    const { data: transactionById, error: findError2 } = await supabaseClient
      .from("Transaction")
      .select("id, orderId, userId, amount, status, metadata, paymentGatewayId, gatewayId")
      .eq("id", gatewayTransactionId)
      .maybeSingle();

    if (transactionById) {
      transaction = transactionById;
    }
  }

  if (!transaction) {
    log("warn", "Transaction not found for status update", { gatewayTransactionId });
    return;
  }

  const currentStatus = transaction.status;

  if (currentStatus === status) {
    log("info", "Transaction status is already up to date", { transactionId: transaction.id, status });
    return;
  }

  // Atualizar transação
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
          previousStatus: currentStatus,
          gateway: webhookMetadata.gateway,
        },
      ],
      lastWebhook: webhookMetadata,
    },
  };

  if (status === "approved") {
    updateData.paidAt = new Date().toISOString();
  }

  const { error: updateError } = await supabaseClient
    .from("Transaction")
    .update(updateData)
    .eq("id", transaction.id);

  if (updateError) {
    log("error", "Error updating transaction in database", { error: updateError });
    throw updateError;
  }

  log("info", `✅ Transaction ${transaction.id} updated to ${status}`);

  if (transaction.orderId) {
    await updateOrderStatus(supabaseClient, transaction.orderId, status);
  }

  if (status === "approved") {
    await handleApprovedPayment(supabaseClient, transaction);
  } else if (status === "failed") {
    await handleFailedPayment(supabaseClient, transaction);
  }
}

// ===== MAIN HANDLER =====
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  let webhookEventId: string | null = null;
  let supabaseClient: any = null;

  try {
    supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const gatewaySlug = extractGatewayFromRequest(req);
    if (!gatewaySlug) {
      log("warn", "Gateway not specified in request URL");
      return new Response(JSON.stringify({ error: "Gateway not specified" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bodyText = await req.text();
    const signature =
      req.headers.get("x-signature") ||
      req.headers.get("stripe-signature") ||
      req.headers.get("x-hub-signature") ||
      req.headers.get("x-webhook-signature") ||
      "";

    let payload: any;
    try {
      payload = JSON.parse(bodyText);
    } catch {
      payload = { raw: bodyText };
    }

    const eventType = payload.type || payload.event || "unknown";

    // 1. Inserir webhook imediatamente na tabela webhook_events com status 'pending' (Fila)
    const { data: insertedEvent, error: insertError } = await supabaseClient
      .from("webhook_events")
      .insert({
        gateway: gatewaySlug,
        eventType,
        payload,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !insertedEvent) {
      log("error", "Failed to enqueue webhook event", { error: insertError });
      throw new Error(`Queue insert failed: ${insertError?.message}`);
    }

    webhookEventId = insertedEvent.id;

    // 2. Obter processador modular correspondente
    const processor = getGateway(gatewaySlug);
    if (!processor) {
      const errorMsg = `Gateway processor not found: ${gatewaySlug}`;
      log("warn", errorMsg);
      await updateWebhookEvent(supabaseClient, webhookEventId, {
        status: "failed",
        errorMessage: errorMsg,
      });
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3. Atualizar status para 'processing'
    await updateWebhookEvent(supabaseClient, webhookEventId, { status: "processing" });

    // 4. Executar handleWebhook no processor correspondente
    const webhookRes = await processor.handleWebhook(payload, signature);
    if (!webhookRes.success || !webhookRes.processed) {
      const errorMsg = webhookRes.message || "Webhook handler returned failure";
      log("warn", `Webhook handler failed: ${errorMsg}`);
      await updateWebhookEvent(supabaseClient, webhookEventId, {
        status: "failed",
        errorMessage: errorMsg,
      });
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const gatewayTransactionId = webhookRes.gatewayTransactionId;
    if (!gatewayTransactionId) {
      const errorMsg = "Webhook response did not contain gatewayTransactionId";
      log("warn", errorMsg);
      await updateWebhookEvent(supabaseClient, webhookEventId, {
        status: "failed",
        errorMessage: errorMsg,
      });
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. Buscar transação no banco para obter o userId
    let { data: transaction } = await supabaseClient
      .from("Transaction")
      .select("id, orderId, userId, amount, status, metadata, paymentGatewayId, gatewayId")
      .eq("gatewayTransactionId", gatewayTransactionId)
      .maybeSingle();

    if (!transaction) {
      const { data: transactionById } = await supabaseClient
        .from("Transaction")
        .select("id, orderId, userId, amount, status, metadata, paymentGatewayId, gatewayId")
        .eq("id", gatewayTransactionId)
        .maybeSingle();
      if (transactionById) {
        transaction = transactionById;
      }
    }

    if (!transaction) {
      const errorMsg = `Transaction not found for gatewayTransactionId: ${gatewayTransactionId}`;
      log("warn", errorMsg);
      await updateWebhookEvent(supabaseClient, webhookEventId, {
        status: "failed",
        errorMessage: errorMsg,
      });
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 6. Carregar active GatewayConfig para esse userId e gatewayId correspondente
    const paymentGatewayId = transaction.paymentGatewayId || transaction.gatewayId;
    const { data: config, error: configError } = await supabaseClient
      .from("GatewayConfig")
      .select("*")
      .eq("userId", transaction.userId)
      .eq("paymentGatewayId", paymentGatewayId)
      .eq("isActive", true)
      .maybeSingle();

    if (configError || !config) {
      const errorMsg = `GatewayConfig not found for user: ${transaction.userId} and gateway: ${paymentGatewayId}`;
      log("error", errorMsg);
      await updateWebhookEvent(supabaseClient, webhookEventId, {
        status: "failed",
        errorMessage: errorMsg,
      });
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 7. Resolver credenciais decriptadas e fazer chamada healthCheck/getPaymentStatus de segurança
    const decryptedCreds = await (processor as any).resolveCredentials(config);
    const resolvedConfig = { ...config, credentials: decryptedCreds };

    // Validação da assinatura usando o secret decriptado (se aplicável)
    const secret = decryptedCreds.webhookSecret || decryptedCreds.apiKey || decryptedCreds.token;
    if (secret) {
      const sigValidation = await processor.validateWebhook(payload, signature, secret);
      if (!sigValidation.isValid) {
        const errorMsg = sigValidation.error || "Invalid webhook signature";
        log("error", errorMsg);
        await updateWebhookEvent(supabaseClient, webhookEventId, {
          status: "failed",
          errorMessage: errorMsg,
        });
        return new Response(JSON.stringify({ error: errorMsg }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 8. Consultar o status oficial diretamente via API (segurança máxima anti-fraude)
    log("info", `Fetching official status from ${gatewaySlug} API for verification...`);
    const officialPayment = await processor.getPayment(gatewayTransactionId, resolvedConfig);

    // 9. Atualizar o status da transação e do pedido
    await updateTransactionStatus(supabaseClient, gatewayTransactionId, officialPayment.status, {
      gateway: gatewaySlug,
      webhookEventId,
      officialStatus: officialPayment.status,
      processingTime: Date.now() - startTime,
    });

    // 10. Sucesso
    await updateWebhookEvent(supabaseClient, webhookEventId, { status: "processed" });

    log("info", "Webhook processed successfully", {
      gatewayTransactionId,
      status: officialPayment.status,
      duration: `${Date.now() - startTime}ms`
    });

    return new Response(JSON.stringify({ success: true, status: officialPayment.status }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    log("error", "Error handling webhook", { error: error.message, stack: error.stack });
    
    if (supabaseClient && webhookEventId) {
      await updateWebhookEvent(supabaseClient, webhookEventId, {
        status: "failed",
        errorMessage: error.message || "Unknown error",
      });
    }

    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
