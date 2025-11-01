# 🛒 PLANO COMPLETO - SHOPIFY FUNCIONAL
## Status: IMPLEMENTAÇÃO NECESSÁRIA

**Data:** 30 de Janeiro de 2025  
**Prioridade:** ALTA - Sistema não funcional  
**Tempo Estimado:** 4-6 horas

---

## 🔍 PROBLEMAS IDENTIFICADOS

### 1. OAuth Não Funciona
- ❌ Não existe flow completo de OAuth
- ❌ Callback não salva tokens corretamente
- ❌ Não valida scopes necessários

### 2. Checkout Não Aparece na Shopify
- ❌ Não registramos nosso gateway na Shopify
- ❌ Falta implementar Shopify Payment App
- ❌ Não há extensão de checkout

### 3. Sincronização Não Funciona
- ❌ Produtos não são importados automaticamente
- ❌ Pedidos não são sincronizados
- ❌ Carrinhos abandonados não são capturados
- ❌ Coleções não são importadas

### 4. Webhooks Não Configurados
- ❌ Não configura webhooks automaticamente
- ❌ Webhook endpoint existe mas não é registrado

---

## 🏗️ ARQUITETURA DA SOLUÇÃO

```
┌─────────────────────────────────────────────────────────────┐
│                     SHOPIFY STORE                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Cliente visita loja                               │   │
│  │  2. Adiciona produtos ao carrinho                     │   │
│  │  3. Vai para checkout                                 │   │
│  │  4. Vê nosso gateway como opção                       │   │
│  │  5. Seleciona nosso gateway                           │   │
│  │  6. É redirecionado para nossa página                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  │ WEBHOOKS (Orders, Products, Customers)
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    NOSSO SISTEMA                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  1. Recebe webhook da Shopify                         │   │
│  │  2. Processa pedido/produto/cliente                   │   │
│  │  3. Salva no banco de dados                           │   │
│  │  4. Exibe no dashboard                                │   │
│  │  5. Cliente completa pagamento                        │   │
│  │  6. Enviamos confirmação para Shopify                 │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📋 IMPLEMENTAÇÕES NECESSÁRIAS

### FASE 1: OAuth Completo (1-2 horas)

#### 1.1. Edge Function: shopify-oauth
```typescript
// supabase/functions/shopify-oauth/index.ts

Actions:
- ?action=install     -> Inicia instalação (gera URL OAuth)
- ?action=callback    -> Processa callback do OAuth
- ?action=status      -> Verifica status da instalação

Features:
✅ Gera URL de instalação com scopes corretos
✅ Valida HMAC do Shopify
✅ Troca code por access_token
✅ Salva access_token no banco
✅ Configura webhooks automaticamente
✅ Registra nosso payment gateway
✅ Inicia sync inicial
```

**Scopes Necessários:**
```
read_products, write_products,
read_orders, write_orders,
read_customers, write_customers,
read_inventory, write_inventory,
read_checkouts,
read_script_tags, write_script_tags,
read_shipping, write_shipping,
read_payment_gateways, write_payment_gateways
```

#### 1.2. Atualizar IntegrationCallbackPage
```typescript
// Detectar origem: shopify
// Processar OAuth com validação
// Exibir status de configuração
// Auto-sync inicial
```

### FASE 2: Sincronização Automática (1-2 horas)

#### 2.1. Edge Function: shopify-sync
```typescript
// supabase/functions/shopify-sync/index.ts

Actions:
- ?action=sync-all         -> Sincroniza tudo
- ?action=sync-products    -> Só produtos
- ?action=sync-orders      -> Só pedidos
- ?action=sync-customers   -> Só clientes
- ?action=sync-collections -> Só coleções
- ?action=abandoned-carts  -> Carrinhos abandonados

