# 🚀 PLANO ESTRATÉGICO COMPLETO - IA & AUTOMAÇÃO
## SyncAds Marketing AI - Arquitetura Inteligente Multi-LLM

**Versão:** 1.0  
**Data:** 27/01/2025  
**Status:** 📋 Planejamento Estratégico  
**Prioridade:** 🔥 CRÍTICA - Pré-Lançamento

---

## 📑 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Arquitetura de Decisão](#arquitetura-de-decisão)
3. [Mapeamento de Capacidades](#mapeamento-de-capacidades)
4. [Bibliotecas de Automação](#bibliotecas-de-automação)
5. [Sistema de Roteamento Inteligente](#sistema-de-roteamento-inteligente)
6. [Implementação Técnica](#implementação-técnica)
7. [Casos de Uso](#casos-de-uso)
8. [Otimizações e Melhorias](#otimizações-e-melhorias)
9. [Roadmap de Implementação](#roadmap-de-implementação)

---

## 1️⃣ VISÃO GERAL

### 🎯 Objetivo

Criar um **sistema inteligente de orquestração de IA** que:
- ✅ Seleciona automaticamente a **melhor IA** para cada tarefa
- ✅ Integra **múltiplas bibliotecas** de automação web
- ✅ Otimiza **custos** e **performance**
- ✅ Garante **fallback** em caso de falha
- ✅ Escala conforme demanda do usuário

### 🧠 IAs Disponíveis

| IA | Velocidade | Custo | Multimodal | Contexto | Especialidade |
|----|-----------|-------|------------|----------|--------------|
| **Groq (Llama 3.3 70B)** | ⚡⚡⚡⚡⚡ | 🟢 GRÁTIS | ❌ | 128K | Chat rápido, Análise |
| **Gemini 2.0 Flash** | ⚡⚡⚡⚡ | 🟢 GRÁTIS | ✅ | 1M | Imagens, Vídeos, Docs |
| **Claude 3.5 Sonnet** | ⚡⚡ | 🔴 PAGO | ❌ | 200K | Código, Lógica complexa |
| **GPT-4o** | ⚡⚡ | 🔴 PAGO | ✅ | 128K | Geral, Visão |

### 🛠️ Bibliotecas de Automação

| Biblioteca | Função | Complexidade | Performance |
|-----------|--------|--------------|-------------|
| **Extensão SyncAds** | DOM direto, interação real-time | Baixa | ⚡⚡⚡⚡⚡ |
| **LiteWebAgent** | Navegação leve, scraping básico | Baixa | ⚡⚡⚡⚡ |
| **Browser-Use** | Automação inteligente com LLM | Média | ⚡⚡⚡ |
| **Agentic AI Browser** | Agente autônomo multi-passo | Alta | ⚡⚡ |
| **Playwright (Steel.dev)** | Browser headless em nuvem | Média | ⚡⚡⚡⚡ |

---

## 2️⃣ ARQUITETURA DE DECISÃO

### 🧩 Sistema de Roteamento Inteligente (AI Router)

```
┌─────────────────────────────────────────────────────────────────┐
│                    USUÁRIO FAZ PERGUNTA                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AI ROUTER (Classificador)                    │
│  Analisa: Intenção, Tipo de Tarefa, Recursos Necessários       │
└────────────┬────────────────┬────────────────┬──────────────────┘
             │                │                │
             ▼                ▼                ▼
    ┌────────────┐   ┌────────────┐   ┌────────────┐
    │   GROQ     │   │  GEMINI    │   │  CLAUDE    │
    │  (Rápido)  │   │(Multimodal)│   │  (Lógica)  │
    └─────┬──────┘   └─────┬──────┘   └─────┬──────┘
          │                │                │
          └────────────────┼────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  RESPOSTA AO USUÁRIO   │
              └────────────────────────┘
```

### 📊 Fluxo de Decisão (Decision Tree)

```javascript
function selectAI(userMessage, context) {
  // 1️⃣ ANÁLISE DE INTENÇÃO
  const intent = analyzeIntent(userMessage);
  
  // 2️⃣ VERIFICAÇÃO DE RECURSOS
  if (needsImageGeneration(intent)) {
    return "GEMINI"; // Único com geração de imagem
  }
  
  if (needsVideoAnalysis(intent)) {
    return "GEMINI"; // Melhor para vídeo
  }
  
  if (needsCodeGeneration(intent)) {
    return "CLAUDE"; // Melhor para código
  }
  
  // 3️⃣ ANÁLISE DE COMPLEXIDADE
  if (isComplexReasoning(intent)) {
    return "CLAUDE"; // Melhor lógica
  }
  
  // 4️⃣ DEFAULT (VELOCIDADE + CUSTO)
  return "GROQ"; // Mais rápido e gratuito
}
```

---

## 3️⃣ MAPEAMENTO DE CAPACIDADES

### 🟢 GROQ (Llama 3.3 70B) - IA Principal

**Quando Usar:**
- ✅ Chat conversacional rápido
- ✅ Análise de texto simples
- ✅ Respostas rápidas (FAQ)
- ✅ Análise de métricas de marketing
- ✅ Geração de copy curto
- ✅ Sugestões de campanhas
- ✅ Análise de público-alvo

**Limitações:**
- ❌ Sem geração de imagens
- ❌ Sem análise de vídeo/imagem
- ❌ Contexto menor que Gemini

**Exemplo de Uso:**
```typescript
// Chat rápido
"Como posso melhorar meu CTR?"
"Quais métricas devo acompanhar?"
"Crie um copy para meu anúncio"
```

### 🔵 GEMINI 2.0 Flash - IA Multimodal

**Quando Usar:**
- ✅ **Geração de imagens** (única com essa capacidade!)
- ✅ Análise de vídeos/imagens
- ✅ Leitura de PDFs/documentos
- ✅ Análise de anúncios visuais
- ✅ Geração de banners/criativos
- ✅ OCR (extrair texto de imagens)
- ✅ Análise de concorrentes (screenshots)

**Vantagens:**
- ✅ 1M tokens de contexto (MAIOR)
- ✅ Multimodal nativo
- ✅ GRATUITO com rate limits generosos

**Exemplo de Uso:**
```typescript
// Geração de imagem
"Crie um banner 1200x628 para Black Friday"
"Gere uma imagem de produto para Instagram"

// Análise visual
"Analise este anúncio e sugira melhorias" (+ imagem)
"Extraia texto desta captura de tela" (+ imagem)
```

### 🟣 CLAUDE 3.5 Sonnet - IA de Lógica

**Quando Usar:**
- ✅ Geração de código complexo
- ✅ Análise lógica profunda
- ✅ Debugging e refatoração
- ✅ Planejamento estratégico
- ✅ Análise de dados complexos
- ✅ Criação de scripts/automações

**Limitações:**
- 🔴 PAGO (reserve para tarefas premium)
- ❌ Sem multimodal

**Exemplo de Uso:**
```typescript
// Código/lógica
"Crie um script para automatizar X"
"Analise estes dados e encontre padrões"
"Refatore este código para melhor performance"
```

---

## 4️⃣ BIBLIOTECAS DE AUTOMAÇÃO

### 🎯 Quando Usar Cada Biblioteca

#### 1. **Extensão SyncAds** (Atual)
**Prioridade:** 🔥 ALTA  
**Status:** ✅ Implementado

**Usar para:**
- ✅ Interação direta com páginas já abertas
- ✅ Leitura de DOM em tempo real
- ✅ Cliques, preenchimento de formulários
- ✅ Captura de dados da página ativa

**Vantagens:**
- Sem overhead de abrir novos navegadores
- Acesso direto ao contexto do usuário
- Ultra rápido (DOM já carregado)

**Limitações:**
- Requer usuário já estar na página
- Não pode abrir páginas novas de forma autônoma

**Exemplo:**
```javascript
// Usuário está no Facebook Ads
"Leia os valores da última campanha"
→ Extensão lê DOM atual
```

---

#### 2. **LiteWebAgent** (Novo)
**Prioridade:** 🟡 MÉDIA  
**Status:** 🔄 A Implementar

**Usar para:**
- ✅ Scraping leve e rápido
- ✅ Navegação simples (clicar, preencher)
- ✅ Extração de dados estruturados
- ✅ Monitoramento de páginas

**Vantagens:**
- Leve e rápido
- Fácil de implementar
- Sem dependências pesadas

**Limitações:**
- Não lida com SPAs complexos
- Sem execução de JavaScript avançado

**Implementação:**
```python
# Railway - python-service/app/automation/lite_web_agent.py
from litewebagent import WebAgent

class LiteWebAutomation:
    def __init__(self):
        self.agent = WebAgent()
    
    async def scrape_simple(self, url: str, selector: str):
        page = await self.agent.goto(url)
        data = await page.query(selector)
        return data
```

**Casos de Uso:**
```
- "Monitore o preço deste produto"
- "Extraia os emails desta página"
- "Verifique se há novos posts no blog X"
```

---

#### 3. **Browser-Use** (Novo)
**Prioridade:** 🔥 ALTA  
**Status:** 🔄 A Implementar

**Usar para:**
- ✅ Automação **inteligente** com LLM
- ✅ Tarefas que requerem "entendimento"
- ✅ Navegação adaptativa (páginas mudam)
- ✅ Preenchimento de formulários complexos

**Vantagens:**
- **IA decide os próximos passos**
- Lida com mudanças na interface
- Mais "humano" e resiliente

**Como Funciona:**
```
Usuário: "Crie um anúncio no Google Ads"
  ↓
Browser-Use + Groq:
  1. Abre Google Ads
  2. Clica em "Nova Campanha" (IA identifica botão)
  3. Preenche formulário (IA entende campos)
  4. Revisa e confirma
```

**Implementação:**
```python
# Railway - python-service/app/automation/browser_use.py
from browser_use import Agent
from langchain.chat_models import ChatGroq

class BrowserUseAutomation:
    def __init__(self):
        self.llm = ChatGroq(model="llama-3.3-70b-versatile")
        self.agent = Agent(
            task="Criar campanha no Google Ads",
            llm=self.llm
        )
    
    async def execute_task(self, task: str):
        result = await self.agent.run()
        return result
```

**Casos de Uso:**
```
- "Crie uma campanha no Facebook Ads"
- "Publique este post no LinkedIn"
- "Configure pixel do Facebook no site X"
```

---

#### 4. **Agentic AI Browser** (Novo)
**Prioridade:** 🟡 MÉDIA  
**Status:** 🔄 A Implementar

**Usar para:**
- ✅ Tarefas **multi-passo** complexas
- ✅ Agente **autônomo** (decide sozinho)
- ✅ Pesquisa e análise da web
- ✅ Workflows completos

**Vantagens:**
- Agente totalmente autônomo
- Pode explorar e pesquisar
- Toma decisões baseadas em contexto

**Como Funciona:**
```
Usuário: "Analise os 5 principais concorrentes"
  ↓
Agentic AI:
  1. Pesquisa concorrentes no Google
  2. Abre site de cada um
  3. Analisa preços, produtos, estratégias
  4. Captura screenshots
  5. Gera relatório comparativo
```

**Implementação:**
```python
# Railway - python-service/app/automation/agentic_browser.py
from agentic_browser import AutonomousAgent

class AgenticAutomation:
    def __init__(self):
        self.agent = AutonomousAgent(
            objective="Analisar concorrentes",
            max_steps=20
        )
    
    async def run_autonomous_task(self, objective: str):
        result = await self.agent.execute(objective)
        return result
```

**Casos de Uso:**
```
- "Pesquise tendências de marketing para 2025"
- "Analise a estratégia de conteúdo do concorrente X"
- "Encontre 10 influenciadores na área de fitness"
```

---

#### 5. **Playwright + Steel.dev** (Novo)
**Prioridade:** 🔥 ALTA  
**Status:** 🔄 A Implementar

**Usar para:**
- ✅ Browser **headless em nuvem**
- ✅ Testes automatizados
- ✅ Scraping em escala
- ✅ Captura de screenshots/PDFs
- ✅ Interação com APIs de terceiros

**Vantagens:**
- Não precisa de servidor próprio
- Escala infinitamente
- Steel.dev = Playwright as a Service

**Como Funciona:**
```
Steel.dev fornece browser headless via API
  ↓
Playwright controla via código
  ↓
Executa tarefas sem abrir browser local
```

**Implementação:**
```python
# Railway - python-service/app/automation/playwright_steel.py
from playwright.async_api import async_playwright
import requests

class PlaywrightSteel:
    def __init__(self):
        self.steel_api = "https://api.steel.dev"
        self.api_key = os.getenv("STEEL_API_KEY")
    
    async def run_browser_task(self, url: str, actions: list):
        async with async_playwright() as p:
            browser = await p.chromium.connect_over_cdp(
                f"{self.steel_api}/browser?api_key={self.api_key}"
            )
            page = await browser.new_page()
            await page.goto(url)
            
            for action in actions:
                await self.execute_action(page, action)
            
            screenshot = await page.screenshot()
            await browser.close()
            return screenshot
```

**Casos de Uso:**
```
- "Capture screenshot de todas as páginas do site X"
- "Teste se o formulário de contato funciona"
- "Gere PDF desta landing page"
```

---

## 5️⃣ SISTEMA DE ROTEAMENTO INTELIGENTE

### 🧠 AI Router - Decisor Central

**Localização:** `supabase/functions/ai-router/index.ts`

```typescript
// ============================================
// AI ROUTER - DECISOR INTELIGENTE
// ============================================

interface TaskAnalysis {
  intent: string;
  complexity: "low" | "medium" | "high";
  requiresMultimodal: boolean;
  requiresAutomation: boolean;
  estimatedTokens: number;
}

interface AISelection {
  provider: "GROQ" | "GEMINI" | "CLAUDE";
  model: string;
  reason: string;
  automationLibrary?: string;
}

export class AIRouter {
  
  /**
   * Analisa a tarefa e seleciona a melhor IA
   */
  async selectBestAI(
    userMessage: string,
    conversationHistory: any[]
  ): Promise<AISelection> {
    
    const analysis = await this.analyzeTask(userMessage);
    
    // 1️⃣ PRIORIDADE: Multimodal
    if (analysis.requiresMultimodal) {
      if (this.needsImageGeneration(userMessage)) {
        return {
          provider: "GEMINI",
          model: "gemini-2.0-flash-exp",
          reason: "Geração de imagem (única IA com essa capacidade)",
        };
      }
      
      if (this.hasImageAttachment(userMessage)) {
        return {
          provider: "GEMINI",
          model: "gemini-2.0-flash-exp",
          reason: "Análise de imagem (multimodal)",
        };
      }
    }
    
    // 2️⃣ PRIORIDADE: Código/Lógica Complexa
    if (analysis.complexity === "high" && this.needsCodeGeneration(userMessage)) {
      return {
        provider: "CLAUDE",
        model: "claude-3-5-sonnet-20241022",
        reason: "Geração de código complexo",
      };
    }
    
    // 3️⃣ PRIORIDADE: Contexto Grande
    if (analysis.estimatedTokens > 100000) {
      return {
        provider: "GEMINI",
        model: "gemini-2.0-flash-exp",
        reason: "Contexto grande (1M tokens)",
      };
    }
    
    // 4️⃣ DEFAULT: Velocidade + Custo
    return {
      provider: "GROQ",
      model: "llama-3.3-70b-versatile",
      reason: "Chat rápido e gratuito",
    };
  }
  
  /**
   * Seleciona biblioteca de automação
   */
  async selectAutomationLibrary(
    task: string,
    context: any
  ): Promise<string> {
    
    // Usuário já está na página?
    if (context.extensionActive && context.currentUrl) {
      return "EXTENSION"; // Mais rápido
    }
    
    // Tarefa simples (scraping)?
    if (this.isSimpleScraping(task)) {
      return "LITEWEBAGENT";
    }
    
    // Tarefa requer inteligência (formulários complexos)?
    if (this.requiresIntelligence(task)) {
      return "BROWSER_USE";
    }
    
    // Tarefa autônoma multi-passo?
    if (this.isAutonomousTask(task)) {
      return "AGENTIC_BROWSER";
    }
    
    // Tarefa em escala ou headless?
    if (this.requiresHeadless(task)) {
      return "PLAYWRIGHT_STEEL";
    }
    
    return "EXTENSION"; // Default
  }
  
  // ... métodos auxiliares
}
```

---

## 6️⃣ IMPLEMENTAÇÃO TÉCNICA

### 📁 Estrutura de Pastas

```
SyncAds/
├── supabase/functions/
│   ├── ai-router/              # ⭐ NOVO - Roteador inteligente
│   │   ├── index.ts
│   │   ├── analyzer.ts
│   │   └── selector.ts
│   ├── chat-enhanced/          # ✅ Existente - Mantém
│   │   └── index.ts
│   └── automation-proxy/       # ⭐ NOVO - Proxy para automação
│       └── index.ts
│
├── python-service/             # Railway
│   ├── app/
│   │   ├── automation/         # ⭐ NOVO - Bibliotecas de automação
│   │   │   ├── __init__.py
│   │   │   ├── lite_web_agent.py
│   │   │   ├── browser_use.py
│   │   │   ├── agentic_browser.py
│   │   │   └── playwright_steel.py
│   │   ├── routers/
│   │   │   └── automation.py   # ⭐ NOVO - API de automação
│   │   └── ai_agent/
│   │       └── multi_llm.py    # ⭐ NOVO - Gerenciador multi-LLM
│   └── requirements.txt
│
└── chrome-extension/
    └── src/
        └── background/
            └── automation.ts    # ✅ Mantém - DOM direto
```

### 🔧 Implementação: AI Router

**Arquivo:** `supabase/functions/ai-router/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface AIRouterRequest {
  message: string;
  conversationId: string;
  context?: {
    extensionActive: boolean;
    currentUrl?: string;
    attachments?: any[];
  };
}

serve(async (req) => {
  try {
    const { message, conversationId, context } = await req.json() as AIRouterRequest;
    
    // 1️⃣ ANALISAR TAREFA
    const taskAnalysis = await analyzeTask(message);
    
    // 2️⃣ SELECIONAR IA
    const selectedAI = await selectAI(taskAnalysis, context);
    
    // 3️⃣ SELECIONAR AUTOMAÇÃO (se necessário)
    let automationLibrary = null;
    if (taskAnalysis.requiresAutomation) {
      automationLibrary = await selectAutomation(message, context);
    }
    
    // 4️⃣ EXECUTAR NA IA SELECIONADA
    let response;
    switch (selectedAI.provider) {
      case "GROQ":
        response = await callGroq(message, conversationId);
        break;
      case "GEMINI":
        response = await callGemini(message, conversationId, context);
        break;
      case "CLAUDE":
        response = await callClaude(message, conversationId);
        break;
    }
    
    // 5️⃣ EXECUTAR AUTOMAÇÃO (se necessário)
    if (automationLibrary) {
      const automationResult = await executeAutomation(
        automationLibrary,
        message,
        context
      );
      response.automationResult = automationResult;
    }
    
    return new Response(JSON.stringify({
      response: response.text,
      ai_used: selectedAI.provider,
      model: selectedAI.model,
      reason: selectedAI.reason,
      automationUsed: automationLibrary,
      tokensUsed: response.tokensUsed,
    }), {
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("AI Router Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function analyzeTask(message: string) {
  const keywords = {
    imageGeneration: ["crie imagem", "gere banner", "faça um logo"],
    videoAnalysis: ["analise este vídeo", "extraia frames"],
    codeGeneration: ["crie script", "gere código", "desenvolva"],
    automation: ["abra", "clique", "preencha", "acesse"],
  };
  
  return {
    intent: detectIntent(message, keywords),
    complexity: estimateComplexity(message),
    requiresMultimodal: hasMultimodalKeywords(message),
    requiresAutomation: hasAutomationKeywords(message),
    estimatedTokens: message.length * 4, // aproximação
  };
}

async function selectAI(analysis: any, context: any) {
  // Implementar lógica do decision tree
  if (analysis.requiresMultimodal && 
      (analysis.intent === "imageGeneration" || context?.attachments?.length > 0)) {
    return {
      provider: "GEMINI",
      model: "gemini-2.0-flash-exp",
      reason: "Capacidade multimodal necessária"
    };
  }
  
  if (analysis.complexity === "high" && analysis.intent === "codeGeneration") {
    return {
      provider: "CLAUDE",
      model: "claude-3-5-sonnet-20241022",
      reason: "Código complexo"
    };
  }
  
  return {
    provider: "GROQ",
    model: "llama-3.3-70b-versatile",
    reason: "Velocidade e custo otimizado"
  };
}

async function callGroq(message: string, conversationId: string) {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${Deno.env.get("GROQ_API_KEY")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: message }],
      max_tokens: 2000,
    }),
  });
  
  const data = await response.json();
  return {
    text: data.choices[0].message.content,
    tokensUsed: data.usage.total_tokens,
  };
}

async function callGemini(message: string, conversationId: string, context: any) {
  // Implementar chamada para Gemini
  // Suporta multimodal
}

async function callClaude(message: string, conversationId: string) {
  // Implementar chamada para Claude
}
```

### 🐍 Implementação: Python Automation Router

**Arquivo:** `python-service/app/automation/__init__.py`

```python
# ============================================
# AUTOMATION ROUTER - Python Backend
# ============================================

from .lite_web_agent import LiteWebAutomation
from .browser_use import BrowserUseAutomation
from .agentic_browser import AgenticAutomation
from .playwright_steel import PlaywrightSteel

class AutomationRouter:
    """
    Roteador de automação que seleciona a melhor biblioteca
    """
    
    def __init__(self):
        self.lite_web = LiteWebAutomation()
        self.browser_use = BrowserUseAutomation()
        self.agentic = AgenticAutomation()
        self.playwright = PlaywrightSteel()
    
    async def execute(self, task: str, library: str, params: dict):
        """
        Executa tarefa na biblioteca selecionada
        """
        
        if library == "LITEWEBAGENT":
            return await self.lite_web.execute(task, params)
        
        elif library == "BROWSER_USE":
            return await self.browser_use.execute(task, params)
        
        elif library == "AGENTIC_BROWSER":
            return await self.agentic.execute(task, params)
        
        elif library == "PLAYWRIGHT_STEEL":
            return await self.playwright.execute(task, params)
        
        else:
            raise ValueError(f"Biblioteca desconhecida: {library}")
    
    def select_library(self, task: str, context: dict) -> str:
        """
        Seleciona a melhor biblioteca baseado na tarefa
        """
        
        # Scraping simples
        if self._is_simple_scraping(task):
            return "LITEWEBAGENT"
        
        # Formulários complexos
        if self._requires_intelligence(task):
            return "BROWSER_USE"
        
        # Pesquisa e análise
        if self._is_autonomous(task):
            return "AGENTIC_BROWSER"
        
        # Headless em escala
        if self._requires_headless(task):
            return "PLAYWRIGHT_STEEL"
        
        return "LITEWEBAGENT"  # Default
```

---

## 7️⃣ CASOS DE USO PRÁTICOS

### 📋 Matriz de Decisão Rápida

| Pergunta do Usuário | IA Selecionada | Biblioteca | Motivo |
|---------------------|----------------|------------|---------|
| "Como melhorar meu CTR?" | **Groq** | - | Chat rápido |
| "Crie um banner para Black Friday" | **Gemini** | - | Geração de imagem |
| "Analise este print