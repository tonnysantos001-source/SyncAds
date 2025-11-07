import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AutomationRule {
  id: string;
  userId: string;
  name: string;
  description: string;
  isActive: boolean;
  trigger: any;
  action: any;
  cooldownMinutes: number;
  maxExecutions: number | null;
  executionCount: number;
  lastExecutedAt: string | null;
}

interface TriggerData {
  type: string;
  [key: string]: any;
}

interface ActionData {
  type: string;
  [key: string]: any;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    console.log("🤖 Automation Engine Started");

    const {
      mode = "check_all",
      userId,
      ruleId,
    } = await req.json().catch(() => ({}));

    let rules: AutomationRule[] = [];

    // Buscar regras a processar
    if (mode === "check_all") {
      // Processar todas as regras ativas
      const { data, error } = await supabase
        .from("AutomationRule")
        .select("*")
        .eq("isActive", true)
        .order("lastExecutedAt", { ascending: true, nullsFirst: true })
        .limit(100);

      if (error) throw error;
      rules = data || [];
      console.log(`📋 Found ${rules.length} active rules to check`);
    } else if (mode === "check_user" && userId) {
      // Processar regras de um usuário específico
      const { data, error } = await supabase
        .from("AutomationRule")
        .select("*")
        .eq("userId", userId)
        .eq("isActive", true);

      if (error) throw error;
      rules = data || [];
      console.log(`📋 Found ${rules.length} active rules for user ${userId}`);
    } else if (mode === "check_rule" && ruleId) {
      // Processar uma regra específica
      const { data, error } = await supabase
        .from("AutomationRule")
        .select("*")
        .eq("id", ruleId)
        .single();

      if (error) throw error;
      rules = data ? [data] : [];
      console.log(`📋 Checking specific rule ${ruleId}`);
    }

    const results = {
      total: rules.length,
      executed: 0,
      skipped: 0,
      failed: 0,
      details: [] as any[],
    };

    // Processar cada regra
    for (const rule of rules) {
      try {
        const startTime = Date.now();

        // Verificar se pode executar (cooldown, limites)
        const canExecute = await checkCanExecute(supabase, rule);
        if (!canExecute) {
          results.skipped++;
          results.details.push({
            ruleId: rule.id,
            name: rule.name,
            status: "skipped",
            reason: "Cooldown or max executions reached",
          });
          continue;
        }

        // Avaliar trigger
        const triggerResult = await evaluateTrigger(
          supabase,
          rule.trigger,
          rule.userId,
        );

        if (!triggerResult.shouldExecute) {
          results.skipped++;
          results.details.push({
            ruleId: rule.id,
            name: rule.name,
            status: "skipped",
            reason: "Trigger condition not met",
            triggerData: triggerResult.data,
          });
          continue;
        }

        console.log(`✅ Trigger met for rule: ${rule.name}`);

        // Executar ação
        const actionResult = await executeAction(
          supabase,
          rule.action,
          rule.userId,
          triggerResult.data,
        );

        const executionTime = Date.now() - startTime;

        // Registrar execução
        await logExecution(
          supabase,
          rule.id,
          "success",
          triggerResult.data,
          actionResult,
          executionTime,
        );

        // Atualizar contadores da regra
        await supabase
          .from("AutomationRule")
          .update({
            executionCount: rule.executionCount + 1,
            lastExecutedAt: new Date().toISOString(),
          })
          .eq("id", rule.id);

        results.executed++;
        results.details.push({
          ruleId: rule.id,
          name: rule.name,
          status: "success",
          actionResult,
          executionTime,
        });

        console.log(`✅ Rule executed successfully: ${rule.name}`);
      } catch (error: any) {
        console.error(`❌ Error processing rule ${rule.name}:`, error);

        results.failed++;
        results.details.push({
          ruleId: rule.id,
          name: rule.name,
          status: "failed",
          error: error.message,
        });

        // Registrar falha
        await logExecution(
          supabase,
          rule.id,
          "failed",
          null,
          null,
          0,
          error.message,
        );
      }
    }

