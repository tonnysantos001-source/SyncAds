import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";
import { REASONER_PROMPT } from "./reasoner.ts";
import { PLANNER_PROMPT } from "./planner.ts";
import { ReasonerOutput, PlannerOutput } from "./types.ts";
import { ReasonerVerifier } from "./reasoner-verifier.ts";

console.log("🚀 Agentic Chat Stream - Multi-Agent V2 Loaded");

// CONFIG
const GROQ_MODEL = "llama-3.3-70b-versatile";

// TYPES
// INTERFACES REMOVED - IMPORTED FROM types.ts
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

async function callGroqJSON(apiKey: string, messages: any[]): Promise<any> {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: GROQ_MODEL,
            messages: messages,
            temperature: 0.1, // Precision is key
            response_format: { type: "json_object" }
        }),
    });

    if (!response.ok) throw new Error(`Groq API Error: ${await response.text()}`);
    const data = await response.json();
    try {
        return JSON.parse(data.choices[0].message.content);
    } catch (e) {
        console.error("Failed to parse Groq JSON:", data.choices[0].message.content);
        throw new Error("IA retornou JSON inválido.");
    }
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

            let loopCount = 0;
            const MAX_EXECUTION_CYCLES = 5;
            let currentMessage = message;
            let lastExecutionResult: any = null;
            let strategyHint = "";

            while (loopCount < MAX_EXECUTION_CYCLES) {
                loopCount++;
                console.log(`🔄 [LOOP] Cycle ${loopCount}/${MAX_EXECUTION_CYCLES}`);

                // 1. REASONER (THINKING)
                await writeToStream(writer, "state", `THINKING (Cycle ${loopCount})`);

                const reasonerMessages = [
                    { role: "system", content: REASONER_PROMPT },
                    {
                        role: "user", content: `
Contexto: device_id="${deviceId}"
Pedido: ${currentMessage}
${strategyHint ? `⚠️ DICA DE RETRY ANTERIOR: ${strategyHint}` : ""}
${lastExecutionResult ? `⚠️ RESULTADO ANTERIOR: ${JSON.stringify(lastExecutionResult)}` : ""}
` }
                ];

                const reasonerOutput: ReasonerOutput = await callGroqJSON(groqKey, reasonerMessages);
                console.log(`🧠 [Reasoner] Strategy:`, reasonerOutput);

                // 2. PLANNER (PLANNING)
                await writeToStream(writer, "state", "PLANNING");

                const plannerContext = `
ESTRATÉGIA (REASONER): ${JSON.stringify(reasonerOutput)}
CONTEXTO TÉCNICO: device_id="${deviceId}"
DICA DE RETRY: ${strategyHint || "Nenhuma"}
`;
                const plannerMessages = [
                    { role: "system", content: PLANNER_PROMPT },
                    { role: "user", content: plannerContext }
                ];

                const plan: PlannerOutput = await callGroqJSON(groqKey, plannerMessages);

                // Stream Planner message if any
                if (plan.message && loopCount === 1) {
                    await writeToStream(writer, "content", plan.message);
                }

                // If no commands, we are done
                if (!plan.commands || plan.commands.length === 0) {
                    await writeToStream(writer, "state", "DONE");
                    if (loopCount > 1) {
                        // Only add done message if not the very first thought
                        await writeToStream(writer, "content", "\n\n(Fluxo encerrado pelo Planner)");
                    }
                    break;
                }

                const targetDeviceId = plan.device_id || deviceId;

                // 3. EXECUTION (PERSIST & WATCH)
                await writeToStream(writer, "state", "EXECUTING");

                // Allow only recognized commands
                const commandsToInsert = plan.commands.map(cmd => ({
                    device_id: targetDeviceId,
                    type: cmd.type,
                    command_type: cmd.type,
                    payload: cmd.payload,
                    status: 'pending',
                    user_id: user.id
                }));

                const { data: insertedCommands, error: dbError } = await supabase
                    .from("extension_commands")
                    .insert(commandsToInsert)
                    .select();

                if (dbError) throw new Error(`DB Error: ${dbError.message}`);

                // Monitor Execution (Wait for ALL)
                let cycleExecutionResult: any = null;

                for (const cmd of insertedCommands) {
                    // Polling loop
                    const MAX_WAIT = 60;
                    let finalStatus = 'pending';

                    for (let i = 0; i < MAX_WAIT; i++) {
                        await new Promise(r => setTimeout(r, 1000));
                        const { data: current } = await supabase.from("extension_commands").select("*").eq("id", cmd.id).single();

                        if (current.status === 'done' || current.status === 'completed' || current.status === 'failed' || current.status === 'error') {
                            cycleExecutionResult = current.result; // GRAB RESULT (Extension must write this!)
                            finalStatus = current.status;
                            break;
                        }
                    }

                    if (finalStatus === 'failed' || finalStatus === 'error') break; // Stop executing plan on first error
                }

                lastExecutionResult = cycleExecutionResult;

                // 4. VERIFIER (VALIDATION)
                await writeToStream(writer, "state", "VERIFYING");

                // If we have no result (timeout or logic error), mock a failure result
                if (!lastExecutionResult) {
                    lastExecutionResult = { success: false, retryable: true, errors: ["Timeout aguardando execução"] };
                }

                // Call Verifier AI
                const verification = await ReasonerVerifier.verify(groqKey, reasonerOutput, lastExecutionResult, loopCount, callGroqJSON);
                console.log(`🛡️ [Verifier] Decision:`, verification);

                if (verification.status === "SUCCESS" || verification.status === "PARTIAL_SUCCESS") {
                    await writeToStream(writer, "state", "DONE");
                    if (verification.final_message_to_user) {
                        await writeToStream(writer, "content", `\n\n${verification.final_message_to_user}`);
                    }

                    // SAVE HISTORY
                    await supabase.from("ChatMessage").insert([
                        { conversationId, role: "user", content: message, userId: user.id },
                        { conversationId, role: "assistant", content: JSON.stringify({ plan, verification }), userId: user.id }
                    ]);
                    return; // EXIT LOOP SUCCESSFULLY
                }

                if (verification.status === "RETRY") {
                    strategyHint = verification.new_strategy_hint || "Tente uma abordagem diferente.";
                    await writeToStream(writer, "content", `\n\n⚠️ *Ocorreu um problema, ajustando estratégia...* (${strategyHint})`);
                    // Loop continues...
                }

                if (verification.status === "FAILURE") {
                    await writeToStream(writer, "state", "ERROR");
                    await writeToStream(writer, "content", `\n\n❌ **Falha Definitiva:** ${verification.reason}`);
                    return; // EXIT LOOP WITH ERROR
                }
            }

            // SAFETY GUARD EXIT
            await writeToStream(writer, "state", "ERROR");
            await writeToStream(writer, "content", `\n\n⚠️ **Limite de tentativas excedido (${MAX_EXECUTION_CYCLES}).** O sistema parou para segurança.`);

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
