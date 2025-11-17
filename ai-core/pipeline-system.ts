/**
 * PIPELINE SYSTEM - Multimodal Processing Pipelines
 * Sistema de pipelines para processar múltiplos tipos de dados (texto, imagem, vídeo, áudio)
 * em sequência ou paralelo, com transformações automáticas
 *
 * Features:
 * - Pipelines sequenciais e paralelos
 * - Suporte multimodal (text, image, video, audio, data)
 * - Transformação automática entre tipos
 * - Cache de resultados intermediários
 * - Validação de tipos
 * - Rollback em caso de erro
 * - Métricas detalhadas
 */

import { EventEmitter } from 'events';
import { PromptModule } from './prompt-library/registry';

// ==================== TIPOS ====================

export enum DataType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  PDF = 'pdf',
  JSON = 'json',
  CSV = 'csv',
  BINARY = 'binary',
  UNKNOWN = 'unknown'
}

export enum PipelineMode {
  SEQUENTIAL = 'sequential',   // Etapas executam em sequência
  PARALLEL = 'parallel',       // Etapas executam em paralelo
  CONDITIONAL = 'conditional', // Etapas condicionais baseadas em resultados
  HYBRID = 'hybrid'           // Mix de sequencial e paralelo
}

export interface PipelineData {
  type: DataType;
  content: any;
  metadata: Record<string, any>;
  source?: string;
  timestamp: number;
}

export interface PipelineStep {
  id: string;
  name: string;
  module?: PromptModule;
  operation: (data: PipelineData) => Promise<PipelineData>;
  inputTypes: DataType[];
  outputType: DataType;
  transform?: (data: PipelineData) => Promise<PipelineData>;
  validate?: (data: PipelineData) => boolean;
  condition?: (previousResults: PipelineData[]) => boolean;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

export interface PipelineConfig {
  mode: PipelineMode;
  steps: PipelineStep[];
  enableCache?: boolean;
  enableRollback?: boolean;
  enableMetrics?: boolean;
  timeout?: number;
  maxRetries?: number;
  validateTypes?: boolean;
  autoTransform?: boolean;
}

export interface PipelineResult {
  success: boolean;
  output: PipelineData | null;
  intermediateResults: Map<string, PipelineData>;
  error?: string;
  executionTime: number;
  stepsExecuted: number;
  stepResults: StepResult[];
  cacheHits: number;
  cacheMisses: number;
}

export interface StepResult {
  stepId: string;
  stepName: string;
  success: boolean;
  input: PipelineData;
  output?: PipelineData;
  error?: string;
  executionTime: number;
  cached: boolean;
  transformed: boolean;
  retries: number;
}

export interface PipelineMetrics {
  totalPipelines: number;
  successfulPipelines: number;
  failedPipelines: number;
  averageExecutionTime: number;
  cacheHitRate: number;
  stepMetrics: Map<string, {
    executions: number;
    successes: number;
    failures: number;
    avgTime: number;
  }>;
}

// ==================== TRANSFORMADORES ====================

class DataTransformer {
  private transformers: Map<string, (data: PipelineData) => Promise<PipelineData>>;

  constructor() {
    this.transformers = new Map();
    this.registerDefaultTransformers();
  }

  private registerDefaultTransformers(): void {
    // TEXT -> IMAGE (gerar imagem de texto)
    this.register(DataType.TEXT, DataType.IMAGE, async (data) => ({
      type: DataType.IMAGE,
      content: await this.textToImage(data.content),
      metadata: { ...data.metadata, transformedFrom: DataType.TEXT },
      timestamp: Date.now()
    }));

    // IMAGE -> TEXT (OCR)
    this.register(DataType.IMAGE, DataType.TEXT, async (data) => ({
      type: DataType.TEXT,
      content: await this.imageToText(data.content),
      metadata: { ...data.metadata, transformedFrom: DataType.IMAGE },
      timestamp: Date.now()
    }));

    // JSON -> CSV
    this.register(DataType.JSON, DataType.CSV, async (data) => ({
      type: DataType.CSV,
      content: await this.jsonToCsv(data.content),
      metadata: { ...data.metadata, transformedFrom: DataType.JSON },
      timestamp: Date.now()
    }));

    // TEXT -> JSON
    this.register(DataType.TEXT, DataType.JSON, async (data) => ({
      type: DataType.JSON,
      content: await this.textToJson(data.content),
      metadata: { ...data.metadata, transformedFrom: DataType.TEXT },
      timestamp: Date.now()
    }));

    // BINARY -> IMAGE
    this.register(DataType.BINARY, DataType.IMAGE, async (data) => ({
      type: DataType.IMAGE,
      content: data.content, // Assume já é imagem em base64
      metadata: { ...data.metadata, transformedFrom: DataType.BINARY },
      timestamp: Date.now()
    }));
  }

