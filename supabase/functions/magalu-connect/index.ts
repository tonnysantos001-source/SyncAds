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

    const body = await req.json();
    const { sellerId, apiKey } = body;

    if (!sellerId || !apiKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "sellerId, apiKey are required",
        }),
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

    // Test API credentials
    const testUrl = `https://api.magazineluiza.com.br/marketplace/v1/test`;
    const testResponse = await fetch(testUrl, {
      headers: {
        "Authorization": "REPLACE_WITH_AUTH_HEADER",
        "Content-Type": "application/json",
      },
    });

    if (!testResponse.ok && testResponse.status !== 404) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid Magazine Luiza credentials",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const integrationId = `${user.id}-${sellerId}`;

    const { data: existingIntegration } = await supabase
      .from("MagaluIntegration")
      .select("*")
      .eq("userId", user.id)
      .eq("sellerId", sellerId)
      .single();

    if (existingIntegration) {
      const { error: updateError } = await supabase
        .from("MagaluIntegration")
        .update({
          sellerId,
          apiKey,
          isActive: true,
          metadata: {},
          updatedAt: new Date().toISOString(),
        })
        .eq("id", existingIntegration.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Magazine Luiza integration updated successfully",
          integrationId: existingIntegration.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const { error: insertError } = await supabase
        .from("MagaluIntegration")
        .insert({
          id: integrationId,
          userId: user.id,
          sellerId,
          apiKey,
          isActive: true,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Magazine Luiza integration connected successfully",
          integrationId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Magazine Luiza connect error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
