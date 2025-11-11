import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  cacheGet,
  cacheSet,
  cacheDel,
  CacheKey,
  CacheOptions,
  CACHE_TTL,
} from '@/lib/cache/redis';
import { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface UseCachedQueryOptions<TData = any, TError = Error>
  extends Omit<UseQueryOptions<TData, TError>, 'queryFn'> {
  /**
   * Function to fetch data from source (if not in cache)
   */
  queryFn: () => Promise<TData>;

  /**
   * Cache key (Redis key)
   */
  cacheKey: CacheKey;

  /**
   * Cache options
   */
  cacheOptions?: CacheOptions;

  /**
   * Skip Redis cache (use only React Query cache)
   */
  skipRedisCache?: boolean;

  /**
   * Callback when cache hit
   */
  onCacheHit?: (data: TData) => void;

  /**
   * Callback when cache miss
   */
  onCacheMiss?: () => void;
}

export interface UseCachedQueryReturn<TData = any, TError = Error> {
  /**
   * Query data
   */
  data: TData | undefined;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Error state
   */
  error: TError | null;

  /**
   * Is fetching (including background refetch)
   */
  isFetching: boolean;

  /**
   * Refetch data
   */
  refetch: () => void;

  /**
   * Invalidate cache (Redis + React Query)
   */
  invalidateCache: () => Promise<void>;

  /**
   * Check if data came from Redis cache
   */
  isFromCache: boolean;

  /**
   * Manually update cache
   */
  updateCache: (data: TData) => Promise<void>;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook that combines React Query with Redis cache
 *
 * Flow:
 * 1. Check Redis cache first
 * 2. If cache hit, return immediately and optionally revalidate in background
 * 3. If cache miss, fetch from source
 * 4. Store result in Redis cache
 * 5. React Query handles local caching
 *
 * @example
 * const { data, isLoading, invalidateCache } = useCachedQuery({
 *   queryKey: ['products', userId],
 *   cacheKey: `products:${userId}`,
 *   queryFn: () => fetchProducts(userId),
 *   cacheOptions: {
 *     namespace: 'product',
 *     ttl: CACHE_TTL.MEDIUM,
 *   },
 * });
 */
export function useCachedQuery<TData = any, TError = Error>({
  queryKey,
  cacheKey,
  queryFn,
  cacheOptions,
  skipRedisCache = false,
  onCacheHit,
  onCacheMiss,
  ...queryOptions
}: UseCachedQueryOptions<TData, TError>): UseCachedQueryReturn<TData, TError> {
  const queryClient = useQueryClient();
  const [isFromCache, setIsFromCache] = useState(false);

  // Wrapped query function with cache logic
  const wrappedQueryFn = useCallback(async (): Promise<TData> => {
    // Skip Redis cache if disabled
    if (skipRedisCache) {
      setIsFromCache(false);
      const result = await queryFn();
      return result;
    }

    // Try to get from Redis cache first
    try {
      const cached = await cacheGet<TData>(cacheKey, cacheOptions);

      if (cached !== null) {
        console.log(`✅ Cache HIT for query: ${queryKey}`);
        setIsFromCache(true);
        onCacheHit?.(cached);
        return cached;
      }
    } catch (error) {
      console.warn('Redis cache read error:', error);
    }

    // Cache miss - fetch from source
    console.log(`💨 Cache MISS for query: ${queryKey}`);
    setIsFromCache(false);
    onCacheMiss?.();

    const result = await queryFn();

    // Store in Redis cache (fire and forget)
    try {
      await cacheSet(cacheKey, result, cacheOptions);
    } catch (error) {
      console.warn('Redis cache write error:', error);
    }

    return result;
  }, [
    cacheKey,
    cacheOptions,
    queryFn,
    skipRedisCache,
    queryKey,
    onCacheHit,
    onCacheMiss,
  ]);

  // Use React Query with wrapped function
  const query = useQuery<TData, TError>({
    queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    queryFn: wrappedQueryFn,
    ...queryOptions,
  });

  // Invalidate both Redis and React Query cache
  const invalidateCache = useCallback(async () => {
    try {
      // Invalidate Redis cache
      await cacheDel(cacheKey, cacheOptions);
      console.log(`🗑️ Invalidated cache: ${cacheKey}`);
    } catch (error) {
      console.warn('Redis cache invalidation error:', error);
    }

    // Invalidate React Query cache
    await queryClient.invalidateQueries({
      queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
    });
  }, [cacheKey, cacheOptions, queryClient, queryKey]);

  // Manually update cache
  const updateCache = useCallback(
    async (data: TData) => {
      try {
        // Update Redis cache
        await cacheSet(cacheKey, data, cacheOptions);

        // Update React Query cache
        queryClient.setQueryData(
          Array.isArray(queryKey) ? queryKey : [queryKey],
          data
        );

        console.log(`✅ Updated cache: ${cacheKey}`);
      } catch (error) {
        console.error('Cache update error:', error);
      }
    },
    [cacheKey, cacheOptions, queryClient, queryKey]
  );

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
    isFetching: query.isFetching,
    refetch: query.refetch,
    invalidateCache,
    isFromCache,
    updateCache,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for caching gateway configuration
 */
export function useCachedGatewayConfig(userId: string) {
  return useCachedQuery({
    queryKey: ['gateway-config', userId],
    cacheKey: `${userId}:config`,
    queryFn: async () => {
      // Import here to avoid circular dependency
      const { supabase } = await import('@/lib/supabase');

      const { data, error } = await supabase
        .from('GatewayConfig')
        .select('*')
        .eq('userId', userId)
        .eq('isActive', true)
        .order('createdAt', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      return data;
    },
    cacheOptions: {
      namespace: 'gateway',
      ttl: CACHE_TTL.LONG, // 1 hour
    },
    enabled: !!userId,
  });
}

/**
 * Hook for caching product data
 */
export function useCachedProduct(productId: string) {
  return useCachedQuery({
    queryKey: ['product', productId],
    cacheKey: productId,
    queryFn: async () => {
      const { supabase } = await import('@/lib/supabase');

      const { data, error } = await supabase
        .from('Product')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    },
    cacheOptions: {
      namespace: 'product',
      ttl: CACHE_TTL.MEDIUM, // 15 minutes
    },
    enabled: !!productId,
  });
}

/**
 * Hook for caching user session
 */
export function useCachedUserSession(userId: string) {
  return useCachedQuery({
    queryKey: ['user-session', userId],
    cacheKey: userId,
    queryFn: async () => {
      const { supabase } = await import('@/lib/supabase');

      const { data, error } = await supabase
        .from('User')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    cacheOptions: {
      namespace: 'session',
      ttl: CACHE_TTL.SHORT, // 5 minutes
    },
    enabled: !!userId,
  });
}

/**
 * Hook for caching metrics with short TTL
 */
export function useCachedMetrics(metricKey: string, fetchFn: () => Promise<any>) {
  return useCachedQuery({
    queryKey: ['metrics', metricKey],
    cacheKey: metricKey,
    queryFn: fetchFn,
    cacheOptions: {
      namespace: 'metrics',
      ttl: CACHE_TTL.VERY_SHORT, // 1 minute
    },
  });
}

export default useCachedQuery;
