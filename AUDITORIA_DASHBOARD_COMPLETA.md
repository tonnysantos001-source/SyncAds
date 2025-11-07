# AUDITORIA COMPLETA - DASHBOARD ANALYTICS
**Data:** 07 de Novembro de 2025  
**Status:** 🔴 PROBLEMAS CRÍTICOS IDENTIFICADOS

---

## 📊 RESUMO EXECUTIVO

A dashboard não está mostrando dados porque:
1. **Todos os pedidos estão como PENDING** (nenhum PAID para calcular receita)
2. **Tabela Cart está incompleta** (faltam colunas essenciais)
3. **Tracking de visitantes não está funcionando** (só 1 carrinho no banco)
4. **Gateway de pagamento não está atualizando status**

---

## 🔍 DADOS ENCONTRADOS NO BANCO

### ✅ Tabela Order (ESTRUTURA CORRETA)
```
- userId: TEXT ✅ (correto, não usa organizationId)
- 11 pedidos encontrados
- Total: R$ 968,76
- userId: a3d7e466-5031-42ef-9c53-3d0a939d6836
- PROBLEMA: Todos com paymentStatus = "PENDING"
```

**Pedidos Recentes:**
| Order Number | Total | Status | Data |
|--------------|-------|--------|------|
| ORD-47892326-4734 | R$ 21,06 | PENDING | 07/11 20:38 |
| PREVIEW-1762543812151 | R$ 102,96 | PENDING | 07/11 19:30 |
| PREVIEW-1762520964418 | R$ 102,96 | PENDING | 07/11 13:09 |

### ❌ Tabela Cart (ESTRUTURA INCOMPLETA)

**Colunas Existentes:**
- id
- customerId
- sessionId
- items
- subtotal
- discount
- shipping
- total
- couponCode
- expiresAt
- createdAt
- updatedAt
- userId

**Colunas FALTANDO (usadas no código):**
- ❌ `completedAt` - para calcular tempo de sessão
- ❌ `convertedToOrderId` - para rastrear conversões

**Dados Encontrados:**
- Apenas 1 carrinho no banco
- userId = NULL
- total = R$ 0,00

---

## 🐛 PROBLEMAS IDENTIFICADOS

### 1️⃣ **CRÍTICO: Nenhum Pedido PAID**
**Impacto:** Dashboard mostra R$ 0,00 de receita

**Causa Raiz:**
- Gateway de pagamento não está atualizando `paymentStatus` de PENDING para PAID
- Webhook do gateway não está funcionando
- Ou processo de confirmação de pagamento quebrado

**Evidência:**
```sql
SELECT "paymentStatus", COUNT(*)
FROM "Order"
GROUP BY "paymentStatus";

-- Resultado: 11 PENDING, 0 PAID
```

### 2️⃣ **CRÍTICO: Tabela Cart Incompleta**
**Impacto:** 
- Não consegue calcular taxa de conversão real
- Não consegue calcular tempo médio de sessão
- Visitantes únicos incorretos

**Código Quebrado:**
```typescript
// dashboardApi.ts linha ~238
const completedCarts = allCarts.filter((c) => c.completedAt); // ❌ Coluna não existe
```

**Solução Necessária:**
- Adicionar coluna `completedAt TIMESTAMP`
- Adicionar coluna `convertedToOrderId UUID`
- Atualizar checkout público para preencher essas colunas

### 3️⃣ **CRÍTICO: Tracking de Visitantes Não Funciona**
**Impacto:** Mostra 0 visitantes únicos

**Problema:**
- Apenas 1 carrinho criado no histórico completo
- Checkout público não está criando carrinhos corretamente
- Ou carrinhos estão sendo criados em outra tabela

**Esperado:**
- Cada visita ao checkout = 1 Cart criado
- Cart.userId preenchido
- Cart.completedAt quando finaliza

**Real:**
- 1 carrinho com userId NULL
- Nenhum tracking de sessões

### 4️⃣ **MÉDIO: Transações não Vinculadas**
**Impacto:** Não mostra métricas por gateway

**Necessário Verificar:**
- Tabela Transaction existe?
- Pedidos estão criando transações?
- gatewayId está sendo preenchido?

---

## 🔧 PLANO DE CORREÇÃO

### FASE 1: Estrutura do Banco ⚠️ URGENTE

#### A) Adicionar Colunas Faltantes na Tabela Cart
```sql
-- Migration: adicionar_tracking_cart.sql
ALTER TABLE "Cart" 
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "convertedToOrderId" UUID REFERENCES "Order"(id),
  ADD COLUMN IF NOT EXISTS "abandonedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "sessionDuration" INTEGER; -- em segundos

CREATE INDEX idx_cart_completed ON "Cart"("completedAt");
CREATE INDEX idx_cart_converted ON "Cart"("convertedToOrderId");
CREATE INDEX idx_cart_user_created ON "Cart"("userId", "createdAt");

COMMENT ON COLUMN "Cart"."completedAt" IS 'Quando o usuário finalizou o checkout';
COMMENT ON COLUMN "Cart"."convertedToOrderId" IS 'ID do pedido gerado a partir deste carrinho';
COMMENT ON COLUMN "Cart"."sessionDuration" IS 'Tempo total da sessão em segundos';
```

