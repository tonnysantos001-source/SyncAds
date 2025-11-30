# 🚀 PLANO DE AÇÃO IMEDIATO - IA 6.0 SUPERINTELIGENTE

**Data:** Janeiro 2025  
**Prazo:** 2 semanas (Sprint Intensivo)  
**Status:** 🔥 PRONTO PARA EXECUTAR

---

## 📊 RESUMO EXECUTIVO

Transformar o SyncAds AI na **IA de automação web mais avançada do mercado** em 2 semanas, implementando:

1. ✅ **Dual Context Awareness** - IA sabe onde está (extensão vs painel)
2. ✅ **Visual Feedback System** - Usuário vê IA trabalhando
3. ✅ **Smart Selectors** - Seletores inteligentes com fallback
4. ✅ **Result Validation** - Validação automática + retry
5. ✅ **Workflow Automation** - Sequências complexas
6. ✅ **Ad Creation AI** - Criar anúncios automaticamente
7. ✅ **Search Intelligence** - Pesquisas avançadas com insights
8. ✅ **Form Intelligence** - Preenchimento automático inteligente

---

## 🎯 SEMANA 1: FUNDAÇÕES CRÍTICAS

### DIA 1-2: DUAL CONTEXT AWARENESS (PRIORIDADE MÁXIMA)

#### ✅ O QUE IMPLEMENTAR

**1. Integrar context-awareness.ts no chat-enhanced**

```bash
# Arquivo já criado: supabase/functions/_utils/context-awareness.ts
# Agora integrar no chat-enhanced
```

**Modificações necessárias:**

```typescript
// supabase/functions/chat-enhanced/index.ts

import {
  detectContext,
  getContextualSystemPrompt,
  validateCommandForContext,
  generateProactiveSuggestions,
} from '../_utils/context-awareness.ts';

// Linha ~25, adicionar no início do request handler:
const context = detectContext(req.headers);

console.log('🎯 Context detected:', {
  source: context.source,
  capabilities: context.capabilities,
  hasExtension: context.capabilities.includes('dom'),
});

// Linha ~930, substituir system prompt:
const finalSystemPrompt = getContextualSystemPrompt(context);

// Antes de criar comando DOM, validar:
const validation = validateCommandForContext(command.type, context);
if (!validation.allowed) {
  return new Response(
    JSON.stringify({
      error: validation.reason,
      suggestion: validation.suggestion,
      alternativeContext: validation.alternativeContext,
    }),
    { status: 400, headers: corsHeaders }
  );
}

// Gerar sugestões proativas:
const suggestions = generateProactiveSuggestions(
  message,
  context,
  conversationHistory
);

if (suggestions.length > 0) {
  response += '\n\n💡 **Sugestões:**\n';
  suggestions.forEach(s => {
    response += `- ${s.message} (${s.benefit})\n`;
  });
}
```

**2. Adicionar headers na extensão**

```javascript
// chrome-extension/sidepanel.js

async function sendMessageToAI(message) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-enhanced`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      
      // 🆕 ADICIONAR ESTES HEADERS:
      'X-Context-Source': 'extension',
      'X-Extension-Connected': 'true',
      'X-Extension-Version': chrome.runtime.getManifest().version,
      'X-Current-URL': window.location.href,
    },
    body: JSON.stringify({
      message,
      conversationId,
      extensionConnected: true, // Manter por compatibilidade
    }),
  });
}
```

**3. Adicionar headers no painel web**

```typescript
// src/pages/ChatPage.tsx ou componente de chat

const sendMessage = async (message: string) => {
  const response = await supabase.functions.invoke('chat-enhanced', {
    body: {
      message,
      conversationId,
      extensionConnected: false,
    },
    headers: {
      'X-Context-Source': 'web_panel',
      'X-Extension-Connected': String(extensionInstalled),
    },
  });
};
```

#### 📋 CHECKLIST DIA 1-2

- [ ] Integrar context-awareness.ts no chat-enhanced
- [ ] Adicionar headers na extensão
- [ ] Adicionar headers no painel web
- [ ] Testar: IA reconhece contexto
- [ ] Testar: IA sugere migração corretamente
- [ ] Deploy da edge function

**Teste:**
```
Extensão: "execute python"
Esperado: "Para Python, use o painel web!"

