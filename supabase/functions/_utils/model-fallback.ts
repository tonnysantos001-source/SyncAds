// ============================================================================
// MODEL FALLBACK
// ============================================================================
// Implementa fallback automático entre múltiplos provedores LLM
// Por: SYNCADS
// ============================================================================

export interface MessageRole {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ModelConfig {
  provider: string;
  model: string;
  apiKey: string;
  maxTokens: number;
  endpoint?: string;
}

export interface FallbackResult {
  success: boolean;
  model: string;
  provider: string;
  response: string;
  error?: string;
  tokensUsed?: number;
}

/**
 * Lista de modelos em ordem de prioridade
 */
export const MODEL_PRIORITY: ModelConfig[] = [
  // 1. OpenAI GPT-4 (Primary)
  {
    provider: 'OPENAI',
    model: 'gpt-4-turbo-preview',
    apiKey: Deno.env.get('OPENAI_API_KEY') || '',
    maxTokens: 128000,
  },
  // 2. Google Gemini 2.0 (Fallback 1) - Muito capaz e multimodal
  {
    provider: 'GOOGLE',
    model: 'gemini-2.0-flash-exp',
    apiKey: Deno.env.get('GOOGLE_AI_API_KEY') || Deno.env.get('GEMINI_API_KEY') || '',
    maxTokens: 1000000,
  },
  // 3. Anthropic Claude 3 (Fallback 2)
  {
    provider: 'ANTHROPIC',
    model: 'claude-3-opus-20240229',
    apiKey: Deno.env.get('ANTHROPIC_API_KEY') || '',
    maxTokens: 200000,
  },
  // 4. Groq Mixtral (Fallback 3) - O mais rápido
  {
    provider: 'GROQ',
    model: 'llama-3.3-70b-versatile',
    apiKey: Deno.env.get('GROQ_API_KEY') || '',
    maxTokens: 32768,
  },
];

/**
 * Chama IA com fallback automático
 */
export async function callWithFallback(
  systemPrompt: string,
  conversationHistory: MessageRole[],
  userMessage: string,
  temperature: number = 0.7
): Promise<FallbackResult> {
  // Preparar mensagens
  const messages = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userMessage },
  ];

  // Tentar cada modelo em sequência
  for (const config of MODEL_PRIORITY) {
    // Verificar se API key está disponível
    if (!config.apiKey) {
      console.log(`⚠️ ${config.provider} API key não configurada, pulando...`);
      continue;
    }

    try {
      console.log(`📤 Tentando ${config.provider} ${config.model}...`);

      const result = await callModel(config, messages, temperature);

      console.log(`✅ Sucesso com ${config.provider} ${config.model}`);
      
      return {
        success: true,
        model: config.model,
        provider: config.provider,
        response: result.response,
        tokensUsed: result.tokensUsed,
      };
    } catch (error: any) {
      console.log(`❌ ${config.provider} falhou: ${error.message}`);

      // Se foi último modelo, retornar erro
      if (config === MODEL_PRIORITY[MODEL_PRIORITY.length - 1]) {
        return {
          success: false,
          model: 'none',
          provider: 'none',
          response: '',
          error: `Todos modelos falharam. Último erro: ${error.message}`,
        };
      }

      // Continuar para próximo modelo
      console.log(`🔄 Tentando próximo modelo...`);
    }
  }

  // Se chegou aqui, nenhum modelo tinha API key
  return {
    success: false,
    model: 'none',
    provider: 'none',
    response: '',
    error: 'Nenhum modelo configurado com API key válida',
  };
}

/**
 * Chama um modelo específico
 */
async function callModel(
  config: ModelConfig,
  messages: MessageRole[],
  temperature: number
): Promise<{ response: string; tokensUsed?: number }> {
  const startTime = Date.now();

  if (config.provider === 'OPENAI') {
    return await callOpenAI(config, messages, temperature);
  } else if (config.provider === 'ANTHROPIC') {
    return await callAnthropic(config, messages, temperature);
  } else if (config.provider === 'GROQ') {
    return await callGroq(config, messages, temperature);
  } else if (config.provider === 'GOOGLE') {
    return await callGoogle(config, messages, temperature);
  } else {
    throw new Error(`Provider ${config.provider} não implementado`);
  }
}

/**
 * Chama OpenAI
 */
async function callOpenAI(
  config: ModelConfig,
  messages: MessageRole[],
  temperature: number
): Promise<{ response: string; tokensUsed?: number }> {
  const url = 'https://api.openai.com/v1/chat/completions';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }

  const data = await response.json();

  return {
    response: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens,
  };
}

/**
 * Chama Anthropic
 */
async function callAnthropic(
  config: ModelConfig,
  messages: MessageRole[],
  temperature: number
): Promise<{ response: string; tokensUsed?: number }> {
  const url = 'https://api.anthropic.com/v1/messages';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.slice(1), // Anthropic não aceita system role explícito
      system: messages[0].content, // Primeira mensagem como system
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic error: ${error}`);
  }

  const data = await response.json();

  return {
    response: data.content[0].text,
    tokensUsed: data.usage?.input_tokens && data.usage?.output_tokens
      ? data.usage.input_tokens + data.usage.output_tokens
      : undefined,
  };
}

/**
 * Chama Groq
 */
async function callGroq(
  config: ModelConfig,
  messages: MessageRole[],
  temperature: number
): Promise<{ response: string; tokensUsed?: number }> {
  const url = 'https://api.groq.com/openai/v1/chat/completions';
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
      temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq error: ${error}`);
  }

  const data = await response.json();

  return {
    response: data.choices[0].message.content,
    tokensUsed: data.usage?.total_tokens,
  };
}

/**
 * Chama Google Gemini
 */
async function callGoogle(
  config: ModelConfig,
  messages: MessageRole[],
  temperature: number
): Promise<{ response: string; tokensUsed?: number }> {
  // Nota: Idealmente usaríamos a implementação robusta de google-ai.ts, 
  // mas aqui mantemos o padrão simples para consistência interna do utils.
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent?key=${config.apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      })),
      generationConfig: {
        temperature,
        maxOutputTokens: 4096
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google error (${response.status}): ${error}`);
  }

  const data = await response.json();
  
  return {
    response: data.candidates[0].content.parts[0].text,
    tokensUsed: data.usageMetadata?.totalTokenCount || 0,
  };
}

