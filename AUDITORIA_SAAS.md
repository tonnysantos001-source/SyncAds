# 🔍 AUDITORIA COMPLETA DO SISTEMA - Transformação em SaaS

**Data:** 19 de Outubro de 2025  
**Objetivo:** Transformar SyncAds em SaaS Multi-tenant

---

## 📊 SITUAÇÃO ATUAL

### **Funcionalidades Implementadas:**
✅ Sistema de Autenticação (Login/Register)
✅ Dashboard com métricas
✅ Gerenciamento de Campanhas
✅ Chat com IA
✅ Sistema de Integrações (Meta, Google, LinkedIn, TikTok, Twitter)
✅ Analytics
✅ Configurações de usuário
✅ Landing Page profissional
✅ OAuth para integrações
✅ Sistema de notificações
✅ Checkout grátis destacado

### **Arquitetura Atual:**
```
SINGLE-TENANT (Um usuário por sistema)
├── Frontend: React + TypeScript
├── Backend: Supabase
├── Auth: Supabase Auth
├── Database: PostgreSQL
└── Storage: Local State + Supabase
```

### **Modelo de Dados Atual:**
```sql
User (único usuário/admin)
├── Campaigns (campanhas do usuário)
├── ChatConversation (conversas)
├── ChatMessage (mensagens)
├── AiConnection (chaves de IA)
├── Integration (integrações OAuth)
└── Settings (configurações)
```

---

## 🎯 VISÃO SAAS PROPOSTA

### **Arquitetura Multi-Tenant:**
```
ADMIN (Super Admin)
└── Gerencia:
    ├── Organizações (Tenants)
    ├── Conexões de IA (compartilhadas)
    ├── Planos e Assinaturas
    ├── Configurações globais
    └── Usuários do sistema

ORGANIZAÇÃO (Tenant/Cliente)
└── Admin da Organização
    └── Gerencia:
        ├── Usuários da organização
        ├── Campanhas
        ├── Integrações (próprias)
        ├── Analytics
        └── Settings

USUÁRIO (User dentro de Organização)
└── Usa:
    ├── IA (configurada pelo Admin)
    ├── Chat
    ├── Campanhas (visualiza/cria)
    ├── Analytics (suas métricas)
    └── Integrações (conecta contas)
```

---

## 🏗️ MODELO DE DADOS SAAS

### **Novo Schema SQL:**

```sql
-- SUPER ADMIN (você)
CREATE TABLE SuperAdmin (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- ORGANIZAÇÕES (Tenants/Clientes)
CREATE TABLE Organization (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  plan TEXT NOT NULL, -- FREE, PRO, ENTERPRISE
  status TEXT NOT NULL, -- ACTIVE, SUSPENDED, TRIAL
  trialEndsAt TIMESTAMP,
  subscriptionId TEXT,
  maxUsers INTEGER DEFAULT 5,
  maxCampaigns INTEGER DEFAULT 10,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- USUÁRIOS (dentro de organizações)
CREATE TABLE User (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizationId UUID REFERENCES Organization(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- ADMIN, MEMBER, VIEWER
  avatar TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(organizationId, email)
);

-- CONEXÕES DE IA (gerenciadas pelo Super Admin)
CREATE TABLE GlobalAiConnection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- OPENAI, ANTHROPIC, GOOGLE
  apiKey TEXT NOT NULL, -- Encriptado
  baseUrl TEXT,
  model TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- ATRIBUIÇÃO DE IA PARA ORGANIZAÇÕES
CREATE TABLE OrganizationAiConnection (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizationId UUID REFERENCES Organization(id) ON DELETE CASCADE,
  globalAiConnectionId UUID REFERENCES GlobalAiConnection(id) ON DELETE CASCADE,
  isDefault BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(organizationId, globalAiConnectionId)
);

-- CAMPANHAS (por organização)
CREATE TABLE Campaign (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizationId UUID REFERENCES Organization(id) ON DELETE CASCADE,
  userId UUID REFERENCES User(id),
  name TEXT NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL,
  budgetTotal DECIMAL(10,2),
  budgetSpent DECIMAL(10,2) DEFAULT 0,
  startDate DATE,
  endDate DATE,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- CONVERSAS DE CHAT (por usuário)
CREATE TABLE ChatConversation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  userId UUID REFERENCES User(id) ON DELETE CASCADE,
  organizationId UUID REFERENCES Organization(id) ON DELETE CASCADE,
  title TEXT,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- MENSAGENS DE CHAT
CREATE TABLE ChatMessage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversationId UUID REFERENCES ChatConversation(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- user, assistant
  content TEXT NOT NULL,
  createdAt TIMESTAMP DEFAULT NOW()
);

-- INTEGRAÇÕES (por organização)
CREATE TABLE Integration (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizationId UUID REFERENCES Organization(id) ON DELETE CASCADE,
  userId UUID REFERENCES User(id), -- quem conectou
  platform TEXT NOT NULL,
  credentials JSONB,
  isConnected BOOLEAN DEFAULT false,
  lastSyncAt TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- ASSINATURAS (pagamentos)
CREATE TABLE Subscription (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizationId UUID REFERENCES Organization(id) ON DELETE CASCADE,
  stripeCustomerId TEXT,
  stripeSubscriptionId TEXT,
  plan TEXT NOT NULL,
  status TEXT NOT NULL, -- ACTIVE, CANCELLED, PAST_DUE
  currentPeriodStart TIMESTAMP,
  currentPeriodEnd TIMESTAMP,
  createdAt TIMESTAMP DEFAULT NOW(),
  updatedAt TIMESTAMP DEFAULT NOW()
);

-- USAGE TRACKING (para limites)
CREATE TABLE UsageTracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizationId UUID REFERENCES Organization(id) ON DELETE CASCADE,
  metric TEXT NOT NULL, -- campaigns, chat_messages, users
  count INTEGER DEFAULT 0,
  period TEXT NOT NULL, -- monthly
  periodStart TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT NOW(),
  UNIQUE(organizationId, metric, periodStart)
);
```

