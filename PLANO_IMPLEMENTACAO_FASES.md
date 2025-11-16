# 🚀 PLANO DE IMPLEMENTAÇÃO - FASES EXECUTÁVEIS

**Projeto:** SyncAds IA + Extensão de Navegador  
**Data Início:** 16/01/2025  
**Prazo Total:** 4-6 semanas  
**Status:** 🔨 FASE 0 - PREPARAÇÃO

---

## 📊 OVERVIEW DAS FASES

| Fase | Nome | Duração | Status | Prioridade |
|------|------|---------|--------|------------|
| 0 | Preparação e Auditoria | 2 dias | 🔨 Em Andamento | 🔴 CRÍTICO |
| 1 | Remoção OAuth | 3 dias | ⏳ Pendente | 🔴 CRÍTICO |
| 2 | Extensão Chrome MVP | 5 dias | ⏳ Pendente | 🔴 CRÍTICO |
| 3 | WebSocket Server | 3 dias | ⏳ Pendente | 🔴 CRÍTICO |
| 4 | Core AI Agent | 5 dias | ⏳ Pendente | 🟡 ALTA |
| 5 | Backend Python Engine | 4 dias | ⏳ Pendente | 🟡 ALTA |
| 6 | Database Supabase | 3 dias | ⏳ Pendente | 🟡 ALTA |
| 7 | Frontend Dashboard | 4 dias | ⏳ Pendente | 🟢 MÉDIA |
| 8 | Testes e Deploy | 3 dias | ⏳ Pendente | 🔴 CRÍTICO |

**Total Estimado:** 32 dias (~6 semanas)

---

## 🎯 FASE 0: PREPARAÇÃO E AUDITORIA (2 dias)

### Objetivos
- ✅ Mapear todo código existente relacionado a OAuth
- ✅ Criar backup completo do projeto
- ✅ Documentar arquitetura atual
- ✅ Definir estrutura de pastas para novos componentes
- ✅ Setup de ambiente de desenvolvimento

### Tarefas

#### DIA 1 - Auditoria Completa
```bash
# 1. Criar branch de desenvolvimento
cd C:\Users\dinho\Documents\GitHub\SyncAds
git checkout -b feature/browser-extension-architecture
git push -u origin feature/browser-extension-architecture

# 2. Fazer backup completo
git tag backup-pre-extension-$(date +%Y%m%d)
git push --tags

# 3. Auditar código OAuth
grep -r "oauth\|OAuth\|OAUTH" src/ --include="*.ts" --include="*.tsx" > AUDIT_OAUTH.txt
grep -r "oauth\|OAuth\|OAUTH" supabase/ --include="*.ts" >> AUDIT_OAUTH.txt

# 4. Auditar integrações
grep -r "integration\|Integration" src/ --include="*.ts" --include="*.tsx" > AUDIT_INTEGRATIONS.txt

# 5. Listar todas as rotas
grep -r "Route path=" src/ --include="*.tsx" > AUDIT_ROUTES.txt
```

**Checklist DIA 1:**
- [ ] Branch criada
- [ ] Backup realizado
- [ ] Arquivos de auditoria gerados
- [ ] Documentação lida e compreendida
- [ ] Lista de arquivos a modificar criada

#### DIA 2 - Setup de Estrutura
```bash
# 1. Criar estrutura de pastas para extensão
mkdir -p chrome-extension/{src,dist,icons,utils}
mkdir -p chrome-extension/src/{background,content,popup,injected}

# 2. Criar estrutura para WebSocket server
mkdir -p src/server/websocket
mkdir -p src/server/extension-api

# 3. Criar estrutura para AI Agent
mkdir -p python-service/app/ai_agent
mkdir -p python-service/app/task_queue
mkdir -p python-service/app/extension_commands

# 4. Criar arquivos de configuração
touch chrome-extension/manifest.json
touch chrome-extension/webpack.config.js
touch chrome-extension/package.json
```

**Checklist DIA 2:**
- [ ] Estrutura de pastas criada
- [ ] Arquivos base criados
- [ ] Configurações iniciais feitas
- [ ] Dependências identificadas

---

## 🗑️ FASE 1: REMOÇÃO OAUTH (3 dias)

### Objetivos
- Remover todas as dependências de OAuth
- Desativar rotas OAuth
- Limpar código de integrações antigas
- Atualizar UI para remover referências OAuth

### DIA 1 - Identificar e Marcar para Remoção

