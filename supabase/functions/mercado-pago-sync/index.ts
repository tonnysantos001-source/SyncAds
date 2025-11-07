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
      .from("MercadoPagoIntegration")
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
      .from("MercadoPagoSyncLog")
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
      // Sync payments
      if (action === "sync-all" || action === "sync-payments") {
        const paymentsResult = await syncPayments(supabase, integration, limit);
        results.payments = paymentsResult;
        if (!paymentsResult.success) {
          hasError = true;
          errorMessage = paymentsResult.error || "Failed to sync payments";
        }
      }

      // Sync preferences (payment links)
      if (action === "sync-all" || action === "sync-preferences") {
        const preferencesResult = await syncPreferences(
          supabase,
          integration,
          limit,
        );
        results.preferences = preferencesResult;
        if (!preferencesResult.success) {
          hasError = true;
          errorMessage =
            preferencesResult.error || "Failed to sync preferences";
        }
      }

      await supabase
        .from("MercadoPagoSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("MercadoPagoIntegration")
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
        .from("MercadoPagoSyncLog")
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
    console.error("Mercado Pago sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncPayments(supabase: any, integration: any, limit: number) {
  try {
    const payments: any[] = [];
    let offset = 0;
    let hasMore = true;

    // Buscar pagamentos dos últimos 60 dias
    const beginDate = new Date();
    beginDate.setDate(beginDate.getDate() - 60);
    const beginDateStr = beginDate.toISOString();

    while (hasMore && payments.length < limit) {
      const url = `https://api.mercadopago.com/v1/payments/search?sort=date_created&criteria=desc&begin_date=${beginDateStr}&limit=50&offset=${offset}`;

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
      const pagePayments = data.results || [];

      if (pagePayments.length === 0) {
        hasMore = false;
      } else {
        payments.push(...pagePayments);
        offset += 50;

        if (pagePayments.length < 50) {
          hasMore = false;
        }
      }

      // Rate limiting - Mercado Pago permite 500 requisições por minuto
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    if (payments.length > 0) {
      const paymentsToInsert = payments.map((p: any) => ({
        id: `mp-${integration.id}-${p.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        paymentId: String(p.id),
        status: p.status || "",
        statusDetail: p.status_detail || "",
        operationType: p.operation_type || "",
        paymentType: p.payment_type_id || "",
        paymentMethod: p.payment_method_id || "",
        transactionAmount: parseFloat(p.transaction_amount || 0),
        netAmount: parseFloat(p.transaction_amount_refunded || 0),
        totalPaidAmount: parseFloat(
          p.transaction_details?.total_paid_amount || 0,
        ),
        installments: parseInt(p.installments || 1),
        currencyId: p.currency_id || "BRL",
        description: p.description || "",
        externalReference: p.external_reference || "",
        payerEmail: p.payer?.email || "",
        payerName: p.payer?.first_name
          ? `${p.payer.first_name} ${p.payer.last_name || ""}`.trim()
          : "",
        payerPhone: p.payer?.phone?.number || "",
        payerDocument: p.payer?.identification?.number || "",
        cardLastFourDigits: p.card?.last_four_digits || "",
        cardFirstSixDigits: p.card?.first_six_digits || "",
        mercadopagoData: p,
        dateCreated: p.date_created || new Date().toISOString(),
        dateApproved: p.date_approved || null,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("MercadoPagoPayment")
        .upsert(paymentsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: payments.length, synced: payments.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncPreferences(supabase: any, integration: any, limit: number) {
  try {
    const preferences: any[] = [];
    let offset = 0;
    let hasMore = true;

    while (hasMore && preferences.length < limit) {
      const url = `https://api.mercadopago.com/checkout/preferences/search?offset=${offset}&limit=50`;

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
        // Preferences endpoint pode não estar disponível para todas as contas
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
      const pagePreferences = data.results || [];

      if (pagePreferences.length === 0) {
        hasMore = false;
      } else {
        preferences.push(...pagePreferences);
        offset += 50;

        if (pagePreferences.length < 50) {
          hasMore = false;
        }
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    if (preferences.length > 0) {
      const preferencesToInsert = preferences.map((pref: any) => ({
        id: `mp-pref-${integration.id}-${pref.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        preferenceId: String(pref.id),
        purpose: pref.purpose || "",
        externalReference: pref.external_reference || "",
        autoReturn: pref.auto_return || "",
        backUrls: pref.back_urls || {},
        items: pref.items || [],
        paymentMethods: pref.payment_methods || {},
        shipments: pref.shipments || {},
        additionalInfo: pref.additional_info || "",
        expires: pref.expires || false,
        expirationDateFrom: pref.expiration_date_from || null,
        expirationDateTo: pref.expiration_date_to || null,
        initPoint: pref.init_point || "",
        sandboxInitPoint: pref.sandbox_init_point || "",
        mercadopagoData: pref,
        dateCreated: pref.date_created || new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("MercadoPagoPreference")
        .upsert(preferencesToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return {
      success: true,
      count: preferences.length,
      synced: preferences.length,
    };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}
