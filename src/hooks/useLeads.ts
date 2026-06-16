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

      // Buscar de Lead, AbandonedCart, ShopifyAbandonedCart e Order para o userId em paralelo
      const [leadsRes, abandonedRes, shopifyAbandonedRes, ordersRes] = await Promise.all([
        supabase.from('Lead').select('*').eq('userId', userId),
        supabase.from('AbandonedCart').select('*').eq('userId', userId),
        supabase.from('ShopifyAbandonedCart').select('*').eq('userId', userId),
        supabase.from('Order').select('*').eq('userId', userId),
      ]);

      if (leadsRes.error) {
        console.error('Error fetching Lead:', leadsRes.error);
      }
      if (abandonedRes.error) {
        console.error('Error fetching AbandonedCart:', abandonedRes.error);
      }
      if (shopifyAbandonedRes.error) {
        console.error('Error fetching ShopifyAbandonedCart:', shopifyAbandonedRes.error);
      }
      if (ordersRes.error) {
        console.error('Error fetching Order:', ordersRes.error);
      }

      const dbLeads = leadsRes.data || [];
      const dbAbandoned = abandonedRes.data || [];
      const dbShopifyAbandoned = shopifyAbandonedRes.data || [];
      // Considerar como lead qualquer ordem de teste ou local que não esteja paga (paymentStatus != 'PAID')
      const dbOrders = (ordersRes.data || []).filter(o => o.paymentStatus !== 'PAID');

      // Mapeamento consolidado por e-mail (case-insensitive)
      const leadMap = new Map<string, Lead>();

      // 1. Processar dados de Lead (manuais/migrados)
      for (const l of dbLeads) {
        if (!l.email) continue;
        const emailKey = l.email.toLowerCase().trim();
        leadMap.set(emailKey, {
          id: l.id,
          name: l.name || '',
          email: l.email,
          phone: l.phone || null,
          source: l.source || 'Manual',
          status: (l.status || 'NEW') as any,
          userId: l.userId,
          createdAt: l.createdAt || new Date().toISOString(),
          updatedAt: l.updatedAt || new Date().toISOString(),
          utmSource: l.utmSource || null,
          utmMedium: l.utmMedium || null,
          utmCampaign: l.utmCampaign || null,
          notes: l.notes || null,
          convertedAt: l.convertedAt || null,
          customerId: l.customerId || null,
        });
      }

      // 2. Processar dados de AbandonedCart (carrinhos abandonados locais)
      for (const a of dbAbandoned) {
        if (!a.email) continue;
        const emailKey = a.email.toLowerCase().trim();
        if (!leadMap.has(emailKey)) {
          leadMap.set(emailKey, {
            id: a.id,
            name: a.customerName || 'Lead de Abandono',
            email: a.email,
            phone: a.customerPhone || null,
            source: 'Abandono de Checkout',
            status: 'NEW',
            userId: a.userId || userId,
            createdAt: a.createdAt || new Date().toISOString(),
            updatedAt: a.createdAt || new Date().toISOString(),
          });
        }
      }

      // 3. Processar dados de ShopifyAbandonedCart (carrinhos abandonados Shopify)
      for (const sa of dbShopifyAbandoned) {
        if (!sa.email) continue;
        const emailKey = sa.email.toLowerCase().trim();
        if (!leadMap.has(emailKey)) {
          const customerName = sa.shopifyData?.customer
            ? `${sa.shopifyData.customer.first_name || ''} ${sa.shopifyData.customer.last_name || ''}`.trim()
            : 'Lead Shopify';
          leadMap.set(emailKey, {
            id: String(sa.id),
            name: customerName || 'Lead Shopify',
            email: sa.email,
            phone: sa.phone || null,
            source: 'Shopify Abandono',
            status: 'NEW',
            userId: sa.userId || userId,
            createdAt: sa.abandonedAt || sa.createdAt || new Date().toISOString(),
            updatedAt: sa.updatedAt || new Date().toISOString(),
          });
        }
      }

      // 4. Processar dados de Order (pedidos locais não pagos)
      for (const o of dbOrders) {
        if (!o.customerEmail) continue;
        const emailKey = o.customerEmail.toLowerCase().trim();
        const existing = leadMap.get(emailKey);

        if (existing) {
          if (!existing.name && o.customerName) existing.name = o.customerName;
          if (!existing.phone && o.customerPhone) existing.phone = o.customerPhone;
        } else {
          leadMap.set(emailKey, {
            id: o.id || String(Math.random()),
            name: o.customerName || 'Lead Pendente',
            email: o.customerEmail,
            phone: o.customerPhone || null,
            source: o.paymentMethod ? `Checkout (${o.paymentMethod})` : 'Checkout Pendente',
            status: 'NEW',
            userId: o.userId || userId,
            createdAt: o.createdAt || new Date().toISOString(),
            updatedAt: o.updatedAt || new Date().toISOString(),
            utmSource: o.utmSource || null,
            utmMedium: o.utmMedium || null,
            utmCampaign: o.utmCampaign || null,
          });
        }
      }

      // Converter mapa para array e aplicar filtros
      let consolidatedList = Array.from(leadMap.values());

      // Filtro de busca textual
      if (search) {
        const searchLower = search.toLowerCase().trim();
        consolidatedList = consolidatedList.filter((l) => {
          return (
            (l.name && l.name.toLowerCase().includes(searchLower)) ||
            (l.email && l.email.toLowerCase().includes(searchLower)) ||
            (l.phone && l.phone.toLowerCase().includes(searchLower))
          );
        });
      }

      // Filtro de status
      if (status !== 'all' && status !== 'ALL') {
        consolidatedList = consolidatedList.filter((l) => l.status === status);
      }

      // Ordenar decrescente pela criação
      consolidatedList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const totalCount = consolidatedList.length;

      // Paginação
      const paginatedList = consolidatedList.slice(page * pageSize, (page + 1) * pageSize);

      return {
        leads: paginatedList,
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
    data: data?.leads || [],
    isLoading,
    error: error as Error | null,
    totalCount,
    totalPages,
    refetch,
  };
};

export default useLeads;

