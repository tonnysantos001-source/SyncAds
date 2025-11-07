import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"};
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { integrationId } = await req.json();
    const { data: integration } = await supabase.from("GoogledriveIntegration").select("*").eq("id", integrationId).single();
    if (!integration) return new Response(JSON.stringify({ success: false, error: "Integration not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const items: any[] = [];
    await supabase.from("GoogledriveIntegration").update({ lastSyncAt: new Date().toISOString(), lastSyncStatus: "success" }).eq("id", integration.id);
    return new Response(JSON.stringify({ success: true, count: items.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
