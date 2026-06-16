import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  source: string | null;
  status: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';
  userId: string;
  createdAt: string;
  updatedAt: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  notes?: string | null;
  convertedAt?: string | null;
  customerId?: string | null;
}

export interface UseLeadsParams {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  enabled?: boolean;
}

export interface UseLeadsReturn {
  data: Lead[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  totalPages: number;
  refetch: () => void;
}

export const useLeads = ({
  userId,
  page = 0,
  pageSize = 50,
  search = '',
  status = 'all',
  enabled = true,
}: UseLeadsParams): UseLeadsReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['leads', userId, page, pageSize, search, status],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      let query = supabase
        .from('Lead')
        .select('*', { count: 'exact' })
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Filtro de busca (nome, email, telefone)
      if (search) {
        query = query.or(
          `name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`
        );
      }

      // Filtro de status (NEW, CONTACTED, QUALIFIED, CONVERTED)
      if (status !== 'all' && status !== 'ALL') {
        query = query.eq('status', status);
      }

      const { data: leads, error: queryError, count } = await query;

      if (queryError) {
        console.error('Error fetching leads:', queryError);
        throw queryError;
      }

      return {
        leads: (leads || []) as Lead[],
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
    data: data?.leads || [],
    isLoading,
    error: error as Error | null,
    totalCount,
    totalPages,
    refetch,
  };
};

export default useLeads;

