// ============================================================================
// USE CHAT STREAM - Hook para processar streaming de respostas da IA
// ============================================================================
// Integra com chat-stream-v2 edge function
// Fornece feedback progressivo em tempo real
// ============================================================================

import { useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

// ============================================================================
// TIPOS
// ============================================================================

export interface StreamChunk {
  type: "start" | "token" | "end" | "error";
  content?: string;
  metadata?: {
    tokensUsed?: number;
    provider?: string;
    model?: string;
    cached?: boolean;
  };
  error?: string;
  timestamp: string;
}

export interface ChatStreamOptions {
  conversationId: string;
  conversationHistory?: any[];
  stream?: boolean;
  onStart?: () => void;
  onToken?: (token: string) => void;
  onEnd?: (metadata?: any) => void;
  onError?: (error: string) => void;
}

export interface UseChatStreamResult {
  sendMessage: (message: string) => Promise<void>;
  isStreaming: boolean;
  currentMessage: string;
  error: string | null;
  metadata: any | null;
  abort: () => void;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useChatStream(options: ChatStreamOptions): UseChatStreamResult {
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<any | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const currentMessageRef = useRef("");

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  const sendMessage = useCallback(
    async (message: string) => {
      // Reset estado
      setError(null);
      setCurrentMessage("");
      setMetadata(null);
      currentMessageRef.current = "";

      // Criar AbortController para cancelamento
      abortControllerRef.current = new AbortController();

      try {
        setIsStreaming(true);
        options.onStart?.();

        // Obter token de autenticação
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          throw new Error("Não autenticado");
        }

        // Chamar edge function com streaming
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-stream-v2`,
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message,
              conversationId: options.conversationId,
              conversationHistory: options.conversationHistory || [],
              stream: options.stream !== false,
            }),
            signal: abortControllerRef.current.signal,
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erro ao processar mensagem");
        }

        // Verificar se é streaming ou resposta normal
        const contentType = response.headers.get("Content-Type");

        if (contentType?.includes("text/event-stream")) {
          // Processar streaming
          await processStream(response, {
            onStart: options.onStart,
            onToken: (token) => {
              currentMessageRef.current += token;
              setCurrentMessage(currentMessageRef.current);
              options.onToken?.(token);
            },
            onEnd: (meta) => {
              setMetadata(meta);
              options.onEnd?.(meta);
            },
            onError: (err) => {
              setError(err);
              options.onError?.(err);
            },
          });
        } else {
          // Resposta normal (cache hit ou streaming desabilitado)
          const data = await response.json();

          if (data.error) {
            throw new Error(data.error);
          }

          setCurrentMessage(data.response);
          currentMessageRef.current = data.response;
          setMetadata({
            tokensUsed: data.tokensUsed,
            cached: data.cached,
            cacheKey: data.cacheKey,
            hits: data.hits,
          });

          options.onEnd?.(data);
        }
      } catch (err: any) {
        if (err.name === "AbortError") {
          console.log("Stream cancelado pelo usuário");
          setError("Cancelado");
        } else {
          console.error("Erro no streaming:", err);
          setError(err.message || "Erro ao processar mensagem");
          options.onError?.(err.message);
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [options]
  );

  return {
    sendMessage,
    isStreaming,
    currentMessage,
    error,
    metadata,
    abort,
  };
}

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function processStream(
  response: Response,
  callbacks: {
    onStart?: () => void;
    onToken: (token: string) => void;
    onEnd: (metadata?: any) => void;
    onError: (error: string) => void;
  }
): Promise<void> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        // Processar último chunk se houver
        if (buffer.trim()) {
          processChunk(buffer, callbacks);
        }
        break;
      }

      // Decodificar chunk
      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Processar linhas completas
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim()) {
          processChunk(line, callbacks);
        }
      }
    }
  } catch (error: any) {
    if (error.name !== "AbortError") {
      callbacks.onError(error.message);
    }
  } finally {
    reader.releaseLock();
  }
}

function processChunk(
  line: string,
  callbacks: {
    onStart?: () => void;
    onToken: (token: string) => void;
    onEnd: (metadata?: any) => void;
    onError: (error: string) => void;
  }
): void {
  try {
    const chunk: StreamChunk = JSON.parse(line);

    switch (chunk.type) {
      case "start":
        callbacks.onStart?.();
        break;

      case "token":
        if (chunk.content) {
          callbacks.onToken(chunk.content);
        }
        break;

      case "end":
        callbacks.onEnd(chunk.metadata);
        break;

      case "error":
        if (chunk.error) {
          callbacks.onError(chunk.error);
        }
        break;

      default:
        console.warn("Tipo de chunk desconhecido:", chunk);
    }
  } catch (error) {
    console.error("Erro ao processar chunk:", error, line);
  }
}

// ============================================================================
// HOOK SIMPLIFICADO (para casos de uso básicos)
// ============================================================================

export function useSimpleChatStream(conversationId: string) {
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    sendMessage,
    isStreaming,
    currentMessage,
    error,
    metadata,
    abort,
  } = useChatStream({
    conversationId,
    onStart: () => {
      setIsLoading(true);
      setMessage("");
    },
    onToken: (token) => {
      setMessage((prev) => prev + token);
    },
    onEnd: () => {
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  return {
    sendMessage,
    isStreaming: isStreaming || isLoading,
    message: currentMessage || message,
    error,
    metadata,
    abort,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default useChatStream;
