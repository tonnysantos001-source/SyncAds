/**
 * Performance Monitoring System
 * 
 * Monitora métricas vitais:
 * - Re-renders de componentes
 * - Tempo de carregamento
 * - Tamanho de dados
 * - Memória utilizada
 */

type PerformanceMetric = {
  name: string;
  value: number;
  timestamp: number;
  type: 'render' | 'api' | 'memory' | 'bundle';
};

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000;
  private enabled = import.meta.env.DEV;

  /**
   * Marca início de uma operação
   */
  start(name: string): () => void {
    if (!this.enabled) return () => {};

    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric({
        name,
        value: duration,
        timestamp: Date.now(),
        type: 'api',
      });

      if (duration > 1000) {
        console.warn(`⚠️ Slow operation: ${name} took ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Registra re-render de componente
   */
  recordRender(componentName: string): void {
    if (!this.enabled) return;

    this.recordMetric({
      name: `render:${componentName}`,
      value: 1,
      timestamp: Date.now(),
      type: 'render',
    });
  }

  /**
   * Mede tempo de carregamento de API
   */
  async measureApiCall<T>(
    name: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    if (!this.enabled) return apiCall();

    const end = this.start(`api:${name}`);
    try {
      const result = await apiCall();
      end();
      return result;
    } catch (error) {
      end();
      throw error;
    }
  }

  /**
   * Monitora tamanho de dados
   */
  recordDataSize(name: string, data: any): void {
    if (!this.enabled) return;

    const size = JSON.stringify(data).length;
    this.recordMetric({
      name: `dataSize:${name}`,
      value: size,
      timestamp: Date.now(),
      type: 'bundle',
    });

    if (size > 100000) { // 100KB
      console.warn(`⚠️ Large data: ${name} is ${(size / 1024).toFixed(2)}KB`);
    }
  }

  /**
   * Registra métrica
   */
  private recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // Limita tamanho do array
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  /**
   * Obtém estatísticas de re-renders
   */
  getRenderStats(): Record<string, number> {
    const renderMetrics = this.metrics.filter(m => m.type === 'render');
    const stats: Record<string, number> = {};

    renderMetrics.forEach(metric => {
      const componentName = metric.name.replace('render:', '');
      stats[componentName] = (stats[componentName] || 0) + 1;
    });

    return stats;
  }

  /**
   * Obtém métricas de API
   */
  getApiStats(): Array<{ name: string; avgTime: number; count: number }> {
    const apiMetrics = this.metrics.filter(m => m.type === 'api');
    const grouped: Record<string, number[]> = {};

    apiMetrics.forEach(metric => {
      const name = metric.name.replace('api:', '');
      if (!grouped[name]) grouped[name] = [];
      grouped[name].push(metric.value);
    });

    return Object.entries(grouped).map(([name, times]) => ({
      name,
      avgTime: times.reduce((sum, t) => sum + t, 0) / times.length,
      count: times.length,
    }));
  }

  /**
   * Obtém uso de memória (se disponível)
   */
  getMemoryStats(): { used: number; limit: number } | null {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return {
        used: memory.usedJSHeapSize / 1048576, // MB
        limit: memory.jsHeapSizeLimit / 1048576, // MB
      };
    }
    return null;
  }

  /**
   * Imprime relatório no console
   */
  printReport(): void {
    if (!this.enabled) return;

    console.group('📊 Performance Report');

    // Re-renders
    const renderStats = this.getRenderStats();
    const topRenders = Object.entries(renderStats)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    console.group('🔄 Top 10 Re-renders');
    topRenders.forEach(([name, count]) => {
      console.log(`${name}: ${count} renders`);
    });
    console.groupEnd();

    // API Calls
    const apiStats = this.getApiStats()
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);

    console.group('⚡ Top 10 Slowest API Calls');
    apiStats.forEach(({ name, avgTime, count }) => {
      console.log(`${name}: ${avgTime.toFixed(2)}ms avg (${count} calls)`);
    });
    console.groupEnd();

    // Memory
    const memory = this.getMemoryStats();
    if (memory) {
      console.group('💾 Memory Usage');
      console.log(`Used: ${memory.used.toFixed(2)} MB`);
      console.log(`Limit: ${memory.limit.toFixed(2)} MB`);
      console.log(`Usage: ${((memory.used / memory.limit) * 100).toFixed(2)}%`);
      console.groupEnd();
    }

    console.groupEnd();
  }

  /**
   * Limpa métricas
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Exporta métricas
   */
  export(): PerformanceMetric[] {
    return [...this.metrics];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Expor globalmente em dev mode
if (import.meta.env.DEV) {
  (window as any).performanceMonitor = performanceMonitor;
}

/**
 * Hook para monitorar re-renders de componentes
 */
export function useRenderMonitor(componentName: string): void {
  if (import.meta.env.DEV) {
    performanceMonitor.recordRender(componentName);
  }
}

/**
 * HOC para monitorar componente
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const displayName = componentName || Component.displayName || Component.name || 'Component';
  
  const WrappedComponent: React.FC<P> = (props) => {
    useRenderMonitor(displayName);
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return WrappedComponent;
}
