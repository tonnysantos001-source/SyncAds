# 🛒 Configuração do Checkout Customizado - Shopify + SyncAds

## 📋 Visão Geral

Este guia explica como configurar o checkout customizado do SyncAds para funcionar com sua loja Shopify.

### O que este sistema faz:

1. **Intercepta** o botão "Adicionar ao Carrinho" da Shopify
2. **Cria** um pedido no sistema SyncAds
3. **Redireciona** o cliente para o checkout customizado do SyncAds
4. **Processa** pagamentos via seus gateways configurados
5. **Sincroniza** o pedido de volta para a Shopify após pagamento

---

## 🎯 Arquitetura do Fluxo

```
Cliente na Loja Shopify
        ↓
Clica em "Comprar"
        ↓
Script intercepta → Cria pedido via API
        ↓
Redireciona para: syncads.com.br/checkout/:orderId
        ↓
Cliente preenche dados e paga
        ↓
Webhook sincroniza pedido para Shopify
```

---

## ✅ Pré-requisitos

Antes de começar, certifique-se de que você tem:

- [x] Conta Shopify ativa
- [x] Acesso ao Admin da Shopify
- [x] Integração Shopify conectada no SyncAds
- [x] Gateways de pagamento configurados no SyncAds
- [x] Checkout personalizado configurado no SyncAds

---

## 🚀 Passo 1: Deploy da Edge Function

### 1.1 Fazer Deploy da Edge Function

A Edge Function `shopify-create-order` já foi criada. Faça o deploy:

```bash
cd SyncAds
supabase functions deploy shopify-create-order --project-ref ovskepqggmxlfckxqgbr --no-verify-jwt
```

### 1.2 Configurar Variáveis de Ambiente (se necessário)

```bash
# URL do frontend (já configurada)
supabase secrets set FRONTEND_URL=https://syncads-dun.vercel.app --project-ref ovskepqggmxlfckxqgbr
```

### 1.3 Verificar Deploy

Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/functions

Verifique se a função `shopify-create-order` está ativa.

---

## 🎨 Passo 2: Instalar Script no Tema Shopify

### 2.1 Acessar o Editor de Código do Tema

1. Vá para o Admin da Shopify: https://admin.shopify.com
2. Navegue para: **Online Store** → **Themes**
3. No tema ativo, clique em **Actions** → **Edit code**

### 2.2 Localizar o Arquivo theme.liquid

No menu lateral esquerdo:
- Expanda a pasta **Layout**
- Clique em **theme.liquid**

### 2.3 Adicionar o Script

Encontre a tag `</body>` (quase no final do arquivo) e **ANTES** dela, adicione:

```html
<!-- SyncAds Checkout Integration -->
<script>
  window.SYNCADS_CONFIG = {
    API_URL: 'https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/shopify-create-order',
    FRONTEND_URL: 'https://syncads-dun.vercel.app',
    SHOP_DOMAIN: '{{ shop.domain }}',
    DEBUG: true
  };
</script>
<script src="{{ 'shopify-checkout-redirect.js' | asset_url }}" defer></script>
```

### 2.4 Upload do Arquivo JavaScript

1. No editor de código, vá para a pasta **Assets**
2. Clique em **Add a new asset**
3. Selecione **Create a blank file**
4. Nome do arquivo: `shopify-checkout-redirect.js`
5. Cole o conteúdo do arquivo `public/shopify-checkout-redirect.js`
6. Clique em **Save**

### 2.5 Salvar Alterações

- Clique em **Save** no arquivo `theme.liquid`
- Aguarde a confirmação "Saved successfully"

---

## 🔧 Passo 3: Configurar Checkout da Shopify

### 3.1 Desabilitar Checkout Padrão (Opcional)

Como você não tem Shopify Plus, o checkout padrão ainda vai existir, mas o script vai interceptar antes.

Para evitar que clientes acessem o carrinho diretamente:

1. Vá em: **Settings** → **Checkout**
2. Em **Customer accounts**, selecione: **Accounts are optional**
3. Em **Customer contact**, deixe: **Customers can only check out using email**

### 3.2 Configurar Políticas de Checkout

1. Em **Settings** → **Checkout**
2. Configure:
   - **Form options**: Habilite os campos que você usa no seu checkout
   - **Order processing**: "Do not fulfill orders automatically"

---

## 📊 Passo 4: Configurar Tabelas no Banco de Dados

### 4.1 Verificar Tabela Order

Execute no Supabase SQL Editor:

```sql
-- Verificar se tabela Order existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'Order';

-- Se não existir, criar:
CREATE TABLE IF NOT EXISTS "Order" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT,
  "organizationId" UUID,
  status TEXT DEFAULT 'PENDING',
  "totalAmount" DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  "shippingCost" DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  "paymentStatus" TEXT DEFAULT 'PENDING',
  "customerEmail" TEXT,
  "customerName" TEXT,
  "customerPhone" TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Verificar Tabela OrderItem

```sql
-- Verificar se tabela OrderItem existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'OrderItem';

-- Se não existir, criar:
CREATE TABLE IF NOT EXISTS "OrderItem" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID REFERENCES "Order"(id) ON DELETE CASCADE,
  "productId" TEXT NOT NULL,
  "productName" TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  "unitPrice" DECIMAL(10,2) NOT NULL,
  "totalPrice" DECIMAL(10,2) NOT NULL,
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

---

## 🧪 Passo 5: Testar a Integração

