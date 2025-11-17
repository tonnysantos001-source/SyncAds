/**
 * Hook React para usar AI System
 * Integra Core IA, Browser Automation e Prompt Library no chat
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { AISystem, TaskRequest, TaskResponse, PromptModule, SearchCriteria } from '../../ai-core';
import { getLoader } from '../../ai-core/prompt-library/loader';

export interface UseAISystemOptions {
  autoInit?: boolean;
  debugMode?: boolean;
  pythonServiceUrl?: string;
}

export interface AISystemState {
  initialized: boolean;
  loading: boolean;
  error: string | null;
  stats: any | null;
  availableModules: PromptModule[];
}

export function useAISystem(options: UseAISystemOptions = {}) {
  const {
    autoInit = true,
    debugMode = false,
    pythonServiceUrl = import.meta.env.VITE_PYTHON_SERVICE_URL || 'http://localhost:8000'
  } = options;

  const [state, setState] = useState<AISystemState>({
    initialized: false,
    loading: false,
    error: null,
    stats: null,
    availableModules: []
  });

  const aiSystemRef = useRef<AISystem | null>(null);
  const loaderRef = useRef<ReturnType<typeof getLoader> | null>(null);

  /**
   * Inicializa o AI System
   */
  const initialize = useCallback(async () => {
    if (aiSystemRef.current) {
      console.log('[useAISystem] Sistema já inicializado');
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Criar instância do AI System
      const aiSystem = new AISystem({
        core: {
          maxRetries: 3,
          fallbackEnabled: true,
          learningEnabled: true,
          debugMode
        },
        browser: {
          defaultTimeout: 30000,
          maxRetries: 3,
          debugMode
        },
        pythonService: {
          baseUrl: pythonServiceUrl,
          timeout: 60000
        },
        autoLoadModules: false, // Vamos carregar manualmente
        debugMode
      });

      // Configurar listeners de eventos
      aiSystem.on('system:initialized', () => {
        console.log('[useAISystem] Sistema inicializado com sucesso');
      });

      aiSystem.on('request:processing', (data) => {
        console.log('[useAISystem] Processando requisição:', data.requestId);
      });

      aiSystem.on('request:completed', (data) => {
        console.log('[useAISystem] Requisição concluída:', data.requestId);
      });

      aiSystem.on('request:error', (error) => {
        console.error('[useAISystem] Erro na requisição:', error);
      });

      // Carregar library profiles
      loaderRef.current = getLoader();
      const modules = await loaderRef.current.loadAll();

      console.log(`[useAISystem] ${modules.length} módulos carregados`);

      // Registrar módulos no sistema
      // Nota: O AISystem já registra módulos automaticamente quando carrega
      // Mas vamos garantir que temos a lista disponível

      aiSystemRef.current = aiSystem;

      // Obter estatísticas iniciais
      const stats = aiSystem.getStats();

      setState({
        initialized: true,
        loading: false,
        error: null,
        stats,
        availableModules: modules
      });

    } catch (error: any) {
      console.error('[useAISystem] Erro ao inicializar:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao inicializar AI System',
        initialized: false
      }));
    }
  }, [debugMode, pythonServiceUrl]);

  /**
   * Processa uma requisição do usuário
   */
  const processRequest = useCallback(async (
    userId: string,
    input: string,
    context?: Record<string, any>
  ): Promise<TaskResponse | null> => {
    if (!aiSystemRef.current) {
      throw new Error('AI System não inicializado. Chame initialize() primeiro.');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const request: TaskRequest = {
        userId,
        input,
        context,
        priority: 1,
        executionMode: 'auto'
      };

      const response = await aiSystemRef.current.processRequest(request);

      // Atualizar estatísticas
      const stats = aiSystemRef.current.getStats();
      setState(prev => ({ ...prev, stats, loading: false }));

      return response;

    } catch (error: any) {
      console.error('[useAISystem] Erro ao processar requisição:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao processar requisição'
      }));
      return null;
    }
  }, []);

  /**
   * Busca módulos na biblioteca
   */
  const searchModules = useCallback((criteria: SearchCriteria): PromptModule[] => {
    if (!aiSystemRef.current) {
      return [];
    }

    return aiSystemRef.current.findModules(criteria);
  }, []);

  /**
   * Busca um módulo específico por nome
   */
  const getModule = useCallback((name: string): PromptModule | undefined => {
    if (!aiSystemRef.current) {
      return undefined;
    }

    return aiSystemRef.current.getModuleByName(name);
  }, []);

  /**
   * Navega para URL e extrai dados
   */
  const navigateAndExtract = useCallback(async (
    url: string,
    selectors: Record<string, string>
  ): Promise<any> => {
    if (!aiSystemRef.current) {
      throw new Error('AI System não inicializado');
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const data = await aiSystemRef.current.navigateAndExtract(url, selectors);
      setState(prev => ({ ...prev, loading: false }));
      return data;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      throw error;
    }
  }, []);

  /**
   * Faz scraping de uma página
   */
  const scrapePage = useCallback(async (config: any): Promise<any[]> => {
    if (!aiSystemRef.current) {
      throw new Error('AI System não inicializado');
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const data = await aiSystemRef.current.scrapePage(config);
      setState(prev => ({ ...prev, loading: false }));
      return data;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
      throw error;
    }
  }, []);

  /**
   * Reseta o sistema
   */
  const reset = useCallback(() => {
    if (aiSystemRef.current) {
      aiSystemRef.current.reset();
      const stats = aiSystemRef.current.getStats();
      setState(prev => ({ ...prev, stats }));
    }
  }, []);

  /**
   * Atualiza estatísticas
   */
  const updateStats = useCallback(() => {
    if (aiSystemRef.current) {
      const stats = aiSystemRef.current.getStats();
      setState(prev => ({ ...prev, stats }));
    }
  }, []);

  /**
   * Recarrega módulos
   */
  const reloadModules = useCallback(async () => {
    if (!loaderRef.current) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      loaderRef.current.clearCache();
      const modules = await loaderRef.current.loadAll();

      setState(prev => ({
        ...prev,
        availableModules: modules,
        loading: false
      }));

      console.log(`[useAISystem] ${modules.length} módulos recarregados`);
    } catch (error: any) {
      console.error('[useAISystem] Erro ao recarregar módulos:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  }, []);

  /**
   * Obtém o browser controller
   */
  const getBrowserController = useCallback(() => {
    return aiSystemRef.current?.['browserController'];
  }, []);

  /**
   * Verifica se a extensão do navegador está conectada
   */
  const isBrowserConnected = useCallback((): boolean => {
    const controller = getBrowserController();
    return controller?.isConnected() || false;
  }, [getBrowserController]);

  // Auto-inicializar se configurado
  useEffect(() => {
    if (autoInit && !state.initialized && !state.loading) {
      initialize();
    }
  }, [autoInit, state.initialized, state.loading, initialize]);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      if (aiSystemRef.current) {
        aiSystemRef.current.removeAllListeners();
      }
    };
  }, []);

  return {
    // Estado
    initialized: state.initialized,
    loading: state.loading,
    error: state.error,
    stats: state.stats,
    availableModules: state.availableModules,

    // Métodos principais
    initialize,
    processRequest,

    // Busca de módulos
    searchModules,
    getModule,

    // Browser automation
    navigateAndExtract,
    scrapePage,
    isBrowserConnected,
    getBrowserController,

    // Utilidades
    reset,
    updateStats,
    reloadModules,

    // Referência direta (para casos avançados)
    aiSystem: aiSystemRef.current
  };
}

export default useAISystem;
