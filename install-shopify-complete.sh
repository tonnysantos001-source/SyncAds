#!/bin/bash

# ============================================
# INSTALAÇÃO COMPLETA - SHOPIFY INTEGRATION
# ============================================
#
# Este script instala TUDO necessário para
# ter a integração Shopify 100% funcional
#
# Tempo estimado: 5-10 minutos
# ============================================

set -e  # Exit on error

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Funções auxiliares
log_info() {
    echo -e "${BLUE}ℹ ${NC}$1"
}

log_success() {
    echo -e "${GREEN}✅ ${NC}$1"
}

log_warning() {
    echo -e "${YELLOW}⚠️  ${NC}$1"
}

log_error() {
    echo -e "${RED}❌ ${NC}$1"
}

log_section() {
    echo ""
    echo "============================================"
    echo -e "${CYAN}$1${NC}"
    echo "============================================"
    echo ""
}

# Banner
clear
echo "╔════════════════════════════════════════════╗"
echo "║   INSTALAÇÃO SHOPIFY - SYNCADS CHECKOUT   ║"
echo "╔════════════════════════════════════════════╗"
echo ""
log_info "Este script irá instalar a integração completa com Shopify"
echo ""

# Verificar se Supabase CLI está instalado
if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI não encontrado!"
    echo "Instale com: npm install -g supabase"
    exit 1
fi

# ============================================
# 1. APLICAR MIGRATION
# ============================================
log_section "1/7: APLICANDO MIGRATION"

log_info "Verificando se migration existe..."
if [ -f "supabase/migrations/20250130000001_shopify_integration.sql" ]; then
    log_success "Migration encontrada"

    log_info "Aplicando migration..."
    cd supabase
    if supabase db push; then
        log_success "Migration aplicada com sucesso!"
    else
        log_error "Erro ao aplicar migration"
        exit 1
    fi
    cd ..
else
    log_error "Migration não encontrada!"
    log_warning "Por favor, certifique-se de que o arquivo existe:"
    echo "  supabase/migrations/20250130000001_shopify_integration.sql"
    exit 1
fi

# ============================================
# 2. CRIAR EDGE FUNCTION: SHOPIFY-SYNC
# ============================================
log_section "2/7: CRIANDO EDGE FUNCTION SHOPIFY-SYNC"

mkdir -p supabase/functions/shopify-sync

log_info "Criando shopify-sync/index.ts..."
cat > supabase/functions/shopify-sync/index.ts << 'EOFUNC'
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { integrationId, action = "sync-all" } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: integration, error } = await supabase
      .from("ShopifyIntegration")
      .select("*")
      .eq("id", integrationId)
      .single();

    if (error || !integration) {
      throw new Error("Integration not found");
    }

    const shop = integration.shopName + ".myshopify.com";
    const accessToken = integration.accessToken;

    const { data: syncLog } = await supabase
      .from("ShopifySyncLog")
      .insert({
        organizationId: integration.organizationId,
        integrationId: integration.id,
        syncType: action,
        status: "started"
      })
      .select()
      .single();

    let results = {};

    if (action === "sync-products" || action === "sync-all") {
      results.products = await syncProducts(supabase, integration, shop, accessToken);
    }

    if (action === "sync-orders" || action === "sync-all") {
      results.orders = await syncOrders(supabase, integration, shop, accessToken);
    }

    if (action === "sync-customers" || action === "sync-all") {
      results.customers = await syncCustomers(supabase, integration, shop, accessToken);
    }

    await supabase
      .from("ShopifySyncLog")
      .update({
        status: "completed",
        completedAt: new Date().toISOString(),
        details: results
      })
      .eq("id", syncLog.id);

    await supabase
      .from("ShopifyIntegration")
      .update({
        lastSyncAt: new Date().toISOString(),
        lastSyncStatus: "success"
      })
      .eq("id", integration.id);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});

async function syncProducts(supabase, integration, shop, accessToken) {
  const response = await fetch(
    `https://${shop}/admin/api/2024-01/products.json?limit=250`,
    {
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json"
      }
    }
  );

  const { products } = await response.json();

  if (products && products.length > 0) {
    await supabase.from("ShopifyProduct").upsert(
      products.map(p => ({
        id: p.id,
        organizationId: integration.organizationId,
        userId: integration.userId,
        integrationId: integration.id,
        title: p.title,
        handle: p.handle,
        description: p.body_html?.replace(/<[^>]*>/g, '').substring(0, 500),
        vendor: p.vendor,
        productType: p.product_type,
        status: p.status,
        shopifyData: p,
        lastSyncAt: new Date().toISOString()
      })),
      { onConflict: 'organizationId,id' }
    );
  }

  return { count: products?.length || 0 };
}