Features:
✅ Pagination automática
✅ Rate limiting
✅ Retry em caso de erro
✅ Progress tracking
✅ Webhook para notificar conclusão
```

#### 2.2. Tabelas do Banco

```sql
-- Produtos Shopify
CREATE TABLE "ShopifyProduct" (
  id BIGINT PRIMARY KEY,
  "organizationId" UUID REFERENCES "Organization"(id),
  "userId" UUID REFERENCES "User"(id),
  title TEXT NOT NULL,
  handle TEXT NOT NULL,
  description TEXT,
  vendor TEXT,
  "productType" TEXT,
  tags TEXT[],
  status TEXT CHECK (status IN ('active', 'archived', 'draft')),
  "shopifyData" JSONB,
  "lastSyncAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Pedidos Shopify
CREATE TABLE "ShopifyOrder" (
  id BIGINT PRIMARY KEY,
  "organizationId" UUID REFERENCES "Organization"(id),
  "userId" UUID REFERENCES "User"(id),
  "orderNumber" INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  "financialStatus" TEXT,
  "fulfillmentStatus" TEXT,
  "totalPrice" DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  "customerData" JSONB,
  "shippingAddress" JSONB,
  "billingAddress" JSONB,
  "lineItems" JSONB,
  "shopifyData" JSONB,
  "lastSyncAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Carrinhos Abandonados
CREATE TABLE "ShopifyAbandonedCart" (
  id BIGINT PRIMARY KEY,
  "organizationId" UUID REFERENCES "Organization"(id),
  "userId" UUID REFERENCES "User"(id),
  email TEXT,
  phone TEXT,
  "lineItems" JSONB,
  "totalPrice" DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  "abandonedAt" TIMESTAMP,
  "recoveredAt" TIMESTAMP,
  "shopifyData" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Coleções
CREATE TABLE "ShopifyCollection" (
  id BIGINT PRIMARY KEY,
  "organizationId" UUID REFERENCES "Organization"(id),
  "userId" UUID REFERENCES "User"(id),
  title TEXT NOT NULL,
  handle TEXT NOT NULL,
  description TEXT,
  "publishedAt" TIMESTAMP,
  "productCount" INTEGER DEFAULT 0,
  "shopifyData" JSONB,
  "lastSyncAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_shopify_product_org ON "ShopifyProduct"("organizationId");
CREATE INDEX idx_shopify_product_user ON "ShopifyProduct"("userId");
CREATE INDEX idx_shopify_product_status ON "ShopifyProduct"(status);

CREATE INDEX idx_shopify_order_org ON "ShopifyOrder"("organizationId");
CREATE INDEX idx_shopify_order_user ON "ShopifyOrder"("userId");
CREATE INDEX idx_shopify_order_email ON "ShopifyOrder"(email);

CREATE INDEX idx_abandoned_cart_org ON "ShopifyAbandonedCart"("organizationId");
CREATE INDEX idx_abandoned_cart_email ON "ShopifyAbandonedCart"(email);

CREATE INDEX idx_shopify_collection_org ON "ShopifyCollection"("organizationId");
```

### FASE 3: Registrar Gateway na Shopify (2 horas)

#### 3.1. Shopify Payment Gateway Extension

**IMPORTANTE:** Para aparecer como opção de pagamento na Shopify, precisamos:

**Opção A: Usar Shopify Payments API (Recomendado)**
```typescript
// Registrar via API após OAuth
POST /admin/api/2024-01/payment_gateways.json
{
  "payment_gateway": {
    "name": "SyncAds Checkout",
    "type": "manual",
    "enabled": true,
    "settings": {
      "redirect_url": "https://seu-dominio.com/checkout/:order_id"
    }
  }
}
```

**Opção B: Shopify App Bridge (Mais Complexo)**
- Criar Shopify App no Partner Dashboard
- Implementar App Proxy
- Criar extensão de checkout
- Publicar na Shopify App Store

**Vamos com Opção A primeiro (mais rápido)**

#### 3.2. Implementação

```typescript
// Após OAuth bem-sucedido, registrar gateway
async function registerPaymentGateway(shopName: string, accessToken: string) {
  const response = await fetch(
    `https://${shopName}.myshopify.com/admin/api/2024-01/payment_gateways.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        payment_gateway: {
          name: 'SyncAds Checkout',
          type: 'manual',
          enabled: true,
          service_name: 'syncads_checkout',
          supported_countries: ['BR'],
          supported_currencies: ['BRL', 'USD'],
          test_mode: false
        }
      })
    }
  );
  
  return response.json();
}
```

### FASE 4: Dashboard de Shopify (1 hora)

#### 4.1. Página: ShopifyDashboard.tsx

```
src/pages/app/shopify/ShopifyDashboard.tsx

Seções:
✅ Status da Conexão
   - Loja conectada
   - Última sincronização
   - Botão para sync manual
   
✅ Estatísticas
   - Total de produtos sincronizados
   - Total de pedidos
   - Carrinhos abandonados
   - Taxa de conversão
   
✅ Produtos Recentes
   - Lista dos últimos produtos
   - Botão para ver todos
   - Filtros por status
   
✅ Pedidos Recentes
   - Lista dos últimos pedidos
   - Status de pagamento
   - Link para detalhes
   
✅ Carrinhos Abandonados
   - Lista de carrinhos
   - Botão para recuperar (enviar email)
   - Valor total perdido
   
✅ Ações Rápidas
   - Sincronizar agora
   - Ver produtos
   - Ver pedidos
   - Configurações
```

#### 4.2. API Frontend

```typescript
// src/lib/api/shopifyApi.ts

export const shopifyApi = {
  // Status
  getConnectionStatus(),
  
  // Sync
  syncAll(),
  syncProducts(),
  syncOrders(),
  syncCollections(),
  
  // Dados
  getProducts(filters),
  getOrders(filters),
  getAbandonedCarts(),
  getCollections(),
  
  // Estatísticas
  getStats(),
  
  // Ações
  recoverCart(cartId),
  exportData()
};
```

### FASE 5: Webhooks Automáticos (30 min)

#### 5.1. Configuração Automática

```typescript
// Após OAuth, configurar webhooks automaticamente

const WEBHOOKS = [
  'products/create',
  'products/update',
  'products/delete',
  'orders/create',
  'orders/updated',
  'orders/paid',
  'orders/cancelled',
  'orders/fulfilled',
  'checkouts/create',
  'checkouts/update',
  'customers/create',
  'customers/update'
];

async function setupWebhooks(shopName: string, accessToken: string) {
  const webhookUrl = `${SUPABASE_URL}/functions/v1/shopify-webhook`;
  
  for (const topic of WEBHOOKS) {
    await fetch(
      `https://${shopName}.myshopify.com/admin/api/2024-01/webhooks.json`,
      {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': accessToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: `${webhookUrl}?topic=${topic}`,
            format: 'json'
          }
        })
      }
    );
  }
}
```

---

## 🚀 ORDEM DE EXECUÇÃO

### Passo 1: Criar Migration
```bash
# Criar tabelas Shopify
supabase migration new shopify_integration
```

### Passo 2: Implementar Edge Functions
```bash
# 1. shopify-oauth
supabase functions deploy shopify-oauth

