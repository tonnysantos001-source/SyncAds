# 🚀 ROADMAP DE IMPLEMENTAÇÃO - IA & AUTOMAÇÃO 2025
## SyncAds Marketing AI - Plano de Ação Prático

**Versão:** 1.0  
**Data:** 27/01/2025  
**Prazo Total:** 4-6 semanas  
**Status:** 📋 PRONTO PARA EXECUTAR

---

## 📊 VISÃO GERAL DO ROADMAP

### 🎯 Objetivo Final
Sistema inteligente que:
- ✅ Roteia automaticamente entre Groq/Gemini/Claude
- ✅ Integra 4 bibliotecas de automação web
- ✅ Otimiza custos (prioriza LLMs gratuitas)
- ✅ Escala conforme demanda

### 📈 Métricas de Sucesso
- **Performance:** 90% das requisições < 2s
- **Custo:** 80% usando LLMs gratuitas
- **Precisão:** Taxa de erro < 5%
- **Satisfação:** NPS > 8/10

---

## 🗓️ FASE 1: AI ROUTER (Semana 1-2)

### 🎯 Objetivo
Criar sistema inteligente de roteamento entre IAs

### ✅ Tarefas

#### 1.1 - Criar Edge Function `ai-router`
**Arquivo:** `supabase/functions/ai-router/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  const { message, context } = await req.json();
  
  // Analisa intenção
  const intent = analyzeIntent(message);
  
  // Seleciona IA
  const selectedAI = selectAI(intent, context);
  
  // Executa
  const response = await callAI(selectedAI, message);
  
  return new Response(JSON.stringify({
    response,
    ai_used: selectedAI.provider,
    reason: selectedAI.reason
  }));
});

function analyzeIntent(message: string) {
  return {
    needsImage: /crie|gere|faça.*imagem|banner|logo/.test(message.toLowerCase()),
    needsCode: /script|código|função|api/.test(message.toLowerCase()),
    needsAutomation: /abra|clique|preencha|acesse/.test(message.toLowerCase()),
    complexity: message.length > 500 ? "high" : "low"
  };
}

function selectAI(intent: any, context: any) {
  // PRIORIDADE 1: Gemini para imagens
  if (intent.needsImage || context.attachments?.length > 0) {
    return { provider: "GEMINI", model: "gemini-2.0-flash-exp", reason: "Multimodal" };
  }
  
  // PRIORIDADE 2: Claude para código
  if (intent.needsCode && intent.complexity === "high") {
    return { provider: "CLAUDE", model: "claude-3-5-sonnet", reason: "Código complexo" };
  }
  
  // PRIORIDADE 3: Groq para tudo mais (velocidade + grátis)
  return { provider: "GROQ", model: "llama-3.3-70b-versatile", reason: "Rápido e gratuito" };
}
```

#### 1.2 - Atualizar `chat-enhanced` para usar `ai-router`
**Arquivo:** `supabase/functions/chat-enhanced/index.ts`

```typescript
// ANTES: Chamava diretamente uma IA
const response = await callAnthropic(message);

// DEPOIS: Chama o router
const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-router`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({ message, context })
});

const { response: aiResponse, ai_used, reason } = await response.json();
```

#### 1.3 - Adicionar Logging e Métricas
**Tabela:** `ai_usage_logs`

```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  provider TEXT NOT NULL, -- GROQ, GEMINI, CLAUDE
  model TEXT NOT NULL,
  tokens_used INTEGER,
  cost_usd DECIMAL(10,4) DEFAULT 0,
  latency_ms INTEGER,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para análises
