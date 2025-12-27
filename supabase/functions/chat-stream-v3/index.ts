/**
 * =====================================================
 * CHAT-STREAM REFATORADO — ORQUESTRAÇÃO 3-AGENT
 * =====================================================
 * 
 * Implementa fluxo inquebrável:
 * User → Planner → Action Router → Executor → User
 * 
 * NUNCA pula o Action Router.
 * NUNCA mistura responsabilidades.
 * SEMPRE reporta evidências reais.
 * 
 * =====================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

// =====================================================
// LOAD PROMPTS
// =====================================================

const PLANNER_PROMPT = await Deno.readTextFile(
    new URL("../_prompts/PLANNER_SYSTEM_PROMPT.md", import.meta.url).pathname
);

const EXECUTOR_PROMPT = await Deno.readTextFile(
    new URL("../_prompts/EXECUTOR_SYSTEM_PROMPT.md", import.meta.url).pathname
);

// =====================================================
// GROQ CONFIG
// =====================================================

const GROQ_PLANNER_MODEL = "llama-3.3-70b-versatile";
const GROQ_EXECUTOR_MODEL = "llama-3.3-70b-versatile";

async function getGroqApiKey(supabase: any, role?: string): Promise<string> {
    const { data } = await supabase
        .from("GlobalAiConnection")
        .select("apiKey")
        .eq("provider", "groq")
        .eq("isActive", true)
        .single();

    if (!data?.apiKey) {
        throw new Error("Groq API key not configured");
    }

    return data.apiKey;
}

// =====================================================
// GROQ CALL
// =====================================================

async function callGroq(
    apiKey: string,
    model: string,
    messages: Array<{ role: string; content: string }>,
    temperature = 0.7
): Promise<string> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: 4000,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || "";
}

// =====================================================
// ACTION ROUTER CLIENT
// =====================================================

async function callActionRouter(action: any, supabaseUrl: string, serviceRoleKey: string): Promise<any> {
    const actionRouterUrl = `${supabaseUrl}/functions/v1/action-router`;

    const response = await fetch(actionRouterUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(action),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Action Router error: ${response.status} - ${error}`);
    }

    return await response.json();
}

// =====================================================
// JSON EXTRACTION
// =====================================================

function extractJSON(text: string): any {
    // Try to find JSON in code blocks first
    const codeBlockMatch = text.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (codeBlockMatch) {
        try {
            return JSON.parse(codeBlockMatch[1]);
        } catch (e) {
            console.warn("Failed to parse JSON from code block");
        }
    }

    // Try to find raw JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.warn("Failed to parse raw JSON");
        }
    }

    throw new Error("No valid JSON found in response");
}

// =====================================================
// MAIN HANDLER
// =====================================================

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { message, conversationId } = await req.json();

        if (!message) {
            return new Response(JSON.stringify({ error: "Message required" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // Auth
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing Authorization" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 401,
            });
        }

        console.log(`📩 Message from user ${user.id}: "${message}"`);

        // Get conversation history
        const { data: history } = await supabase
            .from("ChatMessage")
            .select("role, content")
            .eq("conversationId", conversationId)
            .order("createdAt", { ascending: true })
            .limit(10);

        const conversationHistory = history || [];

        // Generate session ID for this execution
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        // =====================================================
        // PHASE 1: PLANNER (Planning)
        // =====================================================

        console.log("🧠 PHASE 1: Calling Planner...");

        const plannerApiKey = await getGroqApiKey(supabase, "planner");

        const plannerMessages = [
            { role: "system", content: PLANNER_PROMPT },
            ...conversationHistory.map((msg: any) => ({
                role: msg.role,
                content: msg.content,
            })),
            {
                role: "user",
                content: `User message: "${message}"\n\nContext variables:\n- userId: ${user.id}\n- sessionId: ${sessionId}\n- conversationId: ${conversationId}\n\nGenerate the action plan in JSON format.`,
            },
        ];

        const plannerResponse = await callGroq(
            plannerApiKey,
            GROQ_PLANNER_MODEL,
            plannerMessages,
            0.3 // Low temperature for structured output
        );

        console.log("✅ Planner response received");
        console.log(plannerResponse.substring(0, 200) + "...");

        let plan: any;
        try {
            plan = extractJSON(plannerResponse);
            console.log("📋 Plan extracted:", JSON.stringify(plan, null, 2));
        } catch (error: any) {
            console.error("❌ Failed to extract JSON from Planner:", error.message);

            return new Response(
                JSON.stringify({
                    content:
                        "Desculpe, não consegui planejar essa ação corretamente. Pode reformular?",
                    error: "Planner returned invalid JSON",
                }),
                {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        // =====================================================
        // PHASE 2: EXECUTE via ACTION ROUTER
        // =====================================================

        console.log("⚙️ PHASE 2: Executing actions via Action Router...");

        const actionResults: any[] = [];

        if (plan.actions && Array.isArray(plan.actions)) {
            for (let i = 0; i < plan.actions.length; i++) {
                const action = plan.actions[i];

                console.log(`🔄 Executing action ${i + 1}/${plan.actions.length}: ${action.action}`);

                // Fill in context
                action.context = {
                    userId: user.id,
                    sessionId,
                    conversationId,
                    ...action.context,
                };

                try {
                    const result = await callActionRouter(action, supabaseUrl, serviceRoleKey);

                    console.log(`✅ Action ${i + 1} result:`, result.success ? "SUCCESS" : "FAILED");

                    actionResults.push(result);

                    // If action failed and no fallback, stop execution
                    if (!result.success && !plan.fallbackPlan) {
                        console.log("❌ Action failed and no fallback plan. Stopping execution.");
                        break;
                    }
                } catch (error: any) {
                    console.error(`❌ Action ${i + 1} error:`, error.message);

                    actionResults.push({
                        success: false,
                        action: action.action,
                        error: error.message,
                        logs: [],
                    });

                    break; // Stop on first error
                }
            }
        } else {
            console.log("ℹ️ No executable actions in plan (conversation only)");
        }

        // =====================================================
        // PHASE 3: EXECUTOR (Interpret & Respond)
        // =====================================================

        console.log("💬 PHASE 3: Calling Executor to interpret results...");

        const executorApiKey = await getGroqApiKey(supabase, "executor");

        const executorMessages = [
            { role: "system", content: EXECUTOR_PROMPT },
            ...conversationHistory.map((msg: any) => ({
                role: msg.role,
                content: msg.content,
            })),
            { role: "user", content: message },
            {
                role: "assistant",
                content: `PLANO GERADO:\n${JSON.stringify(plan, null, 2)}\n\nRESULTADOS DA EXECUÇÃO:\n${JSON.stringify(
                    actionResults,
                    null,
                    2
                )}\n\nAgora responda ao usuário baseado nos resultados REAIS acima. Seja honesto e claro.`,
            },
        ];

        let executorResponse = "";

        try {
            executorResponse = await callGroq(
                executorApiKey,
                GROQ_EXECUTOR_MODEL,
                executorMessages,
                0.7
            );

            console.log("✅ Executor response received");
        } catch (execError: any) {
            console.error("❌ Executor failed:", execError.message);

            executorResponse = `⚠️ Executei as ações mas tive problema ao gerar resposta. Aqui está o que aconteceu:\n\n${JSON.stringify(
                actionResults,
                null,
                2
            )}`;
        }

        // =====================================================
        // SAVE TO DATABASE
        // =====================================================

        await supabase.from("ChatMessage").insert([
            {
                conversationId,
                role: "user",
                content: message,
                userId: user.id,
            },
            {
                conversationId,
                role: "assistant",
                content: executorResponse,
                userId: user.id,
                metadata: {
                    plan,
                    actionResults,
                    sessionId,
                },
            },
        ]);

        console.log("✅ Messages saved to database");

        // =====================================================
        // RETURN RESPONSE
        // =====================================================

        return new Response(
            JSON.stringify({
                content: executorResponse,
                metadata: {
                    plan,
                    actionResults,
                    sessionId,
                },
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error: any) {
        console.error("❌ Fatal error:", error);

        return new Response(
            JSON.stringify({
                error: error.message || "Internal error",
                stack: error.stack,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 500,
            }
        );
    }
});
