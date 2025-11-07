import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { code, codeVerifier } = await req.json();
    const authHeader = req.headers.get("Authorization");
    const { data: { user } } = await supabase.auth.getUser(authHeader!.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ success: false }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    
    const clientId = Deno.env.get("TWITTER_CLIENT_ID");
    const clientSecret = Deno.env.get("TWITTER_CLIENT_SECRET");
    const tokenResponse = await fetch("https://api.twitter.com/2/oauth2/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: `Basic ${btoa(clientId + ":" + clientSecret)}` },
      body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: "https://syncads.app/integrations", code_verifier: codeVerifier })
    });
    const tokenData = await tokenResponse.json();
    
    const integrationId = `${user.id}-twitter`;
    await supabase.from("TwitterIntegration").upsert({ id: integrationId, userId: user.id, accessToken: tokenData.access_token, refreshToken: tokenData.refresh_token, tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(), isActive: true, updatedAt: new Date().toISOString() }, { onConflict: "userId" });
    
    return new Response(JSON.stringify({ success: true, integrationId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
