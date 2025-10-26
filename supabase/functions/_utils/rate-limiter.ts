// ============================================================================
// RATE LIMITER COM UPSTASH REDIS
// ============================================================================
// Implementa rate limiting usando Upstash Redis para Edge Functions
// Por: SYNCADS
// ============================================================================

/**
 * Configuração de Rate Limiting
 */
export interface RateLimitConfig {
  maxRequests: number; // Número máximo de requisições
  windowMs: number; // Janela temporal em milissegundos
}

/**
 * Resultado do Rate Limit Check
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp em ms
  limit: number;
}

/**
 * Cliente Upstash Redis (Simplificado)
 */
class UpstashRedis {
  private url: string;
  private token: string;

  constructor() {
    this.url = Deno.env.get('UPSTASH_REDIS_URL') || '';
    this.token = Deno.env.get('UPSTASH_REDIS_TOKEN') || '';
  }

  /**
   * Adiciona um item ao sorted set com score = timestamp
   */
  async zadd(key: string, score: number, member: string): Promise<number> {
    if (!this.url) throw new Error('Upstash Redis não configurado');
    
    const response = await fetch(`${this.url}/zadd/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ score, member }),
    });

    if (!response.ok) throw new Error('Upstash Redis error');
    const data = await response.json();
    return data.result as number;
  }

  /**
   * Conta itens no sorted set dentro do range
   */
  async zcount(key: string, min: number, max: number): Promise<number> {
    if (!this.url) throw new Error('Upstash Redis não configurado');
    
    const response = await fetch(`${this.url}/zcount/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ min, max }),
    });

    if (!response.ok) throw new Error('Upstash Redis error');
    const data = await response.json();
    return data.result as number;
  }

  /**
   * Remove itens fora da janela temporal
   */
  async zremrangebyscore(
    key: string,
    min: number,
    max: number
  ): Promise<number> {
    if (!this.url) throw new Error('Upstash Redis não configurado');
    
    const response = await fetch(`${this.url}/zremrangebyscore/${key}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ min, max }),
    });

    if (!response.ok) throw new Error('Upstash Redis error');
    const data = await response.json();
    return data.result as number;
  }
}

// Instância global
const redis = new UpstashRedis();

/**
 * Verifica se requisição está dentro do rate limit
 * 
 * @param userId - ID do usuário
 * @param endpoint - Endpoint sendo chamado
 * @param config - Configuração (maxRequests, windowMs)
 * @returns RateLimitResult com allowed, remaining, resetAt
 */
export async function checkRateLimit(
  userId: string,
  endpoint: string,
  config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }
): Promise<RateLimitResult> {
  try {
    const key = `rate_limit:${userId}:${endpoint}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    // Limpar dados antigos (fora da janela)
    await redis.zremrangebyscore(key, 0, windowStart);

    // Contar requisições na janela atual
    const count = await redis.zcount(key, windowStart, now);

    // Adicionar esta requisição ao sorted set
    await redis.zadd(key, now, `${now}-${Math.random()}`);

    // Verificar se excedeu o limite
    const allowed = count < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - count - 1);
    const resetAt = now + config.windowMs;

    console.log(`⏱️ Rate limit check: ${allowed ? 'OK' : 'EXCEEDED'} (${remaining}/${config.maxRequests} remaining)`);

    return {
      allowed,
      remaining,
      resetAt,
      limit: config.maxRequests,
    };
  } catch (error: any) {
    // Se Upstash não configurado, permitir (fail-open)
    console.warn('⚠️ Rate limiter error (failing open):', error.message);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: Date.now() + config.windowMs,
      limit: config.maxRequests,
    };
  }
}

/**
 * Cria resposta HTTP 429 com headers de rate limit
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
  
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Try again in ${retryAfter} seconds.`,
      retryAfter,
      resetAt: result.resetAt,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toString(),
        'Retry-After': retryAfter.toString(),
      },
    }
  );
}

