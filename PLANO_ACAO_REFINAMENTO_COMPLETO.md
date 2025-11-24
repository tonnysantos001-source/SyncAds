# 🎯 PLANO DE AÇÃO - REFINAMENTO E NOVOS RECURSOS
## SyncAds AI Assistant - Arquitetura Híbrida Inteligente

---

## 📋 ÍNDICE
1. [Visão Geral](#visão-geral)
2. [Arquitetura Híbrida](#arquitetura-híbrida)
3. [Fase 1: Refinamento & Estabilidade](#fase-1-refinamento--estabilidade)
4. [Fase 2: Novos Recursos](#fase-2-novos-recursos)
5. [Fase 3: Limpeza de Integrações](#fase-3-limpeza-de-integrações)
6. [Cronograma e Prioridades](#cronograma-e-prioridades)

---

## 🎯 VISÃO GERAL

### Objetivo Principal
Evoluir o SyncAds AI para um assistente de automação web com IA híbrida, capaz de:
- ✅ Manipular DOM via Side Panel (Chrome Extension)
- ✅ Processar tarefas complexas via Backend Python
- ✅ Escolher automaticamente a melhor ferramenta para cada tarefa
- ✅ Tentar múltiplas estratégias até conseguir o resultado

### Arquitetura Atual
```
┌─────────────────────────────────────────────────────────────┐
│                    USUÁRIO (Chrome)                          │
└─────────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
┌─────────▼──────────┐         ┌─────────▼──────────┐
│   SIDE PANEL       │         │   PYTHON SERVICE    │
│   (Extension)      │         │   (Railway)         │
│                    │         │                     │
│ • DOM Actions      │         │ • Web Scraping      │
│ • Quick Actions    │         │ • ML/AI Processing  │
│ • Fast Response    │         │ • Heavy Tasks       │
└────────────────────┘         └─────────────────────┘
          │                               │
          └───────────────┬───────────────┘
                          │
                ┌─────────▼──────────┐
                │   SUPABASE         │
                │   (Database + AI)  │
                └────────────────────┘
```

---

## 🧠 ARQUITETURA HÍBRIDA

### Decisão Inteligente: Quando Usar Cada Ferramenta

#### 🎨 **Side Panel (DOM) - RÁPIDO**
Usar para:
- ✅ Clicar em elementos (`CLICK_ELEMENT`)
- ✅ Preencher formulários (`FILL_FORM`, `TYPE_TEXT`)
- ✅ Navegar entre páginas (`NAVIGATE`)
- ✅ Screenshots (`SCREENSHOT`)
- ✅ Extrair dados visíveis (`EXTRACT_TEXT`, `GET_PAGE_INFO`)
- ✅ Scroll e interações básicas (`SCROLL_TO`)
- ✅ Executar JavaScript simples (`EXECUTE_JS`)

**Características:**
- ⚡ Ultra-rápido (< 1s)
- 🎯 Acesso direto ao DOM
- 🔒 Seguro (contexto isolado)
- 🎨 Feedback visual imediato

#### 🐍 **Python Service - PODEROSO**
Usar para:
- ✅ Web scraping avançado (Playwright, Selenium, Scrapy)
- ✅ Análise de grandes volumes de dados
- ✅ Machine Learning / IA
- ✅ Processamento de imagens
- ✅ Integração com APIs complexas
- ✅ Automação multi-step complexa
- ✅ NLP e análise de texto

**Características:**
- 🚀 Poderoso (bibliotecas avançadas)
- 📊 Processamento pesado
- 🔄 Persistência e retry automático
- 🧪 Múltiplas estratégias

**Bibliotecas Disponíveis:**
```python
# Scraping Avançado
- playwright==1.41.2
- selenium==4.17.2
- scrapy==2.11.0
- pyppeteer==2.0.0
- selenium-wire==5.1.0

# Machine Learning
- scikit-learn==1.4.0
- xgboost==2.0.3
- lightgbm==4.3.0

# NLP
- spacy==3.7.2
- nltk==3.8.1
- textblob==0.17.1

# Async & Performance
- aiohttp==3.9.3
- aiofiles==23.2.1
```

### 🎯 Estratégia de Decisão da IA

```javascript
// Pseudocódigo da lógica de decisão
function decideTool(task) {
  if (task.requiresDOMAccess && task.isSimple) {
    return 'SIDE_PANEL';
  }
  
  if (task.requiresHeavyProcessing || task.requiresML) {
    return 'PYTHON_SERVICE';
  }
  
  if (task.requiresMultipleStrategies) {
    return 'PYTHON_SERVICE'; // Pode tentar várias bibliotecas
  }
  
  // Default: tenta Side Panel primeiro, depois Python
  return 'SIDE_PANEL_FIRST';
}
```

---

## 📍 FASE 1: REFINAMENTO & ESTABILIDADE

### 1.1 🎨 **Melhorar Comandos DOM**

#### A) Form Filling - Preenchimento Inteligente
**Status:** 🟡 Parcialmente implementado
**Prioridade:** 🔥 ALTA

**Melhorias Necessárias:**

```javascript
// ANTES: Preenchimento básico
FILL_FORM({
  "#email": "user@example.com",
  "#password": "123456"
})

// DEPOIS: Preenchimento inteligente com validação
FILL_FORM_SMART({
  fields: {
    "#email": {
      value: "user@example.com",
      validate: true,
      waitForElement: true,
      clearBefore: true
    },
    "#password": {
      value: "123456",
      type: "password",
      waitForElement: true
    },
    "#terms": {
      type: "checkbox",
      checked: true
    },
    "#country": {
      type: "select",
      value: "BR",
      byText: "Brasil"
    }
  },
  options: {
    autoSubmit: false,
    validateAll: true,
    waitBetweenFields: 300,
    scrollToFields: true,
    highlightFields: true // Feedback visual
  }
})
```

**Implementação:**
- [ ] Detectar tipo de campo automaticamente
- [ ] Validar campos antes de preencher
- [ ] Scroll automático para campos
- [ ] Feedback visual (highlight)
- [ ] Suporte a campos dinâmicos (React, Vue, Angular)
- [ ] Retry inteligente se falhar
- [ ] Validação pós-preenchimento

**Arquivo:** `chrome-extension/content-script.js`

---

#### B) Performance DOM - Otimização

**Melhorias:**

```javascript
// 1. Cache de seletores
const selectorCache = new Map();

function getCachedElement(selector) {
  if (selectorCache.has(selector)) {
    const cached = selectorCache.get(selector);
    if (document.contains(cached)) return cached;
  }
  
  const element = document.querySelector(selector);
  if (element) selectorCache.set(selector, element);
  return element;
}

// 2. Batch de ações DOM
const domBatch = [];
function batchDOMAction(action) {
  domBatch.push(action);
  if (domBatch.length >= 10) {
    processBatch();
  }
}

// 3. Mutation Observer inteligente
const observer = new MutationObserver((mutations) => {
  // Só processar mudanças relevantes
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      selectorCache.clear(); // Invalidar cache
    }
  });
});
```

**Implementação:**
- [ ] Cache de seletores CSS
- [ ] Batch processing de ações DOM
- [ ] Debounce/Throttle de eventos
- [ ] Lazy loading de comandos
- [ ] Intersection Observer para visibilidade
- [ ] RequestIdleCallback para tarefas não urgentes

---

#### C) Comandos Adicionais

```javascript
// Novos comandos a implementar:

// 1. Upload de arquivo
UPLOAD_FILE({
  selector: "#file-input",
  filePath: "C:/Users/.../document.pdf"
})

// 2. Drag and Drop
DRAG_DROP({
  source: "#item-1",
  target: "#dropzone"
})

// 3. Hover e Mouse Events
HOVER({
  selector: "#menu-item",
  duration: 1000, // ms
  triggerSubmenu: true
})

// 4. Keyboard Shortcuts
KEYBOARD({
  keys: "Ctrl+S",
  element: "#editor"
})

// 5. Esperar por condição
WAIT_CONDITION({
  condition: "element.textContent.includes('Success')",
  selector: "#status",
  timeout: 10000
})

// 6. Extrair estrutura completa
EXTRACT_STRUCTURE({
  selector: "#product-list",
  depth: 3, // Níveis de profundidade
  includeHidden: false,
  format: "json"
})

// 7. Comparar elementos
COMPARE_ELEMENTS({
  selector1: "#before",
  selector2: "#after",
  compareAttributes: ["text", "style", "attributes"]
})
```

---

### 1.2 🎨 **Melhorar Feedbacks Visuais**

#### A) Indicadores de Status

```javascript
// Sistema de feedback visual no Side Panel
const FeedbackSystem = {
  // 1. Loading states
  showLoading(action) {
    return `
      <div class="loading-indicator">
        <div class="spinner"></div>
        <span>Executando: ${action}</span>
      </div>
    `;
  },
  
  // 2. Success animations
  showSuccess(message) {
    return `
      <div class="success-toast">
        ✅ ${message}
      </div>
    `;
  },
  
  // 3. Progress bars
  showProgress(current, total) {
    const percent = (current / total) * 100;
    return `
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percent}%"></div>
        <span>${current}/${total}</span>
      </div>
    `;
  },
  
  // 4. Highlight de elementos
  highlightElement(element) {
    element.style.outline = '3px solid #3b82f6';
    element.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
    
    setTimeout(() => {
      element.style.outline = '';
      element.style.boxShadow = '';
    }, 2000);
  }
};
```

**Implementação:**
- [ ] Loading spinners para ações longas
- [ ] Toast notifications elegantes
- [ ] Progress bars para multi-step
- [ ] Highlight de elementos manipulados
- [ ] Animações suaves (Framer Motion)
- [ ] Sound effects opcionais
- [ ] Confetti para sucessos importantes

---

#### B) Micro-interações

```css
/* Animações e transições */

/* 1. Hover states */
.quick-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 2. Active states */
.quick-action-btn:active {
  transform: scale(0.95);
}

/* 3. Focus states */
.input:focus {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* 4. Loading pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 5. Success checkmark */
@keyframes checkmark {
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}

/* 6. Shake on error */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}
```

---

### 1.3 ⚡ **Otimizar Performance**

#### A) Side Panel

```javascript
// 1. Virtual Scrolling para histórico
import { useVirtualizer } from '@tanstack/react-virtual';

function ChatHistory() {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      {virtualizer.getVirtualItems().map(virtualItem => (
        <div key={virtualItem.key}>
          <Message data={messages[virtualItem.index]} />
        </div>
      ))}
    </div>
  );
}

// 2. Debounce de input
import { useDebouncedCallback } from 'use-debounce';

const debouncedSave = useDebouncedCallback(
  (value) => saveToSupabase(value),
  1000
);

// 3. Lazy loading de componentes
const QuickActions = lazy(() => import('./QuickActions'));
const ChatHistory = lazy(() => import('./ChatHistory'));

// 4. Memoização agressiva
const MessageItem = memo(({ message }) => {
  return <div>{message.content}</div>;
}, (prev, next) => {
  return prev.message.id === next.message.id &&
         prev.message.content === next.message.content;
});
```

**Implementação:**
- [ ] Virtual scrolling para listas grandes
- [ ] Lazy loading de componentes pesados
- [ ] Memoização de componentes
- [ ] Debounce de inputs
- [ ] Code splitting
- [ ] Service Worker para cache
- [ ] IndexedDB para histórico local

---

#### B) Content Script

```javascript
// Otimizações do content-script

// 1. Executar apenas quando necessário
let isActive = false;
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'ACTIVATE') {
    isActive = true;
    initializeContentScript();
  }
});

// 2. Limpar listeners quando não usar
function cleanup() {
  document.removeEventListener('click', clickHandler);
  observer.disconnect();
  selectorCache.clear();
}

// 3. Throttle de eventos de scroll
const throttledScroll = throttle(() => {
  // Processar scroll
}, 100);

window.addEventListener('scroll', throttledScroll);

// 4. RequestAnimationFrame para animações
function smoothScroll(element) {
  let start = null;
  
  function animate(timestamp) {
    if (!start) start = timestamp;
    const progress = timestamp - start;
    
    // Scroll animation
    element.scrollTop = easeInOut(progress);
    
    if (progress < 1000) {
      requestAnimationFrame(animate);
    }
  }
  
  requestAnimationFrame(animate);
}
```

---

### 1.4 🐛 **Testar e Corrigir Bugs**

#### Checklist de Testes

**Comandos DOM:**
- [ ] CLICK_ELEMENT - Todos os tipos de elementos
- [ ] FILL_FORM - Formulários complexos
- [ ] TYPE_TEXT - Campos dinâmicos (React, Vue)
- [ ] SCREENSHOT - Full page e elementos
- [ ] EXTRACT_TABLE - Tabelas complexas
- [ ] EXTRACT_IMAGES - Lazy loading
- [ ] NAVIGATE - Novas abas e mesma aba
- [ ] SCROLL_TO - Smooth scroll
- [ ] WAIT_ELEMENT - Timeout handling
- [ ] EXECUTE_JS - Segurança e sandbox

**Side Panel:**
- [ ] Abrir/fechar sem lag
- [ ] Múltiplas conversas simultâneas
- [ ] Histórico infinito (virtual scroll)
- [ ] Quick actions funcionando
- [ ] Menu lateral suave
- [ ] Input responsivo
- [ ] Atalhos de teclado

**Integração:**
- [ ] Comunicação Extension <-> Background
- [ ] Comunicação Background <-> Supabase
- [ ] Comunicação Supabase <-> Python Service
- [ ] Tratamento de erros em cada camada
- [ ] Retry automático
- [ ] Fallback strategies

---

## 📍 FASE 2: NOVOS RECURSOS

### 2.1 🔄 **Automação Multi-Step**

#### Sistema de Workflows

```javascript
// Definir workflows complexos
const workflow = {
  id: 'checkout-automation',
  name: 'Automatizar Checkout',
  steps: [
    {
      id: 'step-1',
      action: 'NAVIGATE',
      params: { url: 'https://example.com/products' },
      onSuccess: 'step-2',
      onError: 'retry'
    },
    {
      id: 'step-2',
      action: 'EXTRACT_PRODUCTS',
      params: { selector: '.product-item' },
      onSuccess: 'step-3',
      validate: (result) => result.length > 0
    },
    {
      id: 'step-3',
      action: 'CLICK_ELEMENT',
      params: { selector: '.product-item:first-child .add-to-cart' },
      waitAfter: 1000,
      onSuccess: 'step-4'
    },
    {
      id: 'step-4',
      action: 'FILL_FORM',
      params: {
        '#email': 'user@example.com',
        '#address': 'Rua Example, 123'
      },
      validate: (result) => result.filled.length === 2,
      onSuccess: 'step-5'
    },
    {
      id: 'step-5',
      action: 'CLICK_ELEMENT',
      params: { selector: '#submit-order' },
      onSuccess: 'complete'
    }
  ],
  options: {
    retryOnError: true,
    maxRetries: 3,
    screenshotOnError: true,
    notifyOnComplete: true
  }
};

// Executor de workflows
class WorkflowExecutor {
  async execute(workflow) {
    const results = [];
    
    for (const step of workflow.steps) {
      try {
        console.log(`Executando: ${step.id}`);
        
        const result = await this.executeStep(step);
        results.push({ step: step.id, success: true, result });
        
        // Validar resultado se necessário
        if (step.validate && !step.validate(result)) {
          throw new Error('Validation failed');
        }
        
        // Aguardar se especificado
        if (step.waitAfter) {
          await this.wait(step.waitAfter);
        }
        
      } catch (error) {
        console.error(`Erro no step ${step.id}:`, error);
        
        // Retry ou abortar
        if (step.onError === 'retry') {
          await this.retryStep(step, workflow.options.maxRetries);
        } else {
          break;
        }
      }
    }
    
    return results;
  }
  
  async executeStep(step) {
    return await chrome.runtime.sendMessage({
      action: step.action,
      params: step.params
    });
  }
  
  async retryStep(step, maxRetries) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`Retry ${i + 1}/${maxRetries} para ${step.id}`);
        await this.wait(1000 * (i + 1)); // Backoff exponencial
        return await this.executeStep(step);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
      }
    }
  }
  
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

**Implementação:**
- [ ] Sistema de steps com dependências
- [ ] Validação de cada step
- [ ] Retry automático inteligente
- [ ] Screenshot em cada etapa
- [ ] Logs detalhados
- [ ] Pausar/retomar workflow
- [ ] Salvar progresso no Supabase
- [ ] UI para criar workflows visualmente

---

### 2.2 🕷️ **Web Scraping Avançado**

#### Sistema Inteligente com Fallback

```python
# python-service/app/services/scraping_service.py

class IntelligentScraper:
    """
    Scraper inteligente que tenta múltiplas estratégias
    até conseguir extrair os dados desejados
    """
    
    def __init__(self):
        self.strategies = [
            self.strategy_playwright,
            self.strategy_selenium,
            self.strategy_scrapy,
            self.strategy_requests,
            self.strategy_beautifulsoup
        ]
        
    async def scrape(self, url: str, target: dict):
        """
        Tenta extrair dados usando múltiplas estratégias
        """
        errors = []
        
        for strategy in self.strategies:
            try:
                print(f"🔍 Tentando estratégia: {strategy.__name__}")
                result = await strategy(url, target)
                
                if self.validate_result(result, target):
                    print(f"✅ Sucesso com {strategy.__name__}")
                    return {
                        'success': True,
                        'data': result,
                        'strategy': strategy.__name__
                    }
                    
            except Exception as e:
                print(f"❌ Falhou {strategy.__name__}: {e}")
                errors.append({
                    'strategy': strategy.__name__,
                    'error': str(e)
                })
                continue
        
        # Nenhuma estratégia funcionou
        return {
            'success': False,
            'errors': errors
        }
    
    async def strategy_playwright(self, url: str, target: dict):
        """Estratégia 1: Playwright (JavaScript rendering)"""
        from playwright.async_api import async_playwright
        
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page()
            
            # Configurar user agent
            await page.set_extra_http_headers({
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            })
            
            await page.goto(url, wait_until='networkidle')
            
            # Esperar por elemento alvo
            if target.get('wait_selector'):
                await page.wait_for_selector(target['wait_selector'])
            
            # Extrair dados
            data = await page.evaluate(f"""
                () => {{
                    const selector = '{target['selector']}';
                    const elements = document.querySelectorAll(selector);
                    return Array.from(elements).map(el => ({
                        text: el.textContent.trim(),
                        html: el.innerHTML,
                        attributes: Object.fromEntries(
                            Array.from(el.attributes).map(a => [a.name, a.value])
                        )
                    }));
                }}
            """)
            
            await browser.close()
            return data
    
    async def strategy_selenium(self, url: str, target: dict):
        """Estratégia 2: Selenium (mais robusto)"""
        from selenium import webdriver
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
        
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        driver = webdriver.Chrome(options=options)
        
        try:
            driver.get(url)
            
            # Esperar elemento
            if target.get('wait_selector'):
                WebDriverWait(driver, 10).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, target['wait_selector']))
                )
            
            # Extrair dados
            elements = driver.find_elements(By.CSS_SELECTOR, target['selector'])
            
            data = []
            for element in elements:
                data.append({
                    'text': element.text,
                    'html': element.get_attribute('innerHTML'),
                    'attributes': {
                        attr: element.get_attribute(attr)
                        for attr in ['href', 'src', 'class', 'id']
                        if element.get_attribute(attr)
                    }
                })
            
            return data
            
        finally:
            driver.quit()
    
    async def strategy_scrapy(self, url: str, target: dict):
        """Estratégia 3: Scrapy (mais rápido)"""
        import scrapy
        from scrapy.crawler import CrawlerProcess
        
        class QuickSpider(scrapy.Spider):
            name = 'quick'
            start_urls = [url]
            
            def parse(self, response):
                selector = target['selector']
                for element in response.css(selector):
                    yield {
                        'text': element.css('::text').get(),
                        'html': element.get(),
                        'attributes': element.attrib
                    }
        
        # Executar Scrapy
        process = CrawlerProcess()
        process.crawl(QuickSpider)
        process.start()
    
    async def strategy_requests(self, url: str, target: dict):
        """Estratégia 4: Requests + BeautifulSoup (mais simples)"""
        import requests
        from bs4 import BeautifulSoup
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
        
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        elements = soup.select(target['selector'])
        
        data = []
        for element in elements:
            data.append({
                'text': element.get_text(strip=True),
                'html': str(element),
                'attributes': dict(element.attrs)
            })
        
        return data
    
    async def strategy_beautifulsoup(self, url: str, target: dict):
        """Estratégia 5: BeautifulSoup puro"""
        # Implementação similar
        pass
    
    def validate_result(self, result: any, target: dict) -> bool:
        """Valida se o resultado atende os critérios"""
        if not result:
            return False
        
        # Verificar quantidade mínima
        if target.get('min_results'):
            if len(result) < target['min_results']:
                return False
        
        # Verificar campos obrigatórios
        if target.get('required_fields'):
            for item in result:
                for field in target['required_fields']:
                    if field not in item or not item[field]:
                        return False
        
        return True


# Endpoint FastAPI
@app.post("/api/scrape")
async def scrape_endpoint(request: ScrapeRequest):
    """
    Endpoint inteligente de scraping
    """
    scraper = IntelligentScraper()
    
    result = await scraper.scrape(
        url=request.url,
        target={
            'selector': request.selector,
            'wait_selector': request.wait_selector,
            'min_results': request.min_results,
            'required_fields': request.required_fields
        }
    )
    
    return result
```

**Implementação:**
- [ ] Sistema de fallback com 5 estratégias
- [ ] Validação de resultados
- [ ] Retry inteligente
- [ ] Cache de resultados
- [ ] Rate limiting
- [ ] Proxy rotation (opcional)
- [ ] CAPTCHA solver (opcional)
- [ ] Screenshot em caso de erro

---

### 2.3 🎯 **Comandos Específicos**

#### Automações Específicas do E-commerce

```javascript
// Comandos específicos para SyncAds

// 1. Extrair produtos de qualquer loja
EXTRACT_PRODUCTS({
  platform: 'auto', // Detectar automaticamente
  includeVariants: true,
  includeImages: true,
  includePrice: true,
  includeStock: true
})

// 2. Adicionar produto ao carrinho
ADD_TO_CART({
  productId: '123',
  quantity: 2,
  variant: 'Tamanho M'
})

// 3. Automatizar checkout
AUTO_CHECKOUT({
  customerData: {
    email: 'user@example.com',
    name: 'João Silva',
    phone: '11999999999',
    address: {
      street: 'Rua Example',
      number: '123',
      city: 'São Paulo',
      state: 'SP',
      zip: '01234-567'
    }
  },
  paymentMethod: 'pix',
  stopBeforePayment: true
})

// 4. Monitorar estoque
MONITOR_STOCK({
  productUrl: 'https://example.com/product/123',
  checkInterval: 60000, // 1 minuto
  notifyWhenAvailable: true
})

// 5. Comparar preços
COMPARE_PRICES({
  product: 'iPhone 15 Pro',
  stores: [
    'https://store1.com',
    'https://store2.com',
    'https://store3.com'
  ]
})

// 6. Extrair reviews
EXTRACT_REVIEWS({
  productUrl: 'https://example.com/product/123',
  maxReviews: 100,
  includeRatings: true,
  includeDates: true
})
```

---

## 📍 FASE 3: LIMPEZA DE INTEGRAÇÕES

### 3.1 🗑️ **Integrações a Remover**

#### Lista Completa

**❌ REMOVER:**
1. Google Ads
2. Google Analytics
3. Google Merchant Center
4. Meta Ads (Facebook + Instagram)
5. TikTok Ads
6. LinkedIn Ads
7. Twitter/X Ads

**✅ MANTER:**
1. VTEX
2. Nuvemshop
3. Shopify
4. WooCommerce
5. Loja Integrada

---

#### Arquivos a Modificar

**1. Frontend (UI):**
```
src/lib/integrations/oauthConfig.ts
src/pages/app/IntegrationsPage.tsx
src/pages/app/IntegrationDetailPage.tsx
src/pages/app/tracking/PixelsPage.tsx
src/config/integrations.ts
src/data/integrations.ts
```

**2. Backend (Supabase):**
```
supabase/functions/oauth-callback/
supabase/functions/google-ads-sync/
supabase/functions/meta-ads-sync/
supabase/functions/tiktok-ads-sync/
```

**3. Database:**
```sql
-- Remover colunas/tabelas antigas
ALTER TABLE integrations DROP COLUMN IF EXISTS google_ads_config;
ALTER TABLE integrations DROP COLUMN IF EXISTS meta_ads_config;
-- etc...
```

---

### 3.2 🔧 **Plano de Remoção**

#### Passo 1: Backup
```bash
# Backup do banco antes de remover
pg_dump $DATABASE_URL > backup_before_cleanup_$(date +%Y%m%d).sql

# Backup de arquivos
git add .
git commit -m "Backup antes de remover integrações antigas"
git tag backup-integrations-$(date +%Y%m%d)
```

#### Passo 2: Remover Frontend

```typescript
// src/lib/integrations/oauthConfig.ts
// ANTES: 7 integrações OAuth
// DEPOIS: 0 integrações OAuth (E-commerce não precisa)

export const OAUTH_CONFIGS: Record<string, OAuthProviderConfig> = {
  // ❌ REMOVER TUDO
  // Mantemos apenas integrações diretas via API key
};
```

```typescript
// src/config/integrations.ts
export const AVAILABLE_INTEGRATIONS = [
  // ✅ MANTER
  {
    id: 'vtex',
    name: 'VTEX',
    category: 'ecommerce',
    authType: 'api_key'
  },
  {
    id: 'nuvemshop',
    name: 'Nuvemshop',
    category: 'ecommerce',
    authType: 'api_key'
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'ecommerce',
    authType: 'api_key'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    category: 'ecommerce',
    authType: 'api_key'
  },
  {
    id: 'loja_integrada',
    name: 'Loja Integrada',
    category: 'ecommerce',
    authType: 'api_key'
  }
  // ❌ REMOVER: google_ads, meta_ads, tiktok_ads, linkedin_ads, etc.
];
```

#### Passo 3: Remover Edge Functions

```bash
# Listar edge functions a remover
supabase functions list

# Deletar edge functions antigas
supabase functions delete oauth-callback
supabase functions delete google-ads-sync
supabase functions delete meta-ads-sync
supabase functions delete tiktok-ads-sync
supabase functions delete linkedin-ads-sync
supabase functions delete twitter-ads-sync
```

#### Passo 4: Limpar Database

```sql
-- Script de limpeza de integrações
-- Arquivo: cleanup-integrations.sql

-- 1. Backup de dados importantes
CREATE TABLE integrations_backup AS 
SELECT * FROM integrations 
WHERE platform IN ('vtex', 'nuvemshop', 'shopify', 'woocommerce', 'loja_integrada');

-- 2. Remover integrações antigas
DELETE FROM integrations 
WHERE platform NOT IN ('vtex', 'nuvemshop', 'shopify', 'woocommerce', 'loja_integrada');

-- 3. Remover colunas OAuth antigas (se existirem)
ALTER TABLE integrations DROP COLUMN IF EXISTS oauth_token;
ALTER TABLE integrations DROP COLUMN IF EXISTS oauth_refresh_token;
ALTER TABLE integrations DROP COLUMN IF EXISTS oauth_expires_at;

-- 4. Simplificar estrutura
ALTER TABLE integrations 
  DROP COLUMN IF EXISTS google_ads_config,
  DROP COLUMN IF EXISTS meta_ads_config,
  DROP COLUMN IF EXISTS tiktok_ads_config;

-- 5. Adicionar colunas para e-commerce (se não existirem)
ALTER TABLE integrations 
  ADD COLUMN IF NOT EXISTS api_key TEXT,
  ADD COLUMN IF NOT EXISTS api_secret TEXT,
  ADD COLUMN IF NOT EXISTS store_url TEXT,
  ADD COLUMN IF NOT EXISTS store_id TEXT;

-- 6. Remover tabelas de sincronização antigas
DROP TABLE IF EXISTS google_ads_campaigns CASCADE;
DROP TABLE IF EXISTS meta_ads_campaigns CASCADE;
DROP TABLE IF EXISTS tiktok_ads_campaigns CASCADE;

-- 7. Verificar resultado
SELECT platform, COUNT(*) as total
FROM integrations
GROUP BY platform;
```

#### Passo 5: Limpar Pixels

```sql
-- Limpar configurações de pixels antigos
DELETE FROM pixels 
WHERE type NOT IN ('FACEBOOK', 'TIKTOK', 'GOOGLE_ADS');

-- Ou renomear para tipos de e-commerce
UPDATE pixels 
SET type = 'CONVERSION_TRACKING'
WHERE type IN ('FACEBOOK', 'GOOGLE_ADS', 'TIKTOK');
```

---

### 3.3 📝 **Checklist de Remoção**

#### Frontend
- [ ] Remover `oauthConfig.ts` ou limpar completamente
- [ ] Atualizar `IntegrationsPage.tsx` - remover cards de ads
- [ ] Atualizar `IntegrationDetailPage.tsx` - remover lógica OAuth
- [ ] Atualizar `PixelsPage.tsx` - simplificar tipos
- [ ] Remover imports não utilizados
- [ ] Remover componentes OAuth antigos
- [ ] Atualizar tipos TypeScript

#### Backend
- [ ] Deletar edge functions de ads
- [ ] Limpar tabelas de sincronização
- [ ] Remover colunas OAuth
- [ ] Backup de dados importantes
- [ ] Executar script de limpeza
- [ ] Verificar foreign keys
- [ ] Atualizar políticas RLS

#### Documentação
- [ ] Atualizar README
- [ ] Remover docs de integrações antigas
- [ ] Criar guia de migração
- [ ] Atualizar arquitetura
- [ ] Notificar usuários (se necessário)

---

## 📅 CRONOGRAMA E PRIORIDADES

### Sprint 1: Refinamento DOM (1 semana)
**Objetivo:** Melhorar performance e confiabilidade dos comandos DOM

**Dias 1-2: Form Filling Inteligente**
- [ ] Implementar detecção de tipo de campo
- [ ] Adicionar validação pré-preenchimento
- [ ] Scroll automático para campos
- [ ] Feedback visual (highlight)
- [ ] Testar com formulários complexos

**Dias 3-4: Performance**
- [ ] Cache de seletores CSS
- [ ] Batch processing de ações
- [ ] Virtual scrolling no Side Panel
- [ ] Lazy loading de componentes
- [ ] Memoização agressiva

**Dias 5-7: Comandos Adicionais**
- [ ] UPLOAD_FILE
- [ ] DRAG_DROP
- [ ] HOVER
- [ ] KEYBOARD
- [ ] WAIT_CONDITION
- [ ] EXTRACT_STRUCTURE
- [ ] Testes end-to-end

**Entrega:**
- ✅ Form filling 3x mais rápido
- ✅ Side Panel fluido (60fps)
- ✅ 7 novos comandos funcionando
- ✅ Cobertura de testes > 80%

---

### Sprint 2: Web Scraping Inteligente (1 semana)
**Objetivo:** Implementar sistema de scraping com múltiplas estratégias

**Dias 1-3: Backend Python**
- [ ] Implementar `IntelligentScraper`
- [ ] Configurar Playwright
- [ ] Configurar Selenium
- [ ] Configurar Scrapy
- [ ] Sistema de fallback

**Dias 4-5: Validação e Retry**
- [ ] Validador de resultados
- [ ] Retry inteligente
- [ ] Cache de resultados
- [ ] Rate limiting
- [ ] Logs detalhados

**Dias 6-7: Integração e Testes**
- [ ] Endpoint FastAPI
- [ ] Integração com Supabase
- [ ] Testes com sites reais
- [ ] Documentação
- [ ] Deploy no Railway

**Entrega:**
- ✅ Scraping funcionando em 95% dos sites
- ✅ Fallback automático entre estratégias
- ✅ API REST completa
- ✅ Documentação técnica

---

### Sprint 3: Automação Multi-Step (1 semana)
**Objetivo:** Sistema de workflows complexos

**Dias 1-3: Engine de Workflows**
- [ ] Definir estrutura de workflows
- [ ] Implementar executor
- [ ] Sistema de retry
- [ ] Validação de steps
- [ ] Salvar progresso

**Dias 4-5: UI Visual**
- [ ] Builder de workflows no Side Panel
- [ ] Drag and drop de steps
- [ ] Preview em tempo real
- [ ] Templates prontos
- [ ] Histórico de execuções

**Dias 6-7: Testes e Refinamento**
- [ ] Testar workflows complexos
- [ ] Otimizar performance
- [ ] Documentação
- [ ] Vídeos tutoriais

**Entrega:**
- ✅ Sistema de workflows funcionando
- ✅ UI visual intuitiva
- ✅ 10 templates prontos
- ✅ Documentação completa

---

### Sprint 4: Limpeza de Integrações (3 dias)
**Objetivo:** Remover integrações antigas e simplificar

**Dia 1: Planejamento e Backup**
- [ ] Listar todos os arquivos afetados
- [ ] Backup completo do banco
- [ ] Backup do código (git tag)
- [ ] Notificar stakeholders
- [ ] Criar branch `cleanup-integrations`

**Dia 2: Execução**
- [ ] Remover OAuth do frontend
- [ ] Deletar edge functions
- [ ] Limpar database
- [ ] Atualizar tipos TypeScript
- [ ] Remover imports não usados
- [ ] Testes

**Dia 3: Verificação e Deploy**
- [ ] Verificar que nada quebrou
- [ ] Testar integrações mantidas (VTEX, etc)
- [ ] Atualizar documentação
- [ ] Code review
- [ ] Deploy gradual
- [ ] Monitorar erros

**Entrega:**
- ✅ Código 40% mais limpo
- ✅ Apenas 5 integrações mantidas
- ✅ Performance melhorada
- ✅ Zero breaking changes para usuários

---

### Sprint 5: Feedbacks e Micro-interações (3 dias)
**Objetivo:** UX de alto nível

**Dia 1: Sistema de Feedbacks**
- [ ] Loading states elegantes
- [ ] Toast notifications
- [ ] Progress bars
- [ ] Success animations
- [ ] Error handling visual

**Dia 2: Micro-interações**
- [ ] Hover states suaves
- [ ] Active states
- [ ] Focus states
- [ ] Transitions CSS
- [ ] Sound effects (opcional)
- [ ] Confetti celebrations

**Dia 3: Polish Final**
- [ ] Testar em múltiplos sites
- [ ] Ajustar timings
- [ ] Otimizar animações
- [ ] Accessibility (a11y)
- [ ] Dark mode perfeito

**Entrega:**
- ✅ UX premium
- ✅ Animações suaves (60fps)
- ✅ Feedback em cada ação
- ✅ Acessibilidade completa

---

## 🎯 MÉTRICAS DE SUCESSO

### Performance
- [ ] Side Panel abre em < 500ms
- [ ] Comandos DOM executam em < 1s (média)
- [ ] Form filling 3x mais rápido
- [ ] Virtual scroll suporta 10k+ mensagens
- [ ] Scraping funciona em 95% dos sites

### Confiabilidade
- [ ] Taxa de sucesso > 95% em comandos DOM
- [ ] Sistema de fallback funciona sempre
- [ ] Retry automático em 100% dos casos
- [ ] Zero crashes no Side Panel
- [ ] Logs completos de todas as ações

### UX
- [ ] NPS > 8/10
- [ ] Tempo de aprendizado < 5 minutos
- [ ] Satisfação com animações > 9/10
- [ ] Zero reclamações de lentidão
- [ ] 100% de acessibilidade

### Código
- [ ] Cobertura de testes > 80%
- [ ] Linhas de código reduzidas em 30%
- [ ] Zero vulnerabilidades de segurança
- [ ] Documentação 100% atualizada
- [ ] TypeScript strict mode

---

## 🚀 SCRIPTS DE EXECUÇÃO

### Script 1: Setup Inicial
```bash
#!/bin/bash
# setup-refinamento.sh

echo "🚀 Setup Inicial - SyncAds AI Refinamento"

# 1. Criar branches
git checkout -b refinamento-dom
git checkout -b scraping-inteligente
git checkout -b cleanup-integrations

# 2. Instalar dependências Python
cd python-service
pip install -r requirements-scraping.txt

# 3. Instalar dependências Playwright
playwright install chromium

# 4. Configurar variáveis de ambiente
cp .env.example .env
echo "⚠️ Configure suas variáveis em .env"

# 5. Testar conexões
echo "🔍 Testando conexões..."
python -c "from playwright.sync_api import sync_playwright; print('✅ Playwright OK')"
node -e "console.log('✅ Node OK')"

echo "✅ Setup completo!"
```

### Script 2: Limpar Integrações
```bash
#!/bin/bash
# cleanup-integrations.sh

echo "🗑️ Limpeza de Integrações Antigas"

# 1. Backup
echo "📦 Criando backup..."
git add .
git commit -m "Backup antes de limpar integrações"
git tag backup-integrations-$(date +%Y%m%d)

# 2. Backup database
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# 3. Remover arquivos frontend
echo "🗑️ Removendo arquivos frontend..."
# Manter apenas e-commerce configs

# 4. Deletar edge functions
echo "🗑️ Deletando edge functions..."
supabase functions delete oauth-callback --force
supabase functions delete google-ads-sync --force
supabase functions delete meta-ads-sync --force
supabase functions delete tiktok-ads-sync --force

# 5. Limpar database
echo "🗑️ Limpando database..."
psql $DATABASE_URL < cleanup-integrations.sql

echo "✅ Limpeza completa!"
echo "📊 Verificar resultados no Supabase Dashboard"
```

### Script 3: Deploy Completo
```bash
#!/bin/bash
# deploy-refinamento.sh

echo "🚀 Deploy - SyncAds AI Refinamento"

# 1. Testes
echo "🧪 Executando testes..."
npm run test
pytest python-service/tests/

# 2. Build
echo "🔨 Building..."
npm run build

# 3. Deploy Extension
echo "📦 Empacotando extensão..."
cd chrome-extension
zip -r syncads-extension-v5.0.0.zip .
echo "✅ Extensão pronta: syncads-extension-v5.0.0.zip"

# 4. Deploy Python Service
echo "🐍 Deploy Python Service..."
cd ../python-service
railway up

# 5. Deploy Edge Functions
echo "⚡ Deploy Edge Functions..."
cd ../supabase/functions
supabase functions deploy chat-enhanced

# 6. Deploy Frontend
echo "🌐 Deploy Frontend..."
cd ../..
vercel --prod

echo "✅ Deploy completo!"
echo "🎉 SyncAds AI v5.0 está no ar!"
```

### Script 4: Teste End-to-End
```bash
#!/bin/bash
# test-e2e.sh

echo "🧪 Testes End-to-End"

# 1. Testar comandos DOM
echo "🎨 Testando comandos DOM..."
node chrome-extension/tests/test-dom-commands.js

# 2. Testar scraping
echo "🕷️ Testando scraping..."
pytest python-service/tests/test_scraping.py

# 3. Testar workflows
echo "🔄 Testando workflows..."
node chrome-extension/tests/test-workflows.js

# 4. Testar performance
echo "⚡ Testando performance..."
npm run test:performance

echo "✅ Todos os testes passaram!"
```

---

## 📚 RECURSOS ADICIONAIS

### Documentação a Criar
1. **FORM_FILLING_GUIDE.md** - Guia completo de preenchimento de formulários
2. **SCRAPING_STRATEGIES.md** - Estratégias de web scraping
3. **WORKFLOWS_TUTORIAL.md** - Tutorial de criação de workflows
4. **PERFORMANCE_GUIDE.md** - Guia de otimização de performance
5. **MIGRATION_GUIDE.md** - Guia de migração das integrações antigas

### Vídeos Tutoriais
1. 🎥 "Como usar o Side Panel"
2. 🎥 "Criando workflows visuais"
3. 🎥 "Web scraping inteligente"
4. 🎥 "Form filling avançado"
5. 🎥 "Integrações com e-commerce"

---

## 🎯 PRÓXIMOS PASSOS IMEDIATOS

### Hoje (Prioritário)
1. ✅ Ler e validar este plano
2. [ ] Executar `setup-refinamento.sh`
3. [ ] Começar Sprint 1 - Dia 1 (Form Filling)
4. [ ] Criar branch `refinamento-dom`
5. [ ] Implementar primeiros comandos melhorados

### Esta Semana
1. [ ] Completar Sprint 1 (Refinamento DOM)
2. [ ] Testar com formulários reais
3. [ ] Documentar novos comandos
4. [ ] Preparar Sprint 2

### Este Mês
1. [ ] Completar todas as 5 Sprints
2. [ ] Deploy de v5.0
3. [ ] Coletar feedback de usuários
4. [ ] Iterar e melhorar

---

## 🤝 SUPORTE E FEEDBACK

Precisa de ajuda? Siga estes passos:

1. **Dúvidas técnicas:** Consulte a documentação
2. **Bugs:** Abra uma issue no GitHub
3. **Sugestões:** Use o sistema de feedback no Side Panel
4. **Urgente:** Entre em contato direto

---

## 📝 NOTAS FINAIS

- 🎯 **Foco:** Prioridade é estabilidade e performance
- 🚀 **Velocidade:** Sprints curtas e entregas rápidas
- 🧪 **Qualidade:** Testes em tudo
- 📚 **Documentação:** Essencial para adoção
- 🎨 **UX:** Diferencial competitivo

**Lembre-se:** A IA deve ser inteligente o suficiente para escolher a melhor ferramenta (Side Panel ou Python) para cada tarefa, e tentar múltiplas estratégias até conseguir o resultado!

---

**Versão:** 1.0  
**Data:** Janeiro 2025  
**Status:** 🟢 Pronto para execução  
**Próxima revisão:** Após Sprint 1
```