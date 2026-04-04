/**
 * Template Configs — SyncAds AI Multi-Template System
 *
 * Definições estáticas de todos os 6 templates de checkout.
 * Serve como fonte de verdade no frontend (complementa o banco de dados).
 *
 * @version 1.0
 */

import {
  CHECKOUT_BLOCKS,
  FALLBACK_TEMPLATE_SLUG,
  FALLBACK_TEMPLATE_VERSION,
  type TemplateConfig,
} from '@/types/checkout.types';

// ============================================================
// TEMPLATE 1: MINIMALISTA
// ============================================================

export const MinimalTemplateConfig: TemplateConfig = {
  slug: 'minimal',
  version: 1,
  name: 'Minimalista',
  layoutType: 'stepped',
  mobileOptimized: true,

  defaultThemeOverrides: {
    primaryColor: '#111827',
    buttonColor: '#111827',
    buttonTextColor: '#ffffff',
    buttonBorderRadius: '8px',
    scarcityBarBgColor: '#111827',
    scarcityBarTextColor: '#ffffff',
    backgroundColor: '#ffffff',
    cardBackgroundColor: '#ffffff',
    stepperLayout: 'vertical',
    stepLocking: true,
    headerEnabled: true,
  },

  supportedBlocks: [
    CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    CHECKOUT_BLOCKS.SUMMARY, CHECKOUT_BLOCKS.SCARCITY, CHECKOUT_BLOCKS.ORDER_BUMP,
    CHECKOUT_BLOCKS.BANNER, CHECKOUT_BLOCKS.TESTIMONIALS, CHECKOUT_BLOCKS.GUARANTEE,
    CHECKOUT_BLOCKS.FAQ, CHECKOUT_BLOCKS.NOTICE_BAR,
  ],

  defaultBlockOrder: [
    CHECKOUT_BLOCKS.BANNER, CHECKOUT_BLOCKS.SCARCITY,
    CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    CHECKOUT_BLOCKS.SUMMARY,
  ],

  defaultSectionVisibility: {
    [CHECKOUT_BLOCKS.SCARCITY]:     true,
    [CHECKOUT_BLOCKS.BANNER]:       false,
    [CHECKOUT_BLOCKS.ORDER_BUMP]:   false,
    [CHECKOUT_BLOCKS.TESTIMONIALS]: false,
    [CHECKOUT_BLOCKS.GUARANTEE]:    false,
    [CHECKOUT_BLOCKS.FAQ]:          false,
    [CHECKOUT_BLOCKS.NOTICE_BAR]:   false,
  },

  breakpoints: {
    mobile: 768, tablet: 1024, desktop: 1280,
    mobileLayout: 'stacked',
    hideSidebarOnMobile: true,
    stackOrderOnMobile: [
      CHECKOUT_BLOCKS.BANNER, CHECKOUT_BLOCKS.SCARCITY,
      CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    ],
  },

  conversionFeatures: ['scarcity-timer', 'step-locking', 'coupon-field'],
};

// ============================================================
// TEMPLATE 2: ALTO IMPACTO
// ============================================================

