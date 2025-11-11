import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PaymentJob {
  id: string;
  job_type: string;
  payload: any;
  attempts: number;
  max_attempts: number;
}

interface JobResult {
  success: boolean;
  data?: any;
  error?: string;
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase com service_role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    console.log("🚀 Payment Queue Processor started");

    // Buscar próximo job
    const { data: jobs, error: fetchError } = await supabase.rpc(
      "get_next_payment_job"
    );

    if (fetchError) {
      console.error("❌ Error fetching job:", fetchError);
      throw fetchError;
    }

    if (!jobs || jobs.length === 0) {
      console.log("✅ No jobs to process");
      return new Response(
        JSON.stringify({ message: "No jobs to process" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const job = jobs[0] as PaymentJob;
    console.log(`📋 Processing job ${job.id} of type ${job.job_type}`);

    let result: JobResult;

    // Processar job baseado no tipo
    try {
      switch (job.job_type) {
        case "PAYMENT_PROCESS":
          result = await processPayment(supabase, job);
          break;

        case "SUBSCRIPTION_RENEWAL":
          result = await processSubscriptionRenewal(supabase, job);
          break;

        case "PAYMENT_REFUND":
          result = await processRefund(supabase, job);
          break;

        case "PAYMENT_RETRY":
          result = await retryPayment(supabase, job);
          break;

        case "WEBHOOK_PROCESS":
          result = await processWebhook(supabase, job);
          break;

        case "PIX_VERIFICATION":
          result = await verifyPixPayment(supabase, job);
          break;

        case "CHECKOUT_VALIDATION":
          result = await validateCheckout(supabase, job);
          break;

        default:
          result = {
            success: false,
            error: `Unknown job type: ${job.job_type}`,
          };
      }

      // Marcar job baseado no resultado
      if (result.success) {
        console.log(`✅ Job ${job.id} completed successfully`);
        await supabase.rpc("complete_payment_job", {
          p_job_id: job.id,
          p_result: result.data || {},
        });
      } else {
        console.error(`❌ Job ${job.id} failed:`, result.error);
        await supabase.rpc("fail_payment_job", {
          p_job_id: job.id,
          p_error: result.error || "Unknown error",
          p_error_details: result,
          p_retry_after_seconds: calculateRetryDelay(job.attempts),
        });
      }
    } catch (error: any) {
      console.error(`💥 Exception processing job ${job.id}:`, error);
      await supabase.rpc("fail_payment_job", {
        p_job_id: job.id,
        p_error: error.message || "Processing exception",
        p_error_details: { exception: error.toString() },
        p_retry_after_seconds: calculateRetryDelay(job.attempts),
      });
    }

    return new Response(
      JSON.stringify({
        message: "Job processed",
        jobId: job.id,
        result,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("💥 Fatal error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// ============================================================================
// PROCESSORS
// ============================================================================

async function processPayment(
  supabase: any,
  job: PaymentJob
): Promise<JobResult> {
  const { orderId, amount, method, userId } = job.payload;

  console.log(
    `💳 Processing payment: Order ${orderId}, Amount ${amount}, Method ${method}`
  );

  // Buscar dados do pedido
  const { data: order, error: orderError } = await supabase
    .from("Order")
    .select("*")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return { success: false, error: "Order not found" };
  }

  // Buscar gateway configurado
  const { data: gateway } = await supabase
    .from("GatewayConfig")
    .select("*")
    .eq("userId", userId)
    .eq("isActive", true)
    .order("createdAt", { ascending: false })
    .limit(1)
    .single();

  if (!gateway) {
    return { success: false, error: "No active gateway found" };
  }

  // Chamar edge function de processamento de pagamento
  const { data: paymentResult, error: paymentError } = await supabase.functions
    .invoke("process-payment", {
      body: {
        orderId,
        amount,
        method,
        gatewayId: gateway.id,
      },
    });

  if (paymentError) {
    return { success: false, error: paymentError.message };
  }

  return { success: true, data: paymentResult };
}

async function processSubscriptionRenewal(
  supabase: any,
  job: PaymentJob
): Promise<JobResult> {
  const { subscriptionId, userId } = job.payload;

  console.log(`🔄 Renewing subscription ${subscriptionId} for user ${userId}`);

  // Chamar edge function de renovação
  const { data: renewalResult, error: renewalError } =
    await supabase.functions.invoke("renew-subscriptions", {
      body: {
        subscriptionId,
        userId,
      },
    });

  if (renewalError) {
    return { success: false, error: renewalError.message };
  }

  return { success: true, data: renewalResult };
}

async function processRefund(
  supabase: any,
  job: PaymentJob
): Promise<JobResult> {
  const { orderId, amount, reason, userId } = job.payload;

  console.log(`💰 Processing refund for order ${orderId}: ${reason}`);

  // Buscar pedido
  const { data: order } = await supabase
    .from("Order")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  // Buscar gateway
  const { data: gateway } = await supabase
    .from("GatewayConfig")
    .select("*")
    .eq("userId", userId)
    .eq("isActive", true)
    .limit(1)
    .single();

  if (!gateway) {
    return { success: false, error: "No active gateway found" };
  }

  // Processar estorno via gateway
  // TODO: Implementar lógica específica de cada gateway

  // Atualizar status do pedido
  await supabase
    .from("Order")
    .update({
      status: "REFUNDED",
      paymentStatus: "REFUNDED",
      updatedAt: new Date().toISOString(),
    })
    .eq("id", orderId);

  return { success: true, data: { refunded: amount } };
}

async function retryPayment(
  supabase: any,
  job: PaymentJob
): Promise<JobResult> {
  console.log(`🔁 Retrying payment for order ${job.payload.orderId}`);

  // Tentar processar pagamento novamente
  return await processPayment(supabase, job);
}

async function processWebhook(
  supabase: any,
  job: PaymentJob
): Promise<JobResult> {
  const { webhookType, data } = job.payload;

  console.log(`🪝 Processing webhook: ${webhookType}`);

  // Processar webhook baseado no tipo
  switch (webhookType) {
    case "payment.approved":
      // Atualizar status do pagamento
      await supabase
        .from("Order")
        .update({
          paymentStatus: "PAID",
          status: "PROCESSING",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", data.orderId);
      break;

    case "payment.cancelled":
      await supabase
        .from("Order")
        .update({
          paymentStatus: "FAILED",
          status: "CANCELLED",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", data.orderId);
      break;

    default:
      console.log(`Unknown webhook type: ${webhookType}`);
  }

  return { success: true, data: { processed: true } };
}

async function verifyPixPayment(
  supabase: any,
  job: PaymentJob
): Promise<JobResult> {
  const { orderId, pixCode } = job.payload;

  console.log(`🔍 Verifying PIX payment for order ${orderId}`);

  // Buscar pedido
  const { data: order } = await supabase
    .from("Order")
    .select("*")
    .eq("id", orderId)
    .single();

  if (!order) {
    return { success: false, error: "Order not found" };
  }

  // Verificar status do PIX no gateway
  // TODO: Implementar verificação real via API do gateway

  // Por enquanto, simular verificação
  const isPaid = false; // Substituir por verificação real

  if (isPaid) {
    await supabase
      .from("Order")
      .update({
        paymentStatus: "PAID",
        status: "PROCESSING",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", orderId);

    return { success: true, data: { paid: true } };
  }

  // Se não foi pago ainda, agendar nova verificação
  return { success: false, error: "Payment not confirmed yet" };
}

async function validateCheckout(
  supabase: any,
  job: PaymentJob
): Promise<JobResult> {
  const { userId, cardToken } = job.payload;

  console.log(`✅ Validating checkout for user ${userId}`);

  // Validar cartão de crédito
  // TODO: Implementar validação real

  // Atualizar status do usuário
  await supabase
    .from("User")
    .update({
      checkoutPaymentMethodVerified: true,
      checkoutTrialActive: true,
      checkoutTrialStartedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    .eq("id", userId);

  return { success: true, data: { validated: true } };
}

// ============================================================================
// HELPERS
// ============================================================================

function calculateRetryDelay(attempts: number): number {
  // Backoff exponencial: 60s, 120s, 300s
  const delays = [60, 120, 300, 600, 1800];
  return delays[Math.min(attempts, delays.length - 1)];
}
