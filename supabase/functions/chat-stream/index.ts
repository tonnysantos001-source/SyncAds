import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_utils/cors.ts";
import { REASONER_PROMPT } from "./reasoner.ts";
import { PLANNER_PROMPT } from "./planner.ts";
import { ReasonerOutput, PlannerOutput } from "./types.ts";
import { ReasonerVerifier } from "./reasoner-verifier.ts";
import { processImagePlaceholders } from "./image-fetcher.ts";
import { generateEditorialPlan, buildDocStructure, renderToGoogleDocs } from "./editorial/index.ts";

console.log("­ƒÜÇ Agentic Chat Stream - Multi-Agent V2 Loaded");

// CONFIG
const GROQ_MODEL = "llama-3.3-70b-versatile";
const MISTRAL_MODEL = "mistral-medium-latest";
const MISTRAL_API_URL = "https://api.mistral.ai/v1/chat/completions";

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
            max_tokens: 8000, // 🔥 CRÍTICO: Permite respostas longas para ebooks completos
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

// 🌯 MISTRAL API - Planner (mais inteligente, não trunca)
async function callMistralJSON(apiKey: string, messages: any[]): Promise<any> {
    console.log("🔮 [MISTRAL] Calling Mistral API...");

    const response = await fetch(MISTRAL_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: MISTRAL_MODEL,
            messages: messages,
            temperature: 0.1, // Precision 
            max_tokens: 8000,
            response_format: { type: "json_object" }, // JSON mode
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        console.error("❌ [MISTRAL] API Error:", error);
        throw new Error(`Mistral API Error: ${error}`);
    }

    const data = await response.json();
    console.log("✅ [MISTRAL] Response received");

    try {
        return JSON.parse(data.choices[0].message.content);
    } catch (e) {
        console.error("❌ [MISTRAL] Failed to parse JSON:", data.choices[0].message.content);
        throw new Error("Mistral retornou JSON inválido.");
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
        console.log("🔑 [KEY] Checking for API key...");
        let groqKey = Deno.env.get("GROQ_API_KEY");

        if (!groqKey) {
            console.log("⚠️ GROQ_API_KEY not in env, trying database...");

            // IMPORTANTE: Usar supabaseAdmin para buscar keys (bypassa RLS)
            // Se não tiver SERVICE_ROLE, tenta com cliente normal
            const clientForKeys = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
                ? supabaseAdmin
                : supabase;

            console.log("🔑 Using", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ? "SERVICE_ROLE" : "ANON", "client for keys query");

            const { data: keys, error: keysError } = await clientForKeys
                .from("GlobalAiConnection")
                .select("apiKey, name")
                .eq("provider", "GROQ")
                .eq("isActive", true);

            if (keysError) {
                console.error("❌ [KEY] Database error:", keysError);
                throw new Error(`Failed to fetch API keys: ${keysError.message}`);
            }

            console.log(`🔑 [KEY] Found ${keys?.length || 0} keys in database`);

            if (!keys || keys.length === 0) {
                console.error("❌ [KEY] No keys found! Check RLS policies on GlobalAiConnection table");
                throw new Error("No Groq API Key found in env or database. Check RLS policies!");
            }

            // Random Selection for Load Balancing
            const randomIndex = Math.floor(Math.random() * keys.length);
            groqKey = keys[randomIndex].apiKey;
            console.log(`🔑 Using Groq Key: ${keys[randomIndex].name} (Index: ${randomIndex}, Total: ${keys.length})`);
        } else {
            console.log(`­ƒöæ Using Groq Key from Environment Variable`);
        }

        // 🔮 Get Mistral Key from Environment or Database (Planner)
        console.log("🔮 [KEY] Checking for Mistral API key...");
        let mistralKey = Deno.env.get("MISTRAL_API_KEY");

        if (!mistralKey) {
            console.log("⚠️ MISTRAL_API_KEY not in env, trying database...");

            const clientForKeys = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
                ? supabaseAdmin
                : supabase;

            const { data: mistralKeys, error: mistralKeysError } = await clientForKeys
                .from("GlobalAiConnection")
                .select("apiKey, name")
                .eq("provider", "MISTRAL")
                .eq("isActive", true);

            if (mistralKeysError) {
                console.error("❌ [MISTRAL] Database error:", mistralKeysError);
                console.warn("⚠️ [MISTRAL] No Mistral key found, will use Groq for Planner");
                mistralKey = groqKey; // Fallback
            } else if (!mistralKeys || mistralKeys.length === 0) {
                console.warn("⚠️ [MISTRAL] No keys found, will use Groq for Planner");
                mistralKey = groqKey; // Fallback
            } else {
                const randomIndex = Math.floor(Math.random() * mistralKeys.length);
                mistralKey = mistralKeys[randomIndex].apiKey;
                console.log(`🔮 Using Mistral Key: ${mistralKeys[randomIndex].name} (Index: ${randomIndex}, Total: ${mistralKeys.length})`);
            }
        } else {
            console.log(`🔮 Using Mistral Key from Environment Variable`);
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

                const plan: PlannerOutput = await callMistralJSON(mistralKey, plannerMessages);

                const targetDeviceId = plan.device_id || deviceId;

                // 🆕 EDITORIAL MIDDLEWARE (se aplicável)
                let finalPlan = plan;
                try {
                    const editorialPlan = generateEditorialPlan(currentMessage, reasonerOutput);

                    if (editorialPlan) {
                        console.log("📚 [EDITORIAL] Aplicando estrutura editorial...");

                        // Extrair conteúdo bruto do plano original
                        const insertCommand = plan.commands.find(c => c.type === 'insert_via_api');

                        if (insertCommand?.payload?.value) {
                            const rawContent = insertCommand.payload.value;
                            console.log(`📄 [EDITORIAL] Conteúdo original: ${rawContent.length} bytes`);

                            // Processar placeholders de imagem ANTES de estruturar
                            let contentWithImages = await processImagePlaceholders(rawContent);

                            // 🔥 TEMPLATE CONVERTER - FORÇAR uso de placeholders (v6)
                            const { safeConvertToTemplate } = await import("./editorial/template-converter.ts");

                            const conversionResult = safeConvertToTemplate(
                                contentWithImages,
                                editorialPlan.documentType
                            );

                            if (conversionResult.converted) {
                                console.log("✅ [EDITORIAL] HTML convertido para template com placeholders");
                                contentWithImages = conversionResult.html;
                            } else {
                                console.log("ℹ️ [EDITORIAL] HTML não requer conversão (já é template ou tipo não suportado)");
                            }

                            // 🔥 EXPANDER - Gerar seções isoladamente se tiver placeholders
                            const { hasPlaceholders, expandPlaceholders } = await import("./editorial/expander.ts");

                            if (hasPlaceholders(contentWithImages)) {
                                console.log("🔄 [EDITORIAL] Placeholders detectados, expandindo seções...");

                                // 🔥 v7: CRIAR FUNÇÃO CALLBACK para Groq (com load balancing)
                                const callGroqFunction = async (prompt: string, options: any) => {
                                    console.log("🔑 [EXPANDER-CALLBACK] Chamando Groq via callback (load balancing)...");

                                    // Usar callGroqJSON existente (já tem load balancing + retry!)
                                    const response = await callGroqJSON(
                                        prompt,
                                        {
                                            temperature: options.temperature || 0.7,
                                            max_tokens: options.max_tokens || 8000,
                                        },
                                        groqKey
                                    );

                                    return response;
                                };

                                try {
                                    contentWithImages = await expandPlaceholders(
                                        contentWithImages,
                                        callGroqFunction,  // ✅ Passa função ao invés de string key
                                        editorialPlan.title
                                    );
                                    console.log("✅ [EDITORIAL] Placeholders expandidos com sucesso");
                                } catch (error) {
                                    console.error("⚠️ [EDITORIAL] Erro ao expandir placeholders:", error);
                                    // Continua com content sem expandir (melhor que quebrar)
                                }
                            } else {
                                console.log("ℹ️ [EDITORIAL] Sem placeholders, usando conteúdo direto");
                            }

                            // Construir estrutura editorial (com finalizer integrado)
                            const structuredContent = await buildDocStructure(editorialPlan, contentWithImages);

                            // Gerar comandos estruturados
                            const editorialCommands = await renderToGoogleDocs(
                                structuredContent,
                                targetDeviceId,
                                editorialPlan
                            );

                            // Substituir comandos por versão estruturada
                            finalPlan = {
                                ...plan,
                                message: `${plan.message} (com estrutura editorial aplicada)`,
                                commands: editorialCommands
                            };

                            console.log("✅ [EDITORIAL] Estrutura editorial aplicada com sucesso");
                        } else {
                            console.log("⚠️ [EDITORIAL] Comando insert_via_api não encontrado, usando plano original");
                        }
                    } else {
                        console.log("ℹ️ [EDITORIAL] Não é conteúdo editorial, mantendo plano original");
                    }
                } catch (editorialError) {
                    console.error("❌ [EDITORIAL] Erro no middleware, usando plano original:", editorialError);
                    // Fallback: continua com plano original
                }

                // Stream Planner message if any
                if (finalPlan.message && loopCount === 1) {
                    await writeToStream(writer, "content", finalPlan.message);
                }

                // If no commands, we are done
                if (!finalPlan.commands || finalPlan.commands.length === 0) {
                    await writeToStream(writer, "state", "DONE");
                    if (loopCount > 1) {
                        // Only add done message if not the very first thought
                        await writeToStream(writer, "content", "\n\n(Fluxo encerrado pelo Planner)");
                    }
                    break;
                }

                // 3. EXECUTION (PERSIST & WATCH)
                await writeToStream(writer, "state", "EXECUTING");

                // ­ƒÄ¿ PROCESS IMAGE PLACEHOLDERS (if insert_via_api command)
                for (const cmd of finalPlan.commands) {
                    if (cmd.type === 'insert_via_api' && cmd.payload?.value) {
                        console.log("­ƒÄ¿ Processing image placeholders in content...");
                        cmd.payload.value = await processImagePlaceholders(cmd.payload.value);
                    }
                }

                // ✅ FILTER DUPLICATE insert_via_api COMMANDS
                // CRITICAL: Only allow ONE insert_via_api command per execution cycle
                let filteredCommands = finalPlan.commands;
                const insertViaApiCommands = filteredCommands.filter(cmd => cmd.type === 'insert_via_api');

                if (insertViaApiCommands.length > 1) {
                    console.warn(`⚠️ [PLANNER] Generated ${insertViaApiCommands.length} insert_via_api commands - keeping only the FIRST one`);
                    // Keep only the first insert_via_api command
                    let keptInsertApi = false;
                    filteredCommands = filteredCommands.filter(cmd => {
                        if (cmd.type === 'insert_via_api') {
                            if (!keptInsertApi) {
                                keptInsertApi = true;
                                return true; // Keep first one
                            }
                            return false; // Remove duplicates
                        }
                        return true; // Keep other commands
                    });
                }

                // Allow only recognized commands
                const commandsToInsert = filteredCommands.map(cmd => ({
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

                // ✅ Commands inserted - Extension will execute them
                console.log(`✅ [EXECUTE] ${insertedCommands.length} commands inserted into queue`);

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
