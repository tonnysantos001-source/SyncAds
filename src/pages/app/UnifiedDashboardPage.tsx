import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CreditCard, Monitor, DollarSign, Truck } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';

const UnifiedDashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [userName, setUserName] = useState<string>('');
  const [billingConfigured, setBillingConfigured] = useState(false);
  const [domainConfigured, setDomainConfigured] = useState(false);
  const [gatewayConfigured, setGatewayConfigured] = useState(false);
  const [shippingConfigured, setShippingConfigured] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Função para capitalizar nome
  const capitalizeName = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Função para buscar nome do usuário
  const fetchUserName = async () => {
    try {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }
      
      const { data: userData } = await supabase
        .from('User')
        .select('name, email')
        .eq('id', user.id)
        .single();

      if (userData?.name) {
        setUserName(capitalizeName(userData.name));
      } else if (userData?.email) {
        const emailName = userData.email.split('@')[0];
        setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
      } else {
        setUserName('Usuário');
      }
    } catch (error) {
      console.error('Erro ao carregar nome:', error);
      setUserName('Usuário');
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para verificar status de configuração
  const checkBillingConfig = async (orgId: string): Promise<boolean> => {
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

  const checkDomainConfig = async (orgId: string): Promise<boolean> => {
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

  const checkGatewayConfig = async (orgId: string): Promise<boolean> => {
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

  const checkShippingConfig = async (orgId: string): Promise<boolean> => {
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

  // Função para verificar status geral
  const loadCheckoutStatus = async () => {
    try {
      if (!user?.organizationId) {
        setIsLoading(false);
        return;
      }

      const [billing, domain, gateway, shipping] = await Promise.all([
        checkBillingConfig(user.organizationId),
        checkDomainConfig(user.organizationId),
        checkGatewayConfig(user.organizationId),
        checkShippingConfig(user.organizationId)
      ]);

      setBillingConfigured(billing);
      setDomainConfigured(domain);
      setGatewayConfigured(gateway);
      setShippingConfigured(shipping);
    } catch (error) {
      console.error('Erro ao verificar status do checkout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Inicializar dados quando componente monta ou user muda
  useEffect(() => {
    const initializeData = async () => {
      if (user?.organizationId) {
        await Promise.all([
          fetchUserName(),
          loadCheckoutStatus()
        ]);
      }
    };

    initializeData();
  }, [user?.organizationId]);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header com Saudação Personalizada */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isLoading ? 'Olá...' : userName ? `Olá ${userName},` : 'Olá,'}
        </h1>
        <p className="text-gray-600 mt-1">Seja bem vindo</p>
      </div>

      {/* Instrução Principal */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">
          Para ativar seu checkout você precisa concluir todos passos abaixo:
        </h2>
      </div>

      {/* Cards de Onboarding */}
      {!isLoading && (
        <div className="space-y-4">
          {/* Faturamento */}
          <div className={`
            flex items-start gap-4 p-4 border-2 rounded-lg transition-all cursor-pointer
            ${billingConfigured ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-pink-300'}
          `}>
            <div className="flex-shrink-0">
              <CreditCard className="h-8 w-8 text-pink-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Faturamento</h3>
              <p className="text-sm text-gray-600">Adicione um cartão de crédito em sua conta</p>
            </div>
            <div className="flex-shrink-0 pt-1">
              {billingConfigured ? (
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              ) : (
                <div className="h-3 w-3 rounded-full bg-gray-300"></div>
              )}
            </div>
          </div>

          {/* Domínio */}
          <div className={`
            flex items-start gap-4 p-4 border-2 rounded-lg transition-all cursor-pointer
            ${domainConfigured ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-pink-300'}
          `}>
            <div className="flex-shrink-0">
              <Monitor className="h-8 w-8 text-pink-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Domínio</h3>
              <p className="text-sm text-gray-600">Verifique seu domínio. Deve ser o mesmo utilizado na Shopify, WooCommerce ou na sua landing page.</p>
            </div>
            <div className="flex-shrink-0 pt-1">
              {domainConfigured ? (
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              ) : (
                <div className="h-3 w-3 rounded-full bg-gray-300"></div>
              )}
            </div>
          </div>

          {/* Gateway */}
          <div className={`
            flex items-start gap-4 p-4 border-2 rounded-lg transition-all cursor-pointer
            ${gatewayConfigured ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 hover:border-pink-300'}
          `}>
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-pink-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Gateway</h3>
              <p className="text-sm text-gray-600">Configure os meios de pagamentos que serão exibidos em sua loja.</p>
            </div>
            <div className="flex-shrink-0 pt-1">
              {gatewayConfigured ? (
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              ) : (
                <div className="h-3 w-3 rounded-full bg-gray-300"></div>
              )}
            </div>
          </div>

          {/* Frete */}
          <div className={`
            flex items-start gap-4 p-4 border-2 rounded-lg transition-all cursor-pointer
            ${shippingConfigured ? 'bg-green-50 border-green-300' : 'bg-white border-gray-200 hover:border-pink-300'}
          `}>
            <div className="flex-shrink-0">
              <Truck className="h-8 w-8 text-pink-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 mb-1">Frete</h3>
              <p className="text-sm text-gray-600">Crie métodos de entrega para ser exibido no seu checkout.</p>
            </div>
            <div className="flex-shrink-0 pt-1">
              {shippingConfigured ? (
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              ) : (
                <div className="h-3 w-3 rounded-full bg-gray-300"></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Link de Ajuda */}
      <div className="text-center pt-4">
        <p className="text-sm text-gray-600">
          Caso tenha alguma dúvida,{' '}
          <a href="#" className="underline text-gray-900 hover:text-pink-600">
            visite nossa central de ajuda
          </a>
          .
        </p>
      </div>
    </div>
  );
};

export default UnifiedDashboardPage;
