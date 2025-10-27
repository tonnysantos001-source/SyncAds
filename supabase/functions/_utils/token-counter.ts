// ============================================================================
// TOKEN COUNTER
// ============================================================================
// Implementa contagem de tokens para diferentes modelos LLM
// Por: SYNCADS
// ============================================================================

// Removendo import de tiktoken para evitar erros de dependência
// Usando estimativa simples em vez disso

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
 * Conta tokens para modelos OpenAI (estimativa simples)
 */
export function countTokensOpenAI(
  text: string,
  model: string = 'gpt-4'
): number {
  // Estimativa simples: ~4 caracteres = 1 token
  // Esta é uma aproximação, não é exata
  return estimateTokens(text);
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
  // Estimativa genérica (sem tiktoken)
  let total = 0;
  
  if (systemPrompt) {
    total += estimateTokens(systemPrompt);
  }

  for (const msg of conversationHistory) {
    total += estimateTokens(msg.content);
  }

  total += estimateTokens(currentMessage);

  // Adicionar overhead de formatação (~50 tokens)
  total += 50;

  return {
    tokens: total,
    estimated: true,
  };
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

