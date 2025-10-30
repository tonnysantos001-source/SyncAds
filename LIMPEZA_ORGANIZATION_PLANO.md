# 🧹 PLANO DE LIMPEZA COMPLETA - ORGANIZATION

**Data:** 30 de Outubro de 2025  
**Status:** 🔴 CRÍTICO - EXECUTAR ANTES DE CONTINUAR

---

## ⚠️ PROBLEMA IDENTIFICADO

O sistema tem **~554 referências a "organization"** que precisam ser removidas/corrigidas:

- **Frontend (src/):** 460 ocorrências em 54 arquivos
- **Backend (supabase/functions/):** 94 ocorrências em 19 arquivos

**Impacto:** Cada vez que mexemos no código, organizações causam problemas e bugs.

**Solução:** REMOVER COMPLETAMENTE o conceito de organizações do sistema.

---

## 🎯 NOVA ARQUITETURA (SIMPLIFICADA)

```
Sistema SyncAds
├── Super Admin (1 usuário especial)
│   └── Gerencia: GlobalAiConnection, Gateways globais, etc
└── Usuários Normais (N usuários)
    └── Cada um tem seus próprios: Campanhas, Produtos, Gateways, Frete, etc
```

**Regra:** TUDO é vinculado ao `userId` (nunca mais organizationId)

---

## 📋 ARQUIVOS AFETADOS

### Frontend (54 arquivos)

#### Críticos (APIs e Stores):
1. `src/lib/api/conversations.ts` - Chat conversations
2. `src/lib/api/gatewaysApi.ts` - Gateways (CRÍTICO)
3. `src/lib/api/checkoutApi.ts` - Checkout
4. `src/lib/api/marketingApi.ts` - Marketing (25 refs!)
5. `src/lib/api/productsApi.ts` - Produtos
6. `src/lib/api/ordersApi.ts` - Pedidos
7. `src/lib/api/cartApi.ts` - Carrinho
8. `src/lib/api/customersApi.ts` - Clientes
9. `src/lib/api/shopifyIntegrationApi.ts` - Shopify
10. `src/lib/api/invites.ts` - Convites

#### Páginas Importantes:
11. `src/pages/app/ChatPage.tsx` - Chat
12. `src/pages/app/DomainValidationPage.tsx` - Domínio
13. `src/pages/app/checkout/GatewaysPage.tsx` - Gateways
14. `src/pages/app/checkout/CheckoutCustomizePage.tsx` - Customização
15. `src/pages/app/UnifiedDashboardPage.tsx` - Dashboard
16. `src/pages/app/ShippingPage.tsx` - Frete
17. `src/pages/app/TeamPage.tsx` - Time

#### Páginas de Marketing:
18-23. CrossSellPage, UpsellPage, CouponsPage, OrderBumpPage, etc

#### Páginas de Produtos:
24-26. AllProductsPage, CollectionsPage, KitsPage

#### Páginas de Pedidos:
27-29. AllOrdersPage, AbandonedCartsPage, PixRecoveredPage

#### Super Admin:
30. `src/pages/super-admin/SubscriptionsPage.tsx`
31. `src/pages/super-admin/AdminChatPage.tsx`

#### Configurações:
32. `src/pages/app/settings/OrganizationAiTab.tsx` - **DELETAR**

#### Utilitários:
33-35. hooks, errors, sentry

#### Types:
36. `src/lib/database.types.ts` - **CRÍTICO** (159 refs!)

---

### Backend - Edge Functions (19 arquivos)

#### Chat:
1. `supabase/functions/chat/index.ts` - 9 refs
2. `supabase/functions/chat-stream/index.ts` - 2 refs
3. `supabase/functions/chat-stream-working/index.ts` - 7 refs

#### IA Tools:
4. `supabase/functions/ai-tools/index.ts` - 4 refs
5. `supabase/functions/ai-advisor/index.ts` - 6 refs
6. `supabase/functions/super-ai-tools/index.ts` - 2 refs

