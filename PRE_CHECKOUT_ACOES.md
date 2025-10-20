# 🎯 AÇÕES PRÉ-CHECKOUT - Lista de Tarefas

**Data:** 20 de Outubro de 2025  
**Objetivo:** Preparar sistema para implementação do checkout de pagamento  
**Prioridade:** 🔴 CRÍTICO

---

## 📊 OVERVIEW

### Tarefas Totais: **15**
### Tempo Estimado: **3-5 dias**
### Status: ⏳ Aguardando execução

---

## 🔴 FASE 1: REMOVER DADOS MOCKADOS (Dia 1-2)

### 1.1 Dashboard - Métricas Reais
**Arquivo:** `src/pages/app/UnifiedDashboardPage.tsx`

**Problema:**
```typescript
// MOCKADO - src/data/mocks.ts
export const dashboardMetrics: Metric[] = [
  { title: 'Total de Campanhas', value: '12', change: '+2' },
  { title: 'Cliques Totais', value: '3,456', change: '+12.5%' },
  { title: 'Taxa de Conversão', value: '4.2%', change: '-0.8%' },
  { title: 'ROI', value: 'R$ 8,920', change: '+21%' }
];
```

**Solução:**
```typescript
// REAL - Buscar do banco
const fetchMetrics = async () => {
  const { data: campaigns } = await supabase
    .from('Campaign')
    .select('*')
    .eq('organizationId', user.organizationId);

  const totalCampaigns = campaigns?.length || 0;
  const totalClicks = campaigns?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
  const totalConversions = campaigns?.reduce((sum, c) => sum + (c.conversions || 0), 0) || 0;
  const totalSpent = campaigns?.reduce((sum, c) => sum + (c.budgetSpent || 0), 0) || 0;
  const totalRevenue = campaigns?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0;
  
  const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
  const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;

  return {
    totalCampaigns,
    totalClicks: totalClicks.toLocaleString(),
    conversionRate: `${conversionRate.toFixed(1)}%`,
    roi: `R$ ${totalRevenue.toLocaleString()}`
  };
};
```

**Tempo:** 2 horas  
**Prioridade:** 🔴 CRÍTICO

---

### 1.2 Dashboard - Gráfico de Performance
**Arquivo:** `src/pages/app/UnifiedDashboardPage.tsx`

**Problema:**
```typescript
// MOCKADO - Dados aleatórios
export const chartData = Array.from({ length: 12 }, (_, i) => {
  return {
    name: month,
    Cliques: Math.floor(Math.random() * 5000),
    Conversoes: Math.floor(Math.random() * 500),
  };
});
```

**Solução:**
```typescript
// REAL - Agregar por mês
const fetchChartData = async () => {
  const { data: campaigns } = await supabase
    .from('Campaign')
    .select('clicks, conversions, createdAt')
    .eq('organizationId', user.organizationId)
    .gte('createdAt', startDate)
    .lte('createdAt', endDate);

  // Agrupar por mês
  const monthlyData = campaigns?.reduce((acc, campaign) => {
    const month = new Date(campaign.createdAt).toLocaleString('pt-BR', { month: 'short' });
    if (!acc[month]) {
      acc[month] = { name: month, Cliques: 0, Conversoes: 0 };
    }
    acc[month].Cliques += campaign.clicks || 0;
    acc[month].Conversoes += campaign.conversions || 0;
    return acc;
  }, {});

  return Object.values(monthlyData);
};
```

**Tempo:** 2 horas  
**Prioridade:** 🔴 CRÍTICO

---

### 1.3 Campanhas - Lista Real
**Arquivo:** `src/pages/app/UnifiedDashboardPage.tsx`

**Problema:**
```typescript
// MOCKADO - 10 campanhas falsas
export const allCampaigns: Campaign[] = [
  { id: 'CAM-001', name: 'Lançamento Verão 2025', ...},
  { id: 'CAM-002', name: 'Promoção Black Friday', ...},
  // ...8 mais
];
```

**Solução:**
```typescript
// REAL - Buscar do banco
const { campaigns } = useStore(); // Já busca do banco via loadCampaigns()

// OU query direta
const { data: campaigns } = await supabase
  .from('Campaign')
  .select('*')
  .eq('organizationId', user.organizationId)
  .order('createdAt', { ascending: false });
```

**Ação:** Remover import de `allCampaigns` de `mocks.ts`

**Tempo:** 30 minutos  
**Prioridade:** 🔴 CRÍTICO

---

### 1.4 Chat - Conversas Reais
**Arquivo:** `src/pages/app/ChatPage.tsx`

