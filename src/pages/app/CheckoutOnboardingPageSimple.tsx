import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function CheckoutOnboardingPageSimple() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("=".repeat(80));
    console.log("🔄 [ONBOARDING SIMPLE] Component mounted");
    console.log("=".repeat(80));
    console.log("📊 AuthStore State:", {
      isAuthenticated,
      isInitialized,
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userName: user?.name,
      isSuperAdmin: user?.isSuperAdmin,
    });
    console.log("-".repeat(80));

    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      console.log("🔍 Verificando sessão Supabase...");

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      console.log("📋 Sessão Supabase:", {
        hasSession: !!session,
        userId: session?.user?.id,
        email: session?.user?.email,
        expiresAt: session?.expires_at
          ? new Date(session.expires_at * 1000).toISOString()
          : null,
        error: sessionError?.message,
      });

      if (sessionError) {
        console.error("❌ Erro na sessão:", sessionError);
        setError(`Erro de sessão: ${sessionError.message}`);
        setLoading(false);
        return;
      }

      if (!session) {
        console.error("❌ Sessão não encontrada");
        setError("Sessão não encontrada. Redirecionando para login...");
        setTimeout(() => navigate("/login"), 2000);
        setLoading(false);
        return;
      }

      setSessionInfo({
        userId: session.user.id,
        email: session.user.email,
        expiresAt: new Date(session.expires_at! * 1000).toISOString(),
      });

      // Verificar dados do usuário na tabela
      if (user?.id) {
        console.log("🔍 Buscando dados do usuário na tabela User...");
        const { data: userData, error: userError } = await supabase
          .from("User")
          .select("*")
          .eq("id", user.id)
          .single();

        console.log("📋 Dados do usuário:", {
          found: !!userData,
          data: userData,
          error: userError?.message,
        });
      }

      console.log("✅ Verificação completa!");
      setLoading(false);
    } catch (err: any) {
      console.error("❌ Exceção ao verificar sessão:", err);
      setError(`Exceção: ${err.message}`);
      setLoading(false);
    }
  };

  const copyDebugInfo = () => {
    const info = {
      timestamp: new Date().toISOString(),
      authStore: {
        isAuthenticated,
        isInitialized,
        user: user,
      },
      session: sessionInfo,
      error: error,
      localStorage: localStorage.getItem("auth-storage"),
    };

    navigator.clipboard.writeText(JSON.stringify(info, null, 2));
    alert("Debug info copiado para clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Carregando...
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Verificando autenticação
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            🔍 Diagnóstico de Onboarding
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Versão simplificada para debug
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-red-900 dark:text-red-200">
                  Erro detectado
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Auth Store Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Estado do AuthStore
          </h2>
          <div className="space-y-2">
            <StatusRow
              label="Autenticado"
              value={isAuthenticated}
              icon={isAuthenticated ? CheckCircle : XCircle}
            />
            <StatusRow
              label="Inicializado"
              value={isInitialized}
              icon={isInitialized ? CheckCircle : XCircle}
            />
            <StatusRow
              label="Usuário Presente"
              value={!!user}
              icon={!!user ? CheckCircle : XCircle}
            />
          </div>

          {user && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dados do Usuário:
              </h3>
              <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
                {JSON.stringify(
                  {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    isSuperAdmin: user.isSuperAdmin,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>

        {/* Session Info */}
        {sessionInfo && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Informações da Sessão
            </h2>
            <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-3 rounded overflow-auto">
              {JSON.stringify(sessionInfo, null, 2)}
            </pre>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Ações
          </h2>
          <button
            onClick={copyDebugInfo}
            className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
          >
            📋 Copiar Informações de Debug
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full px-4 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors font-medium"
          >
            ← Voltar para Login
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium"
          >
            🔄 Recarregar Página
          </button>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors font-medium"
          >
            🗑️ Limpar Cache e Fazer Logout
          </button>
        </div>

        {/* Console Log Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Dica:</strong> Abra o Console do navegador (F12) para
            ver logs detalhados da autenticação
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: boolean;
  icon: any;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
      <div className="flex items-center gap-2">
        <Icon
          className={`h-5 w-5 ${value ? "text-green-500" : "text-red-500"}`}
        />
        <span
          className={`text-sm font-medium ${value ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {value ? "Sim" : "Não"}
        </span>
      </div>
    </div>
  );
}
