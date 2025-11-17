/**
 * BROWSER AUTOMATION CONTROLLER
 * Sistema de Automação do Navegador via Extensão Chrome
 * Integração entre Core IA e Extensão do Navegador
 */

import { EventEmitter } from "events";

// ==================== TIPOS E INTERFACES ====================

export enum BrowserActionType {
  NAVIGATE = "NAVIGATE",
  CLICK = "CLICK",
  TYPE = "TYPE",
  SELECT = "SELECT",
  SCROLL = "SCROLL",
  WAIT = "WAIT",
  EXTRACT = "EXTRACT",
  SCREENSHOT = "SCREENSHOT",
  EXECUTE_SCRIPT = "EXECUTE_SCRIPT",
  SUBMIT_FORM = "SUBMIT_FORM",
  HOVER = "HOVER",
  DRAG_DROP = "DRAG_DROP",
  UPLOAD_FILE = "UPLOAD_FILE",
  SWITCH_TAB = "SWITCH_TAB",
  SWITCH_FRAME = "SWITCH_FRAME",
  BACK = "BACK",
  FORWARD = "FORWARD",
  REFRESH = "REFRESH",
}

export enum SelectorType {
  CSS = "CSS",
  XPATH = "XPATH",
  TEXT = "TEXT",
  ID = "ID",
  CLASS = "CLASS",
  NAME = "NAME",
  TAG = "TAG",
  ATTRIBUTE = "ATTRIBUTE",
  VISUAL = "VISUAL",
}

export enum AutomationStatus {
  PENDING = "PENDING",
  RUNNING = "RUNNING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  ELEMENT_NOT_FOUND = "ELEMENT_NOT_FOUND",
  TIMEOUT = "TIMEOUT",
  RETRYING = "RETRYING",
}

export interface BrowserCommand {
  id: string;
  action: BrowserActionType;
  selector?: ElementSelector;
  value?: any;
  options?: CommandOptions;
  timeout?: number;
  retries?: number;
  fallbackSelectors?: ElementSelector[];
}

export interface ElementSelector {
  type: SelectorType;
  value: string;
  fallbacks?: string[];
  waitForVisible?: boolean;
  waitForClickable?: boolean;
  index?: number;
}

export interface CommandOptions {
  waitAfter?: number;
  waitBefore?: number;
  screenshot?: boolean;
  validateSuccess?: (result: any) => boolean;
  errorOnFail?: boolean;
  scrollIntoView?: boolean;
  clearBefore?: boolean;
  force?: boolean;
  delay?: number;
  attributes?: string[];
}

export interface AutomationPlan {
  id: string;
  name: string;
  description: string;
  steps: BrowserCommand[];
  variables?: Record<string, any>;
  conditions?: PlanCondition[];
  errorHandling?: ErrorHandlingStrategy;
}

export interface PlanCondition {
  step: number;
  condition: string;
  action: "skip" | "retry" | "abort" | "branch";
  branchTo?: number;
}

export interface ErrorHandlingStrategy {
  maxRetries: number;
  retryDelay: number;
  fallbackPlan?: AutomationPlan;
  onError?: (error: AutomationError) => void;
  continueOnError?: boolean;
}

export interface AutomationResult {
  commandId: string;
  status: AutomationStatus;
  output?: any;
  error?: string;
  screenshot?: string;
  executionTime: number;
  retriesUsed: number;
  elementFound?: boolean;
  dom?: any;
}

export interface AutomationError {
  command: BrowserCommand;
  error: string;
  screenshot?: string;
  dom?: string;
  suggestions?: string[];
  alternativeSelectors?: ElementSelector[];
}

export interface ExtensionConnection {
  connected: boolean;
  tabId?: number;
  windowId?: number;
  url?: string;
  lastPing?: number;
}

export interface ScrapingConfig {
  selectors: Record<string, ElementSelector>;
  pagination?: PaginationConfig;
  multiPage?: boolean;
  maxPages?: number;
  delay?: number;
  output?: "json" | "csv" | "array";
}

