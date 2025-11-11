import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/store/authStore";
import {
  CreditCard,
  Download,
  CheckCircle2,
  Loader2,
  Info,
  Calendar,
  Lock,
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  interval: string;
  features: string[];
  maxAiMessagesDaily: number;
  maxAiImagesDaily: number;
  maxCheckoutPages: number;
  maxProducts: number;
  hasCustomDomain: boolean;
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasApiAccess: boolean;
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
  const user = useAuthStore((state) => state.user);
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
    cardNumber: "",
    cardName: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
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
        .from("User")
        .select("currentPlanId")
        .eq("id", user!.id)
        .single();

      // If no plan, initialize free plan
      if (!userData?.currentPlanId) {
        await initializeFreePlan();
      }

      // Load billing data
      await loadBillingData();
    } catch (error) {
      console.error("Error initializing:", error);
      await loadBillingData();
    }
  };

  const initializeFreePlan = async () => {
    try {
      // Get free plan
      const { data: freePlan, error: planError } = await supabase
        .from("PricingPlan")
        .select("*")
        .eq("slug", "free")
        .eq("active", true)
        .single();

      if (planError || !freePlan) {
        console.error("Free plan not found");
        return;
      }

      // Create subscription
      const now = new Date();
      const oneYearFromNow = new Date(now);
      oneYearFromNow.setFullYear(now.getFullYear() + 100); // 100 years for "lifetime"

      const { data: subscription, error: subscriptionError } = await supabase
        .from("Subscription")
        .insert({
          userId: user!.id,
          planId: freePlan.id,
          status: "active",
          currentPeriodStart: now.toISOString(),
          currentPeriodEnd: oneYearFromNow.toISOString(),
        })
        .select()
        .single();

      if (subscriptionError) {
        console.error("Error creating subscription:", subscriptionError);
        return;
      }

      // Update user with plan
      await supabase
        .from("User")
        .update({
          planId: freePlan.id,
        })
        .eq("id", user!.id);

      toast({
        title: "Plano Gratuito Ativado!",
        description: "Seu plano gratuito foi ativado com sucesso.",
      });
    } catch (error) {
      console.error("Error initializing free plan:", error);
    }
  };

  const loadBillingData = async () => {
    try {
      setLoading(true);

      // Load user plan
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select(
          `
          *,
          plan:planId (*)
        `,
        )
        .eq("id", user!.id)
        .single();

      if (!userError && userData?.plan) {
        setSubscription({
          id: "active",
          planId: userData.planId,
          status: "active",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          plan: userData.plan as Plan,
        });
      }

      // Load subscription (deprecated, keeping for backwards compatibility)
      const { data: subData, error: subError } = await supabase
        .from("Subscription")
        .select(
          `
          *,
          plan:planId (*)
        `,
        )
        .eq("userId", user!.id)
        .eq("status", "active")
        .single();

      if (!subError && subData && !userData?.plan) {
        setSubscription(subData as any);
      }

      // Load payment methods
      const { data: pmData, error: pmError } = await supabase
        .from("PaymentMethod")
        .select("*")
        .eq("userId", user!.id)
        .order("isDefault", { ascending: false });

      if (!pmError && pmData) {
        setPaymentMethods(pmData);
      }

      // Load invoices
      const { data: invData, error: invError } = await supabase
        .from("Invoice")
        .select("*")
        .eq("userId", user!.id)
        .order("createdAt", { ascending: false })
        .limit(10);

      if (!invError && invData) {
        setInvoices(invData);
      }

      // Load plans
      const { data: plansData, error: plansError } = await supabase
        .from("PricingPlan")
        .select("*")
        .eq("active", true)
        .order("sortOrder");

      if (!plansError && plansData) {
        setPlans(plansData);
      }
    } catch (error) {
      console.error("Error loading billing data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    // TODO: Integração com Stripe para adicionar cartão
    toast({
      title: "Em breve",
      description:
        "A integração com o gateway de pagamento será implementada em breve.",
    });
    setShowAddCard(false);
  };

  const handleChangePlan = async (planId: string) => {
    // TODO: Integração com Stripe para mudar plano
    toast({
      title: "Em breve",
      description: "A troca de planos será implementada em breve.",
    });
    setShowPlansDialog(false);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(price);
  };

  const formatDate = (date: string | null) => {
    if (!date) return "-";
    return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      active: {
        label: "Ativa",
        className:
          "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none shadow-sm",
      },
      trialing: {
        label: "Trial",
        className:
          "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none shadow-sm",
      },
      past_due: {
        label: "Atrasada",
        className:
          "bg-gradient-to-r from-orange-500 to-red-600 text-white border-none shadow-sm",
      },
      canceled: {
        label: "Cancelada",
        className:
          "bg-gradient-to-r from-gray-400 to-gray-600 text-white border-none shadow-sm",
      },
      paid: {
        label: "Paga",
        className:
          "bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none shadow-sm",
      },
      open: {
        label: "Aberta",
        className:
          "bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-none shadow-sm",
      },
      void: {
        label: "Cancelada",
        className:
          "bg-gradient-to-r from-gray-400 to-gray-600 text-white border-none shadow-sm",
      },
    };

    const variant = variants[status] || {
      label: status,
      className:
        "bg-gradient-to-r from-gray-400 to-gray-600 text-white border-none shadow-sm",
    };
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-pink-950/20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="h-8 w-8 text-pink-500" />
        </motion.div>
      </div>
    );
  }

  const currentPlan =
    subscription?.plan || plans.find((p) => p.slug === "free");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-pink-950/20">
      <motion.div
        className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Faturamento
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 ml-14">
            Gerencie seu plano, métodos de pagamento e faturas
          </p>
        </motion.div>

        {/* Plano Atual */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-pink-500/10 to-purple-500/10 dark:from-pink-500/5 dark:to-purple-500/5">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-pink-500" />
                Meu Plano
              </CardTitle>
              <CardDescription>
                {subscription?.status === "active"
                  ? `Você está atualmente no plano ${currentPlan?.name}.`
                  : "Selecione um plano para começar."}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {currentPlan && (
                <motion.div
                  className="relative p-6 rounded-2xl bg-gradient-to-br from-pink-500/10 via-purple-500/10 to-blue-500/10 dark:from-pink-500/20 dark:via-purple-500/20 dark:to-blue-500/20 border border-pink-200/50 dark:border-pink-800/50 backdrop-blur-sm overflow-hidden"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 via-purple-500/5 to-blue-500/5 animate-pulse" />

                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                            {currentPlan.name}
                          </h3>
                          {subscription?.status === "active" && (
                            <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white border-none shadow-md">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Ativo
                            </Badge>
                          )}
                        </div>
                        <p className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                          {currentPlan.price === 0
                            ? "Gratuito"
                            : formatPrice(currentPlan.price)}
                          {currentPlan.price > 0 && (
                            <span className="text-lg font-normal text-gray-600 dark:text-gray-400">
                              {" "}
                              /mês
                            </span>
                          )}
                        </p>
                      </div>
                      {currentPlan.slug === "free" && (
                        <Button
                          onClick={() => setShowPlansDialog(true)}
                          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Upgrade
                        </Button>
                      )}
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-4">
                      <motion.div
                        className="flex items-center gap-3 text-sm group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                      >
                        <div className="p-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {currentPlan.maxAiMessagesDaily} mensagens IA por dia
                        </span>
                      </motion.div>
                      <motion.div
                        className="flex items-center gap-3 text-sm group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <div className="p-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {currentPlan.maxAiImagesDaily} imagens IA por dia
                        </span>
                      </motion.div>
                      <motion.div
                        className="flex items-center gap-3 text-sm group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="p-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {currentPlan.maxCheckoutPages > 100
                            ? "Páginas de checkout ilimitadas"
                            : `${currentPlan.maxCheckoutPages} páginas de checkout`}
                        </span>
                      </motion.div>
                      <motion.div
                        className="flex items-center gap-3 text-sm group"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <div className="p-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
                          <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300">
                          {currentPlan.maxProducts > 1000
                            ? "Produtos ilimitados"
                            : `Até ${currentPlan.maxProducts} produtos`}
                        </span>
                      </motion.div>
                      {currentPlan.hasCustomDomain && (
                        <motion.div
                          className="flex items-center gap-3 text-sm group"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <div className="p-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            Domínio customizado
                          </span>
                        </motion.div>
                      )}
                      {currentPlan.hasAdvancedAnalytics && (
                        <motion.div
                          className="flex items-center gap-3 text-sm group"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          <div className="p-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            Analytics avançados
                          </span>
                        </motion.div>
                      )}
                      {currentPlan.hasPrioritySupport && (
                        <motion.div
                          className="flex items-center gap-3 text-sm group"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                        >
                          <div className="p-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            Suporte prioritário
                          </span>
                        </motion.div>
                      )}
                      {currentPlan.hasApiAccess && (
                        <motion.div
                          className="flex items-center gap-3 text-sm group"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          <div className="p-1 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 shadow-sm group-hover:shadow-md transition-shadow">
                            <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            API Access completo
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Período ativo */}
                    {subscription && (
                      <div className="pt-4 border-t border-pink-200/50 dark:border-pink-800/50">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                            <Calendar className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="text-gray-600 dark:text-gray-400">
                            Renovação:{" "}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatDate(subscription.currentPeriodEnd)}
                            </span>
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Alert para checkout gratuito */}
              <Alert className="border-blue-200/50 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 backdrop-blur-sm">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-gray-700 dark:text-gray-300">
                  <strong>Checkout de Pagamento 100% Gratuito!</strong> Você
                  pode processar pagamentos ilimitados sem nenhum custo. No
                  futuro, cobraremos apenas pelos pacotes de mensagens de IA.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </motion.div>

        {/* Método de Pagamento */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-blue-500/10 dark:from-indigo-500/5 dark:to-blue-500/5">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-500" />
                    Método de Pagamento
                  </CardTitle>
                  <CardDescription>
                    Gerencie seus cartões de crédito salvos
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddCard(true)}
                  size="sm"
                  className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Adicionar Cartão
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {paymentMethods.length > 0 ? (
                <div className="space-y-3">
                  {paymentMethods.map((pm, index) => (
                    <motion.div
                      key={pm.id}
                      className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm flex items-center justify-between group hover:shadow-lg transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 5 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-20 rounded-lg bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 dark:from-gray-600 dark:via-gray-700 dark:to-gray-800 flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {pm.brand || "Cartão"} •••• {pm.last4}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Validade: {String(pm.expiryMonth).padStart(2, "0")}/
                            {pm.expiryYear}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pm.isDefault && (
                          <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-none shadow-sm">
                            Padrão
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                        >
                          Remover
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center">
                    <Lock className="h-10 w-10 opacity-50" />
                  </div>
                  <p className="font-semibold text-lg mb-1">
                    Nenhum cartão cadastrado
                  </p>
                  <p className="text-sm">
                    Adicione um cartão para pagamentos futuros
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Histórico de Faturamento */}
        <motion.div variants={itemVariants}>
          <Card className="border-none shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
            <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 dark:from-purple-500/5 dark:to-pink-500/5">
              <CardTitle className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-purple-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Histórico de Faturas
              </CardTitle>
              <CardDescription>
                Veja e baixe suas faturas anteriores
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {invoices.length > 0 ? (
                <div className="space-y-3">
                  {invoices.map((invoice, index) => (
                    <motion.div
                      key={invoice.id}
                      className="p-4 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm flex items-center justify-between group hover:shadow-lg transition-all duration-300"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-md group-hover:shadow-lg transition-shadow">
                          <svg
                            className="h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {invoice.invoiceNumber}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(invoice.paidAt || invoice.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-lg text-gray-900 dark:text-white">
                            {formatPrice(invoice.amount)}
                          </p>
                          {getStatusBadge(invoice.status)}
                        </div>
                        {invoice.invoicePdf && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/30"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center">
                    <svg
                      className="h-10 w-10 opacity-50"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <p className="font-semibold text-lg mb-1">
                    Nenhuma fatura emitida
                  </p>
                  <p className="text-sm">
                    Suas faturas aparecerão aqui quando forem geradas
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Dialog: Adicionar Cartão */}
        <Dialog open={showAddCard} onOpenChange={setShowAddCard}>
          <DialogContent className="sm:max-w-md bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                Adicionar Cartão de Crédito
              </DialogTitle>
              <DialogDescription>
                Adicione um cartão para pagamentos futuros
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cardNumber" className="text-sm font-medium">
                  Número do Cartão
                </Label>
                <Input
                  id="cardNumber"
                  placeholder="0000 0000 0000 0000"
                  value={cardForm.cardNumber}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, cardNumber: e.target.value })
                  }
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cardName" className="text-sm font-medium">
                  Nome no Cartão
                </Label>
                <Input
                  id="cardName"
                  placeholder="Nome impresso no cartão"
                  value={cardForm.cardName}
                  onChange={(e) =>
                    setCardForm({ ...cardForm, cardName: e.target.value })
                  }
                  className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth" className="text-sm font-medium">
                    Mês
                  </Label>
                  <Input
                    id="expiryMonth"
                    placeholder="MM"
                    maxLength={2}
                    value={cardForm.expiryMonth}
                    onChange={(e) =>
                      setCardForm({ ...cardForm, expiryMonth: e.target.value })
                    }
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryYear" className="text-sm font-medium">
                    Ano
                  </Label>
                  <Input
                    id="expiryYear"
                    placeholder="AAAA"
                    maxLength={4}
                    value={cardForm.expiryYear}
                    onChange={(e) =>
                      setCardForm({ ...cardForm, expiryYear: e.target.value })
                    }
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cvv" className="text-sm font-medium">
                    CVV
                  </Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={4}
                    value={cardForm.cvv}
                    onChange={(e) =>
                      setCardForm({ ...cardForm, cvv: e.target.value })
                    }
                    className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-gray-300 dark:border-gray-700"
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
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white border-none shadow-lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Adicionar Cartão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog: Planos */}
        <Dialog open={showPlansDialog} onOpenChange={setShowPlansDialog}>
          <DialogContent className="sm:max-w-4xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                Escolha seu Plano
              </DialogTitle>
              <DialogDescription>
                Selecione o plano que melhor atende suas necessidades
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
              {plans.map((plan) => (
                <motion.div
                  key={plan.id}
                  className={`relative p-6 rounded-xl border-2 ${
                    plan.isPopular
                      ? "border-pink-500 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-pink-500 to-purple-600 text-white border-none shadow-lg">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Mais Popular
                      </Badge>
                    </div>
                  )}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {plan.name}
                    </h3>
                    <p className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mt-2">
                      {plan.price === 0 ? "Gratuito" : formatPrice(plan.price)}
                      {plan.price > 0 && (
                        <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                          {" "}
                          /mês
                        </span>
                      )}
                    </p>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {Array.isArray(plan.features) &&
                      plan.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <div className="p-0.5 rounded bg-gradient-to-br from-green-500 to-emerald-600 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {feature}
                          </span>
                        </li>
                      ))}
                    {!plan.features && (
                      <>
                        <li className="flex items-start gap-2 text-sm">
                          <div className="p-0.5 rounded bg-gradient-to-br from-green-500 to-emerald-600 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {plan.maxAiMessagesDaily} mensagens IA/dia
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <div className="p-0.5 rounded bg-gradient-to-br from-green-500 to-emerald-600 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {plan.maxAiImagesDaily} imagens IA/dia
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <div className="p-0.5 rounded bg-gradient-to-br from-green-500 to-emerald-600 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {plan.maxCheckoutPages > 100
                              ? "Páginas ilimitadas"
                              : `${plan.maxCheckoutPages} páginas`}
                          </span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <div className="p-0.5 rounded bg-gradient-to-br from-green-500 to-emerald-600 mt-0.5">
                            <CheckCircle2 className="h-3 w-3 text-white" />
                          </div>
                          <span className="text-gray-700 dark:text-gray-300">
                            {plan.maxProducts > 1000
                              ? "Produtos ilimitados"
                              : `${plan.maxProducts} produtos`}
                          </span>
                        </li>
                        {plan.hasCustomDomain && (
                          <li className="flex items-start gap-2 text-sm">
                            <div className="p-0.5 rounded bg-gradient-to-br from-green-500 to-emerald-600 mt-0.5">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">
                              Domínio customizado
                            </span>
                          </li>
                        )}
                        {plan.hasAdvancedAnalytics && (
                          <li className="flex items-start gap-2 text-sm">
                            <div className="p-0.5 rounded bg-gradient-to-br from-green-500 to-emerald-600 mt-0.5">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">
                              Analytics avançados
                            </span>
                          </li>
                        )}
                        {plan.hasPrioritySupport && (
                          <li className="flex items-start gap-2 text-sm">
                            <div className="p-0.5 rounded bg-gradient-to-br from-green-500 to-emerald-600 mt-0.5">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">
                              Suporte prioritário
                            </span>
                          </li>
                        )}
                        {plan.hasApiAccess && (
                          <li className="flex items-start gap-2 text-sm">
                            <div className="p-0.5 rounded bg-gradient-to-br from-green-500 to-emerald-600 mt-0.5">
                              <CheckCircle2 className="h-3 w-3 text-white" />
                            </div>
                            <span className="text-gray-700 dark:text-gray-300">
                              API Access completo
                            </span>
                          </li>
                        )}
                      </>
                    )}
                  </ul>
                  <Button
                    onClick={() => handleChangePlan(plan.id)}
                    className={`w-full ${
                      plan.slug === currentPlan?.slug
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-none shadow-lg hover:shadow-xl transition-all"
                    }`}
                    disabled={plan.slug === currentPlan?.slug}
                  >
                    {plan.slug === currentPlan?.slug
                      ? "Plano Atual"
                      : "Selecionar Plano"}
                  </Button>
                </motion.div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    </div>
  );
};

export default BillingPage;
