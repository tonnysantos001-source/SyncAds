/**
 * TemplateRenderer — Motor de Renderização Multi-Template
 *
 * Carrega dinamicamente o template correto baseado no slug+version,
 * aplica fallback seguro e rastreia eventos via checkoutMonitor.
 *
 * Fluxo:
 * 1. Recebe slug + version (do checkout customization)
 * 2. Busca no banco (via hook) para verificar is_active
 * 3. Carrega o componente dinamicamente (React.lazy + cache)
 * 4. Aplica fallback se: não encontrado, desativado ou erro
 * 5. Renderiza com os props de tema e dados
 *
 * @version 1.0
 */

import React, { Suspense, lazy, useMemo, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { checkoutMonitor } from '@/lib/checkoutMonitor';
import { getTemplateConfig, getFallbackTemplateConfig } from '@/config/checkoutTemplateConfigs';
import {
  FALLBACK_TEMPLATE_SLUG,
  FALLBACK_TEMPLATE_VERSION,
  type TemplateRenderProps,
  type TemplateConfig,
} from '@/types/checkout.types';

// ============================================================
// DYNAMIC IMPORTS — React.lazy com cache para cada template
// Cada template é um chunk separado no bundle (code splitting)
// ============================================================

const templateLoaders: Record<string, () => Promise<{ default: React.ComponentType<TemplateRenderProps> }>> = {
  'minimal':         () => import('./templates/MinimalTemplate'),
  'high-conversion': () => import('./templates/HighConversionTemplate'),
  'tiktok':          () => import('./templates/TikTokTemplate'),
  'streamline':      () => import('./templates/StreamlineTemplate'),
  'premium':         () => import('./templates/PremiumTemplate'),
  'confianca':       () => import('./templates/ConfiancaTemplate'),
};

// Cache — evita recarregar o mesmo template durante a sessão
const templateCache = new Map<string, React.LazyExoticComponent<React.ComponentType<TemplateRenderProps>>>();

const getTemplateLazy = (slug: string): React.LazyExoticComponent<React.ComponentType<TemplateRenderProps>> | null => {
  if (templateCache.has(slug)) {
    return templateCache.get(slug)!;
  }

  const loader = templateLoaders[slug];
  if (!loader) return null;

  const LazyComponent = lazy(loader);
  templateCache.set(slug, LazyComponent);
  return LazyComponent;
};

// ============================================================
// LOADING FALLBACK — exibido enquanto o chunk carrega
// ============================================================

const TemplateLoadingFallback: React.FC = () => (
  <div
    className="min-h-screen flex items-center justify-center"
    style={{ backgroundColor: '#f9fafb' }}
  >
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      <p className="text-sm text-gray-500">Carregando checkout...</p>
    </div>
  </div>
);

// ============================================================
// ERROR BOUNDARY — captura erros durante renderização do template
// ============================================================

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  templateSlug: string;
  orderId?: string;
  onError: () => void;
}

class TemplateErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error): void {
    checkoutMonitor.templateLoadError(
      this.props.templateSlug,
      1,
      error,
      this.props.orderId,
    );
    this.props.onError();
  }

  render() {
    if (this.state.hasError) {
      return null; // onError dispara o fallback no pai
    }
    return this.props.children;
  }
}

// ============================================================
// TEMPLATE RENDERER PROPS
// ============================================================

interface TemplateRendererProps extends Omit<TemplateRenderProps, 'templateConfig'> {
  /** Slug do template selecionado pelo usuário */
  templateSlug?: string;

  /** Versão do template (versionado para compatibilidade retroativa) */
  templateVersion?: number;

  /** Se true, o template está desativado no banco (is_active = false) */
  isTemplateDisabled?: boolean;
}

// ============================================================
// TEMPLATE RENDERER — componente principal
// ============================================================

