/**
 * Redis Cache Configuration using Upstash
 *
 * Upstash is a serverless Redis solution that works perfectly with
 * edge functions and serverless environments.
 *
 * Setup:
 * 1. Create account at https://upstash.com
 * 2. Create Redis database
 * 3. Copy UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * 4. Add to .env and Supabase secrets
 */

import { Redis } from '@upstash/redis';

// ============================================================================
// CONFIGURATION
// ============================================================================

const REDIS_URL = import.meta.env.VITE_UPSTASH_REDIS_REST_URL || '';
const REDIS_TOKEN = import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN || '';

// Verificar se Redis está configurado
const isRedisEnabled = Boolean(REDIS_URL && REDIS_TOKEN);

// Criar cliente Redis (apenas se configurado)
let redisClient: Redis | null = null;

if (isRedisEnabled) {
  try {
    redisClient = new Redis({
      url: REDIS_URL,
      token: REDIS_TOKEN,
    });
    console.log('✅ Redis client initialized');
  } catch (error) {
    console.warn('⚠️ Failed to initialize Redis:', error);
  }
}

// ============================================================================
// TYPES
// ============================================================================

export type CacheKey = string;
export type CacheTTL = number; // seconds

export interface CacheOptions {
  ttl?: CacheTTL; // Time to live in seconds
  namespace?: string; // Cache namespace
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
}

// ============================================================================
// CACHE NAMESPACES
// ============================================================================

export const CACHE_NAMESPACES = {
  GATEWAY: 'gateway',
  PRODUCT: 'product',
  USER: 'user',
  ORDER: 'order',
  CUSTOMER: 'customer',
  CONFIG: 'config',
  SESSION: 'session',
  METRICS: 'metrics',
} as const;

// ============================================================================
// DEFAULT TTLs (in seconds)
// ============================================================================

export const CACHE_TTL = {
  VERY_SHORT: 60, // 1 minute
  SHORT: 300, // 5 minutes
  MEDIUM: 900, // 15 minutes
  LONG: 3600, // 1 hour
  VERY_LONG: 86400, // 24 hours
  WEEK: 604800, // 7 days
} as const;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Build cache key with namespace
 */
function buildKey(key: CacheKey, namespace?: string): string {
  return namespace ? `${namespace}:${key}` : key;
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return isRedisEnabled && redisClient !== null;
}

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Get value from cache
 */
export async function cacheGet<T = any>(
  key: CacheKey,
  options?: CacheOptions
): Promise<T | null> {
  if (!isRedisAvailable()) {
    return null;
  }

  try {
    const fullKey = buildKey(key, options?.namespace);
    const value = await redisClient!.get<T>(fullKey);

    if (value !== null) {
      console.log(`📦 Cache HIT: ${fullKey}`);
    } else {
      console.log(`💨 Cache MISS: ${fullKey}`);
    }

    return value;
  } catch (error) {
    console.error('Redis GET error:', error);
    return null;
  }
}

/**
 * Set value in cache
 */
export async function cacheSet<T = any>(
  key: CacheKey,
  value: T,
  options?: CacheOptions
): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const fullKey = buildKey(key, options?.namespace);
    const ttl = options?.ttl || CACHE_TTL.MEDIUM;

    await redisClient!.set(fullKey, value, { ex: ttl });
    console.log(`✅ Cache SET: ${fullKey} (TTL: ${ttl}s)`);

    return true;
  } catch (error) {
    console.error('Redis SET error:', error);
    return false;
  }
}

/**
 * Delete value from cache
 */
export async function cacheDel(
  key: CacheKey,
  options?: CacheOptions
): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const fullKey = buildKey(key, options?.namespace);
    await redisClient!.del(fullKey);
    console.log(`🗑️ Cache DEL: ${fullKey}`);

    return true;
  } catch (error) {
    console.error('Redis DEL error:', error);
    return false;
  }
}