#### B) Adicionar Índices para Performance
```sql
-- Otimizar queries da dashboard
CREATE INDEX IF NOT EXISTS idx_order_user_status_created 
  ON "Order"("userId", "paymentStatus", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_order_paid_created 
  ON "Order"("paymentStatus", "createdAt" DESC) 
  WHERE "paymentStatus" = 'PAID';

CREATE INDEX IF NOT EXISTS idx_cart_user_session 
  ON "Cart"("userId", "sessionId", "createdAt");
```

### FASE 2: Corrigir Webhook de Pagamento ⚠️ URGENTE

#### Problema:
Pedidos não estão mudando de PENDING para PAID

#### Verificar:
1. Webhook configurado no gateway (Pague-X)?
2. Edge Function recebendo webhooks?
3. URL do webhook correta?
4. Assinatura do webhook validando?

#### Criar Endpoint de Teste:
```typescript
// supabase/functions/test-payment-webhook/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const { orderId } = await req.json();
  
  // Atualizar pedido manualmente para teste
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
  
  const { data, error } = await supabase
    .from("Order")
    .update({ 
      paymentStatus: "PAID",
      paidAt: new Date().toISOString()
    })
    .eq("id", orderId)
    .select()
    .single();
  
  return new Response(JSON.stringify({ success: !error, data, error }), {
    headers: { "Content-Type": "application/json" },
  });
});
```

### FASE 3: Implementar Tracking Correto no Checkout

#### A) Criar Carrinho ao Acessar Checkout
```typescript
// src/pages/public/PublicCheckoutPage.tsx

useEffect(() => {
  const trackCheckoutVisit = async () => {
    // Criar carrinho ao carregar página
    const { data: cart, error } = await supabase
      .from("Cart")
      .insert({
        userId: user?.id || null,
        sessionId: getSessionId(), // Pegar do localStorage
        items: [],
        total: 0,
        createdAt: new Date().toISOString()
      })
      .select()
      .single();
      
    if (cart) {
      setCartId(cart.id);
      // Salvar no localStorage para não duplicar
      localStorage.setItem('current_cart_id', cart.id);
    }
  };
  
  trackCheckoutVisit();
}, []);
```

#### B) Atualizar Carrinho ao Finalizar
```typescript
// Quando usuário finaliza compra
const completeCheckout = async (orderId: string) => {
  const cartId = localStorage.getItem('current_cart_id');
  
  if (cartId) {
    await supabase
      .from("Cart")
      .update({
        completedAt: new Date().toISOString(),
        convertedToOrderId: orderId,
        sessionDuration: calculateSessionDuration()
      })
      .eq("id", cartId);
      
    localStorage.removeItem('current_cart_id');
  }
};
```

#### C) Marcar Carrinho Abandonado
```typescript
// Ao sair da página sem comprar
useEffect(() => {
  const handleBeforeUnload = async () => {
    const cartId = localStorage.getItem('current_cart_id');
    if (cartId) {
      await supabase
        .from("Cart")
        .update({
          abandonedAt: new Date().toISOString(),
          sessionDuration: calculateSessionDuration()
        })
        .eq("id", cartId)
        .is("completedAt", null);
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, []);
```

### FASE 4: Atualizar Dashboard API

#### Corrigir Query de Visitantes
```typescript
// src/lib/api/dashboardApi.ts

// ANTES (quebrado):
const { data: currentCarts } = await supabase
  .from("Cart")
  .select("*")
  .eq("userId", userId)
  .gte("createdAt", start.toISOString());

// DEPOIS (funcional):
const { data: currentCarts } = await supabase
  .from("Cart")
  .select("id, userId, createdAt, completedAt, convertedToOrderId, sessionDuration")
  .or(`userId.eq.${userId},userId.is.null`) // Incluir visitantes anônimos
  .gte("createdAt", start.toISOString());

// Visitantes únicos = todos os carrinhos (anônimos + logados)
const uniqueVisitors = currentCarts?.length || 0;

// Taxa de conversão = pedidos / visitantes
const conversionRate = uniqueVisitors > 0 
  ? (totalOrders / uniqueVisitors) * 100 
  : 0;
```

#### Calcular Tempo Médio Correto
```typescript
// Usar sessionDuration em vez de calcular diferença
const avgSessionSeconds = currentCarts
  ?.filter(c => c.sessionDuration)
  .reduce((sum, c) => sum + c.sessionDuration, 0) / currentCarts.length;

const avgMinutes = Math.floor(avgSessionSeconds / 60);
const avgSeconds = avgSessionSeconds % 60;
const averageTime = `${avgMinutes}m ${avgSeconds}s`;
```

---

## 🎯 MÉTRICAS ESPERADAS VS REAL