CREATE INDEX idx_ai_usage_provider ON ai_usage_logs(provider, created_at);
CREATE INDEX idx_ai_usage_user ON ai_usage_logs(user_id, created_at);
```

#### 1.4 - Dashboard de Métricas (Super Admin)
**Página:** `src/pages/super-admin/AIMetricsPage.tsx`

```typescript
export default function AIMetricsPage() {
  const [metrics, setMetrics] = useState(null);
  
  useEffect(() => {
    loadMetrics();
  }, []);
  
  async function loadMetrics() {
    const { data } = await supabase
      .from('ai_usage_logs')
      .select('provider, tokens_used, cost_usd, latency_ms')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    const summary = {
      groq: { count: 0, avgLatency: 0, totalCost: 0 },
      gemini: { count: 0, avgLatency: 0, totalCost: 0 },
      claude: { count: 0, avgLatency: 0, totalCost: 0 },
    };
    
    data.forEach(log => {
      const provider = log.provider.toLowerCase();
      summary[provider].count++;
      summary[provider].avgLatency += log.latency_ms;
      summary[provider].totalCost += log.cost_usd;
    });
    
    setMetrics(summary);
  }
  
  return (
    <div>
      <h1>Métricas de IA - Últimos 7 dias</h1>
      {/* Gráficos com uso, custo, latência por provider */}
    </div>
  );
}
```

### 📋 Checklist Fase 1
- [ ] `ai-router` Edge Function criada
- [ ] `chat-enhanced` integrada com router
- [ ] Tabela `ai_usage_logs` criada
- [ ] Logging implementado em todas as chamadas
- [ ] Dashboard de métricas funcionando
- [ ] Testes com 3 IAs (Groq, Gemini, Claude)

**Prazo:** 2 semanas  
**Responsável:** Dev Backend  
**Prioridade:** 🔥 CRÍTICA

---

## 🗓️ FASE 2: BIBLIOTECAS DE AUTOMAÇÃO (Semana 3-4)

### 🎯 Objetivo
Integrar bibliotecas de automação web no Railway

### ✅ Tarefas

#### 2.1 - Setup Railway com Novas Bibliotecas
**Arquivo:** `python-service/requirements-automation.txt`

```txt
# Navegação Básica
litewebagent==0.2.0
httpx==0.26.0
beautifulsoup4==4.12.3

# Browser Inteligente (LLM-powered)
browser-use==0.1.5
langchain==0.1.0
langchain-groq==0.0.2

# Agente Autônomo
agentic-browser==0.3.1
selenium==4.17.2

# Playwright Cloud (Steel.dev)
playwright==1.41.0
requests==2.31.0
```

#### 2.2 - Implementar LiteWebAgent
**Arquivo:** `python-service/app/automation/lite_web_agent.py`

```python
from litewebagent import WebAgent
from typing import Dict, Any