/**
 * Check if key exists
 */
export async function cacheExists(
  key: CacheKey,
  options?: CacheOptions
): Promise<boolean> {
  if (!isRedisAvailable()) {
    return false;
  }

  try {
    const fullKey = buildKey(key, options?.namespace);
    const exists = await redisClient!.exists(fullKey);
    return exists > 0;
  } catch (error) {
    console.error('Redis EXISTS error:', error);
    return false;
  }
}

/**
 * Get multiple keys
 */
export async function cacheGetMany<T = any>(
  keys: CacheKey[],
  options?: CacheOptions
): Promise<(T | null)[]> {
  if (!isRedisAvailable() || keys.length === 0) {
    return keys.map(() => null);
  }

  try {
    const fullKeys = keys.map((k) => buildKey(k, options?.namespace));
    const values = await redisClient!.mget<T>(...fullKeys);

    console.log(`📦 Cache MGET: ${keys.length} keys`);

    return values;
  } catch (error) {
    console.error('Redis MGET error:', error);
    return keys.map(() => null);
  }
}

/**
 * Set multiple keys
 */
export async function cacheSetMany<T = any>(
  entries: Array<{ key: CacheKey; value: T }>,
  options?: CacheOptions
): Promise<boolean> {
  if (!isRedisAvailable() || entries.length === 0) {
    return false;
  }

  try {
    const pipeline = redisClient!.pipeline();
    const ttl = options?.ttl || CACHE_TTL.MEDIUM;

    for (const { key, value } of entries) {
      const fullKey = buildKey(key, options?.namespace);
      pipeline.set(fullKey, value, { ex: ttl });
    }

    await pipeline.exec();
    console.log(`✅ Cache MSET: ${entries.length} keys (TTL: ${ttl}s)`);

    return true;
  } catch (error) {
    console.error('Redis MSET error:', error);
    return false;
  }
}

/**
 * Delete multiple keys
 */
export async function cacheDelMany(
  keys: CacheKey[],
  options?: CacheOptions
): Promise<boolean> {
  if (!isRedisAvailable() || keys.length === 0) {
    return false;
  }

  try {
    const fullKeys = keys.map((k) => buildKey(k, options?.namespace));
    await redisClient!.del(...fullKeys);
    console.log(`🗑️ Cache DEL MANY: ${keys.length} keys`);

    return true;
  } catch (error) {
    console.error('Redis DEL MANY error:', error);
    return false;
  }
}

/**
 * Invalidate all keys matching pattern
 */
export async function cacheInvalidatePattern(
  pattern: string,
  options?: CacheOptions
): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const fullPattern = buildKey(pattern, options?.namespace);
    const keys = await redisClient!.keys(fullPattern);

    if (keys.length === 0) {
      return 0;
    }

    await redisClient!.del(...keys);
    console.log(`🗑️ Cache INVALIDATE: ${keys.length} keys matching ${fullPattern}`);

    return keys.length;
  } catch (error) {
    console.error('Redis INVALIDATE error:', error);
    return 0;
  }
}

/**
 * Increment counter
 */
export async function cacheIncrement(
  key: CacheKey,
  increment: number = 1,
  options?: CacheOptions
): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const fullKey = buildKey(key, options?.namespace);
    const value = await redisClient!.incrby(fullKey, increment);

    // Set expiry if TTL provided
    if (options?.ttl) {
      await redisClient!.expire(fullKey, options.ttl);
    }

    return value;
  } catch (error) {
    console.error('Redis INCR error:', error);
    return 0;
  }
}

/**
 * Decrement counter
 */
export async function cacheDecrement(
  key: CacheKey,
  decrement: number = 1,
  options?: CacheOptions
): Promise<number> {
  if (!isRedisAvailable()) {
    return 0;
  }

  try {
    const fullKey = buildKey(key, options?.namespace);
    const value = await redisClient!.decrby(fullKey, decrement);

    return value;
  } catch (error) {
    console.error('Redis DECR error:', error);
    return 0;
  }
}

