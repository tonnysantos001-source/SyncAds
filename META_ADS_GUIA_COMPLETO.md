# 🎯 META ADS API - GUIA COMPLETO DE IMPLEMENTAÇÃO

**Data:** 23/10/2025 16:20  
**Status:** 🚀 **INICIANDO**  
**Tempo Estimado:** 6-8 horas

---

## 🎯 OBJETIVO

Implementar gestão completa de campanhas Meta Ads (Facebook + Instagram) com:
- OAuth Facebook
- Listar campanhas existentes
- Criar novos anúncios
- Estatísticas em tempo real
- Integração com IA GROQ para otimização

---

## 📋 ROADMAP DE IMPLEMENTAÇÃO

### **FASE 1: Configuração Meta Developer** (30-45 min)
- [ ] Criar app no Meta Developer
- [ ] Configurar OAuth
- [ ] Obter App ID e App Secret
- [ ] Configurar domínios autorizados
- [ ] Solicitar permissões necessárias

### **FASE 2: Banco de Dados** (20-30 min)
- [ ] Migration: create_meta_ads_integration
- [ ] Tabelas: MetaAdsAccount, MetaAdsCampaign, MetaAdsInsights
- [ ] RLS policies
- [ ] Índices

### **FASE 3: Edge Functions** (2-3 horas)
- [ ] meta-auth (OAuth callback)
- [ ] meta-campaigns (listar/criar campanhas)
- [ ] meta-adsets (conjuntos de anúncios)
- [ ] meta-ads (anúncios individuais)
- [ ] meta-insights (estatísticas)

### **FASE 4: Frontend** (2-3 horas)
- [ ] MetaAdsPage (página principal)
- [ ] MetaAuthButton (OAuth)
- [ ] CampaignsList (lista campanhas)
- [ ] CreateCampaignForm (criar campanha)
- [ ] CampaignInsights (estatísticas)
- [ ] AdPreview (preview do anúncio)

### **FASE 5: Integração IA** (1-2 horas)
- [ ] GROQ sugere copy de anúncios
- [ ] GROQ analisa performance
- [ ] GROQ recomenda otimizações
- [ ] GROQ cria relatórios

### **FASE 6: Testes** (30-60 min)
- [ ] OAuth funcionando
- [ ] Listar campanhas
- [ ] Criar campanha teste
- [ ] Verificar estatísticas
- [ ] IA respondendo

---

## 🔑 FASE 1: CRIAR APP META DEVELOPER

### **Passo 1: Acessar Meta Developers**
```
https://developers.facebook.com/apps/
```

### **Passo 2: Criar Novo App**
1. Clique "Create App"
2. Escolha tipo: **"Business"**
3. Nome do app: **"SyncAds Manager"**
4. Email de contato: seu email
5. Clique "Create App"

### **Passo 3: Configurar Marketing API**
1. No dashboard do app
2. Adicionar produto: **"Marketing API"**
3. Clique "Set Up"

### **Passo 4: Obter Credenciais**
```
Settings → Basic

Você verá:
- App ID: [copie este número]
- App Secret: [clique "Show" e copie]
```

### **Passo 5: Configurar OAuth**
```
Settings → Basic → Add Platform → Website

Site URL: http://localhost:5173
```

**Para produção:**
```
Site URL: https://seu-dominio.com
```

### **Passo 6: OAuth Redirect URIs**
```
Facebook Login → Settings

Valid OAuth Redirect URIs:
- http://localhost:5173/integrations/meta/callback
- https://seu-dominio.com/integrations/meta/callback
```

### **Passo 7: Permissões Necessárias**
```
App Review → Permissions and Features

Solicitar:
✅ ads_management (gerenciar anúncios)
✅ ads_read (ler dados de anúncios)
✅ business_management (gestão empresarial)
✅ pages_read_engagement (ler páginas)
✅ pages_manage_ads (gerenciar anúncios de páginas)
```

**Obs:** Modo Development já tem essas permissões para testes!

---

## 💾 FASE 2: BANCO DE DADOS

### **Migration: Meta Ads Integration**

```sql
-- Tabela de contas Meta Ads
CREATE TABLE "MetaAdsAccount" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id),
  "organizationId" UUID REFERENCES "Organization"(id),
  "accountId" TEXT NOT NULL, -- Meta Ads Account ID
  "accountName" TEXT,
  "accessToken" TEXT NOT NULL,
  "tokenExpiresAt" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de campanhas
CREATE TABLE "MetaAdsCampaign" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "metaAccountId" UUID REFERENCES "MetaAdsAccount"(id),
  "campaignId" TEXT NOT NULL, -- Meta Campaign ID
  "campaignName" TEXT NOT NULL,
  objective TEXT,
  status TEXT,
  "dailyBudget" DECIMAL(10,2),
  "lifetimeBudget" DECIMAL(10,2),
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de insights (estatísticas)
CREATE TABLE "MetaAdsInsights" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "campaignId" UUID REFERENCES "MetaAdsCampaign"(id),
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10,2) DEFAULT 0,
  reach INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RLS Policies
ALTER TABLE "MetaAdsAccount" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MetaAdsCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MetaAdsInsights" ENABLE ROW LEVEL SECURITY;

-- Users can view own accounts
CREATE POLICY "Users view own meta accounts"
  ON "MetaAdsAccount" FOR SELECT
  USING (auth.uid()::text = "userId");

-- Users can insert own accounts
CREATE POLICY "Users insert own meta accounts"
  ON "MetaAdsAccount" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

-- Users can view campaigns from their accounts
CREATE POLICY "Users view own campaigns"
  ON "MetaAdsCampaign" FOR SELECT
  USING (
    "metaAccountId" IN (
      SELECT id FROM "MetaAdsAccount" 
      WHERE "userId" = auth.uid()::text
    )
  );

-- Índices
CREATE INDEX idx_meta_account_user ON "MetaAdsAccount"("userId");
CREATE INDEX idx_meta_campaign_account ON "MetaAdsCampaign"("metaAccountId");
CREATE INDEX idx_meta_insights_campaign ON "MetaAdsInsights"("campaignId");
```

