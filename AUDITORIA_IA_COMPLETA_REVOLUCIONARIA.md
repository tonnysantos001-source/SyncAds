# 🚀 AUDITORIA COMPLETA + ROADMAP - IA SUPERINTELIGENTE SYNCADS

**Data:** Janeiro 2025  
**Versão:** 6.0 - Revolução Completa  
**Status:** 🔥 IMPLEMENTAÇÃO IMEDIATA

---

## 📊 EXECUTIVE SUMMARY

Após análise profunda do sistema e pesquisa de tecnologias emergentes (browser-use, Nanobrowser, Playwright AI), identificamos **47 melhorias críticas** que transformarão o SyncAds na **IA de automação web mais avançada do mercado**.

### 🎯 Visão Revolucionária

**Problema Atual:** IA não sabe onde está (extensão vs painel), capacidades DOM limitadas, sem feedback visual, sem validação de resultados.

**Solução:** IA multi-contexto com **consciência espacial**, automação visual em tempo real, workflows inteligentes e validação automática.

---

## 🔍 AUDITORIA DO SISTEMA ATUAL

### ✅ O QUE ESTÁ BOM

1. **Arquitetura Base Sólida**
   - Edge Functions funcionando
   - Sistema de polling implementado
   - Content script robusto
   - Detector de comandos funcionando

2. **Infraestrutura**
   - Supabase configurado
   - Rate limiting ativo
   - Cache de IA implementado
   - Audit logs funcionando

3. **Segurança**
   - JWT autenticação
   - URL validation
   - RLS policies
   - Sanitização de inputs

### ❌ GAPS CRÍTICOS IDENTIFICADOS

#### 1. **DUAL CONTEXT AWARENESS** 🚨 CRÍTICO
**Problema:** IA não sabe se está na extensão ou no painel web.

**Impacto:**
- Usuário pergunta sobre DOM mas está no painel → IA responde errado
- Usuário pede Python mas está na extensão → Frustração
- Comandos incompatíveis com contexto → Falhas

**Solução Necessária:**
```typescript
interface AIContext {
  location: 'extension' | 'web_panel';
  capabilities: string[];
  userProfile: UserProfile;
  currentPage?: PageContext;
}
```

#### 2. **VISUAL FEEDBACK SYSTEM** 🚨 CRÍTICO
**Problema:** Usuário não vê IA trabalhando. Zero feedback visual.

**Impacto:**
- "Será que está funcionando?"
- Falta de confiança
- Experiência ruim

**Solução Necessária:**
- Highlight em tempo real de elementos
- Cursor virtual mostrando ações
- Overlay com progresso
- Animações de execução

#### 3. **SMART SELECTORS** 🚨 CRÍTICO
**Problema:** Seletores CSS hardcoded quebram facilmente.

**Solução Necessária:**
- Sistema de múltiplos seletores com fallback
- Aprendizado de padrões comuns
- Computer vision para identificar elementos
- Banco de dados de seletores conhecidos

#### 4. **RESULT VALIDATION** 🚨 CRÍTICO
**Problema:** IA não verifica se comando funcionou.

**Solução Necessária:**
- Screenshot antes/depois
- Validação de estado
- Retry automático com estratégias diferentes
- Feedback ao usuário se falhar

#### 5. **WORKFLOW AUTOMATION** 🚨 ALTO
**Problema:** Um comando por vez. Sem sequências complexas.

**Solução Necessária:**
```typescript
interface Workflow {
  steps: Step[];
  conditions: Condition[];
  loops: Loop[];
  errorHandling: ErrorHandler;
}
```

#### 6. **PYTHON EXECUTION CLARITY** 🚨 ALTO
**Problema:** Confusão sobre onde Python roda.

**Solução:**
- Python APENAS no painel web
- DOM APENAS na extensão
- IA explica claramente as limitações

#### 7. **INTELLIGENT FORM FILLING** 🚨 ALTO
**Problema:** Preenchimento burro. Não detecta campos automaticamente.

**Solução:**
- Auto-detecção de campos por tipo
- Preenchimento com dados do perfil
- Validação de formato (email, telefone, CPF)
- Sugestões inteligentes

#### 8. **AD CREATION AUTOMATION** 🚨 ALTO
**Problema:** Não consegue criar anúncios em plataformas.

**Solução:**
- Workflows pré-definidos para Meta Ads, Google Ads
- Detecção de interfaces de criação
- Preenchimento automático
- Upload de imagens