Painel: "abra o facebook"
Esperado: "Para controlar navegador, use a extensão!"
```

---

### DIA 3-4: VISUAL FEEDBACK SYSTEM

#### ✅ O QUE IMPLEMENTAR

**1. Criar sistema de feedback visual**

```bash
# Criar arquivo
touch chrome-extension/visual-feedback.js
```

```javascript
// chrome-extension/visual-feedback.js

class VisualFeedbackEngine {
  constructor() {
    this.injectStyles();
  }

  // Highlight elemento antes de clicar
  highlightElement(selector) {
    const element = document.querySelector(selector);
    if (!element) return;

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
      box-shadow: 0 0 20px rgba(102, 126, 234, 0.8);
      pointer-events: none;
      z-index: 999999;
      animation: ai-pulse 1s infinite;
    `;
    document.body.appendChild(highlight);

    setTimeout(() => highlight.remove(), 2000);
  }

  // Mostrar cursor virtual
  showCursor(x, y) {
    const cursor = document.createElement('div');
    cursor.className = 'ai-cursor';
    cursor.innerHTML = '🖱️';
    cursor.style.cssText = `
      position: fixed;
      left: ${x - 12}px;
      top: ${y - 12}px;
      font-size: 24px;
      pointer-events: none;
      z-index: 999999;
      animation: cursor-move 0.3s ease-out;
    `;
    document.body.appendChild(cursor);

    setTimeout(() => cursor.remove(), 1000);
  }

  // Mostrar "pensando"
  showThinking(message) {
    const thinking = document.createElement('div');
    thinking.id = 'ai-thinking';
    thinking.className = 'ai-thinking-box';
    thinking.innerHTML = `
      <div class="ai-brain">🧠</div>
      <div class="ai-message">${message}</div>
      <div class="ai-dots">
        <span>.</span><span>.</span><span>.</span>
      </div>
    `;
    thinking.style.cssText = `
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
    `;
    
    document.body.appendChild(thinking);
  }

  hideThinking() {
    const thinking = document.getElementById('ai-thinking');
    if (thinking) thinking.remove();
  }

  // Mostrar progresso
  showProgress(step, current, total) {
    let progressBar = document.getElementById('ai-progress');
    
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'ai-progress';
      progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: #e0e0e0;
        z-index: 999999;
      `;
      
      const fill = document.createElement('div');
      fill.id = 'ai-progress-fill';
      fill.style.cssText = `
        height: 100%;
        background: linear-gradient(90deg, #667eea, #764ba2);
        transition: width 0.3s ease;
      `;
      
      progressBar.appendChild(fill);
      document.body.appendChild(progressBar);
    }

    const fill = document.getElementById('ai-progress-fill');
    fill.style.width = `${(current / total) * 100}%`;

