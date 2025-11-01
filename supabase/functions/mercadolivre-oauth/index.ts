import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ML_CLIENT_ID = Deno.env.get("MERCADOLIVRE_CLIENT_ID");
const ML_CLIENT_SECRET = Deno.env.get("MERCADOLIVRE_CLIENT_SECRET");
const REDIRECT_URI = Deno.env.get("MERCADOLIVRE_REDIRECT_URI");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Start OAuth flow
    if (action === "start") {
      const state = crypto.randomUUID();
      const authUrl = `https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=${ML_CLIENT_ID}&redirect_uri=${REDIRECT_URI}&state=${state}`;
      
      return new Response(
        JSON.stringify({ success: true, authUrl, state }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle OAuth callback
    if (action === "callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response(
          JSON.stringify({ success: false, error: "No code provided" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token!);

      if (!user) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid user" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Exchange code for token
      const tokenResponse = await fetch("https://api.mercadolibre.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          client_id: ML_CLIENT_ID!,
          client_secret: ML_CLIENT_SECRET!,
          code,
          redirect_uri: REDIRECT_URI!,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const tokenData = await tokenResponse.json();

      // Get user info
      const userResponse = await fetch(`https://api.mercadolibre.com/users/me`, {
        headers: { "Authorization": `Bearer ${tokenData.access_token}` },
      });

      const userData = await userResponse.json();

      const integrationId = `${user.id}-${userData.id}`;

      await supabase.from("MercadoLivreIntegration").upsert({
        id: integrationId,
        userId: user.id,
        sellerId: String(userData.id),
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        isActive: true,
        metadata: { userData },
        updatedAt: new Date().toISOString(),
      }, { onConflict: "userId,sellerId" });

      return new Response(
        JSON.stringify({ success: true, message: "Mercado Livre connected" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
