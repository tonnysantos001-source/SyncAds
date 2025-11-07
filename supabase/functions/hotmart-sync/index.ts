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
      .from("HotmartIntegration")
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
      .from("HotmartSyncLog")
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
      // Sync sales
      if (action === "sync-all" || action === "sync-sales") {
        const salesResult = await syncSales(supabase, integration, limit);
        results.sales = salesResult;
        if (!salesResult.success) {
          hasError = true;
          errorMessage = salesResult.error || "Failed to sync sales";
        }
      }

      // Sync commissions
      if (action === "sync-all" || action === "sync-commissions") {
        const commissionsResult = await syncCommissions(
          supabase,
          integration,
          limit,
        );
        results.commissions = commissionsResult;
        if (!commissionsResult.success) {
          hasError = true;
          errorMessage =
            commissionsResult.error || "Failed to sync commissions";
        }
      }

      await supabase
        .from("HotmartSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("HotmartIntegration")
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
        .from("HotmartSyncLog")
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
    console.error("Hotmart sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncSales(supabase: any, integration: any, limit: number) {
  try {
    const sales: any[] = [];
    let page = 0;
    let hasMore = true;

    // Buscar vendas dos últimos 60 dias
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    const startDateTimestamp = Math.floor(startDate.getTime() / 1000);

    const endDate = new Date();
    const endDateTimestamp = Math.floor(endDate.getTime() / 1000);

    while (hasMore && sales.length < limit) {
      const url = `https://developers.hotmart.com/payments/api/v1/sales/history?start_date=${startDateTimestamp}&end_date=${endDateTimestamp}&page=${page}&page_size=50`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${integration.accessToken}`,
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
      const pageSales = data.items || [];

      if (pageSales.length === 0) {
        hasMore = false;
      } else {
        sales.push(...pageSales);
        page++;

        if (pageSales.length < 50) {
          hasMore = false;
        }
      }

      // Rate limiting - Hotmart permite 200 requisições por minuto
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    if (sales.length > 0) {
      const salesToInsert = sales.map((s: any) => ({
        id: `hotmart-${integration.id}-${s.transaction}`,
        userId: integration.userId,
        integrationId: integration.id,
        transactionId: s.transaction || "",
        purchaseTransaction: s.purchase?.transaction || "",
        productId: String(s.product?.id || ""),
        productName: s.product?.name || "",
        offerId: String(s.offer?.id || ""),
        offerCode: s.offer?.code || "",
        status: s.status || "",
        paymentType: s.payment?.type || "",
        paymentMethod: s.payment?.method || "",
        installments: parseInt(s.payment?.installments || 1),
        price: parseFloat(s.purchase?.price?.value || 0),
        originalPrice: parseFloat(s.purchase?.original_offer_price?.value || 0),
        currency: s.purchase?.price?.currency_code || "BRL",
        commissionAs: s.commission?.as || "",
        commissionCurrency:
          s.commission?.currency_code ||
          s.purchase?.price?.currency_code ||
          "BRL",
        commissionValue: parseFloat(s.commission?.value || 0),
        buyerEmail: s.buyer?.email || "",
        buyerName: s.buyer?.name || "",
        buyerDocument: s.buyer?.checkout_phone || "",
        producerName: s.producer?.name || "",
        affiliateName: s.affiliates?.[0]?.name || "",
        hotmartData: s,
        approvedDate: s.purchase?.approved_date
          ? new Date(s.purchase.approved_date * 1000).toISOString()
          : null,
        orderDate: s.purchase?.order_date
          ? new Date(s.purchase.order_date * 1000).toISOString()
          : new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("HotmartSale")
        .upsert(salesToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: sales.length, synced: sales.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncCommissions(supabase: any, integration: any, limit: number) {
  try {
    const commissions: any[] = [];
    let page = 0;
    let hasMore = true;

    // Buscar comissões dos últimos 60 dias
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 60);
    const startDateTimestamp = Math.floor(startDate.getTime() / 1000);

    const endDate = new Date();
    const endDateTimestamp = Math.floor(endDate.getTime() / 1000);

    while (hasMore && commissions.length < limit) {
      const url = `https://developers.hotmart.com/payments/api/v1/sales/commissions?start_date=${startDateTimestamp}&end_date=${endDateTimestamp}&page=${page}&page_size=50`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${integration.accessToken}`,
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
        // Endpoint de comissões pode não estar disponível para todas as contas
        if (response.status === 404 || response.status === 403) {
          return { success: true, count: 0, synced: 0 };
        }
        return {
          success: false,
          error: `API error: ${response.status}`,
          count: 0,
        };
      }

      const data = await response.json();
      const pageCommissions = data.items || [];

      if (pageCommissions.length === 0) {
        hasMore = false;
      } else {
        commissions.push(...pageCommissions);
        page++;

        if (pageCommissions.length < 50) {
          hasMore = false;
        }
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    if (commissions.length > 0) {
      const commissionsToInsert = commissions.map((c: any) => ({
        id: `hotmart-comm-${integration.id}-${c.transaction || crypto.randomUUID()}`,
        userId: integration.userId,
        integrationId: integration.id,
        transactionId: c.transaction || "",
        commissionType: c.commission_type || "",
        commissionStatus: c.status || "",
        productId: String(c.product_id || ""),
        productName: c.product_name || "",
        buyerEmail: c.buyer_email || "",
        buyerName: c.buyer_name || "",
        commissionValue: parseFloat(c.commission_value || 0),
        currency: c.currency_code || "BRL",
        salePrice: parseFloat(c.sale_price || 0),
        affiliateName: c.affiliate_name || "",
        producerName: c.producer_name || "",
        hotmartData: c,
        commissionDate: c.commission_date
          ? new Date(c.commission_date * 1000).toISOString()
          : new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("HotmartCommission")
        .upsert(commissionsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return {
      success: true,
      count: commissions.length,
      synced: commissions.length,
    };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}
