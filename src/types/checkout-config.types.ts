/**
 * CheckoutConfig — Schema de Configuração Canônico do Checkout
 *
 * Esta é a ÚNICA fonte de verdade para configurações de checkout.
 * Organizado em blocos semânticos, totalmente tipado, sem `any`.
 *
 * REGRA: Toda config nova vai aqui PRIMEIRO, depois nos templates.
 *
 * @version 1.0 — criado durante refatoração (Fase 2)
 */

// ─────────────────────────────────────────────
// TIPOS AUXILIARES
// ─────────────────────────────────────────────

/** Alinhamento horizontal */
export type HorizontalAlign = 'left' | 'center' | 'right';

/** Métodos de pagamento suportados */
export type PaymentMethod = 'PIX' | 'CREDIT_CARD' | 'BOLETO';

/** Idiomas suportados */
export type SupportedLanguage = 'pt' | 'en' | 'es';

/** Moedas suportadas */
export type SupportedCurrency = 'BRL' | 'USD' | 'EUR';

/** Exibição do carrinho */
export type CartDisplayMode = 'open' | 'closed' | 'drawer';

/** Estilo da barra de avisos */
export type NoticeBarStyle = 'normal' | 'highlight' | 'urgent';

/** Animação da barra de avisos */
export type NoticeBarAnimation = 'slide' | 'fade' | 'scale' | 'none';

/** Posição da barra de avisos */
export type NoticeBarPosition = 'top' | 'bottom';

/** Raio do botão */
export type ButtonRadius = 'none' | 'sm' | 'md' | 'lg' | 'full';

// ─────────────────────────────────────────────
// BLOCOS DE CONFIGURAÇÃO
// ─────────────────────────────────────────────

/** Configuração do cabeçalho */
export interface HeaderConfig {
  /** Se o cabeçalho deve ser exibido */
  enabled: boolean;
  /** URL da logo (null = sem logo, usa storeName) */
  logoUrl: string | null;
  /** Alinhamento da logo */
  logoAlign: HorizontalAlign;
  /** URL do favicon */
  faviconUrl: string | null;
  /** Nome da loja (exibido quando logoUrl é null) */
  storeName: string;
  /** Cor de fundo do cabeçalho */
  bgColor: string;
  /** Cor do texto/elementos do cabeçalho */
  textColor: string;
  /** Exibir badge "Pagamento Seguro" no header */
  showSecurityBadge: boolean;
}

/** Configuração da barra de avisos */
export interface NoticeBarConfig {
  /** Se a barra deve ser exibida */
  enabled: boolean;
  /** Texto da barra (suporta emoji) */
  message: string;
  /** Cor de fundo */
  bgColor: string;
  /** Cor do texto */
  textColor: string;
  /** Estilo visual */
  style: NoticeBarStyle;
  /** Animação de entrada */
  animation: NoticeBarAnimation;
  /** Posição na página */
  position: NoticeBarPosition;
  /** Se pode ser fechada pelo usuário */
  closeable: boolean;
}

/** Configuração de banners de imagem */
export interface BannerConfig {
  /** Se os banners estão ativos */
  enabled: boolean;
  /** Banner para desktop (URL ou null) */
  desktopUrl: string | null;
  /** Banner para mobile (URL ou null) */
  mobileUrl: string | null;
  /** Banners posicionais (template HighConversion) */
  leftTopUrl: string | null;
  rightTopUrl: string | null;
  leftBottomUrl: string | null;
}

/** Configuração do timer de escassez */
export interface ScarcityConfig {
  /** Se o timer está ativo */
  enabled: boolean;
  /** Duração em minutos */
  durationMinutes: number;
  /**
   * Chave única no localStorage para este timer.
   * DEVE ser regenerada ao trocar de template para evitar
   * que timers de templates diferentes se sobreponham.
   */
  storageKey: string;
  /** Cor da barra de escassez */
  bgColor: string;
  /** Cor do texto */
  textColor: string;
  /** Mensagem customizada (null = mensagem dinâmica automática) */
  customMessage: string | null;
}

