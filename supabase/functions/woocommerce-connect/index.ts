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

    const { siteUrl, consumerKey, consumerSecret } = await req.json();

    if (!siteUrl || !consumerKey || !consumerSecret) {
      return new Response(
        JSON.stringify({ success: false, error: "siteUrl, consumerKey and consumerSecret are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token!);

    if (!user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test WooCommerce API
    const cleanUrl = siteUrl.replace(/\/$/, "");
    const testUrl = `${cleanUrl}/wp-json/wc/v3/products?per_page=1`;
    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    
    const testResponse = await fetch(testUrl, {
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    if (!testResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid WooCommerce credentials or site URL" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const integrationId = `${user.id}-${btoa(siteUrl).slice(0, 20)}`;

    const { error: upsertError } = await supabase
      .from("WooCommerceIntegration")
      .upsert({
        id: integrationId,
        userId: user.id,
        siteUrl: cleanUrl,
        consumerKey,
        consumerSecret,
        isActive: true,
        updatedAt: new Date().toISOString(),
      }, { onConflict: "userId,siteUrl" });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ success: true, integrationId, message: "WooCommerce connected successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
