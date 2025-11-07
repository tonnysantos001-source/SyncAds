import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Globe,
  Wallet,
  Truck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  route: string;
  icon: React.ReactNode;
}

export default function CheckoutOnboardingPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadOnboardingStatus();
    }
  }, [user?.id]);

  const loadOnboardingStatus = async () => {
    if (!user?.id) return;

    try {
      const [billing, domain, gateway, shipping] = await Promise.all([
        checkBillingStatus(),
        checkDomainStatus(),
        checkGatewayStatus(),
        checkShippingStatus(),
      ]);

      const onboardingSteps: OnboardingStep[] = [
        {
          id: "billing",
          title: "Faturamento",
          description: "Configure seu plano e método de pagamento",
          completed: billing,
          route: "/billing",
          icon: <CreditCard className="h-5 w-5" />,
        },
        {
          id: "domain",
          title: "Domínio",
          description: "Verifique seu domínio (mesmo da Shopify/WooCommerce)",
          completed: domain,
          route: "/checkout/domain",
          icon: <Globe className="h-5 w-5" />,
        },
        {
          id: "gateway",
          title: "Gateway de Pagamento",
          description: "Configure os meios de pagamento",
          completed: gateway,
          route: "/checkout/gateways",
          icon: <Wallet className="h-5 w-5" />,
        },
        {
          id: "shipping",
          title: "Frete",
          description: "Crie métodos de entrega",
          completed: shipping,
          route: "/checkout/shipping",
          icon: <Truck className="h-5 w-5" />,
        },
      ];

      setSteps(onboardingSteps);
    } catch (error) {
      console.error("Erro ao carregar status:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkBillingStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data: userData } = await supabase
        .from("User")
        .select("currentPlanId")
        .eq("id", user.id)
        .single();

      if (userData?.currentPlanId) return true;

      const { data: subscription } = await supabase
        .from("Subscription")
        .select("id, status")
        .eq("userId", user.id)
        .eq("status", "active")
        .single();

      return !!subscription;
    } catch {
      return false;
    }
  };

  const checkDomainStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data } = await supabase
        .from("User")
        .select("domain, domainVerified")
        .eq("id", user.id)
        .single();

      return !!(data?.domain && data?.domainVerified);
    } catch {
      return false;
    }
  };

  const checkGatewayStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data } = await supabase
        .from("GatewayConfig")
        .select("id")
        .eq("userId", user.id)
        .eq("isActive", true)
        .limit(1);

      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  };

  const checkShippingStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;
    try {
      const { data } = await supabase
        .from("ShippingMethod")
        .select("id")
        .eq("userId", user.id)
        .limit(1);

      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-sm text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const userName = user?.name || user?.email?.split("@")[0] || "usuário";
  const completedSteps = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto p-6 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Olá, {userName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete as etapas abaixo para ativar seu checkout
          </p>
        </div>

        {/* Progress Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                Progresso do Onboarding
              </CardTitle>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {completedSteps} de {totalSteps} concluídos
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <Progress value={progress} className="h-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {progress === 100
                ? "Parabéns! Você concluiu todas as etapas."
                : "Continue configurando para ativar seu checkout."}
            </p>
          </CardContent>
        </Card>

        {/* Steps List */}
        <div className="space-y-4 mb-6">
          {steps.map((step, index) => (
            <Card
              key={step.id}
              className="cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => navigate(step.route)}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {/* Step Number/Icon */}
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${
                      step.completed
                        ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                        : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-6 w-6" />
                    ) : (
                      step.icon
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {step.title}
                      </h3>
                      {step.completed ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                        >
                          Concluído
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-600">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {step.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="flex-shrink-0 h-5 w-5 text-gray-400" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Help Card */}
        <Card className="border-dashed">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Precisa de ajuda?
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Nossa central de ajuda está disponível para tirar suas
                  dúvidas.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/chat")}
                >
                  Acessar Central de Ajuda
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
