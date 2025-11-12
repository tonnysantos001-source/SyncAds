import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CreditCard,
  Monitor,
  DollarSign,
  Truck,
  Loader2,
  Mail,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [error, setError] = useState<string | null>(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [diagnosticInfo, setDiagnosticInfo] = useState<any>(null);

  useEffect(() => {
    console.log("🔄 [ONBOARDING] Component mounted", {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
    });

    if (user?.id) {
      loadOnboardingStatus();
    } else {
      console.error("⚠️ [ONBOARDING] Sem usuário no mount");
      setError("Usuário não encontrado. Redirecionando...");
      setTimeout(() => navigate("/login"), 1500);
    }
  }, [user?.id]);

  const checkSupabaseSession = async () => {
    try {
      console.log("🔍 [ONBOARDING] Verificando sessão Supabase...");
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("❌ [ONBOARDING] Erro ao buscar sessão:", sessionError);
        throw sessionError;
      }

      if (!session) {
        console.error("❌ [ONBOARDING] Sessão não encontrada");
        setError("Sessão expirada. Redirecionando para login...");
        setTimeout(() => navigate("/login"), 1500);
        return false;
      }

      console.log("✅ [ONBOARDING] Sessão válida:", {
        userId: session.user.id,
        expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      });

      return true;
    } catch (error: any) {
      console.error("❌ [ONBOARDING] Erro ao verificar sessão:", error);
      setError("Erro ao verificar sessão. Por favor, faça login novamente.");
      return false;
    }
  };

  const loadOnboardingStatus = async () => {
    if (!user?.id) {
      console.error("⚠️ [ONBOARDING] Sem usuário, redirecionando...");
      setError("Usuário não encontrado. Redirecionando para login...");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    console.log("🔄 [ONBOARDING] Carregando status para usuário:", {
      userId: user.id,
      email: user.email,
      name: user.name,
      isSuperAdmin: user.isSuperAdmin,
    });

    setLoading(true);
    setError(null);

    try {
      // Primeiro verificar sessão do Supabase
      const hasValidSession = await checkSupabaseSession();
      if (!hasValidSession) {
        setLoading(false);
        return;
      }

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
      console.log(
        "✅ [ONBOARDING] Steps definidos com sucesso:",
        onboardingSteps.length,
      );
      setError(null);
    } catch (error: any) {
      console.error("❌ [ONBOARDING] Erro CRÍTICO ao carregar status:", {
        error,
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
      });

      // Definir mensagem de erro específica
      let errorMessage = "Erro ao carregar configurações. ";
      if (
        error?.message?.includes("JWT") ||
        error?.message?.includes("token")
      ) {
        errorMessage +=
          "Problema de autenticação. Por favor, faça login novamente.";
        setTimeout(() => {
          useAuthStore.getState().logout();
          navigate("/login");
        }, 2000);
      } else if (error?.code === "PGRST116") {
        errorMessage += "Nenhum dado encontrado.";
      } else if (error?.message?.includes("Failed to fetch")) {
        errorMessage += "Erro de conexão. Verifique sua internet.";
      } else {
        errorMessage += error?.message || "Erro desconhecido.";
      }

      setError(errorMessage);

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
    if (!user?.id) {
      console.warn("⚠️ [ONBOARDING] checkEmailVerificationStatus: sem userId");
      return false;
    }

    try {
      console.log("🔍 [ONBOARDING] Verificando email para userId:", user.id);
      const { data: userData, error } = await supabase
        .from("User")
        .select("emailVerified")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("❌ [ONBOARDING] Erro ao buscar emailVerified:", {
          error,
          message: error.message,
          code: error.code,
        });
        throw error;
      }

      const verified = userData?.emailVerified === true;
      console.log("✅ [ONBOARDING] Email verificado:", verified);
      return verified;
    } catch (error: any) {
      console.error("❌ [ONBOARDING] Exceção ao verificar email:", {
        error,
        message: error?.message,
      });
      throw error;
    }
  };

  // ✅ SISTEMA SIMPLIFICADO: Verificações baseadas apenas no userId
  const checkBillingStatus = async (): Promise<boolean> => {
    if (!user?.id) {
      console.warn("⚠️ [ONBOARDING] checkBillingStatus: sem userId");
      return false;
    }

    try {
      console.log("🔍 [ONBOARDING] Verificando billing para userId:", user.id);

      // Verificar se usuário tem um plano atribuído (mesmo que gratuito)
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select("currentPlanId, planId")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("❌ [ONBOARDING] Erro ao buscar plano do usuário:", {
          error: userError,
          message: userError.message,
          code: userError.code,
        });
        throw userError;
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
        console.error("❌ [ONBOARDING] Erro ao buscar subscription:", {
          error: subError,
          message: subError.message,
          code: subError.code,
        });
        throw subError;
      }

      const hasSub = !!subscription;
      console.log("✅ [ONBOARDING] Billing:", hasSub ? "OK" : "Pendente");
      return hasSub;
    } catch (error: any) {
      console.error("❌ [ONBOARDING] Exceção ao verificar billing:", {
        error,
        message: error?.message,
      });
      throw error;
    }
  };

  const checkDomainStatus = async (): Promise<boolean> => {
    if (!user?.id) {
      console.warn("⚠️ [ONBOARDING] checkDomainStatus: sem userId");
      return false;
    }

    try {
      console.log("🔍 [ONBOARDING] Verificando domínio para userId:", user.id);

      // Verificar se usuário tem domínio verificado
      const { data: userData, error } = await supabase
        .from("User")
        .select("domain, domainVerified")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("❌ [ONBOARDING] Erro ao buscar domínio:", {
          error,
          message: error.message,
          code: error.code,
        });
        throw error;
      }

      const verified = !!(userData?.domain && userData?.domainVerified);
      console.log(
        "✅ [ONBOARDING] Domínio:",
        verified ? "Verificado" : "Pendente",
      );
      return verified;
    } catch (error: any) {
      console.error("❌ [ONBOARDING] Exceção ao verificar domínio:", {
        error,
        message: error?.message,
      });
      throw error;
    }
  };

  const checkGatewayStatus = async (): Promise<boolean> => {
    if (!user?.id) {
      console.warn("⚠️ [ONBOARDING] checkGatewayStatus: sem userId");
      return false;
    }

    try {
      console.log("🔍 [ONBOARDING] Verificando gateway para userId:", user.id);

      // Verificar se usuário tem pelo menos 1 gateway configurado e ativo
      const { data: gateways, error } = await supabase
        .from("GatewayConfig")
        .select("id, isActive")
        .eq("userId", user.id)
        .eq("isActive", true)
        .limit(1);

      if (error) {
        console.error("❌ [ONBOARDING] Erro ao buscar gateway:", {
          error,
          message: error.message,
          code: error.code,
        });
        throw error;
      }

      const hasGateway = (gateways?.length || 0) > 0;
      console.log(
        "✅ [ONBOARDING] Gateway:",
        hasGateway ? "Configurado" : "Pendente",
      );
      return hasGateway;
    } catch (error: any) {
      console.error("❌ [ONBOARDING] Exceção ao verificar gateway:", {
        error,
        message: error?.message,
      });
      throw error;
    }
  };

  const checkShippingStatus = async (): Promise<boolean> => {
    if (!user?.id) {
      console.warn("⚠️ [ONBOARDING] checkShippingStatus: sem userId");
      return false;
    }

    try {
      console.log("🔍 [ONBOARDING] Verificando frete para userId:", user.id);

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
          return false;
        }
        console.error("❌ [ONBOARDING] Erro ao buscar frete:", {
          error,
          message: error.message,
          code: error.code,
        });
        throw error;
      }

      const hasShipping = (shippingMethods?.length || 0) > 0;
      console.log(
        "✅ [ONBOARDING] Frete:",
        hasShipping ? "Configurado" : "Pendente",
      );
      return hasShipping;
    } catch (error: any) {
      console.error("❌ [ONBOARDING] Exceção ao verificar frete:", {
        error,
        message: error?.message,
      });
      // Se tabela não existir ainda, retornar false sem erro
      if (error?.message?.includes("does not exist")) {
        return false;
      }
      throw error;
    }
  };

  const runDiagnostic = async () => {
    console.log("🔍 [DIAGNOSTIC] Iniciando diagnóstico completo...");
    const info: any = {
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
        isSuperAdmin: user?.isSuperAdmin,
        plan: user?.plan,
      },
      authStore: {
        isAuthenticated: useAuthStore.getState().isAuthenticated,
        isInitialized: useAuthStore.getState().isInitialized,
      },
      localStorage: {
        authStorage: localStorage.getItem("auth-storage"),
      },
      supabase: {},
    };

    try {
      // Verificar sessão Supabase
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      info.supabase.session = {
        hasSession: !!session,
        userId: session?.user?.id,
        expiresAt: session?.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : null,
        error: sessionError?.message,
      };

      // Verificar user na tabela User
      const { data: userData, error: userError } = await supabase
        .from("User")
        .select("id, email, name, emailVerified, plan, isSuperAdmin")
        .eq("id", user?.id)
        .single();
      info.supabase.user = {
        found: !!userData,
        data: userData,
        error: userError?.message,
      };

      // Verificar billing
      try {
        const { data: subscription, error: subError } = await supabase
          .from("Subscription")
          .select("id, status")
          .eq("userId", user?.id)
          .eq("status", "active")
          .maybeSingle();
        info.supabase.billing = {
          hasActiveSubscription: !!subscription,
          error: subError?.message,
        };
      } catch (e: any) {
        info.supabase.billing = { error: e.message };
      }

      // Verificar domain
      try {
        const { data: domain, error: domainError } = await supabase
          .from("User")
          .select("domain, domainVerified")
          .eq("id", user?.id)
          .single();
        info.supabase.domain = {
          domain: domain?.domain,
          verified: domain?.domainVerified,
          error: domainError?.message,
        };
      } catch (e: any) {
        info.supabase.domain = { error: e.message };
      }

      // Verificar gateways
      try {
        const { data: gateways, error: gatewayError } = await supabase
          .from("GatewayConfig")
          .select("id, isActive")
          .eq("userId", user?.id)
          .eq("isActive", true);
        info.supabase.gateways = {
          count: gateways?.length || 0,
          error: gatewayError?.message,
        };
      } catch (e: any) {
        info.supabase.gateways = { error: e.message };
      }

      console.log("✅ [DIAGNOSTIC] Diagnóstico completo:", info);
    } catch (e: any) {
      info.error = e.message;
      console.error("❌ [DIAGNOSTIC] Erro no diagnóstico:", e);
    }

    setDiagnosticInfo(info);
    setShowDiagnostic(true);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Carregando suas configurações...
        </p>
      </div>
    );
  }

  // Mostrar erro se houver
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <button
          onClick={() => {
            setError(null);
            setLoading(true);
            loadOnboardingStatus();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Tentar Novamente
        </button>
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
        >
          Voltar para Login
        </button>
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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        <button
          className="rounded-full bg-pink-500 hover:bg-pink-600 text-white px-6 py-3 shadow-lg transition-colors"
          onClick={() => navigate("/chat")}
        >
          Precisa de ajuda?
        </button>
        <button
          className="rounded-full bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 shadow-lg transition-colors text-sm"
          onClick={runDiagnostic}
        >
          🔍 Diagnóstico
        </button>
      </div>

      {/* Diagnostic Modal */}
      {showDiagnostic && diagnosticInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Informações de Diagnóstico</h2>
              <button
                onClick={() => setShowDiagnostic(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ✕
              </button>
            </div>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(diagnosticInfo, null, 2)}
            </pre>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    JSON.stringify(diagnosticInfo, null, 2),
                  );
                  alert("Diagnóstico copiado para área de transferência!");
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Copiar
              </button>
              <button
                onClick={() => setShowDiagnostic(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
