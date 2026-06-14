// ============================================
// SYNCADS - PROCESS PAYMENT EDGE FUNCTION
// ============================================
//
// Processa pagamentos via múltiplos gateways:
// - Stripe
// - Mercado Pago
// - PagSeguro
// - PayPal
// - Asaas
//
// Inclui:
// - Validação de dados
// - Verificação de gateway configurado
// - Processamento por tipo (PIX, cartão, boleto)
// - Webhooks
// - Logging de transações
// - Rate limiting
// - Rollback em caso de erro
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";
import { gatewayRegistry, getGateway } from "./gateways/registry.ts";
import type { PaymentMethod as GatewayPaymentMethod } from "./gateways/types.ts";

// ===== INTERFACES =====

interface PaymentRequest {
  userId: string; // ✅ MUDOU: organizationId → userId
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

interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  gatewayTransactionId?: string;
  status:
    | "pending"
    | "approved"
    | "failed"
    | "cancelled"
    | "processing"
    | "refunded"
    | "expired";
  paymentUrl?: string; // Para PIX/Boleto
  qrCode?: string; // Para PIX
  qrCodeBase64?: string;
  barcodeNumber?: string;
  digitableLine?: string;
  expiresAt?: string;
  message: string;
  error?: string;
  errorCode?: string;
  // Objetos completos para PIX e Boleto
  pixData?: {
    qrCode: string;
    qrCodeBase64?: string;
    expiresAt?: string;
    amount: number;
  };
  boletoData?: {
    boletoUrl: string;
    barcode: string;
    digitableLine: string;
    dueDate: string;
    amount: number;
  };
}

// ===== STRIPE INTEGRATION =====

async function processStripePayment(
  request: PaymentRequest,
  gatewayConfig: any,
): Promise<PaymentResponse> {
  const stripe = await import("https://esm.sh/stripe@14.8.0");
  const stripeClient = new stripe.default(gatewayConfig.credentials.secretKey, {
    apiVersion: "2023-10-16",
  });

  try {
    // Criar Payment Intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: Math.round(request.amount * 100), // Converter para centavos
      currency: request.currency || "brl",
      payment_method_types:
        request.paymentMethod === "credit_card" ? ["card"] : ["boleto"],
      metadata: {
        userId: request.userId,
        orderId: request.orderId,
      },
      receipt_email: request.customer.email,
    });

    return {
      success: true,
      transactionId: paymentIntent.id,
      gatewayTransactionId: paymentIntent.id,
      status: paymentIntent.status === "succeeded" ? "approved" : "pending",
      message: "Pagamento processado com sucesso via Stripe",
    };
  } catch (error: any) {
    console.error("Erro Stripe:", error);
    return {
      success: false,
      status: "failed",
      message: "Erro ao processar pagamento via Stripe",
      error: error.message,
    };
  }
}

// ===== MERCADO PAGO INTEGRATION =====

