/**
 * ============================================
 * SYNCADS OMNIBRAIN SERVICE
 * ============================================
 * Serviço de integração TypeScript ↔ Python Omnibrain
 *
 * Capacidades:
 * - Execução de comandos via Omnibrain Engine
 * - Suporte a contexto multi-turn
 * - Processamento multimodal (texto, imagem, vídeo, áudio)
 * - Retry automático
 * - Streaming de resultados
 * - Cache de resultados
 *
 * Autor: SyncAds AI Team
 * Versão: 1.0.0
 * Data: 2025-01-15
 * ============================================
 */

// ============================================
// TYPES & INTERFACES
// ============================================

export enum TaskType {
  IMAGE_PROCESSING = "image_processing",
  VIDEO_PROCESSING = "video_processing",
  AUDIO_PROCESSING = "audio_processing",
  TEXT_PROCESSING = "text_processing",
  WEB_SCRAPING = "web_scraping",
  DATA_ANALYSIS = "data_analysis",
  ML_INFERENCE = "ml_inference",
  ECOMMERCE_OPERATION = "ecommerce_operation",
  THEME_GENERATION = "theme_generation",
  PDF_GENERATION = "pdf_generation",
  CODE_EXECUTION = "code_execution",
  API_INTEGRATION = "api_integration",
  AUTOMATION = "automation",
  DESIGN_GENERATION = "design_generation",
  MARKETING_CONTENT = "marketing_content",
  SHOPIFY_THEME = "shopify_theme",
  STORE_CLONING = "store_cloning",
  UNKNOWN = "unknown",
}

export enum ExecutionStatus {
  SUCCESS = "success",
  FAILED = "failed",
  PARTIAL = "partial",
  TIMEOUT = "timeout",
  RATE_LIMITED = "rate_limited",
}

export interface OmnibrainTaskInput {
  command: string;
  task_type?: TaskType;
  context?: Record<string, any>;
  files?: Array<{
    name: string;
    url?: string;
    data?: string; // base64
    mime_type?: string;
  }>;
  options?: {
    max_retries?: number;
    timeout?: number;
    enable_hybrid?: boolean;
    priority?: "low" | "normal" | "high" | "urgent";
    stream?: boolean;
  };
  conversation_id?: string;
  user_id?: string;
}

export interface OmnibrainExecutionResult {
  status: ExecutionStatus;
  output: any;
  library_used?: string;
  execution_time: number;
  attempts: number;
  error?: string;
  error_type?: string;
  warnings?: string[];
  metadata?: Record<string, any>;
  generated_code?: string;
  execution_plan?: {
    primary_library: string;
    alternatives: string[];
    reasoning: string;
  };
}

export interface OmnibrainResponse {
  success: boolean;
  task_id: string;
  result?: OmnibrainExecutionResult;
  error?: string;
  timestamp: string;
}

export interface OmnibrainHealthStatus {
  status: "healthy" | "degraded" | "down";
  version: string;
  uptime: number;
  components: {
    task_classifier: boolean;
    library_selector: boolean;
    code_generator: boolean;
    executor: boolean;
    validator: boolean;
    retry_engine: boolean;
  };
  libraries_available: number;
  last_check: string;
}

// ============================================
// CONFIGURATION
// ============================================

const PYTHON_SERVICE_URL =
  import.meta.env.VITE_PYTHON_SERVICE_URL ||
  (import.meta.env.PROD
    ? "https://syncads-python-service.railway.app"
    : "http://localhost:8000");

const OMNIBRAIN_BASE_URL = `${PYTHON_SERVICE_URL}/api/omnibrain`;

const DEFAULT_TIMEOUT = 60000; // 60 segundos
const DEFAULT_MAX_RETRIES = 3;

// ============================================
// MAIN SERVICE CLASS
// ============================================

class OmnibrainService {
  private baseUrl: string;
  private defaultTimeout: number;
  private requestCache: Map<string, OmnibrainResponse>;

  constructor(baseUrl: string = OMNIBRAIN_BASE_URL) {
    this.baseUrl = baseUrl;
    this.defaultTimeout = DEFAULT_TIMEOUT;
    this.requestCache = new Map();
  }

