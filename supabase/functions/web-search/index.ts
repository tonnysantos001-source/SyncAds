// ============================================
// WEB SEARCH - Internet Search API
// ============================================
// Busca real na internet usando múltiplas APIs
// Prioridade: Serper → Exa → DuckDuckGo → Brave
// ============================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_utils/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SearchRequest {
  query: string;
  maxResults?: number;
  freshness?: "day" | "week" | "month" | "year";
  country?: string;
  language?: string;
}

interface SearchResult {
  title: string;
  url: string;
  description: string;
  favicon?: string;
  age?: string;
  publishedDate?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      },
    );

    // Verificar autenticação
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      query,
      maxResults = 10,
      freshness,
      country = "BR",
      language = "pt",
    }: SearchRequest = await req.json();

    if (!query || query.trim().length === 0) {
      throw new Error("Query é obrigatória");
    }

    console.log("🔍 Web Search iniciada");
    console.log("📝 Query:", query);
    console.log("👤 User:", user.id);

    // Tentar APIs em ordem de prioridade
    let results: SearchResult[] = [];
    let searchEngine = "";
    let errors: string[] = [];

    // 1. SERPER API (Google Search) - PRIORIDADE MÁXIMA
    try {
      console.log("🎯 Tentando Serper API...");
      results = await searchWithSerper(query, maxResults, country);
      searchEngine = "Serper (Google Search)";
      console.log(`✅ Serper: ${results.length} resultados`);
    } catch (serperError: any) {
      console.error("❌ Serper falhou:", serperError.message);
      errors.push(`Serper: ${serperError.message}`);

      // 2. EXA API (Semantic Search) - SEGUNDA OPÇÃO
      try {
        console.log("🔮 Tentando Exa API...");
        results = await searchWithExa(query, maxResults);
        searchEngine = "Exa (Semantic Search)";
        console.log(`✅ Exa: ${results.length} resultados`);
      } catch (exaError: any) {
        console.error("❌ Exa falhou:", exaError.message);
        errors.push(`Exa: ${exaError.message}`);

        // 3. DUCKDUCKGO (Scraping HTML) - TERCEIRA OPÇÃO
        try {
          console.log("🦆 Tentando DuckDuckGo...");
          results = await searchWithDuckDuckGo(query, maxResults);
          searchEngine = "DuckDuckGo (Scraping)";
          console.log(`✅ DuckDuckGo: ${results.length} resultados`);
        } catch (duckError: any) {
          console.error("❌ DuckDuckGo falhou:", duckError.message);
          errors.push(`DuckDuckGo: ${duckError.message}`);

          // 4. BRAVE SEARCH (Opcional) - ÚLTIMA OPÇÃO
          try {
            console.log("🦁 Tentando Brave Search...");
            results = await searchWithBrave(
              query,
              maxResults,
              freshness,
              country,
            );
            searchEngine = "Brave Search";
            console.log(`✅ Brave: ${results.length} resultados`);
          } catch (braveError: any) {
            console.error("❌ Brave falhou:", braveError.message);
            errors.push(`Brave: ${braveError.message}`);

            // TODAS AS APIs FALHARAM
            return new Response(
              JSON.stringify({
                success: false,
                error: "Todas as APIs de busca falharam",
                message:
                  "Não foi possível realizar a busca. Tente novamente mais tarde.",
                details: errors.join(" | "),
                suggestions: [
                  "Verifique se SERPER_API_KEY está configurado",
                  "Verifique se EXA_API_KEY está configurado",
                  "Configure BRAVE_SEARCH_API_KEY (opcional)",
                ],
              }),
              {
                status: 503,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              },
            );
          }
        }
      }
    }

    // Limitar resultados
    const limitedResults = results.slice(0, maxResults);

    // Registrar métrica
    await supabaseClient.from("AiMetrics").insert({
      userId: user.id,
      toolName: "web_search",
      success: true,
      executionTime: Date.now(),
      metadata: {
        query,
        resultsCount: limitedResults.length,
        searchEngine,
      },
    });

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
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("❌ Erro no Web Search:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack?.split("\n").slice(0, 5).join("\n"),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// ============================================================================
// SERPER API (Google Search) - MELHOR OPÇÃO
// ============================================================================
async function searchWithSerper(
  query: string,
  count: number,
  country: string,
): Promise<SearchResult[]> {
  const SERPER_API_KEY = Deno.env.get("SERPER_API_KEY");

  if (!SERPER_API_KEY) {
    throw new Error("SERPER_API_KEY não configurada");
  }

  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      num: count,
      gl: country.toLowerCase(),
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Serper API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Converter formato Serper para formato padrão
  const results: SearchResult[] = [];

  // Resultados orgânicos
  if (data.organic && Array.isArray(data.organic)) {
    data.organic.forEach((result: any) => {
      results.push({
        title: result.title || "",
        url: result.link || "",
        description: result.snippet || "",
        publishedDate: result.date || null,
      });
    });
  }

  // Knowledge Graph (se disponível)
  if (data.knowledgeGraph && results.length < count) {
    results.push({
      title: data.knowledgeGraph.title || "",
      url: data.knowledgeGraph.website || "",
      description: data.knowledgeGraph.description || "",
    });
  }

  return results.slice(0, count);
}

// ============================================================================
// EXA API (Semantic Search) - SEGUNDA OPÇÃO
// ============================================================================
async function searchWithExa(
  query: string,
  count: number,
): Promise<SearchResult[]> {
  const EXA_API_KEY = Deno.env.get("EXA_API_KEY");

  if (!EXA_API_KEY) {
    throw new Error("EXA_API_KEY não configurada");
  }

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": EXA_API_KEY,
    },
    body: JSON.stringify({
      query,
      numResults: count,
      type: "auto",
      contents: {
        text: true,
        highlights: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Exa API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Converter formato Exa para formato padrão
  const results: SearchResult[] = (data.results || []).map((result: any) => ({
    title: result.title || "",
    url: result.url || "",
    description: result.text || result.highlights?.[0] || "",
    publishedDate: result.publishedDate || null,
  }));

  return results;
}

// ============================================================================
// BRAVE SEARCH API (Opcional)
// ============================================================================
async function searchWithBrave(
  query: string,
  count: number,
  freshness?: string,
  country?: string,
): Promise<SearchResult[]> {
  const BRAVE_API_KEY = Deno.env.get("BRAVE_SEARCH_API_KEY");

  if (!BRAVE_API_KEY) {
    throw new Error("BRAVE_SEARCH_API_KEY não configurada");
  }

  let url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`;

  if (freshness) {
    url += `&freshness=${freshness}`;
  }

  if (country) {
    url += `&country=${country}`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": BRAVE_API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Brave API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // Converter formato Brave para formato padrão
  const results: SearchResult[] = (data.web?.results || []).map(
    (result: any) => ({
      title: result.title || "",
      url: result.url || "",
      description: result.description || "",
      favicon: result.profile?.img || null,
      age: result.age || null,
    }),
  );

  return results;
}

// ============================================================================
// DUCKDUCKGO (Fallback - Scraping HTML)
// ============================================================================
async function searchWithDuckDuckGo(
  query: string,
  count: number,
): Promise<SearchResult[]> {
  console.log("🦆 Tentando DuckDuckGo...");

  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
    },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo error: ${response.status}`);
  }

  const html = await response.text();

  // Extrair resultados do HTML
  const results: SearchResult[] = [];

  // Regex melhorado para extrair resultados
  const resultPattern =
    /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([^<]+)<\/a>/gi;

  let match;
  while (
    (match = resultPattern.exec(html)) !== null &&
    results.length < count
  ) {
    try {
      // Decodificar URL do DuckDuckGo
      let resultUrl = match[1];
      if (resultUrl.includes("//duckduckgo.com/l/?uddg=")) {
        resultUrl = decodeURIComponent(
          resultUrl.split("uddg=")[1].split("&")[0],
        );
      }

      const title = decodeHtmlEntities(match[2].trim());
      const description = decodeHtmlEntities(match[3].trim());

      if (resultUrl.startsWith("http")) {
        results.push({
          title,
          url: resultUrl,
          description,
        });
      }
    } catch (e) {
      console.error("Erro ao processar resultado DuckDuckGo:", e);
    }
  }

  if (results.length === 0) {
    throw new Error("Nenhum resultado encontrado no DuckDuckGo");
  }

  return results;
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&nbsp;": " ",
    "&#x27;": "'",
    "&#x2F;": "/",
  };

  return text.replace(/&[#\w]+;/g, (match) => entities[match] || match);
}
