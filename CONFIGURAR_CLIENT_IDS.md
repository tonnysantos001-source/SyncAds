# 🔑 Guia Rápido: Configurar Client IDs do SyncAds

**Tempo total:** 2-3 horas (30 min por plataforma)  
**Dificuldade:** Médio ⭐⭐  
**Obrigatório para:** Sistema funcionar end-to-end

---

## 🎯 O Que Você Vai Fazer

Criar aplicações OAuth **em nome do SyncAds** nas plataformas de anúncios.

**Importante:** Você fará isso **UMA VEZ**. Depois, **TODOS** os seus usuários usarão essas credenciais automaticamente.

---

## 📘 1. Facebook Ads (PRIORIDADE MÁXIMA)

### Passo 1: Criar App

1. **Acesse:** https://developers.facebook.com/apps
2. **Faça login** com sua conta Facebook
3. **Clique em:** "Criar App" (botão verde)

4. **Escolha:**
   - Tipo: **Empresa**
   - Nome do app: **SyncAds**
   - Email: seu@email.com

5. **Clique em:** "Criar App"

### Passo 2: Adicionar Marketing API

1. **Na dashboard do app, role até:**
   ```
   Adicionar produtos
   ```

2. **Localize:** "Marketing API"
3. **Clique em:** "Configurar"

### Passo 3: Obter Client ID

1. **Menu lateral:** Configurações → Básico

2. **Você verá:**
   ```
   ID do App:     1234567890123456  ← COPIE ESTE
   Chave Secreta: ************     ← Guarde em local seguro
   ```

3. **Copie o ID do App**

### Passo 4: Configurar Redirect URIs

1. **Ainda em Configurações → Básico**
2. **Role até:** "URIs de Redirecionamento do OAuth Válidos"
3. **Adicione (linha por linha):**
   ```
   http://localhost:5173/integrations/callback
   https://seu-dominio.com/integrations/callback
   ```
4. **Clique em:** "Salvar Alterações"

### Passo 5: Colar no Código

1. **Abra:** `src/lib/integrations/oauthConfig.ts`

2. **Encontre:**
   ```typescript
   facebook_ads: {
     clientId: '1234567890123456', // ← SUBSTITUA AQUI
     ...
   },
   ```

3. **Substitua** pelo ID que você copiou:
   ```typescript
   facebook_ads: {
     clientId: 'SEU_ID_REAL_AQUI',
     ...
   },
   ```

4. **Salve o arquivo**

✅ **Facebook configurado!**

---

## 🔍 2. Google Ads

### Passo 1: Criar Projeto

1. **Acesse:** https://console.cloud.google.com
2. **Faça login** com sua conta Google
3. **Clique em:** "Selecionar projeto" → "Novo Projeto"
4. **Preencha:**
   - Nome: **SyncAds**
5. **Clique em:** "Criar"

### Passo 2: Habilitar APIs

1. **Menu lateral:** APIs e Serviços → Biblioteca
2. **Pesquise:** "Google Ads API"
3. **Clique em:** "Ativar"

### Passo 3: Configurar OAuth

1. **Vá em:** APIs e Serviços → Tela de consentimento OAuth
2. **Escolha:** Externo
3. **Preencha:**
   - Nome do app: SyncAds
   - Email de suporte: seu@email.com
   - Email do desenvolvedor: seu@email.com
4. **Clique em:** "Salvar e continuar"

### Passo 4: Criar Credenciais

1. **Vá em:** APIs e Serviços → Credenciais
2. **Clique em:** "Criar Credenciais" → "ID do cliente OAuth 2.0"
3. **Tipo:** Aplicativo da Web
4. **Nome:** SyncAds Web Client
5. **URIs de redirecionamento autorizados:**
   ```
   http://localhost:5173/integrations/callback
   https://seu-dominio.com/integrations/callback
   ```
6. **Clique em:** "Criar"

### Passo 5: Copiar Credenciais

1. **Modal abrirá mostrando:**
   ```
   ID do cliente: 123456-abcdef.apps.googleusercontent.com
   Chave secreta: ABC123xyz789
   ```

2. **Copie o ID do cliente**

### Passo 6: Colar no Código

1. **Abra:** `src/lib/integrations/oauthConfig.ts`

2. **Encontre:**
   ```typescript
   google_ads: {
     clientId: '123456-abcdef.apps.googleusercontent.com',
     ...
   },
   ```

3. **Substitua** pelo ID real

✅ **Google configurado!**

---

## 💼 3. LinkedIn Ads

### Passo 1: Criar App

1. **Acesse:** https://www.linkedin.com/developers/apps
2. **Clique em:** "Create app"
3. **Preencha:**
   - App name: SyncAds
   - LinkedIn Page: (sua página empresarial)
   - App logo: (faça upload)
   - Privacy policy: https://seu-site.com/privacy

### Passo 2: Configurar Produtos

1. **Aba "Products"**
2. **Selecione:** Marketing Developer Platform
3. **Clique em:** "Request access"

