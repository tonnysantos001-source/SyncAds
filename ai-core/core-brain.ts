/**
 * CORE IA UNIVERSAL - SYNCADS SAAS
 * Sistema de Inteligência Artificial Principal
 * Responsável por todas as decisões, fluxos e execuções
 */

import { EventEmitter } from "events";

// ==================== TIPOS E INTERFACES ====================

export enum TaskType {
  BROWSER_AUTOMATION = "BROWSER_AUTOMATION",
  PYTHON_EXECUTION = "PYTHON_EXECUTION",
  INTERNAL_TOOLS = "INTERNAL_TOOLS",
  MULTIMODAL_PIPELINE = "MULTIMODAL_PIPELINE",
  HYBRID = "HYBRID",
}

export enum ExecutionStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  RETRYING = "RETRYING",
  FALLBACK = "FALLBACK",
}

export interface UserRequest {
  id: string;
  userId: string;
  input: string;
  context?: Record<string, any>;
  priority?: number;
  timestamp: number;
}

export interface TaskDecision {
  taskType: TaskType;
  confidence: number;
  reasoning: string;
  fallbackOptions: TaskType[];
  estimatedTime: number;
  requiredModules: string[];
}

export interface ExecutionPlan {
  steps: ExecutionStep[];
  totalSteps: number;
  estimatedDuration: number;
  fallbackStrategies: FallbackStrategy[];
}

export interface ExecutionStep {
  id: string;
  order: number;
  action: string;
  taskType: TaskType;
  module: string;
  parameters: Record<string, any>;
  expectedOutput: any;
  timeout: number;
  retryCount: number;
  maxRetries: number;
}

export interface FallbackStrategy {
  triggerCondition: string;
  alternativeTaskType: TaskType;
  alternativeModule: string;
  priority: number;
}

export interface ExecutionResult {
  stepId: string;
  status: ExecutionStatus;
  output?: any;
  error?: string;
  executionTime: number;
  retriesUsed: number;
  fallbackUsed?: boolean;
}

export interface MemoryContext {
  sessionId: string;
  history: ExecutionResult[];
  currentTask?: UserRequest;
  decisions: TaskDecision[];
  learnings: Record<string, any>;
  errorPatterns: ErrorPattern[];
}

export interface ErrorPattern {
  error: string;
  frequency: number;
  successfulFallback?: string;
  lastOccurrence: number;
}

export interface ModuleRegistry {
  name: string;
  type: TaskType;
  capabilities: string[];
  priority: number;
  reliability: number;
  avgExecutionTime: number;
  successRate: number;
  promptSystem?: string;
}

// ==================== CORE IA CLASS ====================

export class CoreAI extends EventEmitter {
  private moduleRegistry: Map<string, ModuleRegistry> = new Map();
  private memoryContext: MemoryContext;
  private isProcessing: boolean = false;
  private queue: UserRequest[] = [];
  private config: CoreConfig;

  constructor(config?: Partial<CoreConfig>) {
    super();
    this.config = {
      maxRetries: config?.maxRetries || 3,
      fallbackEnabled: config?.fallbackEnabled ?? true,
      learningEnabled: config?.learningEnabled ?? true,
      parallelExecution: config?.parallelExecution ?? false,
      timeout: config?.timeout || 300000, // 5 min default
      debugMode: config?.debugMode ?? false,
    };

    this.memoryContext = this.initializeMemory();
    this.initializeCoreModules();
  }

  // ==================== INICIALIZAÇÃO ====================

  private initializeMemory(): MemoryContext {
    return {
      sessionId: this.generateSessionId(),
      history: [],
      decisions: [],
      learnings: {},
      errorPatterns: [],
    };
  }

  private initializeCoreModules(): void {
    // Registrar módulos base
    this.registerModule({
      name: "browser-controller",
      type: TaskType.BROWSER_AUTOMATION,
      capabilities: [
        "web-scraping",
        "form-filling",
        "dom-manipulation",
        "visual-testing",
      ],
      priority: 10,
      reliability: 0.95,
      avgExecutionTime: 5000,
      successRate: 0.95,
    });

    this.registerModule({
      name: "python-executor",
      type: TaskType.PYTHON_EXECUTION,
      capabilities: [
        "data-processing",
        "ml-inference",
        "api-calls",
        "file-processing",
      ],
      priority: 9,
      reliability: 0.98,
      avgExecutionTime: 3000,
      successRate: 0.98,
    });

    this.registerModule({
      name: "internal-tools",
      type: TaskType.INTERNAL_TOOLS,
      capabilities: ["database-ops", "cache-ops", "queue-ops", "auth-ops"],
      priority: 10,
      reliability: 0.99,
      avgExecutionTime: 1000,
      successRate: 0.99,
    });

    this.emit("core:initialized", { modules: this.moduleRegistry.size });
  }

