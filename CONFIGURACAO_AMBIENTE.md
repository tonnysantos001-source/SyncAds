# 🔐 Guia de Configuração de Ambiente - SyncAds

Este guia lista todas as variáveis de ambiente necessárias para configurar o SyncAds completamente.

## 📋 Índice

1. [Supabase](#supabase)
2. [IA Providers](#ia-providers)
3. [Payment Gateways](#payment-gateways)
4. [Monitoring & Error Tracking](#monitoring--error-tracking)
5. [Rate Limiting](#rate-limiting)
6. [OAuth](#oauth)
7. [Exemplo Completo](#exemplo-completo)

---

## 🗄️ Supabase

### Frontend (.env)

```env
# ⚠️ CRÍTICO: Gerar nova anon key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key-here

# Opcional: Versão da aplicação
VITE_APP_VERSION=1.0.0
```

### Edge Functions (Edge Function Secrets)

Configure no Supabase Dashboard > Edge Functions > Secrets:

```bash
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_DB_PASSWORD=your-db-password

# JWT
JWT_SECRET=your-jwt-secret-here
```

### 📝 Como gerar nova Anon Key:

1. Acesse Supabase Dashboard
2. Settings > API
3. Project API Keys > Generate New Key
4. Copie a nova key
5. ⚠️ **IMPORTANTE**: Revogue a key antiga

---

## 🤖 IA Providers

### OpenAI

```env
# Edge Functions
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Onde obter**: [OpenAI Platform](https://platform.openai.com/api-keys)

### Anthropic (Claude)

```env
# Edge Functions
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Onde obter**: [Anthropic Console](https://console.anthropic.com/)

### Groq

```env
# Edge Functions
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Onde obter**: [Groq Console](https://console.groq.com/)

### Web Search APIs

#### Exa AI

```env
# Edge Functions
EXA_API_KEY=your-exa-api-key
```

**Onde obter**: [Exa AI](https://exa.ai/)

#### Tavily

```env
# Edge Functions  
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Onde obter**: [Tavily](https://tavily.com/)

#### Serper

```env
# Edge Functions
SERPER_API_KEY=your-serper-api-key
```

**Onde obter**: [Serper.dev](https://serper.dev/)

---

## 💳 Payment Gateways

### Stripe

```env
# Edge Functions
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Onde obter**: [Stripe Dashboard](https://dashboard.stripe.com/apikeys)

### Mercado Pago

```env
# Edge Functions
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Onde obter**: [Mercado Pago Developers](https://www.mercadopago.com.br/developers)

### Asaas

```env
# Edge Functions
ASAAS_API_KEY=$aact_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Onde obter**: [Asaas](https://www.asaas.com/)

### PayPal

```env
# Edge Functions
PAYPAL_CLIENT_ID=your-client-id
PAYPAL_CLIENT_SECRET=your-client-secret
```

**Onde obter**: [PayPal Developer](https://developer.paypal.com/)

### PagSeguro

```env
# Edge Functions
PAGSEGURO_EMAIL=your-email@example.com
PAGSEGURO_TOKEN=your-token
```

**Onde obter**: [PagSeguro](https://pagseguro.uol.com.br/)

---

## 📊 Monitoring & Error Tracking

### Sentry

```env
# Frontend
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Edge Functions (opcional)
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

**Onde obter**: 
1. Crie conta em [Sentry.io](https://sentry.io/)
2. Crie novo projeto
3. Copie o DSN

---

## ⚡ Rate Limiting

### Upstash Redis

```env
# Edge Functions
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

**Como configurar**:

1. Crie conta em [Upstash](https://upstash.com/)
2. Crie novo Redis database
3. Copie REST URL e Token
4. Configure no Supabase Edge Functions:

```bash
supabase secrets set UPSTASH_REDIS_REST_URL=your-url
supabase secrets set UPSTASH_REDIS_REST_TOKEN=your-token
```

---

## 🔗 OAuth

### Meta (Facebook/Instagram Ads)

```env
# Edge Functions
META_APP_ID=your-app-id
META_APP_SECRET=your-app-secret
META_REDIRECT_URI=https://your-app.com/integrations/callback
```

**Onde obter**: [Meta for Developers](https://developers.facebook.com/)

### Google Ads

```env
# Edge Functions
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-app.com/integrations/callback
```

**Onde obter**: [Google Cloud Console](https://console.cloud.google.com/)

---

## 📄 Exemplo Completo

### Frontend (.env)

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-new-anon-key-here

# App
VITE_APP_VERSION=1.0.0

# Sentry
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

### Edge Functions (Supabase Secrets)

Execute os comandos abaixo para configurar:

```bash
# Supabase
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
supabase secrets set JWT_SECRET=your-jwt-secret

# OpenAI
supabase secrets set OPENAI_API_KEY=sk-proj-xxxxx

# Anthropic
supabase secrets set ANTHROPIC_API_KEY=sk-ant-xxxxx

# Groq
supabase secrets set GROQ_API_KEY=gsk_xxxxx

# Web Search
supabase secrets set EXA_API_KEY=your-exa-key
supabase secrets set TAVILY_API_KEY=tvly-xxxxx
supabase secrets set SERPER_API_KEY=your-serper-key

# Stripe
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# Mercado Pago
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx

# Asaas
supabase secrets set ASAAS_API_KEY=$aact_xxxxx

# Upstash Redis
supabase secrets set UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
supabase secrets set UPSTASH_REDIS_REST_TOKEN=xxxxx

# Meta OAuth
supabase secrets set META_APP_ID=your-app-id
supabase secrets set META_APP_SECRET=your-app-secret

# Google OAuth
supabase secrets set GOOGLE_CLIENT_ID=your-client-id
supabase secrets set GOOGLE_CLIENT_SECRET=your-client-secret

# Sentry (opcional para Edge Functions)
supabase secrets set SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
```

---

## ✅ Checklist de Configuração

### Crítico (Obrigatório)

- [ ] Gerar nova Supabase Anon Key
- [ ] Configurar SUPABASE_SERVICE_ROLE_KEY
- [ ] Configurar JWT_SECRET
- [ ] Configurar pelo menos 1 IA provider (OpenAI/Anthropic/Groq)
- [ ] Configurar pelo menos 1 payment gateway (Stripe/Mercado Pago)

### Importante (Recomendado)

- [ ] Configurar Sentry DSN
- [ ] Configurar Upstash Redis
- [ ] Configurar Web Search APIs (Exa/Tavily/Serper)
- [ ] Configurar todos os payment gateways
- [ ] Configurar OAuth (Meta, Google)

### Opcional

- [ ] Configurar múltiplos IA providers para fallback
- [ ] Configurar Sentry para Edge Functions

---

## 🔒 Segurança

### ⚠️ NUNCA:

- ❌ Commitar `.env` no Git
- ❌ Compartilhar API keys
- ❌ Usar keys de produção em desenvolvimento
- ❌ Hardcodar credenciais no código

### ✅ SEMPRE:

- ✅ Usar `.env` para frontend
- ✅ Usar Supabase Secrets para Edge Functions
- ✅ Adicionar `.env` no `.gitignore`
- ✅ Rotacionar keys periodicamente
- ✅ Usar keys diferentes para dev/prod

---

## 🚀 Deploy

### Vercel

1. Vá em Settings > Environment Variables
2. Adicione todas as variáveis `VITE_*`
3. Deploy

### Netlify

1. Vá em Site Settings > Environment Variables
2. Adicione todas as variáveis `VITE_*`
3. Deploy

### Supabase Edge Functions

```bash
# Deploy todas as functions com secrets configurados
supabase functions deploy
```

---

## 📞 Suporte

Se tiver dúvidas sobre configuração:

1. Verifique logs do Supabase
2. Consulte documentação dos providers
3. Teste com Postman/Insomnia antes de integrar

---

**Última atualização**: 29/10/2024  
**Versão**: 1.0.0

