import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log erro para serviço de monitoramento
    console.error("ErrorBoundary caught an error:", error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // ✅ Enviar para Sentry
    if (typeof window !== "undefined" && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack,
          },
        },
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = "/dashboard";
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full shadow-lg">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-red-900">
                Ops! Algo deu errado
              </CardTitle>
              <CardDescription className="text-base">
                Encontramos um erro inesperado. Não se preocupe, seus dados
                estão seguros.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Detalhes do Erro (apenas em desenvolvimento) */}
              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                  <h3 className="font-semibold text-red-900 text-sm">
                    Detalhes do Erro (Desenvolvimento):
                  </h3>
                  <pre className="text-xs text-red-800 overflow-auto max-h-40 font-mono">
                    {this.state.error.toString()}
                  </pre>
                  {this.state.errorInfo && (
                    <details className="text-xs text-red-700">
                      <summary className="cursor-pointer font-semibold">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 overflow-auto max-h-60">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              {/* Mensagem para usuários */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 text-sm mb-2">
                  O que você pode fazer:
                </h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Recarregue a página para tentar novamente</li>
                  <li>Volte para a página inicial</li>
                  <li>
                    Se o problema persistir, entre em contato com o suporte
                  </li>
                </ul>
              </div>

              {/* Ações */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={this.handleReload}
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Recarregar Página
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex-1"
                  variant="outline"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Início
                </Button>
              </div>

              {/* Link para Suporte */}
              <div className="text-center text-sm text-gray-600">
                <p>
                  Precisa de ajuda?{" "}
                  <a
                    href="mailto:suporte@syncads.com"
                    className="text-blue-600 hover:underline font-medium"
                  >
                    Entre em contato com o suporte
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
