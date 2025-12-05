import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { SyncAdsWatermarkBg } from "@/components/backgrounds/SyncAdsWatermarkBg";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const location = useLocation();

  useEffect(() => {
    try {
      console.log("🔄 [DASHBOARD] Layout montado");
      console.log("📍 [DASHBOARD] Location:", location.pathname);
    } catch (error) {
      console.error("❌ [DASHBOARD] Erro no useEffect:", error);
      setHasError(true);
      setErrorMessage(
        error instanceof Error ? error.message : "Erro no layout",
      );
    }
  }, [location]);

  // Páginas que não devem ter padding/container
  const isFullPageRoute = location.pathname === "/chat";

  // Fallback UI em caso de erro
  if (hasError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Erro no Layout
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {errorMessage || "Ocorreu um erro ao carregar o layout"}
          </p>
          <button
            onClick={() => {
              console.log("🔄 [DASHBOARD] Recarregando página...");
              window.location.reload();
            }}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Recarregar página
          </button>
        </div>
      </div>
    );
  }

  try {
    return (
      <div
        className={`flex h-screen max-h-screen relative overflow-hidden ${isFullPageRoute ? "" : "bg-gradient-to-br from-gray-900 via-gray-850 to-purple-900/40"}`}
      >
        {/* Background customizado - apenas quando NÃO for chat */}
        {!isFullPageRoute && (
          <SyncAdsWatermarkBg watermarkOpacity={0.08} variant="default" />
        )}

        {/* Sidebar com error boundary */}
        <ErrorBoundaryWrapper
          componentName="Sidebar"
          onError={(error) => {
            console.error("❌ [DASHBOARD] Erro no Sidebar:", error);
            setHasError(true);
            setErrorMessage(`Erro na barra lateral: ${error.message}`);
          }}
        >
          <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </ErrorBoundaryWrapper>

        {/* Main Content Area */}
        <div className="flex flex-col flex-1 md:ml-64 relative z-10 min-h-0 overflow-hidden">
          {/* Header com error boundary */}
          {!isFullPageRoute && (
            <ErrorBoundaryWrapper
              componentName="Header"
              onError={(error) => {
                console.error("❌ [DASHBOARD] Erro no Header:", error);
                // Não quebra o layout todo, só mostra aviso
                console.warn(
                  "⚠️ [DASHBOARD] Header não carregou, mas seguindo...",
                );
              }}
            >
              <Header setSidebarOpen={setSidebarOpen} />
            </ErrorBoundaryWrapper>
          )}

          {/* Main content */}
          <main
            className={`flex-1 min-h-0 ${isFullPageRoute ? "h-full max-h-full overflow-hidden" : "overflow-y-auto p-4 md:p-6 lg:p-8"}`}
          >
            {isFullPageRoute ? (
              <ErrorBoundaryWrapper
                componentName="FullPageContent"
                onError={(error) => {
                  console.error("❌ [DASHBOARD] Erro no conteúdo:", error);
                  setHasError(true);
                  setErrorMessage(`Erro ao carregar página: ${error.message}`);
                }}
              >
                {children}
              </ErrorBoundaryWrapper>
            ) : (
              <div className="max-w-7xl mx-auto">
                <ErrorBoundaryWrapper
                  componentName="PageContent"
                  onError={(error) => {
                    console.error("❌ [DASHBOARD] Erro no conteúdo:", error);
                    setHasError(true);
                    setErrorMessage(
                      `Erro ao carregar página: ${error.message}`,
                    );
                  }}
                >
                  {children}
                </ErrorBoundaryWrapper>
              </div>
            )}
          </main>
        </div>
      </div>
    );
  } catch (error) {
    console.error("❌ [DASHBOARD] Erro fatal ao renderizar layout:", error);
    setHasError(true);
    setErrorMessage(
      error instanceof Error ? error.message : "Erro ao renderizar layout",
    );
    return null;
  }
};

// Error Boundary Wrapper Component
interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
  componentName: string;
  onError?: (error: Error) => void;
}

class ErrorBoundaryWrapper extends React.Component<
  ErrorBoundaryWrapperProps,
  { hasError: boolean; error: Error | null }
> {
  constructor(props: ErrorBoundaryWrapperProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(
      `❌ [DASHBOARD] ${this.props.componentName} Error:`,
      error,
      errorInfo,
    );
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      // Retorna null para não quebrar o layout
      return null;
    }

    return this.props.children;
  }
}

export default DashboardLayout;
