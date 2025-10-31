/**
 * Executor de ferramentas (tools) da IA
 * Chama as Edge Functions do Supabase para executar ações
 */

import { supabase } from "@/lib/supabase";
import { SUPABASE_CONFIG } from "@/lib/config";

export interface ToolCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  message: string;
}

/**
 * Mapeamento de ferramentas para Edge Functions
 */
const TOOL_TO_FUNCTION_MAP: Record<string, string> = {
  generate_file: "file-generator-v2",
  generate_zip: "generate-zip",
  http_request: "super-ai-tools",
  download_image: "super-ai-tools",
  web_search: "web-search",
  web_scraping: "playwright-scraper",
  generate_image: "generate-image",
  execute_python: "python-executor",
  database_query: "super-ai-tools",
  process_data: "super-ai-tools",
  send_email: "super-ai-tools",
  scrape_products: "playwright-scraper",
  generate_video: "generate-video",
};

/**
 * Executa uma ferramenta chamando a Edge Function apropriada
 */
export async function executeTool(
  toolCall: ToolCall,
  userId: string,
  conversationId: string,
): Promise<ToolResult> {
  const { name, arguments: args } = toolCall;

  console.log(`🔧 Executando ferramenta: ${name}`, args);

  try {
    // Validar se a ferramenta existe
    if (!TOOL_TO_FUNCTION_MAP[name]) {
      return {
        success: false,
        error: `Ferramenta "${name}" não encontrada`,
        message: `A ferramenta "${name}" não está disponível.`,
      };
    }

    // Obter sessão do usuário
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return {
        success: false,
        error: "Sessão inválida",
        message: "Você precisa estar logado para usar esta ferramenta.",
      };
    }

    // Executar a ferramenta específica
    switch (name) {
      case "generate_file":
        return await executeGenerateFile(args, session.access_token);

      case "generate_zip":
        return await executeGenerateZip(args, session.access_token);

      case "http_request":
        return await executeHttpRequest(
          args,
          session.access_token,
          userId,
          conversationId,
        );

      case "download_image":
        return await executeDownloadImage(
          args,
          session.access_token,
          userId,
          conversationId,
        );

      case "web_search":
        return await executeWebSearch(args, session.access_token);

      case "web_scraping":
        return await executeWebScraping(args, session.access_token);

      case "generate_image":
        return await executeGenerateImage(args, session.access_token);

      case "execute_python":
        return await executeExecutePython(args, session.access_token);

      case "database_query":
        return await executeDatabaseQuery(
          args,
          session.access_token,
          userId,
          conversationId,
        );

      case "process_data":
        return await executeProcessData(
          args,
          session.access_token,
          userId,
          conversationId,
        );

      case "send_email":
        return await executeSendEmail(
          args,
          session.access_token,
          userId,
          conversationId,
        );

      case "scrape_products":
        return await executeScrapeProducts(
          args,
          session.access_token,
          conversationId,
        );

      case "generate_video":
        return await executeGenerateVideo(args, session.access_token);

      default:
        return {
          success: false,
          error: "Ferramenta não implementada",
          message: `A ferramenta "${name}" ainda não foi implementada.`,
        };
    }
  } catch (error: any) {
    console.error(`❌ Erro ao executar ferramenta ${name}:`, error);
    return {
      success: false,
      error: error.message || "Erro desconhecido",
      message: `Ocorreu um erro ao executar a ferramenta: ${error.message}`,
    };
  }
}

/**
 * Chama uma Edge Function
 */
