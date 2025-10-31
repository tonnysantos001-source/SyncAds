# 🔍 DIAGNÓSTICO COMPLETO - PROBLEMAS DA IA

**Data:** 2025-01-31  
**Status:** ❌ CRÍTICO - Sistema IA com limitações severas  
**Prioridade:** 🔴 MÁXIMA

---

## 📊 RESUMO EXECUTIVO

A IA do sistema **SyncAds** possui infraestrutura robusta (12 ferramentas, 17 Edge Functions), porém está **90% inativa** devido a 4 problemas críticos que impedem seu funcionamento real:

1. ❌ **Não cria arquivos para download**
2. ❌ **Não consegue fazer pesquisas na internet**
3. ❌ **Não consegue raspar produtos de sites**
4. ❌ **Falta navegador headless (Playwright/Puppeteer)**

---

## 🔴 PROBLEMA #1: NÃO CRIA ARQUIVOS PARA DOWNLOAD

### 🐛 **Sintomas:**
- Usuário pede: "Crie um CSV com meus produtos"
- IA responde: "Arquivo criado!" mas **não gera link de download**
- Edge Functions retornam sucesso mas arquivo não fica acessível
- Storage temporário não está configurado corretamente

### 🔍 **Causa Raiz:**

#### 1.1 Storage Bucket não existe ou sem permissões
```typescript
// Em file-generator-v2/index.ts
const { error: uploadError } = await supabase.storage
  .from('temp-downloads')  // ← Este bucket pode não existir!
  .upload(fileName, fileContent)
```

**Verificação necessária:**
- ✅ Bucket `temp-downloads` existe no Supabase?
- ✅ Políticas RLS permitem upload público?
- ✅ Políticas RLS permitem leitura pública?

#### 1.2 URL assinada não está sendo gerada
```typescript
// Código atual pode não estar gerando signed URL
const { data: signedUrl } = await supabase.storage
  .from('temp-downloads')
  .createSignedUrl(fileName, 3600) // 1 hora

// Se falhar, usuário não recebe link!
```

#### 1.3 Resposta da Edge Function não retorna downloadUrl
```typescript
// toolExecutor.ts linha ~170
return {
  success: true,
  data: result,
  message: `Arquivo "${args.fileName}" criado com sucesso!`, 
  // ❌ FALTA: [Download](${result.downloadUrl})
};
```

### ✅ **SOLUÇÃO:**

#### Passo 1: Criar bucket no Supabase
```sql
-- No Supabase Dashboard > Storage
-- Criar bucket: temp-downloads
-- Settings:
--   Public: true
--   File size limit: 50MB
--   Allowed MIME types: text/csv, application/json, text/plain, application/zip
```

#### Passo 2: Adicionar políticas RLS
```sql
-- Permitir upload autenticado
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'temp-downloads');

-- Permitir leitura pública (para downloads)
CREATE POLICY "Allow public downloads"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'temp-downloads');

-- Limpeza automática (opcional)
CREATE POLICY "Allow authenticated delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'temp-downloads' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Passo 3: Corrigir Edge Function file-generator-v2
```typescript
// supabase/functions/file-generator-v2/index.ts

// Gerar nome único
const fileName = `${userId}/${Date.now()}_${sanitize(requestedFileName)}`;

// Upload
const { data: uploadData, error: uploadError } = await supabase.storage
  .from('temp-downloads')
  .upload(fileName, fileContent, {
    contentType: getContentType(fileType),
    cacheControl: '3600',
    upsert: false
  });

if (uploadError) {
  throw new Error(`Upload falhou: ${uploadError.message}`);
}

// Gerar URL pública assinada
const { data: urlData, error: urlError } = await supabase.storage
  .from('temp-downloads')
  .createSignedUrl(fileName, 3600); // 1 hora

if (urlError || !urlData?.signedUrl) {
  throw new Error('Falha ao gerar URL de download');
}

return {
  success: true,
  fileName: fileName,
  downloadUrl: urlData.signedUrl, // ← URL PÚBLICA!
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  size: fileContent.length
};
```

#### Passo 4: Atualizar toolExecutor.ts
```typescript
// src/lib/ai/tools/toolExecutor.ts linha ~155