**Arquivos a REMOVER completamente:**
```bash
# Frontend
rm src/pages/super-admin/OAuthConfigPage.tsx
rm src/components/chat/IntegrationActionButtons.tsx
rm src/components/chat/IntegrationConnectionCard.tsx
rm src/lib/integrations/oauthConfig.ts
rm src/lib/api/mercadolivreIntegrationApi.ts

# Supabase Functions
rm -rf supabase/functions/oauth-init
rm -rf supabase/functions/oauth-callback
rm -rf supabase/functions/mercadolivre-oauth
```

**Arquivos a REFATORAR (manter mas modificar):**
```bash
# Estes arquivos precisam ser editados, não removidos
src/App.tsx                                    # Atualizar rotas
src/components/layout/SuperAdminLayout.tsx    # Atualizar menu
src/components/chat/AIActionButtons.tsx        # Remover lógica OAuth
src/lib/ai/tools.ts                           # Remover tools OAuth
```

**Checklist DIA 1:**
- [ ] Lista de arquivos para remover criada
- [ ] Lista de arquivos para refatorar criada
- [ ] Backup dos arquivos importantes feito
- [ ] Dependências mapeadas

### DIA 2 - Executar Remoções

```bash
# 1. Remover arquivos OAuth
git rm src/pages/super-admin/OAuthConfigPage.tsx
git rm src/components/chat/IntegrationActionButtons.tsx
git rm src/components/chat/IntegrationConnectionCard.tsx
git rm src/lib/integrations/oauthConfig.ts
git rm src/lib/api/mercadolivreIntegrationApi.ts

# 2. Remover edge functions OAuth
git rm -rf supabase/functions/oauth-init
git rm -rf supabase/functions/oauth-callback
git rm -rf supabase/functions/mercadolivre-oauth

# 3. Commit das remoções
git commit -m "Remove OAuth infrastructure and related files"
```

**Refatorar App.tsx:**
```typescript
// ANTES:
<Route path="/super-admin/oauth-config" element={<OAuthConfigPage />} />

// DEPOIS:
<Route path="/super-admin/extension-manager" element={<ExtensionManagerPage />} />
```

**Refatorar SuperAdminLayout.tsx:**
```typescript
// ANTES:
{
  to: "/super-admin/oauth-config",
  icon: HiPuzzlePiece,
  label: "OAuth Config",
}

// DEPOIS:
{
  to: "/super-admin/extension-manager",
  icon: HiCube,
  label: "Extensão do Navegador",
},
{
  to: "/super-admin/automation-logs",
  icon: HiDocumentText,
  label: "Logs de Automação",
}
```

**Checklist DIA 2:**
- [ ] Arquivos removidos via git
- [ ] Rotas atualizadas
- [ ] Menu atualizado
- [ ] Commit realizado

### DIA 3 - Limpar Database e Testar

```sql
-- 1. Criar backup das tabelas OAuth
CREATE TABLE oauth_tokens_backup AS SELECT * FROM oauth_tokens;
CREATE TABLE integration_connections_backup AS SELECT * FROM integration_connections;

-- 2. Desativar (não remover ainda) tabelas OAuth
-- Apenas marcar como deprecated
ALTER TABLE oauth_tokens ADD COLUMN deprecated BOOLEAN DEFAULT true;
ALTER TABLE integration_connections ADD COLUMN deprecated BOOLEAN DEFAULT true;

-- 3. Remover indexes relacionados (opcional)
-- DROP INDEX IF EXISTS idx_oauth_tokens_user_id;
```

**Testar aplicação:**
```bash
# 1. Instalar dependências
npm install

# 2. Compilar
npm run build

# 3. Verificar se não há erros
npm run type-check

# 4. Testar localmente
npm run dev
```

**Checklist DIA 3:**
- [ ] Backup do banco feito
- [ ] Tabelas marcadas como deprecated
- [ ] Build sem erros
- [ ] Aplicação rodando localmente
- [ ] Testes manuais realizados

---

## 🧩 FASE 2: EXTENSÃO CHROME MVP (5 dias)

### Objetivos
- Criar extensão Chrome funcional
- Implementar comunicação básica
- Testar manipulação do DOM
- Deploy da extensão para teste

### DIA 1 - Setup Básico da Extensão

**Criar manifest.json:**
```json
{
  "manifest_version": 3,
  "name": "SyncAds AI Automation",
  "version": "1.0.0",
  "description": "Automação inteligente com IA para marketing digital",
  "permissions": [
    "activeTab",
    "storage",
    "tabs",
    "scripting"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "run_at": "document_end"
    }
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  }
}
```

