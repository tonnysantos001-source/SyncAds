// ============================================================================
// ENHANCED RATE LIMITER - SISTEMA DE RATE LIMITING ROBUSTO
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

export interface RateLimitConfig {
  // Limites por usuário
  perUser: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    tokensPerDay?: number;
  };
  // Limites por organização
  perOrganization?: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
    tokensPerDay?: number;
  };
  // Limites por endpoint
  perEndpoint?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  // Limites por IP
  perIP?: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
}

export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Chat/IA
  AI_CHAT: {
    perUser: {
      requestsPerMinute: 10,
      requestsPerHour: 100,
      requestsPerDay: 500,
      tokensPerDay: 100000,
    },
    perOrganization: {
      requestsPerMinute: 50,
      requestsPerHour: 500,
      requestsPerDay: 2000,
      tokensPerDay: 1000000,
    },
  },

  // Web Scraping
  WEB_SCRAPING: {
    perUser: {
      requestsPerMinute: 5,
      requestsPerHour: 20,
      requestsPerDay: 100,
    },
    perOrganization: {
      requestsPerMinute: 20,
      requestsPerHour: 100,
      requestsPerDay: 500,
    },
  },

  // Geração de arquivos
  FILE_GENERATION: {
    perUser: {
      requestsPerMinute: 10,
      requestsPerHour: 50,
      requestsPerDay: 200,
    },
    perOrganization: {
      requestsPerMinute: 30,
      requestsPerHour: 150,
      requestsPerDay: 600,
    },
  },

  // Geração de imagens
  IMAGE_GENERATION: {
    perUser: {
      requestsPerMinute: 2,
      requestsPerHour: 10,
      requestsPerDay: 50,
    },
    perOrganization: {
      requestsPerMinute: 10,
      requestsPerHour: 50,
      requestsPerDay: 200,
    },
  },

  // API calls gerais
  API_GENERAL: {
    perUser: {
      requestsPerMinute: 60,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
    },
    perIP: {
      requestsPerMinute: 100,
      requestsPerHour: 2000,
    },
  },

  // Autenticação
  AUTH: {
    perUser: {
      requestsPerMinute: 5,
      requestsPerHour: 20,
      requestsPerDay: 50,
    },
    perIP: {
      requestsPerMinute: 10,
      requestsPerHour: 50,
    },
  },

  // Webhooks
  WEBHOOK: {
    perUser: {
      requestsPerMinute: 30,
      requestsPerHour: 500,
      requestsPerDay: 5000,
    },
    perOrganization: {
      requestsPerMinute: 100,
      requestsPerHour: 2000,
      requestsPerDay: 20000,
    },
  },
};

// Overrides para admins
export const ADMIN_MULTIPLIER = 10; // Admins têm 10x os limites normais

// ============================================================================
// TIPOS
// ============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: Date;
  limit: number;
  current: number;
  retryAfter?: number; // segundos
}

