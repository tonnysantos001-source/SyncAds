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
      .from("AsaasIntegration")
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
      .from("AsaasSyncLog")
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

      // Sync customers
      if (action === "sync-all" || action === "sync-customers") {
        const customersResult = await syncCustomers(
          supabase,
          integration,
          limit,
        );
        results.customers = customersResult;
        if (!customersResult.success) {
          hasError = true;
          errorMessage = customersResult.error || "Failed to sync customers";
        }
      }

      await supabase
        .from("AsaasSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("AsaasIntegration")
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
        .from("AsaasSyncLog")
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
    console.error("Asaas sync error:", error);
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

    const apiUrl =
      integration.environment === "production"
        ? "https://api.asaas.com"
        : "https://sandbox.asaas.com";

    while (hasMore && payments.length < limit) {
      const url = `${apiUrl}/v3/payments?offset=${offset}&limit=100`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          access_token: integration.apiKey,
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
      const pagePayments = data.data || [];

      if (pagePayments.length === 0) {
        hasMore = false;
      } else {
        payments.push(...pagePayments);
        offset += 100;

        if (pagePayments.length < 100 || !data.hasMore) {
          hasMore = false;
        }
      }

      // Rate limiting - Asaas permite 20 requisições por segundo
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (payments.length > 0) {
      const paymentsToInsert = payments.map((p: any) => ({
        id: `asaas-${integration.id}-${p.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        paymentId: p.id,
        customer: p.customer || "",
        billingType: p.billingType || "",
        status: p.status || "",
        value: parseFloat(p.value || 0),
        netValue: parseFloat(p.netValue || 0),
        description: p.description || "",
        externalReference: p.externalReference || "",
        dueDate: p.dueDate || null,
        originalDueDate: p.originalDueDate || null,
        paymentDate: p.paymentDate || null,
        clientPaymentDate: p.clientPaymentDate || null,
        installmentNumber: p.installmentNumber || null,
        installmentCount: p.installmentCount || null,
        invoiceUrl: p.invoiceUrl || "",
        bankSlipUrl: p.bankSlipUrl || "",
        transactionReceiptUrl: p.transactionReceiptUrl || "",
        pixQrCodeId: p.pixTransaction?.qrCode?.id || null,
        pixCopiaECola: p.pixTransaction?.qrCode?.payload || null,
        creditCardBrand: p.creditCard?.creditCardBrand || null,
        creditCardNumber: p.creditCard?.creditCardNumber || null,
        asaasData: p,
        dateCreated: p.dateCreated || new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("AsaasPayment")
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

async function syncCustomers(supabase: any, integration: any, limit: number) {
  try {
    const customers: any[] = [];
    let offset = 0;
    let hasMore = true;

    const apiUrl =
      integration.environment === "production"
        ? "https://api.asaas.com"
        : "https://sandbox.asaas.com";

    while (hasMore && customers.length < limit) {
      const url = `${apiUrl}/v3/customers?offset=${offset}&limit=100`;

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          access_token: integration.apiKey,
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
      const pageCustomers = data.data || [];

      if (pageCustomers.length === 0) {
        hasMore = false;
      } else {
        customers.push(...pageCustomers);
        offset += 100;

        if (pageCustomers.length < 100 || !data.hasMore) {
          hasMore = false;
        }
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    if (customers.length > 0) {
      const customersToInsert = customers.map((c: any) => ({
        id: `asaas-${integration.id}-${c.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        customerId: c.id,
        name: c.name || "",
        email: c.email || "",
        phone: c.phone || "",
        mobilePhone: c.mobilePhone || "",
        cpfCnpj: c.cpfCnpj || "",
        postalCode: c.postalCode || "",
        address: c.address || "",
        addressNumber: c.addressNumber || "",
        complement: c.complement || "",
        province: c.province || "",
        city: c.city || "",
        state: c.state || "",
        country: c.country || "Brasil",
        externalReference: c.externalReference || "",
        notificationDisabled: c.notificationDisabled || false,
        observations: c.observations || "",
        asaasData: c,
        dateCreated: c.dateCreated || new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("AsaasCustomer")
        .upsert(customersToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: customers.length, synced: customers.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}