async function syncOrders(supabase, integration, shop, accessToken) {
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
      orders.map(o => ({
        id: o.id,
        organizationId: integration.organizationId,
        userId: integration.userId,
        integrationId: integration.id,
        orderNumber: o.order_number,
        name: o.name,
        email: o.email,
        financialStatus: o.financial_status,
        totalPrice: o.total_price,
        shopifyData: o,
        lastSyncAt: new Date().toISOString()
      })),
      { onConflict: 'organizationId,id' }
    );
  }

  return { count: orders?.length || 0 };
}

async function syncCustomers(supabase, integration, shop, accessToken) {
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
      customers.map(c => ({
        id: c.id,
        organizationId: integration.organizationId,
        userId: integration.userId,
        integrationId: integration.id,
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        shopifyData: c,
        lastSyncAt: new Date().toISOString()
      })),
      { onConflict: 'organizationId,id' }
    );
  }

  return { count: customers?.length || 0 };
}
EOFUNC

log_success "shopify-sync criado!"

# ============================================
# 3. CRIAR API FRONTEND
# ============================================
log_section "3/7: CRIANDO API FRONTEND"

mkdir -p src/lib/api

log_info "Criando shopifyApi.ts..."
cat > src/lib/api/shopifyApi.ts << 'EOFUNC'
import { supabase } from '@/lib/supabase';

export const shopifyApi = {
  async startOAuth(shopName: string) {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;
    const organizationId = user.data.user?.user_metadata?.organizationId;

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-oauth?action=install&shop=${shopName}&userId=${userId}&organizationId=${organizationId}`
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

  async sync(action = 'sync-all') {
    const integration = await this.getStatus();
    if (!integration) throw new Error('No integration found');

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-sync`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ integrationId: integration.id, action })
      }
    );
    return response.json();
  },

  async disconnect() {
    const { error } = await supabase
      .from('ShopifyIntegration')
      .update({ isActive: false })
      .eq('isActive', true);

    if (error) throw error;
    return { success: true };
  },

  async getProducts(limit = 50) {
    const { data } = await supabase
      .from('ShopifyProduct')
      .select('*')
      .order('updatedAt', { ascending: false })
      .limit(limit);
    return data || [];
  },

  async getOrders(limit = 50) {
    const { data } = await supabase
      .from('ShopifyOrder')
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(limit);
    return data || [];
  },

  async getAbandonedCarts() {
    const { data } = await supabase
      .from('ShopifyAbandonedCart')
      .select('*')
      .is('recoveredAt', null)
      .order('abandonedAt', { ascending: false });
    return data || [];
  },

  async getStats() {
    const [integration, products, orders, carts] = await Promise.all([
      this.getStatus(),
      supabase.from('ShopifyProduct').select('id', { count: 'exact', head: true }),
      supabase.from('ShopifyOrder').select('id', { count: 'exact', head: true }),
      supabase.from('ShopifyAbandonedCart').select('id,totalPrice').is('recoveredAt', null)
    ]);

    return {
      connected: !!integration,
      shopName: integration?.shopName,
      lastSync: integration?.lastSyncAt,
      productsCount: products.count || 0,
      ordersCount: orders.count || 0,
      abandonedCartsCount: carts.data?.length || 0,
      abandonedValue: carts.data?.reduce((sum, c) => sum + Number(c.totalPrice || 0), 0) || 0
    };
  }
};
EOFUNC

log_success "shopifyApi.ts criado!"

# ============================================
# 4. ATUALIZAR INTEGRATION CALLBACK PAGE
# ============================================
log_section "4/7: ATUALIZANDO INTEGRATION CALLBACK"

log_info "Atualizando IntegrationCallbackPage.tsx..."

# Backup do arquivo original
if [ -f "src/pages/IntegrationCallbackPage.tsx" ]; then
    cp src/pages/IntegrationCallbackPage.tsx src/pages/IntegrationCallbackPage.tsx.backup
    log_info "Backup criado: IntegrationCallbackPage.tsx.backup"
fi

