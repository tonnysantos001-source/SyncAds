/**
 * SERVICE ORCHESTRATOR
 *
 * Motor central de orquestração para gerenciar chamadas a edge functions
 * e serviços externos com retry, circuit breaker, rate limiting, cache e logging.
 *
 * Features:
 * - Retry automático com exponential backoff
 * - Circuit breaker para prevenir cascading failures
 * - Rate limiting inteligente (por função e por usuário)
 * - Caching in-memory com TTL
 * - Logging estruturado
 * - Metrics collection
 * - Error handling robusto
 *
 * @version 1.0.0
 * @date 2025-01-08
 * @author SyncAds Team
 */

import { supabase } from '@/lib/supabase';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface OrchestratorConfig {
  maxRetries?: number;
  retryDelay?: number;
  timeout?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerTimeout?: number;
  rateLimitPerMinute?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
}

export interface CallOptions {
  retry?: boolean;
  cache?: boolean;
  cacheTTL?: number;
  timeout?: number;
  priority?: 'high' | 'normal' | 'low';
  metadata?: Record<string, any>;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    duration: number;
    retries: number;
    cached: boolean;
    timestamp: number;
    functionName: string;
  };
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  state: 'closed' | 'open' | 'half-open';
}

interface RateLimitState {
  calls: number[];
  lastReset: number;
}

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  functionName?: string;
  duration?: number;
  error?: string;
  metadata?: Record<string, any>;
  timestamp: number;
}

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: Required<OrchestratorConfig> = {
  maxRetries: 3,
  retryDelay: 1000, // 1 second
  timeout: 30000, // 30 seconds
  circuitBreakerThreshold: 5,
  circuitBreakerTimeout: 60000, // 1 minute
  rateLimitPerMinute: 60,
  cacheEnabled: true,
  cacheTTL: 300000, // 5 minutes
  logLevel: 'info',
};

// ============================================================================
// SERVICE ORCHESTRATOR CLASS
// ============================================================================

export class ServiceOrchestrator {
  private config: Required<OrchestratorConfig>;
  private circuitBreakers: Map<string, CircuitBreakerState> = new Map();
  private rateLimiters: Map<string, RateLimitState> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private logs: LogEntry[] = [];
  private metrics: Map<string, { calls: number; failures: number; totalDuration: number }> = new Map();