  /**
   * Executa comando via Omnibrain Engine
   */
  async execute(input: OmnibrainTaskInput): Promise<OmnibrainResponse> {
    const startTime = Date.now();

    try {
      // Validar input
      if (!input.command || input.command.trim().length === 0) {
        throw new Error("Command cannot be empty");
      }

      // Preparar payload com todos os campos necessários
      const payload = {
        command: input.command,
        task_type: input.task_type,
        context: {
          ...(input.context || {}),
          timestamp: new Date().toISOString(),
        },
        files: input.files || [],
        metadata: {},
        user_id: input.user_id || "anonymous",
        priority:
          input.options?.priority === "urgent"
            ? 10
            : input.options?.priority === "high"
              ? 8
              : input.options?.priority === "low"
                ? 3
                : 5,
        timeout: (input.options?.timeout || this.defaultTimeout) / 1000, // Converter para segundos
      };

      // Adicionar headers com IDs para rastreamento
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (input.user_id) {
        headers["X-User-ID"] = input.user_id;
      }

      if (input.conversation_id) {
        headers["X-Conversation-ID"] = input.conversation_id;
      }

      // Fazer request com headers atualizados
      const response = await fetch(`${this.baseUrl}/execute`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(
          (input.options?.timeout || this.defaultTimeout) + 5000,
        ),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.detail || `HTTP ${response.status}: ${response.statusText}`,
        );
      }

      const data: OmnibrainResponse = await response.json();

      // Log performance
      const executionTime = Date.now() - startTime;
      console.log(
        `[Omnibrain] Executed in ${executionTime}ms - Status: ${data.result?.status}`,
      );

      return data;
    } catch (error: any) {
      console.error("[Omnibrain] Execution error:", error);

      // Retornar erro estruturado
      return {
        success: false,
        task_id: `error-${Date.now()}`,
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Executa comando simples (atalho)
   */
  async executeSimple(
    command: string,
    context?: Record<string, any>,
  ): Promise<any> {
    const response = await this.execute({
      command,
      context,
    });

    if (!response.success || !response.result) {
      throw new Error(response.error || "Execution failed");
    }

    return response.result.output;
  }

  /**
   * Processa imagem
   */
  async processImage(
    command: string,
    imageUrl: string,
    options?: Partial<OmnibrainTaskInput["options"]>,
  ): Promise<any> {
    return this.execute({
      command,
      task_type: TaskType.IMAGE_PROCESSING,
      files: [{ name: "image", url: imageUrl }],
      options,
    });
  }

  /**
   * Faz scraping de URL
   */
  async scrapeUrl(
    url: string,
    extractionRules?: Record<string, any>,
  ): Promise<any> {
    return this.execute({
      command: `Faça scraping de ${url}`,
      task_type: TaskType.WEB_SCRAPING,
      context: { url, extraction_rules: extractionRules },
    });
  }

  /**
   * Gera tema Shopify
   */
  async generateShopifyTheme(
    themeName: string,
    config: Record<string, any>,
  ): Promise<any> {
    return this.execute({
      command: `Gere tema Shopify chamado "${themeName}"`,
      task_type: TaskType.SHOPIFY_THEME,
      context: { theme_config: config },
    });
  }

  /**
   * Clona loja Shopify
   */
  async cloneShopifyStore(sourceUrl: string): Promise<any> {
    return this.execute({
      command: `Clone a loja ${sourceUrl}`,
      task_type: TaskType.STORE_CLONING,
      context: { source_url: sourceUrl },
    });
  }

  /**
   * Analisa dados
   */
  async analyzeData(data: any, analysisType: string = "general"): Promise<any> {
    return this.execute({
      command: `Analise os dados fornecidos (tipo: ${analysisType})`,
      task_type: TaskType.DATA_ANALYSIS,
      context: { data, analysis_type: analysisType },
    });
  }

  /**
   * Gera conteúdo de marketing
   */
  async generateMarketingContent(
    contentType: string,
    parameters: Record<string, any>,
  ): Promise<any> {
    return this.execute({
      command: `Gere ${contentType} com os parâmetros fornecidos`,
      task_type: TaskType.MARKETING_CONTENT,
      context: { content_type: contentType, parameters },
    });
  }

  /**
   * Verifica saúde do Omnibrain
   */
  async health(): Promise<OmnibrainHealthStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("[Omnibrain] Health check error:", error);
      return {
        status: "down",
        version: "unknown",
        uptime: 0,
        components: {
          task_classifier: false,
          library_selector: false,
          code_generator: false,
          executor: false,
          validator: false,
          retry_engine: false,
        },
        libraries_available: 0,
        last_check: new Date().toISOString(),
      };
    }
  }

  /**
   * Lista bibliotecas disponíveis
   */
  async listLibraries(category?: string): Promise<any> {
    try {
      const url = category
        ? `${this.baseUrl}/libraries?category=${category}`
        : `${this.baseUrl}/libraries`;

      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Failed to list libraries: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("[Omnibrain] List libraries error:", error);
      return { libraries: [], total: 0 };
    }
  }