/** Configuração do order bump */
export interface OrderBumpConfig {
  /** Se o order bump está ativo */
  enabled: boolean;
  /** ID do produto a oferecer (null = não configurado) */
  productId: string | null;
  /** Cor de fundo do card */
  bgColor: string;
  /** Cor do texto */
  textColor: string;
  /** Cor da borda */
  borderColor: string;
  /** Cor de fundo do botão */
  buttonBgColor: string;
  /** Cor do texto do botão */
  buttonTextColor: string;
  /** Cor do preço */
  priceColor: string;
}

/** Configuração do carrinho */
export interface CartConfig {
  /** Modo de exibição do resumo do pedido */
  display: CartDisplayMode;
  /** Cor da borda do carrinho */
  borderColor: string;
  /** Cor dos círculos de quantidade */
  quantityCircleColor: string;
  /** Cor do texto de quantidade */
  quantityTextColor: string;
  /** Se o ícone de carrinho é exibido */
  showIcon: boolean;
  /** Se o campo de cupom é editável */
  couponEnabled: boolean;
  /** Se exibe lembrete de carrinho */
  showCartReminder: boolean;
}

/** Configuração dos botões */
export interface ButtonsConfig {
  /** Cor de fundo do botão primário (próxima etapa) */
  primaryBg: string;
  /** Cor do texto do botão primário */
  primaryText: string;
  /** Raio do botão primário */
  primaryRadius: ButtonRadius;
  /** Efeito hover no botão primário */
  primaryHover: boolean;
  /** Efeito flow (shimmer) no botão primário */
  primaryFlow: boolean;

  /** Cor de fundo do botão de checkout (finalizar pedido) */
  checkoutBg: string;
  /** Cor do texto do botão de checkout */
  checkoutText: string;
  /** Raio do botão de checkout */
  checkoutRadius: ButtonRadius;
  /** Efeito hover no botão de checkout */
  checkoutHover: boolean;
  /** Efeito flow no botão de checkout */
  checkoutFlow: boolean;

  /** Efeito de pulsação no botão de checkout */
  pulse: boolean;
  /** Sombra no botão de checkout */
  shadow: boolean;

  /** Estilo do botão "próxima etapa" (para templates stepped) */
  nextStepStyle: 'rounded' | 'rectangular' | 'oval';
}

/** Configuração de tipografia */
export interface TypographyConfig {
  /** Família da fonte principal */
  fontFamily: string;
  /** Cor do texto principal */
  textColor: string;
  /** Cor dos headings */
  headingColor: string;
  /** Cor dos labels de formulário */
  labelColor: string;
}

/** Configuração do rodapé */
export interface FooterConfig {
  /** Cor de fundo do rodapé */
  bgColor: string;
  /** Cor do texto do rodapé */
  textColor: string;
  /** Exibir nome da loja */
  showStoreName: boolean;
  /** Exibir formas de pagamento */
  showPaymentMethods: boolean;
  /** Exibir CNPJ/CPF */
  showCnpj: boolean;
  /** Valor do CNPJ/CPF a exibir */
  cnpjValue: string;
  /** Exibir email de contato */
  showContactEmail: boolean;
  /** Email de contato a exibir */
  contactEmail: string;
  /** Exibir endereço */
  showAddress: boolean;
  /** Endereço a exibir */
  address: string;
  /** Exibir telefone */
  showPhone: boolean;
  /** Telefone a exibir */
  phone: string;
  /** Exibir link de política de privacidade */
  showPrivacyPolicy: boolean;
  /** URL da política de privacidade */
  privacyPolicyUrl: string;
  /** Exibir link de termos e condições */
  showTermsConditions: boolean;
  /** URL dos termos e condições */
  termsConditionsUrl: string;
  /** Exibir política de devoluções */
  showReturns: boolean;
  /** URL da política de trocas e devoluções */
  returnsUrl: string;
}