**Criar package.json:**
```json
{
  "name": "syncads-chrome-extension",
  "version": "1.0.0",
  "description": "SyncAds Browser Extension",
  "scripts": {
    "build": "webpack --mode production",
    "dev": "webpack --mode development --watch",
    "test": "jest"
  },
  "devDependencies": {
    "@types/chrome": "^0.0.254",
    "webpack": "^5.89.0",
    "webpack-cli": "^5.1.4",
    "copy-webpack-plugin": "^11.0.0"
  }
}
```

**Criar webpack.config.js:**
```javascript
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background/index.js',
    'content-script': './src/content/index.js',
    popup: './src/popup/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'src/popup/popup.html', to: 'popup.html' },
        { from: 'icons', to: 'icons' }
      ]
    })
  ]
};
```

**Checklist DIA 1:**
- [ ] manifest.json criado
- [ ] package.json criado
- [ ] webpack.config.js criado
- [ ] Estrutura de pastas criada
- [ ] Ícones da extensão adicionados

### DIA 2 - Background Script (Service Worker)

**Criar: chrome-extension/src/background/index.js**
```javascript
// Service Worker - Background script
console.log('SyncAds Extension - Background Script Loaded');

// Estado global
let config = {
  serverUrl: 'https://syncads.vercel.app',
  wsUrl: 'wss://syncads.vercel.app/api/ws/extension',
  userId: null,
  deviceId: null,
  isConnected: false
};

// Inicializar ao instalar
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Extension installed');
  
  // Carregar configuração do storage
  const stored = await chrome.storage.local.get(['deviceId', 'userId']);
  
  if (!stored.deviceId) {
    // Gerar deviceId único
    config.deviceId = generateDeviceId();
    await chrome.storage.local.set({ deviceId: config.deviceId });
  } else {
    config.deviceId = stored.deviceId;
  }
  
  config.userId = stored.userId;
  
  // Conectar com servidor
  if (config.userId) {
    connectToServer();
  }
});

// Gerar ID único do dispositivo
function generateDeviceId() {
  return 'device_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Conectar com servidor via fetch (long polling)
async function connectToServer() {
  try {
    const response = await fetch(`${config.serverUrl}/api/extension/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: config.deviceId,
        userId: config.userId,
        browser: getBrowserInfo()
      })
    });
    
    if (response.ok) {
      config.isConnected = true;
      console.log('Connected to server');
      
      // Iniciar long polling para comandos
      startCommandPolling();
    }
  } catch (error) {
    console.error('Failed to connect:', error);
    
    // Tentar reconectar em 5 segundos
    setTimeout(connectToServer, 5000);
  }
}

// Long polling para receber comandos
async function startCommandPolling() {
  while (config.isConnected) {
    try {
      const response = await fetch(
        `${config.serverUrl}/api/extension/commands?deviceId=${config.deviceId}`,
        { signal: AbortSignal.timeout(30000) }
      );
      
      if (response.ok) {
        const commands = await response.json();
        
        for (const command of commands) {
          await executeCommand(command);
        }
      }
    } catch (error) {
      if (error.name !== 'TimeoutError') {
        console.error('Polling error:', error);
        await sleep(2000);
      }
    }
  }
}

// Executar comando recebido
async function executeCommand(command) {
  console.log('Executing command:', command);
  
  try {
    let result;
    
    switch (command.type) {
      case 'DOM_READ':
        result = await executeDOMCommand(command);
        break;
      case 'DOM_CLICK':
        result = await executeDOMCommand(command);
        break;
      case 'DOM_FILL':
        result = await executeDOMCommand(command);
        break;
      case 'NAVIGATE':
        result = await executeNavigate(command);
        break;
      case 'SCREENSHOT':
        result = await executeScreenshot(command);
        break;
      default:
        result = { success: false, error: 'Unknown command type' };
    }
    
    // Enviar resultado de volta
    await sendResult(command.id, result);
    
  } catch (error) {
    console.error('Command execution error:', error);
    await sendResult(command.id, {
      success: false,
      error: error.message
    });
  }
}

// Enviar comando para content script
async function executeDOMCommand(command) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    return { success: false, error: 'No active tab' };
  }
  
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tab.id, command, (response) => {
      resolve(response || { success: false, error: 'No response from content script' });
    });
  });
}

// Navegar para URL
async function executeNavigate(command) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab) {
    // Criar nova aba
    await chrome.tabs.create({ url: command.url });
  } else {
    // Atualizar aba atual
    await chrome.tabs.update(tab.id, { url: command.url });
  }
  
  return { success: true, message: `Navigated to ${command.url}` };
}

