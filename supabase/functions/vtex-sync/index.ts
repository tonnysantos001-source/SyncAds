import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { integrationId, action = "sync-all" } = await req.json();

    if (!integrationId) {
      return new Response(
        JSON.stringify({ success: false, error: "integrationId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from("VtexIntegration")
      .select("*")
      .eq("id", integrationId)
      .eq("isActive", true)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ success: false, error: "Integration not found or inactive" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accountName = integration.accountName;
    const environment = integration.environment || "vtexcommercestable";
    const appKey = integration.appKey;
    const appToken = integration.appToken;

    // Create sync log
    const { data: syncLog } = await supabase
      .from("VtexSyncLog")
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

    try {
      // Sync products
      if (action === "sync-all" || action === "sync-products") {
        const productsResult = await syncProducts(supabase, integration, accountName, environment, appKey, appToken);
        results.products = productsResult;
        if (!productsResult.success) hasError = true;
      }

      // Sync orders
      if (action === "sync-all" || action === "sync-orders") {
        const ordersResult = await syncOrders(supabase, integration, accountName, environment, appKey, appToken);
        results.orders = ordersResult;
        if (!ordersResult.success) hasError = true;
      }

      // Update sync log
      await supabase
        .from("VtexSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          details: results,
        })
        .eq("id", syncLog.id);

      // Update integration
      await supabase
        .from("VtexIntegration")
        .update({
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: hasError ? "error" : "success",
        })
        .eq("id", integration.id);

      return new Response(
        JSON.stringify({ success: !hasError, results, syncLogId: syncLog.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error: any) {
      // Update sync log with error
      await supabase
        .from("VtexSyncLog")
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
    console.error("VTEX sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function syncProducts(supabase: any, integration: any, accountName: string, environment: string, appKey: string, appToken: string) {
  try {
    const products: any[] = [];

    // Step 1: Get all product and SKU IDs
    const idsUrl = `https://${accountName}.${environment}.com.br/api/catalog_system/pvt/products/GetProductAndSkuIds`;

    const idsResponse = await fetch(idsUrl, {
      headers: {
        "X-VTEX-API-AppKey": appKey,
        "X-VTEX-API-AppToken": appToken,
        "Content-Type": "application/json",
      },
    });

    if (!idsResponse.ok) {
      throw new Error(`VTEX API error: ${idsResponse.status}`);
    }

    const productIds = await idsResponse.json();

    // Step 2: Fetch details for each product (limit to 100 for performance)
    const productIdsToFetch = Object.keys(productIds).slice(0, 100);

    for (const productId of productIdsToFetch) {
      try {
        const productUrl = `https://${accountName}.${environment}.com.br/api/catalog/pvt/product/${productId}`;

        const productResponse = await fetch(productUrl, {
          headers: {
            "X-VTEX-API-AppKey": appKey,
            "X-VTEX-API-AppToken": appToken,
            "Content-Type": "application/json",
          },
        });

        if (productResponse.ok) {
          const product = await productResponse.json();
          products.push(product);
        }

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching product ${productId}:`, error);
      }
    }

    // Bulk insert/update products
    if (products.length > 0) {
      const productsToInsert = products.map((p) => ({
        id: `vtex-${integration.id}-${p.Id}`,
        userId: integration.userId,
        integrationId: integration.id,
        productId: String(p.Id),
        name: p.Name || p.Title || "Unnamed Product",
        description: p.Description || null,
        brandId: p.BrandId ? String(p.BrandId) : null,
        brandName: p.BrandName || null,
        categoryId: p.CategoryId ? String(p.CategoryId) : null,
        categoryName: p.CategoryName || null,
        linkId: p.LinkId || null,
        isActive: p.IsActive !== false,
        vtexData: p,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("VtexProduct")
        .upsert(productsToInsert, { onConflict: "id" });

      if (error) throw error;
    }

    return { success: true, count: products.length, synced: products.length };
  } catch (error: any) {
    console.error("Error syncing VTEX products:", error);
    return { success: false, count: 0, error: error.message };
  }
}

async function syncOrders(supabase: any, integration: any, accountName: string, environment: string, appKey: string, appToken: string) {
  try {
    const orders: any[] = [];

    // Get orders from last 30 days
    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    // VTEX orders pagination
    let page = 1;
    const perPage = 50;
    let hasMore = true;

    while (hasMore && page <= 5) { // Limit to 5 pages (250 orders)
      const ordersUrl = `https://${accountName}.${environment}.com.br/api/oms/pvt/orders?f_creationDate=creationDate:[${startDate} TO ${endDate}]&page=${page}&per_page=${perPage}`;

      const ordersResponse = await fetch(ordersUrl, {
        headers: {
          "X-VTEX-API-AppKey": appKey,
          "X-VTEX-API-AppToken": appToken,
          "Content-Type": "application/json",
        },
      });

      if (!ordersResponse.ok) {
        throw new Error(`VTEX API error: ${ordersResponse.status}`);
      }

      const ordersList = await ordersResponse.json();

      if (ordersList.list && ordersList.list.length > 0) {
        // Fetch detailed info for each order
        for (const orderSummary of ordersList.list) {
          try {
            const orderDetailUrl = `https://${accountName}.${environment}.com.br/api/oms/pvt/orders/${orderSummary.orderId}`;

            const orderDetailResponse = await fetch(orderDetailUrl, {
              headers: {
                "X-VTEX-API-AppKey": appKey,
                "X-VTEX-API-AppToken": appToken,
                "Content-Type": "application/json",
              },
            });

            if (orderDetailResponse.ok) {
              const orderDetail = await orderDetailResponse.json();
              orders.push(orderDetail);
            }

            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`Error fetching order ${orderSummary.orderId}:`, error);
          }
        }

        hasMore = ordersList.list.length === perPage;
        page++;
      } else {
        hasMore = false;
      }
    }

    if (orders.length > 0) {
      const ordersToInsert = orders.map((o) => ({
        id: `vtex-${integration.id}-${o.orderId}`,
        userId: integration.userId,
        integrationId: integration.id,
        orderId: o.orderId,
        sequence: o.sequence || null,
        status: o.status || "unknown",
        value: o.value ? parseFloat(o.value) / 100 : 0, // VTEX stores in cents
        currency: o.storePreferencesData?.currencyCode || "BRL",
        clientEmail: o.clientProfileData?.email || null,
        clientName: o.clientProfileData?.firstName && o.clientProfileData?.lastName
          ? `${o.clientProfileData.firstName} ${o.clientProfileData.lastName}`
          : o.clientProfileData?.firstName || null,
        vtexData: o,
        createdAt: o.creationDate || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("VtexOrder")
        .upsert(ordersToInsert, { onConflict: "id" });

      if (error) throw error;
    }

    return { success: true, count: orders.length, synced: orders.length };
  } catch (error: any) {
    console.error("Error syncing VTEX orders:", error);
    return { success: false, count: 0, error: error.message };
  }
}
