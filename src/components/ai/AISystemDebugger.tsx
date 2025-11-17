/**
 * AI SYSTEM DEBUGGER
 * Componente para testes manuais e debug do AI System
 */

import React, { useState, useEffect } from 'react';
import { useAISystem } from '@/hooks/useAISystem';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  IconAlertCircle,
  IconCheck,
  IconCircleDot,
  IconCpu,
  IconLoader2,
  IconRefresh,
  IconRocket,
  IconSearch,
  IconSparkles,
  IconTerminal,
  IconWorld,
} from '@tabler/icons-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

export function AISystemDebugger() {
  const user = useAuthStore((state) => state.user);

  const {
    initialized,
    loading,
    error,
    stats,
    availableModules,
    initialize,
    processRequest,
    searchModules,
    navigateAndExtract,
    isBrowserConnected,
    updateStats,
    reloadModules,
  } = useAISystem({ autoInit: false, debugMode: true });

  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [moduleSearch, setModuleSearch] = useState('');
  const [browserUrl, setBrowserUrl] = useState('');
  const [browserSelectors, setBrowserSelectors] = useState('{\n  "title": "h1",\n  "description": "p"\n}');
  const [logs, setLogs] = useState<Array<{ time: string; type: string; message: string }>>([]);

  const addLog = (type: string, message: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-50), { time, type, message }]);
  };

  useEffect(() => {
    if (initialized) {
      addLog('success', 'AI System inicializado com sucesso');
    }
  }, [initialized]);

  useEffect(() => {
    if (error) {
      addLog('error', error);
    }
  }, [error]);

  const handleInitialize = async () => {
    addLog('info', 'Inicializando AI System...');
    await initialize();
  };

  const handleTestRequest = async () => {
    if (!testInput.trim() || !user) return;

    setTestLoading(true);
    setTestResult(null);
    addLog('info', `Processando: "${testInput}"`);

    try {
      const result = await processRequest(user.id, testInput, {
        source: 'debugger',
        timestamp: Date.now(),
      });

      setTestResult(result);
      addLog('success', `Resultado: ${result?.status}`);

      if (result?.results) {
        addLog('info', `${result.results.length} passos executados`);
      }
    } catch (err: any) {
      addLog('error', err.message);
    } finally {
      setTestLoading(false);
    }
  };

  const handleBrowserTest = async () => {
    if (!browserUrl.trim()) return;

    setTestLoading(true);
    addLog('info', `Navegando para: ${browserUrl}`);

    try {
      const selectors = JSON.parse(browserSelectors);
      const data = await navigateAndExtract(browserUrl, selectors);

      setTestResult({ type: 'browser', data });
      addLog('success', 'Dados extraídos com sucesso');
    } catch (err: any) {
      addLog('error', err.message);
    } finally {
      setTestLoading(false);
    }
  };

  const filteredModules = moduleSearch
    ? availableModules.filter((m) =>
        m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
        m.packageName.toLowerCase().includes(moduleSearch.toLowerCase())
      )
    : availableModules;

  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (initialized) return 'text-green-500';
    return 'text-yellow-500';
  };

  const getStatusIcon = () => {
    if (error) return IconAlertCircle;
    if (initialized) return IconCheck;
    return IconCircleDot;
  };

  const StatusIcon = getStatusIcon();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <IconTerminal className="w-8 h-8" />
            AI System Debugger
          </h1>
          <p className="text-muted-foreground mt-1">
            Teste e debug do sistema de IA universal
          </p>
        </div>

        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-5 h-5', getStatusColor())} />
          <span className={cn('font-medium', getStatusColor())}>
            {error ? 'Erro' : initialized ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {initialized ? (
                <Badge variant="default" className="bg-green-500">Ativo</Badge>
              ) : (
                <Badge variant="secondary">Inativo</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Módulos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableModules.length}</div>
            <p className="text-xs text-muted-foreground mt-1">bibliotecas disponíveis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Browser</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isBrowserConnected() ? (
                <Badge variant="default" className="bg-blue-500">Conectado</Badge>
              ) : (
                <Badge variant="secondary">Offline</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.core?.successRate
                ? `${(stats.core.successRate * 100).toFixed(0)}%`
                : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.core?.totalExecutions || 0} execuções
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mb-6">
        <Button
          onClick={handleInitialize}
          disabled={initialized || loading}
          variant="default"
        >
          <IconRocket className="w-4 h-4 mr-2" />
          Inicializar Sistema
        </Button>

        <Button
          onClick={reloadModules}
          disabled={!initialized || loading}
          variant="outline"
        >
          <IconRefresh className="w-4 h-4 mr-2" />
          Recarregar Módulos
        </Button>

        <Button
          onClick={updateStats}
          disabled={!initialized}
          variant="outline"
        >
          <IconCpu className="w-4 h-4 mr-2" />
          Atualizar Stats
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <IconAlertCircle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">
            <IconSparkles className="w-4 h-4 mr-2" />
            Testar IA
          </TabsTrigger>
          <TabsTrigger value="browser">
            <IconWorld className="w-4 h-4 mr-2" />
            Browser
          </TabsTrigger>
          <TabsTrigger value="modules">
            <IconSearch className="w-4 h-4 mr-2" />
            Módulos ({availableModules.length})
          </TabsTrigger>
          <TabsTrigger value="logs">
            <IconTerminal className="w-4 h-4 mr-2" />
            Logs ({logs.length})
          </TabsTrigger>
        </TabsList>

        {/* Test Tab */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Testar Processamento de Requisição</CardTitle>
              <CardDescription>
                Digite uma requisição para testar o sistema de IA
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Requisição</label>
                <Textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Ex: Processar arquivo CSV com pandas e fazer análise estatística..."
                  rows={3}
                  disabled={!initialized}
                />
              </div>

              <Button
                onClick={handleTestRequest}
                disabled={!initialized || !testInput.trim() || testLoading}
                className="w-full"
              >
                {testLoading ? (
                  <>
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <IconRocket className="w-4 h-4 mr-2" />
                    Processar Requisição
                  </>
                )}
              </Button>

              {testResult && testResult.type !== 'browser' && (
                <div className="mt-4">
                  <Separator className="my-4" />
                  <h3 className="font-semibold mb-2">Resultado:</h3>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Browser Tab */}
        <TabsContent value="browser">
          <Card>
            <CardHeader>
              <CardTitle>Testar Automação de Navegador</CardTitle>
              <CardDescription>
                Navegue para uma URL e extraia dados usando seletores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">URL</label>
                <Input
                  value={browserUrl}
                  onChange={(e) => setBrowserUrl(e.target.value)}
                  placeholder="https://example.com"
                  disabled={!initialized}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Seletores (JSON)</label>
                <Textarea
                  value={browserSelectors}
                  onChange={(e) => setBrowserSelectors(e.target.value)}
                  placeholder='{"title": "h1", "description": "p"}'
                  rows={5}
                  disabled={!initialized}
                  className="font-mono text-xs"
                />
              </div>

              <Button
                onClick={handleBrowserTest}
                disabled={!initialized || !browserUrl.trim() || testLoading}
                className="w-full"
              >
                {testLoading ? (
                  <>
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                    Navegando...
                  </>
                ) : (
                  <>
                    <IconWorld className="w-4 h-4 mr-2" />
                    Extrair Dados
                  </>
                )}
              </Button>

              {testResult && testResult.type === 'browser' && (
                <div className="mt-4">
                  <Separator className="my-4" />
                  <h3 className="font-semibold mb-2">Dados Extraídos:</h3>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(testResult.data, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modules Tab */}
        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle>Módulos Disponíveis</CardTitle>
              <CardDescription>
                Bibliotecas Python carregadas no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Input
                  value={moduleSearch}
                  onChange={(e) => setModuleSearch(e.target.value)}
                  placeholder="Buscar módulos..."
                  className="w-full"
                />

                <ScrollArea className="h-[500px] pr-4">
                  <div className="space-y-3">
                    {filteredModules.map((module) => (
                      <Card key={module.id} className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{module.name}</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {module.description}
                            </p>
                            <div className="flex gap-2 mt-2">
                              <Badge variant="outline">{module.packageName}</Badge>
                              <Badge variant="secondary">{module.category}</Badge>
                              <Badge variant="outline" className="text-xs">
                                {(module.reliability * 100).toFixed(0)}% confiável
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {module.useCases.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-medium mb-1">Casos de uso:</p>
                            <ul className="text-xs text-muted-foreground space-y-1">
                              {module.useCases.slice(0, 3).map((useCase, idx) => (
                                <li key={idx}>• {useCase}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Logs do Sistema</CardTitle>
              <CardDescription>
                Histórico de eventos e operações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 font-mono text-xs">
                  {logs.map((log, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'p-2 rounded',
                        log.type === 'error' && 'bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-200',
                        log.type === 'success' && 'bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-200',
                        log.type === 'info' && 'bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-200'
                      )}
                    >
                      <span className="text-muted-foreground">[{log.time}]</span>{' '}
                      <span className="font-semibold uppercase">{log.type}</span>:{' '}
                      {log.message}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stats Section */}
      {stats && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Estatísticas Detalhadas</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-64">
              {JSON.stringify(stats, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AISystemDebugger;
