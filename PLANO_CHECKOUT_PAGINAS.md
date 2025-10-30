# 📋 PLANO - PÁGINAS DO CHECKOUT ONBOARDING

**Data:** 30 de Outubro de 2025  
**Status:** 🔨 EM CONSTRUÇÃO

---

## ✅ CONCLUÍDO

### 1. Migration do Banco de Dados
- ✅ **Arquivo:** `supabase/migrations/20251030000000_checkout_onboarding_setup.sql`
- ✅ Adiciona campos em `User`: stripeCustomerId, subscriptionId, domain, domainVerified
- ✅ Remove `organizationId` de `GatewayConfig` e adiciona `userId`
- ✅ Cria tabela `ShippingMethod` com RLS policies
- ✅ Adiciona índices para performance
- ✅ Triggers de `updatedAt`

**AÇÃO NECESSÁRIA:** Executar migration no Supabase SQL Editor

---

## 🎯 PADRÃO DE DESIGN IDENTIFICADO

Baseado na análise das páginas existentes (`SettingsPage`, `GatewaysPage`, `DomainValidationPage`):

### Estrutura Padrão
```tsx
<DashboardLayout>
  <div className="space-y-6">
    {/* Header */}
    <div>
      <h1 className="text-3xl font-bold tracking-tight">Título</h1>
      <p className="text-muted-foreground">Descrição</p>
    </div>

    {/* Content Cards */}
    <Card>
      <CardHeader>
        <CardTitle>...</CardTitle>
        <CardDescription>...</CardDescription>
      </CardHeader>
      <CardContent>...</CardContent>
      <CardFooter>
        <Button>...</Button>
      </CardFooter>
    </Card>
  </div>
</DashboardLayout>
```

### Componentes UI Usados
- `Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`
- `Button` (variants: default, outline, ghost)
- `Input`, `Label`, `Textarea`
- `Switch`, `Badge`, `Tabs`
- `Dialog` para modais
- `Alert` para avisos
- `Skeleton` para loading

### Cores e Temas
- Primary: Blue/Purple gradient
- Success: Green-500/600
- Error: Red-500/600
- Muted: Gray-400/500/600
- Text: gray-900 (dark), gray-600 (muted)

---

## 📄 PÁGINAS A CRIAR

### 1. Página de Faturamento (`/settings?tab=billing`)

**Arquivo:** Já existe parcialmente em `src/pages/app/settings/BillingTab.tsx`

**Funcionalidade:**
- Formulário de cartão de crédito (Stripe Elements)
- Planos disponíveis (Free, Pro, Enterprise)
- Histórico de pagamentos
- Próxima cobrança

**Campos a salvar em User:**
- `stripeCustomerId`
- `subscriptionId`
- `subscriptionStatus`
- `subscriptionPlan`

**Design:**
```
┌─────────────────────────────────────────┐
│ Faturamento                             │
│ Gerencie seu cartão e assinatura       │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Plano Atual: Free            🔄     ││
│ │ Próxima cobrança: -                 ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Adicionar Cartão de Crédito         ││
│ │ [Stripe Card Element]               ││
│ │ [Salvar Cartão]                     ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

### 2. Página de Domínio (`/checkout/domain`)

**Arquivo:** Já existe em `src/pages/app/DomainValidationPage.tsx` (PRECISA ATUALIZAR)

**Funcionalidade:**
- Input de domínio
- Instruções de configuração DNS
- Verificação de domínio
- Status de SSL

**Campos a salvar em User:**
- `domain`
- `domainVerified`
- `domainVerifiedAt`

**Design:**
```
┌─────────────────────────────────────────┐
│ Verificação de Domínio                  │
│ Configure seu domínio personalizado     │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Seu Domínio                         ││
│ │ checkout.[seudominio.com]     ❌    ││
│ │ [Verificar]                         ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ Instruções de Configuração          ││
│ │ 1. Adicione registro CNAME:         ││
│ │    checkout -> xxx.syncads.com.br   ││
│ │ 2. Aguarde propagação DNS (24h)     ││
│ │ 3. Clique em Verificar              ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

### 3. Página de Gateway (`/checkout/gateways`)

**Arquivo:** Já existe em `src/pages/app/checkout/GatewaysPage.tsx` (PRECISA ATUALIZAR)

