# 🧠 AI CORE SYSTEM - SyncAds Universal Intelligence

Sistema de Inteligência Artificial Universal para o SaaS SyncAds. Gerencia decisões inteligentes, automação de navegador, execução de Python e integração com mais de 300 bibliotecas especializadas.

---

## 📋 ÍNDICE

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Componentes Principais](#-componentes-principais)
- [Instalação](#-instalação)
- [Uso Básico](#-uso-básico)
- [Exemplos Avançados](#-exemplos-avançados)
- [API Reference](#-api-reference)
- [Módulos Disponíveis](#-módulos-disponíveis)
- [Roadmap](#-roadmap)

---

## 🎯 VISÃO GERAL

O **AI Core System** é o cérebro do SyncAds, responsável por:

- ✅ **Análise Inteligente** de requisições do usuário
- ✅ **Tomada de Decisão** automática sobre qual ferramenta usar
- ✅ **Automação de Navegador** via extensão Chrome
- ✅ **Execução de Scripts Python** com 300+ bibliotecas
- ✅ **Fallback Automático** quando algo falha
- ✅ **Sistema de Memória** para aprendizado contínuo
- ✅ **Retry Inteligente** com estratégias adaptativas

---

## 🏗️ ARQUITETURA

```
┌─────────────────────────────────────────────────────────┐
│                     AI SYSTEM                            │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │  CORE BRAIN │  │   PROMPT     │  │    BROWSER     │ │
│  │             │  │   LIBRARY    │  │   AUTOMATION   │ │
│  │  - Decisões │  │   REGISTRY   │  │   CONTROLLER   │ │
│  │  - Fluxo    │  │              │  │                │ │
│  │  - Memória  │  │  - 300+      │  │  - Selenium    │ │
│  │  - Retry    │  │    Módulos   │  │  - Puppeteer   │ │
│  │  - Fallback │  │  - Prompts   │  │  - Extension   │ │
│  └──────┬──────┘  └──────┬───────┘  └────────┬───────┘ │
└─────────┼─────────────────┼───────────────────┼─────────┘
          │                 │                   │
          └─────────────────┴───────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
   ┌────▼────┐                           ┌─────▼──────┐
   │  Python │                           │  Chrome    │
   │ Service │                           │ Extension  │
   │ Railway │                           │            │
   └─────────┘                           └────────────┘
```

---

## 🔧 COMPONENTES PRINCIPAIS

### 1. **CORE BRAIN** (`core-brain.ts`)

O cérebro central que coordena tudo.

**Responsabilidades:**
- Analisar requisições do usuário
- Detectar intent e keywords
- Escolher ferramenta apropriada
- Criar planos de execução
- Gerenciar retry e fallback
- Manter memória de sessão
- Aprender com erros

**Classes Principais:**
```typescript
CoreAI
├── analyzeRequest()     // Analisa pedido do usuário
├── makeDecision()       // Decide qual ferramenta usar
├── createExecutionPlan() // Cria plano de execução
├── execute()            // Executa tarefa
└── getStats()           // Estatísticas de uso
```

**Tipos de Tarefa:**
- `BROWSER_AUTOMATION` - Automação web
- `PYTHON_EXECUTION` - Scripts Python
- `INTERNAL_TOOLS` - Ferramentas internas
- `MULTIMODAL_PIPELINE` - Pipelines complexos
- `HYBRID` - Combinação de múltiplas ferramentas

---

### 2. **PROMPT LIBRARY REGISTRY** (`prompt-library/registry.ts`)

Sistema de registro de módulos Python com seus prompts e regras de uso.

**Responsabilidades:**
- Registrar 300+ módulos Python
- Armazenar Prompt System de cada módulo
- Busca inteligente de módulos
- Recomendação de alternativas
- Fallback chains

**Estrutura de Módulo:**
```typescript
PromptModule {
  id: string
  name: string
  packageName: string
  category: ModuleCategory
  promptSystem: {
    systemPrompt: string
    instructions: string[]
    bestPractices: string[]
    commonPitfalls: string[]
    errorHandling: string[]
    optimizationTips: string[]
  }
  whenToUse: UsageRule[]
  whenNotToUse: UsageRule[]
  mainFunctions: ModuleFunction[]
  examples: UsageExample[]
  fallbackModules: string[]
}
```

**Categorias de Módulos:**
- 📊 DATA_PROCESSING (Pandas, Polars, Dask)
- 🕷️ WEB_SCRAPING (BeautifulSoup, Scrapy)
- 🖼️ IMAGE_PROCESSING (Pillow, OpenCV)
- 🤖 MACHINE_LEARNING (Scikit-learn, TensorFlow)
- 📝 NLP (spaCy, NLTK, Transformers)
- 🎥 VIDEO_PROCESSING (MoviePy, FFmpeg)
- 🎵 AUDIO_PROCESSING (Librosa, PyDub)
- E mais 20+ categorias...

---

### 3. **BROWSER AUTOMATION CONTROLLER** (`browser-automation/controller.ts`)

Controlador de automação do navegador via extensão Chrome.

**Responsabilidades:**
- Comunicação com extensão Chrome
- Executar comandos no navegador
- Scraping inteligente
- Preenchimento de formulários
- Screenshot e capturas
- Tratamento de erros de DOM

**Comandos Disponíveis:**
```typescript
BrowserActionType {
  NAVIGATE,       // Navegar para URL
  CLICK,          // Clicar em elemento
  TYPE,           // Digitar texto
  SELECT,         // Selecionar dropdown
  EXTRACT,        // Extrair dados do DOM
  SCREENSHOT,     // Capturar tela
  EXECUTE_SCRIPT, // Executar JavaScript
  SUBMIT_FORM,    // Enviar formulário
  SCROLL,         // Scroll na página
  WAIT,           // Aguardar
  HOVER,          // Mouse hover
  UPLOAD_FILE     // Upload de arquivo
}
```

**Tipos de Seletor:**
```typescript
SelectorType {
  CSS,       // Seletor CSS
  XPATH,     // XPath
  TEXT,      // Por texto
  ID,        // Por ID
  CLASS,     // Por classe
  NAME,      // Por name
  TAG,       // Por tag
  ATTRIBUTE, // Por atributo
  VISUAL     // Reconhecimento visual (futuro)
}
```

---

## 📦 INSTALAÇÃO

### Requisitos
- Node.js 18+
- TypeScript 5+
- Chrome Extension instalada
- Python Service (Railway)

### Instalação Básica

```bash
# Navegar para o diretório do projeto
cd SyncAds

# Instalar dependências (já incluído no projeto principal)
npm install

# O AI Core está em: ai-core/
```

---

## 🚀 USO BÁSICO

### 1. Inicializar o Sistema

```typescript
import { AISystem, getAISystem } from './ai-core';

// Obter instância global (singleton)
const ai = getAISystem({
  debugMode: true,
  autoLoadModules: true,
  browser: {
    extensionId: 'seu-extension-id',
    defaultTimeout: 30000
  },
  pythonService: {
    baseUrl: 'https://seu-railway.up.railway.app'
  }
});

// Aguardar inicialização
await ai.initialize();
```

### 2. Processar Requisição Simples

```typescript
const response = await ai.processRequest({
  userId: 'user-123',
  input: 'Extrair todos os produtos da página Amazon',
  context: {
    url: 'https://amazon.com.br/search?q=notebooks'
  }
});

console.log(response.status);      // SUCCESS
console.log(response.results);     // Resultados da execução
console.log(response.decision);    // Decisão tomada pela IA
```

### 3. Automação de Navegador

```typescript
const data = await ai.navigateAndExtract(
  'https://exemplo.com/produtos',
  {
    titulo: 'h1.product-title',
    preco: '.price',
    descricao: '.description'
  }
);

console.log(data);
// { titulo: '...', preco: '...', descricao: '...' }
```

### 4. Preencher Formulário

```typescript
await ai.fillFormAndSubmit({
  fields: {
    email: {
      selector: { type: SelectorType.ID, value: 'email' },
      value: 'usuario@email.com',
      type: 'text'
    },
    senha: {
      selector: { type: SelectorType.ID, value: 'password' },
      value: 'senha123',
      type: 'text'
    }
  },
  submitButton: {
    type: SelectorType.CSS,
    value: 'button[type="submit"]'
  }
});
```

### 5. Scraping Multi-Página

```typescript
const produtos = await ai.scrapePage({
  selectors: {
    nome: { type: SelectorType.CSS, value: '.product-name' },
    preco: { type: SelectorType.CSS, value: '.product-price' }
  },
  pagination: {
    nextButtonSelector: { type: SelectorType.CSS, value: '.next-page' },
    delay: 2000
  },
  maxPages: 10
});

console.log(`${produtos.length} produtos extraídos`);
```

---

## 💡 EXEMPLOS AVANÇADOS

### Plano de Automação Complexo

```typescript
import { createBrowserController, SelectorType } from './ai-core';

const browser = createBrowserController({ debugMode: true });

const plan = browser.createPlan(
  'Login e Extração de Dashboard',
  'Fazer login e extrair dados do painel'
)
  .navigate('https://app.exemplo.com/login')
  .type(
    { type: SelectorType.ID, value: 'email' },
    'user@example.com'
  )
  .type(
    { type: SelectorType.ID, value: 'password' },
    'senha123'
  )
  .click(
    { type: SelectorType.CSS, value: 'button[type="submit"]' }
  )
  .wait(2000)
  .navigate('https://app.exemplo.com/dashboard')
  .extract(
    { type: SelectorType.CSS, value: '.metrics' },
    ['textContent', 'dataset']
  )
  .screenshot(true)
  .setErrorHandling({
    maxRetries: 3,
    retryDelay: 1000,
    continueOnError: false
  })
  .build();

const results = await browser.executePlan(plan);
```

### Buscar Módulo Python Específico

```typescript
import { getRegistry, ModuleCategory } from './ai-core';

const registry = getRegistry();

// Buscar módulos de processamento de imagem
const imageModules = registry.getByCategory(
  ModuleCategory.IMAGE_PROCESSING
);

// Busca inteligente
const modules = registry.search({
  query: 'machine learning',
  minReliability: 0.9,
  complexity: ModuleComplexity.INTERMEDIATE,
  maxExecutionTime: 5000
});

// Encontrar melhor match
const bestModule = registry.findBestMatch(
  'preciso processar um CSV grande e fazer análise estatística'
);

console.log(bestModule?.name); // "Pandas"
```

### Sistema de Eventos

```typescript
const ai = getAISystem();

// Escutar eventos do Core
ai.on('core:execution-started', (data) => {
  console.log('Execução iniciada:', data);
});

ai.on('core:execution-completed', (results) => {
  console.log('Execução concluída:', results);
});

// Escutar eventos do Browser
ai.on('browser:connected', () => {
  console.log('Extensão do navegador conectada');
});

ai.on('browser:command-success', (result) => {
  console.log('Comando executado:', result);
});

ai.on('browser:command-failed', (error) => {
  console.error('Comando falhou:', error);
});

// Escutar logs
ai.on('log', ({ level, message }) => {
  console[level](`[AI] ${message}`);
});
```

---

## 📚 API REFERENCE

### AISystem

#### Métodos Principais

**`initialize(): Promise<void>`**
Inicializa o sistema, carrega módulos e conecta serviços.

**`processRequest(request: TaskRequest): Promise<TaskResponse>`**
Processa uma requisição do usuário de forma inteligente.

**`navigateAndExtract(url: string, selectors: Record<string, string>): Promise<any>`**
Navega para URL e extrai dados usando seletores CSS.

**`fillFormAndSubmit(formData: FormData): Promise<AutomationResult[]>`**
Preenche formulário e submete.

**`scrapePage(config: ScrapingConfig): Promise<any[]>`**
Faz scraping de uma ou múltiplas páginas.

**`findModules(criteria: SearchCriteria): PromptModule[]`**
Busca módulos na biblioteca de prompts.

**`getStats(): any`**
Retorna estatísticas do sistema.

**`reset(): void`**
Reseta memória e estado do sistema.

---

### CoreAI

#### Métodos Principais

**`analyzeRequest(request: UserRequest): Promise<TaskDecision>`**
Analisa requisição e retorna decisão sobre qual ferramenta usar.

**`createExecutionPlan(request: UserRequest, decision: TaskDecision): ExecutionPlan`**
Cria plano de execução detalhado.

**`execute(request: UserRequest): Promise<ExecutionResult[]>`**
Executa requisição com retry e fallback automáticos.

**`registerModule(module: ModuleRegistry): void`**
Registra novo módulo no Core.

**`getStats(): any`**
Retorna estatísticas de execução.

---

### BrowserAutomationController

#### Métodos Principais

**`navigate(url: string, options?): Promise<AutomationResult>`**
Navega para URL.

**`click(selector: ElementSelector, options?): Promise<AutomationResult>`**
Clica em elemento.

**`type(selector: ElementSelector, text: string, options?): Promise<AutomationResult>`**
Digita texto em campo.

**`extract(selector: ElementSelector, attributes?): Promise<AutomationResult>`**
Extrai dados do DOM.

**`screenshot(fullPage: boolean): Promise<AutomationResult>`**
Captura screenshot.

**`executePlan(plan: AutomationPlan): Promise<AutomationResult[]>`**
Executa plano de automação completo.

---

### PromptLibraryRegistry

#### Métodos Principais

**`register(module: PromptModule): void`**
Registra novo módulo.

**`search(criteria: SearchCriteria): PromptModule[]`**
Busca módulos por critérios.

**`findBestMatch(requirements: string): PromptModule | null`**
Encontra melhor módulo baseado em requisitos em texto natural.

**`recommendAlternatives(moduleId: string, limit?: number): PromptModule[]`**
Recomenda módulos alternativos.

**`getFallbackChain(moduleId: string): PromptModule[]`**
Retorna chain de fallback para um módulo.

**`getStats(): ModuleStats`**
Retorna estatísticas da biblioteca.

---

## 📦 MÓDULOS DISPONÍVEIS

### Módulo Exemplo: Pandas

Localização: `ai-core/prompt-library/modules/pandas-module.ts`

```typescript
{
  id: 'pandas-001',
  name: 'Pandas',
  packageName: 'pandas',
  category: ModuleCategory.DATA_PROCESSING,
  
  promptSystem: {
    systemPrompt: "Você é um especialista em Pandas...",
    instructions: [
      "SEMPRE importe pandas como: import pandas as pd",
      "Verifique se o arquivo existe antes de ler",
      "Use try-except para operações de I/O",
      // ... 10+ instruções
    ],
    bestPractices: [
      "Use method chaining para operações sequenciais",
      "Prefira vectorização sobre iteração",
      // ... 10+ práticas
    ],
    commonPitfalls: [
      "EVITE: df[df.col == valor] sem usar copy()",
      "EVITE: Loops com iterrows()",
      // ... 10+ pitfalls
    ]
  },
  
  whenToUse: [
    {
      condition: 'Processar arquivos CSV, Excel, ou JSON',
      reasoning: 'Pandas tem readers otimizados',
      confidence: 0.95
    }
  ],
  
  mainFunctions: [
    {
      name: 'pd.read_csv',
      signature: 'pd.read_csv(filepath, sep=",", ...)',
      example: 'df = pd.read_csv("data.csv", parse_dates=["date"])'
    }
  ],
  
  examples: [
    {
      title: 'Leitura e Análise Básica de CSV',
      code: `import pandas as pd\ndf = pd.read_csv('data.csv')\nprint(df.head())`,
      useCase: 'Análise exploratória de dados'
    }
  ]
}
```

---

## 🗺️ ROADMAP

### ✅ Fase 1 - CONCLUÍDA
- [x] Core Brain com sistema de decisão
- [x] Prompt Library Registry
- [x] Browser Automation Controller
- [x] Módulo base Pandas
- [x] Sistema de eventos
- [x] Fallback automático
- [x] Retry inteligente

### 🔄 Fase 2 - EM DESENVOLVIMENTO
- [ ] Adicionar 50+ módulos Python essenciais
  - [ ] Pillow (Image Processing)
  - [ ] BeautifulSoup (Web Scraping)
  - [ ] Requests (HTTP Client)
  - [ ] NumPy (Scientific Computing)
  - [ ] Matplotlib (Visualization)
  - [ ] Scikit-learn (Machine Learning)
  - [ ] TensorFlow (Deep Learning)
  - [ ] OpenCV (Computer Vision)
  - [ ] spaCy (NLP)
  - [ ] SQLAlchemy (Database)
- [ ] Integração completa com Python Service
- [ ] Sistema de cache para módulos
- [ ] Análise de performance
- [ ] Telemetria e métricas

### 📅 Fase 3 - PLANEJADA
- [ ] Adicionar 150+ módulos especializados
- [ ] Machine Learning para decisões
- [ ] Visual recognition para seletores
- [ ] Auto-healing de automações
- [ ] Multi-threading para tarefas paralelas
- [ ] Suporte a múltiplos navegadores
- [ ] API REST para controle externo
- [ ] Dashboard de monitoramento

### 🔮 Fase 4 - FUTURO
- [ ] Completar 300+ módulos
- [ ] IA generativa para criar automações
- [ ] Aprendizado por reforço
- [ ] Previsão de falhas
- [ | Otimização automática de código
- [ ] Suporte a webhooks e triggers
- [ ] Marketplace de módulos customizados

---

## 🤝 CONTRIBUINDO

Para adicionar novos módulos à Prompt Library:

1. Criar arquivo em `ai-core/prompt-library/modules/`
2. Seguir estrutura do `pandas-module.ts`
3. Registrar no `index.ts`
4. Testar integração
5. Documentar exemplos

---

## 📄 LICENÇA

Este código faz parte do SyncAds SaaS.
Todos os direitos reservados © 2025

---

## 📞 SUPORTE

Para dúvidas ou problemas:
- Abrir issue no repositório
- Contatar time de desenvolvimento

---

## 🎯 STATUS ATUAL

**Versão:** 1.0.0-alpha  
**Última Atualização:** Janeiro 2025  
**Módulos Registrados:** 1/300  
**Cobertura:** Core completo, 1 módulo exemplo  
**Próximo Marco:** Adicionar 50 módulos essenciais

---

**Desenvolvido com ❤️ para SyncAds**