#### 9. **SEARCH INTELLIGENCE** 🚨 MÉDIO
**Problema:** Não sabe fazer pesquisas complexas.

**Solução:**
- Refinamento automático de buscas
- Análise de resultados
- Extração de insights
- Comparação de preços/produtos

#### 10. **PROACTIVE SUGGESTIONS** 🚨 MÉDIO
**Problema:** IA é reativa. Não sugere ações.

**Solução:**
- Detecta padrões de uso
- Sugere automações
- "Quer que eu faça X automaticamente?"
- Aprende preferências

---

## 🆕 TECNOLOGIAS REVOLUCIONÁRIAS DESCOBERTAS

### 1. **Browser-Use** (72.9k ⭐ GitHub)
```python
# O que é: Biblioteca Python para AI browser automation
# Por que é revolucionário: LLM controla browser nativamente

from browser_use import Agent

agent = Agent(
    task="Compare prices on Amazon and Mercado Livre",
    llm=ChatOpenAI(model="gpt-4o")
)
await agent.run()
```

**Capacidades:**
- ✅ Vision + HTML extraction (hybrid approach)
- ✅ Multi-tab management
- ✅ Element tracking via XPath
- ✅ Self-correcting mechanism
- ✅ Custom actions
- ✅ Stealth mode (bypass captchas)

**Como integrar no SyncAds:**
- Criar bridge Python ↔ Extension
- Usar no painel web para automações complexas
- Combinar com nosso sistema DOM

### 2. **Nanobrowser** (Open Source Chrome Extension)
```typescript
// O que é: AI web agent que roda no browser
// Por que é revolucionário: Multi-agent system

- Navigator Agent: Controla navegação
- Planner Agent: Planeja workflows
- Validator Agent: Valida resultados
```

**Capacidades:**
- ✅ Multi-agent architecture
- ✅ Side panel interface (igual ao nosso!)
- ✅ Conversation history
- ✅ Follow-up questions
- ✅ Multiple LLM support

**O que aprender:**
- Arquitetura multi-agente
- Sistema de validação
- Interface de side panel otimizada

### 3. **Playwright AI Features**
```typescript
// Recursos modernos para automação
await page.locator('text=Submit').click(); // Locator inteligente
await page.screenshot({ fullPage: true }); // Screenshot completo
await page.waitForLoadState('networkidle'); // Aguardar carregamento
```

**Capacidades:**
- ✅ Smart locators (text, role, label)
- ✅ Auto-waiting
- ✅ Network interception
- ✅ Geolocation spoofing

### 4. **Computer Vision Libraries**
```python
# OCR e detecção de elementos visuais
import pytesseract  # OCR
import cv2  # Computer Vision
from PIL import Image

# Detectar botões por cor/forma
# Ler texto em imagens
# Identificar campos de formulário
```

---

## 🏗️ ARQUITETURA PROPOSTA - IA 6.0

### **Sistema Multi-Contexto**

```
┌─────────────────────────────────────────────────────────────┐
│                    SYNCADS AI CORE                          │
│                  (Context-Aware Engine)                     │
└─────────────────────────────────────────────────────────────┘
            │                              │
            ├──────────────┐               ├──────────────┐
            ▼              ▼               ▼              ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
    │   EXTENSION  │ │   WEB PANEL  │ │   MOBILE     │ │     API      │
    │              │ │              │ │   (Futuro)   │ │  (Webhooks)  │
    └──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
    │ Capabilities │ │ Capabilities │
    ├──────────────┤ ├──────────────┤
    │ • DOM Control│ │ • Python Exec│
    │ • Navigation │ │ • Heavy Comp.│
    │ • Scraping   │ │ • Data Viz   │
    │ • Form Fill  │ │ • ML Models  │
    │ • Clicking   │ │ • Reports    │
    │ • Screenshot │ │ • Analytics  │
    └──────────────┘ └──────────────┘
```

### **Sistema de Agentes Inteligentes**