export const HighConversionTemplateConfig: TemplateConfig = {
  slug: 'high-conversion',
  version: 1,
  name: 'Alto Impacto',
  layoutType: 'single-page',
  mobileOptimized: true,

  defaultThemeOverrides: {
    primaryColor: '#1766DC',
    buttonColor: '#1766DC',
    buttonTextColor: '#ffffff',
    buttonBorderRadius: '9999px',
    buttonIcon: 'lock',
    headerBgColor: '#0A1628',
    headerTextColor: '#ffffff',
    scarcityBarBgColor: '#1766DC',
    scarcityBarTextColor: '#ffffff',
    backgroundColor: '#f8fafc',
    stepLocking: false,
    freeShippingBannerEnabled: true,
  },

  supportedBlocks: [
    CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    CHECKOUT_BLOCKS.SUMMARY, CHECKOUT_BLOCKS.SCARCITY, CHECKOUT_BLOCKS.ORDER_BUMP,
    CHECKOUT_BLOCKS.BANNER, CHECKOUT_BLOCKS.TESTIMONIALS, CHECKOUT_BLOCKS.GUARANTEE,
    CHECKOUT_BLOCKS.BENEFITS, CHECKOUT_BLOCKS.FAQ, CHECKOUT_BLOCKS.NOTICE_BAR,
  ],

  defaultBlockOrder: [
    CHECKOUT_BLOCKS.SCARCITY, CHECKOUT_BLOCKS.CUSTOMER,
    CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT, CHECKOUT_BLOCKS.SUMMARY,
  ],

  defaultSectionVisibility: {
    [CHECKOUT_BLOCKS.SCARCITY]:     true,
    [CHECKOUT_BLOCKS.ORDER_BUMP]:   false,
    [CHECKOUT_BLOCKS.BANNER]:       false,
    [CHECKOUT_BLOCKS.TESTIMONIALS]: false,
    [CHECKOUT_BLOCKS.GUARANTEE]:    false,
    [CHECKOUT_BLOCKS.FAQ]:          false,
    [CHECKOUT_BLOCKS.NOTICE_BAR]:   false,
  },

  breakpoints: {
    mobile: 768, tablet: 1024, desktop: 1280,
    mobileLayout: 'stacked',
    hideSidebarOnMobile: true,
    stackOrderOnMobile: [
      CHECKOUT_BLOCKS.SCARCITY, CHECKOUT_BLOCKS.CUSTOMER,
      CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    ],
  },

  conversionFeatures: ['scarcity-timer', 'lock-button', 'frete-destaque', 'coupon-field'],
};

// ============================================================
// TEMPLATE 3: TIKTOK / TOKVEX
// ============================================================

export const TikTokTemplateConfig: TemplateConfig = {
  slug: 'tiktok',
  version: 1,
  name: 'Estilo TikTok',
  layoutType: 'two-column-payment-right',
  mobileOptimized: true,

  defaultThemeOverrides: {
    primaryColor: '#E91E8C',
    buttonColor: '#E91E8C',
    buttonGradient: 'linear-gradient(135deg, #E91E8C, #FF4559)',
    buttonTextColor: '#ffffff',
    buttonBorderRadius: '9999px',
    scarcityBarBgGradient: 'linear-gradient(135deg, #E91E8C, #FF4559)',
    scarcityBarTextColor: '#ffffff',
    backgroundColor: '#ffffff',
    paymentColumnPosition: 'right',
    addressCollapsibleMobile: true,
    cpfSeparateSection: true,
    applePayEnabled: true,
    buttonShowAmount: true,
  },

  supportedBlocks: [
    CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    CHECKOUT_BLOCKS.SUMMARY, CHECKOUT_BLOCKS.SCARCITY, CHECKOUT_BLOCKS.ORDER_BUMP,
    CHECKOUT_BLOCKS.BANNER, CHECKOUT_BLOCKS.GUARANTEE, CHECKOUT_BLOCKS.NOTICE_BAR,
  ],

  defaultBlockOrder: [
    CHECKOUT_BLOCKS.SCARCITY, CHECKOUT_BLOCKS.CUSTOMER,
    CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT, CHECKOUT_BLOCKS.SUMMARY,
  ],

  defaultSectionVisibility: {
    [CHECKOUT_BLOCKS.SCARCITY]:   true,
    [CHECKOUT_BLOCKS.ORDER_BUMP]: false,
    [CHECKOUT_BLOCKS.BANNER]:     false,
    [CHECKOUT_BLOCKS.GUARANTEE]:  false,
    [CHECKOUT_BLOCKS.NOTICE_BAR]: false,
  },

  breakpoints: {
    mobile: 768, tablet: 1024, desktop: 1280,
    mobileLayout: 'stacked',
    hideSidebarOnMobile: true,
    stackOrderOnMobile: [
      CHECKOUT_BLOCKS.SCARCITY, CHECKOUT_BLOCKS.CUSTOMER,
      CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    ],
  },

  conversionFeatures: [
    'scarcity-timer', 'apple-pay', 'collapsible-address',
    'payment-right-column', 'button-shows-amount', 'coupon-field',
  ],
};

