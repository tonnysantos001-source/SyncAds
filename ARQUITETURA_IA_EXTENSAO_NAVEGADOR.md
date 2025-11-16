# 🚀 ARQUITETURA IA + EXTENSÃO DE NAVEGADOR - SYNCADS

**Versão:** 3.0.0  
**Data:** 16/01/2025  
**Status:** 🔨 EM DESENVOLVIMENTO  
**Objetivo:** Criar a PRIMEIRA IA do Brasil com controle via extensão de navegador

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura Completa](#arquitetura-completa)
3. [Componentes Principais](#componentes-principais)
4. [Fase 1: Remoção OAuth](#fase-1-remoção-oauth)
5. [Fase 2: Extensão do Navegador](#fase-2-extensão-do-navegador)
6. [Fase 3: Core AI Agent](#fase-3-core-ai-agent)
7. [Fase 4: Backend Python Engine](#fase-4-backend-python-engine)
8. [Fase 5: Supabase Database](#fase-5-supabase-database)
9. [Fase 6: Chat IA Integrado](#fase-6-chat-ia-integrado)
10. [Fase 7: Frontend Atualizado](#fase-7-frontend-atualizado)
11. [Fase 8: Testes e Deploy](#fase-8-testes-e-deploy)
12. [Roadmap de Implementação](#roadmap-de-implementação)

---

## 🎯 VISÃO GERAL

### Problema Atual
- Sistema baseado em OAuth com múltiplas integrações (Meta, Google, TikTok, etc)
- Dependência de tokens sensíveis
- Limitações de APIs oficiais
- Complexidade de manutenção
- Custos de APIs

### Solução Proposta
Sistema híbrido de **IA + RPA + Automação Web** onde:

✅ **IA (Claude 4.5)** - Orquestra todas as ações  
✅ **Extensão Chrome** - Executa ações no navegador do cliente  
✅ **Backend Python** - Processa tarefas complexas (scraping, IA, media)  
✅ **WebSocket** - Comunicação em tempo real  
✅ **Sem OAuth** - Sem tokens sensíveis  
✅ **RPA DOM** - Automação via manipulação do DOM  

### Vantagens
- ✅ **Sem custos de API** - Usa o navegador do próprio cliente
- ✅ **Sem limitações** - Não depende de rate limits de APIs
- ✅ **Mais flexível** - Pode automatizar qualquer site
- ✅ **Mais poderoso** - Combina IA + RPA + Python
- ✅ **Mais seguro** - Sem armazenamento de tokens sensíveis
- ✅ **Escalável** - Cada cliente usa seu próprio navegador

---

## 🏗️ ARQUITETURA COMPLETA

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLIENTE (Navegador)                            │
│                                                                         │
│  ┌────────────────┐         ┌─────────────────────────────────┐       │
│  │   WEBSITE      │ ◄─────► │  CHROME EXTENSION               │       │
│  │  (DOM Real)    │         │  - Content Script (DOM access)  │       │
│  │                │         │  - Background Script (API)      │       │
│  │  Facebook      │         │  - Service Worker (tasks)       │       │
│  │  Instagram     │         │  - WebSocket Client             │       │
│  │  Google Ads    │         └──────────────┬──────────────────┘       │
│  │  TikTok        │                        │                          │
│  │  Mercado Livre │                        │ WebSocket/Long Polling  │
│  │  Shopify       │                        │                          │
│  └────────────────┘                        │                          │
└─────────────────────────────────────────────┼──────────────────────────┘
                                              │
                                              │
┌─────────────────────────────────────────────▼──────────────────────────┐
│                     VERCEL (Frontend + WebSocket Proxy)                │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  REACT DASHBOARD                                             │     │
│  │  - Chat IA                                                   │     │
│  │  - Status da Extensão                                        │     │
│  │  - Logs em Tempo Real                                        │     │
│  │  - Tarefas em Execução                                       │     │
│  │  - Histórico de Automações                                   │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  WEBSOCKET SERVER (Next.js API Routes)                       │     │
│  │  - /api/ws/extension (conexão da extensão)                   │     │
│  │  - /api/ws/dashboard (conexão do dashboard)                  │     │
│  │  - Broadcasting de comandos                                  │     │
│  │  - Recebimento de logs                                       │     │
│  └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────┬──────────────────────────┘
                                              │
                                              │ HTTP/REST
                                              │
┌─────────────────────────────────────────────▼──────────────────────────┐
│                     RAILWAY (Backend Python + AI Core)                 │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  FASTAPI (AI ENGINE)                                         │     │
│  │  - POST /api/ai/chat (chat principal)                        │     │
│  │  - POST /api/ai/execute-task (executar tarefa)               │     │
│  │  - POST /api/ai/analyze (análise de dados)                   │     │
│  │  - POST /api/ai/scrape (web scraping)                        │     │
│  │  - POST /api/ai/generate-media (imagens/vídeos)              │     │
│  │  - GET /api/ai/task-status/:id (status de tarefa)            │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  CORE AI AGENT (Decision Engine)                            │     │
│  │  ┌────────────────────────────────────────────────┐         │     │
│  │  │  1. Recebe tarefa do usuário                   │         │     │
│  │  │  2. Analisa complexidade e requisitos          │         │     │
│  │  │  3. Decide estratégia de execução:             │         │     │
│  │  │     - Extensão navegador?                      │         │     │
│  │  │     - Backend Python?                          │         │     │
│  │  │     - Ambos (pipeline)?                        │         │     │
│  │  │  4. Executa com sistema de fallback            │         │     │
│  │  │  5. Retorna resultado + logs                   │         │     │
│  │  └────────────────────────────────────────────────┘         │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  PYTHON LIBRARIES ENGINE                                     │     │
│  │  - Scraping: BeautifulSoup, Selenium, Playwright            │     │
│  │  - IA: OpenAI, Anthropic, Langchain, Transformers          │     │
│  │  - Media: Pillow, MoviePy, ImageIO                         │     │
│  │  - Data: Pandas, NumPy, SQLAlchemy                         │     │
│  │  - Web: Requests, HTTPX, Aiohttp                           │     │
│  │  - NLP: SpaCy, NLTK, TextBlob                              │     │
│  │  - ... + 200 bibliotecas disponíveis                       │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  TASK QUEUE SYSTEM (Redis/Memory)                           │     │
│  │  - Fila de tarefas pendentes                                │     │
│  │  - Tarefas em execução                                      │     │
│  │  - Histórico de tarefas                                     │     │
│  │  - Retry automático em caso de falha                        │     │
│  └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────┬──────────────────────────┘
                                              │
                                              │
┌─────────────────────────────────────────────▼──────────────────────────┐
│                          SUPABASE (Database)                           │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  TABELAS PRINCIPAIS                                          │     │
│  │  - users (usuários)                                          │     │
│  │  - sessions (sessões ativas)                                 │     │
│  │  - browser_sessions (sessões da extensão)                    │     │
│  │  - extension_devices (dispositivos registrados)              │     │
│  │  - ai_tasks (tarefas da IA)                                  │     │
│  │  - ai_logs (logs de execução)                                │     │
│  │  - automation_history (histórico de automações)              │     │
│  │  - ChatMessage (mensagens do chat)                           │     │
│  │  - GlobalAiConnection (config da IA)                         │     │
│  └──────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────┐     │
│  │  REALTIME SUBSCRIPTIONS                                      │     │
│  │  - Logs em tempo real                                        │     │
│  │  - Status de tarefas                                         │     │
│  │  - Atualizações da extensão                                  │     │
│  └──────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 COMPONENTES PRINCIPAIS

### 1. Chrome Extension (Cliente)
**Localização:** `/chrome-extension/`

```
chrome-extension/
├── manifest.json (Manifest V3)
├── background.js (Service Worker)
├── content-script.js (Acesso ao DOM)
├── popup.html (UI da extensão)
├── popup.js
├── websocket-client.js (Comunicação)
├── dom-automation.js (RPA)
├── task-executor.js (Execução de tarefas)
└── utils/
    ├── logger.js
    ├── storage.js
    └── dom-helpers.js
```

**Capacidades:**
- ✅ Ler qualquer elemento do DOM
- ✅ Preencher formulários
- ✅ Clicar em botões
- ✅ Navegar entre páginas
- ✅ Capturar screenshots
- ✅ Extrair textos e imagens
- ✅ Executar scripts customizados
- ✅ Injetar código JavaScript
- ✅ Monitorar eventos do navegador
- ✅ Persistir dados localmente

### 2. WebSocket Server (Vercel)
**Localização:** `/src/api/ws/`

```typescript
// /api/ws/extension.ts
export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Upgrade para WebSocket
    const ws = await upgradeToWebSocket(req, res);
    
    ws.on('message', async (data) => {
      const message = JSON.parse(data);
      
      switch (message.type) {
        case 'REGISTER':
          await registerExtension(message);
          break;
        case 'LOG':
          await broadcastLog(message);
          break;
        case 'TASK_COMPLETE':
          await handleTaskComplete(message);
          break;
      }
    });
  }
}
```

### 3. Core AI Agent (Railway)
**Localização:** `/python-service/app/ai_agent/`

```python
# core_agent.py
class CoreAIAgent:
    """
    Motor de decisão que escolhe a melhor estratégia para executar uma tarefa
    """
    
    async def execute_task(self, task: Task) -> TaskResult:
        # 1. Analisar tarefa
        complexity = self.analyze_complexity(task)
        
        # 2. Decidir estratégia
        if complexity.requires_browser:
            return await self.execute_via_extension(task)
        elif complexity.requires_python:
            return await self.execute_via_python(task)
        else:
            # Pipeline: Python + Extensão
            return await self.execute_pipeline(task)
    
    async def execute_via_extension(self, task: Task) -> TaskResult:
        """Envia comando para extensão do navegador"""
        # Tentar estratégia primária
        try:
            return await self.strategy_primary(task)
        except Exception as e:
            # Fallback para estratégia secundária
            logger.warning(f"Primary failed: {e}, trying fallback...")
            return await self.strategy_fallback(task)
    
    async def execute_via_python(self, task: Task) -> TaskResult:
        """Executa tarefa usando bibliotecas Python"""
        # Sistema de fallback entre bibliotecas
        strategies = [
            self.try_beautiful_soup,
            self.try_selenium,
            self.try_playwright,
            self.try_requests,
        ]
        
        for strategy in strategies:
            try:
                result = await strategy(task)
                if result.success:
                    return result
            except Exception as e:
                logger.warning(f"{strategy.__name__} failed: {e}")
                continue
        
        raise Exception("All strategies failed")
```

### 4. Backend Python Engine (Railway)
**Localização:** `/python-service/app/`

**Novos Endpoints:**

```python
# /api/ai/execute-task
@app.post("/api/ai/execute-task")
async def execute_task(task: TaskRequest):
    """
    Executa tarefa complexa usando bibliotecas Python
    Suporta: scraping, análise, geração de media, NLP, etc
    """
    task_id = generate_task_id()
    
    # Adicionar à fila
    await task_queue.add(task_id, task)
    
    # Executar assincronamente
    asyncio.create_task(process_task(task_id, task))
    
    return {
        "task_id": task_id,
        "status": "processing",
        "estimated_time": estimate_time(task)
    }

# /api/ai/scrape
@app.post("/api/ai/scrape")
async def scrape(request: ScrapeRequest):
    """Scraping avançado com fallback de bibliotecas"""
    try:
        # Tentar BeautifulSoup primeiro (mais rápido)
        result = await scrape_with_beautifulsoup(request.url)
        return result
    except:
        try:
            # Fallback para Selenium
            result = await scrape_with_selenium(request.url)
            return result
        except:
            # Último recurso: Playwright
            result = await scrape_with_playwright(request.url)
            return result

# /api/ai/generate-media
@app.post("/api/ai/generate-media")
async def generate_media(request: MediaRequest):
    """Gera imagens, vídeos, templates"""
    if request.type == "image":
        # Usar Pollinations.ai ou DALL-E
        return await generate_image(request.prompt)
    elif request.type == "video":
        # Usar MoviePy + Pollinations
        return await generate_video(request.prompt)
    elif request.type == "template":
        # Gerar template HTML/CSS
        return await generate_template(request.spec)

# /api/ai/pipeline
@app.post("/api/ai/pipeline")
async def execute_pipeline(pipeline: PipelineRequest):
    """
    Executa pipeline de tarefas encadeadas
    Exemplo: Scrape → Análise → Geração de Imagem → Post
    """
    results = []
    
    for step in pipeline.steps:
        if step.type == "scrape":
            result = await scrape(step.params)
        elif step.type == "analyze":
            result = await analyze(step.params, results)
        elif step.type == "generate":
            result = await generate_media(step.params)
        elif step.type == "post":
            # Enviar para extensão postar
            result = await send_to_extension(step.params)
        
        results.append(result)
    
    return {"results": results}
```

---

## 📌 FASE 1: REMOÇÃO OAUTH

### 1.1 Arquivos a Remover/Desativar

**Frontend:**
```bash
# Remover páginas OAuth
src/pages/super-admin/OAuthConfigPage.tsx

# Remover componentes OAuth
src/components/chat/AIActionButtons.tsx (refatorar)
src/components/chat/IntegrationActionButtons.tsx
src/components/chat/IntegrationConnectionCard.tsx

# Remover APIs OAuth
src/lib/integrations/oauthConfig.ts
src/lib/api/mercadolivreIntegrationApi.ts
```

**Backend (Supabase Edge Functions):**
```bash
supabase/functions/oauth-init/
supabase/functions/oauth-callback/
supabase/functions/mercadolivre-oauth/
```

**Database:**
```sql
-- Remover tabelas OAuth antigas (manter backup primeiro!)
-- DROP TABLE IF EXISTS oauth_tokens;
-- DROP TABLE IF EXISTS integration_connections;
```

### 1.2 Refatoração de Rotas

**Antes:**
```typescript
// App.tsx
<Route path="/super-admin/oauth-config" element={<OAuthConfigPage />} />
```

**Depois:**
```typescript
// App.tsx
<Route path="/super-admin/extension-config" element={<ExtensionConfigPage />} />
```

### 1.3 Atualizar Layout Super Admin

```typescript
// SuperAdminLayout.tsx
const navItems = [
  // ... outros items
  {
    to: "/super-admin/extension-config",
    icon: HiPuzzlePiece,
    label: "Extensão do Navegador",
  },
  {
    to: "/super-admin/automation-logs",
    icon: HiDocumentText,
    label: "Logs de Automação",
  },
];
```

---

## 📌 FASE 2: EXTENSÃO DO NAVEGADOR

### 2.1 Estrutura da Extensão

**manifest.json (Manifest V3)**
```json
{
  "manifest_version": 3,
  "name": "SyncAds AI Automation",
  "version": "1.0.0",
  "description": "Automação inteligente com IA para marketing digital",
  "permissions": [
    "activeTab",
    "storage",
    "webRequest",
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
  },
  "web_accessible_resources": [
    {
      "resources": ["injected.js"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

**background.js (Service Worker)**
```javascript
// Conexão WebSocket com o servidor
let ws = null;
let userId = null;
let deviceId = null;

// Inicializar ao instalar
chrome.runtime.onInstalled.addListener(() => {
  console.log('SyncAds Extension installed');
  initializeExtension();
});

async function initializeExtension() {
  // Gerar deviceId único
  deviceId = await getOrCreateDeviceId();
  
  // Conectar com servidor
  connectWebSocket();
}

function connectWebSocket() {
  const wsUrl = 'wss://syncads.vercel.app/api/ws/extension';
  
  ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('WebSocket connected');
    
    // Registrar extensão
    ws.send(JSON.stringify({
      type: 'REGISTER',
      deviceId,
      userId,
      browser: getBrowserInfo(),
      timestamp: Date.now()
    }));
  };
  
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    handleCommand(message);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    
    // Fallback para long polling
    startLongPolling();
  };
  
  ws.onclose = () => {
    console.log('WebSocket closed, reconnecting...');
    setTimeout(connectWebSocket, 5000);
  };
}

async function handleCommand(command) {
  console.log('Received command:', command);
  
  switch (command.type) {
    case 'DOM_READ':
      await executeDOM Read(command);
      break;
    case 'DOM_CLICK':
      await executeDOMClick(command);
      break;
    case 'DOM_FILL':
      await executeDOMFill(command);
      break;
    case 'SCREENSHOT':
      await executeScreenshot(command);
      break;
    case 'NAVIGATE':
      await executeNavigate(command);
      break;
    case 'SCRIPT':
      await executeScript(command);
      break;
  }
}

// Enviar resultado de volta
function sendResult(commandId, result) {
  ws.send(JSON.stringify({
    type: 'COMMAND_RESULT',
    commandId,
    result,
    timestamp: Date.now()
  }));
}

// Long polling fallback
async function startLongPolling() {
  while (!ws || ws.readyState !== WebSocket.OPEN) {
    try {
      const response = await fetch(
        `https://syncads.vercel.app/api/poll/commands?deviceId=${deviceId}`
      );
      
      const commands = await response.json();
      
      for (const command of commands) {
        await handleCommand(command);
      }
    } catch (error) {
      console.error('Long polling error:', error);
    }
    
    await sleep(2000);
  }
}
```

**content-script.js (Manipulação DOM)**
```javascript
// Content script com acesso ao DOM da página
console.log('SyncAds content script loaded');

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
  }
  
  return true; // Keep channel open for async response
});

function handleDOMRead(request, sendResponse) {
  try {
    const selector = request.selector;
    const element = document.querySelector(selector);
    
    if (!element) {
      sendResponse({
        success: false,
        error: `Element not found: ${selector}`
      });
      return;
    }
    
    const data = {
      text: element.textContent,
      html: element.innerHTML,
      attributes: Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {}),
      bounds: element.getBoundingClientRect()
    };
    
    sendResponse({
      success: true,
      data
    });
    
    // Enviar log para dashboard
    sendLog('DOM_READ', `Read element: ${selector}`, data);
    
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

function handleDOMClick(request, sendResponse) {
  try {
    const selector = request.selector;
    const element = document.querySelector(selector);
    
    if (!element) {
      sendResponse({
        success: false,
        error: `Element not found: ${selector}`
      });
      return;
    }
    
    // Simular click humano com delay
    setTimeout(() => {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        element.click();
        
        sendResponse({
          success: true,
          message: `Clicked element: ${selector}`
        });
        
        sendLog('DOM_CLICK', `Clicked: ${selector}`);
      }, 500);
    }, 300);
    
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

function handleDOMFill(request, sendResponse) {
  try {
    const selector = request.selector;
    const value = request.value;
    const element = document.querySelector(selector);
    
    if (!element) {
      sendResponse({
        success: false,
        error: `Element not found: ${selector}`
      });
      return;
    }
    
    // Simular digitação humana
    element.focus();
    
    let currentValue = '';
    const chars = value.split('');
    
    const typeChar = () => {
      if (chars.length === 0) {
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        
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
      
      const delay = Math.random() * 100 + 50; // 50-150ms entre caracteres
      setTimeout(typeChar, delay);
    };
    
    typeChar();
    
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

function sendLog(action, message, data = null) {
  chrome.runtime.sendMessage({
    type: 'SEND_LOG',
    log: {
      action,
      message,
      data,
      url: window.location.href,
      timestamp: Date.now()
    }
  });
}
```

### 2.2 WebSocket Server (Vercel)

**Criar: `/api/ws/extension.ts`**

```typescript
import { Server } from 'socket.io';
import type { NextApiRequest } from 'next';
import { NextApiResponseServerIO } from '@/types/socket';
import { supabase } from '@/lib/supabase';

// Armazenar conexões ativas
const activeConnections = new Map<string, any>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server');
    
    const io = new Server(res.socket.server, {
      path: '/api/ws/extension',
      addTrailingSlash: false,
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });
    
    io.on('connection', (socket) => {
      console.log('Extension connected:', socket.id);
      
      // Registrar extensão
      socket.on('REGISTER', async (data) => {
        console.log('Extension registered:', data);
        
        const { deviceId, userId, browser } = data;
        
        // Salvar no banco
        await supabase.from('extension_devices').upsert({
          device_id: deviceId,
          user_id: userId,
          browser_info: browser,
          socket_id: socket.id,
          status: 'online',
          last_seen: new Date().toISOString()
        });
        
        // Armazenar conexão
        activeConnections.set(deviceId, socket);
        
        // Enviar confirmação
        socket.emit('REGISTERED', {
          success: true,
          deviceId
        });
        
        // Notificar dashboard
        io.to(`user_${userId}`).emit('EXTENSION_ONLINE', {
          deviceId,
          browser
        });
      });
      
      // Receber logs
      socket.on('LOG', async (log) => {
        console.log('Log received:', log);
        
        // Salvar no banco
        await supabase.from('ai_logs').insert({
          device_id: log.deviceId,
          action: log.action,
          message: log.message,