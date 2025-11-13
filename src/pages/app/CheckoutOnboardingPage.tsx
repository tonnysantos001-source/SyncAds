import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  CreditCard,
  Monitor,
  DollarSign,
  Truck,
  AlertTriangle,
} from "lucide-react";
import { useState, useEffect } from "react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  route: string;
}

export default function CheckoutOnboardingPage() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    try {
      console.log("🔄 [ONBOARDING] Componente montado");
      console.log("👤 [ONBOARDING] User:", user);
    } catch (error) {
      console.error("❌ [ONBOARDING] Erro no useEffect:", error);
      setHasError(true);
      setErrorMessage(
        error instanceof Error ? error.message : "Erro desconhecido",
      );
    }
  }, [user]);

  // Steps fixos - sem verificação assíncrona
  const steps: OnboardingStep[] = [
    {
      id: "email",
      title: "Verificação de Email",
      description: "Verifique seu endereço de email",
      icon: Mail,
      route: "/settings/email-verification",
    },
    {
      id: "billing",
      title: "Faturamento",
      description: "Configure seu plano e pagamento",
      icon: CreditCard,
      route: "/billing",
    },
    {
      id: "domain",
      title: "Domínio",
      description: "Verifique seu domínio",
      icon: Monitor,
      route: "/checkout/domain",
    },
    {
      id: "gateway",
      title: "Gateway de Pagamento",
      description: "Configure meios de pagamento",
      icon: DollarSign,
      route: "/checkout/gateways",
    },
    {
      id: "shipping",
      title: "Frete",
      description: "Configure métodos de entrega",
      icon: Truck,
      route: "/checkout/shipping",
    },
  ];

  const handleNavigate = (route: string) => {
    try {
      console.log(`🔄 [ONBOARDING] Navegando para: ${route}`);
      navigate(route);
    } catch (error) {
      console.error("❌ [ONBOARDING] Erro ao navegar:", error);
      setHasError(true);
      setErrorMessage(`Erro ao navegar para ${route}`);
    }
  };

  // Fallback UI em caso de erro
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Erro ao carregar página
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {errorMessage || "Ocorreu um erro inesperado"}
          </p>
          <button
            onClick={() => {
              setHasError(false);
              setErrorMessage("");
              window.location.reload();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Recarregar página
          </button>
        </div>
      </div>
    );
  }

  let userName = "usuário";
  try {
    userName = user?.name || user?.email?.split("@")[0] || "usuário";
  } catch (error) {
    console.error("❌ [ONBOARDING] Erro ao obter nome do usuário:", error);
    userName = "usuário";
  }

  try {
    return (
      <div className="p-6 sm:p-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Olá {userName},
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Seja bem-vindo
          </p>
        </div>

        {/* Instructions */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Para ativar seu checkout, complete os passos abaixo:
          </h2>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => {
            try {
              const StepIcon = step.icon;

              return (
                <div
                  key={step.id}
                  className="flex items-start gap-4 p-4 border-2 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-all"
                  onClick={() => handleNavigate(step.route)}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <StepIcon className="h-8 w-8 text-blue-600 dark:text-blue-400" />
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

                  {/* Arrow */}
                  <div className="flex-shrink-0 pt-1">
                    <svg
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              );
            } catch (error) {
              console.error(
                `❌ [ONBOARDING] Erro ao renderizar step ${step.id}:`,
                error,
              );
              return null;
            }
          })}
        </div>

        {/* Help */}
        <div className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          Caso tenha alguma dúvida,{" "}
          <button
            onClick={() => handleNavigate("/help")}
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
            onClick={() => handleNavigate("/chat")}
          >
            Precisa de ajuda?
          </button>
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ [ONBOARDING] Erro fatal ao renderizar:", error);
    setHasError(true);
    setErrorMessage(
      error instanceof Error ? error.message : "Erro ao renderizar página",
    );
    return null;
  }
}