### 5.1 Teste em Modo Debug

1. Abra sua loja Shopify
2. Abra o Console do navegador (F12 → Console)
3. Navegue até uma página de produto
4. Você deve ver logs como:
   ```
   [SyncAds Checkout] Initializing...
   [SyncAds Checkout] Shop: sua-loja.myshopify.com
   [SyncAds Checkout] Intercepting button: <button>
   ```

### 5.2 Teste de Compra

1. Selecione um produto
2. Clique em "Adicionar ao Carrinho" ou "Comprar"
3. Você deve ver:
   - Loading overlay aparecendo
   - Console mostrando: `[SyncAds Checkout] Creating order...`
   - Redirecionamento para: `https://syncads-dun.vercel.app/checkout/:orderId`

### 5.3 Verificar Pedido no Banco

No Supabase SQL Editor:

```sql
-- Ver últimos pedidos criados
SELECT * FROM "Order" 
ORDER BY "createdAt" DESC 
LIMIT 10;

-- Ver itens do último pedido
SELECT o.*, oi.* 
FROM "Order" o
LEFT JOIN "OrderItem" oi ON o.id = oi."orderId"
ORDER BY o."createdAt" DESC 
LIMIT 5;
```

---

## 🐛 Troubleshooting

### Problema: Script não está carregando

**Solução:**
1. Verifique se o arquivo `shopify-checkout-redirect.js` está na pasta **Assets**
2. Limpe o cache do navegador (Ctrl + Shift + R)
3. Verifique o console por erros 404

### Problema: Botão não está sendo interceptado

**Solução:**
1. Abra o console e procure por `[SyncAds Checkout]`
2. Se não aparecer nada, o script não está carregando
3. Verifique se o selector do botão está correto
4. Temas customizados podem ter seletores diferentes

### Problema: Erro ao criar pedido

**Solução:**
1. Verifique os logs no console
2. Verifique se a integração Shopify está ativa no banco:
   ```sql
   SELECT * FROM "ShopifyIntegration" 
   WHERE "isActive" = true;
   ```
3. Verifique se a Edge Function está deployada

### Problema: Redirecionamento não funciona

**Solução:**
1. Verifique se `FRONTEND_URL` está configurado corretamente
2. Verifique se o orderId foi criado no banco
3. Teste acessar manualmente: `https://syncads-dun.vercel.app/checkout/[orderId]`

---

## 🔐 Segurança

### Validações Implementadas

- ✅ Verifica se integração Shopify está ativa
- ✅ Valida domínio da loja
- ✅ Cria pedido com status PENDING
- ✅ Usa CORS para permitir apenas domínios autorizados

### Recomendações

1. **Não exponha credenciais** no script JavaScript
2. **Use HTTPS** sempre
3. **Monitore logs** da Edge Function regularmente
4. **Configure RLS** (Row Level Security) nas tabelas Order

---

## 📈 Monitoramento

### Logs da Edge Function

Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/functions/shopify-create-order

Você pode ver:
- Número de requisições
- Tempo de resposta
- Erros
- Logs detalhados

### Queries Úteis

```sql
-- Pedidos criados hoje
SELECT COUNT(*) as total, status 
FROM "Order" 
WHERE "createdAt" >= CURRENT_DATE 
GROUP BY status;

-- Taxa de conversão
SELECT 
  COUNT(CASE WHEN "paymentStatus" = 'PAID' THEN 1 END) as paid,
  COUNT(*) as total,
  ROUND(COUNT(CASE WHEN "paymentStatus" = 'PAID' THEN 1 END)::numeric / COUNT(*)::numeric * 100, 2) as conversion_rate
FROM "Order" 
WHERE "createdAt" >= CURRENT_DATE - INTERVAL '7 days';
```

---

## 🎨 Personalização

### Mudar Texto do Botão

No arquivo `shopify-checkout-redirect.js`, localize:

```javascript
// Linha ~310
if (newButton.textContent.toLowerCase().includes('cart')) {
  newButton.textContent = 'Comprar com SyncAds'; // Mude aqui
}
```

### Adicionar Tracking

Adicione no início da função `processPurchase`:

```javascript
// Google Analytics
if (window.gtag) {
  gtag('event', 'begin_checkout', {
    currency: 'BRL',
    value: productData.price * productData.quantity
  });
}

// Facebook Pixel
if (window.fbq) {
  fbq('track', 'InitiateCheckout', {
    value: productData.price * productData.quantity,
    currency: 'BRL'
  });
}
```

---

## 🚀 Próximos Passos

Depois que tudo estiver funcionando:

1. [ ] Testar com diferentes produtos
2. [ ] Testar em dispositivos móveis
3. [ ] Configurar Webhooks para sincronizar pedidos pagos de volta para Shopify
4. [ ] Adicionar tracking de conversão
5. [ ] Configurar e-mails transacionais
6. [ ] Adicionar recuperação de carrinhos abandonados

---

## 📞 Suporte

Se você encontrar problemas:

1. Verifique os logs no console do navegador
2. Verifique os logs da Edge Function no Supabase
3. Verifique o banco de dados
4. Entre em contato com o time de desenvolvimento

---

## 📝 Changelog

### v1.0.0 (2025-02-01)
- ✅ Criada Edge Function `shopify-create-order`
- ✅ Criado script de interceptação de checkout
- ✅ Documentação completa
- ✅ Sistema de redirecionamento funcionando

---

**Desenvolvido com ❤️ pela equipe SyncAds**