| Métrica | Esperado | Real | Status |
|---------|----------|------|--------|
| Total de Pedidos | 11 | 11 | ✅ OK |
| Pedidos PAID | 11 | 0 | ❌ CRÍTICO |
| Receita Total | R$ 968,76 | R$ 0,00 | ❌ CRÍTICO |
| Visitantes | ~50-100 | 0 | ❌ CRÍTICO |
| Carrinhos Criados | ~50-100 | 1 | ❌ CRÍTICO |
| Taxa de Conversão | ~10-20% | NaN | ❌ CRÍTICO |

---

## 🚀 PRIORIDADES DE IMPLEMENTAÇÃO

### 🔴 URGENTE (Fazer Agora)
1. **Rodar Migration** - Adicionar colunas no Cart
2. **Corrigir Webhook** - Fazer pedidos mudarem para PAID
3. **Teste Manual** - Atualizar 1 pedido para PAID e verificar dashboard

### 🟡 IMPORTANTE (Próximas Horas)
4. **Implementar Tracking** - Criar carrinhos ao acessar checkout
5. **Testar Fluxo Completo** - Fazer compra e verificar métricas
6. **Adicionar Logs** - Console.log em cada etapa

### 🟢 PODE ESPERAR (Próximos Dias)
7. **Otimizar Performance** - Adicionar cache
8. **Melhorar UI** - Loading states melhores
9. **Documentar** - Criar guia de troubleshooting

---

## 🧪 COMANDOS DE TESTE

### 1. Marcar Pedidos Como PAID (Teste Manual)
```sql
-- Atualizar 1 pedido para testar
UPDATE "Order" 
SET 
  "paymentStatus" = 'PAID',
  "paidAt" = NOW()
WHERE "orderNumber" = 'ORD-47892326-4734';

-- Verificar dashboard - deve mostrar R$ 21,06
```

### 2. Criar Carrinhos de Teste
```sql
-- Simular 10 visitantes
INSERT INTO "Cart" (id, "userId", "sessionId", total, "createdAt")
SELECT 
  gen_random_uuid(),
  'a3d7e466-5031-42ef-9c53-3d0a939d6836',
  'session_' || generate_series,
  0,
  NOW() - (random() * INTERVAL '7 days')
FROM generate_series(1, 10);

-- Marcar 2 como convertidos
UPDATE "Cart" 
SET 
  "completedAt" = "createdAt" + INTERVAL '5 minutes',
  "convertedToOrderId" = (SELECT id FROM "Order" LIMIT 1),
  "sessionDuration" = 300
WHERE id IN (SELECT id FROM "Cart" ORDER BY random() LIMIT 2);
```

### 3. Verificar Dados no Console do Browser
```javascript
// Executar no console da dashboard
console.log('User ID:', localStorage.getItem('supabase.auth.token'));

// Ver chamadas da API
const metrics = await fetch('/api/dashboard/metrics?period=7days')
  .then(r => r.json());
console.table(metrics);
```

---

## 📝 CHECKLIST DE VALIDAÇÃO

Depois de aplicar correções, verificar:

- [ ] Migration rodou sem erros
- [ ] Pedidos mudando para PAID quando pagos
- [ ] Carrinhos sendo criados ao acessar checkout
- [ ] Dashboard mostra receita correta
- [ ] Visitantes únicos > 0
- [ ] Taxa de conversão calculada corretamente
- [ ] Tempo médio mostrando valor real
- [ ] Taxa de rejeição calculada
- [ ] Gráficos mostrando dados
- [ ] Performance < 2s para carregar

---

## 🔗 ARQUIVOS QUE PRECISAM ALTERAÇÃO

1. **Nova Migration:** `supabase/migrations/YYYYMMDD_add_cart_tracking.sql`
2. **Dashboard API:** `src/lib/api/dashboardApi.ts` (já atualizado)
3. **Checkout Público:** `src/pages/public/PublicCheckoutPage.tsx`
4. **Webhook Handler:** `supabase/functions/payment-webhook/index.ts`
5. **Este Documento:** Referência para futuras auditorias

---

## ✅ RESUMO DAS AÇÕES

**Para fazer a dashboard funcionar AGORA:**

```bash
# 1. Criar e aplicar migration
cd SyncAds
cat > supabase/migrations/20251107_add_cart_tracking.sql << 'EOF'
ALTER TABLE "Cart" 
  ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "convertedToOrderId" UUID REFERENCES "Order"(id),
  ADD COLUMN IF NOT EXISTS "abandonedAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "sessionDuration" INTEGER;
EOF

# 2. Teste rápido - marcar pedidos como PAID
# Executar no Supabase SQL Editor:
UPDATE "Order" SET "paymentStatus" = 'PAID', "paidAt" = NOW();

# 3. Criar carrinhos de teste
# Executar SQL acima na seção "Comandos de Teste"

# 4. Recarregar dashboard
# Deve mostrar: R$ 968,76 de receita, 11 pedidos
```

---

**Última Atualização:** 07/11/2025 21:00  
**Status:** 🔴 Aguardando correções críticas  
**Próxima Ação:** Aplicar migration e testar