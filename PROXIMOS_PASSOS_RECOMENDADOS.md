# 🚀 Próximos Passos Recomendados - SyncAds

**Data:** 20 de Outubro de 2025  
**Status Atual:** ✅ Beta Fechado Ready (com configurações manuais)

---

## 📋 IMPLEMENTAÇÕES CONCLUÍDAS HOJE

### ✅ Sprint Atual - CONCLUÍDO

1. **Edge Functions Integradas**
   - ChatPage agora usa `/functions/v1/chat` (API keys protegidas)
   - Sistema de convites usa `/functions/v1/invite-user`

2. **Encriptação de API Keys**
   - pgcrypto habilitado
   - Funções encrypt/decrypt criadas
   - Trigger automático funcionando
   - ⚠️ **PENDENTE:** Configurar chave no Vault (ver CONFIGURAR_ENCRYPTION_KEY.md)

3. **Sistema de Convites Completo**
   - Edge Function deployada
   - Tabela PendingInvite com RLS
   - API frontend (invitesApi)
   - TeamPage integrada com UI de convites pendentes
   - ⚠️ **PENDENTE:** Configurar serviço de email (ver CONFIGURAR_EMAIL_SERVICE.md)

4. **Stats Reais no SuperAdminDashboard**
   - COUNT real de organizações, usuários, mensagens
   - SUM de tokens da AiUsage
   - Cálculo de MRR baseado em planos ativos

5. **Constraints CHECK**
   - Validação de enums em todas as tabelas
   - Constraints em: Organization, Subscription, Campaign, Integration, User

---

## ⚡ AÇÕES IMEDIATAS (Esta Semana)

### 🔴 CRÍTICO - Bloqueia Produção

#### 1. Configurar Chave de Encriptação no Vault
**Tempo estimado:** 15 minutos  
**Documentação:** `CONFIGURAR_ENCRYPTION_KEY.md`

**Passos:**
1. Gerar chave segura: `openssl rand -base64 32`
2. Criar secret no Supabase Vault: `encryption_key`
3. Atualizar funções para usar Vault
4. Re-encriptar API keys existentes
5. Testar encrypt/decrypt

**Por que é crítico:** API keys atualmente usam chave temporária hardcoded

---

#### 2. Configurar Serviço de Email (Resend)
**Tempo estimado:** 30 minutos  
**Documentação:** `CONFIGURAR_EMAIL_SERVICE.md`

**Passos:**
1. Criar conta no Resend (grátis: 3k emails/mês)
2. Obter API key
3. Adicionar `RESEND_API_KEY` nas Edge Functions
4. Atualizar Edge Function `invite-user` com código de envio
5. Testar envio de convite

**Por que é crítico:** Sistema de convites não envia emails reais

---

#### 3. Criar Página `/accept-invite`
**Tempo estimado:** 1 hora  
**Arquivo:** `src/pages/public/AcceptInvitePage.tsx`

**Features:**
- Validar token do convite
- Form: nome, senha, confirmar senha
- Criar conta via `invitesApi.acceptInvite()`
- Redirecionar para /login

**Código base:** Ver em CONFIGURAR_EMAIL_SERVICE.md

---

#### 4. Otimizar RLS Policies (Performance)
**Tempo estimado:** 30 minutos  
**Impacto:** 10-100x mais rápido em queries grandes

**Migration:**
```sql
-- Otimizar performance de RLS policies
-- Substituir auth.uid() por (SELECT auth.uid())

-- User table
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
CREATE POLICY "Users can view their own profile" ON "User"
  FOR SELECT USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON "User";
CREATE POLICY "Users can update their own profile" ON "User"
  FOR UPDATE USING (id = (SELECT auth.uid()));

-- Campaign table
DROP POLICY IF EXISTS "Users can view their own campaigns" ON "Campaign";
CREATE POLICY "Users can view their own campaigns" ON "Campaign"
  FOR SELECT USING (userId = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own campaigns" ON "Campaign";
CREATE POLICY "Users can insert their own campaigns" ON "Campaign"
  FOR INSERT WITH CHECK (userId = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update their own campaigns" ON "Campaign";
CREATE POLICY "Users can update their own campaigns" ON "Campaign"
  FOR UPDATE USING (userId = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own campaigns" ON "Campaign";
CREATE POLICY "Users can delete their own campaigns" ON "Campaign"
  FOR DELETE USING (userId = (SELECT auth.uid()));

-- ChatMessage, ChatConversation, AiConnection... (repetir padrão)
```

---

#### 5. Adicionar Índices em Foreign Keys
**Tempo estimado:** 5 minutos

**Migration:**
```sql
-- Melhorar performance de JOINs
CREATE INDEX IF NOT EXISTS idx_campaign_user_id ON "Campaign"("userId");
CREATE INDEX IF NOT EXISTS idx_pending_invite_invited_by ON "PendingInvite"("invitedBy");
```

