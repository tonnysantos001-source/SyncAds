/**
 * Configuração Centralizada do Sistema
 * 
 * Este arquivo centraliza todas as configurações e URLs do sistema
 * para facilitar manutenção e evitar hardcoding disperso.
 */

// Configuração do Supabase
export const SUPABASE_CONFIG = {
  // URL do Supabase (OBRIGATÓRIO via env var)
  url: import.meta.env.VITE_SUPABASE_URL || '',
  
  // Anon Key do Supabase (OBRIGATÓRIO via env var)
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  
  // URL base para Edge Functions (derivada da URL principal)
  get functionsUrl() {
    return this.url ? `${this.url}/functions/v1` : '';
  },
  
  // Funções disponíveis
  functions: {
    chat: '/chat',
    chatStream: '/chat-enhanced', // ✅ IA híbrida completa com persistência
    superAiTools: '/super-ai-tools',
    advancedScraper: '/advanced-scraper',
    aiTools: '/ai-tools',
    generateImage: '/generate-image',
    generateVideo: '/generate-video',
    aiAdvisor: '/ai-advisor',
    advancedAnalytics: '/advanced-analytics',
    contentAssistant: '/content-assistant',
    automationEngine: '/automation-engine',
    generateZip: '/generate-zip',
  }
} as const;

// Configuração de OAuth
export const OAUTH_CONFIG = {
  meta: {
    clientId: import.meta.env.VITE_META_CLIENT_ID || '',
    clientSecret: import.meta.env.VITE_META_CLIENT_SECRET || '',
  },
  google: {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
  },
  linkedin: {
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '',
  },
  tiktok: {
    clientId: import.meta.env.VITE_TIKTOK_CLIENT_ID || '',
  },
  twitter: {
    clientId: import.meta.env.VITE_TWITTER_CLIENT_ID || '',
  },
} as const;

// Configuração da API
export const API_CONFIG = {
  timeout: 30000, // 30 segundos
  retryAttempts: 3,
  retryDelay: 1000, // 1 segundo
} as const;

// Configuração do Chat
export const CHAT_CONFIG = {
  maxMessageLength: 500,
  maxConversations: 20,
  historyLimit: 20, // Últimas 20 mensagens para contexto
  typingDelay: 300, // Delay para indicador de digitação
} as const;

// Configuração de Funcionalidades
export const FEATURES = {
  webSearch: {
    enabled: true,
    providers: ['exa', 'tavily', 'serper'] as const,
  },
  aiImageGeneration: {
    enabled: true,
    providers: ['dalle', 'midjourney', 'stable-diffusion'] as const,
  },
  aiVideoGeneration: {
    enabled: true,
    providers: ['runway', 'pika', 'stable-video'] as const,
  },
  superAiTools: {
    enabled: true,
    tools: ['browser_tool', 'web_scraper', 'python_executor', 'javascript_executor', 'database_query', 'email_sender'] as const,
  },
  aiAdvisor: {
    enabled: true,
    capabilities: ['tips', 'warnings', 'opportunities', 'improvements'] as const,
  },
} as const;

/**
 * Valida se as configurações críticas estão presentes
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!SUPABASE_CONFIG.url) {
    errors.push('Supabase URL não configurada');
  }
  
  if (!SUPABASE_CONFIG.anonKey) {
    errors.push('Supabase Anon Key não configurada');
  }
  
  if (!import.meta.env.VITE_SUPABASE_URL && !SUPABASE_CONFIG.url.includes('https://')) {
    errors.push('URL do Supabase inválida');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log das configurações carregadas (apenas em desenvolvimento)
 */
if (import.meta.env.DEV) {
  console.log('🔧 Configurações Carregadas:', {
    supabase: SUPABASE_CONFIG.url,
    hasAnonKey: !!SUPABASE_CONFIG.anonKey,
    functionsUrl: SUPABASE_CONFIG.functionsUrl,
    features: Object.keys(FEATURES),
  });
}