  // ==================== REGISTRO DE MÓDULOS ====================

  public registerModule(module: ModuleRegistry): void {
    this.moduleRegistry.set(module.name, module);
    this.log(`Módulo registrado: ${module.name} [${module.type}]`);
  }

  public getModule(name: string): ModuleRegistry | undefined {
    return this.moduleRegistry.get(name);
  }

  public listModules(type?: TaskType): ModuleRegistry[] {
    const modules = Array.from(this.moduleRegistry.values());
    return type ? modules.filter((m) => m.type === type) : modules;
  }

  // ==================== ANÁLISE DE REQUISIÇÃO ====================

  public async analyzeRequest(request: UserRequest): Promise<TaskDecision> {
    this.log(`Analisando requisição: ${request.input}`);

    const analysis = await this.performDeepAnalysis(request);
    const decision = this.makeDecision(analysis);

    this.memoryContext.decisions.push(decision);
    this.emit("decision:made", decision);

    return decision;
  }

  private async performDeepAnalysis(request: UserRequest): Promise<any> {
    const keywords = this.extractKeywords(request.input);
    const intent = this.detectIntent(request.input);
    const complexity = this.estimateComplexity(request.input);
    const capabilities = this.matchCapabilities(keywords);

    return {
      keywords,
      intent,
      complexity,
      capabilities,
      context: request.context,
    };
  }

  private extractKeywords(input: string): string[] {
    const keywords: string[] = [];

    // Browser automation keywords
    if (
      /abrir|navegar|clicar|preencher|scrape|extrair|elemento|página|dom/i.test(
        input,
      )
    ) {
      keywords.push("browser-automation");
    }

    // Python execution keywords
    if (
      /processar|calcular|analisar|machine learning|ml|ia|dados|csv|json|api externa/i.test(
        input,
      )
    ) {
      keywords.push("python-execution");
    }

    // Database keywords
    if (/salvar|buscar|banco|database|tabela|query|sql|supabase/i.test(input)) {
      keywords.push("database");
    }

    // Image processing keywords
    if (/imagem|foto|gerar|editar|filtro|resize|upload/i.test(input)) {
      keywords.push("image-processing");
    }

    // File processing keywords
    if (/arquivo|file|pdf|excel|documento|importar|exportar/i.test(input)) {
      keywords.push("file-processing");
    }

    return keywords;
  }

  private detectIntent(input: string): string {
    if (/criar|gerar|novo/i.test(input)) return "CREATE";
    if (/buscar|listar|encontrar|pesquisar/i.test(input)) return "READ";
    if (/atualizar|editar|modificar/i.test(input)) return "UPDATE";
    if (/deletar|remover|excluir/i.test(input)) return "DELETE";
    if (/automatizar|executar|rodar/i.test(input)) return "AUTOMATE";
    return "UNKNOWN";
  }

  private estimateComplexity(input: string): number {
    let complexity = 1;

    if (input.length > 100) complexity += 1;
    if (/e |então |depois |seguida/i.test(input)) complexity += 2; // Multi-step
    if (/se |caso |quando/i.test(input)) complexity += 1; // Conditional
    if (/todos |cada |para cada/i.test(input)) complexity += 2; // Loop

    return Math.min(complexity, 10);
  }

  private matchCapabilities(keywords: string[]): string[] {
    const matches: string[] = [];

    for (const [name, module] of this.moduleRegistry) {
      for (const keyword of keywords) {
        if (
          module.capabilities.some(
            (cap) => cap.includes(keyword) || keyword.includes(cap),
          )
        ) {
          matches.push(name);
          break;
        }
      }
    }

    return matches;
  }

