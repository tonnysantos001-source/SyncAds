import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Check,
  Loader2,
  Plus,
  AlertCircle,
  Crown,
  Zap,
  Building2,
  Sparkles,
  Shield,
  ArrowRight,
  Lock,
  Trash2,
  Calendar,
  Download,
  X,
} from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  addPaymentMethod,
  listPaymentMethods,
  removePaymentMethod,
  setDefaultPaymentMethod,
  createSubscription,
  getCurrentSubscription,
  cancelSubscription,
  reactivateSubscription,
  listInvoices,
  formatCardNumber,
  formatExpiryDate,
  validateCardNumber,
  validateCVV,
  PLAN_PRICES,
  type PaymentMethod,
  type Subscription,
  type Invoice,
} from "@/lib/api/payment";

interface Plan {
  id: "free" | "starter" | "pro" | "enterprise";
  name: string;
  price: number;
  description: string;
  features: string[];
  icon: React.ElementType;
  color: string;
  badge?: string;
  popular?: boolean;
  limits: {
    dailyAiMessages: number;
    dailyAiImages: number;
    checkoutPages: number;
    products: number;
  };
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    description: "Perfeito para começar",
    icon: Sparkles,
    color: "from-gray-500 to-gray-600",
    features: [
      "5 mensagens IA por dia",
      "2 imagens IA por dia",
      "1 página de checkout",
      "100 produtos",
      "Taxa de transação: 2.5%",
      "Suporte por email",
    ],
    limits: {
      dailyAiMessages: 5,
      dailyAiImages: 2,
      checkoutPages: 1,
      products: 100,
    },
  },
  {
    id: "starter",
    name: "Starter",
    price: PLAN_PRICES.starter,
    description: "Para pequenos negócios",
    icon: Zap,
    color: "from-blue-500 to-blue-600",
    badge: "7 dias grátis",
    features: [
      "50 mensagens IA por dia",
      "20 imagens IA por dia",
      "5 páginas de checkout",
      "1.000 produtos",
      "Taxa de transação: 1.5%",
      "Suporte prioritário",
      "Analytics básico",
    ],
    limits: {
      dailyAiMessages: 50,
      dailyAiImages: 20,
      checkoutPages: 5,
      products: 1000,
    },
  },
  {
    id: "pro",
    name: "Pro",
    price: PLAN_PRICES.pro,
    description: "Para negócios em crescimento",
    icon: Crown,
    color: "from-purple-500 to-purple-600",
    badge: "7 dias grátis",
    popular: true,
    features: [
      "200 mensagens IA por dia",
      "100 imagens IA por dia",
      "20 páginas de checkout",
      "10.000 produtos",
      "Taxa de transação: 1%",
      "Suporte prioritário 24/7",
      "Analytics avançado",
      "Domínio customizado",
      "API de integração",
    ],
    limits: {
      dailyAiMessages: 200,
      dailyAiImages: 100,
      checkoutPages: 20,
      products: 10000,
    },
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: PLAN_PRICES.enterprise,
    description: "Para grandes operações",
    icon: Building2,
    color: "from-orange-500 to-orange-600",
    badge: "7 dias grátis",
    features: [
      "Mensagens IA ilimitadas",
      "Imagens IA ilimitadas",
      "Páginas de checkout ilimitadas",
      "Produtos ilimitados",
      "Taxa de transação: 0.5%",
      "Suporte dedicado 24/7",
      "Analytics avançado + BI",
      "White label completo",
      "API completa",
      "Gerente de conta",
    ],
    limits: {
      dailyAiMessages: -1, // ilimitado
      dailyAiImages: -1,
      checkoutPages: -1,
      products: -1,
    },
  },
];

