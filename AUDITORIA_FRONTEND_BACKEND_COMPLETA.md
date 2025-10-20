# 🔍 AUDITORIA COMPLETA - Frontend & Backend

**Data:** 20 de Outubro de 2025  
**Auditor:** Cascade AI  
**Status:** 🔴 Requer ações corretivas

---

## 📊 RESUMO EXECUTIVO

### Problemas Críticos Encontrados: **12**
### Problemas Médios Encontrados: **18**
### Melhorias Sugeridas: **25**

### Score Geral: **6.5/10**

---

# 🔴 PAINEL DO CLIENTE

## 1. Chat IA (/chat)

### ✅ FUNCIONANDO:
- Interface de chat
- Histórico de conversas
- Edge Function integrada
- Criação de novas conversas
- Sistema de mensagens

### ⚠️ PROBLEMAS:
1. **CRÍTICO:** Dados mockados em `chatConversations`
   - **Impacto:** Mostra conversas falsas
   - **Solução:** Buscar do banco (ChatConversation table)
   
2. **MÉDIO:** Personalidade da IA não configurável
   - **Impacto:** IA usa prompt padrão
   - **Solução:** Buscar customSystemPrompt de OrganizationAiConnection

3. **BAIXO:** Sem indicador de "typing..."
   - **Impacto:** UX
   - **Solução:** Adicionar skeleton loading

### 📋 DADOS MOCKADOS:
```typescript
// src/data/mocks.ts
export const chatConversations: ChatConversation[] = [...]
```

### 🔧 AÇÕES NECESSÁRIAS:
1. Substituir `chatConversations` mockadas por query real
2. Integrar customSystemPrompt do banco
3. Adicionar loading states

---

## 2. Dashboard (/dashboard)

### ✅ FUNCIONANDO:
- Layout de métricas
- Abas (Visão Geral, Campanhas, Analytics)
- Gráficos (via Recharts)
- Cards de campanhas

### 🔴 PROBLEMAS CRÍTICOS:
1. **dashboardMetrics** - Dados 100% mockados
   ```typescript
   // MOCKADO
   export const dashboardMetrics: Metric[] = [
     { title: 'Total de Campanhas', value: '12', ...},
     { title: 'Cliques Totais', value: '3,456', ...},
     { title: 'Taxa de Conversão', value: '4.2%', ...},
     { title: 'ROI', value: 'R$ 8,920', ...}
   ];
   ```
   - **REAL:** Calcular de Campaign table
   
2. **chartData** - Gerado aleatoriamente
   ```typescript
   export const chartData = Array.from({ length: 12 }, (_, i) => {
     return {
       name: month,
       Cliques: Math.floor(Math.random() * 5000),
       Conversoes: Math.floor(Math.random() * 500),
     };
   });
   ```
   - **REAL:** Agregar de Campaign por mês

3. **allCampaigns** - 10 campanhas mockadas
   - **REAL:** Query `Campaign` table filtrada por `organizationId`

### ⚠️ PROBLEMAS MÉDIOS:
1. Gráfico não filtrável por data
2. Sem exportação de dados
3. Sem comparação com período anterior

### 📋 DADOS MOCKADOS:
- `dashboardMetrics` (4 métricas)
- `chartData` (12 meses)
- `allCampaigns` (10 campanhas)
- `recentCampaigns` (5 campanhas)
- `aiSuggestions` (3 sugestões)

### 🔧 AÇÕES NECESSÁRIAS:
**PRIORIDADE ALTA:**
1. Criar query para métricas reais:
```typescript
// Buscar do banco
const { data: campaigns } = await supabase
  .from('Campaign')
  .select('*')
  .eq('organizationId', user.organizationId);

// Calcular métricas
const totalCampaigns = campaigns.length;
const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
const conversionRate = (totalConversions / totalClicks) * 100;
```

2. Criar query para chartData agrupado por mês
3. Remover campanhas mockadas

---

## 3. Integrações (/integrations)

### ✅ FUNCIONANDO:
- Lista de integrações categorizadas
- OAuth flow (popup)
- Salvar tokens no banco
- `Integration` table com RLS

