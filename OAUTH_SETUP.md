# 🔐 Guia de Configuração OAuth - Integrações

**Tempo estimado:** 15-30 minutos por plataforma  
**Dificuldade:** Intermediário ⭐⭐

---

## 📋 Visão Geral

Para conectar integrações de anúncios (Facebook Ads, Google Ads, LinkedIn, etc.), você precisa criar aplicações OAuth em cada plataforma e obter as credenciais necessárias.

Este guia passo a passo mostra **exatamente** como fazer isso.

---

## 🎯 O que você vai precisar

- [ ] Conta na plataforma que deseja integrar
- [ ] Acesso de desenvolvedor habilitado
- [ ] URL de redirect configurada: `http://localhost:5173/integrations/callback`
- [ ] 15-30 minutos por plataforma

---

## 📘 1. Meta Ads (Facebook + Instagram)

### Passo 1: Criar App no Meta for Developers

1. **Acesse:** https://developers.facebook.com/apps
2. **Clique em:** "Criar App" (verde, canto superior direito)
3. **Selecione:** "Empresa" como tipo de app
4. **Preencha:**
   - Nome do app: `SyncAds`
   - Email de contato: seu@email.com
   - Finalidade comercial: Gerenciar negócios
5. **Clique em:** "Criar App"

### Passo 2: Adicionar Marketing API

1. **Na dashboard do app, role até:**
   ```
   Adicionar produtos
   ```

2. **Localize "Marketing API" e clique em:**
   ```
   Configurar
   ```

3. **Siga o assistente de configuração**

### Passo 3: Obter Credenciais

1. **No menu lateral, vá em:**
   ```
   Configurações → Básico
   ```

2. **Você verá:**
   - **ID do App** (Client ID) - Copie este valor
   - **Chave Secreta do App** - Clique em "Mostrar" e copie

3. **Adicione no `.env`:**
   ```env
   VITE_META_CLIENT_ID=seu-client-id-aqui
   VITE_OAUTH_CLIENT_SECRET=sua-secret-aqui
   ```

### Passo 4: Configurar Redirect URI

1. **Ainda em Configurações → Básico, role até:**
   ```
   URIs de Redirecionamento do OAuth Válidos
   ```

2. **Adicione:**
   ```
   http://localhost:5173/integrations/callback
   https://seu-dominio.com/integrations/callback
   ```

3. **Clique em:** "Salvar Alterações"

### Passo 5: Solicitar Permissões (Importante!)

1. **Vá em:** "Permissões e Recursos"
2. **Solicite as seguintes permissões:**
   - `ads_management` - Para gerenciar anúncios
   - `ads_read` - Para ler dados de anúncios
   - `business_management` - Para gerenciar conta comercial

3. **Clique em:** "Enviar para Análise" (pode levar alguns dias)

**💡 Para Desenvolvimento:** Você pode testar sem aprovação usando sua própria conta.

---

## 🔍 2. Google Ads

### Passo 1: Criar Projeto no Google Cloud

1. **Acesse:** https://console.cloud.google.com
2. **Clique em:** "Selecionar projeto" → "Novo Projeto"
3. **Preencha:**
   - Nome do projeto: `SyncAds`
   - Organização: (deixe padrão)
4. **Clique em:** "Criar"

### Passo 2: Habilitar APIs

1. **No menu lateral, vá em:**
   ```
   APIs e Serviços → Biblioteca
   ```

2. **Pesquise e habilite:**
   - Google Ads API
   - Google Analytics API (opcional)

3. **Clique em "Ativar"** em cada uma

### Passo 3: Criar Credenciais OAuth

1. **Vá em:**
   ```
   APIs e Serviços → Credenciais
   ```

2. **Clique em:** "Criar Credenciais" → "ID do cliente OAuth 2.0"

3. **Configure a tela de consentimento OAuth:**
   - Tipo de usuário: Externo
   - Nome do app: SyncAds
   - Email de suporte: seu@email.com
   - Domínio autorizado: localhost
   - Email do desenvolvedor: seu@email.com

4. **Escopos (Adicione):**
   ```
   https://www.googleapis.com/auth/adwords
   https://www.googleapis.com/auth/analytics.readonly
   ```

5. **Tipo de aplicativo:** Aplicativo da Web

