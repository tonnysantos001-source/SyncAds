# 🚀 GUIA DE DEPLOYMENT - SyncAds Extension v4.0

**Versão:** 4.0.0  
**Data:** Janeiro 2025  
**Última atualização:** 2025-01-XX

---

## 📋 ÍNDICE

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial](#configuração-inicial)
3. [Testes Locais](#testes-locais)
4. [Deploy da Extensão Chrome](#deploy-da-extensão-chrome)
5. [Configuração Supabase](#configuração-supabase)
6. [Deploy Edge Functions](#deploy-edge-functions)
7. [Validação Pós-Deploy](#validação-pós-deploy)
8. [Troubleshooting](#troubleshooting)
9. [Rollback](#rollback)

---

## 🔧 PRÉ-REQUISITOS

### Software Necessário

- **Google Chrome** versão 88+
- **Node.js** versão 18+
- **npm** ou **yarn**
- **Supabase CLI** (para Edge Functions)
- **Git**
- Conta no **Chrome Web Store Developer** ($5 taxa única)
- Acesso ao **Supabase Dashboard**

### Verificar Instalações

```bash
# Verificar Node.js
node --version
# Deve retornar: v18.x.x ou superior

# Verificar npm
npm --version
# Deve retornar: 9.x.x ou superior

# Verificar Supabase CLI
supabase --version
# Deve retornar: 1.x.x ou superior

# Instalar Supabase CLI (se necessário)
npm install -g supabase
```

---

## ⚙️ CONFIGURAÇÃO INICIAL

### 1. Clonar Repositório

```bash
cd ~/Documents/GitHub
git clone https://github.com/seu-usuario/SyncAds.git
cd SyncAds
```

### 2. Instalar Dependências

```bash
# Instalar dependências do projeto principal
npm install

# Instalar dependências de teste (opcional)
cd chrome-extension
npm install --save-dev jest
```

### 3. Configurar Variáveis de Ambiente

Crie arquivo `.env` na raiz do projeto:

```bash
# .env
SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Validar Arquivos da Extensão

```bash
cd chrome-extension

# Verificar arquivos essenciais
ls -la

# Deve conter:
# ✓ manifest.json
# ✓ background.js
# ✓ content-script.js
# ✓ popup.html
# ✓ popup.js
# ✓ icons/
```

### 5. Atualizar manifest.json

Verifique se as configurações estão corretas:

```json
{
  "manifest_version": 3,
  "name": "SyncAds AI Automation",
  "version": "4.0.0",
  "description": "Automação inteligente com IA para marketing digital",
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "scripting",
    "webRequest",
    "webNavigation",
    "cookies"
  ],
  "host_permissions": ["https://*/*", "http://*/*"],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "run_at": "document_idle",
      "all_frames": false
    }
  ]
}
```

---

## 🧪 TESTES LOCAIS

### 1. Carregar Extensão no Chrome

```bash
# 1. Abrir Chrome
# 2. Navegar para: chrome://extensions/
# 3. Ativar "Modo do desenvolvedor" (canto superior direito)
# 4. Clicar em "Carregar sem compactação"
# 5. Selecionar pasta: chrome-extension/
```

### 2. Verificar Console do Background

```bash
# 1. Em chrome://extensions/
# 2. Encontrar "SyncAds AI Automation"
# 3. Clicar em "service worker"
# 4. Verificar logs:

# ✅ Esperado:
# "🚀 SyncAds Extension v4.0 - Background Service Worker Initializing..."
# "✅ [SUCCESS] Background service worker initialized"
# "ℹ️ [INFO] Device ID generated: device_xxx"
```

### 3. Testar Detecção de Token

```bash
# 1. Abrir https://syncads.com.br/app
# 2. Fazer login
# 3. Abrir DevTools (F12) → Console
# 4. Verificar logs:

# ✅ Esperado:
# "🚀 SyncAds Content Script v4.0 - Initializing..."
# "ℹ️ [ContentScript] Valid token detected! Sending to background..."
# "✅ [ContentScript] Extension connected successfully!"
```

### 4. Executar Script de Validação

```bash
# 1. Abrir https://syncads.com.br/app (logado)
# 2. Abrir DevTools (F12) → Console
# 3. Copiar e colar conteúdo de: chrome-extension/test-validacao.js
# 4. Pressionar Enter
# 5. Aguardar resultados:

# ✅ Esperado: 10/10 testes passando (100%)
```

### 5. Executar Suite de Testes (Opcional)

```bash
cd chrome-extension
npm test

# ✅ Esperado: 29 tests passing
```

---

## 📦 DEPLOY DA EXTENSÃO CHROME

### 1. Preparar Build de Produção

```bash
cd chrome-extension

# Remover arquivos de desenvolvimento
rm -rf tests/
rm test-validacao.js
rm RELATORIO_CORRECOES_V4.md
rm DEPLOYMENT_GUIDE.md

# Limpar logs de desenvolvimento
# Verificar se não há console.log excessivos em background.js e content-script.js
```

### 2. Atualizar Versão

Editar `manifest.json`:

```json
{
  "version": "4.0.0"
}
```

### 3. Criar Pacote ZIP

```bash
cd chrome-extension

# Criar ZIP (macOS/Linux)
zip -r syncads-extension-v4.0.0.zip . \
  -x "*.git*" \
  -x "node_modules/*" \
  -x "tests/*" \
  -x "*.md" \
  -x "*.log"

# Criar ZIP (Windows PowerShell)
Compress-Archive -Path * `
  -DestinationPath syncads-extension-v4.0.0.zip `
  -Force

# Verificar conteúdo do ZIP
unzip -l syncads-extension-v4.0.0.zip
```

### 4. Validar Pacote

```bash
# Estrutura esperada:
syncads-extension-v4.0.0.zip
├── manifest.json
├── background.js
├── content-script.js
├── popup.html
├── popup.js
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
```

### 5. Upload para Chrome Web Store

#### Primeira vez:

1. Acesse: https://chrome.google.com/webstore/devconsole
2. Clique em "New Item"
3. Faça upload do ZIP
4. Preencha informações:
   - **Nome:** SyncAds AI Automation
   - **Descrição:** Automação inteligente com IA para marketing digital
   - **Categoria:** Productivity
   - **Idioma:** Portuguese (Brazil)

5. Adicionar screenshots (1280x800):
   - Screenshot 1: Dashboard da extensão
   - Screenshot 2: Extensão conectada
   - Screenshot 3: Notificação de sucesso

6. Adicionar ícone promocional (440x280)
7. Selecionar visibilidade: **Unlisted** ou **Public**
8. Clicar em "Submit for Review"

#### Atualização de versão existente:

1. Acesse: https://chrome.google.com/webstore/devconsole
2. Selecione "SyncAds AI Automation"
3. Clique em "Package" → "Upload new package"
4. Faça upload do novo ZIP
5. Atualize changelog:
   ```
   Version 4.0.0 - Janeiro 2025
   
   ✅ Correções Críticas:
   - Comunicação estável entre content script e background
   - Validação robusta de tokens JWT
   - Refresh automático de tokens
   - Eliminação de race conditions
   - Keep-alive do Service Worker
   - Retry logic com exponential backoff
   
   ✅ Melhorias:
   - Logs estruturados
   - Detecção inteligente de tokens
   - UI/UX aprimorada
   - 29 testes automatizados
   ```

6. Clicar em "Submit for Review"

#### Tempo de Aprovação:
- Primeira submissão: 2-7 dias
- Atualização: 1-3 dias

---

## 🗄️ CONFIGURAÇÃO SUPABASE

### 1. Verificar Tabelas Necessárias

```sql
-- Conectar ao Supabase Dashboard → SQL Editor
-- Executar verificação:

SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('extension_devices', 'extension_logs');

-- ✅ Esperado: 2 tabelas retornadas
```

### 2. Criar Tabelas (se necessário)

```sql
-- Tabela: extension_devices
CREATE TABLE IF NOT EXISTS public.extension_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_info JSONB,
  version TEXT,
  status TEXT DEFAULT 'offline',
  last_seen TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_extension_devices_user_id ON public.extension_devices(user_id);
CREATE INDEX idx_extension_devices_device_id ON public.extension_devices(device_id);
CREATE INDEX idx_extension_devices_status ON public.extension_devices(status);

-- RLS (Row Level Security)
ALTER TABLE public.extension_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own devices"
  ON public.extension_devices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all devices"
  ON public.extension_devices
  FOR ALL
  USING (auth.role() = 'service_role');
```

```sql
-- Tabela: extension_logs
CREATE TABLE IF NOT EXISTS public.extension_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_extension_logs_device_id ON public.extension_logs(device_id);
CREATE INDEX idx_extension_logs_user_id ON public.extension_logs(user_id);
CREATE INDEX idx_extension_logs_level ON public.extension_logs(level);
CREATE INDEX idx_extension_logs_timestamp ON public.extension_logs(timestamp DESC);

-- RLS
ALTER TABLE public.extension_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own logs"
  ON public.extension_logs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all logs"
  ON public.extension_logs
  FOR ALL
  USING (auth.role() = 'service_role');
```

### 3. Verificar RLS

```sql
-- Testar RLS
SELECT * FROM public.extension_devices LIMIT 1;
SELECT * FROM public.extension_logs LIMIT 1;

-- ✅ Esperado: Sem erros de permissão
```

---

## 🚀 DEPLOY EDGE FUNCTIONS

### 1. Instalar Supabase CLI

```bash
npm install -g supabase

# Verificar instalação
supabase --version
```

### 2. Login no Supabase

```bash
supabase login

# Seguir instruções no browser
# Copiar access token
```

### 3. Link ao Projeto

```bash
cd ~/Documents/GitHub/SyncAds

supabase link --project-ref ovskepqggmxlfckxqgbr

# Confirmar projeto
```

### 4. Verificar Edge Function

```bash
# Listar Edge Functions existentes
supabase functions list

# Verificar arquivo
cat supabase/functions/extension-register/index.ts

# ✅ Deve conter código v4.0 com validação robusta
```

### 5. Deploy da Edge Function

```bash
# Deploy
supabase functions deploy extension-register

# ✅ Esperado:
# Deployed Function extension-register on project ovskepqggmxlfckxqgbr
# URL: https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/extension-register
```

### 6. Configurar Secrets

```bash
# Configurar variáveis de ambiente
supabase secrets set SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
supabase secrets set SUPABASE_ANON_KEY=your-anon-key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Listar secrets
supabase secrets list

# ✅ Esperado: 3 secrets configurados
```

### 7. Testar Edge Function

```bash
# Testar via curl
curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/extension-register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{
    "device_id": "test_device_123",
    "browser_info": {
      "userAgent": "Test",
      "platform": "Test",
      "language": "pt-BR"
    },
    "version": "4.0.0"
  }'

# ✅ Esperado: Status 200 ou 401 (se token inválido)
```

---

## ✅ VALIDAÇÃO PÓS-DEPLOY

### 1. Checklist de Validação

```
□ Extensão publicada na Chrome Web Store
□ Edge Function deployada e respondendo
□ Tabelas do Supabase criadas
□ RLS configurado corretamente
□ Secrets configurados na Edge Function
□ Testes locais passando (10/10)
□ Logs estruturados funcionando
□ Token refresh automático ativo
□ Badge da extensão atualizando
```

### 2. Teste End-to-End

```bash
# 1. Instalar extensão do Chrome Web Store
# 2. Abrir https://syncads.com.br/app
# 3. Fazer login
# 4. Verificar badge da extensão: "ON"
# 5. Abrir DevTools → Console
# 6. Verificar logs de sucesso
# 7. Aguardar 5 minutos
# 8. Verificar se token foi refreshado automaticamente
```

### 3. Monitoramento de Logs

```bash
# Supabase Dashboard → Edge Functions → extension-register → Logs

# ✅ Buscar por:
# "[SUCCESS] Token validated successfully"
# "[SUCCESS] Device registered via Edge Function"
# "[SUCCESS] Registration completed"
```

### 4. Verificar Métricas

```sql
-- Supabase Dashboard → SQL Editor

-- Contar devices ativos
SELECT COUNT(*) FROM public.extension_devices 
WHERE status = 'online';

-- Últimos registros
SELECT * FROM public.extension_devices 
ORDER BY last_seen DESC 
LIMIT 10;

-- Logs de erro (últimas 24h)
SELECT * FROM public.extension_logs 
WHERE level = 'error' 
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

---

## 🔧 TROUBLESHOOTING

### Problema 1: "Extension context invalidated"

**Causa:** Service Worker foi reiniciado pelo Chrome  
**Solução:**
```bash
# Recarregar extensão
# chrome://extensions/ → Reload
```

### Problema 2: "Invalid token" na Edge Function

**Causa:** Token expirado ou inválido  
**Solução:**
```bash
# 1. Fazer LOGOUT do SaaS
# 2. Fazer LOGIN novamente
# 3. Token novo será detectado automaticamente
```

### Problema 3: Edge Function retorna 500

**Causa:** Tabelas não existem ou secrets não configurados  
**Solução:**
```bash
# Verificar tabelas
SELECT * FROM public.extension_devices LIMIT 1;

# Reconfigurar secrets
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...
```

### Problema 4: Token não detectado

**Causa:** Content script não está rodando  
**Solução:**
```bash
# Verificar manifest.json → content_scripts
# Recarregar página do SaaS
# Verificar console por erros
```

### Problema 5: Badge não atualiza

**Causa:** Background não está recebendo mensagens  
**Solução:**
```bash
# Verificar Service Worker ativo
# chrome://extensions/ → service worker → Console
# Procurar por erros
```

---

## ⏮️ ROLLBACK

### Reverter para Versão Anterior

#### Chrome Web Store:

1. Acesse: https://chrome.google.com/webstore/devconsole
2. Selecione extensão
3. Clique em "Package" → "Previous versions"
4. Selecione versão anterior
5. Clique em "Restore"

#### Edge Function:

```bash
# Reverter para commit anterior
cd ~/Documents/GitHub/SyncAds
git log --oneline supabase/functions/extension-register/index.ts

# Checkout do commit anterior
git checkout <commit-hash> supabase/functions/extension-register/index.ts

# Re-deploy
supabase functions deploy extension-register
```

#### Supabase Tabelas:

```sql
-- Fazer backup antes de reverter
CREATE TABLE extension_devices_backup AS 
SELECT * FROM extension_devices;

CREATE TABLE extension_logs_backup AS 
SELECT * FROM extension_logs;

-- Reverter schema se necessário
-- (executar SQL de versão anterior)
```

---

## 📞 SUPORTE

### Documentação
- Código fonte: `./chrome-extension/`
- Testes: `./chrome-extension/tests/`
- Edge Functions: `./supabase/functions/extension-register/`

### Logs de Debug
- **Background:** Chrome DevTools → Extensions → Service Worker
- **Content:** Chrome DevTools → Console (F12)
- **Edge Function:** Supabase Dashboard → Functions → Logs

### Contato
Para questões técnicas:
1. Verificar logs estruturados
2. Consultar `RELATORIO_CORRECOES_V4.md`
3. Executar `test-validacao.js`

---

## 📊 CHECKLIST FINAL DE DEPLOYMENT

```
✅ PRÉ-DEPLOY
  □ Código revisado e testado
  □ Versão atualizada no manifest.json
  □ Testes automatizados passando (29/29)
  □ Validação local completa (10/10)
  □ Documentação atualizada

✅ SUPABASE
  □ Tabelas criadas
  □ RLS configurado
  □ Edge Function deployada
  □ Secrets configurados
  □ Logs verificados

✅ CHROME WEB STORE
  □ Pacote ZIP criado
  □ Upload realizado
  □ Screenshots adicionadas
  □ Changelog atualizado
  □ Submetido para revisão

✅ PÓS-DEPLOY
  □ Instalação teste realizada
  □ Fluxo end-to-end validado
  □ Métricas monitoradas
  □ Rollback plan documentado
  □ Equipe notificada

✅ MONITORAMENTO (PRIMEIRA SEMANA)
  □ Verificar logs de erro diariamente
  □ Monitorar taxa de conexão
  □ Coletar feedback de usuários
  □ Verificar métricas de performance
```

---

**🎉 Deployment concluído com sucesso!**

A extensão SyncAds v4.0 está agora em produção, com todas as correções críticas implementadas e validadas.

**Status:** ✅ PRONTO PARA USO

---

**Documento criado em:** Janeiro 2025  
**Versão do documento:** 1.0  
**Próxima revisão:** Fevereiro 2025