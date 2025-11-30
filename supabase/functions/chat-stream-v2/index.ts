// ============================================================================
// CHAT STREAM V2 - Edge Function com Streaming Completo
// ============================================================================
// Implementa streaming de respostas da IA com cache e rate limiting integrados
// Fornece feedback progressivo ao usuário em tempo real
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflightRequest } from "../_utils/cors.ts";
import {
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  checkUserRateLimit,
  logAudit,
} from "../_utils/ai-cache-helper.ts";

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const STREAMING_ENABLED = true;
const CACHE_TTL = 86400; // 24 horas

// ============================================================================
// STREAMING HELPER
// ============================================================================

class StreamingResponse {
  private encoder = new TextEncoder();
  private controller: ReadableStreamDefaultController | null = null;

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

  sendChunk(data: any) {
    if (!this.controller) return;

    try {
      const json = JSON.stringify(data) + "\n";
      this.controller.enqueue(this.encoder.encode(json));
    } catch (error) {
      console.error("Erro ao enviar chunk:", error);
    }
  }

  sendToken(token: string) {
    this.sendChunk({ type: "token", content: token, timestamp: new Date().toISOString() });
  }

  sendStart() {
    this.sendChunk({ type: "start", timestamp: new Date().toISOString() });
  }

  sendEnd(metadata?: any) {
    this.sendChunk({ type: "end", metadata, timestamp: new Date().toISOString() });
  }

