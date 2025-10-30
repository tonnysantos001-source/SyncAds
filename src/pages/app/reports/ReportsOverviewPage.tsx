import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Calendar, Download, Info, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

interface CheckoutMetrics {
  totalRevenue: number;
  totalOrders: number;
  approvedRevenue: number;
  refundedRevenue: number;
  netProfit: number;
  totalShipping: number;
  avgTicket: number;
  conversionRate: number;
  loading: boolean;
}

const ReportsOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [metrics, setMetrics] = useState<CheckoutMetrics>({
    totalRevenue: 0,
    totalOrders: 0,
    approvedRevenue: 0,
    refundedRevenue: 0,
    netProfit: 0,
    totalShipping: 0,
    avgTicket: 0,
    conversionRate: 0,
    loading: true,
  });

  const [checkoutSetup, setCheckoutSetup] = useState({
    billing: false,
    domain: false,
    gateway: false,
    shipping: false,
    loading: true,
  });

  useEffect(() => {
    if (user?.id) {
      loadCheckoutData();
      loadCheckoutSetupStatus();
    }
  }, [user?.id]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const loadCheckoutData = async () => {
    try {
      setMetrics(prev => ({ ...prev, loading: true }));
      
      const userId = user?.id;

      if (!userId) {
        setMetrics(prev => ({ ...prev, loading: false }));
        return;
      }

      // ✅ SISTEMA SIMPLIFICADO: Buscar dados baseado no userId
      const [
        { data: orders },
        { data: transactions }
      ] = await Promise.all([
        supabase.from('Order').select('total, status, shippingCost').eq('userId', userId),
        supabase.from('Transaction').select('amount, status, paymentMethod').eq('userId', userId)
      ]);

      console.log('📊 [Reports] Dados carregados:', { orders, transactions });

      // Calcular métricas
      const totalRevenue = orders?.filter(o => o.status === 'PAID')
        .reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      
      const totalOrders = orders?.length || 0;
      const paidOrders = orders?.filter(o => o.status === 'PAID').length || 0;
      
      const approvedRevenue = transactions?.filter(t => t.status === 'PAID')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      const refundedRevenue = transactions?.filter(t => t.status === 'REFUNDED')
        .reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
      
      const totalShipping = orders?.filter(o => o.status === 'PAID')
        .reduce((sum, o) => sum + (o.shippingCost || 0), 0) || 0;
      
      const avgTicket = paidOrders > 0 ? totalRevenue / paidOrders : 0;
      const conversionRate = totalOrders > 0 ? (paidOrders / totalOrders) * 100 : 0;
      const netProfit = approvedRevenue - refundedRevenue;

      setMetrics({
        totalRevenue,
        totalOrders,
        approvedRevenue,
        refundedRevenue,
        netProfit,
        totalShipping,
        avgTicket,
        conversionRate,
        loading: false,
      });

      console.log('✅ [Reports] Métricas calculadas:', {
        totalRevenue: formatCurrency(totalRevenue),
        totalOrders,
        netProfit: formatCurrency(netProfit),
        avgTicket: formatCurrency(avgTicket),
        conversionRate: conversionRate.toFixed(2) + '%'
      });
    } catch (error) {
      console.error('❌ [Reports] Erro ao carregar dados:', error);
      setMetrics(prev => ({ ...prev, loading: false }));
    }
  };

  const loadCheckoutSetupStatus = async () => {
    if (!user?.id) return;
    
    try {
      const [billingCompleted, domainCompleted, gatewayCompleted, shippingCompleted] = await Promise.all([
        checkBillingStatus(),
        checkDomainStatus(),
        checkGatewayStatus(),
        checkShippingStatus()
      ]);

      setCheckoutSetup({
        billing: billingCompleted,
        domain: domainCompleted,
        gateway: gatewayCompleted,
        shipping: shippingCompleted,
        loading: false,
      });
    } catch (error) {
      console.error('❌ [Reports] Erro ao verificar setup:', error);
      setCheckoutSetup(prev => ({ ...prev, loading: false }));
    }
  };

  const checkBillingStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      // Verificar se usuário tem um plano atribuído (mesmo que gratuito)
      const { data: userData } = await supabase
        .from('User')
        .select('currentPlanId')
        .eq('id', user.id)
        .single();

      // Se tem plano atribuído, billing está OK
      if (userData?.currentPlanId) {
        return true;
      }

      // Verificar se tem subscrição ativa (mesmo gratuita)
      const { data: subscription } = await supabase
        .from('Subscription')
        .select('id, status')
        .eq('userId', user.id)
        .eq('status', 'active')
        .single();

      return !!subscription;
    } catch (error) {
      return false;
    }
  };

  const checkDomainStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data: userData } = await supabase
        .from('User')
        .select('domain, domainVerified')
        .eq('id', user.id)
        .single();
      return !!(userData?.domain && userData?.domainVerified);
    } catch (error) {
      return false;
    }
  };

  const checkGatewayStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data: gateways } = await supabase
        .from('GatewayConfig')
        .select('id, isActive')
        .eq('userId', user.id)
        .eq('isActive', true)
        .limit(1);
      return (gateways?.length || 0) > 0;
    } catch (error) {
      return false;
    }
  };

  const checkShippingStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data: shippingMethods } = await supabase
        .from('ShippingMethod')
        .select('id')
        .eq('userId', user.id)
        .limit(1);
      return (shippingMethods?.length || 0) > 0;
    } catch (error) {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">VISÃO GERAL</h1>
          <p className="text-gray-600 mt-1">
            Acompanhe o desempenho geral do seu e-commerce
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
          <Button className="bg-pink-600 hover:bg-pink-700 text-white" size="sm">
            Filtrar
          </Button>
          <Button variant="outline" size="sm">
            Colection
          </Button>
          <Button variant="outline" size="sm">
            Semana
          </Button>
          <Button variant="outline" size="sm">
            Mês
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Card de Status do Checkout - Só aparece se tiver algo pendente */}
      {!checkoutSetup.loading && (!checkoutSetup.billing || !checkoutSetup.domain || !checkoutSetup.gateway || !checkoutSetup.shipping) && (
        <Card className="border-pink-200 bg-pink-50">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-pink-600" />
                  Configure seu Checkout
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Complete o onboarding para ativar seu checkout e começar a vender
                </p>
                <div className="flex gap-2 flex-wrap">
                  {!checkoutSetup.billing && (
                    <span className="text-xs bg-white px-2 py-1 rounded border border-pink-200">
                      ❌ Faturamento
                    </span>
                  )}
                  {!checkoutSetup.domain && (
                    <span className="text-xs bg-white px-2 py-1 rounded border border-pink-200">
                      ❌ Domínio
                    </span>
                  )}
                  {!checkoutSetup.gateway && (
                    <span className="text-xs bg-white px-2 py-1 rounded border border-pink-200">
                      ❌ Gateway
                    </span>
                  )}
                  {!checkoutSetup.shipping && (
                    <span className="text-xs bg-white px-2 py-1 rounded border border-pink-200">
                      ❌ Frete
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={() => navigate('/onboarding')}
                className="bg-pink-600 hover:bg-pink-700 text-white"
                size="sm"
              >
                Configurar <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 - Receita Líquida */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Receita líquida</p>
              {metrics.loading ? (
                <Skeleton className="h-9 w-32" />
              ) : (
                <p className="text-3xl font-bold">
                  {formatCurrency(metrics.totalRevenue)} ({metrics.totalOrders})
                </p>
              )}
              <div className="flex items-center gap-2 text-sm">
                {metrics.loading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  <span className="text-gray-500">
                    Aprovados: {metrics.totalOrders} pedidos
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 - Lucro Líquido */}
        <Card className="bg-gray-900 text-white">
          <CardContent className="p-6">
            <div className="space-y-2">
              <p className="text-sm text-gray-300">Lucro Líquido</p>
              {metrics.loading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <p className="text-3xl font-bold">{formatCurrency(metrics.netProfit)}</p>
              )}
              <div className="flex items-center gap-2 text-sm">
                {metrics.loading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  <span className="text-gray-400">
                    Aprovado: {formatCurrency(metrics.approvedRevenue)}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - Ticket Médio */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <p className="text-sm text-gray-600">Ticket Médio</p>
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              {metrics.loading ? (
                <Skeleton className="h-9 w-24" />
              ) : (
                <p className="text-3xl font-bold">{formatCurrency(metrics.avgTicket)}</p>
              )}
              <div className="flex items-center gap-2 text-sm">
                {metrics.loading ? (
                  <Skeleton className="h-4 w-12" />
                ) : (
                  <span className="text-gray-500">
                    Conversão: {metrics.conversionRate.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
            <p className="text-gray-400">Gráfico de linha - Receita por período</p>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Métricas Detalhadas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Receita Aprovada</p>
            <p className="text-xl font-bold">0,00 (0)</p>
            <p className="text-xs text-gray-500">% 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Receita Estornada</p>
            <p className="text-xl font-bold">0,00 (0)</p>
            <p className="text-xs text-gray-500">% 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Compra / Dia</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Pedidos</p>
            <p className="text-xl font-bold">0,00 (0)</p>
            <p className="text-xs text-gray-500">% 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Frete</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Custo p/o</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Margem Líquida</p>
            <p className="text-xl font-bold">0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Lucro Real</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Ticket médio</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Lucratividade</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <Info className="w-3 h-3" /> Mais de meta
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Meta de ROAS</p>
            <p className="text-xl font-bold">0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Novo de ROAS</p>
            <p className="text-xl font-bold flex items-center gap-1">
              <Info className="w-3 h-3" /> 
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Tax. de Conversão</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Roas</p>
            <p className="text-xl font-bold">0,00</p>
            <p className="text-xs text-gray-500">— 0%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">Roi</p>
            <p className="text-xl font-bold">0,00</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-gray-600 mb-1">CPA</p>
            <p className="text-xl font-bold">0,00</p>
          </CardContent>
        </Card>
      </div>

      {/* Seção Conversão por canal, Taxas, etc */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Funnel de Conversão */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Funnel de Conversão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm mb-2">UTM's Utilizadas</p>
                <p className="text-2xl font-bold">0% (0)</p>
              </div>
              <div>
                <p className="text-sm mb-2">Entrega</p>
                <p className="text-2xl font-bold">0% (0)</p>
              </div>
              <div>
                <p className="text-sm mb-2">Pagamento</p>
                <p className="text-2xl font-bold">0% (0)</p>
              </div>
              <div>
                <p className="text-sm mb-2">Comprou</p>
                <p className="text-2xl font-bold">0% (0)</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Taxas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taxas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Pix</span>
                <span className="font-medium">0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Boleto</span>
                <span className="font-medium">0%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Cartão crédito</span>
                <span className="font-medium">0%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Parcelamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parcelamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Não existem informações para os critérios selecionados
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsOverviewPage;
