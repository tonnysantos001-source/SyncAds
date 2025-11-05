// Plataformas de pixels suportadas
export type PixelPlatform = 'FACEBOOK' | 'TIKTOK' | 'GOOGLE_ADS';

// Eventos de pixel disponíveis
export type PixelEventType =
  | 'page_view'
  | 'add_to_cart'
  | 'purchase'
  | 'initiate_checkout'
  | 'begin_checkout'
  | 'view_content'
  | 'view_item'
  | 'search'
  | 'add_payment_info'
  | 'complete_registration'
  | 'sign_up';

// Interface para plataformas de pixels globais (disponíveis no sistema)
export interface Pixel {
  id: string;
  platform: PixelPlatform;
  pixelId: string;
  events: PixelEventType[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface para configuração de pixel do usuário
export interface PixelConfig {
  id: string;
  userId: string;
  platform: PixelPlatform;
  pixelId: string;
  name?: string;
  accessToken?: string;
  isActive: boolean;
  events: PixelEventType[];
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Interface para criação de configuração de pixel
export interface CreatePixelConfigInput {
  platform: PixelPlatform;
  pixelId: string;
  name?: string;
  accessToken?: string;
  isActive?: boolean;
  events?: PixelEventType[];
  config?: Record<string, any>;
}

// Interface para atualização de configuração de pixel
export interface UpdatePixelConfigInput {
  pixelId?: string;
  name?: string;
  accessToken?: string;
  isActive?: boolean;
  events?: PixelEventType[];
  config?: Record<string, any>;
}

// Interface para evento de pixel disparado
export interface PixelEvent {
  id: string;
  pixelId: string;
  event: PixelEventType;
  data: Record<string, any>;
  firedAt: string;
}

// Metadados de plataforma
export interface PixelPlatformMetadata {
  platform: PixelPlatform;
  name: string;
  description: string;
  icon: string;
  color: string;
  documentation: string;
  requiredFields: string[];
  availableEvents: PixelEventType[];
}

// Constantes de plataformas
export const PIXEL_PLATFORMS: Record<PixelPlatform, PixelPlatformMetadata> = {
  FACEBOOK: {
    platform: 'FACEBOOK',
    name: 'Meta Ads (Facebook/Instagram)',
    description: 'Pixel do Meta para rastreamento de conversões no Facebook e Instagram',
    icon: '📘',
    color: '#1877F2',
    documentation: 'https://developers.facebook.com/docs/meta-pixel',
    requiredFields: ['pixelId'],
    availableEvents: [
      'page_view',
      'add_to_cart',
      'purchase',
      'initiate_checkout',
      'view_content',
      'search',
      'add_payment_info',
      'complete_registration',
    ],
  },
  TIKTOK: {
    platform: 'TIKTOK',
    name: 'TikTok Ads',
    description: 'Pixel do TikTok para rastreamento de conversões e criação de públicos',
    icon: '🎵',
    color: '#000000',
    documentation: 'https://ads.tiktok.com/help/article?aid=10000357',
    requiredFields: ['pixelId'],
    availableEvents: [
      'page_view',
      'add_to_cart',
      'purchase',
      'initiate_checkout',
      'view_content',
      'search',
      'add_payment_info',
      'complete_registration',
    ],
  },
  GOOGLE_ADS: {
    platform: 'GOOGLE_ADS',
    name: 'Google Ads',
    description: 'Tag de conversão do Google Ads para remarketing e medição',
    icon: '🔍',
    color: '#4285F4',
    documentation: 'https://support.google.com/google-ads/answer/6331314',
    requiredFields: ['pixelId'],
    availableEvents: [
      'page_view',
      'add_to_cart',
      'purchase',
      'begin_checkout',
      'view_item',
      'search',
      'add_payment_info',
      'sign_up',
    ],
  },
};

// Mapeamento de eventos para nomes legíveis
export const PIXEL_EVENT_LABELS: Record<PixelEventType, string> = {
  page_view: 'Visualização de Página',
  add_to_cart: 'Adicionar ao Carrinho',
  purchase: 'Compra',
  initiate_checkout: 'Iniciar Checkout',
  begin_checkout: 'Começar Checkout',
  view_content: 'Visualizar Conteúdo',
  view_item: 'Visualizar Item',
  search: 'Busca',
  add_payment_info: 'Adicionar Informações de Pagamento',
  complete_registration: 'Completar Registro',
  sign_up: 'Cadastro',
};

// Validação de Pixel ID por plataforma
export const validatePixelId = (platform: PixelPlatform, pixelId: string): boolean => {
  switch (platform) {
    case 'FACEBOOK':
      // Facebook Pixel ID: número de 15-16 dígitos
      return /^\d{15,16}$/.test(pixelId);
    case 'TIKTOK':
      // TikTok Pixel ID: formato específico (geralmente começa com C)
      return /^[A-Z0-9]{15,20}$/.test(pixelId);
    case 'GOOGLE_ADS':
      // Google Ads Conversion ID: formato AW-XXXXXXXXXX
      return /^AW-\d{9,11}$/.test(pixelId) || /^G-[A-Z0-9]{10}$/.test(pixelId);
    default:
      return false;
  }
};

// Helper para obter cor da plataforma
export const getPlatformColor = (platform: PixelPlatform): string => {
  return PIXEL_PLATFORMS[platform]?.color || '#000000';
};

// Helper para obter nome da plataforma
export const getPlatformName = (platform: PixelPlatform): string => {
  return PIXEL_PLATFORMS[platform]?.name || platform;
};