export interface RateLimitKey {
  type: "user" | "organization" | "ip" | "endpoint";
  identifier: string;
  resource: string;
  window: "minute" | "hour" | "day";
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Verifica rate limit para um usuário/recurso
 */
export async function checkRateLimit(
  supabase: any,
  userId: string,
  resource: string,
  options?: {
    organizationId?: string;
    ipAddress?: string;
    endpoint?: string;
    tokens?: number;
    isAdmin?: boolean;
  }
): Promise<RateLimitResult> {
  const config = DEFAULT_RATE_LIMITS[resource] || DEFAULT_RATE_LIMITS.API_GENERAL;
  const multiplier = options?.isAdmin ? ADMIN_MULTIPLIER : 1;

  // Verificar rate limit por usuário (mais restritivo)
  const userLimit = await checkUserRateLimit(
    supabase,
    userId,
    resource,
    config.perUser,
    multiplier
  );

  if (!userLimit.allowed) {
    return userLimit;
  }

  // Verificar rate limit por organização (se aplicável)
  if (options?.organizationId && config.perOrganization) {
    const orgLimit = await checkOrganizationRateLimit(
      supabase,
      options.organizationId,
      resource,
      config.perOrganization,
      multiplier
    );

    if (!orgLimit.allowed) {
      return orgLimit;
    }
  }

  // Verificar rate limit por IP (se aplicável)
  if (options?.ipAddress && config.perIP) {
    const ipLimit = await checkIPRateLimit(
      supabase,
      options.ipAddress,
      resource,
      config.perIP
    );

    if (!ipLimit.allowed) {
      return ipLimit;
    }
  }

  // Verificar rate limit por endpoint (se aplicável)
  if (options?.endpoint && config.perEndpoint) {
    const endpointLimit = await checkEndpointRateLimit(
      supabase,
      options.endpoint,
      resource,
      config.perEndpoint
    );

    if (!endpointLimit.allowed) {
      return endpointLimit;
    }
  }

  // Verificar tokens (se aplicável)
  if (options?.tokens && config.perUser.tokensPerDay) {
    const tokenLimit = await checkTokenLimit(
      supabase,
      userId,
      resource,
      options.tokens,
      config.perUser.tokensPerDay * multiplier
    );

    if (!tokenLimit.allowed) {
      return tokenLimit;
    }
  }

  // Tudo OK
  return userLimit;
}

/**
 * Rate limit por usuário
 */
async function checkUserRateLimit(
  supabase: any,
  userId: string,
  resource: string,
  limits: RateLimitConfig["perUser"],
  multiplier: number = 1
): Promise<RateLimitResult> {
  // Verificar por minuto
  const minuteResult = await checkLimit(
    supabase,
    { type: "user", identifier: userId, resource, window: "minute" },
    limits.requestsPerMinute * multiplier,
    60
  );

  if (!minuteResult.allowed) {
    return minuteResult;
  }

  // Verificar por hora
  const hourResult = await checkLimit(
    supabase,
    { type: "user", identifier: userId, resource, window: "hour" },
    limits.requestsPerHour * multiplier,
    3600
  );

  if (!hourResult.allowed) {
    return hourResult;
  }

  // Verificar por dia
  const dayResult = await checkLimit(
    supabase,
    { type: "user", identifier: userId, resource, window: "day" },
    limits.requestsPerDay * multiplier,
    86400
  );

  return dayResult;
}

/**
 * Rate limit por organização
 */
async function checkOrganizationRateLimit(
  supabase: any,
  organizationId: string,
  resource: string,
  limits: NonNullable<RateLimitConfig["perOrganization"]>,
  multiplier: number = 1
): Promise<RateLimitResult> {
  const minuteResult = await checkLimit(
    supabase,
    { type: "organization", identifier: organizationId, resource, window: "minute" },
    limits.requestsPerMinute * multiplier,
    60
  );

  if (!minuteResult.allowed) {
    return minuteResult;
  }

  const hourResult = await checkLimit(
    supabase,
    { type: "organization", identifier: organizationId, resource, window: "hour" },
    limits.requestsPerHour * multiplier,
    3600
  );

  if (!hourResult.allowed) {
    return hourResult;
  }

  const dayResult = await checkLimit(
    supabase,
    { type: "organization", identifier: organizationId, resource, window: "day" },
    limits.requestsPerDay * multiplier,
    86400
  );

  return dayResult;
}

/**
 * Rate limit por IP
 */
async function checkIPRateLimit(
  supabase: any,
  ipAddress: string,
  resource: string,
  limits: NonNullable<RateLimitConfig["perIP"]>
): Promise<RateLimitResult> {
  const minuteResult = await checkLimit(
    supabase,
    { type: "ip", identifier: ipAddress, resource, window: "minute" },
    limits.requestsPerMinute,
    60
  );

  if (!minuteResult.allowed) {
    return minuteResult;
  }

  const hourResult = await checkLimit(
    supabase,
    { type: "ip", identifier: ipAddress, resource, window: "hour" },
    limits.requestsPerHour,
    3600
  );

  return hourResult;
}

/**
 * Rate limit por endpoint
 */
async function checkEndpointRateLimit(
  supabase: any,
  endpoint: string,
  resource: string,
  limits: NonNullable<RateLimitConfig["perEndpoint"]>
): Promise<RateLimitResult> {
  const minuteResult = await checkLimit(
    supabase,
    { type: "endpoint", identifier: endpoint, resource, window: "minute" },
    limits.requestsPerMinute,
    60
  );

  if (!minuteResult.allowed) {
    return minuteResult;
  }

  const hourResult = await checkLimit(
    supabase,
    { type: "endpoint", identifier: endpoint, resource, window: "hour" },
    limits.requestsPerHour,
    3600
  );

  return hourResult;
}

/**
 * Rate limit de tokens
 */
async function checkTokenLimit(
  supabase: any,
  userId: string,
  resource: string,
  tokensUsed: number,
  dailyLimit: number
): Promise<RateLimitResult> {
  const key = `token:${userId}:${resource}:day`;
  const now = new Date();
  const windowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const windowEnd = new Date(windowStart.getTime() + 86400000);

  // Buscar uso atual de tokens
  const { data: existing } = await supabase
    .from("rate_limits")
    .select("count")
    .eq("key", key)
    .gte("window_end", now.toISOString())
    .single();

  const current = (existing?.count || 0) + tokensUsed;
  const allowed = current <= dailyLimit;

  if (allowed) {
    // Incrementar contador
    await supabase.from("rate_limits").upsert({
      key,
      count: current,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      metadata: { resource, type: "token", userId },
    });
  }

  return {
    allowed,
    remaining: Math.max(0, dailyLimit - current),
    reset: windowEnd,
    limit: dailyLimit,
    current,
    retryAfter: allowed ? undefined : Math.ceil((windowEnd.getTime() - now.getTime()) / 1000),
  };
}

/**
 * Verifica limite genérico com sliding window
 */
async function checkLimit(
  supabase: any,
  key: RateLimitKey,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const keyString = `${key.type}:${key.identifier}:${key.resource}:${key.window}`;
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  // Buscar registros na janela
  const { data: existing } = await supabase
    .from("rate_limits")
    .select("count")
    .eq("key", keyString)
    .gte("window_end", now.toISOString())
    .single();

  const current = (existing?.count || 0) + 1;
  const allowed = current <= limit;

  if (allowed) {
    // Incrementar contador
    const windowEnd = new Date(now.getTime() + windowSeconds * 1000);

    await supabase.from("rate_limits").upsert({
      key: keyString,
      count: current,
      window_start: windowStart.toISOString(),
      window_end: windowEnd.toISOString(),
      metadata: {
        type: key.type,
        identifier: key.identifier,
        resource: key.resource,
        window: key.window,
      },
    });
  }

  const windowEnd = new Date(now.getTime() + windowSeconds * 1000);

  return {
    allowed,
    remaining: Math.max(0, limit - current),
    reset: windowEnd,
    limit,
    current,
    retryAfter: allowed ? undefined : Math.ceil(windowSeconds),
  };
}

/**
 * Limpa rate limits expirados
 */
export async function cleanExpiredRateLimits(supabase: any): Promise<number> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("rate_limits")
    .delete()
    .lt("window_end", now)
    .select("key");

