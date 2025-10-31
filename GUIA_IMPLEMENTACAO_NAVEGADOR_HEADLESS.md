# 🎭 GUIA DE IMPLEMENTAÇÃO - NAVEGADOR HEADLESS (PLAYWRIGHT)

**Data:** 2025-01-31  
**Objetivo:** Implementar navegador headless para web scraping REAL  
**Status:** ✅ Pronto para implementação

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo 1: Deploy das Edge Functions](#passo-1-deploy-das-edge-functions)
4. [Passo 2: Configurar Variáveis de Ambiente](#passo-2-configurar-variáveis-de-ambiente)
5. [Passo 3: Criar Storage Bucket](#passo-3-criar-storage-bucket)
6. [Passo 4: Testar Funcionalidades](#passo-4-testar-funcionalidades)
7. [Passo 5: Integrar no Frontend](#passo-5-integrar-no-frontend)
8. [Troubleshooting](#troubleshooting)
9. [Exemplos de Uso](#exemplos-de-uso)

---

## 🎯 VISÃO GERAL

Este guia implementa **3 novas funcionalidades críticas**:

### ✅ 1. Playwright Scraper (Navegador Headless)
- **O que faz:** Web scraping REAL com navegador Chrome headless
- **Por que:** Sites modernos usam JavaScript (React, Vue, Angular)
- **Edge Function:** `playwright-scraper`
- **Benefícios:**
  - ✅ Executa JavaScript
  - ✅ Espera carregamento dinâmico
  - ✅ Bypassa anti-bot
  - ✅ Funciona com SPAs
  - ✅ Extrai produtos automaticamente
  - ✅ Captura screenshots

### ✅ 2. Web Search (Busca na Internet)
- **O que faz:** Busca real na internet usando APIs
- **Por que:** IA precisa de informações atualizadas
- **Edge Function:** `web-search`
- **APIs suportadas:**
  - ✅ Brave Search (GRÁTIS - 2000/mês)
  - ✅ DuckDuckGo (Fallback - scraping HTML)
  - ✅ SerpAPI (Pago - opcional)
  - ✅ Bing Search (Microsoft - opcional)

### ✅ 3. File Generator Melhorado
- **O que faz:** Cria arquivos CSV/JSON/TXT com download real
- **Por que:** Usuários precisam baixar arquivos gerados
- **Edge Function:** `file-generator-v2` (já existe, precisa ajustes)
- **Melhorias:**
  - ✅ Upload para storage
  - ✅ URL assinada (1 hora)
  - ✅ Limpeza automática

---

## 📦 PRÉ-REQUISITOS

### Antes de começar, você precisa ter:

- [x] Conta Supabase ativa
- [x] Supabase CLI instalado
- [x] Projeto conectado ao Supabase
- [x] Node.js 18+ instalado
- [x] Git configurado

### Verificar instalação:

```bash
# Verificar Supabase CLI
supabase --version

# Verificar se está logado
supabase status

# Verificar projeto conectado
supabase projects list
```

---

## 🚀 PASSO 1: DEPLOY DAS EDGE FUNCTIONS

### 1.1 Verificar estrutura dos arquivos

Certifique-se de que os arquivos foram criados:

```bash
# Verificar se as Edge Functions existem
ls supabase/functions/playwright-scraper/
ls supabase/functions/web-search/
ls supabase/functions/file-generator-v2/
```

**Arquivos esperados:**
```
supabase/functions/
├── playwright-scraper/
│   └── index.ts
├── web-search/
│   └── index.ts
├── file-generator-v2/
│   └── index.ts
└── _utils/
    ├── cors.ts
    └── web-search.ts
```

### 1.2 Deploy das Edge Functions

```bash
# Navegar até a raiz do projeto
cd C:\Users\dinho\Documents\GitHub\SyncAds

# Deploy do Playwright Scraper
supabase functions deploy playwright-scraper

# Deploy do Web Search
supabase functions deploy web-search

# Deploy do File Generator (se ainda não existe)
supabase functions deploy file-generator-v2

# Verificar deploy
supabase functions list
```

**Saída esperada:**
```
✓ playwright-scraper deployed
✓ web-search deployed
✓ file-generator-v2 deployed

Functions:
  playwright-scraper  https://xxx.supabase.co/functions/v1/playwright-scraper
  web-search          https://xxx.supabase.co/functions/v1/web-search
  file-generator-v2   https://xxx.supabase.co/functions/v1/file-generator-v2
```

### 1.3 Em caso de erro no deploy

Se o deploy falhar com erro do Playwright/Astral:

**Opção A: Deploy sem Playwright primeiro (teste rápido)**
```bash
# Comentar import do Playwright no arquivo temporariamente
# supabase/functions/playwright-scraper/index.ts
# Linha 7: // import { chromium } from 'https://deno.land/x/astral@0.4.1/mod.ts';

supabase functions deploy playwright-scraper
```

**Opção B: Usar Puppeteer ao invés de Playwright**
```typescript
// Alternativa: usar puppeteer-core (mais leve)
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';
```

**Opção C: Deploy incremental**
```bash
# Deploy apenas web-search primeiro (mais simples)
supabase functions deploy web-search

# Testar web-search
# Depois tentar playwright-scraper
```

---

## 🔧 PASSO 2: CONFIGURAR VARIÁVEIS DE AMBIENTE

### 2.1 Obter Brave Search API Key (GRÁTIS)

1. **Acesse:** https://brave.com/search/api/
2. **Crie uma conta** (pode usar email pessoal)
3. **Plano Free:**
   - 2000 queries/mês GRÁTIS
   - Sem cartão de crédito necessário
   - Rate limit: 1 req/segundo
4. **Copie a API Key**

### 2.2 Configurar secrets no Supabase

```bash
# Via CLI (RECOMENDADO)
supabase secrets set BRAVE_SEARCH_API_KEY="sua_brave_api_key_aqui"

# Via Dashboard (ALTERNATIVA)
# 1. Acesse: Supabase Dashboard > Project Settings > Edge Functions
# 2. Secrets > Add new secret
# 3. Name: BRAVE_SEARCH_API_KEY
# 4. Value: sua_brave_api_key_aqui
```

### 2.3 Verificar secrets configurados

```bash
# Listar secrets
supabase secrets list

# Saída esperada:
# BRAVE_SEARCH_API_KEY
# SUPABASE_URL
# SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY
```

### 2.4 (Opcional) Configurar outras APIs

```bash
# SerpAPI (se quiser usar em vez de Brave)
supabase secrets set SERP_API_KEY="sua_serp_api_key"

# Bing Search (Microsoft)
supabase secrets set BING_SEARCH_API_KEY="sua_bing_api_key"

# SendGrid (para envio de emails)
supabase secrets set SENDGRID_API_KEY="sua_sendgrid_api_key"
```

---

## 🗄️ PASSO 3: CRIAR STORAGE BUCKET

### 3.1 Criar bucket via Dashboard

1. **Acesse:** Supabase Dashboard > Storage
2. **Crie bucket:**
   - Nome: `temp-downloads`
   - Public: ✅ **SIM** (para permitir downloads)
   - File size limit: `50 MB`
   - Allowed MIME types: `text/csv, application/json, text/plain, application/zip, image/png, image/jpeg`

### 3.2 Ou criar via SQL

```sql
-- No Supabase Dashboard > SQL Editor

-- Criar bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-downloads', 'temp-downloads', true);

-- Permitir upload autenticado
CREATE POLICY "Allow authenticated uploads to temp-downloads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'temp-downloads');

-- Permitir leitura pública (para downloads)
CREATE POLICY "Allow public downloads from temp-downloads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'temp-downloads');

-- Permitir delete próprios arquivos
CREATE POLICY "Allow authenticated delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'temp-downloads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### 3.3 Verificar bucket criado

```bash
# Via Dashboard: Storage > Buckets
# Você deve ver: temp-downloads (Public)

# Ou via SQL:
SELECT * FROM storage.buckets WHERE id = 'temp-downloads';
```

---

## 🧪 PASSO 4: TESTAR FUNCIONALIDADES

### 4.1 Testar Web Search

```bash
# Via curl
curl -X POST \
  'https://SEU_PROJECT_ID.supabase.co/functions/v1/web-search' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "query": "melhores práticas SEO 2025",
    "maxResults": 5
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "query": "melhores práticas SEO 2025",
  "results": [
    {
      "title": "Top 10 SEO Trends for 2025",
      "url": "https://...",
      "description": "..."
    }
  ],
  "metadata": {
    "totalResults": 5,
    "searchEngine": "Brave Search"
  }
}
```

### 4.2 Testar Playwright Scraper (página simples)

```bash
# Testar com site simples primeiro
curl -X POST \
  'https://SEU_PROJECT_ID.supabase.co/functions/v1/playwright-scraper' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://example.com",
    "extractProducts": false
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "url": "https://example.com",
  "data": {
    "metadata": {
      "title": "Example Domain",
      "description": "..."
    }
  }
}
```

### 4.3 Testar Scraping de Produtos

```bash
# Testar com e-commerce real
curl -X POST \
  'https://SEU_PROJECT_ID.supabase.co/functions/v1/playwright-scraper' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "url": "https://www.magazineluiza.com.br/notebook/informatica/s/in/inot/",
    "extractProducts": true,
    "maxProducts": 10
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "name": "Notebook Dell Inspiron...",
        "price": "R$ 2.999,00",
        "image": "https://...",
        "link": "https://..."
      }
    ],
    "totalProducts": 10
  }
}
```

### 4.4 Testar File Generator

```bash
# Testar criação de CSV
curl -X POST \
  'https://SEU_PROJECT_ID.supabase.co/functions/v1/file-generator-v2' \
  -H 'Authorization: Bearer SEU_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "fileName": "teste.csv",
    "content": "Nome,Email\nJoão,joao@email.com\nMaria,maria@email.com",
    "fileType": "csv"
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "fileName": "teste.csv",
  "downloadUrl": "https://...storage.supabase.co/...?token=...",
  "expiresAt": "2025-01-31T15:30:00Z"
}
```

**Testar download:**
- Copie a `downloadUrl`
- Cole no navegador
- O arquivo deve baixar automaticamente

---

## 🎨 PASSO 5: INTEGRAR NO FRONTEND

### 5.1 Verificar toolDefinitions atualizado

```typescript
// src/lib/ai/tools/toolDefinitions.ts

