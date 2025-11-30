# 🤖 AUDITORIA COMPLETA E PROFUNDA - SISTEMA DE IA SYNCADS
## Data: Janeiro 2025 | Foco: Dual Intelligence System

---

## 📋 ÍNDICE

1. [Resumo Executivo](#resumo-executivo)
2. [Arquitetura do Sistema de IA](#arquitetura-do-sistema-de-ia)
3. [Mapeamento de Fluxos de IA](#mapeamento-de-fluxos-de-ia)
4. [Análise de Componentes](#análise-de-componentes)
5. [Problemas Críticos Identificados](#problemas-críticos-identificados)
6. [Correções Aplicadas](#correções-aplicadas)
7. [Plano de Correções Pendentes](#plano-de-correções-pendentes)
8. [Testes e Validação](#testes-e-validação)
9. [Checklist Final](#checklist-final)

---

## 🎯 RESUMO EXECUTIVO

### Objetivo da Auditoria
Analisar profundamente o sistema **Dual Intelligence** do SyncAds AI, identificando bugs, vulnerabilidades, código duplicado, e oportunidades de otimização no fluxo de IA.

### Componentes Auditados
- ✅ Chat Principal (SaaS Web)
- ✅ Chat da Extensão Chrome/Edge
- ✅ Edge Function `chat-enhanced` (Supabase)
- ✅ Python AI Service (Railway)
- ✅ Sistema de Roteamento (EXTENSION vs PYTHON_AI)
- ✅ Manipulação DOM via Extensão
- ✅ Integrações de IA (Anthropic, OpenAI, Groq)

### Status Atual
- **Funcionalidade Geral:** 🟡 Parcialmente Funcional (70%)
- **Segurança:** 🟡 Média (necessita melhorias)
- **Performance:** 🟠 Baixa (necessita otimização urgente)
- **Código:** 🟠 Qualidade Média (muito código duplicado)

### Principais Descobertas
1. ✅ **CORRIGIDO:** Tabela `extension_commands` com nome e campos inconsistentes
2. ✅ **CORRIGIDO:** Polling de comandos implementado (5s)
3. ⚠️ **CRÍTICO:** Edge Function `chat-enhanced` com 2600+ linhas (muito grande)
4. ⚠️ **CRÍTICO:** Falta chat completo dentro da extensão
5. ⚠️ **ALTO:** System prompt muito longo exposto no front-end
6. ⚠️ **ALTO:** Python Service sem retry para erros
7. ⚠️ **MÉDIO:** Falta cache para respostas de IA
8. ⚠️ **MÉDIO:** Rate limiting muito agressivo

---

## 🏗️ ARQUITETURA DO SISTEMA DE IA

### Visão Geral - Dual Intelligence

```
┌─────────────────────────────────────────────────────────────────┐
│                    SYNCADS DUAL INTELLIGENCE                     │
│                                                                  │
│  Usuário → Chat → Router → [EXTENSION | PYTHON_AI] → Resultado │
└─────────────────────────────────────────────────────────────────┘

                              Router Decision
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            ┌───────▼─────────┐           ┌────────▼────────┐
            │   EXTENSION     │           │   PYTHON_AI     │
            │  (Rápido/DOM)   │           │ (Complexo/IA)   │
            └───────┬─────────┘           └────────┬────────┘
                    │                               │
        ┌───────────┴───────────┐      ┌───────────┴────────────┐
        │                       │      │                        │
    ┌───▼────┐            ┌────▼───┐  │  ┌──────────────────┐  │
    │Content │            │Polling │  │  │ Browser-Use      │  │
    │Script  │◄───────────┤5s      │  │  │ AgentQL          │  │
    │        │            │        │  │  │ Vision AI        │  │
    └────────┘            └────────┘  │  │ Playwright       │  │
                                      │  └──────────────────┘  │
                                      │                        │
                                      │  Railway Python Service│
                                      └────────────────────────┘
```

### Fluxo de Decisão do Router

```typescript
// Localização: supabase/functions/_utils/command-router.ts

function routeCommand(message: string, context: Context): Decision {
  
  // 1. Detecta padrões de comando DOM simples
  if (isDOMCommand(message)) {
    return {
      executor: "EXTENSION",
      confidence: 0.9,
      reason: "Comando DOM simples detectado"
    };
  }
  
  // 2. Detecta necessidade de IA complexa
  if (needsComplexAI(message)) {
    return {
      executor: "PYTHON_AI",
      confidence: 0.85,
      reason: "Requer processamento IA avançado"
    };
  }
  
  // 3. Fallback: usa IA do Supabase
  return {
    executor: "SUPABASE_AI",
    confidence: 0.5,
    reason: "Resposta direta da IA"
  };
}
```

### Componentes Principais

#### 1. Chat SaaS Web (Front-end)
```
Localização: src/pages/app/ChatPage.tsx
Linhas: ~1000
Complexidade: ALTA
Status: ✅ Funcional | ⚠️ Precisa refatoração
```

**Responsabilidades:**
- Interface do chat principal
- Envio de mensagens para Edge Function
- Display de respostas (streaming/JSON)
- Gerenciamento de conversações
- Detecção de status da extensão
- Polling de resultados de comandos

**Problemas Identificados:**

1. **CRÍTICO - System Prompt Exposto no Cliente**
```typescript
// ❌ PROBLEMA: System prompt muito longo no front-end (linhas 632-665)
systemPrompt: JSON.stringify({
  role: "system",
  content: extensionStatus.connected
    ? `🚀 EXTENSÃO DO NAVEGADOR ATIVA - MODO DE AUTOMAÇÃO WEB
    
    **REGRAS CRÍTICAS:**
    1. **NUNCA mostre blocos JSON ao usuário**
    ... (50+ linhas de instruções)
    `
    : "Extensão do navegador OFFLINE..."
})

// ✅ SOLUÇÃO: Mover para Edge Function
// O front-end NÃO deve enviar o system prompt
// A Edge Function deve gerenciar isso internamente
```

2. **ALTO - Polling Ineficiente de Resultados**
```typescript
// ❌ PROBLEMA: Polling a cada 3s para verificar comandos (linhas 404-449)
const checkCommandResults = async () => {
  // Query ao banco a cada 3 segundos
  const { data: completedCommands } = await supabase
    .from("ExtensionCommand") // ❌ Nome errado!
    .select("*")
    .in("id", commandIds)
    .eq("status", "completed");
};

// ✅ SOLUÇÃO: Usar Supabase Realtime
supabase
  .channel('commands')
  .on('postgres_changes', {
    event: 'UPDATE',
    schema: 'public',
    table: 'extension_commands',
    filter: `status=eq.completed`
  }, (payload) => {
    processCommandResult(payload.new);
  })
  .subscribe();
```

3. **MÉDIO - Lógica de IA Status Simplista**
```typescript
// ❌ PROBLEMA: Detecção de intenção muito básica (linhas 565-586)
const msgLower = userMessage.toLowerCase();
if (msgLower.includes("pesquis") || msgLower.includes("busca")) {
  setAiStatus("searching");
} else if (msgLower.includes("abr") || msgLower.includes("naveg")) {
  setAiStatus("navigating");
}

// ✅ SOLUÇÃO: Delegar para o Router na Edge Function
// O front-end não deve tentar adivinhar a intenção
```

4. **BAIXO - Falta Tratamento de Erros Específicos**
```typescript
// ❌ PROBLEMA: Erro genérico (linhas 735-748)
} catch (error) {
  toast({
    title: "Erro ao enviar mensagem",
    description: error.message || "Tente novamente.",
    variant: "destructive",
  });
}

// ✅ SOLUÇÃO: Tratar erros específicos
if (error.status === 429) {
  // Rate limit
} else if (error.status === 401) {
  // Token expirado
} else if (error.status === 500) {
  // Erro do servidor
}
```

---

#### 2. Edge Function `chat-enhanced`
```
Localização: supabase/functions/chat-enhanced/index.ts
Linhas: ~2600 (!!!)
Complexidade: MUITO ALTA
Status: ⚠️ Funcional mas insustentável
```

**Responsabilidades (MUITAS - viola SRP):**
- ✅ Autenticação e validação
- ✅ Rate limiting
- ✅ Busca configuração IA global
- ✅ Detecção de comandos DOM
- ✅ Roteamento (EXTENSION vs PYTHON_AI)
- ✅ Tool calling (Groq, OpenAI)
- ✅ Integração com Python Service
- ✅ Cache de respostas
- ✅ Salvamento de mensagens
- ✅ Analytics
- ✅ Streaming de resposta

**Problemas Críticos:**

1. **CRÍTICO - Arquivo Gigante e Insustentável**
```
Linhas: 2600+
Complexidade Ciclomática: MUITO ALTA
Manutenibilidade: BAIXA
Performance: RUIM (cold start ~3s)
```

**Solução:**
```
Refatorar em módulos:
├── chat-enhanced/
│   ├── index.ts (orquestrador - 200 linhas)
│   ├── auth.ts (autenticação - 100 linhas)
│   ├── router.ts (decisão de executor - 150 linhas)
│   ├── extension-handler.ts (comandos extensão - 200 linhas)
│   ├── python-handler.ts (Python Service - 150 linhas)
│   ├── ai-handler.ts (Anthropic/OpenAI/Groq - 300 linhas)
│   ├── tool-calling.ts (ferramentas - 400 linhas)
│   ├── cache.ts (cache Redis - 100 linhas)
│   └── analytics.ts (métricas - 100 linhas)
```

2. **ALTO - Correção Aplicada Mas Incompleta**
```typescript
// ✅ CORRIGIDO: Nome da tabela (linha 2450)
const { data: savedCommand, error: cmdError } = await supabase
  .from("extension_commands") // ✅ Antes: "ExtensionCommand"
  .insert({
    device_id: deviceId,      // ✅ Antes: deviceId
    user_id: user.id,          // ✅ Antes: userId
    type: command.type,        // ✅ Antes: command
    data: command.data || {},  // ✅ Antes: params
    status: "pending",         // ✅ Antes: PENDING
  });

// ⚠️ MAS: Ainda falta validação de campos obrigatórios
// ⚠️ MAS: Não verifica se device está online
// ⚠️ MAS: Não define timeout para o comando
```

3. **ALTO - Rate Limiting Muito Agressivo**
```typescript
// ❌ PROBLEMA: Pode bloquear usuários legítimos (linhas 86-95)
const rateLimitResult = await checkRateLimit(user.id, {
  requestsPerMinute: 20,  // ⚠️ Muito baixo para testes
  requestsPerHour: 100,   // ⚠️ Muito baixo para usuários ativos
  requestsPerDay: 500,
});

// ✅ SOLUÇÃO: Ajustar limites por plano
const limits = getUserLimits(user.plan);
// Free: 10/min, 50/hour
// Pro: 50/min, 500/hour
// Enterprise: sem limite
```

4. **MÉDIO - Falta Timeout para Python Service**
```typescript
// ❌ PROBLEMA: Pode travar indefinidamente (linhas 351-368)
const pythonResponse = await fetch(
  `${PYTHON_SERVICE_URL}/browser-automation/execute`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      task: command_message,
      context: { /* ... */ }
    })
  }
  // ❌ Sem timeout!
);

// ✅ SOLUÇÃO: Adicionar timeout e retry
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s

try {
  const pythonResponse = await fetch(url, {
    ...options,
    signal: controller.signal
  });
} finally {
  clearTimeout(timeoutId);
}
```

5. **MÉDIO - System Prompt Hardcoded**
```typescript
// ❌ PROBLEMA: Prompt muito longo e fixo (linhas 521-928)
const defaultSystemPrompt = `
  Você é o SyncAds AI...
  (400+ linhas de texto fixo)
`;

// ✅ SOLUÇÃO: Mover para tabela SystemPrompts
// Permite edição via admin panel
// Versionamento de prompts
// A/B testing de prompts
```

---

#### 3. Extensão Chrome - background.js
```
Localização: chrome-extension/background.js
Linhas: ~1500
Complexidade: ALTA
Status: ✅ Funcional | ✅ Correções aplicadas
```

**Arquitetura:**
```
Service Worker (background.js)
    │
    ├─► Autenticação (handleAuthToken)
    ├─► Registro de Device (registerDevice)
    ├─► Heartbeat (sendHeartbeat - 30s)
    ├─► Polling de Comandos (checkPendingCommands - 5s)
    └─► Processamento (processCommand)
            │
            └─► Envia para Content Script
                    │
                    └─► Executa no DOM
                            │
                            └─► Retorna Resultado
```

**Correções Aplicadas:**

1. ✅ **commandTimer Adicionado ao State**
```javascript
// Antes (linha 76):
let state = {
  deviceId: null,
  userId: null,
  // ...
  keepAliveTimer: null,
  // ❌ commandTimer faltando
};

// Depois (linha 92):
let state = {
  // ...
  keepAliveTimer: null,
  commandTimer: null, // ✅ Adicionado
};
```

2. ✅ **Polling Funcionando**
```javascript
// Localização: linha 335-351
function startKeepAlive() {
  // Main keep-alive
  state.keepAliveTimer = setInterval(() => {
    chrome.runtime.getPlatformInfo().catch(() => {});
  }, CONFIG.keepAlive.interval);

  // Command polling ✅ Funcionando
  if (state.commandTimer) clearInterval(state.commandTimer);
  state.commandTimer = setInterval(checkPendingCommands, 5000); // 5s
}
```

**Problemas Pendentes:**

1. **MÉDIO - Polling Ineficiente (deve usar Realtime)**
```javascript
// ❌ PROBLEMA ATUAL: Query a cada 5 segundos (linha 129-170)
async function checkPendingCommands() {
  const response = await fetch(
    `${CONFIG.restUrl}/extension_commands?device_id=eq.${state.deviceId}&status=eq.pending`,
    { /* ... */ }
  );
  // Isso gera muitas queries desnecessárias
}

// ✅ SOLUÇÃO: Usar Supabase Realtime
const supabase = createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);

supabase
  .channel('extension-commands')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'extension_commands',
    filter: `device_id=eq.${state.deviceId}&status=eq.pending`
  }, (payload) => {
    processCommand(payload.new);
  })
  .subscribe();
```

2. **MÉDIO - Falta Retry para Comandos Failed**
```javascript
// ❌ PROBLEMA: Comando que falha fica failed para sempre (linha 172-231)
async function processCommand(cmd) {
  try {
    // ... executa comando
    await updateCommandStatus(cmd.id, "completed", { result });
  } catch (error) {
    await updateCommandStatus(cmd.id, "failed", { error: error.message });
    // ❌ Fim. Não tenta novamente.
  }
}

// ✅ SOLUÇÃO: Implementar retry com backoff
async function processCommandWithRetry(cmd, retryCount = 0) {
  const MAX_RETRIES = 3;
  try {
    // ... executa comando
  } catch (error) {
    if (retryCount < MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
      await sleep(delay);
      return processCommandWithRetry(cmd, retryCount + 1);
    } else {
      await updateCommandStatus(cmd.id, "failed", { 
        error: error.message,
        retries: retryCount 
      });
    }
  }
}
```

3. **BAIXO - Token Refresh Pode Falhar Silenciosamente**
```javascript
// ⚠️ PROBLEMA: Erro não notifica usuário (linha 581-645)
async function refreshAccessToken() {
  try {
    const response = await fetch(/* ... */);
    const data = await response.json();
    
    if (data.error) {
      Logger.error("Token refresh failed", data.error);
      // ❌ Não notifica o usuário!
      return false;
    }
    // ...
  } catch (error) {
    Logger.error("Token refresh error", error);
    return false; // ❌ Silencioso
  }
}

// ✅ SOLUÇÃO: Notificar usuário e redirecionar para login
if (!refreshed) {
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Sessão Expirada',
    message: 'Por favor, faça login novamente.'
  });
  
  chrome.tabs.create({ 
    url: `${CONFIG.supabaseUrl}/auth/login` 
  });
}
```

---

#### 4. Extensão Chrome - content-script.js
```
Localização: chrome-extension/content-script.js
Linhas: ~800
Complexidade: MÉDIA
Status: ✅ Funcional
```

**Responsabilidades:**
- Detecção automática de login (✅ funcionando)
- Execução de comandos DOM
- Feedback visual

**Problemas Identificados:**

1. **MÉDIO - Seletores CSS Frágeis**
```javascript
// ❌ PROBLEMA: Seletor pode quebrar facilmente
async function executeCommand(message) {
  if (message.command === "DOM_CLICK") {
    const element = document.querySelector(message.params.selector);
    if (element) {
      element.click();
    } else {
      throw new Error("Element not found");
      // ❌ Falha imediata
    }
  }
}

// ✅ SOLUÇÃO: Tentar múltiplos seletores com retry
async function findElement(selectors, maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    for (const selector of selectors) {
      try {
        // Tenta CSS selector
        let element = document.querySelector(selector);
        if (element) return element;
        
        // Tenta XPath
        element = document.evaluate(
          selector, 
          document, 
          null, 
          XPathResult.FIRST_ORDERED_NODE_TYPE, 
          null
        ).singleNodeValue;
        if (element) return element;
      } catch (e) {
        continue;
      }
    }
    await sleep(500); // Aguarda 500ms antes de retry
  }
  throw new Error("Element not found after retries");
}
```

2. **BAIXO - Feedback Visual Básico**
```javascript
// ⚠️ PROBLEMA: Feedback visual muito simples
// Apenas um alert ou console.log

// ✅ SOLUÇÃO: Feedback visual rico
function showVisualFeedback(type, message) {
  const toast = document.createElement('div');
  toast.className = 'syncads-toast';
  toast.innerHTML = `
    <div class="toast-icon">${getIcon(type)}</div>
    <div class="toast-message">${message}</div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Highlight do elemento clicado
function highlightElement(element) {
  element.style.outline = '3px solid #00ff00';
  element.style.outlineOffset = '2px';
  setTimeout(() => {
    element.style.outline = '';
  }, 2000);
}
```

---

#### 5. Python AI Service (Railway)
```
Localização: python-service/app/main.py
Linhas: ~600
Framework: FastAPI
Status: ✅ Funcional | ⚠️ Módulos incompletos
```

**Endpoints:**
- `GET /health` ✅ Funcionando
- `POST /api/chat` ✅ Funcionando (streaming)
- `POST /browser-automation/execute` ✅ Funcionando (fallback)

**Problemas Identificados:**

1. **ALTO - Módulos browser_ai Incompletos**
```python
# Localização: python-service/app/browser_ai/
# ⚠️ PROBLEMA: Importações podem falhar

from app.browser_ai.agent import BrowserAgent
from app.browser_ai.vision import VisionAI
from app.browser_ai.agentql import AgentQL

# ❌ Esses módulos podem não existir ou estar incompletos
# ❌ Sem fallback gracioso

# ✅ SOLUÇÃO: Importação defensiva
try:
    from app.browser_ai.agent import BrowserAgent
    BROWSER_AGENT_AVAILABLE = True
except ImportError:
    BROWSER_AGENT_AVAILABLE = False
    logger.warning("BrowserAgent not available")

# No endpoint:
if task_type == "automation" and BROWSER_AGENT_AVAILABLE:
    result = await BrowserAgent.execute(task)
else:
    result = {"status": "mock", "message": "Browser automation not available"}
```

2. **MÉDIO - Falta Rate Limiting**
```python
# ❌ PROBLEMA: Endpoint sem rate limiting
@app.post("/browser-automation/execute")
async def execute_automation(request: AutomationRequest):
    # Qualquer um pode chamar ilimitadamente
    return await process_automation(request)

# ✅ SOLUÇÃO: Implementar rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/browser-automation/execute")
@limiter.limit("10/minute")  # 10 requests por minuto por IP
async def execute_automation(
    request: AutomationRequest,
    remote_addr: str = Depends(get_remote_address)
):
    return await process_automation(request)
```

3. **MÉDIO - Logs Não Estruturados**
```python
# ❌ PROBLEMA: Logs simples (difícil de filtrar/analisar)
print(f"Processing task: {task}")
print(f"Result: {result}")

# ✅ SOLUÇÃO: Logging estruturado (JSON)
import logging
import json

logger = logging.getLogger(__name__)

logger.info(json.dumps({
    "event": "task_processing",
    "task_id": task.id,
    "task_type": task.type,
    "user_id": task.user_id,
    "timestamp": datetime.utcnow().isoformat()
}))

logger.info(json.dumps({
    "event": "task_completed",
    "task_id": task.id,
    "result": result,
    "duration_ms": elapsed_time,
    "timestamp": datetime.utcnow().isoformat()
}))
```

4. **BAIXO - Falta Health Check Detalhado**
```python
# ❌ PROBLEMA ATUAL: Health check muito simples
@app.get("/health")
async def health():
    return {"status": "healthy"}

# ✅ SOLUÇÃO: Health check detalhado
@app.get("/health")
async def health():
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "1.0.0",
        "services": {}
    }
    
    # Check Supabase
    try:
        supabase_response = await supabase.rpc("ping").execute()
        health_status["services"]["supabase"] = "connected"
    except:
        health_status["services"]["supabase"] = "disconnected"
        health_status["status"] = "degraded"
    
    # Check Browser AI modules
    health_status["services"]["browser_ai"] = {
        "agent": BROWSER_AGENT_AVAILABLE,
        "vision": VISION_AI_AVAILABLE,
        "agentql": AGENTQL_AVAILABLE
    }
    
    return health_status
```

---

#### 6. Command Router (Decisão de Executor)
```
Localização: supabase/functions/_utils/command-router.ts
Linhas: ~300
Complexidade: MÉDIA
Status: ✅ Funcional | ⚠️ Pode melhorar
```

**Lógica Atual:**
```typescript
export function routeCommand(
  message: string,
  context: RoutingContext
): RoutingDecision {
  
  const lowerMsg = message.toLowerCase();
  
  // 1. Comandos DOM simples → EXTENSION
  if (
    lowerMsg.includes("abra") ||
    lowerMsg.includes("abrir") ||
    lowerMsg.includes("navegue") ||
    lowerMsg.includes("vá para") ||
    lowerMsg.includes("acess")
  ) {
    return {
      executor: "EXTENSION",
      confidence: 0.85,
      reason: "Navegação simples detectada",
      command_type: "NAVIGATE"
    };
  }
  
  // 2. Comandos complexos → PYTHON_AI
  if (
    lowerMsg.includes("criar campanha") ||
    lowerMsg.includes("analisar") ||
    lowerMsg.includes("gerar relatório") ||
    lowerMsg.includes("otimizar")
  ) {
    return {
      executor: "PYTHON_AI",
      confidence: 0.9,
      reason: "Tarefa complexa que requer IA",
      command_type: "AI_TASK"
    };
  }
  
  // 3. Fallback → SUPABASE_AI (resposta direta)
  return {
    executor: "SUPABASE_AI",
    confidence: 0.5,
    reason: "Resposta conversacional",
    command_type: "CHAT"
  };
}
```

**Problemas Identificados:**

1. **MÉDIO - Detecção Baseada em Keywords (limitado)**
```typescript
// ❌ PROBLEMA: Apenas keywords (não entende contexto)
if (lowerMsg.includes("abra") || lowerMsg.includes("abrir")) {
  return { executor: "EXTENSION" };
}

// Falha em casos como:
// - "Não consigo abrir o arquivo" (não é comando de navegação)
// - "Como abro uma campanha?" (é pergunta, não comando)
// - "Open Facebook" (inglês)

// ✅ SOLUÇÃO: Usar IA para classificação
async function routeCommandWithAI(message: string) {
  const classification = await classifyIntent(message);
  
  switch (classification.intent) {
    case "navigate":
      return { executor: "EXTENSION", command_type: "NAVIGATE" };
    case "dom_interaction":
      return { executor: "EXTENSION", command_type: "DOM_ACTION" };
    case "complex_task":
      return { executor: "PYTHON_AI", command_type: "AI_TASK" };
    case "question":
      return { executor: "SUPABASE_AI", command_type: "CHAT" };
    default:
      return { executor: "SUPABASE_AI", command_type: "CHAT" };
  }
}

// Usar LLM leve para classificação (ex: Claude Haiku)
async function classifyIntent(message: string) {
  const response = await anthropic.messages.create({
    model: "claude-3-haiku-20240307",
    max_tokens: 100,
    messages: [{
      role: "user",
      content: `Classifique a intenção:
      
      Mensagem: "${message}"
      
      Opções:
      - navigate: usuário quer abrir URL/página
      - dom_interaction: usuário quer clicar/preencher/ler elemento
      - complex_task: requer IA para criar/analisar/otimizar
      - question: pergunta conversacional
      
      Responda apenas a categoria.`
    }]
  });
  
  return { intent: response.content[0].text.trim() };
}
```

2. **BAIXO - Falta Logging de Decisões**
```typescript
// ⚠️ PROBLEMA: Não registra decisões para análise

// ✅ SOLUÇÃO: Logar todas as decisões
export async function route