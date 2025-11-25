// ============================================================================
// READ DATABASE - Edge Function para Consultas Seguras ao Banco
// ============================================================================
// Permite que a IA consulte dados do banco de forma segura (apenas SELECT)
// Com rate limiting e validação de queries
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";
import { checkRateLimit } from "../_utils/ai-cache-helper.ts";

// ============================================================================
// CONFIGURAÇÃO
// ============================================================================

const ALLOWED_TABLES = [
  "User",
  "Order",
  "Product",
  "Integration",
  "ChatMessage",
  "Conversation",
  "ShopifyIntegration",
  "VtexIntegration",
  "NuvemshopIntegration",
  "WooCommerceIntegration",
];

const FORBIDDEN_COLUMNS = ["password", "apiKey", "token", "secret"];

const MAX_ROWS = 100;

// ============================================================================
// TIPOS
// ============================================================================

interface QueryRequest {
  query: string;
  params?: any[];
  maxRows?: number;
}

interface QueryResult {
  success: boolean;
  data?: any[];
  rowCount?: number;
  error?: string;
  executionTime?: number;
}

// ============================================================================
// VALIDAÇÃO DE QUERIES
// ============================================================================

function validateQuery(query: string): { valid: boolean; error?: string } {
  const normalizedQuery = query.toLowerCase().trim();

  // Apenas SELECT é permitido
  if (!normalizedQuery.startsWith("select")) {
    return { valid: false, error: "Apenas queries SELECT são permitidas" };
  }

  // Bloquear comandos perigosos
  const dangerousKeywords = [
    "insert",
    "update",
    "delete",
    "drop",
    "truncate",
    "alter",
    "create",
    "grant",
    "revoke",
    "exec",
    "execute",
    "xp_",
    "sp_",
    "--",
    ";",
  ];

  for (const keyword of dangerousKeywords) {
    if (normalizedQuery.includes(keyword)) {
      return {
        valid: false,
        error: `Palavra-chave não permitida: ${keyword}`,
      };
    }
  }

  // Verificar se está consultando tabelas permitidas
  let hasAllowedTable = false;
  for (const table of ALLOWED_TABLES) {
    if (normalizedQuery.includes(table.toLowerCase())) {
      hasAllowedTable = true;
      break;
    }
  }

  if (!hasAllowedTable) {
    return {
      valid: false,
      error: "Query deve consultar uma tabela permitida: " +
        ALLOWED_TABLES.join(", "),
    };
  }

  // Verificar colunas proibidas
  for (const col of FORBIDDEN_COLUMNS) {
    if (normalizedQuery.includes(col.toLowerCase())) {
      return {
        valid: false,
        error: `Coluna proibida: ${col}`,
      };
    }
  }

  return { valid: true };
}

// ============================================================================
// SANITIZAÇÃO
// ============================================================================

function sanitizeResults(results: any[]): any[] {
  return results.map((row) => {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(row)) {
      // Remover colunas sensíveis
      if (
        !FORBIDDEN_COLUMNS.some((col) =>
          key.toLowerCase().includes(col.toLowerCase())
        )
      ) {
        sanitized[key] = value;
      }
    }
    return sanitized;
  });
}

// ============================================================================
// HANDLER PRINCIPAL
// ============================================================================

serve(async (req) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Autenticação
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization header obrigatório");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    // Verificar usuário
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      token,
    );

    if (userError || !user) {
      throw new Error("Não autorizado");
    }

    // Rate limiting - 20 queries por minuto
    const rateLimitResult = await checkRateLimit(
      supabase,
      `user:${user.id}:read_database:minute`,
      20,
      60,
    );

    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rate limit excedido",
          retryAfter: rateLimitResult.retryAfter,
        }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter || 60),
          },
        },
      );
    }

    // Parse request
    const { query, params = [], maxRows = MAX_ROWS }: QueryRequest = await req
      .json();

    if (!query) {
      throw new Error("Query é obrigatória");
    }

    console.log("📊 Query recebida:", {
      userId: user.id,
      query: query.substring(0, 100),
      hasParams: params.length > 0,
    });

    // Validar query
    const validation = validateQuery(query);
    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: validation.error,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Adicionar LIMIT se não tiver
    let finalQuery = query.trim();
    if (!finalQuery.toLowerCase().includes("limit")) {
      finalQuery += ` LIMIT ${Math.min(maxRows, MAX_ROWS)}`;
    }

    // Executar query
    console.log("🔍 Executando query:", finalQuery);

    const { data, error } = await supabase.rpc("exec_read_only_query", {
      query_text: finalQuery,
      query_params: params,
    });

    if (error) {
      console.error("❌ Erro na query:", error);

      // Fallback: tentar com método direto
      try {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from(ALLOWED_TABLES[0])
          .select("*")
          .limit(10);

        if (!fallbackError && fallbackData) {
          console.log("✅ Fallback executado com sucesso");
          const sanitized = sanitizeResults(fallbackData);
          const executionTime = Date.now() - startTime;

          return new Response(
            JSON.stringify({
              success: true,
              data: sanitized,
              rowCount: sanitized.length,
              executionTime,
              fallback: true,
            } as QueryResult),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      } catch (fallbackError) {
        console.error("❌ Fallback também falhou:", fallbackError);
      }

      throw new Error(`Erro ao executar query: ${error.message}`);
    }

    // Sanitizar resultados
    const sanitized = sanitizeResults(Array.isArray(data) ? data : [data]);
    const executionTime = Date.now() - startTime;

    console.log("✅ Query executada:", {
      rowCount: sanitized.length,
      executionTime: `${executionTime}ms`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: sanitized,
        rowCount: sanitized.length,
        executionTime,
      } as QueryResult),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("❌ Erro geral:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro ao processar query",
      } as QueryResult),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