/** Configuração do formulário */
export interface FormConfig {
  /** Idioma do formulário */
  language: SupportedLanguage;
  /** Moeda */
  currency: SupportedCurrency;
  /** Número de etapas de navegação (1 = tudo numa tela, 3 = steps) */
  navigationSteps: 1 | 2 | 3;
  /** Solicitar CPF apenas na etapa de pagamento */
  requestCpfOnlyAtPayment: boolean;
  /** Solicitar data de nascimento */
  requestBirthDate: boolean;
  /** Solicitar gênero */
  requestGender: boolean;
  /** Métodos de pagamento habilitados */
  paymentMethods: PaymentMethod[];
}

/** Configuração da barra de expiração do PIX */
export interface PixBarConfig {
  /** Se a barra deve ser exibida */
  enabled: boolean;
  /** Duração em minutos */
  durationMinutes: number;
  /** Duração em segundos */
  durationSeconds: number;
  /** Cor de fundo */
  bgColor: string;
  /** Cor da borda */
  borderColor: string;
  /** Cor do texto */
  textColor: string;
  /** Cor do ícone de relógio */
  iconColor: string;
  /** Estilo da fonte ('normal' | 'italic') */
  fontStyle: 'normal' | 'italic';
  /** Tamanho da fonte (ex: 'text-xs', 'text-sm') */
  fontSize: string;
}

// ─────────────────────────────────────────────
// SCHEMA PRINCIPAL
// ─────────────────────────────────────────────

/**
 * CheckoutConfig — Schema canônico de configuração do checkout.
 *
 * Substitui o objeto `theme: any` por um schema organizado e tipado.
 * Cada template consome os blocos que suporta.
 *
 * @example
 * // Em um template:
 * const MyTemplate: React.FC<{ config: CheckoutConfig }> = ({ config }) => (
 *   <div style={{ backgroundColor: config.header.bgColor }}>
 *     {config.noticeBar.enabled && <NoticeBar config={config.noticeBar} />}
 *   </div>
 * )
 */
export interface CheckoutConfig {
  // ── IDENTIDADE ─────────────────────────────
  /** Slug do template ativo */
  templateSlug: string;
  /** Versão do template */
  templateVersion: number;

  // ── BLOCOS ─────────────────────────────────
  header: HeaderConfig;
  noticeBar: NoticeBarConfig;
  banner: BannerConfig;
  scarcity: ScarcityConfig;
  orderBump: OrderBumpConfig;
  cart: CartConfig;
  buttons: ButtonsConfig;
  typography: TypographyConfig;
  footer: FooterConfig;
  form: FormConfig;
  pixBar: PixBarConfig;
}

// ─────────────────────────────────────────────
// DEFAULTS
// ─────────────────────────────────────────────

/**
 * Configuração padrão global.
 * Cada template pode sobrescrever blocos específicos via defaultTemplateConfig.
 */