class LiteWebAutomation:
    """
    Automação leve para scraping e navegação simples
    """
    
    def __init__(self):
        self.agent = WebAgent()
    
    async def scrape_page(self, url: str, selector: str = None) -> Dict[str, Any]:
        """
        Scraping simples de página
        """
        try:
            page = await self.agent.goto(url)
            
            if selector:
                content = await page.query(selector)
            else:
                content = await page.html()
            
            return {
                "success": True,
                "url": url,
                "content": content,
                "title": await page.title()
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def monitor_price(self, url: str, price_selector: str) -> float:
        """
        Monitora preço de produto
        """
        page = await self.agent.goto(url)
        price_text = await page.query(price_selector)
        price = float(price_text.replace("R$", "").replace(",", "."))
        return price
```

**Casos de Uso:**
```
- "Monitore o preço deste produto: [URL]"
- "Extraia todos os emails desta página"
- "Verifique se há novos posts no blog"
```

#### 2.3 - Implementar Browser-Use (IA + Browser)
**Arquivo:** `python-service/app/automation/browser_use.py`

```python
from browser_use import Agent
from langchain_groq import ChatGroq
from typing import Dict, Any

class BrowserUseAutomation:
    """
    Automação inteligente com LLM (entende contexto)
    """
    
    def __init__(self):
        self.llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=os.getenv("GROQ_API_KEY")
        )
    
    async def execute_intelligent_task(self, task: str, url: str = None) -> Dict[str, Any]:
        """
        Executa tarefa usando IA para decidir ações
        
        Exemplos:
        - "Preencha o formulário de contato"
        - "Encontre o botão de compra e clique"
        - "Leia o conteúdo da seção de preços"
        """
        try:
            agent = Agent(
                task=task,
                llm=self.llm,
                starting_url=url
            )
            
            result = await agent.run()
            
            return {
                "success": True,
                "result": result.final_result,
                "steps_taken": result.history
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def fill_form(self, url: str, form_data: Dict[str, str]) -> Dict[str, Any]:
        """
        Preenche formulário de forma inteligente
        """
        task = f"Vá para {url} e preencha o formulário com: {form_data}"
        return await self.execute_intelligent_task(task, url)
```

**Casos de Uso:**
```
- "Crie uma campanha no Facebook Ads com orçamento $50"
- "Preencha o formulário de contato neste site"
- "Configure pixel do Facebook no site X"
```

#### 2.4 - Implementar Playwright + Steel.dev
**Arquivo:** `python-service/app/automation/playwright_steel.py`

```python
from playwright.async_api import async_playwright
import os

class PlaywrightSteel:
    """
    Browser headless em nuvem via Steel.dev
    Ideal para: screenshots, PDFs, testes em escala
    """
    
    def __init__(self):
        self.steel_api_url = "https://api.steel.dev/v1"
        self.api_key = os.getenv("STEEL_API_KEY")
    
    async def capture_screenshot(self, url: str, full_page: bool = False) -> bytes:
        """
        Captura screenshot de página
        """
        async with async_playwright() as p:
            browser = await p.chromium.connect_over_cdp(
                f"{self.steel_api_url}/browser?api_key={self.api_key}"
            )
            
            page = await browser.new_page()
            await page.goto(url)
            
            screenshot = await page.screenshot(full_page=full_page)
            await browser.close()
            
            return screenshot
    
    async def generate_pdf(self, url: str) -> bytes:
        """
        Gera PDF de página
        """
        async with async_playwright() as p:
            browser = await p.chromium.connect_over_cdp(
                f"{self.steel_api_url}/browser?api_key={self.api_key}"
            )
            
            page = await browser.new_page()
            await page.goto(url)
            
            pdf = await page.pdf()
            await browser.close()
            
            return pdf
    
    async def test_form(self, url: str, form_data: Dict[str, str]) -> Dict[str, Any]:
        """
        Testa se formulário funciona
        """
        async with async_playwright() as p:
            browser = await p.chromium.connect_over_cdp(
                f"{self.steel_api_url}/browser?api_key={self.api_key}"
            )
            
            page = await browser.new_page()
            await page.goto(url)
            
            # Preencher campos
            for field, value in form_data.items():
                await page.fill(f'input[name="{field}"]', value)
            
            # Submit
            await page.click('button[type="submit"]')
            
            # Verificar sucesso
            success = await page.wait_for_selector('.success-message', timeout=5000)
            
            await browser.close()
            
            return {
                "success": bool(success),
                "message": "Formulário testado com sucesso"
            }
```

**Casos de Uso:**
```
- "Capture screenshot de todas as páginas do site"
- "Gere PDF desta landing page"
- "Teste se o formulário de checkout funciona"
```

#### 2.5 - Router de Automação
**Arquivo:** `python-service/app/automation/router.py`

```python
from .lite_web_agent import LiteWebAutomation
from .browser_use import BrowserUseAutomation
from .playwright_steel import PlaywrightSteel
from typing import Dict, Any

class AutomationRouter:
    """
    Seleciona a melhor biblioteca para cada tarefa
    """
    
    def __init__(self):
        self.lite_web = LiteWebAutomation()
        self.browser_use = BrowserUseAutomation()
        self.playwright = PlaywrightSteel()
    
    def select_library(self, task: str, context: Dict[str, Any]) -> str:
        """
        Decide qual biblioteca usar
        """
        task_lower = task.lower()
        
        # Já está na página? Usar extensão
        if context.get("extension_active"):
            return "EXTENSION"
        
        # Scraping simples
        if any(word in task_lower for word in ["extraia", "monitore", "leia", "pegue"]):
            return "LITEWEBAGENT"
        
        # Precisa de inteligência (formulários, decisões)
        if any(word in task_lower for word in ["preencha", "crie", "configure", "encontre"]):
            return "BROWSER_USE"
        
        # Screenshots, PDFs, testes
        if any(word in task_lower for word in ["screenshot", "pdf", "teste"]):
            return "PLAYWRIGHT_STEEL"
        
        return "LITEWEBAGENT"  # Default
    
    async def execute(self, task: str, library: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executa tarefa na biblioteca selecionada
        """
        if library == "LITEWEBAGENT":
            return await self.lite_web.scrape_page(params.get("url"), params.get("selector"))
        
        elif library == "BROWSER_USE":
            return await self.browser_use.execute_intelligent_task(task, params.get("url"))
        
        elif library == "PLAYWRIGHT_STEEL":
            if "screenshot" in task.lower():
                screenshot = await self.playwright.capture_screenshot(params.get("url"))
                return {"success": True, "screenshot": screenshot}
            elif "pdf" in task.lower():
                pdf = await self.playwright.generate_pdf(params.get("url"))
                return {"success": True, "pdf": pdf}
        
        return {"success": False, "error": "Biblioteca não suportada"}
```

#### 2.6 - API Endpoint
**Arquivo:** `python-service/app/routers/automation.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.automation.router import AutomationRouter

router = APIRouter(prefix="/api/automation", tags=["automation"])
automation_router = AutomationRouter()

class AutomationRequest(BaseModel):
    task: str
    url: str = None
    params: dict = {}
    context: dict = {}

@router.post("/execute")
async def execute_automation(request: AutomationRequest):
    """
    Executa tarefa de automação
    
    Exemplo:
    POST /api/automation/execute
    {
      "task": "Extraia todos os preços desta página",
      "url": "https://example.com/produtos",
      "context": { "extension_active": false }
    }
    """
    try:
        # Seleciona biblioteca
        library = automation_router.select_library(request.task, request.context)
        
        # Executa
        result = await automation_router.execute(
            request.task,
            library,
            {"url": request.url, **request.params}
        )
        
        return {
            "success": True,
            "library_used": library,
            "result": result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### 📋 Checklist Fase 2
- [ ] Bibliotecas instaladas no Railway
- [ ] LiteWebAgent implementado e testado
- [ ] Browser-Use implementado e testado
- [ ] Playwright + Steel.dev configurado
- [ ] AutomationRouter funcionando
- [ ] API endpoint `/api/automation/execute` ativa
- [ ] Testes com cada biblioteca

**Prazo:** 2 semanas  
**Responsável:** Dev Backend Python  
**Prioridade:** 🟡 ALTA

---

## 🗓️ FASE 3: INTEGRAÇÃO FRONTEND (Semana 5)

### 🎯 Objetivo
Conectar chat do usuário com novo sistema

### ✅ Tarefas

#### 3.1 - Atualizar ChatService para usar AI Router
**Arquivo:** `src/lib/api/chatService.ts`

```typescript
async sendMessage(message: string, conversationId: string) {
  // Detectar se precisa de automação
  const needsAutomation = /abra|clique|preencha|extraia/.test(message.toLowerCase());
  
  const context = {
    extensionActive: await this.checkExtension(),
    currentUrl: await this.getCurrentUrl(),
    needsAutomation
  };
  
  // Chamar ai-router ao invés de chat-enhanced diretamente
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-router`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      conversationId,
      context
    })
  });
  
  const data = await response.json();
  
  // Mostrar qual IA foi usada
  console.log(`✅ IA usada: ${data.ai_used} (${data.reason})`);
  
  return data.response;
}
```

#### 3.2 - Adicionar Indicador de IA Ativa
**Componente:** `src/components/chat/AIIndicator.tsx`

```typescript
export function AIIndicator({ aiUsed }: { aiUsed: string }) {
  const icons = {
    GROQ: "⚡",
    GEMINI: "✨",
    CLAUDE: "🧠"
  };
  
  const colors = {
    GROQ: "text-purple-400",
    GEMINI: "text-blue-400",
    CLAUDE: "text-orange-400"
  };
  
  return (
    <div className={`text-xs ${colors[aiUsed]}`}>
      {icons[aiUsed]} Respondido por {aiUsed}
    </div>
  );
}
```

### 📋 Checklist Fase 3
- [ ] ChatService atualizado
- [ ] Indicador de IA no chat
- [ ] Testes com 3 IAs diferentes
- [ ] Feedback visual para usuário

**Prazo:** 1 semana  
**Responsável:** Dev Frontend  
**Prioridade:** 🟡 ALTA

---

## 🗓️ FASE 4: OTIMIZAÇÕES & MELHORIAS (Semana 6)

### 🎯 Objetivo
Polir sistema e adicionar features avançadas

### ✅ Tarefas

#### 4.1 - Cache de Respostas
```typescript
// Cache respostas comuns
const cache = new Map();

function getCachedResponse(message: string) {
  const normalized = message.toLowerCase().trim();
  return cache.get(normalized);
}

function cacheResponse(message: string, response: string) {
  cache.set(message.toLowerCase().trim(), response);
}
```

#### 4.2 - Rate Limiting Inteligente
```typescript
// Limitar chamadas a IAs pagas
const rateLimiter = {
  CLAUDE: { max: 100, current: 0, resetAt: Date.now() + 3600000 },
  GPT4: { max: 50, current: 0, resetAt: Date.now() + 3600000 }
};

function canUsePaidAI(provider: string): boolean {
  const limit = rateLimiter[provider];
  if (!limit) return true;
  
  if (Date.now() > limit.resetAt) {
    limit.current = 0;
    limit.resetAt = Date.now() + 3600000;
  }
  
  return limit.current < limit.max;
}
```

#### 4.3 - Fallback Automático
```typescript
async function callAIWithFallback(message: string, preferredAI: string) {
  const fallbackOrder = ["GROQ", "GEMINI", "CLAUDE"];
  
  for (const ai of fallbackOrder) {
    try {
      return await callAI(ai, message);
    } catch (error) {
      console.warn(`${ai} falhou, tentando próximo...`);
      continue;
    }
  }
  
  throw new Error("Todas as IAs falharam");
}
```

### 📋 Checklist Fase 4
- [ ] Cache implementado
- [ ] Rate limiting ativo
- [ ] Fallback automático
- [ ] Testes de carga

**Prazo:** 1 semana  
**Responsável:** Dev Backend  
**Prioridade:** 🟢 MÉDIA

---

## 📊 CASOS DE USO PRÁTICOS

### Exemplo 1: Análise de Concorrente
```
Usuário: "Analise o site do concorrente example.com e me diga o preço deles"

Fluxo:
1. AI Router detecta: needsAutomation = true
2. Seleciona: GROQ (rápido) + LiteWebAgent (scraping)
3. LiteWebAgent:
   - Acessa example.com
   - Extrai seletor de preço
   - Retorna: R$ 99,90
4. GROQ analisa e responde:
   "O concorrente está vendendo por R$ 99,90. 
    Seu preço atual é R$ 129,90. 
    Considere ajustar para ser competitivo."
```

### Exemplo 2: Criação de Banner
```
Usuário: "Crie um banner 1200x628 para Black Friday"

Fluxo:
1. AI Router detecta: needsImage = true
2. Seleciona: GEMINI (única com geração de imagem)
3. GEMINI gera imagem
4. Retorna: [imagem] + "Banner criado! Quer que eu faça ajustes?"
```

### Exemplo 3: Automação Complexa
```
Usuário: "Crie uma campanha no Facebook Ads com orçamento $50"

Fluxo:
1. AI Router detecta: needsAutomation = true, complexity = high
2. Seleciona: GROQ + Browser-Use (inteligente)
3. Browser-Use:
   - Abre Facebook Ads
   - Clica em "Criar Campanha"
   - Preenche formulário (IA entende campos)
   - Define orçamento $50
   - Confirma
4. GROQ responde:
   "Campanha criada com sucesso! 
    Nome: Campanha 27/01/2025
    Orçamento: $50/dia
    Status: Ativa"
```

---

## 🎯 PRIORIZAÇÃO FINAL

### 🔥 CRÍTICO (Fazer Agora)
1. **AI Router** - Fase 1 completa
2. **Logging de métricas** - Tabela + Dashboard
3. **Browser-Use** - Automação inteligente

### 🟡 IMPORTANTE (2-3 semanas)
4. **LiteWebAgent** - Scraping básico
5. **Playwright + Steel** - Screenshots/PDFs
6. **Integração Frontend** - ChatService atualizado

### 🟢 BOM TER (Quando sobrar tempo)
7. **Agentic Browser** - Agente autônomo
8. **Cache** - Respostas comuns
9. **Rate limiting** - Controle de custos

---

## 📋 CHECKLIST GERAL

### Infraestrutura
- [ ] Railway com todas as bibliotecas
- [ ] Steel.dev API key configurada
- [ ] Groq API key ativa
- [ ] Gemini API key ativa

### Edge Functions
- [ ] `ai-router` deployada
- [ ] `chat-enhanced` integrada
- [ ] Logs funcionando

### Backend Python
- [ ] 4 bibliotecas implementadas
- [ ] AutomationRouter funcionando
- [ ] API endpoint ativo

### Frontend
- [ ] ChatService atualizado
- [ ] Indicador de IA
- [ ] Extensão integrada

### Testes
- [ ] Teste com Groq
- [ ] Teste com Gemini (imagem)
- [ ] Teste com Claude (código)
- [ ] Teste automação simples
- [ ] Teste automação complexa

---

## 🚀 PRÓXIMOS PASSOS IMEDIATOS

1. **HOJE:**
   - Criar `ai-router` Edge Function
   - Adicionar logging básico

2. **ESTA SEMANA:**
   - Integrar Groq/Gemini/Claude no router
   - Criar tabela `ai_usage_logs`
   - Testar roteamento

3. **PRÓXIMA SEMANA:**
   - Instalar bibliotecas no Railway
   - Implementar LiteWebAgent
   - Implementar Browser-Use

4. **EM 2 SEMANAS:**
   - Integrar frontend
   - Dashboard de métricas
   - Testes completos

---

## 💡 DICAS DE IMPLEMENTAÇÃO

### Performance
- Cache respostas comuns (perguntas frequentes)
- Usar streaming quando possível (Groq suporta)
- Paralelizar chamadas quando não há dependência

### Custos
- 80% das requisições devem usar Groq (grátis)
- Reserve Claude/GPT-4 para tarefas premium
- Monitore custos diariamente no dashboard

### UX
- Sempre mostrar qual IA está respondendo
- Indicar quando está usando automação
- Feedback em tempo real (typing indicator)

### Segurança
- Validar URLs antes de acessar
- Limitar rate de automação (max 10/min por usuário)
- Logs de todas as ações sensíveis

---

**✅ ESTE ROADMAP ESTÁ PRONTO PARA EXECUTAR!**

Comece pela Fase 1 (AI Router) e siga o cronograma.  
Qualquer dúvida, consulte o `PLANO_ESTRATEGICO_IA_COMPLETO.md`.

**Boa sorte! 🚀**