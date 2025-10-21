# 🔐 CONFIGURAÇÃO OAUTH COMPLETA - SYNCADS

## 📋 ÍNDICE
1. [Visão Geral](#visão-geral)
2. [Google Ads OAuth](#1-google-ads-oauth)
3. [LinkedIn Ads OAuth](#2-linkedin-ads-oauth)
4. [TikTok Ads OAuth](#3-tiktok-ads-oauth)
5. [Twitter (X) Ads OAuth](#4-twitter-x-ads-oauth)
6. [Configurar .env](#5-configurar-env)
7. [Testar Integrações](#6-testar-integrações)

---

## 📌 VISÃO GERAL

O SyncAds integra com 5 plataformas de anúncios:
- ✅ **Meta Ads** (Facebook/Instagram) - JÁ CONFIGURADO
- ⚠️ **Google Ads** - PRECISA CONFIGURAR
- ⚠️ **LinkedIn Ads** - PRECISA CONFIGURAR
- ⚠️ **TikTok Ads** - PRECISA CONFIGURAR
- ⚠️ **Twitter Ads** - PRECISA CONFIGURAR

**Tempo estimado:** 40-60 minutos (10-15 min por plataforma)

---

## 1. 🟦 GOOGLE ADS OAUTH

### **Passo 1: Criar Projeto no Google Cloud (5 min)**

1. Acesse: https://console.cloud.google.com/
2. Clique em **"Select a project"** → **"New Project"**
3. Nome: `SyncAds Google Ads`
4. Clique em **"Create"**

### **Passo 2: Ativar Google Ads API (2 min)**

1. No menu lateral: **APIs & Services** → **Library**
2. Busque: `Google Ads API`
3. Clique em **"ENABLE"**

### **Passo 3: Configurar OAuth Consent Screen (5 min)**

1. Menu: **APIs & Services** → **OAuth consent screen**
2. Escolha: **External** (usuários externos)
3. Clique em **"CREATE"**

**Informações do App:**
- **App name:** SyncAds
- **User support email:** seu-email@exemplo.com
- **Developer contact:** seu-email@exemplo.com
- Clique em **"SAVE AND CONTINUE"**

**Scopes:**
- Clique em **"ADD OR REMOVE SCOPES"**
- Busque e adicione: `https://www.googleapis.com/auth/adwords`
- Clique em **"UPDATE"** → **"SAVE AND CONTINUE"**

**Test Users (importante!):**
- Clique em **"ADD USERS"**
- Adicione o email da conta Google Ads que você vai usar
- Clique em **"SAVE AND CONTINUE"**

### **Passo 4: Criar Credenciais OAuth (3 min)**

1. Menu: **APIs & Services** → **Credentials**
2. Clique em **"CREATE CREDENTIALS"** → **"OAuth client ID"**
3. Application type: **Web application**
4. Name: `SyncAds Web Client`

**Authorized redirect URIs:**
```
http://localhost:5173/integrations/callback
https://seu-dominio.com/integrations/callback
```

5. Clique em **"CREATE"**
6. **COPIE:** Client ID e Client Secret

### **Passo 5: Obter Customer ID do Google Ads (2 min)**

1. Acesse: https://ads.google.com/
2. No canto superior direito, você verá um número tipo: `123-456-7890`
3. **Copie esse número SEM os hífens:** `1234567890`

### **Exemplo de Client ID:**
```
1234567890-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com
```

---

## 2. 🟦 LINKEDIN ADS OAUTH

### **Passo 1: Criar App no LinkedIn (5 min)**

1. Acesse: https://www.linkedin.com/developers/apps
2. Clique em **"Create app"**
3. Preencha:
   - **App name:** SyncAds
   - **LinkedIn Page:** Selecione sua página (ou crie uma)
   - **Privacy policy URL:** https://seu-site.com/privacy
   - **App logo:** Upload uma imagem 100x100px
4. Marque: **I have read and agree to the API Terms of Use**
5. Clique em **"Create app"**

### **Passo 2: Configurar Produtos (3 min)**

1. Na aba **"Products"**, solicite acesso a:
   - ✅ **Advertising API**
   - ✅ **Marketing Developer Platform**
2. Clique em **"Request access"** para cada um

⚠️ **IMPORTANTE:** Aprovação pode levar 1-3 dias úteis

### **Passo 3: Configurar Auth (3 min)**

1. Vá na aba **"Auth"**
2. Em **"Redirect URLs"**, adicione:
```
http://localhost:5173/integrations/callback
https://seu-dominio.com/integrations/callback
```
3. Clique em **"Update"**

### **Passo 4: Copiar Credenciais (1 min)**

1. Na aba **"Auth"**, copie:
   - **Client ID**
   - **Client Secret** (clique em "Show" para ver)

### **Passo 5: Verificar Permissões (2 min)**

Certifique-se que tem estas permissões marcadas:
- ✅ `r_ads`
- ✅ `r_ads_reporting`
- ✅ `rw_ads`
- ✅ `r_organization_social`

### **Exemplo de Client ID:**
```
86abc12345defgh
```

---

## 3. ⚫ TIKTOK ADS OAUTH

### **Passo 1: Criar Conta TikTok for Business (5 min)**

1. Acesse: https://business.tiktok.com/
2. Clique em **"Get Started"**
3. Complete o cadastro

### **Passo 2: Acessar TikTok for Developers (3 min)**

1. Acesse: https://ads.tiktok.com/marketing_api/homepage
2. Clique em **"Apply for access"**
3. Preencha o formulário:
   - **Company name:** Sua empresa
   - **Use case:** Marketing automation and campaign management
   - **Product type:** SaaS Platform
   - **Estimated monthly spend:** Selecione uma faixa

### **Passo 3: Criar App (5 min)**

1. Após aprovação, acesse: https://ads.tiktok.com/marketing_api/apps
2. Clique em **"Create an app"**
3. Preencha:
   - **App name:** SyncAds
   - **App description:** Marketing automation platform
   - **Redirect URL:** `http://localhost:5173/integrations/callback`

### **Passo 4: Solicitar Permissões (3 min)**

Solicite acesso às seguintes permissões:
- ✅ **Campaign Management**
- ✅ **Ad Management**
- ✅ **Reporting**
- ✅ **Audience Management**

### **Passo 5: Copiar Credenciais (1 min)**

No painel do app, copie:
- **App ID** (este é o Client ID)
- **Secret**

### **Exemplo de Client ID:**
```
1234567890123456789
```

⚠️ **IMPORTANTE:** Aprovação do TikTok pode levar 3-7 dias úteis

---

## 4. ⚫ TWITTER (X) ADS OAUTH

### **Passo 1: Criar Conta Twitter Ads (5 min)**

1. Acesse: https://ads.twitter.com/
2. Configure sua conta de anúncios

### **Passo 2: Criar App no Twitter Developer Portal (5 min)**

1. Acesse: https://developer.twitter.com/en/portal/dashboard
2. Clique em **"+ Create Project"**
3. Nome do projeto: `SyncAds`
4. Use case: **Making a bot**
5. Description: `Marketing automation platform for managing Twitter Ads campaigns`

### **Passo 3: Criar App (3 min)**

1. Clique em **"+ Create App"**
2. App name: `SyncAds Twitter Integration`
3. Copie as credenciais:
   - **API Key** (Client ID)
   - **API Key Secret** (Client Secret)
   - **Bearer Token**

### **Passo 4: Configurar Permissões (3 min)**

1. Na página do app, clique em **"Settings"**
2. Em **"App permissions"**, configure:
   - ✅ **Read and Write**
3. Em **"Type of App"**, selecione:
   - ✅ **Web App**

### **Passo 5: Configurar Callback URL (2 min)**

1. Em **"Authentication settings"**, clique em **"Edit"**
2. **Callback URL:** `http://localhost:5173/integrations/callback`
3. **Website URL:** `https://seu-dominio.com`
4. Clique em **"Save"**

### **Passo 6: Elevar Permissões (importante!)**

1. Solicite **Elevated access** em: https://developer.twitter.com/en/portal/products/elevated
2. Preencha o formulário explicando:
   - "Marketing automation platform"
   - "Need Twitter Ads API access for campaign management"

### **Exemplo de API Key:**
```
abc123XYZ456def789ghi012JKL345mno
```

⚠️ **IMPORTANTE:** Elevated access pode levar 1-2 dias para aprovação

---

## 5. 🔧 CONFIGURAR .ENV

Após obter todas as credenciais, atualize seu arquivo `.env`:

```env
# ============================================
# OAUTH CREDENTIALS - PLATAFORMAS DE ANÚNCIOS
# ============================================

# Meta Ads (Facebook/Instagram) - JÁ CONFIGURADO ✅
VITE_META_CLIENT_ID=seu-app-id-aqui
VITE_META_CLIENT_SECRET=seu-app-secret-aqui

# Google Ads - ADICIONAR ⚠️
VITE_GOOGLE_CLIENT_ID=1234567890-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=GOCSPX-abc123def456ghi789
VITE_GOOGLE_ADS_CUSTOMER_ID=1234567890

# LinkedIn Ads - ADICIONAR ⚠️
VITE_LINKEDIN_CLIENT_ID=86abc12345defgh
VITE_LINKEDIN_CLIENT_SECRET=AbCdEfGhIjKlMnOp

# TikTok Ads - ADICIONAR ⚠️
VITE_TIKTOK_CLIENT_ID=1234567890123456789
VITE_TIKTOK_CLIENT_SECRET=abc123def456ghi789jkl012

# Twitter (X) Ads - ADICIONAR ⚠️
VITE_TWITTER_CLIENT_ID=abc123XYZ456def789ghi012JKL345mno
VITE_TWITTER_CLIENT_SECRET=xyz789ABC012def345ghi678JKL901mno234PQR567
VITE_TWITTER_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAABearerTokenExampleHere
```

### **⚠️ IMPORTANTE:**

1. **NUNCA commite o .env no Git!**
2. Após atualizar, **reinicie o servidor:**
   ```bash
   # Parar servidor (Ctrl+C)
   npm run dev
   ```

---

## 6. ✅ TESTAR INTEGRAÇÕES

### **Teste pelo Chat (Recomendado)**

1. Acesse: http://localhost:5173/chat
2. Digite:
   ```
   Conecte o Google Ads
   ```
3. A IA mostrará botão **[Connect Google Ads]**
4. Clique e autorize
5. Repita para outras plataformas

### **Teste Manual**

1. Acesse: http://localhost:5173/integrations
2. Clique em **"Conectar"** em cada plataforma
3. Autorize no popup OAuth
4. Verifique status **"Conectado"** com ✅

### **Verificar no Banco**

```sql
-- Ver todas integrações conectadas
SELECT 
  platform,
  status,
  "isActive",
  "lastSyncAt"
FROM "Integration"
WHERE "organizationId" = '62f38421-3ea6-44c4-a5e0-d6437a627ab5';
```

---

## 📊 CHECKLIST FINAL

### **Google Ads**
- [ ] Projeto criado no Google Cloud
- [ ] Google Ads API habilitada
- [ ] OAuth Consent Screen configurado
- [ ] Credenciais OAuth criadas
- [ ] Customer ID obtido
- [ ] Variáveis no .env atualizadas
- [ ] Testado e funcionando

### **LinkedIn Ads**
- [ ] App criado no LinkedIn Developers
- [ ] Produtos (Advertising API) solicitados
- [ ] Redirect URLs configuradas
- [ ] Credenciais copiadas
- [ ] Variáveis no .env atualizadas
- [ ] Testado e funcionando

### **TikTok Ads**
- [ ] Conta TikTok for Business criada
- [ ] Acesso ao Marketing API solicitado
- [ ] App criado
- [ ] Permissões solicitadas
- [ ] Credenciais copiadas
- [ ] Variáveis no .env atualizadas
- [ ] Testado e funcionando

### **Twitter Ads**
- [ ] Conta Twitter Ads criada
- [ ] App criado no Developer Portal
- [ ] Elevated access solicitado
- [ ] Callback URL configurada
- [ ] Credenciais copiadas
- [ ] Variáveis no .env atualizadas
- [ ] Testado e funcionando

---

## 🚨 TROUBLESHOOTING

### **Erro: "Redirect URI mismatch"**
**Solução:** Verifique se a URL de callback está EXATAMENTE igual no painel OAuth e no código.

### **Erro: "Invalid client"**
**Solução:** Confirme que copiou Client ID e Secret corretamente (sem espaços extras).

### **Erro: "Access denied"**
**Solução:** Sua conta pode não ter permissões. Verifique:
- Google: Adicione seu email como "Test User"
- LinkedIn: Aguarde aprovação dos produtos
- TikTok: Aguarde aprovação do app
- Twitter: Solicite Elevated access

### **Erro: "Scope invalid"**
**Solução:** Verifique se solicitou os scopes/permissões corretos no painel OAuth.

---

## 📞 SUPORTE

**Documentação Oficial:**
- Google Ads: https://developers.google.com/google-ads/api/docs/oauth
- LinkedIn: https://learn.microsoft.com/en-us/linkedin/marketing/
- TikTok: https://ads.tiktok.com/marketing_api/docs
- Twitter: https://developer.twitter.com/en/docs/authentication

**Tempo Médio de Aprovação:**
- Google Ads: Imediato (modo teste)
- LinkedIn Ads: 1-3 dias úteis
- TikTok Ads: 3-7 dias úteis
- Twitter Ads: 1-2 dias úteis

---

## ✅ CONCLUSÃO

Após configurar todas as plataformas OAuth, seu SyncAds estará **100% operacional** para:
- Conectar contas de anúncios
- Criar campanhas via IA
- Sincronizar métricas
- Gerenciar múltiplas plataformas

**Status final esperado:** 5/5 plataformas conectadas ✅
