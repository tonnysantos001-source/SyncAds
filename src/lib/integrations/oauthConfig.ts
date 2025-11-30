/**
 * Configurações de Integrações - SyncAds
 *
 * FOCO: E-commerce apenas (VTEX, Nuvemshop, Shopify, WooCommerce, Loja Integrada)
 * OAuth removido - todas as integrações usam API Keys diretas
 */

export interface OAuthProviderConfig {
  // Mantido apenas para compatibilidade de tipos
  clientId?: string;
  authUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
  redirectUri?: string;
}

/**
 * Configurações OAuth - REMOVIDAS
 * SyncAds agora foca apenas em integrações de e-commerce via API Key
 */
export const OAUTH_CONFIGS: Record<string, OAuthProviderConfig> = {
  // Todas as configurações OAuth foram removidas
  // E-commerce usa autenticação via API Key direta
};

/**
 * Plataformas de e-commerce suportadas
 */
export const ECOMMERCE_PLATFORMS = [
  "vtex",
  "nuvemshop",
  "shopify",
  "woocommerce",
  "loja_integrada",
] as const;

export type EcommercePlatform = (typeof ECOMMERCE_PLATFORMS)[number];

/**
 * Gera URL de autorização OAuth (DEPRECATED)
 * @deprecated OAuth não é mais suportado. Use integrações via API Key.
 */
export function generateOAuthUrl(platform: string, userId: string): string {
  throw new Error("OAuth não é mais suportado. Use integrações via API Key.");
}

/**
 * Verifica se uma plataforma OAuth está configurada (DEPRECATED)
 * @deprecated OAuth não é mais suportado
 */
export function isOAuthConfigured(platform: string): boolean {
  return false;
}

/**
 * Lista plataformas de e-commerce disponíveis
 */
export function getAvailablePlatforms(): string[] {
  return [...ECOMMERCE_PLATFORMS];
}

/**
 * Verifica se é uma plataforma de e-commerce válida
 */
export function isEcommercePlatform(
  platform: string,
): platform is EcommercePlatform {
  return ECOMMERCE_PLATFORMS.includes(platform as EcommercePlatform);
}
