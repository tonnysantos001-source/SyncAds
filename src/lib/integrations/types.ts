// Tipos para sistema de integrações

export type IntegrationAuthType = 'direct' | 'oauth';

export type IntegrationSlug = 
  | 'google_ads'
  | 'meta_ads'
  | 'facebook_ads'
  | 'linkedin_ads'
  | 'google_analytics'
  | 'twitter_ads'
  | 'tiktok_ads';

export interface IntegrationConfig {
  slug: IntegrationSlug;
  name: string;
  authType: IntegrationAuthType;
  icon: string;
  description: string;
  scopes?: string[];
  clientId?: string;
  authUrl?: string;
  tokenUrl?: string;
}

export interface IntegrationCredentials {
  id: string;
  userId: string;
  integrationSlug: IntegrationSlug;
  authType: IntegrationAuthType;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  credentials?: Record<string, any>; // Para direct auth (criptografado)
  isConnected: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DirectAuthRequest {
  username: string;
  password: string;
  additionalFields?: Record<string, string>;
}

export interface OAuthAuthUrlResponse {
  authUrl: string;
  state: string;
}

export interface OAuthCallbackRequest {
  code: string;
  state: string;
}

// Configurações das integrações
export const INTEGRATIONS_CONFIG: Record<IntegrationSlug, IntegrationConfig> = {
  google_ads: {
    slug: 'google_ads',
    name: 'Google Ads',
    authType: 'oauth',
    icon: '🔍',
    description: 'Gerencie suas campanhas do Google Ads',
    scopes: ['https://www.googleapis.com/auth/adwords'],
    clientId: process.env.VITE_GOOGLE_CLIENT_ID,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
  meta_ads: {
    slug: 'meta_ads',
    name: 'Meta Ads',
    authType: 'oauth',
    icon: '📘',
    description: 'Conecte suas campanhas do Facebook e Instagram',
    scopes: ['ads_management', 'ads_read', 'business_management'],
    clientId: process.env.VITE_META_CLIENT_ID,
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
  },
  facebook_ads: {
    slug: 'facebook_ads',
    name: 'Facebook Ads',
    authType: 'oauth',
    icon: '👥',
    description: 'Gerencie anúncios do Facebook',
    scopes: ['ads_management', 'ads_read'],
    clientId: process.env.VITE_META_CLIENT_ID,
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
  },
  linkedin_ads: {
    slug: 'linkedin_ads',
    name: 'LinkedIn Ads',
    authType: 'oauth',
    icon: '💼',
    description: 'Conecte suas campanhas do LinkedIn',
    scopes: ['r_ads', 'rw_ads', 'r_organization_social'],
    clientId: process.env.VITE_LINKEDIN_CLIENT_ID,
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
  },
  google_analytics: {
    slug: 'google_analytics',
    name: 'Google Analytics',
    authType: 'oauth',
    icon: '📊',
    description: 'Analise dados do Google Analytics',
    scopes: ['https://www.googleapis.com/auth/analytics.readonly'],
    clientId: process.env.VITE_GOOGLE_CLIENT_ID,
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
  },
  twitter_ads: {
    slug: 'twitter_ads',
    name: 'Twitter Ads',
    authType: 'oauth',
    icon: '🐦',
    description: 'Gerencie campanhas do Twitter/X',
    scopes: ['tweet.read', 'users.read', 'offline.access'],
    clientId: process.env.VITE_TWITTER_CLIENT_ID,
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
  },
  tiktok_ads: {
    slug: 'tiktok_ads',
    name: 'TikTok Ads',
    authType: 'oauth',
    icon: '🎵',
    description: 'Conecte suas campanhas do TikTok',
    scopes: ['user.info.basic', 'video.list'],
    clientId: process.env.VITE_TIKTOK_CLIENT_ID,
    authUrl: 'https://www.tiktok.com/auth/authorize/',
    tokenUrl: 'https://open-api.tiktok.com/oauth/access_token/',
  },
};
