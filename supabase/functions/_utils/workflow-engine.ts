// ============================================================================
// WORKFLOW ENGINE - Sistema de Automação em Sequência
// ============================================================================
// Executa sequências complexas de comandos DOM com loops, condicionais e retry
// ============================================================================

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface WorkflowStep {
  id: string;
  type: 'command' | 'condition' | 'loop' | 'wait' | 'extract' | 'variable';
  action?: string;
  params?: Record<string, any>;
  condition?: Condition;
  loop?: Loop;
  onSuccess?: string; // Next step ID on success
  onFailure?: string; // Next step ID on failure
  saveAs?: string; // Save result to variable
  timeout?: number; // Timeout in ms
  retry?: {
    maxAttempts: number;
    delay: number;
    backoff?: 'linear' | 'exponential';
  };
}

export interface Condition {
  type: 'element_exists' | 'text_contains' | 'url_matches' | 'variable_equals' | 'variable_gt' | 'variable_lt';
  selector?: string;
  text?: string;
  url?: string;
  variable?: string;
  value?: any;
  operator?: '==' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'matches';
}

export interface Loop {
  type: 'while' | 'for' | 'forEach';
  condition?: Condition;
  items?: string; // Variable name containing array
  maxIterations: number;
  currentIteration?: number;
  steps: WorkflowStep[];
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  version: string;
  created_by: string;
  created_at: string;
  trigger?: WorkflowTrigger;
  steps: WorkflowStep[];
  variables: Record<string, any>;
  errorHandler?: ErrorHandler;
  metadata?: Record<string, any>;
}

export interface WorkflowTrigger {
  type: 'manual' | 'scheduled' | 'event' | 'webhook';
  schedule?: string; // Cron expression
  event?: string;
  url?: string;
}

export interface ErrorHandler {
  type: 'retry' | 'skip' | 'abort' | 'fallback';
  maxRetries?: number;
  fallbackSteps?: WorkflowStep[];
  notifyOnError?: boolean;
}

export interface WorkflowContext {
  variables: Map<string, any>;
  stepResults: Map<string, any>;
  currentStep: string;
  executionId: string;
  startTime: number;
  logs: WorkflowLog[];
}

export interface WorkflowLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  step?: string;
  message: string;
  data?: any;
}

export interface WorkflowResult {
  success: boolean;
  executionId: string;
  steps: StepResult[];
  duration: number;
  finalContext: Record<string, any>;
  errors?: string[];
}

export interface StepResult {
  stepId: string;
  success: boolean;
  duration: number;
  result?: any;
  error?: string;
  retries?: number;
}

// ============================================================================
// WORKFLOW ENGINE CLASS
// ============================================================================

export class WorkflowEngine {
  private supabase: SupabaseClient;
  private userId: string;
  private deviceId: string;

  constructor(supabase: SupabaseClient, userId: string, deviceId: string) {
    this.supabase = supabase;
    this.userId = userId;
    this.deviceId = deviceId;
  }