  sendError(error: string) {
    this.sendChunk({ type: "error", error, timestamp: new Date().toISOString() });
  }

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
// HANDLER PRINCIPAL
// ============================================================================

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return handlePreflightRequest();
  }

  try {
    const {
      message,
      conversationId,
      conversationHistory = [],
      stream = STREAMING_ENABLED,
    } = await req.json();

    // Validação
    if (!message) {
      throw new Error("Mensagem é obrigatória");
    }

    // Autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header obrigatório");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    // Verificar usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error("Não autorizado");
    }

    // Verificar role
    const { data: userData } = await supabase
      .from("User")
      .select("role")
      .eq("id", user.id)
      .single();

    const isAdmin = userData?.role === "ADMIN" || userData?.role === "SUPER_ADMIN";

    // Rate limiting (não aplica para admins)
    if (!isAdmin) {
      const rateLimitResult = await checkUserRateLimit(
        supabase,
        user.id,
        "AI_CHAT",
        {
          requestsPerMinute: 10,
          requestsPerHour: 100,
          requestsPerDay: 500,
        },
      );

      if (!rateLimitResult.allowed) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded",
            message: "Limite de requisições atingido. Tente novamente em alguns segundos.",
            retryAfter: rateLimitResult.retryAfter,
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
              "Retry-After": String(rateLimitResult.retryAfter || 60),
            },
          },
        );
      }
    }

    // Buscar configuração de IA
    const { data: aiConnection, error: aiError } = await supabase
      .from("GlobalAiConnection")
      .select("*")
      .eq("isActive", true)
      .single();

    if (aiError || !aiConnection) {
      throw new Error("Nenhuma IA configurada. Configure em Configurações > IA Global.");
    }

    if (!aiConnection.apiKey) {
      throw new Error("IA configurada mas sem API Key válida.");
    }

    // Verificar cache
    const cacheKey = generateCacheKey(message, {
      conversationId,
      model: aiConnection.model,
      provider: aiConnection.provider,
    });

    console.log("🔍 Verificando cache:", cacheKey);

    const cachedResponse = await getCachedResponse(supabase, cacheKey);

    // Se encontrou no cache, retornar imediatamente
    if (cachedResponse.hit && cachedResponse.response) {
      console.log("✅ Cache HIT! Retornando resposta em cache");

      await logAudit(
        supabase,
        "ai_cache",
        cacheKey,
        "UPDATE",
        null,
        { hits: cachedResponse.hits, cached: true },
        user.id,
      );

      return new Response(
        JSON.stringify({
          response: cachedResponse.response,
          cached: true,
          cacheKey,
          hits: cachedResponse.hits,
          tokensUsed: cachedResponse.metadata?.tokensUsed || 0,
        }),
        {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "X-Cache": "HIT",
            "X-Cache-Hits": String(cachedResponse.hits),
          },
        },
      );
    }

    console.log("❌ Cache MISS - Chamando IA com streaming");

    // Se streaming desabilitado, usar método tradicional
    if (!stream) {
      // Chamar IA sem streaming
      const response = await callAIWithoutStreaming(
        supabase,
        aiConnection,
        message,
        conversationHistory,
      );

      // Salvar no cache
      await setCachedResponse(
        supabase,
        cacheKey,
        response.text,
        {
          provider: aiConnection.provider,
          model: aiConnection.model,
          tokensUsed: response.tokensUsed,
        },
        CACHE_TTL,
      );

      return new Response(
        JSON.stringify({
          response: response.text,
          cached: false,
          tokensUsed: response.tokensUsed,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
        },
      );
    }

    // ========================================================================
    // STREAMING MODE
    // ========================================================================

    const streamManager = new StreamingResponse();
    const stream = streamManager.createStream();

    // Processar streaming em background
    (async () => {
      try {
        streamManager.sendStart();

        // Chamar IA com streaming
        const fullResponse = await callAIWithStreaming(
          supabase,
          aiConnection,
          message,
          conversationHistory,
          streamManager,
        );

        // Salvar no cache após concluir
        await setCachedResponse(
          supabase,
          cacheKey,
          fullResponse.text,
          {
            provider: aiConnection.provider,
            model: aiConnection.model,
            tokensUsed: fullResponse.tokensUsed,
          },
          CACHE_TTL,
        );

        // Salvar mensagens no banco
        await saveChatMessages(supabase, conversationId, user.id, message, fullResponse.text);

        // Registrar no audit log
        await logAudit(
          supabase,
          "ai_requests",
          conversationId,
          "INSERT",
          null,
          {
            userId: user.id,
            provider: aiConnection.provider,
            model: aiConnection.model,
            tokensUsed: fullResponse.tokensUsed,
            cached: false,
            cacheKey,
          },
          user.id,
        );

        streamManager.sendEnd({
          tokensUsed: fullResponse.tokensUsed,
          provider: aiConnection.provider,
          model: aiConnection.model,
          cached: false,
        });
      } catch (error: any) {
        console.error("❌ Erro no streaming:", error);
        streamManager.sendError(error.message);
      } finally {
        streamManager.close();
      }
    })();

    // Retornar stream
    return new Response(stream, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Cache": "MISS",
      },
    });
  } catch (error: any) {
    console.error("❌ Erro geral:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Erro ao processar mensagem",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

// ============================================================================
// FUNÇÕES AUXILIARES
// ============================================================================

async function callAIWithoutStreaming(
  supabase: any,
  aiConnection: any,
  message: string,
  conversationHistory: any[],
): Promise<{ text: string; tokensUsed: number }> {
  // Preparar mensagens
  const messages = [
    { role: "system", content: "Você é um assistente inteligente." },
    ...conversationHistory.map((msg: any) => ({
      role: msg.role.toLowerCase(),
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  // Chamar IA baseado no provider
  const provider = aiConnection.provider.toLowerCase();

  if (provider.includes("groq")) {
    return await callGroq(aiConnection, messages);
  } else if (provider.includes("anthropic") || provider.includes("claude")) {
    return await callAnthropic(aiConnection, messages);
  } else {
    return await callOpenAI(aiConnection, messages);
  }
}

async function callAIWithStreaming(
  supabase: any,
  aiConnection: any,
  message: string,
  conversationHistory: any[],
  streamManager: StreamingResponse,
): Promise<{ text: string; tokensUsed: number }> {
  const messages = [
    { role: "system", content: "Você é um assistente inteligente." },
    ...conversationHistory.map((msg: any) => ({
      role: msg.role.toLowerCase(),
      content: msg.content,
    })),
    { role: "user", content: message },
  ];

  const provider = aiConnection.provider.toLowerCase();

  if (provider.includes("groq")) {
    return await callGroqStreaming(aiConnection, messages, streamManager);
  } else if (provider.includes("anthropic") || provider.includes("claude")) {
    return await callAnthropicStreaming(aiConnection, messages, streamManager);
  } else {
    return await callOpenAIStreaming(aiConnection, messages, streamManager);
  }
}

// Groq Streaming
async function callGroqStreaming(
  aiConnection: any,
  messages: any[],
  streamManager: StreamingResponse,
): Promise<{ text: string; tokensUsed: number }> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${aiConnection.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: aiConnection.model || "llama-3.1-70b-versatile",
      messages,
      temperature: aiConnection.temperature || 0.7,
      max_tokens: aiConnection.maxTokens || 4096,
      stream: true,
    }),
  });

  let fullText = "";
  let tokensUsed = 0;

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const delta = json.choices[0]?.delta?.content;

            if (delta) {
              fullText += delta;
              streamManager.sendToken(delta);
            }

            if (json.usage?.total_tokens) {
              tokensUsed = json.usage.total_tokens;
            }
          } catch (e) {
            // Ignorar erros de parse
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { text: fullText, tokensUsed };
}

// OpenAI Streaming (similar ao Groq)
async function callOpenAIStreaming(
  aiConnection: any,
  messages: any[],
  streamManager: StreamingResponse,
): Promise<{ text: string; tokensUsed: number }> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${aiConnection.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: aiConnection.model || "gpt-4",
      messages,
      temperature: aiConnection.temperature || 0.7,
      max_tokens: aiConnection.maxTokens || 4096,
      stream: true,
    }),
  });

  let fullText = "";
  let tokensUsed = 0;

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);
            const delta = json.choices[0]?.delta?.content;

            if (delta) {
              fullText += delta;
              streamManager.sendToken(delta);
            }
          } catch (e) {
            // Ignorar
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { text: fullText, tokensUsed };
}

