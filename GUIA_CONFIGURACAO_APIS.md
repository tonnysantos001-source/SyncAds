# 🔑 GUIA DE CONFIGURAÇÃO DE APIS

**Atualizado:** 23/10/2025  
**Status:** 📋 Configurações necessárias

---

## ✅ FASE 1: OpenAI (DALL-E) - AGORA!

### **1. Criar Conta OpenAI**
1. Acesse: https://platform.openai.com/signup
2. Crie sua conta
3. Adicione crédito: https://platform.openai.com/account/billing/overview
   - Mínimo: $5 USD
   - Recomendado: $20 USD (dura ~1 mês)

### **2. Gerar API Key**
1. Acesse: https://platform.openai.com/api-keys
2. Clique em "Create new secret key"
3. Nome: "SyncAds Production"
4. Copie a chave (começa com `sk-proj-...`)

### **3. Configurar no Supabase**
```bash
cd c:\Users\dinho\Documents\GitHub\SyncAds
npx supabase secrets set OPENAI_API_KEY=sk-proj-SEU_TOKEN_AQUI
```

### **4. Testar**
Abra o chat e digite:
```
"Gere uma imagem de um produto tecnológico moderno"
```

**Custo:** ~$0.04 por imagem (R$0.20)

---

## 🔵 FASE 2: Meta Ads - DEPOIS (2-3h)

### **1. Criar App Meta Developer**
1. Acesse: https://developers.facebook.com/apps
2. Clique em "Create App"
3. Tipo: "Business"
4. Nome: "SyncAds Growth OS"
5. Email: seu email

### **2. Configurar OAuth**
1. Vá em **Settings > Basic**
2. Copie:
   - **App ID** (ex: 1234567890)
   - **App Secret** (clique em Show)

3. Em **Products**, adicione **Marketing API**

4. Em **Marketing API > Tools**, configure:
   - **OAuth Redirect URIs:**
     ```
     http://localhost:5173/integrations/callback
     https://seudominio.com/integrations/callback
     ```
   
   - **Allowed Domains:**
     ```
     localhost
     seudominio.com
     ```

### **3. Solicitar Permissões**
1. Em **App Review > Permissions and Features**
2. Solicite:
   - `ads_management`
   - `ads_read`
   - `business_management`

3. Status:
   - ✅ **Em desenvolvimento:** Pode testar com sua conta
   - ⏳ **Revisão:** Envie para aprovar quando pronto para produção

### **4. Configurar no Supabase**
```bash
npx supabase secrets set META_APP_ID=SEU_APP_ID
npx supabase secrets set META_APP_SECRET=SEU_APP_SECRET
```

### **5. Configurar no Frontend**
Edite `.env`:
```
VITE_META_CLIENT_ID=SEU_APP_ID
```

### **6. Deploy Edge Functions**
```bash
npx supabase functions deploy auth-meta
npx supabase functions deploy meta-ads-tools
```

### **7. Testar**
1. Vá em **Integrações**
2. Clique em "Conectar Meta Ads"
3. Autorize com sua conta Facebook
4. No chat, digite:
   ```
   "Crie uma campanha no Facebook chamada 'Teste' com budget de R$50/dia"
   ```

---

## 🔴 FASE 3: Google Ads - FUTURO (3h)

### **1. Criar Projeto Google Cloud**
1. Acesse: https://console.cloud.google.com
2. Crie novo projeto: "SyncAds"

### **2. Habilitar APIs**
1. Vá em **APIs & Services > Library**
2. Habilite:
   - **Google Ads API**
   - **Google Analytics API**

### **3. Criar OAuth Credentials**
1. Vá em **APIs & Services > Credentials**
2. Clique em "Create Credentials" > "OAuth 2.0 Client ID"
3. Tipo: "Web application"
4. Nome: "SyncAds Production"
5. **Authorized redirect URIs:**
   ```
   http://localhost:5173/integrations/callback
   https://seudominio.com/integrations/callback
   ```

6. Copie:
   - **Client ID**
   - **Client Secret**

### **4. Configurar no Supabase**
```bash
npx supabase secrets set GOOGLE_CLIENT_ID=SEU_CLIENT_ID
npx supabase secrets set GOOGLE_CLIENT_SECRET=SEU_CLIENT_SECRET
```

### **5. Configurar no Frontend**
`.env`:
```
VITE_GOOGLE_CLIENT_ID=SEU_CLIENT_ID
```

---

## 💼 FASE 4: LinkedIn Ads - FUTURO (2h)

### **1. Criar App LinkedIn**
1. Acesse: https://www.linkedin.com/developers/apps
2. Clique em "Create app"
3. Preencha:
   - **App name:** SyncAds
   - **LinkedIn Page:** Sua página
   - **App logo:** Upload logo

### **2. Configurar Produtos**
1. Vá em **Products**
2. Solicite: "Advertising API"

