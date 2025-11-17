/**
 * useAISystem Hook - STUB VERSION
 *
 * Este é um stub temporário para manter compatibilidade
 * O AI Core foi removido e agora usamos apenas Supabase Edge Functions
 */

import { useState } from "react";

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
  availableModules: any[];
}

export function useAISystem(_options: UseAISystemOptions = {}) {
  const [state] = useState<AISystemState>({
    initialized: false,
    loading: false,
    error: null,
    stats: null,
    availableModules: [],
  });

  return {
    initialized: state.initialized,
    loading: state.loading,
    error: state.error,
    stats: state.stats,
    availableModules: state.availableModules,
    processRequest: async () => ({
      status: "error",
      error: "AI Core removed - use chatService instead",
      executionTime: 0,
    }),
    findModules: () => [],
    getStats: () => null,
    isBrowserConnected: false,
    reset: () => {},
  };
}