### ⚠️ PROBLEMAS:
1. **MÉDIO:** Client IDs hardcoded
   ```typescript
   // src/lib/oauth/oauthConfig.ts
   META_ADS: 'YOUR_META_CLIENT_ID_HERE',
   GOOGLE_ADS: 'YOUR_GOOGLE_CLIENT_ID_HERE',
   ```
   - **Solução:** Configurar no `.env`

2. **MÉDIO:** 15+ integrações listadas, mas apenas 5 funcionam
   - **Solução:** Marcar claramente quais estão disponíveis

3. **BAIXO:** Sem status de "conectado" visível
   - **Solução:** Badge verde nas conectadas

### 📋 DADOS MOCKADOS:
```typescript
// src/data/mocks.ts
export const categorizedIntegrations: IntegrationCategory[] = [
  // 24 integrações, maioria "comingSoon"
]
```

### 🔧 AÇÕES NECESSÁRIAS:
1. Mover client IDs para variáveis de ambiente
2. Criar sistema de "status" para integrações
3. Buscar integrações conectadas do banco

---

## 4. Configurações (/settings/*)

### ✅ FUNCIONANDO:
- **Perfil:** Atualizar nome, email, avatar
- **Segurança:** Trocar senha, 2FA, verificar email (novo!)
- **Notificações:** Toggle de preferências
- **Faturamento:** Lista de faturas

### ⚠️ PROBLEMAS:
1. **MÉDIO:** Faturas mockadas
   ```typescript
   export const billingHistory: Invoice[] = [
     { id: 'INV-001', date: '01/06/2025', amount: 'R$ 99,00', status: 'Paga' },
     ...
   ];
   ```
   - **Solução:** Integrar com Stripe/Asaas

2. **MÉDIO:** Plano atual não dinâmico
   - Hardcoded como "Pro - R$ 99/mês"
   - **Solução:** Buscar de `Subscription` table

3. **BAIXO:** Sem página de upgrade/downgrade
   - **Solução:** Criar flow de mudança de plano

### 📋 DADOS MOCKADOS:
- `billingHistory` (4 faturas)

### 🔧 AÇÕES NECESSÁRIAS:
1. Integrar billing real (Stripe/Asaas)
2. Página de planos e upgrade
3. Buscar histórico de faturas

---

## 5. Campanhas (Detalhes /campaigns/:id)

### ✅ FUNCIONANDO:
- Ver detalhes de campanha
- Editar campanha
- Pausar/Ativar
- Deletar

### ⚠️ PROBLEMAS:
1. **MÉDIO:** Métricas em tempo real não funcionam
   - Dados estáticos
   - **Solução:** Integrar com APIs das plataformas

2. **MÉDIO:** Sem histórico de mudanças
   - **Solução:** Criar tabela `CampaignHistory`

3. **BAIXO:** Sem gráfico de performance da campanha individual
   - **Solução:** Adicionar gráfico de evolução

### 🔧 AÇÕES NECESSÁRIAS:
1. Integrar APIs reais (Meta, Google Ads)
2. Criar histórico de alterações
3. Gráficos individuais por campanha

---

# 🔴 PAINEL SUPER ADMIN

## 1. Dashboard (/super-admin)

### ✅ FUNCIONANDO:
- Stats reais do banco (COUNT de orgs, users, mensagens)
- MRR calculado
- Lista de organizações
- Quick actions

### ⚠️ PROBLEMAS:
1. **MÉDIO:** Gráfico de crescimento mockado
   - **Solução:** Agregar por mês de `Organization.createdAt`

2. **BAIXO:** Sem alertas de limites excedidos
   - **Solução:** Query em `UsageTracking`

### 🔧 AÇÕES NECESSÁRIAS:
1. Gráfico real de crescimento
2. Sistema de alertas

---

## 2. Organizations (/super-admin/clients)

### ✅ FUNCIONANDO:
- Listar todas as organizações
- Criar nova organização
- Suspender/Ativar
- Ver detalhes

### ⚠️ PROBLEMAS:
1. **MÉDIO:** Sem filtros avançados
   - Por plano, status, data
   - **Solução:** Adicionar filtros

