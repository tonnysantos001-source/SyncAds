import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const corsHeaders = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"};
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { integrationId } = await req.json();
    const { data: integration } = await supabase.from("MinhasEconomiasIntegration").select("*").eq("id", integrationId).single();
    if (!integration) return new Response(JSON.stringify({ success: false }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    const cashbacks:any[]=[];const url=`https://api.minhaseconomias.com.br/v1/cashbacks?publisher_id=${integration.publisherId}&api_key=${integration.apiKey}`;const response=await fetch(url);if(response.ok){const data=await response.json();const list=data.cashbacks||[];if(list.length>0){const toInsert=list.map((c:any)=>({id:`me-${integration.id}-${c.id}`,userId:integration.userId,integrationId:integration.id,cashbackId:String(c.id),storeName:c.store_name,amount:parseFloat(c.amount||0),status:c.status,cashbackData:c,lastSyncAt:new Date().toISOString()}));await supabase.from("MinhasEconomiasCashback").upsert(toInsert,{onConflict:"id"});cashbacks.push(...list);}}
    await supabase.from("MinhasEconomiasIntegration").update({ lastSyncAt: new Date().toISOString(), lastSyncStatus: "success" }).eq("id", integration.id);
    return new Response(JSON.stringify({ success: true, count: cashbacks.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
