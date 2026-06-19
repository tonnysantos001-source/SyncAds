// ============================================
// SYNCADS - PROCESS PAYMENT EDGE FUNCTION
// ============================================
//
// Processa pagamentos via múltiplos gateways de forma modular:
// - Asaas
// - Mercado Pago
// - PagBank (PagSeguro)
// - Pagar.me
//
// Inclui:
// - Validação de dados
// - Failover automático por prioridade
// - Gravação de logs enriquecidos
// - Fila de webhook_events
// - Rate limiting
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";
import { getGateway } from "./gateways/registry.ts";
import type { PaymentMethod as GatewayPaymentMethod, PaymentResponse } from "./gateways/types.ts";

interface PaymentRequest {
  userId: string;
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod: "credit_card" | "debit_card" | "pix" | "boleto" | "paypal";
  customer: {
    name: string;
    email: string;
    document: string; // CPF/CNPJ
    phone?: string;
  };
  card?: {
    number: string;
    holderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
  };
  billingAddress?: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
}

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    // Cliente com service_role para DB (bypassa RLS - operações de checkout público)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Parse request
    const body = await req.json();
    const paymentRequest: PaymentRequest = body;

    console.log("[PAYMENT] Request recebida:", {
      orderId: paymentRequest.orderId,
      userId: paymentRequest.userId,
      amount: paymentRequest.amount,
      paymentMethod: paymentRequest.paymentMethod,
    });

    // 1. Atualizar o pedido no banco com os dados do cliente
    if (paymentRequest.orderId && !paymentRequest.orderId.startsWith("verification-")) {
      let mappedPaymentMethod = "PIX";
      if (paymentRequest.paymentMethod === "credit_card" || paymentRequest.paymentMethod === "debit_card") {
        mappedPaymentMethod = "CREDIT_CARD";
      } else if (paymentRequest.paymentMethod === "boleto") {
        mappedPaymentMethod = "BOLETO";
      } else if (paymentRequest.paymentMethod === "paypal") {
        mappedPaymentMethod = "PAYPAL";
      }

      await supabaseAdmin
        .from("Order")
        .update({
          customerName: paymentRequest.customer?.name || "Cliente",
          customerEmail: paymentRequest.customer?.email || "",
          customerPhone: paymentRequest.customer?.phone || "",
          customerCpf: paymentRequest.customer?.document?.replace(/\D/g, "") || "",
          shippingAddress: {
            zipCode: paymentRequest.billingAddress?.zipCode?.replace(/\D/g, "") || "",
            street: paymentRequest.billingAddress?.street || "",
            number: paymentRequest.billingAddress?.number || "",
            complement: paymentRequest.billingAddress?.complement || "",
            neighborhood: paymentRequest.billingAddress?.neighborhood || "",
            city: paymentRequest.billingAddress?.city || "",
            state: paymentRequest.billingAddress?.state || "",
          },
          paymentMethod: mappedPaymentMethod,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", paymentRequest.orderId);
    }

    // ===== VALIDAÇÃO #1: Campos obrigatórios =====
    if (!paymentRequest.userId || !paymentRequest.orderId || !paymentRequest.amount) {
      throw new Error("Missing required fields: userId, orderId, amount");
    }

    if (paymentRequest.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // ===== VALIDAÇÃO #2: Verificar se o pedido já está pago =====
    const { data: existingTransactions } = await supabaseAdmin
      .from("Transaction")
      .select("id, status, paymentMethod, createdAt")
      .eq("orderId", paymentRequest.orderId)
      .in("status", ["PAID", "PROCESSING"])
      .order("createdAt", { ascending: false })
      .limit(1);

    if (existingTransactions && existingTransactions.length > 0) {
      const existing = existingTransactions[0];
      return new Response(
        JSON.stringify({
          success: false,
          status: "ALREADY_PAID",
          message: "Este pedido já foi pago ou está sendo processado",
          error: "ORDER_ALREADY_PAID",
          existingTransaction: {
            id: existing.id,
            status: existing.status,
            paymentMethod: existing.paymentMethod,
          },
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ===== VALIDAÇÃO #3: Rate Limiting via service_role =====
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentAttempts, error: rateLimitError } = await supabaseAdmin
      .from("Transaction")
      .select("id")
      .eq("userId", paymentRequest.userId)
      .gte("createdAt", oneMinuteAgo);

    if (!rateLimitError && recentAttempts && recentAttempts.length >= 10) {
      return new Response(
        JSON.stringify({
          success: false,
          status: "RATE_LIMIT_EXCEEDED",
          message: "Muitas tentativas de pagamento. Aguarde um minuto e tente novamente.",
          error: "RATE_LIMIT_EXCEEDED",
          retryAfter: 60,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    // ===== BUSCAR GATEWAYS DO USUÁRIO ORDENADOS POR PRIORIDADE (FAILOVER) =====
    const { data: gatewayConfigs, error: gatewayError } = await supabaseAdmin
      .from("GatewayConfig")
      .select("*, Gateway:payment_gateways(*)")
      .eq("userId", paymentRequest.userId)
      .eq("isActive", true)
      .order("priority", { ascending: true })
      .order("isDefault", { ascending: false });

    if (gatewayError || !gatewayConfigs || gatewayConfigs.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          status: "failed",
          message: "Nenhum gateway de pagamento disponível para esta loja.",
          error: "NO_ACTIVE_GATEWAY",
          requiresSetup: true,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 422 }
      );
    }

    // ===== LOGICA DE FAILOVER AUTOMÁTICO =====
    let paymentResponse: PaymentResponse | null = null;
    let selectedConfig: any = null;
    let selectedGateway: any = null;
    let errorAttempts: string[] = [];

    for (const config of gatewayConfigs) {
      const gateway = config.Gateway;
      if (!gateway || !gateway.implemented) {
        console.warn(`[PAYMENT] Skipping config ${config.id} because gateway is not implemented.`);
        continue;
      }

      console.log(`[PAYMENT] Tentando processar pagamento com: ${gateway.slug} (Prioridade: ${config.priority})`);

      try {
        const gatewayProcessor = getGateway(gateway.slug);
        if (!gatewayProcessor) {
          throw new Error(`Processador modular não encontrado para o gateway: ${gateway.slug}`);
        }

        // Mapear paymentMethod
        const gatewayPaymentMethodMap: Record<string, GatewayPaymentMethod> = {
          credit_card: "credit_card" as GatewayPaymentMethod,
          debit_card: "debit_card" as GatewayPaymentMethod,
          pix: "pix" as GatewayPaymentMethod,
          boleto: "boleto" as GatewayPaymentMethod,
        };

        const gatewayRequest = {
          userId: paymentRequest.userId,
          orderId: paymentRequest.orderId,
          amount: paymentRequest.amount,
          currency: paymentRequest.currency || "BRL",
          paymentMethod: gatewayPaymentMethodMap[paymentRequest.paymentMethod] || ("pix" as GatewayPaymentMethod),
          customer: paymentRequest.customer,
          card: paymentRequest.card,
          billingAddress: paymentRequest.billingAddress,
          metadata: {
            transactionId: crypto.randomUUID(), // ID temporário gerado para rastreamento de logs
          }
        };

        // Chamar o processador modular
        const response = await gatewayProcessor.createPayment(gatewayRequest, config);

        if (response.success) {
          paymentResponse = response;
          selectedConfig = config;
          selectedGateway = gateway;
          console.log(`[PAYMENT] Pagamento processado com sucesso usando: ${gateway.slug}`);
          break; // Sucesso, para o loop de failover!
        } else {
          console.warn(`[PAYMENT] Gateway ${gateway.slug} retornou erro: ${response.message}`);
          errorAttempts.push(`${gateway.slug}: ${response.message || "Erro desconhecido"}`);
        }
      } catch (err: any) {
        console.error(`[PAYMENT] Falha crítica ao processar no gateway ${gateway.slug}:`, err.message);
        errorAttempts.push(`${gateway.slug}: Exception - ${err.message}`);
      }
    }

    // Se nenhum gateway conseguiu processar o pagamento
    if (!paymentResponse || !selectedGateway) {
      return new Response(
        JSON.stringify({
          success: false,
          status: "failed",
          message: "Todos os gateways falharam ao processar o pagamento.",
          error: "ALL_GATEWAYS_FAILED",
          details: errorAttempts,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // ===== NORMALIZAÇÃO DE STATUS PARA TABELA TRANSACTION =====
    let dbStatus = "PENDING";
    const rawStatusUpper = (paymentResponse.status || "PENDING").toUpperCase();
    if (rawStatusUpper === "APPROVED" || rawStatusUpper === "PAID" || rawStatusUpper === "SUCCESS" || rawStatusUpper === "SUCCEEDED") {
      dbStatus = "PAID";
    } else if (rawStatusUpper === "FAILED" || rawStatusUpper === "FAIL" || rawStatusUpper === "REJECTED") {
      dbStatus = "FAILED";
    } else if (rawStatusUpper === "CANCELLED" || rawStatusUpper === "CANCELED") {
      dbStatus = "CANCELLED";
    } else if (rawStatusUpper === "PROCESSING") {
      dbStatus = "PROCESSING";
    } else if (rawStatusUpper === "REFUNDED") {
      dbStatus = "REFUNDED";
    } else if (rawStatusUpper === "EXPIRED") {
      dbStatus = "EXPIRED";
    }

    const gatewayTransactionId =
      paymentResponse.gatewayTransactionId ||
      paymentResponse.transactionId ||
      `fallback-${selectedGateway.slug}-${Date.now()}`;

    // Gravar transação no banco de dados
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from("Transaction")
      .insert({
        userId: paymentRequest.userId,
        orderId: paymentRequest.orderId,
        gatewayId: selectedGateway.id, // Legado (para evitar quebras no frontend/views)
        paymentGatewayId: selectedGateway.id, // Novo modular
        amount: paymentRequest.amount,
        currency: paymentRequest.currency || "BRL",
        status: dbStatus,
        transactionId: gatewayTransactionId,
        paymentMethod: paymentRequest.paymentMethod,
        // PIX
        pixQrCode: paymentResponse.qrCode,
        pixCopyPaste: paymentResponse.qrCode,
        pixExpiresAt: paymentResponse.expiresAt,
        // Boleto
        boletoUrl: paymentResponse.paymentUrl || paymentResponse.boletoData?.boletoUrl,
        boletoBarcode: paymentResponse.barcodeNumber || paymentResponse.boletoData?.barcode,
        boletoExpiresAt: paymentResponse.expiresAt || paymentResponse.boletoData?.dueDate,
        // Card
        cardBrand: paymentRequest.card ? "credit_card" : null,
        cardLast4: paymentRequest.card ? paymentRequest.card.number.slice(-4) : null,
        installments: (paymentRequest as any).installments || 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();

    if (transactionError) {
      console.error("[PAYMENT] Erro ao gravar transação no banco:", transactionError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: transaction?.id || gatewayTransactionId,
        gatewayTransactionId: gatewayTransactionId,
        status: dbStatus.toLowerCase(),
        paymentUrl: paymentResponse.paymentUrl,
        qrCode: paymentResponse.qrCode,
        qrCodeBase64: paymentResponse.qrCodeBase64,
        barcodeNumber: paymentResponse.barcodeNumber,
        digitableLine: paymentResponse.digitableLine,
        expiresAt: paymentResponse.expiresAt,
        message: paymentResponse.message,
        pixData: paymentResponse.pixData || (paymentRequest.paymentMethod === "pix" ? {
          qrCode: paymentResponse.qrCode || "",
          qrCodeBase64: paymentResponse.qrCodeBase64,
          expiresAt: paymentResponse.expiresAt,
          amount: paymentRequest.amount,
        } : undefined),
        boletoData: paymentResponse.boletoData,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[PAYMENT] Erro no handler principal:", error);
    return new Response(
      JSON.stringify({
        success: false,
        status: "failed",
        message: error.message || "Erro interno no processamento de pagamento",
        error: error.toString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
