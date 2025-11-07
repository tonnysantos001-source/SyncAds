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
      .from("BlingIntegration")
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
      .from("BlingSyncLog")
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
      // Sync products
      if (action === "sync-all" || action === "sync-products") {
        const productsResult = await syncProducts(supabase, integration, limit);
        results.products = productsResult;
        if (!productsResult.success) {
          hasError = true;
          errorMessage = productsResult.error || "Failed to sync products";
        }
      }

      // Sync orders
      if (action === "sync-all" || action === "sync-orders") {
        const ordersResult = await syncOrders(supabase, integration, limit);
        results.orders = ordersResult;
        if (!ordersResult.success) {
          hasError = true;
          errorMessage = ordersResult.error || "Failed to sync orders";
        }
      }

      await supabase
        .from("BlingSyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          errorMessage: hasError ? errorMessage : null,
          details: results,
        })
        .eq("id", syncLog.id);

      await supabase
        .from("BlingIntegration")
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
        .from("BlingSyncLog")
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
    console.error("Bling sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncProducts(supabase: any, integration: any, limit: number) {
  try {
    const products: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && products.length < limit) {
      const url = `https://www.bling.com.br/Api/v3/produtos?pagina=${page}&limite=100`;

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
      const pageProducts = data.data || [];

      if (pageProducts.length === 0) {
        hasMore = false;
      } else {
        products.push(...pageProducts);
        page++;

        if (pageProducts.length < 100) {
          hasMore = false;
        }
      }

      // Rate limiting - Bling tem limite de 3 requisições por segundo
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    if (products.length > 0) {
      const productsToInsert = products.map((p: any) => ({
        id: `bling-${integration.id}-${p.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        productId: String(p.id),
        name: p.nome || "",
        description: p.descricao || "",
        sku: p.codigo || "",
        price: parseFloat(p.preco || 0),
        cost: p.precoCusto ? parseFloat(p.precoCusto) : null,
        stock: p.estoques?.[0]?.saldoFisico || 0,
        unit: p.unidade || "UN",
        type: p.tipo || "P",
        situation: p.situacao || "A",
        blingData: p,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("BlingProduct")
        .upsert(productsToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: products.length, synced: products.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}

async function syncOrders(supabase: any, integration: any, limit: number) {
  try {
    const orders: any[] = [];
    let page = 1;
    let hasMore = true;

    // Buscar pedidos dos últimos 30 dias
    const dataInicial = new Date();
    dataInicial.setDate(dataInicial.getDate() - 30);
    const dataInicialStr = dataInicial.toISOString().split("T")[0];

    while (hasMore && orders.length < limit) {
      const url = `https://www.bling.com.br/Api/v3/pedidos/vendas?pagina=${page}&limite=100&dataInicial=${dataInicialStr}`;

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
      const pageOrders = data.data || [];

      if (pageOrders.length === 0) {
        hasMore = false;
      } else {
        orders.push(...pageOrders);
        page++;

        if (pageOrders.length < 100) {
          hasMore = false;
        }
      }

      // Rate limiting - Bling tem limite de 3 requisições por segundo
      await new Promise((resolve) => setTimeout(resolve, 350));
    }

    if (orders.length > 0) {
      const ordersToInsert = orders.map((o: any) => ({
        id: `bling-${integration.id}-${o.id}`,
        userId: integration.userId,
        integrationId: integration.id,
        orderId: String(o.id),
        orderNumber: String(o.numero),
        status: o.situacao?.id || 0,
        statusName: o.situacao?.nome || "",
        total: parseFloat(o.total || 0),
        discount: parseFloat(o.desconto || 0),
        shipping: parseFloat(o.valorFrete || 0),
        customerName: o.contato?.nome || "",
        customerEmail: o.contato?.email || "",
        customerPhone: o.contato?.telefone || "",
        paymentMethod: o.transporte?.freteporConta || "",
        blingData: o,
        orderDate: o.data || new Date().toISOString(),
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("BlingOrder")
        .upsert(ordersToInsert, { onConflict: "id" });

      if (error) {
        return { success: false, error: error.message, count: 0 };
      }
    }

    return { success: true, count: orders.length, synced: orders.length };
  } catch (error: any) {
    return { success: false, error: error.message, count: 0 };
  }
}
