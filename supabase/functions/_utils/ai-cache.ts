// ============================================================================
// AI CACHE - SISTEMA DE CACHE PARA RESPOSTAS DA IA
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHash } from "https://deno.land/std@0.168.0/hash/mod.ts";

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 horas
const CACHE_TABLE = "ai_cache";

// ============================================================================
// TIPOS
// ============================================================================

export interface CacheEntry {
  key: string;
  response: string;
  metadata: Record<string, any>;
  expiresAt: string;
  hits: number;
  createdAt: string;
}

export interface CacheOptions {
  ttl?: number; // em segundos
  skipCache?: boolean;
  tags?: string[];
}

// ============================================================================
// FUNÇÕES PRINCIPAIS
// ============================================================================

/**
 * Gera uma chave de cache baseada no prompt e contexto
 */
export function generateCacheKey(
  prompt: string,
  context?: Record<string, any>
): string {
  const data = JSON.stringify({
    prompt: prompt.trim().toLowerCase(),
    context: context || {},
  });

  // Usar SHA-256 para gerar hash
  const hash = createHash("sha256");
  hash.update(data);
  return hash.toString("hex");
}

/**
 * Busca uma resposta no cache
 */
export async function getCachedResponse(
  supabase: any,
  cacheKey: string
): Promise<CacheEntry | null> {
  try {
    // Buscar no cache
    const { data, error } = await supabase
      .from(CACHE_TABLE)
      .select("*")
      .eq("key", cacheKey)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      console.log("🔍 Cache MISS:", cacheKey);
      return null;
    }

    // Incrementar contador de hits
    await supabase
      .from(CACHE_TABLE)
      .update({ hits: data.hits + 1 })
      .eq("key", cacheKey);

    console.log("✅ Cache HIT:", cacheKey, `(${data.hits + 1} hits)`);

    return {
      key: data.key,
      response: data.response,
      metadata: data.metadata || {},
      expiresAt: data.expires_at,
      hits: data.hits + 1,
      createdAt: data.created_at,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar cache:", error);
    return null;
  }
}

/**
 * Salva uma resposta no cache
 */
export async function setCachedResponse(
  supabase: any,
  cacheKey: string,
  response: string,
  metadata?: Record<string, any>,
  options?: CacheOptions
): Promise<boolean> {
  try {
    const ttl = options?.ttl || CACHE_TTL_SECONDS;
    const expiresAt = new Date(Date.now() + ttl * 1000).toISOString();

    const { error } = await supabase.from(CACHE_TABLE).upsert({
      key: cacheKey,
      response,
      metadata: metadata || {},
      expires_at: expiresAt,
      hits: 0,
      tags: options?.tags || [],
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("❌ Erro ao salvar cache:", error);
      return false;
    }

    console.log("💾 Cache SAVED:", cacheKey, `(TTL: ${ttl}s)`);
    return true;
  } catch (error) {
    console.error("❌ Erro ao salvar cache:", error);
    return false;
  }
}

/**
 * Invalida cache por chave
 */
export async function invalidateCache(
  supabase: any,
  cacheKey: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(CACHE_TABLE)
      .delete()
      .eq("key", cacheKey);

    if (error) {
      console.error("❌ Erro ao invalidar cache:", error);
      return false;
    }

    console.log("🗑️ Cache INVALIDATED:", cacheKey);
    return true;
  } catch (error) {
    console.error("❌ Erro ao invalidar cache:", error);
    return false;
  }
}

/**
 * Invalida cache por tags
 */
export async function invalidateCacheByTags(
  supabase: any,
  tags: string[]
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from(CACHE_TABLE)
      .delete()
      .contains("tags", tags);

    if (error) {
      console.error("❌ Erro ao invalidar cache por tags:", error);
      return false;
    }

    console.log("🗑️ Cache INVALIDATED by tags:", tags);
    return true;
  } catch (error) {
    console.error("❌ Erro ao invalidar cache por tags:", error);
    return false;
  }
}

