// ============================================
// ERROR HANDLER HOOK
// ============================================
// Hook React para tratamento de erros padronizado
// Integra com toast notifications
// ============================================

import { useToast } from '@/components/ui/use-toast';
import { useCallback } from 'react';
import { handleError, AppError, withRetry, RetryOptions } from '@/lib/errors';
import { useAuthStore } from '@/store/authStore'; // ✅ CORRIGIDO: store (singular)

export function useErrorHandler() {
  const { toast } = useToast();
  const { user, organization } = useAuthStore();

  const showError = useCallback(
    (error: any, customMessage?: string) => {
      const parsedError = handleError(error, {
        userId: user?.id,
        organizationId: organization?.id,
      });

      toast({
        title: 'Erro',
        description: customMessage || parsedError.userMessage,
        variant: 'destructive',
      });

      return parsedError;
    },
    [toast, user, organization]
  );

  const showSuccess = useCallback(
    (message: string) => {
      toast({
        title: 'Sucesso',
        description: message,
      });
    },
    [toast]
  );

  const showWarning = useCallback(
    (message: string) => {
      toast({
        title: 'Atenção',
        description: message,
        variant: 'default',
      });
    },
    [toast]
  );

  const showInfo = useCallback(
    (message: string) => {
      toast({
        title: 'Informação',
        description: message,
      });
    },
    [toast]
  );

  // Execute com tratamento de erro automático
  const executeWithErrorHandling = useCallback(
    async <T,>(
      fn: () => Promise<T>,
      options?: {
        successMessage?: string;
        errorMessage?: string;
        retry?: RetryOptions;
      }
    ): Promise<T | null> => {
      try {
        const executeFn = options?.retry ? () => withRetry(fn, options.retry) : fn;
        
        const result = await executeFn();

        if (options?.successMessage) {
          showSuccess(options.successMessage);
        }

        return result;
      } catch (error) {
        showError(error, options?.errorMessage);
        return null;
      }
    },
    [showError, showSuccess]
  );

  return {
    showError,
    showSuccess,
    showWarning,
    showInfo,
    executeWithErrorHandling,
  };
}

