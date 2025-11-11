import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface Subscription {
  id: string;
  userId: string;
  plan: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  cancelAtPeriodEnd: boolean;
  paymentMethodId: string;
  lastPaymentDate: string | null;
  nextPaymentDate: string;
  amount: number;
}

interface PaymentMethod {
  id: string;
  userId: string;
  cardBrand: string;
  lastFourDigits: string;
  cardholderName: string;
  isVerified: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Starting subscription renewal process...");

    const now = new Date();
    const stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // 1. Buscar assinaturas que precisam ser renovadas
    // - Status "trialing" com trialEnd <= agora
    // - Status "active" com nextPaymentDate <= agora
    const { data: subscriptionsToRenew, error: fetchError } =
      await supabaseClient
        .from("Subscription")
        .select("*")
        .or(
          `and(status.eq.trialing,trialEnd.lte.${now.toISOString()}),and(status.eq.active,nextPaymentDate.lte.${now.toISOString()})`,
        )
        .eq("cancelAtPeriodEnd", false);

    if (fetchError) {
      console.error("Error fetching subscriptions:", fetchError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch subscriptions",
          details: fetchError,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `Found ${subscriptionsToRenew?.length || 0} subscriptions to renew`,
    );

    if (!subscriptionsToRenew || subscriptionsToRenew.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No subscriptions to renew",
          stats,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2. Processar cada assinatura
    for (const subscription of subscriptionsToRenew as Subscription[]) {
      stats.processed++;
      console.log(`Processing subscription ${subscription.id}...`);

      try {
        // Buscar método de pagamento
        const { data: paymentMethod, error: pmError } = await supabaseClient
          .from("PaymentMethod")
          .select("*")
          .eq("id", subscription.paymentMethodId)
          .single();

        if (pmError || !paymentMethod) {
          console.error(
            `Payment method not found for subscription ${subscription.id}`,
          );
          stats.failed++;
          stats.errors.push(
            `Subscription ${subscription.id}: Payment method not found`,
          );

          // Marcar assinatura como past_due
          await supabaseClient
            .from("Subscription")
            .update({ status: "past_due" })
            .eq("id", subscription.id);

          continue;
        }

        // Buscar usuário
        const { data: user, error: userError } = await supabaseClient
          .from("User")
          .select("email, name")
          .eq("id", subscription.userId)
          .single();

        if (userError) {
          console.error(`User not found for subscription ${subscription.id}`);
          stats.failed++;
          stats.errors.push(
            `Subscription ${subscription.id}: User not found`,
          );
          continue;
        }

        // Obter gateway admin (padrão)
        const { data: adminGateway, error: gatewayError } =
          await supabaseClient
            .from("GatewayConfig")
            .select("*")
            .is("userId", null)
            .eq("isDefault", true)
            .eq("isActive", true)
            .single();

        if (gatewayError || !adminGateway) {
          console.error("Admin gateway not found");
          stats.failed++;
          stats.errors.push(
            `Subscription ${subscription.id}: Admin gateway not configured`,
          );
          continue;
        }

        // Processar pagamento via process-payment function
        const orderId = `subscription-${subscription.id}-${Date.now()}`;
        const paymentResponse = await fetch(
          `${supabaseUrl}/functions/v1/process-payment`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({
              orderId,
              userId: subscription.userId,
              amount: subscription.amount,
              paymentMethod: "credit_card",
              customer: {
                name: paymentMethod.cardholderName,
                email: user.email || "",
              },
              metadata: {
                type: "subscription_renewal",
                subscriptionId: subscription.id,
                plan: subscription.plan,
                automated: true,
              },
            }),
          },
        );

        const paymentResult = await paymentResponse.json();

        if (!paymentResult.success) {
          console.error(
            `Payment failed for subscription ${subscription.id}:`,
            paymentResult.message,
          );
          stats.failed++;
          stats.errors.push(
            `Subscription ${subscription.id}: ${paymentResult.message}`,
          );

          // Criar invoice com status failed
          await supabaseClient.from("Invoice").insert({
            userId: subscription.userId,
            subscriptionId: subscription.id,
            amount: subscription.amount,
            status: "failed",
            description: `Assinatura ${subscription.plan.toUpperCase()} - Renovação falhou`,
            dueDate: now.toISOString(),
            paymentMethodId: paymentMethod.id,
            metadata: {
              plan: subscription.plan,
              error: paymentResult.message,
              automated: true,
            },
          });

          // Atualizar assinatura para past_due
          await supabaseClient
            .from("Subscription")
            .update({ status: "past_due" })
            .eq("id", subscription.id);

          continue;
        }

        // Pagamento bem-sucedido!
        console.log(`Payment successful for subscription ${subscription.id}`);
        stats.successful++;

        // Criar invoice paga
        await supabaseClient.from("Invoice").insert({
          userId: subscription.userId,
          subscriptionId: subscription.id,
          amount: subscription.amount,
          status: "paid",
          description: `Assinatura ${subscription.plan.toUpperCase()} - Renovação automática`,
          dueDate: now.toISOString(),
          paidAt: now.toISOString(),
          paymentMethodId: paymentMethod.id,
          transactionId: paymentResult.transactionId,
          metadata: {
            plan: subscription.plan,
            gatewayTransactionId: paymentResult.gatewayTransactionId,
            automated: true,
          },
        });

        // Atualizar assinatura para o próximo período
        const nextPeriodStart = new Date();
        const nextPeriodEnd = new Date(nextPeriodStart);
        nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

        await supabaseClient
          .from("Subscription")
          .update({
            status: "active",
            currentPeriodStart: nextPeriodStart.toISOString(),
            currentPeriodEnd: nextPeriodEnd.toISOString(),
            lastPaymentDate: nextPeriodStart.toISOString(),
            nextPaymentDate: nextPeriodEnd.toISOString(),
            trialEnd: null, // Remover trial após primeira cobrança
            updatedAt: nextPeriodStart.toISOString(),
          })
          .eq("id", subscription.id);

        // Registrar no PaymentSplitLog (100% admin)
        await supabaseClient.from("PaymentSplitLog").insert({
          transactionId: paymentResult.transactionId,
          orderId,
          userId: subscription.userId,
          ruleId: null,
          decision: "admin",
          gatewayId: adminGateway.id,
          gatewayName: adminGateway.name,
          amount: subscription.amount,
          adminRevenue: subscription.amount,
          clientRevenue: 0,
          ruleType: "admin_billing",
          ruleName: "Renovação Automática de Assinatura SyncAds",
          reason: `Renovação automática de assinatura ${subscription.plan.toUpperCase()}`,
          metadata: {
            type: "subscription_renewal",
            subscriptionId: subscription.id,
            plan: subscription.plan,
            automated: true,
          },
        });

        console.log(
          `Successfully renewed subscription ${subscription.id} for user ${subscription.userId}`,
        );
      } catch (error) {
        console.error(
          `Error processing subscription ${subscription.id}:`,
          error,
        );
        stats.failed++;
        stats.errors.push(
          `Subscription ${subscription.id}: ${error.message || "Unknown error"}`,
        );
      }
    }

    console.log("Subscription renewal process completed");
    console.log("Stats:", stats);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Subscription renewal process completed",
        stats,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Fatal error in subscription renewal:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
