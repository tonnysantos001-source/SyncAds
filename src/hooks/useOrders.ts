import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Order {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: string | null;
  subtotal: number;
  discount: number;
  shippingCost: number;
  total: number;
  userId: string;
  organizationId: string | null;
  customerId: string;
  customerName: string | null;
  customerEmail: string | null;
  customerPhone: string | null;
  shippingAddress: any;
  billingAddress: any;
  notes: string | null;
  trackingCode: string | null;
  shopifyOrderId: string | null;
  pixCode: string | null;
  pixQrCode: string | null;
  pixExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseOrdersParams {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  paymentStatus?: string;
  enabled?: boolean;
}

export interface UseOrdersReturn {
  data: Order[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  totalPages: number;
  refetch: () => void;
}

export const useOrders = ({
  userId,
  page = 0,
  pageSize = 50,
  search = '',
  status = 'all',
  paymentStatus = 'all',
  enabled = true,
}: UseOrdersParams): UseOrdersReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['orders', userId, page, pageSize, search, status, paymentStatus],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      let query = supabase
        .from('Order')
        .select('*, Customer(name, email, phone)', { count: 'exact' })
        .eq('userId', userId)
        .order('createdAt', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      // Filtro de busca (orderNumber, customerName, customerEmail)
      if (search) {
        query = query.or(
          `orderNumber.ilike.%${search}%,customerName.ilike.%${search}%,customerEmail.ilike.%${search}%,customerPhone.ilike.%${search}%`
        );
      }

      // Filtro de status
      if (status !== 'all') {
        query = query.eq('status', status);
      }

      // Filtro de payment status
      if (paymentStatus !== 'all') {
        query = query.eq('paymentStatus', paymentStatus);
      }

      const { data: orders, error: queryError, count } = await query;

      if (queryError) {
        console.error('Error fetching orders:', queryError);
        throw queryError;
      }

      return {
        orders: orders || [],
        count: count || 0,
      };
    },
    enabled: enabled && !!userId,
    staleTime: 3 * 60 * 1000, // 3 minutos (mais frequente que produtos)
    gcTime: 10 * 60 * 1000, // 10 minutos
  });

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data: data?.orders || [],
    isLoading,
    error: error as Error | null,
    totalCount,
    totalPages,
    refetch,
  };
};

export default useOrders;
