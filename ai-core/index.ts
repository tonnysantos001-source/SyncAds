/**
 * AI CORE - SISTEMA DE INTELIGÊNCIA ARTIFICIAL UNIVERSAL
 * Integração completa: Core IA + Prompt Library + Browser Automation
 *
 * Este módulo unifica todos os componentes do sistema de IA do SyncAds
 */

import { EventEmitter } from "events";
import CoreAI, {
  TaskType,
  ExecutionStatus,
  UserRequest,
  TaskDecision,
  ExecutionPlan,
  ExecutionResult,
  CoreConfig,
  createCoreAI,
} from "./core-brain";

import PromptLibraryRegistry, {
  ModuleCategory,
  ModuleComplexity,
  ExecutionEnvironment,
  PromptModule,
  SearchCriteria,
  getRegistry,
  createRegistry,
} from "./prompt-library/registry";

import BrowserAutomationController, {
  BrowserActionType,
  SelectorType,
  AutomationStatus,
  BrowserCommand,
  ElementSelector,
  AutomationPlan,
  AutomationResult,
  ScrapingConfig,
  FormData,
  createBrowserController,
} from "./browser-automation/controller";

// ==================== PROMPT MODULES ====================
import { PandasModule } from "./prompt-library/modules/pandas-module";
// import { NumPyModule } from "./prompt-library/modules/numpy-module"; // Temporariamente desabilitado - arquivo incompleto
import { PillowModule } from "./prompt-library/modules/pillow-module";
import { OpenCVModule } from "./prompt-library/modules/opencv-module";
import { RequestsModule } from "./prompt-library/modules/requests-module";
import { BeautifulSoupModule } from "./prompt-library/modules/beautifulsoup-module";
import { SeleniumModule } from "./prompt-library/modules/selenium-module";
import { SQLAlchemyModule } from "./prompt-library/modules/sqlalchemy-module";
import { FastAPIModule } from "./prompt-library/modules/fastapi-module";
import { ScikitLearnModule } from "./prompt-library/modules/scikit-learn-module";
import { TransformersModule } from "./prompt-library/modules/transformers-module";

// ==================== RE-EXPORTS ====================

// Core Brain
export {
  CoreAI,
  TaskType,
  ExecutionStatus,
  UserRequest,
  TaskDecision,
  ExecutionPlan,
  ExecutionResult,
  CoreConfig,
  createCoreAI,
};

// Prompt Library
export {
  PromptLibraryRegistry,
  ModuleCategory,
  ModuleComplexity,
  ExecutionEnvironment,
  PromptModule,
  SearchCriteria,
  getRegistry,
  createRegistry,
};

// Browser Automation
export {
  BrowserAutomationController,
  BrowserActionType,
  SelectorType,
  AutomationStatus,
  BrowserCommand,
  ElementSelector,
  AutomationPlan,
  AutomationResult,
  ScrapingConfig,
  FormData,
  createBrowserController,
};

// ==================== SISTEMA INTEGRADO ====================

export interface AISystemConfig {
  core?: Partial<CoreConfig>;
  browser?: {
    extensionId?: string;
    defaultTimeout?: number;
    maxRetries?: number;
    debugMode?: boolean;
  };
  pythonService?: {
    baseUrl?: string;
    apiKey?: string;
    timeout?: number;
  };
  supabase?: {
    url?: string;
    anonKey?: string;
  };
  autoLoadModules?: boolean;
  debugMode?: boolean;
}

export interface TaskRequest {
  id?: string;
  userId: string;
  input: string;
  context?: Record<string, any>;
  priority?: number;
  executionMode?: "auto" | "manual" | "hybrid";
}

export interface TaskResponse {
  requestId: string;
  status: ExecutionStatus;
  decision: TaskDecision;
  plan: ExecutionPlan;
  results: ExecutionResult[];
  executionTime: number;
  error?: string;
  recommendations?: string[];
}

/**
 * Sistema de IA Universal Integrado
 * Classe principal que coordena todos os componentes
 */
