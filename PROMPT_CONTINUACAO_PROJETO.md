# 🚀 PROMPT DE CONTINUAÇÃO - PROJETO SYNCADS

**Data de Criação:** 08 de Janeiro de 2025  
**Versão:** 2.0 ENTERPRISE  
**Tipo:** Handoff Completo para Nova Sessão

---

## 📋 CONTEXTO INICIAL

Olá! Você está assumindo o desenvolvimento do **SyncAds**, uma plataforma enterprise de marketing digital com IA. Este documento contém TODO o contexto necessário para você continuar o trabalho de forma profissional e eficiente.

---

## 🔐 ACESSOS E CREDENCIAIS DISPONÍVEIS

### ✅ Supabase MCP (Model Context Protocol)
- **Status:** Conectado e operacional
- **Organização:** SyncAds (yfvwlcctnrrhssowjczq)
- **Projetos:**
  - **SyncAds** (sa-east-1) - ID: ovskepqggmxlfckxqgbr
  - **Checker Zaga** (us-east-2) - ID: yvpwwjyvdrmohlhocede
- **Capacidades:**
  - Acesso total ao banco de dados
  - Gerenciamento de edge functions (115+)
  - Migrations
  - Storage
  - Auth

### ✅ Railway CLI
- **Status:** Instalado e autenticado
- **Versão:** 4.11.1
- **Usuário:** tonnysantos001@gmail.com
- **Capacidades:**
  - Deploy de serviços
  - Logs em tempo real
  - Variáveis de ambiente
  - Database management

### ✅ Railway MCP Server
- **Status:** Instalado globalmente
- **Package:** @railway/mcp-server
- **Configuração:** `.zed/settings.json` no projeto
- **Capacidades:**
  - Criar projetos
  - Deploy de serviços
  - Manage environments
  - Logs e monitoring

### 🔴 FALTA CONFIGURAR

#### GitHub Integration
```
Necessário para:
- OAuth flow
- Repository creation/management
- Commits automáticos
- Deploy triggers
- GitHub Actions

Ação: Implementar OAuth flow completo
```

#### Vercel API
```
Necessário para:
- Deploy automatizado
- Custom domains
- Environment variables
- Build configuration

Ação: Integrar Vercel API
```

#### Netlify API
```
Necessário para:
- Deploy alternativo
- Edge functions
- Split testing

Ação: Integrar Netlify API (opcional)
```

---

## 🏗️ ARQUITETURA ATUAL DO PROJETO

### Backend: Supabase Edge Functions (115+)

**Localização:** `supabase/functions/`

#### Categorias de Functions:

**1. IA & Automação (11 functions)**
```
✅ ai-router              - Roteamento inteligente de IA
✅ ai-tools               - Ferramentas de IA executáveis
✅ ai-advisor             - Consultor de IA
✅ chat-enhanced          - Chat com IA melhorado
✅ chat-stream            - Streaming de chat
✅ chat-stream-groq       - Chat com Groq LLM
✅ automation-engine      - Motor de automação
✅ browser-automation     - Automação de navegador (Playwright)
✅ content-assistant      - Assistente de conteúdo
✅ super-ai-tools         - Ferramentas avançadas
✅ job-processor          - Processamento de jobs
```

**2. Geração de Conteúdo (5 functions)**
```
✅ generate-image         - DALL-E 3 integration
✅ generate-video         - Video generation API
✅ generate-zip           - Geração de arquivos ZIP
✅ file-generator         - Gerador genérico de arquivos
✅ file-generator-v2      - Versão melhorada
```

**3. E-commerce (20+ functions)**
```
✅ shopify-oauth, shopify-sync, shopify-webhook
✅ woocommerce-connect, woocommerce-sync
✅ nuvemshop-connect, nuvemshop-sync
✅ magalu-connect, magalu-sync
✅ mercadolivre-oauth, mercadolivre-sync
✅ vtex-connect, vtex-sync
✅ tray-connect, tray-sync
✅ bling-connect, bling-sync
✅ yampi-connect, yampi-sync
✅ bagy-connect, bagy-sync
✅ store-clone (clonagem completa de lojas)
```