// Capturar screenshot
async function executeScreenshot(command) {
  const dataUrl = await chrome.tabs.captureVisibleTab(null, {
    format: 'png',
    quality: 90
  });
  
  return {
    success: true,
    screenshot: dataUrl
  };
}

// Enviar resultado
async function sendResult(commandId, result) {
  try {
    await fetch(`${config.serverUrl}/api/extension/result`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: config.deviceId,
        commandId,
        result,
        timestamp: Date.now()
      })
    });
  } catch (error) {
    console.error('Failed to send result:', error);
  }
}

// Obter informações do navegador
function getBrowserInfo() {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Listener para mensagens do content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'LOG') {
    // Enviar log para servidor
    sendLog(request.log);
  } else if (request.type === 'GET_CONFIG') {
    sendResponse(config);
  }
  
  return true;
});

async function sendLog(log) {
  try {
    await fetch(`${config.serverUrl}/api/extension/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        deviceId: config.deviceId,
        ...log
      })
    });
  } catch (error) {
    console.error('Failed to send log:', error);
  }
}
```

**Checklist DIA 2:**
- [ ] background.js criado
- [ ] Sistema de conexão implementado
- [ ] Long polling implementado
- [ ] Executor de comandos implementado
- [ ] Sistema de logs implementado

### DIA 3 - Content Script (Manipulação DOM)

**Criar: chrome-extension/src/content/index.js**
```javascript
// Content Script - Acesso ao DOM
console.log('SyncAds Content Script Loaded');

// Listener para comandos do background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received:', request);
  
  switch (request.type) {
    case 'DOM_READ':
      handleDOMRead(request, sendResponse);
      break;
    case 'DOM_CLICK':
      handleDOMClick(request, sendResponse);
      break;
    case 'DOM_FILL':
      handleDOMFill(request, sendResponse);
      break;
    case 'DOM_WAIT':
      handleDOMWait(request, sendResponse);
      break;
  }
  
  return true; // Manter canal aberto para resposta async
});

// Ler elemento do DOM
function handleDOMRead(request, sendResponse) {
  try {
    const { selector, attribute } = request;
    const element = document.querySelector(selector);
    
    if (!element) {
      sendResponse({
        success: false,
        error: `Element not found: ${selector}`
      });
      return;
    }
    
    let data = {
      text: element.textContent?.trim(),
      html: element.innerHTML,
      value: element.value || null,
      attributes: {},
      bounds: element.getBoundingClientRect(),
      visible: isElementVisible(element)
    };
    
    // Capturar atributos
    Array.from(element.attributes).forEach(attr => {
      data.attributes[attr.name] = attr.value;
    });
    
    // Se atributo específico foi solicitado
    if (attribute) {
      data.requestedAttribute = element.getAttribute(attribute);
    }
    
    sendResponse({
      success: true,
      data
    });
    
    sendLog('DOM_READ', `Read element: ${selector}`, data);
    
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Clicar em elemento
function handleDOMClick(request, sendResponse) {
  try {
    const { selector, waitAfter = 500 } = request;
    const element = document.querySelector(selector);
    
    if (!element) {
      sendResponse({
        success: false,
        error: `Element not found: ${selector}`
      });
      return;
    }
    
    // Scroll suave até elemento
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center'
    });
    
    // Aguardar scroll
    setTimeout(() => {
      // Destacar elemento visualmente
      const originalBorder = element.style.border;
      element.style.border = '2px solid red';
      
      setTimeout(() => {
        // Simular hover
        element.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        
        setTimeout(() => {
          // Clicar
          element.click();
          
          // Restaurar estilo
          setTimeout(() => {
            element.style.border = originalBorder;
          }, 200);
          
          sendResponse({
            success: true,
            message: `Clicked element: ${selector}`
          });
          
          sendLog('DOM_CLICK', `Clicked: ${selector}`);
          
        }, 100);
      }, 200);
    }, 300);
    
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Preencher input
function handleDOMFill(request, sendResponse) {
  try {
    const { selector, value, clear = true } = request;
    const element = document.querySelector(selector);
    
    if (!element) {
      sendResponse({
        success: false,
        error: `Element not found: ${selector}`
      });
      return;
    }
    
    // Scroll até elemento
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    setTimeout(() => {
      // Focus
      element.focus();
      
      // Limpar se necessário
      if (clear) {
        element.value = '';
      }
      
      // Simular digitação humana
      let currentValue = element.value;
      const chars = value.split('');
      
      const typeChar = () => {
        if (chars.length === 0) {
          // Disparar eventos
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.blur();
          
          sendResponse({
            success: true,
            message: `Filled element: ${selector}`
          });
          
          sendLog('DOM_FILL', `Filled: ${selector} with "${value}"`);
          return;
        }
        
        const char = chars.shift();
        currentValue += char;
        element.value = currentValue;
        
        // Disparar input event
        element.dispatchEvent(new Event('input', { bubbles: true }));
        
        // Delay aleatório entre caracteres (50-150ms)
        const delay = Math.random() * 100 + 50;
        setTimeout(typeChar, delay);
      };
      
      setTimeout(typeChar, 200);
      
    }, 300);
    
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// Aguardar elemento aparecer
function handleDOMWait(request, sendResponse) {
  const { selector, timeout = 10000 } = request;
  
  const startTime = Date.now();
  
  const checkElement = () => {
    const element = document.querySelector(selector);
    
    if (element && isElementVisible(element)) {
      sendResponse({
        success: true,
        message: `Element found: ${selector}`,
        waitTime: Date.now() - startTime
      });
      return;
    }
    
    if (Date.now() - startTime > timeout) {
      sendResponse({
        success: false,
        error: `Element not found after ${timeout}ms: ${selector}`
      });
      return;
    }
    
    // Verificar novamente em 100ms
    setTimeout(checkElement, 100);
  };
  
  checkElement();
}

// Verificar se elemento está visível
function isElementVisible(element) {
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  
  return (
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0' &&
    rect.width > 0 &&
    rect.height > 0
  );
}

// Enviar log para background
function sendLog(action, message, data = null) {
  chrome.runtime.sendMessage({
    type: 'LOG',
    log: {
      action,
      message,
      data,
      url: window.location.href,
      timestamp: Date.now()
    }
  });
}

// Adicionar indicador visual quando extensão está ativa
const indicator = document.createElement('div');
indicator.id = 'syncads-extension-indicator';
indicator.innerHTML = '🤖 SyncAds Active';
indicator.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 10px 20px;
  border-radius: 25px;
  font-family: Arial, sans-serif;
  font-size: 12px;
  z-index: 999999;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  animation: fadeIn 0.3s ease-in;
  display: none;
`;

document.addEventListener('DOMContentLoaded', () => {
  document.body.appendChild(indicator);
});

// Mostrar/ocultar indicador
function showIndicator(duration = 3000) {
  indicator.style.display = 'block';
  setTimeout(() => {
    indicator.style.display = 'none';
  }, duration);
}

// Mostrar indicador ao receber comando
chrome.runtime.onMessage.addListener((request) => {
  if (request.type.startsWith('DOM_')) {
    showIndicator(2000);
  }
});
```

**Checklist DIA 3:**
- [ ] content-script.js criado
- [ ] Manipulação DOM implementada
- [ ] Sistema de digitação humana implementado
- [ ] Indicador visual implementado
- [ ] Logs implementados

### DIA 4 - Popup UI

**Criar: chrome-extension/src/popup/popup.html**
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SyncAds Extension</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      width: 350px;
      min-height: 400px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }
    
    .container {
      padding: 20px;
    }
    
    .header {
      text-align: center;
      margin-bottom: 20px;
    }
    
    .logo {
      font-size: 48px;
      margin-bottom: 10px;
    }
    
    h1 {
      font-size: 20px;
      font-weight: 600;
    }
    
    .status {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(10px);
      border-radius: 12px;
      padding: 15px;
      margin-bottom: 15px;
    }
    
    .status-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }
    
    .status-label {
      opacity: 0.8;
      font-size: 14px;
    }
    
    .status-value {
      font-weight: 600;
      font-size: 14px;
    }
    
    .status-indicator {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      margin-right: 5px;
    }
    
    .status-indicator.online {
      background: #10b981;
      box-shadow: 0 0 10px #10b981;
    }
    
    .status-indicator.offline {
      background: #ef4444;
    }
    
    .button {
      width: 100%;
      padding: 12px;
      background: white;
      color: #667eea;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
      margin-bottom: 10px;
    }
    
    .button:hover {
      transform: translateY(-2px);
    }
    
    .button:active {
      transform: translateY(0);
    }
    
    .button.secondary {
      background: rgba(255,255,255,0.2);
      color: white;
    }
    
    .logs {
      max-height: 150px;
      overflow-y: auto;
      background: rgba(0,0,0,0.2);
      border-radius: 8px;
      padding: 10px