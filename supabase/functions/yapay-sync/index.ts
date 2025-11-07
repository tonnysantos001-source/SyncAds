import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { integrationId, limit = 100 } = await req.json();
    const { data: integration } = await supabase.from("YapayIntegration").select("*").eq("id", integrationId).eq("isActive", true).single();
    if (!integration) return new Response(JSON.stringify({ success: false, error: "Integration not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    
    const { data: syncLog } = await supabase.from("YapaySyncLog").insert({ id: crypto.randomUUID(), userId: integration.userId, integrationId: integration.id, syncType: "sync-all", status: "started", startedAt: new Date().toISOString() }).select().single();
    
    const transactions: any[] = [];
    const url = `https://api.intermediador.yapay.com.br/api/v3/transactions?token_account=${integration.apiToken}`;
    const response = await fetch(url);
    if (response.ok) {
      const data = await response.json();
      const txs = data.data_response?.transactions || [];
      if (txs.length > 0) {
        const toInsert = txs.map((t: any) => ({ id: `yapay-${integration.id}-${t.transaction_token}`, userId: integration.userId, integrationId: integration.id, transactionToken: t.transaction_token, status: t.status_name, amount: parseFloat(t.price || 0), yapayData: t, lastSyncAt: new Date().toISOString() }));
        await supabase.from("YapayTransaction").upsert(toInsert, { onConflict: "id" });
      }
      transactions.push(...txs);
    }
    
    await supabase.from("YapaySyncLog").update({ status: "completed", completedAt: new Date().toISOString(), details: { count: transactions.length } }).eq("id", syncLog.id);
    await supabase.from("YapayIntegration").update({ lastSyncAt: new Date().toISOString(), lastSyncStatus: "success" }).eq("id", integration.id);
    
    return new Response(JSON.stringify({ success: true, count: transactions.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
