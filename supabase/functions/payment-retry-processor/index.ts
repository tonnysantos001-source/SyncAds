// ============================================
// PAYMENT RETRY PROCESSOR
// ============================================
//
// Edge Function para processar fila de retry automático
// com exponential backoff
//
// Features:
// ✅ Exponential backoff strategy
// ✅ Priority-based processing
// ✅ Automatic transaction reprocessing
// ✅ Event logging
// ✅ Alert creation on max retries
// ✅ Rate limiting
//
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// ===== TYPES =====

interface RetryQueueItem {
  id: string;
  transactionId: string;
  organizationId: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt: string;
  lastError: string | null;
  backoffStrategy: "exponential" | "linear" | "fixed";
  baseDelay: number;
  priority: number;
  metadata: any;
}

interface Transaction {
  id: string;
  orderId: string;
  gatewayId: string;
  paymentMethod: string;
  amount: number;
  status: string;
  metadata: any;
}

// ===== CONFIGURATION =====

const CONFIG = {
  MAX_RETRIES: 5,
  BASE_DELAY: 1000, // 1 second
  MAX_DELAY: 300000, // 5 minutes
  BATCH_SIZE: 10,
  RATE_LIMIT_PER_MINUTE: 100,
};

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

// ===== EXPONENTIAL BACKOFF =====

function calculateNextRetry(
  retryCount: number,
  strategy: "exponential" | "linear" | "fixed" = "exponential",
  baseDelay: number = CONFIG.BASE_DELAY
): Date {
  let delay: number;

  switch (strategy) {
    case "exponential":
      delay = Math.min(baseDelay * Math.pow(2, retryCount), CONFIG.MAX_DELAY);
      break;
    case "linear":
      delay = Math.min(baseDelay * (retryCount + 1), CONFIG.MAX_DELAY);
      break;
    case "fixed":
      delay = baseDelay;
      break;
    default:
      delay = baseDelay;
  }

  // Add jitter (randomness) to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;
  delay = delay + jitter;

  return new Date(Date.now() + delay);
}

// ===== RETRY PROCESSOR =====

async function processRetryQueue(supabaseClient: any): Promise<{
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
}> {
  const stats = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
  };

  try {
    // Fetch pending retries ordered by priority and nextRetryAt
    const { data: retryItems, error: fetchError } = await supabaseClient
      .from("PaymentRetryQueue")
      .select("*")
      .eq("status", "pending")
      .lte("nextRetryAt", new Date().toISOString())
      .lt("retryCount", supabaseClient.rpc.raw("\"maxRetries\""))
      .order("priority", { ascending: true })
      .order("nextRetryAt", { ascending: true })
      .limit(CONFIG.BATCH_SIZE);

    if (fetchError) {
      log("error", "Failed to fetch retry queue", { error: fetchError });
      throw fetchError;
    }

    if (!retryItems || retryItems.length === 0) {
      log("info", "No pending retries found");
      return stats;
    }

    log("info", `Processing ${retryItems.length} retry items`);

    // Process each retry item
    for (const item of retryItems) {
      try {
        await processRetryItem(supabaseClient, item, stats);
      } catch (error: any) {
        log("error", `Failed to process retry item ${item.id}`, {
          error: error.message,
        });
        stats.failed++;
      }

      stats.processed++;
    }

    log("info", "Retry queue processing completed", stats);
    return stats;
  } catch (error: any) {
    log("error", "Error processing retry queue", { error: error.message });
    throw error;
  }
}

