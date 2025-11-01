/**
 * Tema Padrão do Checkout SyncAds
 *
 * Define todas as personalizações visuais e comportamentais do checkout
 * Aplica um design moderno, profissional e conversivo
 *
 * @version 4.0
 * @date 02/02/2025
 */

export interface CheckoutTheme {
  // ========================================
  // CABEÇALHO
  // ========================================
  logoAlignment: 'left' | 'center' | 'right';
  showLogoAtTop: boolean;
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;

  // ========================================
  // CORES GERAIS
  // ========================================
  backgroundColor: string;
  backgroundGradient?: string;
  useGradient: boolean;
  textColor: string;
  headingColor: string;

  // ========================================
  // BARRA DE AVISOS
  // ========================================
  noticeBarEnabled: boolean;
  noticeBarMessage: string;
  noticeBarBackgroundColor: string;
  noticeBarTextColor: string;
  noticeBarAnimation: boolean;

  // ========================================
  // BANNER
  // ========================================
  bannerEnabled: boolean;
  bannerImage?: string;
  bannerLink?: string;
  bannerHeight?: number;

  // ========================================
  // CARRINHO
  // ========================================
  cartDisplay: 'closed' | 'open' | 'drawer';
  cartBorderColor: string;
  cartBackgroundColor: string;
  quantityCircleColor: string;
  quantityTextColor: string;
  showCartIcon: boolean;
  showCartReminder: boolean;
  allowCouponEdit: boolean;

  // ========================================
  // NAVEGAÇÃO / STEPS
  // ========================================
  navigationSteps: number;
  nextStepStyle: 'rounded' | 'square' | 'pill';
  showProgressBar: boolean;
  progressBarColor: string;
  stepActiveColor: string;
  stepInactiveColor: string;
  stepCompletedColor: string;

  // ========================================
  // BOTÕES PRIMÁRIOS
  // ========================================
  primaryButtonBackgroundColor: string;
  primaryButtonTextColor: string;
  primaryButtonBorderRadius: number;
  primaryButtonHover: boolean;
  primaryButtonHoverColor?: string;
  primaryButtonFlow: boolean;
  primaryButtonShadow: boolean;

  // ========================================
  // BOTÃO DE CHECKOUT
  // ========================================
  checkoutButtonBackgroundColor: string;
  checkoutButtonTextColor: string;
  checkoutButtonBorderRadius: number;
  checkoutButtonHover: boolean;
  checkoutButtonHoverColor?: string;
  checkoutButtonFlow: boolean;
  checkoutButtonShadow: boolean;
  checkoutButtonPulse: boolean;

  // ========================================
  // BORDAS DESTACADAS
  // ========================================
  highlightedBorderColor: string;
  highlightedBorderTextColor: string;
  highlightedBorderWidth: number;

  // ========================================
  // RODAPÉ
  // ========================================
  footerBackgroundColor: string;
  footerTextColor: string;
  showStoreName: boolean;
  showPaymentMethods: boolean;
  showCnpjCpf: boolean;
  showContactEmail: boolean;
  showAddress: boolean;
  showPhone: boolean;
  showPrivacyPolicy: boolean;
  showTermsConditions: boolean;
  showReturns: boolean;
  footerLinkColor: string;

  // ========================================
  // TAGS DE DESCONTO
  // ========================================
  discountTagTextColor: string;
  discountTagBackgroundColor: string;
  discountTagBorderRadius: number;
  discountTagFontWeight: string;

  // ========================================
  // ESCASSEZ / URGÊNCIA
  // ========================================
  useVisible: boolean;
  expirationTime: number; // em minutos
  forceRemovalTime: number; // em minutos
  showCountdownTimer: boolean;
  urgencyMessageColor: string;
  urgencyBackgroundColor: string;

  // ========================================
  // ORDER BUMP
  // ========================================
  orderBumpEnabled: boolean;
  orderBumpTextColor: string;
  orderBumpBackgroundColor: string;
  orderBumpPriceColor: string;
  orderBumpBorderColor: string;
  orderBumpBorderWidth: number;
  orderBumpBorderRadius: number;
  orderBumpButtonTextColor: string;
  orderBumpButtonBackgroundColor: string;
  orderBumpShadow: boolean;

