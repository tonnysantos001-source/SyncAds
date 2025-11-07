import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"};
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { integrationId } = await req.json();
    const { data: integration } = await supabase.from("TaboolaIntegration").select("*").eq("id", integrationId).single();
    if (!integration) return new Response(JSON.stringify({ success: false }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const { data: syncLog } = await supabase.from("TaboolaSyncLog").insert({ id: crypto.randomUUID(), userId: integration.userId, integrationId: integration.id, syncType: "sync-all", status: "started", startedAt: new Date().toISOString() }).select().single();
    const campaigns:any[]=[];const url=`https://backstage.taboola.com/backstage/api/1.0/${integration.accountId}/campaigns/?access_token=${integration.accessToken}`;const response=await fetch(url);if(response.ok){const data=await response.json();const list=data.results||[];if(list.length>0){const toInsert=list.map((c:any)=>({id:`taboola-${integration.id}-${c.id}`,userId:integration.userId,integrationId:integration.id,campaignId:String(c.id),name:c.name,status:c.status,budget:parseFloat(c.spending_limit||0),cpc:parseFloat(c.cpc||0),taboolaData:c,lastSyncAt:new Date().toISOString()}));await supabase.from("TaboolaCampaign").upsert(toInsert,{onConflict:"id"});campaigns.push(...list);}}
    await supabase.from("TaboolaSyncLog").update({ status: "completed", completedAt: new Date().toISOString(), details: { count: campaigns.length } }).eq("id", syncLog.id);
    await supabase.from("TaboolaIntegration").update({ lastSyncAt: new Date().toISOString(), lastSyncStatus: "success" }).eq("id", integration.id);
    return new Response(JSON.stringify({ success: true, count: campaigns.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
