/**
 * ============================================================================
 * GOOGLE AI WRAPPER WITH RETRY & ERROR HANDLING
 * ============================================================================
 * Camada de resiliência para chamadas ao Google Gemini
 * Por: SYNCADS
 * ============================================================================
 */

import { retry } from './retry.ts';

/**
 * Interface para mensagens no formato Gemini
 */
export interface GeminiPart {
  text: string;
}

export interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export interface GeminiRequest {
  contents: GeminiContent[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
  };
}

/**
 * Chama o Google Generative AI com retentativas automáticas em caso de 503 ou 429
 * 
 * @param model - Nome do modelo (ex: 'gemini-1.5-flash')
 * @param apiKey - Chave da API do Google
 * @param payload - Corpo da requisição (GeminiRequest)
 * @returns Resposta da API
 */
export async function callGoogleWithRetry(
  model: string,
  apiKey: string,
  payload: GeminiRequest
): Promise<any> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  return await retry(async () => {
    console.log(`📡 [Google AI] Chamando modelo ${model}...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try { errorData = JSON.parse(errorText); } catch { errorData = { error: { message: errorText } }; }

      const status = response.status;
      const message = errorData.error?.message || 'Erro desconhecido';
      const reason = errorData.error?.details?.[0]?.reason || '';

      console.error(`❌ [Google AI] HTTP ${status}: ${message} (${reason})`);

      // Erros que merecem retry automático:
      // 503 SERVICE_UNAVAILABLE / MODEL_CAPACITY_EXHAUSTED
      // 429 TOO_MANY_REQUESTS
      // 500 INTERNAL_ERROR
      const retryableStatuses = [503, 429, 500];
      const isCapacityExhausted = reason === 'MODEL_CAPACITY_EXHAUSTED' || message.includes('No capacity available');

      if (retryableStatuses.includes(status) || isCapacityExhausted) {
        throw new Error(`Google AI Retryable Error (${status}): ${message}`);
      }

      // Se não for retentável, lance erro fatal
      throw new Error(`Google AI Fatal Error (${status}): ${message}`);
    }

    const data = await response.json();
    
    // Validar se há conteúdo na resposta
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.warn('⚠️ [Google AI] Resposta vazia ou inesperada:', JSON.stringify(data));
      // Pode ser um erro de segurança/bloqueio que o Google retorna com 200 às vezes
      if (data.promptFeedback?.blockReason) {
        throw new Error(`Google AI Blocked: ${data.promptFeedback.blockReason}`);
      }
    }

    return data;
  }, {
    maxAttempts: 3,
    baseDelayMs: 2000, // Começamos com 2s de delay para o Google (ajuda se for cota)
    maxDelayMs: 15000,
  });
}