  // ========================================
  // TIPOGRAFIA
  // ========================================
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };

  // ========================================
  // ESPAÇAMENTOS
  // ========================================
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };

  // ========================================
  // BORDAS E SOMBRAS
  // ========================================
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  boxShadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };

  // ========================================
  // FORMULÁRIOS
  // ========================================
  inputBorderColor: string;
  inputFocusBorderColor: string;
  inputBackgroundColor: string;
  inputHeight: number;
  inputBorderRadius: number;
  labelColor: string;
  labelFontWeight: string;
  placeholderColor: string;

  // ========================================
  // CARDS / SEÇÕES
  // ========================================
  cardBackgroundColor: string;
  cardBorderColor: string;
  cardBorderRadius: number;
  cardShadow: boolean;
  cardPadding: string;

  // ========================================
  // TRUST BADGES / SEGURANÇA
  // ========================================
  showTrustBadges: boolean;
  trustBadgeColor: string;
  sslBadgeEnabled: boolean;
  securityIconsEnabled: boolean;

  // ========================================
  // CONFIGURAÇÕES GERAIS
  // ========================================
  language: 'pt' | 'en' | 'es';
  currency: 'BRL' | 'USD' | 'EUR';
  presellPage: 'cart-in-cart' | 'separate';
  requestCpfOnlyAtPayment: boolean;
  requestBirthDate: boolean;
  requestGender: boolean;
  disableCarrot: boolean;

  // ========================================
  // RESPONSIVIDADE
  // ========================================
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  desktopBreakpoint: number;

  // ========================================
  // ANIMAÇÕES
  // ========================================
  enableAnimations: boolean;
  animationDuration: string;
  animationTiming: string;

  // ========================================
  // ACESSIBILIDADE
  // ========================================
  highContrast: boolean;
  focusIndicatorColor: string;
  reducedMotion: boolean;
}

/**
 * Tema Padrão Moderno e Profissional
 * Design baseado em pesquisas de conversão e UX
 */