### **3. OAuth Settings**
1. Em **Auth**, adicione:
   - **Redirect URLs:**
     ```
     http://localhost:5173/integrations/callback
     https://seudominio.com/integrations/callback
     ```

2. **OAuth 2.0 scopes:**
   - `r_ads`
   - `rw_ads`
   - `r_ads_reporting`

### **4. Configurar**
```bash
npx supabase secrets set LINKEDIN_CLIENT_ID=SEU_CLIENT_ID
npx supabase secrets set LINKEDIN_CLIENT_SECRET=SEU_CLIENT_SECRET
```

---

## 🎵 FASE 5: TikTok Ads - FUTURO (2h)

### **1. Criar TikTok for Business Account**
1. Acesse: https://ads.tiktok.com
2. Crie conta Business

### **2. Acessar Developer Portal**
1. Acesse: https://business-api.tiktok.com
2. Crie aplicativo
3. Solicite acesso à API

### **3. Configurar**
```bash
npx supabase secrets set TIKTOK_APP_ID=SEU_APP_ID
npx supabase secrets set TIKTOK_APP_SECRET=SEU_APP_SECRET
```

---

## 🐦 FASE 6: Twitter (X) Ads - FUTURO (2h)

### **1. Criar App Twitter**
1. Acesse: https://developer.twitter.com/en/apps
2. Crie novo app
3. Habilite **Ads API**

### **2. Configurar OAuth 2.0**
1. Em **User authentication settings**
2. Type: "Web App"
3. **Callback URL:**
   ```
   http://localhost:5173/integrations/callback
   ```

### **3. Configurar**
```bash
npx supabase secrets set TWITTER_CLIENT_ID=SEU_CLIENT_ID
npx supabase secrets set TWITTER_CLIENT_SECRET=SEU_CLIENT_SECRET
```

---

## 📊 CUSTOS ESTIMADOS

### **OpenAI (DALL-E)**
- **Desenvolvimento:** $5-20/mês
- **Produção (1000 clientes):** $500-2000/mês
- **Por imagem:** $0.04 (standard) | $0.08 (HD)

### **APIs de Anúncios (TODAS GRATUITAS!)**
- Meta Ads API: R$ 0
- Google Ads API: R$ 0
- LinkedIn Ads API: R$ 0
- TikTok Ads API: R$ 0
- Twitter Ads API: R$ 0

**OBS:** As plataformas não cobram pelo uso da API, apenas pelos anúncios que os clientes criarem.

---

## ✅ CHECKLIST DE CONFIGURAÇÃO

### **AGORA (Essencial):**
- [ ] Criar conta OpenAI
- [ ] Adicionar crédito ($5-20)
- [ ] Gerar API Key
- [ ] Configurar `OPENAI_API_KEY`
- [ ] Testar geração de imagem

### **HOJE/AMANHÃ (Alta prioridade):**
- [ ] Criar app Meta Developer
- [ ] Configurar OAuth Meta
- [ ] Deploy auth-meta + meta-ads-tools
- [ ] Testar criação de campanha

### **ESTA SEMANA:**
- [ ] Configurar Google Ads API
- [ ] Configurar LinkedIn Ads API
- [ ] Configurar TikTok Ads API
- [ ] Configurar Twitter Ads API

### **SEMANA QUE VEM:**
- [ ] Testar todas integrações
- [ ] Documentar para clientes
- [ ] Deploy em produção

---

## 🚀 COMANDOS RÁPIDOS

### **Ver secrets atuais:**
```bash
npx supabase secrets list
```

### **Configurar secret:**
```bash
npx supabase secrets set NOME_DA_SECRET=valor
```

### **Deploy Edge Function:**
```bash
npx supabase functions deploy NOME_FUNCAO
```

### **Ver logs:**
```bash
npx supabase functions logs NOME_FUNCAO --tail
```

---

## 🆘 TROUBLESHOOTING

### **"Quota exceeded" ao gerar imagem**
- Verificar plano do cliente
- Aumentar quota manualmente:
  ```sql
  UPDATE "Organization"
  SET "aiImagesQuota" = 100
  WHERE id = 'ORG_ID';
  ```

### **"Meta Ads not connected"**
- Cliente precisa conectar em /integrations
- Verificar se token não expirou
- Renovar token se necessário

### **"Insufficient permissions"**
- Solicitar permissões corretas no app
- Aguardar aprovação da plataforma
- Usar conta de teste durante desenvolvimento

---

## 📞 SUPORTE

- **OpenAI:** https://help.openai.com
- **Meta:** https://developers.facebook.com/support
- **Google:** https://developers.google.com/google-ads/api/support
- **LinkedIn:** https://www.linkedin.com/help/lms/answer/a552616
- **TikTok:** https://ads.tiktok.com/help/
- **Twitter:** https://developer.twitter.com/en/support

---

**✨ Após configurar tudo, seu SyncAds será uma máquina de automação completa!**
