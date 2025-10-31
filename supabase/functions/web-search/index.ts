// ============================================
// WEB SEARCH - Internet Search API
// ============================================
// Busca real na internet usando Brave Search API
// Fallback para outras APIs se necessário
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_utils/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SearchRequest {
  query: string;
  maxResults?: number;
  freshness?: 'day' | 'week' | 'month' | 'year';
  country?: string;
  language?: string;
}

interface SearchResult {
  title: string;
  url: string;
  description: string;
  favicon?: string;
  age?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

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
      query,
      maxResults = 10,
      freshness,
      country = 'BR',
      language = 'pt',
    }: SearchRequest = await req.json();

    if (!query || query.trim().length === 0) {
      throw new Error('Query é obrigatória');
    }

    console.log('🔍 Web Search iniciada');
    console.log('📝 Query:', query);
    console.log('👤 User:', user.id);

    // Tentar Brave Search API primeiro
    let results: SearchResult[] = [];
    let searchEngine = '';
    let error = null;

    try {
      const braveResults = await searchWithBrave(query, maxResults, freshness, country);
      results = braveResults;
      searchEngine = 'Brave Search';
      console.log(`✅ Brave Search: ${results.length} resultados`);
    } catch (braveError: any) {
      console.error('❌ Brave Search falhou:', braveError.message);
      error = braveError.message;

      // Fallback: Tentar DuckDuckGo HTML Scraping
      try {
        const duckResults = await searchWithDuckDuckGo(query, maxResults);
        results = duckResults;
        searchEngine = 'DuckDuckGo';
        console.log(`✅ DuckDuckGo: ${results.length} resultados`);
      } catch (duckError: any) {
        console.error('❌ DuckDuckGo falhou:', duckError.message);
        error = `${error} | ${duckError.message}`;

        // Fallback final: Retornar mensagem informativa
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Nenhuma API de busca disponível',
            message: 'Configure BRAVE_SEARCH_API_KEY nas variáveis de ambiente',
            details: error,
            helpUrl: 'https://brave.com/search/api/',
          }),
          {
            status: 503,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Limitar resultados
    const limitedResults = results.slice(0, maxResults);

    return new Response(
      JSON.stringify({
        success: true,
        query,
        results: limitedResults,
        metadata: {
          totalResults: limitedResults.length,
          searchEngine,
          timestamp: new Date().toISOString(),
          country,
          language,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('❌ Erro no Web Search:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// ============================================================================
// BRAVE SEARCH API (Recomendado - 2000 queries/mês grátis)
// ============================================================================
async function searchWithBrave(
  query: string,
  count: number,
  freshness?: string,
  country?: string
): Promise<SearchResult[]> {
  const BRAVE_API_KEY = Deno.env.get('BRAVE_SEARCH_API_KEY');

  if (!BRAVE_API_KEY) {
    throw new Error('BRAVE_SEARCH_API_KEY não configurada');
  }

  let url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;

  if (freshness) {
    url += `&freshness=${freshness}`;
  }

  if (country) {
    url += `&country=${country}`;
  }

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': BRAVE_API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brave API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Converter formato Brave para formato padrão
  const results: SearchResult[] = (data.web?.results || []).map((result: any) => ({
    title: result.title || '',
    url: result.url || '',
    description: result.description || '',
    favicon: result.profile?.img || null,
    age: result.age || null,
  }));

  return results;
}

// ============================================================================
// DUCKDUCKGO (Fallback - Scraping HTML)
// ============================================================================
async function searchWithDuckDuckGo(query: string, count: number): Promise<SearchResult[]> {
  console.log('🦆 Tentando DuckDuckGo...');

  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo error: ${response.status}`);
  }

  const html = await response.text();

  // Extrair resultados do HTML
  const results: SearchResult[] = [];

  // Regex para extrair resultados
  const resultRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([^<]+)<\/a>/gi;

  let match;
  while ((match = resultRegex.exec(html)) !== null && results.length < count) {
    const url = decodeURIComponent(match[1]).replace(/^\/\/duckduckgo\.com\/l\/\?uddg=/, '').split('&')[0];
    const title = match[2].trim();
    const description = match[3].trim();

    if (url && url.startsWith('http')) {
      results.push({
        title: decodeHtmlEntities(title),
        url: decodeHtmlEntities(url),
        description: decodeHtmlEntities(description),
      });
    }
  }

  // Se regex não funcionar, tentar método alternativo
  if (results.length === 0) {
    const linkPattern = /<a[^>]+href="([^"]+)"[^>]*class="result__url"[^>]*>([^<]+)<\/a>/gi;
    const titlePattern = /<a[^>]+class="result__a"[^>]*>([^<]+)<\/a>/gi;

    const links: string[] = [];
    const titles: string[] = [];

    while ((match = linkPattern.exec(html)) !== null) {
      links.push(match[1]);
    }

    while ((match = titlePattern.exec(html)) !== null) {
      titles.push(match[1]);
    }

    for (let i = 0; i < Math.min(links.length, titles.length, count); i++) {
      results.push({
        title: decodeHtmlEntities(titles[i]),
        url: decodeHtmlEntities(links[i]),
        description: '',
      });
    }
  }

  if (results.length === 0) {
    throw new Error('Nenhum resultado encontrado no DuckDuckGo');
  }

  return results;
}

// ============================================================================
// SERP API (Pago mas confiável)
// ============================================================================
async function searchWithSerpApi(query: string, count: number): Promise<SearchResult[]> {
  const SERP_API_KEY = Deno.env.get('SERP_API_KEY');

  if (!SERP_API_KEY) {
    throw new Error('SERP_API_KEY não configurada');
  }

  const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&num=${count}&api_key=${SERP_API_KEY}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`SerpAPI error: ${response.status}`);
  }

  const data = await response.json();

  const results: SearchResult[] = (data.organic_results || []).map((result: any) => ({
    title: result.title || '',
    url: result.link || '',
    description: result.snippet || '',
  }));

  return results;
}

// ============================================================================
// BING SEARCH API (Microsoft)
// ============================================================================
async function searchWithBing(query: string, count: number): Promise<SearchResult[]> {
  const BING_API_KEY = Deno.env.get('BING_SEARCH_API_KEY');

  if (!BING_API_KEY) {
    throw new Error('BING_SEARCH_API_KEY não configurada');
  }

  const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${count}`;

  const response = await fetch(url, {
    headers: {
      'Ocp-Apim-Subscription-Key': BING_API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`Bing API error: ${response.status}`);
  }

  const data = await response.json();

  const results: SearchResult[] = (data.webPages?.value || []).map((result: any) => ({
    title: result.name || '',
    url: result.url || '',
    description: result.snippet || '',
  }));

  return results;
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
  };

  return text.replace(/&[a-z]+;|&#\d+;/gi, (match) => entities[match] || match);
}
