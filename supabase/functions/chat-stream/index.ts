import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";
import { PLANNER_PROMPT, PlannerOutput } from "./planner.ts";

console.log("🚀 Agentic Chat Stream - Strict Orchestrator Loaded");

// ==========================================
// CONFIG
// ==========================================
const GROQ_MODEL = "llama-3.3-70b-versatile";

// ==========================================
// HELPERS
// ==========================================
function createStream(
    callback: (writer: WritableStreamDefaultWriter<Uint8Array>) => Promise<void>
) {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    (async () => {
        try {
            await callback(writer);
        } catch (e) {
            console.error("Stream error:", e);
            await writer.write(encoder.encode(JSON.stringify({ type: "error", content: e.message }) + "\n"));
        } finally {
            await writer.close();
        }
    })();

    return readable;
}

async function writeToStream(writer: WritableStreamDefaultWriter<any>, type: string, content: any) {
    const encoder = new TextEncoder();
    await writer.write(encoder.encode(JSON.stringify({ type, content }) + "\n"));
}

async function callGroqJSON(apiKey: string, messages: any[]): Promise<PlannerOutput> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: messages,
            temperature: 0.1,
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) throw new Error(`Groq API Error: ${await response.text()}`);
    const data = await response.json();
    return JSON.parse(data.choices[0].message.content);
}

// ==========================================
// MAIN HANDLER
// ==========================================
serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        const { message, conversationId, deviceId } = await req.json();

        if (!message) throw new Error("Message required");

        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing Authorization header");

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Unauthorized");

        // Get Groq Key
        const { data: keyData } = await supabase
            .from("GlobalAiConnection")
            .select("apiKey")
            .eq("provider", "GROQ")
            .eq("isActive", true)
            .limit(1)
            .single();

        if (!keyData?.apiKey) throw new Error("No Groq API Key found");
        const groqKey = keyData.apiKey;

        // ==========================================
        // ORCHESTRATOR LOGIC
        // ==========================================
        const readable = createStream(async (writer) => {

            // 1. STATE: PLANNING
            await writeToStream(writer, "state", "planejando");

            const messages = [
                { role: "system", content: PLANNER_PROMPT },
                { role: "user", content: message }
            ];

            const plan = await callGroqJSON(groqKey, messages);

            // Emit Plan Info (Ticking)
            await writeToStream(writer, "plan", plan);
            await writeToStream(writer, "state", `Plano gerado: ${plan.steps.length} passos`);

            if (!plan.steps || plan.steps.length === 0) {
                await writeToStream(writer, "content", plan.reasoning || "Não consegui gerar um plano.");
                return;
            }

            if (!deviceId) throw new Error("Dispositivo não conectado.");

            // 2. INSERT COMMANDS (Pending)
            await writeToStream(writer, "state", "persistindo comandos");

            const commandsToInsert = plan.steps.map(step => ({
                device_id: deviceId,
                type: step.action,
                data: {
                    url: step.url,
                    selector: step.selector,
                    text: step.text,
                    key: step.key,
                    description: step.description
                },
                status: 'pending',
                user_id: user.id
            }));

            const { data: insertedCommands, error: dbError } = await supabase
                .from("extension_commands")
                .insert(commandsToInsert)
                .select();

            if (dbError) throw new Error(`Erro BD: ${dbError.message}`);

            // 3. EXECUTION MONITORING (Strict No-Lie)
            // We will loop through the inserted commands and monitor their status
            // We DO NOT write success. We wait for the extension to write success.

            await writeToStream(writer, "state", "executando");

            for (const cmd of insertedCommands) {
                await writeToStream(writer, "state", `executando: ${cmd.data.description}`);

                let finalStatus = 'pending';
                let evidence = null;
                let attempts = 0;
                const MAX_WAIT_SECONDS = 45;

                while (attempts < MAX_WAIT_SECONDS) {
                    await new Promise(r => setTimeout(r, 1000));

                    const { data: currentCmd } = await supabase
                        .from("extension_commands")
                        .select("status, result, error, evidence") // evidence must be a column
                        .eq("id", cmd.id)
                        .single();

                    if (currentCmd.status === 'completed') {
                        finalStatus = 'completed';
                        evidence = currentCmd.evidence || currentCmd.result;
                        break;
                    }
                    if (currentCmd.status === 'failed') {
                        finalStatus = 'failed';
                        break;
                    }
                    // Reflect Extension States like "processing", "validating"
                    if (currentCmd.status !== 'pending' && currentCmd.status !== 'processing') {
                        // If extension adds new intermediate states
                        // await writeToStream(writer, "state", currentCmd.status);
                    }
                    attempts++;
                }

                if (finalStatus === 'completed') {
                    // Validated success
                    await writeToStream(writer, "content", `✅ **${cmd.data.description}**\n`);
                } else if (finalStatus === 'failed') {
                    await writeToStream(writer, "content", `❌ **${cmd.data.description}**: Falhou.\n`);
                    await writeToStream(writer, "error", "Execução interrompida pela extensão.");
                    break; // Stop chain
                } else {
                    await writeToStream(writer, "content", `⚠️ **${cmd.data.description}**: Timeout (sem confirmação visual).\n`);
                    break;
                }
            }

            await writeToStream(writer, "state", "concluído");

            // Save History
            await supabase.from("ChatMessage").insert([
                { conversationId, role: "user", content: message, userId: user.id },
                { conversationId, role: "assistant", content: JSON.stringify(plan), userId: user.id }
            ]);

        });

        return new Response(readable, {
            headers: { ...corsHeaders, "Content-Type": "application/x-ndjson" }
        });

    } catch (error) {
        console.error("Handler error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500
        });
    }
});