    console.log(
      `🏁 Automation Engine Complete: ${results.executed} executed, ${results.skipped} skipped, ${results.failed} failed`,
    );

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("❌ Automation Engine Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// Verificar se regra pode executar
async function checkCanExecute(
  supabase: any,
  rule: AutomationRule,
): Promise<boolean> {
  // Verificar limite de execuções
  if (
    rule.maxExecutions !== null &&
    rule.executionCount >= rule.maxExecutions
  ) {
    return false;
  }

  // Verificar cooldown
  if (rule.lastExecutedAt) {
    const lastExecution = new Date(rule.lastExecutedAt);
    const now = new Date();
    const minutesSinceLastExecution =
      (now.getTime() - lastExecution.getTime()) / (1000 * 60);

    if (minutesSinceLastExecution < rule.cooldownMinutes) {
      return false;
    }
  }

  return true;
}

// Avaliar trigger (condição)
async function evaluateTrigger(
  supabase: any,
  trigger: TriggerData,
  userId: string,
): Promise<{ shouldExecute: boolean; data?: any }> {
  switch (trigger.type) {
    case "metric_threshold":
      return await evaluateMetricThreshold(supabase, trigger, userId);

    case "roas_below":
      return await evaluateRoasBelow(supabase, trigger, userId);

    case "roas_above":
      return await evaluateRoasAbove(supabase, trigger, userId);

    case "cpc_above":
      return await evaluateCpcAbove(supabase, trigger, userId);

    case "budget_threshold":
      return await evaluateBudgetThreshold(supabase, trigger, userId);

    case "schedule":
      return evaluateSchedule(trigger);

    case "campaign_status":
      return await evaluateCampaignStatus(supabase, trigger, userId);

    default:
      console.warn(`Unknown trigger type: ${trigger.type}`);
      return { shouldExecute: false };
  }
}

// Avaliar métrica com threshold
async function evaluateMetricThreshold(
  supabase: any,
  trigger: any,
  userId: string,
): Promise<{ shouldExecute: boolean; data?: any }> {
  const { metric, condition, value, platform, campaignId } = trigger;

  // Buscar campanha e suas métricas
  const { data: campaigns } = await supabase
    .from("Campaign")
    .select("*")
    .eq("userId", userId)
    .eq("platform", platform);

  if (!campaigns || campaigns.length === 0) {
    return { shouldExecute: false };
  }

  for (const campaign of campaigns) {
    if (campaignId && campaign.id !== campaignId) continue;

    const metricValue = campaign[metric];
    if (metricValue === undefined) continue;

    const shouldExecute = evaluateCondition(metricValue, condition, value);

    if (shouldExecute) {
      return {
        shouldExecute: true,
        data: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          metric,
          currentValue: metricValue,
          threshold: value,
        },
      };
    }
  }

  return { shouldExecute: false };
}

// Avaliar ROAS abaixo do valor
async function evaluateRoasBelow(
  supabase: any,
  trigger: any,
  userId: string,
): Promise<{ shouldExecute: boolean; data?: any }> {
  const { value, platform, campaignId } = trigger;

  let query = supabase.from("Campaign").select("*").eq("userId", userId);

  if (platform) {
    query = query.eq("platform", platform);
  }

  if (campaignId) {
    query = query.eq("id", campaignId);
  }

  const { data: campaigns } = await query;

  if (!campaigns || campaigns.length === 0) {
    return { shouldExecute: false };
  }

  for (const campaign of campaigns) {
    // Calcular ROAS (budgetSpent / conversions * valor médio)
    const roas =
      campaign.budgetSpent > 0
        ? (campaign.conversions * 100) / campaign.budgetSpent // simplificado
        : 0;

    if (roas < value && roas > 0) {
      return {
        shouldExecute: true,
        data: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          currentRoas: roas,
          threshold: value,
          platform: campaign.platform,
        },
      };
    }
  }

  return { shouldExecute: false };
}

// Avaliar ROAS acima do valor
async function evaluateRoasAbove(
  supabase: any,
  trigger: any,
  userId: string,
): Promise<{ shouldExecute: boolean; data?: any }> {
  const { value, platform, campaignId } = trigger;

  let query = supabase.from("Campaign").select("*").eq("userId", userId);

  if (platform) {
    query = query.eq("platform", platform);
  }

  if (campaignId) {
    query = query.eq("id", campaignId);
  }

  const { data: campaigns } = await query;

  if (!campaigns || campaigns.length === 0) {
    return { shouldExecute: false };
  }

  for (const campaign of campaigns) {
    const roas =
      campaign.budgetSpent > 0
        ? (campaign.conversions * 100) / campaign.budgetSpent
        : 0;

    if (roas > value) {
      return {
        shouldExecute: true,
        data: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          currentRoas: roas,
          threshold: value,
          platform: campaign.platform,
        },
      };
    }
  }

  return { shouldExecute: false };
}

