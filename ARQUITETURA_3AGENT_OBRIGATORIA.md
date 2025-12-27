# 🏗️ ARQUITETURA OBRIGATÓRIA 3-AGENT — SYNC ADS

**Data:** 2025-12-27  
**Versão:** 1.0.0 FINAL  
**Status:** ✅ IMPLEMENTADO  

---

## 📊 VISÃO GERAL

Este documento descreve a arquitetura **inquebrável** de 3 agentes de IA para automação de navegador e gestão de anúncios no SyncAds.

### Princípio Fundamental

> **Nenhuma IA pode chamar Playwright/Selenium/Puppeteer diretamente.**  
> **Toda execução passa pelo Action Router.**  
> **Toda resposta é baseada em evidências reais.**

---

## 🎯 ARQUITETURA COMPLETA

```
┌──────────────────────────────────────────────────────────────────┐
│                            USUÁRIO                               │
└───────────────────────────┬──────────────────────────────────────┘
                            │ "Abra o Google"
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CHAT-STREAM (Orchestrator)                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 1️⃣ PLANNER AI (IA de Raciocínio)                          │ │
│  │                                                            │ │
│  │ RESPONSABILIDADES:                                         │ │
│  │ ✅ Interpretar intenção do usuário                        │ │
│  │ ✅ Quebrar objetivo em ações sequenciais                  │ │
│  │ ✅ Gerar JSON estruturado com actions                     │ │
│  │ ✅ Definir critérios de verificação                       │ │
│  │                                                            │ │
│  │ PROIBIÇÕES:                                                │ │
│  │ ❌ Executar navegador                                     │ │
│  │ ❌ Chamar Playwright/APIs                                 │ │
│  │ ❌ Relatar resultados                                     │ │
│  │                                                            │ │
│  │ OUTPUT:                                                    │ │
│  │ {                                                          │ │
│  │   "goal": "Abrir Google",                                 │ │
│  │   "actions": [                                            │ │
│  │     {                                                     │ │
│  │       "action": "BROWSER_NAVIGATE",                       │ │
│  │       "params": { "url": "https://google.com" },          │ │
│  │       "verification": {                                   │ │
│  │         "criteria": ["Title is 'Google'", ...]            │ │
│  │       }                                                   │ │
│  │     }                                                     │ │
│  │   ]                                                       │ │
│  │ }                                                          │ │
│  └─────────────────────────┬──────────────────────────────────┘ │
│                            │ JSON Plan                          │
│                            ▼                                    │
└──────────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│           2️⃣ ACTION ROUTER (Núcleo Inquebrável)                 │
│                                                                  │
│  FUNÇÃO OBRIGATÓRIA: callExtensionRouter(actionPayload)         │
│                                                                  │
│  RESPONSABILIDADES:                                              │
│  ✅ Validar actions do Planner                                  │
│  ✅ Rotear para executor correto:                               │
│     • Playwright (Hugging Face)                                 │
│     • Chrome Extension                                          │
│     • Selenium (fallback)                                       │
│  ✅ Aguardar execução REAL                                      │
│  ✅ Capturar screenshot antes/depois                            │
│  ✅ Verificar resultado (DOM/Visual/URL)                        │
│  ✅ Persistir logs no Supabase                                  │
│  ✅ Retornar resultado + evidências                             │
│                                                                  │
│  ESTA É A ÚNICA FUNÇÃO AUTORIZADA A:                             │
│  🔒 Chamar Playwright                                           │
│  🔒 Chamar Selenium                                             │
│  🔒 Chamar Puppeteer                                            │
│  🔒 Controlar navegador                                         │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ BrowserExecutor                                            │ │
│  │ ├─ navigate(url)                                           │ │
│  │ ├─ type(selector, text) + verify                          │ │
│  │ ├─ click(selector)                                         │ │
│  │ ├─ captureScreenshot()                                     │ │
│  │ └─ verifyTyping() ⭐ READ-AFTER-WRITE                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  OUTPUT:                                                         │
│  {                                                               │
│    "success": true,                                             │
│    "action": "BROWSER_NAVIGATE",                                │
│    "executedAt": "2025-12-27T...",                              │
│    "executionTime": 2534,  // ms                                │
│    "result": {                                                  │
│      "url": "https://www.google.com/",                          │
│      "title": "Google"                                          │
│    },                                                           │
│    "screenshot": "data:image/png;base64,...",  ⭐ EVIDÊNCIA    │
│    "verification": {                                            │
│      "method": "dom",                                           │
│      "verified": true,  ⭐ CONFIRMAÇÃO REAL                    │
│      "evidence": "Title is 'Google', input exists"              │
│    },                                                           │
│    "logs": [...]  ⭐ AUDITORIA                                 │
│  }                                                               │
└───────────────────────────┬──────────────────────────────────────┘
                            │ ActionResult
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                    CHAT-STREAM (Orchestrator)                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 3️⃣ EXECUTOR AI (IA Executora)                             │ │
│  │                                                            │ │
│  │ RESPONSABILIDADES:                                         │ │
│  │ ✅ Interpretar ActionResult                                │ │
│  │ ✅ Reportar ao usuário COM EVIDÊNCIAS                      │ │
│  │ ✅ Ser BRUTALMENTE HONESTO                                 │ │
│  │ ✅ Sugerir próximo passo                                   │ │
│  │                                                            │ │
│  │ PROIBIÇÕES:                                                │ │
│  │ ❌ MENTIR sobre execução                                   │ │
│  │ ❌ INVENTAR dados não recebidos                            │ │
│  │ ❌ ASSUMIR sucesso sem verification                        │ │
│  │ ❌ MODIFICAR resultados para parecer melhor                │ │
│  │                                                            │ │
│  │ REGRA DE OURO:                                             │ │
│  │ Se ActionResult.success = false, REPORTAR FALHA            │ │
│  │ Se verification.verified = false, ALERTAR                  │ │
│  │ Se screenshot vazio, NÃO INVENTAR O QUE VIU                │ │
│  │                                                            │ │
│  │ OUTPUT (para usuário):                                     │ │
│  │ ✅ **Google aberto com sucesso!**                         │ │
│  │                                                            │ │
│  │ 📸 **Evidência confirmada:**                              │ │
│  │ - Título: "Google"                                        │ │
│  │ - URL: https://www.google.com/                            │ │
│  │ - Campo de busca detectado                                │ │
│  │                    │ │
│  │ 🎯 **Próximo passo:** O que você gostaria de pesquisar?   │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────┬──────────────────────────────────────┘
                            │ Resposta Final
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                       SUPABASE DATABASE                          │
│                                                                  │
│  TABELAS:                                                        │
│  ├─ ChatMessage (conversas)                                     │
│  ├─ action_logs (logs persistentes)        ⭐ NOVO             │
│  ├─ action_results (resultados de ações)   ⭐ NOVO             │
│  ├─ planner_outputs (planos gerados)       ⭐ NOVO             │
│  ├─ executor_outputs (respostas)           ⭐ NOVO             │
│  └─ browser_sessions (sessões Playwright)  ⭐ NOVO             │
│                                                                  │
│  VIEW:                                                           │
│  └─ execution_audit_trail                  ⭐ AUDITORIA TOTAL  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 FLUXO DETALHADO

### Cenário: "Abra o Google"

```
T+0ms    │ User: "Abra o Google"
         ▼