async function callEdgeFunction(
  functionName: string,
  payload: any,
  accessToken: string,
): Promise<any> {
  const url = `${SUPABASE_CONFIG.functionsUrl}/${functionName}`;

  console.log(`📡 Chamando Edge Function: ${functionName}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_CONFIG.anonKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `HTTP ${response.status}`;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.error || errorJson.message || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }

    throw new Error(errorMessage);
  }

  return await response.json();
}

/**
 * Gerar arquivo
 */
async function executeGenerateFile(
  args: any,
  accessToken: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "file-generator-v2",
    {
      fileName: args.fileName,
      content: args.content,
      fileType: args.fileType,
    },
    accessToken,
  );

  return {
    success: true,
    data: result,
    message: `Arquivo "${args.fileName}" criado com sucesso! [Download](${result.downloadUrl})`,
  };
}

/**
 * Gerar ZIP
 */
async function executeGenerateZip(
  args: any,
  accessToken: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "generate-zip",
    {
      zipName: args.zipName,
      files: args.files,
    },
    accessToken,
  );

  return {
    success: true,
    data: result,
    message: `ZIP "${args.zipName}" criado com sucesso! [Download](${result.downloadUrl})\n\nExpira em: ${new Date(result.expiresAt).toLocaleString("pt-BR")}`,
  };
}

/**
 * HTTP Request
 */
async function executeHttpRequest(
  args: any,
  accessToken: string,
  userId: string,
  conversationId: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "super-ai-tools",
    {
      toolName: "api_caller",
      parameters: {
        url: args.url,
        method: args.method,
        headers: args.headers || {},
        body: args.body,
      },
      userId,
      conversationId,
    },
    accessToken,
  );

  return {
    success: result.success,
    data: result.data,
    message:
      result.message || `Requisição ${args.method} para ${args.url} concluída.`,
  };
}

/**
 * Download de imagem
 */
async function executeDownloadImage(
  args: any,
  accessToken: string,
  userId: string,
  conversationId: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "super-ai-tools",
    {
      toolName: "file_downloader",
      parameters: {
        url: args.imageUrl,
        fileName: args.fileName,
      },
      userId,
      conversationId,
    },
    accessToken,
  );

  return {
    success: result.success,
    data: result.data,
    message:
      result.message ||
      `Imagem baixada com sucesso! [Ver imagem](${result.data?.url})`,
  };
}

/**
 * Web Search - Busca na internet
 */
async function executeWebSearch(
  args: any,
  accessToken: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "web-search",
    {
      query: args.query,
      maxResults: args.maxResults || 10,
      freshness: args.freshness,
    },
    accessToken,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      message: `❌ Erro ao buscar: ${result.error}\n\n${result.message || ""}`,
    };
  }

  const results = result.results || [];
  const resultsSummary = results
    .slice(0, 5)
    .map(
      (r: any, i: number) =>
        `${i + 1}. **[${r.title}](${r.url})**\n   ${r.description || ""}`,
    )
    .join("\n\n");

  return {
    success: true,
    data: result,
    message: `🔍 **Resultados da pesquisa:** "${args.query}"\n\n**${results.length} resultados encontrados** (${result.metadata?.searchEngine})\n\n${resultsSummary}\n\n${results.length > 5 ? `\n_E mais ${results.length - 5} resultados..._` : ""}`,
  };
}

/**
 * Web Scraping com Playwright
 */
async function executeWebScraping(
  args: any,
  accessToken: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "playwright-scraper",
    {
      url: args.url,
      selectors: args.selectors,
      extractProducts: false,
      screenshot: args.screenshot || false,
    },
    accessToken,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      message: `❌ Erro ao fazer scraping: ${result.error}`,
    };
  }

  let message = `✅ **Web scraping concluído:** ${args.url}\n\n`;

  if (result.data) {
    const dataKeys = Object.keys(result.data);
    message += `📊 **${dataKeys.length} tipos de dados extraídos**\n\n`;

    if (result.data.products && result.data.products.length > 0) {
      const products = result.data.products.slice(0, 3);
      message += `🛍️ **${result.data.totalProducts} produtos encontrados**\n\n`;
      message += products
        .map(
          (p: any, i: number) =>
            `${i + 1}. **${p.name}**\n   💰 ${p.price}\n   ${p.link ? `🔗 [Ver produto](${p.link})` : ""}`,
        )
        .join("\n\n");
    } else {
      // Mostrar preview dos dados extraídos
      for (const [key, value] of Object.entries(result.data).slice(0, 3)) {
        if (key !== "metadata") {
          message += `**${key}:** ${JSON.stringify(value).substring(0, 100)}...\n\n`;
        }
      }
    }
  }

  if (result.metadata) {
    message += `\n⏱️ Concluído em ${result.metadata.duration}`;
  }

  return {
    success: true,
    data: result,
    message,
  };
}

/**
 * Gerar imagem
 */
async function executeGenerateImage(
  args: any,
  accessToken: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "generate-image",
    {
      prompt: args.prompt,
      size: args.size || "1024x1024",
      style: args.style || "vivid",
    },
    accessToken,
  );

  return {
    success: true,
    data: result,
    message: `Imagem gerada com sucesso!\n\n![${args.prompt}](${result.imageUrl})`,
  };
}

/**
 * Executar Python
 */
async function executeExecutePython(
  args: any,
  accessToken: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "python-executor",
    {
      code: args.code,
      description: args.description,
    },
    accessToken,
  );

  return {
    success: result.success,
    data: result.output,
    message: `Código Python executado com sucesso!\n\nResultado:\n\`\`\`\n${result.output}\n\`\`\``,
  };
}

/**
 * Database Query
 */
async function executeDatabaseQuery(
  args: any,
  accessToken: string,
  userId: string,
  conversationId: string,
): Promise<ToolResult> {
  // Validar que é apenas SELECT
  const query = args.query.trim().toUpperCase();
  if (!query.startsWith("SELECT")) {
    return {
      success: false,
      error: "Query inválida",
      message: "Apenas queries SELECT são permitidas por segurança.",
    };
  }

  const result = await callEdgeFunction(
    "super-ai-tools",
    {
      toolName: "database_query",
      parameters: {
        query: args.query,
      },
      userId,
      conversationId,
    },
    accessToken,
  );

  return {
    success: result.success,
    data: result.data,
    message: `Query executada com sucesso! ${result.data?.length || 0} resultados encontrados.`,
  };
}

/**
 * Processar dados
 */
