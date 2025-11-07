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
      .from("OutbrainIntegration")
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
      .from("OutbrainSyncLog")
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
      // Sync campaigns
      if (action === "sync-all" || action === "sync-campaigns") {
        const campaignsResult = await syncCampaigns(
          supabase,
          integration,
          limit,
        );
        results.campaigns = campaignsResult;
        if (!campaignsResult.success) {
          hasError = true;
          errorMessage = campaignsResult.error || "Failed to sync campaigns";
        }
      }

      // Sync promoted links (content)
      if (action === "sync-all" || action === "sync-content") {
        const contentResult = await syncPromotedLinks(
          supabase,
          integration,
          limit,
        );
        results.content = contentResult;
        if (!contentResult.success) {
          hasError = true;
          errorMessage = contentResult.error || "Failed to sync content";
        }
      }

      // Sync performance reports
      if (action === "sync-all" || action === "sync-performance") {
        const performanceResult = await syncPerformance(supabase, integration);
        results.performance = performanceResult;
        if (!performanceResult.success) {
          hasError = true;
          errorMessage =
            performanceResult.error || "Failed to sync performance";
        }
      }

      await supabase
        .from("OutbrainSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("OutbrainIntegration")
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
        .from("OutbrainSyncLog")
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
    console.error("Outbrain sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncCampaigns(supabase: any, integration: any, limit: number) {
  try {
    const campaigns: any[] = [];

    const url = `https://api.outbrain.com/amplify/v0.1/marketers/${integration.marketerId}/campaigns`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "OB-TOKEN-V1": integration.apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: "Invalid API key. Please reconnect.",
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
    const campaignsList = data.campaigns || [];

    if (campaignsList.length > 0) {
      campaigns.push(...campaignsList.slice(0, limit));

      const campaignsToInsert = campaigns.map((c: any) => ({
        id: `outbrain-${integration.id}-${c.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        campaignId: String(c.id),
        name: c.name || "",
        enabled: c.enabled || false,
        budget: {
          daily: parseFloat(c.budget?.daily || 0),
          total: parseFloat(c.budget?.total || 0),
          type: c.budget?.type || "",
        },
        cpc: parseFloat(c.cpc || 0),
        targeting: c.targeting || {},
        schedule: c.schedule || {},
        locations: c.targeting?.locations || [],
        platforms: c.targeting?.platforms || [],
        createdAt: c.creationTime || new Date().toISOString(),
        outbrainData: c,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("OutbrainCampaign")
        .upsert(campaignsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: campaigns.length, synced: campaigns.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncPromotedLinks(
  supabase: any,
  integration: any,
  limit: number,
) {
  try {
    // Get campaigns first
    const { data: campaigns } = await supabase
      .from("OutbrainCampaign")
      .select("campaignId")
      .eq("integrationId", integration.id)
      .limit(10);

    if (!campaigns || campaigns.length === 0) {
      return { success: true, count: 0, synced: 0 };
    }

    let totalLinks = 0;

    for (const campaign of campaigns) {
      const links: any[] = [];

      const url = `https://api.outbrain.com/amplify/v0.1/campaigns/${campaign.campaignId}/promotedLinks`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          "OB-TOKEN-V1": integration.apiKey,
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const linksList = data.promotedLinks || [];

      if (linksList.length > 0) {
        links.push(...linksList.slice(0, limit));

        const linksToInsert = links.map((l: any) => ({
          id: `outbrain-link-${integration.id}-${l.id}`,
          userId: integration.userId,
          integrationId: integration.id,
          linkId: String(l.id),
          campaignId: String(campaign.campaignId),
          text: l.text || "",
          url: l.url || "",
          status: l.status || "",
          sectionId: l.sectionId || "",
          sectionName: l.sectionName || "",
          imageUrl: l.cachedImageUrl || l.imageUrl || "",
          cpc: parseFloat(l.cpc || 0),
          enabled: l.enabled || false,
          archived: l.archived || false,
          outbrainData: l,
          createdAt: l.creationTime || new Date().toISOString(),
          lastSyncAt: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("OutbrainPromotedLink")
          .upsert(linksToInsert, { onConflict: "id" });

        if (!error) {
          totalLinks += links.length;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    return { success: true, count: totalLinks, synced: totalLinks };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncPerformance(supabase: any, integration: any) {
  try {
    // Get performance data for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const url = `https://api.outbrain.com/amplify/v0.1/reports/marketers/${integration.marketerId}/campaigns?from=${startDateStr}&to=${endDateStr}&breakdown=daily`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        "OB-TOKEN-V1": integration.apiKey,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        return {
          success: false,
          error: "Invalid API key. Please reconnect.",
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
    const reportData = data.results || [];

    if (reportData.length > 0) {
      const reportsToInsert = reportData.map((r: any) => ({
        id: `outbrain-report-${integration.id}-${r.campaignId}-${r.fromDate}`,
        userId: integration.userId,
        integrationId: integration.id,
        campaignId: String(r.campaignId),
        campaignName: r.campaignName || "",
        date: r.fromDate || startDateStr,
        impressions: parseInt(r.impressions || 0),
        clicks: parseInt(r.clicks || 0),
        ctr: parseFloat(r.ctr || 0),
        spend: parseFloat(r.spend || 0),
        ecpc: parseFloat(r.ecpc || 0),
        conversions: parseInt(r.conversions || 0),
        conversionRate: parseFloat(r.conversionRate || 0),
        videoViews: parseInt(r.videoViews || 0),
        videoCompletionRate: parseFloat(r.videoCompletionRate || 0),
        outbrainData: r,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("OutbrainPerformance")
        .upsert(reportsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }

      return {
        success: true,
        count: reportData.length,
        synced: reportData.length,
      };
    }

    return { success: true, count: 0, synced: 0 };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}