**4. Plataformas de Ads (15+ functions)**
```
✅ meta-ads-oauth, meta-ads-control, meta-ads-tools
✅ google-ads-oauth, google-ads-control
✅ tiktokads-connect, tiktokads-sync
✅ linkedin-oauth, linkedin-ads-control, linkedin-sync
✅ twitter-oauth, twitter-sync
✅ bing-ads-oauth, bing-ads-sync
✅ taboola-oauth, taboola-sync
✅ outbrain-connect, outbrain-sync
✅ kwai-connect, kwai-sync
```

**5. Marketing & Analytics (8+ functions)**
```
✅ google-analytics-oauth
✅ advanced-analytics
✅ metrics-dashboard
✅ predictive-analysis
✅ ahrefs-connect, ahrefs-sync
✅ rdstation-oauth
```

**6. Comunicação (15+ functions)**
```
✅ whatsapp-automation, whatsapp-connect, whatsapp-sync
✅ telegram-connect, telegram-sync
✅ gmail-connect, gmail-sync
✅ facebook-connect, facebook-sync
✅ instagram-connect, instagram-sync
✅ reddit-connect, reddit-sync
```

**7. Ferramentas Avançadas (10+ functions)**
```
✅ web-scraper            - Web scraping básico
✅ web-search             - Busca web (Google/Bing)
✅ playwright-scraper     - Scraping avançado com Playwright
✅ advanced-scraper       - Scraper profissional
✅ python-executor        - Execução de código Python
✅ store-clone            - Clonagem de lojas completas
✅ verify-domain          - Verificação de domínio
✅ extension-commands     - Comandos da extensão
✅ extension-log          - Logs da extensão
✅ extension-register     - Registro de dispositivos
```

**8. Pagamentos (10+ functions + 55 gateways)**
```
✅ process-payment
✅ payment-webhook
✅ payment-queue-processor
✅ payment-retry-processor
✅ gateway-config-verify
✅ gateway-test-runner
✅ test-gateway
✅ create-preview-order
✅ cleanup-pending-orders
✅ recover-abandoned-carts
```

**9. Infraestrutura (5+ functions)**
```
✅ renew-subscriptions
✅ initialize-free-plan
✅ sync-order-to-shopify
✅ verify-domain
✅ oauth-init
```

### Frontend: React + TypeScript + Vite

**Localização:** `src/`

**Páginas Principais:**
```typescript
src/pages/app/
  - DashboardPage.tsx          // Dashboard do cliente
  - ChatPage.tsx               // Chat antigo (simples)
  - CampaignsPage.tsx          // Gerenciamento de campanhas
  - IntegrationsPage.tsx       // Integrações
  - CheckoutPage.tsx           // Checkout customizado
  - SettingsPage.tsx           // Configurações

src/pages/super-admin/
  - SuperAdminDashboard.tsx    // Dashboard admin
  - AdminChatPage.tsx          // Chat admin
  - ClientsPage.tsx            // Gerenciamento clientes
  - UsagePage.tsx              // Métricas de uso
```

**Componentes Recém-Criados:**
```typescript
src/components/chat/modals/
  - ChatModalManager.tsx       // Gerenciador de modais inteligentes
  - ChatModalNormal.tsx        // Chat normal
  - VisualEditorModal.tsx      // Editor visual (tipo Dualite)
  - ImageGalleryModal.tsx      // Galeria imagens (tipo Canva)
  - VideoGalleryModal.tsx      // Galeria vídeos
  - CodeEditorModal.tsx        // Editor de código
  - VoiceInput.tsx             // Input por voz
  - index.ts                   // Exports
  - README.md                  // Documentação

src/lib/ai/
  - modalContext.ts            // Sistema de detecção inteligente
  
src/lib/analytics/
  - modalAnalytics.ts          // Analytics dos modais
```

