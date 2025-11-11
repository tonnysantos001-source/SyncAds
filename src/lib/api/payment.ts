import { supabase } from "@/lib/supabase";

// ============================================
// TIPOS E INTERFACES
// ============================================

export interface PaymentMethod {
  id: string;
  userId: string;
  type: "credit_card" | "debit_card";
  cardBrand: string;
  lastFourDigits: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
  isVerified: boolean;
  gatewayToken?: string;
  gatewayCustomerId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: "free" | "starter" | "pro" | "enterprise";
  status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd?: string;
  cancelAtPeriodEnd: boolean;
  paymentMethodId?: string;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  amount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  userId: string;
  subscriptionId?: string;
  amount: number;
  status: "draft" | "pending" | "paid" | "failed" | "refunded";
  description: string;
  dueDate: string;
  paidAt?: string;
  paymentMethodId?: string;
  transactionId?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface AddPaymentMethodRequest {
  cardNumber: string;
  cardholderName: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cpf: string;
}

export interface PaymentMethodResponse {
  success: boolean;
  paymentMethod?: PaymentMethod;
  error?: string;
}

export interface SubscriptionResponse {
  success: boolean;
  subscription?: Subscription;
  error?: string;
}

// ============================================
// CONFIGURAÇÃO
// ============================================

const VERIFICATION_AMOUNT = 1.0; // R$ 1,00 para verificação
const TRIAL_DAYS = 7;

// Valores dos planos
export const PLAN_PRICES = {
  free: 0,
  starter: 49.9,
  pro: 149.9,
  enterprise: 499.9,
};

// ============================================
// FUNÇÕES DE PAYMENT METHOD
// ============================================

/**
 * Busca o gateway padrão do admin (userId IS NULL)
 */
async function getAdminGateway() {
  const { data, error } = await supabase
    .from("GatewayConfig")
    .select("*")
    .is("userId", null)
    .eq("isDefault", true)
    .eq("isActive", true)
    .single();

  if (error || !data) {
    throw new Error("Gateway administrativo não configurado");
  }

  return data;
}

/**
 * Adiciona um novo método de pagamento com verificação de R$1
 */
export async function addPaymentMethod(
  request: AddPaymentMethodRequest
): Promise<PaymentMethodResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // 1. Obter gateway admin
    const adminGateway = await getAdminGateway();

