/**
 * SISTEMA DE GERENCIAMENTO DE LIMITES DE PLANOS
 *
 * Funções para verificar e controlar limites dos planos:
 * - Mensagens IA diárias
 * - Imagens IA diárias
 * - Páginas de checkout
 * - Produtos
 * - Projetos
 */

import { supabase } from "@/lib/supabase";

interface PlanLimits {
  maxAiMessagesDaily: number;
  maxAiImagesDaily: number;
  maxCheckoutPages: number;
  maxProducts: number;
  maxProjects: number;
  maxIntegrations: number;
  hasCustomDomain: boolean;
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasApiAccess: boolean;
}

interface DailyUsage {
  aiMessagesUsed: number;
  aiImagesUsed: number;
  date: string;
}

interface CheckLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  message: string;
  percentage: number;
}

/**
 * Busca os limites do plano do usuário
 */
export async function getUserPlanLimits(
  userId: string,
): Promise<PlanLimits | null> {
  try {
    // Buscar plano atual do usuário
    const { data: user, error: userError } = await supabase
      .from("User")
      .select("currentPlanId")
      .eq("id", userId)
      .single();

    if (userError || !user?.currentPlanId) {
      console.error("Erro ao buscar plano do usuário:", userError);
      return null;
    }

    // Buscar limites do plano
    const { data: plan, error: planError } = await supabase
      .from("PricingPlan")
      .select("*")
      .eq("id", user.currentPlanId)
      .single();

    if (planError || !plan) {
      console.error("Erro ao buscar plano:", planError);
      return null;
    }

    return {
      maxAiMessagesDaily: plan.maxAiMessagesDaily || 0,
      maxAiImagesDaily: plan.maxAiImagesDaily || 0,
      maxCheckoutPages: plan.maxCheckoutPages || 1,
      maxProducts: plan.maxProducts || 10,
      maxProjects: plan.maxProjects || 1,
      maxIntegrations: plan.maxIntegrations || 1,
      hasCustomDomain: plan.hasCustomDomain || false,
      hasAdvancedAnalytics: plan.hasAdvancedAnalytics || false,
      hasPrioritySupport: plan.hasPrioritySupport || false,
      hasApiAccess: plan.hasApiAccess || false,
    };
  } catch (error) {
    console.error("Erro ao buscar limites do plano:", error);
    return null;
  }
}

/**
 * Busca o uso diário atual do usuário
 */
export async function getDailyUsage(
  userId: string,
): Promise<DailyUsage | null> {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("PlanDailyUsage")
      .select("*")
      .eq("userId", userId)
      .eq("date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = not found
      console.error("Erro ao buscar uso diário:", error);
      return null;
    }

    if (!data) {
      // Criar registro para hoje
      const { data: newUsage, error: createError } = await supabase
        .from("PlanDailyUsage")
        .insert({
          userId,
          date: today,
          aiMessagesUsed: 0,
          aiImagesUsed: 0,
        })
        .select()
        .single();

      if (createError) {
        console.error("Erro ao criar uso diário:", createError);
        return null;
      }

      return {
        aiMessagesUsed: 0,
        aiImagesUsed: 0,
        date: today,
      };
    }

    return {
      aiMessagesUsed: data.aiMessagesUsed || 0,
      aiImagesUsed: data.aiImagesUsed || 0,
      date: data.date,
    };
  } catch (error) {
    console.error("Erro ao buscar uso diário:", error);
    return null;
  }
}

/**
 * Verifica se o usuário é admin
 */
async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("User")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return false;
    }

    return data.role === "ADMIN" || data.role === "SUPER_ADMIN";
  } catch (error) {
    console.error("Erro ao verificar se é admin:", error);
    return false;
  }
}

/**
 * Verifica se o usuário pode enviar uma mensagem IA
 * ADMINS TÊM LIMITE ILIMITADO
 */