  public register(
    fromType: DataType,
    toType: DataType,
    transformer: (data: PipelineData) => Promise<PipelineData>
  ): void {
    const key = `${fromType}->${toType}`;
    this.transformers.set(key, transformer);
  }

  public async transform(data: PipelineData, toType: DataType): Promise<PipelineData> {
    if (data.type === toType) {
      return data;
    }

    const key = `${data.type}->${toType}`;
    const transformer = this.transformers.get(key);

    if (!transformer) {
      throw new Error(`No transformer found from ${data.type} to ${toType}`);
    }

    return await transformer(data);
  }

  public canTransform(fromType: DataType, toType: DataType): boolean {
    const key = `${fromType}->${toType}`;
    return this.transformers.has(key);
  }

  // Implementações básicas de transformação
  private async textToImage(text: string): Promise<string> {
    // Placeholder - integrar com serviço de geração de imagem
    return `data:image/png;base64,${Buffer.from(text).toString('base64')}`;
  }

  private async imageToText(imageBase64: string): Promise<string> {
    // Placeholder - integrar com OCR
    return `[Text extracted from image]`;
  }

  private async jsonToCsv(json: any): Promise<string> {
    if (Array.isArray(json)) {
      const headers = Object.keys(json[0] || {});
      const rows = json.map(obj => headers.map(h => obj[h]).join(','));
      return [headers.join(','), ...rows].join('\n');
    }
    return JSON.stringify(json);
  }

  private async textToJson(text: string): Promise<any> {
    try {
      return JSON.parse(text);
    } catch {
      return { text };
    }
  }
}

// ==================== CACHE SYSTEM ====================

class PipelineCache {
  private cache: Map<string, { data: PipelineData; timestamp: number; ttl: number }>;
  private maxSize: number;
  private defaultTtl: number;

  constructor(maxSize: number = 100, defaultTtl: number = 3600000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTtl = defaultTtl;
  }

  public set(key: string, data: PipelineData, ttl?: number): void {
    // Evict old entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTtl
    });
  }

  public get(key: string): PipelineData | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  public has(key: string): boolean {
    return this.get(key) !== null;
  }

  public clear(): void {
    this.cache.clear();
  }

  public generateKey(stepId: string, input: PipelineData): string {
    const contentHash = this.hashContent(input.content);
    return `${stepId}:${input.type}:${contentHash}`;
  }

  private hashContent(content: any): string {
    const str = typeof content === 'string' ? content : JSON.stringify(content);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}

// ==================== PIPELINE EXECUTOR ====================

export class Pipeline extends EventEmitter {
  private config: Required<PipelineConfig>;
  private transformer: DataTransformer;
  private cache: PipelineCache;
  private metrics: PipelineMetrics;

  constructor(config: PipelineConfig) {
    super();

    this.config = {
      mode: config.mode,
      steps: config.steps,
      enableCache: config.enableCache ?? true,
      enableRollback: config.enableRollback ?? true,
      enableMetrics: config.enableMetrics ?? true,
      timeout: config.timeout || 300000,
      maxRetries: config.maxRetries || 3,
      validateTypes: config.validateTypes ?? true,
      autoTransform: config.autoTransform ?? true,
    };

    this.transformer = new DataTransformer();
    this.cache = new PipelineCache();
    this.metrics = {
      totalPipelines: 0,
      successfulPipelines: 0,
      failedPipelines: 0,
      averageExecutionTime: 0,
      cacheHitRate: 0,
      stepMetrics: new Map(),
    };
  }