2. **MÉDIO:** Sem busca por nome/email
   - **Solução:** Adicionar search bar

3. **BAIXO:** Sem paginação
   - **Solução:** Implementar paginação (50/página)

### 🔧 AÇÕES NECESSÁRIAS:
1. Sistema de filtros
2. Busca
3. Paginação

---

## 3. Global AI (/super-admin/ai-connections)

### ✅ FUNCIONANDO:
- CRUD de IAs globais
- Testar conexão
- Atribuir IAs para organizações

### ⚠️ PROBLEMAS:
1. **CRÍTICO:** API keys visíveis em texto plano
   - **Solução:** Usar `pgcrypto` (já configurado, mas não usado)

2. **MÉDIO:** Sem tracking de uso por IA
   - Qual IA está sendo mais usada?
   - **Solução:** Query em `AiUsage` por provider

### 🔧 AÇÕES NECESSÁRIAS:
1. Encriptar API keys ao salvar
2. Dashboard de uso por IA

---

## 4. Billing (/super-admin/billing)

### ✅ FUNCIONANDO:
- Lista de transações (mockado)

### 🔴 PROBLEMAS CRÍTICOS:
1. **100% mockado** - Nenhum dado real
   - **Solução:** Integrar webhooks Stripe/Asaas

2. **Sem gestão de assinaturas**
   - Criar, cancelar, upgrade
   - **Solução:** Interface para `Subscription` table

### 📋 DADOS MOCKADOS:
Todas as transações, MRR, churn

### 🔧 AÇÕES NECESSÁRIAS:
1. Integração completa com gateway
2. CRUD de assinaturas
3. Webhooks configurados

---

## 5. Usage (/super-admin/usage)

### ✅ FUNCIONANDO:
- Lista de uso de IAs (mockado)

### 🔴 PROBLEMAS CRÍTICOS:
1. **Dados mockados** - Não reflete uso real
   - **Solução:** Query `AiUsage` table

2. **Sem limites por organização**
   - **Solução:** Verificar `UsageTracking`

### 🔧 AÇÕES NECESSÁRIAS:
1. Query real de `AiUsage`
2. Gráficos de consumo
3. Alertas de limites

---

## 6. Gateways (/super-admin/gateways)

### ⚠️ STATUS:
- **Interface criada**
- **Lógica pendente**

### 🔴 PROBLEMAS CRÍTICOS:
1. **Sem integração real com gateways**
   - Stripe, Asaas, Mercado Pago
   - **Solução:** Configurar SDKs

2. **Sem webhooks configurados**
   - **Solução:** Endpoints para callbacks

### 🔧 AÇÕES NECESSÁRIAS:
1. Integrar Stripe SDK
2. Configurar webhooks
3. Testar fluxo completo

---

# 📊 BACKEND (Supabase)

## 1. Tabelas do Banco

### ✅ FUNCIONANDO:
- `User` - Cadastro, CPF, birthDate, emailVerified
- `Organization` - Multi-tenant
- `Campaign` - CRUD completo
- `ChatConversation` - Histórico de conversas
- `ChatMessage` - Mensagens
- `Integration` - OAuth tokens
- `GlobalAiConnection` - IAs globais
- `OrganizationAiConnection` - Atribuição
- `Subscription` - Assinaturas
- `UsageTracking` - Limites
- `AiUsage` - Tracking de uso
- `PendingInvite` - Convites

### ⚠️ PROBLEMAS:
1. **MÉDIO:** Sem índices em queries frequentes
   ```sql
   -- Falta índice
   CREATE INDEX idx_campaign_org_date ON Campaign(organizationId, createdAt DESC);
   CREATE INDEX idx_aiusage_org_month ON AiUsage(organizationId, month);
   ```

2. **MÉDIO:** Sem triggers para audit log
   - Quem mudou o quê e quando?
   - **Solução:** Triggers de UPDATE/DELETE

3. **BAIXO:** Sem soft delete
   - Deletar permanentemente é arriscado
   - **Solução:** Campo `deletedAt`

