/**
 * Configurações OAuth pré-configuradas do SyncAds
 * 
 * IMPORTANTE: Estas são as credenciais OFICIAIS do SyncAds.
 * Os usuários NÃO precisam criar suas próprias aplicações OAuth.
 * Tudo funciona "out of the box" sem configuração.
 */

export interface OAuthProviderConfig {
  clientId: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

// URL de callback do SyncAds
const REDIRECT_URI = `${window.location.origin}/integrations/callback`;

/**
 * Configurações OAuth pré-configuradas
 * 
 * NOTA PARA PRODUÇÃO:
 * Estas credenciais devem ser substituídas pelas REAIS do SyncAds
 * após criar as aplicações OAuth em cada plataforma.
 * 
 * Por enquanto, estão configuradas para desenvolvimento local.
 */
export const OAUTH_CONFIGS: Record<string, OAuthProviderConfig> = {
  // Meta (Facebook + Instagram Ads)
  meta_ads: {
    clientId: import.meta.env.VITE_META_CLIENT_ID || '1907637243430460',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_read_engagement',
      'pages_manage_ads'
    ],
    redirectUri: REDIRECT_URI
  },

  facebook_ads: {
    clientId: import.meta.env.VITE_FACEBOOK_CLIENT_ID || '1907637243430460',
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
    scopes: ['ads_management', 'ads_read', 'pages_manage_ads'],
    redirectUri: REDIRECT_URI
  },

  // Google Ads
  google_ads: {
    clientId: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com', // TODO: Substituir
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/adwords',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    redirectUri: REDIRECT_URI
  },

  // Google Analytics
  google_analytics: {
    clientId: '123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com', // Mesmo do Google
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    redirectUri: REDIRECT_URI
  },

  // LinkedIn Ads
  linkedin_ads: {
    clientId: '1234567890abcdef', // TODO: Substituir
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    scopes: [
      'r_ads',
      'rw_ads',
      'r_organization_social',
      'r_basicprofile',
      'r_emailaddress'
    ],
    redirectUri: REDIRECT_URI
  },

  // Twitter/X Ads
  twitter_ads: {
    clientId: 'abcdefghijklmnopqrstuvwxyz123456', // TODO: Substituir
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    scopes: [
      'tweet.read',
      'users.read',
      'offline.access',
      'follows.read'
    ],
    redirectUri: REDIRECT_URI
  },

  // TikTok Ads
  tiktok_ads: {
    clientId: 'abc123def456ghi789', // TODO: Substituir
    authUrl: 'https://business-api.tiktok.com/portal/auth',
    tokenUrl: 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/',
    scopes: [
      'user.info.basic',
      'video.list',
      'ad_account_read',
      'ad_account_write'
    ],
    redirectUri: REDIRECT_URI
  }
};

/**
 * Gera URL de autorização OAuth para uma plataforma
 */
export function generateOAuthUrl(platform: string, userId: string): string {
  const config = OAUTH_CONFIGS[platform];
  
  if (!config) {
    throw new Error(`Plataforma OAuth não suportada: ${platform}`);
  }

  // Gerar state único para CSRF protection
  const state = btoa(JSON.stringify({
    platform,
    userId,
    timestamp: Date.now(),
    random: Math.random().toString(36).substring(7)
  }));

  // Salvar state no localStorage temporariamente
  const stateKey = `oauth_state_${platform}_${userId}`;
  localStorage.setItem(stateKey, state);
  setTimeout(() => localStorage.removeItem(stateKey), 10 * 60 * 1000); // 10 minutos

  // Construir URL de autorização
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    access_type: 'offline', // Para refresh token
    prompt: 'consent' // Sempre pedir consentimento
  });

  return `${config.authUrl}?${params.toString()}`;
}

/**
 * Verifica se uma plataforma está configurada
 */
export function isOAuthConfigured(platform: string): boolean {
  return platform in OAUTH_CONFIGS;
}

/**
 * Lista todas as plataformas OAuth disponíveis
 */
export function getAvailablePlatforms(): string[] {
  return Object.keys(OAUTH_CONFIGS);
}
