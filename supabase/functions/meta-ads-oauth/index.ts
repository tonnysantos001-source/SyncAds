import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const META_APP_ID = Deno.env.get("META_APP_ID");
const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
const REDIRECT_URI = Deno.env.get("META_REDIRECT_URI");

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

    if (action === "start") {
      const state = crypto.randomUUID();
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${REDIRECT_URI}&state=${state}&scope=ads_management,ads_read,business_management`;
      
      return new Response(
        JSON.stringify({ success: true, authUrl, state }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "callback") {
      const code = url.searchParams.get("code");
      const authHeader = req.headers.get("Authorization");
      const token = authHeader?.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token!);

      if (!user || !code) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid request" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const tokenResponse = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&code=${code}&redirect_uri=${REDIRECT_URI}`
      );

      const tokenData = await tokenResponse.json();

      // Get ad accounts
      const adAccountsResponse = await fetch(
        `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${tokenData.access_token}`
      );

      const adAccounts = await adAccountsResponse.json();
      const adAccountId = adAccounts.data?.[0]?.id || "unknown";

      const integrationId = `${user.id}-${adAccountId}`;

      await supabase.from("MetaAdsIntegration").upsert({
        id: integrationId,
        userId: user.id,
        adAccountId,
        accessToken: tokenData.access_token,
        isActive: true,
        metadata: { adAccounts: adAccounts.data },
        updatedAt: new Date().toISOString(),
      }, { onConflict: "userId,adAccountId" });

      return new Response(
        JSON.stringify({ success: true }),
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