async function executeProcessData(
  args: any,
  accessToken: string,
  userId: string,
  conversationId: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "super-ai-tools",
    {
      toolName: "data_processor",
      parameters: {
        data: args.data,
        operation: args.operation,
        config: args.config,
      },
      userId,
      conversationId,
    },
    accessToken,
  );

  return {
    success: result.success,
    data: result.data,
    message:
      result.message ||
      `Dados processados com sucesso (operação: ${args.operation}).`,
  };
}

/**
 * Enviar email
 */
async function executeSendEmail(
  args: any,
  accessToken: string,
  userId: string,
  conversationId: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "super-ai-tools",
    {
      toolName: "email_sender",
      parameters: {
        to: args.to,
        subject: args.subject,
        body: args.body,
        attachments: args.attachments,
      },
      userId,
      conversationId,
    },
    accessToken,
  );

  return {
    success: result.success,
    data: result.data,
    message: result.message || `Email enviado com sucesso para ${args.to}`,
  };
}

/**
 * Raspar produtos com Playwright
 */
async function executeScrapeProducts(
  args: any,
  accessToken: string,
  conversationId: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "playwright-scraper",
    {
      url: args.url,
      extractProducts: true,
      maxProducts: args.maxProducts || 50,
      screenshot: false,
    },
    accessToken,
  );

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      message: `❌ Erro ao raspar produtos: ${result.error}\n\n💡 **Dica:** Certifique-se de que a URL é de uma página de produtos ou categoria de e-commerce.`,
    };
  }

  const products = result.data?.products || [];
  const totalProducts = products.length;

  if (totalProducts === 0) {
    return {
      success: false,
      error: "Nenhum produto encontrado",
      message: `⚠️ **Nenhum produto encontrado** em ${args.url}\n\nPossíveis motivos:\n- A página não contém produtos\n- Os produtos são carregados de forma muito específica\n- O site está bloqueando scrapers\n\n💡 Tente usar web_scraping com seletores customizados.`,
    };
  }

  // Gerar CSV
  const csvLines = ["Nome,Preço,Link,Imagem"];
  products.forEach((p: any) => {
    const name = (p.name || "").replace(/"/g, '""');
    const price = (p.price || "").replace(/"/g, '""');
    const link = p.link || "";
    const image = p.image || "";
    csvLines.push(`"${name}","${price}","${link}","${image}"`);
  });
  const csvContent = csvLines.join("\n");

  // Upload do CSV para storage
  try {
    const fileName = `produtos_${Date.now()}.csv`;
    const uploadResult = await callEdgeFunction(
      "file-generator-v2",
      {
        fileName,
        content: csvContent,
        fileType: "csv",
      },
      accessToken,
    );

    const preview = products
      .slice(0, 5)
      .map(
        (p: any, i: number) =>
          `${i + 1}. **${p.name}**\n   💰 ${p.price}${p.link ? `\n   🔗 [Ver](${p.link})` : ""}`,
      )
      .join("\n\n");

    return {
      success: true,
      data: {
        totalProducts,
        products: products.slice(0, args.maxProducts || 50),
        downloadUrl: uploadResult.downloadUrl,
        fileName,
      },
      message: `✅ **${totalProducts} produtos extraídos** de ${args.url}\n\n📥 **[BAIXAR CSV COMPLETO](${uploadResult.downloadUrl})**\n\n🛍️ **Preview dos primeiros produtos:**\n\n${preview}${totalProducts > 5 ? `\n\n_E mais ${totalProducts - 5} produtos no arquivo..._` : ""}`,
    };
  } catch (uploadError: any) {
    // Se falhar o upload, retornar apenas os dados
    const preview = products
      .slice(0, 5)
      .map((p: any, i: number) => `${i + 1}. **${p.name}** - ${p.price}`)
      .join("\n");

    return {
      success: true,
      data: {
        totalProducts,
        products: products.slice(0, 10),
      },
      message: `✅ **${totalProducts} produtos extraídos** de ${args.url}\n\n🛍️ **Preview:**\n\n${preview}\n\n⚠️ Erro ao gerar CSV: ${uploadError.message}`,
    };
  }
}

/**
 * Gerar vídeo
 */
async function executeGenerateVideo(
  args: any,
  accessToken: string,
): Promise<ToolResult> {
  const result = await callEdgeFunction(
    "generate-video",
    {
      prompt: args.prompt,
      duration: args.duration || 5,
    },
    accessToken,
  );

  return {
    success: true,
    data: result,
    message: `Vídeo gerado com sucesso!\n\n[Assistir vídeo](${result.videoUrl})`,
  };
}

/**
 * Executa múltiplas ferramentas em sequência
 */
export async function executeMultipleTools(
  toolCalls: ToolCall[],
  userId: string,
  conversationId: string,
): Promise<ToolResult[]> {
  const results: ToolResult[] = [];

  for (const toolCall of toolCalls) {
    const result = await executeTool(toolCall, userId, conversationId);
    results.push(result);
  }

  return results;
}