    // 2. Processar cobrança de verificação de R$1 via Edge Function
    const verificationResponse = await fetch(
      `${supabase.supabaseUrl}/functions/v1/process-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          orderId: `verification-${Date.now()}`,
          userId: user.id,
          amount: VERIFICATION_AMOUNT,
          paymentMethod: "credit_card",
          card: {
            number: request.cardNumber,
            holderName: request.cardholderName,
            expirationMonth: request.expiryMonth,
            expirationYear: request.expiryYear,
            cvv: request.cvv,
          },
          customer: {
            name: request.cardholderName,
            document: request.cpf,
            email: user.email,
          },
          metadata: {
            type: "card_verification",
            description: "Verificação de cartão - Será estornado automaticamente",
          },
        }),
      }
    );

    const verificationResult = await verificationResponse.json();

    if (!verificationResult.success) {
      return {
        success: false,
        error: verificationResult.message || "Falha na verificação do cartão",
      };
    }

    // 3. Salvar método de pagamento no banco
    const cardBrand = detectCardBrand(request.cardNumber);
    const lastFourDigits = request.cardNumber.slice(-4);

    const { data: paymentMethod, error: dbError } = await supabase
      .from("PaymentMethod")
      .insert({
        userId: user.id,
        type: "credit_card",
        cardBrand,
        lastFourDigits,
        expiryMonth: request.expiryMonth,
        expiryYear: request.expiryYear,
        cardholderName: request.cardholderName,
        isDefault: false,
        isVerified: true,
        gatewayToken: verificationResult.transactionId,
        gatewayCustomerId: verificationResult.gatewayTransactionId,
      })
      .select()
      .single();

    if (dbError) {
      return { success: false, error: "Erro ao salvar método de pagamento" };
    }

    // 4. Registrar no PaymentSplitLog (decision='admin')
    await supabase.from("PaymentSplitLog").insert({
      transactionId: verificationResult.transactionId,
      orderId: `verification-${Date.now()}`,
      userId: user.id,
      ruleId: null,
      decision: "admin",
      gatewayId: adminGateway.id,
      gatewayName: adminGateway.name,
      amount: VERIFICATION_AMOUNT,
      adminRevenue: VERIFICATION_AMOUNT,
      clientRevenue: 0,
      ruleType: "admin_billing",
      ruleName: "Verificação de Cartão SyncAds",
      reason: "Cobrança de verificação de método de pagamento",
      metadata: {
        type: "card_verification",
        willBeRefunded: true,
      },
    });

    // 5. Agendar estorno automático (via Edge Function ou webhook)
    // TODO: Implementar edge function para estorno após 24h

    return { success: true, paymentMethod };
  } catch (error) {
    console.error("Erro ao adicionar método de pagamento:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Lista métodos de pagamento do usuário
 */
export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("PaymentMethod")
    .select("*")
    .eq("userId", user.id)
    .order("isDefault", { ascending: false })
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Erro ao listar métodos de pagamento:", error);
    return [];
  }

  return data || [];
}

/**
 * Remove um método de pagamento
 */
export async function removePaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Verificar se não é o método padrão de uma assinatura ativa
    const { data: subscription } = await supabase
      .from("Subscription")
      .select("*")
      .eq("userId", user.id)
      .eq("paymentMethodId", paymentMethodId)
      .in("status", ["trialing", "active"])
      .single();

    if (subscription) {
      return {
        success: false,
        error:
          "Não é possível remover o método de pagamento de uma assinatura ativa",
      };
    }

    const { error } = await supabase
      .from("PaymentMethod")
      .delete()
      .eq("id", paymentMethodId)
      .eq("userId", user.id);

    if (error) {
      return { success: false, error: "Erro ao remover método de pagamento" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Define um método de pagamento como padrão
 */
export async function setDefaultPaymentMethod(
  paymentMethodId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Remover isDefault de todos
    await supabase
      .from("PaymentMethod")
      .update({ isDefault: false })
      .eq("userId", user.id);

    // Definir o novo como padrão
    const { error } = await supabase
      .from("PaymentMethod")
      .update({ isDefault: true })
      .eq("id", paymentMethodId)
      .eq("userId", user.id);

    if (error) {
      return {
        success: false,
        error: "Erro ao definir método de pagamento padrão",
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// ============================================
// FUNÇÕES DE SUBSCRIPTION
// ============================================

/**
 * Cria uma nova assinatura com trial de 7 dias
 */
export async function createSubscription(
  plan: "starter" | "pro" | "enterprise",
  paymentMethodId: string
): Promise<SubscriptionResponse> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    // Verificar se método de pagamento existe e está verificado
    const { data: paymentMethod } = await supabase
      .from("PaymentMethod")
      .select("*")
      .eq("id", paymentMethodId)
      .eq("userId", user.id)
      .single();

    if (!paymentMethod || !paymentMethod.isVerified) {
      return {
        success: false,
        error: "Método de pagamento inválido ou não verificado",
      };
    }

    // Cancelar assinatura anterior se existir
    const { data: existingSubscriptions } = await supabase
      .from("Subscription")
      .select("*")
      .eq("userId", user.id)
      .in("status", ["trialing", "active"]);

    if (existingSubscriptions && existingSubscriptions.length > 0) {
      for (const sub of existingSubscriptions) {
        await supabase
          .from("Subscription")
          .update({
            status: "canceled",
            cancelAtPeriodEnd: true,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", sub.id);
      }
    }

    // Criar nova assinatura com trial
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

    const periodEnd = new Date(trialEnd);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: subscription, error } = await supabase
      .from("Subscription")
      .insert({
        userId: user.id,
        plan,
        status: "trialing",
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
        trialEnd: trialEnd.toISOString(),
        cancelAtPeriodEnd: false,
        paymentMethodId,
        nextPaymentDate: trialEnd.toISOString(),
        amount: PLAN_PRICES[plan],
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: "Erro ao criar assinatura" };
    }

    // Criar invoice draft para o primeiro pagamento (após trial)
    await supabase.from("Invoice").insert({
      userId: user.id,
      subscriptionId: subscription.id,
      amount: PLAN_PRICES[plan],
      status: "draft",
      description: `Assinatura ${plan.toUpperCase()} - Primeiro pagamento`,
      dueDate: trialEnd.toISOString(),
      paymentMethodId,
      metadata: {
        plan,
        period: "monthly",
        isFirstPayment: true,
      },
    });

    return { success: true, subscription };
  } catch (error) {
    console.error("Erro ao criar assinatura:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Busca assinatura ativa do usuário
 */
export async function getCurrentSubscription(): Promise<Subscription | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("Subscription")
    .select("*")
    .eq("userId", user.id)
    .in("status", ["trialing", "active", "past_due"])
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error("Erro ao buscar assinatura:", error);
    return null;
  }

  return data;
}

/**
 * Cancela assinatura
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediate: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const updateData: any = {
      cancelAtPeriodEnd: !immediate,
      updatedAt: new Date().toISOString(),
    };

    if (immediate) {
      updateData.status = "canceled";
    }

    const { error } = await supabase
      .from("Subscription")
      .update(updateData)
      .eq("id", subscriptionId)
      .eq("userId", user.id);

    if (error) {
      return { success: false, error: "Erro ao cancelar assinatura" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

/**
 * Reativa assinatura cancelada
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: "Usuário não autenticado" };
    }

    const { error } = await supabase
      .from("Subscription")
      .update({
        cancelAtPeriodEnd: false,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", subscriptionId)
      .eq("userId", user.id);

    if (error) {
      return { success: false, error: "Erro ao reativar assinatura" };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// ============================================
// FUNÇÕES DE INVOICE
// ============================================

/**
 * Lista faturas do usuário
 */
export async function listInvoices(): Promise<Invoice[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("Invoice")
    .select("*")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Erro ao listar faturas:", error);
    return [];
  }

  return data || [];
}

/**
 * Busca uma fatura específica
 */
export async function getInvoice(invoiceId: string): Promise<Invoice | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("Invoice")
    .select("*")
    .eq("id", invoiceId)
    .eq("userId", user.id)
    .single();

  if (error) {
    console.error("Erro ao buscar fatura:", error);
    return null;
  }

  return data;
}

// ============================================
// PROCESSAMENTO DE PAGAMENTOS
// ============================================

/**
 * Processa pagamento de assinatura (chamado após trial ou renovação mensal)
 * Esta função deve ser chamada por uma Edge Function agendada
 */
export async function processSubscriptionPayment(
  subscriptionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar assinatura
    const { data: subscription, error: subError } = await supabase
      .from("Subscription")
      .select("*")
      .eq("id", subscriptionId)
      .single();

    if (subError || !subscription) {
      return { success: false, error: "Assinatura não encontrada" };
    }

    // Buscar método de pagamento
    const { data: paymentMethod, error: pmError } = await supabase
      .from("PaymentMethod")
      .select("*")
      .eq("id", subscription.paymentMethodId)
      .single();

    if (pmError || !paymentMethod) {
      // Marcar assinatura como past_due
      await supabase
        .from("Subscription")
        .update({ status: "past_due" })
        .eq("id", subscriptionId);

      return { success: false, error: "Método de pagamento não encontrado" };
    }

    // Obter gateway admin
    const adminGateway = await getAdminGateway();

    // Buscar usuário
    const { data: user } = await supabase
      .from("User")
      .select("email, name")
      .eq("id", subscription.userId)
      .single();

    // Processar pagamento via Edge Function
    const paymentResponse = await fetch(
      `${supabase.supabaseUrl}/functions/v1/process-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          orderId: `subscription-${subscriptionId}-${Date.now()}`,
          userId: subscription.userId,
          amount: subscription.amount,
          paymentMethod: "credit_card",
          customer: {
            name: paymentMethod.cardholderName,
            email: user?.email || "",
          },
          metadata: {
            type: "subscription_payment",
            subscriptionId,
            plan: subscription.plan,
          },
        }),
      }
    );

    const paymentResult = await paymentResponse.json();

    if (!paymentResult.success) {
      // Criar invoice com status failed
      await supabase.from("Invoice").insert({
        userId: subscription.userId,
        subscriptionId: subscription.id,
        amount: subscription.amount,
        status: "failed",
        description: `Assinatura ${subscription.plan.toUpperCase()} - Pagamento falhou`,
        dueDate: new Date().toISOString(),
        paymentMethodId: paymentMethod.id,
        metadata: {
          plan: subscription.plan,
          error: paymentResult.message,
        },
      });

      // Atualizar assinatura para past_due
      await supabase
        .from("Subscription")
        .update({ status: "past_due" })
        .eq("id", subscriptionId);

      return { success: false, error: paymentResult.message };
    }

    // Criar invoice paga
    await supabase.from("Invoice").insert({
      userId: subscription.userId,
      subscriptionId: subscription.id,
      amount: subscription.amount,
      status: "paid",
      description: `Assinatura ${subscription.plan.toUpperCase()} - Pagamento mensal`,
      dueDate: new Date().toISOString(),
      paidAt: new Date().toISOString(),
      paymentMethodId: paymentMethod.id,
      transactionId: paymentResult.transactionId,
      metadata: {
        plan: subscription.plan,
        gatewayTransactionId: paymentResult.gatewayTransactionId,
      },
    });

    // Atualizar assinatura
    const now = new Date();
    const nextPeriodEnd = new Date(now);
    nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

    await supabase
      .from("Subscription")
      .update({
        status: "active",
        currentPeriodStart: now.toISOString(),
        currentPeriodEnd: nextPeriodEnd.toISOString(),
        lastPaymentDate: now.toISOString(),
        nextPaymentDate: nextPeriodEnd.toISOString(),
        updatedAt: now.toISOString(),
      })
      .eq("id", subscriptionId);

    // Registrar no PaymentSplitLog
    await supabase.from("PaymentSplitLog").insert({
      transactionId: paymentResult.transactionId,
      orderId: `subscription-${subscriptionId}-${Date.now()}`,
      userId: subscription.userId,
      ruleId: null,
      decision: "admin",
      gatewayId: adminGateway.id,
      gatewayName: adminGateway.name,
      amount: subscription.amount,
      adminRevenue: subscription.amount,
      clientRevenue: 0,
      ruleType: "admin_billing",
      ruleName: "Assinatura SyncAds",
      reason: `Pagamento mensal de assinatura ${subscription.plan.toUpperCase()}`,
      metadata: {
        type: "subscription_payment",
        subscriptionId,
        plan: subscription.plan,
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Erro ao processar pagamento de assinatura:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Detecta bandeira do cartão
 */
function detectCardBrand(cardNumber: string): string {
  const number = cardNumber.replace(/\s/g, "");

  if (/^4/.test(number)) return "Visa";
  if (/^5[1-5]/.test(number)) return "Mastercard";
  if (/^3[47]/.test(number)) return "Amex";
  if (/^6(?:011|5)/.test(number)) return "Discover";
  if (/^35/.test(number)) return "JCB";
  if (/^(?:2131|1800|36)/.test(number)) return "Diners";
  if (/^606282/.test(number)) return "Hipercard";
  if (/^(?:6062|6016|6504|6509|6505)/.test(number)) return "Elo";

  return "Desconhecida";
}

/**
 * Valida número de cartão (algoritmo de Luhn)
 */
export function validateCardNumber(cardNumber: string): boolean {
  const number = cardNumber.replace(/\s/g, "");

  if (!/^\d+$/.test(number)) return false;

  let sum = 0;
  let isEven = false;

  for (let i = number.length - 1; i >= 0; i--) {
    let digit = parseInt(number[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Formata número de cartão
 */
export function formatCardNumber(cardNumber: string): string {
  const number = cardNumber.replace(/\s/g, "");
  return number.match(/.{1,4}/g)?.join(" ") || number;
}

/**
 * Formata data de expiração
 */
export function formatExpiryDate(value: string): string {
  const cleaned = value.replace(/\D/g, "");
  if (cleaned.length >= 2) {
    return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
  }
  return cleaned;
}

/**
 * Valida CVV
 */
export function validateCVV(cvv: string, cardBrand?: string): boolean {
  const length = cardBrand === "Amex" ? 4 : 3;
  return /^\d+$/.test(cvv) && cvv.length === length;
}