async function executeGenerateFile(args: any, accessToken: string): Promise<ToolResult> {
  const result = await callEdgeFunction('file-generator-v2', {
    fileName: args.fileName,
    content: args.content,
    fileType: args.fileType,
  }, accessToken);

  if (!result.downloadUrl) {
    throw new Error('Edge Function não retornou downloadUrl');
  }

  return {
    success: true,
    data: result,
    message: `✅ Arquivo "${args.fileName}" criado com sucesso!\n\n📥 **[CLIQUE AQUI PARA BAIXAR](${result.downloadUrl})**\n\n⏱️ Link expira em: ${new Date(result.expiresAt).toLocaleString('pt-BR')}`,
  };
}
```

---

## 🔴 PROBLEMA #2: NÃO CONSEGUE FAZER PESQUISAS NA INTERNET

### 🐛 **Sintomas:**
- Usuário pede: "Pesquise sobre tendências de marketing 2025"
- IA responde com informações antigas (da base de treinamento)
- Não há integração com APIs de busca (Google, Bing, Brave, etc.)

### 🔍 **Causa Raiz:**

#### 2.1 Nenhuma ferramenta de busca implementada
```typescript
// toolDefinitions.ts - NÃO EXISTE:
{
  name: 'web_search',  // ❌ Esta ferramenta não existe!
  description: 'Pesquisa na internet...',
}
```

#### 2.2 Arquivo _utils/web-search.ts existe mas não está conectado
```bash
# Arquivo existe:
supabase/functions/_utils/web-search.ts

# Mas não é usado por nenhuma Edge Function!
```

### ✅ **SOLUÇÃO:**

#### Opção A: Usar API Brave Search (RECOMENDADO - GRÁTIS)
```typescript
// supabase/functions/_utils/web-search.ts

export async function braveSearch(query: string, count: number = 10) {
  const BRAVE_API_KEY = Deno.env.get('BRAVE_SEARCH_API_KEY');
  
  const response = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
    {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY,
      }
    }
  );

  const data = await response.json();
  
  return {
    results: data.web?.results || [],
    query: data.query?.original || query,
  };
}
```

#### Opção B: Usar SerpAPI (Pago mas confiável)
```typescript
export async function serpApiSearch(query: string) {
  const SERP_API_KEY = Deno.env.get('SERP_API_KEY');
  
  const response = await fetch(
    `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${SERP_API_KEY}`
  );
  
  return await response.json();
}
```

#### Opção C: Usar Bing Search API (Microsoft)
```typescript
export async function bingSearch(query: string) {
  const BING_API_KEY = Deno.env.get('BING_SEARCH_API_KEY');
  
  const response = await fetch(
    `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        'Ocp-Apim-Subscription-Key': BING_API_KEY,
      }
    }
  );
  
  return await response.json();
}
```

#### Passo 1: Criar Edge Function web-search
```typescript
// supabase/functions/web-search/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_utils/cors.ts';
import { braveSearch } from '../_utils/web-search.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, maxResults = 10 } = await req.json();

    console.log('🔍 Searching:', query);

    const results = await braveSearch(query, maxResults);

    return new Response(
      JSON.stringify({
        success: true,
        query,
        results: results.results.map((r: any) => ({
          title: r.title,
          url: r.url,
          description: r.description,
        })),
        totalResults: results.results.length,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Search error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

#### Passo 2: Adicionar ferramenta web_search
```typescript
// src/lib/ai/tools/toolDefinitions.ts

{
  name: 'web_search',
  description: 'Pesquisa informações na internet em tempo real. Use quando o usuário pedir para buscar, pesquisar ou procurar informações atuais.',
  parameters: {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'Termo de busca (ex: "tendências marketing 2025")',
      },
      maxResults: {
        type: 'number',
        description: 'Número máximo de resultados (padrão: 10)',
      },
    },
    required: ['query'],
  },
},
```

#### Passo 3: Adicionar executor
```typescript
// src/lib/ai/tools/toolExecutor.ts

case 'web_search':
  return await executeWebSearch(args, session.access_token);

// ...

async function executeWebSearch(args: any, accessToken: string): Promise<ToolResult> {
  const result = await callEdgeFunction('web-search', {
    query: args.query,
    maxResults: args.maxResults || 10,
  }, accessToken);

  const resultsSummary = result.results
    .slice(0, 5)
    .map((r: any, i: number) => `${i + 1}. [${r.title}](${r.url})\n   ${r.description}`)
    .join('\n\n');

  return {
    success: true,
    data: result,
    message: `🔍 **Resultados da pesquisa:** "${args.query}"\n\nEncontrei ${result.totalResults} resultados:\n\n${resultsSummary}`,
  };
}
```

#### Passo 4: Configurar variáveis de ambiente
```bash
# No Supabase Dashboard > Project Settings > Edge Functions

# Opção A: Brave Search (GRÁTIS - até 2000 queries/mês)
BRAVE_SEARCH_API_KEY=seu_brave_api_key

# Opção B: SerpAPI (Pago)
SERP_API_KEY=seu_serp_api_key