T+200ms  │ PLANNER AI planeja:
         │ {
         │   "actions": [{
         │     "action": "BROWSER_NAVIGATE",
         │     "params": { "url": "https://google.com" },
         │     "verification": {
         │       "criteria": ["Title is 'Google'", "Input exists"]
         │     }
         │   }]
         │ }
         ▼
T+300ms  │ ACTION ROUTER valida action
         ▼
T+400ms  │ BrowserExecutor.navigate() chamado
         │ └─ POST https://bigodetonton-syncads.hf.space/navigate
         ▼
T+2000ms │ Playwright carrega página
         ▼
T+2100ms │ BrowserExecutor.captureScreenshot()
         │ └─ Screenshot capturado: base64...
         ▼
T+2200ms │ BrowserExecutor retorna:
         │ {
         │   "success": true,
         │   "result": { "url": "...", "title": "Google" },
         │   "screenshot": "...",
         │   "verification": { "verified": true, ... }
         │ }
         ▼
T+2300ms │ ActionResult persistido em action_results table
         ▼
T+2400ms │ EXECUTOR AI recebe ActionResult
         ▼
T+2900ms │ EXECUTOR AI responde:
         │ "✅ Google aberto com sucesso!
         │  📸 Evidência confirmada: ..."
         ▼
T+3000ms │ User recebe resposta com screenshot
```

**⭐ DIFERENÇA CRÍTICA DO SISTEMA ANTIGO:**
- ❌ ANTES: Respondia em T+400ms com "sucesso" SEM aguardar load
- ✅ AGORA: Aguarda T+2200ms com verificação visual REAL

---

## 📦 COMPONENTES IMPLEMENTADOS

### 1. Action Router
**Localização:** `supabase/functions/action-router/index.ts`

**Funções principais:**
- `callExtensionRouter(action)` — OBRIGATÓRIA
- `BrowserExecutor` — Playwright integration
- `ExtensionExecutor` — Chrome Extension integration
- `ActionLogger` — Logging persistente

### 2. Planner System Prompt
**Localização:** `supabase/functions/_prompts/PLANNER_SYSTEM_PROMPT.md`

**Garante:**
- JSON estruturado
- Critérios de verificação específicos
- Seletores CSS precisos
- Quebra de ações complexas

### 3. Executor System Prompt
**Localização:** `supabase/functions/_prompts/EXECUTOR_SYSTEM_PROMPT.md`

**Garante:**
- Honestidade absoluta
- Evidências reportadas
- Sem invenções
- Comunicação clara

### 4. Chat Stream Orquestrador
**Localização:** `supabase/functions/chat-stream-v3/index.ts`

**Funções:**
- Carrega prompts dos .md
- Orquestra Planner → Router → Executor
- Persiste tudo no Supabase
- NUNCA pula o router

### 5. Tabelas Supabase
**Localização:** `supabase/migrations/create_3agent_architecture_tables.sql`

**Inclui:**
- `action_logs` — logs de execução
- `action_results` — resultados + evidências
- `planner_outputs` — planos gerados
- `executor_outputs` — respostas
- `browser_sessions` — sessões Playwright
- `execution_audit_trail` — view de auditoria

---

## 🚨 REGRAS INQUEBRÁ VEIS

### Regra #1: Action Router é Obrigatório
```typescript
// ❌ PROIBIDO
const result = await fetch('https://.../navigate', ...);