```typescript
interface AgentSystem {
  // AGENTE PRINCIPAL - Orquestrador
  orchestrator: {
    role: 'Decide qual agente usar';
    input: UserMessage;
    output: AgentAssignment;
  };

  // AGENTE NAVEGADOR - Controla DOM
  navigator: {
    role: 'Executa ações DOM';
    capabilities: ['click', 'type', 'scroll', 'navigate'];
    smartSelectors: SelectorEngine;
    visualFeedback: VisualEngine;
  };

  // AGENTE PLANEJADOR - Cria workflows
  planner: {
    role: 'Planeja sequências complexas';
    capabilities: ['workflow_creation', 'loop_detection', 'conditional_logic'];
  };

  // AGENTE VALIDADOR - Verifica resultados
  validator: {
    role: 'Valida execução';
    capabilities: ['screenshot_diff', 'state_check', 'retry_strategy'];
  };

  // AGENTE ANALISTA - Extrai insights
  analyst: {
    role: 'Analisa dados';
    capabilities: ['scraping', 'comparison', 'insights'];
  };
}
```

---

## 🎯 ROADMAP DE IMPLEMENTAÇÃO

### **FASE 1: DUAL CONTEXT AWARENESS** (3 dias) 🔴 CRÍTICO

#### Objetivos:
- ✅ IA sabe onde está (extensão vs painel)
- ✅ Sugere contexto correto para cada tarefa
- ✅ Migração automática entre contextos

#### Implementação:

**1.1. Adicionar Context Detection**
```typescript
// supabase/functions/chat-enhanced/index.ts

interface RequestContext {
  source: 'extension' | 'web_panel';
  capabilities: {
    dom: boolean;
    python: boolean;
    heavyComputation: boolean;
  };
  userAgent: string;
  currentUrl?: string;
}

// No início do request
const context: RequestContext = {
  source: req.headers.get('X-Context-Source') || 'web_panel',
  capabilities: {
    dom: extensionConnected,
    python: context.source === 'web_panel',
    heavyComputation: context.source === 'web_panel'
  }
};
```

**1.2. System Prompt Dinâmico por Contexto**
```typescript
const getContextualSystemPrompt = (context: RequestContext) => {
  if (context.source === 'extension') {
    return `
# 🌐 VOCÊ ESTÁ NA EXTENSÃO DO CHROME (Side Panel)

## ✅ O QUE VOCÊ PODE FAZER AQUI:
- 🖱️ **Controlar o navegador** (clicar, digitar, navegar)
- 📸 **Capturar screenshots**
- 📊 **Extrair dados de páginas**
- 📋 **Preencher formulários**
- 🔍 **Fazer pesquisas**
- 🎨 **Criar anúncios** (com automação visual)

## ❌ O QUE NÃO FUNCIONA AQUI:
- 🐍 **Python** (use o painel web)
- 📈 **Gráficos complexos** (use o painel web)
- 💾 **Processamento pesado** (use o painel web)

## 💡 QUANDO SUGERIR MIGRAR:
Se usuário pedir Python ou análise complexa, diga:
"Para executar Python, é melhor usar o painel web. Quer que eu te leve lá?"
`;
  } else {
    return `
# 💻 VOCÊ ESTÁ NO PAINEL WEB

## ✅ O QUE VOCÊ PODE FAZER AQUI:
- 🐍 **Executar Python** (pandas, numpy, matplotlib)
- 📈 **Criar gráficos e visualizações**
- 💾 **Processar grandes volumes de dados**
- 🤖 **Machine Learning**
- 📊 **Análises complexas**
- 📧 **Enviar emails**

## ❌ O QUE NÃO FUNCIONA AQUI:
- 🖱️ **Controlar navegador** (use a extensão)
- 📸 **Capturar páginas** (use a extensão)
- 🎨 **Criar anúncios visualmente** (use a extensão)

## 💡 QUANDO SUGERIR MIGRAR:
Se usuário pedir automação web, diga:
"Para controlar o navegador, use a extensão Chrome. Quer instalar?"
`;
  }
};
```

**1.3. Context Switcher UI**
```typescript
// Adicionar no frontend
const ContextSwitcher = () => {
  const { currentContext } = useAI();
  
  return (
    <div className="context-banner">
      {currentContext === 'web_panel' && (
        <Alert>
          💡 Para automação web, 
          <a href="/extension">instale a extensão</a>
        </Alert>
      )}
      {currentContext === 'extension' && (
        <Alert>
          💡 Para Python e análises, 
          <a href="/dashboard">use o painel</a>
        </Alert>
      )}
    </div>
  );
};
```

---

### **FASE 2: VISUAL FEEDBACK SYSTEM** (4 dias) 🔴 CRÍTICO

