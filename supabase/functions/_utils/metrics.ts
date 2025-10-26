// ============================================================================
// METRICS SYSTEM
// ============================================================================
// Sistema de coleta e armazenamento de métricas
// Por: SYNCADS
// ============================================================================

export type MetricType = 
  | "api_call" 
  | "error" 
  | "file_download" 
  | "chat_message" 
  | "rate_limit"
  | "token_usage"
  | "model_fallback";

export type MetricStatus = 
  | "success" 
  | "failure" 
  | "rate_limited" 
  | "timeout"
  | "circuit_open";

export interface Metric {
  timestamp: Date;
  type: MetricType;
  duration: number; // ms
  status: MetricStatus;
  endpoint: string;
  user_id: string;
  details?: Record<string, any>;
}

export interface MetricsDatabase {
  insert(metric: Metric): Promise<void>;
  select(timeRange: { start: Date; end: Date }): Promise<Metric[]>;
  selectBy(field: string, value: any): Promise<Metric[]>;
  aggregateStats(): Promise<{
    totalRequests: number;
    successRate: number;
    avgDuration: number;
    errorCount: number;
  }>;
}

// Mock implementation (será substituído por Supabase)
class InMemoryMetrics implements MetricsDatabase {
  private metrics: Metric[] = [];
  private maxSize = 10000; // Limitar tamanho para evitar memory leak

  async insert(metric: Metric): Promise<void> {
    this.metrics.push(metric);
    
    // Limitar tamanho (manter últimos N)
    if (this.metrics.length > this.maxSize) {
      this.metrics = this.metrics.slice(-this.maxSize);
    }

    console.log(`📊 Métrica: ${metric.endpoint} (${metric.duration}ms, ${metric.status})`);
  }

  async select(timeRange: { start: Date; end: Date }): Promise<Metric[]> {
    return this.metrics.filter(
      m => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end
    );
  }

  async selectBy(field: string, value: any): Promise<Metric[]> {
    return this.metrics.filter((m: any) => m[field] === value);
  }

  async aggregateStats(): Promise<{
    totalRequests: number;
    successRate: number;
    avgDuration: number;
    errorCount: number;
  }> {
    const total = this.metrics.length;
    const success = this.metrics.filter(m => m.status === 'success').length;
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / total;
    const errors = this.metrics.filter(m => m.status === 'failure').length;

    return {
      totalRequests: total,
      successRate: total > 0 ? (success / total) * 100 : 0,
      avgDuration,
      errorCount: errors,
    };
  }
}

// Instância global
const metricsDb: MetricsDatabase = new InMemoryMetrics();

/**
 * Registra uma métrica
 */
export async function recordMetric(metric: Metric): Promise<void> {
  try {
    await metricsDb.insert(metric);
  } catch (error: any) {
    console.error('Erro ao registrar métrica:', error.message);
    // Fail silently - não bloquear operação principal
  }
}

/**
 * Obtém métricas de um período
 */
export async function getMetrics(
  timeRange: { start: Date; end: Date }
): Promise<Metric[]> {
  try {
    return await metricsDb.select(timeRange);
  } catch (error: any) {
    console.error('Erro ao buscar métricas:', error.message);
    return [];
  }
}

/**
 * Obtém estatísticas agregadas
 */
export async function getAggregateStats(): Promise<{
  totalRequests: number;
  successRate: number;
  avgDuration: number;
  errorCount: number;
}> {
  try {
    return await metricsDb.aggregateStats();
  } catch (error: any) {
    console.error('Erro ao buscar stats:', error.message);
    return {
      totalRequests: 0,
      successRate: 0,
      avgDuration: 0,
      errorCount: 0,
    };
  }
}

/**
 * Obtém métricas por campo
 */
export async function getMetricsBy(
  field: string,
  value: any
): Promise<{ count: number; avgDuration: number }> {
  try {
    const metrics = await metricsDb.selectBy(field, value);
    const avgDuration = 
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.duration, 0) / metrics.length
        : 0;

    return {
      count: metrics.length,
      avgDuration,
    };
  } catch (error: any) {
    console.error('Erro ao buscar métricas por campo:', error.message);
    return { count: 0, avgDuration: 0 };
  }
}

/**
 * Helper para medir duração de operações
 */
export class PerformanceTimer {
  private startTime: number;
  private label: string;

  constructor(label: string) {
    this.label = label;
    this.startTime = performance.now();
  }

  end(): number {
    const duration = performance.now() - this.startTime;
    console.log(`⏱️ ${this.label}: ${duration.toFixed(2)}ms`);
    return duration;
  }

  async recordMetric(data: Partial<Metric>): Promise<void> {
    const duration = this.end();
    await recordMetric({
      timestamp: new Date(),
      type: data.type || 'api_call',
      duration,
      status: data.status || 'success',
      endpoint: data.endpoint || 'unknown',
      user_id: data.user_id || 'unknown',
      details: data.details,
    });
  }
}

