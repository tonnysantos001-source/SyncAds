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
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    const device_id = pathParts[pathParts.length - 1];

    if (!device_id || device_id === "extension-commands") {
      return new Response(
        JSON.stringify({ error: "Bad Request", message: "device_id is required in URL" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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

    // Use service role for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify device belongs to user
    const { data: device } = await supabaseAdmin
      .from("extension_devices")
      .select("*")
      .eq("device_id", device_id)
      .eq("user_id", user.id)
      .single();

    if (!device) {
      return new Response(
        JSON.stringify({ error: "Not Found", message: "Device not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update device last_seen
    await supabaseAdmin
      .from("extension_devices")
      .update({
        last_seen: new Date().toISOString(),
        status: "online",
      })
      .eq("device_id", device_id);

    if (req.method === "GET") {
      // Get pending commands
      const { data: commands, error } = await supabaseAdmin
        .from("extension_commands")
        .select("*")
        .eq("device_id", device_id)
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(10);

      if (error) throw error;

      return new Response(
        JSON.stringify({
          success: true,
          commands: commands || [],
          count: commands?.length || 0,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (req.method === "POST") {
      // Update command status or create new command
      const body = await req.json();
      const { command_id, status, result } = body;

      if (command_id) {
        // Update existing command
        const { data, error } = await supabaseAdmin
          .from("extension_commands")
          .update({
            status: status || "completed",
            result,
            executed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", command_id)
          .eq("device_id", device_id)
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            command: data,
            message: "Command updated",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else {
        // Create new command
        const { type, data: commandData } = body;

        if (!type) {
          return new Response(
            JSON.stringify({ error: "Bad Request", message: "type is required" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        const { data, error } = await supabaseAdmin
          .from("extension_commands")
          .insert({
            device_id,
            user_id: user.id,
            type,
            data: commandData || {},
            status: "pending",
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            command: data,
            message: "Command created",
          }),
          {
            status: 201,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Method Not Allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error in extension-commands:", error);
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
