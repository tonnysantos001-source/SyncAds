import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '@/lib/performance';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, BarChart3, Zap, RefreshCw, Trash2 } from 'lucide-react';

/**
 * DevTools para monitorar performance em tempo real
 * Apenas visível em modo DEV
 */
export const PerformanceDevTools: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [renderStats, setRenderStats] = useState<Record<string, number>>({});
  const [apiStats, setApiStats] = useState<Array<{ name: string; avgTime: number; count: number }>>([]);
  const [memoryStats, setMemoryStats] = useState<{ used: number; limit: number } | null>(null);

  // Atualizar stats a cada 2 segundos
  useEffect(() => {
    if (!isOpen) return;

    const updateStats = () => {
      setRenderStats(performanceMonitor.getRenderStats());
      setApiStats(performanceMonitor.getApiStats());
      setMemoryStats(performanceMonitor.getMemoryStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Não renderizar em produção
  if (import.meta.env.PROD) return null;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-all"
        title="Abrir Performance DevTools"
      >
        <BarChart3 className="h-5 w-5" />
      </button>
    );
  }

  const topRenders = Object.entries(renderStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  const topApis = apiStats
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 10);

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-[80vh] overflow-auto">
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg shadow-2xl border-2">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-lg">Performance Monitor</CardTitle>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  performanceMonitor.printReport();
                }}
                title="Imprimir relatório no console"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  performanceMonitor.clear();
                  setRenderStats({});
                  setApiStats([]);
                }}
                title="Limpar métricas"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <CardDescription>Monitorando em tempo real</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-0">
          {/* Memory Stats */}
          {memoryStats && (
            <div>
              <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                💾 Memória
              </h3>
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Usado:</span>
                  <span className="font-mono">{memoryStats.used.toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Limite:</span>
                  <span className="font-mono">{memoryStats.limit.toFixed(2)} MB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uso:</span>
                  <Badge variant={memoryStats.used / memoryStats.limit > 0.8 ? 'destructive' : 'default'}>
                    {((memoryStats.used / memoryStats.limit) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Top Re-renders */}
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Top Re-renders
            </h3>
            <div className="space-y-1">
              {topRenders.length > 0 ? (
                topRenders.map(([name, count]) => (
                  <div key={name} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">
                    <span className="truncate font-mono text-xs">{name}</span>
                    <Badge variant={count > 50 ? 'destructive' : count > 20 ? 'warning' : 'default'}>
                      {count}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum re-render detectado</p>
              )}
            </div>
          </div>

          {/* Top API Calls */}
          <div>
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              API Calls (mais lentas)
            </h3>
            <div className="space-y-1">
              {topApis.length > 0 ? (
                topApis.map(({ name, avgTime, count }) => (
                  <div key={name} className="flex items-center justify-between text-sm bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">
                    <span className="truncate font-mono text-xs flex-1">{name}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className="text-xs text-muted-foreground">×{count}</span>
                      <Badge variant={avgTime > 1000 ? 'destructive' : avgTime > 500 ? 'warning' : 'default'}>
                        {avgTime.toFixed(0)}ms
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma API call detectada</p>
              )}
            </div>
          </div>

          {/* Helper Text */}
          <div className="text-xs text-muted-foreground border-t pt-3">
            <p>💡 <strong>Dica:</strong> Use <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">window.performanceMonitor</code> no console</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