// ============================================================
// TEMPLATE 4: STREAMLINE
// ============================================================

export const StreamlineTemplateConfig: TemplateConfig = {
  slug: 'streamline',
  version: 1,
  name: 'Streamline',
  layoutType: 'split-stepper',
  mobileOptimized: true,

  defaultThemeOverrides: {
    primaryColor: '#E60000',
    buttonColor: '#E60000',
    buttonTextColor: '#ffffff',
    buttonBorderRadius: '6px',
    scarcityBarBgColor: '#E60000',
    scarcityBarTextColor: '#ffffff',
    backgroundColor: '#f5f5f5',
    paymentColumnPosition: 'right-always-visible',
    heroBannerEnabled: true,
    benefitsCardEnabled: true,
    benefitsItems: ['frete-gratis', 'entrega-rapida'],
    completedStepSummaryEnabled: true,
    testimonialsOnMobileEnabled: true,
    cardVisualEnabled: true,
    stepperLayout: 'vertical-desktop-horizontal-mobile',
    stepLocking: true,
    siteSeguroBadgeStyle: 'filled-red',
  },

  supportedBlocks: [
    CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    CHECKOUT_BLOCKS.SUMMARY, CHECKOUT_BLOCKS.SCARCITY, CHECKOUT_BLOCKS.BANNER,
    CHECKOUT_BLOCKS.TESTIMONIALS, CHECKOUT_BLOCKS.ORDER_BUMP, CHECKOUT_BLOCKS.GUARANTEE,
    CHECKOUT_BLOCKS.BENEFITS, CHECKOUT_BLOCKS.FAQ, CHECKOUT_BLOCKS.NOTICE_BAR,
  ],

  defaultBlockOrder: [
    CHECKOUT_BLOCKS.BANNER, CHECKOUT_BLOCKS.SCARCITY,
    CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.SHIPPING,
    CHECKOUT_BLOCKS.PAYMENT, CHECKOUT_BLOCKS.BENEFITS,
    CHECKOUT_BLOCKS.TESTIMONIALS, CHECKOUT_BLOCKS.SUMMARY,
  ],

  defaultSectionVisibility: {
    [CHECKOUT_BLOCKS.BANNER]:       true,
    [CHECKOUT_BLOCKS.SCARCITY]:     true,
    [CHECKOUT_BLOCKS.BENEFITS]:     true,
    [CHECKOUT_BLOCKS.TESTIMONIALS]: true,
    [CHECKOUT_BLOCKS.ORDER_BUMP]:   false,
    [CHECKOUT_BLOCKS.GUARANTEE]:    false,
    [CHECKOUT_BLOCKS.FAQ]:          false,
    [CHECKOUT_BLOCKS.NOTICE_BAR]:   false,
  },

  breakpoints: {
    mobile: 768, tablet: 1024, desktop: 1280,
    mobileLayout: 'stacked',
    hideSidebarOnMobile: true,
    stackOrderOnMobile: [
      CHECKOUT_BLOCKS.BANNER, CHECKOUT_BLOCKS.SUMMARY,
      CHECKOUT_BLOCKS.TESTIMONIALS, CHECKOUT_BLOCKS.SCARCITY,
      CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.SHIPPING,
      CHECKOUT_BLOCKS.PAYMENT, CHECKOUT_BLOCKS.BENEFITS,
    ],
  },

  conversionFeatures: [
    'scarcity-timer', 'hero-banner', 'split-stepper',
    'benefits-card-persistent', 'card-visual-graphic',
    'testimonials-before-form-mobile', 'step-locking',
    'back-button-step', 'coupon-field',
  ],
};