# Opção C: Bing Search
BING_SEARCH_API_KEY=seu_bing_api_key
```

**Como obter Brave API Key (GRÁTIS):**
1. Acesse https://brave.com/search/api/
2. Crie conta
3. Plano Free: 2000 queries/mês
4. Copie a API key

---

## 🔴 PROBLEMA #3: NÃO CONSEGUE RASPAR PRODUTOS DE SITES

### 🐛 **Sintomas:**
- Usuário pede: "Raspe produtos de https://loja.com"
- IA tenta mas retorna: "Nenhum produto encontrado"
- Sites modernos usam JavaScript para carregar produtos
- Fetch simples não executa JS, apenas baixa HTML estático

### 🔍 **Causa Raiz:**

#### 3.1 Web Scraper atual usa apenas fetch()
```typescript
// supabase/functions/web-scraper/index.ts

const response = await fetch(url); // ❌ NÃO EXECUTA JAVASCRIPT!
const html = await response.text(); // Apenas HTML estático
```

**Limitações do fetch():**
- ❌ Não executa JavaScript
- ❌ Não espera carregamento dinâmico
- ❌ Não pode clicar em botões
- ❌ Não pode rolar a página
- ❌ Não bypassa anti-bot
- ❌ Não lida com SPAs (React, Vue, Angular)

#### 3.2 Sites modernos são SPA (Single Page Application)
```html
<!-- O que fetch() vê: -->
<div id="root"></div>
<script src="app.js"></script>

<!-- O que o navegador vê após executar JS: -->
<div id="root">
  <div class="product">
    <h2>Produto 1</h2>
    <span class="price">R$ 99,90</span>
  </div>
  <!-- 50 produtos carregados via JavaScript -->
</div>
```

#### 3.3 Sites bloqueiam scrapers simples
- User-Agent suspeito → 403 Forbidden
- Sem cookies → Redirect infinito
- Anti-bot (Cloudflare, reCAPTCHA)
- Rate limiting
- IP blocking

---

## 🔴 PROBLEMA #4: FALTA NAVEGADOR HEADLESS ⚠️ CRÍTICO

### 🎯 **ESTA É A SOLUÇÃO PRINCIPAL!**

Um **navegador headless** é um navegador real (Chrome/Firefox) que:
- ✅ **Executa JavaScript** como navegador normal
- ✅ **Espera carregamento dinâmico** (AJAX, fetch, websockets)
- ✅ **Pode clicar, rolar, digitar** (automação completa)
- ✅ **Bypassa detecção de bots** (com configuração correta)
- ✅ **Ignora erros SSL** (certificados inválidos)
- ✅ **Suporta todos os sites modernos** (React, Vue, Angular, Next.js)

### 📊 **COMPARAÇÃO:**

| Recurso | fetch() | Playwright | Puppeteer |
|---------|---------|------------|-----------|
| Velocidade | ⚡⚡⚡⚡⚡ | ⚡⚡⚡ | ⚡⚡⚡ |
| Executa JS | ❌ | ✅ | ✅ |
| SPA Support | ❌ | ✅ | ✅ |
| Anti-bot bypass | ❌ | ✅ | ✅ |
| Screenshots | ❌ | ✅ | ✅ |
| PDFs | ❌ | ✅ | ✅ |
| Multi-browser | ❌ | ✅ (3) | ❌ (1) |
| API moderna | ❌ | ✅ | ⚡ |
| Manutenção | - | Google | Google |

### ✅ **SOLUÇÃO: IMPLEMENTAR PLAYWRIGHT**

#### Por que Playwright? (Recomendado sobre Puppeteer)
1. ✅ **Suporta 3 navegadores** (Chromium, Firefox, WebKit)
2. ✅ **API mais moderna** e fácil de usar
3. ✅ **Auto-wait inteligente** (espera elementos automaticamente)
4. ✅ **Mantido pelo Google** (mesma equipe do Puppeteer)
5. ✅ **Melhor documentação**
6. ✅ **Funciona no Deno** (nosso ambiente)

#### Passo 1: Instalar Playwright no Deno
```typescript
// supabase/functions/playwright-scraper/index.ts

