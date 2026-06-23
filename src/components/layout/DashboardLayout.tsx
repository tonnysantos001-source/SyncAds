import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { SyncAdsWatermarkBg } from "@/components/backgrounds/SyncAdsWatermarkBg";
import { AlertTriangle, RefreshCw, CheckCircle, Info, X } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const location = useLocation();
  const [activePopup, setActivePopup] = useState<any>(null);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user?.id) return;

    // Conexão Supabase Realtime para capturar novas notificações do usuário
    const channel = supabase
      .channel(`dashboard-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "Notification",
          filter: `userId=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as any;
          console.log("🔔 [REALTIME POPUP] Nova notificação recebida:", newNotif);

          // Tocar som de caixa registradora se for sucesso/pedido pago
          if (
            newNotif.type === "SUCCESS" ||
            newNotif.title?.toLowerCase().includes("pago")
          ) {
            playChaChing();
          }

          setActivePopup(newNotif);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  useEffect(() => {
    if (activePopup) {
      const timer = setTimeout(() => {
        setActivePopup(null);
      }, 5500);
      return () => clearTimeout(timer);
    }
  }, [activePopup]);

  const playChaChing = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();

      // Chime metálico 1 (moeda pequena)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1500, ctx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
      gain1.gain.setValueAtTime(0.2, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.08);

      // Chime metálico 2 (chaching principal de caixa)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(2100, ctx.currentTime + 0.02);
      gain2.gain.setValueAtTime(0.0, ctx.currentTime);
      gain2.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start();
      osc2.stop(ctx.currentTime + 0.95);

      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = "sine";
      osc3.frequency.setValueAtTime(2600, ctx.currentTime + 0.02);
      gain3.gain.setValueAtTime(0.0, ctx.currentTime);
      gain3.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
      gain3.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.7);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start();
      osc3.stop(ctx.currentTime + 0.75);
    } catch (error) {
      console.warn("Audio Context blocked:", error);
    }
  };

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

  // Allow child pages (e.g. ChatPage full-screen) to open the app sidebar via CustomEvent
  useEffect(() => {
    const handler = () => setSidebarOpen(true);
    window.addEventListener('open-app-sidebar', handler);
    return () => window.removeEventListener('open-app-sidebar', handler);
  }, []);

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
        className={`flex h-[100dvh] max-h-[100dvh] relative overflow-hidden ${isFullPageRoute ? "" : "bg-gradient-to-br from-gray-900 via-gray-850 to-purple-900/40"}`}
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

        {/* Realtime Notification Popup */}
        <AnimatePresence>
          {activePopup && (
            <motion.div
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className={cn(
                "fixed bottom-6 right-6 z-50 w-96 p-4 rounded-2xl shadow-2xl border",
                "bg-slate-900/95 dark:bg-slate-950/95 text-white backdrop-blur-xl",
                activePopup.type === "SUCCESS"
                  ? "border-emerald-500/40 shadow-emerald-500/10"
                  : "border-blue-500/40 shadow-blue-500/10"
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-xl flex-shrink-0",
                  activePopup.type === "SUCCESS" ? "bg-emerald-500/20 text-emerald-400" : "bg-blue-500/20 text-blue-400"
                )}>
                  {activePopup.type === "SUCCESS" ? (
                    <CheckCircle className="h-5 w-5 animate-bounce" />
                  ) : (
                    <Info className="h-5 w-5 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold tracking-tight text-white mb-0.5">
                    {activePopup.title}
                  </p>
                  <p className="text-xs text-gray-300 leading-normal">
                    {activePopup.message}
                  </p>
                  
                  {activePopup.metadata && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1 text-[11px] text-gray-400">
                      {activePopup.metadata.products && (
                        <p>
                          <span className="font-semibold text-gray-300">Produto:</span>{" "}
                          {Array.isArray(activePopup.metadata.products)
                            ? activePopup.metadata.products.map((p: any) => p.name).join(", ")
                            : typeof activePopup.metadata.products === 'string'
                            ? activePopup.metadata.products
                            : activePopup.metadata.products.name || ""}
                        </p>
                      )}
                      {activePopup.metadata.gateway && (
                        <p>
                          <span className="font-semibold text-gray-300">Gateway:</span>{" "}
                          {activePopup.metadata.gateway}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setActivePopup(null)}
                  className="text-gray-450 hover:text-white transition-colors p-1"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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

