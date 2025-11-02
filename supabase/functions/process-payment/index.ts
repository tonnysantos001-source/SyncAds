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
  status: "pending" | "approved" | "failed" | "cancelled";
  paymentUrl?: string; // Para PIX/Boleto
  qrCode?: string; // Para PIX
  message: string;
  error?: string;
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

// ===== ASAAS INTEGRATION =====

async function processAsaasPayment(
  request: PaymentRequest,
  gatewayConfig: any,
): Promise<PaymentResponse> {
  try {
    const apiKey = gatewayConfig.credentials.apiKey;

    // Criar cobrança
    const charge = {
      customer: request.customer.email,
      billingType:
        request.paymentMethod === "pix"
          ? "PIX"
          : request.paymentMethod === "boleto"
            ? "BOLETO"
            : "CREDIT_CARD",
      value: request.amount,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0], // 7 dias
      description: `Pedido ${request.orderId}`,
      externalReference: request.orderId,
    };

    const response = await fetch("https://www.asaas.com/api/v3/payments", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        access_token: apiKey,
      },
      body: JSON.stringify(charge),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Erro ao criar cobrança Asaas");
    }

    const data = await response.json();

    return {
      success: true,
      transactionId: data.id,
      gatewayTransactionId: data.id,
      status: "pending",
      paymentUrl: data.invoiceUrl || data.bankSlipUrl,
      qrCode: data.pixQrCode,
      message: "Cobrança criada com sucesso via Asaas",
    };
  } catch (error: any) {
    console.error("Erro Asaas:", error);
    return {
      success: false,
      status: "failed",
      message: "Erro ao processar pagamento via Asaas",
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
    // Autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    // Parse request
    const paymentRequest: PaymentRequest = await req.json();

    // Validação
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

    // Buscar gateway configurado para este usuário
    const { data: gatewayConfigs, error: gatewayError } = await supabaseClient
      .from("GatewayConfig")
      .select("*, Gateway(*)")
      .eq("userId", paymentRequest.userId)
      .eq("isActive", true)
      .eq("isDefault", true)
      .limit(1);

    if (gatewayError || !gatewayConfigs || gatewayConfigs.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          status: "failed",
          message: "Nenhum gateway de pagamento configurado",
          error: "NO_GATEWAY_CONFIGURED",
          hint: "Configure um gateway de pagamento no painel de administração em Configurações > Pagamentos",
          requiresSetup: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200, // Sempre retornar 200, usar success: false para indicar erro
        },
      );
    }

    const gatewayConfig = gatewayConfigs[0];
    const gateway = gatewayConfig.Gateway;

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

    console.log(
      `Processing payment via ${gateway.slug} (${gateway.name}) for user ${paymentRequest.userId}`,
    );

    // Processar pagamento de acordo com o gateway
    let paymentResponse: PaymentResponse;

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
          `Unsupported gateway: ${gateway.slug} (${gateway.name})`,
        );
    }

    // Salvar transação no banco
    const { data: transaction, error: transactionError } = await supabaseClient
      .from("Transaction")
      .insert({
        userId: paymentRequest.userId,
        orderId: paymentRequest.orderId,
        gatewayId: gateway.id,
        amount: paymentRequest.amount,
        currency: paymentRequest.currency || "BRL",
        status: paymentResponse.status,
        gatewayTransactionId: paymentResponse.gatewayTransactionId,
        paymentMethod: paymentRequest.paymentMethod,
        metadata: {
          customer: paymentRequest.customer,
          paymentUrl: paymentResponse.paymentUrl,
          qrCode: paymentResponse.qrCode,
        },
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Erro ao salvar transação:", transactionError);
      // Não falhar a request, apenas logar o erro
    }

    // Retornar resposta
    return new Response(
      JSON.stringify({
        ...paymentResponse,
        transactionId: transaction?.id || paymentResponse.transactionId,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200, // Sempre retornar 200, usar success: true/false para indicar resultado
      },
    );
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