  /**
   * Executa um workflow completo
   */
  async execute(workflow: Workflow): Promise<WorkflowResult> {
    const executionId = crypto.randomUUID();
    const context = this.createContext(workflow, executionId);

    this.log(context, 'info', `Iniciando workflow: ${workflow.name}`);

    const startTime = Date.now();
    const results: StepResult[] = [];

    try {
      // Inicializar variáveis
      for (const [key, value] of Object.entries(workflow.variables)) {
        context.variables.set(key, value);
      }

      // Executar steps sequencialmente
      let currentStepId = workflow.steps[0]?.id;

      while (currentStepId) {
        const step = workflow.steps.find(s => s.id === currentStepId);
        if (!step) break;

        context.currentStep = currentStepId;

        try {
          const result = await this.executeStep(step, context, workflow);
          results.push(result);

          if (result.success) {
            this.log(context, 'info', `Step ${step.id} completado com sucesso`);
            currentStepId = step.onSuccess || this.getNextStepId(workflow.steps, currentStepId);
          } else {
            this.log(context, 'warn', `Step ${step.id} falhou: ${result.error}`);
            currentStepId = step.onFailure || null;

            // Error handling
            if (workflow.errorHandler) {
              const handled = await this.handleError(workflow.errorHandler, result.error, context);
              if (!handled) {
                break;
              }
            } else {
              break; // Abort on error if no handler
            }
          }
        } catch (error) {
          this.log(context, 'error', `Erro ao executar step ${step.id}`, error);
          results.push({
            stepId: step.id,
            success: false,
            duration: 0,
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          if (workflow.errorHandler?.type === 'abort') {
            break;
          }
        }
      }

      const duration = Date.now() - startTime;
      const success = results.every(r => r.success);

      this.log(context, 'info', `Workflow ${success ? 'completado' : 'falhou'} em ${duration}ms`);

      return {
        success,
        executionId,
        steps: results,
        duration,
        finalContext: this.contextToObject(context),
        errors: results.filter(r => !r.success).map(r => r.error).filter(Boolean) as string[],
      };
    } catch (error) {
      this.log(context, 'error', 'Erro fatal no workflow', error);

      return {
        success: false,
        executionId,
        steps: results,
        duration: Date.now() - startTime,
        finalContext: this.contextToObject(context),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Executa um step individual
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowContext,
    workflow: Workflow
  ): Promise<StepResult> {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = step.retry?.maxAttempts || 1;
    let lastError: string | undefined;

    while (attempts < maxAttempts) {
      attempts++;

      try {
        let result: any;

        switch (step.type) {
          case 'command':
            result = await this.executeCommand(step, context);
            break;

          case 'condition':
            result = await this.evaluateCondition(step.condition!, context);
            break;

          case 'loop':
            result = await this.executeLoop(step.loop!, context, workflow);
            break;

          case 'wait':
            result = await this.executeWait(step.params?.duration || 1000);
            break;

          case 'extract':
            result = await this.executeExtract(step, context);
            break;

          case 'variable':
            result = await this.executeVariable(step, context);
            break;

          default:
            throw new Error(`Unknown step type: ${step.type}`);
        }

        // Salvar resultado em variável se especificado
        if (step.saveAs) {
          context.variables.set(step.saveAs, result);
          this.log(context, 'debug', `Variable ${step.saveAs} set`, result);
        }

        context.stepResults.set(step.id, result);

        return {
          stepId: step.id,
          success: true,
          duration: Date.now() - startTime,
          result,
          retries: attempts - 1,
        };
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        this.log(context, 'warn', `Step ${step.id} attempt ${attempts} failed`, error);

        if (attempts < maxAttempts) {
          const delay = this.calculateRetryDelay(attempts, step.retry);
          await this.sleep(delay);
        }
      }
    }

    // Todas as tentativas falharam
    return {
      stepId: step.id,
      success: false,
      duration: Date.now() - startTime,
      error: lastError,
      retries: attempts - 1,
    };
  }

  /**
   * Executa comando DOM via extension
   */
  private async executeCommand(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    if (!step.action) {
      throw new Error('Command step requires action');
    }

    // Substituir variáveis nos params
    const params = this.replaceVariables(step.params || {}, context);

    this.log(context, 'debug', `Executing command: ${step.action}`, params);

    // Criar comando na tabela extension_commands
    const { data, error } = await this.supabase
      .from('extension_commands')
      .insert({
        device_id: this.deviceId,
        user_id: this.userId,
        command_type: step.action,
        params: params,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create command: ${error.message}`);
    }

    // Aguardar execução (polling)
    const result = await this.waitForCommandExecution(data.id, step.timeout || 30000);

    return result;
  }

  /**
   * Avalia condição
   */
  private async evaluateCondition(condition: Condition, context: WorkflowContext): Promise<boolean> {
    switch (condition.type) {
      case 'variable_equals':
        const varValue = context.variables.get(condition.variable!);
        return varValue === condition.value;

      case 'variable_gt':
        const gtValue = context.variables.get(condition.variable!);
        return Number(gtValue) > Number(condition.value);

      case 'variable_lt':
        const ltValue = context.variables.get(condition.variable!);
        return Number(ltValue) < Number(condition.value);

      case 'element_exists':
        // Verificar via comando DOM
        const checkResult = await this.executeCommand(
          {
            id: 'condition_check',
            type: 'command',
            action: 'DOM_READ',
            params: { selector: condition.selector },
          },
          context
        );
        return checkResult && checkResult.success;

      case 'text_contains':
        const textResult = await this.executeCommand(
          {
            id: 'text_check',
            type: 'command',
            action: 'READ_TEXT',
            params: { selector: condition.selector },
          },
          context
        );
        return textResult?.text?.includes(condition.text || '');

      case 'url_matches':
        // Implementar verificação de URL
        return true; // Placeholder

      default:
        return false;
    }
  }

  /**
   * Executa loop
   */
  private async executeLoop(
    loop: Loop,
    context: WorkflowContext,
    workflow: Workflow
  ): Promise<any> {
    const results: any[] = [];
    let iteration = 0;

    if (loop.type === 'while') {
      while (iteration < loop.maxIterations) {
        if (loop.condition) {
          const conditionMet = await this.evaluateCondition(loop.condition, context);
          if (!conditionMet) break;
        }

        for (const step of loop.steps) {
          const result = await this.executeStep(step, context, workflow);
          results.push(result);
          if (!result.success) break;
        }

        iteration++;
      }
    } else if (loop.type === 'for') {
      for (let i = 0; i < loop.maxIterations; i++) {
        context.variables.set('iteration', i);

        for (const step of loop.steps) {
          const result = await this.executeStep(step, context, workflow);
          results.push(result);
          if (!result.success) break;
        }
      }
    } else if (loop.type === 'forEach') {
      const items = context.variables.get(loop.items!) as any[];
      if (!Array.isArray(items)) {
        throw new Error(`Variable ${loop.items} is not an array`);
      }

      for (let i = 0; i < Math.min(items.length, loop.maxIterations); i++) {
        context.variables.set('item', items[i]);
        context.variables.set('index', i);

        for (const step of loop.steps) {
          const result = await this.executeStep(step, context, workflow);
          results.push(result);
          if (!result.success) break;
        }
      }
    }

    return {
      iterations: iteration,
      results: results,
    };
  }

  /**
   * Executa wait
   */
  private async executeWait(duration: number): Promise<any> {
    await this.sleep(duration);
    return { waited: duration };
  }

  /**
   * Executa extração de dados
   */
  private async executeExtract(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const extractType = step.params?.type || 'text';
    const selector = step.params?.selector;

    const result = await this.executeCommand(
      {
        id: 'extract',
        type: 'command',
        action: this.getExtractAction(extractType),
        params: { selector },
      },
      context
    );

    return result;
  }

  /**
   * Executa operação de variável
   */
  private async executeVariable(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    const operation = step.params?.operation;
    const name = step.params?.name;
    const value = step.params?.value;

    switch (operation) {
      case 'set':
        context.variables.set(name, value);
        break;
      case 'increment':
        const current = Number(context.variables.get(name) || 0);
        context.variables.set(name, current + 1);
        break;
      case 'append':
        const array = context.variables.get(name) as any[] || [];
        array.push(value);
        context.variables.set(name, array);
        break;
      default:
        throw new Error(`Unknown variable operation: ${operation}`);
    }

    return context.variables.get(name);
  }

  /**
   * Aguarda execução de comando
   */
  private async waitForCommandExecution(commandId: string, timeout: number): Promise<any> {
    const startTime = Date.now();
    const pollInterval = 1000;

    while (Date.now() - startTime < timeout) {
      const { data } = await this.supabase
        .from('extension_commands')
        .select('*')
        .eq('id', commandId)
        .single();

      if (data?.status === 'completed') {
        return data.result;
      }

      if (data?.status === 'failed') {
        throw new Error(data.error || 'Command failed');
      }

      await this.sleep(pollInterval);
    }

    throw new Error('Command execution timeout');
  }

  /**
   * Handle error
   */
  private async handleError(
    handler: ErrorHandler,
    error: string | undefined,
    context: WorkflowContext
  ): Promise<boolean> {
    switch (handler.type) {
      case 'skip':
        this.log(context, 'warn', 'Error skipped, continuing workflow');
        return true;

      case 'abort':
        this.log(context, 'error', 'Error abort, stopping workflow');
        return false;

      case 'retry':
        // Retry handled by executeStep
        return true;

      case 'fallback':
        if (handler.fallbackSteps) {
          this.log(context, 'info', 'Executing fallback steps');
          // Execute fallback steps
          return true;
        }
        return false;

      default:
        return false;
    }
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  private createContext(workflow: Workflow, executionId: string): WorkflowContext {
    return {
      variables: new Map(),
      stepResults: new Map(),
      currentStep: '',
      executionId,
      startTime: Date.now(),
      logs: [],
    };
  }

  private log(context: WorkflowContext, level: WorkflowLog['level'], message: string, data?: any) {
    context.logs.push({
      timestamp: Date.now(),
      level,
      step: context.currentStep,
      message,
      data,
    });

    console.log(`[${level.toUpperCase()}] [${context.currentStep || 'WORKFLOW'}] ${message}`, data || '');
  }

  private contextToObject(context: WorkflowContext): Record<string, any> {
    return {
      variables: Object.fromEntries(context.variables),
      stepResults: Object.fromEntries(context.stepResults),
      logs: context.logs,
    };
  }

  private replaceVariables(params: Record<string, any>, context: WorkflowContext): Record<string, any> {
    const replaced: Record<string, any> = {};

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
        const varName = value.slice(2, -1);
        replaced[key] = context.variables.get(varName);
      } else if (typeof value === 'object' && value !== null) {
        replaced[key] = this.replaceVariables(value, context);
      } else {
        replaced[key] = value;
      }
    }

    return replaced;
  }

  private getNextStepId(steps: WorkflowStep[], currentId: string): string | null {
    const currentIndex = steps.findIndex(s => s.id === currentId);
    if (currentIndex >= 0 && currentIndex < steps.length - 1) {
      return steps[currentIndex + 1].id;
    }
    return null;
  }

  private calculateRetryDelay(attempt: number, retry?: WorkflowStep['retry']): number {
    if (!retry) return 1000;

    const baseDelay = retry.delay || 1000;

    if (retry.backoff === 'exponential') {
      return baseDelay * Math.pow(2, attempt - 1);
    }

    return baseDelay * attempt;
  }

  private getExtractAction(type: string): string {
    const mapping: Record<string, string> = {
      text: 'READ_TEXT',
      links: 'EXTRACT_LINKS',
      images: 'EXTRACT_IMAGES',
      emails: 'EXTRACT_EMAILS',
      table: 'EXTRACT_TABLE',
      all: 'EXTRACT_ALL',
    };

    return mapping[type] || 'READ_TEXT';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// WORKFLOW TEMPLATES
// ============================================================================

export const WorkflowTemplates = {
  /**
   * Template: Login simples
   */
  simpleLogin: (email: string, password: string): Workflow => ({
    id: crypto.randomUUID(),
    name: 'Simple Login',
    description: 'Login básico em qualquer site',
    version: '1.0.0',
    created_by: 'system',
    created_at: new Date().toISOString(),
    variables: { email, password },
    steps: [
      {
        id: 'step1',
        type: 'command',
        action: 'DOM_FILL',
        params: { selector: 'input[type="email"]', value: '${email}' },
      },
      {
        id: 'step2',
        type: 'command',
        action: 'DOM_FILL',
        params: { selector: 'input[type="password"]', value: '${password}' },
      },
      {
        id: 'step3',
        type: 'command',
        action: 'DOM_CLICK',
        params: { selector: 'button[type="submit"]' },
      },
    ],
  }),

  /**
   * Template: Scraping com loop
   */
  scrapingLoop: (maxPages: number): Workflow => ({
    id: crypto.randomUUID(),
    name: 'Scraping with Pagination',
    description: 'Extrai dados de múltiplas páginas',
    version: '1.0.0',
    created_by: 'system',
    created_at: new Date().toISOString(),
    variables: { results: [], currentPage: 0 },
    steps: [
      {
        id: 'loop',
        type: 'loop',
        loop: {
          type: 'for',
          maxIterations: maxPages,
          steps: [
            {
              id: 'extract',
              type: 'extract',
              params: { type: 'all' },
              saveAs: 'pageData',
            },
            {
              id: 'save',
              type: 'variable',
              params: { operation: 'append', name: 'results', value: '${pageData}' },
            },
            {
              id: 'next',
              type: 'command',
              action: 'DOM_CLICK',
              params: { selector: '.next-page' },
            },
            {
              id: 'wait',
              type: 'wait',
              params: { duration: 2000 },
            },
          ],
        },
      },
    ],
  }),

  /**
   * Template: Form filling com validação
   */
  formWithValidation: (formData: Record<string, any>): Workflow => ({
    id: crypto.randomUUID(),
    name: 'Form with Validation',
    description: 'Preenche formulário e valida',
    version: '1.0.0',
    created_by: 'system',
    created_at: new Date().toISOString(),
    variables: formData,
    steps: [
      {
        id: 'fill',
        type: 'command',
        action: 'FILL_FORM',
        params: { formData },
      },
      {
        id: 'check',
        type: 'condition',
        condition: {
          type: 'element_exists',
          selector: '.error-message',
        },
        onSuccess: 'error',
        onFailure: 'submit',
      },
      {
        id: 'error',
        type: 'command',
        action: 'READ_TEXT',
        params: { selector: '.error-message' },
        saveAs: 'errorMessage',
      },
      {
        id: 'submit',
        type: 'command',
        action: 'FORM_SUBMIT',
        params: { selector: 'form' },
      },
    ],
  }),
};