// Deve ter 13 ferramentas agora (era 12)
export const AI_TOOLS: Tool[] = [
  // ...
  { name: 'web_search', ... },      // ← NOVA
  { name: 'web_scraping', ... },    // ← ATUALIZADA (usa Playwright)
  { name: 'scrape_products', ... }, // ← ATUALIZADA (usa Playwright)
  // ...
];
```

### 5.2 Verificar toolExecutor atualizado

```typescript
// src/lib/ai/tools/toolExecutor.ts

const TOOL_TO_FUNCTION_MAP: Record<string, string> = {
  // ...
  web_search: 'web-search',              // ← NOVO
  web_scraping: 'playwright-scraper',    // ← ATUALIZADO
  scrape_products: 'playwright-scraper', // ← ATUALIZADO
  // ...
};
```

### 5.3 Testar no Chat (Manual)

1. **Abra o chat da aplicação**
2. **Teste busca web:**
   ```
   Pesquise sobre "tendências de marketing digital 2025"
   ```
3. **Teste web scraping:**
   ```
   Faça scraping de https://example.com e me diga o título da página
   ```
4. **Teste scraping de produtos:**
   ```
   Raspe os produtos desta página: https://www.magazineluiza.com.br/notebook/informatica/s/in/inot/
   ```
5. **Teste criação de arquivo:**
   ```
   Crie um CSV com 3 produtos fictícios (nome, preço, categoria)
   ```

### 5.4 Integrar Tool Calling no Chat

Se o chat ainda não usa Tool Calling automaticamente:

```typescript
// src/pages/ChatPage.tsx ou similar

