# 🔧 DIAGNÓSTICO E CORREÇÃO - EXTENSÃO SYNCADS

## 📋 PROBLEMAS IDENTIFICADOS

### 1. ❌ Tabelas do Supabase não criadas
- `extension_devices`
- `extension_commands`
- `extension_logs`

### 2. ❌ Backend Railway retornando 500
- Supabase não configurado corretamente
- Variáveis de ambiente ausentes

### 3. ❌ Fluxo de autenticação não sincronizado
- Content script detecta login mas não conecta
- Background não recebe o userId corretamente

### 4. ❌ CORS e URL da API
- URL hardcoded no background.js
- Falta configuração de CORS no Railway

---

## 🚀 CORREÇÃO PASSO A PASSO

### PASSO 1: Criar Tabelas no Supabase

```sql
-- ==========================================
-- SYNCADS EXTENSION - DATABASE SCHEMA
-- Execute no SQL Editor do Supabase
-- ==========================================

-- TABELA 1: EXTENSION_DEVICES
CREATE TABLE IF NOT EXISTS extension_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  browser_info JSONB,
  version TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'error')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extension_devices_user_id ON extension_devices(user_id);
CREATE INDEX idx_extension_devices_device_id ON extension_devices(device_id);
CREATE INDEX idx_extension_devices_status ON extension_devices(status);

ALTER TABLE extension_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on devices"
  ON extension_devices FOR ALL
  USING (true)
  WITH CHECK (true);

-- TABELA 2: EXTENSION_COMMANDS
CREATE TABLE IF NOT EXISTS extension_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER DEFAULT 5,
  result JSONB,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_extension_commands_device_id ON extension_commands(device_id);
CREATE INDEX idx_extension_commands_user_id ON extension_commands(user_id);
CREATE INDEX idx_extension_commands_status ON extension_commands(status);
CREATE INDEX idx_extension_commands_pending ON extension_commands(device_id, status, priority DESC)
  WHERE status = 'pending';

ALTER TABLE extension_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on commands"
  ON extension_commands FOR ALL
  USING (true)
  WITH CHECK (true);

-- TABELA 3: EXTENSION_LOGS
CREATE TABLE IF NOT EXISTS extension_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warn', 'error')),
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_extension_logs_device_id ON extension_logs(device_id);
CREATE INDEX idx_extension_logs_user_id ON extension_logs(user_id);
CREATE INDEX idx_extension_logs_level ON extension_logs(level);
CREATE INDEX idx_extension_logs_created_at ON extension_logs(created_at DESC);

ALTER TABLE extension_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on logs"
  ON extension_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- TRIGGERS
CREATE OR REPLACE FUNCTION update_extension_devices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_extension_devices_updated_at
  BEFORE UPDATE ON extension_devices
  FOR EACH ROW
  EXECUTE FUNCTION update_extension_devices_updated_at();

-- VERIFICAÇÃO
DO $$
BEGIN
  RAISE NOTICE '✅ Tabelas criadas com sucesso!';
  RAISE NOTICE '  ✓ extension_devices';
  RAISE NOTICE '  ✓ extension_commands';
  RAISE NOTICE '  ✓ extension_logs';
END $$;
```

### PASSO 2: Configurar Railway

**Variáveis de ambiente necessárias:**

```bash
# No Railway Dashboard -> Variables
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...sua-key-aqui
SUPABASE_ANON_KEY=eyJhbGc...sua-anon-key-aqui
ANTHROPIC_API_KEY=sk-ant-api03-...sua-key-aqui
OPENAI_API_KEY=sk-...sua-key-aqui
GROQ_API_KEY=gsk_...sua-key-aqui
```

**Verificar no Railway CLI:**

```bash
# Login
railway login

# Listar variáveis
railway variables

# Adicionar variável (se necessário)
railway variables set SUPABASE_URL=https://seu-projeto.supabase.co
railway variables set SUPABASE_SERVICE_ROLE_KEY=sua-key-aqui
```

