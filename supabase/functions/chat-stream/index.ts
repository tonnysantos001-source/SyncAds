import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";
import { PLANNER_PROMPT, PlannerOutput } from "./planner.ts";

console.log("🚀 Agentic Chat Stream - Hybrid Orchestrator Loaded");

// CONFIG
const GROQ_MODEL = "llama-3.3-70b-versatile";

// HELPERS
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

// MAIN HANDLER
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

        const readable = createStream(async (writer) => {

            // 1. STATE: ANALYZING
            await writeToStream(writer, "state", "ANALYZING_PAGE");

            const messages = [
                { role: "system", content: PLANNER_PROMPT },
                { role: "user", content: `Contexto: device_id="${deviceId}"\nPedido: ${message}` }
            ];

            await writeToStream(writer, "state", "PLANEJANDO");

            const plan = await callGroqJSON(groqKey, messages);

            // STREAM OPTIONAL MESSAGE FIRST
            if (plan.message) {
                await writeToStream(writer, "content", plan.message);
            }

            // CHECK IF COMMANDS EXIST
            if (!plan.commands || plan.commands.length === 0) {
                // Only chat, done.
                await writeToStream(writer, "state", "DONE");
                return;
            }

            const targetDeviceId = plan.device_id || deviceId;
            if (!targetDeviceId) throw new Error("Device ID missing in execution plan.");

            // 2. INSERT COMMANDS (Pending)
            await writeToStream(writer, "state", "PERSISTINDO_COMANDOS");

            // VALIDATION: CANONICAL COMMANDS ONLY
            const ALLOWED_TYPES = ["navigate", "wait", "click", "type", "scroll"];

            const commandsToInsert = [];
            for (const cmd of plan.commands) {
                if (!ALLOWED_TYPES.includes(cmd.type)) {
                    throw new Error(`CRITICAL: Planner generated illegal command type: '${cmd.type}'. Allowed: ${ALLOWED_TYPES.join(", ")}`);
                }

                // Validate strict payloads
                if (cmd.type === "wait" && !cmd.payload.selector) {
                    // Auto-fix or unknown? For now strict error.
                    throw new Error(`CRITICAL: Command 'wait' missing required 'selector' payload.`);
                }

                commandsToInsert.push({
                    device_id: targetDeviceId,
                    type: cmd.type,          // Planner Type
                    command_type: cmd.type,  // DB Column (often redundant but kept for safety)
                    payload: cmd.payload,
                    status: 'pending',
                    user_id: user.id
                });
            }

            const { data: insertedCommands, error: dbError } = await supabase
                .from("extension_commands")
                .insert(commandsToInsert)
                .select();

            if (dbError) {
                console.error("DB Error:", dbError);
                await writeToStream(writer, "state", "ERROR");
                throw new Error(`Erro ao persistir comandos: ${dbError.message}`);
            }

            // 3. EXECUTION MONITORING
            await writeToStream(writer, "state", "EXECUTING");

            for (const cmd of insertedCommands) {
                let finalStatus = 'pending';
                const MAX_WAIT_SECONDS = 60;

                for (let i = 0; i < MAX_WAIT_SECONDS; i++) {
                    await new Promise(r => setTimeout(r, 1000));

                    const { data: currentCmd, error: pollError } = await supabase
                        .from("extension_commands")
                        .select("status, error")
                        .eq("id", cmd.id)
                        .single();

                    if (pollError) continue;

                    if (currentCmd.status === 'done' || currentCmd.status === 'completed') {
                        finalStatus = 'done';
                        break;
                    }
                    if (currentCmd.status === 'error' || currentCmd.status === 'failed') {
                        finalStatus = 'error';
                        break;
                    }
                }

                if (finalStatus === 'done') {
                    // Fetch the RESULT data (where the URL lives)
                    const { data: completedCmd } = await supabase
                        .from("extension_commands")
                        .select("result")
                        .eq("id", cmd.id)
                        .single();

                    if (completedCmd?.result?.url) {
                        const url = completedCmd.result.url;
                        const title = completedCmd.result.title || "Documento";

                        // Stream the link back to the user!
                        await writeToStream(writer, "content", `\n\n📄 **Documento Criado:** [${title}](${url})`);
                    }

                } else if (finalStatus === 'error') {
                    await writeToStream(writer, "state", "ERROR");
                    await writeToStream(writer, "content", `\n❌ Falha na ação: ${cmd.type}`);
                    return;
                } else {
                    await writeToStream(writer, "state", "TIMEOUT");
                    return;
                }
            }

            await writeToStream(writer, "state", "DONE");

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
