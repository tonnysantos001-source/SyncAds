import { supabase } from "../supabase";

// =====================================================
// CACHE DE RESULTADOS
// =====================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number; // em milissegundos
}

class SearchCache {
  private cache: Map<string, CacheEntry<any>>;

  constructor() {
    this.cache = new Map();
  }

  set<T>(key: string, data: T, expiresIn: number = 3600000): void {
    // 1 hora padrão
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

const searchCache = new SearchCache();

// =====================================================
// DETECÇÃO DE INTENÇÕES AVANÇADAS
// =====================================================

export interface AdvancedIntent {
  type:
    | "generate-image"
    | "generate-video"
    | "web-search"
    | "create-file"
    | "scrape-python"
    | "generate-pdf"
    | "process-image"
    | "none";
  confidence: number;
  params: Record<string, any>;
}

export function detectAdvancedIntent(message: string): AdvancedIntent {
  const lowerMessage = message.toLowerCase();

  // Detecção de scraping Python
  if (
    (lowerMessage.includes("scrape") ||
      lowerMessage.includes("extrair dados") ||
      lowerMessage.includes("raspar") ||
      (lowerMessage.includes("dados") && lowerMessage.includes("site"))) &&
    (lowerMessage.includes("http") || lowerMessage.includes("www"))
  ) {
    return {
      type: "scrape-python",
      confidence: 0.9,
      params: { url: message },
    };
  }

  // Detecção de geração de PDF
  if (
    (lowerMessage.includes("gere") ||
      lowerMessage.includes("crie") ||
      lowerMessage.includes("faça")) &&
    (lowerMessage.includes("pdf") ||
      lowerMessage.includes("relatório") ||
      lowerMessage.includes("relatorio") ||
      lowerMessage.includes("documento"))
  ) {
    return {
      type: "generate-pdf",
      confidence: 0.9,
      params: { content: message },
    };
  }

  // Detecção de processamento de imagem
  if (
    (lowerMessage.includes("otimiz") ||
      lowerMessage.includes("redimensione") ||
      lowerMessage.includes("filtro") ||
      lowerMessage.includes("remova") ||
      lowerMessage.includes("marca d'agua") ||
      lowerMessage.includes("marca dagua") ||
      lowerMessage.includes("watermark") ||
      lowerMessage.includes("processar")) &&
    lowerMessage.includes("imagem")
  ) {
    return {
      type: "process-image",
      confidence: 0.85,
      params: { operation: "optimize" },
    };
  }

  // Detecção de geração de imagem
  if (
    (lowerMessage.includes("gere") || lowerMessage.includes("crie")) &&
    lowerMessage.includes("imagem")
  ) {
    return {
      type: "generate-image",
      confidence: 0.9,
      params: { prompt: message },
    };
  }

  // Detecção de geração de vídeo
  if (
    (lowerMessage.includes("gere") || lowerMessage.includes("crie")) &&
    (lowerMessage.includes("vídeo") || lowerMessage.includes("video"))
  ) {
    return {
      type: "generate-video",
      confidence: 0.9,
      params: { prompt: message },
    };
  }

  // Detecção de pesquisa web
  if (
    lowerMessage.includes("pesquis") ||
    lowerMessage.includes("busca") ||
    lowerMessage.includes("google") ||
    lowerMessage.includes("procure") ||
    lowerMessage.includes("encontre")
  ) {
    return {
      type: "web-search",
      confidence: 0.85,
      params: { query: message },
    };
  }

  // Detecção de criação de arquivo
  if (
    lowerMessage.includes("crie") &&
    (lowerMessage.includes("arquivo") ||
      lowerMessage.includes("documento") ||
      lowerMessage.includes("file"))
  ) {
    return {
      type: "create-file",
      confidence: 0.8,
      params: { content: message },
    };
  }

  return {
    type: "none",
    confidence: 0,
    params: {},
  };
}

// =====================================================
// GERAÇÃO DE IMAGENS (DALL-E 3)
// =====================================================

export interface ImageGenerationOptions {
  prompt: string;
  size?: "256x256" | "512x512" | "1024x1024" | "1792x1024" | "1024x1792";
  style?: "vivid" | "natural";
  quality?: "standard" | "hd";
  model?: "dall-e-2" | "dall-e-3";
  userId: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imageUrl?: string;
  downloadUrl?: string;
  error?: string;
  metadata?: {
    prompt: string;
    size: string;
    model: string;
    generatedAt: string;
  };
}

export async function generateImage(
  options: ImageGenerationOptions,
): Promise<ImageGenerationResult> {
  try {
    // Buscar configuração da API
    const { data: config, error: configError } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("userId", options.userId)
      .eq("isActive", true)
      .single();

    if (configError || !config) {
      return {
        success: false,
        error:
          "Configuração de IA não encontrada. Configure em Configurações > IA Global.",
      };
    }

    const openaiKey = config.apiKey;

    if (!openaiKey) {
      return {
        success: false,
        error: "API Key da OpenAI não configurada.",
      };
    }

    console.log("🎨 Gerando imagem com DALL-E 3...");

    // Gerar imagem usando DALL-E
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: options.model || "dall-e-3",
          prompt: options.prompt,
          n: 1,
          size: options.size || "1024x1024",
          quality: options.quality || "standard",
          style: options.style || "vivid",
        }),
      },
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || "Erro ao gerar imagem",
      };
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;

    if (!imageUrl) {
      return {
        success: false,
        error: "Nenhuma imagem foi gerada",
      };
    }

    console.log("✅ Imagem gerada, fazendo upload...");

    // Fazer upload da imagem para o Supabase Storage
    try {
      const imageBlob = await fetch(imageUrl).then((r) => r.blob());
      const fileName = `images/${options.userId}/${Date.now()}.png`;

      const { error: uploadError } = await supabase.storage
        .from("ai-generated")
        .upload(fileName, imageBlob, {
          contentType: "image/png",
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.warn("Erro ao fazer upload:", uploadError);
        // Retornar URL original se upload falhar
        return {
          success: true,
          imageUrl,
          downloadUrl: imageUrl,
          metadata: {
            prompt: options.prompt,
            size: options.size || "1024x1024",
            model: options.model || "dall-e-3",
            generatedAt: new Date().toISOString(),
          },
        };
      }

      // Obter URL pública
      const { data: publicUrl } = supabase.storage
        .from("ai-generated")
        .getPublicUrl(fileName);

      console.log("✅ Upload concluído!");

      return {
        success: true,
        imageUrl: publicUrl.publicUrl,
        downloadUrl: publicUrl.publicUrl,
        metadata: {
          prompt: options.prompt,
          size: options.size || "1024x1024",
          model: options.model || "dall-e-3",
          generatedAt: new Date().toISOString(),
        },
      };
    } catch (uploadError: any) {
      console.warn("Erro no processo de upload:", uploadError);
      // Fallback para URL original
      return {
        success: true,
        imageUrl,
        downloadUrl: imageUrl,
        metadata: {
          prompt: options.prompt,
          size: options.size || "1024x1024",
          model: options.model || "dall-e-3",
          generatedAt: new Date().toISOString(),
        },
      };
    }
  } catch (error: any) {
    console.error("Erro ao gerar imagem:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido ao gerar imagem",
    };
  }
}