    if (current >= total) {
      setTimeout(() => progressBar.remove(), 1000);
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
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

      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      @keyframes cursor-move {
        0% { transform: scale(1.5); }
        100% { transform: scale(1); }
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
    `;
    document.head.appendChild(style);
  }
}

// Inicializar
window.visualFeedback = new VisualFeedbackEngine();
```

**2. Integrar no content-script.js**

```javascript
// chrome-extension/content-script.js

// Adicionar no início do executeDomCommand
async function executeDomCommand(command) {
  const { type, data } = command;

  // 🆕 ADICIONAR FEEDBACK VISUAL
  if (window.visualFeedback) {
    window.visualFeedback.showThinking(`Executando ${type}...`);
  }

  try {
    let result = null;

    switch (type) {
      case "DOM_CLICK":
        // 🆕 Highlight antes de clicar
        if (window.visualFeedback && data.selector) {
          window.visualFeedback.highlightElement(data.selector);
          await sleep(500); // Delay para usuário ver
        }
        result = await executeClick(data.selector);
        break;

      case "NAVIGATE":
        // 🆕 Mostrar progresso
        if (window.visualFeedback) {
          window.visualFeedback.showProgress('Carregando página', 0, 1);
        }
        result = await executeNavigation(data.url, true);
        if (window.visualFeedback) {
          window.visualFeedback.showProgress('Carregando página', 1, 1);
        }
        break;

      // ... outros casos
    }

    // 🆕 Remover "pensando"
    if (window.visualFeedback) {
      window.visualFeedback.hideThinking();
    }

    return { success: true, result };
  } catch (error) {
    if (window.visualFeedback) {
      window.visualFeedback.hideThinking();
    }
    throw error;
  }
}
```

**3. Adicionar script no manifest.json**

```json
{
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": [
        "visual-feedback.js",
        "content-script.js"
      ],
      "run_at": "document_idle"
    }
  ]
}
```

#### 📋 CHECKLIST DIA 3-4

- [ ] Criar visual-feedback.js
- [ ] Integrar no content-script.js
- [ ] Adicionar no manifest.json
- [ ] Testar: highlight de elementos
- [ ] Testar: cursor virtual
- [ ] Testar: "pensando" aparece
- [ ] Testar: barra de progresso

---

### DIA 5-6: SMART SELECTORS ENGINE

#### ✅ O QUE IMPLEMENTAR

**1. Criar banco de seletores conhecidos**

```sql
-- Executar no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS learned_selectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  element_description TEXT NOT NULL,
  selector TEXT NOT NULL,
  selector_type TEXT NOT NULL, -- 'css', 'xpath', 'text', 'aria'
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  confidence DECIMAL DEFAULT 0.5,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(domain, element_description, selector)
);

CREATE INDEX idx_learned_selectors_domain ON learned_selectors(domain);
CREATE INDEX idx_learned_selectors_confidence ON learned_selectors(confidence DESC);

-- Inserir seletores conhecidos para sites populares
INSERT INTO learned_selectors (domain, element_description, selector, selector_type, confidence) VALUES
-- Facebook
('facebook.com', 'login_button', '#loginbutton', 'css', 0.95),
('facebook.com', 'login_button', '[data-testid="royal_login_button"]', 'css', 0.90),
('facebook.com', 'email_field', '#email', 'css', 0.95),
('facebook.com', 'password_field', '#pass', 'css', 0.95),

-- Google
('google.com', 'search_box', 'textarea[name="q"]', 'css', 0.98),
('google.com', 'search_box', 'input[name="q"]', 'css', 0.95),
('google.com', 'search_button', 'input[value="Pesquisa Google"]', 'css', 0.90),

-- Instagram
('instagram.com', 'login_button', 'button[type="submit"]', 'css', 0.85),
('instagram.com', 'username_field', 'input[name="username"]', 'css', 0.95),
('instagram.com', 'password_field', 'input[name="password"]', 'css', 0.95),

-- YouTube
('youtube.com', 'search_box', 'input#search', 'css', 0.95),
('youtube.com', 'search_button', 'button#search-icon-legacy', 'css', 0.90),

-- LinkedIn
('linkedin.com', 'login_button', 'button[type="submit"]', 'css', 0.85),
('linkedin.com', 'email_field', 'input#username', 'css', 0.95),
('linkedin.com', 'password_field', 'input#password', 'css', 0.95),

-- Amazon
('amazon.com.br', 'search_box', 'input#twotabsearchtextbox', 'css', 0.95),
('amazon.com.br', 'search_button', 'input#nav-search-submit-button', 'css', 0.90),

-- Mercado Livre
('mercadolivre.com.br', 'search_box', 'input[name="as_word"]', 'css', 0.90),
('mercadolivre.com.br', 'search_button', 'button[type="submit"]', 'css', 0.85);
```

**2. Criar smart-selector-engine.ts**

```typescript
// supabase/functions/_utils/smart-selector-engine.ts

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface SelectorStrategy {
  type: 'css' | 'xpath' | 'text' | 'aria';
  selector: string;
  confidence: number;
}

export async function generateSmartSelectors(
  supabase: SupabaseClient,
  description: string,
  domain: string
): Promise<SelectorStrategy[]> {
  const strategies: SelectorStrategy[] = [];

  // 1. Buscar seletores aprendidos do banco
  const { data: learned } = await supabase
    .from('learned_selectors')
    .select('selector, selector_type, confidence')
    .eq('domain', domain)
    .ilike('element_description', `%${description}%`)
    .order('confidence', { ascending: false })
    .limit(3);

  if (learned) {
    learned.forEach(l => {
      strategies.push({
        type: l.selector_type as any,
        selector: l.selector,
        confidence: l.confidence,
      });
    });
  }

  // 2. Gerar seletores genéricos por texto
  const textVariations = [
    description,
    description.toLowerCase(),
    description.toUpperCase(),
  ];

  textVariations.forEach(text => {
    strategies.push({
      type: 'text',
      selector: `text=${text}`,
      confidence: 0.8,
    });
  });

  // 3. Gerar seletores por ARIA label
  strategies.push({
    type: 'aria',
    selector: `[aria-label*="${description}"]`,
    confidence: 0.75,
  });

  // 4. Gerar seletores comuns por tipo
  const commonPatterns = getCommonPatterns(description);
  commonPatterns.forEach(pattern => {
    strategies.push({
      type: 'css',
      selector: pattern,
      confidence: 0.7,
    });
  });

  // Ordenar por confidence e remover duplicatas
  return Array.from(
    new Map(strategies.map(s => [s.selector, s])).values()
  ).sort((a, b) => b.confidence - a.confidence);
}

function getCommonPatterns(description: string): string[] {
  const desc = description.toLowerCase();
  const patterns: string[] = [];

  // Botões
  if (desc.includes('button') || desc.includes('botão') || desc.includes('btn')) {
    patterns.push('button[type="submit"]');
    patterns.push('input[type="submit"]');
    patterns.push('.btn');
    patterns.push('[role="button"]');
  }

  // Login
  if (desc.includes('login') || desc.includes('entrar') || desc.includes('sign in')) {
    patterns.push('#login');
    patterns.push('.login-button');
    patterns.push('[data-testid*="login"]');
  }

  // Busca
  if (desc.includes('search') || desc.includes('busca') || desc.includes('pesquisa')) {
    patterns.push('input[type="search"]');
    patterns.push('input[name*="search"]');
    patterns.push('.search-box');
  }

  // Email
  if (desc.includes('email') || desc.includes('e-mail')) {
    patterns.push('input[type="email"]');
    patterns.push('input[name="email"]');
    patterns.push('#email');
  }

  // Senha
  if (desc.includes('password') || desc.includes('senha')) {
    patterns.push('input[type="password"]');
    patterns.push('input[name="password"]');
    patterns.push('#password');
  }

  return patterns;
}

// Registrar sucesso/falha de seletor
export async function recordSelectorResult(
  supabase: SupabaseClient,
  domain: string,
  description: string,
  selector: string,
  type: string,
  success: boolean
) {
  const { data: existing } = await supabase
    .from('learned_selectors')
    .select('*')
    .eq('domain', domain)
    .eq('element_description', description)
    .eq('selector', selector)
    .maybeSingle();

  if (existing) {
    // Atualizar existente
    const successCount = success ? existing.success_count + 1 : existing.success_count;
    const failureCount = success ? existing.failure_count : existing.failure_count + 1;
    const totalAttempts = successCount + failureCount;
    const confidence = successCount / totalAttempts;

    await supabase
      .from('learned_selectors')
      .update({
        success_count: successCount,
        failure_count: failureCount,
        confidence,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Criar novo
    await supabase
      .from('learned_selectors')
      .insert({
        domain,
        element_description: description,
        selector,
        selector_type: type,
        success_count: success ? 1 : 0,
        failure_count: success ? 0 : 1,
        confidence: success ? 1.0 : 0.0,
        last_used_at: new Date().toISOString(),
      });
  }
}
```

**3. Integrar no dom-command-detector.ts**

```typescript
// Modificar detectClick, detectFill, etc para usar smart selectors

import { generateSmartSelectors } from './smart-selector-engine.ts';

async function detectClick(message: string, supabase: SupabaseClient, domain: string): Promise<DomCommand | null> {
  for (const pattern of CLICK_PATTERNS) {
    const match = message.match(pattern.regex);
    if (match) {
      const description = match[1]?.trim();
      if (description) {
        // 🆕 USAR SMART SELECTORS
        const selectors = await generateSmartSelectors(supabase, description, domain);
        
        return {
          type: 'CLICK',
          params: {
            description,
            selectors: selectors.map(s => s.selector),
            primarySelector: selectors[0]?.selector,
          },
          confidence: pattern.confidence,
          originalMessage: message,
        };
      }
    }
  }

  return null;
}
```

#### 📋 CHECKLIST DIA 5-6

- [ ] Criar tabela learned_selectors
- [ ] Inserir seletores conhecidos
- [ ] Criar smart-selector-engine.ts
- [ ] Integrar no dom-command-detector
- [ ] Testar: fallback de seletores
- [ ] Testar: aprendizado funciona

---

### DIA 7: RESULT VALIDATION & AUTO-RETRY

#### ✅ O QUE IMPLEMENTAR

**1. Adicionar validação no processCommand (background.js)**

```javascript
// chrome-extension/background.js

async function processCommand(cmd) {
  Logger.info("Processing command", { id: cmd.id, command: cmd.command_type });

  try {
    // Marcar como PROCESSING
    await updateCommandStatus(cmd.id, "processing", {
      executed_at: new Date().toISOString(),
    });

    // 🆕 CAPTURAR SCREENSHOT ANTES
    const screenshotBefore = await captureScreenshot();

    // Executar comando
    const response = await sendCommandToContentScript(cmd);

    // 🆕 CAPTURAR SCREENSHOT DEPOIS
    const screenshotAfter = await captureScreenshot();

    // 🆕 VALIDAR RESULTADO
    const validation = await validateResult(
      cmd.command_type,
      cmd.params,
      response,
      screenshotBefore,
      screenshotAfter
    );

    if (!validation.success) {
      // 🆕 RETRY COM ESTRATÉGIA DIFERENTE
      Logger.warn("Command validation failed, retrying...", validation);
      
      const retryCmd = await generateRetryStrategy(cmd, validation);
      return await processCommand(retryCmd);
    }

    // Marcar como COMPLETED
    await updateCommandStatus(cmd.id, "completed", {
      result: response,
      validation: validation,
      executed_at: new Date().toISOString(),
    });

    Logger.success("✅ Command executed successfully", { id: cmd.id });
  } catch (error) {
    Logger.error("❌ Command execution failed", error, { id: cmd.id });

    // Marcar como FAILED
    await updateCommandStatus(cmd.id, "failed", {
      error: error.message,
      executed_at: new Date().toISOString(),
    });
  }
}

async function validateResult(type, params, response, before, after) {
  switch (type) {
    case 'NAVIGATE':
      // Verificar se URL mudou
      const urlChanged = before.url !== after.url;
      return {
        success: urlChanged,
        confidence: urlChanged ? 1.0 : 0.0,
        evidence: { screenshotAfter: after.dataUrl }
      };

    case 'CLICK':
      // Verificar se algo mudou (DOM, URL, network)
      const somethingChanged = 
        before.html !== after.html ||
        before.url !== after.url;
      return {
        success: somethingChanged,
        confidence: somethingChanged ? 0.8 : 0.2,
        evidence: { before: before.dataUrl, after: after.dataUrl }
      };

    default:
      return { success: true, confidence: 0.5 };
  }
}

async function generateRetryStrategy(cmd, validation) {
  // Primeira tentativa: usar seletor alternativo
  if (cmd.params.selectors && cmd.params.selectors.length > 1) {
    return {
      ...cmd,
      params: {
        ...cmd.params,
        primarySelector: cmd.params.selectors[1], // Próximo seletor
      }
    };
  }

  // Segunda tentativa: scroll e retry
  return {
    type: 'SCROLL',
    params: { position: 'element', selector: cmd.params.primarySelector },
    nextCommand: cmd
  };
}

async function captureScreenshot() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
  
  return {
    url: tab.url,
    html: await getPageHTML(tab.id),
    dataUrl,
  };
}
```

#### 📋 CHECKLIST DIA 7

- [ ] Adicionar validação no background.js
- [ ] Implementar retry com fallback
- [ ] Testar: retry funciona
- [ ] Testar: screenshots capturados

---

## 🎯 SEMANA 2: FEATURES AVANÇADAS

### DIA 8-10: WORKFLOW AUTOMATION

**Implementar:**
- [ ] Sistema de workflows (sequências de comandos)
- [ ] Loops e condicionais
- [ ] Variáveis compartilhadas
- [ ] Error handling robusto

### DIA 11-12: AD CREATION AI

**Implementar:**
- [ ] Workflows para Meta Ads
- [ ] Workflows para Google Ads
- [ ] Upload de imagens
- [ ] Preenchimento inteligente

### DIA 13-14: SEARCH INTELLIGENCE & FORM FILLING

**Implementar:**
- [ ] Refinamento automático de buscas
- [ ] Comparação de produtos/preços
- [ ] Auto-detecção de campos
- [ ] Validação de formato

---

## 📦 SCRIPTS PRONTOS PARA EXECUTAR

### Deploy Completo

```bash
#!/bin/bash
# deploy-ia-6.0.sh

echo "🚀 Deploying SyncAds AI 6.0..."

# 1. Aplicar migrations SQL
echo "📊 Applying database migrations..."
supabase db push

# 2. Deploy edge functions
echo "🔧 Deploying edge functions..."
supabase functions deploy chat-enhanced

# 3. Recarregar extensão
echo "🔄 Reload extension manually at chrome://extensions/"

echo "✅ Deployment complete!"
echo "🧪 Test with: 'abra o facebook'"
```

### Teste Completo

```bash
#!/bin/bash
# test-ia-6.0.sh

echo "🧪 Testing SyncAds AI 6.0..."

# Teste 1: Context detection
echo "Test 1: Context Detection"
curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-enhanced \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Context-Source: extension" \
  -H "Content-Type: application/json" \
  -d '{"message": "execute python"}'

# Teste 2: DOM command
echo "Test 2: DOM Command"
curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-enhanced \
  -H "Authorization: Bearer TOKEN" \
  -H "X-Context-Source: extension" \
  -H "X-Extension-Connected: true" \
  -H "Content-Type: application/json" \
  -d '{"message": "abra o facebook"}'

echo "✅ Tests complete!"
```

---

## 📊 MÉTRICAS DE SUCESSO

### Semana 1
- ✅ IA reconhece contexto em 100% dos casos
- ✅ Visual feedback funciona em 95%+ dos comandos
- ✅ Smart selectors reduzem falhas em 40%
- ✅ Auto-retry resolve 60%+ das falhas

### Semana 2
- ✅ Workflows funcionam end-to-end
- ✅ Criar anúncio do zero em < 2 min
- ✅ Pesquisas inteligentes com insights
- ✅ Formulários preenchidos automaticamente

---

## 🎓 TREINAMENTO DA EQUIPE

### Docs Necessários
1. [ ] "Como funciona o Dual Context"
2. [ ] "Criar workflows customizados"
3. [ ] "Adicionar novos seletores"
4. [ ] "Troubleshooting comum"

### Vídeos Demo
1. [ ] Demo: Context Awareness
2. [ ] Demo: Visual Feedback