**Problema:**
```typescript
// MOCKADO - 3 conversas falsas
export const chatConversations: ChatConversation[] = [
  { id: 'conv-1', title: 'Campanha de Facebook Ads', messages: [...] },
  { id: 'conv-2', title: 'Análise da última semana', messages: [...] },
  { id: 'conv-3', title: 'Sugestões de otimização', messages: [...] }
];
```

**Solução:**
```typescript
// REAL - Buscar do banco
const { conversations } = useStore(); // Já busca via loadConversations()

// OU query direta
const { data: conversations } = await supabase
  .from('ChatConversation')
  .select(`
    id,
    title,
    createdAt,
    ChatMessage (
      id,
      role,
      content,
      createdAt
    )
  `)
  .eq('organizationId', user.organizationId)
  .order('createdAt', { ascending: false });
```

**Ação:** Remover import de `chatConversations` de `mocks.ts`

**Tempo:** 1 hora  
**Prioridade:** 🔴 CRÍTICO

---

### 1.5 Billing - Faturas Reais
**Arquivo:** `src/pages/app/settings/BillingTab.tsx`

**Problema:**
```typescript
// MOCKADO - 4 faturas falsas
export const billingHistory: Invoice[] = [
  { id: 'INV-001', date: '01/06/2025', amount: 'R$ 99,00', status: 'Paga' },
  { id: 'INV-002', date: '01/05/2025', amount: 'R$ 99,00', status: 'Paga' },
  { id: 'INV-003', date: '01/04/2025', amount: 'R$ 99,00', status: 'Paga' },
  { id: 'INV-004', date: '01/03/2025', amount: 'R$ 99,00', status: 'Paga' }
];
```

**Solução:**
```typescript
// REAL - Buscar do Stripe/Asaas
const fetchInvoices = async () => {
  const { data: subscription } = await supabase
    .from('Subscription')
    .select('stripeSubscriptionId')
    .eq('organizationId', user.organizationId)
    .single();

  // Buscar faturas do Stripe
  const response = await fetch('/api/stripe/invoices', {
    method: 'POST',
    body: JSON.stringify({ subscriptionId: subscription.stripeSubscriptionId })
  });

  return await response.json();
};
```

**Ação:** Criar Edge Function para buscar faturas do gateway

**Tempo:** 2 horas  
**Prioridade:** 🟡 MÉDIO

---

## 🟡 FASE 2: ESTRUTURA DE PAGAMENTO (Dia 3)

### 2.1 Definir Planos
**Arquivo:** `src/data/plans.ts` (CRIAR)

**Criar:**
```typescript
export type Plan = {
  id: 'free' | 'pro' | 'enterprise';
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    maxCampaigns: number;
    maxUsers: number;
    maxChatMessages: number;
  };
  stripePriceId?: string; // Price ID do Stripe
};

export const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 0,
    interval: 'month',
    features: [
      '5 campanhas ativas',
      '1.000 mensagens IA/mês',
      '1 usuário',
      'Integrações básicas',
      'Suporte por email'
    ],
    limits: {
      maxCampaigns: 5,
      maxUsers: 1,
      maxChatMessages: 1000
    }
  },
  {
    id: 'pro',
    name: 'Profissional',
    price: 99,
    interval: 'month',
    features: [
      '50 campanhas ativas',
      '10.000 mensagens IA/mês',
      '5 usuários',
      'Todas as integrações',
      'Relatórios avançados',
      'Suporte prioritário'
    ],
    limits: {
      maxCampaigns: 50,
      maxUsers: 5,
      maxChatMessages: 10000
    },
    stripePriceId: 'price_xxxxxxxxxxxxx' // Configurar no Stripe
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299,
    interval: 'month',
    features: [
      'Campanhas ilimitadas',
      'Mensagens IA ilimitadas',
      'Usuários ilimitados',
      'API dedicada',
      'White-label',
      'Gerente de conta dedicado',
      'Suporte 24/7'
    ],
    limits: {
      maxCampaigns: -1, // ilimitado
      maxUsers: -1,
      maxChatMessages: -1
    },
    stripePriceId: 'price_yyyyyyyyyyyyy'
  }
];
```

**Tempo:** 1 hora  
**Prioridade:** 🔴 CRÍTICO

---

### 2.2 Escolher Gateway de Pagamento

**Opções:**

#### A. Stripe (Recomendado internacional)
```bash
npm install @stripe/stripe-js stripe
```

**Prós:**
- Checkout pronto (Stripe Checkout)
- Webhooks confiáveis
- Suporte a múltiplas moedas
- SDKs excelentes
- Bem documentado

**Contras:**
- Taxa de 3.4% + R$ 0.40
- Requer conta bancária no exterior para alguns recursos

#### B. Asaas (Recomendado Brasil)
```bash
npm install asaas-sdk
```

**Prós:**
- PIX instantâneo
- Boleto bancário
- Cartão nacional
- Taxa competitiva (2.99%)
- Suporte em português

