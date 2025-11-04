import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

interface OrderCleanupResult {
  cancelled: number;
  errors: number;
  details: Array<{
    orderId: string;
    orderNumber: string;
    status: "cancelled" | "error";
    reason?: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Calculate cutoff time (30 minutes ago)
    const cutoffTime = new Date(Date.now() - 30 * 60 * 1000);

    console.log(
      `[Cleanup] Starting cleanup for orders older than ${cutoffTime.toISOString()}`,
    );

    // Find pending orders older than 30 minutes
    const { data: pendingOrders, error: fetchError } = await supabaseClient
      .from("Order")
      .select("id, orderNumber, userId, createdAt")
      .eq("paymentStatus", "PENDING")
      .lt("createdAt", cutoffTime.toISOString())
      .limit(100); // Process in batches

    if (fetchError) {
      console.error("[Cleanup] Error fetching orders:", fetchError);
      throw fetchError;
    }

    if (!pendingOrders || pendingOrders.length === 0) {
      console.log("[Cleanup] No orders to clean up");
      return new Response(
        JSON.stringify({
          success: true,
          cancelled: 0,
          errors: 0,
          details: [],
          message: "No pending orders found requiring cleanup",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    console.log(`[Cleanup] Found ${pendingOrders.length} orders to cancel`);

    const result: OrderCleanupResult = {
      cancelled: 0,
      errors: 0,
      details: [],
    };

    // Cancel each order
    for (const order of pendingOrders) {
      try {
        // Update order status
        const { error: updateError } = await supabaseClient
          .from("Order")
          .update({
            paymentStatus: "FAILED",
            status: "CANCELLED",
            updatedAt: new Date().toISOString(),
            notes:
              "Automatically cancelled due to payment timeout (30 minutes)",
          })
          .eq("id", order.id);

        if (updateError) {
          console.error(
            `[Cleanup] Error updating order ${order.orderNumber}:`,
            updateError,
          );
          result.errors++;
          result.details.push({
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: "error",
            reason: updateError.message,
          });
          continue;
        }

        // Add to order history
        const { error: historyError } = await supabaseClient
          .from("OrderHistory")
          .insert({
            orderId: order.id,
            userId: order.userId,
            action: "ORDER_AUTO_CANCELLED",
            fromStatus: "PENDING",
            toStatus: "CANCELLED",
            notes:
              "Order automatically cancelled after 30 minutes of inactivity",
            metadata: {
              cancelledBy: "system",
              reason: "payment_timeout",
              cancelledAt: new Date().toISOString(),
              originalCreatedAt: order.createdAt,
            },
          });

        if (historyError) {
          console.warn(
            `[Cleanup] Failed to add history for order ${order.orderNumber}:`,
            historyError,
          );
          // Don't count as error since order was cancelled
        }

        result.cancelled++;
        result.details.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: "cancelled",
        });

        console.log(
          `[Cleanup] Successfully cancelled order ${order.orderNumber}`,
        );
      } catch (error) {
        console.error(
          `[Cleanup] Exception cancelling order ${order.orderNumber}:`,
          error,
        );
        result.errors++;
        result.details.push({
          orderId: order.id,
          orderNumber: order.orderNumber,
          status: "error",
          reason: error.message,
        });
      }
    }

    console.log(
      `[Cleanup] Cleanup complete: ${result.cancelled} cancelled, ${result.errors} errors`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        cancelled: result.cancelled,
        errors: result.errors,
        total: pendingOrders.length,
        details: result.details,
        message: `Cleanup completed: ${result.cancelled} orders cancelled, ${result.errors} errors`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("[Cleanup] Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        cancelled: 0,
        errors: 1,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      },
    );
  }
});
