import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { integrationId } = await req.json();
    const { data: integration } = await supabase.from("LinkedInIntegration").select("*").eq("id", integrationId).single();
    if (!integration) return new Response(JSON.stringify({ success: false }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    
    const postsUrl = "https://api.linkedin.com/v2/ugcPosts?q=authors&authors=List(urn%3Ali%3Aperson%3A${personId})";
    const postsResponse = await fetch(postsUrl, { headers: { Authorization: `Bearer ${integration.accessToken}` } });
    const posts: any[] = [];
    if (postsResponse.ok) {
      const data = await postsResponse.json();
      const elements = data.elements || [];
      if (elements.length > 0) {
        const toInsert = elements.map((p: any) => ({ id: `linkedin-${integration.id}-${p.id}`, userId: integration.userId, integrationId: integration.id, postId: p.id, text: p.specificContent?.["com.linkedin.ugc.ShareContent"]?.shareCommentary?.text || "", linkedinData: p, lastSyncAt: new Date().toISOString() }));
        await supabase.from("LinkedInPost").upsert(toInsert, { onConflict: "id" });
        posts.push(...elements);
      }
    }
    
    await supabase.from("LinkedInIntegration").update({ lastSyncAt: new Date().toISOString(), lastSyncStatus: "success" }).eq("id", integration.id);
    return new Response(JSON.stringify({ success: true, count: posts.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