#### Media:
7. `supabase/functions/generate-image/index.ts` - 8 refs
8. `supabase/functions/generate-video/index.ts` - 7 refs
9. `supabase/functions/file-generator/index.ts` - 2 refs
10. `supabase/functions/file-generator-v2/index.ts` - 2 refs

#### Analytics:
11. `supabase/functions/advanced-analytics/index.ts` - 7 refs
12. `supabase/functions/content-assistant/index.ts` - 3 refs
13. `supabase/functions/automation-engine/index.ts` - 8 refs

#### Integrations:
14. `supabase/functions/auth-meta/index.ts` - 2 refs
15. `supabase/functions/meta-ads-tools/index.ts` - 3 refs
16. `supabase/functions/shopify-webhook/index.ts` - 6 refs

#### Outros:
17. `supabase/functions/process-payment/index.ts` - 9 refs
18. `supabase/functions/verify-domain/index.ts` - 5 refs
19. `supabase/functions/advanced-scraper/index.ts` - 2 refs

---

## 🔧 ESTRATÉGIA DE LIMPEZA

### FASE 1: BANCO DE DADOS (CRÍTICO)
```sql
-- Migration para limpar organization do banco
1. Remover organizationId de TODAS as tabelas
2. Adicionar userId onde necessário
3. Migrar dados existentes (se houver)
4. Remover tabela Organization
5. Remover OrganizationAiConnection
```

### FASE 2: TYPES (TypeScript)
```typescript
// src/lib/database.types.ts
- Remover tipos Organization*
- Remover organizationId de TODOS os tipos
- Regenerar types do Supabase
```

### FASE 3: BACKEND (Edge Functions)
Prioridade por impacto:

**Alta:**
1. ✅ chat-enhanced (já corrigido)
2. chat
3. process-payment
4. verify-domain

**Média:**
5-10. IA tools, generate-image/video, etc

**Baixa:**
11-19. Demais functions

### FASE 4: FRONTEND (APIs)
Ordem de prioridade:

**Crítica:**
1. gatewaysApi.ts
2. checkoutApi.ts
3. productsApi.ts
4. ordersApi.ts

**Alta:**
5. marketingApi.ts (25 refs!)
6. conversations.ts
7. cartApi.ts
8. customersApi.ts

**Média:**
9-10. Demais APIs

### FASE 5: FRONTEND (Páginas)
```
1. Páginas de checkout (GatewaysPage, etc)
2. ChatPage
3. DashboardPage
4. Páginas de produtos
5. Páginas de marketing
6. Super Admin pages
7. DELETAR: OrganizationAiTab.tsx
```

---

## 📝 PADRÃO DE SUBSTITUIÇÃO

### No Backend (Edge Functions):
```typescript
// ❌ ANTES (ERRADO):
const { data: userData } = await supabase
  .from('User')
  .select('organizationId')
  .eq('id', user.id)
  .single();

if (!userData?.organizationId) {
  throw new Error('No organization');
}

const { data } = await supabase
  .from('SomeTable')
  .select('*')
  .eq('organizationId', userData.organizationId);

// ✅ DEPOIS (CORRETO):
// Simplesmente usar user.id diretamente!
const { data } = await supabase
  .from('SomeTable')
  .select('*')
  .eq('userId', user.id);
```

### No Frontend (APIs):
```typescript
// ❌ ANTES (ERRADO):
export const someApi = {
  list: async (organizationId: string) => {
    const { data } = await supabase
      .from('SomeTable')
      .select('*')
      .eq('organizationId', organizationId);
    return data;
  }
}

// ✅ DEPOIS (CORRETO):
export const someApi = {
  list: async (userId: string) => {
    const { data } = await supabase
      .from('SomeTable')
      .select('*')
      .eq('userId', userId);
    return data;
  }
}
```