// Avaliar CPC acima do valor
async function evaluateCpcAbove(
  supabase: any,
  trigger: any,
  userId: string,
): Promise<{ shouldExecute: boolean; data?: any }> {
  const { value, platform, campaignId } = trigger;

  let query = supabase.from("Campaign").select("*").eq("userId", userId);

  if (platform) {
    query = query.eq("platform", platform);
  }

  if (campaignId) {
    query = query.eq("id", campaignId);
  }

  const { data: campaigns } = await query;

  if (!campaigns || campaigns.length === 0) {
    return { shouldExecute: false };
  }

  for (const campaign of campaigns) {
    if (campaign.cpc > value) {
      return {
        shouldExecute: true,
        data: {
          campaignId: campaign.id,
          campaignName: campaign.name,
          currentCpc: campaign.cpc,
          threshold: value,
          platform: campaign.platform,
        },
      };
    }
  }

  return { shouldExecute: false };
}

// Avaliar orçamento
async function evaluateBudgetThreshold(
  supabase: any,
  trigger: any,
  userId: string,
): Promise<{ shouldExecute: boolean; data?: any }> {
  const { threshold, campaignId } = trigger;

  const { data: campaign } = await supabase
    .from("Campaign")
    .select("*")
    .eq("userId", userId)
    .eq("id", campaignId)
    .single();

  if (!campaign) {
    return { shouldExecute: false };
  }

  const percentageUsed = (campaign.budgetSpent / campaign.budgetTotal) * 100;

  if (percentageUsed >= threshold) {
    return {
      shouldExecute: true,
      data: {
        campaignId: campaign.id,
        campaignName: campaign.name,
        budgetUsed: campaign.budgetSpent,
        budgetTotal: campaign.budgetTotal,
        percentageUsed,
      },
    };
  }

  return { shouldExecute: false };
}

// Avaliar agendamento
function evaluateSchedule(trigger: any): {
  shouldExecute: boolean;
  data?: any;
} {
  const { time, days } = trigger;
  const now = new Date();

  // Verificar dia da semana
  if (days && days.length > 0) {
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDay = dayNames[now.getDay()];

    if (!days.includes(currentDay)) {
      return { shouldExecute: false };
    }
  }

  // Verificar horário
  if (time) {
    const [targetHour, targetMinute] = time.split(":").map(Number);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Executar se estiver dentro de uma janela de 5 minutos
    const timeDiff = Math.abs(
      currentHour * 60 + currentMinute - (targetHour * 60 + targetMinute),
    );

    if (timeDiff > 5) {
      return { shouldExecute: false };
    }
  }

  return { shouldExecute: true, data: { executedAt: now.toISOString() } };
}

// Avaliar status de campanha
async function evaluateCampaignStatus(
  supabase: any,
  trigger: any,
  userId: string,
): Promise<{ shouldExecute: boolean; data?: any }> {
  const { status, campaignId } = trigger;

  const { data: campaign } = await supabase
    .from("Campaign")
    .select("*")
    .eq("userId", userId)
    .eq("id", campaignId)
    .single();

  if (!campaign) {
    return { shouldExecute: false };
  }

  if (campaign.status === status) {
    return {
      shouldExecute: true,
      data: {
        campaignId: campaign.id,
        campaignName: campaign.name,
        status: campaign.status,
      },
    };
  }

  return { shouldExecute: false };
}

// Avaliar condição
function evaluateCondition(
  value: number,
  condition: string,
  threshold: number,
): boolean {
  switch (condition) {
    case ">":
      return value > threshold;
    case ">=":
      return value >= threshold;
    case "<":
      return value < threshold;
    case "<=":
      return value <= threshold;
    case "==":
    case "=":
      return value === threshold;
    case "!=":
      return value !== threshold;
    default:
      return false;
  }
}

// Executar ação
async function executeAction(
  supabase: any,
  action: ActionData,
  userId: string,
  triggerData: any,
): Promise<any> {
  switch (action.type) {
    case "pause_campaign":
      return await pauseCampaign(supabase, action, userId, triggerData);

    case "adjust_budget":
      return await adjustBudget(supabase, action, userId, triggerData);

    case "send_notification":
      return await sendNotification(supabase, action, userId, triggerData);

    case "create_alert":
      return await createAlert(supabase, action, userId, triggerData);

    case "scale_campaign":
      return await scaleCampaign(supabase, action, userId, triggerData);

    default:
      console.warn(`Unknown action type: ${action.type}`);
      return { executed: false, message: "Unknown action type" };
  }
}