# 2. shopify-sync
supabase functions deploy shopify-sync

# 3. Atualizar shopify-webhook (já existe)
supabase functions deploy shopify-webhook
```

### Passo 3: Atualizar Frontend
```bash
# 1. Criar ShopifyDashboard.tsx
# 2. Criar shopifyApi.ts
# 3. Atualizar IntegrationCallbackPage.tsx
# 4. Adicionar rota no App.tsx
```

### Passo 4: Configurar no Shopify Partner
```
1. Criar App no Shopify Partners
2. Configurar OAuth URLs:
   - Redirect: https://seu-dominio.com/integrations/callback
3. Adicionar scopes necessários
4. Copiar API Key e API Secret
5. Adicionar no .env
```

### Passo 5: Testar
```
1. Instalar app em loja de teste
2. Verificar OAuth
3. Verificar sync
4. Verificar webhooks
5. Testar pedido completo
```

---

## 📝 VARIÁVEIS DE AMBIENTE

```env
# Shopify
SHOPIFY_API_KEY=sua-api-key
SHOPIFY_API_SECRET=seu-api-secret
SHOPIFY_SCOPES=read_products,write_products,read_orders,write_orders,...
SHOPIFY_REDIRECT_URI=https://seu-dominio.com/integrations/callback
SHOPIFY_WEBHOOK_SECRET=seu-webhook-secret

