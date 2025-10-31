// ============================================
// PLAYWRIGHT SCRAPER - Real Browser Scraping
// ============================================
// Web scraping REAL com navegador headless
// Executa JavaScript, funciona com SPAs, bypassa anti-bot
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { chromium } from 'https://deno.land/x/astral@0.4.1/mod.ts';
import { corsHeaders } from '../_utils/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ScrapeRequest {
  url: string;
  waitFor?: string;
  selectors?: Record<string, string>;
  screenshot?: boolean;
  scrollToBottom?: boolean;
  clickSelector?: string;
  extractProducts?: boolean;
  maxProducts?: number;
  timeout?: number;
}

interface Product {
  name: string;
  price: string;
  image?: string;
  link?: string;
  description?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  let browser;

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verificar autenticação
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      url,
      waitFor,
      selectors,
      screenshot = false,
      scrollToBottom = true,
      clickSelector,
      extractProducts = true,
      maxProducts = 50,
      timeout = 30000,
    }: ScrapeRequest = await req.json();

    if (!url) {
      throw new Error('URL é obrigatória');
    }

    console.log('🎭 Playwright Scraper iniciado');
    console.log('📍 URL:', url);
    console.log('👤 User:', user.id);

    // Validar URL
    const parsedUrl = new URL(url);
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('URL deve começar com http:// ou https://');
    }

    // Lançar navegador
    console.log('🚀 Lançando navegador headless...');

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
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
      ],
    });

    console.log('✅ Navegador lançado');

    // Criar contexto do navegador
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
      ignoreHTTPSErrors: true,
    });

    // Criar página
    const page = await context.newPage();

    // Adicionar headers extras
    await page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });

    console.log('📄 Navegando para:', url);

    // Navegar para URL
    const response = await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: timeout,
    });

    if (!response) {
      throw new Error('Falha ao carregar página');
    }

    const statusCode = response.status();
    console.log('📊 Status HTTP:', statusCode);

    if (statusCode >= 400) {
      throw new Error(`HTTP ${statusCode}: ${response.statusText()}`);
    }

    // Esperar carregamento inicial
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('⚠️ Network idle timeout (ignorado)');
    });

    // Esperar elemento específico (se fornecido)
    if (waitFor) {
      console.log('⏳ Esperando por:', waitFor);
      await page.waitForSelector(waitFor, { timeout: 10000 }).catch(() => {
        console.log('⚠️ Seletor não encontrado (continuando)');
      });
    }

    // Clicar em elemento (se fornecido)
    if (clickSelector) {
      console.log('🖱️ Clicando em:', clickSelector);
      await page.click(clickSelector, { timeout: 5000 }).catch(() => {
        console.log('⚠️ Não foi possível clicar (continuando)');
      });
      await page.waitForTimeout(2000);
    }

    // Rolar página para carregar lazy loading
    if (scrollToBottom) {
      console.log('📜 Rolando página...');
      await autoScroll(page);
    }

    // Extrair dados
    console.log('📊 Extraindo dados...');

    let extractedData: any = {};
    let products: Product[] = [];

    if (selectors && Object.keys(selectors).length > 0) {
      // Extrair usando seletores customizados
      console.log('🎯 Usando seletores customizados');
      extractedData = await extractWithSelectors(page, selectors);
    }

    if (extractProducts) {
      // Extrair produtos automaticamente
      console.log('🛍️ Extraindo produtos...');
      products = await extractProductsFromPage(page, maxProducts);
      extractedData.products = products;
      extractedData.totalProducts = products.length;
    }

    // Extrair metadados da página
    const metadata = await page.evaluate(() => {
      const title = document.title;
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
      const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';

      return { title, description, ogImage, canonical };
    });

    extractedData.metadata = metadata;

    // Capturar screenshot (se solicitado)
    let screenshotData = null;
    if (screenshot) {
      console.log('📸 Capturando screenshot...');
      const screenshotBuffer = await page.screenshot({
        fullPage: false,
        type: 'png',
      });
      screenshotData = `data:image/png;base64,${btoa(String.fromCharCode(...new Uint8Array(screenshotBuffer)))}`;
    }

    // Fechar navegador
    await browser.close();
    browser = null;

    const duration = Date.now() - startTime;
    console.log(`✅ Scraping concluído em ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        url,
        data: extractedData,
        screenshot: screenshotData,
        metadata: {
          duration: `${duration}ms`,
          statusCode,
          timestamp: new Date().toISOString(),
          productsFound: products.length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Erro no Playwright Scraper:', error);

    // Fechar navegador em caso de erro
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('❌ Erro ao fechar navegador:', closeError);
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
        duration: `${Date.now() - startTime}ms`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

/**
 * Rola a página automaticamente para carregar conteúdo lazy loading
 */
async function autoScroll(page: any): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const maxScrolls = 50;
      let scrolls = 0;

      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        scrolls++;

        if (totalHeight >= scrollHeight || scrolls >= maxScrolls) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });

  // Esperar um pouco após rolar
  await page.waitForTimeout(1000);
}

/**
 * Extrai dados usando seletores customizados
 */
async function extractWithSelectors(page: any, selectors: Record<string, string>): Promise<any> {
  const data: any = {};

  for (const [key, selector] of Object.entries(selectors)) {
    try {
      const elements = await page.$$(selector);

      if (elements.length === 0) {
        data[key] = null;
        continue;
      }

      const values = await Promise.all(
        elements.map(async (el: any) => {
          const text = await el.textContent();
          const href = await el.getAttribute('href');
          const src = await el.getAttribute('src');
          const value = await el.getAttribute('value');

          return {
            text: text?.trim() || '',
            href: href || null,
            src: src || null,
            value: value || null,
          };
        })
      );

      data[key] = values.length === 1 ? values[0] : values;
    } catch (error) {
      console.error(`Erro ao extrair ${key}:`, error);
      data[key] = null;
    }
  }

  return data;
}

/**
 * Extrai produtos automaticamente da página
 */
async function extractProductsFromPage(page: any, maxProducts: number): Promise<Product[]> {
  const products = await page.evaluate((max: number) => {
    const foundProducts: Product[] = [];

    // Lista de seletores comuns para produtos
    const productSelectors = [
      '.product',
      '[data-product]',
      '[data-product-id]',
      '.product-item',
      '.product-card',
      '.product-grid-item',
      'article[itemtype*="Product"]',
      '[class*="product"]',
      '[id*="product"]',
      '.showcase-product',
      '.item-product',
    ];

    // Tentar encontrar produtos usando diferentes seletores
    let productElements: NodeListOf<Element> | null = null;

    for (const selector of productSelectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0 && elements.length < 1000) {
        productElements = elements;
        console.log(`✓ Produtos encontrados com seletor: ${selector}`);
        break;
      }
    }

    if (!productElements || productElements.length === 0) {
      console.log('⚠️ Nenhum produto encontrado com seletores padrão');
      return [];
    }

    // Extrair dados de cada produto
    productElements.forEach((el, index) => {
      if (foundProducts.length >= max) return;

      try {
        // Nome do produto
        const nameSelectors = [
          'h2',
          'h3',
          'h4',
          '.product-title',
          '.product-name',
          '[itemprop="name"]',
          'a[title]',
          '.title',
          '.name',
        ];

        let name = '';
        for (const selector of nameSelectors) {
          const nameEl = el.querySelector(selector);
          if (nameEl?.textContent?.trim()) {
            name = nameEl.textContent.trim();
            break;
          }
        }

        // Preço
        const priceSelectors = [
          '.price',
          '.product-price',
          '[itemprop="price"]',
          '[data-price]',
          '.price-current',
          '.sale-price',
          '.current-price',
          'span[class*="price"]',
        ];

        let price = '';
        for (const selector of priceSelectors) {
          const priceEl = el.querySelector(selector);
          if (priceEl?.textContent?.trim()) {
            price = priceEl.textContent.trim();
            break;
          }
        }

        // Imagem
        const imgEl = el.querySelector('img');
        const image = imgEl?.src || imgEl?.getAttribute('data-src') || '';

        // Link
        const linkEl = el.querySelector('a');
        let link = linkEl?.href || '';

        // Converter link relativo em absoluto
        if (link && !link.startsWith('http')) {
          link = new URL(link, window.location.origin).href;
        }

        // Descrição
        const descSelectors = [
          '.product-description',
          '[itemprop="description"]',
          '.description',
          'p',
        ];

        let description = '';
        for (const selector of descSelectors) {
          const descEl = el.querySelector(selector);
          if (descEl?.textContent?.trim() && descEl.textContent.length > 10) {
            description = descEl.textContent.trim().substring(0, 200);
            break;
          }
        }

        // Adicionar produto se tiver pelo menos nome ou preço
        if (name || price) {
          foundProducts.push({
            name: name || `Produto ${index + 1}`,
            price: price || 'Preço não disponível',
            image: image,
            link: link,
            description: description,
          });
        }
      } catch (error) {
        console.error('Erro ao extrair produto:', error);
      }
    });

    return foundProducts;
  }, maxProducts);

  return products;
}
