/**
 * Configuração Centralizada do Sistema
 * 
 * Este arquivo centraliza todas as configurações e URLs do sistema
 * para facilitar manutenção e evitar hardcoding disperso.
 */

// Configuração do Supabase
export const SUPABASE_CONFIG = {
  // URL do Supabase (prioridade: env var > fallback hardcoded)
  url: import.meta.env.VITE_SUPABASE_URL || 'https://ovskepqggmxlfckxqgbr.supabase.co',
  
  // Anon Key do Supabase (prioridade: env var > fallback hardcoded)
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im92c2tlcHFnZ214bGZja3hxZ2JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4MjQ4NTUsImV4cCI6MjA3NjQwMDg1NX0.UdNgqpTN38An6FuoJPZlj_zLkmAqfJQXb6i1DdTQO_E',
  
  // URL base para Edge Functions
  functionsUrl: 'https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1',
  
  // Funções disponíveis
  functions: {
    chat: '/chat',
    chatStream: '/chat-stream-simple', // Versão simplificada que funciona com CORS
    superAiTools: '/super-ai-tools',
    advancedScraper: '/advanced-scraper',
    aiTools: '/ai-tools',
    generateImage: '/generate-image',
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
  superAiTools: {
    enabled: true,
    tools: ['browser_tool', 'web_scraper', 'python_executor', 'api_caller'] as const,
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

