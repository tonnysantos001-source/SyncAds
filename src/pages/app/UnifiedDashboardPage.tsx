import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DollarSign, ShoppingCart, TrendingUp, Users, Package, CreditCard, Clock, AlertCircle, PieChart, Activity, Monitor, Truck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

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

interface PaymentMetrics {
  totalTransactions: number;
  paidTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  revenueByMethod: Record<string, number>;
  conversionRate: number;
  averageTicket: number;
}

const UnifiedDashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [userName, setUserName] = useState<string>('');
  const [showCheckoutOnboarding, setShowCheckoutOnboarding] = useState(false);
  const [billingConfigured, setBillingConfigured] = useState(false);
  const [domainConfigured, setDomainConfigured] = useState(false);
  const [gatewayConfigured, setGatewayConfigured] = useState(false);
  const [shippingConfigured, setShippingConfigured] = useState(false);
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

  const [paymentMetrics, setPaymentMetrics] = useState<PaymentMetrics>({
    totalTransactions: 0,
    paidTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    revenueByMethod: {},
    conversionRate: 0,
    averageTicket: 0,
  });

  useEffect(() => {
    if (user?.organizationId) {
      loadDashboardData();
      loadUserName();
      checkCheckoutStatus();
    }
  }, [user?.organizationId]);

  const checkCheckoutStatus = async () => {
    try {
      if (!user?.organizationId) return;

      // Verificar se checkout está configurado
      const [billing, domain, gateway, shipping] = await Promise.all([
        checkBillingStatus(user.organizationId),
        checkDomainStatus(user.organizationId),
        checkGatewayStatus(user.organizationId),
        checkShippingStatus(user.organizationId)
      ]);

      setBillingConfigured(billing);
      setDomainConfigured(domain);
      setGatewayConfigured(gateway);
      setShippingConfigured(shipping);

      // Se pelo menos 3 de 4 não estiverem configurados, mostrar onboarding
      const configuredCount = [billing, domain, gateway, shipping].filter(Boolean).length;
      setShowCheckoutOnboarding(configuredCount < 3);
    } catch (error) {
      console.error('Erro ao verificar status do checkout:', error);
    }
  };

  const checkBillingStatus = async (orgId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('Organization')
        .select('subscriptionId, stripeCustomerId')
        .eq('id', orgId)
        .single();
      return !!(data?.subscriptionId && data?.stripeCustomerId);
    } catch {
      return false;
    }
  };

  const checkDomainStatus = async (orgId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('Organization')
        .select('domain, domainVerified')
        .eq('id', orgId)
        .single();
      return !!(data?.domain && data?.domainVerified);
    } catch {
      return false;
    }
  };

  const checkGatewayStatus = async (orgId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('GatewayConfig')
        .select('id')
        .eq('organizationId', orgId)
        .eq('isActive', true)
        .limit(1);
      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  };

  const checkShippingStatus = async (orgId: string): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from('ShippingMethod')
        .select('id')
        .eq('organizationId', orgId)
        .eq('isActive', true)
        .limit(1);
      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  };

  const loadUserName = async () => {
    try {
      if (!user?.id) return;
      
      const { data: userData } = await supabase
        .from('User')
        .select('name, firstName, lastName, email')
        .eq('id', user.id)
        .single();

      console.log('User data:', userData);
      
      if (userData) {
        // Tentar firstName + lastName, senão name, senão email
        let name = '';
        
        if (userData.firstName && userData.lastName) {
          name = `${userData.firstName} ${userData.lastName}`;
        } else if (userData.name) {
          name = userData.name;
        } else if (userData.email) {
          // Pegar parte antes do @ e capitalizar
          const emailName = userData.email.split('@')[0];
          name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        } else {
          name = 'Usuário';
        }
        
        console.log('Nome carregado:', name);
        setUserName(name);
      }
    } catch (error) {
      console.error('Erro ao carregar nome:', error);
      // Fallback para email
      const fallbackName = user?.email?.split('@')[0] || '';
      setUserName(fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1));
    }
  };

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

      // Calcular métricas de pagamento
      const paidTransactions = transactions?.filter(t => t.status === 'PAID').length || 0;
      const pendingTransactions = transactions?.filter(t => t.status === 'PENDING').length || 0;
      const failedTransactions = transactions?.filter(t => t.status === 'FAILED').length || 0;
      
      // Calcular receita por método de pagamento
      const revenueByMethod: Record<string, number> = {};
      transactions?.filter(t => t.status === 'PAID').forEach(t => {
        const method = t.paymentMethod || 'UNKNOWN';
        revenueByMethod[method] = (revenueByMethod[method] || 0) + (t.amount || 0);
      });

      // Calcular taxa de conversão
      const conversionRate = totalTransactions > 0 ? (paidTransactions / totalTransactions) * 100 : 0;
      
      // Calcular ticket médio
      const paidAmount = transactions?.filter(t => t.status === 'PAID').reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      const averageTicket = paidTransactions > 0 ? paidAmount / paidTransactions : 0;

      setPaymentMetrics({
        totalTransactions,
        paidTransactions,
        pendingTransactions,
        failedTransactions,
        revenueByMethod,
        conversionRate,
        averageTicket,
      });

      console.log('✅ [Dashboard] Métricas calculadas:');
      console.log('  - Revenue:', totalRevenue);
      console.log('  - Orders:', totalOrders);
      console.log('  - Customers:', totalCustomers);
      console.log('  - Payment Metrics:', {
        totalTransactions,
        paidTransactions,
        conversionRate: conversionRate.toFixed(2) + '%',
        averageTicket: formatCurrency(averageTicket),
      });
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
      {/* Header com Saudação Personalizada */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {userName ? `Olá ${userName},` : 'Olá,'}
        </h1>
        <p className="text-gray-600 mt-1">Seja bem vindo</p>
      </div>

      {/* Card de Onboarding do Checkout (sempre mostrar) */}
      <Card className="border-2 bg-white">
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Para ativar seu checkout você precisa concluir todos passos abaixo:
          </h2>

          <div className="space-y-4">
            {/* Faturamento */}
            <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Faturamento</h3>
                <p className="text-sm text-gray-600">Adicione um cartão de crédito em sua conta</p>
              </div>
              <div className="flex-shrink-0">
                {billingConfigured ? (
                  <div className="h-5 w-5 rounded-full bg-green-500"></div>
                ) : (
                  <div className="h-5 w-5 rounded-full bg-red-500"></div>
                )}
              </div>
            </div>

            {/* Domínio */}
            <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <Monitor className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Domínio</h3>
                <p className="text-sm text-gray-600">Verifique seu domínio. Deve ser o mesmo utilizado na Shopify, WooCommerce ou na sua landing page.</p>
              </div>
              <div className="flex-shrink-0">
                {domainConfigured ? (
                  <div className="h-5 w-5 rounded-full bg-green-500"></div>
                ) : (
                  <div className="h-5 w-5 rounded-full bg-red-500"></div>
                )}
              </div>
            </div>

            {/* Gateway */}
            <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Gateway</h3>
                <p className="text-sm text-gray-600">Configure os meios de pagamentos que serão exibidos em sua loja.</p>
              </div>
              <div className="flex-shrink-0">
                {gatewayConfigured ? (
                  <div className="h-5 w-5 rounded-full bg-green-500"></div>
                ) : (
                  <div className="h-5 w-5 rounded-full bg-red-500"></div>
                )}
              </div>
            </div>

            {/* Frete */}
            <div className="flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                <Truck className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Frete</h3>
                <p className="text-sm text-gray-600">Crie métodos de entrega para ser exibido no seu checkout.</p>
              </div>
              <div className="flex-shrink-0">
                {shippingConfigured ? (
                  <div className="h-5 w-5 rounded-full bg-green-500"></div>
                ) : (
                  <div className="h-5 w-5 rounded-full bg-red-500"></div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards (apenas se tudo configurado) */}
      {!showCheckoutOnboarding && (
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
      )}

      {/* Gráficos de Métricas de Pagamento */}
      {!showCheckoutOnboarding && !data.loading && paymentMetrics.totalTransactions > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Gráfico Pizza - Status das Transações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Status das Transações
              </CardTitle>
              <CardDescription>Distribuição de pagamentos por status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                <Pie
                  data={{
                    labels: ['Pagos', 'Pendentes', 'Falhados'],
                    datasets: [{
                      data: [
                        paymentMetrics.paidTransactions,
                        paymentMetrics.pendingTransactions,
                        paymentMetrics.failedTransactions
                      ],
                      backgroundColor: [
                        'rgb(34, 197, 94)', // green
                        'rgb(251, 191, 36)', // yellow
                        'rgb(239, 68, 68)', // red
                      ],
                      borderWidth: 2,
                      borderColor: '#ffffff'
                    }]
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                      },
                    },
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Gráfico Pizza - Receita por Método */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                Receita por Método de Pagamento
              </CardTitle>
              <CardDescription>Distribuição de receita por meio de pagamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center">
                {Object.keys(paymentMetrics.revenueByMethod).length > 0 ? (
                  <Pie
                    data={{
                      labels: Object.keys(paymentMetrics.revenueByMethod),
                      datasets: [{
                        data: Object.values(paymentMetrics.revenueByMethod),
                        backgroundColor: [
                          'rgb(59, 130, 246)', // blue
                          'rgb(16, 185, 129)', // green
                          'rgb(139, 92, 246)', // purple
                          'rgb(236, 72, 153)', // pink
                          'rgb(249, 115, 22)', // orange
                        ],
                        borderWidth: 2,
                        borderColor: '#ffffff'
                      }]
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              const value = context.parsed;
                              return formatCurrency(value);
                            }
                          }
                        }
                      },
                    }}
                  />
                ) : (
                  <p className="text-gray-500">Sem dados de receita por método</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Métricas de Performance */}
      {!data.loading && paymentMetrics.totalTransactions > 0 && (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Taxa de Conversão */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {paymentMetrics.conversionRate.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-600 mt-1">
                {paymentMetrics.paidTransactions} de {paymentMetrics.totalTransactions} transações
              </p>
            </CardContent>
          </Card>

          {/* Ticket Médio */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {formatCurrency(paymentMetrics.averageTicket)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Valor médio por transação
              </p>
            </CardContent>
          </Card>

          {/* Total de Receita */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-600">
                {formatCurrency(data.totalRevenue)}
              </div>
              <p className="text-xs text-gray-600 mt-1">
                De todas as transações pagas
              </p>
            </CardContent>
          </Card>
        </div>
      )}

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

export default UnifiedDashboardPage;