---

## 🔴 GAPS CRÍTICOS IDENTIFICADOS

### 1. MODAIS SEM FUNCIONALIDADE REAL

**Problema:** Todos os modais criados são **PROTÓTIPOS**. Eles têm a UI mas não executam ações reais.

#### Visual Editor Modal
```typescript
// O que TEM:
✅ Interface bonita
✅ IA assistente lateral
✅ Preview em iframe
✅ Editor de código básico

// O que FALTA (CRÍTICO):
❌ Não chama edge functions reais
❌ Não tem botão de Deploy
❌ Não integra com GitHub
❌ Não integra com Vercel
❌ Não tem templates reais
❌ Código é simulado (não real)
❌ Não salva no banco
❌ Não tem versionamento
❌ Monaco Editor (VS Code) não integrado
❌ Multi-file support ausente
```

#### Image Gallery Modal
```typescript
// O que TEM:
✅ Grid básico
✅ Geração DALL-E 3 (edge function existe)
✅ LocalStorage

// O que FALTA:
❌ Não usa Supabase Storage (deveria)
❌ Não tem CDN
❌ Edição de imagens ausente
❌ Stable Diffusion não integrado
❌ Batch operations não funcionam
❌ Export real não implementado
❌ Organização (pastas/tags) ausente
```

#### Video Gallery Modal
```typescript
// O que TEM:
✅ Grid básico
✅ UI de geração

// O que FALTA:
❌ generate-video edge function não conectado
❌ Runway ML não integrado
❌ Pika Labs não integrado
❌ Player real ausente
❌ Timeline editor não existe
❌ Export não funciona
```

#### Code Editor Modal
```typescript
// O que TEM:
✅ Textarea básico
✅ IA assistente

// O que FALTA:
❌ Monaco Editor não integrado
❌ python-executor edge function não conectado
❌ Terminal ausente
❌ Git integration ausente
❌ Debugging não existe
❌ Package management ausente
```

### 2. FALTA SISTEMA DE ORQUESTRAÇÃO

**Problema:** 115+ edge functions existem mas não há sistema centralizado para:
- Chamá-las de forma consistente
- Retry automático
- Error handling
- Rate limiting
- Caching
- Logging estruturado
- Monitoring

**Arquivo Necessário:** `src/lib/orchestrator/ServiceOrchestrator.ts`

### 3. FALTA GITHUB INTEGRATION

**Necessário para:**
```typescript
- OAuth flow
- Criar repositórios automáticos
- Commit/Push de código
- Setup de GitHub Actions
- Deploy triggers
- Branch management
```

**Arquivo Necessário:** `src/lib/integrations/github/GitHubService.ts`

### 4. FALTA DEPLOY AUTOMATION

**Necessário para:**
```typescript
- Deploy para Vercel (1 clique)
- Deploy para Netlify
- Custom domains
- SSL automático
- Environment variables
- Build configuration
```

**Arquivo Necessário:** `src/lib/integrations/deploy/DeployService.ts`

### 5. FALTA TEMPLATE SYSTEM

**Necessário:**
```typescript
- Library de 100+ templates
- Preview de templates
- Customização visual
- Import/Export
- Template marketplace
```

**Arquivo Necessário:** `src/lib/templates/TemplateLibrary.ts`

---

## 🎯 PLANO DE IMPLEMENTAÇÃO

### FASE 1: FUNDAÇÃO (Urgente - 2 semanas)

#### 1.1 Service Orchestrator
```typescript
Arquivo: src/lib/orchestrator/ServiceOrchestrator.ts

Criar classe que:
- Gerencia chamadas para edge functions
- Retry com exponential backoff
- Circuit breaker pattern
- Rate limiting inteligente
- Caching (Redis ou in-memory)
- Logging estruturado
- Metrics collection
- Error handling robusto

Deve funcionar assim:
const orchestrator = new ServiceOrchestrator();
const result = await orchestrator.call('generate-image', params);
// Automaticamente faz retry, cache, logs, etc
```