export const DEFAULT_CHECKOUT_CONFIG: CheckoutConfig = {
  templateSlug: 'minimal',
  templateVersion: 1,

  header: {
    enabled: true,
    logoUrl: null,
    logoAlign: 'left',
    faviconUrl: null,
    storeName: 'Minha Loja',
    bgColor: '#ffffff',
    textColor: '#111827',
    showSecurityBadge: true,
  },

  noticeBar: {
    enabled: true,
    message: '🎉 FRETE GRÁTIS para todo o Brasil em compras acima de R$ 199!',
    bgColor: '#1F2937',
    textColor: '#FFFFFF',
    style: 'normal',
    animation: 'slide',
    position: 'top',
    closeable: false,
  },

  banner: {
    enabled: false,
    desktopUrl: null,
    mobileUrl: null,
    leftTopUrl: null,
    rightTopUrl: null,
    leftBottomUrl: null,
  },

  scarcity: {
    enabled: false,
    durationMinutes: 15,
    storageKey: 'checkout_scarcity_minimal_v1',
    bgColor: '#0F172A',
    textColor: '#ffffff',
    customMessage: null,
  },

  orderBump: {
    enabled: false,
    productId: null,
    bgColor: '#fffbeb',
    textColor: '#92400e',
    borderColor: '#f59e0b',
    buttonBgColor: '#f59e0b',
    buttonTextColor: '#ffffff',
    priceColor: '#065f46',
  },

  cart: {
    display: 'open',
    borderColor: '#e5e7eb',
    quantityCircleColor: '#6b7280',
    quantityTextColor: '#ffffff',
    showIcon: true,
    couponEnabled: true,
    showCartReminder: false,
  },

  buttons: {
    primaryBg: '#111827',
    primaryText: '#ffffff',
    primaryRadius: 'full',
    primaryHover: true,
    primaryFlow: false,
    checkoutBg: '#111827',
    checkoutText: '#ffffff',
    checkoutRadius: 'full',
    checkoutHover: true,
    checkoutFlow: false,
    pulse: true,
    shadow: true,
    nextStepStyle: 'rounded',
  },

  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    textColor: '#111827',
    headingColor: '#111827',
    labelColor: '#374151',
  },

  footer: {
    bgColor: '#ffffff',
    textColor: '#9ca3af',
    showStoreName: true,
    showPaymentMethods: true,
    showCnpj: false,
    cnpjValue: '',
    showContactEmail: false,
    contactEmail: '',
    showAddress: false,
    address: '',
    showPhone: false,
    phone: '',
    showPrivacyPolicy: true,
    privacyPolicyUrl: '',
    showTermsConditions: true,
    termsConditionsUrl: '',
    showReturns: false,
    returnsUrl: '',
  },

  form: {
    language: 'pt',
    currency: 'BRL',
    navigationSteps: 3,
    requestCpfOnlyAtPayment: false,
    requestBirthDate: false,
    requestGender: false,
    paymentMethods: ['PIX', 'CREDIT_CARD', 'BOLETO'],
  },

  pixBar: {
    enabled: true,
    durationMinutes: 20,
    durationSeconds: 0,
    bgColor: '#f8fafc',
    borderColor: '#e2e8f0',
    textColor: '#475569',
    iconColor: '#10b981',
    fontStyle: 'normal',
    fontSize: 'text-xs',
  },
};

// ─────────────────────────────────────────────
// UTILITÁRIOS
// ─────────────────────────────────────────────

/**
 * Deep merge seguro de dois objetos CheckoutConfig.
 * Usado pelo store ao aplicar patches de configuração.
 */
export function mergeCheckoutConfig(
  base: CheckoutConfig,
  override: DeepPartial<CheckoutConfig>,
): CheckoutConfig {
  const result = { ...base };

  (Object.keys(override) as Array<keyof CheckoutConfig>).forEach((key) => {
    const overrideValue = override[key];
    if (overrideValue !== undefined && overrideValue !== null) {
      if (
        typeof overrideValue === 'object' &&
        !Array.isArray(overrideValue) &&
        typeof result[key] === 'object'
      ) {
        // Merge profundo para objetos aninhados
        (result as Record<string, unknown>)[key] = {
          ...(result[key] as Record<string, unknown>),
          ...(overrideValue as Record<string, unknown>),
        };
      } else {
        (result as Record<string, unknown>)[key] = overrideValue;
      }
    }
  });

  return result;
}

/**
 * Gera uma storageKey única para o timer de escassez.
 * Garante que timers de templates diferentes não se sobreponham.
 */
export function generateScarcityKey(templateSlug: string): string {
  return `checkout_scarcity_${templateSlug}_${Date.now()}`;
}

/**
 * Converte o tema legado (Record<string, unknown>) para CheckoutConfig.
 * Usado durante a migração gradual dos templates antigos.
 */