import {
  getOpenAITools,
  executeTool,
  extractToolCalls,
  getFullSystemPrompt,
} from '@/lib/ai/tools';

// No handleSendMessage:
const systemPrompt = getFullSystemPrompt(true);

const response = await openai.chat.completions.create({
  model: "gpt-4-turbo-preview",
  messages: [
    { role: "system", content: systemPrompt },
    ...conversationHistory,
    { role: "user", content: userMessage }
  ],
  tools: getOpenAITools(), // ← Adiciona as ferramentas
  tool_choice: "auto",     // ← IA decide quando usar
});

// Processar tool calls
const message = response.choices[0].message;
const toolCalls = extractToolCalls(message);

if (toolCalls.length > 0) {
  for (const toolCall of toolCalls) {
    const result = await executeTool(
      toolCall, 
      userId, 
      conversationId
    );
    
    // Adicionar resultado ao chat
    if (result.success) {
      addMessageToChat({
        role: 'assistant',
        content: result.message,
      });
    }
  }
}
```

---

## 🔍 TROUBLESHOOTING

### Problema 1: Playwright não funciona

**Sintoma:**
```
Error: Failed to launch browser
```

**Soluções:**

**A) Usar fallback (web-scraper antigo):**
```typescript
// toolExecutor.ts
const TOOL_TO_FUNCTION_MAP = {
  web_scraping: 'web-scraper', // Volta para o antigo
  // ...
};
```

**B) Tentar Puppeteer:**
```typescript
// Substituir no playwright-scraper/index.ts
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';
```

**C) Desabilitar temporariamente:**
```typescript
// toolExecutor.ts
case 'web_scraping':
  return {
    success: false,
    message: 'Web scraping temporariamente indisponível. Use web_search.',
  };