---

#### 6. Fixar search_path nas Functions
**Tempo estimado:** 10 minutos  
**Segurança:** Previne SQL injection via search_path

**Migration:**
```sql
-- Adicionar SET search_path em todas as functions

CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_email TEXT;
BEGIN
  user_email := auth.jwt()->>'email';
  IF user_email IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM "SuperAdmin" WHERE email = user_email
  );
END;
$$;

-- Repetir para:
-- - encrypt_api_key()
-- - decrypt_api_key()
-- - expire_old_invites()
```

---

## 🟡 IMPORTANTE (Próxima Semana)

### 7. Validação de Limites
**Tempo estimado:** 4 horas

**Implementar em:**
- `TeamPage.tsx`: Verificar maxUsers antes de convidar
- `CampaignsPage.tsx`: Verificar maxCampaigns antes de criar
- `ChatPage.tsx`: Verificar maxChatMessages antes de enviar

**Código exemplo:**
```typescript
// TeamPage.tsx - antes de enviar convite
const { data: org } = await supabase
  .from('Organization')
  .select('maxUsers')
  .eq('id', organizationId)
  .single();

const { count: currentUsers } = await supabase
  .from('User')
  .select('*', { count: 'exact', head: true })
  .eq('organizationId', organizationId)
  .eq('isActive', true);

if (currentUsers >= org.maxUsers) {
  toast({
    title: 'Limite atingido',
    description: `Sua organização atingiu o limite de ${org.maxUsers} usuários. Faça upgrade do plano.`,
    variant: 'destructive',
  });
  return;
}
```

---

### 8. Sistema de Notificações
**Tempo estimado:** 6 horas

**Features:**
- Badge no header com count
- Dropdown de notificações
- Tipos: limite próximo, trial ending, convite aceito, integração desconectada

**Tabela:**
```sql
CREATE TABLE "Notification" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT REFERENCES "User"(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT FALSE,
  link TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_notification_user ON "Notification"("userId", "isRead");
```

**Component:**
```typescript
// components/NotificationBell.tsx
export function NotificationBell() {
  const { notifications, markAsRead } = useNotifications();
  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <Bell />
        {unreadCount > 0 && <Badge>{unreadCount}</Badge>}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        {notifications.map(n => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

### 9. Dashboard com Dados Reais
**Tempo estimado:** 3 horas

**Substituir dados mockados por:**
```typescript
// DashboardPage.tsx
const loadRealStats = async () => {
  // Total de campanhas
  const { count: campaignsCount } = await supabase
    .from('Campaign')
    .select('*', { count: 'exact', head: true })
    .eq('organizationId', organizationId);

  // Total gasto (soma de budgetSpent)
  const { data: spentData } = await supabase
    .from('Campaign')
    .select('budgetSpent')
    .eq('organizationId', organizationId);
  
  const totalSpent = spentData?.reduce((sum, c) => sum + c.budgetSpent, 0) || 0;

  // ROI médio
  const { data: roiData } = await supabase
    .from('Campaign')
    .select('roi')
    .eq('organizationId', organizationId);
  
  const avgROI = roiData?.reduce((sum, c) => sum + c.roi, 0) / (roiData.length || 1);

  // Gráfico de performance (últimos 30 dias)
  const { data: analyticsData } = await supabase
    .from('Analytics')
    .select('*')
    .gte('date', thirtyDaysAgo)
    .order('date');

  setStats({ campaignsCount, totalSpent, avgROI, chartData: analyticsData });
};
```

---

### 10. Billing Page para Usuários
**Tempo estimado:** 4 horas

**Features:**
- Mostrar plano atual
- Progresso de uso (campanhas, usuários, mensagens)
- Botão "Upgrade"
- Histórico de faturas (quando Stripe estiver integrado)

**Página:**
```typescript
// pages/app/BillingPage.tsx
export default function BillingPage() {
  return (
    <div className="space-y-6">
      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <CardTitle>Plano Atual: PRO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <UsageBar label="Campanhas" current={3} max={50} />
            <UsageBar label="Usuários" current={5} max={20} />
            <UsageBar label="Mensagens IA" current={1250} max={10000} />
          </div>
          <Button className="mt-4">Fazer Upgrade</Button>
        </CardContent>
      </Card>

      {/* Planos Disponíveis */}
      <PricingCards currentPlan="PRO" />
    </div>
  );
}
```

---

## 🟢 DESEJÁVEL (Mês 1)

### 11. Integração Stripe
**Tempo estimado:** 8-12 horas  
**Documentação:** https://stripe.com/docs/billing/subscriptions/build-subscriptions

**Passos:**
1. Criar conta Stripe
2. Configurar produtos e prices
3. Criar Checkout Session
4. Implementar webhooks
5. Atualizar `Subscription` table
6. Implementar upgrade/downgrade flow
7. Invoice management

---

### 12. Onboarding Flow
**Tempo estimado:** 6 horas

**Steps:**
1. Bem-vindo + explicação
2. Conectar primeira integração
3. Criar primeira campanha
4. Convidar primeiro membro
5. Configurar IA preferida

**Progress:** Salvar em `localStorage` ou `User.onboardingStep`

---

### 13. Testes Automatizados
**Tempo estimado:** 16 horas (inicial)

**Setup:**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
```