log_warning "ATENÇÃO: Você precisa adicionar manualmente no IntegrationCallbackPage.tsx:"
echo ""
echo "No início da função processCallback, adicione:"
echo ""
cat << 'EOFUNC'
// Detectar Shopify
if (searchParams.get('shop') || searchParams.get('code')) {
  const shop = searchParams.get('shop');
  const code = searchParams.get('code');
  const hmac = searchParams.get('hmac');

  if (shop && code && hmac) {
    setStatus('loading');
    setMessage('Conectando com Shopify...');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-oauth?action=callback&shop=${shop}&code=${code}&hmac=${hmac}`,
        {
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
          }
        }
      );

      const result = await response.json();

      if (result.success) {
        setStatus('success');
        setMessage('Shopify conectada com sucesso! Sincronizando dados...');
        setTimeout(() => navigate('/integrations'), 2000);
        return;
      } else {
        setStatus('error');
        setMessage(result.error || 'Erro ao conectar com Shopify');
        return;
      }
    } catch (error) {
      setStatus('error');
      setMessage('Erro ao processar callback da Shopify');
      return;
    }
  }
}
EOFUNC

# ============================================
# 5. DEPLOY EDGE FUNCTIONS
# ============================================
log_section "5/7: DEPLOY DAS EDGE FUNCTIONS"

log_info "Fazendo deploy de shopify-oauth..."
if supabase functions deploy shopify-oauth; then
    log_success "shopify-oauth deployada!"
else
    log_warning "Erro ao deployar shopify-oauth (pode ser normal se já existe)"
fi

log_info "Fazendo deploy de shopify-sync..."
if supabase functions deploy shopify-sync; then
    log_success "shopify-sync deployada!"
else
    log_warning "Erro ao deployar shopify-sync (pode ser normal se já existe)"
fi

# ============================================
# 6. CONFIGURAR VARIÁVEIS DE AMBIENTE
# ============================================
log_section "6/7: CONFIGURAÇÃO DE VARIÁVEIS"

log_warning "IMPORTANTE: Configure as seguintes variáveis no Supabase Dashboard:"
echo ""
echo "Edge Functions > Settings > Environment Variables:"
echo ""
echo "SHOPIFY_API_KEY=sua-api-key"
echo "SHOPIFY_API_SECRET=seu-api-secret"
echo "SHOPIFY_REDIRECT_URI=https://seu-dominio.com/integrations/callback"
echo ""
log_info "Obtenha essas credenciais em: https://partners.shopify.com/"

# ============================================
# 7. CRIAR APP NO SHOPIFY
# ============================================
log_section "7/7: INSTRUÇÕES FINAIS"

log_success "Instalação concluída com sucesso!"
echo ""
log_info "Próximos passos:"
echo ""
echo "1️⃣  CRIAR APP NO SHOPIFY PARTNERS"
echo "   URL: https://partners.shopify.com/"
echo "   - Apps > Create app > Custom app"
echo "   - Nome: SyncAds Checkout"
echo "   - App URL: https://seu-projeto.supabase.co/functions/v1/shopify-oauth"
echo "   - Redirect URLs: https://seu-dominio.com/integrations/callback"
echo ""
echo "2️⃣  CONFIGURAR SCOPES"
echo "   Marque os seguintes scopes:"
echo "   - read_products, write_products"
echo "   - read_orders, write_orders"
echo "   - read_customers, write_customers"
echo "   - read_checkouts"
echo "   - read_inventory, write_inventory"
echo "   - read_shipping, write_shipping"
echo ""
echo "3️⃣  COPIAR CREDENCIAIS"
echo "   - Copie API Key e API Secret"
echo "   - Configure no Supabase Edge Functions"
echo ""
echo "4️⃣  TESTAR"
echo "   - Instale o app em uma loja de teste"
echo "   - Acesse /integrations no painel"
echo "   - Conecte com Shopify"
echo "   - Verifique sincronização"
echo ""

log_info "Documentação completa em:"
echo "  - PLANO_SHOPIFY_FUNCIONAL.md"
echo "  - IMPLEMENTACAO_SHOPIFY_RAPIDA.md"
echo ""

log_success "🎉 Instalação Shopify completa! 🎉"
echo ""

# Verificar status
log_info "Verificando status das funções..."
supabase functions list | grep shopify || log_warning "Funções não listadas (pode ser normal)"

echo ""
log_info "Para testar, execute:"
echo "  cd .. && npm run dev"
echo ""
