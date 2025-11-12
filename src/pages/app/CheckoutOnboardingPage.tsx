import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Loader2,
  Mail,
  CreditCard,
  Monitor,
  DollarSign,
  Truck,
} from "lucide-react";

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
    if (!user?.id) {
      navigate("/login");
      return;
    }

    loadOnboardingStatus();
  }, [user?.id, navigate]);

  const loadOnboardingStatus = async () => {
    try {
      setLoading(true);

      // Verificações simplificadas sem throw
      const emailVerified = await checkEmailVerification();
      const billingCompleted = await checkBilling();
      const domainCompleted = await checkDomain();
      const gatewayCompleted = await checkGateway();
      const shippingCompleted = await checkShipping();

      const onboardingSteps: OnboardingStep[] = [
        {
          id: "email",
          title: "Verificação de Email",
          description: "Verifique seu endereço de email",
          icon: Mail,
          completed: emailVerified,
          route: "/settings/email-verification",
        },
        {
          id: "billing",
          title: "Faturamento",
          description: "Configure seu plano e pagamento",
          icon: CreditCard,
          completed: billingCompleted,
          route: "/billing",
        },
        {
          id: "domain",
          title: "Domínio",
          description: "Verifique seu domínio",
          icon: Monitor,
          completed: domainCompleted,
          route: "/checkout/domain",
        },
        {
          id: "gateway",
          title: "Gateway de Pagamento",
          description: "Configure meios de pagamento",
          icon: DollarSign,
          completed: gatewayCompleted,
          route: "/checkout/gateways",
        },
        {
          id: "shipping",
          title: "Frete",
          description: "Configure métodos de entrega",
          icon: Truck,
          completed: shippingCompleted,
          route: "/checkout/shipping",
        },
      ];

      setSteps(onboardingSteps);
    } catch (error) {
      console.error("Erro ao carregar onboarding:", error);
      // Define steps vazios em caso de erro
      setSteps([]);
    } finally {
      setLoading(false);
    }
  };

  const checkEmailVerification = async (): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from("User")
        .select("emailVerified")
        .eq("id", user?.id)
        .maybeSingle();

      return data?.emailVerified === true;
    } catch {
      return false;
    }
  };

  const checkBilling = async (): Promise<boolean> => {
    try {
      const { data: userData } = await supabase
        .from("User")
        .select("currentPlanId, planId")
        .eq("id", user?.id)
        .maybeSingle();

      if (userData?.currentPlanId || userData?.planId) {
        return true;
      }

      const { data: subscription } = await supabase
        .from("Subscription")
        .select("id")
        .eq("userId", user?.id)
        .eq("status", "active")
        .maybeSingle();

      return !!subscription;
    } catch {
      return false;
    }
  };

  const checkDomain = async (): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from("User")
        .select("domain, domainVerified")
        .eq("id", user?.id)
        .maybeSingle();

      return !!(data?.domain && data?.domainVerified);
    } catch {
      return false;
    }
  };

  const checkGateway = async (): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from("GatewayConfig")
        .select("id")
        .eq("userId", user?.id)
        .eq("isActive", true)
        .limit(1);

      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  };

  const checkShipping = async (): Promise<boolean> => {
    try {
      const { data } = await supabase
        .from("ShippingMethod")
        .select("id")
        .eq("userId", user?.id)
        .limit(1);

      return (data?.length || 0) > 0;
    } catch {
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const userName = user?.name || user?.email?.split("@")[0] || "usuário";

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Olá {userName},
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Seja bem-vindo</p>
      </div>

      {/* Instructions */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Para ativar seu checkout você precisa concluir todos os passos abaixo:
        </h2>
      </div>

      {/* Steps */}
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

              {/* Status Indicator */}
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

      {/* Help */}
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
