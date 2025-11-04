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
      limit = 250,
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

    // Get integration details
    const { data: integration, error: integrationError } = await supabase
      .from("ShopifyIntegration")
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

    const shop =
      integration.shopDomain || `${integration.shopName}.myshopify.com`;
    const accessToken = integration.accessToken;

    // Create sync log
    const { data: syncLog } = await supabase
      .from("ShopifySyncLog")
      .insert({
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
        const productsResult = await syncProducts(
          supabase,
          integration,
          shop,
          accessToken,
          limit,
        );
        results.products = productsResult;
        if (!productsResult.success) hasError = true;
      }

      // Sync orders
      if (action === "sync-all" || action === "sync-orders") {
        const ordersResult = await syncOrders(
          supabase,
          integration,
          shop,
          accessToken,
          limit,
        );
        results.orders = ordersResult;
        if (!ordersResult.success) hasError = true;
      }

      // Sync customers
      if (action === "sync-all" || action === "sync-customers") {
        const customersResult = await syncCustomers(
          supabase,
          integration,
          shop,
          accessToken,
          limit,
        );
        results.customers = customersResult;
        if (!customersResult.success) hasError = true;
      }

      // Sync abandoned carts
      if (action === "sync-all" || action === "sync-carts") {
        const cartsResult = await syncAbandonedCarts(
          supabase,
          integration,
          shop,
          accessToken,
          limit,
        );
        results.abandonedCarts = cartsResult;
        if (!cartsResult.success) hasError = true;
      }

      // Sync discounts
      if (action === "sync-all" || action === "sync-discounts") {
        const discountsResult = await syncDiscounts(
          supabase,
          integration,
          shop,
          accessToken,
          limit,
        );
        results.discounts = discountsResult;
        if (!discountsResult.success) hasError = true;
      }

      // Update sync log
      await supabase
        .from("ShopifySyncLog")
        .update({
          status: hasError ? "completed_with_errors" : "completed",
          completedAt: new Date().toISOString(),
          details: results,
        })
        .eq("id", syncLog.id);

      // Update integration
      await supabase
        .from("ShopifyIntegration")
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
      errorMessage = error.message;

      // Update sync log with error
      await supabase
        .from("ShopifySyncLog")
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
    console.error("Sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

async function syncProducts(
  supabase: any,
  integration: any,
  shop: string,
  accessToken: string,
  limit: number,
) {
  try {
    const products: any[] = [];
    let nextPageInfo: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const url = nextPageInfo
        ? `https://${shop}/admin/api/2024-01/products.json?limit=${limit}&page_info=${nextPageInfo}`
        : `https://${shop}/admin/api/2024-01/products.json?limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.products && data.products.length > 0) {
        products.push(...data.products);
      }

      // Check for pagination
      const linkHeader = response.headers.get("Link");
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(
          /<[^>]*[?&]page_info=([^>&]+)[^>]*>;\s*rel="next"/,
        );
        nextPageInfo = nextMatch ? nextMatch[1] : null;
        hasMore = !!nextPageInfo;
      } else {
        hasMore = false;
      }
    }

    // Bulk insert/update products
    if (products.length > 0) {
      const productsToInsert = products.map((p) => ({
        id: String(p.id),
        userId: integration.userId,
        integrationId: integration.id,
        title: p.title,
        handle: p.handle,
        description: p.body_html || null,
        vendor: p.vendor || null,
        productType: p.product_type || null,
        tags: p.tags ? p.tags.split(",").map((t: string) => t.trim()) : [],
        status: p.status,
        shopifyData: p,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("ShopifyProduct")
        .upsert(productsToInsert, { onConflict: "id" });

      if (error) throw error;
    }

    return { success: true, count: products.length, synced: products.length };
  } catch (error: any) {
    console.error("Error syncing products:", error);
    return { success: false, count: 0, error: error.message };
  }
}

async function syncOrders(
  supabase: any,
  integration: any,
  shop: string,
  accessToken: string,
  limit: number,
) {
  try {
    const orders: any[] = [];
    let nextPageInfo: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const url = nextPageInfo
        ? `https://${shop}/admin/api/2024-01/orders.json?limit=${limit}&status=any&page_info=${nextPageInfo}`
        : `https://${shop}/admin/api/2024-01/orders.json?limit=${limit}&status=any`;

      const response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.orders && data.orders.length > 0) {
        orders.push(...data.orders);
      }

      const linkHeader = response.headers.get("Link");
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(
          /<[^>]*[?&]page_info=([^>&]+)[^>]*>;\s*rel="next"/,
        );
        nextPageInfo = nextMatch ? nextMatch[1] : null;
        hasMore = !!nextPageInfo;
      } else {
        hasMore = false;
      }
    }

    if (orders.length > 0) {
      const ordersToInsert = orders.map((o) => ({
        id: String(o.id),
        userId: integration.userId,
        integrationId: integration.id,
        orderNumber: o.order_number,
        name: o.name,
        email: o.email || o.customer?.email || null,
        financialStatus: o.financial_status,
        fulfillmentStatus: o.fulfillment_status || null,
        totalPrice: o.total_price,
        currency: o.currency || "USD",
        shopifyData: o,
        createdAt: o.created_at,
        updatedAt: o.updated_at,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("ShopifyOrder")
        .upsert(ordersToInsert, { onConflict: "id" });

      if (error) throw error;
    }

    return { success: true, count: orders.length, synced: orders.length };
  } catch (error: any) {
    console.error("Error syncing orders:", error);
    return { success: false, count: 0, error: error.message };
  }
}

async function syncDiscounts(
  supabase: any,
  integration: any,
  shop: string,
  accessToken: string,
  limit: number,
) {
  try {
    const priceRules: any[] = [];
    let nextPageInfo: string | null = null;
    let hasMore = true;

    // Buscar Price Rules
    while (hasMore) {
      const url = nextPageInfo
        ? `https://${shop}/admin/api/2024-01/price_rules.json?limit=${limit}&page_info=${nextPageInfo}`
        : `https://${shop}/admin/api/2024-01/price_rules.json?limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.price_rules && data.price_rules.length > 0) {
        priceRules.push(...data.price_rules);
      }

      const linkHeader = response.headers.get("Link");
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(
          /<[^>]*[?&]page_info=([^>&]+)[^>]*>;\s*rel="next"/,
        );
        nextPageInfo = nextMatch ? nextMatch[1] : null;
        hasMore = !!nextPageInfo;
      } else {
        hasMore = false;
      }
    }

    let totalDiscountCodes = 0;

    // Para cada price rule, buscar discount codes
    for (const priceRule of priceRules) {
      // Inserir price rule
      const priceRuleToInsert = {
        id: String(priceRule.id),
        userId: integration.userId,
        integrationId: integration.id,
        title: priceRule.title,
        valueType: priceRule.value_type,
        value: priceRule.value,
        targetType: priceRule.target_type,
        targetSelection: priceRule.target_selection,
        allocationMethod: priceRule.allocation_method,
        prerequisiteSubtotalRange:
          priceRule.prerequisite_subtotal_range || null,
        prerequisiteQuantityRange:
          priceRule.prerequisite_quantity_range || null,
        prerequisiteShippingPriceRange:
          priceRule.prerequisite_shipping_price_range || null,
        prerequisiteToEntitlementQuantityRatio:
          priceRule.prerequisite_to_entitlement_quantity_ratio || null,
        entitledProductIds: priceRule.entitled_product_ids || [],
        entitledVariantIds: priceRule.entitled_variant_ids || [],
        entitledCollectionIds: priceRule.entitled_collection_ids || [],
        prerequisiteProductIds: priceRule.prerequisite_product_ids || [],
        prerequisiteVariantIds: priceRule.prerequisite_variant_ids || [],
        prerequisiteCollectionIds: priceRule.prerequisite_collection_ids || [],
        prerequisiteCustomerIds: priceRule.prerequisite_customer_ids || [],
        usageLimit: priceRule.usage_limit || null,
        oncePerCustomer: priceRule.once_per_customer || false,
        customerSelection: priceRule.customer_selection || "all",
        startsAt: priceRule.starts_at || null,
        endsAt: priceRule.ends_at || null,
        shopifyData: priceRule,
        createdAt: priceRule.created_at,
        updatedAt: priceRule.updated_at,
        lastSyncAt: new Date().toISOString(),
      };

      await supabase
        .from("ShopifyPriceRule")
        .upsert(priceRuleToInsert, { onConflict: "id" });

      // Buscar discount codes dessa price rule
      const codesUrl = `https://${shop}/admin/api/2024-01/price_rules/${priceRule.id}/discount_codes.json`;
      const codesResponse = await fetch(codesUrl, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      if (codesResponse.ok) {
        const codesData = await codesResponse.json();
        const codes = codesData.discount_codes || [];

        if (codes.length > 0) {
          const codesToInsert = codes.map((code: any) => ({
            id: String(code.id),
            userId: integration.userId,
            integrationId: integration.id,
            priceRuleId: String(priceRule.id),
            code: code.code,
            usageCount: code.usage_count || 0,
            shopifyData: code,
            createdAt: code.created_at,
            updatedAt: code.updated_at,
            lastSyncAt: new Date().toISOString(),
          }));

          await supabase
            .from("ShopifyDiscountCode")
            .upsert(codesToInsert, { onConflict: "id" });

          totalDiscountCodes += codes.length;
        }
      }
    }

    return {
      success: true,
      count: priceRules.length,
      synced: priceRules.length,
      discountCodes: totalDiscountCodes,
    };
  } catch (error: any) {
    console.error("Error syncing discounts:", error);
    return { success: false, count: 0, error: error.message };
  }
}

async function syncCustomers(
  supabase: any,
  integration: any,
  shop: string,
  accessToken: string,
  limit: number,
) {
  try {
    const customers: any[] = [];
    let nextPageInfo: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const url = nextPageInfo
        ? `https://${shop}/admin/api/2024-01/customers.json?limit=${limit}&page_info=${nextPageInfo}`
        : `https://${shop}/admin/api/2024-01/customers.json?limit=${limit}`;

      const response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.customers && data.customers.length > 0) {
        customers.push(...data.customers);
      }

      const linkHeader = response.headers.get("Link");
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(
          /<[^>]*[?&]page_info=([^>&]+)[^>]*>;\s*rel="next"/,
        );
        nextPageInfo = nextMatch ? nextMatch[1] : null;
        hasMore = !!nextPageInfo;
      } else {
        hasMore = false;
      }
    }

    if (customers.length > 0) {
      const customersToInsert = customers.map((c) => ({
        id: String(c.id),
        userId: integration.userId,
        integrationId: integration.id,
        email: c.email,
        firstName: c.first_name || null,
        lastName: c.last_name || null,
        phone: c.phone || null,
        ordersCount: c.orders_count || 0,
        totalSpent: c.total_spent || "0.00",
        shopifyData: c,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("ShopifyCustomer")
        .upsert(customersToInsert, { onConflict: "id" });

      if (error) throw error;
    }

    return { success: true, count: customers.length, synced: customers.length };
  } catch (error: any) {
    console.error("Error syncing customers:", error);
    return { success: false, count: 0, error: error.message };
  }
}

async function syncAbandonedCarts(
  supabase: any,
  integration: any,
  shop: string,
  accessToken: string,
  limit: number,
) {
  try {
    const carts: any[] = [];
    let nextPageInfo: string | null = null;
    let hasMore = true;

    while (hasMore) {
      const url = nextPageInfo
        ? `https://${shop}/admin/api/2024-01/checkouts.json?limit=${limit}&status=open&page_info=${nextPageInfo}`
        : `https://${shop}/admin/api/2024-01/checkouts.json?limit=${limit}&status=open`;

      const response = await fetch(url, {
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Shopify API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data.checkouts && data.checkouts.length > 0) {
        carts.push(...data.checkouts);
      }

      const linkHeader = response.headers.get("Link");
      if (linkHeader && linkHeader.includes('rel="next"')) {
        const nextMatch = linkHeader.match(
          /<[^>]*[?&]page_info=([^>&]+)[^>]*>;\s*rel="next"/,
        );
        nextPageInfo = nextMatch ? nextMatch[1] : null;
        hasMore = !!nextPageInfo;
      } else {
        hasMore = false;
      }
    }

    if (carts.length > 0) {
      const cartsToInsert = carts.map((cart) => ({
        id: String(cart.id),
        userId: integration.userId,
        integrationId: integration.id,
        token: cart.token,
        email: cart.email || null,
        totalPrice: cart.total_price || "0.00",
        currency: cart.currency || "USD",
        abandonedAt: cart.updated_at,
        shopifyData: cart,
        createdAt: cart.created_at,
        updatedAt: cart.updated_at,
        lastSyncAt: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from("ShopifyAbandonedCart")
        .upsert(cartsToInsert, { onConflict: "id" });

      if (error) throw error;
    }

    return { success: true, count: carts.length, synced: carts.length };
  } catch (error: any) {
    console.error("Error syncing abandoned carts:", error);
    return { success: false, count: 0, error: error.message };
  }
}