#### Objetivos:
- ✅ Usuário VÊ a IA trabalhando
- ✅ Highlight de elementos em tempo real
- ✅ Cursor virtual
- ✅ Progress overlay

#### Implementação:

**2.1. Visual Overlay System**
```typescript
// chrome-extension/visual-feedback.js

class VisualFeedback {
  private overlay: HTMLDivElement;
  private cursor: HTMLDivElement;
  private progressBar: HTMLDivElement;

  constructor() {
    this.createOverlay();
    this.createCursor();
    this.createProgressBar();
  }

  // Destacar elemento que será clicado
  highlightElement(selector: string) {
    const element = document.querySelector(selector);
    if (!element) return;

    element.classList.add('ai-highlight');
    
    // Criar outline animado
    const rect = element.getBoundingClientRect();
    const highlight = document.createElement('div');
    highlight.className = 'ai-highlight-box';
    highlight.style.cssText = `
      position: fixed;
      left: ${rect.left - 5}px;
      top: ${rect.top - 5}px;
      width: ${rect.width + 10}px;
      height: ${rect.height + 10}px;
      border: 3px solid #667eea;
      border-radius: 8px;
      pointer-events: none;
      z-index: 999999;
      animation: ai-pulse 1s infinite;
    `;
    document.body.appendChild(highlight);

    // Remover após 2s
    setTimeout(() => highlight.remove(), 2000);
  }

  // Mostrar cursor virtual movendo
  async moveCursorTo(selector: string) {
    const element = document.querySelector(selector);
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    // Animar cursor virtual
    this.cursor.style.display = 'block';
    await this.animateCursor(targetX, targetY);
    
    // "Clicar"
    this.showClickEffect(targetX, targetY);
  }

  // Mostrar progresso da tarefa
  showProgress(step: string, current: number, total: number) {
    this.progressBar.textContent = `${step} (${current}/${total})`;
    this.progressBar.style.width = `${(current / total) * 100}%`;
  }

  // Mostrar que está "pensando"
  showThinking(message: string) {
    const thinking = document.createElement('div');
    thinking.className = 'ai-thinking';
    thinking.innerHTML = `
      <div class="ai-brain-icon">🧠</div>
      <div class="ai-thinking-text">${message}</div>
      <div class="ai-dots">
        <span>.</span><span>.</span><span>.</span>
      </div>
    `;
    document.body.appendChild(thinking);
  }
}
```

**2.2. CSS Animations**
```css
/* chrome-extension/visual-feedback.css */

@keyframes ai-pulse {
  0%, 100% {
    border-color: #667eea;
    box-shadow: 0 0 20px rgba(102, 126, 234, 0.6);
  }
  50% {
    border-color: #764ba2;
    box-shadow: 0 0 40px rgba(118, 75, 162, 0.8);
  }
}

.ai-cursor {
  position: fixed;
  width: 24px;
  height: 24px;
  background: url('cursor-icon.svg');
  pointer-events: none;
  z-index: 999999;
  transition: all 0.3s ease-out;
}

.ai-thinking {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 999999;
  animation: slideInRight 0.3s ease-out;
}

.ai-dots span {
  animation: blink 1.4s infinite;
}

.ai-dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.ai-dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 60%, 100% { opacity: 0; }
  30% { opacity: 1; }
}
```

---

### **FASE 3: SMART SELECTORS ENGINE** (5 dias) 🔴 CRÍTICO

#### Objetivos:
- ✅ Múltiplos seletores com fallback
- ✅ Aprendizado de padrões
- ✅ Computer vision para identificar elementos
- ✅ Banco de seletores conhecidos

#### Implementação:

**3.1. Smart Selector Engine**
```typescript
// supabase/functions/_utils/smart-selector-engine.ts

interface SelectorStrategy {
  type: 'css' | 'xpath' | 'text' | 'aria' | 'visual';
  selector: string;
  confidence: number;
  fallback?: SelectorStrategy;
}

class SmartSelectorEngine {
  // Gerar múltiplos seletores para um elemento
  generateSelectors(description: string, context: string): SelectorStrategy[] {
    const strategies: SelectorStrategy[] = [];

    // 1. Seletores por texto
    if (this.hasText(description)) {
      strategies.push({
        type: 'text',
        selector: `text=${this.extractText(description)}`,
        confidence: 0.9
      });
    }

    // 2. Seletores por ARIA label
    strategies.push({
      type: 'aria',
      selector: `[aria-label*="${description}"]`,
      confidence: 0.85
    });

    // 3. Seletores por ID comum
    const commonIds = this.getCommonIds(description);
    commonIds.forEach(id => {
      strategies.push({
        type: 'css',
        selector: `#${id}`,
        confidence: 0.8
      });
    });

    // 4. Seletores por classe comum
    const commonClasses = this.getCommonClasses(description);
    commonClasses.forEach(cls => {
      strategies.push({
        type: 'css',
        selector: `.${cls}`,
        confidence: 0.7
      });
    });

    // 5. Seletores por tipo + atributos
    strategies.push({
      type: 'css',
      selector: `button[type="submit"], input[type="submit"]`,
      confidence: 0.6
    });

    // Ordenar por confidence
    return strategies.sort((a, b) => b.confidence - a.confidence);
  }

  // Banco de dados de seletores conhecidos por site
  private selectorDatabase = {
    'facebook.com': {
      loginButton: ['#loginbutton', '[data-testid="royal_login_button"]'],
      emailField: ['#email', 'input[name="email"]'],
      passwordField: ['#pass', 'input[name="pass"]']
    },
    'google.com': {
      searchBox: ['textarea[name="q"]', 'input[name="q"]'],
      searchButton: ['input[value="Google Search"]', 'button[name="btnK"]']
    },
    'instagram.com': {
      loginButton: ['button[type="submit"]', '//button[contains(text(), "Log in")]']
    }
  };

  // Buscar seletores conhecidos para o site
  getKnownSelectors(domain: string, element: string): string[] {
    return this.selectorDatabase[domain]?.[element] || [];
  }

  // Aprender novo seletor que funcionou
  async learnSelector(domain: string, description: string, selector: string, success: boolean) {
    // Salvar no banco para aprendizado
    await supabase.from('learned_selectors').insert({
      domain,
      description,
      selector,
      success,
      confidence: success ? 1.0 : 0.0,
      created_at: new Date().toISOString()
    });
  }
}
```

**3.2. Computer Vision Fallback**
```python
# python-service/visual_element_detector.py

import cv2
import pytesseract
from PIL import Image
import numpy as np

