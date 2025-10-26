import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';

export type DashboardMetrics = {
  // Campaign Metrics
  totalCampaigns: {
    value: number;
    change: string;
    changeType: 'increase' | 'decrease';
  };
  totalClicks: {
    value: number;
    change: string;
    changeType: 'increase' | 'decrease';
  };
  conversionRate: {
    value: number;
    change: string;
    changeType: 'increase' | 'decrease';
  };
  totalRevenue: {
    value: number;
    change: string;
    changeType: 'increase' | 'decrease';
  };
  
  // Checkout Metrics
  totalOrders: {
    value: number;
    change: string;
    changeType: 'increase' | 'decrease';
  };
  totalTransactions: {
    value: number;
    change: string;
    changeType: 'increase' | 'decrease';
  };
  pendingPayments: {
    value: number;
    valueFormatted: string;
  };
  recoveryRate: {
    value: number;
    change: string;
  };
  
  // Customer Metrics
  totalCustomers: {
    value: number;
    change: string;
    changeType: 'increase' | 'decrease';
  };
  totalProducts: {
    value: number;
    change: string;
    changeType: 'increase' | 'decrease';
  };
  
  loading: boolean;
  error: Error | null;
};

export const useEnhancedDashboardMetrics = () => {
  const user = useStore((state) => state.user);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalCampaigns: { value: 0, change: '+0%', changeType: 'increase' },
    totalClicks: { value: 0, change: '+0%', changeType: 'increase' },
    conversionRate: { value: 0, change: '+0%', changeType: 'increase' },
    totalRevenue: { value: 0, change: '+0%', changeType: 'increase' },
    totalOrders: { value: 0, change: '+0%', changeType: 'increase' },
    totalTransactions: { value: 0, change: '+0%', changeType: 'increase' },
    pendingPayments: { value: 0, valueFormatted: 'R$ 0,00' },
    recoveryRate: { value: 0, change: '+0%' },
    totalCustomers: { value: 0, change: '+0%', changeType: 'increase' },
    totalProducts: { value: 0, change: '+0%', changeType: 'increase' },
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!user?.id) return;

    const fetchMetrics = async () => {
      try {
        setMetrics(prev => ({ ...prev, loading: true, error: null }));

        // Buscar usuário e organizationId
        const { data: userData } = await supabase
          .from('User')
          .select('organizationId')
          .eq('id', user.id)
          .single();

        if (!userData?.organizationId) {
          throw new Error('Organization not found');
        }

        const orgId = userData.organizationId;

        // Buscar dados do mês atual e anterior
        const currentMonth = new Date();
        const firstDayCurrentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
        const firstDayPreviousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const lastDayPreviousMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0);

        // Buscar dados em paralelo
        const [
          currentCampaigns,
          previousCampaigns,
          currentOrders,
          previousOrders,
          currentTransactions,
          previousTransactions,
          currentCustomers,
          previousCustomers,
          currentProducts,
          previousProducts,
        ] = await Promise.all([
          // Campanhas
          supabase
            .from('Campaign')
            .select('clicks, conversions, budgetSpent, revenue')
            .eq('organizationId', orgId)
            .gte('createdAt', firstDayCurrentMonth.toISOString()),
          
          supabase
            .from('Campaign')
            .select('clicks, conversions, budgetSpent, revenue')
            .eq('organizationId', orgId)
            .gte('createdAt', firstDayPreviousMonth.toISOString())
            .lte('createdAt', lastDayPreviousMonth.toISOString()),
          
          // Pedidos
          supabase
            .from('Order')
            .select('total, status')
            .eq('organizationId', orgId)
            .gte('createdAt', firstDayCurrentMonth.toISOString()),
          
          supabase
            .from('Order')
            .select('total, status')
            .eq('organizationId', orgId)
            .gte('createdAt', firstDayPreviousMonth.toISOString())
            .lte('createdAt', lastDayPreviousMonth.toISOString()),
          
          // Transações
          supabase
            .from('Transaction')
            .select('amount, status, paymentMethod')
            .eq('organizationId', orgId)
            .gte('createdAt', firstDayCurrentMonth.toISOString()),
          
          supabase
            .from('Transaction')
            .select('amount, status, paymentMethod')
            .eq('organizationId', orgId)
            .gte('createdAt', firstDayPreviousMonth.toISOString())
            .lte('createdAt', lastDayPreviousMonth.toISOString()),
          
          // Clientes
          supabase
            .from('Customer')
            .select('id')
            .eq('organizationId', orgId)
            .gte('createdAt', firstDayCurrentMonth.toISOString()),
          
          supabase
            .from('Customer')
            .select('id')
            .eq('organizationId', orgId)
            .gte('createdAt', firstDayPreviousMonth.toISOString())
            .lte('createdAt', lastDayPreviousMonth.toISOString()),
          
          // Produtos
          supabase
            .from('Product')
            .select('id')
            .eq('organizationId', orgId)
            .gte('createdAt', firstDayCurrentMonth.toISOString()),
          
          supabase
            .from('Product')
            .select('id')
            .eq('organizationId', orgId)
            .gte('createdAt', firstDayPreviousMonth.toISOString())
            .lte('createdAt', lastDayPreviousMonth.toISOString()),
        ]);

        // Calcular métricas de campanhas
        const totalCampaigns = currentCampaigns.data?.length || 0;
        const totalClicks = currentCampaigns.data?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
        const totalConversions = currentCampaigns.data?.reduce((sum, c) => sum + (c.conversions || 0), 0) || 0;
        const totalRevenue = currentCampaigns.data?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0;
        const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

        const prevTotalCampaigns = previousCampaigns.data?.length || 0;
        const prevTotalClicks = previousCampaigns.data?.reduce((sum, c) => sum + (c.clicks || 0), 0) || 0;
        const prevTotalConversions = previousCampaigns.data?.reduce((sum, c) => sum + (c.conversions || 0), 0) || 0;
        const prevTotalRevenue = previousCampaigns.data?.reduce((sum, c) => sum + (c.revenue || 0), 0) || 0;
        const prevConversionRate = prevTotalClicks > 0 ? (prevTotalConversions / prevTotalClicks) * 100 : 0;

        // Calcular métricas de pedidos
        const totalOrders = currentOrders.data?.length || 0;
        const totalPaidOrders = currentOrders.data?.filter(o => o.status === 'PAID' || o.status === 'COMPLETED').length || 0;
        const prevTotalOrders = previousOrders.data?.length || 0;

        // Calcular métricas de transações
        const totalTransactions = currentTransactions.data?.length || 0;
        const pendingTransactions = currentTransactions.data?.filter(t => t.status === 'PENDING').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
        const paidTransactions = currentTransactions.data?.filter(t => t.status === 'PAID').length || 0;
        const recoveryRate = totalTransactions > 0 ? (paidTransactions / totalTransactions) * 100 : 0;
        
        const prevTotalTransactions = previousTransactions.data?.length || 0;
        const prevPaidTransactions = previousTransactions.data?.filter(t => t.status === 'PAID').length || 0;
        const prevRecoveryRate = prevTotalTransactions > 0 ? (prevPaidTransactions / prevTotalTransactions) * 100 : 0;

        // Calcular métricas de clientes
        const totalCustomers = currentCustomers.data?.length || 0;
        const prevTotalCustomers = previousCustomers.data?.length || 0;

        // Calcular métricas de produtos
        const totalProducts = currentProducts.data?.length || 0;
        const prevTotalProducts = previousProducts.data?.length || 0;

        // Calcular mudanças percentuais
        const calculateChange = (current: number, previous: number): { change: string; changeType: 'increase' | 'decrease' } => {
          if (previous === 0) {
            return { change: current > 0 ? '+100%' : '0%', changeType: current > 0 ? 'increase' : 'decrease' };
          }
          const percentChange = ((current - previous) / previous) * 100;
          const changeType = percentChange >= 0 ? 'increase' : 'decrease';
          const change = percentChange >= 0 ? `+${percentChange.toFixed(1)}%` : `${percentChange.toFixed(1)}%`;
          return { change, changeType };
        };

        const formatCurrency = (value: number) => {
          return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          }).format(value);
        };

        const campaignsChange = calculateChange(totalCampaigns, prevTotalCampaigns);
        const clicksChange = calculateChange(totalClicks, prevTotalClicks);
        const conversionChange = calculateChange(conversionRate, prevConversionRate);
        const revenueChange = calculateChange(totalRevenue, prevTotalRevenue);
        const ordersChange = calculateChange(totalOrders, prevTotalOrders);
        const transactionsChange = calculateChange(totalTransactions, prevTotalTransactions);
        const customersChange = calculateChange(totalCustomers, prevTotalCustomers);
        const productsChange = calculateChange(totalProducts, prevTotalProducts);
        
        const recoveryChange = calculateChange(recoveryRate, prevRecoveryRate);

        setMetrics({
          totalCampaigns: {
            value: totalCampaigns,
            change: campaignsChange.change,
            changeType: campaignsChange.changeType,
          },
          totalClicks: {
            value: totalClicks,
            change: clicksChange.change,
            changeType: clicksChange.changeType,
          },
          conversionRate: {
            value: conversionRate,
            change: conversionChange.change,
            changeType: conversionChange.changeType,
          },
          totalRevenue: {
            value: totalRevenue,
            change: revenueChange.change,
            changeType: revenueChange.changeType,
          },
          totalOrders: {
            value: totalOrders,
            change: ordersChange.change,
            changeType: ordersChange.changeType,
          },
          totalTransactions: {
            value: totalTransactions,
            change: transactionsChange.change,
            changeType: transactionsChange.changeType,
          },
          pendingPayments: {
            value: pendingTransactions,
            valueFormatted: formatCurrency(pendingTransactions),
          },
          recoveryRate: {
            value: recoveryRate,
            change: recoveryChange.change,
          },
          totalCustomers: {
            value: totalCustomers,
            change: customersChange.change,
            changeType: customersChange.changeType,
          },
          totalProducts: {
            value: totalProducts,
            change: productsChange.change,
            changeType: productsChange.changeType,
          },
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error fetching enhanced metrics:', error);
        setMetrics(prev => ({
          ...prev,
          loading: false,
          error: error as Error,
        }));
      }
    };

    fetchMetrics();
  }, [user?.id]);

  return metrics;
};