export const TemplateRenderer: React.FC<TemplateRendererProps> = ({
  templateSlug: requestedSlug = FALLBACK_TEMPLATE_SLUG,
  templateVersion: requestedVersion = FALLBACK_TEMPLATE_VERSION,
  isTemplateDisabled = false,
  orderId,
  checkoutData,
  theme,
  isPreview = false,
  onStepChange,
  onPaymentSuccess,
  customization,
  isMobile = false,
}) => {
  const isFallingBack = useRef(false);

  // ------------------------------------------------------------------
  // 1. Determinar slug efetivo (com fallback por disabled / not found)
  // ------------------------------------------------------------------

  const { effectiveSlug, effectiveVersion, templateConfig } = useMemo<{
    effectiveSlug: string;
    effectiveVersion: number;
    templateConfig: TemplateConfig;
  }>(() => {
    // Template desativado
    if (isTemplateDisabled) {
      checkoutMonitor.templateDisabled(
        requestedSlug,
        requestedVersion,
        FALLBACK_TEMPLATE_SLUG,
        orderId,
      );
      return {
        effectiveSlug: FALLBACK_TEMPLATE_SLUG,
        effectiveVersion: FALLBACK_TEMPLATE_VERSION,
        templateConfig: getFallbackTemplateConfig(),
      };
    }

    // Template não encontrado no registry estático
    const config = getTemplateConfig(requestedSlug, requestedVersion);
    if (!config) {
      checkoutMonitor.templateNotFound(
        requestedSlug,
        requestedVersion,
        FALLBACK_TEMPLATE_SLUG,
        orderId,
      );
      return {
        effectiveSlug: FALLBACK_TEMPLATE_SLUG,
        effectiveVersion: FALLBACK_TEMPLATE_VERSION,
        templateConfig: getFallbackTemplateConfig(),
      };
    }

    return {
      effectiveSlug: requestedSlug,
      effectiveVersion: requestedVersion,
      templateConfig: config,
    };
  }, [requestedSlug, requestedVersion, isTemplateDisabled, orderId]);

  // ------------------------------------------------------------------
  // 2. Log de carregamento bem-sucedido
  // ------------------------------------------------------------------

  useEffect(() => {
    if (!isFallingBack.current) {
      checkoutMonitor.templateLoaded(effectiveSlug, effectiveVersion, orderId);
    }
  }, [effectiveSlug, effectiveVersion, orderId]);

  // ------------------------------------------------------------------
  // 3. Merge de tema: defaults do template + overrides do usuário
  // ------------------------------------------------------------------

  const mergedTheme = useMemo(() => ({
    ...templateConfig.defaultThemeOverrides,
    ...theme,
  }), [templateConfig.defaultThemeOverrides, theme]);

  // ------------------------------------------------------------------
  // 4. Props para o template
  // ------------------------------------------------------------------

  const templateProps: TemplateRenderProps = {
    orderId,
    checkoutData,
    theme: mergedTheme,
    templateConfig,
    isPreview,
    onStepChange,
    onPaymentSuccess,
    customization,
    isMobile,
  };

  // ------------------------------------------------------------------
  // 5. Carregar componente lazy com error boundary
  // ------------------------------------------------------------------

  const LazyTemplate = getTemplateLazy(effectiveSlug);

  // Segurança extra: se o loader não existir, usar fallback
  if (!LazyTemplate) {
    checkoutMonitor.templateFallback(
      effectiveSlug,
      effectiveVersion,
      FALLBACK_TEMPLATE_SLUG,
      'loader_not_found',
      orderId,
    );

    const FallbackLazy = getTemplateLazy(FALLBACK_TEMPLATE_SLUG)!;
    const fallbackConfig = getFallbackTemplateConfig();

    return (
      <Suspense fallback={<TemplateLoadingFallback />}>
        <FallbackLazy {...templateProps} templateConfig={fallbackConfig} />
      </Suspense>
    );
  }

  // ------------------------------------------------------------------
  // 6. Render principal com error boundary
  // ------------------------------------------------------------------

  const handleRenderError = () => {
    isFallingBack.current = true;
    checkoutMonitor.templateFallback(
      effectiveSlug,
      effectiveVersion,
      FALLBACK_TEMPLATE_SLUG,
      'render_error',
      orderId,
    );
  };

  return (
    <TemplateErrorBoundary
      templateSlug={effectiveSlug}
      orderId={orderId}
      onError={handleRenderError}
    >
      <Suspense fallback={<TemplateLoadingFallback />}>
        <LazyTemplate {...templateProps} />
      </Suspense>
    </TemplateErrorBoundary>
  );
};

export default TemplateRenderer;
