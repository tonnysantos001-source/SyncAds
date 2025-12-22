import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
    corsHeaders,
    handlePreflightRequest,
    errorResponse,
} from "../_utils/cors.ts";

// =====================================================
// ADMIN TOOLS - IA como Administradora do Sistema
// =====================================================

interface AdminToolRequest {
    tool: string;
    params?: any;
    userId: string;
}

// =====================================================
// VERIFICAÇÃO DE ADMIN
// =====================================================

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
    try {
        const { data } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", userId)
            .single();

        return data?.role === "ADMIN" || data?.role === "SUPER_ADMIN";
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

// =====================================================
// FERRAMENTAS DE AUDITORIA
// =====================================================

async function auditDatabase(supabase: any) {
    const results: any = {
        timestamp: new Date().toISOString(),
        checks: [],
    };

    // 1. Verificar dispositivos online
    const { data: devices, error: devicesError } = await supabase
        .from("extension_devices")
        .select("id, device_id, status, isOnline, last_seen");

    results.checks.push({
        name: "extension_devices",
        total: devices?.length || 0,
        online: devices?.filter((d: any) => d.status === "online" || d.isOnline === true).length || 0,
        error: devicesError?.message,
    });

    // 2. Verificar comandos pendentes/travados
    const { data: commands, error: commandsError } = await supabase
        .from("extension_commands")
        .select("id, type, status, created_at");

    const pending = commands?.filter((c: any) => c.status === "pending") || [];
    const stuck = pending.filter((c: any) => {
        const age = Date.now() - new Date(c.created_at).getTime();
        return age > 60000; // Mais de 1 minuto
    });

    results.checks.push({
        name: "extension_commands",
        total: commands?.length || 0,
        pending: pending.length,
        stuck: stuck.length,
        error: commandsError?.message,
    });

    // 3. Verificar conversas ativas
    const { data: conversations, error: convError } = await supabase
        .from("ChatConversation")
        .select("id, context")
        .order("updatedAt", { ascending: false })
        .limit(100);

    results.checks.push({
        name: "ChatConversation",
        total: conversations?.length || 0,
        web: conversations?.filter((c: any) => c.context === "web").length || 0,
        extension: conversations?.filter((c: any) => c.context === "extension").length || 0,
        error: convError?.message,
    });

    return results;
}

async function auditCommands(supabase: any, limit = 50) {
    const { data: commands } = await supabase
        .from("extension_commands")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

    const analysis = {
        total: commands?.length || 0,
        by_status: {} as any,
        by_type: {} as any,
        null_fields: [] as string[],
        errors: [] as any[],
    };

    commands?.forEach((cmd: any) => {
        // Contar por status
        analysis.by_status[cmd.status] = (analysis.by_status[cmd.status] || 0) + 1;

        // Contar por tipo
        if (cmd.type) {
            analysis.by_type[cmd.type] = (analysis.by_type[cmd.type] || 0) + 1;
        }

        // Verificar campos null
        if (!cmd.command_type && !analysis.null_fields.includes("command_type")) {
            analysis.null_fields.push("command_type");
        }

        // Coletar erros
        if (cmd.status === "failed" && cmd.error) {
            analysis.errors.push({
                id: cmd.id,
                type: cmd.type,
                error: cmd.error,
                created_at: cmd.created_at,
            });
        }
    });

    return analysis;
}

// =====================================================
// FERRAMENTAS DE CORREÇÃO
// =====================================================

async function fixNullCommandTypes(supabase: any) {
    // Atualizar comandos com command_type null
    const { data: nullCommands } = await supabase
        .from("extension_commands")
        .select("id, type")
        .is("command_type", null);

    if (!nullCommands || nullCommands.length === 0) {
        return { fixed: 0, message: "Nenhum comando com command_type null" };
    }

    let fixed = 0;
    for (const cmd of nullCommands) {
        if (cmd.type) {
            await supabase
                .from("extension_commands")
                .update({ command_type: cmd.type })
                .eq("id", cmd.id);
            fixed++;
        }
    }

    return {
        fixed,
        message: `${fixed} comandos corrigidos`,
    };
}

async function cleanStuckCommands(supabase: any) {
    // Marcar como failed comandos pendentes há mais de 2 minutos
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

    const { data, error } = await supabase
        .from("extension_commands")
        .update({
            status: "failed",
            error: "Timeout: Comando não foi executado pela extensão",
        })
        .eq("status", "pending")
        .lt("created_at", twoMinutesAgo)
        .select();

    return {
        cleaned: data?.length || 0,
        error: error?.message,
    };
}

async function executeCustomSQL(supabase: any, query: string) {
    // ATENÇÃO: Usar apenas para queries seguras de leitura
    // Whitelist de comandos permitidos
    const allowedPrefixes = ["SELECT", "EXPLAIN", "WITH"];
    const upperQuery = query.trim().toUpperCase();

    if (!allowedPrefixes.some(prefix => upperQuery.startsWith(prefix))) {
        throw new Error("Apenas queries de leitura (SELECT) são permitidas");
    }

    const { data, error } = await supabase.rpc("execute_sql", { query });

    return {
        data,
        error: error?.message,
        rowCount: data?.length || 0,
    };
}

// =====================================================
// FERRAMENTAS DE LOGS
// =====================================================

async function getFunctionLogs(functionName: string, lines = 100) {
    // Simular busca de logs
    // Em produção, usar Supabase Logs API ou Deno Deploy Logs
    return {
        function: functionName,
        lines: lines,
        message: "Logs API não implementada ainda. Use CLI: supabase functions logs",
    };
}

async function getRailwayLogs(projectId: string, serviceId: string) {
    const RAILWAY_API_TOKEN = Deno.env.get("RAILWAY_API_TOKEN");

    if (!RAILWAY_API_TOKEN) {
        throw new Error("RAILWAY_API_TOKEN não configurado");
    }

    // Railway GraphQL API
    const query = `
    query logs($projectId: String!, $serviceId: String!) {
      logs(projectId: $projectId, serviceId: $serviceId, limit: 100) {
        edges {
          node {
            message
            timestamp
          }
        }
      }
    }
  `;

    const response = await fetch("https://backboard.railway.app/graphql/v2", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RAILWAY_API_TOKEN}`,
        },
        body: JSON.stringify({
            query,
            variables: { projectId, serviceId },
        }),
    });

    return await response.json();
}

// =====================================================
// FERRAMENTAS DE DEPLOY
// =====================================================

async function deployFunction(functionName: string) {
    // Executar deploy via Supabase CLI
    // Nota: Isso requer acesso ao CLI, então retornamos instruções
    return {
        function: functionName,
        message: "Deploy deve ser feito via CLI: supabase functions deploy " + functionName,
        command: `supabase functions deploy ${functionName}`,
    };
}

async function restartRailwayService(serviceId: string) {
    const RAILWAY_API_TOKEN = Deno.env.get("RAILWAY_API_TOKEN");

    if (!RAILWAY_API_TOKEN) {
        throw new Error("RAILWAY_API_TOKEN não configurado");
    }

    const mutation = `
    mutation restartService($serviceId: String!) {
      serviceInstanceRedeploy(serviceId: $serviceId) {
        id
      }
    }
  `;

    const response = await fetch("https://backboard.railway.app/graphql/v2", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RAILWAY_API_TOKEN}`,
        },
        body: JSON.stringify({
            query: mutation,
            variables: { serviceId },
        }),
    });

    return await response.json();
}