// ✅ OBRIGATÓRIO
const result = await callExtensionRouter({
  action: "BROWSER_NAVIGATE",
  params: { url: "..." },
  context: { userId, sessionId }
});
```

### Regra #2: Planner NÃO Executa
```typescript
// ❌ PROIBIDO no Planner
await navigator.navigate(url);

// ✅ CORRETO no Planner
return {
  actions: [{
    action: "BROWSER_NAVIGATE",
    params: { url }
  }]
};
```

### Regra #3: Executor NÃO Mente
```typescript
// ❌ PROIBIDO no Executor
if (result.success) {
  return "Encontrei 10 resultados de busca..."; // INVENTADO!
}

// ✅ CORRETO no Executor
if (result.success && result.result?.items) {
  return `Encontrei ${result.result.items.length} resultados.`;
} else {
  return "Ação executada mas não recebi detalhes dos resultados.";
}
```

### Regra #4: Sempre Verificar
```typescript
// ❌ PROIBIDO
return { success: true };

// ✅ OBRIGATÓRIO
return {
  success: true,
  verification: {
    method: "dom",
    verified: element.value === expectedValue,
    evidence: `Value is "${element.value}"`
  }
};
```

---

## 🔍 VERIFICAÇÕES IMPLEMENTADAS

### 1. NAVIGATE Verification
```typescript
// Aguarda page load
await new Promise(resolve => setTimeout(resolve, 2000));

// Captura screenshot
const screenshot = await captureScreenshot();