class VisualElementDetector:
    """Detecta elementos visualmente quando CSS falha"""
    
    def detect_button(self, screenshot: bytes, text: str) -> tuple[int, int]:
        """Encontra botão por OCR e reconhecimento de forma"""
        img = Image.open(io.BytesIO(screenshot))
        img_np = np.array(img)
        
        # OCR para encontrar texto
        ocr_data = pytesseract.image_to_data(img_np, output_type=pytesseract.Output.DICT)
        
        for i, word in enumerate(ocr_data['text']):
            if text.lower() in word.lower():
                x = ocr_data['left'][i]
                y = ocr_data['top'][i]
                w = ocr_data['width'][i]
                h = ocr_data['height'][i]
                
                # Retornar coordenadas do centro
                return (x + w//2, y + h//2)
        
        # Fallback: detectar por cor/forma
        return self.detect_by_shape(img_np, 'button')
    
    def detect_input_field(self, screenshot: bytes, field_type: str) -> tuple[int, int]:
        """Detecta campos de input visualmente"""
        # Usar edge detection e contornos
        # Identificar retângulos que parecem inputs
        pass
```

---

### **FASE 4: RESULT VALIDATION & AUTO-RETRY** (3 dias) 🔴 CRÍTICO

#### Objetivos:
- ✅ Screenshot antes/depois
- ✅ Validação de estado
- ✅ Retry automático com estratégias diferentes
- ✅ Feedback ao usuário

#### Implementação:

**4.1. Validation Engine**
```typescript
// supabase/functions/_utils/validation-engine.ts

interface ValidationResult {
  success: boolean;
  confidence: number;
  evidence: {
    screenshotBefore?: string;
    screenshotAfter?: string;
    domDiff?: DOMDiff;
    networkActivity?: NetworkEvent[];
  };
  errors?: string[];
}

class ValidationEngine {
  async validateCommandExecution(
    command: DomCommand,
    beforeState: PageState,
    afterState: PageState
  ): Promise<ValidationResult> {
    
    switch (command.type) {
      case 'NAVIGATE':
        return this.validateNavigation(command.params.url, afterState);
      
      case 'CLICK':
        return this.validateClick(beforeState, afterState);
      
      case 'FILL_FORM':
        return this.validateFormFill(command.params.formData, afterState);
      
      case 'SCREENSHOT':
        return this.validateScreenshot(afterState);
      
      default:
        return { success: true, confidence: 0.5 };
    }
  }

  private validateNavigation(targetUrl: string, afterState: PageState): ValidationResult {
    const currentUrl = afterState.url;
    const urlMatch = this.urlsMatch(targetUrl, currentUrl);
    
    return {
      success: urlMatch,
      confidence: urlMatch ? 1.0 : 0.0,
      evidence: {
        screenshotAfter: afterState.screenshot
      },
      errors: urlMatch ? [] : [`Expected ${targetUrl}, got ${currentUrl}`]
    };
  }

  private validateClick(before: PageState, after: PageState): ValidationResult {
    // Verificar se algo mudou
    const domChanged = JSON.stringify(before.dom) !== JSON.stringify(after.dom);
    const urlChanged = before.url !== after.url;
    const networkActivity = after.networkEvents.length > before.networkEvents.length;
    
    const success = domChanged || urlChanged || networkActivity;
    
    return {
      success,
      confidence: success ? 0.8 : 0.2,
      evidence: {
        screenshotBefore: before.screenshot,
        screenshotAfter: after.screenshot,
        domDiff: this.computeDomDiff(before.dom, after.dom),
        networkActivity: after.networkEvents
      }
    };
  }

  // Estratégia de retry inteligente
  async retryWithFallback(
    command: DomCommand,
    failedAttempts: number
  ): Promise<DomCommand> {
    
    if (failedAttempts === 1) {
      // Primeira tentativa: tentar seletor alternativo
      return {
        ...command,
        params: {
          ...command.params,
          selector: this.getAlternativeSelector(command.params.selector)
        }
      };
    }
    
    if (failedAttempts === 2) {
      // Segunda tentativa: usar visual detection
      return {
        ...command,
        params: {
          ...command.params,
          useVisualDetection: true
        }
      };
    }
    
    if (failedAttempts === 3) {
      // Terceira tentativa: scroll e retry
      return {
        type: 'SCROLL',
        params: { position: 'element', selector: command.params.selector },
        nextCommand: command
      };
    }
    
    // Desistir após 3 tentativas
    throw new Error(`Failed after ${failedAttempts} attempts`);
  }
}
```

---

### **FASE 5: WORKFLOW AUTOMATION** (5 dias) 🟡 ALTO

#### Objetivos:
- ✅ Sequências de comandos
- ✅ Loops e condicionais
- ✅ Variáveis e contexto compartilhado
- ✅ Error handling robusto

#### Implementação:

**5.1. Workflow Engine**
```typescript
// supabase/functions/_utils/workflow-engine.ts

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  variables: Record<string, any>;
  errorHandler: ErrorHandler;
}

interface WorkflowStep {
  id: string;
  type: 'command' | 'condition' | 'loop' | 'wait' | 'extract';
  command?: DomCommand;
  condition?: Condition;
  loop?: Loop;
  onSuccess?: string; // Next step ID
  onFailure?: string;
}

interface Condition {
  type: 'element_exists' | 'text_contains' | 'url_matches' | 'variable_equals';
  params: Record<string, any>;
}

interface Loop {
  type: 'while' | 'for' | 'forEach';
  condition: Condition;
  steps: WorkflowStep[];
  maxIterations: number;
}

class WorkflowEngine {
  async execute(workflow: Workflow): Promise<WorkflowResult> {
    const context = new WorkflowContext(workflow.variables);
    const results: StepResult[] = [];
    
    let currentStepId = workflow.steps[0].id;
    
    while (currentStepId) {
      const step = workflow.steps.find(s => s.id === currentStepId);
      if (!step) break;
      
      try {
        const result = await this.executeStep(step, context);
        results.push(result);
        
        currentStepId = result.success ? step.onSuccess : step.onFailure;
      } catch (error) {
        // Error handling
        if (workflow.errorHandler) {
          await this.handleError(error, workflow.errorHandler, context);
        }
        throw error;
      }
    }
    
    return {
      success: results.every(r => r.success),
      steps: results,
      finalContext: context.getAll()
    };
  }

  private async executeStep(step: WorkflowStep, context: WorkflowContext): Promise<StepResult> {
    switch (step.type) {
      case 'command':
        return await this.executeCommand(step.command, context