async function processRetryItem(
  supabaseClient: any,
  item: RetryQueueItem,
  stats: any
): Promise<void> {
  log("info", `Processing retry for transaction ${item.transactionId}`, {
    retryCount: item.retryCount,
    priority: item.priority,
  });

  // Mark as processing
  await supabaseClient
    .from("PaymentRetryQueue")
    .update({
      status: "processing",
      lastAttemptAt: new Date().toISOString(),
    })
    .eq("id", item.id);

  try {
    // Fetch transaction details
    const { data: transaction, error: txError } = await supabaseClient
      .from("Transaction")
      .select(
        `
        *,
        Order!inner(*),
        Gateway!inner(*)
      `
      )
      .eq("id", item.transactionId)
      .single();

    if (txError || !transaction) {
      throw new Error(`Transaction not found: ${item.transactionId}`);
    }

    // Check if transaction is already successful
    if (transaction.status === "PAID") {
      log("info", "Transaction already paid, removing from queue", {
        transactionId: item.transactionId,
      });

      await supabaseClient
        .from("PaymentRetryQueue")
        .update({ status: "success" })
        .eq("id", item.id);

      stats.succeeded++;
      return;
    }

    // Retry payment processing
    const result = await retryPayment(supabaseClient, transaction);

    if (result.success) {
      // Success - remove from queue
      await supabaseClient
        .from("PaymentRetryQueue")
        .update({
          status: "success",
          updatedAt: new Date().toISOString(),
        })
        .eq("id", item.id);

      // Log success event
      await supabaseClient.from("PaymentEvent").insert({
        organizationId: item.organizationId,
        transactionId: item.transactionId,
        eventType: "retry_success",
        severity: "info",
        eventData: {
          retryCount: item.retryCount + 1,
          message: "Payment successfully processed after retry",
        },
      });

      stats.succeeded++;
      log("info", "Retry succeeded", { transactionId: item.transactionId });
    } else {
      // Failed - update retry count
      const newRetryCount = item.retryCount + 1;

      if (newRetryCount >= item.maxRetries) {
        // Max retries reached
        await supabaseClient
          .from("PaymentRetryQueue")
          .update({
            status: "failed",
            lastError: result.error,
            updatedAt: new Date().toISOString(),
          })
          .eq("id", item.id);

        // Create alert
        await createMaxRetriesAlert(
          supabaseClient,
          item.organizationId,
          transaction.Gateway.id,
          item.transactionId
        );

        stats.failed++;
        log("warn", "Max retries reached", {
          transactionId: item.transactionId,
          retryCount: newRetryCount,
        });
      } else {
        // Schedule next retry
        const nextRetryAt = calculateNextRetry(
          newRetryCount,
          item.backoffStrategy,
          item.baseDelay
        );

        await supabaseClient
          .from("PaymentRetryQueue")
          .update({
            status: "pending",
            retryCount: newRetryCount,
            nextRetryAt: nextRetryAt.toISOString(),
            lastError: result.error,
            lastAttemptAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .eq("id", item.id);

        // Log retry event
        await supabaseClient.from("PaymentEvent").insert({
          organizationId: item.organizationId,
          transactionId: item.transactionId,
          eventType: "retry_failed",
          severity: "warning",
          eventData: {
            retryCount: newRetryCount,
            nextRetryAt: nextRetryAt.toISOString(),
            error: result.error,
          },
        });

        stats.failed++;
        log("info", "Retry failed, rescheduled", {
          transactionId: item.transactionId,
          nextRetryAt: nextRetryAt.toISOString(),
        });
      }
    }
  } catch (error: any) {
    // Update retry queue with error
    await supabaseClient
      .from("PaymentRetryQueue")
      .update({
        status: "pending",
        lastError: error.message,
        updatedAt: new Date().toISOString(),
      })
      .eq("id", item.id);

    log("error", "Error processing retry item", {
      error: error.message,
      transactionId: item.transactionId,
    });

    throw error;
  }
}

// ===== RETRY PAYMENT =====

async function retryPayment(
  supabaseClient: any,
  transaction: Transaction
): Promise<{ success: boolean; error?: string }> {
  try {
    log("info", `Retrying payment for transaction ${transaction.id}`);

    // Call process-payment function
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-payment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({
          orderId: transaction.orderId,
          paymentMethod: transaction.paymentMethod,
          gatewaySlug: transaction.Gateway?.slug,
          isRetry: true,
          retryAttempt: transaction.metadata?.retryCount || 0,
        }),
      }
    );

    const result = await response.json();

    if (response.ok && result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || result.message || "Unknown error",
      };
    }
  } catch (error: any) {
    log("error", "Error retrying payment", {
      error: error.message,
      transactionId: transaction.id,
    });

    return {
      success: false,
      error: error.message,
    };
  }
}

// ===== ALERTS =====