### Passo 3: Obter Credenciais

1. **Aba "Auth"**
2. **Copie:**
   ```
   Client ID: abc123def456
   ```

3. **Em "Redirect URLs", adicione:**
   ```
   http://localhost:5173/integrations/callback
   https://seu-dominio.com/integrations/callback
   ```

### Passo 4: Colar no Código

```typescript
linkedin_ads: {
  clientId: 'SEU_LINKEDIN_CLIENT_ID',
  ...
},
```

✅ **LinkedIn configurado!**

---

## 📋 Checklist de Configuração

Marque conforme for completando:

### Obrigatórias (Prioridade Alta)
- [ ] Facebook Ads - Client ID configurado
- [ ] Google Ads - Client ID configurado
- [ ] LinkedIn Ads - Client ID configurado

### Opcionais (Prioridade Baixa)
- [ ] Twitter Ads - Client ID configurado
- [ ] TikTok Ads - Client ID configurado

---

## 🔐 Client Secrets - IMPORTANTE!

### Onde Guardar:

**❌ NÃO FAÇA:**
- Adicionar no código frontend
- Commitar no Git
- Compartilhar publicamente

**✅ FAÇA:**
- Salve em gerenciador de senhas (1Password, LastPass)
- Use variáveis de ambiente no backend
- Documente em local seguro

### Arquivo Sugerido: `.env.secrets` (NÃO COMMITAR)

```env
# Client Secrets (NUNCA COMMITAR ESTE ARQUIVO)
FACEBOOK_CLIENT_SECRET=abc123xyz789
GOOGLE_CLIENT_SECRET=def456uvw012
LINKEDIN_CLIENT_SECRET=ghi789rst345
```

**Adicione ao `.gitignore`:**
```
.env.secrets
```

---

## 🧪 Como Testar

Após configurar os Client IDs:

### Teste 1: URLs Geradas

1. **Abra o console do navegador**
2. **Execute:**
   ```javascript
   import { generateOAuthUrl } from './src/lib/integrations/oauthConfig';
   const url = generateOAuthUrl('facebook_ads', 'test-user');
   console.log(url);
   ```

3. **Verifique se URL contém:**
   ```
   https://www.facebook.com/v18.0/dialog/oauth?
     client_id=SEU_CLIENT_ID_REAL  ← Deve estar aqui
     redirect_uri=...
     scope=...
   ```

✅ Se aparecer o Client ID real = **FUNCIONANDO!**

---

### Teste 2: Fluxo Completo (Após Backend)

1. **No chat, digite:** "Conecte o Facebook Ads"
2. **Clique em:** "Connect Facebook"
3. **Popup abre**
4. **Faça login no Facebook**
5. **Autorize o SyncAds**
6. **Popup fecha**
7. ✅ **Integração conectada!**

---

## ⏱️ Quanto Tempo Leva?

| Plataforma | Tempo | Dificuldade |
|------------|-------|-------------|
| Facebook Ads | 30 min | ⭐⭐ Médio |
| Google Ads | 30 min | ⭐⭐⭐ Difícil |
| LinkedIn Ads | 20 min | ⭐⭐ Médio |
| Twitter Ads | 15 min | ⭐ Fácil |
| TikTok Ads | 20 min | ⭐⭐ Médio |

**Total:** ~2h para configurar tudo

---

## ❓ Problemas Comuns

### "App está em modo de desenvolvimento"

**Solução:** Isso é normal! Você pode:
- Testar com sua própria conta
- Adicionar "Test Users" na plataforma
- Publicar o app depois (requer aprovação)

### "Redirect URI mismatch"

**Solução:**
- Verifique se adicionou `http://localhost:5173/integrations/callback`
- Confirme que não tem espaços ou caracteres extras
- Aguarde alguns minutos para propagar

### "Invalid Client ID"

**Solução:**
- Confirme que copiou o ID completo
- Verifique se não tem espaços antes/depois
- Certifique-se que salvou o arquivo

---

## 🎯 Próximo Passo: Backend

Depois de configurar os Client IDs, você precisará:

1. **Criar Edge Function** para trocar tokens
2. **Usar Client Secrets** no backend
3. **Testar fluxo completo**

📖 **Ver:** Seção "Backend para Trocar Tokens" em `OAUTH_SIMPLIFICADO.md`

---

## ✅ Checklist Final

Antes de considerar configuração completa:

- [ ] Client IDs configurados no código
- [ ] Client Secrets salvos em local seguro
- [ ] Redirect URIs adicionados nas plataformas
- [ ] Testado geração de URLs
- [ ] Arquivo salvo e commitado (exceto secrets)

---

**🎉 Parabéns!** Seus usuários agora podem conectar integrações com **1 clique**!

---

**Dúvidas?** Consulte:
- `OAUTH_SIMPLIFICADO.md` - Visão geral completa
- `OAUTH_SETUP.md` - Guia detalhado passo a passo
- https://developers.facebook.com - Docs oficiais

---

**Desenvolvido com 🔑 - SyncAds Configuration Team**