export async function canSendAiMessage(
  userId: string,
): Promise<CheckLimitResult> {
  // 1. VERIFICAR SE É ADMIN - ADMIN NÃO TEM LIMITE
  const isAdmin = await isUserAdmin(userId);

  if (isAdmin) {
    return {
      allowed: true,
      current: 0,
      limit: 0,
      message: "Mensagens ilimitadas (Admin)",
      percentage: 0,
    };
  }

  // 2. VERIFICAR LIMITES DO PLANO PARA USUÁRIOS NORMAIS
  const limits = await getUserPlanLimits(userId);
  const usage = await getDailyUsage(userId);

  if (!limits || !usage) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      message: "Erro ao verificar limites",
      percentage: 0,
    };
  }

  // 3. VERIFICAR SE O PLANO TEM LIMITE 0 (ILIMITADO)
  if (limits.maxAiMessagesDaily === 0) {
    return {
      allowed: true,
      current: usage.aiMessagesUsed,
      limit: 0,
      message: "Mensagens ilimitadas",
      percentage: 0,
    };
  }

  // 4. VERIFICAR SE AINDA TEM CRÉDITOS DISPONÍVEIS
  const allowed = usage.aiMessagesUsed < limits.maxAiMessagesDaily;
  const percentage = (usage.aiMessagesUsed / limits.maxAiMessagesDaily) * 100;

  return {
    allowed,
    current: usage.aiMessagesUsed,
    limit: limits.maxAiMessagesDaily,
    message: allowed
      ? `${usage.aiMessagesUsed}/${limits.maxAiMessagesDaily} mensagens usadas hoje`
      : `Limite diário atingido (${limits.maxAiMessagesDaily} mensagens)`,
    percentage: Math.min(percentage, 100),
  };
}

/**
 * Verifica se o usuário pode gerar uma imagem IA
 * ADMINS TÊM LIMITE ILIMITADO
 */
export async function canGenerateAiImage(
  userId: string,
): Promise<CheckLimitResult> {
  // 1. VERIFICAR SE É ADMIN - ADMIN NÃO TEM LIMITE
  const isAdmin = await isUserAdmin(userId);

  if (isAdmin) {
    return {
      allowed: true,
      current: 0,
      limit: 0,
      message: "Imagens ilimitadas (Admin)",
      percentage: 0,
    };
  }

  // 2. VERIFICAR LIMITES DO PLANO PARA USUÁRIOS NORMAIS
  const limits = await getUserPlanLimits(userId);
  const usage = await getDailyUsage(userId);

  if (!limits || !usage) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      message: "Erro ao verificar limites",
      percentage: 0,
    };
  }

  // 3. VERIFICAR SE O PLANO TEM LIMITE 0 (ILIMITADO)
  if (limits.maxAiImagesDaily === 0) {
    return {
      allowed: true,
      current: usage.aiImagesUsed,
      limit: 0,
      message: "Imagens ilimitadas",
      percentage: 0,
    };
  }

  // 4. VERIFICAR SE AINDA TEM CRÉDITOS DISPONÍVEIS
  const allowed = usage.aiImagesUsed < limits.maxAiImagesDaily;
  const percentage = (usage.aiImagesUsed / limits.maxAiImagesDaily) * 100;

  return {
    allowed,
    current: usage.aiImagesUsed,
    limit: limits.maxAiImagesDaily,
    message: allowed
      ? `${usage.aiImagesUsed}/${limits.maxAiImagesDaily} imagens usadas hoje`
      : `Limite diário atingido (${limits.maxAiImagesDaily} imagens)`,
    percentage: Math.min(percentage, 100),
  };
}

/**
 * Incrementa o contador de mensagens IA (usa função SQL)
 */