### Nas Páginas:
```typescript
// ❌ ANTES (ERRADO):
const user = useAuthStore(state => state.user);
const organizationId = user?.organizationId;

if (!organizationId) return;
loadData(organizationId);

// ✅ DEPOIS (CORRETO):
const user = useAuthStore(state => state.user);

if (!user?.id) return;
loadData(user.id);
```

---

## 🗄️ MIGRATION DO BANCO

### Tabelas a Atualizar:
```sql
-- Remover organizationId, adicionar userId
- Campaign
- Product
- Order
- Cart
- Customer
- GatewayConfig ✅ (já na migration)
- ShippingMethod ✅ (já criada correta)
- Lead
- Coupon
- OrderBump
- Upsell
- CrossSell
- DiscountBanner
- Cashback
- Pixel
- etc...
```

### Tabelas a DELETAR:
```sql
DROP TABLE "OrganizationAiConnection";
DROP TABLE "Organization";
```

---

## ⚙️ EXECUÇÃO PASSO A PASSO

### Semana 1 - Banco e Backend
- [ ] Dia 1: Criar migration completa do banco
- [ ] Dia 2: Executar migration e testar
- [ ] Dia 3: Limpar Edge Functions críticas (chat, payment)
- [ ] Dia 4: Limpar demais Edge Functions
- [ ] Dia 5: Testar todas Edge Functions

### Semana 2 - Frontend
- [ ] Dia 1: Atualizar database.types.ts
- [ ] Dia 2: Limpar APIs críticas
- [ ] Dia 3: Limpar páginas de checkout
- [ ] Dia 4: Limpar demais páginas
- [ ] Dia 5: Testes completos

---

## 🧪 TESTES APÓS LIMPEZA

### Backend:
- [ ] Chat funciona (usuário normal)
- [ ] Chat funciona (super admin)
- [ ] Gateways salvam corretamente
- [ ] Pagamentos processam
- [ ] IA responde

### Frontend:
- [ ] Login funciona
- [ ] Dashboard carrega
- [ ] Criar campanha
- [ ] Criar produto
- [ ] Configurar gateway
- [ ] Configurar frete
- [ ] Chat funciona

---

## ⚠️ RISCOS E CUIDADOS

### Riscos:
1. **Perda de dados** se migration não for bem feita
2. **Quebrar funcionalidades** existentes
3. **RLS Policies** podem bloquear acessos

### Cuidados:
1. **BACKUP** do banco antes de qualquer migration
2. **Testar** em ambiente de desenvolvimento primeiro
3. **Commit** pequeno por arquivo
4. **Não mexer** em múltiplos arquivos ao mesmo tempo

---

## 🎯 PRIORIDADE ABSOLUTA

**ORDEM DE EXECUÇÃO:**

1. 🔴 **CRÍTICO:** Migration do banco (hoje)
2. 🔴 **CRÍTICO:** database.types.ts (hoje)
3. 🟠 **ALTA:** Edge Functions de chat (amanhã)
4. 🟠 **ALTA:** APIs frontend críticas (amanhã)
5. 🟡 **MÉDIA:** Páginas frontend (depois)
6. 🟢 **BAIXA:** Páginas menos usadas (depois)

---

## 📊 PROGRESSO

- [ ] 0% - Banco de dados
- [x] 2% - chat-enhanced corrigida
- [ ] 0% - Demais edge functions
- [ ] 0% - Frontend APIs
- [ ] 0% - Frontend páginas
- [ ] 0% - Testes completos

**Estimativa:** 2-3 dias de trabalho intenso

---

## 💡 DECISÃO

**Vamos fazer isso AGORA ou DEPOIS do checkout?**

### Opção A: AGORA (Recomendado)
- ✅ Resolve problema de raiz
- ✅ Nunca mais vai dar erro
- ✅ Checkout já nascerá certo
- ❌ Demora 2-3 dias

### Opção B: DEPOIS
- ✅ Checkout sai rápido
- ❌ Vai dar erro de organização
- ❌ Vai ter que refazer
- ❌ Problema persiste

**RECOMENDAÇÃO: Fazer AGORA e fazer BEM FEITO!**


