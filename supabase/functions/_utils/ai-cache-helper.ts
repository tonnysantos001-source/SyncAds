// ============================================================================
// AI CACHE HELPER - FUNÇÕES AUXILIARES PARA CACHE DE IA
// ============================================================================
// Integra com as tabelas ai_cache e rate_limits criadas no banco
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// TIPOS
// ============================================================================

export interface CacheResult {
  hit: boolean;
  response?: string;
  metadata?: any;
  hits?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  current: number;
  retryAfter?: number;
}

// ============================================================================
// CACHE FUNCTIONS
// ============================================================================

/**
 * Gera chave de cache baseada no prompt e contexto
 */
export function generateCacheKey(
  prompt: string,
  context?: Record<string, any>
): string {
  const data = JSON.stringify({
    prompt: prompt.trim().toLowerCase(),
    context: context || {},
  });

  // Usar hash simples (para produção, considere SHA-256)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return `ai_cache_${Math.abs(hash).toString(36)}`;
}

/**
 * Busca resposta no cache
 */
export async function getCachedResponse(
  supabase: any,
  cacheKey: string
): Promise<CacheResult> {
  try {
    const { data, error } = await supabase
      .from("ai_cache")
      .select("*")
      .eq("key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      console.log("🔍 Cache MISS:", cacheKey);
      return { hit: false };
    }

    // Incrementar contador de hits
    await supabase
      .from("ai_cache")
      .update({ hits: data.hits + 1 })
      .eq("key", cacheKey);

    console.log("✅ Cache HIT:", cacheKey, `(${data.hits + 1} hits)`);

    return {
      hit: true,
      response: data.response,
      metadata: data.metadata,
      hits: data.hits + 1,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar cache:", error);
    return { hit: false };
  }
}

/**
 * Salva resposta no cache
 */
export async function setCachedResponse(
  supabase: any,
  cacheKey: string,
  response: string,
  metadata?: Record<string, any>,
  ttlSeconds: number = 86400 // 24 horas padrão
): Promise<boolean> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();

    const { error } = await supabase.from("ai_cache").upsert({
      key: cacheKey,
      response,
      metadata: metadata || {},
      expires_at: expiresAt,
      hits: 0,
      tags: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ Erro ao salvar cache:", error);
      return false;
    }

    console.log("💾 Cache SAVED:", cacheKey, `(TTL: ${ttlSeconds}s)`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar cache:", error);
    return false;
  }
}

/**
 * Wrapper para usar cache em chamadas de IA
 */
export async function withCache<T>(
  supabase: any,
  cacheKey: string,
  fn: () => Promise<T>,
  options?: {
    ttl?: number;
    skipCache?: boolean;
    metadata?: Record<string, any>;
  }
): Promise<{ result: T; cached: boolean; cacheKey: string }> {
  // Se skipCache for true, executar função diretamente
  if (options?.skipCache) {
    console.log("⏭️ Skipping cache");
    const result = await fn();
    return { result, cached: false, cacheKey };
  }

  // Tentar buscar no cache
  const cached = await getCachedResponse(supabase, cacheKey);

  if (cached.hit && cached.response) {
    try {
      const result = JSON.parse(cached.response) as T;
      return { result, cached: true, cacheKey };
    } catch {
      console.warn("⚠️ Erro ao parsear cache, executando função");
    }
  }

  // Executar função e salvar no cache
  const result = await fn();
  const serialized = JSON.stringify(result);

  await setCachedResponse(
    supabase,
    cacheKey,
    serialized,
    {
      ...options?.metadata,
      executedAt: new Date().toISOString(),
      size: serialized.length,
    },
    options?.ttl
  );

  return { result, cached: false, cacheKey };
}

// ============================================================================
// RATE LIMITING FUNCTIONS
// ============================================================================

/**
 * Verifica rate limit usando tabela do banco
 */
export async function checkRateLimit(
  supabase: any,
  key: string,
  limit: number,
  windowSeconds: number = 60
): Promise<RateLimitResult> {
  try {
    // Usar função do banco (mais eficiente)
    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_key: key,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error("❌ Erro ao verificar rate limit:", error);
      // Em caso de erro, permitir (fail open)
      return {
        allowed: true,
        remaining: limit,
        current: 0,
      };
    }

    return {
      allowed: data.allowed,
      remaining: data.remaining || 0,
      current: data.current || 0,
      retryAfter: data.retry_after,
    };
  } catch (error) {
    console.error("❌ Erro ao verificar rate limit:", error);
    // Em caso de erro, permitir (fail open)
    return {
      allowed: true,
      remaining: limit,
      current: 0,
    };
  }
}

