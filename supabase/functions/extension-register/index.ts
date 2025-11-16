import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user authentication
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "Invalid token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request body
    const body = await req.json();
    const { device_id, browser_info, version } = body;

    if (!device_id) {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "device_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Use service role client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if device already exists
    const { data: existingDevice } = await supabaseAdmin
      .from("extension_devices")
      .select("*")
      .eq("device_id", device_id)
      .eq("user_id", user.id)
      .single();

    let result;

    if (existingDevice) {
      // Update existing device
      const { data, error } = await supabaseAdmin
        .from("extension_devices")
        .update({
          browser_info,
          version,
          status: "online",
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("device_id", device_id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new device
      const { data, error } = await supabaseAdmin
        .from("extension_devices")
        .insert({
          device_id,
          user_id: user.id,
          browser_info,
          version,
          status: "online",
          last_seen: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    // Log registration
    await supabaseAdmin.from("extension_logs").insert({
      device_id,
      user_id: user.id,
      level: "info",
      message: "Device registered successfully",
      data: { browser_info, version },
    });

    return new Response(
      JSON.stringify({
        success: true,
        device: result,
        message: existingDevice ? "Device updated" : "Device registered",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in extension-register:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
