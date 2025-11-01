// ============================================================================
// RETRY COM EXPONENTIAL BACKOFF
// ============================================================================
// Implementa retry automático com backoff exponencial
// Por: SYNCADS
// ============================================================================

export interface RetryOptions {
  maxAttempts?: number; // Máximo de tentativas (padrão: 3)
  baseDelayMs?: number; // Delay inicial em ms (padrão: 1000)
  maxDelayMs?: number; // Delay máximo em ms (padrão: 10000)
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
};

/**
 * Calcula delay exponencial
 */
function calculateDelay(
  attempt: number,
  baseDelay: number,
  maxDelay: number,
): number {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, maxDelay);
}

/**
 * Sleep por X milissegundos
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry com exponential backoff
 *
 * @param fn - Função async para executar
 * @param options - Opções de retry
 * @returns Resultado da função ou throw último erro
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const { maxAttempts, baseDelayMs, maxDelayMs } = config;

  let lastError: Error | undefined;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      if (attempt > 0) {
        const delay = calculateDelay(attempt - 1, baseDelayMs!, maxDelayMs!);
        console.log(
          `📤 Tentativa ${attempt + 1}/${maxAttempts} em ${delay}ms...`,
        );
        await sleep(delay);
      }

      console.log(`📤 Tentativa ${attempt + 1}/${maxAttempts}`);
      const result = await fn();

      if (attempt > 0) {
        console.log(`✅ Sucesso na tentativa ${attempt + 1}`);
      }

      return result;
    } catch (error: any) {
      lastError = error;
      console.error(`❌ Tentativa ${attempt + 1} falhou: ${error.message}`);

      // Se foi a última tentativa, lançar erro
      if (attempt === maxAttempts - 1) {
        console.error(`❌ Todas as ${maxAttempts} tentativas falharam`);
        throw error;
      }
    }
  }

  // Fallback (não deveria chegar aqui)
  throw lastError || new Error("Retry failed with unknown error");
}

/**
 * Retry simples com delay fixo
 */
export async function retrySimple<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000,
): Promise<T> {
  return retry(fn, {
    maxAttempts,
    baseDelayMs: delayMs,
    maxDelayMs: delayMs,
  });
}