  // ==================== MAIN EXECUTION ====================

  public async execute(initialData: PipelineData): Promise<PipelineResult> {
    const startTime = Date.now();
    this.metrics.totalPipelines++;

    const result: PipelineResult = {
      success: false,
      output: null,
      intermediateResults: new Map(),
      executionTime: 0,
      stepsExecuted: 0,
      stepResults: [],
      cacheHits: 0,
      cacheMisses: 0,
    };

    this.emit('pipeline:started', { initialData });

    try {
      let finalOutput: PipelineData | null = null;

      switch (this.config.mode) {
        case PipelineMode.SEQUENTIAL:
          finalOutput = await this.executeSequential(initialData, result);
          break;

        case PipelineMode.PARALLEL:
          finalOutput = await this.executeParallel(initialData, result);
          break;

        case PipelineMode.CONDITIONAL:
          finalOutput = await this.executeConditional(initialData, result);
          break;

        case PipelineMode.HYBRID:
          finalOutput = await this.executeHybrid(initialData, result);
          break;
      }

      result.success = true;
      result.output = finalOutput;
      this.metrics.successfulPipelines++;

      this.emit('pipeline:completed', { result });
    } catch (error: any) {
      result.error = error.message;
      result.success = false;
      this.metrics.failedPipelines++;

      this.emit('pipeline:failed', { error: error.message });

      if (this.config.enableRollback) {
        await this.rollback(result.intermediateResults);
      }
    } finally {
      result.executionTime = Date.now() - startTime;
      this.updateMetrics(result);
    }

    return result;
  }

  // ==================== EXECUTION MODES ====================

  private async executeSequential(
    initialData: PipelineData,
    result: PipelineResult
  ): Promise<PipelineData> {
    let currentData = initialData;

    for (const step of this.config.steps) {
      const stepResult = await this.executeStep(step, currentData, result);

      result.stepResults.push(stepResult);
      result.stepsExecuted++;

      if (!stepResult.success) {
        throw new Error(`Step ${step.name} failed: ${stepResult.error}`);
      }

      currentData = stepResult.output!;
      result.intermediateResults.set(step.id, currentData);
    }

    return currentData;
  }

  private async executeParallel(
    initialData: PipelineData,
    result: PipelineResult
  ): Promise<PipelineData> {
    // Execute all steps in parallel with same input
    const promises = this.config.steps.map(step =>
      this.executeStep(step, initialData, result)
    );

    const stepResults = await Promise.allSettled(promises);

    stepResults.forEach((settled, index) => {
      const step = this.config.steps[index];

      if (settled.status === 'fulfilled') {
        result.stepResults.push(settled.value);
        result.stepsExecuted++;

        if (settled.value.success && settled.value.output) {
          result.intermediateResults.set(step.id, settled.value.output);
        }
      } else {
        result.stepResults.push({
          stepId: step.id,
          stepName: step.name,
          success: false,
          input: initialData,
          error: settled.reason.message,
          executionTime: 0,
          cached: false,
          transformed: false,
          retries: 0,
        });
      }
    });

    // Return last successful output or initial data
    const lastSuccess = result.stepResults.reverse().find(r => r.success);
    return lastSuccess?.output || initialData;
  }

  private async executeConditional(
    initialData: PipelineData,
    result: PipelineResult
  ): Promise<PipelineData> {
    let currentData = initialData;
    const previousResults: PipelineData[] = [initialData];

    for (const step of this.config.steps) {
      // Check condition if exists
      if (step.condition && !step.condition(previousResults)) {
        this.emit('step:skipped', { stepId: step.id, reason: 'condition not met' });
        continue;
      }

      const stepResult = await this.executeStep(step, currentData, result);

      result.stepResults.push(stepResult);
      result.stepsExecuted++;

      if (!stepResult.success) {
        throw new Error(`Step ${step.name} failed: ${stepResult.error}`);
      }

      currentData = stepResult.output!;
      previousResults.push(currentData);
      result.intermediateResults.set(step.id, currentData);
    }

    return currentData;
  }

