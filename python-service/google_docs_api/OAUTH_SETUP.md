# Google OAuth Test Mode - Setup Rápido (SEM verificação)

## 🎯 Vantagem: Funciona HOJE (sem esperar dias)

Google OAuth tem **Test Mode** que permite até 100 usuários SEM verificar domínio.

---

## 📋 Passo-a-Passo

### 1. Criar Projeto Google Cloud
1. Acesse: https://console.cloud.google.com
2. Clique "Select a project" → "New Project"
3. Nome: `SyncAds Extension`
4. Clique "Create"

### 2. Habilitar Google Docs API
1. No menu lateral: "APIs & Services" → "Library"
2. Buscar: "Google Docs API"
3. Clique "Enable"

### 3. Criar OAuth 2.0 Credentials
1. "APIs & Services" → "Credentials"
2. Clique "Create Credentials" → "OAuth client ID"
3. Se aparecer aviso sobre OAuth consent screen:
   - Clique "Configure Consent Screen"
   - Escolha **"External"**
   - Clique "Create"
   
4. OAuth Consent Screen:
   - App name: `SyncAds Extension`
   - User support email: seu email
   - Developer contact: seu email
   - Clique "Save and Continue"
   
5. **IMPORTANTE - Test Mode**:
   - Em "Publishing status" → deixar em **"Testing"**
   - NÃO clique em "Publish App" (ficaria pendente verificação)
   - Adicione seu email em "Test users" → "Add Users"
   - Clique "Save"

6. Voltar para "Credentials" → "Create Credentials" → "OAuth client ID"
   - Application type: **"Web application"**
   - Name: `SyncAds Web Client`
   - **Authorized redirect URIs**: 
     - `http://localhost:8000/oauth/callback`
     - `https://YOUR_HF_SPACE.hf.space/oauth/callback`
   - Clique "Create"

7. **BAIXAR CREDENTIALS**:
   - Aparecerá popup com Client ID e Secret
   - Clique "Download JSON"
   - Salvar como `credentials.json`

### 4. Configurar Scopes
1. OAuth Consent Screen → "Edit App"
2. "Scopes" → "Add or Remove Scopes"
3. Adicionar:
   - `https://www.googleapis.com/auth/documents`
   - `https://www.googleapis.com/auth/drive.file`
4. Clique "Update"

---

## ✅ Pronto!

Agora você tem OAuth **funcionando imediatamente** em Test Mode:
- ✅ Sem verificação de domínio
- ✅ Funciona para você e até 99 outros usuários
- ✅ Mostra tela "não verificado" mas **FUNCIONA**

Para produção futura:
- Clique "Publish App" quando tiver 100+ usuários
- Aí sim precisa verificação (mas app já funciona)

---

## 📂 Próximo Passo

Colocar `credentials.json` no projeto:
```bash
# Copiar arquivo baixado
cp ~/Downloads/credentials.json python-service/google_docs_api/
```

**NUNCA** commit credentials no git!