  /**
   * Busca execução anterior por task_id
   */
  async getTaskResult(taskId: string): Promise<OmnibrainResponse | null> {
    try {
      const response = await fetch(`${this.baseUrl}/tasks/${taskId}`, {
        method: "GET",
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("[Omnibrain] Get task result error:", error);
      return null;
    }
  }

  /**
   * Limpa cache local
   */
  clearCache(): void {
    this.requestCache.clear();
    console.log("[Omnibrain] Cache cleared");
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

const omnibrainService = new OmnibrainService();

export default omnibrainService;

// Export da classe também para instâncias customizadas
export { OmnibrainService };

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Executa comando rápido (atalho global)
 */
export async function executeOmnibrain(
  command: string,
  context?: Record<string, any>,
): Promise<any> {
  return omnibrainService.executeSimple(command, context);
}

/**
 * Verifica se Omnibrain está disponível
 */
export async function isOmnibrainAvailable(): Promise<boolean> {
  const health = await omnibrainService.health();
  return health.status === "healthy";
}

/**
 * Formata resultado do Omnibrain para exibição no chat
 */
export function formatOmnibrainResult(
  result: OmnibrainExecutionResult,
): string {
  if (!result) return "Nenhum resultado disponível.";

  let message = "";

  // Status
  if (result.status === ExecutionStatus.SUCCESS) {
    message += "✅ **Tarefa concluída com sucesso!**\n\n";
  } else {
    message += `⚠️ **Status: ${result.status}**\n\n`;
  }

  // Biblioteca usada
  if (result.library_used) {
    message += `📚 Biblioteca: \`${result.library_used}\`\n`;
  }

  // Tempo de execução
  message += `⏱️ Tempo: ${result.execution_time.toFixed(2)}s\n`;

  // Tentativas
  if (result.attempts > 1) {
    message += `🔄 Tentativas: ${result.attempts}\n`;
  }

  // Output
  if (result.output) {
    message += "\n**Resultado:**\n";
    if (typeof result.output === "string") {
      message += result.output;
    } else {
      message += `\`\`\`json\n${JSON.stringify(result.output, null, 2)}\n\`\`\``;
    }
  }

  // Warnings
  if (result.warnings && result.warnings.length > 0) {
    message += "\n\n⚠️ **Avisos:**\n";
    result.warnings.forEach((warning) => {
      message += `- ${warning}\n`;
    });
  }

  // Erro
  if (result.error) {
    message += `\n\n❌ **Erro:** ${result.error}`;
  }

  return message;
}

/**
 * Detecta tipo de tarefa a partir do comando
 */
export function detectTaskType(command: string): TaskType {
  const lowerCommand = command.toLowerCase();

  // Keywords para cada tipo
  const taskKeywords: Record<TaskType, string[]> = {
    [TaskType.IMAGE_PROCESSING]: [
      "imagem",
      "image",
      "foto",
      "picture",
      "resize",
      "crop",
    ],
    [TaskType.VIDEO_PROCESSING]: ["vídeo", "video", "filme", "movie"],
    [TaskType.AUDIO_PROCESSING]: ["áudio", "audio", "som", "sound", "música"],
    [TaskType.WEB_SCRAPING]: [
      "scraping",
      "scrape",
      "extrair",
      "extract",
      "crawl",
    ],
    [TaskType.DATA_ANALYSIS]: [
      "analise",
      "analyze",
      "análise",
      "dados",
      "data",
    ],
    [TaskType.SHOPIFY_THEME]: ["tema", "theme", "shopify"],
    [TaskType.STORE_CLONING]: ["clone", "clonar", "copiar loja"],
    [TaskType.PDF_GENERATION]: ["pdf", "relatório", "report"],
    [TaskType.MARKETING_CONTENT]: ["marketing", "anúncio", "campanha", "copy"],
    [TaskType.TEXT_PROCESSING]: ["texto", "text", "processar"],
    [TaskType.ML_INFERENCE]: ["predict", "prever", "modelo", "model", "ml"],
    [TaskType.ECOMMERCE_OPERATION]: ["produto", "product", "loja", "store"],
    [TaskType.THEME_GENERATION]: ["gerar tema", "generate theme"],
    [TaskType.CODE_EXECUTION]: ["executar", "execute", "rodar", "run"],
    [TaskType.API_INTEGRATION]: ["api", "integração", "integration"],
    [TaskType.AUTOMATION]: ["automação", "automation", "automatizar"],
    [TaskType.DESIGN_GENERATION]: ["design", "criar", "gerar"],
    [TaskType.UNKNOWN]: [],
  };

  // Verificar keywords
  for (const [taskType, keywords] of Object.entries(taskKeywords)) {
    for (const keyword of keywords) {
      if (lowerCommand.includes(keyword)) {
        return taskType as TaskType;
      }
    }
  }

  return TaskType.UNKNOWN;
}