  private async executeHybrid(
    initialData: PipelineData,
    result: PipelineResult
  ): Promise<PipelineData> {
    // Group steps by dependencies (simplified)
    let currentData = initialData;
    const parallelBatchSize = 3;

    for (let i = 0; i < this.config.steps.length; i += parallelBatchSize) {
      const batch = this.config.steps.slice(i, i + parallelBatchSize);

      if (batch.length === 1) {
        // Sequential execution
        const stepResult = await this.executeStep(batch[0], currentData, result);
        result.stepResults.push(stepResult);
        result.stepsExecuted++;

        if (!stepResult.success) {
          throw new Error(`Step ${batch[0].name} failed: ${stepResult.error}`);
        }

        currentData = stepResult.output!;
        result.intermediateResults.set(batch[0].id, currentData);
      } else {
        // Parallel execution
        const promises = batch.map(step => this.executeStep(step, currentData, result));
        const stepResults = await Promise.all(promises);

        stepResults.forEach((stepResult, idx) => {
          result.stepResults.push(stepResult);
          result.stepsExecuted++;

          if (stepResult.success && stepResult.output) {
            result.intermediateResults.set(batch[idx].id, stepResult.output);
            currentData = stepResult.output; // Last successful
          }
        });
      }
    }

    return currentData;
  }

  // ==================== STEP EXECUTION ====================

  private async executeStep(
    step: PipelineStep,
    input: PipelineData,
    result: PipelineResult
  ): Promise<StepResult> {
    const startTime = Date.now();
    let transformed = false;

    const stepResult: StepResult = {
      stepId: step.id,
      stepName: step.name,
      success: false,
      input,
      executionTime: 0,
      cached: false,
      transformed: false,
      retries: 0,
    };

    this.emit('step:started', { stepId: step.id, stepName: step.name });

    try {
      // Check cache
      if (this.config.enableCache && step.cache !== false) {
        const cacheKey = this.cache.generateKey(step.id, input);
        const cachedData = this.cache.get(cacheKey);

        if (cachedData) {
          stepResult.output = cachedData;
          stepResult.success = true;
          stepResult.cached = true;
          result.cacheHits++;

          this.emit('step:cache-hit', { stepId: step.id });

          stepResult.executionTime = Date.now() - startTime;
          return stepResult;
        }

        result.cacheMisses++;
      }

      // Validate input type
      if (this.config.validateTypes && !step.inputTypes.includes(input.type)) {
        if (this.config.autoTransform) {
          // Try to transform
          const targetType = step.inputTypes[0];
          if (this.transformer.canTransform(input.type, targetType)) {
            input = await this.transformer.transform(input, targetType);
            transformed = true;
            stepResult.transformed = true;

            this.emit('step:transformed', {
              stepId: step.id,
              from: input.type,
              to: targetType,
            });
          } else {
            throw new Error(`Cannot transform from ${input.type} to ${step.inputTypes.join(', ')}`);
          }
        } else {
          throw new Error(`Invalid input type: ${input.type}. Expected: ${step.inputTypes.join(', ')}`);
        }
      }

      // Custom validation
      if (step.validate && !step.validate(input)) {
        throw new Error('Custom validation failed');
      }

      // Execute with retries
      let lastError: Error | null = null;
      const maxRetries = step.retries || this.config.maxRetries;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          stepResult.retries = attempt;

          let output = await this.executeWithTimeout(
            step.operation(input),
            step.timeout || this.config.timeout
          );

          // Apply transform if specified
          if (step.transform) {
            output = await step.transform(output);
          }

          stepResult.output = output;
          stepResult.success = true;

          // Cache result
          if (this.config.enableCache && step.cache !== false) {
            const cacheKey = this.cache.generateKey(step.id, input);
            this.cache.set(cacheKey, output);
          }

          this.emit('step:completed', {
            stepId: step.id,
            stepName: step.name,
            retries: attempt,
          });

          break;
        } catch (error: any) {
          lastError = error;

          if (attempt < maxRetries - 1) {
            this.emit('step:retry', {
              stepId: step.id,
              attempt: attempt + 1,
              error: error.message,
            });

            await this.sleep(Math.pow(2, attempt) * 1000);
          }
        }
      }

