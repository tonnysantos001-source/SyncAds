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
      .from("BingAdsIntegration")
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
      .from("BingAdsSyncLog")
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

      // Sync ads
      if (action === "sync-all" || action === "sync-ads") {
        const adsResult = await syncAds(supabase, integration, limit);
        results.ads = adsResult;
        if (!adsResult.success) {
          hasError = true;
          errorMessage = adsResult.error || "Failed to sync ads";
        }
      }

      // Sync performance reports
      if (action === "sync-all" || action === "sync-reports") {
        const reportsResult = await syncPerformanceReports(
          supabase,
          integration,
        );
        results.reports = reportsResult;
        if (!reportsResult.success) {
          hasError = true;
          errorMessage = reportsResult.error || "Failed to sync reports";
        }
      }

      await supabase
        .from("BingAdsSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("BingAdsIntegration")
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
        .from("BingAdsSyncLog")
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
    console.error("Bing Ads sync error:", error);
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

    // Get customer and account IDs from metadata
    const customerId =
      integration.customerId || integration.metadata?.customerId;
    const accountId = integration.accountId || integration.metadata?.accountId;

    if (!customerId || !accountId) {
      return {
        success: false,
        error: "Customer ID or Account ID not configured",
        count: 0,
      };
    }

    const url = `https://ads.microsoft.com/api/v13/campaigns`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${integration.accessToken}`,
        "Customer-Id": customerId,
        "Account-Id": accountId,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
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
    const campaignsList = data.Campaigns || data.campaigns || [];

    if (campaignsList.length > 0) {
      campaigns.push(...campaignsList.slice(0, limit));

      const campaignsToInsert = campaigns.map((c: any) => ({
        id: `bingads-${integration.id}-${c.Id || c.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        campaignId: String(c.Id || c.id),
        name: c.Name || c.name || "",
        status: c.Status || c.status || "",
        budgetType: c.BudgetType || c.budgetType || "",
        dailyBudget: parseFloat(c.DailyBudget || c.dailyBudget || 0),
        monthlyBudget: parseFloat(c.MonthlyBudget || c.monthlyBudget || 0),
        campaignType: c.CampaignType || c.campaignType || "",
        timeZone: c.TimeZone || c.timeZone || "",
        language: c.Languages?.[0] || c.languages?.[0] || "",
        biddingScheme: c.BiddingScheme?.Type || c.biddingScheme?.type || "",
        bingAdsData: c,
        startDate: c.StartDate || c.startDate || null,
        endDate: c.EndDate || c.endDate || null,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("BingAdsCampaign")
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

async function syncAds(supabase: any, integration: any, limit: number) {
  try {
    // Get campaigns first
    const { data: campaigns } = await supabase
      .from("BingAdsCampaign")
      .select("campaignId")
      .eq("integrationId", integration.id)
      .limit(10);

    if (!campaigns || campaigns.length === 0) {
      return { success: true, count: 0, synced: 0 };
    }

    const customerId =
      integration.customerId || integration.metadata?.customerId;
    const accountId = integration.accountId || integration.metadata?.accountId;

    let totalAds = 0;

    for (const campaign of campaigns) {
      const ads: any[] = [];

      const url = `https://ads.microsoft.com/api/v13/campaigns/${campaign.campaignId}/ads`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${integration.accessToken}`,
          "Customer-Id": customerId,
          "Account-Id": accountId,
        },
      });

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const adsList = data.Ads || data.ads || [];

      if (adsList.length > 0) {
        ads.push(...adsList.slice(0, limit));

        const adsToInsert = ads.map((a: any) => ({
          id: `bingads-ad-${integration.id}-${a.Id || a.id}`,
          userId: integration.userId,
          integrationId: integration.id,
          adId: String(a.Id || a.id),
          campaignId: String(campaign.campaignId),
          adType: a.Type || a.type || "",
          status: a.Status || a.status || "",
          title: a.TitlePart1 || a.titlePart1 || a.HeadlinePart1 || "",
          description: a.Text || a.text || a.Description || a.description || "",
          displayUrl: a.DisplayUrl || a.displayUrl || "",
          finalUrl: a.FinalUrls?.[0] || a.finalUrls?.[0] || "",
          devicePreference: a.DevicePreference || a.devicePreference || 0,
          bingAdsData: a,
          lastSyncAt: new Date().toISOString(),
        }));

        const { error } = await supabase
          .from("BingAdsAd")
          .upsert(adsToInsert, { onConflict: "id" });

        if (!error) {
          totalAds += ads.length;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 200));
    }

    return { success: true, count: totalAds, synced: totalAds };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncPerformanceReports(supabase: any, integration: any) {
  try {
    const customerId =
      integration.customerId || integration.metadata?.customerId;
    const accountId = integration.accountId || integration.metadata?.accountId;

    // Get performance data for last 7 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const url = `https://ads.microsoft.com/api/v13/reports/campaign-performance`;

    const reportRequest = {
      Format: "Json",
      ReportName: "CampaignPerformanceReport",
      ReturnOnlyCompleteData: false,
      Aggregation: "Daily",
      Time: {
        CustomDateRangeStart: {
          Month: startDate.getMonth() + 1,
          Day: startDate.getDate(),
          Year: startDate.getFullYear(),
        },
        CustomDateRangeEnd: {
          Month: endDate.getMonth() + 1,
          Day: endDate.getDate(),
          Year: endDate.getFullYear(),
        },
      },
      Columns: [
        "TimePeriod",
        "CampaignId",
        "CampaignName",
        "Impressions",
        "Clicks",
        "Spend",
        "Conversions",
        "Revenue",
        "Ctr",
        "AverageCpc",
        "AverageCpm",
      ],
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${integration.accessToken}`,
        "Customer-Id": customerId,
        "Account-Id": accountId,
      },
      body: JSON.stringify(reportRequest),
    });

    if (!response.ok) {
      if (response.status === 401) {
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
    const reportData = data.Report?.Data || data.report?.data || [];

    if (reportData.length > 0) {
      const reportsToInsert = reportData.map((r: any) => ({
        id: `bingads-report-${integration.id}-${r.CampaignId}-${r.TimePeriod}`,
        userId: integration.userId,
        integrationId: integration.id,
        campaignId: String(r.CampaignId || r.campaignId),
        campaignName: r.CampaignName || r.campaignName || "",
        date: r.TimePeriod || r.timePeriod || startDateStr,
        impressions: parseInt(r.Impressions || r.impressions || 0),
        clicks: parseInt(r.Clicks || r.clicks || 0),
        spend: parseFloat(r.Spend || r.spend || 0),
        conversions: parseInt(r.Conversions || r.conversions || 0),
        revenue: parseFloat(r.Revenue || r.revenue || 0),
        ctr: parseFloat(r.Ctr || r.ctr || 0),
        averageCpc: parseFloat(r.AverageCpc || r.averageCpc || 0),
        averageCpm: parseFloat(r.AverageCpm || r.averageCpm || 0),
        bingAdsData: r,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("BingAdsReport")
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