---

## 🔐 SISTEMA DE PERMISSÕES

### **Roles e Permissões:**

```typescript
// SUPER ADMIN (você)
const SUPER_ADMIN_PERMISSIONS = {
  organizations: ['create', 'read', 'update', 'delete'],
  globalAiConnections: ['create', 'read', 'update', 'delete'],
  subscriptions: ['read', 'update'],
  allUsers: ['read'],
  allCampaigns: ['read'],
  systemSettings: ['update']
};

// ORGANIZATION ADMIN
const ORG_ADMIN_PERMISSIONS = {
  organization: ['read', 'update'],
  users: ['create', 'read', 'update', 'delete'], // da sua org
  campaigns: ['create', 'read', 'update', 'delete'],
  integrations: ['create', 'read', 'update', 'delete'],
  aiConnections: ['read'], // só usa as que você atribuiu
  analytics: ['read'],
  settings: ['update']
};

// MEMBER (usuário comum)
const MEMBER_PERMISSIONS = {
  campaigns: ['create', 'read', 'update'], // suas próprias
  chat: ['create', 'read'],
  integrations: ['read', 'update'], // conectar suas contas
  analytics: ['read'], // suas métricas
  profile: ['update']
};

// VIEWER (só visualização)
const VIEWER_PERMISSIONS = {
  campaigns: ['read'],
  analytics: ['read'],
  chat: ['read']
};
```

---

## 🎨 SEPARAÇÃO DE PAINÉIS

### **1. Painel Super Admin:**
```
URL: /super-admin

Menu:
├── 🏢 Organizações
│   ├── Listar todas
│   ├── Criar nova
│   ├── Editar/Suspender
│   └── Ver detalhes
│
├── 🤖 Conexões de IA
│   ├── Adicionar IA (OpenAI, Anthropic, etc)
│   ├── Gerenciar chaves
│   ├── Atribuir a organizações
│   └── Monitorar uso
│
├── 💳 Assinaturas
│   ├── Ver todas
│   ├── Status de pagamentos
│   └── Estatísticas de receita
│
├── 📊 Analytics Global
│   ├── Total de usuários
│   ├── Receita mensal
│   ├── Campanhas ativas
│   └── Uso de IA
│
└── ⚙️ Configurações Globais
    ├── Limites por plano
    ├── Preços
    └── Features disponíveis
```

### **2. Painel Organization Admin:**
```
URL: /dashboard

Menu:
├── 📊 Dashboard (atual)
├── 🎯 Campanhas (atual)
├── 💬 Chat (usa IA configurada)
├── 📈 Analytics (atual)
├── 🔗 Integrações (atual)
│
├── 👥 **NOVO** Usuários
│   ├── Convidar usuários
│   ├── Gerenciar roles
│   └── Remover usuários
│
├── 🤖 **NOVO** IA Disponível
│   ├── Ver IA atribuída
│   ├── Configurar prompt padrão
│   └── (NÃO pode adicionar chaves)
│
└── ⚙️ Configurações
    ├── Dados da organização
    ├── Plano e faturamento
    └── Configurações gerais
```

### **3. Painel Member (Usuário):**
```
URL: /app

Menu:
├── 📊 Meu Dashboard
├── 🎯 Minhas Campanhas
├── 💬 Chat (com IA)
├── 📈 Minhas Métricas
├── 🔗 Minhas Integrações
└── ⚙️ Meu Perfil
```

---

## 💼 PLANOS E LIMITES

### **Planos Propostos:**

```typescript
const PLANS = {
  FREE: {
    price: 0,
    maxUsers: 2,
    maxCampaigns: 5,
    maxChatMessages: 100, // por mês
    features: [
      'Chat com IA básico',
      '2 integrações',
      'Analytics básico'
    ]
  },
  
  STARTER: {
    price: 97, // R$/mês
    maxUsers: 5,
    maxCampaigns: 20,
    maxChatMessages: 1000,
    features: [
      'Chat com IA avançado',
      '5 integrações',
      'Analytics completo',
      'Suporte email'
    ]
  },
  
  PRO: {
    price: 297,
    maxUsers: 15,
    maxCampaigns: 100,
    maxChatMessages: 5000,
    features: [
      'Tudo do Starter +',
      'Integrações ilimitadas',
      'API access',
      'Automações',
      'Suporte prioritário'
    ]
  },
  
  ENTERPRISE: {
    price: 'Custom',
    maxUsers: 'Unlimited',
    maxCampaigns: 'Unlimited',
    maxChatMessages: 'Unlimited',
    features: [
      'Tudo do Pro +',
      'IA customizada',
      'White label',
      'Dedicated support',
      'SLA garantido'
    ]
  }
};
```