/**
 * Limpa cache expirado
 */
export async function cleanExpiredCache(supabase: any): Promise<number> {
  try {
    const { data, error } = await supabase
      .from(CACHE_TABLE)
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("key");

    if (error) {
      console.error("❌ Erro ao limpar cache expirado:", error);
      return 0;
    }

    const count = data?.length || 0;
    console.log("🧹 Cache CLEANED:", count, "entradas removidas");
    return count;
  } catch (error) {
    console.error("❌ Erro ao limpar cache expirado:", error);
    return 0;
  }
}

/**
 * Obtém estatísticas do cache
 */
export async function getCacheStats(supabase: any): Promise<{
  total: number;
  expired: number;
  totalHits: number;
  avgHits: number;
  topKeys: Array<{ key: string; hits: number }>;
}> {
  try {
    // Total de entradas
    const { count: total } = await supabase
      .from(CACHE_TABLE)
      .select("*", { count: "exact", head: true });

    // Entradas expiradas
    const { count: expired } = await supabase
      .from(CACHE_TABLE)
      .select("*", { count: "exact", head: true })
      .lt("expires_at", new Date().toISOString());

    // Estatísticas de hits
    const { data: hitsData } = await supabase
      .from(CACHE_TABLE)
      .select("hits, key")
      .order("hits", { ascending: false })
      .limit(10);

    const totalHits = hitsData?.reduce((sum, entry) => sum + entry.hits, 0) || 0;
    const avgHits = total ? totalHits / total : 0;

    return {
      total: total || 0,
      expired: expired || 0,
      totalHits,
      avgHits: Math.round(avgHits * 100) / 100,
      topKeys: hitsData?.map(entry => ({
        key: entry.key.substring(0, 16) + "...",
        hits: entry.hits,
      })) || [],
    };
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas do cache:", error);
    return {
      total: 0,
      expired: 0,
      totalHits: 0,
      avgHits: 0,
      topKeys: [],
    };
  }
}

/**
 * Wrapper para usar cache em chamadas de IA
 */
export async function withCache<T>(
  supabase: any,
  cacheKey: string,
  fn: () => Promise<T>,
  options?: CacheOptions
): Promise<{ result: T; cached: boolean; cacheKey: string }> {
  // Se skipCache for true, executar função diretamente
  if (options?.skipCache) {
    console.log("⏭️ Skipping cache");
    const result = await fn();
    return { result, cached: false, cacheKey };
  }

  // Tentar buscar no cache
  const cached = await getCachedResponse(supabase, cacheKey);

  if (cached) {
    try {
      const result = JSON.parse(cached.response) as T;
      return { result, cached: true, cacheKey };
    } catch {
      // Se falhar ao parsear, executar função
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
      executedAt: new Date().toISOString(),
      size: serialized.length,
    },
    options
  );

  return { result, cached: false, cacheKey };
}

// ============================================================================
// MIGRATIONS (SQL para criar tabela)
// ============================================================================

export const CACHE_TABLE_SQL = `
-- Tabela de cache de IA
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  response TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  expires_at TIMESTAMPTZ NOT NULL,
  hits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_hits ON ai_cache(hits DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cache_tags ON ai_cache USING gin(tags);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ai_cache_updated_at
  BEFORE UPDATE ON ai_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_cache_updated_at();

-- Função para limpar cache expirado automaticamente
CREATE OR REPLACE FUNCTION clean_expired_ai_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE ai_cache IS 'Cache de respostas da IA para reduzir custos e latência';
COMMENT ON COLUMN ai_cache.key IS 'Hash SHA-256 do prompt + contexto';
COMMENT ON COLUMN ai_cache.hits IS 'Número de vezes que este cache foi utilizado';
COMMENT ON COLUMN ai_cache.tags IS 'Tags para invalidação em lote';
`;