// ============================================================
// TEMPLATE 5: CHECKOUT PREMIUM
// ============================================================

export const PremiumTemplateConfig: TemplateConfig = {
  slug: 'premium',
  version: 1,
  name: 'Checkout Premium',
  layoutType: 'two-column',
  mobileOptimized: true,

  defaultThemeOverrides: {
    primaryColor: '#10B981',
    buttonColor: '#10B981',
    buttonTextColor: '#ffffff',
    buttonBorderRadius: '8px',
    buttonIcon: 'lock',
    headerEnabled: false,
    scarcityBarFullWidth: false,
    scarcityBarBgColor: '#f3f4f6',
    scarcityBarTextColor: '#374151',
    backgroundColor: '#ffffff',
    cardBackgroundColor: '#ffffff',
    totalPrefix: 'BRL',
    summaryAmountColor: '#10B981',
    siteSeguroBadgeStyle: 'dot-green',
  },

  supportedBlocks: [
    CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    CHECKOUT_BLOCKS.SUMMARY, CHECKOUT_BLOCKS.SCARCITY, CHECKOUT_BLOCKS.ORDER_BUMP,
    CHECKOUT_BLOCKS.GUARANTEE, CHECKOUT_BLOCKS.FAQ, CHECKOUT_BLOCKS.NOTICE_BAR,
  ],

  defaultBlockOrder: [
    CHECKOUT_BLOCKS.SCARCITY, CHECKOUT_BLOCKS.CUSTOMER,
    CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT, CHECKOUT_BLOCKS.SUMMARY,
  ],

  defaultSectionVisibility: {
    [CHECKOUT_BLOCKS.SCARCITY]:   true,
    [CHECKOUT_BLOCKS.ORDER_BUMP]: false,
    [CHECKOUT_BLOCKS.GUARANTEE]:  false,
    [CHECKOUT_BLOCKS.FAQ]:        false,
    [CHECKOUT_BLOCKS.NOTICE_BAR]: false,
  },

  breakpoints: {
    mobile: 768, tablet: 1024, desktop: 1280,
    mobileLayout: 'stacked',
    hideSidebarOnMobile: true,
    stackOrderOnMobile: [
      CHECKOUT_BLOCKS.SUMMARY, CHECKOUT_BLOCKS.SCARCITY,
      CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    ],
  },

  conversionFeatures: [
    'subtle-scarcity-timer', 'green-cta-button', 'brl-total-prefix',
    'no-header', 'coupon-field', 'mobile-summary-accordion',
  ],
};

// ============================================================
// TEMPLATE 6: CHECKOUT CONFIANÇA
// ============================================================

