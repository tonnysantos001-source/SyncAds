// ============================================================================
// AI STREAMING - SISTEMA DE STREAMING DE RESPOSTAS DA IA
// ============================================================================
// Implementa streaming de respostas para melhorar UX
// Permite feedback progressivo ao usuário durante processamento
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// TIPOS
// ============================================================================

export interface StreamChunk {
  type: "start" | "token" | "tool_call" | "tool_result" | "error" | "end";
  content?: string;
  toolCall?: {
    id: string;
    tool: string;
    params: Record<string, any>;
  };
  toolResult?: {
    id: string;
    success: boolean;
    data?: any;
    error?: string;
  };
  metadata?: {
    tokensUsed?: number;
    provider?: string;
    model?: string;
    processingTime?: number;
  };
  error?: string;
  timestamp: string;
}

export interface StreamOptions {
  onStart?: () => void;
  onToken?: (token: string) => void;
  onToolCall?: (toolCall: StreamChunk["toolCall"]) => void;
  onToolResult?: (result: StreamChunk["toolResult"]) => void;
  onError?: (error: string) => void;
  onEnd?: (metadata?: StreamChunk["metadata"]) => void;
  signal?: AbortSignal;
}

// ============================================================================
// CLASSE PRINCIPAL
// ============================================================================

export class AIStreamManager {
  private controller: ReadableStreamDefaultController | null = null;
  private encoder = new TextEncoder();
  private buffer = "";

  /**
   * Cria um ReadableStream para streaming de respostas
   */
  createStream(): ReadableStream<Uint8Array> {
    const self = this;

    return new ReadableStream({
      start(controller) {
        self.controller = controller;
      },
      cancel() {
        self.controller = null;
      },
    });
  }