// =====================================================
// DISPATCHER DE FERRAMENTAS
// =====================================================

const ADMIN_TOOLS: Record<string, Function> = {
    // Auditoria
    audit_database: auditDatabase,
    audit_commands: auditCommands,

    // Correções
    fix_null_command_types: fixNullCommandTypes,
    clean_stuck_commands: cleanStuckCommands,
    execute_sql: executeCustomSQL,

    // Logs
    get_function_logs: getFunctionLogs,
    get_railway_logs: getRailwayLogs,

    // Deploy
    deploy_function: deployFunction,
    restart_railway_service: restartRailwayService,
};

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req) => {
    if (req.method === "OPTIONS") return handlePreflightRequest();

    try {
        const body: AdminToolRequest = await req.json();
        const { tool, params = {}, userId } = body;

        console.log(`🔧 Admin tool requested: ${tool}`, { userId });

        // AUTH
        const authHeader = req.headers.get("Authorization")!;
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, // Usar service role para admin
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
        if (!user) throw new Error("Unauthorized");

        // Verificar se é admin
        const isUserAdmin = await isAdmin(supabase, user.id);
        if (!isUserAdmin) {
            console.warn(`⚠️ Non-admin user tried to use admin tools: ${user.id}`);
            throw new Error("Forbidden: Admin access required");
        }

        // Verificar se ferramenta existe
        if (!ADMIN_TOOLS[tool]) {
            throw new Error(`Unknown tool: ${tool}`);
        }

        // Executar ferramenta
        console.log(`✅ Executing admin tool: ${tool}`);
        const result = await ADMIN_TOOLS[tool](supabase, ...Object.values(params));

        // Log da operação
        await supabase.from("admin_logs").insert({
            user_id: user.id,
            tool,
            params,
            result,
            timestamp: new Date().toISOString(),
        });

        return new Response(
            JSON.stringify({
                success: true,
                tool,
                result,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (e: any) {
        console.error("❌ Admin tool error:", e);
        return errorResponse(e);
    }
});
