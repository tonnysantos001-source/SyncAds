/**
 * @deprecated Este hook foi descontinuado.
 *
 * Motivo: Chamava POST /api/chat-stream que NÃO existe no Vercel (causava erro 405).
 * Solução: Redireciona para chatService.ts que chama a Edge Function chat-enhanced
 * diretamente via Supabase — sem passar por rota Vercel inexistente.
 *
 * Componentes afetados: Nenhum — ChatPage.tsx usa chatService diretamente.
 *
 * @version 2.0.0 (deprecado e corrigido em 2026-03-10)
 */

import { useState, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import chatService from '@/lib/api/chatService';

// Manter interface para retrocompatibilidade caso algum componente importe
interface StreamOptions {
    conversationId?: string;
    context?: string;
    systemPrompt?: string;
    model?: 'claude' | 'gpt-4' | 'groq';
}

/**
 * @deprecated Use chatService.ts diretamente.
 * Este hook redireciona para chatService para evitar quebrar importações existentes.
 */
export function useChatStream() {
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamedContent, setStreamedContent] = useState('');

    const setAssistantTyping = useChatStore((state) => state.setAssistantTyping);
    const user = useAuthStore((state) => state.user);

    /**
     * @deprecated Use chatService.sendMessage() diretamente.
     * Redireciona para chatService (Edge Function chat-enhanced).
     */
    const sendMessage = useCallback(
        async (
            message: string,
            options: StreamOptions = {}
        ): Promise<string> => {
            if (!user) throw new Error('Usuário não autenticado');

            const { conversationId } = options;
            if (!conversationId) {
                throw new Error('conversationId é obrigatório');
            }

            setIsStreaming(true);
            setStreamedContent('');
            setAssistantTyping(true);

            try {
                const response = await chatService.sendMessage(
                    message,
                    conversationId,
                    {
                        onChunk: (chunk) => {
                            setStreamedContent((prev) => prev + chunk);
                        },
                    }
                );
                return response;
            } finally {
                setIsStreaming(false);
                setAssistantTyping(false);
            }
        },
        [user, setAssistantTyping]
    );

    const cancelStream = useCallback(() => {
        setIsStreaming(false);
        setAssistantTyping(false);
        setStreamedContent('');
        chatService.abort();
    }, [setAssistantTyping]);

    return {
        sendMessage,
        cancelStream,
        isStreaming,
        streamedContent,
    };
}