      if (!stepResult.success) {
        throw lastError || new Error('Step failed');
      }
    } catch (error: any) {
      stepResult.error = error.message;
      stepResult.success = false;

      this.emit('step:failed', {
        stepId: step.id,
        stepName: step.name,
        error: error.message,
      });
    } finally {
      stepResult.executionTime = Date.now() - startTime;
      this.recordStepMetrics(step.id, stepResult);
    }

    return stepResult;
  }

  // ==================== UTILITIES ====================

  private async executeWithTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeout}ms`)), timeout)
      ),
    ]);
  }

  private async rollback(intermediateResults: Map<string, PipelineData>): Promise<void> {
    this.emit('pipeline:rollback', { results: intermediateResults.size });
    // Placeholder for rollback logic
    intermediateResults.clear();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ==================== METRICS ====================

  private updateMetrics(result: PipelineResult): void {
    const totalTime = this.metrics.averageExecutionTime * (this.metrics.totalPipelines - 1) + result.executionTime;
    this.metrics.averageExecutionTime = totalTime / this.metrics.totalPipelines;

    const totalCacheOps = result.cacheHits + result.cacheMisses;
    if (totalCacheOps > 0) {
      this.metrics.cacheHitRate = result.cacheHits / totalCacheOps;
    }
  }

  private recordStepMetrics(stepId: string, stepResult: StepResult): void {
    if (!this.metrics.stepMetrics.has(stepId)) {
      this.metrics.stepMetrics.set(stepId, {
        executions: 0,
        successes: 0,
        failures: 0,
        avgTime: 0,
      });
    }

    const metrics = this.metrics.stepMetrics.get(stepId)!;
    metrics.executions++;

    if (stepResult.success) {
      metrics.successes++;
    } else {
      metrics.failures++;
    }

    const totalTime = metrics.avgTime * (metrics.executions - 1) + stepResult.executionTime;
    metrics.avgTime = totalTime / metrics.executions;
  }

  public getMetrics(): PipelineMetrics {
    return { ...this.metrics, stepMetrics: new Map(this.metrics.stepMetrics) };
  }

  public clearCache(): void {
    this.cache.clear();
  }

  public registerTransformer(
    fromType: DataType,
    toType: DataType,
    transformer: (data: PipelineData) => Promise<PipelineData>
  ): void {
    this.transformer.register(fromType, toType, transformer);
  }
}

// ==================== BUILDER ====================

export class PipelineBuilder {
  private config: Partial<PipelineConfig> = {
    steps: [],
    mode: PipelineMode.SEQUENTIAL,
  };

  public setMode(mode: PipelineMode): this {
    this.config.mode = mode;
    return this;
  }

  public addStep(step: PipelineStep): this {
    this.config.steps!.push(step);
    return this;
  }

  public enableCache(enable: boolean = true): this {
    this.config.enableCache = enable;
    return this;
  }

  public enableRollback(enable: boolean = true): this {
    this.config.enableRollback = enable;
    return this;
  }

  public setTimeout(timeout: number): this {
    this.config.timeout = timeout;
    return this;
  }

  public build(): Pipeline {
    if (!this.config.steps || this.config.steps.length === 0) {
      throw new Error('Pipeline must have at least one step');
    }

    return new Pipeline(this.config as PipelineConfig);
  }
}

// ==================== EXPORTS ====================

export function createPipeline(config: PipelineConfig): Pipeline {
  return new Pipeline(config);
}

export function createPipelineBuilder(): PipelineBuilder {
  return new PipelineBuilder();
}

export default Pipeline;
