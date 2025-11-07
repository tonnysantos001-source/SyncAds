import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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
    const { code, redirectUri } = body;

    if (!code) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Authorization code is required",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      token,
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid user token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get OAuth credentials from environment
    const clientId = Deno.env.get("CALENDLY_CLIENT_ID");
    const clientSecret = Deno.env.get("CALENDLY_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Calendly OAuth credentials not configured",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Exchange code for access token
    const tokenUrl = "https://auth.calendly.com/oauth/token";
    const tokenResponse = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri || "https://syncads.app/integrations",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      return new Response(
        JSON.stringify({
          success: false,
          error: `Failed to exchange code: ${errorData}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    // Get user info from Calendly
    const userInfoResponse = await fetch("https://api.calendly.com/users/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!userInfoResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to fetch Calendly user info",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userInfo = await userInfoResponse.json();
    const calendlyUser = userInfo.resource;

    const integrationId = `${user.id}-calendly`;
    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    const { data: existingIntegration } = await supabase
      .from("CalendlyIntegration")
      .select("*")
      .eq("userId", user.id)
      .single();

    if (existingIntegration) {
      const { error: updateError } = await supabase
        .from("CalendlyIntegration")
        .update({
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiresAt: expiresAt,
          calendlyUserId: calendlyUser.uri.split("/").pop(),
          email: calendlyUser.email,
          name: calendlyUser.name,
          timezone: calendlyUser.timezone,
          schedulingUrl: calendlyUser.scheduling_url,
          isActive: true,
          metadata: calendlyUser,
          updatedAt: new Date().toISOString(),
        })
        .eq("id", existingIntegration.id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Calendly integration updated successfully",
          integrationId: existingIntegration.id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } else {
      const { error: insertError } = await supabase
        .from("CalendlyIntegration")
        .insert({
          id: integrationId,
          userId: user.id,
          accessToken: access_token,
          refreshToken: refresh_token,
          tokenExpiresAt: expiresAt,
          calendlyUserId: calendlyUser.uri.split("/").pop(),
          email: calendlyUser.email,
          name: calendlyUser.name,
          timezone: calendlyUser.timezone,
          schedulingUrl: calendlyUser.scheduling_url,
          isActive: true,
          metadata: calendlyUser,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Calendly integration connected successfully",
          integrationId,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
  } catch (error: any) {
    console.error("Calendly connect error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