export interface PaginationConfig {
  nextButtonSelector: ElementSelector;
  hasNextCondition?: string;
  maxPages?: number;
  delay?: number;
}

export interface FormData {
  fields: Record<string, FormField>;
  submitButton?: ElementSelector;
  validateBefore?: boolean;
  waitAfterSubmit?: number;
}

export interface FormField {
  selector: ElementSelector;
  value: any;
  type?: "text" | "select" | "checkbox" | "radio" | "file" | "textarea";
  validation?: string;
}

// ==================== BROWSER CONTROLLER CLASS ====================

export class BrowserAutomationController extends EventEmitter {
  private connection: ExtensionConnection;
  private commandQueue: BrowserCommand[] = [];
  private isExecuting: boolean = false;
  private config: ControllerConfig;
  private messageHandlers: Map<string, (response: any) => void> = new Map();

  constructor(config?: Partial<ControllerConfig>) {
    super();
    this.config = {
      extensionId: config?.extensionId || "default-extension-id",
      defaultTimeout: config?.defaultTimeout || 30000,
      maxRetries: config?.maxRetries || 3,
      retryDelay: config?.retryDelay || 1000,
      screenshotOnError: config?.screenshotOnError ?? true,
      debugMode: config?.debugMode ?? false,
      waitForExtension: config?.waitForExtension ?? true,
    };

    this.connection = {
      connected: false,
    };

    this.initializeConnection();
  }

  // ==================== CONEXÃO COM EXTENSÃO ====================

  private initializeConnection(): void {
    if (typeof window === "undefined") {
      this.log("Ambiente não é navegador, conexão simulada", "warn");
      return;
    }

    window.addEventListener("message", this.handleExtensionMessage.bind(this));

    if (this.config.waitForExtension) {
      this.waitForExtension();
    }
  }

  private async waitForExtension(timeout: number = 10000): Promise<void> {
    const startTime = Date.now();

    while (!this.connection.connected && Date.now() - startTime < timeout) {
      await this.pingExtension();
      await this.sleep(500);
    }

    if (!this.connection.connected) {
      this.log("Extensão não respondeu dentro do timeout", "error");
      throw new Error("Extensão não conectada");
    }
  }

  private async pingExtension(): Promise<void> {
    try {
      const response = await this.sendToExtension({ type: "PING" });
      if (response?.pong) {
        this.connection.connected = true;
        this.connection.lastPing = Date.now();
        this.emit("extension:connected");
        this.log("Extensão conectada com sucesso");
      }
    } catch (error) {
      // Ignorar erro de ping
    }
  }

  private handleExtensionMessage(event: MessageEvent): void {
    if (event.data?.source !== "syncads-extension") return;

    const { messageId, type, payload, error } = event.data;

    if (type === "PONG") {
      this.connection.connected = true;
      this.connection.lastPing = Date.now();
    }

    if (messageId && this.messageHandlers.has(messageId)) {
      const handler = this.messageHandlers.get(messageId)!;
      handler(error ? { error } : payload);
      this.messageHandlers.delete(messageId);
    }

    this.emit("extension:message", event.data);
  }

