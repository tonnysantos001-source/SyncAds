// ============================================
// SHOPIFY OAUTH - EDGE FUNCTION
// ============================================
//
// Gerencia OAuth completo com Shopify:
// ✅ Gera URL de instalação
// ✅ Valida HMAC
// ✅ Troca code por access_token
// ✅ Salva integração no banco
// ✅ Configura webhooks automaticamente
// ✅ Inicia sincronização inicial
//
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// ===== CONFIGURAÇÃO =====
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "";
const SHOPIFY_API_SECRET = Deno.env.get("SHOPIFY_API_SECRET") || "";
const SHOPIFY_SCOPES = [
  "read_products",
  "write_products",
  "read_orders",
  "write_orders",
  "read_customers",
  "write_customers",
  "read_checkouts",
  "read_inventory",
  "write_inventory",
  "read_shipping",
  "write_shipping",
  "read_content",
  "write_content",
  "read_script_tags",
  "write_script_tags",
].join(",");

const REDIRECT_URI =
  Deno.env.get("SHOPIFY_REDIRECT_URI") ||
  "https://syncads.com.br/integrations/callback";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// ===== LOGGING =====
function log(level: string, message: string, data?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  };
  console.log(JSON.stringify(logEntry));
}

// ===== VALIDAR HMAC =====
async function validateHmac(query: URLSearchParams, hmac: string): Promise<boolean> {
  try {
    // Remover hmac e signature dos params
    const params = new URLSearchParams(query);
    params.delete("hmac");
    params.delete("signature");

    // Ordenar alfabeticamente
    const sortedParams = Array.from(params.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, value]) => `${key}=${value}`)
      .join("&");

    // Calcular HMAC
    const encoder = new TextEncoder();
    const keyData = encoder.encode(SHOPIFY_API_SECRET);
    const messageData = encoder.encode(sortedParams);

    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signature = await crypto.subtle.sign("HMAC", key, messageData);
    const hashArray = Array.from(new Uint8Array(signature));
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hashHex === hmac;
  } catch (error) {
    log("error", "Error validating HMAC", { error: error.message });
    return false;
  }
}

// ===== CONFIGURAR WEBHOOKS =====
async function setupWebhooks(
  shop: string,
  accessToken: string
): Promise<any[]> {
  const webhookUrl = `${SUPABASE_URL}/functions/v1/shopify-webhook`;
  const topics = [
    "products/create",
    "products/update",
    "products/delete",
    "orders/create",
    "orders/updated",
    "orders/paid",
    "orders/cancelled",
    "orders/fulfilled",
    "checkouts/create",
    "checkouts/update",
    "customers/create",
    "customers/update",
    "inventory_levels/update",
  ];

  const results = [];

  for (const topic of topics) {
    try {
      const response = await fetch(
        `https://${shop}/admin/api/2024-01/webhooks.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            webhook: {
              topic,
              address: `${webhookUrl}?topic=${topic}`,
              format: "json",
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        results.push({
          topic,
          success: true,
          webhookId: data.webhook.id,
        });
        log("info", `Webhook configured: ${topic}`, { webhookId: data.webhook.id });
      } else {
        const errorData = await response.json();
        results.push({
          topic,
          success: false,
          error: errorData,
        });
        log("warn", `Failed to configure webhook: ${topic}`, { error: errorData });
      }
    } catch (error) {
      results.push({
        topic,
        success: false,
        error: error.message,
      });
      log("error", `Error configuring webhook: ${topic}`, { error: error.message });
    }
  }

  return results;
}

// ===== INICIAR SINCRONIZAÇÃO =====
async function startInitialSync(integrationId: string): Promise<void> {
  try {
    log("info", "Starting initial sync", { integrationId });

    const response = await fetch(`${SUPABASE_URL}/functions/v1/shopify-sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        integrationId,
        action: "sync-all",
      }),
    });

    if (response.ok) {
      log("info", "Initial sync started successfully", { integrationId });
    } else {
      const error = await response.json();
      log("warn", "Failed to start initial sync", { integrationId, error });
    }
  } catch (error) {
    log("error", "Error starting initial sync", {
      integrationId,
      error: error.message,
    });
  }
}

