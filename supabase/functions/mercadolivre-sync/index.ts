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

    const { integrationId, action = "sync-products" } = await req.json();

    const { data: integration } = await supabase
      .from("MercadoLivreIntegration")
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

    const results: any = {};

    // Sync products
    if (action === "sync-products") {
      const response = await fetch(
        `https://api.mercadolibre.com/users/${integration.sellerId}/items/search?limit=50`,
        {
          headers: { "Authorization": `Bearer ${integration.accessToken}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const productIds = data.results || [];

        const products = [];
        for (const itemId of productIds.slice(0, 50)) {
          const itemResponse = await fetch(
            `https://api.mercadolibre.com/items/${itemId}`,
            {
              headers: { "Authorization": `Bearer ${integration.accessToken}` },
            }
          );

          if (itemResponse.ok) {
            const item = await itemResponse.json();
            products.push(item);
          }

          await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (products.length > 0) {
          const productsToInsert = products.map((p: any) => ({
            id: `ml-${integration.id}-${p.id}`,
            userId: integration.userId,
            integrationId: integration.id,
            mlId: p.id,
            title: p.title,
            status: p.status,
            price: parseFloat(p.price || 0),
            availableQuantity: p.available_quantity || 0,
            mlData: p,
            lastSyncAt: new Date().toISOString(),
          }));

          await supabase.from("MercadoLivreProduct").upsert(productsToInsert, { onConflict: "id" });
        }

        results.products = { count: products.length };
      }
    }

    await supabase.from("MercadoLivreIntegration").update({
      lastSyncAt: new Date().toISOString(),
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