  private sendToExtension(message: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const messageId = this.generateMessageId();
      const timeout = setTimeout(() => {
        this.messageHandlers.delete(messageId);
        reject(new Error("Timeout ao comunicar com extensão"));
      }, this.config.defaultTimeout);

      this.messageHandlers.set(messageId, (response) => {
        clearTimeout(timeout);
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });

      window.postMessage(
        {
          source: "syncads-core",
          messageId,
          ...message,
        },
        "*",
      );
    });
  }

  // ==================== COMANDOS BÁSICOS ====================

  public async navigate(
    url: string,
    options?: { waitUntil?: "load" | "domcontentloaded" | "networkidle" },
  ): Promise<AutomationResult> {
    const command: BrowserCommand = {
      id: this.generateCommandId(),
      action: BrowserActionType.NAVIGATE,
      value: url,
      options: options as any,
      timeout: this.config.defaultTimeout,
    };

    return this.executeCommand(command);
  }

  public async click(
    selector: ElementSelector,
    options?: CommandOptions,
  ): Promise<AutomationResult> {
    const command: BrowserCommand = {
      id: this.generateCommandId(),
      action: BrowserActionType.CLICK,
      selector,
      options,
      timeout: this.config.defaultTimeout,
      retries: this.config.maxRetries,
    };

    return this.executeCommand(command);
  }

  public async type(
    selector: ElementSelector,
    text: string,
    options?: CommandOptions,
  ): Promise<AutomationResult> {
    const command: BrowserCommand = {
      id: this.generateCommandId(),
      action: BrowserActionType.TYPE,
      selector,
      value: text,
      options: { ...options, clearBefore: options?.clearBefore ?? true },
      timeout: this.config.defaultTimeout,
      retries: this.config.maxRetries,
    };

    return this.executeCommand(command);
  }

  public async select(
    selector: ElementSelector,
    value: string | string[],
    options?: CommandOptions,
  ): Promise<AutomationResult> {
    const command: BrowserCommand = {
      id: this.generateCommandId(),
      action: BrowserActionType.SELECT,
      selector,
      value,
      options,
      timeout: this.config.defaultTimeout,
      retries: this.config.maxRetries,
    };

    return this.executeCommand(command);
  }

  public async extract(
    selector: ElementSelector,
    attributes?: string[],
  ): Promise<AutomationResult> {
    const command: BrowserCommand = {
      id: this.generateCommandId(),
      action: BrowserActionType.EXTRACT,
      selector,
      options: { attributes },
      timeout: this.config.defaultTimeout,
    };

    return this.executeCommand(command);
  }

  public async screenshot(
    fullPage: boolean = false,
  ): Promise<AutomationResult> {
    const command: BrowserCommand = {
      id: this.generateCommandId(),
      action: BrowserActionType.SCREENSHOT,
      value: { fullPage },
      timeout: this.config.defaultTimeout,
    };

    return this.executeCommand(command);
  }

  public async executeScript(
    script: string,
    args?: any[],
  ): Promise<AutomationResult> {
    const command: BrowserCommand = {
      id: this.generateCommandId(),
      action: BrowserActionType.EXECUTE_SCRIPT,
      value: { script, args },
      timeout: this.config.defaultTimeout,
    };

    return this.executeCommand(command);
  }

  public async wait(ms: number): Promise<AutomationResult> {
    const command: BrowserCommand = {
      id: this.generateCommandId(),
      action: BrowserActionType.WAIT,
      value: ms,
      timeout: ms + 1000,
    };

    return this.executeCommand(command);
  }

  // ==================== COMANDOS AVANÇADOS ====================

  public async fillForm(formData: FormData): Promise<AutomationResult[]> {
    const results: AutomationResult[] = [];

    for (const [fieldName, field] of Object.entries(formData.fields)) {
      try {
        let result: AutomationResult;

        switch (field.type) {
          case "select":
            result = await this.select(field.selector, field.value);
            break;
          case "checkbox":
          case "radio":
            result = await this.click(field.selector);
            break;
          case "file":
            result = await this.uploadFile(field.selector, field.value);
            break;
          default:
            result = await this.type(field.selector, field.value);
        }

        results.push(result);
        this.emit("form:field-filled", { fieldName, result });
      } catch (error: any) {
        this.log(
          `Erro ao preencher campo ${fieldName}: ${error.message}`,
          "error",
        );
        results.push({
          commandId: this.generateCommandId(),
          status: AutomationStatus.FAILED,
          error: error.message,
          executionTime: 0,
          retriesUsed: 0,
        });
      }
    }

    if (formData.submitButton) {
      const submitResult = await this.click(formData.submitButton, {
        waitAfter: formData.waitAfterSubmit,
      });
      results.push(submitResult);
    }

    return results;
  }

  public async scrape(config: ScrapingConfig): Promise<any[]> {
    const allData: any[] = [];
    let currentPage = 1;
    const maxPages = config.maxPages || 10;

    while (currentPage <= maxPages) {
      try {
        // Extrair dados da página atual
        const pageData: any = {};

        for (const [key, selector] of Object.entries(config.selectors)) {
          const result = await this.extract(
            selector,
            config.output === "json"
              ? ["textContent", "href", "src"]
              : undefined,
          );
          if (result.status === AutomationStatus.SUCCESS) {
            pageData[key] = result.output;
          }
        }

        allData.push(pageData);
        this.emit("scrape:page-completed", {
          page: currentPage,
          data: pageData,
        });

        // Verificar se há próxima página
        if (!config.pagination || currentPage >= maxPages) break;

        // Tentar ir para próxima página
        const nextResult = await this.click(
          config.pagination.nextButtonSelector,
          {
            waitAfter: config.pagination.delay || 2000,
          },
        );

        if (nextResult.status !== AutomationStatus.SUCCESS) break;

        currentPage++;
      } catch (error: any) {
        this.log(
          `Erro no scraping página ${currentPage}: ${error.message}`,
          "error",
        );
        break;
      }
    }

    this.emit("scrape:completed", {
      totalPages: currentPage,
      totalItems: allData.length,
    });
    return allData;
  }

  public async uploadFile(
    selector: ElementSelector,
    filePath: string,
  ): Promise<AutomationResult> {
    const command: BrowserCommand = {
      id: this.generateCommandId(),
      action: BrowserActionType.UPLOAD_FILE,
      selector,
      value: filePath,
      timeout: this.config.defaultTimeout,
    };

    return this.executeCommand(command);
  }

  public async hover(selector: ElementSelector): Promise<AutomationResult> {
    const command: BrowserCommand = {
      id: this.generateCommandId(),
      action: BrowserActionType.HOVER,
      selector,
      timeout: this.config.defaultTimeout,
    };

    return this.executeCommand(command);
  }

  // ==================== PLANOS DE AUTOMAÇÃO ====================

  public async executePlan(plan: AutomationPlan): Promise<AutomationResult[]> {
    this.log(`Executando plano: ${plan.name}`);
    this.emit("plan:started", plan);

    const results: AutomationResult[] = [];
    let currentStep = 0;

    while (currentStep < plan.steps.length) {
      const command = plan.steps[currentStep];

      try {
        // Verificar condições
        if (plan.conditions) {
          const condition = plan.conditions.find((c) => c.step === currentStep);
          if (condition) {
            const shouldContinue = await this.evaluateCondition(
              condition,
              results,
            );
            if (!shouldContinue) {
              if (condition.action === "skip") {
                currentStep++;
                continue;
              } else if (condition.action === "abort") {
                break;
              } else if (
                condition.action === "branch" &&
                condition.branchTo !== undefined
              ) {
                currentStep = condition.branchTo;
                continue;
              }
            }
          }
        }

        // Executar comando
        const result = await this.executeCommand(command);
        results.push(result);

        this.emit("plan:step-completed", { step: currentStep, result });

        // Verificar falha
        if (result.status === AutomationStatus.FAILED) {
          if (!plan.errorHandling?.continueOnError) {
            this.log(`Plano falhou no passo ${currentStep}`, "error");

            if (plan.errorHandling?.fallbackPlan) {
              this.log("Executando plano de fallback");
              return this.executePlan(plan.errorHandling.fallbackPlan);
            }

            break;
          }
        }

        currentStep++;
      } catch (error: any) {
        this.log(`Erro no passo ${currentStep}: ${error.message}`, "error");

        results.push({
          commandId: command.id,
          status: AutomationStatus.FAILED,
          error: error.message,
          executionTime: 0,
          retriesUsed: 0,
        });

        if (!plan.errorHandling?.continueOnError) break;
        currentStep++;
      }
    }

    this.emit("plan:completed", { plan, results });
    return results;
  }

  private async evaluateCondition(
    condition: PlanCondition,
    results: AutomationResult[],
  ): Promise<boolean> {
    // Implementar lógica de avaliação de condições
    // Por enquanto, sempre retorna true
    return true;
  }

  public createPlan(name: string, description: string): PlanBuilder {
    return new PlanBuilder(name, description);
  }

  // ==================== EXECUÇÃO DE COMANDOS ====================

  private async executeCommand(
    command: BrowserCommand,
  ): Promise<AutomationResult> {
    const startTime = Date.now();
    let retries = 0;
    const maxRetries = command.retries ?? this.config.maxRetries;

    this.emit("command:executing", command);

    while (retries <= maxRetries) {
      try {
        // Wait before
        if (command.options?.waitBefore) {
          await this.sleep(command.options.waitBefore);
        }

        // Executar comando na extensão
        const response = await this.sendToExtension({
          type: "EXECUTE_COMMAND",
          payload: command,
        });

        // Wait after
        if (command.options?.waitAfter) {
          await this.sleep(command.options.waitAfter);
        }

        // Validar sucesso
        if (
          command.options?.validateSuccess &&
          !command.options.validateSuccess(response)
        ) {
          throw new Error("Validação de sucesso falhou");
        }

        const result: AutomationResult = {
          commandId: command.id,
          status: AutomationStatus.SUCCESS,
          output: response.data,
          executionTime: Date.now() - startTime,
          retriesUsed: retries,
          elementFound: response.elementFound,
        };

        this.emit("command:success", result);
        return result;
      } catch (error: any) {
        retries++;
        this.log(
          `Erro no comando ${command.action}: ${error.message} (tentativa ${retries}/${maxRetries})`,
          "warn",
        );

        if (retries <= maxRetries) {
          // Tentar fallback selectors
          if (
            command.fallbackSelectors &&
            command.fallbackSelectors.length > 0
          ) {
            const fallbackSelector = command.fallbackSelectors.shift();
            if (fallbackSelector) {
              command.selector = fallbackSelector;
              this.log(
                `Tentando selector alternativo: ${fallbackSelector.value}`,
              );
              continue;
            }
          }

          // Delay antes de retry
          await this.sleep(this.config.retryDelay * retries);
          continue;
        }

        // Falha definitiva
        const screenshot = this.config.screenshotOnError
          ? await this.captureErrorScreenshot()
          : undefined;

        const result: AutomationResult = {
          commandId: command.id,
          status: AutomationStatus.FAILED,
          error: error.message,
          screenshot,
          executionTime: Date.now() - startTime,
          retriesUsed: retries,
        };

        this.emit("command:failed", result);
        return result;
      }
    }

    // Não deveria chegar aqui
    throw new Error("Máximo de tentativas excedido");
  }

  private async captureErrorScreenshot(): Promise<string | undefined> {
    try {
      const result = await this.screenshot(false);
      return result.output;
    } catch {
      return undefined;
    }
  }

  // ==================== HELPERS ====================

  public buildSelector(
    type: SelectorType,
    value: string,
    options?: Partial<ElementSelector>,
  ): ElementSelector {
    return {
      type,
      value,
      waitForVisible: options?.waitForVisible ?? true,
      waitForClickable: options?.waitForClickable ?? false,
      index: options?.index ?? 0,
      fallbacks: options?.fallbacks,
    };
  }

  public async getCurrentUrl(): Promise<string> {
    const response = await this.sendToExtension({ type: "GET_CURRENT_URL" });
    return response.url;
  }

  public async getPageTitle(): Promise<string> {
    const response = await this.sendToExtension({ type: "GET_PAGE_TITLE" });
    return response.title;
  }

  public async getDOM(): Promise<string> {
    const response = await this.sendToExtension({ type: "GET_DOM" });
    return response.dom;
  }

  public isConnected(): boolean {
    return this.connection.connected;
  }

  public getConnection(): ExtensionConnection {
    return { ...this.connection };
  }

  // ==================== UTILITÁRIOS ====================

  private generateCommandId(): string {
    return `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private log(
    message: string,
    level: "info" | "warn" | "error" = "info",
  ): void {
    if (this.config.debugMode) {
      console[level](`[BrowserController] ${message}`);
    }
    this.emit("log", { level, message, timestamp: Date.now() });
  }
}

// ==================== PLAN BUILDER ====================

export class PlanBuilder {
  private plan: AutomationPlan;

  constructor(name: string, description: string) {
    this.plan = {
      id: `plan-${Date.now()}`,
      name,
      description,
      steps: [],
      variables: {},
      conditions: [],
    };
  }

  public navigate(url: string): this {
    this.plan.steps.push({
      id: `step-${this.plan.steps.length}`,
      action: BrowserActionType.NAVIGATE,
      value: url,
      timeout: 30000,
    });
    return this;
  }

  public click(selector: ElementSelector, options?: CommandOptions): this {
    this.plan.steps.push({
      id: `step-${this.plan.steps.length}`,
      action: BrowserActionType.CLICK,
      selector,
      options,
      timeout: 30000,
    });
    return this;
  }

  public type(
    selector: ElementSelector,
    text: string,
    options?: CommandOptions,
  ): this {
    this.plan.steps.push({
      id: `step-${this.plan.steps.length}`,
      action: BrowserActionType.TYPE,
      selector,
      value: text,
      options,
      timeout: 30000,
    });
    return this;
  }

  public extract(selector: ElementSelector, attributes?: string[]): this {
    this.plan.steps.push({
      id: `step-${this.plan.steps.length}`,
      action: BrowserActionType.EXTRACT,
      selector,
      options: { attributes },
      timeout: 30000,
    });
    return this;
  }

  public wait(ms: number): this {
    this.plan.steps.push({
      id: `step-${this.plan.steps.length}`,
      action: BrowserActionType.WAIT,
      value: ms,
      timeout: ms + 1000,
    });
    return this;
  }

  public screenshot(fullPage: boolean = false): this {
    this.plan.steps.push({
      id: `step-${this.plan.steps.length}`,
      action: BrowserActionType.SCREENSHOT,
      value: { fullPage },
      timeout: 10000,
    });
    return this;
  }

  public setVariable(name: string, value: any): this {
    this.plan.variables![name] = value;
    return this;
  }

  public addCondition(condition: PlanCondition): this {
    this.plan.conditions!.push(condition);
    return this;
  }

  public setErrorHandling(strategy: ErrorHandlingStrategy): this {
    this.plan.errorHandling = strategy;
    return this;
  }

  public build(): AutomationPlan {
    return this.plan;
  }
}

// ==================== CONFIGURAÇÃO ====================

export interface ControllerConfig {
  extensionId: string;
  defaultTimeout: number;
  maxRetries: number;
  retryDelay: number;
  screenshotOnError: boolean;
  debugMode: boolean;
  waitForExtension: boolean;
}

// ==================== FACTORY ====================

export function createBrowserController(
  config?: Partial<ControllerConfig>,
): BrowserAutomationController {
  return new BrowserAutomationController(config);
}

// ==================== EXPORTS ====================

export default BrowserAutomationController;

// Re-exports de tipos para compatibilidade com Rollup
export type {
  BrowserCommand,
  ElementSelector,
  AutomationPlan,
  AutomationResult,
  ScrapingConfig,
  FormData,
  ControllerConfig,
  ConnectionInfo,
  ExecutionContext,
  ElementInfo,
  NavigationOptions,
  WaitOptions,
  ScreenshotOptions,
  CommandOptions,
  PlanCondition,
  ErrorHandling,
  PaginationConfig,
  FormField,
};