6. **URIs de redirecionamento autorizados:**
   ```
   http://localhost:5173/integrations/callback
   https://seu-dominio.com/integrations/callback
   ```

### Passo 4: Obter Credenciais

1. **Após criar, você verá:**
   - **ID do cliente** (Client ID)
   - **Chave secreta do cliente** (Client Secret)

2. **Adicione no `.env`:**
   ```env
   VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
   VITE_OAUTH_CLIENT_SECRET=sua-secret-aqui
   ```

### Passo 5: Testar Usuários

1. **Enquanto em modo de teste, adicione:**
   ```
   APIs e Serviços → Tela de consentimento OAuth → Usuários de teste
   ```

2. **Adicione seu email** para poder testar

**💡 Importante:** Publique o app depois de testar (pode levar dias para aprovação)

---

## 💼 3. LinkedIn Ads

### Passo 1: Criar Aplicação

1. **Acesse:** https://www.linkedin.com/developers/apps
2. **Clique em:** "Create app"
3. **Preencha:**
   - App name: SyncAds
   - LinkedIn Page: (selecione sua página empresarial)
   - Privacy policy URL: https://seu-site.com/privacy
   - App logo: (faça upload de um logo)

4. **Clique em:** "Create app"

### Passo 2: Configurar Produtos

1. **Na página do app, vá em:** "Products"
2. **Selecione:**
   - Advertising API
   - Marketing Developer Platform

3. **Clique em:** "Request access" para cada um

### Passo 3: Obter Credenciais

1. **Vá em:** "Auth" tab
2. **Você verá:**
   - Client ID
   - Client Secret (clique em "Show" para ver)

3. **Adicione no `.env`:**
   ```env
   VITE_LINKEDIN_CLIENT_ID=seu-client-id
   VITE_OAUTH_CLIENT_SECRET=sua-secret-aqui
   ```

### Passo 4: Configurar Redirect URLs

1. **Ainda na aba "Auth", em "Redirect URLs", adicione:**
   ```
   http://localhost:5173/integrations/callback
   https://seu-dominio.com/integrations/callback
   ```

2. **Clique em:** "Update"

---

## 🐦 4. Twitter/X Ads

### Passo 1: Criar App

1. **Acesse:** https://developer.twitter.com/en/portal/dashboard
2. **Clique em:** "Create App"
3. **Preencha:**
   - App name: SyncAds
   - Description: Marketing automation platform
   - Website URL: https://seu-site.com

### Passo 2: Configurar OAuth 2.0

1. **Na dashboard do app, vá em:** "Keys and tokens"
2. **Em "OAuth 2.0 Client ID and Secret":**
   - Copie o Client ID
   - Gere e copie o Client Secret

3. **Adicione no `.env`:**
   ```env
   VITE_TWITTER_CLIENT_ID=seu-client-id
   VITE_OAUTH_CLIENT_SECRET=sua-secret-aqui
   ```

### Passo 3: Configurar Callback URL

1. **Vá em:** "Settings" → "Authentication settings"
2. **Em "Callback URLs", adicione:**
   ```
   http://localhost:5173/integrations/callback
   https://seu-dominio.com/integrations/callback
   ```

3. **Em "Website URL", adicione:**
   ```
   http://localhost:5173
   ```

---

## 🎵 5. TikTok Ads

### Passo 1: Criar App

1. **Acesse:** https://ads.tiktok.com/marketing_api/apps
2. **Clique em:** "Create an app"
3. **Preencha:**
   - App name: SyncAds
   - Use case: Marketing automation

### Passo 2: Configurar

1. **Configure o callback URL:**
   ```
   http://localhost:5173/integrations/callback
   ```

2. **Selecione as permissões:**
   - Ad Account Management
   - Campaign Management
   - Reporting

### Passo 3: Obter Credenciais

1. **Após aprovação, você receberá:**
   - App ID (Client ID)
   - App Secret

2. **Adicione no `.env`:**
   ```env
   VITE_TIKTOK_CLIENT_ID=seu-app-id
   VITE_OAUTH_CLIENT_SECRET=sua-secret-aqui
   ```

---

## 📝 Arquivo .env Final

Após configurar todas as plataformas, seu `.env` deve estar assim:

```env
# Supabase
VITE_SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-aqui

# OAuth - Meta (Facebook + Instagram)
VITE_META_CLIENT_ID=123456789012345
VITE_OAUTH_CLIENT_SECRET=abc123def456ghi789

# OAuth - Google (Ads + Analytics)
VITE_GOOGLE_CLIENT_ID=123456789012-abcdefghijklmnop.apps.googleusercontent.com

# OAuth - LinkedIn
VITE_LINKEDIN_CLIENT_ID=abcdef1234567890

# OAuth - Twitter/X
VITE_TWITTER_CLIENT_ID=xyz789abc123

# OAuth - TikTok
VITE_TIKTOK_CLIENT_ID=tt123456789
```

**⚠️ IMPORTANTE:** 
- Nunca commite o `.env` no Git
- Use `.env.example` como template
- Mantenha as secrets seguras

---

## 🧪 Como Testar

### Teste 1: Verificar Variáveis
```bash
npm run dev
# Abra o console e digite:
console.log(import.meta.env.VITE_META_CLIENT_ID)
# Deve mostrar seu Client ID
```

### Teste 2: Testar OAuth no Chat
1. Faça login no SyncAds
2. Vá para o Chat
3. Digite: "Conecte o Facebook Ads"
4. A IA deve gerar um link de autorização
5. Clique no link e autorize
6. ✅ Sucesso!

---

## ❓ Problemas Comuns

### "Client ID não configurado"
**Solução:**
- Verifique se o `.env` está na raiz do projeto
- Confirme que as variáveis começam com `VITE_`
- Reinicie o servidor: `Ctrl+C` e `npm run dev`

### "Redirect URI mismatch"
**Solução:**
- Verifique se adicionou `http://localhost:5173/integrations/callback`
- Confira se não tem espaços ou caracteres extras
- Aguarde alguns minutos para propagar

### "Access denied" ao autorizar
**Solução:**
- Adicione seu email como "Teste User" na plataforma
- Verifique se solicitou as permissões corretas
- Confirme que o app está em modo de desenvolvimento

### "Token exchange failed"
**Solução:**
- Verifique se o Client Secret está correto
- Confirme que está usando HTTPS em produção
- Verifique os logs do console

---

## 🔒 Segurança

### Boas Práticas

✅ **FAÇA:**
- Use `.env` para variáveis de ambiente
- Adicione `.env` no `.gitignore`
- Use HTTPS em produção
- Rotacione secrets regularmente
- Implemente rate limiting

❌ **NÃO FAÇA:**
- Commitar secrets no Git
- Compartilhar Client Secrets publicamente
- Usar mesmas credenciais em dev e prod
- Expor secrets no frontend
- Logar tokens no console (em produção)

---

## 📊 Status de Configuração

Use este checklist para acompanhar:

### Obrigatórias
- [ ] Meta Ads (Facebook + Instagram)
- [ ] Google Ads
- [ ] LinkedIn Ads

### Opcionais
- [ ] Twitter Ads
- [ ] TikTok Ads
- [ ] Google Analytics

---

## 🚀 Próximos Passos

Após configurar OAuth:

1. ✅ Testar cada integração no Chat
2. ✅ Verificar se os tokens estão sendo salvos
3. ✅ Implementar sincronização automática de métricas
4. ✅ Criar dashboard de integrações
5. ✅ Deploy em produção

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [Google Ads API](https://developers.google.com/google-ads/api/docs/start)
- [LinkedIn Marketing APIs](https://docs.microsoft.com/en-us/linkedin/marketing/)
- [Twitter Ads API](https://developer.twitter.com/en/docs/twitter-ads-api)
- [TikTok Marketing API](https://ads.tiktok.com/marketing_api/docs)

### Vídeos Tutorial
- "Setting up Facebook Ads API" - Meta for Developers
- "Google Ads API Quickstart" - Google Developers

---

## 💡 Dicas Pro

1. **Use o mesmo Client Secret** para todas as integrações (simplifica)
2. **Configure em modo sandbox** primeiro
3. **Teste com dados reais** só após validar em sandbox
4. **Monitore os limites de API** (rate limits)
5. **Implemente refresh token automático**

---

**✅ TUDO CONFIGURADO?**

Agora você pode conectar todas as integrações via IA no chat! 🎉

Digite: *"Conecte o Facebook Ads"* e siga o link gerado.

**Dúvidas?** Abra uma issue no GitHub ou consulte a documentação oficial.

---

**Desenvolvido com 🔐 - SyncAds Integration Team**