/**
 * Verifica rate limit para usuário específico
 */
export async function checkUserRateLimit(
  supabase: any,
  userId: string,
  resource: string,
  limits: {
    requestsPerMinute: number;
    requestsPerHour?: number;
    requestsPerDay?: number;
  }
): Promise<RateLimitResult> {
  // Verificar limite por minuto (mais restritivo)
  const minuteKey = `user:${userId}:${resource}:minute`;
  const minuteResult = await checkRateLimit(
    supabase,
    minuteKey,
    limits.requestsPerMinute,
    60
  );

  if (!minuteResult.allowed) {
    return minuteResult;
  }

  // Verificar limite por hora (se configurado)
  if (limits.requestsPerHour) {
    const hourKey = `user:${userId}:${resource}:hour`;
    const hourResult = await checkRateLimit(
      supabase,
      hourKey,
      limits.requestsPerHour,
      3600
    );

    if (!hourResult.allowed) {
      return hourResult;
    }
  }

  // Verificar limite por dia (se configurado)
  if (limits.requestsPerDay) {
    const dayKey = `user:${userId}:${resource}:day`;
    const dayResult = await checkRateLimit(
      supabase,
      dayKey,
      limits.requestsPerDay,
      86400
    );

    if (!dayResult.allowed) {
      return dayResult;
    }
  }

  return minuteResult;
}

/**
 * Limpa rate limits expirados (executar periodicamente)
 */
export async function cleanExpiredRateLimits(
  supabase: any
): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("clean_expired_rate_limits");

    if (error) {
      console.error("❌ Erro ao limpar rate limits:", error);
      return 0;
    }

    console.log("🧹 Rate limits expirados limpos:", data);
    return data || 0;
  } catch (error) {
    console.error("❌ Erro ao limpar rate limits:", error);
    return 0;
  }
}

/**
 * Limpa cache expirado (executar periodicamente)
 */
export async function cleanExpiredCache(supabase: any): Promise<number> {
  try {
    const { data, error } = await supabase.rpc("clean_expired_ai_cache");

    if (error) {
      console.error("❌ Erro ao limpar cache:", error);
      return 0;
    }

    console.log("🧹 Cache expirado limpo:", data);
    return data || 0;
  } catch (error) {
    console.error("❌ Erro ao limpar cache:", error);
    return 0;
  }
}

// ============================================================================
// AUDIT LOG HELPER
// ============================================================================

/**
 * Registra ação no audit log
 */
export async function logAudit(
  supabase: any,
  tableName: string,
  recordId: string,
  action: "INSERT" | "UPDATE" | "DELETE" | "SOFT_DELETE" | "RESTORE",
  oldData?: any,
  newData?: any,
  userId?: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc("log_audit", {
      p_table_name: tableName,
      p_record_id: recordId,
      p_action: action,
      p_old_data: oldData ? JSON.stringify(oldData) : null,
      p_new_data: newData ? JSON.stringify(newData) : null,
      p_user_id: userId,
    });

    if (error) {
      console.error("❌ Erro ao registrar audit log:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Erro ao registrar audit log:", error);
    return false;
  }
}

// ============================================================================
// ESTATÍSTICAS
// ============================================================================

/**
 * Obtém estatísticas de cache
 */
export async function getCacheStats(supabase: any): Promise<{
  totalEntries: number;
  totalHits: number;
  cacheSizeMb: number;
}> {
  try {
    const { data, error } = await supabase.rpc("get_ai_cache_stats");

    if (error) {
      console.error("❌ Erro ao obter estatísticas:", error);
      return { totalEntries: 0, totalHits: 0, cacheSizeMb: 0 };
    }

    return {
      totalEntries: data[0]?.total_entries || 0,
      totalHits: data[0]?.total_hits || 0,
      cacheSizeMb: data[0]?.cache_size_mb || 0,
    };
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas:", error);
    return { totalEntries: 0, totalHits: 0, cacheSizeMb: 0 };
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generateCacheKey,
  getCachedResponse,
  setCachedResponse,
  withCache,
  checkRateLimit,
  checkUserRateLimit,
  cleanExpiredRateLimits,
  cleanExpiredCache,
  logAudit,
  getCacheStats,
};