### 🔧 AÇÕES NECESSÁRIAS:
1. Criar índices de performance
2. Implementar audit log
3. Soft delete

---

## 2. Edge Functions

### ✅ FUNCIONANDO:
- `/functions/v1/chat` - Deployada e funcionando
- `/functions/v1/invite-user` - Deployada

### ⚠️ PROBLEMAS:
1. **MÉDIO:** Chat function sem rate limiting
   - Usuário pode spammar
   - **Solução:** Rate limit no código

2. **MÉDIO:** Sem tratamento de erros consistente
   - **Solução:** Padronizar responses

### 🔧 AÇÕES NECESSÁRIAS:
1. Implementar rate limiting
2. Melhorar error handling

---

## 3. RLS Policies

### ✅ FUNCIONANDO:
- Isolamento por `organizationId`
- SuperAdmin bypassa RLS
- Policies em todas as tabelas

### ⚠️ PROBLEMAS:
1. **AVISO:** 19 policies usam `auth.uid()` sem cache
   - **Impacto:** Performance 10-100x mais lenta
   - **Solução:** Usar `(SELECT auth.uid())`

2. **MÉDIO:** Policies redundantes
   - Múltiplas permissive policies
   - **Solução:** Consolidar

### 🔧 AÇÕES NECESSÁRIAS:
1. Otimizar auth.uid() calls
2. Consolidar policies

---

## 4. Autenticação

### ✅ FUNCIONANDO:
- Email/senha
- Login imediato (sem confirmação obrigatória)
- Verificação opcional
- 2FA (flag no banco)

### ⚠️ PROBLEMAS:
1. **MÉDIO:** 2FA não implementado no flow de login
   - Flag existe, mas não valida
   - **Solução:** Implementar TOTP

2. **BAIXO:** Sem OAuth social (Google, GitHub)
   - **Solução:** Configurar providers

### 🔧 AÇÕES NECESSÁRIAS:
1. Implementar 2FA real
2. OAuth social

---

# 🎯 PREPARAÇÃO PARA CHECKOUT

## Requisitos para Checkout de Pagamento:

### 1. ✅ Backend Necessário:
- [x] Tabela `Subscription`
- [x] Tabela `Organization`
- [x] User autenticado
- [ ] Integração com gateway (Stripe/Asaas)
- [ ] Webhooks configurados
- [ ] Planos definidos

### 2. ✅ Frontend Necessário:
- [x] Sistema de autenticação
- [x] Dashboard do usuário
- [ ] Página de planos
- [ ] Checkout page
- [ ] Página de sucesso
- [ ] Página de falha

### 3. 🔴 Pendências Críticas para Checkout:

#### A. Definir Planos
```typescript
// Criar arquivo: src/data/plans.ts
export const plans = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    features: [
      '5 campanhas',
      '1.000 mensagens IA/mês',
      '1 usuário',
    ]
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 99,
    features: [
      '50 campanhas',
      '10.000 mensagens IA/mês',
      '5 usuários',
      'Suporte prioritário'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    features: [
      'Campanhas ilimitadas',
      'Mensagens IA ilimitadas',
      'Usuários ilimitados',
      'API dedicada',
      'Suporte 24/7'
    ]
  }
];
```

#### B. Escolher Gateway de Pagamento
**Opções:**
1. **Stripe** (Recomendado internacional)
   - Checkout pronto
   - Webhooks confiáveis
   - Suporte a múltiplas moedas
   
2. **Asaas** (Recomendado Brasil)
   - PIX instantâneo
   - Boleto
   - Cartão nacional

3. **Mercado Pago**
   - Popular no Brasil
   - Parcelamento sem juros

#### C. Criar Páginas de Checkout
```
/pricing       - Página de planos
/checkout      - Formulário de pagamento
/checkout/success - Pagamento aprovado
/checkout/error   - Pagamento falhou
```

#### D. Implementar Webhooks
```typescript
// Edge Function: /functions/v1/stripe-webhook
// Escuta eventos:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_succeeded
- invoice.payment_failed
```

