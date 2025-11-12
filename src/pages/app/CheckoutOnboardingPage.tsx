import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CreditCard,
  Monitor,
  DollarSign,
  Truck,
  Loader2,
  Mail,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  route: string;
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
    if (!user?.id) {
      console.log("⚠️ [ONBOARDING] Sem usuário, redirecionando...");
      navigate("/login");
      return;
    }

    console.log("🔄 [ONBOARDING] Carregando status para usuário:", user.id);

    try {
      // Buscar status de cada etapa em paralelo com tratamento de erro individual
      const [
        emailVerified,
        billingCompleted,
        domainCompleted,
        gatewayCompleted,
        shippingCompleted,
      ] = await Promise.all([
        checkEmailVerificationStatus().catch((e) => {
          console.error("❌ [ONBOARDING] Erro em emailVerified:", e);
          return false;
        }),
        checkBillingStatus().catch((e) => {
          console.error("❌ [ONBOARDING] Erro em billing:", e);
          return false;
        }),
        checkDomainStatus().catch((e) => {
          console.error("❌ [ONBOARDING] Erro em domain:", e);
          return false;
        }),
        checkGatewayStatus().catch((e) => {
          console.error("❌ [ONBOARDING] Erro em gateway:", e);
          return false;
        }),
        checkShippingStatus().catch((e) => {
          console.error("❌ [ONBOARDING] Erro em shipping:", e);
          return false;
        }),
      ]);

      console.log("✅ [ONBOARDING] Status carregado:", {
        emailVerified,
        billingCompleted,
        domainCompleted,
        gatewayCompleted,
        shippingCompleted,
      });

      const onboardingSteps: OnboardingStep[] = [
        {
          id: "email-verification",
          title: "Verificação de Email",
          description:
            "Verifique seu endereço de email para ativar todos os recursos",
          icon: Mail,
          completed: emailVerified,
          route: "/settings/email-verification",
        },
        {
          id: "billing",
          title: "Faturamento",
          description: "Configure seu plano e método de pagamento",
          icon: CreditCard,
          completed: billingCompleted,
          route: "/billing",
        },
        {
          id: "domain",
          title: "Domínio",
          description:
            "Verifique seu domínio. Deve ser o mesmo utilizado na shopify, woocommerce ou na sua landing page.",
          icon: Monitor,
          completed: domainCompleted,
          route: "/checkout/domain",
        },
        {
          id: "gateway",
          title: "Gateway",
          description:
            "Configure os meios de pagamentos que serão exibidos em sua loja.",
          icon: DollarSign,
          completed: gatewayCompleted,
          route: "/checkout/gateways",
        },
        {
          id: "shipping",
          title: "Frete",
          description:
            "Crie métodos de entrega para ser exibido no seu checkout.",
          icon: Truck,
          completed: shippingCompleted,
          route: "/checkout/shipping",
        },
      ];

      setSteps(onboardingSteps);
      console.log("✅ [ONBOARDING] Steps definidos com sucesso");
    } catch (error) {
      console.error("❌ [ONBOARDING] Erro ao carregar status:", error);
      // Mesmo com erro, mostrar as etapas como não concluídas
      const defaultSteps: OnboardingStep[] = [
        {
          id: "email-verification",
          title: "Verificação de Email",
          description:
            "Verifique seu endereço de email para ativar todos os recursos",
          icon: Mail,
          completed: false,
          route: "/settings/email-verification",
        },
        {
          id: "billing",
          title: "Faturamento",
          description: "Configure seu plano e método de pagamento",
          icon: CreditCard,
          completed: false,
          route: "/billing",
        },
        {
          id: "domain",
          title: "Domínio",
          description:
            "Verifique seu domínio. Deve ser o mesmo utilizado na shopify, woocommerce ou na sua landing page.",
          icon: Monitor,
          completed: false,
          route: "/checkout/domain",
        },
        {
          id: "gateway",
          title: "Gateway",
          description:
            "Configure os meios de pagamentos que serão exibidos em sua loja.",
          icon: DollarSign,
          completed: false,
          route: "/checkout/gateways",
        },
        {
          id: "shipping",
          title: "Frete",
          description:
            "Crie métodos de entrega para ser exibido no seu checkout.",
          icon: Truck,
          completed: false,
          route: "/checkout/shipping",
        },
      ];
      setSteps(defaultSteps);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Verificar se email foi verificado
  const checkEmailVerificationStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      console.log("🔍 [ONBOARDING] Verificando email...");
      const { data: userData, error } = await supabase
        .from("User")
        .select("emailVerified")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("❌ [ONBOARDING] Erro ao buscar emailVerified:", error);
        return false;
      }

      const verified = userData?.emailVerified === true;
      console.log("✅ [ONBOARDING] Email verificado:", verified);
      return verified;
    } catch (error) {
      console.error("❌ [ONBOARDING] Exceção ao verificar email:", error);
      return false;
    }
  };

  // ✅ SISTEMA SIMPLIFICADO: Verificações baseadas apenas no userId
  const checkBillingStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      console.log("🔍 [ONBOARDING] Verificando billing...");

      // Verificar se usuário tem um plano atribuído (mesmo que gratuito)
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select("currentPlanId, planId")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error(
          "❌ [ONBOARDING] Erro ao buscar plano do usuário:",
          userError,
        );
      }

      // Se tem plano atribuído, billing está OK
      if (userData?.currentPlanId || userData?.planId) {
        console.log("✅ [ONBOARDING] Billing OK - plano encontrado");
        return true;
      }

      // Verificar se tem subscrição ativa (mesmo gratuita)
      const { data: subscription, error: subError } = await supabase
        .from("Subscription")
        .select("id, status")
        .eq("userId", user.id)
        .eq("status", "active")
        .maybeSingle();

      if (subError && !subError.message.includes("does not exist")) {
        console.error("❌ [ONBOARDING] Erro ao buscar subscription:", subError);
      }

      const hasSub = !!subscription;
      console.log("✅ [ONBOARDING] Billing:", hasSub ? "OK" : "Pendente");
      return hasSub;
    } catch (error) {
      console.error("❌ [ONBOARDING] Exceção ao verificar billing:", error);
      return false;
    }
  };

  const checkDomainStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      console.log("🔍 [ONBOARDING] Verificando domínio...");

      // Verificar se usuário tem domínio verificado
      const { data: userData, error } = await supabase
        .from("User")
        .select("domain, domainVerified")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("❌ [ONBOARDING] Erro ao buscar domínio:", error);
        return false;
      }

      const verified = !!(userData?.domain && userData?.domainVerified);
      console.log(
        "✅ [ONBOARDING] Domínio:",
        verified ? "Verificado" : "Pendente",
      );
      return verified;
    } catch (error) {
      console.error("❌ [ONBOARDING] Exceção ao verificar domínio:", error);
      return false;
    }
  };

  const checkGatewayStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      console.log("🔍 [ONBOARDING] Verificando gateway...");

      // Verificar se usuário tem pelo menos 1 gateway configurado e ativo
      const { data: gateways, error } = await supabase
        .from("GatewayConfig")
        .select("id, isActive")
        .eq("userId", user.id)
        .eq("isActive", true)
        .limit(1);

      if (error) {
        console.error("❌ [ONBOARDING] Erro ao buscar gateway:", error);
        return false;
      }

      const hasGateway = (gateways?.length || 0) > 0;
      console.log(
        "✅ [ONBOARDING] Gateway:",
        hasGateway ? "Configurado" : "Pendente",
      );
      return hasGateway;
    } catch (error) {
      console.error("❌ [ONBOARDING] Exceção ao verificar gateway:", error);
      return false;
    }
  };

  const checkShippingStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      console.log("🔍 [ONBOARDING] Verificando frete...");

      // Verificar se usuário tem pelo menos 1 método de frete configurado
      const { data: shippingMethods, error } = await supabase
        .from("ShippingMethod")
        .select("id")
        .eq("userId", user.id)
        .limit(1);

      if (error) {
        // Se tabela não existir, apenas log e retornar false
        if (error.message.includes("does not exist")) {
          console.log("⚠️ [ONBOARDING] Tabela ShippingMethod não existe ainda");
        } else {
          console.error("❌ [ONBOARDING] Erro ao buscar frete:", error);
        }
        return false;
      }

      const hasShipping = (shippingMethods?.length || 0) > 0;
      console.log(
        "✅ [ONBOARDING] Frete:",
        hasShipping ? "Configurado" : "Pendente",
      );
      return hasShipping;
    } catch (error) {
      console.error("❌ [ONBOARDING] Exceção ao verificar frete:", error);
      // Se tabela não existir ainda, retornar false
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Get user's first name from email
  const userName = user?.name || user?.email?.split("@")[0] || "usuário";

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Olá {userName},
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Seja bem vindo</p>
      </div>

      {/* Main Instructions */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Para ativar seu checkout você precisa concluir todos passos abaixo:
        </h2>
      </div>

      {/* Steps with Green/Red indicators */}
      <div className="space-y-4">
        {steps.map((step) => {
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className="flex items-start gap-4 p-4 border-2 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-all"
              onClick={() => navigate(step.route)}
            >
              {/* Icon */}
              <div className="flex-shrink-0">
                <StepIcon className="h-8 w-8 text-gray-600 dark:text-gray-400" />
              </div>

              {/* Content */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {step.description}
                </p>
              </div>

              {/* Status Indicator - Green/Red dot */}
              <div className="flex-shrink-0 pt-1">
                <div
                  className={`h-3 w-3 rounded-full ${
                    step.completed ? "bg-green-500" : "bg-red-500"
                  }`}
                  title={step.completed ? "Concluído" : "Pendente"}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Help Link */}
      <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
        Caso tenha alguma dúvida,{" "}
        <button
          onClick={() => navigate("/help")}
          className="underline hover:text-gray-900 dark:hover:text-white"
        >
          visite nossa central de ajuda
        </button>
        .
      </div>

      {/* Floating Help Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          className="rounded-full bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 shadow-lg transition-colors"
          onClick={() => navigate("/chat")}
        >
          Precisa de ajuda?
        </button>
      </div>
    </div>
  );
}
