/**
 * Checkout Types — SyncAds AI Multi-Template System
 *
 * Tipos centrais para o sistema de múltiplos templates de checkout.
 * Todas as constantes, interfaces e enums necessários para:
 * - Definição de blocos de checkout
 * - Configuração de templates
 * - Monitoramento e logging
 *
 * @version 1.0
 */

// ============================================================
// BLOCOS DE CHECKOUT — enum fortemente tipado
// Substitui o uso de string[] soltas em qualquer lugar do código
// ============================================================

export const CHECKOUT_BLOCKS = {
  // Formulários
  CUSTOMER:     'CUSTOMER',     // Dados pessoais / Informações de contato
  SHIPPING:     'SHIPPING',     // Endereço de entrega
  PAYMENT:      'PAYMENT',      // Forma de pagamento

  // Resumo
  SUMMARY:      'SUMMARY',      // Resumo do pedido (cart sidebar)

  // Conversão / Urgência
  SCARCITY:     'SCARCITY',     // Countdown / timer de escassez
  ORDER_BUMP:   'ORDER_BUMP',   // Oferta adicional no checkout
  NOTICE_BAR:   'NOTICE_BAR',   // Barra de aviso no topo

  // Confiança / Social proof
  TESTIMONIALS: 'TESTIMONIALS', // Depoimentos de clientes
  GUARANTEE:    'GUARANTEE',    // Garantia / selo de segurança
  BENEFITS:     'BENEFITS',     // Frete grátis, entrega rápida etc.
  FAQ:          'FAQ',          // Perguntas frequentes integradas

  // Visual / Branding
  BANNER:       'BANNER',       // Banner hero / produto showcase
} as const;

export type CheckoutBlockKey = typeof CHECKOUT_BLOCKS[keyof typeof CHECKOUT_BLOCKS];

// ============================================================
// LAYOUT TYPES — arquiteturas dos templates
// ============================================================

export type CheckoutLayoutType =
  | 'stepped'                      // Minimalista: etapas bloqueadas progressivas
  | 'single-page'                  // Alto Impacto: tudo visível numa página
  | 'two-column'                   // Premium & Confiança: left form + right summary
  | 'two-column-payment-right'     // TikTok: pagamento na coluna direita
  | 'split-stepper';               // Streamline: LEFT=step1+2, RIGHT=step3 always visible

// ============================================================
// TEMPLATE CONFIG — configuração completa de um template
// ============================================================

export interface TemplateBreakpoints {
  mobile: number;
  tablet: number;
  desktop: number;
  mobileLayout: 'stacked' | 'grid';
  hideSidebarOnMobile: boolean;
  stackOrderOnMobile: CheckoutBlockKey[];
}

export interface TemplateConfig {
  /** Identificador único do template — deve bater com o banco */
  slug: string;

  /** Versão do template — checksouts existentes são versionados */
  version: number;

  /** Nome amigável exibido no builder */
  name: string;

  /** Overrides de tema padrão para este template */
  defaultThemeOverrides: Record<string, unknown>;

  /** Blocos suportados por este template */
  supportedBlocks: CheckoutBlockKey[];

  /** Ordem padrão dos blocos no desktop */
  defaultBlockOrder: CheckoutBlockKey[];

  /** Visibilidade padrão de cada bloco */
  defaultSectionVisibility: Partial<Record<CheckoutBlockKey, boolean>>;

  /** Tipo de layout arquitetural */
  layoutType: CheckoutLayoutType;

  /** Responsividade otimizada */
  mobileOptimized: boolean;

  /** Breakpoints e ordem mobile */
  breakpoints: TemplateBreakpoints;

  /** Funcionalidades de conversão ativas */
  conversionFeatures: string[];
}

// ============================================================
// MONITOR EVENTS — eventos rastreados pelo checkoutMonitor
// ============================================================

export type CheckoutMonitorEventType =
  | 'TEMPLATE_LOAD'
  | 'TEMPLATE_LOAD_ERROR'
  | 'TEMPLATE_DISABLED'
  | 'TEMPLATE_FALLBACK'
  | 'TEMPLATE_NOT_FOUND'
  | 'TEMPLATE_VERSION_MISMATCH'
  | 'STEP_ADVANCE'
  | 'STEP_BACK'
  | 'PAYMENT_ATTEMPT'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_ERROR'
  | 'ORDER_BUMP_ADDED'
  | 'COUPON_APPLIED'
  | 'CHECKOUT_ABANDONED';

export interface CheckoutMonitorEvent {
  type: CheckoutMonitorEventType;
  templateSlug?: string;
  templateVersion?: number;
  fallbackSlug?: string;
  orderId?: string;
  step?: number;
  metadata?: Record<string, unknown>;
  timestamp: number;
  sessionId?: string;
}

// ============================================================
// TEMPLATE REGISTRY — mapa de todos os templates disponíveis
// ============================================================

export interface TemplateRegistryEntry {
  slug: string;
  version: number;
  name: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  config: Record<string, unknown>;
  thumbnailUrl?: string;
}

// ============================================================
// CHECKOUT CUSTOMIZATION — estado completo do checkout
// ============================================================

export interface CheckoutCustomizationState {
  templateSlug: string;
  templateVersion: number;
  theme: Record<string, unknown>;
  blockOrder: CheckoutBlockKey[];
  sectionVisibility: Partial<Record<CheckoutBlockKey, boolean>>;
  customConfig?: Record<string, unknown>;
}

// ============================================================
// TEMPLATE RENDER PROPS — props passadas para todo template
// ============================================================

export interface TemplateRenderProps {
  /** ID do pedido */
  orderId?: string;

  /** Dados do pedido */
  checkoutData?: CheckoutData;

  /** Tema mesclado (default + overrides do usuário) */
  theme: Record<string, unknown>;

  /** Config do template */
  templateConfig: TemplateConfig;

  /** Modo preview (sem handlers de pagamento real) */
  isPreview?: boolean;

  /** Identifica se é dispositivo móvel (passado pelo PublicCheckoutPage) */
  isMobile?: boolean;

  /** Callbacks de progresso de etapa */
  onStepChange?: (step: number) => void;

  /** Callback de pagamento */
  onPaymentSuccess?: (orderId: string) => void;

  /** Customização atual */
  customization?: CheckoutCustomizationState;
}

// ============================================================
// CHECKOUT DATA — dados do pedido carregados da API
// ============================================================

export interface CheckoutProduct {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: string;
}

export interface CheckoutData {
  orderId: string;
  products: CheckoutProduct[];
  total: number;
  subtotal: number;
  shipping: number;
  discount?: number;
  coupon?: string;
}

// ============================================================
// FALLBACK CONSTANTS
// ============================================================

export const FALLBACK_TEMPLATE_SLUG = 'minimal';
export const FALLBACK_TEMPLATE_VERSION = 1;

/** Chave usada para referenciar o fallback */
export const FALLBACK_TEMPLATE_REF = `${FALLBACK_TEMPLATE_SLUG}@${FALLBACK_TEMPLATE_VERSION}` as const;