# URLs
SHOPIFY_OAUTH_URL=https://seu-dominio.supabase.co/functions/v1/shopify-oauth
SHOPIFY_SYNC_URL=https://seu-dominio.supabase.co/functions/v1/shopify-sync
SHOPIFY_WEBHOOK_URL=https://seu-dominio.supabase.co/functions/v1/shopify-webhook
```

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

### Database
- [ ] Migration criada
- [ ] Tabelas: ShopifyProduct, ShopifyOrder, ShopifyAbandonedCart, ShopifyCollection
- [ ] Índices criados
- [ ] RLS configurado

### Edge Functions
- [ ] shopify-oauth implementada
- [ ] shopify-sync implementada
- [ ] shopify-webhook atualizada
- [ ] Todas deployadas

### Frontend
- [ ] ShopifyDashboard.tsx criado
- [ ] shopifyApi.ts implementado
- [ ] IntegrationCallbackPage atualizado
- [ ] Rota adicionada
- [ ] Menu atualizado

### Shopify Partner
- [ ] App criado
- [ ] OAuth configurado
- [ ] Scopes adicionados
- [ ] Webhooks configurados
- [ ] Variáveis no .env

### Testes
- [ ] OAuth funciona
- [ ] Sync de produtos funciona
- [ ] Sync de pedidos funciona
- [ ] Webhooks recebem eventos
- [ ] Dashboard mostra dados
- [ ] Carrinhos abandonados aparecem

---

## 🎯 RESULTADO ESPERADO

### Quando Conectar Shopify:
1. ✅ OAuth completo e seguro
2. ✅ Sync automático de dados
3. ✅ Gateway aparece como opção de pagamento
4. ✅ Webhooks configurados automaticamente
5. ✅ Dashboard mostra todos os dados
6. ✅ Carrinhos abandonados capturados
7. ✅ Pedidos sincronizados em tempo real

### Dashboard Shopify Terá:
- Status da conexão
- 4 cards de métricas
- Lista de produtos
- Lista de pedidos
- Carrinhos abandonados com valor
- Botão de sync manual
- Exportar dados

---

## ⏱️ TEMPO ESTIMADO POR FASE

| Fase | Tarefa | Tempo |
|------|--------|-------|
| 1 | OAuth Completo | 1-2h |
| 2 | Sincronização | 1-2h |
| 3 | Gateway na Shopify | 2h |
| 4 | Dashboard | 1h |
| 5 | Webhooks | 30min |
| **TOTAL** | | **4-6h** |

---

## 🆘 PROBLEMAS CONHECIDOS

### 1. Gateway não aparece no checkout
**Solução:** Shopify não permite gateways customizados facilmente. Alternativas:
- Usar "Manual Payment Method"
- Criar Shopify Payment App (complexo)
- Usar redirect após checkout

### 2. Rate Limiting
**Solução:** Implementar rate limiting (2 req/s para API, 1000 req/dia)

### 3. Webhooks não recebem
**Solução:** 
- Verificar HTTPS
- Validar HMAC
- Retornar 200 OK rapidamente

---

## 📚 REFERÊNCIAS

- [Shopify OAuth](https://shopify.dev/docs/apps/auth/oauth)
- [Shopify Admin API](https://shopify.dev/docs/api/admin-rest)
- [Shopify Webhooks](https://shopify.dev/docs/apps/webhooks)
- [Payment Gateways](https://shopify.dev/docs/apps/payments)

---

## 🎉 RESULTADO FINAL

Após implementação completa:
- ✅ Shopify totalmente integrada
- ✅ OAuth funcionando
- ✅ Dados sincronizados
- ✅ Dashboard completo
- ✅ Carrinhos abandonados capturados
- ✅ Pedidos em tempo real
- ✅ Sistema pronto para produção

**Próximo:** Implementar mesmo fluxo para outras plataformas (VTEX, Nuvemshop, etc.)

---

**Última atualização:** 30/01/2025  
**Versão:** 1.0  
**Status:** PRONTO PARA IMPLEMENTAR 🚀