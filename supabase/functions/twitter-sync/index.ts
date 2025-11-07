import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { integrationId } = await req.json();
    const { data: integration } = await supabase.from("TwitterIntegration").select("*").eq("id", integrationId).single();
    if (!integration) return new Response(JSON.stringify({ success: false }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    
    const tweetsUrl = "https://api.twitter.com/2/users/me/tweets?max_results=100&tweet.fields=created_at,public_metrics,entities";
    const tweetsResponse = await fetch(tweetsUrl, { headers: { Authorization: `Bearer ${integration.accessToken}` } });
    const tweets: any[] = [];
    if (tweetsResponse.ok) {
      const data = await tweetsResponse.json();
      const tweetsList = data.data || [];
      if (tweetsList.length > 0) {
        const toInsert = tweetsList.map((t: any) => ({ id: `twitter-${integration.id}-${t.id}`, userId: integration.userId, integrationId: integration.id, tweetId: t.id, text: t.text, likes: t.public_metrics?.like_count || 0, retweets: t.public_metrics?.retweet_count || 0, replies: t.public_metrics?.reply_count || 0, twitterData: t, createdAt: t.created_at, lastSyncAt: new Date().toISOString() }));
        await supabase.from("TwitterTweet").upsert(toInsert, { onConflict: "id" });
        tweets.push(...tweetsList);
      }
    }
    
    await supabase.from("TwitterIntegration").update({ lastSyncAt: new Date().toISOString(), lastSyncStatus: "success" }).eq("id", integration.id);
    return new Response(JSON.stringify({ success: true, count: tweets.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
