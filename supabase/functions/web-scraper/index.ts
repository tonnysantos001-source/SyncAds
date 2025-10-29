// ============================================
// WEB SCRAPER - Real Browser Scraping
// ============================================
// Scraping REAL de websites usando Puppeteer
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_utils/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, selector, extractData } = await req.json();

    if (!url) {
      throw new Error('URL é obrigatória');
    }

    console.log('🔍 Scraping:', url);

    // Fazer fetch simples primeiro
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('📄 HTML baixado:', html.length, 'bytes');

    // Extrair dados básicos
    const result = await extractDataFromHTML(html, url, extractData);

    return new Response(
      JSON.stringify({
        success: true,
        url,
        data: result,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('❌ Erro no scraping:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Extrai dados do HTML
 */
function extractDataFromHTML(html: string, url: string, extractData?: any) {
  // Extrair título
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  // Extrair meta description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  // Extrair preços (padrões comuns)
  const pricePatterns = [
    /R\$\s*(\d+[.,]\d+)/g,
    /USD\s*(\d+[.,]\d+)/g,
    /\$\s*(\d+[.,]\d+)/g,
    /(\d+[.,]\d+)\s*reais/gi,
  ];

  const prices: string[] = [];
  for (const pattern of pricePatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      prices.push(match[1]);
    }
  }

  // Extrair imagens (principais)
  const imgMatches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  const images: string[] = [];
  for (const match of imgMatches) {
    let imgUrl = match[1];
    // Resolver URLs relativas
    if (imgUrl.startsWith('/')) {
      const baseUrl = new URL(url);
      imgUrl = `${baseUrl.origin}${imgUrl}`;
    }
    // Filtrar imagens muito pequenas (provavelmente ícones)
    if (!imgUrl.includes('1x1') && !imgUrl.includes('pixel')) {
      images.push(imgUrl);
    }
  }

  // Extrair links
  const linkMatches = html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi);
  const links: { url: string; text: string }[] = [];
  for (const match of linkMatches) {
    let linkUrl = match[1];
    const linkText = match[2].trim();

    // Resolver URLs relativas
    if (linkUrl.startsWith('/')) {
      const baseUrl = new URL(url);
      linkUrl = `${baseUrl.origin}${linkUrl}`;
    }

    if (linkText && linkUrl.startsWith('http')) {
      links.push({ url: linkUrl, text: linkText });
    }
  }

  // Extrair produtos (se detectar e-commerce)
  const products = extractProducts(html, url);

  // Extrair texto limpo
  let cleanText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 2000);

  return {
    title,
    description,
    prices: [...new Set(prices)].slice(0, 10),
    images: [...new Set(images)].slice(0, 20),
    links: links.slice(0, 30),
    products: products.slice(0, 20),
    textPreview: cleanText,
    detectedType: detectPageType(html, url),
  };
}

/**
 * Detecta tipo de página
 */
function detectPageType(html: string, url: string): string {
  const lowerHTML = html.toLowerCase();
  const lowerURL = url.toLowerCase();

  if (lowerHTML.includes('add to cart') || lowerHTML.includes('adicionar ao carrinho') ||
      lowerHTML.includes('shopify') || lowerHTML.includes('woocommerce')) {
    return 'e-commerce';
  }

  if (lowerURL.includes('blog') || lowerHTML.includes('<article')) {
    return 'blog';
  }

  if (lowerHTML.includes('youtube.com') || lowerHTML.includes('video')) {
    return 'video';
  }

  return 'website';
}

/**
 * Extrai produtos de e-commerce
 */
function extractProducts(html: string, baseUrl: string): any[] {
  const products: any[] = [];

  // Padrões comuns de e-commerce
  const productPatterns = [
    {
      // Shopify
      name: /<h\d[^>]*class=["'][^"']*product[^"']*title[^"']*["'][^>]*>([^<]+)</gi,
      price: /<span[^>]*class=["'][^"']*price[^"']*["'][^>]*>.*?R\$\s*(\d+[.,]\d+)/gi,
    },
    {
      // WooCommerce
      name: /<h\d[^>]*class=["'][^"']*woocommerce-loop-product__title[^"']*["'][^>]*>([^<]+)</gi,
      price: /<span[^>]*class=["'][^"']*woocommerce-Price-amount[^"']*["'][^>]*>.*?R\$\s*(\d+[.,]\d+)/gi,
    },
    {
      // Genérico
      name: /<h[2-4][^>]*>([^<]+)<\/h[2-4]>/gi,
      price: /R\$\s*(\d+[.,]\d+)/g,
    },
  ];

  // Tentar extrair com cada padrão
  for (const pattern of productPatterns) {
    const names = [...html.matchAll(pattern.name)];
    const prices = [...html.matchAll(pattern.price)];

    for (let i = 0; i < Math.min(names.length, prices.length); i++) {
      products.push({
        name: names[i][1].trim(),
        price: prices[i][1],
        source: baseUrl,
      });
    }

    if (products.length > 0) break;
  }

  return products;
}