**Redeploy:**

```bash
# Na pasta python-service
cd python-service
railway up

# OU via commit
git add .
git commit -m "fix: corrigir configuração extensão"
git push
```

### PASSO 3: Atualizar Background.js

**Corrigir detecção de URL da API:**

```javascript
// No arquivo chrome-extension/background.js, linha 11-18
const CONFIG = {
  serverUrl: "https://syncads.com.br",
  apiUrl: process.env.NODE_ENV === 'production' 
    ? "https://syncads-python-microservice-production.up.railway.app"
    : "http://localhost:8000",
  pollInterval: 3000,
  reconnectDelay: 5000,
  version: "1.0.0",
  allowedDomains: ["syncads.com.br", "localhost"],
};
```

**Melhorar log de erros (linha 132-201):**

```javascript
async function connectToServer() {
  if (state.isConnected) {
    console.log("ℹ️ Already connected");
    return { success: true, alreadyConnected: true };
  }

  if (!state.userId) {
    console.log("⚠️ Cannot connect: No userId");
    return { success: false, error: "No userId" };
  }

  try {
    console.log("🔌 Connecting to server...");
    console.log("   API URL:", CONFIG.apiUrl);
    console.log("   Device ID:", state.deviceId);
    console.log("   User ID:", state.userId);

    const response = await fetch(`${CONFIG.apiUrl}/api/extension/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId: state.deviceId,
        userId: state.userId,
        browser: getBrowserInfo(),
        version: CONFIG.version,
        timestamp: Date.now(),
      }),
    });

    console.log("   Response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("   Error response:", errorText);
      throw new Error(`Registration failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("✅ Connected to server:", data);

    state.isConnected = true;
    state.stats.lastActivity = Date.now();

    await chrome.storage.local.set({
      isConnected: true,
      lastConnected: Date.now(),
    });

    updateBadge();
    startCommandPolling();

    chrome.runtime.sendMessage({
      type: "CONNECTION_STATUS",
      connected: true,
    }).catch(() => {});

    return { success: true, data };

  } catch (error) {
    console.error("❌ Connection error:", error);
    console.error("   Message:", error.message);
    console.error("   Stack:", error.stack);
    
    state.isConnected = false;
    await chrome.storage.local.set({ isConnected: false });
    updateBadge();

    // Tentar reconectar apenas se não for erro de configuração
    if (!error.message.includes("500")) {
      console.log(`🔄 Reconnecting in ${CONFIG.reconnectDelay / 1000}s...`);
      setTimeout(connectToServer, CONFIG.reconnectDelay);
    }

    return { success: false, error: error.message };
  }
}
```

### PASSO 4: Melhorar Content Script

**Adicionar verificação mais robusta (content-script.js linha 588-630):**

```javascript
function checkAuthState() {
  try {
    const keys = Object.keys(localStorage);
    
    // Padrões de chaves Supabase
    const patterns = [
      'sb-',
      'supabase.auth.token',
      'supabase-auth-token',
      '__supabase',
    ];

    for (const key of keys) {
      // Verificar se a chave corresponde a algum padrão
      const matchesPattern = patterns.some(pattern => key.includes(pattern));
      if (!matchesPattern) continue;

      try {
        const value = localStorage.getItem(key);
        if (!value) continue;

        const parsed = JSON.parse(value);
        
        // Buscar user em diferentes estruturas
        const user = parsed?.user 
                  || parsed?.currentUser 
                  || parsed?.data?.user
                  || parsed?.session?.user;

        if (user && user.id) {
          const currentState = JSON.stringify({
            id: user.id,
            email: user.email
          });

          if (currentState !== lastAuthState) {
            console.log("🔐 Login detectado:", {
              userId: user.id,
              email: user.email,
              source: key
            });

            chrome.runtime.sendMessage({
              type: "AUTO_LOGIN_DETECTED",
              userId: user.id,
              email: user.email || "",
              source: `localStorage-${key}`,
            }).then(response => {
              console.log("✅ Mensagem enviada ao background:", response);
            }).catch(error => {
              console.error("❌ Erro ao enviar mensagem:", error);
            });

            lastAuthState = currentState;
            return true;
          }
        }
      } catch (e) {
        // Não é JSON válido, continuar
        continue;
      }
    }
    
    return false;
  } catch (error) {
    console.error("❌ Erro ao verificar auth:", error);
    return false;
  }
}
```

### PASSO 5: Deploy da Extensão

**Método 1: Desenvolvimento (Modo de desenvolvedor)**

```bash
1. Abra chrome://extensions/
2. Ative "Modo de desenvolvedor"
3. Clique em "Carregar sem compactação"
4. Selecione a pasta: chrome-extension/
5. A extensão será carregada
```

**Método 2: Produção (Chrome Web Store)**

```bash
# Criar ZIP da extensão
cd chrome-extension
zip -r syncads-extension.zip . -x "*.git*" -x "node_modules/*" -x "README.md"

# Upload na Chrome Web Store Developer Dashboard
https://chrome.google.com/webstore/devconsole/
```

---

## 🧪 TESTES DE VERIFICAÇÃO

### Teste 1: Verificar Tabelas no Supabase

```sql
-- Execute no SQL Editor
SELECT 
  'extension_devices' as table_name,
  COUNT(*) as count
FROM extension_devices

UNION ALL

SELECT 
  'extension_commands',
  COUNT(*)
FROM extension_commands

UNION ALL

SELECT 
  'extension_logs',
  COUNT(*)
FROM extension_logs;
```

### Teste 2: Verificar Backend Railway

```bash
# Testar health check
curl https://syncads-python-microservice-production.up.railway.app/api/extension/health

# Deve retornar:
# {"status":"ok","service":"extension","timestamp":"2025-01-17T..."}
```

### Teste 3: Verificar Conexão da Extensão

```javascript
// Abra o Console do Background (chrome://extensions/ > Detalhes > "service worker")
// E execute:

// Ver estado atual
chrome.storage.local.get(['deviceId', 'userId', 'isConnected'], (result) => {
  console.log('Estado atual:', result);
});

// Forçar reconexão
chrome.runtime.sendMessage({type: 'RECONNECT'}, (response) => {
  console.log('Resposta:', response);
});
```

### Teste 4: Verificar Detecção de Login

```javascript
// No Console da página syncads.com.br (F12):

// Ver localStorage completo
console.log('LocalStorage:', Object.keys(localStorage));

// Ver chave Supabase específica
Object.keys(localStorage).forEach(key => {
  if (key.includes('sb-')) {
    console.log(key, localStorage.getItem(key).substring(0, 100) + '...');
  }
});
```

---

## 📊 CHECKLIST DE VALIDAÇÃO

### ✅ Supabase
- [ ] Tabelas criadas (extension_devices, extension_commands, extension_logs)
- [ ] Policies configuradas (service_role tem acesso total)
- [ ] Índices criados
- [ ] Triggers funcionando

### ✅ Railway
- [ ] Variáveis de ambiente configuradas
- [ ] SUPABASE_URL definida
- [ ] SUPABASE_SERVICE_ROLE_KEY definida
- [ ] Deploy realizado com sucesso
- [ ] Health check respondendo OK
- [ ] Endpoint /api/extension/register funcionando

### ✅ Extensão Chrome
- [ ] Manifest.json correto
- [ ] Permissões configuradas
- [ ] Background.js carregando sem erros
- [ ] Content-script.js injetando em todas as páginas
- [ ] Popup.html abrindo corretamente

### ✅ Fluxo de Autenticação
- [ ] Content script detecta login
- [ ] Mensagem enviada ao background
- [ ] Background recebe userId
- [ ] Conexão ao servidor iniciada
- [ ] Dispositivo registrado no Supabase
- [ ] Badge atualizado (verde)
- [ ] Popup mostra "Conectado"

---

## 🐛 DEBUGGING AVANÇADO

### Ver logs do Background

```bash
1. Abra chrome://extensions/
2. Encontre "SyncAds AI Automation"
3. Clique em "service worker" (ou "Inspecionar visualizações")
4. Console abrirá com os logs
```

### Ver logs do Content Script

```bash
1. Abra syncads.com.br
2. Pressione F12
3. Na aba Console, filtre por "SyncAds"
4. Veja logs de detecção de auth
```

### Ver dados no Supabase

```sql
-- Ver dispositivos registrados
SELECT 
  device_id,
  user_id,
  status,
  last_seen,
  version
FROM extension_devices
ORDER BY last_seen DESC;

-- Ver comandos pendentes
SELECT 
  id,
  device_id,
  type,
  status,
  created_at
FROM extension_commands
WHERE status = 'pending'
ORDER BY priority DESC, created_at ASC;

-- Ver logs recentes
SELECT 
  level,
  message,
  created_at
FROM extension_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Forçar reconexão manual

```javascript
// No Console do Background
(async () => {
  // Limpar estado
  await chrome.storage.local.clear();
  
  // Definir userId manualmente (use seu UUID real)
  const userId = '267cec04-2d3b-451f-9971-d3b6b5a43ab5';
  await chrome.storage.local.set({ 
    userId: userId,
    deviceId: 'dev-' + Date.now()
  });
  
  // Reconectar
  chrome.runtime.sendMessage({type: 'RECONNECT'});
})();
```

---

## 🚀 DEPLOY AUTOMATIZADO

### Script completo de deploy

```bash
#!/bin/bash

echo "🚀 Deploy SyncAds Extension System"
echo "===================================="

# 1. Criar tabelas no Supabase
echo "📊 Criando tabelas no Supabase..."
# Execute o SQL manualmente no Supabase Dashboard

# 2. Deploy Railway
echo "🚂 Deploy Railway..."
cd python-service
railway up
cd ..

# 3. Atualizar extensão
echo "📦 Atualizando extensão..."
cd chrome-extension
zip -r ../syncads-extension-$(date +%Y%m%d-%H%M%S).zip . -x "*.git*" -x "README.md"
cd ..

echo "✅ Deploy concluído!"
echo ""
echo "Próximos passos:"
echo "1. Verifique o Railway: https://railway.app"
echo "2. Teste o health check"
echo "3. Recarregue a extensão no Chrome"
echo "4. Teste a conexão"
```

---

## 📞 SUPORTE

Se após seguir todos os passos a extensão ainda não conectar:

1. **Verifique os logs do Railway:**
   - Acesse railway.app
   - Vá em seu projeto
   - Clique em "View Logs"
   - Procure por erros 500 ou falhas de Supabase

2. **Verifique os logs da Extensão:**
   - Background: chrome://extensions/ > service worker
   - Content: F12 na página syncads.com.br

3. **Teste a API diretamente:**
   ```bash
   curl -X POST https://syncads-python-microservice-production.up.railway.app/api/extension/register \
     -H "Content-Type: application/json" \
     -d '{
       "deviceId": "test-123",
       "userId": "267cec04-2d3b-451f-9971-d3b6b5a43ab5",
       "version": "1.0.0"
     }'
   ```

4. **Verifique as variáveis de ambiente:**
   ```bash
   railway variables
   ```

---

## ✨ MELHORIAS FUTURAS

- [ ] Sistema de retry inteligente
- [ ] Cache de comandos offline
- [ ] Sincronização em tempo real via WebSocket
- [ ] Dashboard de dispositivos conectados
- [ ] Métricas de performance
- [ ] Logs estruturados com níveis
- [ ] Backup automático de estado
- [ ] Notificações push
- [ ] Modo debug visual
- [ ] Testes automatizados E2E

---

**Última atualização:** 17/01/2025
**Versão da extensão:** 1.0.0
**Status:** 🔴 Em correção