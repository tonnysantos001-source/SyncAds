import { supabase } from '../supabase';

// =====================================================
// CONFIGURAÇÕES DE APIs
// =====================================================

interface ApiConfig {
  openai?: {
    apiKey: string;
    model: string;
  };
  claude?: {
    apiKey: string;
    model: string;
  };
  stability?: {
    apiKey: string;
  };
}

// =====================================================
// GERAÇÃO DE IMAGENS
// =====================================================

export interface ImageGenerationOptions {
  prompt: string;
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  style?: 'vivid' | 'natural';
  quality?: 'standard' | 'hd';
  model?: 'dall-e-2' | 'dall-e-3';
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
  options: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  try {
    // Buscar configuração da API
    const { data: config, error: configError } = await supabase
      .from('GlobalAiConnection')
      .select('*')
      .eq('userId', options.userId)
      .eq('isActive', true)
      .single();

    if (configError || !config) {
      return {
        success: false,
        error: 'Configuração de IA não encontrada. Configure em Configurações > IA Global.',
      };
    }

    const openaiKey = config.openaiKey || config.apiKey;

    if (!openaiKey) {
      return {
        success: false,
        error: 'API Key da OpenAI não configurada.',
      };
    }

    // Gerar imagem usando DALL-E
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'dall-e-3',
        prompt: options.prompt,
        n: 1,
        size: options.size || '1024x1024',
        quality: options.quality || 'standard',
        style: options.style || 'vivid',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error?.message || 'Erro ao gerar imagem',
      };
    }

    const data = await response.json();
    const imageUrl = data.data[0]?.url;

    if (!imageUrl) {
      return {
        success: false,
        error: 'Nenhuma imagem foi gerada',
      };
    }

    // Fazer upload da imagem para o Supabase Storage
    const imageBlob = await fetch(imageUrl).then(r => r.blob());
    const fileName = `images/${options.userId}/${Date.now()}.png`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('ai-generated')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError);
      // Retornar URL original se upload falhar
      return {
        success: true,
        imageUrl,
        downloadUrl: imageUrl,
        metadata: {
          prompt: options.prompt,
          size: options.size || '1024x1024',
          model: options.model || 'dall-e-3',
          generatedAt: new Date().toISOString(),
        },
      };
    }

    // Obter URL pública
    const { data: publicUrl } = supabase.storage
      .from('ai-generated')
      .getPublicUrl(fileName);

    return {
      success: true,
      imageUrl: publicUrl.publicUrl,
      downloadUrl: publicUrl.publicUrl,
      metadata: {
        prompt: options.prompt,
        size: options.size || '1024x1024',
        model: options.model || 'dall-e-3',
        generatedAt: new Date().toISOString(),
      },
    };

  } catch (error: any) {
    console.error('Erro ao gerar imagem:', error);
    return {
      success: false,
      error: error.message || 'Erro desconhecido ao gerar imagem',
    };
  }
}

// =====================================================
// PESQUISA NA INTERNET
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
  }>;
  summary?: string;
  error?: string;
}

export async function searchWeb(
  options: WebSearchOptions
): Promise<WebSearchResult> {
  try {
    // Usar Brave Search API ou similar
    // Por enquanto, vamos usar uma implementação simplificada

    const { data: config } = await supabase
      .from('GlobalAiConnection')
      .select('*')
      .eq('userId', options.userId)
      .eq('isActive', true)
      .single();

    if (!config?.openaiKey) {
      return {
        success: false,
        error: 'API Key não configurada',
      };
    }

    // Simular busca na web (em produção, usar API real como Brave Search, Serper, etc.)
    const searchQuery = encodeURIComponent(options.query);

    // Usar OpenAI para resumir resultados
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.openaiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente que pesquisa informações na web e retorna resultados relevantes em português.',
          },
          {
            role: 'user',
            content: `Pesquise informações sobre: "${options.query}". Forneça um resumo com as informações mais relevantes.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    const summary = data.choices[0]?.message?.content || '';

    return {
      success: true,
      results: [
        {
          title: `Resultados para: ${options.query}`,
          url: `https://www.google.com/search?q=${searchQuery}`,
          snippet: summary,
        },
      ],
      summary,
    };

  } catch (error: any) {
    console.error('Erro ao pesquisar na web:', error);
    return {
      success: false,
      error: error.message || 'Erro ao pesquisar na web',
    };
  }
}

// =====================================================
// CRIAÇÃO DE ARQUIVOS PARA DOWNLOAD
// =====================================================