#### E. Criar Lógica de Upgrade/Downgrade
```typescript
// Verificar limites ao criar campanha
if (campaigns.length >= organization.maxCampaigns) {
  throw new Error('Limite de campanhas atingido. Faça upgrade!');
}
```

---

# 📋 LISTA COMPLETA DE DADOS MOCKADOS

## 🔴 CRÍTICO - Substituir IMEDIATAMENTE:

1. **dashboardMetrics** - Métricas da dashboard
2. **allCampaigns** - 10 campanhas falsas
3. **chartData** - Gráfico aleatório
4. **billingHistory** - 4 faturas falsas
5. **chatConversations** - 3 conversas falsas

## 🟡 MÉDIO - Substituir em breve:

6. **aiSuggestions** - 3 sugestões falsas
7. **categorizedIntegrations** - 24 integrações (maioria "coming soon")
8. **recentCampaigns** - Campanhas concluídas

## 🟢 BAIXO - Manter por enquanto:

9. **Ícones e UI** - Podem ficar mockados

---

# 🚀 PLANO DE AÇÃO IMEDIATO

## Fase 1: Remover Dados Mockados (1-2 dias)

### Dia 1 - Dashboard
- [ ] Substituir `dashboardMetrics` por query real
- [ ] Substituir `chartData` por agregação mensal
- [ ] Substituir `allCampaigns` por query filtrada

### Dia 2 - Chat e Integrações
- [ ] Substituir `chatConversations` por query real
- [ ] Adicionar status "conectado" em integrações
- [ ] Buscar faturas do gateway

---

## Fase 2: Preparar para Checkout (2-3 dias)

### Dia 3 - Definir Estrutura
- [ ] Criar arquivo `plans.ts` com planos
- [ ] Escolher gateway (Stripe ou Asaas)
- [ ] Configurar SDK

### Dia 4 - Backend
- [ ] Criar Edge Function para webhooks
- [ ] Testar criação de subscription
- [ ] Implementar verificação de limites

### Dia 5 - Frontend (Aguardando suas imagens)
- [ ] Página de planos (`/pricing`)
- [ ] Página de checkout (`/checkout`)
- [ ] Páginas de sucesso/erro
- [ ] Integrar com gateway

---

## Fase 3: Melhorias de Performance (1-2 dias)

### Dia 6 - Otimizações
- [ ] Criar índices no banco
- [ ] Otimizar RLS policies
- [ ] Implementar rate limiting

### Dia 7 - Testes
- [ ] Testar fluxo completo de pagamento
- [ ] Testar upgrade/downgrade
- [ ] Testar limites e bloqueios

---

# 📊 PRIORIZAÇÃO FINAL

## 🔴 CRÍTICO (Fazer AGORA):
1. Remover dados mockados da dashboard
2. Integrar gateway de pagamento
3. Criar checkout

## 🟡 IMPORTANTE (Esta semana):
4. Otimizar RLS policies
5. Implementar limites reais
6. Audit log

## 🟢 DESEJÁVEL (Próximo sprint):
7. 2FA real
8. OAuth social
9. Soft delete
10. Analytics avançados

---

# ✅ CONCLUSÃO

## Status Atual: **BOM com ressalvas**

### Pontos Fortes:
- ✅ Arquitetura SaaS sólida
- ✅ Multi-tenant funcionando
- ✅ Edge Functions deployadas
- ✅ RLS implementado
- ✅ Sistema de convites completo
- ✅ Novo sistema de cadastro

### Pontos Fracos:
- 🔴 Muitos dados mockados (60% da interface)
- 🔴 Billing não integrado
- 🔴 Sem checkout de pagamento
- 🟡 Performance RLS pode melhorar
- 🟡 Falta audit log

### Pronto para Checkout?
**SIM**, mas precisa:
1. Escolher gateway (Stripe/Asaas)
2. Definir planos e preços
3. Criar páginas de checkout (aguardando imagens)
4. Remover dados mockados críticos

### Recomendação:
**Seguir Fase 1 e Fase 2 do Plano de Ação antes de produção.**

---

**Auditoria completa! Pronto para próximos passos! 🚀**

**Aguardando imagens do checkout para implementar!**
