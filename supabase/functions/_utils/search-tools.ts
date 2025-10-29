// ============================================
// SEARCH TOOLS - Pesquisas Específicas
// ============================================
// YouTube, Google, Bing, News usando Serper API
// ============================================

const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position?: number;
  thumbnail?: string;
  date?: string;
}

/**
 * Pesquisa no Google
 */
export async function searchGoogle(query: string, numResults = 10): Promise<SearchResult[]> {
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY não configurado');
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: numResults,
      gl: 'br', // Brasil
      hl: 'pt', // Português
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na pesquisa Google: ${response.statusText}`);
  }

  const data = await response.json();

  return (data.organic || []).map((item: any, index: number) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    position: index + 1,
  }));
}

/**
 * Pesquisa no YouTube
 */
export async function searchYouTube(query: string, numResults = 10): Promise<SearchResult[]> {
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY não configurado');
  }

  const response = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: `${query} site:youtube.com`,
      num: numResults,
      gl: 'br',
      hl: 'pt',
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na pesquisa YouTube: ${response.statusText}`);
  }

  const data = await response.json();

  return (data.organic || []).map((item: any, index: number) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    position: index + 1,
    thumbnail: extractYouTubeThumbnail(item.link),
  }));
}

/**
 * Pesquisa de Notícias
 */
export async function searchNews(query: string, numResults = 10): Promise<SearchResult[]> {
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY não configurado');
  }

  const response = await fetch('https://google.serper.dev/news', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: numResults,
      gl: 'br',
      hl: 'pt',
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na pesquisa de notícias: ${response.statusText}`);
  }

  const data = await response.json();

  return (data.news || []).map((item: any, index: number) => ({
    title: item.title,
    link: item.link,
    snippet: item.snippet,
    position: index + 1,
    date: item.date,
  }));
}

/**
 * Pesquisa de Imagens
 */
export async function searchImages(query: string, numResults = 10): Promise<SearchResult[]> {
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY não configurado');
  }

  const response = await fetch('https://google.serper.dev/images', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: numResults,
      gl: 'br',
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na pesquisa de imagens: ${response.statusText}`);
  }

  const data = await response.json();

  return (data.images || []).map((item: any, index: number) => ({
    title: item.title,
    link: item.link,
    snippet: item.source,
    position: index + 1,
    thumbnail: item.imageUrl,
  }));
}

/**
 * Pesquisa Shopping (produtos)
 */
export async function searchShopping(query: string, numResults = 10): Promise<any[]> {
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY não configurado');
  }

  const response = await fetch('https://google.serper.dev/shopping', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: numResults,
      gl: 'br',
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na pesquisa shopping: ${response.statusText}`);
  }

  const data = await response.json();

  return (data.shopping || []).map((item: any, index: number) => ({
    title: item.title,
    link: item.link,
    price: item.price,
    rating: item.rating,
    reviews: item.reviews,
    source: item.source,
    position: index + 1,
    thumbnail: item.imageUrl,
  }));
}

/**
 * Pesquisa Local (places)
 */
export async function searchPlaces(query: string, numResults = 10): Promise<any[]> {
  if (!SERPER_API_KEY) {
    throw new Error('SERPER_API_KEY não configurado');
  }

  const response = await fetch('https://google.serper.dev/places', {
    method: 'POST',
    headers: {
      'X-API-KEY': SERPER_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      q: query,
      num: numResults,
      gl: 'br',
    }),
  });

  if (!response.ok) {
    throw new Error(`Erro na pesquisa local: ${response.statusText}`);
  }

  const data = await response.json();

  return (data.places || []).map((item: any, index: number) => ({
    title: item.title,
    address: item.address,
    phone: item.phoneNumber,
    rating: item.rating,
    reviews: item.reviews,
    position: index + 1,
  }));
}

/**
 * Extrai thumbnail do YouTube
 */
function extractYouTubeThumbnail(url: string): string {
  const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
  if (videoIdMatch) {
    return `https://img.youtube.com/vi/${videoIdMatch[1]}/hqdefault.jpg`;
  }
  return '';
}

/**
 * Busca tudo (agregado)
 */
export async function searchAll(query: string) {
  const [web, news, images] = await Promise.all([
    searchGoogle(query, 5).catch(() => []),
    searchNews(query, 3).catch(() => []),
    searchImages(query, 3).catch(() => []),
  ]);

  return {
    web,
    news,
    images,
    query,
    timestamp: new Date().toISOString(),
  };
}