---

## 🔧 FASE 3: EDGE FUNCTIONS

### **3.1. meta-auth (OAuth Callback)**

```typescript
// supabase/functions/meta-auth/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code } = await req.json()
    
    // Trocar code por access_token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${Deno.env.get('META_APP_ID')}&` +
      `client_secret=${Deno.env.get('META_APP_SECRET')}&` +
      `code=${code}&` +
      `redirect_uri=${Deno.env.get('META_REDIRECT_URI')}`
    )
    
    const tokenData = await tokenResponse.json()
    const accessToken = tokenData.access_token
    
    // Obter dados da conta
    const accountResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?` +
      `fields=id,name,account_status&` +
      `access_token=${accessToken}`
    )
    
    const accountData = await accountResponse.json()
    const account = accountData.data[0] // Primeira conta
    
    // Salvar no banco
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase.from('MetaAdsAccount').insert({
      userId: user.id,
      accountId: account.id,
      accountName: account.name,
      accessToken: accessToken,
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 dias
      isActive: true
    })
    
    return new Response(
      JSON.stringify({ success: true, account }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

### **3.2. meta-campaigns (Listar Campanhas)**

```typescript
// supabase/functions/meta-campaigns/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    
    // Buscar conta Meta do usuário
    const { data: metaAccount } = await supabase
      .from('MetaAdsAccount')
      .select('*')
      .eq('userId', user.id)
      .eq('isActive', true)
      .single()
    
    if (!metaAccount) {
      throw new Error('Meta Ads não conectado')
    }
    
    // Buscar campanhas da API Meta
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${metaAccount.accountId}/campaigns?` +
      `fields=id,name,objective,status,daily_budget,lifetime_budget&` +
      `access_token=${metaAccount.accessToken}`
    )
    
    const data = await response.json()
    
    // Salvar/atualizar campanhas no banco
    for (const campaign of data.data) {
      await supabase.from('MetaAdsCampaign').upsert({
        metaAccountId: metaAccount.id,
        campaignId: campaign.id,
        campaignName: campaign.name,
        objective: campaign.objective,
        status: campaign.status,
        dailyBudget: campaign.daily_budget ? parseInt(campaign.daily_budget) / 100 : null,
        lifetimeBudget: campaign.lifetime_budget ? parseInt(campaign.lifetime_budget) / 100 : null,
      }, {
        onConflict: 'campaignId'
      })
    }
    
    return new Response(
      JSON.stringify({ campaigns: data.data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
```

---

## 🎨 FASE 4: FRONTEND

### **4.1. Botão OAuth**

```typescript
// src/components/MetaAuthButton.tsx
import { Button } from '@/components/ui/button'

export function MetaAuthButton() {
  const handleConnect = () => {
    const appId = import.meta.env.VITE_META_APP_ID
    const redirectUri = `${window.location.origin}/integrations/meta/callback`
    
    const authUrl = 
      `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=ads_management,ads_read,business_management&` +
      `response_type=code`
    
    window.location.href = authUrl
  }
  
  return (
    <Button onClick={handleConnect} className="gap-2">
      <img src="/facebook-icon.svg" className="h-5 w-5" />
      Conectar Meta Ads
    </Button>
  )
}
```

### **4.2. Lista de Campanhas**

```typescript
// src/components/CampaignsList.tsx
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'

export function CampaignsList() {
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadCampaigns()
  }, [])
  
  const loadCampaigns = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/meta-campaigns`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      }
    )
    
    const { campaigns } = await response.json()
    setCampaigns(campaigns)
    setLoading(false)
  }
  
  if (loading) return <div>Carregando...</div>
  
  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id} className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">{campaign.name}</h3>
              <p className="text-sm text-gray-500">{campaign.objective}</p>
            </div>
            <Badge>{campaign.status}</Badge>
          </div>
        </Card>
      ))}
    </div>
  )
}
```

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

### **AGORA VAMOS COMEÇAR!**

**Passo 1:** Criar app no Meta Developer
```
Me confirme quando tiver:
- App ID
- App Secret
```

**Passo 2:** Vou criar as migrations e Edge Functions

**Passo 3:** Vou criar o frontend

**Passo 4:** Testar OAuth e campanhas

---

## 📞 PRECISO DE VOCÊ AGORA

**Vá para:** https://developers.facebook.com/apps/

**Crie o app conforme instruções acima**

**Me envie:**
1. **App ID:** (número)
2. **App Secret:** (string longa)

**Com isso, eu implemento tudo! 🚀**

---

# 🎯 ESTOU AGUARDANDO!

**Assim que tiver as credenciais, continuo a implementação!**
