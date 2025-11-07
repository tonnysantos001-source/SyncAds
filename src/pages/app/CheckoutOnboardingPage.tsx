import { useEffect, useState } from "react";
import {
  IconCreditCard,
  IconWorldWww,
  IconCurrencyDollar,
  IconTruck,
  IconLoader2,
  IconCircleCheck,
  IconAlertCircle,
  IconChevronRight,
  IconSparkles,
} from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

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
    if (!user?.id) return;

    try {
      const [
        billingCompleted,
        domainCompleted,
        gatewayCompleted,
        shippingCompleted,
      ] = await Promise.all([
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
          icon: IconCreditCard,
          completed: billingCompleted,
          route: "/billing",
        },
        {
          id: "domain",
          title: "Domínio",
          description:
            "Verifique seu domínio. Deve ser o mesmo utilizado na shopify, woocommerce ou na sua landing page.",
          icon: IconWorldWww,
          completed: domainCompleted,
          route: "/checkout/domain",
        },
        {
          id: "gateway",
          title: "Gateway",
          description:
            "Configure os meios de pagamentos que serão exibidos em sua loja.",
          icon: IconCurrencyDollar,
          completed: gatewayCompleted,
          route: "/checkout/gateways",
        },
        {
          id: "shipping",
          title: "Frete",
          description:
            "Crie métodos de entrega para ser exibido no seu checkout.",
          icon: IconTruck,
          completed: shippingCompleted,
          route: "/checkout/shipping",
        },
      ];

      setSteps(onboardingSteps);
    } catch (error) {
      console.error("Erro ao carregar status de onboarding:", error);
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

      if (userData?.currentPlanId) {
        return true;
      }

      const { data: subscription } = await supabase
        .from("Subscription")
        .select("id, status")
        .eq("userId", user.id)
        .eq("status", "active")
        .single();

      return !!subscription;
    } catch (error) {
      console.error("Erro ao verificar billing:", error);
      return false;
    }
  };

  const checkDomainStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data: userData } = await supabase
        .from("User")
        .select("domain, domainVerified")
        .eq("id", user.id)
        .single();

      return !!(userData?.domain && userData?.domainVerified);
    } catch (error) {
      console.error("Erro ao verificar domínio:", error);
      return false;
    }
  };

  const checkGatewayStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data: gateways } = await supabase
        .from("GatewayConfig")
        .select("id, isActive")
        .eq("userId", user.id)
        .eq("isActive", true)
        .limit(1);

      return (gateways?.length || 0) > 0;
    } catch (error) {
      console.error("Erro ao verificar gateway:", error);
      return false;
    }
  };

  const checkShippingStatus = async (): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data: shippingMethods } = await supabase
        .from("ShippingMethod")
        .select("id")
        .eq("userId", user.id)
        .limit(1);

      return (shippingMethods?.length || 0) > 0;
    } catch (error) {
      console.error("Erro ao verificar frete:", error);
      return false;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0F]">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <IconLoader2 className="h-8 w-8 text-blue-500" />
        </motion.div>
      </div>
    );
  }

  const userName = user?.name || user?.email?.split("@")[0] || "usuário";
  const completedSteps = steps.filter((s) => s.completed).length;
  const totalSteps = steps.length;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header com gradiente */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6"
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 border border-blue-500/20 backdrop-blur-xl p-6">
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -mr-24 -mt-24" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl -ml-24 -mb-24" />

            <div className="relative z-10">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="inline-flex items-center gap-2 mb-3"
              >
                <IconSparkles className="w-6 h-6 text-yellow-400" />
                <span className="text-sm font-medium text-yellow-400">
                  Bem-vindo ao SyncAds
                </span>
              </motion.div>

              <h1 className="text-3xl font-bold text-white mb-2">
                Olá {userName},
              </h1>
              <p className="text-gray-300 mb-4">Seja bem vindo à sua jornada</p>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-300">Progresso do Onboarding</span>
                  <span className="text-white font-semibold">
                    {completedSteps} de {totalSteps} concluídos
                  </span>
                </div>
                <div className="h-2 bg-gray-800/30 rounded-full overflow-hidden backdrop-blur-sm">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-4"
        >
          <h2 className="text-lg font-semibold text-white">
            Para ativar seu checkout você precisa concluir todos passos abaixo:
          </h2>
        </motion.div>

        {/* Steps Cards */}
        <div className="space-y-3">
          <AnimatePresence>
            {steps.map((step, index) => {
              const StepIcon = step.icon;

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.4,
                    delay: 0.3 + index * 0.1,
                    type: "spring",
                    stiffness: 100,
                  }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(step.route)}
                  className={cn(
                    "group relative overflow-hidden rounded-xl backdrop-blur-xl p-4 cursor-pointer transition-all",
                    step.completed
                      ? "bg-green-500/5 border border-green-500/30 hover:border-green-500/50 shadow-lg shadow-green-500/10"
                      : "bg-gray-800/20 border border-gray-700/30 hover:border-gray-600/50",
                  )}
                >
                  {/* Glow effect no hover */}
                  <div
                    className={cn(
                      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      step.completed
                        ? "bg-gradient-to-r from-green-500/5 to-emerald-500/5"
                        : "bg-gradient-to-r from-blue-500/5 to-purple-500/5",
                    )}
                  />

                  <div className="relative flex items-start gap-4">
                    {/* Icon Container */}
                    <motion.div
                      whileHover={{ rotate: 10, scale: 1.05 }}
                      className={cn(
                        "flex-shrink-0 p-2.5 rounded-lg",
                        step.completed
                          ? "bg-green-500/20 border border-green-500/30"
                          : "bg-gray-700/30 border border-gray-600/20",
                      )}
                    >
                      <StepIcon
                        className={cn(
                          "w-7 h-7",
                          step.completed ? "text-green-400" : "text-gray-400",
                        )}
                      />
                    </motion.div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white">
                          {step.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {/* Status Indicator & Arrow */}
                    <div className="flex items-center gap-3">
                      {step.completed ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            delay: 0.5 + index * 0.1,
                          }}
                          className="flex-shrink-0"
                        >
                          <div className="relative">
                            <motion.div
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0.8, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              className="absolute inset-0 bg-green-500/30 rounded-full blur-md"
                            />
                            <IconCircleCheck className="w-6 h-6 text-green-400 relative z-10" />
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                          }}
                          className="flex-shrink-0"
                        >
                          <div className="relative">
                            <motion.div
                              animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.3, 0.6, 0.3],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                              className="absolute inset-0 bg-red-500/30 rounded-full blur-md"
                            />
                            <IconAlertCircle className="w-6 h-6 text-red-400 relative z-10" />
                          </div>
                        </motion.div>
                      )}

                      {/* Arrow */}
                      <motion.div
                        whileHover={{ x: 5 }}
                        className="flex-shrink-0"
                      >
                        <IconChevronRight className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" />
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Help Link */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
          className="mt-6 text-center"
        >
          <p className="text-sm text-gray-400">
            Caso tenha alguma dúvida,{" "}
            <button
              onClick={() => navigate("/chat")}
              className="text-blue-400 hover:text-blue-300 underline transition-colors"
            >
              visite nossa central de ajuda
            </button>
            .
          </p>
        </motion.div>

        {/* Floating Help Button */}
        <motion.div
          initial={{ scale: 0, y: 100 }}
          animate={{ scale: 1, y: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 1.2,
          }}
          className="fixed bottom-4 right-4 z-50"
        >
          <motion.button
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 30px rgba(236, 72, 153, 0.5)",
            }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/chat")}
            className="rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white px-5 py-2.5 shadow-2xl shadow-pink-500/50 transition-all font-medium text-sm"
          >
            Precisa de ajuda?
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
