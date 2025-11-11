import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  comparePrice: number | null;
  sku: string | null;
  stock: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  categoryId: string | null;
  userId: string;
  organizationId: string | null;
  shopifyProductId: string | null;
  slug: string;
  imageUrl: string | null;
  lowStockThreshold: number;
  trackStock: boolean;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UseProductsParams {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  enabled?: boolean;
}

export interface UseProductsReturn {
  data: Product[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  totalPages: number;
  refetch: () => void;
}

export const useProducts = ({
  userId,
  page = 0,
  pageSize = 50,
  search = '',
  status = 'all',
  enabled = true,
}: UseProductsParams): UseProductsReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['products', userId, page, pageSize, search, status],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      let query = supabase
        .from('Product')
        .select('*', { count: 'exact' })
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Filtro de busca
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,sku.ilike.%${search}%,description.ilike.%${search}%`
        );
      }

      // Filtro de status
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: products, error: queryError, count } = await query;

      if (queryError) {
        console.error('Error fetching products:', queryError);
        throw queryError;
      }

      return {
        products: products || [],
        count: count || 0,
      };
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data: data?.products || [],
    isLoading,
    error: error as Error | null,
    totalCount,
    totalPages,
    refetch,
  };
};

export default useProducts;
