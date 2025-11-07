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
      .from("InstagramIntegration")
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
      .from("InstagramSyncLog")
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
      if (action === "sync-all" || action === "sync-media") {
        const mediaResult = await syncMedia(supabase, integration, limit);
        results.media = mediaResult;
        if (!mediaResult.success) {
          hasError = true;
          errorMessage = mediaResult.error || "Failed to sync media";
        }
      }

      if (action === "sync-all" || action === "sync-insights") {
        const insightsResult = await syncInsights(supabase, integration);
        results.insights = insightsResult;
        if (!insightsResult.success) {
          hasError = true;
          errorMessage = insightsResult.error || "Failed to sync insights";
        }
      }

      await supabase
        .from("InstagramSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("InstagramIntegration")
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
        .from("InstagramSyncLog")
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
    console.error("Instagram sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncMedia(supabase: any, integration: any, limit: number) {
  try {
    const media: any[] = [];
    let nextPage = null;
    let hasMore = true;

    while (hasMore && media.length < limit) {
      const fields =
        "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,like_count,comments_count,children{id,media_type,media_url}";
      const url =
        nextPage ||
        `https://graph.facebook.com/v18.0/${integration.businessAccountId}/media?fields=${fields}&access_token=${integration.accessToken}&limit=50`;

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
      const pageMedia = data.data || [];

      if (pageMedia.length === 0) {
        hasMore = false;
      } else {
        media.push(...pageMedia);

        if (data.paging?.next) {
          nextPage = data.paging.next;
        } else {
          hasMore = false;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    if (media.length > 0) {
      const mediaToInsert = media.map((m: any) => ({
        id: `ig-${integration.id}-${m.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        mediaId: m.id,
        mediaType: m.media_type || "",
        caption: m.caption || "",
        mediaUrl: m.media_url || "",
        thumbnailUrl: m.thumbnail_url || "",
        permalink: m.permalink || "",
        username: m.username || "",
        likeCount: parseInt(m.like_count || 0),
        commentsCount: parseInt(m.comments_count || 0),
        children: m.children?.data || [],
        instagramData: m,
        timestamp: m.timestamp || new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("InstagramMedia")
        .upsert(mediaToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: media.length, synced: media.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncInsights(supabase: any, integration: any) {
  try {
    const metrics = [
      "impressions",
      "reach",
      "follower_count",
      "profile_views",
      "website_clicks",
    ];
    const period = "day";
    const since = new Date();
    since.setDate(since.getDate() - 7);
    const sinceTimestamp = Math.floor(since.getTime() / 1000);

    const until = new Date();
    const untilTimestamp = Math.floor(until.getTime() / 1000);

    const url = `https://graph.facebook.com/v18.0/${integration.businessAccountId}/insights?metric=${metrics.join(",")}&period=${period}&since=${sinceTimestamp}&until=${untilTimestamp}&access_token=${integration.accessToken}`;

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
      const insightsData: any = {
        id: `ig-insight-${integration.id}-${since.toISOString().split("T")[0]}`,
        userId: integration.userId,
        integrationId: integration.id,
        dateStart: since.toISOString().split("T")[0],
        dateEnd: until.toISOString().split("T")[0],
        impressions: 0,
        reach: 0,
        followerCount: 0,
        profileViews: 0,
        websiteClicks: 0,
        instagramData: insights,
        lastSyncAt: new Date().toISOString(),
      };

      for (const insight of insights) {
        const values = insight.values || [];
        const totalValue = values.reduce(
          (sum: number, v: any) => sum + parseInt(v.value || 0),
          0,
        );

        switch (insight.name) {
          case "impressions":
            insightsData.impressions = totalValue;
            break;
          case "reach":
            insightsData.reach = totalValue;
            break;
          case "follower_count":
            insightsData.followerCount = totalValue;
            break;
          case "profile_views":
            insightsData.profileViews = totalValue;
            break;
          case "website_clicks":
            insightsData.websiteClicks = totalValue;
            break;
        }
      }

      const { error } = await supabase
        .from("InstagramInsight")
        .upsert([insightsData], { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: insights.length, synced: 1 };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}