// Anthropic Streaming
async function callAnthropicStreaming(
  aiConnection: any,
  messages: any[],
  streamManager: StreamingResponse,
): Promise<{ text: string; tokensUsed: number }> {
  // Anthropic usa formato diferente
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": aiConnection.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: aiConnection.model || "claude-3-opus-20240229",
      messages: messages.filter((m) => m.role !== "system"),
      system: messages.find((m) => m.role === "system")?.content || "",
      max_tokens: aiConnection.maxTokens || 4096,
      temperature: aiConnection.temperature || 0.7,
      stream: true,
    }),
  });

  let fullText = "";
  let tokensUsed = 0;

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          try {
            const json = JSON.parse(data);

            if (json.type === "content_block_delta") {
              const text = json.delta?.text;
              if (text) {
                fullText += text;
                streamManager.sendToken(text);
              }
            }

            if (json.type === "message_delta" && json.usage) {
              tokensUsed = json.usage.output_tokens || 0;
            }
          } catch (e) {
            // Ignorar
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return { text: fullText, tokensUsed };
}

// Funções sem streaming (fallback)
async function callGroq(aiConnection: any, messages: any[]): Promise<{ text: string; tokensUsed: number }> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${aiConnection.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: aiConnection.model || "llama-3.1-70b-versatile",
      messages,
      temperature: aiConnection.temperature || 0.7,
      max_tokens: aiConnection.maxTokens || 4096,
    }),
  });

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || "",
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function callOpenAI(aiConnection: any, messages: any[]): Promise<{ text: string; tokensUsed: number }> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${aiConnection.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: aiConnection.model || "gpt-4",
      messages,
      temperature: aiConnection.temperature || 0.7,
      max_tokens: aiConnection.maxTokens || 4096,
    }),
  });

  const data = await response.json();
  return {
    text: data.choices[0]?.message?.content || "",
    tokensUsed: data.usage?.total_tokens || 0,
  };
}

async function callAnthropic(aiConnection: any, messages: any[]): Promise<{ text: string; tokensUsed: number }> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": aiConnection.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: aiConnection.model || "claude-3-opus-20240229",
      messages: messages.filter((m) => m.role !== "system"),
      system: messages.find((m) => m.role === "system")?.content || "",
      max_tokens: aiConnection.maxTokens || 4096,
      temperature: aiConnection.temperature || 0.7,
    }),
  });

  const data = await response.json();
  return {
    text: data.content[0]?.text || "",
    tokensUsed: data.usage?.output_tokens || 0,
  };
}

async function saveChatMessages(
  supabase: any,
  conversationId: string,
  userId: string,
  userMessage: string,
  aiMessage: string,
): Promise<void> {
  try {
    // Salvar mensagem do usuário
    await supabase.from("ChatMessage").insert({
      id: crypto.randomUUID(),
      conversationId,
      role: "USER",
      content: userMessage,
      userId,
    });

    // Salvar mensagem da IA
    await supabase.from("ChatMessage").insert({
      id: crypto.randomUUID(),
      conversationId,
      role: "ASSISTANT",
      content: aiMessage,
      userId,
    });
  } catch (error) {
    console.error("Erro ao salvar mensagens:", error);
  }
}