#### 1.2 GitHub Service
```typescript
Arquivo: src/lib/integrations/github/GitHubService.ts

Implementar:
- OAuth flow completo (usar GitHub OAuth App)
- createRepository()
- commitAndPush()
- createBranch()
- setupGitHubActions()
- configureWebhooks()

Workflow completo:
1. User clica "Deploy"
2. Sistema cria repo no GitHub
3. Faz commit inicial
4. Push do código
5. Retorna URL do repo
```

#### 1.3 Vercel Deploy Service
```typescript
Arquivo: src/lib/integrations/deploy/DeployService.ts

Implementar:
- Vercel API integration
- deployToVercel()
- configureCustomDomain()
- setupEnvironmentVariables()
- getDeploymentStatus()

Workflow completo:
1. Recebe código do GitHub
2. Faz deploy no Vercel
3. Configura domínio
4. Retorna URL live
Tempo total: < 2 minutos
```

#### 1.4 Storage Service
```typescript
Arquivo: src/lib/storage/StorageService.ts

Implementar:
- Upload para Supabase Storage
- CDN URL generation
- Image optimization
- Batch operations
- Folder management
- Trash/Recovery

Substituir localStorage por storage real
```

### FASE 2: VISUAL EDITOR COMPLETO (2 semanas)

#### 2.1 Monaco Editor Integration
```bash
npm install @monaco-editor/react monaco-editor
```

```typescript
Arquivo: src/components/chat/modals/VisualEditorModal.tsx

Substituir textarea por Monaco Editor:
- Syntax highlighting completo
- IntelliSense
- Error detection
- Multi-file support
- File tree navigation
```

#### 2.2 Template System
```typescript
Arquivo: src/lib/templates/TemplateLibrary.ts

Criar library com:
- 100+ templates HTML/CSS/JS
- Preview thumbnails
- Categories (Landing, Portfolio, E-commerce, etc)
- Search/Filter
- Import/Export
```

#### 2.3 Deploy Real Button
```typescript
// No VisualEditorModal.tsx
const handleDeploy = async () => {
  setIsDeploying(true);
  
  try {
    // 1. Create GitHub repo
    const repo = await githubService.createRepository({
      name: 'my-site',
      code: generatedCode
    });
    
    // 2. Deploy to Vercel
    const deployment = await deployService.deployToVercel({
      githubUrl: repo.url
    });
    
    // 3. Show success
    toast.success(`Deployed! ${deployment.url}`);
  } catch (error) {
    toast.error('Deploy failed');
  } finally {
    setIsDeploying(false);
  }
};
```

### FASE 3: IMAGE GALLERY REAL (2 semanas)

#### 3.1 Conectar Edge Functions
```typescript
// No ImageGalleryModal.tsx
const handleGenerate = async () => {
  // SUBSTITUIR simulação por chamada real
  const result = await orchestrator.call('generate-image', {
    prompt: input,
    size: selectedSize,
    style: selectedStyle,
    userId: userId
  });
  
  if (result.success) {
    // Upload para Supabase Storage
    const uploaded = await storageService.upload({
      file: result.imageUrl,
      path: `images/${userId}/${Date.now()}.png`
    });
    
    // Salvar no banco
    await supabase.from('generated_images').insert({
      user_id: userId,
      url: uploaded.cdnUrl,
      prompt: input,
      metadata: { size, style }
    });
    
    // Atualizar UI
    setImages(prev => [...prev, uploaded]);
  }
};
```

#### 3.2 Advanced Editing
```bash
npm install fabric react-image-crop
```

```typescript
Implementar:
- Canvas editor
- Crop/Resize
- Filters
- Text overlay
- Background removal (API externa)
- Layer system
```