// Pausar campanha
async function pauseCampaign(
  supabase: any,
  action: any,
  userId: string,
  triggerData: any,
) {
  const campaignId = action.campaignId || triggerData.campaignId;

  const { error } = await supabase
    .from("Campaign")
    .update({ status: "Pausada" })
    .eq("id", campaignId)
    .eq("userId", userId);

  if (error) throw error;

  return {
    executed: true,
    action: "pause_campaign",
    campaignId,
    campaignName: triggerData.campaignName,
  };
}

// Ajustar orçamento
async function adjustBudget(
  supabase: any,
  action: any,
  userId: string,
  triggerData: any,
) {
  const campaignId = action.campaignId || triggerData.campaignId;
  const { amount, direction } = action;

  const { data: campaign } = await supabase
    .from("Campaign")
    .select("budgetTotal")
    .eq("id", campaignId)
    .eq("userId", userId)
    .single();

  if (!campaign) throw new Error("Campaign not found");

  const currentBudget = campaign.budgetTotal;
  const multiplier =
    direction === "increase" ? 1 + amount / 100 : 1 - amount / 100;
  const newBudget = Math.round(currentBudget * multiplier * 100) / 100;

  const { error } = await supabase
    .from("Campaign")
    .update({ budgetTotal: newBudget })
    .eq("id", campaignId)
    .eq("userId", userId);

  if (error) throw error;

  return {
    executed: true,
    action: "adjust_budget",
    campaignId,
    oldBudget: currentBudget,
    newBudget,
    change: `${direction === "increase" ? "+" : "-"}${amount}%`,
  };
}

// Enviar notificação
async function sendNotification(
  supabase: any,
  action: any,
  userId: string,
  triggerData: any,
) {
  const { message } = action;

  const notificationMessage = message
    .replace("{campaignName}", triggerData.campaignName || "Unknown")
    .replace("{metric}", triggerData.metric || "")
    .replace(
      "{value}",
      triggerData.currentValue ||
        triggerData.currentRoas ||
        triggerData.currentCpc ||
        "",
    );

  // Criar notificação no sistema (se houver tabela de notificações)
  // Por enquanto, apenas retornar sucesso

  return {
    executed: true,
    action: "send_notification",
    message: notificationMessage,
    userId,
  };
}

// Criar alerta
async function createAlert(
  supabase: any,
  action: any,
  userId: string,
  triggerData: any,
) {
  const { severity = "medium", message } = action;

  // Criar alerta no sistema
  // Por enquanto, apenas log

  console.log(`🚨 Alert created - Severity: ${severity}, User: ${userId}`);
  console.log(`   Message: ${message}`);
  console.log(`   Trigger Data:`, triggerData);

  return {
    executed: true,
    action: "create_alert",
    severity,
    triggerData,
  };
}

// Escalar campanha
async function scaleCampaign(
  supabase: any,
  action: any,
  userId: string,
  triggerData: any,
) {
  const campaignId = action.campaignId || triggerData.campaignId;
  const { scaleFactor = 1.5 } = action;

  const { data: campaign } = await supabase
    .from("Campaign")
    .select("budgetTotal")
    .eq("id", campaignId)
    .eq("userId", userId)
    .single();

  if (!campaign) throw new Error("Campaign not found");

  const newBudget = Math.round(campaign.budgetTotal * scaleFactor * 100) / 100;

  const { error } = await supabase
    .from("Campaign")
    .update({ budgetTotal: newBudget })
    .eq("id", campaignId)
    .eq("userId", userId);

  if (error) throw error;

  return {
    executed: true,
    action: "scale_campaign",
    campaignId,
    oldBudget: campaign.budgetTotal,
    newBudget,
    scaleFactor,
  };
}

// Registrar execução
async function logExecution(
  supabase: any,
  ruleId: string,
  status: string,
  triggerData: any,
  actionResult: any,
  executionTimeMs: number,
  error?: string,
) {
  await supabase.from("AutomationRuleExecution").insert({
    ruleId,
    status,
    triggerData,
    actionResult,
    executionTimeMs,
    error,
  });
}