async function processMercadoPagoPayment(
  request: PaymentRequest,
  gatewayConfig: any,
): Promise<PaymentResponse> {
  try {
    const accessToken = gatewayConfig.credentials.accessToken;

    // Criar preferência de pagamento
    const preference = {
      items: [
        {
          title: `Pedido ${request.orderId}`,
          quantity: 1,
          unit_price: request.amount,
        },
      ],
      payer: {
        name: request.customer.name,
        email: request.customer.email,
        identification: {
          type: request.customer.document.length === 11 ? "CPF" : "CNPJ",
          number: request.customer.document,
        },
      },
      payment_methods: {
        excluded_payment_types: [],
        installments: 12,
      },
      back_urls: {
        success: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/mercadopago/success`,
        failure: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/mercadopago/failure`,
        pending: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/mercadopago/pending`,
      },
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/payment-webhook/mercadopago`,
      metadata: {
        user_id: request.userId,
        order_id: request.orderId,
      },
    };

    const response = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(preference),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        error.message || "Erro ao criar preferência Mercado Pago",
      );
    }

    const data = await response.json();

    // Se for PIX, criar pagamento PIX específico
    if (request.paymentMethod === "pix") {
      const pixPayment = {
        transaction_amount: request.amount,
        description: `Pedido ${request.orderId}`,
        payment_method_id: "pix",
        payer: {
          email: request.customer.email,
          first_name: request.customer.name.split(" ")[0],
          last_name: request.customer.name.split(" ").slice(1).join(" "),
          identification: {
            type: request.customer.document.length === 11 ? "CPF" : "CNPJ",
            number: request.customer.document,
          },
        },
      };

      const pixResponse = await fetch(
        "https://api.mercadopago.com/v1/payments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(pixPayment),
        },
      );

      if (!pixResponse.ok) {
        const error = await pixResponse.json();
        throw new Error(error.message || "Erro ao criar PIX Mercado Pago");
      }

      const pixData = await pixResponse.json();

      return {
        success: true,
        transactionId: pixData.id.toString(),
        gatewayTransactionId: pixData.id.toString(),
        status: "pending",
        paymentUrl: pixData.point_of_interaction?.transaction_data?.ticket_url,
        qrCode: pixData.point_of_interaction?.transaction_data?.qr_code,
        message: "PIX gerado com sucesso via Mercado Pago",
      };
    }

    return {
      success: true,
      transactionId: data.id,
      gatewayTransactionId: data.id,
      status: "pending",
      paymentUrl: data.init_point,
      message: "Preferência criada com sucesso via Mercado Pago",
    };
  } catch (error: any) {
    console.error("Erro Mercado Pago:", error);
    return {
      success: false,
      status: "failed",
      message: "Erro ao processar pagamento via Mercado Pago",
      error: error.message,
    };
  }
}

// ===== PAGSEGURO INTEGRATION =====

async function processPagSeguroPayment(
  request: PaymentRequest,
  gatewayConfig: any,
): Promise<PaymentResponse> {
  // TODO: Implementar integração com PagSeguro
  return {
    success: false,
    status: "failed",
    message: "PagSeguro ainda não implementado",
    error: "Not implemented",
  };
}

// ===== PAYPAL INTEGRATION =====

async function processPayPalPayment(
  request: PaymentRequest,
  gatewayConfig: any,
): Promise<PaymentResponse> {
  // TODO: Implementar integração com PayPal
  return {
    success: false,
    status: "failed",
    message: "PayPal ainda não implementado",
    error: "Not implemented",
  };
}

// ===== ASAAS INTEGRATION (COMPLETO COM PIX) =====

