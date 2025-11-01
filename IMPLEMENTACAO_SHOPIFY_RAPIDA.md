# 🚀 IMPLEMENTAÇÃO RÁPIDA - SHOPIFY FUNCIONAL

**Tempo estimado:** 2-3 horas  
**Status:** Pronto para implementar  
**Data:** 30 de Janeiro de 2025

---

## ⚡ EXECUÇÃO RÁPIDA (COPIAR E COLAR)

### 1. APLICAR MIGRATION (5 min)

```bash
cd supabase
supabase db push
```

### 2. CRIAR EDGE FUNCTIONS (30 min)

#### 2.1. shopify-oauth/index.ts

```bash
mkdir -p supabase/functions/shopify-oauth
```

Crie o arquivo `supabase/functions/shopify-oauth/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";
import { createHmac } from "https://deno.land/std@0.168.0/node/crypto.ts";

// Configuração
const SHOPIFY_API_KEY = Deno.env.get("SHOPIFY_API_KEY") || "";
const SHOPIFY_API_SECRET = Deno.env.get("SHOPIFY_API_SECRET") || "";
const SHOPIFY_SCOPES = "read_products,write_products,read_orders,write_orders,read_customers,write_customers,read_checkouts,read_inventory,write_inventory,read_shipping,write_shipping";
const REDIRECT_URI = Deno.env.get("SHOPIFY_REDIRECT_URI") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "install";
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // ===== INSTALL (Gerar URL OAuth) =====
    if (action === "install") {
      const shop = url.searchParams.get("shop");
      if (!shop) {
        return new Response(JSON.stringify({ error: "Shop parameter required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      const state = crypto.randomUUID();
      const authUrl = `https://${shop}/admin/oauth/authorize?` +
        `client_id=${SHOPIFY_API_KEY}&` +
        `scope=${SHOPIFY_SCOPES}&` +
        `redirect_uri=${REDIRECT_URI}&` +
        `state=${state}`;

      return new Response(JSON.stringify({ 
        success: true,
        authUrl,
        state 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // ===== CALLBACK (Processar OAuth) =====
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const shop = url.searchParams.get("shop");
      const hmac = url.searchParams.get("hmac");
      
      if (!code || !shop || !hmac) {
        return new Response(JSON.stringify({ error: "Missing parameters" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Validar HMAC
      const params = new URLSearchParams(url.search);
      params.delete("hmac");
      const message = params.toString();
      const hash = createHmac("sha256", SHOPIFY_API_SECRET)
        .update(message)
        .digest("hex");

      if (hash !== hmac) {
        return new Response(JSON.stringify({ error: "Invalid HMAC" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }

      // Trocar code por access_token
      const tokenResponse = await fetch(`https://${shop}/admin/oauth/access_token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: SHOPIFY_API_KEY,
          client_secret: SHOPIFY_API_SECRET,
          code
        })
      });

      const { access_token, scope } = await tokenResponse.json();

      // Obter info da loja
      const shopResponse = await fetch(`https://${shop}/admin/api/2024-01/shop.json`, {
        headers: {
          "X-Shopify-Access-Token": access_token,
          "Content-Type": "application/json"
        }
      });
      const { shop: shopData } = await shopResponse.json();

      // Salvar no banco
      const { data: user } = await supabase.auth.getUser();
      const userId = user?.user?.id;

      const { data: integration, error } = await supabase
        .from("ShopifyIntegration")
        .upsert({
          organizationId: user?.user?.user_metadata?.organizationId,
          userId,
          shopName: shop.replace(".myshopify.com", ""),
          shopDomain: shopData.domain,
          shopEmail: shopData.email,
          accessToken: access_token,
          scope,
          isActive: true,
          isTestMode: shopData.plan_name === "trial",
          updatedAt: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Configurar webhooks
      await setupWebhooks(shop, access_token);

      // Iniciar sync
      await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/shopify-sync?action=sync-all`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ integrationId: integration.id })
      });

      return new Response(JSON.stringify({ 
        success: true,
        message: "Shopify conectada com sucesso!",
        integration 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function setupWebhooks(shop: string, accessToken: string) {
  const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/shopify-webhook`;
  const topics = [
    "products/create", "products/update", "products/delete",
    "orders/create", "orders/updated", "orders/paid", "orders/cancelled",
    "checkouts/create", "checkouts/update",
    "customers/create", "customers/update"
  ];

  for (const topic of topics) {
    try {
      await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
        method: "POST",
        headers: {
          "X-Shopify-Access-Token": accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: webhookUrl,
            format: "json"
          }
        })
      });
    } catch (error) {
      console.error(`Failed to setup webhook ${topic}:`, error);
    }
  }
}
```

#### 2.2. shopify-sync/index.ts

```bash
mkdir -p supabase/functions/shopify-sync
```

Crie o arquivo `supabase/functions/shopify-sync/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { integrationId, action } = await req.json();
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Buscar integração
    const { data: integration, error } = await supabase
      .from("ShopifyIntegration")
      .select("*")
      .eq("id", integrationId)
      .single();

    if (error || !integration) {
      throw new Error("Integration not found");
    }

    const shop = `${integration.shopName}.myshopify.com`;
    const accessToken = integration.accessToken;

    // Criar log de sync
    const { data: syncLog } = await supabase
      .from("ShopifySyncLog")
      .insert({
        organizationId: integration.organizationId,
        integrationId: integration.id,
        syncType: action || "all",
        status: "started"
      })
      .select()
      .single();

    let results = {};

    // Sincronizar baseado na ação
    if (action === "sync-products" || action === "sync-all") {
      results.products = await syncProducts(supabase, integration, shop, accessToken);
    }

    if (action === "sync-orders" || action === "sync-all") {
      results.orders = await syncOrders(supabase, integration, shop, accessToken);
    }

    if (action === "sync-customers" || action === "sync-all") {
      results.customers = await syncCustomers(supabase, integration, shop, accessToken);
    }

    if (action === "sync-collections" || action === "sync-all") {
      results.collections = await syncCollections(supabase, integration, shop, accessToken);
    }

    if (action === "abandoned-carts" || action === "sync-all") {
      results.abandonedCarts = await syncAbandonedCarts(supabase, integration, shop, accessToken);
    }

    // Atualizar log
    await supabase
      .from("ShopifySyncLog")
      .update({
        status: "completed",
        completedAt: new Date().toISOString(),
        details: results
      })
      .eq("id", syncLog.id);

    // Atualizar integração
    await supabase
      .from("ShopifyIntegration")
      .update({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: "success"
      })
      .eq("id", integration.id);

    return new Response(JSON.stringify({ 
      success: true,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function syncProducts(supabase: any, integration: any, shop: string, accessToken: string) {
  const products: any[] = [];
  let hasNextPage = true;
  let pageInfo = null;

  while (hasNextPage) {
    const url = pageInfo 
      ? `https://${shop}/admin/api/2024-01/products.json?limit=250&page_info=${pageInfo}`
      : `https://${shop}/admin/api/2024-01/products.json?limit=250`;

    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    });

    const data = await response.json();
    products.push(...data.products);

    const linkHeader = response.headers.get("Link");
    if (linkHeader) {
      const nextMatch = linkHeader.match(/<[^>]*page_info=([^&>]+)/);
      pageInfo = nextMatch ? nextMatch[1] : null;
      hasNextPage = !!pageInfo;
    } else {
      hasNextPage = false;
    }
  }

  // Salvar produtos
  if (products.length > 0) {
    await supabase.from("ShopifyProduct").upsert(
      products.map(p => ({
        id: p.id,
        organizationId: integration.organizationId,
        userId: integration.userId,
        integrationId: integration.id,
        title: p.title,
        handle: p.handle,
        description: p.body_html?.replace(/<[^>]*>/g, '').substring(0, 500),
        bodyHtml: p.body_html,
        vendor: p.vendor,
        productType: p.product_type,
        tags: p.tags ? p.tags.split(',').map((t: string) => t.trim()) : [],
        status: p.status,
        publishedAt: p.published_at,
        images: p.images,
        featuredImage: p.images?.[0]?.src,
        variantsCount: p.variants?.length || 0,
        options: p.options,
        shopifyData: p,
        lastSyncAt: new Date().toISOString()
      })),
      { onConflict: 'organizationId,id' }
    );

    // Salvar variantes
    const variants = products.flatMap(p => 
      p.variants?.map((v: any) => ({
        id: v.id,
        productId: p.id,
        organizationId: integration.organizationId,
        title: v.title,
        sku: v.sku,
        barcode: v.barcode,
        price: v.price,
        compareAtPrice: v.compare_at_price,
        inventoryQuantity: v.inventory_quantity,
        weight: v.weight,
        weightUnit: v.weight_unit,
        requiresShipping: v.requires_shipping,
        taxable: v.taxable,
        option1: v.option1,
        option2: v.option2,
        option3: v.option3,
        position: v.position,
        imageId: v.image_id,
        shopifyData: v
      })) || []
    );

    if (variants.length > 0) {
      await supabase.from("ShopifyProductVariant").upsert(variants, { onConflict: 'id' });
    }
  }

  return { count: products.length };
}

async function syncOrders(supabase: any, integration: any, shop: string, accessToken: string) {
  const response = await fetch(
    `https://${shop}/admin/api/2024-01/orders.json?limit=250&status=any`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    }
  );

  const { orders } = await response.json();

  if (orders && orders.length > 0) {
    await supabase.from("ShopifyOrder").upsert(
      orders.map((o: any) => ({
        id: o.id,
        organizationId: integration.organizationId,
        userId: integration.userId,
        integrationId: integration.id,
        orderNumber: o.order_number,
        name: o.name,
        email: o.email,
        phone: o.phone,
        financialStatus: o.financial_status,
        fulfillmentStatus: o.fulfillment_status,
        totalPrice: o.total_price,
        subtotalPrice: o.subtotal_price,
        totalTax: o.total_tax,
        totalDiscounts: o.total_discounts,
        totalShipping: o.total_shipping_price_set?.shop_money?.amount || 0,
        currency: o.currency,
        customerId: o.customer?.id,
        customerData: o.customer,
        shippingAddress: o.shipping_address,
        billingAddress: o.billing_address,
        lineItems: o.line_items,
        lineItemsCount: o.line_items?.length || 0,
        tags: o.tags ? o.tags.split(',').map((t: string) => t.trim()) : [],
        shopifyData: o,
        lastSyncAt: new Date().toISOString()
      })),
      { onConflict: 'organizationId,id' }
    );
  }

  return { count: orders?.length || 0 };
}

async function syncCustomers(supabase: any, integration: any, shop: string, accessToken: string) {
  const response = await fetch(
    `https://${shop}/admin/api/2024-01/customers.json?limit=250`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    }
  );

  const { customers } = await response.json();

  if (customers && customers.length > 0) {
    await supabase.from("ShopifyCustomer").upsert(
      customers.map((c: any) => ({
        id: c.id,
        organizationId: integration.organizationId,
        userId: integration.userId,
        integrationId: integration.id,
        email: c.email,
        phone: c.phone,
        firstName: c.first_name,
        lastName: c.last_name,
        state: c.state,
        verifiedEmail: c.verified_email,
        acceptsMarketing: c.accepts_marketing,
        ordersCount: c.orders_count,
        totalSpent: c.total_spent,
        tags: c.tags ? c.tags.split(',').map((t: string) => t.trim()) : [],
        shopifyData: c,
        lastSyncAt: new Date().toISOString()
      })),
      { onConflict: 'organizationId,id' }
    );
  }

  return { count: customers?.length || 0 };
}

async function syncCollections(supabase: any, integration: any, shop: string, accessToken: string) {
  const response = await fetch(
    `https://${shop}/admin/api/2024-01/custom_collections.json?limit=250`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    }
  );

  const { custom_collections } = await response.json();

  if (custom_collections && custom_collections.length > 0) {
    await supabase.from("ShopifyCollection").upsert(
      custom_collections.map((c: any) => ({
        id: c.id,
        organizationId: integration.organizationId,
        userId: integration.userId,
        integrationId: integration.id,
        title: c.title,
        handle: c.handle,
        description: c.body_html?.replace(/<[^>]*>/g, '').substring(0, 500),
        bodyHtml: c.body_html,
        collectionType: 'custom',
        publishedAt: c.published_at,
        image: c.image,
        shopifyData: c,
        lastSyncAt: new Date().toISOString()
      })),
      { onConflict: 'organizationId,id' }
    );
  }

  return { count: custom_collections?.length || 0 };
}

async function syncAbandonedCarts(supabase: any, integration: any, shop: string, accessToken: string) {
  const response = await fetch(
    `https://${shop}/admin/api/2024-01/checkouts.json?limit=250&status=open`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    }
  );

  const { checkouts } = await response.json();

  if (checkouts && checkouts.length > 0) {
    await supabase.from("ShopifyAbandonedCart").upsert(
      checkouts.map((c: any) => ({
        id: c.id,
        organizationId: integration.organizationId,
        userId: integration.userId,
        integrationId: integration.id,
        email: c.email,
        phone: c.phone,
        token: c.token,
        cartToken: c.cart_token,
        totalPrice: c.total_price,
        subtotalPrice: c.subtotal_price,
        totalTax: c.total_tax,
        currency: c.currency,
        lineItems: c.line_items,
        lineItemsCount: c.line_items?.length || 0,
        abandonedCheckoutUrl: c.abandoned_checkout_url,
        abandonedAt: c.updated_at,
        shopifyData: c
      })),
      { onConflict: 'organizationId,id' }
    );
  }

  return { count: checkouts?.length || 0 };
}
```

### 3. DEPLOY EDGE FUNCTIONS (5 min)

```bash
supabase functions deploy shopify-oauth
supabase functions deploy shopify-sync
```

### 4. CONFIGURAR VARIÁVEIS DE AMBIENTE

No Supabase Dashboard > Edge Functions > Settings:

```env
SHOPIFY_API_KEY=sua-api-key-aqui
SHOPIFY_API_SECRET=seu-api-secret-aqui
SHOPIFY_REDIRECT_URI=https://seu-dominio.com/integrations/callback
```

### 5. CRIAR APP NO SHOPIFY PARTNERS (10 min)

1. Acesse: https://partners.shopify.com/
2. Apps > Create app > Custom app
3. App name: "SyncAds Checkout"
4. App URL: `https://seu-projeto.supabase.co/functions/v1/shopify-oauth`
5. Allowed redirection URL(s): `https://seu-dominio.com/integrations/callback`
6. API access scopes: (marcar todos mencionados no código)
7. Copiar API key e API secret
8. Salvar nas variáveis de ambiente

### 6. ATUALIZAR FRONTEND (30 min)

#### 6.1. Criar shopifyApi.ts

Arquivo: `src/lib/api/shopifyApi.ts`

```typescript
import { supabase } from '@/lib/supabase';

export const shopifyApi = {
  async startOAuth(shopName: string) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-oauth?action=install&shop=${shopName}.myshopify.com`
    );
    return response.json();
  },

  async getStatus() {
    const { data } = await supabase
      .from('ShopifyIntegration')
      .select('*')
      .eq('isActive', true)
      .single();
    return data;
  },

  async sync(action: string) {
    const integration = await this.getStatus();
    if (!integration) throw new Error('No integration found');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-sync`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ integrationId: integration.id, action })
      }
    );
    return response.json();
  },

  async getProducts(limit = 50) {
    const { data } = await supabase
      .from('ShopifyProduct')
      .select('*')
      .order('updatedAt', { ascending: false })
      .limit(limit);
    return data;
  },

  async getOrders(limit = 50) {
    const { data } = await supabase
      .from('ShopifyOrder')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit);
    return data;
  },

  async getAbandonedCarts() {
    const { data } = await supabase
      .from('ShopifyAbandonedCart')
      .select('*')
      .is('recoveredAt', null)
      .order('abandonedAt', { ascending: false });
    return data;
  },

  async getStats() {
    const [integration, products, orders, carts] = await Promise.all([
      this.getStatus(),
      supabase.from('ShopifyProduct').select('id', { count: 'exact', head: true }),
      supabase.from('ShopifyOrder').select('id', { count: 'exact', head: true }),
      supabase.from('ShopifyAbandonedCart').select('id,totalPrice', { count: 'exact' }).is('recoveredAt', null)
    ]);

    return {
      connected: !!integration,
      lastSync: integration?.lastSyncAt,
      productsCount: products.count || 0,
      ordersCount: orders.count || 0,
      abandonedCartsCount: carts.count || 0,
      abandonedValue: carts.data?.reduce((sum, c) => sum + Number(c.totalPrice || 0), 0) || 0
    };
  }
};
```

#### 6.2. Atualizar IntegrationCallbackPage

Arquivo: `src/pages/IntegrationCallbackPage.tsx`

Adicione no início da função `processCallback`:

```typescript
// Detectar Shopify
if (state?.includes('shopify') || searchParams.get('shop')) {
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  
  if (shop && code) {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-oauth?action=callback&shop=${shop}&code=${code}&hmac=${searchParams.get('hmac')}`
    );
    
    const result = await response.json();
    
    if (result.success) {
      setStatus('success');
      setMessage('Shopify conectada com sucesso! Sincronizando dados...');
      setTimeout(() => navigate('/shopify'), 2000);
      return;
    }
  }
}
```

### 7. TESTAR (10 min)

```bash
# 1. Verificar se migration foi aplicada
supabase db execute "SELECT COUNT(*) FROM \"ShopifyIntegration\""

