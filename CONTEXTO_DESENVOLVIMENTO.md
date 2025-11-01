# 🚀 CONTEXTO DE DESENVOLVIMENTO - SyncAds

**Data de última atualização:** 02/02/2025  
**Versão:** 3.0 (Carrinho Lateral + Busca CEP)

---

## 📋 ÍNDICE

1. [Visão Geral do Projeto](#visão-geral)
2. [Stack Tecnológica](#stack-tecnológica)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [O Que Foi Implementado](#o-que-foi-implementado)
5. [Estado Atual das Funcionalidades](#estado-atual)
6. [Próximos Passos (NA ORDEM)](#próximos-passos)
7. [Comandos Importantes](#comandos-importantes)
8. [Boas Práticas](#boas-práticas)
9. [Como NÃO Quebrar o Código](#como-não-quebrar)

---

## 🎯 VISÃO GERAL

### O que é o SyncAds?

SyncAds é um **SaaS de checkout customizado e gateway de pagamentos** para e-commerce no Brasil. Permite que lojas (Shopify, VTEX, etc.) usem um checkout próprio com múltiplas opções de pagamento.

### Fluxo Principal

```
Cliente clica "Add to Cart" (Shopify)
         ↓
Carrinho lateral abre (SyncAds)
         ↓
Cliente ajusta produtos/quantidade
         ↓
"Finalizar Compra"
         ↓
Checkout SyncAds (https://syncads-dun.vercel.app/checkout/:orderId)
         ↓
Cliente preenche dados (CEP auto-completa)
         ↓
Escolhe pagamento (PIX/Cartão/Boleto)
         ↓
Pagamento processado
```

---

## 💻 STACK TECNOLÓGICA

### Frontend
- **React 18** + **TypeScript**
- **Vite** (build tool)
- **TailwindCSS** (estilização)
- **Shadcn/ui** (componentes)
- **React Router** (rotas)
- **Zustand** (state management)

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Edge Functions** (Deno runtime)
- **Row Level Security (RLS)** para segurança

### Deploy
- **Frontend:** Vercel (https://syncads-dun.vercel.app)
- **Backend:** Supabase (https://ovskepqggmxlfckxqgbr.supabase.co)
- **Script Shopify:** Hospedado no Vercel em `/shopify-checkout-redirect.js`

### APIs Externas
- **ViaCEP** - Busca automática de endereço por CEP (Brasil)
- **Shopify Admin API** - Integração com lojas Shopify

---

## 📁 ESTRUTURA DO PROJETO

```
SyncAds/
├── public/
│   ├── shopify-checkout-redirect.js    ← Script do carrinho lateral (v3.0)
│   └── shopify-test-simple.js          ← Script de teste
│
├── src/
│   ├── components/          ← Componentes React reutilizáveis
│   ├── lib/
│   │   ├── api/            ← APIs (checkout, shopify, integrations)
│   │   ├── utils/
│   │   │   └── cepUtils.ts ← ✅ NOVO: Busca automática de CEP
│   │   └── supabase.ts     ← Cliente Supabase
│   │
│   ├── pages/
│   │   ├── app/            ← Páginas do dashboard (autenticadas)
│   │   │   ├── IntegrationDetailPage.tsx  ← Página de config Shopify
│   │   │   └── IntegrationsPage.tsx       ← Lista de integrações
│   │   └── public/
│   │       └── PublicCheckoutPage.tsx     ← Checkout público
│   │
│   ├── store/              ← Zustand stores
│   │   └── integrationsStore.ts ← ✅ MODIFICADO: Verifica ShopifyIntegration
│   │
│   └── App.tsx             ← Rotas principais
│
├── supabase/
│   ├── functions/          ← Edge Functions
│   │   ├── shopify-create-order/   ← ✅ FUNCIONANDO: Cria pedidos
│   │   ├── shopify-oauth/
│   │   ├── shopify-sync/
│   │   ├── shopify-webhook/
│   │   └── _utils/
│   │       └── cors.ts     ← ✅ MODIFICADO: Aceita lojas Shopify
│   │
│   └── migrations/         ← Migrações SQL
│       └── 20250202000000_allow_null_customer_id.sql ← ✅ APLICADA
│
├── dist/                   ← Build de produção (gerado)
└── package.json
```

---

## ✅ O QUE FOI IMPLEMENTADO

### 1. ✅ Integração Shopify Completa

**Status:** FUNCIONANDO EM PRODUÇÃO

#### Script de Carrinho Lateral (v3.0)
- **Arquivo:** `public/shopify-checkout-redirect.js`
- **URL:** https://syncads-dun.vercel.app/shopify-checkout-redirect.js
- **Funcionalidades:**
  - ✅ Intercepta botões "Add to Cart"
  - ✅ Abre carrinho lateral customizado
  - ✅ Gerencia produtos (adicionar/remover/quantidade)
  - ✅ Persiste no localStorage
  - ✅ Cria pedido via API
  - ✅ Redireciona para checkout SyncAds

#### Interface de Configuração
- **Página:** `src/pages/app/IntegrationDetailPage.tsx`
- **Rota:** `/app/integrations/shopify`
- **Features:**
  - ✅ 2 Cards lado a lado com instruções
  - ✅ Card 1: Link para download do script
  - ✅ Card 2: Botão copiar código de instalação
  - ✅ Campos de API (shopDomain, accessToken, apiKey, apiSecret)
  - ✅ Indicador verde quando ativo

#### Edge Function
- **Função:** `supabase/functions/shopify-create-order`
- **Endpoint:** `/functions/v1/shopify-create-order`
- **Status:** ✅ DEPLOYADA (--no-verify-jwt)
- **Funcionalidades:**
  - ✅ Aceita múltiplos produtos
  - ✅ Calcula totais (subtotal, impostos, frete)
  - ✅ Cria pedido no banco
  - ✅ Retorna URL do checkout
  - ✅ CORS configurado para `*.myshopify.com`

#### Banco de Dados
- **Tabela:** `ShopifyIntegration`
- **Migration:** Aplicada no Supabase
- **Campos importantes:**
  - `shopDomain` - Domínio da loja
  - `isActive` - Status (boolean)
  - `userId` - Dono da integração
- **Nota:** `Order.customerId` agora aceita NULL

---

### 2. ✅ Busca Automática de CEP

**Status:** CÓDIGO PRONTO, AGUARDANDO IMPLEMENTAÇÃO NO CHECKOUT

#### Utilitário Criado
- **Arquivo:** `src/lib/utils/cepUtils.ts`
- **Funções:**
  - `formatCep(value)` - Formata CEP (12345678 → 12345-678)
  - `cleanCep(cep)` - Remove formatação
  - `isValidCep(cep)` - Valida 8 dígitos
  - `searchCep(cep)` - Busca na API ViaCEP
  - `useCepSearch()` - Hook com debounce

#### Como Funciona
1. Cliente digita CEP
2. Quando completa 8 dígitos, busca automaticamente
3. Preenche: rua, bairro, cidade, estado
4. Foca no campo "número"
5. Cliente completa: número, complemento, telefone

---

### 3. ✅ Lista de Integrações

**Status:** FUNCIONANDO COM INDICADOR VERDE

- **Página:** `src/pages/app/IntegrationsPage.tsx`
- **Store:** `src/store/integrationsStore.ts`
- **Fix aplicado:** Store agora verifica tabela `ShopifyIntegration` para mostrar badge verde corretamente

---

## 🔧 ESTADO ATUAL

### ✅ FUNCIONANDO

- [x] Carrinho lateral Shopify com gestão de produtos
- [x] Edge Function criando pedidos com sucesso
- [x] CORS permitindo lojas Shopify
- [x] Banco aceitando pedidos sem cliente (customerId NULL)
- [x] Interface de configuração limpa e profissional
- [x] Indicador verde na lista de integrações
- [x] Utilitário de busca de CEP criado

### 🚧 PENDENTE

- [ ] Implementar busca de CEP no `PublicCheckoutPage.tsx`
- [ ] Criar tema padrão para checkout
- [ ] Sistema de personalização do checkout
- [ ] Processar pagamentos (PIX/Cartão/Boleto)
- [ ] Webhooks para atualizar status de pagamento

---

## 📝 PRÓXIMOS PASSOS (NA ORDEM)

### 1️⃣ IMPLEMENTAR BUSCA DE CEP NO CHECKOUT

**Prioridade:** ALTA  
**Tempo estimado:** 30 minutos  
**Arquivo:** `src/pages/public/PublicCheckoutPage.tsx`

**O que fazer:**

```typescript
// 1. Importar utilitários
import { formatCep, searchCep } from '@/lib/utils/cepUtils';

// 2. Adicionar state
const [loadingCep, setLoadingCep] = useState(false);

// 3. Criar handler
const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const value = e.target.value;
  const formatted = formatCep(value);
  
  setAddressData(prev => ({ ...prev, zipCode: formatted }));
  
  if (formatted.replace(/\D/g, '').length === 8) {
    setLoadingCep(true);
    try {
      const address = await searchCep(formatted);
      if (address) {
        setAddressData(prev => ({
          ...prev,
          street: address.street,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode
        }));
        document.getElementById('number')?.focus();
        toast({ title: '✅ CEP encontrado!' });
      }
    } finally {
      setLoadingCep(false);
    }
  }
};

// 4. Atualizar input de CEP
<Input
  id="zipCode"
  value={addressData.zipCode}
  onChange={handleCepChange}
  placeholder="00000-000"
  maxLength={9}
  disabled={loadingCep}
/>
{loadingCep && <Loader2 className="h-4 w-4 animate-spin" />}
```

**Testar:**
1. Ir em `/checkout/:orderId`
2. Digitar CEP: `01310-100` (exemplo)
3. Verificar se preenche automaticamente

---

### 2️⃣ CRIAR TEMA PADRÃO DO CHECKOUT

**Prioridade:** ALTA  
**Tempo estimado:** 1-2 horas

**O que criar:**

```typescript
// src/config/checkoutTheme.ts
export const DEFAULT_CHECKOUT_THEME = {
  // Cores
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  
  // Tipografia
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
  fontSize: {
    small: '14px',
    base: '16px',
    large: '20px'
  },
  
  // Botões
  buttonRadius: '8px',
  buttonPadding: '12px 24px',
  
  // Cards
  cardRadius: '12px',
  cardShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
  
  // Layout
  maxWidth: '1200px',
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  }
};
```

**Aplicar no checkout:**
1. Carregar tema do banco (tabela `CheckoutCustomization`)
2. Fallback para `DEFAULT_CHECKOUT_THEME`
3. Aplicar via CSS-in-JS ou CSS Variables

---

### 3️⃣ SISTEMA DE PERSONALIZAÇÃO

**Prioridade:** MÉDIA  
**Página:** `/app/checkout/customize`

**Funcionalidades:**
- [ ] Preview em tempo real
- [ ] Color picker para cores
- [ ] Upload de logo
- [ ] Seleção de fonte
- [ ] Customização de botões
- [ ] Salvar no banco (`CheckoutCustomization`)

---

### 4️⃣ PROCESSAR PAGAMENTOS

**Prioridade:** ALTA (após 1 e 2)

**Gateways a implementar:**
- [ ] PIX (via Mercado Pago / Asaas)
- [ ] Cartão de Crédito (idem)
- [ ] Boleto (idem)

**Edge Functions necessárias:**
- `payment-process` - Processar pagamento
- `payment-webhook` - Receber status

---

### 5️⃣ OUTRAS INTEGRAÇÕES

**Prioridade:** BAIXA

- [ ] VTEX
- [ ] Nuvemshop
- [ ] WooCommerce
- [ ] Mercado Livre

Usar o mesmo padrão do Shopify (script + edge function + UI).

---

## 🔨 COMANDOS IMPORTANTES

### Build e Deploy

```bash
# Build local
npm run build

# Deploy frontend (Vercel)
npx vercel --prod --yes

# Deploy Edge Function
npx supabase functions deploy shopify-create-order --no-verify-jwt

# Deploy todas as funções
npx supabase functions deploy --no-verify-jwt
```

### Git

```bash
# Commit rápido
git add -A && git commit -m "feat: descrição" && git push

# Ver mudanças
git diff

# Reverter arquivo
git checkout caminho/do/arquivo.tsx

# Ver status
git status
```

### Supabase

```bash
# Executar SQL
npx supabase db execute -f arquivo.sql

# Ver logs da função
npx supabase functions logs shopify-create-order

# Verificar status
npx supabase status
```

---

## ✨ BOAS PRÁTICAS

### 1. SEMPRE FAZER BUILD ANTES DE DEPLOY

```bash
npm run build
# Se der erro, NÃO faça deploy!
```

### 2. NÃO CRIAR ARQUIVOS .md DESNECESSÁRIOS

❌ NÃO: Criar `PLANO_X.md`, `RESUMO_Y.md` toda hora  
✅ SIM: Atualizar este arquivo (`CONTEXTO_DESENVOLVIMENTO.md`)

### 3. TESTAR LOCALMENTE PRIMEIRO

```bash
npm run dev
# Acessar http://localhost:5173
```

### 4. USAR OS UTILITÁRIOS EXISTENTES

Antes de criar novo código, verificar se já existe:
- `src/lib/api/` - APIs prontas
- `src/lib/utils/` - Utilitários (cepUtils, etc)
- `src/components/` - Componentes reutilizáveis

### 5. COMMITS SEMÂNTICOS

```
feat: nova funcionalidade
fix: correção de bug
refactor: refatoração
docs: documentação
style: formatação
test: testes
```

---

## 🚫 COMO NÃO QUEBRAR O CÓDIGO

### ❌ ERROS COMUNS

#### 1. Tags XML no Código

**NUNCA fazer:**
```typescript
<text>
<new_text>
<old_text>
```

Essas tags quebram o TypeScript! Usar apenas edits diretos.

#### 2. Modificar Arquivo Errado

Sempre verificar:
```bash
# Ver arquivo antes de editar
cat caminho/arquivo.tsx | head -50
```

#### 3. Não Verificar Erros de Compilação

Sempre rodar:
```bash
npm run build
# OU
npx tsc --noEmit
```

#### 4. Esquecer de Fazer Deploy da Edge Function

Modificou função? Deploy:
```bash
npx supabase functions deploy NOME-DA-FUNCAO --no-verify-jwt
```

#### 5. CORS Errado

Edge Functions que recebem chamadas externas precisam:
```typescript
import { corsHeaders } from '../_utils/cors.ts';

// No OPTIONS
if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders });
}

// Em todas as respostas
return new Response(JSON.stringify(data), {
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});
```

---

## 📊 TABELAS DO BANCO (IMPORTANTES)

### ShopifyIntegration
```sql
id UUID PRIMARY KEY
userId UUID (FK User)
shopDomain TEXT (ex: minhaloja.myshopify.com)
accessToken TEXT
apiKey TEXT
apiSecret TEXT
isActive BOOLEAN
createdAt TIMESTAMP
updatedAt TIMESTAMP
```

### Order
```sql
id UUID PRIMARY KEY
orderNumber TEXT UNIQUE
customerId UUID (FK Customer) NULLABLE ← IMPORTANTE!
userId UUID (FK User)
customerEmail TEXT
customerName TEXT
customerPhone TEXT
shippingAddress JSONB
items JSONB
subtotal DECIMAL
discount DECIMAL
shipping DECIMAL
tax DECIMAL
total DECIMAL
paymentMethod TEXT
paymentStatus TEXT
status TEXT
metadata JSONB
createdAt TIMESTAMP
updatedAt TIMESTAMP
```

### CheckoutCustomization
```sql
id UUID PRIMARY KEY
userId UUID (FK User)
theme JSONB ← Tema customizado
logo TEXT
createdAt TIMESTAMP
updatedAt TIMESTAMP
```

---

## 🔐 VARIÁVEIS DE AMBIENTE

### Supabase (Edge Functions)

Já configuradas no Supabase Dashboard:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `FRONTEND_URL`

### Vercel (Frontend)

Já configuradas no Vercel:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 📞 ENDPOINTS IMPORTANTES

### Edge Functions
- `POST /functions/v1/shopify-create-order` ✅ FUNCIONANDO
- `POST /functions/v1/shopify-oauth`
- `POST /functions/v1/shopify-sync`
- `POST /functions/v1/shopify-webhook`

### Frontend
- `/checkout/:orderId` - Checkout público
- `/app/integrations` - Lista de integrações
- `/app/integrations/shopify` - Config Shopify
- `/app/checkout/customize` - Personalização

---

## 🎯 RESUMO PARA PRÓXIMO CHAT

### Estado Atual
1. ✅ Carrinho Shopify funcionando (v3.0)
2. ✅ Edge Function criando pedidos
3. ✅ Interface de config limpa
4. ✅ Utilitário de CEP pronto
5. 🚧 Implementar CEP no checkout (PRÓXIMO)

### Contexto Técnico
- React + TypeScript + Vite
- Supabase (Edge Functions + PostgreSQL)
- Deploy: Vercel (frontend) + Supabase (backend)
- Integração Shopify funcionando em produção

### Próxima Tarefa
**Implementar busca de CEP no PublicCheckoutPage.tsx**
- Importar `cepUtils.ts`
- Adicionar handler `handleCepChange`
- Modificar input de CEP
- Testar com CEP real

### Comandos para Começar
```bash
cd C:\Users\dinho\Documents\GitHub\SyncAds
npm run dev
# Abrir http://localhost:5173/checkout/test-id
```

---

## 📚 REFERÊNCIAS ÚTEIS

- **ViaCEP:** https://viacep.com.br/
- **Shopify API:** https://shopify.dev/docs/api
- **Supabase Docs:** https://supabase.com/docs
- **TailwindCSS:** https://tailwindcss.com/docs
- **Shadcn/ui:** https://ui.shadcn.com/

---

**🎉 Este documento deve ser atualizado sempre que houver mudanças significativas!**

**Última edição:** 02/02/2025 - Token: 130k usado