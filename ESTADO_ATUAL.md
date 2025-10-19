# 📋 ESTADO ATUAL DO PROJETO - SyncAds

**Última Atualização:** 19/10/2025 20:10

---

## 🎯 ARQUITETURA ATUAL

### **2 Painéis Separados**

#### 1. **Painel Super Admin** (`/super-admin`)
- **Usuário:** Você (fatimadrivia@gmail.com)
- **Layout:** Vermelho
- **Funcionalidades:**
  - ✅ Dashboard com stats (orgs, users, IAs, receita)
  - ✅ Criar/Listar/Suspender Organizações (tudo no dashboard)
  - ✅ Conexões de IA Globais (página separada)
  - ✅ Não carrega dados de campanhas/chat

#### 2. **Painel Usuários Normais** (`/dashboard`)
- **Usuários:** Clientes das organizações
- **Layout:** Azul/Roxo normal
- **Funcionalidades:**
  - ✅ Dashboard
  - ✅ Campanhas
  - ✅ Analytics
  - ✅ Chat com IA
  - ✅ Integrações (OAuth Meta, Google, etc)
  - ✅ Team Management
  - ✅ Settings

---

## 🗂️ ESTRUTURA DE ARQUIVOS

### **Super Admin (Simplificado)**
```
src/pages/super-admin/
├── SuperAdminDashboard.tsx  ← TUDO EM 1 (stats + orgs + criar org)
├── GlobalAiPage.tsx         ← Gerenciar IAs globais
└── [DELETADO] OrganizationsPage.tsx
    [DELETADO] SubscriptionsPage.tsx
```

### **Layouts**
```
src/components/layout/
├── SuperAdminLayout.tsx     ← Layout vermelho (2 itens menu)
└── DashboardLayout.tsx      ← Layout normal usuários
```

### **Rotas Ativas**
```typescript
// Super Admin
/super-admin                 → SuperAdminDashboard (stats + orgs)
/super-admin/ai-connections  → GlobalAiPage

// Usuários Normais
/dashboard                   → DashboardPage
/campaigns                   → CampaignsPage
/chat                        → ChatPage
/integrations                → IntegrationsPage
/team                        → TeamPage
/settings                    → SettingsPage
```

---

## 🗄️ BANCO DE DADOS (Supabase)

### **Tabelas Principais**
```sql
-- SaaS Multi-tenant
Organization          ← Clientes (orgs)
GlobalAiConnection    ← IAs globais (super admin)
OrganizationAiConnection ← Atribuição IA → Org
Subscription          ← Planos/Pagamentos
UsageTracking         ← Limites de uso
AiUsage               ← Tracking uso IA

-- Usuários e Permissões
User                  ← Todos users (organizationId, role, isActive)
SuperAdmin            ← Você (fatimadrivia@gmail.com)

-- App
Campaign              ← Campanhas (organizationId)
ChatConversation      ← Conversas chat (organizationId)
Integration           ← Integrações OAuth (organizationId)
```

### **RLS Policies Aplicadas**
```sql
-- Super Admin vê TUDO
is_super_admin() → função que verifica SuperAdmin table

-- Organizations
org_select:  Super Admin OU user.organizationId
org_insert/update/delete: APENAS Super Admin

-- GlobalAI
global_ai_select/insert/update/delete: APENAS Super Admin

-- OrganizationAI
org_ai_select: Super Admin OU user.organizationId
org_ai_insert/delete: APENAS Super Admin
```

---

## 🔐 AUTENTICAÇÃO E REDIRECIONAMENTO

### **Login Flow**
```
1. Login (email/senha)
2. auth.ts verifica SuperAdmin table
3. Retorna user com isSuperAdmin: true/false
4. App.tsx redireciona:
   - Super Admin → /super-admin
   - Usuário normal → /dashboard
```

### **Arquivos Modificados**
- `src/lib/api/auth.ts` → getCurrentUser() verifica SuperAdmin
- `src/store/useStore.ts` → User interface com isSuperAdmin
- `src/App.tsx` → Redirect baseado em isSuperAdmin

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### **SaaS Core**
- [x] Multi-tenancy (organizações isoladas)
- [x] RLS Policies (super admin + org users)
- [x] Super Admin identificado
- [x] Redirect automático por role

### **Super Admin Dashboard**
- [x] Stats cards (orgs, users, IAs, receita)
- [x] Criar organização (dialog no dashboard)
- [x] Listar organizações (tabela com busca)
- [x] Ativar/Suspender organizações
- [x] Link para gerenciar IAs

### **Backend Seguro**
- [x] Edge Function `chat` (protege API keys)
- [x] Suporte OpenAI, Anthropic, Google
- [x] Custom system prompt por org

### **Team Management**
- [x] Página TeamPage
- [x] Roles: ADMIN, MEMBER, VIEWER
- [x] Convidar membros (ainda sem email)
- [x] Ativar/Desativar users

### **Settings**
- [x] OrganizationAiTab (mostra IAs da org)
- [x] Custom system prompt
- [x] Não permite add new IA (só super admin)

---

## 🚧 PENDENTE / TODO

### **ALTA PRIORIDADE**