export function legacyThemeToConfig(
  theme: Record<string, unknown>,
  templateSlug = 'minimal',
): CheckoutConfig {
  const base = { ...DEFAULT_CHECKOUT_CONFIG };

  return mergeCheckoutConfig(base, {
    templateSlug,

    header: {
      logoUrl: (theme.logoUrl as string | null) ?? null,
      logoAlign: (theme.logoAlignment as HorizontalAlign) || 'left',
      storeName: (theme.storeName as string) || 'Minha Loja',
      bgColor: (theme.headerBgColor as string) || base.header.bgColor,
      textColor: (theme.headerTextColor as string) || base.header.textColor,
      showSecurityBadge: (theme.showSecurityBadge as boolean) ?? true,
    },

    noticeBar: {
      enabled: (theme.noticeBarEnabled as boolean) ?? false,
      // Suporta AMBAS as chaves legadas durante a migração
      message:
        (theme.noticeBarText as string) ||
        (theme.noticeBarMessage as string) ||
        base.noticeBar.message,
      bgColor: (theme.noticeBarBackgroundColor as string) || base.noticeBar.bgColor,
      textColor: (theme.noticeBarTextColor as string) || base.noticeBar.textColor,
    },

    scarcity: {
      enabled: (theme.useVisible as boolean) ?? false,
      durationMinutes: (theme.expirationTime as number) || 15,
      bgColor: (theme.scarcityBarBgColor as string) || base.scarcity.bgColor,
      textColor: (theme.scarcityBarTextColor as string) || base.scarcity.textColor,
    },

    buttons: {
      primaryBg:
        (theme.primaryButtonBackgroundColor as string) ||
        (theme.primaryColor as string) ||
        base.buttons.primaryBg,
      checkoutBg:
        (theme.checkoutButtonBackgroundColor as string) ||
        (theme.primaryColor as string) ||
        base.buttons.checkoutBg,
    },

    footer: {
      bgColor: (theme.footerBackgroundColor as string) || base.footer.bgColor,
      textColor: (theme.footerTextColor as string) || base.footer.textColor,
      showStoreName: (theme.showStoreName as boolean) ?? true,
      showPaymentMethods: (theme.showPaymentMethods as boolean) ?? true,
      showCnpj: (theme.showCnpjCpf as boolean) ?? false,
      showContactEmail: (theme.showContactEmail as boolean) ?? false,
      showAddress: (theme.showAddress as boolean) ?? false,
      showPhone: (theme.showPhone as boolean) ?? false,
      showPrivacyPolicy: (theme.showPrivacyPolicy as boolean) ?? true,
      showTermsConditions: (theme.showTermsConditions as boolean) ?? true,
      showReturns: (theme.showReturns as boolean) ?? false,
    },

    form: {
      language: (theme.language as SupportedLanguage) || 'pt',
      currency: (theme.currency as SupportedCurrency) || 'BRL',
      navigationSteps: (theme.navigationSteps as 1 | 2 | 3) || 3,
      requestCpfOnlyAtPayment: (theme.requestCpfOnlyAtPayment as boolean) ?? false,
      requestBirthDate: (theme.requestBirthDate as boolean) ?? false,
      requestGender: (theme.requestGender as boolean) ?? false,
    },

    pixBar: {
      enabled: (theme.pixBarEnabled as boolean) ?? ((theme.pixBar?.enabled as boolean) ?? true),
      durationMinutes: (theme.pixBarDurationMinutes as number) ?? ((theme.pixBar?.durationMinutes as number) ?? 20),
      durationSeconds: (theme.pixBarDurationSeconds as number) ?? ((theme.pixBar?.durationSeconds as number) ?? 0),
      bgColor: (theme.pixBarBgColor as string) || ((theme.pixBar?.bgColor as string) || '#f8fafc'),
      borderColor: (theme.pixBarBorderColor as string) || ((theme.pixBar?.borderColor as string) || '#e2e8f0'),
      textColor: (theme.pixBarTextColor as string) || ((theme.pixBar?.textColor as string) || '#475569'),
      iconColor: (theme.pixBarIconColor as string) || ((theme.pixBar?.iconColor as string) || '#10b981'),
      fontStyle: (theme.pixBarFontStyle as 'normal' | 'italic') || ((theme.pixBar?.fontStyle as 'normal' | 'italic') || 'normal'),
      fontSize: (theme.pixBarFontSize as string) || ((theme.pixBar?.fontSize as string) || 'text-xs'),
    },
  });
}

// ─────────────────────────────────────────────
// TIPO AUXILIAR: DeepPartial
// ─────────────────────────────────────────────

/** Torna todos os campos de T opcionais recursivamente */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};
