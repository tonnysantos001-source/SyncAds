import { useState, useMemo, useCallback, useEffect } from 'react';
import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query';

// ============================================================================
// TYPES
// ============================================================================

export interface UseVirtualizedDataOptions<TData = any> {
  /**
   * Query key for React Query
   */
  queryKey: string[];

  /**
   * Function to fetch data page
   */
  queryFn: (page: number, pageSize: number) => Promise<{
    data: TData[];
    totalCount: number;
    hasMore: boolean;
  }>;

  /**
   * Page size
   */
  pageSize?: number;

  /**
   * Enable query
   */
  enabled?: boolean;

  /**
   * Search term
   */
  searchTerm?: string;

  /**
   * Additional filters
   */
  filters?: Record<string, any>;

  /**
   * Debounce delay for search (ms)
   */
  searchDebounceMs?: number;

  /**
   * Initial data
   */
  initialData?: TData[];

  /**
   * Cache time
   */
  staleTime?: number;
}

export interface UseVirtualizedDataReturn<TData = any> {
  /**
   * Flattened array of all loaded data
   */
  data: TData[];

  /**
   * Total count of items (from server)
   */
  totalCount: number;

  /**
   * Is initial loading
   */
  isLoading: boolean;

  /**
   * Is fetching more data
   */
  isFetchingMore: boolean;

  /**
   * Has more pages to load
   */
  hasMore: boolean;

  /**
   * Load next page
   */
  loadMore: () => void;

  /**
   * Refresh/refetch all data
   */
  refresh: () => void;

  /**
   * Error state
   */
  error: Error | null;

  /**
   * Current page number
   */
  currentPage: number;

  /**
   * Total pages
   */
  totalPages: number;

  /**
   * Is search active
   */
  isSearching: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for virtualized data with infinite scroll support
 *
 * @example
 * const { data, loadMore, hasMore, isLoading } = useVirtualizedData({
 *   queryKey: ['products', userId],
 *   queryFn: (page, pageSize) => fetchProducts(userId, page, pageSize),
 *   pageSize: 50,
 *   searchTerm: debouncedSearch,
 * });
 */
export function useVirtualizedData<TData = any>({
  queryKey,
  queryFn,
  pageSize = 50,
  enabled = true,
  searchTerm = '',
  filters = {},
  searchDebounceMs = 300,
  initialData,
  staleTime = 5 * 60 * 1000, // 5 minutes
}: UseVirtualizedDataOptions<TData>): UseVirtualizedDataReturn<TData> {
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, searchDebounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, searchDebounceMs]);

  // Infinite query for pagination
  const {
    data: queryData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: [...queryKey, debouncedSearch, filters],
    queryFn: async ({ pageParam = 0 }) => {
      return await queryFn(pageParam, pageSize);
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length;
    },
    enabled,
    staleTime,
    initialPageParam: 0,
  });

  // Flatten all pages into single array
  const data = useMemo(() => {
    if (!queryData?.pages) {
      return initialData || [];
    }

    return queryData.pages.flatMap((page) => page.data);
  }, [queryData, initialData]);

  // Calculate total count
  const totalCount = useMemo(() => {
    if (!queryData?.pages || queryData.pages.length === 0) {
      return 0;
    }
    return queryData.pages[0].totalCount || 0;
  }, [queryData]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(totalCount / pageSize);
  }, [totalCount, pageSize]);

  // Current page
  const currentPage = useMemo(() => {
    return queryData?.pages.length || 0;
  }, [queryData]);

  // Load more handler
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Refresh handler
  const refresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    data,
    totalCount,
    isLoading,
    isFetchingMore: isFetchingNextPage,
    hasMore: hasNextPage || false,
    loadMore,
    refresh,
    error: error as Error | null,
    currentPage,
    totalPages,
    isSearching: debouncedSearch !== searchTerm,
  };
}

// ============================================================================
// SIMPLE VARIANT (without infinite scroll)
// ============================================================================

export interface UseSimpleVirtualizedDataOptions<TData = any> {
  queryKey: string[];
  queryFn: () => Promise<TData[]>;
  enabled?: boolean;
  searchTerm?: string;
  filterFn?: (item: TData, search: string) => boolean;
  sortFn?: (a: TData, b: TData) => number;
  staleTime?: number;
}

export interface UseSimpleVirtualizedDataReturn<TData = any> {
  data: TData[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  filteredCount: number;
  totalCount: number;
}

/**
 * Simple variant for client-side filtering/sorting
 */
export function useSimpleVirtualizedData<TData = any>({
  queryKey,
  queryFn,
  enabled = true,
  searchTerm = '',
  filterFn,
  sortFn,
  staleTime = 5 * 60 * 1000,
}: UseSimpleVirtualizedDataOptions<TData>): UseSimpleVirtualizedDataReturn<TData> {
  const { data: rawData = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime,
  });

  // Apply filters and sorting
  const data = useMemo(() => {
    let filtered = rawData;

    // Apply custom filter
    if (filterFn && searchTerm) {
      filtered = filtered.filter((item) => filterFn(item, searchTerm));
    }

    // Apply sorting
    if (sortFn) {
      filtered = [...filtered].sort(sortFn);
    }

    return filtered;
  }, [rawData, searchTerm, filterFn, sortFn]);

  return {
    data,
    isLoading,
    error: error as Error | null,
    refetch,
    filteredCount: data.length,
    totalCount: rawData.length,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Hook to detect when to load more (infinite scroll trigger)
 */
export function useInfiniteScrollTrigger(
  hasMore: boolean,
  loadMore: () => void,
  threshold: number = 0.8
) {
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget;
      const scrollPercentage =
        (target.scrollTop + target.clientHeight) / target.scrollHeight;

      if (scrollPercentage >= threshold && hasMore) {
        loadMore();
      }
    },
    [hasMore, loadMore, threshold]
  );

  return handleScroll;
}

/**
 * Default filter function for searching
 */
export function defaultFilterFn<TData = any>(
  searchableFields: (keyof TData)[]
): (item: TData, search: string) => boolean {
  return (item, search) => {
    const searchLower = search.toLowerCase();
    return searchableFields.some((field) => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchLower);
      }
      if (typeof value === 'number') {
        return value.toString().includes(searchLower);
      }
      return false;
    });
  };
}

/**
 * Default sort function by field
 */
export function defaultSortFn<TData = any>(
  field: keyof TData,
  direction: 'asc' | 'desc' = 'asc'
): (a: TData, b: TData) => number {
  return (a, b) => {
    const aVal = a[field];
    const bVal = b[field];

    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  };
}

export default useVirtualizedData;

// Fix: import useQuery
import { useQuery } from '@tanstack/react-query';
