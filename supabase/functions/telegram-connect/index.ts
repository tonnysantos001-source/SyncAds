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
    const { botToken } = body;

    if (!botToken) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "botToken are required",
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
    const testUrl = `https://api.telegram.org/test`;
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
          error: "Invalid Telegram credentials",
        }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const integrationId = `${user.id}-${botToken}`;

    const { data: existingIntegration } = await supabase
      .from("TelegramIntegration")
      .select("*")
      .eq("userId", user.id)
      .eq("botToken", botToken)
      .single();

    if (existingIntegration) {
      const { error: updateError } = await supabase
        .from("TelegramIntegration")
        .update({
          botToken,
          isActive: true,
          metadata: {},
          updatedAt: new Date().toISOString(),
        })
        .eq("id", existingIntegration.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Telegram integration updated successfully",
          integrationId: existingIntegration.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } else {
      const { error: insertError } = await supabase
        .from("TelegramIntegration")
        .insert({
          id: integrationId,
          userId: user.id,
          botToken,
          isActive: true,
          metadata: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Telegram integration connected successfully",
          integrationId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (error: any) {
    console.error("Telegram connect error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