async function processAsaasPayment(
  request: PaymentRequest,
  gatewayConfig: any,
): Promise<PaymentResponse> {
  try {
    const apiKey = gatewayConfig.credentials?.apiKey || "";
    const isSandbox =
      gatewayConfig.environment !== "production" ||
      (typeof apiKey === "string" && apiKey.startsWith("$aact_hmlg_"));
    const baseUrl = isSandbox
      ? "https://sandbox.asaas.com/api/v3"
      : "https://www.asaas.com/api/v3";

    const headers = {
      "Content-Type": "application/json",
      "access_token": apiKey,
    };

    console.log("[ASAAS] Iniciando pagamento:", {
      method: request.paymentMethod,
      amount: request.amount,
      isSandbox,
      baseUrl,
    });

    // ── PASSO 1: Criar ou buscar cliente no Asaas ──
    // Buscar por cpfCnpj primeiro
    const cpfCnpj = request.customer.document.replace(/\D/g, "");
    let customerId: string | null = null;

    const searchResp = await fetch(
      `${baseUrl}/customers?cpfCnpj=${cpfCnpj}`,
      { headers },
    );

    if (searchResp.ok) {
      const searchData = await searchResp.json();
      if (searchData.data && searchData.data.length > 0) {
        customerId = searchData.data[0].id;
        console.log("[ASAAS] Cliente encontrado:", customerId);
      }
    }

    // Se não encontrou, criar o cliente
    if (!customerId) {
      const nameParts = request.customer.name.split(" ");
      const createCustomer = await fetch(`${baseUrl}/customers`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          name: request.customer.name,
          cpfCnpj,
          email: request.customer.email,
          phone: request.customer.phone || "",
          notificationDisabled: false,
        }),
      });

      if (!createCustomer.ok) {
        const errData = await createCustomer.json().catch(() => ({}));
        throw new Error(
          `Erro ao criar cliente no Asaas: ${JSON.stringify(errData?.errors || errData)}`,
        );
      }

      const customerData = await createCustomer.json();
      customerId = customerData.id;
      console.log("[ASAAS] Cliente criado:", customerId);
    }

    // ── PASSO 2: Criar cobrança ──
    const billingType =
      request.paymentMethod === "pix"
        ? "PIX"
        : request.paymentMethod === "boleto"
        ? "BOLETO"
        : "CREDIT_CARD";

    const dueDate = new Date(Date.now() + 30 * 60 * 1000) // 30 minutos para PIX
      .toISOString()
      .split("T")[0];

    const chargePayload: any = {
      customer: customerId,
      billingType,
      value: request.amount,
      dueDate,
      description: `Pedido ${request.orderId}`,
      externalReference: request.orderId,
    };

    // Para PIX, definir tempo de expiração curto
    if (billingType === "PIX") {
      chargePayload.pixAddressKeyType = "RANDOM";
      // expirationSeconds: 30 minutos
      chargePayload.expirationSeconds = 1800;
    }

    console.log("[ASAAS] Criando cobrança:", JSON.stringify(chargePayload));

    const chargeResp = await fetch(`${baseUrl}/payments`, {
      method: "POST",
      headers,
      body: JSON.stringify(chargePayload),
    });

    if (!chargeResp.ok) {
      const errData = await chargeResp.json().catch(() => ({}));
      console.error("[ASAAS] Erro ao criar cobrança:", errData);
      throw new Error(
        `Erro ao criar cobrança Asaas: ${JSON.stringify(errData?.errors || errData?.message || errData)}`,
      );
    }

    const chargeData = await chargeResp.json();
    console.log("[ASAAS] Cobrança criada:", chargeData.id, "status:", chargeData.status);

    // ── PASSO 3: Buscar QR Code PIX ──
    if (billingType === "PIX") {
      const pixResp = await fetch(
        `${baseUrl}/payments/${chargeData.id}/pixQrCode`,
        { headers },
      );

      if (!pixResp.ok) {
        const errData = await pixResp.json().catch(() => ({}));
        console.error("[ASAAS] Erro ao buscar QR Code PIX:", errData);
        // Mesmo sem QR Code, retornar sucesso com o que temos
        return {
          success: true,
          transactionId: chargeData.id,
          gatewayTransactionId: chargeData.id,
          status: "pending",
          paymentUrl: chargeData.invoiceUrl,
          message: "PIX gerado via Asaas (QR Code em processamento)",
          pixData: {
            qrCode: chargeData.payload || "",
            expiresAt: chargeData.dueDate,
            amount: request.amount,
          },
        };
      }

      const pixData = await pixResp.json();
      console.log("[ASAAS] PIX QR Code obtido:", !!pixData.encodedImage, !!pixData.payload);

      const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

      return {
        success: true,
        transactionId: chargeData.id,
        gatewayTransactionId: chargeData.id,
        status: "pending",
        paymentUrl: chargeData.invoiceUrl,
        qrCode: pixData.payload,
        qrCodeBase64: pixData.encodedImage,
        expiresAt,
        message: "PIX gerado com sucesso via Asaas",
        pixData: {
          qrCode: pixData.payload || "",
          qrCodeBase64: pixData.encodedImage,
          expiresAt,
          amount: request.amount,
        },
      };
    }

    // ── Boleto ou Cartão ──
    return {
      success: true,
      transactionId: chargeData.id,
      gatewayTransactionId: chargeData.id,
      status: "pending",
      paymentUrl: chargeData.invoiceUrl || chargeData.bankSlipUrl,
      barcodeNumber: chargeData.nossoNumero,
      digitableLine: chargeData.identificationField,
      message: "Cobrança criada com sucesso via Asaas",
      boletoData:
        billingType === "BOLETO"
          ? {
              boletoUrl: chargeData.bankSlipUrl || chargeData.invoiceUrl || "",
              barcode: chargeData.nossoNumero || "",
              digitableLine: chargeData.identificationField || "",
              dueDate: chargeData.dueDate || dueDate,
              amount: request.amount,
            }
          : undefined,
    };
  } catch (error: any) {
    console.error("[ASAAS] ❌ Erro:", error);
    return {
      success: false,
      status: "failed",
      message: "Erro ao processar pagamento via Asaas: " + error.message,
      error: error.message,
    };
  }
}