  private makeDecision(analysis: any): TaskDecision {
    const { keywords, intent, complexity, capabilities } = analysis;

    // Lógica de decisão inteligente
    let taskType = TaskType.INTERNAL_TOOLS;
    let confidence = 0.5;
    let reasoning = "";
    let fallbackOptions: TaskType[] = [];
    let requiredModules: string[] = capabilities;

    // Browser automation
    if (keywords.includes("browser-automation")) {
      taskType = TaskType.BROWSER_AUTOMATION;
      confidence = 0.9;
      reasoning = "Requisição envolve automação de navegador";
      fallbackOptions = [TaskType.PYTHON_EXECUTION, TaskType.INTERNAL_TOOLS];
    }
    // Python execution
    else if (
      keywords.includes("python-execution") ||
      keywords.includes("image-processing")
    ) {
      taskType = TaskType.PYTHON_EXECUTION;
      confidence = 0.85;
      reasoning = "Requisição requer processamento Python";
      fallbackOptions = [TaskType.INTERNAL_TOOLS];
    }
    // Hybrid (multiple keywords)
    else if (keywords.length > 2) {
      taskType = TaskType.HYBRID;
      confidence = 0.8;
      reasoning = "Requisição requer múltiplas ferramentas";
      fallbackOptions = [
        TaskType.PYTHON_EXECUTION,
        TaskType.BROWSER_AUTOMATION,
      ];
    }

    return {
      taskType,
      confidence,
      reasoning,
      fallbackOptions,
      estimatedTime: complexity * 3000,
      requiredModules,
    };
  }

  // ==================== CRIAÇÃO DE PLANO DE EXECUÇÃO ====================

  public createExecutionPlan(
    request: UserRequest,
    decision: TaskDecision,
  ): ExecutionPlan {
    const steps: ExecutionStep[] = [];
    let stepCounter = 0;

    if (decision.taskType === TaskType.HYBRID) {
      // Criar steps para execução híbrida
      for (const module of decision.requiredModules) {
        steps.push(this.createStep(++stepCounter, module, request));
      }
    } else {
      // Criar step único
      const primaryModule = decision.requiredModules[0] || "internal-tools";
      steps.push(this.createStep(++stepCounter, primaryModule, request));
    }

    const fallbackStrategies = this.createFallbackStrategies(decision);

    return {
      steps,
      totalSteps: steps.length,
      estimatedDuration: decision.estimatedTime,
      fallbackStrategies,
    };
  }

  private createStep(
    order: number,
    module: string,
    request: UserRequest,
  ): ExecutionStep {
    return {
      id: `step-${order}-${Date.now()}`,
      order,
      action: `execute-${module}`,
      taskType:
        this.moduleRegistry.get(module)?.type || TaskType.INTERNAL_TOOLS,
      module,
      parameters: { input: request.input, context: request.context },
      expectedOutput: null,
      timeout: this.config.timeout,
      retryCount: 0,
      maxRetries: this.config.maxRetries,
    };
  }

  private createFallbackStrategies(decision: TaskDecision): FallbackStrategy[] {
    return decision.fallbackOptions.map((taskType, index) => ({
      triggerCondition: "execution_failed",
      alternativeTaskType: taskType,
      alternativeModule: this.findModuleByType(taskType),
      priority: index + 1,
    }));
  }

  private findModuleByType(taskType: TaskType): string {
    for (const [name, module] of this.moduleRegistry) {
      if (module.type === taskType) return name;
    }
    return "internal-tools";
  }

  // ==================== EXECUÇÃO DE TAREFAS ====================

  public async execute(request: UserRequest): Promise<ExecutionResult[]> {
    this.memoryContext.currentTask = request;
    this.emit("execution:started", request);

    try {
      const decision = await this.analyzeRequest(request);
      const plan = this.createExecutionPlan(request, decision);
      const results: ExecutionResult[] = [];

      for (const step of plan.steps) {
        const result = await this.executeStep(step, plan.fallbackStrategies);
        results.push(result);

        if (
          result.status === ExecutionStatus.FAILED &&
          !this.config.fallbackEnabled
        ) {
          break;
        }
      }

      this.memoryContext.history.push(...results);
      this.emit("execution:completed", results);

      return results;
    } catch (error) {
      this.log(`Erro na execução: ${error}`, "error");
      this.emit("execution:error", error);
      throw error;
    }
  }

