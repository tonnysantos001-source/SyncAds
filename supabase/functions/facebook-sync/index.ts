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

    const {
      integrationId,
      action = "sync-all",
      limit = 100,
    } = await req.json();

    if (!integrationId) {
      return new Response(
        JSON.stringify({ success: false, error: "integrationId is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: integration, error: integrationError } = await supabase
      .from("FacebookIntegration")
      .select("*")
      .eq("id", integrationId)
      .eq("isActive", true)
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Integration not found or inactive",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { data: syncLog } = await supabase
      .from("FacebookSyncLog")
      .insert({
        id: crypto.randomUUID(),
        userId: integration.userId,
        integrationId: integration.id,
        syncType: action,
        status: "started",
        startedAt: new Date().toISOString(),
      })
      .select()
      .single();

    const results: any = {};
    let hasError = false;
    let errorMessage = "";

    try {
      // Sync posts
      if (action === "sync-all" || action === "sync-posts") {
        const postsResult = await syncPosts(supabase, integration, limit);
        results.posts = postsResult;
        if (!postsResult.success) {
          hasError = true;
          errorMessage = postsResult.error || "Failed to sync posts";
        }
      }

      // Sync ads
      if (action === "sync-all" || action === "sync-ads") {
        const adsResult = await syncAds(supabase, integration, limit);
        results.ads = adsResult;
        if (!adsResult.success) {
          hasError = true;
          errorMessage = adsResult.error || "Failed to sync ads";
        }
      }

      // Sync insights
      if (action === "sync-all" || action === "sync-insights") {
        const insightsResult = await syncInsights(supabase, integration);
        results.insights = insightsResult;
        if (!insightsResult.success) {
          hasError = true;
          errorMessage = insightsResult.error || "Failed to sync insights";
        }
      }

      await supabase
        .from("FacebookSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("FacebookIntegration")
        .update({
          lastSyncAt: new Date().toISOString(),
          lastSyncStatus: hasError ? "error" : "success",
        })
        .eq("id", integration.id);

      return new Response(
        JSON.stringify({ success: !hasError, results, syncLogId: syncLog.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    } catch (error: any) {
      await supabase
        .from("FacebookSyncLog")
        .update({
          status: "failed",
          completedAt: new Date().toISOString(),
          errorMessage: error.message,
          details: results,
        })
        .eq("id", syncLog.id);

      throw error;
    }
  } catch (error: any) {
    console.error("Facebook sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncPosts(supabase: any, integration: any, limit: number) {
  try {
    const posts: any[] = [];
    let nextPage = null;
    let hasMore = true;

    while (hasMore && posts.length < limit) {
      const fields =
        "id,message,story,created_time,updated_time,permalink_url,shares,type,status_type,full_picture,attachments,reactions.summary(true),comments.summary(true)";
      const url =
        nextPage ||
        `https://graph.facebook.com/v18.0/${integration.pageId}/posts?fields=${fields}&access_token=${integration.accessToken}&limit=50`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401 || response.status === 190) {
          return {
            success: false,
            error: "Access token expired. Please reconnect.",
            count: 0,
          };
        }
        return {
          success: false,
          error: `API error: ${response.status}`,
          count: 0,
        };
      }

      const data = await response.json();
      const pagePosts = data.data || [];

      if (pagePosts.length === 0) {
        hasMore = false;
      } else {
        posts.push(...pagePosts);

        if (data.paging?.next) {
          nextPage = data.paging.next;
        } else {
          hasMore = false;
        }
      }

      // Rate limiting - Facebook Graph API permite 200 chamadas por hora por usuário
      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (posts.length > 0) {
      const postsToInsert = posts.map((p: any) => ({
        id: `fb-${integration.id}-${p.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        postId: p.id,
        message: p.message || "",
        story: p.story || "",
        type: p.type || "",
        statusType: p.status_type || "",
        permalinkUrl: p.permalink_url || "",
        fullPicture: p.full_picture || "",
        sharesCount: p.shares?.count || 0,
        reactionsCount: p.reactions?.summary?.total_count || 0,
        commentsCount: p.comments?.summary?.total_count || 0,
        attachments: p.attachments?.data || [],
        facebookData: p,
        createdTime: p.created_time || new Date().toISOString(),
        updatedTime: p.updated_time || new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("FacebookPost")
        .upsert(postsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: posts.length, synced: posts.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncAds(supabase: any, integration: any, limit: number) {
  try {
    if (!integration.adAccountId) {
      return { success: true, count: 0, synced: 0 };
    }

    const ads: any[] = [];
    let nextPage = null;
    let hasMore = true;

    while (hasMore && ads.length < limit) {
      const fields =
        "id,name,status,effective_status,created_time,updated_time,adset_id,campaign_id,creative{id,name,title,body,image_url,video_id,thumbnail_url},targeting";
      const url =
        nextPage ||
        `https://graph.facebook.com/v18.0/act_${integration.adAccountId}/ads?fields=${fields}&access_token=${integration.accessToken}&limit=50`;

      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401 || response.status === 190) {
          return {
            success: false,
            error: "Access token expired. Please reconnect.",
            count: 0,
          };
        }
        return {
          success: false,
          error: `API error: ${response.status}`,
          count: 0,
        };
      }

      const data = await response.json();
      const pageAds = data.data || [];

      if (pageAds.length === 0) {
        hasMore = false;
      } else {
        ads.push(...pageAds);

        if (data.paging?.next) {
          nextPage = data.paging.next;
        } else {
          hasMore = false;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (ads.length > 0) {
      const adsToInsert = ads.map((a: any) => ({
        id: `fb-ad-${integration.id}-${a.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        adId: a.id,
        name: a.name || "",
        status: a.status || "",
        effectiveStatus: a.effective_status || "",
        adsetId: a.adset_id || "",
        campaignId: a.campaign_id || "",
        creativeId: a.creative?.id || "",
        creativeName: a.creative?.name || "",
        creativeTitle: a.creative?.title || "",
        creativeBody: a.creative?.body || "",
        creativeImageUrl: a.creative?.image_url || "",
        creativeVideoId: a.creative?.video_id || "",
        creativeThumbnailUrl: a.creative?.thumbnail_url || "",
        targeting: a.targeting || {},
        facebookData: a,
        createdTime: a.created_time || new Date().toISOString(),
        updatedTime: a.updated_time || new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("FacebookAd")
        .upsert(adsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: ads.length, synced: ads.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncInsights(supabase: any, integration: any) {
  try {
    if (!integration.adAccountId) {
      return { success: true, count: 0, synced: 0 };
    }

    // Buscar insights dos últimos 7 dias
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceStr = since.toISOString().split("T")[0];

    const until = new Date();
    const untilStr = until.toISOString().split("T")[0];

    const fields =
      "impressions,reach,clicks,spend,actions,action_values,cost_per_action_type,cpc,cpm,cpp,ctr,frequency";
    const url = `https://graph.facebook.com/v18.0/act_${integration.adAccountId}/insights?fields=${fields}&time_range={'since':'${sinceStr}','until':'${untilStr}'}&access_token=${integration.accessToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 401 || response.status === 190) {
        return {
          success: false,
          error: "Access token expired. Please reconnect.",
          count: 0,
        };
      }
      return {
        success: false,
        error: `API error: ${response.status}`,
        count: 0,
      };
    }

    const data = await response.json();
    const insights = data.data || [];

    if (insights.length > 0) {
      const insightsToInsert = insights.map((i: any) => ({
        id: `fb-insight-${integration.id}-${sinceStr}-${untilStr}`,
        userId: integration.userId,
        integrationId: integration.id,
        dateStart: sinceStr,
        dateStop: untilStr,
        impressions: parseInt(i.impressions || 0),
        reach: parseInt(i.reach || 0),
        clicks: parseInt(i.clicks || 0),
        spend: parseFloat(i.spend || 0),
        cpc: parseFloat(i.cpc || 0),
        cpm: parseFloat(i.cpm || 0),
        cpp: parseFloat(i.cpp || 0),
        ctr: parseFloat(i.ctr || 0),
        frequency: parseFloat(i.frequency || 0),
        actions: i.actions || [],
        actionValues: i.action_values || [],
        costPerActionType: i.cost_per_action_type || [],
        facebookData: i,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("FacebookInsight")
        .upsert(insightsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: insights.length, synced: insights.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}
