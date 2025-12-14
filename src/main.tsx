import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { ThemeProvider } from "./components/ThemeProvider.tsx";
import { inicializarCorrecaoChatMobile } from "./lib/supabase-mobile-fix";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./lib/paste-fix"; // 🔧 Fix global de paste - garante que Ctrl+V funcione

// Criar instância do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});

// Inicializar a correção definitiva do chat mobile
inicializarCorrecaoChatMobile();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <App />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);