### FASE 4: VIDEO GALLERY REAL (2 semanas)

#### 4.1 Conectar Video Generation
```typescript
const handleGenerateVideo = async () => {
  // Conectar edge function real
  const result = await orchestrator.call('generate-video', {
    prompt: input,
    duration: selectedDuration,
    style: selectedStyle
  });
  
  // Salvar no banco
  // Upload para storage
  // Atualizar UI
};
```

#### 4.2 Video Editor
```bash
npm install @remotion/player remotion
```

```typescript
Implementar:
- Timeline editor
- Trim/Cut
- Transitions
- Audio mixing
```

### FASE 5: CODE EDITOR PROFISSIONAL (2 semanas)

#### 5.1 Monaco + Terminal
```bash
npm install @monaco-editor/react xterm xterm-addon-fit
```

```typescript
Implementar:
- Monaco Editor full
- Terminal emulator
- Git integration
- Package manager
```

#### 5.2 Code Execution
```typescript
const handleRunCode = async () => {
  // Conectar python-executor edge function
  const result = await orchestrator.call('python-executor', {
    code: editorCode,
    language: selectedLanguage
  });
  
  setOutput(result.stdout);
  setErrors(result.stderr);
};
```

---

## 📦 DEPENDÊNCIAS A INSTALAR

```bash
# Editor profissional
npm install @monaco-editor/react monaco-editor

# Terminal
npm install xterm xterm-addon-fit xterm-addon-web-links

# Canvas editing
npm install fabric react-image-crop

# Video
npm install @remotion/player remotion

# State management robusto
npm install zustand immer

# Data fetching
npm install @tanstack/react-query

# Real-time
npm install socket.io-client

# Job queue (se necessário)
npm install bull bullmq

# Rich text
npm install @tiptap/react @tiptap/starter-kit
```

---

## 🔧 ARQUIVOS PRIORITÁRIOS A CRIAR

### 1. Service Orchestrator (URGENTE)
```
src/lib/orchestrator/
  - ServiceOrchestrator.ts     // Classe principal
  - RetryPolicy.ts             // Políticas de retry
  - CircuitBreaker.ts          // Circuit breaker
  - RateLimiter.ts             // Rate limiting
  - Cache.ts                   // Sistema de cache
  - Logger.ts                  // Logging estruturado
```

### 2. GitHub Integration (URGENTE)
```
src/lib/integrations/github/
  - GitHubService.ts           // Serviço principal
  - GitHubOAuth.ts             // OAuth flow
  - GitHubAPI.ts               // API wrapper
  - types.ts                   // TypeScript types
```

### 3. Deploy Service (URGENTE)
```
src/lib/integrations/deploy/
  - DeployService.ts           // Serviço principal
  - VercelAPI.ts               // Vercel integration
  - NetlifyAPI.ts              // Netlify integration
  - DomainManager.ts           // Domain management
  - types.ts                   // TypeScript types
```

### 4. Storage Service (IMPORTANTE)
```
src/lib/storage/
  - StorageService.ts          // Serviço principal
  - SupabaseStorage.ts         // Supabase wrapper
  - CDN.ts                     // CDN management
  - ImageOptimizer.ts          // Otimização
```

### 5. Template Library (IMPORTANTE)
```
src/lib/templates/
  - TemplateLibrary.ts         // Library principal
  - templates/                 // Pasta com templates
    - landing-pages/
    - portfolios/
    - e-commerce/
    - blogs/
  - TemplatePreview.tsx        // Preview component
```

---

## 📊 ESTRUTURA DO BANCO DE DADOS

### Tabelas Relevantes (já existem no Supabase)