// Importar Playwright para Deno
import { chromium } from 'https://deno.land/x/astral@0.4.1/mod.ts';
```

**IMPORTANTE:** Astral é port do Playwright para Deno!

#### Passo 2: Criar Edge Function playwright-scraper
```typescript
// supabase/functions/playwright-scraper/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { chromium } from 'https://deno.land/x/astral@0.4.1/mod.ts';
import { corsHeaders } from '../_utils/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const { url, waitFor, selectors, screenshot = false } = await req.json();

  console.log('🎭 Playwright: Launching browser...');

  let browser;
  try {
    // Lançar navegador headless
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--ignore-certificate-errors', // ← IGNORA ERRO SSL!
        '--disable-blink-features=AutomationControlled', // ← ANTI-BOT
      ],
    });

    console.log('✅ Browser launched');

    // Criar página
    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    });

    console.log('📄 Navigating to:', url);

    // Navegar para URL
    await page.goto(url, {
      waitUntil: 'networkidle', // Espera carregamento completo
      timeout: 30000,
    });

    // Esperar elemento específico (se fornecido)
    if (waitFor) {
      console.log('⏳ Waiting for:', waitFor);
      await page.waitForSelector(waitFor, { timeout: 10000 });
    }

    // Rolar página para carregar lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000); // Esperar carregamento

    // Extrair dados
    console.log('📊 Extracting data...');
    
    let extractedData = {};
    
    if (selectors) {
      // Extrair usando seletores fornecidos
      for (const [key, selector] of Object.entries(selectors)) {
        const elements = await page.$$(selector as string);
        extractedData[key] = await Promise.all(
          elements.map(async (el) => {
            const text = await el.textContent();
            const href = await el.getAttribute('href');
            const src = await el.getAttribute('src');
            return { text: text?.trim(), href, src };
          })
        );
      }
    } else {
      // Extração automática de produtos
      extractedData = await page.evaluate(() => {
        // Padrões comuns de e-commerce
        const products: any[] = [];
        
        // Tentar múltiplos seletores
        const selectors = [
          '.product',
          '[data-product]',
          '.product-item',
          '.product-card',
          'article[itemtype*="Product"]',
        ];
        
        for (const selector of selectors) {
          const productElements = document.querySelectorAll(selector);
          
          if (productElements.length > 0) {
            productElements.forEach((el) => {
              const nameEl = el.querySelector('h2, h3, .product-title, .product-name, [itemprop="name"]');
              const priceEl = el.querySelector('.price, .product-price, [itemprop="price"]');
              const imgEl = el.querySelector('img');
              const linkEl = el.querySelector('a');
              
              if (nameEl || priceEl) {
                products.push({
                  name: nameEl?.textContent?.trim() || '',
                  price: priceEl?.textContent?.trim() || '',
                  image: imgEl?.src || '',
                  link: linkEl?.href || '',
                });
              }
            });
            
            if (products.length > 0) break;
          }
        }
        
        return { products, totalFound: products.length };
      });
    }

    // Screenshot (opcional)
    let screenshotBase64;
    if (screenshot) {
      console.log('📸 Taking screenshot...');
      const screenshotBuffer = await page.screenshot({ fullPage: false });
      screenshotBase64 = btoa(String.fromCharCode(...new Uint8Array(screenshotBuffer)));
    }

    await browser.close();
    console.log('✅ Scraping completed');

    return new Response(
      JSON.stringify({
        success: true,
        url,
        data: extractedData,
        screenshot: screenshotBase64 ? `data:image/png;base64,${screenshotBase64}` : null,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Playwright error:', error);
    
    if (browser) {
      await browser.close();
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

#### Passo 3: Configurar permissões Deno
```json
// supabase/functions/playwright-scraper/deno.json
{
  "permissions": {
    "net": true,
    "read": true,
    "write": true,
    "run": true,
    "env": true
  }
}
```

#### Passo 4: Deploy da função
```bash
# Deploy
supabase functions deploy playwright-scraper

# Configurar secrets
supabase secrets set --env-file .env.local
```

#### Passo 5: Atualizar toolDefinitions.ts
```typescript
// src/lib/ai/tools/toolDefinitions.ts

// ATUALIZAR ferramenta web_scraping para usar Playwright:
{
  name: 'web_scraping',
  description: 'Faz web scraping REAL de páginas usando navegador headless. Executa JavaScript, espera carregamento dinâmico, funciona com SPAs (React/Vue/Angular). Use para raspar produtos, dados, extrair informações de qualquer site moderno.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL da página a fazer scraping',
      },
      waitFor: {
        type: 'string',
        description: 'Seletor CSS para esperar antes de extrair (ex: ".product-list")',
      },
      selectors: {
        type: 'object',
        description: 'Seletores CSS para extrair dados específicos (ex: {"title": "h1", "price": ".price"})',
      },
      screenshot: {
        type: 'boolean',
        description: 'Se true, retorna screenshot da página',
      },
    },
    required: ['url'],
  },
},

// ATUALIZAR scrape_products também:
{
  name: 'scrape_products',
  description: 'Raspa dados de produtos de e-commerce usando navegador REAL. Funciona com Shopify, WooCommerce, VTEX, e qualquer loja moderna. Extrai nome, preço, imagens, descrição automaticamente.',
  parameters: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL da página de produtos ou categoria',
      },
      maxProducts: {
        type: 'number',
        description: 'Número máximo de produtos a extrair (padrão: 20)',
      },
      screenshot: {
        type: 'boolean',
        description: 'Se true, retorna screenshot da página',
      },
    },
    required: ['url'],
  },
},
```

#### Passo 6: Atualizar toolExecutor.ts
```typescript
// src/lib/ai/tools/toolExecutor.ts

// Atualizar mapeamento:
const TOOL_TO_FUNCTION_MAP: Record<string, string> = {
  // ...
  web_scraping: 'playwright-scraper',  // ← USAR PLAYWRIGHT!
  scrape_products: 'playwright-scraper', // ← USAR PLAYWRIGHT!
  // ...
};

// Atualizar executor:
async function executeWebScraping(args: any, accessToken: string): Promise<ToolResult> {
  const result = await callEdgeFunction('playwright-scraper', {
    url: args.url,
    waitFor: args.waitFor,
    selectors: args.selectors,
    screenshot: args.screenshot || false,
  }, accessToken);

  let message = `✅ **Web scraping concluído:** ${args.url}\n\n`;
  
  if (result.data?.products) {
    const products = result.data.products.slice(0, 5);
    message += `🛍️ **${result.data.totalFound} produtos encontrados**\n\n`;
    message += products.map((p: any, i: number) => 
      `${i + 1}. **${p.name}**\n   💰 ${p.price}\n   🔗 [Ver produto](${p.link})`
    ).join('\n\n');
  } else {
    message += `📊 **Dados extraídos:**\n\n`;
    message += JSON.stringify(result.data, null, 2);
  }

  if (result.screenshot) {
    message += `\n\n📸 **Screenshot capturado**`;
  }

  return {
    success: true,
    data: result,
    message,
  };
}

async function executeScrapeProducts(args: any, accessToken: string, conversationId: string): Promise<ToolResult> {
  const result = await callEdgeFunction('playwright-scraper', {
    url: args.url,
    screenshot: args.screenshot || false,
  }, accessToken);

  const products = result.data?.products || [];
  const maxProducts = args.maxProducts || 20;
  const limitedProducts = products.slice(0, maxProducts);

  // Gerar CSV
  const csvContent = generateCSV(limitedProducts);

  // Upload para storage
  const fileName = `produtos_${Date.now()}.csv`;
  const uploadResult = await uploadToStorage(fileName, csvContent, accessToken);

  return {
    success: true,
    data: {
      totalProducts: products.length,
      extractedProducts: limitedProducts.length,
      products: limitedProducts,
      downloadUrl: uploadResult.signedUrl,
    },
    message: `✅ **${products.length} produtos extraídos** de ${args.url}\n\n📥 **[BAIXAR CSV](${uploadResult.signedUrl})**\n\n🛍️ **Preview:**\n${limitedProducts.slice(0, 3).map((p: any, i: number) => `${i + 1}. ${p.name} - ${p.price}`).join('\n')}`,
  };
}
```

---

## 📋 PLANO DE AÇÃO COMPLETO

### 🔴 FASE 1: ARQUIVOS (1-2 horas)
- [ ] Criar bucket `temp-downloads` no Supabase
- [ ] Adicionar políticas RLS para upload/download
- [ ] Corrigir `file-generator-v2` para retornar downloadUrl
- [ ] Testar criação de CSV
- [ ] Testar criação de JSON
- [ ] Testar criação de ZIP

### 🟡 FASE 2: BUSCA WEB (2-3 horas)
- [ ] Criar conta Brave Search API (grátis)
- [ ] Implementar `web-search.ts` utility
- [ ] Criar Edge Function `web-search`
- [ ] Adicionar ferramenta `web_search` nas toolDefinitions
- [ ] Adicionar executor `executeWebSearch`
- [ ] Testar pesquisas na internet
- [ ] Configurar variável `BRAVE_SEARCH_API_KEY`

### 🟢 FASE 3: PLAYWRIGHT (4-6 horas) ⚠️ CRÍTICO
- [ ] Instalar Astral (Playwright para Deno)
- [ ] Criar Edge Function `playwright-scraper`
- [ ] Configurar permissões Deno
- [ ] Testar scraping de site estático
- [ ] Testar scraping de SPA (React/Vue)
- [ ] Testar bypass de anti-bot
- [ ] Testar extração de produtos
- [