  if (error) {
    console.error("Erro ao limpar rate limits:", error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Obtém estatísticas de rate limit
 */
export async function getRateLimitStats(
  supabase: any,
  userId: string,
  resource: string
): Promise<{
  minute: RateLimitResult;
  hour: RateLimitResult;
  day: RateLimitResult;
}> {
  const config = DEFAULT_RATE_LIMITS[resource] || DEFAULT_RATE_LIMITS.API_GENERAL;

  const minute = await checkUserRateLimit(supabase, userId, resource, config.perUser, 1);
  const hour = await checkUserRateLimit(supabase, userId, resource, config.perUser, 1);
  const day = await checkUserRateLimit(supabase, userId, resource, config.perUser, 1);

  return { minute, hour, day };
}

/**
 * Reset rate limit para um usuário/recurso
 */
export async function resetRateLimit(
  supabase: any,
  userId: string,
  resource: string
): Promise<boolean> {
  const { error } = await supabase
    .from("rate_limits")
    .delete()
    .like("key", `user:${userId}:${resource}:%`);

  return !error;
}

// ============================================================================
// MIGRATION SQL
// ============================================================================

export const RATE_LIMITS_TABLE_SQL = `
-- Tabela de rate limits
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_metadata ON rate_limits USING gin(metadata);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rate_limits_updated_at ON rate_limits;
CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_updated_at();

-- Função para limpar rate limits expirados
CREATE OR REPLACE FUNCTION clean_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits WHERE window_end < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE rate_limits IS 'Rate limiting para APIs e recursos';
COMMENT ON COLUMN rate_limits.key IS 'Chave única: tipo:identifier:resource:window';
COMMENT ON COLUMN rate_limits.count IS 'Contador de requisições na janela';
COMMENT ON COLUMN rate_limits.window_end IS 'Fim da janela de rate limit';
`;