export async function incrementAiMessageUsage(
  userId: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("increment_daily_usage", {
      p_user_id: userId,
      p_message_type: "message",
    });

    if (error) {
      console.error("Erro ao incrementar mensagens:", error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error("Erro ao incrementar mensagens:", error);
    return false;
  }
}

/**
 * Incrementa o contador de imagens IA (usa função SQL)
 */
export async function incrementAiImageUsage(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc("increment_daily_usage", {
      p_user_id: userId,
      p_message_type: "image",
    });

    if (error) {
      console.error("Erro ao incrementar imagens:", error);
      return false;
    }

    return data === true;
  } catch (error) {
    console.error("Erro ao incrementar imagens:", error);
    return false;
  }
}

/**
 * Verifica se o usuário pode criar mais checkouts
 */
export async function canCreateCheckout(
  userId: string,
): Promise<CheckLimitResult> {
  const limits = await getUserPlanLimits(userId);

  if (!limits) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      message: "Erro ao verificar limites",
      percentage: 0,
    };
  }

  // Contar checkouts existentes
  const { count, error } = await supabase
    .from("CheckoutSection")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId);

  if (error) {
    console.error("Erro ao contar checkouts:", error);
    return {
      allowed: false,
      current: 0,
      limit: limits.maxCheckoutPages,
      message: "Erro ao verificar checkouts",
      percentage: 0,
    };
  }

  const current = count || 0;
  const allowed = current < limits.maxCheckoutPages;
  const percentage = (current / limits.maxCheckoutPages) * 100;

  return {
    allowed,
    current,
    limit: limits.maxCheckoutPages,
    message: allowed
      ? `${current}/${limits.maxCheckoutPages} checkouts criados`
      : `Limite de checkouts atingido (${limits.maxCheckoutPages})`,
    percentage: Math.min(percentage, 100),
  };
}

/**
 * Verifica se o usuário pode criar mais produtos
 */
export async function canCreateProduct(
  userId: string,
): Promise<CheckLimitResult> {
  const limits = await getUserPlanLimits(userId);

  if (!limits) {
    return {
      allowed: false,
      current: 0,
      limit: 0,
      message: "Erro ao verificar limites",
      percentage: 0,
    };
  }

  // Contar produtos existentes
  const { count, error } = await supabase
    .from("Product")
    .select("*", { count: "exact", head: true })
    .eq("userId", userId);

  if (error) {
    console.error("Erro ao contar produtos:", error);
    return {
      allowed: false,
      current: 0,
      limit: limits.maxProducts,
      message: "Erro ao verificar produtos",
      percentage: 0,
    };
  }

  const current = count || 0;
  const allowed = current < limits.maxProducts;
  const percentage = (current / limits.maxProducts) * 100;

  return {
    allowed,
    current,
    limit: limits.maxProducts,
    message: allowed
      ? `${current}/${limits.maxProducts} produtos criados`
      : `Limite de produtos atingido (${limits.maxProducts})`,
    percentage: Math.min(percentage, 100),
  };
}

/**
 * Retorna um resumo completo dos limites e uso do usuário
 */
export async function getUserLimitsSummary(userId: string) {
  const [limits, usage, checkouts, products] = await Promise.all([
    getUserPlanLimits(userId),
    getDailyUsage(userId),
    canCreateCheckout(userId),
    canCreateProduct(userId),
  ]);

  return {
    limits,
    usage,
    checkouts,
    products,
    features: {
      customDomain: limits?.hasCustomDomain || false,
      advancedAnalytics: limits?.hasAdvancedAnalytics || false,
      prioritySupport: limits?.hasPrioritySupport || false,
      apiAccess: limits?.hasApiAccess || false,
    },
  };
}

/**
 * Verifica se o usuário deve fazer upgrade
 * Retorna true se estiver usando mais de 80% dos limites
 */
export async function shouldSuggestUpgrade(userId: string): Promise<boolean> {
  const messageCheck = await canSendAiMessage(userId);
  const imageCheck = await canGenerateAiImage(userId);
  const checkoutCheck = await canCreateCheckout(userId);

  return (
    messageCheck.percentage > 80 ||
    imageCheck.percentage > 80 ||
    checkoutCheck.percentage > 80
  );
}
