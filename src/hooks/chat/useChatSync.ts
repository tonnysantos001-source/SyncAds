import { useEffect, useRef, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { ensureValidSession } from '@/lib/supabase';

interface UseChatSyncOptions {
  /**
   * Intervalo de sincronização automática em milissegundos
   * @default 30000 (30 segundos)
   */
  syncInterval?: number;

  /**
   * Se deve sincronizar quando o app volta ao foco
   * @default true
   */
  syncOnFocus?: boolean;

  /**
   * Se deve sincronizar quando volta online
   * @default true
   */
  syncOnOnline?: boolean;

  /**
   * Se está habilitado (útil para desabilitar em páginas que não usam chat)
   * @default true
   */
  enabled?: boolean;

  /**
   * Contexto do chat para filtrar conversas isoladas
   * Valores: 'web' | 'extension' | 'admin'
   * @default undefined (carrega todos — evitar, sempre passar o contexto)
   */
  context?: string;
}

/**
 * Hook para gerenciar sincronização de chat entre dispositivos
 *
 * Este hook:
 * - Garante que a sessão está sempre válida
 * - Sincroniza conversas automaticamente
 * - Detecta quando o app volta ao foco e sincroniza
 * - Detecta quando volta online e sincroniza
 * - É otimizado para dispositivos móveis
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   const { isLoading, lastSync, sync } = useChatSync();
 *
 *   return (
 *     <div>
 *       {isLoading && <LoadingSpinner />}
 *       <button onClick={sync}>Sincronizar</button>
 *       <p>Última sincronização: {lastSync}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useChatSync(options: UseChatSyncOptions = {}) {
  const {
    syncInterval = 30000, // 30 segundos
    syncOnFocus = true,
    syncOnOnline = true,
    enabled = true,
    context, // ✅ FIX: filtrar por contexto para separar web/extension/admin
  } = options;

  const user = useAuthStore((state) => state.user);
  const loadConversations = useChatStore((state) => state.loadConversations);

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<Date | null>(null);
  const isSyncingRef = useRef(false);

  /**
   * Função principal de sincronização
   */
  const sync = useCallback(async () => {
    if (!enabled || !user?.id || isSyncingRef.current) {
      return;
    }

    try {
      isSyncingRef.current = true;
      console.log('🔄 Sincronizando chat...');

      // Garantir que a sessão está válida antes de sincronizar
      const isValid = await ensureValidSession();

      if (!isValid) {
        console.warn('⚠️ Sessão inválida, não é possível sincronizar');
        return;
      }

      // Carregar conversas — filtradas por contexto para isolamento correto
      await loadConversations(user.id, context);

      lastSyncRef.current = new Date();
      console.log('✅ Chat sincronizado com sucesso', context ? `(context=${context})` : '(sem filtro de contexto)');
    } catch (error) {
      console.error('❌ Erro ao sincronizar chat:', error);
    } finally {
      isSyncingRef.current = false;
    }
  }, [enabled, user?.id, loadConversations]);

  /**
   * Configurar sincronização periódica
   */
  useEffect(() => {
    if (!enabled || !user?.id) {
      return;
    }

    // Sincronização inicial
    sync();

    // Configurar intervalo de sincronização
    if (syncInterval > 0) {
      syncIntervalRef.current = setInterval(sync, syncInterval);
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [enabled, user?.id, sync, syncInterval]);

  /**
   * Sincronizar quando o app volta ao foco
   */
  useEffect(() => {
    if (!enabled || !syncOnFocus) {
      return;
    }

    const handleFocus = () => {
      console.log('👀 App voltou ao foco, sincronizando...');
      sync();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [enabled, syncOnFocus, sync]);

  /**
   * Sincronizar quando volta online
   */
  useEffect(() => {
    if (!enabled || !syncOnOnline) {
      return;
    }

    const handleOnline = () => {
      console.log('🌐 Voltou online, sincronizando...');
      sync();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enabled, syncOnOnline, sync]);

  /**
   * Listener para mudanças de visibilidade (mobile)
   */
  useEffect(() => {
    if (!enabled || !syncOnFocus) {
      return;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ Página ficou visível, sincronizando...');
        sync();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, syncOnFocus, sync]);

  return {
    /**
     * Função para sincronizar manualmente
     */
    sync,

    /**
     * Se está sincronizando no momento
     */
    isLoading: isSyncingRef.current,

    /**
     * Data/hora da última sincronização
     */
    lastSync: lastSyncRef.current,
  };
}

/**
 * Hook simplificado que apenas garante que o chat está sincronizado
 * Útil para páginas que precisam apenas garantir que os dados estão atualizados
 *
 * @example
 * ```tsx
 * function ChatPage() {
 *   useEnsureChatSync();
 *
 *   return <ChatInterface />;
 * }
 * ```
 */
export function useEnsureChatSync() {
  const { sync } = useChatSync({
    syncInterval: 0, // Desabilitar sincronização automática
    syncOnFocus: true,
    syncOnOnline: true,
  });

  // Sincronizar apenas uma vez ao montar
  useEffect(() => {
    sync();
  }, []);
}
