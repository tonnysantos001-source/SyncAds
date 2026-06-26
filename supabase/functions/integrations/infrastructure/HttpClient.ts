// =========================================================================
// MÓDULO DE INTEGRAÇÕES GLOBAL - CLIENTE HTTP COM RETRY E TIMEOUT (Deno)
// =========================================================================

import { HttpClientInterface, HttpClientOptions } from "../types.ts";

export class HttpClient implements HttpClientInterface {
  private defaultTimeoutMs: number;
  private defaultMaxRetries: number;
  private defaultRetryDelayMs: number;

  constructor(options?: {
    timeoutMs?: number;
    maxRetries?: number;
    retryDelayMs?: number;
  }) {
    this.defaultTimeoutMs = options?.timeoutMs ?? 10000; // 10 segundos
    this.defaultMaxRetries = options?.maxRetries ?? 3; // 3 tentativas
    this.defaultRetryDelayMs = options?.retryDelayMs ?? 1000; // 1 segundo
  }

  /**
   * Executa uma requisição HTTP com políticas de timeout e retry automático.
   */
  async request(
    url: string,
    options?: RequestInit & HttpClientOptions
  ): Promise<Response> {
    const maxRetries = options?.maxRetries ?? this.defaultMaxRetries;
    const retryDelayMs = options?.retryDelayMs ?? this.defaultRetryDelayMs;
    const timeoutMs = options?.timeoutMs ?? this.defaultTimeoutMs;
    const backoff = options?.backoff ?? true;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      // Mesclar o sinal de aborto
      const fetchOptions: RequestInit = {
        ...options,
        signal: controller.signal,
      };

      try {
        if (attempt > 0) {
          console.warn(
            `[HTTP-CLIENT] Retrying request to ${url} (Attempt ${attempt}/${maxRetries} after error: ${lastError?.message})`
          );
        }

        const response = await fetch(url, fetchOptions);
        clearTimeout(timeoutId);

        // Se for um erro 5xx do servidor e puder ser repetido, tentamos novamente
        if (response.status >= 500 && attempt < maxRetries) {
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          const delay = backoff ? retryDelayMs * Math.pow(2, attempt) : retryDelayMs;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        return response;
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err;

        if (err.name === "AbortError") {
          lastError = new Error(`Request timed out after ${timeoutMs}ms`);
        }

        // Se chegamos ao limite, não esperamos mais
        if (attempt === maxRetries) {
          break;
        }

        const delay = backoff ? retryDelayMs * Math.pow(2, attempt) : retryDelayMs;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError ?? new Error(`Request failed to ${url}`);
  }
}
