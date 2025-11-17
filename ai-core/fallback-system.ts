/**
 * FALLBACK SYSTEM
 * Sistema avançado de fallback automático para módulos AI
 *
 * Features:
 * - Fallback automático entre módulos similares
 * - Circuit breaker para módulos instáveis
 * - Learning system para melhorar seleção
 * - Histórico de falhas e sucessos
 * - Estratégias múltiplas de fallback
 * - Health scoring dinâmico
 */

import { EventEmitter } from 'events';
import { PromptModule, ModuleCategory } from './prompt-library/registry';

// ==================== TIPOS ====================

export interface FallbackConfig {
  maxAttempts?: number;
  enableCircuitBreaker?: boolean;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
  enableLearning?: boolean;
  enableMetrics?: boolean;
  fallbackStrategy?: FallbackStrategy;
  minSimilarityScore?: number;
}

export enum FallbackStrategy {
  SEQUENTIAL = 'sequential',        // Tenta módulos na ordem de score
  PARALLEL = 'parallel',            // Tenta múltiplos simultaneamente
  ADAPTIVE = 'adaptive',            // Aprende e adapta com base em histórico
  CATEGORY_BASED = 'category_based', // Tenta módulos da mesma categoria
  HYBRID = 'hybrid'                 // Combina múltiplas estratégias
}

export enum CircuitState {
  CLOSED = 'closed',     // Normal - permite requisições
  OPEN = 'open',         // Aberto - bloqueia requisições
  HALF_OPEN = 'half_open' // Teste - permite requisições limitadas
}

export interface ModuleHealth {
  moduleId: string;
  successCount: number;
  failureCount: number;
  totalAttempts: number;
  successRate: number;
  averageResponseTime: number;
  lastUsed: number;
  circuitState: CircuitState;
  consecutiveFailures: number;
  lastFailure: number | null;
}

export interface FallbackAttempt {
  moduleId: string;
  moduleName: string;
  attemptNumber: number;
  startTime: number;
  endTime?: number;
  success: boolean;
  error?: string;
  result?: any;
  executionTime?: number;
  fallbackReason: string;
}

export interface FallbackResult {
  success: boolean;
  finalModule: string | null;
  attempts: FallbackAttempt[];
  totalTime: number;
  result?: any;
  error?: string;
  fallbackChain: string[];
  strategyUsed: FallbackStrategy;
}

export interface SimilarityScore {
  moduleId: string;
  score: number;
  reasons: string[];
  category: ModuleCategory;
}

// ==================== FALLBACK SYSTEM ====================

export class FallbackSystem extends EventEmitter {
  private config: Required<FallbackConfig>;
  private moduleHealth: Map<string, ModuleHealth>;
  private failureHistory: Map<string, FallbackAttempt[]>;
  private categoryGroups: Map<ModuleCategory, string[]>;
  private learningData: Map<string, Map<string, number>>; // task -> module -> success_rate

  constructor(config: Partial<FallbackConfig> = {}) {
    super();

    this.config = {
      maxAttempts: config.maxAttempts || 5,
      enableCircuitBreaker: config.enableCircuitBreaker ?? true,
      circuitBreakerThreshold: config.circuitBreakerThreshold || 5,
      circuitBreakerTimeout: config.circuitBreakerTimeout || 60000,
      enableLearning: config.enableLearning ?? true,
      enableMetrics: config.enableMetrics ?? true,
      fallbackStrategy: config.fallbackStrategy || FallbackStrategy.ADAPTIVE,
      minSimilarityScore: config.minSimilarityScore || 0.5,
    };

    this.moduleHealth = new Map();
    this.failureHistory = new Map();
    this.categoryGroups = new Map();
    this.learningData = new Map();
  }

  // ==================== MAIN FALLBACK EXECUTION ====================