export const DEFAULT_CHECKOUT_THEME: CheckoutTheme = {
  // ========================================
  // CABEÇALHO
  // ========================================
  logoAlignment: 'left',
  showLogoAtTop: true,
  logoWidth: 180,
  logoHeight: 50,

  // ========================================
  // CORES GERAIS
  // ========================================
  backgroundColor: '#F9FAFB', // Cinza ultra claro
  backgroundGradient: 'linear-gradient(180deg, #F9FAFB 0%, #F3F4F6 100%)',
  useGradient: false,
  textColor: '#1F2937', // Cinza escuro
  headingColor: '#111827', // Quase preto

  // ========================================
  // BARRA DE AVISOS
  // ========================================
  noticeBarEnabled: true,
  noticeBarMessage: '🎉 FRETE GRÁTIS para todo o Brasil em compras acima de R$ 199!',
  noticeBarBackgroundColor: '#1F2937', // Cinza muito escuro
  noticeBarTextColor: '#FFFFFF',
  noticeBarAnimation: true,

  // ========================================
  // BANNER
  // ========================================
  bannerEnabled: false,
  bannerHeight: 200,

  // ========================================
  // CARRINHO
  // ========================================
  cartDisplay: 'drawer',
  cartBorderColor: '#E5E7EB',
  cartBackgroundColor: '#FFFFFF',
  quantityCircleColor: '#8B5CF6', // Roxo
  quantityTextColor: '#FFFFFF',
  showCartIcon: true,
  showCartReminder: true,
  allowCouponEdit: true,

  // ========================================
  // NAVEGAÇÃO / STEPS
  // ========================================
  navigationSteps: 3,
  nextStepStyle: 'rounded',
  showProgressBar: true,
  progressBarColor: '#8B5CF6', // Roxo
  stepActiveColor: '#8B5CF6', // Roxo
  stepInactiveColor: '#D1D5DB', // Cinza claro
  stepCompletedColor: '#10B981', // Verde

  // ========================================
  // BOTÕES PRIMÁRIOS
  // ========================================
  primaryButtonBackgroundColor: '#8B5CF6', // Roxo vibrante
  primaryButtonTextColor: '#FFFFFF',
  primaryButtonBorderRadius: 12,
  primaryButtonHover: true,
  primaryButtonHoverColor: '#7C3AED', // Roxo mais escuro
  primaryButtonFlow: true,
  primaryButtonShadow: true,

  // ========================================
  // BOTÃO DE CHECKOUT
  // ========================================
  checkoutButtonBackgroundColor: '#10B981', // Verde sucesso
  checkoutButtonTextColor: '#FFFFFF',
  checkoutButtonBorderRadius: 14,
  checkoutButtonHover: true,
  checkoutButtonHoverColor: '#059669', // Verde mais escuro
  checkoutButtonFlow: true,
  checkoutButtonShadow: true,
  checkoutButtonPulse: true,

  // ========================================
  // BORDAS DESTACADAS
  // ========================================
  highlightedBorderColor: '#8B5CF6',
  highlightedBorderTextColor: '#FFFFFF',
  highlightedBorderWidth: 2,

  // ========================================
  // RODAPÉ
  // ========================================
  footerBackgroundColor: '#F3F4F6',
  footerTextColor: '#6B7280',
  showStoreName: true,
  showPaymentMethods: true,
  showCnpjCpf: true,
  showContactEmail: true,
  showAddress: true,
  showPhone: true,
  showPrivacyPolicy: true,
  showTermsConditions: true,
  showReturns: true,
  footerLinkColor: '#8B5CF6',

  // ========================================
  // TAGS DE DESCONTO
  // ========================================
  discountTagTextColor: '#FFFFFF',
  discountTagBackgroundColor: '#EF4444', // Vermelho vivo
  discountTagBorderRadius: 6,
  discountTagFontWeight: '700',

  // ========================================
  // ESCASSEZ / URGÊNCIA
  // ========================================
  useVisible: true,
  expirationTime: 60, // 1 hora
  forceRemovalTime: 90, // 1.5 horas
  showCountdownTimer: true,
  urgencyMessageColor: '#DC2626', // Vermelho
  urgencyBackgroundColor: '#FEE2E2', // Vermelho claro

  // ========================================
  // ORDER BUMP
  // ========================================
  orderBumpEnabled: true,
  orderBumpTextColor: '#374151',
  orderBumpBackgroundColor: '#FFFBEB', // Amarelo claro
  orderBumpPriceColor: '#DC2626', // Vermelho
  orderBumpBorderColor: '#FCD34D', // Amarelo
  orderBumpBorderWidth: 2,
  orderBumpBorderRadius: 12,
  orderBumpButtonTextColor: '#FFFFFF',
  orderBumpButtonBackgroundColor: '#EF4444', // Vermelho
  orderBumpShadow: true,

  // ========================================
  // TIPOGRAFIA
  // ========================================
  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },

  // ========================================
  // ESPAÇAMENTOS
  // ========================================
  spacing: {
    xs: '0.25rem',  // 4px
    sm: '0.5rem',   // 8px
    md: '1rem',     // 16px
    lg: '1.5rem',   // 24px
    xl: '2rem',     // 32px
    '2xl': '3rem',  // 48px
  },

  // ========================================
  // BORDAS E SOMBRAS
  // ========================================
  borderRadius: {
    sm: '0.375rem',   // 6px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    full: '9999px',
  },
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  // ========================================
  // FORMULÁRIOS
  // ========================================
  inputBorderColor: '#D1D5DB',
  inputFocusBorderColor: '#8B5CF6', // Roxo
  inputBackgroundColor: '#FFFFFF',
  inputHeight: 48,
  inputBorderRadius: 10,
  labelColor: '#374151',
  labelFontWeight: '600',
  placeholderColor: '#9CA3AF',

  // ========================================
  // CARDS / SEÇÕES
  // ========================================
  cardBackgroundColor: '#FFFFFF',
  cardBorderColor: '#E5E7EB',
  cardBorderRadius: 16,
  cardShadow: true,
  cardPadding: '1.5rem',

  // ========================================
  // TRUST BADGES / SEGURANÇA
  // ========================================
  showTrustBadges: true,
  trustBadgeColor: '#10B981', // Verde
  sslBadgeEnabled: true,
  securityIconsEnabled: true,

  // ========================================
  // CONFIGURAÇÕES GERAIS
  // ========================================
  language: 'pt',
  currency: 'BRL',
  presellPage: 'cart-in-cart',
  requestCpfOnlyAtPayment: false,
  requestBirthDate: false,
  requestGender: false,
  disableCarrot: false,

  // ========================================
  // RESPONSIVIDADE
  // ========================================
  mobileBreakpoint: 640,   // sm
  tabletBreakpoint: 1024,  // lg
  desktopBreakpoint: 1280, // xl

  // ========================================
  // ANIMAÇÕES
  // ========================================
  enableAnimations: true,
  animationDuration: '300ms',
  animationTiming: 'cubic-bezier(0.4, 0, 0.2, 1)', // ease-out

  // ========================================
  // ACESSIBILIDADE
  // ========================================
  highContrast: false,
  focusIndicatorColor: '#8B5CF6',
  reducedMotion: false,
};

