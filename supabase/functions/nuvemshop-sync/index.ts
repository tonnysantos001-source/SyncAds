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
      .from("NuvemshopIntegration")
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

    const { data: syncLog } = await supabase
      .from("NuvemshopSyncLog")
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
      const productsUrl = `https://api.nuvemshop.com.br/v1/${integration.storeId}/products`;
      const response = await fetch(productsUrl, {
        headers: {
          "Authentication": `bearer ${integration.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const products = await response.json();
        
        if (products.length > 0) {
          const productsToInsert = products.map((p: any) => ({
            id: `nuvemshop-${integration.id}-${p.id}`,
            userId: integration.userId,
            integrationId: integration.id,
            productId: String(p.id),
            name: p.name?.pt || p.name?.es || "Product",
            description: p.description?.pt || p.description?.es,
            handle: p.handle,
            published: p.published,
            freeShipping: p.free_shipping || false,
            nuvemshopData: p,
            lastSyncAt: new Date().toISOString(),
          }));

          await supabase.from("NuvemshopProduct").upsert(productsToInsert, { onConflict: "id" });
        }

        results.products = { count: products.length };
      }
    }

    // Sync orders
    if (action === "sync-all" || action === "sync-orders") {
      const ordersUrl = `https://api.nuvemshop.com.br/v1/${integration.storeId}/orders`;
      const response = await fetch(ordersUrl, {
        headers: {
          "Authentication": `bearer ${integration.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const orders = await response.json();
        
        if (orders.length > 0) {
          const ordersToInsert = orders.map((o: any) => ({
            id: `nuvemshop-${integration.id}-${o.id}`,
            userId: integration.userId,
            integrationId: integration.id,
            orderId: String(o.id),
            number: o.number,
            status: o.payment_status || o.fulfillment_status,
            total: parseFloat(o.total || 0),
            currency: o.currency || "BRL",
            customerEmail: o.customer?.email,
            customerName: o.customer?.name,
            nuvemshopData: o,
            lastSyncAt: new Date().toISOString(),
          }));

          await supabase.from("NuvemshopOrder").upsert(ordersToInsert, { onConflict: "id" });
        }

        results.orders = { count: orders.length };
      }
    }

    await supabase.from("NuvemshopSyncLog").update({
      status: "completed",
      completedAt: new Date().toISOString(),
      details: results,
    }).eq("id", syncLog.id);

    await supabase.from("NuvemshopIntegration").update({
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