```

### Problema 2: Web Search retorna erro 401

**Sintoma:**
```
Error: BRAVE_SEARCH_API_KEY não configurada
```

**Solução:**
```bash
# Reconfigurar secret
supabase secrets set BRAVE_SEARCH_API_KEY="sua_chave_aqui"

# Re-deploy da função
supabase functions deploy web-search

# Aguardar 30 segundos e testar novamente
```

### Problema 3: File Generator não retorna URL

**Sintoma:**
```
Arquivo criado mas sem link de download
```

**Solução:**
```sql
-- Verificar se bucket existe
SELECT * FROM storage.buckets WHERE id = 'temp-downloads';

-- Se não existir, criar:
INSERT INTO storage.buckets (id, name, public)
VALUES ('temp-downloads', 'temp-downloads', true);

-- Adicionar políticas (ver Passo 3.2)
```

### Problema 4: Scraping retorna "Nenhum produto"

**Sintoma:**
```json
{
  "data": {
    "products": [],
    "totalProducts": 0
  }
}
```

**Causas comuns:**
1. **Site usa lazy loading agressivo** → Aumentar waitTime
2. **Site usa framework muito específico** → Fornecer seletores customizados
3. **Site bloqueia bots** → Usar web_search + manual

**Soluções:**

```typescript
// A) Aumentar tempo de espera
{
  "url": "...",
  "extractProducts": true,
  "scrollToBottom": true,  // ← Força scroll
  "waitFor": ".product",   // ← Espera elemento específico
  "maxProducts": 50
}

// B) Usar seletores customizados
{
  "url": "...",
  "selectors": {
    "products": ".product-card",
    "name": "h2.title",
    "price": ".price"
  }
}

