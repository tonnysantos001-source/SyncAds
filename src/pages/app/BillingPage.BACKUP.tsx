import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/authStore';
import { CreditCard, Download, CheckCircle2, Loader2, Info, Calendar, Lock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  maxAiMessages: number;
  isPopular: boolean;
}

interface Subscription {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  usedAiMessages: number;
  plan: Plan;
}

interface PaymentMethod {
  id: string;
  type: string;
  brand: string;
  last4: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
}

const BillingPage: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [showPlansDialog, setShowPlansDialog] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);

  // Card form state
  const [cardForm, setCardForm] = useState({
    cardNumber: '',
    cardName: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
  });

  useEffect(() => {
    if (user?.id) {
      initializeFreePlanIfNeeded();
    }
  }, [user?.id]);

  const initializeFreePlanIfNeeded = async () => {
    try {
      setLoading(true);

      // Check if user already has a plan
      const { data: userData } = await supabase
        .from('User')
        .select('currentPlanId')
        .eq('id', user!.id)
        .single();

      // If no plan, initialize free plan
      if (!userData?.currentPlanId) {
        await initializeFreePlan();
      }

      // Load billing data
      await loadBillingData();
    } catch (error) {
      console.error('Error initializing:', error);
      await loadBillingData();
    }
  };

  const initializeFreePlan = async () => {
    try {
      // Get free plan
      const { data: freePlan, error: planError } = await supabase
        .from('Plan')
        .select('*')
        .eq('slug', 'free')
        .single();

      if (planError || !freePlan) {
        console.error('Free plan not found');
        return;
      }

      // Create subscription
      const now = new Date();
      const oneYearFromNow = new Date(now);
      oneYearFromNow.setFullYear(now.getFullYear() + 100); // 100 years for "lifetime"

      const { data: subscription, error: subscriptionError } = await supabase
        .from('Subscription')
        .insert({
          userId: user!.id,
          planId: freePlan.id,
          status: 'active',
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: oneYearFromNow.toISOString(),
          usedAiMessages: 0,
          aiMessagesResetAt: now.toISOString(),
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        return;
      }

      // Update user with plan
      await supabase
        .from('User')
        .update({
          currentPlanId: freePlan.id,
          currentSubscriptionId: subscription.id,
        })
        .eq('id', user!.id);

      toast({
        title: 'Plano Gratuito Ativado!',
        description: 'Seu plano gratuito foi ativado com sucesso.',
      });
    } catch (error) {
      console.error('Error initializing free plan:', error);
    }
  };

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Load subscription
      const { data: subData, error: subError } = await supabase
        .from('Subscription')
        .select(`
          *,
          plan:planId (*)
        `)
        .eq('userId', user!.id)
        .eq('status', 'active')
        .single();

      if (!subError && subData) {
        setSubscription(subData as any);
      }

      // Load payment methods
      const { data: pmData, error: pmError } = await supabase
        .from('PaymentMethod')
        .select('*')
        .eq('userId', user!.id)
        .order('isDefault', { ascending: false });

      if (!pmError && pmData) {
        setPaymentMethods(pmData);
      }

      // Load invoices
      const { data: invData, error: invError } = await supabase
        .from('Invoice')
        .select('*')
        .eq('userId', user!.id)
        .order('createdAt', { ascending: false })
        .limit(10);

      if (!invError && invData) {
        setInvoices(invData);
      }

      // Load plans
      const { data: plansData, error: plansError } = await supabase
        .from('Plan')
        .select('*')
        .eq('active', true)
        .order('sortOrder');

      if (!plansError && plansData) {
        setPlans(plansData);
      }

    } catch (error) {
      console.error('Error loading billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    // TODO: Integração com Stripe para adicionar cartão
    toast({
      title: 'Em breve',
      description: 'A integração com o gateway de pagamento será implementada em breve.',
    });
    setShowAddCard(false);
  };

  const handleChangePlan = async (planId: string) => {
    // TODO: Integração com Stripe para mudar plano
    toast({
      title: 'Em breve',
      description: 'A troca de planos será implementada em breve.',
    });
    setShowPlansDialog(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: { label: 'Ativa', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      trialing: { label: 'Trial', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      past_due: { label: 'Atrasada', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
      canceled: { label: 'Cancelada', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
      paid: { label: 'Paga', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
      open: { label: 'Aberta', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
      void: { label: 'Cancelada', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
    };

    const variant = variants[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || plans.find(p => p.slug === 'free');

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white dark:text-white">Faturamento</h1>
        <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400 mt-1">
          Gerencie seu plano, métodos de pagamento e faturas
        </p>
      </div>

      {/* Plano Atual */}
      <Card>
        <CardHeader>
          <CardTitle>Meu Plano</CardTitle>
          <CardDescription>
            {subscription?.status === 'active' 
              ? `Você está atualmente no plano ${currentPlan?.name}.`
              : 'Selecione um plano para começar.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentPlan && (
            <div className="p-6 rounded-lg border bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white dark:text-white">
                      {currentPlan.name}
                    </h3>
                    {subscription?.status === 'active' && (
                      <Badge className="bg-green-500 text-white">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Ativo
                      </Badge>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-pink-600 dark:text-pink-400 mt-2">
                    {currentPlan.price === 0 ? 'Gratuito' : formatPrice(currentPlan.price)}
                    {currentPlan.price > 0 && <span className="text-lg font-normal text-gray-600 dark:text-gray-300 dark:text-gray-400"> /mês</span>}
                  </p>
                </div>
                {currentPlan.slug === 'free' && (
                  <Button 
                    onClick={() => setShowPlansDialog(true)}
                    className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                  >
                    Ver Planos
                  </Button>
                )}
              </div>

              {/* Features */}
              <div className="space-y-2">
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Período ativo */}
              {subscription && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Renovação: {formatDate(subscription.currentPeriodEnd)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Alert para checkout gratuito */}
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
              <strong>Checkout de Pagamento 100% Gratuito!</strong> Você pode processar pagamentos ilimitados sem nenhum custo. 
              No futuro, cobraremos apenas pelos pacotes de mensagens de IA.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Método de Pagamento */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Método de Pagamento</CardTitle>
              <CardDescription>Gerencie seus cartões de crédito salvos</CardDescription>
            </div>
            <Button 
              onClick={() => setShowAddCard(true)}
              size="sm"
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Adicionar Cartão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((pm) => (
                <div key={pm.id} className="p-4 rounded-lg border bg-white dark:bg-gray-900 dark:bg-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-16 rounded bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                      <CreditCard className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                        {pm.brand || 'Cartão'} •••• {pm.last4}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 dark:text-gray-400">
                        Validade: {String(pm.expiryMonth).padStart(2, '0')}/{pm.expiryYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pm.isDefault && (
                      <Badge className="bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200">
                        Padrão
                      </Badge>
                    )}
                    <Button variant="ghost" size="sm">Remover</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Lock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">Nenhum cartão cadastrado</p>
              <p className="text-sm mt-1">Adicione um cartão para pagamentos futuros</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Faturamento */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Faturas</CardTitle>
          <CardDescription>Veja e baixe suas faturas anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length > 0 ? (
            <div className="space-y-2">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 rounded-lg border bg-white dark:bg-gray-900 dark:bg-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900 dark:text-white dark:text-white">
                        {invoice.invoiceNumber}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300 dark:text-gray-400">
                        {formatDate(invoice.paidAt || invoice.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-gray-900 dark:text-white dark:text-white">
                        {formatPrice(invoice.amount)}
                      </p>
                      {getStatusBadge(invoice.status)}
                    </div>
                    {invoice.invoicePdf && (
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <svg className="h-12 w-12 mx-auto mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="font-medium">Nenhuma fatura emitida</p>
              <p className="text-sm mt-1">Suas faturas aparecerão aqui quando forem geradas</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Adicionar Cartão */}
      <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar Cartão de Crédito</DialogTitle>
            <DialogDescription>
              Adicione um cartão para pagamentos futuros
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Número do Cartão</Label>
              <Input
                id="cardNumber"
                placeholder="0000 0000 0000 0000"
                value={cardForm.cardNumber}
                onChange={(e) => setCardForm({ ...cardForm, cardNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cardName">Nome no Cartão</Label>
              <Input
                id="cardName"
                placeholder="Nome impresso no cartão"
                value={cardForm.cardName}
                onChange={(e) => setCardForm({ ...cardForm, cardName: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryMonth">Mês</Label>
                <Input
                  id="expiryMonth"
                  placeholder="MM"
                  maxLength={2}
                  value={cardForm.expiryMonth}
                  onChange={(e) => setCardForm({ ...cardForm, expiryMonth: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiryYear">Ano</Label>
                <Input
                  id="expiryYear"
                  placeholder="AAAA"
                  maxLength={4}
                  value={cardForm.expiryYear}
                  onChange={(e) => setCardForm({ ...cardForm, expiryYear: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  maxLength={4}
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddCard(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddCard}
              className="bg-pink-600 hover:bg-pink-700 text-white"
            >
              Adicionar Cartão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Planos */}
      <Dialog open={showPlansDialog} onOpenChange={setShowPlansDialog}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Escolha seu Plano</DialogTitle>
            <DialogDescription>
              Selecione o plano que melhor atende suas necessidades
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`relative p-6 rounded-lg border-2 ${
                  plan.isPopular 
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white">
                      Mais Popular
                    </Badge>
                  </div>
                )}
                <div className="text-center mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white dark:text-white">{plan.name}</h3>
                  <p className="text-3xl font-bold text-pink-600 dark:text-pink-400 mt-2">
                    {plan.price === 0 ? 'Gratuito' : formatPrice(plan.price)}
                    {plan.price > 0 && <span className="text-sm font-normal text-gray-600 dark:text-gray-300"> /mês</span>}
                  </p>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  onClick={() => handleChangePlan(plan.id)}
                  className={`w-full ${
                    plan.slug === currentPlan?.slug
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white'
                  }`}
                  disabled={plan.slug === currentPlan?.slug}
                >
                  {plan.slug === currentPlan?.slug ? 'Plano Atual' : 'Selecionar'}
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingPage;

