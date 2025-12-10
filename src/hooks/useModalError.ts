/**
 * useModalError Hook
 * Hook para gerenciar erros em modais de forma padronizada
 * 
 * Features:
 * - Toast notifications automáticas
 * - Log de erros no console
 * - Retry logic opcional
 * 
 * @version 1.0.0
 */

import { useToast } from '@/components/ui/use-toast';
import { useCallback } from 'react';

interface ErrorOptions {
    /** Mostrar toast notification */
    showToast?: boolean;
    /** Contexto do erro (nome do modal, ação, etc) */
    context?: string;
    /** Mensagem customizada para o usuário */
    userMessage?: string;
    /** Se deve fazer retry automático */
    retry?: {
        enabled: boolean;
        maxAttempts?: number;
        delayMs?: number;
    };
}

export function useModalError() {
    const { toast } = useToast();

    /**
     * Handle error com feedback visual e logging
     */
    const handleError = useCallback(
        (error: Error | unknown, options: ErrorOptions = {}) => {
            const {
                showToast = true,
                context = 'Modal',
                userMessage,
            } = options;

            // Log no console
            console.error(`[${context}]`, error);

            // Extrair mensagem de erro
            const errorMessage = error instanceof Error
                ? error.message
                : 'Erro desconhecido';

            // Mostrar toast se habilitado
            if (showToast) {
                toast({
                    title: 'Algo deu errado',
                    description: userMessage || errorMessage,
                    variant: 'destructive',
                });
            }

            return errorMessage;
        },
        [toast]
    );

    /**
     * Wrapper para executar função com error handling
     */
    const withErrorHandling = useCallback(
        async <T,>(
            fn: () => Promise<T>,
            options: ErrorOptions = {}
        ): Promise<T | null> => {
            try {
                return await fn();
            } catch (error) {
                handleError(error, options);
                return null;
            }
        },
        [handleError]
    );

    /**
     * Retry logic com backoff exponencial
     */
    const withRetry = useCallback(
        async <T,>(
            fn: () => Promise<T>,
            maxAttempts = 3,
            delayMs = 1000
        ): Promise<T> => {
            let lastError: Error | unknown;

            for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                try {
                    return await fn();
                } catch (error) {
                    lastError = error;

                    // Log tentativa
                    console.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error);

                    // Se não é a última tentativa, aguardar
                    if (attempt < maxAttempts) {
                        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
                        await new Promise(resolve => setTimeout(resolve, delay));
                    }
                }
            }

            // Todas tentativas falharam
            throw lastError;
        },
        []
    );

    return {
        handleError,
        withErrorHandling,
        withRetry,
    };
}