// ============================================================================
// SPECIALIZED CACHE FUNCTIONS
// ============================================================================

/**
 * Cache gateway configuration
 */
export async function cacheGatewayConfig(userId: string, config: any) {
  return cacheSet(`${userId}:config`, config, {
    namespace: CACHE_NAMESPACES.GATEWAY,
    ttl: CACHE_TTL.LONG, // 1 hour
  });
}

/**
 * Get cached gateway configuration
 */
export async function getCachedGatewayConfig(userId: string) {
  return cacheGet(`${userId}:config`, {
    namespace: CACHE_NAMESPACES.GATEWAY,
  });
}

/**
 * Invalidate gateway configuration
 */
export async function invalidateGatewayConfig(userId: string) {
  return cacheDel(`${userId}:config`, {
    namespace: CACHE_NAMESPACES.GATEWAY,
  });
}

/**
 * Cache product
 */
export async function cacheProduct(productId: string, product: any) {
  return cacheSet(productId, product, {
    namespace: CACHE_NAMESPACES.PRODUCT,
    ttl: CACHE_TTL.MEDIUM, // 15 minutes
  });
}

/**
 * Get cached product
 */
export async function getCachedProduct(productId: string) {
  return cacheGet(productId, {
    namespace: CACHE_NAMESPACES.PRODUCT,
  });
}

/**
 * Invalidate product cache
 */
export async function invalidateProduct(productId: string) {
  return cacheDel(productId, {
    namespace: CACHE_NAMESPACES.PRODUCT,
  });
}

/**
 * Cache user session
 */
export async function cacheUserSession(userId: string, session: any) {
  return cacheSet(userId, session, {
    namespace: CACHE_NAMESPACES.SESSION,
    ttl: CACHE_TTL.SHORT, // 5 minutes
  });
}

/**
 * Get cached user session
 */
export async function getCachedUserSession(userId: string) {
  return cacheGet(userId, {
    namespace: CACHE_NAMESPACES.SESSION,
  });
}

/**
 * Cache metrics
 */
export async function cacheMetrics(key: string, metrics: any) {
  return cacheSet(key, metrics, {
    namespace: CACHE_NAMESPACES.METRICS,
    ttl: CACHE_TTL.VERY_SHORT, // 1 minute
  });
}

/**
 * Get cached metrics
 */
export async function getCachedMetrics(key: string) {
  return cacheGet(key, {
    namespace: CACHE_NAMESPACES.METRICS,
  });
}

// ============================================================================
// CACHE WRAPPER (HOF)
// ============================================================================

/**
 * Wrapper function to cache any async function result
 *
 * @example
 * const getUser = withCache(
 *   (userId) => `user:${userId}`,
 *   async (userId) => fetchUser(userId),
 *   { ttl: CACHE_TTL.LONG }
 * );
 */
export function withCache<TArgs extends any[], TResult>(
  keyFn: (...args: TArgs) => CacheKey,
  fn: (...args: TArgs) => Promise<TResult>,
  options?: CacheOptions
) {
  return async (...args: TArgs): Promise<TResult> => {
    const key = keyFn(...args);

    // Try cache first
    const cached = await cacheGet<TResult>(key, options);
    if (cached !== null) {
      return cached;
    }

    // Execute function
    const result = await fn(...args);

    // Cache result
    await cacheSet(key, result, options);

    return result;
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  redisClient,
  isRedisEnabled,
};

export default {
  get: cacheGet,
  set: cacheSet,
  del: cacheDel,
  exists: cacheExists,
  getMany: cacheGetMany,
  setMany: cacheSetMany,
  delMany: cacheDelMany,
  invalidatePattern: cacheInvalidatePattern,
  increment: cacheIncrement,
  decrement: cacheDecrement,
  withCache,
  isAvailable: isRedisAvailable,
};
