import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, ShoppingCart, TrendingUp, Users, Package, CreditCard, Clock, AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

interface DashboardData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalTransactions: number;
  totalCampaigns: number;
  pendingPayments: number;
  paidOrders: number;
  loading: boolean;
}

const NewDashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<DashboardData>({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalProducts: 0,
    totalTransactions: 0,
    totalCampaigns: 0,
    pendingPayments: 0,
    paidOrders: 0,
    loading: true,
  });

  useEffect(() => {
    if (user?.organizationId) {
      loadDashboardData();
    }
  }, [user?.organizationId]);

  const loadDashboardData = async () => {
    try {
      console.log('🔄 [Dashboard] Carregando dados...');
      console.log('🔄 [Dashboard] OrgId:', user?.organizationId);
      
      setData(prev => ({ ...prev, loading: true }));

      const orgId = user?.organizationId;

      // Buscar dados básicos
      const [
        { data: orders, error: ordersError },
        { data: transactions, error: transactionsError },
        { data: customers, error: customersError },
        { data: products, error: productsError },
        { data: campaigns, error: campaignsError }
      ] = await Promise.all([
        supabase.from('Order').select('total, status').eq('organizationId', orgId),
        supabase.from('Transaction').select('amount, status').eq('organizationId', orgId),
        supabase.from('Customer').select('id').eq('organizationId', orgId),
        supabase.from('Product').select('id').eq('organizationId', orgId),
        supabase.from('Campaign').select('id').eq('organizationId', orgId)
      ]);

      // Log de erros
      if (ordersError) console.error('❌ Orders error:', ordersError);
      if (transactionsError) console.error('❌ Transactions error:', transactionsError);
      if (customersError) console.error('❌ Customers error:', customersError);
      if (productsError) console.error('❌ Products error:', productsError);
      if (campaignsError) console.error('❌ Campaigns error:', campaignsError);

      console.log('📊 [Dashboard] Dados recebidos:');
      console.log('  - Orders:', orders?.length || 0);
      console.log('  - Transactions:', transactions?.length || 0);
      console.log('  - Customers:', customers?.length || 0);
      console.log('  - Products:', products?.length || 0);
      console.log('  - Campaigns:', campaigns?.length || 0);

      // Calcular métricas
      const totalRevenue = orders?.filter(o => o.status === 'PAID').reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const totalOrders = orders?.length || 0;
      const paidOrders = orders?.filter(o => o.status === 'PAID').length || 0;
      const totalCustomers = customers?.length || 0;
      const totalProducts = products?.length || 0;
      const totalTransactions = transactions?.length || 0;
      const pendingPayments = transactions?.filter(t => t.status === 'PENDING').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const totalCampaigns = campaigns?.length || 0;

      setData({
        totalRevenue,
        totalOrders,
        totalCustomers,
        totalProducts,
        totalTransactions,
        totalCampaigns,
        pendingPayments,
        paidOrders,
        loading: false,
      });

      console.log('✅ [Dashboard] Métricas calculadas:');
      console.log('  - Revenue:', totalRevenue);
      console.log('  - Orders:', totalOrders);
      console.log('  - Customers:', totalCustomers);
    } catch (error) {
      console.error('❌ [Dashboard] Erro fatal:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral completa do seu negócio</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Campanhas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Campanhas</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{data.totalCampaigns}</div>
            )}
            <p className="text-xs text-gray-600 mt-1">Campanhas ativas e concluídas</p>
          </CardContent>
        </Card>

        {/* Total de Pedidos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingCart className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{data.totalOrders}</div>
            )}
            <p className="text-xs text-gray-600 mt-1">{data.paidOrders} pagos</p>
          </CardContent>
        </Card>

        {/* Receita Total */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.totalRevenue)}</div>
            )}
            <p className="text-xs text-gray-600 mt-1">De todos os pedidos pagos</p>
          </CardContent>
        </Card>

        {/* Total de Transações */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Transações</CardTitle>
            <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{data.totalTransactions}</div>
            )}
            <p className="text-xs text-gray-600 mt-1">Transações de pagamento</p>
          </CardContent>
        </Card>

        {/* Total de Clientes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{data.totalCustomers}</div>
            )}
            <p className="text-xs text-gray-600 mt-1">Clientes cadastrados</p>
          </CardContent>
        </Card>

        {/* Total de Produtos */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
            <Package className="h-4 w-4 text-pink-600" />
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{data.totalProducts}</div>
            )}
            <p className="text-xs text-gray-600 mt-1">Produtos cadastrados</p>
          </CardContent>
        </Card>

        {/* Pagamentos Pendentes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagamentos Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-8 w-32" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">{formatCurrency(data.pendingPayments)}</div>
            )}
            <p className="text-xs text-gray-600 mt-1">Aguardando pagamento</p>
          </CardContent>
        </Card>

        {/* Taxa de Conversão */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            {data.loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-3xl font-bold text-gray-900">
                {data.totalOrders > 0 
                  ? `${((data.paidOrders / data.totalOrders) * 100).toFixed(1)}%`
                  : '0%'
                }
              </div>
            )}
            <p className="text-xs text-gray-600 mt-1">Pedidos pagos vs totais</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert se não houver dados */}
      {!data.loading && data.totalOrders === 0 && data.totalCampaigns === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <h3 className="font-semibold text-yellow-900">Nenhum dado encontrado</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Comece criando campanhas e fazendo vendas para ver dados aqui.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default NewDashboardPage;

