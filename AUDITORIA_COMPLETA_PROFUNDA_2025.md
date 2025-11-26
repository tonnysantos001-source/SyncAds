# 🔍 AUDITORIA COMPLETA E PROFUNDA - SYNCADS AI DUAL INTELLIGENCE
## Data: Janeiro 2025 | Status: EM EXECUÇÃO

---

## 📋 ÍNDICE

1. [Resumo Executivo](#resumo-executivo)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Mapeamento de Fluxos](#mapeamento-de-fluxos)
4. [Análise de Componentes](#análise-de-componentes)
5. [Auditoria de Segurança](#auditoria-de-segurança)
6. [Performance e Otimizações](#performance-e-otimizações)
7. [Código Duplicado e Morto](#código-duplicado-e-morto)
8. [Plano de Correções](#plano-de-correções)
9. [Testes e Validação](#testes-e-validação)
10. [Checklist Final](#checklist-final)

---

## 🎯 RESUMO EXECUTIVO

### Escopo da Auditoria
- **SaaS Principal:** Painel web React + Vite + TypeScript
- **Extensão Chrome/Edge:** Sistema dual com chat IA + manipulação DOM
- **Back-end Distribuído:**
  - Supabase (PostgreSQL + Edge Functions)
  - Railway (Python AI Service)
  - Vercel (Front-end + API Routes)

### Metodologia
1. Mapeamento completo da arquitetura
2. Análise de código linha por linha
3. Identificação de vulnerabilidades
4. Testes de fluxo completo
5. Correções aplicadas
6. Revalidação total

---

## 🏗️ ARQUITETURA DO SISTEMA

### Visão Geral

```
┌─────────────────────────────────────────────────────────────┐
│                      SYNCADS AI PLATFORM                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
         ┌──────▼──────┐            ┌──────▼──────┐
         │   SaaS Web  │            │  Extensão   │
         │   (Vercel)  │            │   Chrome    │
         └──────┬──────┘            └──────┬──────┘
                │                           │
    ┌───────────┼───────────────────────────┼───────────┐
    │           │                           │           │
┌───▼───┐  ┌───▼────┐                 ┌────▼────┐  ┌──▼───┐
│Supabase│  │Railway │                 │Supabase │  │Python│
│ Edge   │  │Python  │                 │  API    │  │ AI   │
│Function│  │  AI    │                 │  REST   │  │Service│
└────────┘  └────────┘                 └─────────┘  └──────┘
```

### Componentes Principais

#### 1. **Front-end (Vercel)**
- **Framework:** React 18 + Vite
- **Linguagem:** TypeScript
- **Estilização:** TailwindCSS
- **Estado:** Zustand
- **Roteamento:** React Router v6
- **Localização:** `/src`

**Principais Diretórios:**
```
src/
├── components/        # Componentes React
│   ├── admin/        # Painel administrativo
│   ├── chat/         # Sistema de chat IA
│   ├── checkout/     # Fluxo de pagamento
│   ├── dashboard/    # Dashboard principal
│   └── ui/           # Componentes UI reutilizáveis
├── pages/            # Páginas da aplicação
├── hooks/            # Custom React hooks
├── lib/              # Bibliotecas e utilitários
├── store/            # Gerenciamento de estado
└── types/            # Definições TypeScript
```

#### 2. **Extensão Chrome/Edge**
- **Arquitetura:** Service Worker + Content Scripts
- **Comunicação:** chrome.runtime messaging
- **Storage:** chrome.storage.local + Supabase
- **Localização:** `/chrome-extension`

**Estrutura:**
```
chrome-extension/
├── manifest.json           # Configurações e permissões
├── background.js           # Service worker principal
├── content-script.js       # Injeção DOM
├── popup.html/js          # Interface popup
├── sidepanel.html/js      # Painel lateral
├── command-executor.js    # Executor de comandos DOM
└── visual-feedback.js     # Feedback visual
```

#### 3. **Supabase (Backend Core)**
- **PostgreSQL:** Banco de dados principal
- **Edge Functions:** 65+ funções serverless
- **Auth:** Sistema de autenticação
- **Storage:** Armazenamento de arquivos
- **RLS:** Row Level Security
- **Localização:** `/supabase`

**Edge Functions Principais:**
```
supabase/functions/
├── chat-enhanced/          # Chat principal com IA
├── extension-commands/     # Comandos para extensão
├── payment-webhook/        # Webhooks de pagamento
├── process-payment/        # Processamento de pagamentos
├── shopify-*/             # Integrações Shopify
├── meta-ads-*/            # Facebook/Instagram Ads
├── google-ads-*/          # Google Ads
└── _utils/                # Utilitários compartilhados
```

#### 4. **Railway (Python AI Service)**
- **Framework:** FastAPI
- **IA:** Browser-Use, AgentQL, Vision AI
- **Automação:** Playwright, Selenium
- **Localização:** `/python-service`

**Estrutura:**
```
python-service/
├── app/
│   ├── main.py               # Aplicação principal
│   ├── routers/              # Rotas API
│   │   └── browser_automation.py
│   ├── browser_ai/           # Módulos IA
│   └── config/               # Configurações
└── requirements.txt          # Dependências Python
```

---

## 🔄 MAPEAMENTO DE FLUXOS

### FLUXO 1: Chat Principal (SaaS Web)

```
Usuário digita mensagem
    │
    ▼
ChatPage.tsx captura input
    │
    ▼
Envia para /chat-enhanced (Edge Function)
    │
    ├─► Valida autenticação (JWT)
    ├─► Verifica rate limit
    ├─► Busca configuração IA global
    ├─► Detecta comando DOM (se aplicável)
    │
    ▼
Router decide executor:
    │
    ├─► EXTENSION (comandos DOM simples)
    │   └─► Cria comando em extension_commands
    │       └─► Extensão detecta via polling (5s)
    │           └─► Executa no DOM
    │               └─► Retorna resultado
    │
    └─► PYTHON_AI (tarefas complexas)
        └─► Chama Railway Python Service
            └─► Processa com IA
                └─► Retorna resposta
    │
    ▼
Salva mensagens no banco (ChatMessage)
    │
    ▼
Registra analytics (routing_analytics)
    │
    ▼
Retorna resposta ao usuário (streaming ou JSON)
```

**Arquivos envolvidos:**
- `src/pages/ChatPage.tsx`
- `src/components/chat/ChatInterface.tsx`
- `supabase/functions/chat-enhanced/index.ts`
- `supabase/functions/_utils/command-router.ts`
- `python-service/app/main.py`

**Problemas identificados:**
- ⚠️ **CRÍTICO:** Tabela `ExtensionCommand` vs `extension_commands` (inconsistência) - **CORRIGIDO**
- ⚠️ **MÉDIO:** Rate limiting pode ser muito agressivo para testes
- ⚠️ **BAIXO:** Falta tratamento de timeout para Python Service
- ✅ **CORRIGIDO:** Polling implementado (5s)
- ✅ **CORRIGIDO:** commandTimer adicionado ao state

---

### FLUXO 2: Chat na Extensão

```
Usuário abre extensão (popup/sidepanel)
    │
    ▼
Verifica autenticação local (chrome.storage)
    │
    ├─► NÃO AUTENTICADO
    │   └─► Redireciona para login web
    │       └─► Detecta login automaticamente (content-script.js)
    │           └─► Salva tokens localmente
    │               └─► Registra device (extension_devices)
    │
    └─► AUTENTICADO
        └─► Inicia heartbeat (30s)
            └─► Inicia polling comandos (5s)
    │
    ▼
Usuário digita mensagem no chat da extensão
    │
    ▼
Envia para /chat-enhanced (mesma Edge Function)
    │
    ▼
Resposta retorna → Display no chat
```

**Arquivos envolvidos:**
- `chrome-extension/background.js`
- `chrome-extension/popup.js`
- `chrome-extension/sidepanel.js`
- `chrome-extension/content-script.js`

**Problemas identificados:**
- ⚠️ **CRÍTICO:** Falta implementar chat completo dentro da extensão
- ⚠️ **MÉDIO:** Heartbeat pode falhar silenciosamente
- ⚠️ **BAIXO:** Sem retry automático para comandos failed
- ✅ **OK:** Detecção de login funcionando
- ✅ **OK:** Polling de comandos implementado

---

### FLUXO 3: Manipulação DOM via Extensão

```
Comando criado em extension_commands (status: pending)
    │
    ▼
Polling detecta comando (background.js a cada 5s)
    │
    ▼
Atualiza status para "processing"
    │
    ▼
Identifica tab ativa
    │
    ▼
Envia mensagem para content-script.js
    │
    ▼
Content script executa comando DOM:
    │
    ├─► DOM_CLICK → document.querySelector().click()
    ├─► DOM_FILL → element.value = value
    ├─► DOM_READ → element.textContent
    ├─► NAVIGATE → window.location.href = url
    ├─► SCREENSHOT → chrome.tabs.captureVisibleTab()
    └─► WAIT → setTimeout()
    │
    ▼
Retorna resultado para background.js
    │
    ▼
Atualiza comando: status "completed", result JSON
    │
    ▼
Analytics salva em routing_analytics
```

**Arquivos envolvidos:**
- `chrome-extension/background.js` (polling + orquestração)
- `chrome-extension/content-script.js` (execução DOM)
- `chrome-extension/command-executor.js` (lógica de execução)
- `supabase/functions/chat-enhanced/index.ts` (criação de comandos)

**Problemas identificados:**
- ✅ **CORRIGIDO:** Nome da tabela inconsistente (ExtensionCommand → extension_commands)
- ✅ **CORRIGIDO:** Campos em camelCase vs snake_case
- ⚠️ **MÉDIO:** Falta timeout para comandos que nunca completam
- ⚠️ **MÉDIO:** Sem retry para comandos failed
- ⚠️ **BAIXO:** Falta validação de seletores CSS antes de executar

---

### FLUXO 4: Autenticação (OAuth + JWT)

```
Usuário clica "Login"
    │
    ▼
Redireciona para Supabase Auth UI
    │
    ▼
Login com provedor (Google, GitHub, Email)
    │
    ▼
Callback retorna com token
    │
    ▼
Front-end salva em localStorage:
    - accessToken
    - refreshToken
    - user (id, email)
    │
    ▼
Cria sessão em Supabase Auth
    │
    ▼
Redireciona para dashboard
    │
    ▼
[SE EXTENSÃO ABERTA]
    │
    ▼
    Content-script detecta token no localStorage
    │
    ▼
    Envia para background.js via chrome.runtime.sendMessage
    │
    ▼
    Background registra device em extension_devices
    │
    ▼
    Inicia heartbeat + polling
```

**Arquivos envolvidos:**
- `src/lib/supabase.ts`
- `src/hooks/useAuth.ts`
- `src/pages/LoginPage.tsx`
- `chrome-extension/content-script.js`
- `chrome-extension/background.js`

**Problemas identificados:**
- ⚠️ **ALTO:** Token refresh pode falhar silenciosamente
- ⚠️ **MÉDIO:** Falta validação de expiração antes de cada chamada
- ⚠️ **BAIXO:** localStorage não é criptografado
- ✅ **OK:** Sistema de refresh implementado

---

### FLUXO 5: Pagamentos (Checkout + Webhooks)

```
Usuário seleciona plano
    │
    ▼
Redireciona para /checkout
    │
    ▼
Exibe formulário + gateway (Mercado Pago, PagueX, etc)
    │
    ▼
Usuário preenche dados
    │
    ▼
Envia para /process-payment (Edge Function)
    │
    ├─► Cria Order (status: pending)
    ├─► Calcula valores (split, taxas)
    ├─► Chama gateway selecionado
    │   └─► Retorna payment link ou QR Code PIX
    │
    ▼
Usuário paga no gateway
    │
    ▼
Gateway envia webhook para /payment-webhook
    │
    ├─► Valida assinatura webhook
    ├─► Busca Order no banco
    ├─► Atualiza status (paid, failed, refunded)
    ├─► Processa split (se configurado)
    ├─► Ativa plano do usuário
    ├─► Envia email confirmação
    │
    ▼
Sistema atualiza UI automaticamente (realtime)
```

**Arquivos envolvidos:**
- `src/pages/CheckoutPage.tsx`
- `src/components/checkout/PaymentForm.tsx`
- `supabase/functions/process-payment/index.ts`
- `supabase/functions/payment-webhook/index.ts`
- `supabase/functions/payment-queue-processor/index.ts`

**Problemas identificados:**
- ⚠️ **CRÍTICO:** Webhooks podem processar duplicados
- ⚠️ **ALTO:** Split payment não valida saldos
- ⚠️ **MÉDIO:** Falta retry automático para pagamentos pendentes
- ⚠️ **BAIXO:** Email de confirmação pode falhar sem notificar

---

### FLUXO 6: Integrações (Shopify, Facebook Ads, etc)

```
Usuário conecta integração
    │
    ▼
Inicia OAuth flow (/shopify-oauth, /meta-ads-oauth)
    │
    ├─► Redireciona para plataforma externa
    ├─► Usuário autoriza
    ├─► Callback com auth code
    │
    ▼
Edge Function troca code por access_token
    │
    ▼
Salva em Integration (encrypted tokens)
    │
    ▼
Ativa sync automático (cron job)
    │
    ▼
Busca dados da plataforma:
    - Shopify: produtos, pedidos, clientes
    - Facebook: campanhas, métricas, insights
    - Google Ads: campanhas, performance
    │
    ▼
Salva localmente em tabelas específicas
    │
    ▼
Exibe no dashboard
```

**Arquivos envolvidos:**
- `supabase/functions/shopify-oauth/index.ts`
- `supabase/functions/shopify-sync/index.ts`
- `supabase/functions/meta-ads-oauth/index.ts`
- `supabase/functions/meta-ads-control/index.ts`
- `src/pages/IntegrationsPage.tsx`

**Problemas identificados:**
- ⚠️ **ALTO:** Tokens podem expirar sem refresh automático
- ⚠️ **MÉDIO:** Sync pode falhar sem notificar usuário
- ⚠️ **MÉDIO:** Falta rate limiting nas APIs externas
- ⚠️ **BAIXO:** Sem tratamento de dados incompletos

---

## 🔐 ANÁLISE DE COMPONENTES

### 1. FRONT-END (React/Vite)

#### ChatPage.tsx
**Status:** ✅ Funcional | ⚠️ Precisa melhorias

**Código principal:**
```typescript
// Localização: src/pages/ChatPage.tsx
// Responsabilidade: Interface principal do chat com IA
```

**Problemas identificados:**
1. ⚠️ **Médio:** Falta debounce no input (pode sobrecarregar API)
2. ⚠️ **Baixo:** Scroll automático pode falhar em algumas situações
3. ⚠️ **Baixo:** Loading state não é persistente entre refreshes

**Correções necessárias:**
- Adicionar debounce de 300ms no input
- Implementar IntersectionObserver para scroll
- Salvar estado do chat em sessionStorage

---

#### CheckoutPage.tsx
**Status:** ⚠️ Funcional com ressalvas

**Problemas identificados:**
1. ⚠️ **Alto:** Validação de formulário no client apenas (inseguro)
2. ⚠️ **Médio:** Redirecionamento após pagamento pode quebrar
3. ⚠️ **Baixo:** Loading state não cobre todos os cenários

**Correções necessárias:**
- Adicionar validação no servidor também
- Implementar polling de status do pagamento
- Melhorar feedback visual durante processamento

---

### 2. EXTENSÃO CHROME

#### background.js (Service Worker)
**Status:** ✅ Funcional | ⚠️ Melhorias aplicadas

**Análise do código:**
```javascript
// Localização: chrome-extension/background.js
// Linhas de código: ~1500
// Complexidade: Alta
```

**Funções principais:**
- `initialize()` - Inicializa extensão ao carregar
- `handleAuthToken()` - Processa autenticação
- `checkPendingCommands()` - Polling de comandos (5s)
- `processCommand()` - Orquestra execução de comandos
- `updateCommandStatus()` - Atualiza status no banco
- `sendHeartbeat()` - Mantém status online (30s)
- `registerDevice()` - Registra device no Supabase

**Problemas identificados:**
1. ✅ **CORRIGIDO:** `commandTimer` não estava no state
2. ⚠️ **Médio:** Falta tratamento de erros de rede
3. ⚠️ **Médio:** Token refresh pode falhar silenciosamente
4. ⚠️ **Baixo:** Logs excessivos podem degradar performance

**Correções aplicadas:**
- ✅ Adicionado `commandTimer: null` ao state (linha 92)
- ✅ Polling funcionando corretamente (5s)

**Correções pendentes:**
- [ ] Adicionar retry com backoff exponencial
- [ ] Implementar circuit breaker para APIs
- [ ] Reduzir volume de logs em produção

---

#### content-script.js
**Status:** ✅ Funcional

**Análise:**
```javascript
// Localização: chrome-extension/content-script.js
// Responsabilidade: Detecção de login + Execução de comandos DOM
```

**Funções principais:**
- `detectAndSendAuthToken()` - Detecta login automaticamente
- `executeCommand()` - Processa comandos DOM
- `clickElement()` - Clica em elementos
- `fillInput()` - Preenche campos
- `readElement()` - Lê conteúdo

**Problemas identificados:**
1. ⚠️ **Médio:** Seletores CSS podem falhar se DOM mudar
2. ⚠️ **Baixo:** Sem retry para ações DOM que falham
3. ⚠️ **Baixo:** Feedback visual básico

**Correções necessárias:**
- Implementar seletores mais robustos (XPath + CSS)
- Adicionar retry com delay
- Melhorar feedback visual (highlighting)

---

#### manifest.json
**Status:** ✅ OK | ⚠️ Permissões excessivas

**Análise de permissões:**
```json
{
  "permissions": [
    "storage",          // ✅ Necessário
    "tabs",             // ✅ Necessário
    "activeTab",        // ✅ Necessário
    "scripting",        // ✅ Necessário
    "webNavigation",    // ⚠️ Pode ser removido?
    "cookies",          // ⚠️ Realmente necessário?
    "<all_urls>"        // ⚠️ Muito permissivo!
  ]
}
```

**Problemas de segurança:**
1. ⚠️ **Alto:** `<all_urls>` permite acesso a TODOS os sites
2. ⚠️ **Médio:** `cookies` pode expor dados sensíveis
3. ⚠️ **Baixo:** `webNavigation` pode não ser necessário

**Correções necessárias:**
- Reduzir `<all_urls>` para apenas domínios necessários
- Validar se `cookies` é realmente usado
- Remover `webNavigation` se não for essencial

---

### 3. SUPABASE (Edge Functions)

#### chat-enhanced/index.ts
**Status:** ✅ Funcional | ⚠️ Código muito longo

**Análise:**
```typescript
// Localização: supabase/functions/chat-enhanced/index.ts
// Linhas: ~2600
// Complexidade: MUITO ALTA
```

**Responsabilidades (múltiplas):**
- Autenticação e rate limiting
- Roteamento de comandos (EXTENSION vs PYTHON_AI)
- Detecção de comandos DOM
- Tool calling (Groq, OpenAI)
- Cache de respostas
- Integração com Python Service
- Salvamento de mensagens
- Analytics
- Resposta streaming

**Problemas identificados:**
1. ⚠️ **CRÍTICO:** Arquivo muito grande e difícil de manter
2. ⚠️ **Alto:** Múltiplas responsabilidades (viola SRP)
3. ⚠️ **Médio:** Lógica duplicada com outras functions
4. ✅ **CORRIGIDO:** Tabela extension_commands corrigida
5. ⚠️ **Baixo:** Falta tratamento de timeouts

**Correções aplicadas:**
- ✅ Corrigido nome da tabela: `ExtensionCommand` → `extension_commands`
- ✅ Corrigidos campos: snake_case correto

**Correções necessárias:**
- [ ] Refatorar em módulos menores
- [ ] Extrair tool calling para função separada
- [ ] Mover analytics para função dedicada
- [ ] Adicionar timeouts configuráveis

---

#### payment-webhook/index.ts
**Status:** ⚠️ Funcional com riscos

**Análise:**
```typescript
// Localização: supabase/functions/payment-webhook/index.ts
// Criticidade: ALTA (processamento de pagamentos)
```

**Problemas identificados:**
1. ⚠️ **CRÍTICO:** Falta idempotência (pode processar duplicados)
2. ⚠️ **Alto:** Validação de assinatura pode ser burlada
3. ⚠️ **Médio:** Falta logging estruturado
4. ⚠️ **Baixo:** Sem retry para operações failed

**Correções necessárias:**
- Implementar chave de idempotência (webhook_id)
- Fortalecer validação de assinatura
- Adicionar logs detalhados para auditoria
- Implementar fila de retry

---

### 4. PYTHON SERVICE (Railway)

#### main.py
**Status:** ✅ Funcional | ⚠️ Módulos faltando

**Análise:**
```python
# Localização: python-service/app/main.py
# Framework: FastAPI
# Linhas: ~600
```

**Endpoints principais:**
- `GET /health` - Health check
- `POST /api/chat` - Chat com IA (streaming)
- `POST /browser-automation/execute` - Automação browser

**Problemas identificados:**
1. ⚠️ **Médio:** Módulos browser_ai podem estar incompletos
2. ⚠️ **Médio:** Falta rate limiting
3. ⚠️ **Baixo:** Logs não estruturados
4. ✅ **OK:** Endpoint /browser-automation funcionando

**Correções necessárias:**
- Validar módulos browser_ai completos
- Adicionar rate limiting por IP
- Implementar logging estruturado (JSON)

---

## 🛡️ AUDITORIA DE SEGURANÇA

### Vulnerabilidades Identificadas

#### 🔴 CRÍTICAS

1. **RLS (Row Level Security) incompleto**
   - **Tabela:** `extension_commands`
   - **Problema:** Usuários podem ver comandos de outros
   - **Impacto:** Vazamento de dados
   - **Correção:**
   ```sql
   ALTER TABLE extension_commands ENABLE ROW LEVEL SECURITY;
   
   CREATE POLICY "Users can only see their own commands"
   ON extension_commands FOR SELECT
   USING (auth.uid() = user_id);
   ```

2. **Webhooks sem validação de origem**
   - **Função:** `payment-webhook`
   - **Problema:** Qualquer um pode chamar o webhook
   - **Impacto:** Fraude em pagamentos
   - **Correção:** Validar IP + assinatura criptográfica

3. **Tokens expostos em localStorage**
   - **Local:** Front-end
   - **Problema:** XSS pode roubar tokens
   - **Impacto:** Sessão hijacking
   - **Correção:** Usar httpOnly cookies

#### 🟡 ALTAS

4. **Extensão com permissões excessivas**
   - **Arquivo:** `manifest.json`
   - **Problema:** `<all_urls>` muito permissivo
   - **Impacto:** Acesso a todos os sites
   - **Correção:** Limitar a domínios específicos

5. **Rate limiting insuficiente**
   - **Local:** Edge Functions
   - **Problema:** Pode ser abusado
   - **Impacto:** DDoS / Custo elevado
   - **Correção:** Implementar rate limit por IP + user

6. **SQL injection potencial**
   - **Local:** Algumas queries dinâmicas
   - **Problema:** Concatenação de strings
   - **Impacto:** Acesso não autorizado
   - **Correção:** Usar prepared statements

#### 🟢 MÉDIAS

7. **CORS muito permissivo**
   - **Local:** Edge Functions
   - **Problema:** `Access-Control-Allow-Origin: *`
   - **Impacto:** Requests de origens não confiáveis
   - **Correção:** Whitelist de domínios

8. **Logs com dados sensíveis**
   - **Local:** Várias funções
   - **Problema:** Tokens/senhas em logs
   - **Impacto:** Vazamento em caso de breach
   - **Correção:** Sanitizar logs

---

## ⚡ PERFORMANCE E OTIMIZAÇÕES

### Problemas de Performance Identificados

1. **Edge Function chat-enhanced muito pesada**
   - **Tempo médio:** 2-5 segundos
   - **Causas:**
     - Arquivo muito grande (~2600 linhas)
     - Múltiplas queries ao banco
     - Sem cache efetivo
   - **Impacto:** Experiência ruim do usuário
   - **Correções:**
     - Implementar cache Redis
     - Quebrar em funções menores
     - Usar connection pooling

2. **Polling da extensão a cada 5 segundos**
   - **Problema:** Queries excessivas ao banco
   - **Impacto:** Custo elevado no Supabase
   - **Correção:** Usar Realtime Subscriptions

3. **Falta de CDN para assets estáticos**
   - **Problema:** Imagens carregam lento
   - **Impacto:** Tempo de carregamento alto
   - **Correção:** Usar Vercel Edge Network + Image Optimization

4. **Bundle JS muito grande**
   - **Tamanho:** ~800KB (não comprimido)
   - **Problema:** Tempo de carregamento inicial
   - **Correção:** Code splitting + lazy loading

### Recomendações de Otimização

#### 1. Implementar Cache em Múltiplas Camadas

```typescript
// Camada 1: In-Memory Cache (Edge Function)
const cache = new Map();

// Camada 2: Redis (para cache compartilhado)
const redis = new Redis(process.env.REDIS_URL);

// Camada 3: CDN (para assets)
// Configurar em vercel.json
```

#### 2. Usar Realtime ao invés de Polling

```javascript
// Substituir polling por:
const subscription = supabase
  .channel('extension-commands')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'extension_commands',
    filter: `device_id=eq.${deviceId}`
  }, (payload) => {
    processCommand(payload.new);
  })
  .subscribe();
```

#### 3. Lazy Loading de Componentes

```typescript
// Em vez de:
import ChatPage from './pages/ChatPage';

// Usar:
const ChatPage = lazy(() => import('./pages/ChatPage'));
```

#### 4. Otimizar Queries do Banco

```sql
-- Adicionar índices compostos
CREATE INDEX idx_commands_device_status 
ON extension_commands(device_id, status, created_at DESC);

-- Usar select específico
SELECT id, type, data, status 
FROM extension_commands 
WHERE device_id = $1 AND status = 'pending'
LIMIT 10;
```

---

## 🗑️ CÓDIGO DUPLICADO E MORTO

### Código Duplicado Identifica