  private async executeStep(
    step: ExecutionStep,
    fallbackStrategies: FallbackStrategy[],
  ): Promise<ExecutionResult> {
    const startTime = Date.now();
    let currentStep = step;
    let fallbackUsed = false;

    while (currentStep.retryCount <= currentStep.maxRetries) {
      try {
        this.emit("step:executing", currentStep);

        const output = await this.executeModule(currentStep);

        return {
          stepId: currentStep.id,
          status: ExecutionStatus.SUCCESS,
          output,
          executionTime: Date.now() - startTime,
          retriesUsed: currentStep.retryCount,
          fallbackUsed,
        };
      } catch (error: any) {
        currentStep.retryCount++;
        this.log(`Erro no step ${currentStep.id}: ${error.message}`, "warn");

        if (currentStep.retryCount <= currentStep.maxRetries) {
          this.emit("step:retrying", {
            step: currentStep,
            attempt: currentStep.retryCount,
          });
          await this.sleep(1000 * currentStep.retryCount);
          continue;
        }

        // Tentar fallback
        if (this.config.fallbackEnabled && fallbackStrategies.length > 0) {
          const fallback = fallbackStrategies.shift();
          if (fallback) {
            this.log(`Ativando fallback: ${fallback.alternativeModule}`);
            currentStep = this.createStep(
              currentStep.order,
              fallback.alternativeModule,
              { input: currentStep.parameters.input } as any,
            );
            fallbackUsed = true;
            continue;
          }
        }

        // Falha definitiva
        this.recordError(error.message);
        return {
          stepId: currentStep.id,
          status: ExecutionStatus.FAILED,
          error: error.message,
          executionTime: Date.now() - startTime,
          retriesUsed: currentStep.retryCount,
          fallbackUsed,
        };
      }
    }

    throw new Error("Máximo de tentativas excedido");
  }

  private async executeModule(step: ExecutionStep): Promise<any> {
    const module = this.moduleRegistry.get(step.module);

    if (!module) {
      throw new Error(`Módulo não encontrado: ${step.module}`);
    }

    // Emitir evento para executores externos
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout na execução do módulo"));
      }, step.timeout);

      this.emit("module:execute", {
        module: step.module,
        type: step.taskType,
        parameters: step.parameters,
        onSuccess: (output: any) => {
          clearTimeout(timeout);
          resolve(output);
        },
        onError: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });
    });
  }

  // ==================== GESTÃO DE ERROS ====================

  private recordError(error: string): void {
    const existing = this.memoryContext.errorPatterns.find(
      (p) => p.error === error,
    );

    if (existing) {
      existing.frequency++;
      existing.lastOccurrence = Date.now();
    } else {
      this.memoryContext.errorPatterns.push({
        error,
        frequency: 1,
        lastOccurrence: Date.now(),
      });
    }

    if (this.config.learningEnabled) {
      this.learnFromError(error);
    }
  }

  private learnFromError(error: string): void {
    // Implementar machine learning para padrões de erro
    this.log(`Aprendendo com erro: ${error}`);
  }

  // ==================== FILA DE TAREFAS ====================

  public enqueue(request: UserRequest): void {
    this.queue.push(request);
    this.emit("queue:added", request);
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      await this.execute(request);
    }

    this.isProcessing = false;
  }

  // ==================== UTILITÁRIOS ====================

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private log(
    message: string,
    level: "info" | "warn" | "error" = "info",
  ): void {
    if (this.config.debugMode) {
      console[level](`[CoreAI] ${message}`);
    }
    this.emit("log", { level, message, timestamp: Date.now() });
  }

  // ==================== GETTERS ====================

  public getMemory(): MemoryContext {
    return { ...this.memoryContext };
  }

  public getStats(): any {
    const history = this.memoryContext.history;
    const successCount = history.filter(
      (h) => h.status === ExecutionStatus.SUCCESS,
    ).length;
    const failCount = history.filter(
      (h) => h.status === ExecutionStatus.FAILED,
    ).length;

    return {
      totalExecutions: history.length,
      successRate: history.length > 0 ? successCount / history.length : 0,
      failureRate: history.length > 0 ? failCount / history.length : 0,
      avgExecutionTime:
        history.reduce((sum, h) => sum + h.executionTime, 0) / history.length ||
        0,
      topErrors: this.memoryContext.errorPatterns
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 5),
    };
  }

  public reset(): void {
    this.memoryContext = this.initializeMemory();
    this.queue = [];
    this.isProcessing = false;
    this.emit("core:reset");
  }
}

// ==================== CONFIGURAÇÃO ====================

export interface CoreConfig {
  maxRetries: number;
  fallbackEnabled: boolean;
  learningEnabled: boolean;
  parallelExecution: boolean;
  timeout: number;
  debugMode: boolean;
}

// ==================== FACTORY ====================

export function createCoreAI(config?: Partial<CoreConfig>): CoreAI {
  return new CoreAI(config);
}

// ==================== EXPORTS ====================

export default CoreAI;

// Re-exports de tipos para compatibilidade com Rollup
export type {
  UserRequest,
  TaskDecision,
  ExecutionPlan,
  ExecutionResult,
  CoreConfig,
  ExecutionStep,
  FallbackStrategy,
  MemoryContext,
  ErrorPattern,
  ModuleRegistry,
};