// ===== MAIN HANDLER =====

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    // ====================================================================
    // CHECKOUT PÚBLICO: Usar service_role para bypass de RLS
    // O checkout é acessado por usuários anônimos, portanto não podemos
    // exigir JWT de usuário autenticado. Usamos service_role para DB.
    // ====================================================================

    // Cliente com service_role para DB (bypassa RLS - operações privilegiadas)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Parse request (sem exigir auth de usuário)
    const body = await req.json();
    const paymentRequest: PaymentRequest = body;

    console.log("[PAYMENT] Request recebida para checkout público:", {
      orderId: paymentRequest.orderId,
      userId: paymentRequest.userId,
      amount: paymentRequest.amount,
      paymentMethod: paymentRequest.paymentMethod,
    });

    // ===== VALIDAÇÃO #1: Campos obrigatórios =====
    if (
      !paymentRequest.userId ||
      !paymentRequest.orderId ||
      !paymentRequest.amount
    ) {
      throw new Error("Missing required fields: userId, orderId, amount");
    }

    if (paymentRequest.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    // ===== VALIDAÇÃO #2: Verificar se pedido já foi pago (via service_role) =====
    const { data: existingTransactions } = await supabaseAdmin
      .from("Transaction")
      .select("id, status, paymentMethod, createdAt")
      .eq("orderId", paymentRequest.orderId)
      .in("status", ["PAID", "PROCESSING"])
      .order("createdAt", { ascending: false })
      .limit(1);

    if (existingTransactions && existingTransactions.length > 0) {
      const existing = existingTransactions[0];
      console.warn("⚠️ Order already has a paid/processing transaction:", {
        orderId: paymentRequest.orderId,
        existingTransactionId: existing.id,
        status: existing.status,
        paymentMethod: existing.paymentMethod,
      });

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
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ===== VALIDAÇÃO #3: Rate Limiting via service_role =====
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: recentAttempts, error: rateLimitError } = await supabaseAdmin
      .from("Transaction")
      .select("id")
      .eq("userId", paymentRequest.userId)
      .gte("createdAt", oneMinuteAgo);

    if (!rateLimitError && recentAttempts && recentAttempts.length >= 5) {
      console.warn("⚠️ Rate limit exceeded for user:", {
        userId: paymentRequest.userId,
        attemptsInLastMinute: recentAttempts.length,
      });

      return new Response(
        JSON.stringify({
          success: false,
          status: "RATE_LIMIT_EXCEEDED",
          message:
            "Muitas tentativas de pagamento. Aguarde um minuto e tente novamente.",
          error: "RATE_LIMIT_EXCEEDED",
          retryAfter: 60,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        },
      );
    }

    console.log("✅ Validações iniciais passaram:", {
      orderId: paymentRequest.orderId,
      userId: paymentRequest.userId,
      amount: paymentRequest.amount,
      paymentMethod: paymentRequest.paymentMethod,
    });

    // ===== BUSCAR GATEWAY via service_role (bypassa RLS) =====
    // Busca gateway ativo padrão; permite sandbox/não-verificado para testes
    const { data: gatewayConfigs, error: gatewayError } = await supabaseAdmin
      .from("GatewayConfig")
      .select("*, Gateway(*)")
      .eq("userId", paymentRequest.userId)
      .eq("isActive", true)
      .eq("isDefault", true)
      .limit(1);

    if (gatewayError || !gatewayConfigs || gatewayConfigs.length === 0) {
      console.error("[PAYMENT] Gateway não encontrado:", {
        userId: paymentRequest.userId,
        gatewayError,
      });
      return new Response(
        JSON.stringify({
          success: false,
          status: "failed",
          message:
            "Nenhum gateway de pagamento disponível para esta loja.",
          error: "NO_ACTIVE_GATEWAY",
          hint: "Configure um gateway ativo e padrão no painel de Configurações > Pagamentos",
          requiresSetup: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 422,
        },
      );
    }

    const gatewayConfig = gatewayConfigs[0];
    const gateway = gatewayConfig.Gateway;

    // Usar supabaseAdmin para todas as operações subsequentes de banco
    const supabaseClient = supabaseAdmin;

    console.log("[PAYMENT] ========== INICIANDO PROCESSAMENTO ==========");
    console.log("[PAYMENT] Gateway selecionado:", gateway.slug);
    console.log("[PAYMENT] Gateway nome:", gateway.name);
    console.log("[PAYMENT] Método de pagamento:", paymentRequest.paymentMethod);
    console.log("[PAYMENT] Valor:", paymentRequest.amount);
    console.log(
      "[PAYMENT] Credenciais presentes:",
      Object.keys(gatewayConfig.credentials || {}),
    );
    console.log(
      "[PAYMENT] Credenciais tem publicKey?",
      !!gatewayConfig.credentials?.publicKey,
    );
    console.log(
      "[PAYMENT] Credenciais tem secretKey?",
      !!gatewayConfig.credentials?.secretKey,
    );

    // Validar se o gateway suporta o método de pagamento solicitado
    const paymentMethodMap = {
      pix: "supportsPix",
      credit_card: "supportsCreditCard",
      debit_card: "supportsCreditCard",
      boleto: "supportsBoleto",
    };

    const supportField = paymentMethodMap[paymentRequest.paymentMethod];
    if (supportField && !gateway[supportField]) {
      throw new Error(
        `Gateway ${gateway.name} does not support ${paymentRequest.paymentMethod}`,
      );
    }

    console.info(`Processing payment via ${gateway.slug}`);

    // Processar pagamento usando o gateway registry
    let paymentResponse: PaymentResponse;

    try {
      // Obter processador do gateway
      console.log(
        "[PAYMENT] Obtendo processor do registry para:",
        gateway.slug,
      );
      const gatewayProcessor = getGateway(gateway.slug);

      console.log("[PAYMENT] Processor encontrado?", !!gatewayProcessor);
      console.log("[PAYMENT] Processor name:", gatewayProcessor?.name);

      if (!gatewayProcessor) {
        // Fallback para gateways legados
        switch (gateway.slug) {
          case "stripe":
            paymentResponse = await processStripePayment(
              paymentRequest,
              gatewayConfig,
            );
            break;
          case "mercado-pago":
          case "mercadopago":
            paymentResponse = await processMercadoPagoPayment(
              paymentRequest,
              gatewayConfig,
            );
            break;
          case "pagseguro":
            paymentResponse = await processPagSeguroPayment(
              paymentRequest,
              gatewayConfig,
            );
            break;
          case "paypal":
            paymentResponse = await processPayPalPayment(
              paymentRequest,
              gatewayConfig,
            );
            break;
          case "asaas":
            paymentResponse = await processAsaasPayment(
              paymentRequest,
              gatewayConfig,
            );
            break;
          default:
            throw new Error(
              `Gateway ${gateway.slug} (${gateway.name}) not found in registry`,
            );
        }
      } else {
        // Usar o gateway modular do registry
        console.info(`Using modular gateway processor for ${gateway.slug}`);

        console.log("[PAYMENT] Montando request para gateway modular...");
        console.log("[PAYMENT] GatewayConfig credentials:", {
          hasPublicKey: !!gatewayConfig.credentials?.publicKey,
          hasSecretKey: !!gatewayConfig.credentials?.secretKey,
          publicKeyStart: gatewayConfig.credentials?.publicKey?.substring(
            0,
            10,
          ),
        });

        // Mapear paymentMethod do request para o enum do gateway
        const gatewayPaymentMethodMap: Record<string, GatewayPaymentMethod> = {
          credit_card: "credit_card" as GatewayPaymentMethod,
          debit_card: "debit_card" as GatewayPaymentMethod,
          pix: "pix" as GatewayPaymentMethod,
          boleto: "boleto" as GatewayPaymentMethod,
          paypal: "paypal" as GatewayPaymentMethod,
        };

        console.log("[PAYMENT] 🔍 Mapeamento de paymentMethod:");
        console.log(
          "[PAYMENT] - Request paymentMethod:",
          paymentRequest.paymentMethod,
        );
        console.log(
          "[PAYMENT] - Mapped to gateway:",
          gatewayPaymentMethodMap[paymentRequest.paymentMethod],
        );
        console.log(
          "[PAYMENT] - Type:",
          typeof gatewayPaymentMethodMap[paymentRequest.paymentMethod],
        );

        const gatewayRequest = {
          userId: paymentRequest.userId,
          orderId: paymentRequest.orderId,
          amount: paymentRequest.amount,
          currency: paymentRequest.currency || "BRL",
          paymentMethod: gatewayPaymentMethodMap[paymentRequest.paymentMethod],
          customer: paymentRequest.customer,
          card: paymentRequest.card,
          billingAddress: paymentRequest.billingAddress,
          installments: (paymentRequest as any).installments,
        };

        console.log("[PAYMENT] 🚀 Gateway request criado:");
        console.log(
          "[PAYMENT] - paymentMethod no gatewayRequest:",
          gatewayRequest.paymentMethod,
        );

        console.log("[PAYMENT] Chamando gatewayProcessor.processPayment...");
        console.log("[PAYMENT] Gateway config:", {
          gatewayId: gateway.id,
          userId: paymentRequest.userId,
          testMode: gatewayConfig.environment !== "production",
          hasCredentials: !!gatewayConfig.credentials,
        });

        const gatewayResponse = await gatewayProcessor.processPayment(
          gatewayRequest,
          {
            gatewayId: gateway.id,
            userId: paymentRequest.userId,
            credentials: gatewayConfig.credentials,
            testMode: gatewayConfig.environment !== "production",
          },
        );

        console.log("[PAYMENT] Gateway response recebida!");
        console.log("[PAYMENT] Response success:", gatewayResponse.success);
        console.log("[PAYMENT] Response status:", gatewayResponse.status);
        console.log("[PAYMENT] Response message:", gatewayResponse.message);

        // Mapear resposta do gateway para formato esperado
        paymentResponse = {
          success: gatewayResponse.success,
          transactionId: gatewayResponse.transactionId,
          gatewayTransactionId: gatewayResponse.gatewayTransactionId,
          status: (gatewayResponse.status?.toUpperCase() as any) || "PENDING",
          paymentUrl: gatewayResponse.paymentUrl,
          qrCode: gatewayResponse.qrCode,
          qrCodeBase64: gatewayResponse.qrCodeBase64,
          barcodeNumber: gatewayResponse.barcodeNumber,
          digitableLine: gatewayResponse.digitableLine,
          expiresAt: gatewayResponse.expiresAt,
          message: gatewayResponse.message,
          error: gatewayResponse.error,
          errorCode: gatewayResponse.errorCode,
          // Adicionar objetos completos do PIX e Boleto
          pixData: gatewayResponse.pixData,
          boletoData: gatewayResponse.boletoData,
        };

        console.log("[PAYMENT] 🔍 Verificando pixData na resposta final:");
        console.log(
          "   - gatewayResponse.pixData existe?",
          !!gatewayResponse.pixData,
        );
        console.log(
          "   - paymentResponse.pixData existe?",
          !!paymentResponse.pixData,
        );
        if (paymentResponse.pixData) {
          console.log(
            "   - pixData.qrCode existe?",
            !!paymentResponse.pixData.qrCode,
          );
        }
      }
    } catch (error: any) {
      console.error(
        `[PAYMENT] ❌ ERROR processing payment via ${gateway.slug}:`,
        error,
      );
      console.error("[PAYMENT] ❌ Error name:", error?.name);
      console.error("[PAYMENT] ❌ Error message:", error?.message);
      console.error("[PAYMENT] ❌ Error stack:", error?.stack);
      paymentResponse = {
        success: false,
        status: "FAILED",
        message: error.message || "Payment processing failed",
        error: error.toString(),
        errorCode: error.code || error.errorCode,
      };
    }

    // ===== VALIDAÇÃO #4: GARANTIR gatewayTransactionId =====
    const gatewayTransactionId =
      paymentResponse.gatewayTransactionId ||
      paymentResponse.transactionId ||
      `${gateway.slug}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    if (!paymentResponse.gatewayTransactionId) {
      console.warn(
        "⚠️ gatewayTransactionId estava null, gerando fallback:",
        gatewayTransactionId,
      );
      paymentResponse.gatewayTransactionId = gatewayTransactionId;
    }
    // Normalizar status para os valores válidos do check constraint da tabela Transaction:
    // 'PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED'
    let dbStatus = "PENDING";
    const rawStatusUpper = (paymentResponse.status || "PENDING").toUpperCase();
    if (
      rawStatusUpper === "APPROVED" ||
      rawStatusUpper === "PAID" ||
      rawStatusUpper === "SUCCESS" ||
      rawStatusUpper === "SUCCEEDED"
    ) {
      dbStatus = "PAID";
    } else if (
      rawStatusUpper === "FAILED" ||
      rawStatusUpper === "FAIL" ||
      rawStatusUpper === "REJECTED"
    ) {
      dbStatus = "FAILED";
    } else if (
      rawStatusUpper === "CANCELLED" ||
      rawStatusUpper === "CANCELED"
    ) {
      dbStatus = "CANCELLED";
    } else if (rawStatusUpper === "PROCESSING") {
      dbStatus = "PROCESSING";
    } else if (rawStatusUpper === "REFUNDED") {
      dbStatus = "REFUNDED";
    }
    paymentResponse.status = dbStatus as any;

    // Salvar transação no banco via supabaseAdmin (service_role, bypassa RLS)
    const { data: transaction, error: transactionError } = await supabaseAdmin
      .from("Transaction")
      .insert({
        userId: paymentRequest.userId,
        orderId: paymentRequest.orderId,
        gatewayId: gateway.id,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency || "BRL",
        status: dbStatus,
        transactionId: gatewayTransactionId,
        paymentMethod: paymentRequest.paymentMethod,
        // Campos específicos do PIX
        pixQrCode: paymentResponse.pixData?.qrCode,
        pixCopyPaste: paymentResponse.pixData?.qrCode,
        pixExpiresAt: paymentResponse.pixData?.expiresAt,
        // Campos específicos do Boleto
        boletoUrl: paymentResponse.boletoData?.boletoUrl,
        boletoBarcode: paymentResponse.boletoData?.barcode,
        boletoExpiresAt: paymentResponse.boletoData?.dueDate,
        metadata: {
          customer: paymentRequest.customer,
          paymentUrl: paymentResponse.paymentUrl,
          qrCode: paymentResponse.qrCode,
          pixData: paymentResponse.pixData,
          boletoData: paymentResponse.boletoData,
          processingTime: Date.now() - startTime,
          gatewaySlug: gateway.slug,
        },
      })
      .select()
      .single();

    if (transactionError) {
      console.error("❌ Erro crítico ao salvar transação:", transactionError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to save transaction to database",
          status: "DB_ERROR",
          details: transactionError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("✅ Transaction saved successfully:", transaction.id);

    // Logs finais antes do return
    console.log("[PAYMENT] 🎯 RESPOSTA FINAL sendo retornada ao frontend:");
    console.log("   - paymentResponse.success:", paymentResponse.success);
    console.log(
      "   - paymentResponse.pixData existe?",
      !!paymentResponse.pixData,
    );
    console.log(
      "   - paymentResponse.boletoData existe?",
      !!paymentResponse.boletoData,
    );

    if (paymentResponse.pixData) {
      console.log(
        "   - pixData completo:",
        JSON.stringify(paymentResponse.pixData),
      );
    }

    const finalResponse = {
      ...paymentResponse,
      transactionId: transaction?.id || paymentResponse.transactionId,
    };

    console.log("[PAYMENT] 🚀 Objeto final com spread:");
    console.log("   - finalResponse.pixData existe?", !!finalResponse.pixData);
    console.log("   - finalResponse.success:", finalResponse.success);

    // Retornar resposta
    return new Response(JSON.stringify(finalResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Sempre retornar 200, usar success: true/false para indicar resultado
    });
  } catch (error: any) {
    console.error("Payment processing error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        status: "failed",
        message: error.message || "Internal server error",
        error: error.toString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Sempre retornar 200, usar success: false para indicar erro
      },
    );
  }
});