export const ConfiancaTemplateConfig: TemplateConfig = {
  slug: 'confianca',
  version: 1,
  name: 'Checkout Confiança',
  layoutType: 'two-column',
  mobileOptimized: true,

  defaultThemeOverrides: {
    primaryColor: '#8DC63F',
    buttonColor: '#8DC63F',
    buttonTextColor: '#ffffff',
    buttonBorderRadius: '8px',
    buttonText: 'Ir para Entrega',
    headerBgColor: '#ffffff',
    securityBadgeColor: '#8DC63F',
    heroBannerEnabled: true,
    heroBannerType: 'product-showcase',
    heroBannerBgColor: '#8DC63F',
    scarcityEnabled: false,
    backgroundColor: '#f0f7e6',
    cardBackgroundColor: '#ffffff',
    totalColor: '#8DC63F',
    benefitsCardEnabled: true,
    benefitsItems: ['frete-gratis', 'compra-segura', 'entrega-rapida'],
    faqEnabled: true,
    faqPosition: 'below-form',
    testimonialsEnabled: true,
    testimonialsWithAvatar: true,
    formTitle: 'Dados pessoais',
    stepperLayout: 'horizontal-always',
    siteSeguroBadgeStyle: 'filled-green',
    siteSeguroBadgeColor: '#8DC63F',
    stepLocking: true,
  },

  supportedBlocks: [
    CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    CHECKOUT_BLOCKS.SUMMARY, CHECKOUT_BLOCKS.SCARCITY, CHECKOUT_BLOCKS.BANNER,
    CHECKOUT_BLOCKS.TESTIMONIALS, CHECKOUT_BLOCKS.ORDER_BUMP, CHECKOUT_BLOCKS.GUARANTEE,
    CHECKOUT_BLOCKS.BENEFITS, CHECKOUT_BLOCKS.FAQ, CHECKOUT_BLOCKS.NOTICE_BAR,
  ],

  defaultBlockOrder: [
    CHECKOUT_BLOCKS.BANNER, CHECKOUT_BLOCKS.CUSTOMER,
    CHECKOUT_BLOCKS.FAQ, CHECKOUT_BLOCKS.SHIPPING,
    CHECKOUT_BLOCKS.PAYMENT, CHECKOUT_BLOCKS.SUMMARY,
    CHECKOUT_BLOCKS.TESTIMONIALS, CHECKOUT_BLOCKS.BENEFITS,
  ],

  defaultSectionVisibility: {
    [CHECKOUT_BLOCKS.BANNER]:       true,
    [CHECKOUT_BLOCKS.FAQ]:          true,
    [CHECKOUT_BLOCKS.BENEFITS]:     true,
    [CHECKOUT_BLOCKS.TESTIMONIALS]: true,
    [CHECKOUT_BLOCKS.SCARCITY]:     false,
    [CHECKOUT_BLOCKS.ORDER_BUMP]:   false,
    [CHECKOUT_BLOCKS.GUARANTEE]:    false,
    [CHECKOUT_BLOCKS.NOTICE_BAR]:   false,
  },

  breakpoints: {
    mobile: 768, tablet: 1024, desktop: 1280,
    mobileLayout: 'stacked',
    hideSidebarOnMobile: true,
    stackOrderOnMobile: [
      CHECKOUT_BLOCKS.BANNER, CHECKOUT_BLOCKS.SUMMARY,
      CHECKOUT_BLOCKS.TESTIMONIALS, CHECKOUT_BLOCKS.BENEFITS,
      CHECKOUT_BLOCKS.CUSTOMER, CHECKOUT_BLOCKS.FAQ,
      CHECKOUT_BLOCKS.SHIPPING, CHECKOUT_BLOCKS.PAYMENT,
    ],
  },

  conversionFeatures: [
    'product-showcase-banner', 'built-in-faq', 'testimonials-with-avatar',
    'three-item-benefits', 'no-scarcity-by-default', 'custom-cta-text',
    'lime-green-identity', 'horizontal-stepper-always', 'step-locking',
    'security-badge-in-header',
  ],
};

// ============================================================
// REGISTRY — mapa de todos os templates por slug@version
// ============================================================

export const TEMPLATE_CONFIGS: Record<string, TemplateConfig> = {
  [`minimal@1`]:          MinimalTemplateConfig,
  [`high-conversion@1`]:  HighConversionTemplateConfig,
  [`tiktok@1`]:           TikTokTemplateConfig,
  [`streamline@1`]:       StreamlineTemplateConfig,
  [`premium@1`]:          PremiumTemplateConfig,
  [`confianca@1`]:        ConfiancaTemplateConfig,
};

/** Retorna a config de um template pelo slug e versão */
export const getTemplateConfig = (slug: string, version: number = 1): TemplateConfig | null => {
  return TEMPLATE_CONFIGS[`${slug}@${version}`] ?? null;
};

/** Retorna o fallback template config */
export const getFallbackTemplateConfig = (): TemplateConfig =>
  TEMPLATE_CONFIGS[`${FALLBACK_TEMPLATE_SLUG}@${FALLBACK_TEMPLATE_VERSION}`]!;

/** Lista todos os templates disponíveis */
export const getAllTemplateConfigs = (): TemplateConfig[] =>
  Object.values(TEMPLATE_CONFIGS);
