// ============================================================================
// TOKEN COUNTER
// ============================================================================
// Implementa contagem de tokens para diferentes modelos LLM
// Por: SYNCADS
// ============================================================================

import { encoding_for_model, get_encoding } from 'https://deno.land/x/js_tiktoken@1.0.7/mod.ts';

export interface MessageRole {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Message {
  role: string;
  content: string;
}

export interface TokenCount {
  tokens: number;
  estimated: boolean;
}

// Cache de encoders por modelo
const encoderCache: Map<string, any> = new Map();

/**
 * Conta tokens para modelos OpenAI (usando tiktoken)
 */
export function countTokensOpenAI(
  text: string,
  model: string = 'gpt-4'
): number {
  try {
    // Obter ou criar encoder para o modelo
    let encoder = encoderCache.get(model);
    
    if (!encoder) {
      try {
        encoder = encoding_for_model(model);
        encoderCache.set(model, encoder);
      } catch (error) {
        console.warn(`⚠️ Modelo ${model} não encontrado, usando cl100k_base`);
        encoder = get_encoding('cl100k_base');
        encoderCache.set(model, encoder);
      }
    }

    // Contar tokens
    const tokens = encoder.encode(text);
    return tokens.length;
  } catch (error: any) {
    console.error('Erro ao contar tokens OpenAI:', error.message);
    return estimateTokens(text);
  }
}

/**
 * Estima tokens de forma genérica (fallback)
 */
export function estimateTokens(text: string): number {
  // Estimativa: 1 token ≈ 4 caracteres (aprox.)
  // OpenAI usa ~0.75 tokens por palavra
  // Textos em português tendem a ser ~0.7
  const chars = text.length;
  return Math.ceil(chars / 4);
}

/**
 * Conta tokens de uma mensagem com role
 */
export function countMessageTokens(message: Message): number {
  // Formato: "role: content" = ~2 tokens extras
  const fullText = `${message.role}: ${message.content}`;
  return countTokensOpenAI(fullText);
}

/**
 * Conta tokens de uma conversa completa
 */
export function countConversationTokens(messages: Message[]): number {
  let total = 0;

  for (const message of messages) {
    total += countMessageTokens(message);
  }

  return total;
}

/**
 * Conta tokens de uma conversa com histórico (estimado)
 */
export function estimateConversationTokens(
  currentMessage: string,
  conversationHistory: MessageRole[] = [],
  systemPrompt?: string
): TokenCount {
  try {
    // Contar tokens do system prompt
    let total = systemPrompt ? countTokensOpenAI(systemPrompt) : 0;

    // Contar tokens do histórico
    for (const msg of conversationHistory) {
      const fullText = `${msg.role}: ${msg.content}`;
      total += countTokensOpenAI(fullText);
    }

    // Contar tokens da mensagem atual
    total += countTokensOpenAI(currentMessage);

    // Adicionar overhead de formatação (~50 tokens)
    total += 50;

    return {
      tokens: total,
      estimated: false,
    };
  } catch (error: any) {
    console.error('Erro ao contar tokens da conversa:', error.message);

    // Fallback para estimativa genérica
    const estimated = estimateTokens(
      (systemPrompt || '') +
      conversationHistory.map(m => m.content).join(' ') +
      currentMessage
    );

    return {
      tokens: estimated,
      estimated: true,
    };
  }
}

/**
 * Valida se a conversa está dentro do limite de tokens
 */
export function validateTokenLimit(
  tokens: number,
  maxTokens: number = 128000
): {
  valid: boolean;
  percentage: number;
  remaining: number;
  warning?: string;
} {
  const percentage = Math.round((tokens / maxTokens) * 100);
  const remaining = maxTokens - tokens;

  return {
    valid: tokens <= maxTokens,
    percentage,
    remaining,
    warning: percentage > 80 ? 'Conversa perto do limite!' : undefined,
  };
}

/**
 * Formata contagem de tokens para log
 */
export function formatTokenCount(count: TokenCount): string {
  const estimated = count.estimated ? ' (estimado)' : '';
  return `${count.tokens.toLocaleString()} tokens${estimated}`;
}

