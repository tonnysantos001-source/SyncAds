import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { Mail, CreditCard, Monitor, DollarSign, Truck } from "lucide-react";

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
          Para ativar seu checkout, complete os passos abaixo:
        </h2>
      </div>

      {/* Steps */}
      <div className="space-y-4">
        {steps.map((step) => {
          const StepIcon = step.icon;

          return (
            <div
              key={step.id}
              className="flex items-start gap-4 p-4 border-2 rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-all"
              onClick={() => navigate(step.route)}
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
