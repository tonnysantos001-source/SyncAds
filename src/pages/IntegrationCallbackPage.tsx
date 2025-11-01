import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { integrationsService } from "@/lib/integrations/integrationsService";
import { INTEGRATIONS_CONFIG } from "@/lib/integrations/types";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { shopifyIntegrationApi } from "@/lib/api/shopifyIntegrationApi";
import { supabase } from "@/lib/supabase";

export function IntegrationCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("Processing your connection...");

  useEffect(() => {
    const processCallback = async () => {
      try {
        // SHOPIFY OAUTH CALLBACK
        const shop = searchParams.get("shop");
        const code = searchParams.get("code");
        const hmac = searchParams.get("hmac");

        if (shop && code && hmac) {
          setStatus("loading");
          setMessage("Conectando com Shopify...");

          try {
            const session = await supabase.auth.getSession();
            const response = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/shopify-oauth?action=callback&shop=${shop}&code=${code}&hmac=${hmac}`,
              {
                headers: {
                  Authorization: `Bearer ${session.data.session?.access_token}`,
                },
              },
            );

            const result = await response.json();

            if (result.success) {
              setStatus("success");
              setMessage("Shopify conectada! Sincronizando dados...");
              setTimeout(() => navigate("/integrations"), 2000);
              return;
            } else {
              throw new Error(result.error || "Erro ao conectar Shopify");
            }
          } catch (error: any) {
            setStatus("error");
            setMessage(`Erro ao conectar Shopify: ${error.message}`);
            setTimeout(() => navigate("/integrations"), 3000);
            return;
          }
        }

        // OUTRAS INTEGRAÇÕES (código original)
        const state = searchParams.get("state");
        const error = searchParams.get("error");

        // Verificar se houve erro
        if (error) {
          throw new Error(error);
        }

        // Validar parâmetros
        if (!code || !state) {
          throw new Error("Missing code or state parameter");
        }

        // Processar callback OAuth
        const result = await integrationsService.handleOAuthCallback(
          code,
          state,
        );

        const config = INTEGRATIONS_CONFIG[result.slug];
        setStatus("success");
        setMessage(`${config.name} connected successfully!`);

        // Salvar flag de sucesso para o popup detectar
        const stateData = JSON.parse(atob(state));
        localStorage.setItem(
          `oauth_success_${stateData.platform}_${stateData.userId}`,
          "true",
        );

        // Fechar popup ou redirecionar
        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate("/chat");
          }
        }, 2000);
      } catch (error: any) {
        console.error("OAuth callback error:", error);
        setStatus("error");
        setMessage(error.message || "Failed to connect integration");

        setTimeout(() => {
          if (window.opener) {
            window.close();
          } else {
            navigate("/chat");
          }
        }, 3000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md">
        {status === "loading" && (
          <>
            <Loader2 className="h-16 w-16 animate-spin text-blue-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Processing...</h1>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-green-600">Success!</h1>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Closing this window...</p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-red-600">Error</h1>
            <p className="text-gray-600 dark:text-gray-400">{message}</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting...</p>
          </>
        )}
      </div>
    </div>
  );
}