// =====================================================
// PESQUISA NA INTERNET (SERPER.DEV)
// =====================================================

export interface WebSearchOptions {
  query: string;
  maxResults?: number;
  userId: string;
}

export interface WebSearchResult {
  success: boolean;
  results?: Array<{
    title: string;
    url: string;
    snippet: string;
    favicon?: string;
    position?: number;
    date?: string;
  }>;
  summary?: string;
  error?: string;
  metadata?: {
    source: string;
    query: string;
    totalResults?: number;
    searchTime?: number;
    timestamp: string;
    fromCache: boolean;
  };
}

export async function searchWeb(
  options: WebSearchOptions,
): Promise<WebSearchResult> {
  try {
    // Verificar cache primeiro
    const cacheKey = `search:${options.query}:${options.maxResults || 5}`;
    const cachedResult = searchCache.get<WebSearchResult>(cacheKey);

    if (cachedResult) {
      console.log("✅ Resultado do cache:", options.query);
      return {
        ...cachedResult,
        metadata: {
          ...cachedResult.metadata!,
          fromCache: true,
          timestamp: new Date().toISOString(),
        },
      };
    }

    const { data: config } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("userId", options.userId)
      .eq("isActive", true)
      .single();

    // Tentar usar Serper.dev primeiro
    const serperKey =
      process.env.VITE_SERPER_API_KEY ||
      "8e0f0a8c8f4c79aa5e51e7c3b9d6ac9f38dfe4e4";

    if (serperKey && serperKey.length > 20) {
      try {
        console.log("🔍 Pesquisando com Serper.dev...");

        // Usar Serper.dev para busca real
        const serperResponse = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "X-API-KEY": serperKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: options.query,
            num: options.maxResults || 5,
            gl: "br", // Brazil
            hl: "pt", // Portuguese
          }),
        });

        if (serperResponse.ok) {
          const serperData = await serperResponse.json();

          console.log("✅ Resultados obtidos do Serper.dev");

          // Processar resultados do Serper
          const results = (serperData.organic || [])
            .slice(0, options.maxResults || 5)
            .map((item: any, index: number) => {
              let favicon = "";
              try {
                const domain = new URL(item.link).hostname;
                favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
              } catch (e) {
                favicon = "";
              }

              return {
                title: item.title || "",
                url: item.link || "",
                snippet: item.snippet || "",
                favicon,
                position: index + 1,
                date: item.date || null,
              };
            });

          // Gerar resumo com IA se tiver OpenAI configurada
          let summary = "";
          if (config?.apiKey && results.length > 0) {
            try {
              console.log("📝 Gerando resumo com IA...");

              const summaryResponse = await fetch(
                "https://api.openai.com/v1/chat/completions",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${config.apiKey}`,
                  },
                  body: JSON.stringify({
                    model: "gpt-4o-mini",
                    messages: [
                      {
                        role: "system",
                        content:
                          "Você é um assistente que resume resultados de pesquisa de forma concisa e útil em português. Seja objetivo e direto.",
                      },
                      {
                        role: "user",
                        content: `Resuma estes resultados de pesquisa sobre "${options.query}":\n\n${results.map((r: any, i: number) => `${i + 1}. ${r.title}\n   ${r.snippet}`).join("\n\n")}`,
                      },
                    ],
                    temperature: 0.7,
                    max_tokens: 300,
                  }),
                },
              );

              if (summaryResponse.ok) {
                const summaryData = await summaryResponse.json();
                summary = summaryData.choices[0]?.message?.content || "";
                console.log("✅ Resumo gerado!");
              }
            } catch (summaryError) {
              console.warn("⚠️ Erro ao gerar resumo:", summaryError);
            }
          }

          const finalResult: WebSearchResult = {
            success: true,
            results,
            summary,
            metadata: {
              source: "serper.dev",
              query: options.query,
              totalResults: serperData.searchInformation?.totalResults || 0,
              searchTime: serperData.searchInformation?.time || 0,
              timestamp: new Date().toISOString(),
              fromCache: false,
            },
          };

          // Salvar no cache (1 hora)
          searchCache.set(cacheKey, finalResult, 3600000);

          return finalResult;
        } else {
          console.warn("⚠️ Serper.dev retornou erro:", serperResponse.status);
        }
      } catch (serperError) {
        console.warn(
          "⚠️ Erro ao usar Serper.dev, tentando fallback:",
          serperError,
        );
      }
    }

    // Fallback: usar OpenAI para simular pesquisa
    if (config?.apiKey) {
      console.log("🔄 Usando fallback OpenAI...");

      const searchQuery = encodeURIComponent(options.query);

      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content:
                  "Você é um assistente que fornece informações atualizadas sobre qualquer tema. Seja conciso, factual e cite fontes quando possível.",
              },
              {
                role: "user",
                content: `Forneça informações atualizadas sobre: "${options.query}". Seja específico e útil.`,
              },
            ],
            temperature: 0.7,
            max_tokens: 500,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const summary = data.choices[0]?.message?.content || "";

        const fallbackResult: WebSearchResult = {
          success: true,
          results: [
            {
              title: `Informações sobre: ${options.query}`,
              url: `https://www.google.com/search?q=${searchQuery}`,
              snippet: summary.substring(0, 200) + "...",
              favicon: "https://www.google.com/favicon.ico",
              position: 1,
            },
          ],
          summary,
          metadata: {
            source: "openai-fallback",
            query: options.query,
            timestamp: new Date().toISOString(),
            fromCache: false,
          },
        };

        // Salvar no cache (30 minutos para fallback)
        searchCache.set(cacheKey, fallbackResult, 1800000);

        return fallbackResult;
      }
    }

    return {
      success: false,
      error:
        "Nenhuma API de pesquisa configurada. Configure Serper.dev ou OpenAI em Configurações.",
    };
  } catch (error: any) {
    console.error("❌ Erro ao pesquisar na web:", error);
    return {
      success: false,
      error: error.message || "Erro ao pesquisar na web",
    };
  }
}