  /**
   * Envia chunk de início
   */
  sendStart() {
    this.sendChunk({
      type: "start",
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Envia token (pedaço de texto)
   */
  sendToken(token: string) {
    this.sendChunk({
      type: "token",
      content: token,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Envia chamada de ferramenta
   */
  sendToolCall(toolCall: StreamChunk["toolCall"]) {
    this.sendChunk({
      type: "tool_call",
      toolCall,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Envia resultado de ferramenta
   */
  sendToolResult(result: StreamChunk["toolResult"]) {
    this.sendChunk({
      type: "tool_result",
      toolResult: result,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Envia erro
   */
  sendError(error: string) {
    this.sendChunk({
      type: "error",
      error,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Envia chunk de fim com metadados
   */
  sendEnd(metadata?: StreamChunk["metadata"]) {
    this.sendChunk({
      type: "end",
      metadata,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Envia chunk genérico
   */
  private sendChunk(chunk: StreamChunk) {
    if (!this.controller) {
      console.warn("Stream controller não disponível");
      return;
    }

    try {
      const data = JSON.stringify(chunk) + "\n";
      const encoded = this.encoder.encode(data);
      this.controller.enqueue(encoded);
    } catch (error) {
      console.error("Erro ao enviar chunk:", error);
    }
  }

  /**
   * Fecha o stream
   */
  close() {
    if (this.controller) {
      try {
        this.controller.close();
      } catch (error) {
        // Ignorar se já estiver fechado
      }
      this.controller = null;
    }
  }
}

// ============================================================================
// PARSER DE STREAM NO CLIENTE
// ============================================================================

export class StreamParser {
  private buffer = "";
  private callbacks: StreamOptions;

  constructor(callbacks: StreamOptions) {
    this.callbacks = callbacks;
  }

  /**
   * Processa chunk recebido
   */
  processChunk(chunk: string) {
    this.buffer += chunk;

    // Processar linhas completas (separadas por \n)
    const lines = this.buffer.split("\n");

    // Última linha pode estar incompleta
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.trim()) {
        try {
          const parsed: StreamChunk = JSON.parse(line);
          this.handleChunk(parsed);
        } catch (error) {
          console.error("Erro ao parsear chunk:", error, line);
        }
      }
    }
  }

  /**
   * Finaliza processamento
   */
  flush() {
    if (this.buffer.trim()) {
      try {
        const parsed: StreamChunk = JSON.parse(this.buffer);
        this.handleChunk(parsed);
      } catch (error) {
        console.error("Erro ao parsear buffer final:", error);
      }
    }
    this.buffer = "";
  }

  /**
   * Manipula chunk parseado
   */
  private handleChunk(chunk: StreamChunk) {
    switch (chunk.type) {
      case "start":
        this.callbacks.onStart?.();
        break;

      case "token":
        if (chunk.content) {
          this.callbacks.onToken?.(chunk.content);
        }
        break;

      case "tool_call":
        if (chunk.toolCall) {
          this.callbacks.onToolCall?.(chunk.toolCall);
        }
        break;

      case "tool_result":
        if (chunk.toolResult) {
          this.callbacks.onToolResult?.(chunk.toolResult);
        }
        break;

      case "error":
        if (chunk.error) {
          this.callbacks.onError?.(chunk.error);
        }
        break;

      case "end":
        this.callbacks.onEnd?.(chunk.metadata);
        break;

      default:
        console.warn("Tipo de chunk desconhecido:", chunk);
    }
  }
}

// ============================================================================
// HELPERS PARA PROVIDERS DE IA
// ============================================================================

/**
 * Converte stream do OpenAI para formato padronizado
 */
export async function* streamOpenAI(
  response: AsyncIterable<any>,
  streamManager: AIStreamManager
) {
  streamManager.sendStart();

  let fullContent = "";
  let tokensUsed = 0;

  try {
    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) {
        fullContent += delta.content;
        streamManager.sendToken(delta.content);
        yield delta.content;
      }

      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          if (toolCall.function) {
            streamManager.sendToolCall({
              id: toolCall.id,
              tool: toolCall.function.name,
              params: JSON.parse(toolCall.function.arguments || "{}"),
            });
          }
        }
      }

      // Atualizar contagem de tokens
      if (chunk.usage) {
        tokensUsed = chunk.usage.total_tokens || 0;
      }
    }

    streamManager.sendEnd({
      tokensUsed,
      provider: "openai",
    });

    return fullContent;
  } catch (error: any) {
    streamManager.sendError(error.message);
    throw error;
  } finally {
    streamManager.close();
  }
}

/**
 * Converte stream do Anthropic para formato padronizado
 */
export async function* streamAnthropic(
  response: AsyncIterable<any>,
  streamManager: AIStreamManager
) {
  streamManager.sendStart();

  let fullContent = "";
  let tokensUsed = 0;

  try {
    for await (const chunk of response) {
      if (chunk.type === "content_block_delta") {
        const text = chunk.delta?.text || "";
        if (text) {
          fullContent += text;
          streamManager.sendToken(text);
          yield text;
        }
      }

      if (chunk.type === "message_delta") {
        tokensUsed = chunk.usage?.output_tokens || 0;
      }
    }

    streamManager.sendEnd({
      tokensUsed,
      provider: "anthropic",
    });

    return fullContent;
  } catch (error: any) {
    streamManager.sendError(error.message);
    throw error;
  } finally {
    streamManager.close();
  }
}

/**
 * Converte stream do Groq para formato padronizado
 */
export async function* streamGroq(
  response: AsyncIterable<any>,
  streamManager: AIStreamManager
) {
  streamManager.sendStart();

  let fullContent = "";
  let tokensUsed = 0;

  try {
    for await (const chunk of response) {
      const delta = chunk.choices[0]?.delta;

      if (delta?.content) {
        fullContent += delta.content;
        streamManager.sendToken(delta.content);
        yield delta.content;
      }

      // Groq retorna usage no último chunk
      if (chunk.x_groq?.usage) {
        tokensUsed = chunk.x_groq.usage.total_tokens || 0;
      }
    }

    streamManager.sendEnd({
      tokensUsed,
      provider: "groq",
    });

    return fullContent;
  } catch (error: any) {
    streamManager.sendError(error.message);
    throw error;
  } finally {
    streamManager.close();
  }
}

// ============================================================================
// FUNÇÃO AUXILIAR PARA CRIAR RESPONSE COM STREAMING
// ============================================================================

export function createStreamResponse(
  stream: ReadableStream<Uint8Array>,
  headers?: Record<string, string>
): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no", // Disable buffering in nginx
      ...headers,
    },
  });
}

// ============================================================================
// EXEMPLO DE USO NO EDGE FUNCTION
// ============================================================================

/*
import { AIStreamManager, createStreamResponse, streamOpenAI } from "../_utils/ai-streaming.ts";

export async function handleChatStream(req: Request) {
  const streamManager = new AIStreamManager();
  const stream = streamManager.createStream();

  // Processar em background
  (async () => {
    try {
      const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [...],
          stream: true,
        }),
      });

      const openaiStream = openaiResponse.body!
        .pipeThrough(new TextDecoderStream())
        .pipeThrough(new TextLineStream());

      for await (const chunk of openaiStream) {
        // Processar e enviar via streamManager
        streamManager.sendToken(chunk);
      }

      streamManager.sendEnd({ tokensUsed: 1000 });
    } catch (error) {
      streamManager.sendError(error.message);
    } finally {
      streamManager.close();
    }
  })();

  return createStreamResponse(stream);
}
*/

// ============================================================================
// EXEMPLO DE USO NO CLIENTE (FRONTEND)
// ============================================================================

/*
import { StreamParser } from "@/lib/ai-streaming";

async function chatWithStreaming(message: string) {
  const parser = new StreamParser({
    onStart: () => {
      console.log("Stream iniciado");
      setIsLoading(true);
    },
    onToken: (token) => {
      // Adicionar token à mensagem sendo exibida
      setCurrentMessage((prev) => prev + token);
    },
    onToolCall: (toolCall) => {
      console.log("Ferramenta chamada:", toolCall.tool);
      setToolCalls((prev) => [...prev, toolCall]);
    },
    onToolResult: (result) => {
      console.log("Resultado da ferramenta:", result);
    },
    onError: (error) => {
      console.error("Erro no stream:", error);
      toast.error(error);
    },
    onEnd: (metadata) => {
      console.log("Stream finalizado", metadata);
      setIsLoading(false);
    },
  });

  const response = await fetch("/api/chat-stream", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      parser.processChunk(chunk);
    }
  } finally {
    parser.flush();
    reader.releaseLock();
  }
}
*/

// ============================================================================
// UTILITÁRIO: TEXT LINE STREAM (PARA PROCESSAR STREAMS SSE)
// ============================================================================

export class TextLineStream extends TransformStream<string, string> {
  constructor() {
    let buffer = "";

    super({
      transform(chunk, controller) {
        buffer += chunk;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          controller.enqueue(line);
        }
      },
      flush(controller) {
        if (buffer) {
          controller.enqueue(buffer);
        }
      },
    });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AIStreamManager;