const BillingPage = () => {
  const user = useAuthStore((state) => state.user);
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [currentSubscription, setCurrentSubscription] =
    useState<Subscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const [cardForm, setCardForm] = useState({
    cardNumber: "",
    cardholderName: "",
    expiryDate: "",
    cvv: "",
    cpf: "",
  });

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadSubscription(),
        loadPaymentMethods(),
        loadInvoices(),
      ]);
    } catch (error) {
      console.error("Error loading billing data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar as informações de faturamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async () => {
    const subscription = await getCurrentSubscription();
    setCurrentSubscription(subscription);
  };

  const loadPaymentMethods = async () => {
    const methods = await listPaymentMethods();
    setPaymentMethods(methods);
  };

  const loadInvoices = async () => {
    const invoiceList = await listInvoices();
    setInvoices(invoiceList);
  };

  const handleAddCard = async () => {
    try {
      setProcessingPayment(true);

      // Validações
      if (!validateCardNumber(cardForm.cardNumber)) {
        toast({
          title: "Cartão inválido",
          description: "Número de cartão inválido.",
          variant: "destructive",
        });
        return;
      }

      if (!validateCVV(cardForm.cvv)) {
        toast({
          title: "CVV inválido",
          description: "CVV deve ter 3 ou 4 dígitos.",
          variant: "destructive",
        });
        return;
      }

      const [month, year] = cardForm.expiryDate.split("/");
      if (!month || !year || month.length !== 2 || year.length !== 2) {
        toast({
          title: "Data inválida",
          description: "Use o formato MM/AA.",
          variant: "destructive",
        });
        return;
      }

      // Adicionar cartão (com cobrança de R$1 para verificação)
      const result = await addPaymentMethod({
        cardNumber: cardForm.cardNumber.replace(/\s/g, ""),
        cardholderName: cardForm.cardholderName,
        expiryMonth: month,
        expiryYear: `20${year}`,
        cvv: cardForm.cvv,
        cpf: cardForm.cpf.replace(/\D/g, ""),
      });

      if (!result.success) {
        toast({
          title: "Erro ao adicionar cartão",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cartão adicionado com sucesso!",
        description:
          "Cobramos R$ 1,00 para verificação. Será estornado em até 24h.",
      });

      setShowAddCardModal(false);
      setCardForm({
        cardNumber: "",
        cardholderName: "",
        expiryDate: "",
        cvv: "",
        cpf: "",
      });
      await loadPaymentMethods();
    } catch (error) {
      console.error("Error adding card:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao adicionar o cartão.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleRemoveCard = async (paymentMethodId: string) => {
    try {
      const result = await removePaymentMethod(paymentMethodId);
      if (!result.success) {
        toast({
          title: "Erro ao remover cartão",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cartão removido",
        description: "O método de pagamento foi removido com sucesso.",
      });
      await loadPaymentMethods();
    } catch (error) {
      console.error("Error removing card:", error);
    }
  };

  const handleSetDefaultCard = async (paymentMethodId: string) => {
    try {
      const result = await setDefaultPaymentMethod(paymentMethodId);
      if (!result.success) {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Cartão definido como padrão",
        description: "Este cartão será usado nas próximas cobranças.",
      });
      await loadPaymentMethods();
    } catch (error) {
      console.error("Error setting default card:", error);
    }
  };

  const handleUpgrade = async () => {
    if (!selectedPlan || selectedPlan.id === "free") return;

    try {
      setProcessingPayment(true);

      // Verificar se tem método de pagamento
      if (paymentMethods.length === 0) {
        toast({
          title: "Adicione um cartão",
          description:
            "Você precisa adicionar um método de pagamento primeiro.",
          variant: "destructive",
        });
        setShowUpgradeModal(false);
        setShowAddCardModal(true);
        return;
      }

      const defaultPaymentMethod =
        paymentMethods.find((pm) => pm.isDefault) || paymentMethods[0];

      const result = await createSubscription(
        selectedPlan.id as "starter" | "pro" | "enterprise",
        defaultPaymentMethod.id,
      );

      if (!result.success) {
        toast({
          title: "Erro ao criar assinatura",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Assinatura criada com sucesso!",
        description: `Você tem 7 dias grátis para testar o plano ${selectedPlan.name}.`,
      });

      setShowUpgradeModal(false);
      await loadData();
    } catch (error) {
      console.error("Error upgrading:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao criar a assinatura.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    try {
      const result = await cancelSubscription(currentSubscription.id);
      if (!result.success) {
        toast({
          title: "Erro ao cancelar",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Assinatura cancelada",
        description: "Sua assinatura será cancelada no final do período.",
      });
      await loadSubscription();
    } catch (error) {
      console.error("Error canceling subscription:", error);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!currentSubscription) return;

    try {
      const result = await reactivateSubscription(currentSubscription.id);
      if (!result.success) {
        toast({
          title: "Erro ao reativar",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Assinatura reativada",
        description: "Sua assinatura continuará ativa.",
      });
      await loadSubscription();
    } catch (error) {
      console.error("Error reactivating subscription:", error);
    }
  };

  const getCurrentPlan = () => {
    return currentSubscription?.plan || "free";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { label: string; variant: any }> = {
      trialing: { label: "Em Trial", variant: "default" },
      active: { label: "Ativo", variant: "default" },
      past_due: { label: "Pagamento Pendente", variant: "destructive" },
      canceled: { label: "Cancelado", variant: "secondary" },
      paused: { label: "Pausado", variant: "secondary" },
      pending: { label: "Pendente", variant: "outline" },
      paid: { label: "Pago", variant: "default" },
      failed: { label: "Falhou", variant: "destructive" },
    };

    const badge = badges[status] || { label: status, variant: "outline" };
    return <Badge variant={badge.variant}>{badge.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold mb-2">Faturamento</h1>
        <p className="text-muted-foreground">
          Gerencie sua assinatura, métodos de pagamento e faturas
        </p>
      </motion.div>

      <Tabs defaultValue="plans" className="space-y-6">
        <TabsList>
          <TabsTrigger value="plans">Planos</TabsTrigger>
          <TabsTrigger value="payment-methods">
            Métodos de Pagamento
          </TabsTrigger>
          <TabsTrigger value="invoices">Faturas</TabsTrigger>
        </TabsList>

        {/* Tab Planos */}
        <TabsContent value="plans" className="space-y-6">
          {/* Current Subscription */}
          {currentSubscription && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Assinatura Atual</CardTitle>
                  <CardDescription>
                    Detalhes da sua assinatura ativa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">
                        Plano {currentSubscription.plan.toUpperCase()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(currentSubscription.amount)}/mês
                      </p>
                    </div>
                    {getStatusBadge(currentSubscription.status)}
                  </div>

                  {currentSubscription.status === "trialing" &&
                    currentSubscription.trialEnd && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-start gap-3">
                          <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">
                              Período de Trial
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Seu trial termina em{" "}
                              {formatDate(currentSubscription.trialEnd)}.
                              Primeira cobrança nesta data.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Período Atual</p>
                      <p className="font-medium">
                        {formatDate(currentSubscription.currentPeriodStart)} -{" "}
                        {formatDate(currentSubscription.currentPeriodEnd)}
                      </p>
                    </div>
                    {currentSubscription.nextPaymentDate && (
                      <div>
                        <p className="text-muted-foreground">
                          Próximo Pagamento
                        </p>
                        <p className="font-medium">
                          {formatDate(currentSubscription.nextPaymentDate)}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {currentSubscription.cancelAtPeriodEnd ? (
                      <Button
                        variant="default"
                        onClick={handleReactivateSubscription}
                      >
                        Reativar Assinatura
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={handleCancelSubscription}
                      >
                        Cancelar Assinatura
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan, index) => {
              const Icon = plan.icon;
              const isCurrentPlan = getCurrentPlan() === plan.id;
              const canUpgrade =
                PLANS.findIndex((p) => p.id === getCurrentPlan()) <
                PLANS.findIndex((p) => p.id === plan.id);

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className={`relative overflow-hidden ${
                      plan.popular ? "border-primary shadow-lg" : ""
                    } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
                  >
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold rounded-bl-lg">
                        POPULAR
                      </div>
                    )}

                    {plan.badge && !plan.popular && (
                      <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-semibold rounded-bl-lg">
                        {plan.badge}
                      </div>
                    )}

                    <CardHeader>
                      <div
                        className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4`}
                      >
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle>{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">
                          {plan.price === 0
                            ? "Grátis"
                            : formatCurrency(plan.price)}
                        </span>
                        {plan.price > 0 && (
                          <span className="text-muted-foreground">/mês</span>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        {plan.features.map((feature, i) => (
                          <li
                            key={i}
                            className="flex items-start gap-2 text-sm"
                          >
                            <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {isCurrentPlan ? (
                        <Button className="w-full" disabled>
                          <Check className="mr-2 h-4 w-4" />
                          Plano Atual
                        </Button>
                      ) : canUpgrade && plan.id !== "free" ? (
                        <Button
                          className="w-full"
                          onClick={() => {
                            setSelectedPlan(plan);
                            setShowUpgradeModal(true);
                          }}
                        >
                          Fazer Upgrade
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      ) : null}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </TabsContent>

        {/* Tab Payment Methods */}
        <TabsContent value="payment-methods" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Métodos de Pagamento</h2>
              <p className="text-muted-foreground">
                Gerencie seus cartões de crédito
              </p>
            </div>
            <Button onClick={() => setShowAddCardModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Cartão
            </Button>
          </div>

          {paymentMethods.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">
                  Nenhum método de pagamento
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Adicione um cartão para fazer upgrade de plano
                </p>
                <Button onClick={() => setShowAddCardModal(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Cartão
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {paymentMethods.map((method) => (
                <Card key={method.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                          <CreditCard className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold">
                              {method.cardBrand} •••• {method.lastFourDigits}
                            </p>
                            {method.isDefault && (
                              <Badge variant="default">Padrão</Badge>
                            )}
                            {method.isVerified && (
                              <Shield className="h-4 w-4 text-green-500" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {method.cardholderName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Expira em {method.expiryMonth}/{method.expiryYear}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveCard(method.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {!method.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4"
                        onClick={() => handleSetDefaultCard(method.id)}
                      >
                        Definir como Padrão
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab Invoices */}
        <TabsContent value="invoices" className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-2">Histórico de Faturas</h2>
            <p className="text-muted-foreground">
              Visualize e baixe suas faturas
            </p>
          </div>

          {invoices.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">Nenhuma fatura ainda</p>
                <p className="text-sm text-muted-foreground">
                  Suas faturas aparecerão aqui
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                      <TableCell>{invoice.description}</TableCell>
                      <TableCell>{formatCurrency(invoice.amount)}</TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        {invoice.status === "paid" && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar PDF
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Card Modal */}
      <Dialog open={showAddCardModal} onOpenChange={setShowAddCardModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Cartão de Crédito</DialogTitle>
            <DialogDescription>
              Será cobrado R$ 1,00 para verificação do cartão. Este valor será
              estornado automaticamente em até 24 horas.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cardNumber">Número do Cartão</Label>
              <Input
                id="cardNumber"
                placeholder="1234 5678 9012 3456"
                maxLength={19}
                value={cardForm.cardNumber}
                onChange={(e) =>
                  setCardForm({
                    ...cardForm,
                    cardNumber: formatCardNumber(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cardholderName">Nome no Cartão</Label>
              <Input
                id="cardholderName"
                placeholder="NOME COMO NO CARTÃO"
                value={cardForm.cardholderName}
                onChange={(e) =>
                  setCardForm({
                    ...cardForm,
                    cardholderName: e.target.value.toUpperCase(),
                  })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Validade</Label>
                <Input
                  id="expiryDate"
                  placeholder="MM/AA"
                  maxLength={5}
                  value={cardForm.expiryDate}
                  onChange={(e) =>
                    setCardForm({
                      ...cardForm,
                      expiryDate: formatExpiryDate(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cvv">CVV</Label>
                <Input
                  id="cvv"
                  placeholder="123"
                  type="password"
                  maxLength={4}
                  value={cardForm.cvv}
                  onChange={(e) =>
                    setCardForm({
                      ...cardForm,
                      cvv: e.target.value.replace(/\D/g, ""),
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                placeholder="000.000.000-00"
                maxLength={14}
                value={cardForm.cpf}
                onChange={(e) =>
                  setCardForm({
                    ...cardForm,
                    cpf: e.target.value,
                  })
                }
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                    Pagamento Seguro
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Seus dados são criptografados e protegidos
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddCardModal(false)}
              disabled={processingPayment}
            >
              Cancelar
            </Button>
            <Button onClick={handleAddCard} disabled={processingPayment}>
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Adicionar Cartão
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Upgrade de Plano</DialogTitle>
            <DialogDescription>
              Você está prestes a fazer upgrade para o plano{" "}
              {selectedPlan?.name}
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4">
              <Card>
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Plano</span>
                    <span className="font-semibold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Valor</span>
                    <span className="font-semibold">
                      {formatCurrency(selectedPlan.price)}/mês
                    </span>
                  </div>
                  {selectedPlan.badge && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                        <Sparkles className="h-4 w-4" />
                        <span className="font-medium text-sm">
                          {selectedPlan.badge}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-900 dark:text-yellow-100 text-sm">
                      Período de Trial
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Você não será cobrado nos próximos 7 dias. Após o trial, a
                      cobrança será de {formatCurrency(selectedPlan.price)} por
                      mês.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
              disabled={processingPayment}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpgrade} disabled={processingPayment}>
              {processingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  Confirmar Upgrade
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BillingPage;
