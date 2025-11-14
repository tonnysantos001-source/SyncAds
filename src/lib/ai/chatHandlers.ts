/**
 * Chat Handlers - Funcionalidades Avançadas da IA
 * Integra geração de imagens, pesquisa web, vídeos e mais ao chat
 *
 * @version 2.0.0
 * @date 02/02/2025
 */

import { IntentDetector } from './core/aiCore';
import {
  generateImage,
  searchWeb,
  generateDownloadableFile,
  detectAdvancedIntent,
} from './advancedFeatures';

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
  type: 'image' | 'video' | 'file' | 'link';
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
  onProgress?: (status: string, progress?: number) => void
): Promise<ChatHandlerResult> {
  try {
    // Detectar intenção avançada
    const intent = detectAdvancedIntent(context.userMessage);

    // Logar intenção detectada
    console.log('🎯 Intenção detectada:', intent);

    // Rotear para o handler apropriado
    switch (intent.type) {
      case 'generate-image':
        return await handleImageGeneration(context, intent.params, onProgress);

      case 'web-search':
        return await handleWebSearch(context, intent.params, onProgress);

      case 'create-file':
        return await handleFileGeneration(context, intent.params, onProgress);

      case 'generate-video':
        return await handleVideoGeneration(context, intent.params, onProgress);

      default:
        // Não é uma intenção avançada, retorna null para processar normalmente
        return {
          success: true,
          content: '',
          metadata: { skipAdvancedProcessing: true },
        };
    }
  } catch (error: any) {
    console.error('❌ Erro ao processar mensagem:', error);
    return {
      success: false,
      content: `Ops, deu ruim aqui: ${error.message}`,
      error: error.message,
    };
  }
}

// =====================================================
// HANDLER: GERAÇÃO DE IMAGENS
// =====================================================