// =====================================================
// CRIAÇÃO DE ARQUIVOS PARA DOWNLOAD
// =====================================================

export interface FileGenerationOptions {
  content: string;
  fileName: string;
  fileType:
    | "txt"
    | "md"
    | "json"
    | "csv"
    | "html"
    | "js"
    | "ts"
    | "css"
    | "xml";
  userId: string;
  metadata?: Record<string, any>;
}

export interface FileGenerationResult {
  success: boolean;
  downloadUrl?: string;
  fileName?: string;
  fileSize?: number;
  error?: string;
}

export async function generateDownloadableFile(
  options: FileGenerationOptions,
): Promise<FileGenerationResult> {
  try {
    // Criar blob do arquivo
    const blob = new Blob([options.content], {
      type: getContentType(options.fileType),
    });

    const fileName = `files/${options.userId}/${Date.now()}_${options.fileName}`;

    // Upload para Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("ai-generated")
      .upload(fileName, blob, {
        contentType: getContentType(options.fileType),
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Erro ao fazer upload do arquivo:", uploadError);
      return {
        success: false,
        error: uploadError.message,
      };
    }

    // Obter URL pública temporária (expira em 1 hora)
    const { data: signedUrl } = await supabase.storage
      .from("ai-generated")
      .createSignedUrl(fileName, 3600);

    if (!signedUrl) {
      return {
        success: false,
        error: "Erro ao gerar URL de download",
      };
    }

    return {
      success: true,
      downloadUrl: signedUrl.signedUrl,
      fileName: options.fileName,
      fileSize: blob.size,
    };
  } catch (error: any) {
    console.error("Erro ao gerar arquivo:", error);
    return {
      success: false,
      error: error.message || "Erro ao gerar arquivo",
    };
  }
}

function getContentType(fileType: string): string {
  const types: Record<string, string> = {
    txt: "text/plain",
    md: "text/markdown",
    json: "application/json",
    csv: "text/csv",
    html: "text/html",
    js: "application/javascript",
    ts: "application/typescript",
    css: "text/css",
    xml: "application/xml",
  };

  return types[fileType] || "text/plain";
}

// =====================================================
// GERAÇÃO DE VÍDEOS (RUNWAY/PIKA LABS)
// =====================================================

export interface VideoGenerationOptions {
  prompt: string;
  duration?: number; // em segundos (5, 10, 15)
  aspectRatio?: "16:9" | "9:16" | "1:1";
  style?: "realistic" | "cinematic" | "anime" | "3d";
  provider?: "runway" | "pika";
  userId: string;
  onProgress?: (status: string, progress: number) => void;
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  thumbnailUrl?: string;
  downloadUrl?: string;
  error?: string;
  metadata?: {
    prompt: string;
    duration: number;
    aspectRatio: string;
    provider: string;
    generatedAt: string;
    status?: "pending" | "processing" | "completed" | "failed";
    jobId?: string;
  };
}

export async function generateVideo(
  options: VideoGenerationOptions,
): Promise<VideoGenerationResult> {
  try {
    console.log("🎬 Iniciando geração de vídeo...");

    // Buscar configuração da API
    const { data: config, error: configError } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("userId", options.userId)
      .eq("isActive", true)
      .single();

    if (configError || !config) {
      return {
        success: false,
        error:
          "Configuração de IA não encontrada. Configure em Configurações > IA Global.",
      };
    }

    // Determinar provider
    const provider = options.provider || "runway";
    const runwayKey =
      process.env.VITE_RUNWAY_API_KEY || (config as any)?.runwayKey;
    const pikaKey = process.env.VITE_PIKA_API_KEY || (config as any)?.pikaKey;

    if (provider === "runway" && runwayKey) {
      return await generateVideoWithRunway(
        options,
        runwayKey,
        config.apiKey || "",
      );
    } else if (provider === "pika" && pikaKey) {
      return await generateVideoWithPika(options, pikaKey, config.apiKey || "");
    } else {
      // Fallback: Gerar vídeo placeholder com imagem estática
      return await generateVideoPlaceholder(options);
    }
  } catch (error: any) {
    console.error("❌ Erro ao gerar vídeo:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido ao gerar vídeo",
    };
  }
}

/**
 * Gerar vídeo com Runway Gen-2
 */
async function generateVideoWithRunway(
  options: VideoGenerationOptions,
  apiKey: string,
  openaiKey: string,
): Promise<VideoGenerationResult> {
  try {
    console.log("🎬 Usando Runway Gen-2...");

    if (options.onProgress) {
      options.onProgress("🎨 Otimizando prompt para vídeo...", 10);
    }

    // Otimizar prompt para vídeo
    const optimizedPrompt = await optimizeVideoPrompt(
      options.prompt,
      openaiKey,
    );

    if (options.onProgress) {
      options.onProgress("🎬 Enviando para Runway Gen-2...", 30);
    }

    // Criar tarefa de geração no Runway
    const createResponse = await fetch(
      "https://api.runwayml.com/v1/generations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          prompt: optimizedPrompt,
          duration: options.duration || 5,
          aspect_ratio: options.aspectRatio || "16:9",
          model: "gen2",
        }),
      },
    );

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.message || "Erro ao criar vídeo no Runway");
    }

    const createData = await createResponse.json();
    const jobId = createData.id;

    if (options.onProgress) {
      options.onProgress(
        "⏳ Gerando vídeo (isso pode levar 1-2 minutos)...",
        50,
      );
    }

    // Polling para verificar status
    const videoUrl = await pollRunwayJob(jobId, apiKey, options.onProgress);

    if (options.onProgress) {
      options.onProgress("📤 Fazendo upload do vídeo...", 80);
    }

    // Upload para Supabase Storage
    const uploadedUrl = await uploadVideoToStorage(
      videoUrl,
      options.userId,
      "runway",
    );

    if (options.onProgress) {
      options.onProgress("✅ Vídeo gerado com sucesso!", 100);
    }

    return {
      success: true,
      videoUrl: uploadedUrl || videoUrl,
      downloadUrl: uploadedUrl || videoUrl,
      metadata: {
        prompt: optimizedPrompt,
        duration: options.duration || 5,
        aspectRatio: options.aspectRatio || "16:9",
        provider: "runway",
        generatedAt: new Date().toISOString(),
        status: "completed",
        jobId,
      },
    };
  } catch (error: any) {
    console.error("❌ Erro no Runway:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Gerar vídeo com Pika Labs
 */
async function generateVideoWithPika(
  options: VideoGenerationOptions,
  apiKey: string,
  openaiKey: string,
): Promise<VideoGenerationResult> {
  try {
    console.log("🎬 Usando Pika Labs...");

    if (options.onProgress) {
      options.onProgress("🎨 Otimizando prompt para vídeo...", 10);
    }

    const optimizedPrompt = await optimizeVideoPrompt(
      options.prompt,
      openaiKey,
    );

    if (options.onProgress) {
      options.onProgress("🎬 Enviando para Pika Labs...", 30);
    }

    // Criar tarefa de geração no Pika
    const createResponse = await fetch("https://api.pika.art/v1/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt: optimizedPrompt,
        parameters: {
          duration: options.duration || 3,
          aspect_ratio: options.aspectRatio || "16:9",
          motion: 2, // Movimento médio
          style: options.style || "realistic",
        },
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(error.message || "Erro ao criar vídeo no Pika");
    }

    const createData = await createResponse.json();
    const jobId = createData.job_id;

    if (options.onProgress) {
      options.onProgress(
        "⏳ Gerando vídeo (isso pode levar 1-2 minutos)...",
        50,
      );
    }

    // Polling para verificar status
    const videoUrl = await pollPikaJob(jobId, apiKey, options.onProgress);

    if (options.onProgress) {
      options.onProgress("📤 Fazendo upload do vídeo...", 80);
    }

    // Upload para Supabase Storage
    const uploadedUrl = await uploadVideoToStorage(
      videoUrl,
      options.userId,
      "pika",
    );

    if (options.onProgress) {
      options.onProgress("✅ Vídeo gerado com sucesso!", 100);
    }

    return {
      success: true,
      videoUrl: uploadedUrl || videoUrl,
      downloadUrl: uploadedUrl || videoUrl,
      metadata: {
        prompt: optimizedPrompt,
        duration: options.duration || 3,
        aspectRatio: options.aspectRatio || "16:9",
        provider: "pika",
        generatedAt: new Date().toISOString(),
        status: "completed",
        jobId,
      },
    };
  } catch (error: any) {
    console.error("❌ Erro no Pika Labs:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Gerar vídeo placeholder (fallback)
 */
async function generateVideoPlaceholder(
  options: VideoGenerationOptions,
): Promise<VideoGenerationResult> {
  console.log("📹 Gerando placeholder de vídeo...");

  return {
    success: false,
    error:
      "🎬 **Geração de Vídeos - Em Configuração**\n\n" +
      "Para ativar esta funcionalidade, você precisa:\n\n" +
      "1. **Runway Gen-2**: Configure `VITE_RUNWAY_API_KEY` em .env\n" +
      "   - Obtenha em: https://runwayml.com\n" +
      "   - Plano recomendado: Standard ($12/vídeo)\n\n" +
      "2. **Pika Labs**: Configure `VITE_PIKA_API_KEY` em .env\n" +
      "   - Obtenha em: https://pika.art\n" +
      "   - Plano recomendado: Pro ($10/mês)\n\n" +
      `Prompt salvo: "${options.prompt}"\n\n` +
      "_Após configurar, esta funcionalidade estará disponível!_",
    metadata: {
      prompt: options.prompt,
      duration: options.duration || 5,
      aspectRatio: options.aspectRatio || "16:9",
      provider: "none",
      generatedAt: new Date().toISOString(),
      status: "pending",
    },
  };
}

/**
 * Otimizar prompt para geração de vídeo
 */
async function optimizeVideoPrompt(
  userPrompt: string,
  openaiKey: string,
): Promise<string> {
  if (!openaiKey) return userPrompt;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Você é um especialista em criar prompts para geração de vídeos com IA. Otimize o prompt do usuário para gerar vídeos cinematográficos de alta qualidade. Seja descritivo sobre movimento, iluminação, câmera e atmosfera. Mantenha em inglês.",
          },
          {
            role: "user",
            content: `Otimize este prompt para geração de vídeo: "${userPrompt}"`,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.choices[0]?.message?.content || userPrompt;
    }
  } catch (error) {
    console.warn("⚠️ Erro ao otimizar prompt:", error);
  }

  return userPrompt;
}

/**
 * Polling para verificar status do job no Runway
 */
async function pollRunwayJob(
  jobId: string,
  apiKey: string,
  onProgress?: (status: string, progress: number) => void,
): Promise<string> {
  const maxAttempts = 60; // 5 minutos (5s * 60)
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(
      `https://api.runwayml.com/v1/generations/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      },
    );

    if (response.ok) {
      const data = await response.json();

      if (data.status === "SUCCEEDED" && data.output_url) {
        return data.output_url;
      } else if (data.status === "FAILED") {
        throw new Error("Geração de vídeo falhou no Runway");
      }

      // Atualizar progresso
      const progress = 50 + (attempts / maxAttempts) * 30;
      if (onProgress) {
        onProgress(`⏳ Processando... (${attempts}/${maxAttempts})`, progress);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5 segundos
    attempts++;
  }

  throw new Error("Timeout ao gerar vídeo no Runway");
}

/**
 * Polling para verificar status do job no Pika
 */
async function pollPikaJob(
  jobId: string,
  apiKey: string,
  onProgress?: (status: string, progress: number) => void,
): Promise<string> {
  const maxAttempts = 60;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const response = await fetch(`https://api.pika.art/v1/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (response.ok) {
      const data = await response.json();

      if (data.status === "completed" && data.video_url) {
        return data.video_url;
      } else if (data.status === "failed") {
        throw new Error("Geração de vídeo falhou no Pika Labs");
      }

      const progress = 50 + (attempts / maxAttempts) * 30;
      if (onProgress) {
        onProgress(`⏳ Processando... (${attempts}/${maxAttempts})`, progress);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, 5000));
    attempts++;
  }

  throw new Error("Timeout ao gerar vídeo no Pika Labs");
}

/**
 * Upload de vídeo para Supabase Storage
 */
async function uploadVideoToStorage(
  videoUrl: string,
  userId: string,
  provider: string,
): Promise<string | null> {
  try {
    console.log("📤 Fazendo upload do vídeo...");

    // Download do vídeo
    const videoBlob = await fetch(videoUrl).then((r) => r.blob());
    const fileName = `videos/${userId}/${provider}_${Date.now()}.mp4`;

    // Upload para o Supabase
    const { error: uploadError } = await supabase.storage
      .from("ai-generated")
      .upload(fileName, videoBlob, {
        contentType: "video/mp4",
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.warn("⚠️ Erro ao fazer upload:", uploadError);
      return null;
    }

    // Obter URL pública
    const { data: publicUrl } = supabase.storage
      .from("ai-generated")
      .getPublicUrl(fileName);

    console.log("✅ Upload concluído!");
    return publicUrl.publicUrl;
  } catch (error) {
    console.warn("⚠️ Erro no upload:", error);
    return null;
  }
}

// =====================================================
// EXPORTAÇÕES
// =====================================================

export { searchCache };