**Funcionalidade:**
- Lista de gateways disponíveis
- Busca e filtros
- Configuração de API keys
- Teste de conexão

**Dados em GatewayConfig:**
- `userId` (substituiu organizationId)
- `gatewayId`
- `credentials` (JSON)
- `isActive`

**Design:**
```
┌─────────────────────────────────────────┐
│ Gateways de Pagamento                   │
│ Configure seus meios de pagamento       │
│                                         │
│ [🔍 Buscar]  [Todos ▾]                 │
│                                         │
│ Gateways Populares                      │
│ ┌─────┐ ┌─────┐ ┌─────┐               │
│ │Stripe│ │MP   │ │Asaas│               │
│ │✓    │ │     │ │     │               │
│ └─────┘ └─────┘ └─────┘               │
└─────────────────────────────────────────┘
```

---

### 4. Página de Frete (`/checkout/shipping`)

**Arquivo:** Já existe parcialmente em `src/pages/app/ShippingPage.tsx` (PRECISA RECONSTRUIR)

**Funcionalidade:**
- Criar método de frete
- Definir preço e prazo
- Frete grátis acima de X
- Ativar/Desativar métodos

**Dados em ShippingMethod:**
- `userId`
- `name`
- `price`
- `estimatedDays`
- `freeShippingMinValue`
- `isActive`

**Design:**
```
┌─────────────────────────────────────────┐
│ Métodos de Frete                        │
│ Configure as opções de entrega          │
│                                         │
│ [+ Novo Método de Frete]               │
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 📦 Correios PAC              🟢     ││
│ │    R$ 15,00 • 7-10 dias            ││
│ │    [Editar] [Desativar]            ││
│ └─────────────────────────────────────┘│
│                                         │
│ ┌─────────────────────────────────────┐│
│ │ 🚚 Correios SEDEX            🟢     ││
│ │    R$ 25,00 • 2-5 dias             ││
│ │    [Editar] [Desativar]            ││
│ └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

---

## 🔄 ORDEM DE IMPLEMENTAÇÃO

1. ✅ Migration do banco
2. ⏳ Atualizar `GatewaysPage` (remover organizationId)
3. ⏳ Atualizar `DomainValidationPage` (remover organizationId)
4. ⏳ Criar/Atualizar `BillingTab` (Stripe integration)
5. ⏳ Reconstruir `ShippingPage` completo

---

## 🎨 COMPONENTES REUTILIZÁVEIS

### StatusBadge
```tsx
<Badge variant={isActive ? "success" : "secondary"}>
  {isActive ? "Ativo" : "Inativo"}
</Badge>
```

### StatusIndicator (Bolinha)
```tsx
<div className={`h-3 w-3 rounded-full ${
  completed ? 'bg-green-500' : 'bg-red-500'
}`} />
```

### ConfigCard
```tsx
<Card className="hover:shadow-md transition-shadow">
  <CardContent className="p-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Icon />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <Button size="sm" variant="outline">
        Configurar
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 📦 INTEGRAÇÕES NECESSÁRIAS

### Stripe (Billing)
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

```tsx
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.VITE_STRIPE_PUBLIC_KEY);
```

### DNS Verification (Domain)
- Edge Function para verificar DNS records
- Polling para status de verificação

---

## 🧪 TESTES

### Checklist de Teste por Página

**Billing:**
- [ ] Adicionar cartão de crédito
- [ ] Ver plano atual
- [ ] Atualizar plano
- [ ] Ver histórico

**Domain:**
- [ ] Adicionar domínio
- [ ] Copiar instruções DNS
- [ ] Verificar domínio
- [ ] Ver status SSL

**Gateway:**
- [ ] Buscar gateway
- [ ] Configurar Stripe
- [ ] Testar conexão
- [ ] Ativar/Desativar

**Shipping:**
- [ ] Criar método
- [ ] Editar método
- [ ] Desativar método
- [ ] Configurar frete grátis

---

## 📝 PRÓXIMOS PASSOS

1. **AGORA:** Executar migration no Supabase
2. **DEPOIS:** Atualizar páginas existentes (Gateway, Domain)
3. **POR ÚLTIMO:** Criar páginas novas (Billing, Shipping)

---

**Nota:** Todas as páginas devem seguir o padrão de design identificado e remover completamente referências a `organizationId`.