async function handleImageGeneration(
  context: ChatContext,
  params: Record<string, any>,
  onProgress?: (status: string, progress?: number) => void
): Promise<ChatHandlerResult> {
  try {
    const prompt = params.prompt || context.userMessage;

    if (onProgress) {
      onProgress('🎨 Gerando imagem com DALL-E 3...', 10);
    }

    // Otimizar prompt
    const optimizedPrompt = optimizeImagePrompt(prompt);

    if (onProgress) {
      onProgress(`✨ Prompt otimizado: "${optimizedPrompt}"`, 30);
    }

    // Gerar imagem
    const result = await generateImage({
      prompt: optimizedPrompt,
      size: '1024x1024',
      quality: 'hd',
      style: 'vivid',
      userId: context.userId,
    });

    if (!result.success || !result.imageUrl) {
      return {
        success: false,
        content: `💀 Falhou na geração da imagem: ${result.error || 'Erro desconhecido'}`,
        error: result.error,
      };
    }

    if (onProgress) {
      onProgress('✅ Imagem gerada!', 100);
    }

    // Formatar resposta com humor ácido
    const responses = [
      `🎨 Pronto! Aqui está sua imagem. Se não ficou como esperava, culpe sua descrição vaga... ou a IA, tanto faz.`,
      `✨ Imagem gerada! Eu sei, ficou incrível. Não precisa agradecer, só use no seu ad e me dá os créditos da conversão.`,
      `🖼️ Tá aí sua obra-prima. Agora vai lá e transforma isso em dinheiro antes que expire o link.`,
      `🎭 Gerada! Se o cliente reclamar, fala que é "estilo artístico conceitual" e cobra mais caro.`,
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return {
      success: true,
      content: `${randomResponse}\n\n**Prompt:** ${optimizedPrompt}\n**Tamanho:** ${result.metadata?.size}\n**Modelo:** ${result.metadata?.model}`,
      attachments: [
        {
          type: 'image',
          url: result.imageUrl,
          title: 'Imagem Gerada',
          description: optimizedPrompt,
          metadata: result.metadata,
        },
      ],
      metadata: {
        type: 'image-generation',
        downloadUrl: result.downloadUrl,
        prompt: optimizedPrompt,
      },
    };
  } catch (error: any) {
    console.error('❌ Erro na geração de imagem:', error);
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
    .replace(/gere?\s+(uma?\s+)?imagem\s+(de\s+|sobre\s+|com\s+)?/gi, '')
    .replace(/crie?\s+(uma?\s+)?imagem\s+(de\s+|sobre\s+|com\s+)?/gi, '')
    .replace(/fa(ça|z)\s+(uma?\s+)?imagem\s+(de\s+|sobre\s+|com\s+)?/gi, '')
    .replace(/desenhe?\s+/gi, '')
    .trim();

  // Se o prompt for muito curto, adiciona detalhes
  if (prompt.split(' ').length < 5) {
    prompt += ', high quality, detailed, professional lighting, 4k';
  }

  return prompt;
}

// =====================================================
// HANDLER: PESQUISA NA WEB
// =====================================================

async function handleWebSearch(
  context: ChatContext,
  params: Record<string, any>,
  onProgress?: (status: string, progress?: number) => void
): Promise<ChatHandlerResult> {
  try {
    const query = params.query || context.userMessage;

    if (onProgress) {
      onProgress('🔍 Pesquisando na internet...', 20);
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
        content: `💀 Pesquisa falhou: ${result.error || 'Google deve tá fora do ar... ou minha API.'}`,
        error: result.error,
      };
    }

    if (onProgress) {
      onProgress('✅ Resultados encontrados!', 100);
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
        type: 'link' as const,
        url: res.url,
        title: res.title,
        description: res.snippet,
      })),
      metadata: {
        type: 'web-search',
        query,
        resultsCount: result.results.length,
      },
    };
  } catch (error: any) {
    console.error('❌ Erro na pesquisa web:', error);
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
  onProgress?: (status: string, progress?: number) => void
): Promise<ChatHandlerResult> {
  try {
    const fileType = params.fileType || 'txt';
    const fileName = params.fileName || `arquivo_${Date.now()}.${fileType}`;

    if (onProgress) {
      onProgress(`📁 Criando arquivo ${fileType.toUpperCase()}...`, 30);
    }

    // Gerar conteúdo do arquivo baseado na mensagem
    const content = await generateFileContent(context.userMessage, fileType);

    if (onProgress) {
      onProgress('💾 Fazendo upload...', 60);
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
      onProgress('✅ Arquivo pronto!', 100);
    }

    return {
      success: true,
      content: `📦 Arquivo criado com sucesso!\n\n**Nome:** ${result.fileName}\n**Tamanho:** ${formatFileSize(result.fileSize || 0)}\n\n⏰ Link expira em 1 hora (então salva logo antes que suma).\n\n[📥 Baixar Arquivo](${result.downloadUrl})`,
      attachments: [
        {
          type: 'file',
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
        type: 'file-generation',
        downloadUrl: result.downloadUrl,
        fileName: result.fileName,
        fileSize: result.fileSize,
      },
    };
  } catch (error: any) {
    console.error('❌ Erro ao gerar arquivo:', error);
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
async function generateFileContent(userMessage: string, fileType: string): Promise<string> {
  // Aqui você pode adicionar lógica específica por tipo de arquivo
  // Por enquanto, retorna a mensagem formatada

  switch (fileType) {
    case 'json':
      return JSON.stringify(
        {
          message: userMessage,
          generated_at: new Date().toISOString(),
          generated_by: 'SyncAds AI',
        },
        null,
        2
      );

    case 'csv':
      return `Data,Mensagem\n${new Date().toISOString()},"${userMessage}"`;

    case 'md':
      return `# Documento Gerado pela IA\n\n${userMessage}\n\n---\nGerado em: ${new Date().toLocaleString('pt-BR')}`;

    case 'html':
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
    <small>Gerado por SyncAds AI em ${new Date().toLocaleString('pt-BR')}</small>
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
  onProgress?: (status: string, progress?: number) => void
): Promise<ChatHandlerResult> {
  try {
    const prompt = params.prompt || context.userMessage;

    if (onProgress) {
      onProgress('🎬 Preparando geração de vídeo...', 10);
    }

    // TODO: Implementar integração com Runway/Pika Labs
    // Por enquanto, retorna mensagem informativa

    return {
      success: false,
      content: `🎬 **Geração de Vídeos - Em Breve!**\n\nEssa funcionalidade tá chegando em breve. Por enquanto, posso:\n\n✅ Gerar imagens incríveis\n✅ Pesquisar na web\n✅ Criar arquivos para download\n✅ Analisar dados\n\nPrompt salvo: "${prompt}"\n\n_Quando ativar, você será o primeiro a saber!_`,
      metadata: {
        type: 'video-generation-pending',
        prompt,
      },
    };
  } catch (error: any) {
    console.error('❌ Erro na geração de vídeo:', error);
    return {
      success: false,
      content: `💥 Erro: ${error.message}`,
      error: error.message,
    };
  }
}

// =====================================================
// UTILITÁRIOS
// =====================================================

/**
 * Verifica se a mensagem requer processamento avançado
 */
export function requiresAdvancedProcessing(message: string): boolean {
  const intent = detectAdvancedIntent(message);
  return intent.type !== 'none' && intent.confidence > 0.7;
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
