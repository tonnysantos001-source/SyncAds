/**
 * Configuração CORS Centralizada para Edge Functions
 * Permite chamadas do frontend SyncAds e lojas Shopify
 */

// Domínios permitidos
const ALLOWED_ORIGINS = [
  "https://syncads-dun.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:3000",
];

/**
 * Verificar se a origem da requisição é permitida
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  // Permitir origens específicas
  if (ALLOWED_ORIGINS.includes(origin)) return true;

  // Permitir qualquer loja Shopify (*.myshopify.com)
  if (origin.includes(".myshopify.com")) return true;

  // Permitir localhost em desenvolvimento
  if (origin.includes("localhost") || origin.includes("127.0.0.1")) return true;

  return false;
}

/**
 * Obter headers CORS dinâmicos baseado na origem
 */
export function getCorsHeaders(origin: string | null = null) {
  const allowedOrigin = origin && isOriginAllowed(origin) ? origin : "*";

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
    "Access-Control-Allow-Credentials": "true",
  };
}

// Headers CORS padrão (permite tudo - para compatibilidade)
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Max-Age": "86400",
};

/**
 * Handler para requisições OPTIONS (preflight)
 * DEVE retornar 200 OK para que o CORS funcione
 */
export function handlePreflightRequest(origin: string | null = null) {
  return new Response(null, {
    status: 200, // ✅ IMPORTANTE: 200 OK (não 204)
    headers: getCorsHeaders(origin),
  });
}

/**
 * Helper para adicionar headers CORS em qualquer resposta
 */
export function withCorsHeaders(
  headers: Record<string, string> = {},
  origin: string | null = null,
) {
  return {
    ...getCorsHeaders(origin),
    ...headers,
  };
}

/**
 * Helper para criar resposta JSON com CORS
 */
export function jsonResponse(
  data: any,
  status: number = 200,
  extraHeaders: Record<string, string> = {},
  origin: string | null = null,
) {
  return new Response(JSON.stringify(data), {
    status,
    headers: withCorsHeaders(
      {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      origin,
    ),
  });
}

/**
 * Helper para criar resposta de erro com CORS
 */
export function errorResponse(
  message: string,
  status: number = 500,
  extraHeaders: Record<string, string> = {},
  origin: string | null = null,
) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: withCorsHeaders(
      {
        "Content-Type": "application/json",
        ...extraHeaders,
      },
      origin,
    ),
  });
}