/**
 * Tema Alternativo: Dark Mode
 */
export const DARK_CHECKOUT_THEME: Partial<CheckoutTheme> = {
  backgroundColor: '#111827',
  textColor: '#F3F4F6',
  headingColor: '#FFFFFF',
  cardBackgroundColor: '#1F2937',
  inputBackgroundColor: '#374151',
  inputBorderColor: '#4B5563',
  footerBackgroundColor: '#1F2937',
  noticeBarBackgroundColor: '#8B5CF6',
};

/**
 * Tema Alternativo: Minimalista
 */
export const MINIMAL_CHECKOUT_THEME: Partial<CheckoutTheme> = {
  backgroundColor: '#FFFFFF',
  cardBackgroundColor: '#FFFFFF',
  primaryButtonBackgroundColor: '#000000',
  checkoutButtonBackgroundColor: '#000000',
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  borderRadius: {
    sm: '0',
    md: '0',
    lg: '4px',
    xl: '4px',
    full: '0',
  },
};

/**
 * Tema Alternativo: E-commerce Vibrante
 */
export const VIBRANT_CHECKOUT_THEME: Partial<CheckoutTheme> = {
  backgroundColor: '#FEF3C7', // Amarelo claro
  primaryButtonBackgroundColor: '#F59E0B', // Laranja
  checkoutButtonBackgroundColor: '#10B981', // Verde
  noticeBarBackgroundColor: '#EF4444', // Vermelho
  quantityCircleColor: '#F59E0B',
};

/**
 * Aplicar tema customizado com fallback para padrão
 */
export function applyTheme(customTheme?: Partial<CheckoutTheme>): CheckoutTheme {
  return {
    ...DEFAULT_CHECKOUT_THEME,
    ...customTheme,
  };
}

/**
 * Gerar CSS Variables a partir do tema
 */
export function generateCSSVariables(theme: CheckoutTheme): Record<string, string> {
  return {
    '--color-background': theme.backgroundColor,
    '--color-text': theme.textColor,
    '--color-heading': theme.headingColor,
    '--color-primary': theme.primaryButtonBackgroundColor,
    '--color-primary-text': theme.primaryButtonTextColor,
    '--color-checkout': theme.checkoutButtonBackgroundColor,
    '--color-checkout-text': theme.checkoutButtonTextColor,
    '--font-family': theme.fontFamily,
    '--border-radius-sm': theme.borderRadius.sm,
    '--border-radius-md': theme.borderRadius.md,
    '--border-radius-lg': theme.borderRadius.lg,
    '--spacing-md': theme.spacing.md,
    '--input-height': `${theme.inputHeight}px`,
    '--input-border': theme.inputBorderColor,
    '--input-focus-border': theme.inputFocusBorderColor,
    '--card-background': theme.cardBackgroundColor,
    '--card-border': theme.cardBorderColor,
    '--footer-background': theme.footerBackgroundColor,
    '--footer-text': theme.footerTextColor,
  };
}

/**
 * Exportar tipos
 */
export type { CheckoutTheme };