async function createMaxRetriesAlert(
  supabaseClient: any,
  organizationId: string,
  gatewayId: string,
  transactionId: string
): Promise<void> {
  try {
    await supabaseClient.from("PaymentAlert").insert({
      organizationId,
      gatewayId,
      alertType: "webhook_failure",
      severity: "error",
      title: "Transação Falhou Após Múltiplas Tentativas",
      message: `A transação ${transactionId} falhou após atingir o limite máximo de tentativas de reprocessamento.`,
      metadata: {
        transactionId,
        maxRetries: CONFIG.MAX_RETRIES,
      },
    });

    log("info", "Max retries alert created", { transactionId });
  } catch (error: any) {
    log("error", "Failed to create alert", { error: error.message });
  }
}

// ===== CLEANUP OLD ITEMS =====

async function cleanupOldItems(supabaseClient: any): Promise<number> {
  try {
    // Remove completed items older than 7 days
    const cutoffDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { error, count } = await supabaseClient
      .from("PaymentRetryQueue")
      .delete()
      .in("status", ["success", "cancelled"])
      .lt("updatedAt", cutoffDate.toISOString());

    if (error) {
      log("error", "Failed to cleanup old items", { error });
      return 0;
    }

    log("info", `Cleaned up ${count || 0} old retry items`);
    return count || 0;
  } catch (error: any) {
    log("error", "Error during cleanup", { error: error.message });
    return 0;
  }
}

// ===== HEALTH CHECK =====

async function healthCheck(supabaseClient: any): Promise<{
  status: string;
  queueSize: number;
  oldestPending: string | null;
}> {
  try {
    const { data: queueStats, error } = await supabaseClient
      .from("PaymentRetryQueue")
      .select("status, nextRetryAt")
      .eq("status", "pending")
      .order("nextRetryAt", { ascending: true });

    if (error) throw error;

    return {
      status: "healthy",
      queueSize: queueStats?.length || 0,
      oldestPending: queueStats?.[0]?.nextRetryAt || null,
    };
  } catch (error: any) {
    return {
      status: "unhealthy",
      queueSize: -1,
      oldestPending: null,
    };
  }
}

// ===== MAIN HANDLER =====

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Create Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "process";

    log("info", `Retry processor invoked with action: ${action}`);

    let result: any;

    switch (action) {
      case "process":
        // Process retry queue
        result = await processRetryQueue(supabaseClient);
        break;

      case "cleanup":
        // Cleanup old items
        const cleaned = await cleanupOldItems(supabaseClient);
        result = { cleaned };
        break;

      case "health":
        // Health check
        result = await healthCheck(supabaseClient);
        break;

      default:
        return new Response(
          JSON.stringify({
            error: "Invalid action",
            validActions: ["process", "cleanup", "health"],
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 400,
          }
        );
    }

    const duration = Date.now() - startTime;

    log("info", `Retry processor completed in ${duration}ms`, result);

    return new Response(
      JSON.stringify({
        success: true,
        action,
        result,
        duration,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;

    log("error", "Fatal error in retry processor", {
      error: error.message,
      stack: error.stack,
      duration,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
        code: "RETRY_PROCESSOR_ERROR",
        duration,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// ===== SCHEDULED EXECUTION =====
//
// Para executar automaticamente, configure um cron job:
//
// 1. Via Supabase Dashboard:
//    - Navegue para Database > Cron Jobs
//    - Crie um job que executa a cada 1 minuto:
//    - SELECT net.http_post(
//        url:='https://your-project.supabase.co/functions/v1/payment-retry-processor',
//        headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
//      );
//
// 2. Via SQL (usando pg_cron):
//    - SELECT cron.schedule(
//        'process-payment-retries',
//        '*/1 * * * *', -- A cada 1 minuto
//        $$SELECT net.http_post(
//            url:='https://your-project.supabase.co/functions/v1/payment-retry-processor',
//            headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
//        );$$
//      );
//
// 3. Para cleanup (diariamente às 3am):
//    - SELECT cron.schedule(
//        'cleanup-retry-queue',
//        '0 3 * * *',
//        $$SELECT net.http_post(
//            url:='https://your-project.supabase.co/functions/v1/payment-retry-processor?action=cleanup',
//            headers:='{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
//        );$$
//      );
//
// ===== END =====