  public async executeWithFallback(
    primaryModule: PromptModule,
    executeFn: (module: PromptModule) => Promise<any>,
    availableModules: PromptModule[],
    context: Record<string, any> = {}
  ): Promise<FallbackResult> {
    const startTime = Date.now();
    const attempts: FallbackAttempt[] = [];
    const fallbackChain: string[] = [primaryModule.id];

    // Try primary module first
    const primaryResult = await this.tryModule(
      primaryModule,
      executeFn,
      1,
      'primary',
      attempts
    );

    if (primaryResult.success) {
      return {
        success: true,
        finalModule: primaryModule.id,
        attempts,
        totalTime: Date.now() - startTime,
        result: primaryResult.result,
        fallbackChain,
        strategyUsed: this.config.fallbackStrategy,
      };
    }

    // Primary failed - initiate fallback
    this.emit('fallback:initiated', {
      primaryModule: primaryModule.id,
      reason: primaryResult.error,
    });

    // Get fallback candidates
    const candidates = await this.selectFallbackCandidates(
      primaryModule,
      availableModules,
      context
    );

    this.emit('fallback:candidates', {
      primaryModule: primaryModule.id,
      candidatesCount: candidates.length,
      candidates: candidates.map(c => c.id),
    });

    // Try fallback modules based on strategy
    const fallbackResult = await this.executeFallbackStrategy(
      candidates,
      executeFn,
      attempts,
      fallbackChain,
      context
    );

    const totalTime = Date.now() - startTime;

    // Learn from this experience
    if (this.config.enableLearning) {
      await this.learn(primaryModule, fallbackResult, context);
    }

    return {
      ...fallbackResult,
      totalTime,
      fallbackChain,
      strategyUsed: this.config.fallbackStrategy,
    };
  }

  // ==================== FALLBACK STRATEGIES ====================

  private async executeFallbackStrategy(
    candidates: PromptModule[],
    executeFn: (module: PromptModule) => Promise<any>,
    attempts: FallbackAttempt[],
    fallbackChain: string[],
    context: Record<string, any>
  ): Promise<Omit<FallbackResult, 'totalTime' | 'fallbackChain' | 'strategyUsed'>> {
    switch (this.config.fallbackStrategy) {
      case FallbackStrategy.SEQUENTIAL:
        return this.executeSequential(candidates, executeFn, attempts, fallbackChain);

      case FallbackStrategy.PARALLEL:
        return this.executeParallel(candidates, executeFn, attempts, fallbackChain);

      case FallbackStrategy.ADAPTIVE:
        return this.executeAdaptive(candidates, executeFn, attempts, fallbackChain, context);

      case FallbackStrategy.CATEGORY_BASED:
        return this.executeCategoryBased(candidates, executeFn, attempts, fallbackChain);

      case FallbackStrategy.HYBRID:
        return this.executeHybrid(candidates, executeFn, attempts, fallbackChain, context);

      default:
        return this.executeSequential(candidates, executeFn, attempts, fallbackChain);
    }
  }

  private async executeSequential(
    candidates: PromptModule[],
    executeFn: (module: PromptModule) => Promise<any>,
    attempts: FallbackAttempt[],
    fallbackChain: string[]
  ): Promise<Omit<FallbackResult, 'totalTime' | 'fallbackChain' | 'strategyUsed'>> {
    for (let i = 0; i < candidates.length && attempts.length < this.config.maxAttempts; i++) {
      const module = candidates[i];

      if (!this.isModuleAvailable(module.id)) {
        continue;
      }

      const result = await this.tryModule(
        module,
        executeFn,
        attempts.length + 1,
        `fallback-sequential-${i}`,
        attempts
      );

      fallbackChain.push(module.id);

      if (result.success) {
        return {
          success: true,
          finalModule: module.id,
          attempts,
          result: result.result,
        };
      }
    }

    return {
      success: false,
      finalModule: null,
      attempts,
      error: 'All fallback modules failed',
    };
  }

  private async executeParallel(
    candidates: PromptModule[],
    executeFn: (module: PromptModule) => Promise<any>,
    attempts: FallbackAttempt[],
    fallbackChain: string[]
  ): Promise<Omit<FallbackResult, 'totalTime' | 'fallbackChain' | 'strategyUsed'>> {
    const availableCandidates = candidates
      .filter(m => this.isModuleAvailable(m.id))
      .slice(0, 3); // Limit parallel attempts

    if (availableCandidates.length === 0) {
      return {
        success: false,
        finalModule: null,
        attempts,
        error: 'No available fallback modules',
      };
    }

    const promises = availableCandidates.map(module =>
      this.tryModule(module, executeFn, attempts.length + 1, 'fallback-parallel', attempts)
    );

    // Race - first successful wins
    const results = await Promise.allSettled(promises);

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const module = availableCandidates[i];
      fallbackChain.push(module.id);

      if (result.status === 'fulfilled' && result.value.success) {
        return {
          success: true,
          finalModule: module.id,
          attempts,
          result: result.value.result,
        };
      }
    }

