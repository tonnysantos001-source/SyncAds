/**
 * Chat Handlers - Funcionalidades Avançadas da IA
 * Integra geração de imagens, pesquisa web, vídeos e mais ao chat
 *
 * @version 2.0.0
 * @date 02/02/2025
 */

import {
  generateImage,
  searchWeb,
  generateDownloadableFile,
  detectAdvancedIntent,
  generateVideo,
} from "./advancedFeatures";
import {
  scrapeWebsite,
  generatePDF,
  optimizeImage,
  resizeImage,
  applyImageFilter,
  removeBackground,
  addWatermark,
} from "../api/pythonService";
import omnibrainService, {
  detectTaskType,
  formatOmnibrainResult,
  isOmnibrainAvailable,
  type OmnibrainTaskInput,
  type OmnibrainResponse,
  ExecutionStatus,
} from "../api/omnibrainService";

// =====================================================
// TIPOS E INTERFACES
// =====================================================

export interface ChatHandlerResult {
  success: boolean;
  content: string;
  attachments?: ChatAttachment[];
  metadata?: Record<string, any>;
  error?: string;
}

export interface ChatAttachment {
  type: "image" | "video" | "file" | "link";
  url: string;
  title?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ChatContext {
  userId: string;
  conversationId: string;
  userMessage: string;
  conversationHistory: Array<{ role: string; content: string }>;
}

// =====================================================
// DETECÇÃO E ROTEAMENTO
// =====================================================

/**
 * Processa a mensagem do usuário e executa a ação apropriada
 */
export async function processUserMessage(
  context: ChatContext,
  onProgress?: (status: string, progress?: number) => void,
): Promise<ChatHandlerResult> {
  try {
    // ✅ FIX 5: OMNIBRAIN FIRST - Tentar processar com Omnibrain primeiro
    const omnibrainAvailable = await isOmnibrainAvailable().catch(() => false);

    if (omnibrainAvailable) {
      console.log("🧠 Processando com Omnibrain Engine...");

      if (onProgress) {
        onProgress("🧠 Analisando tarefa com Omnibrain...", 5);
      }

      try {
        const omnibrainResult = await handleOmnibrainExecution(
          context,
          onProgress,
        );

        // Se Omnibrain processou com sucesso, retornar resultado
        if (omnibrainResult.success && omnibrainResult.content) {
          console.log("✅ Omnibrain processou com sucesso");
          return omnibrainResult;
        }

        // Se Omnibrain retornou que não pode processar, continuar com handlers tradicionais
        if (omnibrainResult.metadata?.shouldFallback) {
          console.log("⚠️ Omnibrain delegou para handlers tradicionais");
          // Continua para a detecção de intenção abaixo
        }
      } catch (omnibrainError: any) {
        console.warn(
          "⚠️ Omnibrain falhou, usando fallback:",
          omnibrainError.message,
        );
        // Continua para a detecção de intenção abaixo
      }
    }

    // FALLBACK: Detecção de intenção tradicional
    const intent = detectAdvancedIntent(context.userMessage);

    // Logar intenção detectada
    console.log("🎯 Intenção detectada (fallback):", intent);

    // Rotear para o handler apropriado
    switch (intent.type) {
      case "generate-image":
        return await handleImageGeneration(context, intent.params, onProgress);

      case "web-search":
        return await handleWebSearch(context, intent.params, onProgress);

      case "create-file":
        return await handleFileGeneration(context, intent.params, onProgress);

      case "generate-video":
        return await handleVideoGeneration(context, intent.params, onProgress);

      case "scrape-python":
        return await handlePythonScraping(context, intent.params, onProgress);

      case "generate-pdf":
        return await handlePDFGeneration(context, intent.params, onProgress);

      case "process-image":
        return await handleImageProcessing(context, intent.params, onProgress);

      default:
        // Não é uma intenção avançada, retorna null para processar normalmente
        return {
          success: true,
          content: "",
          metadata: { skipAdvancedProcessing: true },
        };
    }
  } catch (error: any) {
    console.error("❌ Erro ao processar mensagem:", error);
    return {
      success: false,
      content: `Ops, deu ruim aqui: ${error.message}`,
      error: error.message,
    };
  }
}

// =====================================================
// HANDLER: OMNIBRAIN EXECUTION
// =====================================================

/**
 * ✅ FIX 5: Handler para execução via Omnibrain Engine
 */
async function handleOmnibrainExecution(
  context: ChatContext,
  onProgress?: (status: string, progress?: number) => void,
): Promise<ChatHandlerResult> {
  try {
    const { userMessage, conversationId, userId } = context;

    if (onProgress) {
      onProgress("🧠 Detectando tipo de tarefa...", 10);
    }

    // Detectar tipo de tarefa
    const taskType = detectTaskType(userMessage);

    console.log(`🔍 Tipo de tarefa detectado: ${taskType}`);

    if (onProgress) {
      onProgress("🚀 Executando com Omnibrain...", 30);
    }

    // Preparar input para Omnibrain
    const omnibrainInput: OmnibrainTaskInput = {
      command: userMessage,
      task_type: taskType,
      context: {
        conversation_history: context.conversationHistory,
      },
      conversation_id: conversationId,
      user_id: userId,
      options: {
        max_retries: 3,
        timeout: 60000,
        enable_hybrid: true,
        priority: "normal",
      },
    };

    // Executar via Omnibrain
    const response: OmnibrainResponse =
      await omnibrainService.execute(omnibrainInput);

    if (onProgress) {
      onProgress("✨ Processando resultado...", 90);
    }

    // Processar resultado
    if (response.success && response.result) {
      const { result } = response;

      // Verificar se tarefa foi completada com sucesso
      if (result.status === ExecutionStatus.SUCCESS) {
        const formattedContent = formatOmnibrainResult(result);

        return {
          success: true,
          content: formattedContent,
          metadata: {
            task_id: response.task_id,
            library_used: result.library_used,
            execution_time: result.execution_time,
            attempts: result.attempts,
            omnibrain: true,
          },
        };
      }

      // Tarefa falhou ou parcial
      if (result.status === ExecutionStatus.FAILED) {
        // Se Omnibrain não conseguiu processar, delegar para handlers tradicionais
        console.log("⚠️ Omnibrain não conseguiu processar, delegando...");
        return {
          success: false,
          content: "",
          metadata: { shouldFallback: true },
        };
      }
    }

    // Resposta sem sucesso
    console.log("⚠️ Omnibrain não retornou resultado válido");
    return {
      success: false,
      content: "",
      metadata: { shouldFallback: true },
    };
  } catch (error: any) {
    console.error("❌ Erro no Omnibrain handler:", error);

    // Em caso de erro, delegar para handlers tradicionais
    return {
      success: false,
      content: "",
      error: error.message,
      metadata: { shouldFallback: true },
    };
  }
}

// =====================================================
// HANDLER: GERAÇÃO DE IMAGENS
// =====================================================

async function handleImageGeneration(
  context: ChatContext,
  params: Record<string, any>,
  onProgress?: (status: string, progress?: number) => void,
): Promise<ChatHandlerResult> {
  try {
    const prompt = params.prompt || context.userMessage;

    if (onProgress) {
      onProgress("🎨 Gerando imagem com DALL-E 3...", 10);
    }

    // Otimizar prompt
    const optimizedPrompt = optimizeImagePrompt(prompt);

    if (onProgress) {
      onProgress(`✨ Prompt otimizado: "${optimizedPrompt}"`, 30);
    }

    // Gerar imagem
    const result = await generateImage({
      prompt: optimizedPrompt,
      size: "1024x1024",
      quality: "hd",
      style: "vivid",
      userId: context.userId,
    });

    if (!result.success || !result.imageUrl) {
      return {
        success: false,
        content: `💀 Falhou na geração da imagem: ${result.error || "Erro desconhecido"}`,
        error: result.error,
      };
    }

    if (onProgress) {
      onProgress("✅ Imagem gerada!", 100);
    }

    // Formatar resposta com humor ácido
    const responses = [
      `🎨 Pronto! Aqui está sua imagem. Se não ficou como esperava, culpe sua descrição vaga... ou a IA, tanto faz.`,
      `✨ Imagem gerada! Eu sei, ficou incrível. Não precisa agradecer, só use no seu ad e me dá os créditos da conversão.`,
      `🖼️ Tá aí sua obra-prima. Agora vai lá e transforma isso em dinheiro antes que expire o link.`,
      `🎭 Gerada! Se o cliente reclamar, fala que é "estilo artístico conceitual" e cobra mais caro.`,
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      content: `${randomResponse}\n\n**Prompt:** ${optimizedPrompt}\n**Tamanho:** ${result.metadata?.size}\n**Modelo:** ${result.metadata?.model}`,
      attachments: [
        {
          type: "image",
          url: result.imageUrl,
          title: "Imagem Gerada",
          description: optimizedPrompt,
          metadata: result.metadata,
        },
      ],
      metadata: {
        type: "image-generation",
        downloadUrl: result.downloadUrl,
        prompt: optimizedPrompt,
      },
    };
  } catch (error: any) {
    console.error("❌ Erro na geração de imagem:", error);
    return {
      success: false,
      content: `💥 Erro ao gerar imagem: ${error.message}. Tenta de novo com uma descrição melhor.`,
      error: error.message,
    };
  }
}

/**
 * Otimiza o prompt para geração de imagem
 */
function optimizeImagePrompt(userPrompt: string): string {
  // Remove palavras desnecessárias
  let prompt = userPrompt
    .replace(/gere?\s+(uma?\s+)?imagem\s+(de\s+|sobre\s+|com\s+)?/gi, "")
    .replace(/crie?\s+(uma?\s+)?imagem\s+(de\s+|sobre\s+|com\s+)?/gi, "")
    .replace(/fa(ça|z)\s+(uma?\s+)?imagem\s+(de\s+|sobre\s+|com\s+)?/gi, "")
    .replace(/desenhe?\s+/gi, "")
    .trim();

  // Se o prompt for muito curto, adiciona detalhes
  if (prompt.split(" ").length < 5) {
    prompt += ", high quality, detailed, professional lighting, 4k";
  }

  return prompt;
}

// =====================================================
// HANDLER: PESQUISA NA WEB
// =====================================================

async function handleWebSearch(
  context: ChatContext,
  params: Record<string, any>,
  onProgress?: (status: string, progress?: number) => void,
): Promise<ChatHandlerResult> {
  try {
    const query = params.query || context.userMessage;

    if (onProgress) {
      onProgress("🔍 Pesquisando na internet...", 20);
    }

    // Executar pesquisa
    const result = await searchWeb({
      query,
      maxResults: 5,
      userId: context.userId,
    });

    if (!result.success || !result.results) {
      return {
        success: false,
        content: `💀 Pesquisa falhou: ${result.error || "Google deve tá fora do ar... ou minha API."}`,
        error: result.error,
      };
    }

    if (onProgress) {
      onProgress("✅ Resultados encontrados!", 100);
    }

    // Formatar resultados com humor
    let content = `🌐 **Pesquisa:** "${query}"\n\n`;
    content += `📊 Encontrei ${result.results.length} resultados relevantes (ou seja, o Google não tá completamente inútil hoje):\n\n`;

    result.results.forEach((res, idx) => {
      content += `**${idx + 1}. ${res.title}**\n`;
      content += `🔗 ${res.url}\n`;
      content += `📝 ${res.snippet}\n\n`;
    });

    if (result.summary) {
      content += `\n💡 **Resumo:**\n${result.summary}\n\n`;
    }

    content += `_Pesquisa realizada em tempo real. Se quiser mais detalhes, clica nos links aí em cima._`;

    return {
      success: true,
      content,
      attachments: result.results.map((res) => ({
        type: "link" as const,
        url: res.url,
        title: res.title,
        description: res.snippet,
      })),
      metadata: {
        type: "web-search",
        query,
        resultsCount: result.results.length,
      },
    };
  } catch (error: any) {
    console.error("❌ Erro na pesquisa web:", error);
    return {
      success: false,
      content: `💥 Erro ao pesquisar: ${error.message}. Internet tá ruim aí?`,
      error: error.message,
    };
  }
}

// =====================================================
// HANDLER: GERAÇÃO DE ARQUIVOS
// =====================================================

async function handleFileGeneration(
  context: ChatContext,
  params: Record<string, any>,
  onProgress?: (status: string, progress?: number) => void,
): Promise<ChatHandlerResult> {
  try {
    const fileType = params.fileType || "txt";
    const fileName = params.fileName || `arquivo_${Date.now()}.${fileType}`;

    if (onProgress) {
      onProgress(`📁 Criando arquivo ${fileType.toUpperCase()}...`, 30);
    }

    // Gerar conteúdo do arquivo baseado na mensagem
    const content = await generateFileContent(context.userMessage, fileType);

    if (onProgress) {
      onProgress("💾 Fazendo upload...", 60);
    }

    // Gerar arquivo para download
    const result = await generateDownloadableFile({
      content,
      fileName,
      fileType: fileType as any,
      userId: context.userId,
    });

    if (!result.success || !result.downloadUrl) {
      return {
        success: false,
        content: `💀 Falhou ao criar arquivo: ${result.error}`,
        error: result.error,
      };
    }

    if (onProgress) {
      onProgress("✅ Arquivo pronto!", 100);
    }

    return {
      success: true,
      content: `📦 Arquivo criado com sucesso!\n\n**Nome:** ${result.fileName}\n**Tamanho:** ${formatFileSize(result.fileSize || 0)}\n\n⏰ Link expira em 1 hora (então salva logo antes que suma).\n\n[📥 Baixar Arquivo](${result.downloadUrl})`,
      attachments: [
        {
          type: "file",
          url: result.downloadUrl,
          title: result.fileName,
          description: `Arquivo ${fileType.toUpperCase()}`,
          metadata: {
            size: result.fileSize,
            type: fileType,
          },
        },
      ],
      metadata: {
        type: "file-generation",
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
      },
    };
  } catch (error: any) {
    console.error("❌ Erro ao gerar arquivo:", error);
    return {
      success: false,
      content: `💥 Erro ao criar arquivo: ${error.message}`,
      error: error.message,
    };
  }
}

/**
 * Gera conteúdo do arquivo baseado no tipo
 */
async function generateFileContent(
  userMessage: string,
  fileType: string,
): Promise<string> {
  // Aqui você pode adicionar lógica específica por tipo de arquivo
  // Por enquanto, retorna a mensagem formatada

  switch (fileType) {
    case "json":
      return JSON.stringify(
        {
          message: userMessage,
          generated_at: new Date().toISOString(),
          generated_by: "SyncAds AI",
        },
        null,
        2,
      );

    case "csv":
      return `Data,Mensagem\n${new Date().toISOString()},"${userMessage}"`;

    case "md":
      return `# Documento Gerado pela IA\n\n${userMessage}\n\n---\nGerado em: ${new Date().toLocaleString("pt-BR")}`;

    case "html":
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Documento SyncAds AI</title>
</head>
<body>
  <h1>Documento Gerado</h1>
  <p>${userMessage}</p>
  <footer>
    <small>Gerado por SyncAds AI em ${new Date().toLocaleString("pt-BR")}</small>
  </footer>
</body>
</html>`;

    default:
      return userMessage;
  }
}

/**
 * Formata tamanho de arquivo
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// =====================================================
// HANDLER: GERAÇÃO DE VÍDEOS
// =====================================================

async function handleVideoGeneration(
  context: ChatContext,
  params: Record<string, any>,
  onProgress?: (status: string, progress?: number) => void,
): Promise<ChatHandlerResult> {
  try {
    const prompt = params.prompt || context.userMessage;

    if (onProgress) {
      onProgress("🎬 Preparando geração de vídeo...", 10);
    }

    // Otimizar prompt
    const optimizedPrompt = optimizeVideoPrompt(prompt);

    if (onProgress) {
      onProgress(`✨ Prompt otimizado: "${optimizedPrompt}"`, 20);
    }

    // Gerar vídeo
    const result = await generateVideo({
      prompt: optimizedPrompt,
      duration: params.duration || 5,
      aspectRatio: params.aspectRatio || "16:9",
      style: params.style || "realistic",
      provider: params.provider || "runway",
      userId: context.userId,
      onProgress,
    });

    if (!result.success) {
      // Se falhar, retornar mensagem informativa (não configurado)
      return {
        success: false,
        content: result.error || "💀 Falhou na geração do vídeo",
        error: result.error,
        metadata: {
          type: "video-generation-not-configured",
          prompt: optimizedPrompt,
        },
      };
    }

    if (onProgress) {
      onProgress("✅ Vídeo gerado!", 100);
    }

    // Formatar resposta com humor ácido
    const responses = [
      `🎬 Pronto! Seu vídeo tá aí. Se ficou ruim, culpa é da IA... ou do seu prompt vago.`,
      `✨ Vídeo gerado! Hollywood tá tremendo com essa obra-prima. Ou não.`,
      `🎥 Tá aí seu blockbuster. Agora é só viralizar e me dar os créditos da campanha.`,
      `🎭 Vídeo concluído! Se o cliente não gostar, diz que é "estilo autoral contemporâneo".`,
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      content: `${randomResponse}\n\n**Prompt:** ${optimizedPrompt}\n**Duração:** ${result.metadata?.duration}s\n**Provider:** ${result.metadata?.provider}`,
      attachments: [
        {
          type: "video",
          url: result.videoUrl!,
          title: "Vídeo Gerado",
          description: optimizedPrompt,
          metadata: result.metadata,
        },
      ],
      metadata: {
        type: "video-generation",
        downloadUrl: result.downloadUrl,
        prompt: optimizedPrompt,
      },
    };
  } catch (error: any) {
    console.error("❌ Erro na geração de vídeo:", error);
    return {
      success: false,
      content: `💥 Erro ao gerar vídeo: ${error.message}. Tenta com um prompt melhor.`,
      error: error.message,
    };
  }
}

/**
 * Otimiza o prompt para geração de vídeo
 */
function optimizeVideoPrompt(userPrompt: string): string {
  // Remove palavras desnecessárias
  let prompt = userPrompt
    .replace(/gere?\s+(um?\s+)?v[íi]deo\s+(de\s+|sobre\s+|com\s+)?/gi, "")
    .replace(/crie?\s+(um?\s+)?v[íi]deo\s+(de\s+|sobre\s+|com\s+)?/gi, "")
    .replace(/fa(ça|z)\s+(um?\s+)?v[íi]deo\s+(de\s+|sobre\s+|com\s+)?/gi, "")
    .trim();

  // Se o prompt for muito curto, adiciona detalhes
  if (prompt.split(" ").length < 3) {
    prompt += ", cinematic, high quality, smooth camera movement";
  }

  return prompt;
}

// =====================================================
// UTILITÁRIOS
// =====================================================

/**
 * Verifica se a mensagem requer processamento avançado
 */
export function requiresAdvancedProcessing(message: string): boolean {
  const intent = detectAdvancedIntent(message);
  return intent.type !== "none" && intent.confidence > 0.7;
}

/**
 * Extrai metadata de attachments
 */
export function extractAttachmentMetadata(attachment: ChatAttachment): string {
  let metadata = `**Tipo:** ${attachment.type}\n`;

  if (attachment.metadata) {
    if (attachment.metadata.size) {
      metadata += `**Tamanho:** ${attachment.metadata.size}\n`;
    }
    if (attachment.metadata.model) {
      metadata += `**Modelo:** ${attachment.metadata.model}\n`;
    }
    if (attachment.metadata.type) {
      metadata += `**Formato:** ${attachment.metadata.type}\n`;
    }
  }

  return metadata;
}

/**
 * Formata resposta de erro com humor
 */
export function formatErrorWithHumor(error: string): string {
  const humorousErrors = [
    `💀 Deu ruim: ${error}. Tenta de novo ou chama o estagiário.`,
    `🔥 Erro detectado: ${error}. Até a IA tem seus dias ruins.`,
    `💥 Falhou: ${error}. Mas relaxa, nem a NASA acerta sempre.`,
    `⚠️ Ops: ${error}. Vamos fingir que não aconteceu?`,
  ];

  return humorousErrors[Math.floor(Math.random() * humorousErrors.length)];
}

// =====================================================
// HANDLER: SCRAPING COM PYTHON
// =====================================================

async function handlePythonScraping(
  context: ChatContext,
  params: Record<string, any>,
  onProgress?: (status: string, progress?: number) => void,
): Promise<ChatHandlerResult> {
  try {
    const url = params.url || extractUrlFromMessage(context.userMessage);

    if (!url) {
      return {
        success: false,
        content: "🤔 Cadê a URL? Preciso de um link pra fazer scraping, ô!",
        error: "URL não fornecida",
      };
    }

    if (onProgress) {
      onProgress("🕷️ Iniciando scraping com Python...", 20);
    }

    const result = await scrapeWebsite(url, {
      javascript: true,
      extractImages: true,
      extractLinks: true,
    });

    if (!result.success) {
      return {
        success: false,
        content: `💀 Scraping falhou: ${result.error || "Erro desconhecido"}`,
        error: result.error,
      };
    }

    if (onProgress) {
      onProgress("✅ Scraping concluído!", 100);
    }

    const responses = [
      `🕷️ Raspei tudo! Encontrei ${result.images?.length || 0} imagens e ${result.links?.length || 0} links. Agora usa isso pra algo útil.`,
      `✨ Scraping completo! O site não tinha segurança nenhuma, foi moleza. ${result.execution_time.toFixed(2)}s de trabalho honesto.`,
      `🎯 Dados extraídos! ${result.method} funcionou perfeitamente. Agora vai lá e monetiza essa info.`,
      `🔥 Pronto! Extraí tudo que tinha direito. Se quiser mais detalhes, pede que eu mando.`,
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      content: `${randomResponse}\n\n**URL:** ${result.url}\n**Método:** ${result.method}\n**Tempo:** ${result.execution_time.toFixed(2)}s\n\n${result.text ? result.text.substring(0, 500) + "..." : "Sem conteúdo de texto"}`,
      attachments: result.images?.slice(0, 10).map((img) => ({
        type: "image" as const,
        url: img,
        title: "Imagem extraída do scraping",
      })),
      metadata: {
        type: "python-scraping",
        url: result.url,
        method: result.method,
        images_count: result.images?.length || 0,
        links_count: result.links?.length || 0,
      },
    };
  } catch (error: any) {
    console.error("❌ Erro no scraping Python:", error);
    return {
      success: false,
      content: formatErrorWithHumor(error.message),
      error: error.message,
    };
  }
}

// =====================================================
// HANDLER: GERAÇÃO DE PDF
// =====================================================

async function handlePDFGeneration(
  context: ChatContext,
  params: Record<string, any>,
  onProgress?: (status: string, progress?: number) => void,
): Promise<ChatHandlerResult> {
  try {
    const title = params.title || "Documento SyncAds";
    const content = params.content || context.userMessage;

    if (onProgress) {
      onProgress("📄 Gerando PDF com Python...", 30);
    }

    const result = await generatePDF(title, content, {
      author: "SyncAds AI",
      includeHeader: true,
      includeFooter: true,
    });

    if (!result.success || !result.pdf_base64) {
      return {
        success: false,
        content: `💀 Falhou na geração do PDF: ${result.error || "Erro desconhecido"}`,
        error: result.error,
      };
    }

    if (onProgress) {
      onProgress("✅ PDF gerado!", 100);
    }

    const responses = [
      `📄 PDF gerado! ${result.pages} páginas de pura qualidade. Baixa aí e imprime pros clientes.`,
      `✨ Pronto! Seu PDF tá pronto pra download. ${(result.size_bytes! / 1024).toFixed(2)} KB de conteúdo profissional.`,
      `🎯 PDF completo! Agora só falta você ler e fingir que entendeu tudo.`,
      `🔥 Documento gerado! Se o cliente reclamar do design, fala que é minimalista.`,
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    // Converter base64 para URL blob (fazer no frontend)
    const pdfBlob = `data:application/pdf;base64,${result.pdf_base64}`;

    return {
      success: true,
      content: `${randomResponse}\n\n**Arquivo:** ${result.filename}\n**Páginas:** ${result.pages}\n**Tamanho:** ${(result.size_bytes! / 1024).toFixed(2)} KB`,
      attachments: [
        {
          type: "file" as const,
          url: pdfBlob,
          title: result.filename,
          description: `PDF com ${result.pages} páginas`,
          metadata: {
            size: result.size_bytes,
            pages: result.pages,
            format: "PDF",
          },
        },
      ],
      metadata: {
        type: "pdf-generation",
        filename: result.filename,
        pages: result.pages,
        size_bytes: result.size_bytes,
      },
    };
  } catch (error: any) {
    console.error("❌ Erro na geração de PDF:", error);
    return {
      success: false,
      content: formatErrorWithHumor(error.message),
      error: error.message,
    };
  }
}

// =====================================================
// HANDLER: PROCESSAMENTO DE IMAGENS
// =====================================================

async function handleImageProcessing(
  context: ChatContext,
  params: Record<string, any>,
  onProgress?: (status: string, progress?: number) => void,
): Promise<ChatHandlerResult> {
  try {
    const imageBase64 = params.imageBase64;
    const operation = params.operation || "optimize";

    if (!imageBase64) {
      return {
        success: false,
        content: "🤔 Cadê a imagem? Manda uma foto pra eu processar!",
        error: "Imagem não fornecida",
      };
    }

    if (onProgress) {
      onProgress(`🎨 Processando imagem (${operation})...`, 30);
    }

    let result;
    switch (operation) {
      case "optimize":
        result = await optimizeImage(imageBase64);
        break;
      case "resize":
        result = await resizeImage(imageBase64, params.width, params.height);
        break;
      case "filter":
        result = await applyImageFilter(
          imageBase64,
          params.filterType || "vintage",
        );
        break;
      case "remove-bg":
        result = await removeBackground(imageBase64);
        break;
      case "watermark":
        result = await addWatermark(
          imageBase64,
          params.text || "SyncAds © 2025",
        );
        break;
      default:
        result = await optimizeImage(imageBase64);
    }

    if (!result.success || !result.image_base64) {
      return {
        success: false,
        content: `💀 Processamento falhou: ${result.error || "Erro desconhecido"}`,
        error: result.error,
      };
    }

    if (onProgress) {
      onProgress("✅ Imagem processada!", 100);
    }

    const compressionText = result.compression_ratio
      ? `Reduzi ${((1 - result.compression_ratio) * 100).toFixed(0)}% do tamanho!`
      : "";

    const responses = [
      `🎨 Imagem processada! ${compressionText} Agora tá pronta pra bombar nas redes.`,
      `✨ Pronto! Sua imagem ficou top. ${compressionText} De nada.`,
      `🔥 Processamento completo! ${result.width}x${result.height}px de pura beleza.`,
      `🎯 Feito! Se não ficou bom, a culpa é da imagem original, não minha.`,
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      content: `${randomResponse}\n\n**Operação:** ${operation}\n**Dimensões:** ${result.width}x${result.height}px\n**Formato:** ${result.format}\n**Tamanho:** ${(result.size_bytes! / 1024).toFixed(2)} KB`,
      attachments: [
        {
          type: "image" as const,
          url: `data:image/${result.format?.toLowerCase()};base64,${result.image_base64}`,
          title: "Imagem processada",
          metadata: {
            width: result.width,
            height: result.height,
            format: result.format,
            size: result.size_bytes,
            compression_ratio: result.compression_ratio,
          },
        },
      ],
      metadata: {
        type: "image-processing",
        operation,
        width: result.width,
        height: result.height,
        format: result.format,
        compression_ratio: result.compression_ratio,
      },
    };
  } catch (error: any) {
    console.error("❌ Erro no processamento de imagem:", error);
    return {
      success: false,
      content: formatErrorWithHumor(error.message),
      error: error.message,
    };
  }
}

// =====================================================
// UTILITÁRIOS
// =====================================================

/**
 * Extrai URL de uma mensagem de texto
 */
function extractUrlFromMessage(message: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = message.match(urlRegex);
  return matches ? matches[0] : null;
}