# 2. Verificar edge functions
supabase functions list

# 3. Testar OAuth
# Abra: https://seu-dominio.com/integrations
# Clique em Shopify > Conectar
# Cole o nome da loja (sem .myshopify.com)
```

---

## ✅ CHECKLIST RÁPIDO

- [ ] Migration aplicada (`supabase db push`)
- [ ] Edge functions criadas e deployadas
- [ ] Variáveis de ambiente configuradas
- [ ] App criado no Shopify Partners
- [ ] API Key e Secret salvos
- [ ] Frontend atualizado
- [ ] Testado em loja de desenvolvimento
- [ ] Webhooks recebendo eventos
- [ ] Dados sincronizando
- [ ] Dashboard mostrando informações

---

## 🆘 TROUBLESHOOTING

### Erro: "Invalid HMAC"
- Verifique o SHOPIFY_API_SECRET
- Confirme que não há espaços extras

### Erro: "Shop parameter required"
- Certifique-se de passar o nome da loja sem .myshopify.com

### Produtos não sincronizam
- Verifique os scopes do app
- Confirme que tem produtos na loja
- Veja logs: `supabase functions logs shopify-sync`

### Webhooks não recebem
- Confirme que a URL está correta
- Verifique se a função está deployada
- Teste manualmente via Postman

---

## 📚 PRÓXIMOS PASSOS

Após ter Shopify funcionando:

1. **Implementar Dashboard Shopify**
   - Página dedicada com métricas
   - Lista de produtos
   - Carrinhos abandonados

2. **Recuperação de Carrinhos**
   - Email automático
   - Link de recuperação
   - Tracking

3. **Outras Plataformas**
   - VTEX (mesmo padrão)
   - Nuvemshop
   - WooCommerce

---

**Tempo total:** ~2-3 horas  
**Resultado:** Shopify 100% funcional! 🎉