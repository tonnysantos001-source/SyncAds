// ============================================================================
// FETCH COM TIMEOUT
// ============================================================================
// Wrapper para fetch() com timeout usando AbortController
// Por: SYNCADS
// ============================================================================

export interface FetchTimeoutOptions extends RequestInit {
  timeout?: number; // Em milissegundos
}

/**
 * Fetch com timeout
 * 
 * @param url - URL para fazer fetch
 * @param options - Opções padrão do fetch + timeout
 * @param timeoutMs - Timeout padrão se não especificado (10000ms)
 * @returns Response ou throw error
 */
export async function fetchWithTimeout(
  url: string,
  options: FetchTimeoutOptions = {},
  timeoutMs: number = 10000
): Promise<Response> {
  const timeout = options.timeout || timeoutMs;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    console.log(`⏳ Fetching ${url} (timeout: ${timeout}ms)`);
    
    const startTime = Date.now();
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    const duration = Date.now() - startTime;
    console.log(`✅ Fetched ${url} in ${duration}ms`);

    return response;
  } catch (error: any) {
    // Verificar se foi timeout ou outro erro
    if (error.name === 'AbortError') {
      console.error(`⏰ Timeout: ${url} (${timeout}ms)`);
      throw new Error(`Request timed out after ${timeout}ms: ${url}`);
    }

    console.error(`❌ Fetch error: ${error.message}`);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

