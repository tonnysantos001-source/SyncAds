import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_utils/cors.ts";
import { REASONER_PROMPT } from "./reasoner.ts";
import { PLANNER_PROMPT } from "./planner.ts";
import { ReasonerOutput, PlannerOutput } from "./types.ts";
import { ReasonerVerifier } from "./reasoner-verifier.ts";
import { processImagePlaceholders } from "./image-fetcher.ts";

console.log("­ƒÜÇ Agentic Chat Stream - Multi-Agent V2 Loaded");

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
        throw new Error("IA retornou JSON inv├ílido.");
    }
}

// MAIN HANDLER
serve(async (req) => {
    if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

    try {
        console.log("­ƒôÑ [START] Request received");
        const { message, conversationId, deviceId } = await req.json();
        console.log("­ƒôª [DATA] Parsed:", { conversationId, hasMessage: !!message, deviceId });

        if (!message) throw new Error("Message required");
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            console.error("❌ [AUTH] Missing Authorization header");
            return new Response(
                JSON.stringify({ error: "Missing Authorization header" }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("🔐 [AUTH] Authorization header received:", authHeader.substring(0, 20) + "...");
        console.log("🔧 [ENV] SUPABASE_URL:", Deno.env.get("SUPABASE_URL"));
        console.log("🔧 [ENV] SERVICE_ROLE exists:", !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"));

        // Extrair o token do header
        const token = authHeader.replace("Bearer ", "");

        // IMPORTANTE: Usar SERVICE_ROLE_KEY para poder validar qualquer token JWT
        // A ANON_KEY requer sessão ativa, SERVICE_ROLE pode validar tokens diretamente
        const supabaseAdmin = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY")!
        );

        console.log("🔐 [AUTH] Getting user from token...");

        // Usar getUser passando o token diretamente
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError) {
            console.error("❌ [AUTH] Error details:", authError);
            return new Response(
                JSON.stringify({
                    error: "Authentication failed",
                    details: authError.message,
                    hint: "Token inválido ou expirado. Faça login novamente."
                }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        if (!user) {
            console.error("❌ [AUTH] No user found");
            return new Response(
                JSON.stringify({
                    error: "No user found",
                    hint: "Token inválido. Faça login novamente na extensão."
                }),
                { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        console.log("✅ [AUTH] User OK:", user.id);

        // Criar cliente normal para operações de banco (com permissões do usuário)
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_ANON_KEY")!,
            { global: { headers: { Authorization: authHeader } } }
        );



        // Get Groq Key from Environment or Database
        console.log("­ƒöæ [KEY] Checking for API key...");
        let groqKey = Deno.env.get("GROQ_API_KEY");

        if (!groqKey) {
            console.log("ÔÜá´©Å GROQ_API_KEY not in env, trying database...");
            const { data: keys } = await supabase
                .from("GlobalAiConnection")
                .select("apiKey")
                .eq("provider", "GROQ")
                .eq("isActive", true);

            if (!keys || keys.length === 0) throw new Error("No Groq API Key found in env or database");

            // Random Selection for Load Balancing
            const randomIndex = Math.floor(Math.random() * keys.length);
            groqKey = keys[randomIndex].apiKey;
            console.log(`­ƒöæ Using Groq Key from DB Index: ${randomIndex} (Total: ${keys.length})`);
        } else {
            console.log(`­ƒöæ Using Groq Key from Environment Variable`);
        }

        const readable = createStream(async (writer) => {

            let loopCount = 0;
            const MAX_EXECUTION_CYCLES = 5;
            let currentMessage = message;
            let lastExecutionResult: any = null;
            let strategyHint = "";

            while (loopCount < MAX_EXECUTION_CYCLES) {
                loopCount++;
                console.log(`­ƒöä [LOOP] Cycle ${loopCount}/${MAX_EXECUTION_CYCLES}`);

                // 1. REASONER (THINKING)
                await writeToStream(writer, "state", `THINKING (Cycle ${loopCount})`);

                const reasonerMessages = [
                    { role: "system", content: REASONER_PROMPT },
                    {
                        role: "user", content: `
Contexto: device_id="${deviceId}"
Pedido: ${currentMessage}
${strategyHint ? `ÔÜá´©Å DICA DE RETRY ANTERIOR: ${strategyHint}` : ""}
${lastExecutionResult ? `ÔÜá´©Å RESULTADO ANTERIOR: ${JSON.stringify(lastExecutionResult)}` : ""}
` }
                ];

                const reasonerOutput: ReasonerOutput = await callGroqJSON(groqKey, reasonerMessages);
                console.log(`­ƒºá [Reasoner] Strategy:`, reasonerOutput);

                // ­ƒøæ INTENT GATE (Early Exit for Chat)
                if (reasonerOutput.action_required === false) {
                    await writeToStream(writer, "state", "DONE");
                    // Use the response generated by the Reasoner or a default
                    const response = reasonerOutput.direct_response || reasonerOutput.strategy_analysis || "Entendido.";
                    await writeToStream(writer, "content", response);

                    // Save History
                    await supabase.from("ChatMessage").insert([
                        { conversationId, role: "user", content: message, userId: user.id },
                        { conversationId, role: "assistant", content: JSON.stringify({ reasonerOutput }), userId: user.id }
                    ]);
                    return; // EXIT LOOP IMMEDIATELY
                }

                // 2. PLANNER (PLANNING)
                await writeToStream(writer, "state", "PLANNING");

                const plannerContext = `
ESTRAT├ëGIA (REASONER): ${JSON.stringify(reasonerOutput)}
CONTEXTO T├ëCNICO: device_id="${deviceId}"
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

                // ­ƒÄ¿ PROCESS IMAGE PLACEHOLDERS (if insert_via_api command)
                for (const cmd of plan.commands) {
                    if (cmd.type === 'insert_via_api' && cmd.payload?.value) {
                        console.log("­ƒÄ¿ Processing image placeholders in content...");
                        cmd.payload.value = await processImagePlaceholders(cmd.payload.value);
                    }
                }

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

                // ­ƒÜÇ EXECUTE insert_via_api DIRECTLY via Playwright
                for (const cmd of insertedCommands) {
                    if (cmd.type === 'insert_via_api') {
                        console.log("­ƒÄ» [API EXECUTE] Calling Playwright HTTP service...");

                        try {
                            // Call Playwright service on Hugging Face
                            const playwrightResponse = await fetch('https://bigodetonton-syncads-google-docs-api.hf.space/insert-content', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    content: cmd.payload.value,
                                    // Playwright will create new document
                                })
                            });

                            if (!playwrightResponse.ok) {
                                const errorText = await playwrightResponse.text();
                                throw new Error(`Playwright API Error (${playwrightResponse.status}): ${errorText}`);
                            }

                            const playwrightResult = await playwrightResponse.json();
                            console.log("Ô£à [API EXECUTE] Playwright execution complete:", playwrightResult);

                            // Extract document URL from Playwright response
                            const docUrl = playwrightResult.doc_url || playwrightResult.url || "";
                            const docTitle = playwrightResult.title || "Documento sem nome";

                            // Write result back to DB for chat-stream polling
                            await supabase
                                .from("extension_commands")
                                .update({
                                    status: 'completed',
                                    result: {
                                        success: true,
                                        command_type: 'insert_via_api',
                                        url_after: docUrl,
                                        doc_url: docUrl,
                                        title_after: docTitle,
                                        result: playwrightResult
                                    },
                                    completed_at: new Date().toISOString()
                                })
                                .eq('id', cmd.id);

                            console.log(`Ô£à [API EXECUTE] Result written to DB for command ${cmd.id}`);

                        } catch (error) {
                            console.error("ÔØî [API EXECUTE] Playwright execution failed:", error);

                            // Write error to DB
                            await supabase
                                .from("extension_commands")
                                .update({
                                    status: 'failed',
                                    result: {
                                        success: false,
                                        error: error.message,
                                        retryable: true
                                    }
                                })
                                .eq('id', cmd.id);
                        }
                    }
                }

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
                    lastExecutionResult = { success: false, retryable: true, errors: ["Timeout aguardando execu├º├úo"] };
                }

                // Call Verifier AI
                const verification = await ReasonerVerifier.verify(groqKey, reasonerOutput, lastExecutionResult, loopCount, callGroqJSON);
                console.log(`­ƒøí´©Å [Verifier] Decision:`, verification);

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
                    await writeToStream(writer, "content", `\n\nÔÜá´©Å *Ocorreu um problema, ajustando estrat├®gia...* (${strategyHint})`);
                    // Loop continues...
                }

                if (verification.status === "FAILURE") {
                    await writeToStream(writer, "state", "ERROR");
                    await writeToStream(writer, "content", `\n\nÔØî **Falha Definitiva:** ${verification.reason}`);
                    return; // EXIT LOOP WITH ERROR
                }
            }

            // SAFETY GUARD EXIT
            await writeToStream(writer, "state", "ERROR");
            await writeToStream(writer, "content", `\n\nÔÜá´©Å **Limite de tentativas excedido (${MAX_EXECUTION_CYCLES}).** O sistema parou para seguran├ºa.`);

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
