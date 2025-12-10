/**
 * useChatStream Hook
 * Hook para gerenciar streaming de chat com Edge Functions
 * 
 * Features:
 * - Server-Sent Events (SSE) streaming
 * - Event parsing automático
 * - Error handling robusto
 * - Retry logic
 * - Typing indicators
 * 
 * @version 1.0.0
 */

import { useState, useCallback } from 'react';
import { useModalError } from './useModalError';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface StreamOptions {
    /** ID da conversa ativa */
    conversationId?: string;
    /** Contexto adicional para a IA */
    context?: string;
    /** System prompt customizado */
    systemPrompt?: string;
    /** Modelo de IA a usar */
    model?: 'claude' | 'gpt-4' | 'groq';
}

export function useChatStream() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedContent, setStreamedContent] = useState('');

    const { handleError, withRetry } = useModalError();
    const addMessage = useChatStore((state) => state.addMessage);
    const setAssistantTyping = useChatStore((state) => state.setAssistantTyping);
    const user = useAuthStore((state) => state.user);

    /**
     * Envia mensagem e faz streaming da resposta
     */
    const sendMessage = useCallback(
        async (
            message: string,
            options: StreamOptions = {}
        ): Promise<string> => {
            if (!user) {
                throw new Error('Usuário não autenticado');
            }

            const {
                conversationId,
                context = 'chat',
                systemPrompt,
                model = 'claude',
            } = options;

            setIsStreaming(true);
            setStreamedContent('');
            setAssistantTyping(true);

            try {
                // Adicionar mensagem do usuário imediatamente
                if (conversationId) {
                    await addMessage(user.id, conversationId, {
                        role: 'user',
                        content: message,
                    });
                }

                // Chamar Edge Function com retry
                const fullContent = await withRetry(async () => {
                    const response = await fetch('/api/chat-stream', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${user.id}`, // Usar token real aqui
                        },
                        body: JSON.stringify({
                            message,
                            conversationId,
                            context,
                            systemPrompt,
                            model,
                            userId: user.id,
                        }),
                    });

                    if (!response.ok) {
                        const error = await response.json();
                        throw new Error(error.message || 'Erro ao enviar mensagem');
                    }

                    // Processar SSE stream
                    return await processStream(response, conversationId);
                }, 2); // 2 tentativas

                return fullContent;
            } catch (error) {
                handleError(error, {
                    context: 'Chat Stream',
                    userMessage: 'Não foi possível enviar sua mensagem. Tente novamente.',
                });
                throw error;
            } finally {
                setIsStreaming(false);
                setAssistantTyping(false);
            }
        },
        [user, addMessage, setAssistantTyping, handleError, withRetry]
    );

    /**
     * Processa stream de eventos do servidor
     */
    const processStream = async (
        response: Response,
        conversationId?: string
    ): Promise<string> => {
        const reader = response.body?.getReader();
        if (!reader) {
            throw new Error('Stream não disponível');
        }

        const decoder = new TextDecoder();
        let fullContent = '';

        try {
            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                // Decodificar chunk
                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.trim() || !line.startsWith('data: ')) continue;

                    const data = line.slice(6); // Remove 'data: '

                    if (data === '[DONE]') {
                        // Stream finalizado
                        break;
                    }

                    try {
                        const parsed = JSON.parse(data);

                        if (parsed.content) {
                            fullContent += parsed.content;
                            setStreamedContent(fullContent);
                        }

                        if (parsed.error) {
                            throw new Error(parsed.error);
                        }
                    } catch (e) {
                        // Ignorar linhas inválidas
                        if (e instanceof SyntaxError) continue;
                        throw e;
                    }
                }
            }

            // Adicionar mensagem completa do assistente
            if (conversationId && fullContent && user) {
                await addMessage(user.id, conversationId, {
                    role: 'assistant',
                    content: fullContent,
                });
            }

            return fullContent;
        } finally {
            reader.releaseLock();
        }
    };

    /**
     * Cancela stream em andamento
     */
    const cancelStream = useCallback(() => {
        setIsStreaming(false);
        setAssistantTyping(false);
        setStreamedContent('');
    }, [setAssistantTyping]);

    return {
        sendMessage,
        cancelStream,
        isStreaming,
        streamedContent,
    };
}
