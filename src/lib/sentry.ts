// ============================================
// SENTRY ERROR TRACKING
// ============================================
// Monitoramento e rastreamento de erros em produção
// ============================================

import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

export function initSentry() {
  // Só inicializar em produção
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,

      // Integrations
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay({
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],

      // Performance Monitoring
      tracesSampleRate: 0.1, // 10% das transações

      // Session Replay
      replaysSessionSampleRate: 0.1, // 10% das sessões
      replaysOnErrorSampleRate: 1.0, // 100% em caso de erro

      // Environment
      environment: import.meta.env.MODE,

      // Release tracking
      release: `syncads@${import.meta.env.VITE_APP_VERSION || "1.0.0"}`,

      // Filters
      beforeSend(event, hint) {
        // Filtrar erros de desenvolvimento
        if (event.environment === "development") {
          return null;
        }

        // Filtrar erros de extensões do navegador
        if (
          event.exception?.values?.[0]?.stacktrace?.frames?.some((frame) =>
            frame.filename?.includes("chrome-extension://"),
          )
        ) {
          return null;
        }

        // Filtrar erros conhecidos e inofensivos
        const ignoredErrors = [
          "ResizeObserver loop limit exceeded",
          "Non-Error promise rejection captured",
          "Script error",
        ];

        const errorMessage =
          event.message || hint?.originalException?.toString() || "";
        if (ignoredErrors.some((ignored) => errorMessage.includes(ignored))) {
          return null;
        }

        return event;
      },

      // Tags para categorização
      initialScope: {
        tags: {
          app: "syncads",
          type: "frontend",
        },
      },
    });

    console.log("✅ Sentry initialized");
  }
}

// ============================================
// HELPERS
// ============================================

/**
 * Captura erro manual
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (import.meta.env.PROD) {
    Sentry.captureException(error, {
      extra: context,
    });
  } else {
    console.error("Error:", error, context);
  }
}

/**
 * Captura mensagem
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = "info",
) {
  if (import.meta.env.PROD) {
    Sentry.captureMessage(message, level);
  } else {
    console.log(`[${level}]`, message);
  }
}

/**
 * Define usuário no contexto
 */
export function setUser(user: {
  id: string;
  email?: string;
  name?: string;
  organizationId?: string;
}) {
  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.name,
  });

  Sentry.setTag("organization_id", user.organizationId);
}

/**
 * Limpa usuário ao fazer logout
 */
export function clearUser() {
  Sentry.setUser(null);
}

/**
 * Adiciona breadcrumb (rastro de navegação)
 */
export function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, any>,
) {
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: "info",
  });
}

/**
 * Define contexto customizado
 */
export function setContext(name: string, context: Record<string, any>) {
  Sentry.setContext(name, context);
}

/**
 * Wrapper para funções assíncronas
 */
export async function withErrorTracking<T>(
  fn: () => Promise<T>,
  context?: Record<string, any>,
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    captureError(error as Error, context);
    throw error;
  }
}

/**
 * HOC para componentes React
 */
export const withSentry = Sentry.withErrorBoundary;

// Export para uso direto quando necessário
export { Sentry };