**Testes prioritários:**
- Auth flow (login, register, logout)
- Invite system (send, accept, cancel)
- Campaign CRUD
- Chat com Edge Function
- Validação de limites

---

### 14. Monitoring & Error Tracking
**Tempo estimado:** 2 horas

**Sentry:**
```typescript
// main.tsx
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  integrations: [new Sentry.BrowserTracing()],
  tracesSampleRate: 1.0,
});
```

**Posthog (Analytics):**
```typescript
import posthog from 'posthog-js';

posthog.init('YOUR_API_KEY', {
  api_host: 'https://app.posthog.com'
});

// Track events
posthog.capture('campaign_created', { platform: 'META_ADS' });
```

---

## 📊 ROADMAP COMPLETO

### Semana 1 (Esta Semana) - Beta Fechado
- [x] Edge Functions integradas
- [x] Sistema de convites implementado
- [ ] Configurar chave de encriptação (Vault)
- [ ] Configurar Resend
- [ ] Criar `/accept-invite`
- [ ] Otimizar RLS policies
- [ ] Adicionar índices em FKs
- [ ] Fixar search_path

**Meta:** Sistema pronto para 10-20 beta testers

---

### Semana 2 - Validações & UX
- [ ] Validação de limites
- [ ] Sistema de notificações
- [ ] Dashboard com dados reais
- [ ] Billing page
- [ ] Email templates profissionais
- [ ] Error boundaries

**Meta:** UX polido para beta público

---

### Semana 3-4 - Stripe & Billing
- [ ] Integração Stripe completa
- [ ] Webhooks
- [ ] Upgrade/downgrade flow
- [ ] Trial ending automation
- [ ] Invoice management
- [ ] Onboarding flow

**Meta:** Monetização funcionando

---

### Mês 2 - Features Premium & Scale
- [ ] Analytics avançado
- [ ] Automações
- [ ] Templates
- [ ] Testes E2E
- [ ] Performance optimization
- [ ] API pública (v1)

**Meta:** Product-market fit

---

## 🎯 MÉTRICAS DE SUCESSO

### Técnicas
- ✅ Uptime: >99.9%
- ⚠️ Response time: <500ms
- ⚠️ Error rate: <0.1%
- ❌ Test coverage: >80%

### Produto
- Activation rate: >60%
- Retention D7: >40%
- Retention D30: >25%
- Trial-to-paid: >15%

### Negócio
- MRR growth: >20% MoM
- CAC payback: <6 meses
- LTV:CAC: >3:1
- NPS: >50

---

## 📚 DOCUMENTAÇÃO GERADA

1. **CONFIGURAR_ENCRYPTION_KEY.md** - Setup Vault para API keys
2. **CONFIGURAR_EMAIL_SERVICE.md** - Setup Resend para convites
3. **AUDITORIA_SISTEMA_COMPLETA.md** - Análise completa do sistema
4. **PROXIMOS_PASSOS_RECOMENDADOS.md** - Este documento

---

## ✅ CHECKLIST FINAL

### Antes de Beta Fechado (Esta Semana)
- [ ] Chave de encriptação no Vault
- [ ] Resend configurado e testado
- [ ] Página `/accept-invite` funcionando
- [ ] RLS policies otimizadas
- [ ] Índices adicionados
- [ ] Functions com search_path fixo
- [ ] Testar flow completo: criar org → convidar → aceitar → criar campanha

### Antes de Beta Público (Semana 2-3)
- [ ] Validação de limites funcionando
- [ ] Notificações implementadas
- [ ] Dashboard com dados reais
- [ ] Billing page
- [ ] Sentry configurado
- [ ] Testes E2E dos flows principais

### Antes de Produção (Mês 1)
- [ ] Stripe integrado e testado
- [ ] Onboarding flow completo
- [ ] Documentação/Help
- [ ] Termos e Privacidade
- [ ] Testes de carga
- [ ] Plano de incident response
- [ ] Backup strategy

---

## 💬 SUPORTE

**Dúvidas técnicas:** Ver documentação em cada MD
**Issues:** Criar issue no GitHub
**Urgente:** Slack #dev-syncads

---

**Documento criado em:** 20 de Outubro de 2025  
**Próxima revisão:** Sprint Planning (Segunda-feira)  
**Status:** 🟢 Pronto para começar!