#### 1. Deploy Edge Function
```bash
cd c:\Users\dinho\Documents\GitHub\SyncAds
supabase functions deploy chat
```

#### 2. Chat usar Edge Function
**Arquivo:** `src/pages/app/ChatPage.tsx`

Trocar chamada direta API por:
```typescript
const response = await chatApi.sendSecureMessage(
  message,
  conversationHistory,
  systemPrompt
);
```

#### 3. Encriptar API Keys
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "GlobalAiConnection"
  ADD COLUMN "apiKeyEncrypted" BYTEA;

-- Function para encriptar
CREATE FUNCTION encrypt_api_key(key TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(key, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql;
```

#### 4. Convites por Email
- Edge Function `invite-user`
- Enviar email com token
- Link de aceite
- Criar conta via Supabase Auth

---

### **MÉDIA PRIORIDADE**

- [ ] Validações formulários (slug, email, limits)
- [ ] Constraints banco (CHECK plan, status, etc)
- [ ] Audit log (tabela + triggers)
- [ ] Error tracking (Sentry)
- [ ] Health checks (/health endpoint)

---

### **BAIXA PRIORIDADE**

- [ ] Loading states
- [ ] Confirmações (AlertDialog)
- [ ] Fix TypeScript types
- [ ] Analytics (Google/Mixpanel)
- [ ] Testes automatizados
- [ ] CI/CD (GitHub Actions)

---

## 🐛 BUGS CONHECIDOS

### **TypeScript Errors (NÃO afetam runtime)**
```
Cannot find module '@/components/ui/*'
Cannot find module '@/lib/*'
```

**Causa:** tsconfig paths não reconhecidos pelo IDE  
**Impacto:** ZERO - Funciona perfeitamente em runtime  
**Fix (futuro):** Regenerar database.types.ts com Supabase CLI

---

## 📁 ARQUIVOS IMPORTANTES

### **Criados Recentemente**
```
src/pages/super-admin/SuperAdminDashboard.tsx  ← PRINCIPAL (unificado)
src/pages/app/TeamPage.tsx
src/pages/app/settings/OrganizationAiTab.tsx
src/components/ui/textarea.tsx
src/lib/api/chat.ts (sendSecureMessage)
supabase/functions/chat/index.ts (Edge Function)
```

### **Modificados Recentemente**
```
src/App.tsx                    ← Rotas simplificadas
src/components/layout/SuperAdminLayout.tsx  ← Menu com 2 itens
src/lib/api/auth.ts            ← Verifica isSuperAdmin
src/store/useStore.ts          ← User.isSuperAdmin
```

### **Migrations Aplicadas**
```
fix_rls_policies_super_admin        ← RLS + SuperAdmin table
fix_super_admin_select_and_routes   ← SELECT policies corrigidas
```

---

## 🚀 COMO TESTAR AMANHÃ

### **1. Super Admin Dashboard**
```
1. Login: fatimadrivia@gmail.com
2. Deve ir para: /super-admin
3. Ver stats cards com números reais
4. Ver tabela com 3 organizações
5. Criar nova organização (botão + dialog)
6. Suspender/Ativar organizações
```

### **2. Conexões de IA**
```
1. Ir em /super-admin/ai-connections
2. Criar nova IA global
3. Atribuir IA a uma organização
```

### **3. Painel Normal**
```
1. Criar user normal em uma org
2. Login com esse user
3. Deve ir para: /dashboard
4. Não vê super admin
```

---

## 🔥 COMANDOS ÚTEIS

### **Dev Server**
```bash
npm run dev
```

### **Deploy Edge Function**
```bash
supabase functions deploy chat
```

### **Ver Logs Edge Function**
```bash
supabase functions logs chat
```

### **Aplicar Migration**
```sql
-- No SQL Editor do Supabase Dashboard
-- Copiar conteúdo de supabase_migrations/*.sql
```

---

## 🎨 ESTILO E UX

### **Super Admin**
- Cor principal: RED-600
- Header: Gradient red-600 to red-700
- Cards: Red accent
- Botões: bg-red-600 hover:bg-red-700

### **Usuários Normais**
- Cor principal: BLUE/PURPLE
- Header: Gradient normal
- Sidebar: Itens coloridos

---

## 💡 LEMBRAR AMANHÃ

1. **OrganizationsPage e SubscriptionsPage foram REMOVIDAS**
   - Tudo está unificado no SuperAdminDashboard
   
2. **Menu Super Admin tem apenas 2 itens:**
   - Dashboard (organizações + stats)
   - Conexões de IA

3. **Edge Function `chat` ainda não deployada**
   - ChatPage ainda usa API direto (inseguro)
   - Deploy pendente

4. **Convites de Team sem email**
   - Cria user mas não envia convite
   - Implementar Edge Function

5. **API Keys em texto plano**
   - Implementar encriptação com pgcrypto

---

## 📞 PRÓXIMA SESSÃO

**Prioridades:**
1. ✅ Testar super admin dashboard simplificado
2. 🔧 Deploy Edge Function chat
3. 🔧 Modificar ChatPage para usar Edge Function
4. 🔧 Implementar convites por email
5. 🔧 Encriptar API keys

---

**Sistema simplificado em 2 painéis - Pronto para evolução! 🚀**
