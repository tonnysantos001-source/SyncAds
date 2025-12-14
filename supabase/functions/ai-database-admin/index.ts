import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// ==========================================
// AI DATABASE ADMIN
// Permite que a IA execute queries no banco
// ==========================================

interface DatabaseRequest {
    action: "query" | "insert" | "update" | "delete" | "schema";
    table?: string;
    sql?: string;
    data?: Record<string, any>;
    where?: Record<string, any>;
    requireConfirmation?: boolean;
}

interface DatabaseResponse {
    success: boolean;
    data?: any;
    rowCount?: number;
    error?: string;
    requiresApproval?: boolean;
    riskLevel?: "low" | "medium" | "high" | "critical";
    logId?: string;
}

// Whitelist de tabelas permitidas
const ALLOWED_TABLES = [
    "User",
    "Order",
    "Product",
    "PaymentGateway",
    "ai_generated_gateways",
    "ai_database_logs",
    "system_prompt_versions",
    "Campaign",
    "Integration",
    "ChatMessage",
    "Conversation",
];

// Blacklist de comandos perigosos
const DANGEROUS_KEYWORDS = [
    "DROP",
    "TRUNCATE",
    "ALTER",
    "CREATE DATABASE",
    "GRANT",
    "REVOKE",
];

// Queries que exigem confirmação
const HIGH_RISK_PATTERNS = [
    /DELETE\s+FROM\s+\w+\s*$/i, // DELETE sem WHERE
    /UPDATE\s+\w+\s+SET.*$/i, // UPDATE sem WHERE
    /DELETE.*WHERE.*>.*1000/i, // DELETE de muitos registros
];

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    const startTime = Date.now();

    try {
        const authHeader = req.headers.get("Authorization")!;
        const token = authHeader.replace("Bearer ", "");

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_ANON_KEY") ?? "",
            { global: { headers: { Authorization: authHeader } } }
        );

        // Verificar autenticação
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser(token);

        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        // Verificar permissões - APENAS SUPER_ADMIN
        const { data: userData } = await supabase
            .from("User")
            .select("role")
            .eq("id", user.id)
            .single();

        if (userData?.role !== "SUPER_ADMIN") {
            console.warn(`⛔ Tentativa de acesso negada: ${user.id} (role: ${userData?.role})`);
            return new Response(
                JSON.stringify({
                    error: "Forbidden",
                    message: "Apenas SUPER_ADMIN pode acessar o Database Admin",
                }),
                {
                    status: 403,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        const request: DatabaseRequest = await req.json();
        console.log(`📊 AI Database Request:`, {
            action: request.action,
            table: request.table,
            userId: user.id,
        });

        let response: DatabaseResponse;

        switch (request.action) {
            case "query":
                response = await handleQuery(supabase, request, user.id);
                break;

            case "insert":
                response = await handleInsert(supabase, request, user.id);
                break;

            case "update":
                response = await handleUpdate(supabase, request, user.id);
                break;

            case "delete":
                response = await handleDelete(supabase, request, user.id);
                break;

            case "schema":
                response = await handleSchema(supabase, request);
                break;

            default:
                throw new Error(`Unknown action: ${request.action}`);
        }

        const duration = Date.now() - startTime;

        // Log da operação
        await logDatabaseOperation(
            supabase,
            user.id,
            request,
            response,
            duration
        );

        return new Response(JSON.stringify(response), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("❌ Database Admin error:", error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message,
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});

// ==========================================
// HANDLERS
// ==========================================

async function handleQuery(
    supabase: any,
    request: DatabaseRequest,
    userId: string
): Promise<DatabaseResponse> {
    if (!request.sql) {
        throw new Error("SQL query is required");
    }

    // Validar query
    const validation = validateQuery(request.sql);
    if (!validation.safe) {
        return {
            success: false,
            error: `Query bloqueada: ${validation.reason}`,
            riskLevel: "critical",
        };
    }

    try {
        // Executar query com timeout de 5 segundos
        const { data, error } = await supabase.rpc("execute_sql_query", {
            query_text: request.sql,
            timeout_seconds: 5,
        });

        if (error) throw error;

        return {
            success: true,
            data: data,
            rowCount: Array.isArray(data) ? data.length : 1,
            riskLevel: validation.riskLevel,
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            riskLevel: "high",
        };
    }
}

async function handleInsert(
    supabase: any,
    request: DatabaseRequest,
    userId: string
): Promise<DatabaseResponse> {
    if (!request.table || !request.data) {
        throw new Error("Table and data are required");
    }

    // Validar tabela
    if (!ALLOWED_TABLES.includes(request.table)) {
        return {
            success: false,
            error: `Tabela ${request.table} não está na whitelist`,
            riskLevel: "critical",
        };
    }

    try {
        const { data, error } = await supabase
            .from(request.table)
            .insert(request.data)
            .select();

        if (error) throw error;

        return {
            success: true,
            data: data,
            rowCount: Array.isArray(data) ? data.length : 1,
            riskLevel: "low",
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            riskLevel: "medium",
        };
    }
}

async function handleUpdate(
    supabase: any,
    request: DatabaseRequest,
    userId: string
): Promise<DatabaseResponse> {
    if (!request.table || !request.data) {
        throw new Error("Table and data are required");
    }

    // Validar tabela
    if (!ALLOWED_TABLES.includes(request.table)) {
        return {
            success: false,
            error: `Tabela ${request.table} não está na whitelist`,
            riskLevel: "critical",
        };
    }

    // UPDATE sem WHERE requer confirmação
    if (!request.where || Object.keys(request.where).length === 0) {
        return {
            success: false,
            error: "UPDATE sem WHERE é muito perigoso! Especifique condições.",
            requiresApproval: true,
            riskLevel: "critical",
        };
    }

    try {
        let query = supabase.from(request.table).update(request.data);

        // Aplicar WHERE
        for (const [key, value] of Object.entries(request.where)) {
            query = query.eq(key, value);
        }

        const { data, error } = await query.select();

        if (error) throw error;

        return {
            success: true,
            data: data,
            rowCount: Array.isArray(data) ? data.length : 1,
            riskLevel: "medium",
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            riskLevel: "high",
        };
    }
}

async function handleDelete(
    supabase: any,
    request: DatabaseRequest,
    userId: string
): Promise<DatabaseResponse> {
    if (!request.table) {
        throw new Error("Table is required");
    }

    // Validar tabela
    if (!ALLOWED_TABLES.includes(request.table)) {
        return {
            success: false,
            error: `Tabela ${request.table} não está na whitelist`,
            riskLevel: "critical",
        };
    }

    // DELETE sem WHERE é BLOQUEADO
    if (!request.where || Object.keys(request.where).length === 0) {
        return {
            success: false,
            error: "DELETE sem WHERE é BLOQUEADO! Isso deletaria todos os registros.",
            riskLevel: "critical",
        };
    }

    try {
        let query = supabase.from(request.table).delete();

        // Aplicar WHERE
        for (const [key, value] of Object.entries(request.where)) {
            query = query.eq(key, value);
        }

        const { data, error } = await query.select();

        if (error) throw error;

        return {
            success: true,
            data: data,
            rowCount: Array.isArray(data) ? data.length : 1,
            riskLevel: "high",
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            riskLevel: "critical",
        };
    }
}

async function handleSchema(
    supabase: any,
    request: DatabaseRequest
): Promise<DatabaseResponse> {
    try {
        // Retornar schema das tabelas permitidas
        const schema = ALLOWED_TABLES.map((table) => ({
            name: table,
            allowed: true,
        }));

        return {
            success: true,
            data: {
                allowedTables: ALLOWED_TABLES,
                schema: schema,
            },
            riskLevel: "low",
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            riskLevel: "low",
        };
    }
}

// ==========================================
// VALIDATION
// ==========================================

function validateQuery(sql: string): {
    safe: boolean;
    reason?: string;
    riskLevel: "low" | "medium" | "high" | "critical";
} {
    const upperSQL = sql.toUpperCase();

    // Verificar blacklist
    for (const keyword of DANGEROUS_KEYWORDS) {
        if (upperSQL.includes(keyword)) {
            return {
                safe: false,
                reason: `Comando perigoso detectado: ${keyword}`,
                riskLevel: "critical",
            };
        }
    }

    // Verificar padrões de alto risco
    for (const pattern of HIGH_RISK_PATTERNS) {
        if (pattern.test(sql)) {
            return {
                safe: false,
                reason: "Query de alto risco detectada (DELETE/UPDATE sem WHERE seguro)",
                riskLevel: "critical",
            };
        }
    }

    // Determinar risk level baseado no tipo de query
    if (upperSQL.startsWith("SELECT")) {
        return { safe: true, riskLevel: "low" };
    } else if (upperSQL.startsWith("INSERT")) {
        return { safe: true, riskLevel: "medium" };
    } else if (upperSQL.startsWith("UPDATE") || upperSQL.startsWith("DELETE")) {
        return { safe: true, riskLevel: "high" };
    }

    return { safe: true, riskLevel: "medium" };
}

// ==========================================
// LOGGING
// ==========================================

async function logDatabaseOperation(
    supabase: any,
    userId: string,
    request: DatabaseRequest,
    response: DatabaseResponse,
    durationMs: number
): Promise<void> {
    try {
        await supabase.from("ai_database_logs").insert({
            user_id: userId,
            action: request.action,
            table_name: request.table,
            query: request.sql || null,
            params: request.data || request.where || null,
            result: response.data ? { rowCount: response.rowCount } : null,
            error: response.error || null,
            duration_ms: durationMs,
            risk_level: response.riskLevel,
            is_approved: !response.requiresApproval,
        });
    } catch (error) {
        console.error("Failed to log database operation:", error);
    }
}