  constructor(config?: OrchestratorConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanupInterval();
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  /**
   * Chama uma edge function com retry, circuit breaker, rate limiting e cache
   */
  async call<T = any>(
    functionName: string,
    params?: Record<string, any>,
    options?: CallOptions
  ): Promise<ServiceResponse<T>> {
    const startTime = Date.now();
    let retries = 0;
    const opts = { ...this.getDefaultOptions(), ...options };

    try {
      // 1. Check rate limit
      if (!this.checkRateLimit(functionName)) {
        return this.createErrorResponse(
          'Rate limit exceeded',
          functionName,
          startTime,
          retries
        );
      }

      // 2. Check circuit breaker
      if (!this.checkCircuitBreaker(functionName)) {
        return this.createErrorResponse(
          'Circuit breaker is open',
          functionName,
          startTime,
          retries
        );
      }

      // 3. Check cache
      if (opts.cache && this.config.cacheEnabled) {
        const cached = this.getFromCache<T>(functionName, params);
        if (cached) {
          this.log('info', `Cache hit for ${functionName}`, { functionName });
          return this.createSuccessResponse(
            cached,
            functionName,
            startTime,
            retries,
            true
          );
        }
      }

      // 4. Execute with retry
      let lastError: Error | null = null;
      const maxRetries = opts.retry ? this.config.maxRetries : 0;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          retries = attempt;

          // Execute the function
          const result = await this.executeFunction<T>(
            functionName,
            params,
            opts.timeout || this.config.timeout
          );

          // Success - record metrics
          this.recordSuccess(functionName, startTime);

          // Store in cache
          if (opts.cache && this.config.cacheEnabled) {
            this.setInCache(functionName, params, result, opts.cacheTTL);
          }

          return this.createSuccessResponse(
            result,
            functionName,
            startTime,
            retries,
            false
          );
        } catch (error) {
          lastError = error as Error;
          this.log('warn', `Attempt ${attempt + 1} failed for ${functionName}`, {
            functionName,
            error: lastError.message,
          });

          // If not last attempt, wait before retry
          if (attempt < maxRetries) {
            await this.waitWithBackoff(attempt);
          }
        }
      }

      // All retries failed
      this.recordFailure(functionName, startTime);
      return this.createErrorResponse(
        lastError?.message || 'Unknown error',
        functionName,
        startTime,
        retries
      );
    } catch (error) {
      this.recordFailure(functionName, startTime);
      return this.createErrorResponse(
        (error as Error).message,
        functionName,
        startTime,
        retries
      );
    }
  }

  /**
   * Chama múltiplas functions em paralelo
   */
  async callBatch<T = any>(
    calls: Array<{ functionName: string; params?: Record<string, any>; options?: CallOptions }>
  ): Promise<ServiceResponse<T>[]> {
    return Promise.all(
      calls.map(({ functionName, params, options }) =>
        this.call<T>(functionName, params, options)
      )
    );
  }

  /**
   * Invalida cache de uma função específica
   */
  invalidateCache(functionName: string, params?: Record<string, any>): void {
    const key = this.getCacheKey(functionName, params);
    this.cache.delete(key);
    this.log('debug', `Cache invalidated for ${functionName}`, { functionName });
  }

  /**
   * Limpa todo o cache
   */
  clearCache(): void {
    this.cache.clear();
    this.log('info', 'Cache cleared');
  }

  /**
   * Reseta circuit breaker de uma função
   */
  resetCircuitBreaker(functionName: string): void {
    this.circuitBreakers.delete(functionName);
    this.log('info', `Circuit breaker reset for ${functionName}`, { functionName });
  }

  /**
   * Retorna métricas de uso
   */
  getMetrics(): Record<string, { calls: number; failures: number; avgDuration: number; successRate: number }> {
    const result: Record<string, any> = {};

    this.metrics.forEach((value, key) => {
      result[key] = {
        calls: value.calls,
        failures: value.failures,
        avgDuration: value.calls > 0 ? value.totalDuration / value.calls : 0,
        successRate: value.calls > 0 ? ((value.calls - value.failures) / value.calls) * 100 : 0,
      };
    });

    return result;
  }

  /**
   * Retorna logs
   */
  getLogs(limit?: number, level?: LogEntry['level']): LogEntry[] {
    let logs = this.logs;

    if (level) {
      logs = logs.filter(log => log.level === level);
    }

    if (limit) {
      logs = logs.slice(-limit);
    }

    return logs;
  }

  /**
   * Retorna status dos circuit breakers
   */
  getCircuitBreakerStatus(): Record<string, CircuitBreakerState> {
    const result: Record<string, CircuitBreakerState> = {};
    this.circuitBreakers.forEach((value, key) => {
      result[key] = { ...value };
    });
    return result;
  }

  // ============================================================================
  // PRIVATE METHODS
  // ============================================================================

  /**
   * Executa a edge function com timeout
   */
  private async executeFunction<T>(
    functionName: string,
    params?: Record<string, any>,
    timeout?: number
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout || this.config.timeout);

    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: params || {},
        signal: controller.signal,
      });

      if (error) {
        throw new Error(error.message || 'Edge function error');
      }

      return data as T;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(functionName: string): boolean {
    const now = Date.now();
    const state = this.rateLimiters.get(functionName) || {
      calls: [],
      lastReset: now,
    };

    // Remove old calls (older than 1 minute)
    state.calls = state.calls.filter(callTime => now - callTime < 60000);

    // Check limit
    if (state.calls.length >= this.config.rateLimitPerMinute) {
      this.log('warn', `Rate limit exceeded for ${functionName}`, { functionName });
      return false;
    }

    // Add current call
    state.calls.push(now);
    this.rateLimiters.set(functionName, state);

    return true;
  }

  /**
   * Circuit breaker check
   */
  private checkCircuitBreaker(functionName: string): boolean {
    const state = this.circuitBreakers.get(functionName);

    if (!state) {
      return true; // No state = circuit is closed
    }

    const now = Date.now();

    // Open state - check if we can transition to half-open
    if (state.state === 'open') {
      if (now - state.lastFailure > this.config.circuitBreakerTimeout) {
        state.state = 'half-open';
        state.failures = 0;
        this.circuitBreakers.set(functionName, state);
        this.log('info', `Circuit breaker half-open for ${functionName}`, { functionName });
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Record successful call
   */
  private recordSuccess(functionName: string, startTime: number): void {
    const duration = Date.now() - startTime;

    // Reset circuit breaker
    const cbState = this.circuitBreakers.get(functionName);
    if (cbState && cbState.state === 'half-open') {
      cbState.state = 'closed';
      cbState.failures = 0;
      this.circuitBreakers.set(functionName, cbState);
      this.log('info', `Circuit breaker closed for ${functionName}`, { functionName });
    }

    // Update metrics
    const metrics = this.metrics.get(functionName) || { calls: 0, failures: 0, totalDuration: 0 };
    metrics.calls++;
    metrics.totalDuration += duration;
    this.metrics.set(functionName, metrics);

    this.log('debug', `Success: ${functionName}`, { functionName, duration });
  }

  /**
   * Record failed call
   */
  private recordFailure(functionName: string, startTime: number): void {
    const duration = Date.now() - startTime;

    // Update circuit breaker
    const cbState = this.circuitBreakers.get(functionName) || {
      failures: 0,
      lastFailure: Date.now(),
      state: 'closed' as const,
    };

    cbState.failures++;
    cbState.lastFailure = Date.now();

    if (cbState.failures >= this.config.circuitBreakerThreshold) {
      cbState.state = 'open';
      this.log('error', `Circuit breaker opened for ${functionName}`, { functionName });
    }

    this.circuitBreakers.set(functionName, cbState);

    // Update metrics
    const metrics = this.metrics.get(functionName) || { calls: 0, failures: 0, totalDuration: 0 };
    metrics.calls++;
    metrics.failures++;
    metrics.totalDuration += duration;
    this.metrics.set(functionName, metrics);

    this.log('error', `Failure: ${functionName}`, { functionName, duration });
  }

  /**
   * Wait with exponential backoff
   */
  private async waitWithBackoff(attempt: number): Promise<void> {
    const delay = this.config.retryDelay * Math.pow(2, attempt);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Cache methods
   */
  private getCacheKey(functionName: string, params?: Record<string, any>): string {
    return `${functionName}:${JSON.stringify(params || {})}`;
  }

  private getFromCache<T>(functionName: string, params?: Record<string, any>): T | null {
    const key = this.getCacheKey(functionName, params);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  private setInCache(
    functionName: string,
    params: Record<string, any> | undefined,
    data: any,
    ttl?: number
  ): void {
    const key = this.getCacheKey(functionName, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL,
    });
  }

  /**
   * Logging
   */
  private log(
    level: LogEntry['level'],
    message: string,
    metadata?: Record<string, any>
  ): void {
    if (this.shouldLog(level)) {
      const entry: LogEntry = {
        level,
        message,
        timestamp: Date.now(),
        ...metadata,
      };

      this.logs.push(entry);

      // Keep only last 1000 logs
      if (this.logs.length > 1000) {
        this.logs.shift();
      }

      // Console output
      if (level === 'error') {
        console.error(`[Orchestrator] ${message}`, metadata);
      } else if (level === 'warn') {
        console.warn(`[Orchestrator] ${message}`, metadata);
      } else if (level === 'info') {
        console.info(`[Orchestrator] ${message}`, metadata);
      } else {
        console.debug(`[Orchestrator] ${message}`, metadata);
      }
    }
  }

  private shouldLog(level: LogEntry['level']): boolean {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.logLevel);
    const messageLevelIndex = levels.indexOf(level);
    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Response creators
   */
  private createSuccessResponse<T>(
    data: T,
    functionName: string,
    startTime: number,
    retries: number,
    cached: boolean
  ): ServiceResponse<T> {
    return {
      success: true,
      data,
      metadata: {
        duration: Date.now() - startTime,
        retries,
        cached,
        timestamp: Date.now(),
        functionName,
      },
    };
  }

  private createErrorResponse(
    error: string,
    functionName: string,
    startTime: number,
    retries: number
  ): ServiceResponse<never> {
    return {
      success: false,
      error,
      metadata: {
        duration: Date.now() - startTime,
        retries,
        cached: false,
        timestamp: Date.now(),
        functionName,
      },
    };
  }

  /**
   * Default options
   */
  private getDefaultOptions(): Required<CallOptions> {
    return {
      retry: true,
      cache: true,
      cacheTTL: this.config.cacheTTL,
      timeout: this.config.timeout,
      priority: 'normal',
      metadata: {},
    };
  }

  /**
   * Cleanup interval for expired cache and old rate limit data
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      // Clean expired cache
      const now = Date.now();
      this.cache.forEach((entry, key) => {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key);
        }
      });

      // Clean old rate limit data
      this.rateLimiters.forEach((state, key) => {
        state.calls = state.calls.filter(callTime => now - callTime < 60000);
        if (state.calls.length === 0) {
          this.rateLimiters.delete(key);
        }
      });
    }, 60000); // Run every minute
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const orchestrator = new ServiceOrchestrator({
  logLevel: import.meta.env.DEV ? 'debug' : 'info',
});

// ============================================================================
// CONVENIENCE EXPORTS
// ============================================================================

export const callEdgeFunction = orchestrator.call.bind(orchestrator);
export const callBatch = orchestrator.callBatch.bind(orchestrator);
export const invalidateCache = orchestrator.invalidateCache.bind(orchestrator);
export const getMetrics = orchestrator.getMetrics.bind(orchestrator);