// C) Capturar screenshot para debug
{
  "url": "...",
  "screenshot": true  // ← Retorna imagem em base64
}
```

### Problema 5: Rate Limit excedido

**Sintoma:**
```
Error: Rate limit exceeded (Brave Search)
```

**Solução:**
```typescript
// web-search/index.ts já tem fallback automático
// Ele tentará DuckDuckGo automaticamente

// Ou configure outra API:
supabase secrets set SERP_API_KEY="..."
```

---

## 💡 EXEMPLOS DE USO

### Exemplo 1: Pesquisa de Mercado Automatizada

**Usuário pergunta:**
> "Pesquise as últimas tendências de e-commerce para 2025 e crie um relatório em CSV"

**IA executa automaticamente:**
1. `web_search("tendências e-commerce 2025")`
2. Analisa os 10 primeiros resultados
3. `generate_file(fileName: "tendencias-2025.csv", content: "...")`
4. Retorna link de download

### Exemplo 2: Monitoramento de Concorrentes

**Usuário pergunta:**
> "Raspe os produtos desta loja: https://concorrente.com/produtos e compare com nossos preços"

**IA executa automaticamente:**
1. `scrape_products("https://concorrente.com/produtos")`
2. `database_query("SELECT name, price FROM Product")`
3. Compara preços
4. `generate_file(fileName: "comparacao.csv", content: "...")`
5. Gera análise em texto + CSV

### Exemplo 3: Pesquisa + Scraping + Relatório

**Usuário pergunta:**
> "Encontre as 3 melhores lojas de eletrônicos do Brasil e extraia os produtos mais vendidos de cada uma"

**IA executa automaticamente:**
1. `web_search("melhores lojas eletrônicos Brasil")`
2. Identifica 3 URLs principais
3. `scrape_products(url1)` → produtos loja 1
4. `scrape_products(url2)` → produtos loja 2
5. `scrape_products(url3)` → produtos loja 3
6. `process_data(operation: "aggregate")` → top produtos
7. `generate_file(fileName: "top-produtos.csv")` → relatório
8. Retorna análise + 3 CSVs

### Exemplo 4: Automação de Conteúdo

**Usuário pergunta:**
> "Pesquise sobre 'marketing de influência 2025', resuma os principais pontos e me envie por email"

**IA executa automaticamente:**
1. `web_search("marketing influência 2025", maxResults: 15)`
2. Analisa e resume os artigos
3. `generate_file(fileName: "resumo.txt", content: "...")`
4. `send_email(to: "user@email.com", subject: "Resumo Marketing", body: "...", attachments: [downloadUrl])`

---

## 📊 MÉTRICAS DE SUCESSO

Após implementação, você deve conseguir:

- ✅ **Web Search:**
  - [ ] Pesquisar na internet em tempo real
  - [ ] Obter 10+ resultados relevantes
  - [ ] Resposta em < 3 segundos
  - [ ] Fallback automático funciona

- ✅ **Playwright Scraper:**
  - [ ] Raspar sites com JavaScript (React/Vue/Angular)
  - [ ] Extrair 20+ produtos de e-commerce
  - [ ] Funcionar com 90%+ dos sites
  - [ ] Screenshots funcionam

- ✅ **File Generator:**
  - [ ] Criar CSV/JSON/TXT
  - [ ] Gerar link de download válido
  - [ ] Download funciona no navegador
  - [ ] Link expira em 1 hora

- ✅ **Integração IA:**
  - [ ] IA escolhe ferramenta certa automaticamente
  - [ ] Executa ações reais (não simula)
  - [ ] Retorna resultados úteis ao usuário
  - [ ] Encadeia múltiplas ferramentas

---

## 🎯 PRÓXIMOS PASSOS

Após implementação bem-sucedida:

### Fase 2 - Melhorias
- [ ] Adicionar cache de buscas (Redis)
- [ ] Implementar retry automático com exponential backoff
- [ ] Adicionar rate limiting por usuário
- [ ] Criar dashboard de métricas (quantas buscas, scraping, etc.)
- [ ] Implementar webhook para scraping assíncrono (sites lentos)

### Fase 3 - Recursos Avançados
- [ ] Scraping programado (cron jobs)
- [ ] Alertas de mudança de preço
- [ ] Comparação automática de concorrentes
- [ ] OCR para extrair texto de imagens
- [ ] Conversão de PDF para texto
- [ ] Geração de relatórios avançados com gráficos

### Fase 4 - Escala
- [ ] Deploy em região mais próxima dos usuários
- [ ] Load balancing entre múltiplas instâncias
- [ ] Queue para processar múltiplos scraping em paralelo
- [ ] CDN para arquivos gerados
- [ ] Monitoramento com Prometheus/Grafana

---

## 📚 RECURSOS ADICIONAIS

### Documentação
- [Playwright Docs](https://playwright.dev/docs/intro)
- [Astral (Playwright for Deno)](https://github.com/lino-levan/astral)
- [Brave Search API](https://brave.com/search/api/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

### Exemplos de Código
- [Playwright Examples](https://playwright.dev/docs/examples)
- [Web Scraping Best Practices](https://github.com/lorien/awesome-web-scraping)
- [Supabase Functions Examples](https://github.com/supabase/supabase/tree/master/examples/edge-functions)

### Comunidade
- [Supabase Discord](https://discord.supabase.com)
- [Playwright Discord](https://aka.ms/playwright/discord)
- [Stack Overflow - Web Scraping](https://stackoverflow.com/questions/tagged/web-scraping)

---

## ✅ CHECKLIST FINAL

Antes de considerar implementação completa:

### Setup Inicial
- [ ] Supabase CLI instalado e configurado
- [ ] Projeto conectado
- [ ] Node.js 18+ instalado

### Edge Functions
- [ ] `playwright-scraper` deployed
- [ ] `web-search` deployed
- [ ] `file-generator-v2` deployed (ou atualizado)
- [ ] Funções aparecem em `supabase functions list`

### Configuração
- [ ] `BRAVE_SEARCH_API_KEY` configurado
- [ ] Bucket `temp-downloads` criado
- [ ] Políticas RLS configuradas
- [ ] Secrets verificados com `supabase secrets list`

### Testes
- [ ] Web search funciona (retorna resultados)
- [ ] Playwright scraper funciona (extrai dados)
- [ ] File generator funciona (gera link de download)
- [ ] Download de arquivo funciona no navegador
- [ ] Scraping de produtos funciona (gera CSV)

### Frontend
- [ ] `toolDefinitions.ts` atualizado (13 ferramentas)
- [ ] `toolExecutor.ts` atualizado (novos mapeamentos)
- [ ] Chat integra Tool Calling
- [ ] IA usa ferramentas automaticamente
- [ ] Resultados aparecem no chat

### Documentação
- [ ] DIAGNOSTICO_PROBLEMAS_IA_COMPLETO.md lido
- [ ] GUIA_IMPLEMENTACAO_NAVEGADOR_HEADLESS.md (este arquivo) lido
- [ ] Equipe treinada no uso das novas funcionalidades
- [ ] README.md atualizado com novas features

---

## 🎉 CONCLUSÃO

Após seguir este guia, seu sistema de IA terá:

1. ✅ **Navegador headless real** (Playwright)
2. ✅ **Busca na internet em tempo real** (Brave Search)
3. ✅ **Criação de arquivos para download** (Storage + signed URLs)
4. ✅ **13 ferramentas funcionais** (antes eram só promessas)

**Resultado:** IA que REALMENTE faz as coisas, não apenas finge fazer!

---

**Última atualização:** 2025-01-31  
**Versão:** 1.0.0  
**Status:** ✅ Pronto para produção  
**Autor:** Assistant  
**Manutenção:** SyncAds Team

**🚀 Boa sorte com a implementação!**