---

## 🚀 PLANO DE IMPLEMENTAÇÃO

### **Fase 1: Estrutura Base (1-2 semanas)**
- [ ] Criar tabelas SaaS no Supabase
- [ ] Migration do schema atual
- [ ] RLS (Row Level Security) configurado
- [ ] Sistema de roles implementado

### **Fase 2: Painel Super Admin (1 semana)**
- [ ] Rota /super-admin
- [ ] CRUD de Organizações
- [ ] CRUD de Conexões de IA Global
- [ ] Dashboard de analytics

### **Fase 3: Multi-tenancy (1 semana)**
- [ ] Filtrar dados por organizationId
- [ ] Contexto de organização no frontend
- [ ] Atribuição de IA para organizações
- [ ] Limites por plano

### **Fase 4: Gerenciamento de Usuários (1 semana)**
- [ ] Convites de usuários
- [ ] Sistema de roles
- [ ] Permissões no frontend
- [ ] Página de Team

### **Fase 5: Assinaturas (1 semana)**
- [ ] Integração Stripe
- [ ] Webhook de pagamentos
- [ ] Portal de faturamento
- [ ] Trial de 14 dias

### **Fase 6: Landing Page SaaS (3 dias)**
- [ ] Página de pricing
- [ ] Página de features
- [ ] Sign up com seleção de plano
- [ ] Onboarding

---

## 📝 MUDANÇAS NECESSÁRIAS NO CÓDIGO

### **1. Store (useStore.ts):**
```typescript
interface AppState {
  // Adicionar contexto de organização
  currentOrganization: Organization | null;
  isSuperAdmin: boolean;
  
  // Mudar aiConnections para availableAiConnections
  availableAiConnections: GlobalAiConnection[];
  // Usuários NÃO podem adicionar, só usar
  
  // Adicionar gerenciamento de org
  loadOrganization: () => Promise<void>;
  updateOrganization: (data: Partial<Organization>) => Promise<void>;
  
  // Adicionar team management
  teamMembers: User[];
  inviteUser: (email: string, role: string) => Promise<void>;
  updateUserRole: (userId: string, role: string) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
}
```

### **2. API Calls:**
Todas as queries precisam incluir `organizationId`:
```typescript
// Antes
const campaigns = await supabase
  .from('Campaign')
  .select('*')
  .eq('userId', userId);

// Depois
const campaigns = await supabase
  .from('Campaign')
  .select('*')
  .eq('organizationId', organizationId);
```

### **3. RLS Policies:**
```sql
-- Campanhas só da organização
CREATE POLICY "Users can only see their org campaigns"
ON Campaign FOR SELECT
USING (organizationId = current_setting('app.current_organization_id')::uuid);

-- IA: usuários só veem IA atribuídas
CREATE POLICY "Users see only assigned AI"
ON OrganizationAiConnection FOR SELECT
USING (organizationId = current_setting('app.current_organization_id')::uuid);
```

---

## ⚠️ PONTOS DE ATENÇÃO

### **1. Dados Existentes:**
- Migrar usuário atual como primeira organização
- Manter campanhas e dados existentes
- Transformar em Super Admin

### **2. Segurança:**
- Todas as rotas devem validar organizationId
- RLS habilitado em TODAS as tabelas
- API keys de IA nunca expostas ao frontend

### **3. Performance:**
- Indexar organizationId em todas as tabelas
- Cache de permissões
- Lazy loading de dados

### **4. UX:**
- Onboarding smooth para novos usuários
- Seletor de organização (se admin de múltiplas)
- Feedback claro de limites atingidos

---

## 💰 MODELO DE RECEITA

### **Estimativa com 100 Clientes:**
```
FREE: 40 clientes x R$ 0 = R$ 0
STARTER: 30 clientes x R$ 97 = R$ 2.910
PRO: 25 clientes x R$ 297 = R$ 7.425
ENTERPRISE: 5 clientes x R$ 997 = R$ 4.985
────────────────────────────────────────
TOTAL MRR: R$ 15.320/mês
TOTAL ARR: R$ 183.840/ano
```

### **Com 500 Clientes:**
```
TOTAL MRR: ~R$ 76.000/mês
TOTAL ARR: ~R$ 912.000/ano
```

---

## ✅ PRÓXIMOS PASSOS IMEDIATOS

1. **Aprovar arquitetura** SaaS proposta
2. **Definir prioridades** de features
3. **Criar migrations** do banco
4. **Implementar Fase 1** (estrutura base)
5. **Testar** com organização piloto

---

**Preparado por:** Cascade AI  
**Para:** Sistema SyncAds SaaS  
**Status:** Aguardando aprovação para iniciar
