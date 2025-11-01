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

    const { storeId, storeName, accessToken } = await req.json();

    if (!storeId || !accessToken) {
      return new Response(
        JSON.stringify({ success: false, error: "storeId and accessToken are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Test Nuvemshop API
    const testUrl = `https://api.nuvemshop.com.br/v1/${storeId}/products?limit=1`;
    const testResponse = await fetch(testUrl, {
      headers: {
        "Authentication": `bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!testResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid Nuvemshop credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const integrationId = `${user.id}-${storeId}`;

    const { error: upsertError } = await supabase
      .from("NuvemshopIntegration")
      .upsert({
        id: integrationId,
        userId: user.id,
        storeId,
        storeName: storeName || storeId,
        accessToken,
        isActive: true,
        updatedAt: new Date().toISOString(),
      }, { onConflict: "userId,storeId" });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({ success: true, integrationId, message: "Nuvemshop connected successfully" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Nuvemshop connect error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