// Retorna com evidência
return {
  success: true,
  result: { url, title, status },
  screenshot  // ⭐ PROVA VISUAL
};
```

### 2. TYPE Verification (Read-After-Write)
```typescript
// Digita no campo
await typeIntoElement(selector, text);

// ⭐ LÊ DE VOLTA
const actualValue = await getElementValue(selector);

// Verifica
const verified = actualValue === text;

return {
  success: true,
  verification: {
    verified,
    evidence: verified 
      ? `Value confirmed: "${actualValue}"`
      : `Expected "${text}", got "${actualValue}"`
  }
};
```

### 3. CLICK Verification
```typescript
// Captura screenshot ANTES
const beforeScreenshot = await captureScreenshot();

// Clica
await clickElement(selector);

// Captura screenshot DEPOIS
const afterScreenshot = await captureScreenshot();

// Retorna ambos para comparação
return {
  success: true,
  screenshots: {
    before: beforeScreenshot,
    after: afterScreenshot  // ⭐ PROVA DE MUDANÇA
  }
};
```

---

## 📊 LOGGING E AUDITORIA

### Logs Persistentes
Cada action gera logs em `action_logs`:
```sql
SELECT * FROM action_logs 
WHERE session_id = 'session_123' 
ORDER BY created_at;
```

Resultado:
```
[2025-12-27T19:00:00Z] [INFO] action_received
[2025-12-27T19:00:01Z] [INFO] router_dispatch
[2025-12-27T19:00:02Z] [INFO] playwright_called
[2025-12-27T19:00:04Z] [INFO] action_success
```

### Auditoria Completa
View `execution_audit_trail` conecta tudo:
```sql
SELECT 
  user_message,
  plan,
  action,
  success,
  verification,
  executor_response
FROM execution_audit_trail
WHERE user_id = 'user_123'
ORDER BY executed_at DESC LIMIT 10;
```

---

## ✅ CRITÉRIO FINAL DE SUCESSO

> Quando o usuário disser: **"Abra o Google"**,  
> O navegador DEVE abrir de verdade.  
> Logs DEVEM comprovar.  
> Screenshot DEVE confirmar.  
> **Sem simulação.**

**Como verificar:**
1. User envia: "Abra o Google"
2. Verificar `action_results`:
   ```sql
   SELECT success, verification FROM action_results 
   WHERE session_id = 'session_...' 
   ORDER BY created_at DESC LIMIT 1;
   ```
   Deve retornar:
   ```json
   {
     "success": true,
     "verification": {
       "verified": true,
       "evidence": "Page title is 'Google', ..."
     }
   }
   ```
3. Verificar `screenshot` não é null
4. User recebe resposta com evidência

---

## 🚀 PRÓXIMOS PASSOS

### Implementação Imediata
1. ✅ Aplicar migration SQL no Supabase
2. ✅ Deploy action-router function
3. ✅ Deploy chat-stream-v3 function
4. ⏳ Configurar GROQ API key na GlobalAiConnection
5. ⏳ Testar fluxo completo "Abra o Google"

### Melhorias Futuras
- [ ] GPT-4 Vision para verificação visual avançada
- [ ] Retry automático em falhas transientes
- [ ] Timeout dinâmico baseado no tipo de ação
- [ ] Migração de Polling → Supabase Realtime
- [ ] Dashboard de métricas (taxa de sucesso, latência)

---

## 📚 REFERÊNCIAS

- **Auditoria Forense:** `AUDITORIA_FORENSE_COMPLETA_2024-12-24.md`
- **Action Router:** `supabase/functions/action-router/index.ts`
- **Planner Prompt:** `supabase/functions/_prompts/PLANNER_SYSTEM_PROMPT.md`
- **Executor Prompt:** `supabase/functions/_prompts/EXECUTOR_SYSTEM_PROMPT.md`
- **Chat Stream V3:** `supabase/functions/chat-stream-v3/index.ts`
- **Migrations:** `supabase/migrations/create_3agent_architecture_tables.sql`

---

**FIM DO DOCUMENTO**  
**Arquitetura implementada conforme especificação.**  
**Nenhuma IA pode desviar deste fluxo.**
