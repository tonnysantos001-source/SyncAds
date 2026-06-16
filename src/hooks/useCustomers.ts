import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpfCnpj: string | null;
  type: 'LEAD' | 'CUSTOMER' | 'VIP';
  status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
  userId: string;
  organizationId: string | null;
  address: any;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  notes: string | null;
  tags: string[];
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  lastOrderAt: string | null;
  shopifyCustomerId: string | null;
  whatsappNumber: string | null;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseCustomersParams {
  userId: string;
  page?: number;
  pageSize?: number;
  search?: string;
  type?: string;
  status?: string;
  enabled?: boolean;
}

export interface UseCustomersReturn {
  data: Customer[];
  isLoading: boolean;
  error: Error | null;
  totalCount: number;
  totalPages: number;
  refetch: () => void;
}

export const useCustomers = ({
  userId,
  page = 0,
  pageSize = 50,
  search = '',
  type = 'all',
  status = 'all',
  enabled = true,
}: UseCustomersParams): UseCustomersReturn => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customers', userId, page, pageSize, search, type, status],
    queryFn: async () => {
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Buscar de Customer, ShopifyCustomer e Order para o userId em paralelo
      const [customersRes, shopifyCustomersRes, ordersRes] = await Promise.all([
        supabase.from('Customer').select('*').eq('userId', userId),
        supabase.from('ShopifyCustomer').select('*').eq('userId', userId),
        supabase.from('Order').select('*').eq('userId', userId),
      ]);

      if (customersRes.error) {
        console.error('Error fetching Customer:', customersRes.error);
      }
      if (shopifyCustomersRes.error) {
        console.error('Error fetching ShopifyCustomer:', shopifyCustomersRes.error);
      }
      if (ordersRes.error) {
        console.error('Error fetching Order:', ordersRes.error);
      }

      const dbCustomers = customersRes.data || [];
      const dbShopifyCustomers = shopifyCustomersRes.data || [];
      const dbOrders = ordersRes.data || [];

      // Mapeamento consolidado por e-mail (case-insensitive)
      const customerMap = new Map<string, Customer>();

      // 1. Processar dados de Customer
      for (const c of dbCustomers) {
        if (!c.email) continue;
        const emailKey = c.email.toLowerCase().trim();
        customerMap.set(emailKey, {
          id: c.id,
          name: c.name || '',
          email: c.email,
          phone: c.phone || null,
          cpfCnpj: c.cpf || null,
          type: (c.type || 'CUSTOMER') as any,
          status: (c.status || 'ACTIVE') as any,
          userId: c.userId,
          organizationId: null,
          address: null,
          city: null,
          state: null,
          zipCode: null,
          country: null,
          notes: c.notes || null,
          tags: c.tags || [],
          totalOrders: Number(c.totalOrders) || 0,
          totalSpent: Number(c.totalSpent) || 0,
          averageOrderValue: Number(c.averageOrderValue) || 0,
          lastOrderAt: c.lastOrderAt || null,
          shopifyCustomerId: null,
          whatsappNumber: c.phone || null,
          conversationId: null,
          createdAt: c.createdAt || new Date().toISOString(),
          updatedAt: c.updatedAt || new Date().toISOString(),
        });
      }

      // 2. Processar dados de ShopifyCustomer
      for (const c of dbShopifyCustomers) {
        if (!c.email) continue;
        const emailKey = c.email.toLowerCase().trim();
        const existing = customerMap.get(emailKey);

        const name = `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Cliente Shopify';
        const ordersCount = Number(c.ordersCount) || 0;
        const totalSpent = parseFloat(c.totalSpent || '0');
        const lastOrderDate = c.shopifyData?.last_order_date || null;

        if (existing) {
          if (!existing.name) existing.name = name;
          if (!existing.phone && c.phone) {
            existing.phone = c.phone;
            existing.whatsappNumber = c.phone;
          }
          if (existing.totalOrders === 0) {
            existing.totalOrders = ordersCount;
            existing.totalSpent = totalSpent;
            existing.averageOrderValue = ordersCount > 0 ? totalSpent / ordersCount : 0;
          }
          if (!existing.lastOrderAt) existing.lastOrderAt = lastOrderDate;
          existing.shopifyCustomerId = String(c.id);
        } else {
          customerMap.set(emailKey, {
            id: String(c.id),
            name,
            email: c.email,
            phone: c.phone || null,
            cpfCnpj: null,
            type: 'CUSTOMER',
            status: 'ACTIVE',
            userId: c.userId,
            organizationId: null,
            address: null,
            city: null,
            state: null,
            zipCode: null,
            country: null,
            notes: null,
            tags: c.shopifyData?.tags ? c.shopifyData.tags.split(',').map((t: string) => t.trim()) : [],
            totalOrders: ordersCount,
            totalSpent: totalSpent,
            averageOrderValue: ordersCount > 0 ? totalSpent / ordersCount : 0,
            lastOrderAt: lastOrderDate,
            shopifyCustomerId: String(c.id),
            whatsappNumber: c.phone || null,
            conversationId: null,
            createdAt: c.createdAt || new Date().toISOString(),
            updatedAt: c.updatedAt || new Date().toISOString(),
          });
        }
      }

      // 3. Processar dados de Order
      const ordersByEmail: Record<string, typeof dbOrders> = {};
      for (const order of dbOrders) {
        if (!order.customerEmail) continue;
        const emailKey = order.customerEmail.toLowerCase().trim();
        if (!ordersByEmail[emailKey]) {
          ordersByEmail[emailKey] = [];
        }
        ordersByEmail[emailKey].push(order);
      }

      for (const [emailKey, ords] of Object.entries(ordersByEmail)) {
        ords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const latestOrder = ords[0];

        const localOrdersCount = ords.length;
        const localTotalSpent = ords.reduce((sum, o) => sum + (parseFloat(o.total) || 0), 0);
        const localLastOrderAt = latestOrder.createdAt;

        const existing = customerMap.get(emailKey);

        if (existing) {
          existing.totalOrders += localOrdersCount;
          existing.totalSpent += localTotalSpent;
          existing.averageOrderValue = existing.totalOrders > 0 ? existing.totalSpent / existing.totalOrders : 0;

          if (!existing.lastOrderAt || new Date(localLastOrderAt).getTime() > new Date(existing.lastOrderAt).getTime()) {
            existing.lastOrderAt = localLastOrderAt;
          }

          if (!existing.name && latestOrder.customerName) {
            existing.name = latestOrder.customerName;
          }
          if (!existing.phone && latestOrder.customerPhone) {
            existing.phone = latestOrder.customerPhone;
            existing.whatsappNumber = latestOrder.customerPhone;
          }
          if (!existing.cpfCnpj && latestOrder.customerCpf) {
            existing.cpfCnpj = latestOrder.customerCpf;
          }
        } else {
          customerMap.set(emailKey, {
            id: latestOrder.id || latestOrder.customerId || String(Math.random()),
            name: latestOrder.customerName || 'Cliente sem Nome',
            email: latestOrder.customerEmail,
            phone: latestOrder.customerPhone || null,
            cpfCnpj: latestOrder.customerCpf || null,
            type: 'CUSTOMER',
            status: 'ACTIVE',
            userId: latestOrder.userId || userId,
            organizationId: null,
            address: null,
            city: null,
            state: null,
            zipCode: null,
            country: null,
            notes: null,
            tags: [],
            totalOrders: localOrdersCount,
            totalSpent: localTotalSpent,
            averageOrderValue: localOrdersCount > 0 ? localTotalSpent / localOrdersCount : 0,
            lastOrderAt: localLastOrderAt,
            shopifyCustomerId: null,
            whatsappNumber: latestOrder.customerPhone || null,
            conversationId: null,
            createdAt: latestOrder.createdAt || new Date().toISOString(),
            updatedAt: latestOrder.createdAt || new Date().toISOString(),
          });
        }
      }

      // Converter mapa para array e aplicar filtros
      let consolidatedList = Array.from(customerMap.values());

      // Filtro de busca textual
      if (search) {
        const searchLower = search.toLowerCase().trim();
        consolidatedList = consolidatedList.filter((c) => {
          return (
            (c.name && c.name.toLowerCase().includes(searchLower)) ||
            (c.email && c.email.toLowerCase().includes(searchLower)) ||
            (c.phone && c.phone.toLowerCase().includes(searchLower)) ||
            (c.cpfCnpj && c.cpfCnpj.toLowerCase().includes(searchLower))
          );
        });
      }

      // Filtro de tipo
      if (type !== 'all') {
        consolidatedList = consolidatedList.filter((c) => c.type === type);
      }

      // Filtro de status
      if (status !== 'all') {
        consolidatedList = consolidatedList.filter((c) => c.status === status);
      }

      // Ordenar decrescente pela última compra/data de cadastro
      consolidatedList.sort((a, b) => {
        const dateA = a.lastOrderAt || a.createdAt;
        const dateB = b.lastOrderAt || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });

      const totalCount = consolidatedList.length;

      // Paginação
      const paginatedList = consolidatedList.slice(page * pageSize, (page + 1) * pageSize);

      return {
        customers: paginatedList,
        count: totalCount,
      };
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const totalCount = data?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    data: data?.customers || [],
    isLoading,
    error: error as Error | null,
    totalCount,
    totalPages,
    refetch,
  };
};

export default useCustomers;