**Contras:**
- Menos features que Stripe
- Webhooks menos robustos

#### C. Mercado Pago
```bash
npm install mercadopago
```

**Prós:**
- Popular no Brasil
- Parcelamento sem juros
- PIX

**Contras:**
- UX inferior
- Mais complexo de integrar

**Recomendação:** **Stripe** (mais completo) ou **Asaas** (Brasil-focused)

**Tempo:** 30 minutos (decisão)  
**Prioridade:** 🔴 CRÍTICO

---

### 2.3 Configurar SDK do Gateway
**Arquivo:** `src/lib/stripe.ts` (CRIAR)

```typescript
import { loadStripe } from '@stripe/stripe-js';

export const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

export const createCheckoutSession = async (priceId: string) => {
  const response = await fetch('/functions/v1/create-checkout-session', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ priceId })
  });

  return await response.json();
};
```

**Tempo:** 1 hora  
**Prioridade:** 🔴 CRÍTICO

---

## 🟢 FASE 3: EDGE FUNCTIONS (Dia 4)

### 3.1 Webhook Handler
**Arquivo:** `supabase/functions/stripe-webhook/index.ts` (CRIAR)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Handle events
  switch (event.type) {
    case 'checkout.session.completed':
      // Criar/atualizar subscription
      await handleCheckoutCompleted(event.data.object);
      break;
    
    case 'customer.subscription.updated':
      // Atualizar plano
      await handleSubscriptionUpdated(event.data.object);
      break;
    
    case 'customer.subscription.deleted':
      // Cancelar subscription
      await handleSubscriptionCanceled(event.data.object);
      break;
    
    case 'invoice.payment_succeeded':
      // Pagamento aprovado
      await handlePaymentSucceeded(event.data.object);
      break;
    
    case 'invoice.payment_failed':
      // Pagamento falhou
      await handlePaymentFailed(event.data.object);
      break;
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

**Tempo:** 3 horas  
**Prioridade:** 🔴 CRÍTICO

---

### 3.2 Create Checkout Session
**Arquivo:** `supabase/functions/create-checkout-session/index.ts` (CRIAR)

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

serve(async (req) => {
  // Autenticar usuário
  const token = req.headers.get('Authorization')?.replace('Bearer ', '');
  const { data: { user } } = await supabase.auth.getUser(token);

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Buscar organização
  const { data: userData } = await supabase
    .from('User')
    .select('organizationId')
    .eq('id', user.id)
    .single();

  const { priceId } = await req.json();

  // Criar Checkout Session
  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${req.headers.get('origin')}/pricing`,
    metadata: {
      organizationId: userData.organizationId,
      userId: user.id
    }
  });

  return new Response(
    JSON.stringify({ sessionId: session.id }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

**Tempo:** 2 horas  
**Prioridade:** 🔴 CRÍTICO

---

### 3.3 Verificar Limites
**Arquivo:** `src/lib/api/limits.ts` (CRIAR)

```typescript
export const checkCampaignLimit = async (organizationId: string) => {
  const { data: org } = await supabase
    .from('Organization')
    .select('maxCampaigns')
    .eq('id', organizationId)
    .single();

  const { data: campaigns } = await supabase
    .from('Campaign')
    .select('id')
    .eq('organizationId', organizationId);

  if (campaigns.length >= org.maxCampaigns && org.maxCampaigns !== -1) {
    throw new Error(`Limite de campanhas atingido (${org.maxCampaigns}). Faça upgrade do seu plano!`);
  }

  return true;
};

export const checkChatMessageLimit = async (organizationId: string) => {
  const { data: usage } = await supabase
    .from('UsageTracking')
    .select('count, limit')
    .eq('organizationId', organizationId)
    .eq('metric', 'chatMessages')
    .eq('period', new Date().toISOString().slice(0, 7)) // YYYY-MM
    .single();

  if (usage && usage.count >= usage.limit && usage.limit !== -1) {
    throw new Error(`Limite de mensagens atingido (${usage.limit}/mês). Faça upgrade!`);
  }

  return true;
};
```

**Tempo:** 1 hora  
**Prioridade:** 🟡 MÉDIO

---

## 🎨 FASE 4: FRONTEND (Dia 5 - AGUARDANDO IMAGENS)

### 4.1 Página de Planos (/pricing)
**Arquivo:** `src/pages/public/PricingPage.tsx` (CRIAR)

**Aguardando:** Suas imagens de como quer o design

**Features necessárias:**
- Cards de planos lado a lado
- Comparação de features
- Botão "Escolher Plano"
- Badge "Mais popular" no plano Pro
- Toggle mensal/anual (opcional)

**Tempo:** 3 horas  
**Prioridade:** 🔴 CRÍTICO

---

### 4.2 Página de Checkout (/checkout)
**Arquivo:** `src/pages/checkout/CheckoutPage.tsx` (CRIAR)

**Aguardando:** Suas imagens

**Features necessárias:**
- Resumo do plano escolhido
- Formulário de dados do cartão (Stripe Elements)
- Informações de cobrança
- Botão "Confirmar Pagamento"
- Loading states

**Tempo:** 4 horas  
**Prioridade:** 🔴 CRÍTICO

---

### 4.3 Página de Sucesso (/checkout/success)
**Arquivo:** `src/pages/checkout/SuccessPage.tsx` (CRIAR)

**Features:**
- Mensagem de sucesso
- Detalhes do plano ativado
- Botão "Ir para Dashboard"
- Email de confirmação enviado

**Tempo:** 1 hora  
**Prioridade:** 🔴 CRÍTICO

---

### 4.4 Página de Erro (/checkout/error)
**Arquivo:** `src/pages/checkout/ErrorPage.tsx` (CRIAR)

**Features:**
- Mensagem de erro
- Motivo da falha
- Botão "Tentar Novamente"
- Suporte ao cliente

**Tempo:** 1 hora  
**Prioridade:** 🟡 MÉDIO

---

### 4.5 Botão de Upgrade na Dashboard
**Arquivo:** `src/pages/app/UnifiedDashboardPage.tsx`

**Adicionar:**
```typescript
{totalCampaigns >= organization.maxCampaigns && (
  <Alert variant="warning">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Limite de campanhas atingido!</AlertTitle>
    <AlertDescription>
      Você atingiu o limite de {organization.maxCampaigns} campanhas.
      <Button asChild variant="outline" className="ml-4">
        <Link to="/pricing">Fazer Upgrade</Link>
      </Button>
    </AlertDescription>
  </Alert>
)}
```

**Tempo:** 30 minutos  
**Prioridade:** 🟡 MÉDIO

---

## 📋 CHECKLIST COMPLETO

### Backend:
- [ ] Remover `dashboardMetrics` mockado
- [ ] Remover `chartData` mockado
- [ ] Remover `allCampaigns` mockado
- [ ] Remover `chatConversations` mockado
- [ ] Remover `billingHistory` mockado
- [ ] Criar `plans.ts`
- [ ] Escolher gateway (Stripe/Asaas)
- [ ] Configurar SDK
- [ ] Edge Function: `stripe-webhook`
- [ ] Edge Function: `create-checkout-session`
- [ ] Implementar verificação de limites

### Frontend:
- [ ] Substituir dados mockados por queries reais
- [ ] Página `/pricing`
- [ ] Página `/checkout`
- [ ] Página `/checkout/success`
- [ ] Página `/checkout/error`
- [ ] Botão de upgrade quando limite atingido
- [ ] Adicionar rotas no `App.tsx`

### Configuração:
- [ ] Criar conta no Stripe/Asaas
- [ ] Obter API keys
- [ ] Criar produtos e preços
- [ ] Configurar webhooks
- [ ] Testar em modo test
- [ ] Adicionar env vars no Supabase

---

## 🚀 ORDEM DE EXECUÇÃO

### 1. Primeira (você faz):
- Escolher gateway
- Criar conta
- Obter API keys
- Definir preços dos planos

### 2. Segunda (eu faço):
- Remover dados mockados
- Implementar Edge Functions
- Criar páginas de checkout

### 3. Terceira (juntos):
- Testar fluxo completo
- Ajustar design
- Deploy para produção

---

## ⏰ CRONOGRAMA

**Segunda-feira:**
- Remover dados mockados (4h)

**Terça-feira:**
- Definir planos e gateway (2h)
- Configurar SDK (2h)

**Quarta-feira:**
- Edge Functions (5h)

**Quinta-feira:**
- Páginas frontend (aguardando imagens) (8h)

**Sexta-feira:**
- Testes e ajustes (4h)
- Deploy (1h)

**Total:** 26 horas (3-4 dias úteis)

---

## 💰 CUSTOS ESTIMADOS

### Stripe:
- Setup: Gratuito
- Taxa: 3.4% + R$ 0.40 por transação
- Sem mensalidade

### Asaas:
- Setup: Gratuito
- Taxa: 2.99% por transação
- Sem mensalidade

---

## 📞 PRÓXIMOS PASSOS

1. **VOCÊ:** Enviar imagens de como quer o checkout
2. **VOCÊ:** Escolher gateway (Stripe ou Asaas)
3. **VOCÊ:** Criar conta no gateway escolhido
4. **EU:** Começar implementação seguindo este documento

---

**Status:** ⏳ Aguardando suas imagens e decisão sobre gateway!

**Pronto para iniciar assim que você confirmar! 🚀**