```sql
-- Já existe
profiles                    // Dados do usuário
conversations              // Conversas do chat
messages                   // Mensagens
GlobalAiConnection         // Configuração IA
integrations               // Integrações conectadas
campaigns                  // Campanhas criadas

-- PRECISA CRIAR (para modais)
generated_images           // Imagens geradas
  - id
  - user_id
  - url (CDN)
  - prompt
  - style
  - size
  - metadata (JSONB)
  - created_at

generated_videos           // Vídeos gerados
  - id
  - user_id
  - url (CDN)
  - thumbnail_url
  - prompt
  - duration
  - style
  - status (generating/ready/error)
  - metadata (JSONB)
  - created_at

generated_code             // Código gerado
  - id
  - user_id
  - title
  - language
  - code (TEXT)
  - metadata (JSONB)
  - created_at

deployments                // Deploys realizados
  - id
  - user_id
  - project_name
  - github_url
  - vercel_url
  - status
  - metadata (JSONB)
  - created_at

templates_usage            // Uso de templates
  - id
  - user_id
  - template_id
  - customizations (JSONB)
  - created_at
```

---

## 🎯 WORKFLOW COMPLETO DESEJADO

### Cenário 1: Criar Landing Page e Fazer Deploy

```typescript
// Usuario: "Crie uma landing page para meu curso de programação"

1. Sistema detecta contexto → Visual Editor Modal
2. IA gera código HTML/CSS/JS completo
3. Preview em tempo real no Monaco Editor
4. Usuário clica "Deploy"
5. Sistema:
   a. Cria repo no GitHub
   b. Faz commit do código
   c. Trigger deploy no Vercel
   d. Configura domínio custom (opcional)
   e. Retorna URL live
6. Tempo total: < 2 minutos
7. Usuário tem site no ar!
```

### Cenário 2: Gerar Imagem e Usar em Campanha

```typescript
// Usuario: "Gere uma imagem de banner para Black Friday"

1. Sistema detecta contexto → Image Gallery Modal
2. IA otimiza prompt
3. Chama generate-image edge function
4. DALL-E 3 gera imagem
5. Upload para Supabase Storage
6. CDN URL gerado
7. Salvo no banco
8. Mostrado na gallery
9. Opções: Download, Editar, Usar em campanha
10. Usuário clica "Usar em campanha"
11. Imagem inserida automaticamente na campanha
```

### Cenário 3: Automatizar Integração

```typescript
// Usuario: "Configure integração com Shopify e sincronize produtos"

1. Sistema usa automation-engine
2. Conecta com shopify-oauth
3. Sincroniza via shopify-sync
4. Produtos importados
5. Webhooks configurados
6. Tudo automático!
```

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO

### Sprint 1 (Semana 1-2) - FUNDAÇÃO
```
[ ] Criar ServiceOrchestrator.ts
[ ] Implementar retry logic
[ ] Implementar circuit breaker
[ ] Implementar rate limiting
[ ] Implementar caching
[ ] Implementar logging
[ ] Criar GitHubService.ts
[ ] Implementar OAuth flow
[ ] Implementar createRepository
[ ] Criar DeployService.ts
[ ] Integrar Vercel API
[ ] Testar deploy end-to-end
```

### Sprint 2 (Semana 3-4) - VISUAL EDITOR
```
[ ] Integrar Monaco Editor
[ ] Criar file tree component
[ ] Implementar multi-file support
[ ] Criar TemplateLibrary
[ ] Adicionar 20+ templates
[ ] Conectar botão Deploy real
[ ] Testar workflow completo
```

### Sprint 3 (Semana 5-6) - IMAGE GALLERY
```
[ ] Conectar generate-image edge function
[ ] Implementar Supabase Storage
[ ] Configurar CDN
[ ] Criar tabela generated_images
[ ] Implementar upload/download
[ ] Adicionar editing tools
[ ] Implementar batch operations
```

### Sprint 4 (Semana 7-8) - VIDEO GALLERY
```
[ ] Conectar generate-video edge function
[ ] Implementar player real
[ ] Criar timeline editor
[ ] Implementar export
[ ] Configurar storage para vídeos
```

