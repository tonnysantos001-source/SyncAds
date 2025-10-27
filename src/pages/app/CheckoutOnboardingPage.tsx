import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, CreditCard, Monitor, DollarSign, Truck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  status: 'pending' | 'completed' | 'active';
  route?: string;
}

export default function CheckoutOnboardingPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return;

      setUser(currentUser);

      // Buscar organizationId
      const { data: userData } = await supabase
        .from('User')
        .select('organizationId')
        .eq('id', currentUser.id)
        .single();

      if (userData?.organizationId) {
        setOrganizationId(userData.organizationId);
        await loadOnboardingStatus(userData.organizationId);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOnboardingStatus = async (orgId: string) => {
    try {
      // Buscar status de cada step
      const [billingStatus, domainStatus, gatewayStatus, shippingStatus] = await Promise.all([
        checkBillingStatus(orgId),
        checkDomainStatus(orgId),
        checkGatewayStatus(orgId),
        checkShippingStatus(orgId)
      ]);

      const initialSteps: OnboardingStep[] = [
        {
          id: 'billing',
          title: 'Faturamento',
          description: 'Adicione um cartão de crédito em sua conta',
          icon: CreditCard,
          status: billingStatus ? 'completed' : 'pending',
          route: '/settings?tab=billing'
        },
        {
          id: 'domain',
          title: 'Domínio',
          description: 'Verifique seu domínio. Deve ser o mesmo utilizado na Shopify, WooCommerce ou na sua landing page.',
          icon: Monitor,
          status: domainStatus ? 'completed' : 'pending',
          route: domainStatus ? '/checkout/domain' : '/checkout/domain'
        },
        {
          id: 'gateway',
          title: 'Gateway',
          description: 'Configure os meios de pagamentos que serão exibidos em sua loja.',
          icon: DollarSign,
          status: gatewayStatus ? 'completed' : 'pending',
          route: '/checkout/gateways'
        },
        {
          id: 'shipping',
          title: 'Frete',
          description: 'Crie métodos de entrega para ser exibido no seu checkout.',
          icon: Truck,
          status: shippingStatus ? 'completed' : 'pending',
          route: shippingStatus ? '/checkout/shipping' : '/checkout/shipping'
        }
      ];

      setSteps(initialSteps);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  };

  const checkBillingStatus = async (orgId: string): Promise<boolean> => {
    try {
      const { data: organization } = await supabase
        .from('Organization')
        .select('subscriptionId, stripeCustomerId')
        .eq('id', orgId)
        .single();

      return !!(organization?.subscriptionId && organization?.stripeCustomerId);
    } catch (error) {
      return false;
    }
  };

  const checkDomainStatus = async (orgId: string): Promise<boolean> => {
    try {
      const { data: orgData } = await supabase
        .from('Organization')
        .select('domain, domainVerified')
        .eq('id', orgId)
        .single();

      return !!(orgData?.domain && orgData?.domainVerified);
    } catch (error) {
      return false;
    }
  };

  const checkGatewayStatus = async (orgId: string): Promise<boolean> => {
    try {
      const { data: gatewayConfigs } = await supabase
        .from('GatewayConfig')
        .select('id, isActive')
        .eq('organizationId', orgId)
        .eq('isActive', true)
        .limit(1);

      return (gatewayConfigs?.length || 0) > 0;
    } catch (error) {
      return false;
    }
  };

  const checkShippingStatus = async (orgId: string): Promise<boolean> => {
    try {
      // Verificar se existe alguma tabela de Shipping
      const { data: shippingConfigs } = await supabase
        .from('ShippingMethod')
        .select('id')
        .eq('organizationId', orgId)
        .limit(1);

      return (shippingConfigs?.length || 0) > 0;
    } catch (error) {
      // Se tabela não existir, retornar false
      return false;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-500';
      case 'active':
        return 'bg-blue-100 border-blue-500';
      default:
        return 'bg-gray-50 border-gray-300';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Olá {user?.email?.split('@')[0]?.split('.')[0]},
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">Seja bem vindo</p>
        </div>

        {/* Main Instructions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Para ativar seu checkout você precisa concluir todos passos abaixo:
          </h2>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => (
            <Card
              key={step.id}
              className={`border-2 transition-all ${getStatusColor(step.status)}`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    {/* Icon */}
                    <div className={`rounded-lg p-3 ${
                      step.status === 'completed' ? 'bg-green-100' :
                      step.status === 'active' ? 'bg-blue-100' :
                      'bg-gray-100'
                    }`}>
                      <step.icon className={`h-6 w-6 ${
                        step.status === 'completed' ? 'text-green-600' :
                        step.status === 'active' ? 'text-blue-600' :
                        'text-gray-400'
                      }`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* Status Icon */}
                  <div className="flex-shrink-0 ml-4">
                    {getStatusIcon(step.status)}
                  </div>
                </div>

                {/* Action Button */}
                {step.route && (
                  <div className="mt-4">
                    <Button
                      variant={step.status === 'completed' ? 'outline' : 'default'}
                      className="w-full"
                      onClick={() => {
                        if (step.route) {
                          window.location.href = step.route;
                        }
                      }}
                    >
                      {step.status === 'completed' ? 'Configurar' : 'Configurar agora'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Link */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Caso tenha alguma dúvida, visite nossa{' '}
          <a href="/help" className="underline hover:text-gray-900 dark:hover:text-white">
            central de ajuda
          </a>
          .
        </div>
      </div>

      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6">
        <Button 
          className="rounded-full bg-pink-500 hover:bg-pink-600 text-white shadow-lg"
          onClick={() => toast({ title: 'Em construção', description: 'Chat de ajuda em breve!' })}
        >
          Precisa de ajuda?
        </Button>
      </div>
    </DashboardLayout>
  );
}

