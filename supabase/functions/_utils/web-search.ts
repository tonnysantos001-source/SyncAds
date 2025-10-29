// ============================================
// WEB SEARCH - Multi-Provider
// ============================================
// Suporta Exa AI, Tavily e Serper
// Configure as API keys nos secrets do Supabase
// ============================================

const EXA_API_KEY = Deno.env.get('EXA_API_KEY');
const TAVILY_API_KEY = Deno.env.get('TAVILY_API_KEY');
const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  score?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  provider: string;
}

/**
 * Busca usando Exa AI
 */
async function searchWithExa(query: string, numResults = 5): Promise<SearchResponse> {
  if (!EXA_API_KEY) {
    throw new Error('EXA_API_KEY not configured');
  }

  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': EXA_API_KEY,
    },
    body: JSON.stringify({
      query,
      numResults,
      type: 'auto',
      contents: {
        text: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Exa AI search failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    results: data.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.text?.substring(0, 200) || '',
      publishedDate: r.publishedDate,
      score: r.score,
    })),
    provider: 'exa',
  };
}

/**
 * Busca usando Tavily
 */
async function searchWithTavily(query: string, numResults = 5): Promise<SearchResponse> {
  if (!TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY not configured');
  }

  const response = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      api_key: TAVILY_API_KEY,
      query,
      max_results: numResults,
      search_depth: 'basic',
      include_answer: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    results: data.results.map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.content,
      score: r.score,
    })),
    provider: 'tavily',
  };
}

/**
 * Busca usando Serper (Google Search API)
 */
async function searchWithSerper(query: string, numResults = 5): Promise<SearchResponse> {
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY not configured');
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': SERPER_API_KEY,
    },
    body: JSON.stringify({
      q: query,
      num: numResults,
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper search failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    results: (data.organic || []).map((r: any) => ({
      title: r.title,
      url: r.link,
      snippet: r.snippet,
    })),
    provider: 'serper',
  };
}

/**
 * Busca web com fallback automático entre providers
 */
export async function webSearch(
  query: string,
  numResults = 5,
  preferredProvider?: 'exa' | 'tavily' | 'serper'
): Promise<SearchResponse> {
  const providers = ['exa', 'tavily', 'serper'] as const;
  
  // Se tem provider preferido, tenta ele primeiro
  if (preferredProvider) {
    const index = providers.indexOf(preferredProvider);
    if (index > 0) {
      providers.unshift(providers.splice(index, 1)[0]);
    }
  }

  const errors: Error[] = [];

  for (const provider of providers) {
    try {
      switch (provider) {
        case 'exa':
          if (EXA_API_KEY) return await searchWithExa(query, numResults);
          break;
        case 'tavily':
          if (TAVILY_API_KEY) return await searchWithTavily(query, numResults);
          break;
        case 'serper':
          if (SERPER_API_KEY) return await searchWithSerper(query, numResults);
          break;
      }
    } catch (error) {
      console.warn(`⚠️  ${provider} search failed:`, error);
      errors.push(error as Error);
    }
  }

  // Se todos falharam
  throw new Error(
    `All search providers failed. Errors: ${errors.map(e => e.message).join(', ')}`
  );
}

/**
 * Verifica quais providers estão configurados
 */
export function getAvailableProviders(): string[] {
  const available = [];
  if (EXA_API_KEY) available.push('exa');
  if (TAVILY_API_KEY) available.push('tavily');
  if (SERPER_API_KEY) available.push('serper');
  return available;
}

