/**
 * Configuração CORS Centralizada para Edge Functions
 * Permite apenas chamadas do frontend específico
 */

// Domínio permitido (frontend)
const ALLOWED_ORIGIN = 'https://syncads-dun.vercel.app'

// Headers CORS padrão
export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Max-Age': '86400',
}

/**
 * Handler para requisições OPTIONS (preflight)
 * DEVE retornar 200 OK para que o CORS funcione
 */
export function handlePreflightRequest() {
  return new Response(null, {
    status: 200, // ✅ IMPORTANTE: 200 OK (não 204)
    headers: corsHeaders,
  })
}

/**
 * Helper para adicionar headers CORS em qualquer resposta
 */
export function withCorsHeaders(headers: Record<string, string> = {}) {
  return {
    ...corsHeaders,
    ...headers,
  }
}

/**
 * Helper para criar resposta JSON com CORS
 */
export function jsonResponse(data: any, status: number = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: withCorsHeaders({
      'Content-Type': 'application/json',
      ...extraHeaders,
    }),
  })
}

/**
 * Helper para criar resposta de erro com CORS
 */
export function errorResponse(message: string, status: number = 500, extraHeaders: Record<string, string> = {}) {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: withCorsHeaders({
        'Content-Type': 'application/json',
        ...extraHeaders,
      }),
    }
  )
}

/**
 * Verificar se a origem da requisição é permitida
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false
  
  // Permitir origem específica
  if (origin === ALLOWED_ORIGIN) return true
  
  // Permitir localhost em desenvolvimento
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) return true
  
  return false
}