export class AISystem extends EventEmitter {
  private core: CoreAI;
  private promptRegistry: PromptLibraryRegistry;
  private browserController: BrowserAutomationController;
  private config: AISystemConfig;
  private pythonServiceUrl: string;
  private isInitialized: boolean = false;

  constructor(config: AISystemConfig = {}) {
    super();

    this.config = {
      autoLoadModules: config.autoLoadModules ?? true,
      debugMode: config.debugMode ?? false,
      ...config,
    };

    // Inicializar componentes
    this.core = createCoreAI(config.core);
    this.promptRegistry = getRegistry();
    this.browserController = createBrowserController(config.browser);
    this.pythonServiceUrl =
      config.pythonService?.baseUrl || "http://localhost:8000";

    // Conectar eventos
    this.setupEventListeners();

    // Auto-inicializar se configurado
    if (this.config.autoLoadModules) {
      this.initialize().catch((err) => {
        this.log(`Erro na inicialização automática: ${err.message}`, "error");
      });
    }
  }

  // ==================== INICIALIZAÇÃO ====================

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.log("Sistema já inicializado");
      return;
    }

    this.log("Inicializando AI System...");
    this.emit("system:initializing");

    try {
      // Carregar módulos da biblioteca de prompts
      if (this.config.autoLoadModules) {
        await this.loadPromptModules();
      }

      // Registrar módulos no Core
      this.registerModulesInCore();

      // Conectar com extensão do navegador
      await this.connectBrowser();

      // Conectar com serviço Python
      await this.connectPythonService();

      this.isInitialized = true;
      this.emit("system:initialized");
      this.log("AI System inicializado com sucesso");
    } catch (error: any) {
      this.emit("system:initialization-error", error);
      throw error;
    }
  }

  private async loadPromptModules(): Promise<void> {
    this.log("Carregando módulos de prompt...");

    // Carregar todos os módulos disponíveis
    const modules = [
      PandasModule,
      // NumPyModule, // Temporariamente desabilitado - arquivo incompleto
      PillowModule,
      OpenCVModule,
      RequestsModule,
      BeautifulSoupModule,
      SeleniumModule,
      SQLAlchemyModule,
      FastAPIModule,
      ScikitLearnModule,
      TransformersModule,
    ];

    let loadedCount = 0;
    let failedCount = 0;

    for (const module of modules) {
      try {
        this.promptRegistry.register(module);
        this.log(`✓ Módulo carregado: ${module.name} (${module.packageName})`);
        loadedCount++;
      } catch (error: any) {
        this.log(`✗ Erro ao carregar ${module.name}: ${error.message}`, "warn");
        failedCount++;
      }
    }

    const stats = this.promptRegistry.getStats();
    this.log(
      `Módulos carregados: ${loadedCount}/${modules.length} (${failedCount} falhas)`,
    );
    this.log(`Total no registro: ${stats.total} módulos ativos`);
  }

  private registerModulesInCore(): void {
    this.log("Registrando módulos no Core IA...");

    const modules = this.promptRegistry.export();

    modules.forEach((module) => {
      this.core.registerModule({
        name: module.id,
        type: this.mapModuleCategoryToTaskType(module.category),
        capabilities: module.useCases,
        priority: this.calculateModulePriority(module),
        reliability: module.reliability,
        avgExecutionTime: module.avgExecutionTime,
        successRate: module.successRate,
        promptSystem: JSON.stringify(module.promptSystem),
      });
    });

    this.log(`${modules.length} módulos registrados no Core`);
  }

  private async connectBrowser(): Promise<void> {
    if (!this.browserController.isConnected()) {
      this.log("Aguardando conexão com extensão do navegador...");
      // O controller já tentará conectar automaticamente
    }
  }

  private async connectPythonService(): Promise<void> {
    try {
      const response = await fetch(`${this.pythonServiceUrl}/health`);
      if (response.ok) {
        this.log("Serviço Python conectado");
      }
    } catch (error) {
      this.log("Serviço Python não disponível (modo offline)", "warn");
    }
  }

  // ==================== API PRINCIPAL ====================

  /**
   * Processar requisição do usuário de forma inteligente
   */
  public async processRequest(request: TaskRequest): Promise<TaskResponse> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const requestId = request.id || this.generateRequestId();

    this.log(`Processando requisição: ${request.input}`);
    this.emit("request:processing", { requestId, request });

    try {
      // Criar UserRequest para o Core
      const userRequest: UserRequest = {
        id: requestId,
        userId: request.userId,
        input: request.input,
        context: request.context,
        priority: request.priority,
        timestamp: Date.now(),
      };

      // Analisar e decidir estratégia
      const decision = await this.core.analyzeRequest(userRequest);
      this.log(
        `Decisão: ${decision.taskType} (confiança: ${decision.confidence})`,
      );

      // Criar plano de execução
      const plan = this.core.createExecutionPlan(userRequest, decision);
      this.log(`Plano criado: ${plan.totalSteps} passos`);

      // Executar baseado no tipo de tarefa
      let results: ExecutionResult[];

      switch (decision.taskType) {
        case TaskType.BROWSER_AUTOMATION:
          results = await this.executeBrowserAutomation(userRequest, plan);
          break;

        case TaskType.PYTHON_EXECUTION:
          results = await this.executePythonTask(userRequest, plan);
          break;

        case TaskType.INTERNAL_TOOLS:
          results = await this.executeInternalTools(userRequest, plan);
          break;

        case TaskType.HYBRID:
          results = await this.executeHybridTask(userRequest, plan);
          break;

        default:
          results = await this.core.execute(userRequest);
      }

      // Gerar recomendações
      const recommendations = this.generateRecommendations(decision, results);

      const response: TaskResponse = {
        requestId,
        status: this.determineOverallStatus(results),
        decision,
        plan,
        results,
        executionTime: Date.now() - startTime,
        recommendations,
      };

      this.emit("request:completed", response);
      return response;
    } catch (error: any) {
      this.log(`Erro ao processar requisição: ${error.message}`, "error");

      const errorResponse: TaskResponse = {
        requestId,
        status: ExecutionStatus.FAILED,
        decision: {} as TaskDecision,
        plan: {} as ExecutionPlan,
        results: [],
        executionTime: Date.now() - startTime,
        error: error.message,
      };

      this.emit("request:error", errorResponse);
      return errorResponse;
    }
  }

  // ==================== EXECUÇÃO ESPECIALIZADA ====================

  private async executeBrowserAutomation(
    request: UserRequest,
    plan: ExecutionPlan,
  ): Promise<ExecutionResult[]> {
    this.log("Executando automação de navegador...");

    const results: ExecutionResult[] = [];

    for (const step of plan.steps) {
      try {
        // Converter step em comando de navegador
        const command = this.stepToBrowserCommand(step, request);

        // Executar via controller
        const browserResult =
          await this.browserController["executeCommand"](command);

        // Converter resultado
        results.push({
          stepId: step.id,
          status: this.mapBrowserStatusToExecutionStatus(browserResult.status),
          output: browserResult.output,
          error: browserResult.error,
          executionTime: browserResult.executionTime,
          retriesUsed: browserResult.retriesUsed,
        });
      } catch (error: any) {
        results.push({
          stepId: step.id,
          status: ExecutionStatus.FAILED,
          error: error.message,
          executionTime: 0,
          retriesUsed: 0,
        });
      }
    }

    return results;
  }

  private async executePythonTask(
    request: UserRequest,
    plan: ExecutionPlan,
  ): Promise<ExecutionResult[]> {
    this.log("Executando tarefa Python...");

    const results: ExecutionResult[] = [];

    for (const step of plan.steps) {
      try {
        const module = this.promptRegistry.get(step.module);

        if (!module) {
          throw new Error(`Módulo não encontrado: ${step.module}`);
        }

        // Montar payload para serviço Python
        const payload = {
          module: module.packageName,
          function: step.action,
          parameters: step.parameters,
          promptSystem: module.promptSystem,
        };

        // Chamar serviço Python
        const response = await fetch(`${this.pythonServiceUrl}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(`Python service error: ${response.statusText}`);
        }

        const data = await response.json();

        results.push({
          stepId: step.id,
          status: data.success
            ? ExecutionStatus.SUCCESS
            : ExecutionStatus.FAILED,
          output: data.result,
          error: data.error,
          executionTime: data.executionTime || 0,
          retriesUsed: 0,
        });
      } catch (error: any) {
        results.push({
          stepId: step.id,
          status: ExecutionStatus.FAILED,
          error: error.message,
          executionTime: 0,
          retriesUsed: 0,
        });
      }
    }

    return results;
  }

  private async executeInternalTools(
    request: UserRequest,
    plan: ExecutionPlan,
  ): Promise<ExecutionResult[]> {
    this.log("Executando ferramentas internas...");

    // Delegar ao Core IA
    return await this.core.execute(request);
  }

  private async executeHybridTask(
    request: UserRequest,
    plan: ExecutionPlan,
  ): Promise<ExecutionResult[]> {
    this.log("Executando tarefa híbrida...");

    const results: ExecutionResult[] = [];

    for (const step of plan.steps) {
      let result: ExecutionResult;

      switch (step.taskType) {
        case TaskType.BROWSER_AUTOMATION:
          const browserResults = await this.executeBrowserAutomation(request, {
            ...plan,
            steps: [step],
          });
          result = browserResults[0];
          break;

        case TaskType.PYTHON_EXECUTION:
          const pythonResults = await this.executePythonTask(request, {
            ...plan,
            steps: [step],
          });
          result = pythonResults[0];
          break;

        default:
          const internalResults = await this.executeInternalTools(request, {
            ...plan,
            steps: [step],
          });
          result = internalResults[0];
      }

      results.push(result);

      // Parar se falhou e não há fallback
      if (
        result.status === ExecutionStatus.FAILED &&
        plan.fallbackStrategies.length === 0
      ) {
        break;
      }
    }

    return results;
  }

  // ==================== HELPERS DE CONVERSÃO ====================

  private stepToBrowserCommand(
    step: any,
    request: UserRequest,
  ): BrowserCommand {
    // Converter step genérico em comando específico do navegador
    return {
      id: step.id,
      action: BrowserActionType.EXECUTE_SCRIPT, // Placeholder
      value: step.parameters,
      timeout: step.timeout,
    } as BrowserCommand;
  }

  private mapBrowserStatusToExecutionStatus(
    status: AutomationStatus,
  ): ExecutionStatus {
    switch (status) {
      case AutomationStatus.SUCCESS:
        return ExecutionStatus.SUCCESS;
      case AutomationStatus.FAILED:
        return ExecutionStatus.FAILED;
      case AutomationStatus.TIMEOUT:
        return ExecutionStatus.FAILED;
      default:
        return ExecutionStatus.PENDING;
    }
  }

  private mapModuleCategoryToTaskType(category: ModuleCategory): TaskType {
    switch (category) {
      case ModuleCategory.WEB_SCRAPING:
      case ModuleCategory.AUTOMATION:
        return TaskType.BROWSER_AUTOMATION;

      case ModuleCategory.IMAGE_PROCESSING:
      case ModuleCategory.VIDEO_PROCESSING:
      case ModuleCategory.MACHINE_LEARNING:
      case ModuleCategory.DEEP_LEARNING:
      case ModuleCategory.NLP:
        return TaskType.PYTHON_EXECUTION;

      default:
        return TaskType.INTERNAL_TOOLS;
    }
  }

  private calculateModulePriority(module: PromptModule): number {
    let priority = 5;

    if (module.reliability > 0.95) priority += 2;
    if (module.successRate > 0.95) priority += 2;
    if (module.status === "active") priority += 1;
    if (module.complexity === ModuleComplexity.BASIC) priority += 1;

    return Math.min(priority, 10);
  }

  // ==================== ANÁLISE E RECOMENDAÇÕES ====================

  private determineOverallStatus(results: ExecutionResult[]): ExecutionStatus {
    if (results.length === 0) return ExecutionStatus.PENDING;

    const allSuccess = results.every(
      (r) => r.status === ExecutionStatus.SUCCESS,
    );
    if (allSuccess) return ExecutionStatus.SUCCESS;

    const anySuccess = results.some(
      (r) => r.status === ExecutionStatus.SUCCESS,
    );
    if (anySuccess) return ExecutionStatus.SUCCESS; // Sucesso parcial

    return ExecutionStatus.FAILED;
  }

  private generateRecommendations(
    decision: TaskDecision,
    results: ExecutionResult[],
  ): string[] {
    const recommendations: string[] = [];

    // Recomendações baseadas em falhas
    const failures = results.filter((r) => r.status === ExecutionStatus.FAILED);
    if (failures.length > 0) {
      recommendations.push(
        `${failures.length} passos falharam. Considere usar fallback.`,
      );
    }

    // Recomendações baseadas em performance
    const avgTime =
      results.reduce((sum, r) => sum + r.executionTime, 0) / results.length;
    if (avgTime > 10000) {
      recommendations.push("Execução lenta detectada. Considere otimização.");
    }

    // Recomendações baseadas em confiança
    if (decision.confidence < 0.7) {
      recommendations.push(
        "Baixa confiança na decisão. Considere refinamento da requisição.",
      );
    }

    return recommendations;
  }

  // ==================== API CONVENIENTE ====================

  public async navigateAndExtract(
    url: string,
    selectors: Record<string, string>,
  ): Promise<any> {
    const data: any = {};

    await this.browserController.navigate(url);

    for (const [key, selector] of Object.entries(selectors)) {
      const result = await this.browserController.extract(
        this.browserController.buildSelector(SelectorType.CSS, selector),
      );
      if (result.status === AutomationStatus.SUCCESS) {
        data[key] = result.output;
      }
    }

    return data;
  }

  public async fillFormAndSubmit(
    formData: FormData,
  ): Promise<AutomationResult[]> {
    return await this.browserController.fillForm(formData);
  }

  public async scrapePage(config: ScrapingConfig): Promise<any[]> {
    return await this.browserController.scrape(config);
  }

  public findModules(criteria: SearchCriteria): PromptModule[] {
    return this.promptRegistry.search(criteria);
  }

  public getModuleByName(name: string): PromptModule | undefined {
    return this.promptRegistry.getByPackage(name);
  }

  // ==================== GESTÃO DO SISTEMA ====================

  public getStats(): any {
    return {
      core: this.core.getStats(),
      promptLibrary: this.promptRegistry.getStats(),
      browser: {
        connected: this.browserController.isConnected(),
        connection: this.browserController.getConnection(),
      },
      system: {
        initialized: this.isInitialized,
        uptime: process.uptime ? process.uptime() : 0,
      },
    };
  }

  public reset(): void {
    this.core.reset();
    this.log("Sistema resetado");
  }

  private setupEventListeners(): void {
    // Core events
    this.core.on("execution:started", (data) =>
      this.emit("core:execution-started", data),
    );
    this.core.on("execution:completed", (data) =>
      this.emit("core:execution-completed", data),
    );
    this.core.on("execution:error", (data) =>
      this.emit("core:execution-error", data),
    );

    // Browser events
    this.browserController.on("extension:connected", () =>
      this.emit("browser:connected"),
    );
    this.browserController.on("command:success", (data) =>
      this.emit("browser:command-success", data),
    );
    this.browserController.on("command:failed", (data) =>
      this.emit("browser:command-failed", data),
    );
  }

  private generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private log(
    message: string,
    level: "info" | "warn" | "error" = "info",
  ): void {
    if (this.config.debugMode) {
      console[level](`[AISystem] ${message}`);
    }
    this.emit("log", { level, message, timestamp: Date.now() });
  }
}

// ==================== FACTORY ====================

let globalAISystem: AISystem | null = null;

export function getAISystem(config?: AISystemConfig): AISystem {
  if (!globalAISystem) {
    globalAISystem = new AISystem(config);
  }
  return globalAISystem;
}

export function createAISystem(config?: AISystemConfig): AISystem {
  return new AISystem(config);
}

// ==================== DEFAULT EXPORT ====================

export default AISystem;