### Sprint 5 (Semana 9-10) - CODE EDITOR
```
[ ] Integrar Monaco completo
[ ] Implementar terminal
[ ] Conectar python-executor
[ ] Adicionar debugging
[ ] Implementar git commands
```

---

## 🚨 PONTOS DE ATENÇÃO

### 1. Performance
```
- Edge functions no Supabase têm timeout de 150s
- Considerar queue (BullMQ) para operações longas
- Implementar streaming para respostas grandes
- Cache agressivo para reduce API calls
```

### 2. Custos
```
- DALL-E 3: $0.04-0.08 por imagem
- Vercel: Limites de build minutes
- Supabase: Limites de bandwidth
- Implementar rate limiting por usuário
```

### 3. Segurança
```
- Validar todos os inputs
- Sanitizar código gerado
- Rate limit por IP/usuário
- Audit logs para ações críticas
```

### 4. UX
```
- Feedback visual em cada etapa
- Progress bars para operações longas
- Error messages claros
- Undo/Redo onde possível
```

---

## 🎓 REFERÊNCIAS E DOCUMENTAÇÃO

### APIs Externas
```
GitHub API: https://docs.github.com/en/rest
Vercel API: https://vercel.com/docs/rest-api
Netlify API: https://docs.netlify.com/api/get-started/
DALL-E 3: https://platform.openai.com/docs/guides/images
Supabase Storage: https://supabase.com/docs/guides/storage
```

### Libraries Úteis
```
Monaco Editor: https://microsoft.github.io/monaco-editor/
Remotion: https://remotion.dev/
Fabric.js: http://fabricjs.com/
Xterm.js: https://xtermjs.org/
React Query: https://tanstack.com/query/latest
```

---

## 💼 CONTEXTO DE NEGÓCIO

### Objetivo do Projeto
Criar uma **plataforma completa** onde usuários podem:
1. Conversar com IA
2. IA cria conteúdo (páginas, imagens, vídeos, código)
3. Deploy automático em produção
4. Integrações com 50+ plataformas
5. Tudo em um lugar

### Diferencial Competitivo
- Ninguém tem 115+ serviços integrados
- Deploy em 1 clique
- IA que gera + deploya + gerencia
- Preço acessível
- Interface moderna

### Público-Alvo
- Empreendedores digitais
- Agências de marketing
- Freelancers
- Pequenas empresas
- Qualquer pessoa que precisa presença online

---

## 🎯 PRIORIDADE MÁXIMA

### O QUE FAZER PRIMEIRO:

1. **Service Orchestrator** - Base para tudo
2. **GitHub Integration** - Deploy funcional
3. **Vercel Deploy** - Entregar valor real
4. **Visual Editor conectado** - Feature killer
5. **Template System** - Content is king

**Tempo estimado:** 2-4 semanas para MVP funcional

---

## 📞 COMO USAR ESTE PROMPT

1. **Copie este documento completo**
2. **Cole em um novo chat**
3. **Adicione sua pergunta/tarefa específica**
4. **Exemplo:**

```
[Cole todo este documento]

---

TAREFA ESPECÍFICA:
Crie o arquivo src/lib/orchestrator/ServiceOrchestrator.ts completo,
production-ready, com retry logic, circuit breaker, rate limiting e
error handling robusto. Use TypeScript e siga as melhores práticas.
```

---

## ✅ RESUMO EXECUTIVO

**Situação:** Sistema MASSIVO (115+ functions) mas 95% subutilizado

**Problema:** Frontend não acessa as capacidades do backend

**Solução:** Criar camada de orquestração e conectar tudo

**Resultado Esperado:** Usuário pode criar site e fazer deploy em < 2 minutos

**Status:** Pronto para implementação

**Urgência:** 🔴 CRÍTICA

---

**FIM DO DOCUMENTO**

Use este contexto para criar código production-ready, enterprise-grade.
Não faça protótipos. Faça o código REAL, completo, robusto e escalável.

Boa sorte! 🚀