export interface FileGenerationOptions {
  content: string;
  fileName: string;
  fileType: 'txt' | 'md' | 'json' | 'csv' | 'html' | 'js' | 'ts' | 'css' | 'xml';
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
  options: FileGenerationOptions
): Promise<FileGenerationResult> {
  try {
    const mimeTypes: Record<string, string> = {
      txt: 'text/plain',
      md: 'text/markdown',
      json: 'application/json',
      csv: 'text/csv',
      html: 'text/html',
      js: 'application/javascript',
      ts: 'application/typescript',
      css: 'text/css',
      xml: 'application/xml',
    };

    const contentType = mimeTypes[options.fileType] || 'text/plain';
    const blob = new Blob([options.content], { type: contentType });

    const fileName = `files/${options.userId}/${Date.now()}_${options.fileName}`;

    // Upload para Supabase Storage
    const { data, error } = await supabase.storage
      .from('ai-generated')
      .upload(fileName, blob, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar arquivo',
      };
    }

    // Obter URL pública com tempo de expiração
    const { data: signedUrl, error: signedError } = await supabase.storage
      .from('ai-generated')
      .createSignedUrl(fileName, 3600); // 1 hora

    if (signedError || !signedUrl) {
      return {
        success: false,
        error: 'Erro ao gerar URL de download',
      };
    }

    return {
      success: true,
      downloadUrl: signedUrl.signedUrl,
      fileName: options.fileName,
      fileSize: blob.size,
    };

  } catch (error: any) {
    console.error('Erro ao gerar arquivo:', error);
    return {
      success: false,
      error: error.message || 'Erro ao gerar arquivo',
    };
  }
}

// =====================================================
// DETECÇÃO DE INTENÇÕES AVANÇADAS
// =====================================================

export interface AdvancedIntent {
  type: 'generate-image' | 'generate-video' | 'web-search' | 'create-file' | 'analyze-data' | 'none';
  confidence: number;
  params?: Record<string, any>;
}

export function detectAdvancedIntent(userMessage: string): AdvancedIntent {
  const message = userMessage.toLowerCase();

  // Geração de imagem
  if (
    message.includes('gerar imagem') ||
    message.includes('criar imagem') ||
    message.includes('desenhar') ||
    message.includes('ilustração') ||
    message.includes('gere uma imagem') ||
    message.includes('crie uma imagem')
  ) {
    // Extrair prompt da mensagem
    const prompt = userMessage
      .replace(/gerar imagem|criar imagem|desenhar|ilustração|gere uma imagem|crie uma imagem/gi, '')
      .replace(/de|do|da|sobre|com/gi, '')
      .trim();

    return {
      type: 'generate-image',
      confidence: 0.9,
      params: { prompt: prompt || userMessage },
    };
  }

  // Pesquisa na web
  if (
    message.includes('pesquisar') ||
    message.includes('buscar') ||
    message.includes('procurar') ||
    message.includes('pesquise') ||
    message.includes('busque') ||
    message.includes('o que é') ||
    message.includes('quem é') ||
    message.includes('quando') ||
    message.includes('onde')
  ) {
    const query = userMessage
      .replace(/pesquisar|buscar|procurar|pesquise|busque|o que é|quem é/gi, '')
      .replace(/na internet|no google|online/gi, '')
      .trim();

    return {
      type: 'web-search',
      confidence: 0.85,
      params: { query: query || userMessage },
    };
  }

  // Criação de arquivo
  if (
    message.includes('criar arquivo') ||
    message.includes('gerar arquivo') ||
    message.includes('salvar em') ||
    message.includes('exportar') ||
    message.includes('download')
  ) {
    return {
      type: 'create-file',
      confidence: 0.8,
      params: {},
    };
  }

  // Análise de dados
  if (
    message.includes('analisar') ||
    message.includes('análise') ||
    message.includes('estatística') ||
    message.includes('métricas') ||
    message.includes('relatório')
  ) {
    return {
      type: 'analyze-data',
      confidence: 0.75,
      params: {},
    };
  }

  return {
    type: 'none',
    confidence: 0,
  };
}

// =====================================================
// FORMATAÇÃO DE RESPOSTAS COM RECURSOS
// =====================================================

export interface EnhancedResponse {
  text: string;
  attachments?: Array<{
    type: 'image' | 'file' | 'link';
    url: string;
    title?: string;
    description?: string;
  }>;
  actions?: Array<{
    label: string;
    action: string;
    data?: any;
  }>;
}

export function formatEnhancedResponse(
  text: string,
  resources?: {
    images?: string[];
    files?: Array<{ url: string; name: string }>;
    links?: Array<{ url: string; title: string }>;
  }
): EnhancedResponse {
  const response: EnhancedResponse = {
    text,
    attachments: [],
    actions: [],
  };

  // Adicionar imagens
  if (resources?.images) {
    resources.images.forEach((url) => {
      response.attachments?.push({
        type: 'image',
        url,
        title: 'Imagem gerada',
      });
    });
  }

  // Adicionar arquivos
  if (resources?.files) {
    resources.files.forEach((file) => {
      response.attachments?.push({
        type: 'file',
        url: file.url,
        title: file.name,
      });

      response.actions?.push({
        label: `Baixar ${file.name}`,
        action: 'download',
        data: { url: file.url },
      });
    });
  }

  // Adicionar links
  if (resources?.links) {
    resources.links.forEach((link) => {
      response.attachments?.push({
        type: 'link',
        url: link.url,
        title: link.title,
      });
    });
  }

  return response;
}
