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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { integrationId, action = "sync-all" } = await req.json();

    const { data: integration } = await supabase
      .from("WooCommerceIntegration")
      .select("*")
      .eq("id", integrationId)
      .eq("isActive", true)
      .single();

    if (!integration) {
      return new Response(
        JSON.stringify({ success: false, error: "Integration not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const auth = btoa(`${integration.consumerKey}:${integration.consumerSecret}`);
    const baseUrl = integration.siteUrl;

    const { data: syncLog } = await supabase
      .from("WooCommerceSyncLog")
      .insert({
        id: crypto.randomUUID(),
        userId: integration.userId,
        integrationId: integration.id,
        syncType: action,
        status: "started",
      })
      .select()
      .single();

    const results: any = {};

    // Sync products
    if (action === "sync-all" || action === "sync-products") {
      const productsUrl = `${baseUrl}/wp-json/wc/v3/products?per_page=100`;
      const response = await fetch(productsUrl, {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const products = await response.json();
        
        if (products.length > 0) {
          const productsToInsert = products.map((p: any) => ({
            id: `woo-${integration.id}-${p.id}`,
            userId: integration.userId,
            integrationId: integration.id,
            productId: String(p.id),
            name: p.name,
            description: p.description,
            slug: p.slug,
            status: p.status,
            price: parseFloat(p.price || 0),
            regularPrice: parseFloat(p.regular_price || 0),
            salePrice: p.sale_price ? parseFloat(p.sale_price) : null,
            wooData: p,
            lastSyncAt: new Date().toISOString(),
          }));

          await supabase.from("WooCommerceProduct").upsert(productsToInsert, { onConflict: "id" });
        }

        results.products = { count: products.length };
      }
    }

    // Sync orders
    if (action === "sync-all" || action === "sync-orders") {
      const ordersUrl = `${baseUrl}/wp-json/wc/v3/orders?per_page=100`;
      const response = await fetch(ordersUrl, {
        headers: {
          "Authorization": `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const orders = await response.json();
        
        if (orders.length > 0) {
          const ordersToInsert = orders.map((o: any) => ({
            id: `woo-${integration.id}-${o.id}`,
            userId: integration.userId,
            integrationId: integration.id,
            orderId: String(o.id),
            orderNumber: String(o.number),
            status: o.status,
            total: parseFloat(o.total || 0),
            currency: o.currency || "USD",
            customerEmail: o.billing?.email,
            customerName: `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim(),
            wooData: o,
            lastSyncAt: new Date().toISOString(),
          }));

          await supabase.from("WooCommerceOrder").upsert(ordersToInsert, { onConflict: "id" });
        }

        results.orders = { count: orders.length };
      }
    }

    await supabase.from("WooCommerceSyncLog").update({
      status: "completed",
      completedAt: new Date().toISOString(),
      details: results,
    }).eq("id", syncLog.id);

    await supabase.from("WooCommerceIntegration").update({
      lastSyncAt: new Date().toISOString(),
      lastSyncStatus: "success",
    }).eq("id", integration.id);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