// ===== MAIN HANDLER =====
serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "install";

    log("info", `Shopify OAuth request: ${action}`);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ===== ACTION: INSTALL (Gerar URL de OAuth) =====
    if (action === "install") {
      const shop = url.searchParams.get("shop");

      if (!shop) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Shop parameter is required",
            hint: "Pass ?shop=your-store.myshopify.com",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Normalizar shop name
      const shopName = shop.replace(".myshopify.com", "");
      const fullShopDomain = `${shopName}.myshopify.com`;

      // Gerar state único
      const state = crypto.randomUUID();

      // Construir URL de autorização
      const authUrl =
        `https://${fullShopDomain}/admin/oauth/authorize?` +
        `client_id=${SHOPIFY_API_KEY}&` +
        `scope=${SHOPIFY_SCOPES}&` +
        `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
        `state=${state}`;

      log("info", "OAuth URL generated", { shop: fullShopDomain, state });

      return new Response(
        JSON.stringify({
          success: true,
          authUrl,
          state,
          shop: fullShopDomain,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ===== ACTION: CALLBACK (Processar OAuth) =====
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const shop = url.searchParams.get("shop");
      const hmac = url.searchParams.get("hmac");
      const state = url.searchParams.get("state");

      // Validar parâmetros
      if (!code || !shop || !hmac) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Missing required parameters",
            received: { code: !!code, shop: !!shop, hmac: !!hmac },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      log("info", "Processing OAuth callback", { shop, state });

      // Validar HMAC
      const isValidHmac = await validateHmac(url.searchParams, hmac);
      if (!isValidHmac) {
        log("error", "Invalid HMAC", { shop });
        return new Response(
          JSON.stringify({
            success: false,
            error: "Invalid HMAC signature",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      log("info", "HMAC validated successfully", { shop });

      // Trocar code por access_token
      const tokenResponse = await fetch(
        `https://${shop}/admin/oauth/access_token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            client_id: SHOPIFY_API_KEY,
            client_secret: SHOPIFY_API_SECRET,
            code,
          }),
        }
      );

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json();
        log("error", "Failed to get access token", { shop, error });
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to obtain access token",
            details: error,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { access_token, scope } = await tokenResponse.json();
      log("info", "Access token obtained", { shop, scope });

      // Obter informações da loja
      const shopResponse = await fetch(
        `https://${shop}/admin/api/2024-01/shop.json`,
        {
          headers: {
            "X-Shopify-Access-Token": access_token,
            "Content-Type": "application/json",
          },
        }
      );

      if (!shopResponse.ok) {
        log("error", "Failed to get shop info", { shop });
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to get shop information",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { shop: shopData } = await shopResponse.json();
      log("info", "Shop info retrieved", {
        shop: shopData.name,
        domain: shopData.domain,
      });

      // Obter usuário autenticado
      const authHeader = req.headers.get("Authorization");
      let userId = null;
      let organizationId = null;

      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(
          authHeader.replace("Bearer ", "")
        );
        userId = user?.id;
        organizationId = user?.user_metadata?.organizationId;
      }

      // Se não houver usuário, tentar pegar do query param
      if (!userId) {
        userId = url.searchParams.get("userId");
        organizationId = url.searchParams.get("organizationId");
      }

      if (!userId || !organizationId) {
        log("error", "User not authenticated", { shop });
        return new Response(
          JSON.stringify({
            success: false,
            error: "User authentication required",
            hint: "Please login first",
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Salvar integração no banco
      const { data: integration, error: integrationError } = await supabase
        .from("ShopifyIntegration")
        .upsert(
          {
            organizationId,
            userId,
            shopName: shop.replace(".myshopify.com", ""),
            shopDomain: shopData.domain,
            shopEmail: shopData.email,
            accessToken: access_token,
            scope: scope,
            isActive: true,
            isTestMode: shopData.plan_name === "trial" || shopData.plan_name === "affiliate",
            metadata: {
              shopData: {
                name: shopData.name,
                currency: shopData.currency,
                timezone: shopData.timezone,
                plan: shopData.plan_name,
              },
            },
            updatedAt: new Date().toISOString(),
          },
          {
            onConflict: "organizationId,shopName",
          }
        )
        .select()
        .single();

      if (integrationError) {
        log("error", "Failed to save integration", {
          shop,
          error: integrationError,
        });
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to save integration",
            details: integrationError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      log("info", "Integration saved", { integrationId: integration.id });

      // Configurar webhooks
      const webhookResults = await setupWebhooks(shop, access_token);
      const webhooksConfigured = webhookResults.filter((r) => r.success).length;

      // Atualizar status de webhooks
      await supabase
        .from("ShopifyIntegration")
        .update({
          webhooksConfigured: webhooksConfigured > 0,
          metadata: {
            ...integration.metadata,
            webhooks: webhookResults,
          },
        })
        .eq("id", integration.id);

      log("info", `Webhooks configured: ${webhooksConfigured}/${webhookResults.length}`);

      // Iniciar sincronização inicial (não aguardar)
      startInitialSync(integration.id);

      const duration = Date.now() - startTime;

      return new Response(
        JSON.stringify({
          success: true,
          message: "Shopify connected successfully!",
          integration: {
            id: integration.id,
            shop: shopData.name,
            domain: shopData.domain,
            plan: shopData.plan_name,
            webhooksConfigured,
            syncStarted: true,
          },
          duration,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ===== ACTION: STATUS (Verificar integração) =====
    if (action === "status") {
      const shop = url.searchParams.get("shop");
      const userId = url.searchParams.get("userId");

      if (!shop || !userId) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Shop and userId parameters required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { data: integration, error } = await supabase
        .from("ShopifyIntegration")
        .select("*")
        .eq("userId", userId)
        .eq("shopName", shop.replace(".myshopify.com", ""))
        .eq("isActive", true)
        .single();

      if (error || !integration) {
        return new Response(
          JSON.stringify({
            success: false,
            connected: false,
            message: "No active integration found",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          connected: true,
          integration: {
            shop: integration.shopName,
            domain: integration.shopDomain,
            lastSync: integration.lastSyncAt,
            webhooksConfigured: integration.webhooksConfigured,
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ===== ACTION: DISCONNECT =====
    if (action === "disconnect") {
      const userId = url.searchParams.get("userId");
      const shop = url.searchParams.get("shop");

      if (!userId || !shop) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "UserId and shop parameters required",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { error } = await supabase
        .from("ShopifyIntegration")
        .update({ isActive: false, updatedAt: new Date().toISOString() })
        .eq("userId", userId)
        .eq("shopName", shop.replace(".myshopify.com", ""));

      if (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Failed to disconnect",
            details: error.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Shopify disconnected successfully",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Action inválida
    return new Response(
      JSON.stringify({
        success: false,
        error: "Invalid action",
        validActions: ["install", "callback", "status", "disconnect"],
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    const duration = Date.now() - startTime;
    log("error", "Fatal error in shopify-oauth", {
      error: error.message,
      stack: error.stack,
      duration,
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Internal server error",
        code: "SHOPIFY_OAUTH_ERROR",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
