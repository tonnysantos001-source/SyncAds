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
  const [billingConfigured, setBillingConfigured] = useState(false);
  const [domainConfigured, setDomainConfigured] = useState(false);
  const [gatewayConfigured, setGatewayConfigured] = useState(false);
  const [shippingConfigured, setShippingConfigured] = useState(false);

  const loadUserName = async () => {
    try {
      if (!user?.id) return;
      
      const { data: userData } = await supabase
        .from('User')
        .select('name, email')
        .eq('id', user.id)
        .single();

      console.log('🔍 [Dashboard] User data:', userData);
      
      if (userData) {
        // Usar o campo name que foi salvo no cadastro
        let name = '';
        
        if (userData.name) {
          // Capitalizar primeira letra de cada palavra
          name = userData.name.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
        } else if (userData.email) {
          // Pegar parte antes do @ e capitalizar
          const emailName = userData.email.split('@')[0];
          name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        } else {
          name = 'Usuário';
        }
        
        console.log('✅ [Dashboard] Nome carregado:', name);
        setUserName(name);
      }
    } catch (error) {
      console.error('Erro ao carregar nome:', error);
      // Fallback para email
      const fallbackName = user?.email?.split('@')[0] || '';
      setUserName(fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1));
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

      // Sempre mostrar onboarding até tudo estar configurado
      // Não precisa de estado separado
    } catch (error) {
      console.error('Erro ao verificar status do checkout:', error);
    }
  };

  useEffect(() => {
    if (user?.organizationId) {
      loadUserName();
      checkCheckoutStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.organizationId]);

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
    </div>
  );
};
