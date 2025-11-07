import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      integrationId,
      action = "sync-all",
      limit = 100,
    } = await req.json();

    if (!integrationId) {
      return new Response(
        JSON.stringify({ success: false, error: "integrationId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: integration, error: integrationError } = await supabase
      .from("TrayIntegration")
      .select("*")
      .eq("id", integrationId)
      .eq("isActive", true)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Integration not found or inactive",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: syncLog } = await supabase
      .from("TraySyncLog")
      .insert({
        id: crypto.randomUUID(),
        userId: integration.userId,
        integrationId: integration.id,
        syncType: action,
        status: "started",
        startedAt: new Date().toISOString(),
      })
      .select()
      .single();

    const results: any = {};
    let hasError = false;
    let errorMessage = "";

    try {
      // Sync products
      if (action === "sync-all" || action === "sync-products") {
        const productsResult = await syncProducts(supabase, integration, limit);
        results.products = productsResult;
        if (!productsResult.success) {
          hasError = true;
          errorMessage = productsResult.error || "Failed to sync products";
        }
      }

      // Sync orders
      if (action === "sync-all" || action === "sync-orders") {
        const ordersResult = await syncOrders(supabase, integration, limit);
        results.orders = ordersResult;
        if (!ordersResult.success) {
          hasError = true;
          errorMessage = ordersResult.error || "Failed to sync orders";
        }
      }

      await supabase
        .from("TraySyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("TrayIntegration")
        .update({
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: hasError ? "error" : "success",
        })
        .eq("id", integration.id);

      return new Response(
        JSON.stringify({ success: !hasError, results, syncLogId: syncLog.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (error: any) {
      await supabase
        .from("TraySyncLog")
        .update({
          status: "failed",
          completedAt: new Date().toISOString(),
          errorMessage: error.message,
          details: results,
        })
        .eq("id", syncLog.id);

      throw error;
    }
  } catch (error: any) {
    console.error("Tray sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncProducts(supabase: any, integration: any, limit: number) {
  try {
    const products: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && products.length < limit) {
      const url = `https://${integration.storeId}.commercesuite.com.br/web_api/products?page=${page}&limit=50`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${integration.apiKey}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `API error: ${response.status}`,
          count: 0,
        };
      }

      const data = await response.json();
      const pageProducts = data.Products || [];

      if (pageProducts.length === 0) {
        hasMore = false;
      } else {
        products.push(...pageProducts);
        page++;

        if (pageProducts.length < 50) {
          hasMore = false;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (products.length > 0) {
      const productsToInsert = products.map((p: any) => ({
        id: `tray-${integration.id}-${p.Product.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        productId: String(p.Product.id),
        name: p.Product.name,
        description: p.Product.description || "",
        sku: p.Product.reference || "",
        price: parseFloat(p.Product.price || 0),
        promotionalPrice: p.Product.promotional_price
          ? parseFloat(p.Product.promotional_price)
          : null,
        stock: parseInt(p.Product.stock || 0),
        available: p.Product.available === "1",
        trayData: p.Product,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("TrayProduct")
        .upsert(productsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: products.length, synced: products.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncOrders(supabase: any, integration: any, limit: number) {
  try {
    const orders: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && orders.length < limit) {
      const url = `https://${integration.storeId}.commercesuite.com.br/web_api/orders?page=${page}&limit=50`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${integration.apiKey}`,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `API error: ${response.status}`,
          count: 0,
        };
      }

      const data = await response.json();
      const pageOrders = data.Orders || [];

      if (pageOrders.length === 0) {
        hasMore = false;
      } else {
        orders.push(...pageOrders);
        page++;

        if (pageOrders.length < 50) {
          hasMore = false;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (orders.length > 0) {
      const ordersToInsert = orders.map((o: any) => ({
        id: `tray-${integration.id}-${o.Order.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        orderId: String(o.Order.id),
        orderNumber: String(o.Order.id),
        status: o.Order.status_id || "",
        total: parseFloat(o.Order.total || 0),
        subtotal: parseFloat(o.Order.subtotal || 0),
        discount: parseFloat(o.Order.discount || 0),
        shipping: parseFloat(o.Order.shipping || 0),
        customerEmail: o.Order.customer?.email || "",
        customerName: o.Order.customer?.name || "",
        paymentMethod: o.Order.payment?.payment_method_name || "",
        trayData: o.Order,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("TrayOrder")
        .upsert(ordersToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: orders.length, synced: orders.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}