    return {
      success: false,
      finalModule: null,
      attempts,
      error: 'All parallel attempts failed',
    };
  }

  private async executeAdaptive(
    candidates: PromptModule[],
    executeFn: (module: PromptModule) => Promise<any>,
    attempts: FallbackAttempt[],
    fallbackChain: string[],
    context: Record<string, any>
  ): Promise<Omit<FallbackResult, 'totalTime' | 'fallbackChain' | 'strategyUsed'>> {
    // Sort candidates by learned success rate for this type of task
    const taskType = context.taskType || 'default';
    const sortedCandidates = this.sortByLearning(candidates, taskType);

    // Try best candidate first
    const bestCandidate = sortedCandidates[0];
    if (bestCandidate && this.isModuleAvailable(bestCandidate.id)) {
      const result = await this.tryModule(
        bestCandidate,
        executeFn,
        attempts.length + 1,
        'fallback-adaptive-best',
        attempts
      );

      fallbackChain.push(bestCandidate.id);

      if (result.success) {
        return {
          success: true,
          finalModule: bestCandidate.id,
          attempts,
          result: result.result,
        };
      }
    }

    // If best failed, try sequential with remaining
    return this.executeSequential(
      sortedCandidates.slice(1),
      executeFn,
      attempts,
      fallbackChain
    );
  }

  private async executeCategoryBased(
    candidates: PromptModule[],
    executeFn: (module: PromptModule) => Promise<any>,
    attempts: FallbackAttempt[],
    fallbackChain: string[]
  ): Promise<Omit<FallbackResult, 'totalTime' | 'fallbackChain' | 'strategyUsed'>> {
    // Group by category and try same category first
    const categoryGroups = new Map<ModuleCategory, PromptModule[]>();

    candidates.forEach(module => {
      if (!categoryGroups.has(module.category)) {
        categoryGroups.set(module.category, []);
      }
      categoryGroups.get(module.category)!.push(module);
    });

    // Try each category group
    for (const [category, modules] of categoryGroups.entries()) {
      const result = await this.executeSequential(modules, executeFn, attempts, fallbackChain);
      if (result.success) {
        return result;
      }
    }

    return {
      success: false,
      finalModule: null,
      attempts,
      error: 'All category-based fallbacks failed',
    };
  }

  private async executeHybrid(
    candidates: PromptModule[],
    executeFn: (module: PromptModule) => Promise<any>,
    attempts: FallbackAttempt[],
    fallbackChain: string[],
    context: Record<string, any>
  ): Promise<Omit<FallbackResult, 'totalTime' | 'fallbackChain' | 'strategyUsed'>> {
    // Adaptive first (learned best)
    const taskType = context.taskType || 'default';
    const bestLearned = this.sortByLearning(candidates, taskType)[0];

    if (bestLearned && this.isModuleAvailable(bestLearned.id)) {
      const result = await this.tryModule(
        bestLearned,
        executeFn,
        attempts.length + 1,
        'fallback-hybrid-learned',
        attempts
      );

      fallbackChain.push(bestLearned.id);

      if (result.success) {
        return {
          success: true,
          finalModule: bestLearned.id,
          attempts,
          result: result.result,
        };
      }
    }

    // Parallel for top 3
    const top3 = candidates.slice(0, 3).filter(m => m.id !== bestLearned?.id);
    if (top3.length > 0) {
      const parallelResult = await this.executeParallel(top3, executeFn, attempts, fallbackChain);
      if (parallelResult.success) {
        return parallelResult;
      }
    }

    // Sequential for rest
    const remaining = candidates.slice(3);
    return this.executeSequential(remaining, executeFn, attempts, fallbackChain);
  }

  // ==================== MODULE SELECTION ====================

  private async selectFallbackCandidates(
    failedModule: PromptModule,
    availableModules: PromptModule[],
    context: Record<string, any>
  ): Promise<PromptModule[]> {
    // Calculate similarity scores
    const similarities = availableModules
      .filter(m => m.id !== failedModule.id)
      .map(module => ({
        module,
        similarity: this.calculateSimilarity(failedModule, module, context),
      }))
      .filter(s => s.similarity.score >= this.config.minSimilarityScore)
      .sort((a, b) => b.similarity.score - a.similarity.score);

    // Apply health-based filtering
    const healthyCandidates = similarities
      .filter(s => this.isModuleAvailable(s.module.id))
      .map(s => s.module);

    return healthyCandidates;
  }

  private calculateSimilarity(
    moduleA: PromptModule,
    moduleB: PromptModule,
    context: Record<string, any>
  ): SimilarityScore {
    let score = 0;
    const reasons: string[] = [];

    // Same category (high weight)
    if (moduleA.category === moduleB.category) {
      score += 0.4;
      reasons.push('Same category');
    }

    // Overlapping subcategories
    const commonSubcategories = moduleA.subcategories.filter(s =>
      moduleB.subcategories.includes(s)
    );
    if (commonSubcategories.length > 0) {
      score += 0.3 * (commonSubcategories.length / moduleA.subcategories.length);
      reasons.push(`${commonSubcategories.length} common subcategories`);
    }

    // Similar keywords
    const commonKeywords = moduleA.keywords?.filter(k =>
      moduleB.keywords?.includes(k)
    ) || [];
    if (commonKeywords.length > 0) {
      score += 0.15;
      reasons.push(`${commonKeywords.length} common keywords`);
    }

    // Listed as alternative
    if (moduleA.alternatives?.some(alt => alt.name === moduleB.name)) {
      score += 0.15;
      reasons.push('Listed as alternative');
    }

    return {
      moduleId: moduleB.id,
      score: Math.min(score, 1.0),
      reasons,
      category: moduleB.category,
    };
  }

  // ==================== MODULE EXECUTION ====================

  private async tryModule(
    module: PromptModule,
    executeFn: (module: PromptModule) => Promise<any>,
    attemptNumber: number,
    reason: string,
    attempts: FallbackAttempt[]
  ): Promise<{ success: boolean; result?: any; error?: string }> {
    const attempt: FallbackAttempt = {
      moduleId: module.id,
      moduleName: module.name,
      attemptNumber,
      startTime: Date.now(),
      success: false,
      fallbackReason: reason,
    };

    try {
      this.emit('module:attempting', {
        moduleId: module.id,
        attemptNumber,
      });

      const result = await executeFn(module);

      attempt.endTime = Date.now();
      attempt.executionTime = attempt.endTime - attempt.startTime;
      attempt.success = true;
      attempt.result = result;

      this.recordSuccess(module.id, attempt.executionTime);

      this.emit('module:success', {
        moduleId: module.id,
        attemptNumber,
        executionTime: attempt.executionTime,
      });

      attempts.push(attempt);

      return { success: true, result };
    } catch (error: any) {
      attempt.endTime = Date.now();
      attempt.executionTime = attempt.endTime - attempt.startTime;
      attempt.success = false;
      attempt.error = error.message;

      this.recordFailure(module.id);

      this.emit('module:failure', {
        moduleId: module.id,
        attemptNumber,
        error: error.message,
      });

      attempts.push(attempt);

      return { success: false, error: error.message };
    }
  }

  // ==================== HEALTH MANAGEMENT ====================

  private getOrCreateHealth(moduleId: string): ModuleHealth {
    if (!this.moduleHealth.has(moduleId)) {
      this.moduleHealth.set(moduleId, {
        moduleId,
        successCount: 0,
        failureCount: 0,
        totalAttempts: 0,
        successRate: 1.0,
        averageResponseTime: 0,
        lastUsed: Date.now(),
        circuitState: CircuitState.CLOSED,
        consecutiveFailures: 0,
        lastFailure: null,
      });
    }
    return this.moduleHealth.get(moduleId)!;
  }

  private recordSuccess(moduleId: string, responseTime: number): void {
    const health = this.getOrCreateHealth(moduleId);

    health.successCount++;
    health.totalAttempts++;
    health.consecutiveFailures = 0;
    health.lastUsed = Date.now();

    // Update average response time
    const totalTime = health.averageResponseTime * (health.successCount - 1) + responseTime;
    health.averageResponseTime = totalTime / health.successCount;

    // Update success rate
    health.successRate = health.successCount / health.totalAttempts;

    // Check circuit breaker state
    if (health.circuitState === CircuitState.HALF_OPEN) {
      health.circuitState = CircuitState.CLOSED;
      this.emit('circuit:closed', { moduleId });
    }
  }

  private recordFailure(moduleId: string): void {
    const health = this.getOrCreateHealth(moduleId);

    health.failureCount++;
    health.totalAttempts++;
    health.consecutiveFailures++;
    health.lastFailure = Date.now();
    health.lastUsed = Date.now();

    // Update success rate
    health.successRate = health.successCount / health.totalAttempts;

    // Check circuit breaker
    if (
      this.config.enableCircuitBreaker &&
      health.consecutiveFailures >= this.config.circuitBreakerThreshold
    ) {
      this.openCircuit(moduleId);
    }
  }

  private openCircuit(moduleId: string): void {
    const health = this.getOrCreateHealth(moduleId);
    health.circuitState = CircuitState.OPEN;

    this.emit('circuit:opened', { moduleId });

    // Schedule half-open attempt
    setTimeout(() => {
      this.halfOpenCircuit(moduleId);
    }, this.config.circuitBreakerTimeout);
  }

  private halfOpenCircuit(moduleId: string): void {
    const health = this.getOrCreateHealth(moduleId);
    if (health.circuitState === CircuitState.OPEN) {
      health.circuitState = CircuitState.HALF_OPEN;
      this.emit('circuit:half-open', { moduleId });
    }
  }

  private isModuleAvailable(moduleId: string): boolean {
    const health = this.moduleHealth.get(moduleId);

    if (!health) {
      return true; // New module, available
    }

    // Circuit breaker check
    if (health.circuitState === CircuitState.OPEN) {
      return false;
    }

    // Half-open allows limited attempts
    return true;
  }

  // ==================== LEARNING SYSTEM ====================

  private async learn(
    primaryModule: PromptModule,
    result: Omit<FallbackResult, 'totalTime' | 'fallbackChain' | 'strategyUsed'>,
    context: Record<string, any>
  ): Promise<void> {
    const taskType = context.taskType || 'default';

    if (!this.learningData.has(taskType)) {
      this.learningData.set(taskType, new Map());
    }

    const taskLearning = this.learningData.get(taskType)!;

    // Record success/failure for each attempt
    result.attempts.forEach(attempt => {
      if (!taskLearning.has(attempt.moduleId)) {
        taskLearning.set(attempt.moduleId, 0.5); // Initial neutral score
      }

      const currentScore = taskLearning.get(attempt.moduleId)!;
      const adjustment = attempt.success ? 0.1 : -0.1;
      const newScore = Math.max(0, Math.min(1, currentScore + adjustment));

      taskLearning.set(attempt.moduleId, newScore);
    });

    this.emit('learning:updated', {
      taskType,
      moduleScores: Array.from(taskLearning.entries()),
    });
  }

  private sortByLearning(modules: PromptModule[], taskType: string): PromptModule[] {
    const taskLearning = this.learningData.get(taskType);

    if (!taskLearning) {
      return modules;
    }

    return [...modules].sort((a, b) => {
      const scoreA = taskLearning.get(a.id) || 0.5;
      const scoreB = taskLearning.get(b.id) || 0.5;
      return scoreB - scoreA;
    });
  }

  // ==================== METRICS & STATUS ====================

  public getModuleHealth(moduleId: string): ModuleHealth | null {
    return this.moduleHealth.get(moduleId) || null;
  }

  public getAllHealth(): Map<string, ModuleHealth> {
    return new Map(this.moduleHealth);
  }

  public getFailureHistory(moduleId: string): FallbackAttempt[] {
    return this.failureHistory.get(moduleId) || [];
  }

  public getLearningData(taskType?: string): Map<string, number> | Map<string, Map<string, number>> {
    if (taskType) {
      return this.learningData.get(taskType) || new Map();
    }
    return new Map(this.learningData);
  }

  public resetModuleHealth(moduleId: string): void {
    this.moduleHealth.delete(moduleId);
    this.emit('health:reset', { moduleId });
  }

  public resetAllHealth(): void {
    this.moduleHealth.clear();
    this.emit('health:reset-all');
  }

  public resetLearning(taskType?: string): void {
    if (taskType) {
      this.learningData.delete(taskType);
    } else {
      this.learningData.clear();
    }
    this.emit('learning:reset', { taskType });
  }

  public getMetrics(): {
    totalModules: number;
    healthyModules: number;
    unhealthyModules: number;
    circuitOpenModules: number;
    averageSuccessRate: number;
    totalAttempts: number;
  } {
    const modules = Array.from(this.moduleHealth.values());
    const totalModules = modules.length;
    const healthyModules = modules.filter(m => m.successRate > 0.7 && m.circuitState === CircuitState.CLOSED).length;
    const unhealthyModules = modules.filter(m => m.successRate <= 0.7).length;
    const circuitOpenModules = modules.filter(m => m.circuitState === CircuitState.OPEN).length;
    const totalAttempts = modules.reduce((sum, m) => sum + m.totalAttempts, 0);
    const averageSuccessRate = modules.length > 0
      ? modules.reduce((sum, m) => sum + m.successRate, 0) / modules.length
      : 1.0;

    return {
      totalModules,
      healthyModules,
      unhealthyModules,
      circuitOpenModules,
      averageSuccessRate,
      totalAttempts,
    };
  }
}

// ==================== SINGLETON ====================

let fallbackInstance: FallbackSystem | null = null;

export function getFallbackSystem(config?: Partial<FallbackConfig>): FallbackSystem {
  if (!fallbackInstance) {
    fallbackInstance = new FallbackSystem(config);
  }
  return fallbackInstance;
}

export function createFallbackSystem(config?: Partial<FallbackConfig>): FallbackSystem {
  return new FallbackSystem(config);
}

export default FallbackSystem;
