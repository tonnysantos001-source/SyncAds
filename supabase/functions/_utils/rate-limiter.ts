// ============================================
// RATE LIMITER - Upstash Redis
// ============================================
// Implementa rate limiting usando Upstash Redis
// Configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN nos secrets
// ============================================

const UPSTASH_URL = Deno.env.get('UPSTASH_REDIS_REST_URL');
const UPSTASH_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');

export interface RateLimitConfig {
  limit: number; // Número máximo de requisições
  window: number; // Janela de tempo em segundos
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Verifica se uma ação está dentro do rate limit
 */
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  // Se Upstash não estiver configurado, permitir (modo desenvolvimento)
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    console.warn('⚠️  Upstash Redis not configured - rate limiting disabled');
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: Date.now() + config.window * 1000,
    };
  }

  const redisKey = `ratelimit:${key}`;
  const now = Date.now();
  const windowMs = config.window * 1000;

  try {
    // Usar Redis INCR com EXPIRE
    const incrResponse = await fetch(`${UPSTASH_URL}/incr/${redisKey}`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
    });

    if (!incrResponse.ok) {
      throw new Error('Failed to increment counter');
    }

    const incrData = await incrResponse.json();
    const count = incrData.result;

    // Se é a primeira requisição, definir expiração
    if (count === 1) {
      await fetch(`${UPSTASH_URL}/expire/${redisKey}/${config.window}`, {
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
        },
      });
    }

    // Obter TTL para calcular resetAt
    const ttlResponse = await fetch(`${UPSTASH_URL}/ttl/${redisKey}`, {
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
      },
    });

    const ttlData = await ttlResponse.json();
    const ttl = ttlData.result;

    return {
      allowed: count <= config.limit,
      remaining: Math.max(0, config.limit - count),
      resetAt: now + (ttl * 1000),
    };
  } catch (error) {
    console.error('❌ Rate limit check failed:', error);
    // Em caso de erro, permitir a requisição
    return {
      allowed: true,
      remaining: config.limit,
      resetAt: now + windowMs,
    };
  }
}

/**
 * Middleware de rate limiting para Edge Functions
 */
export async function rateLimitMiddleware(
  identifier: string,
  config: RateLimitConfig
): Promise<Response | null> {
  const result = await checkRateLimit(identifier, config);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({
        error: 'Rate limit exceeded',
        message: `Too many requests. Please try again in ${Math.ceil((result.resetAt - Date.now()) / 1000)} seconds.`,
        resetAt: result.resetAt,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': result.resetAt.toString(),
          'Retry-After': Math.ceil((result.resetAt - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Configurações de rate limit por tipo
 */
export const RATE_LIMITS = {
  // IA - 10 requisições por minuto por usuário
  AI_CHAT: {
    limit: 10,
    window: 60,
  },

  // Web Search - 5 requisições por minuto por usuário
  WEB_SEARCH: {
    limit: 5,
    window: 60,
  },

  // File Generation - 20 requisições por minuto por usuário
  FILE_GENERATION: {
    limit: 20,
    window: 60,
  },

  // Scraping - 3 requisições por minuto por usuário
  SCRAPING: {
    limit: 3,
    window: 60,
  },

  // Payment - 5 requisições por minuto por IP
  PAYMENT: {
    limit: 5,
    window: 60,
  },

  // Auth - 5 tentativas de login por 15 minutos por IP
  AUTH: {
    limit: 5,
    window: 900,
  },
} as const;

/**
 * Helper para rate limit por usuário
 */
export async function rateLimitByUser(
  userId: string,
  action: keyof typeof RATE_LIMITS
): Promise<Response | null> {
  return rateLimitMiddleware(
    `user:${userId}:${action}`,
    RATE_LIMITS[action]
  );
}

/**
 * Helper para rate limit por IP
 */
export async function rateLimitByIP(
  ip: string,
  action: keyof typeof RATE_LIMITS
): Promise<Response | null> {
  return rateLimitMiddleware(
    `ip:${ip}:${action}`,
    RATE_LIMITS[action]
  );
}

/**
 * Helper para rate limit por organização
 */
export async function rateLimitByOrg(
  orgId: string,
  action: keyof typeof RATE_LIMITS
): Promise<Response | null> {
  return rateLimitMiddleware(
    `org:${orgId}:${action}`,
    RATE_LIMITS[action]
  );
}
