import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

interface AudioGenerationRequest {
    text: string;
    voice?: string;
    provider?: "elevenlabs" | "playht" | "google" | "huggingface";
    style?: "natural" | "expressive" | "calm" | "energetic";
}

// ✅ Use Service Role Key for internal administrative tasks (Storage, DB writes)
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Auth
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }

        const token = authHeader.replace("Bearer ", "");

        // ✅ AUTH BYPASS: Allow internal calls using Service Role Key
        let user = null;
        if (token === supabaseServiceKey) {
            console.log("🔐 [GENERATE-AUDIO] Internal admin call detected via Service Key");
            user = { id: "admin", email: "admin@syncads.com.br" };
        } else {
            // Normal user validation using admin client
            const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
            if (authError || !authUser) throw new Error("Unauthorized");
            user = authUser;
        }

        // Parse request
        const { text, voice = "rachel", provider = "elevenlabs", style = "natural" }: AudioGenerationRequest =
            await req.json();

        if (!text || text.trim() === "") {
            return new Response(
                JSON.stringify({ error: "Text is required" }),
                {
                    status: 400,
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                }
            );
        }

        console.log("🎙️ [Audio Generation] Starting:", {
            userId: user.id,
            textLength: text.length,
            voice,
            provider,
            style,
        });

        let audioUrl: string;
        let usedProvider: string;
        let duration: number;
        let cost: number;

        if (provider === "huggingface") {
            const HF_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY");
            if (HF_API_KEY) {
                try {
                    console.log("🎙️ [Hugging Face] Generating audio...");
                    const model = voice || "facebook/mms-tts-por";
                    
                    const response = await fetch(
                        `https://api-inference.huggingface.co/models/${model}`,
                        {
                            headers: {
                                Authorization: `Bearer ${HF_API_KEY}`,
                                "Content-Type": "application/json",
                            },
                            method: "POST",
                            body: JSON.stringify({ inputs: text }),
                        }
                    );

                    if (!response.ok) {
                        const errorText = await response.text();
                        let errorMsg = "Erro ao gerar áudio no Hugging Face";
                        try {
                            const errObj = JSON.parse(errorText);
                            if (errObj.error) errorMsg = errObj.error;
                        } catch (e) { }

                        if (errorMsg.includes("is currently loading") || errorMsg.includes("estimated_time")) {
                            throw new Error("O modelo gratuito de voz está inicializando. Aguarde 1 minuto e tente novamente.");
                        }
                        if (errorMsg.includes("deprecated or expired") || errorMsg.includes("invalid")) {
                            throw new Error("Sua chave de API do Hugging Face expirou ou é inválida. Atualize nos segredos do sistema.");
                        }
                        throw new Error(`Erro do Provedor (Hugging Face): ${errorMsg}`);
                    }

                    const audioBlob = await response.blob();
                    const audioBuffer = await audioBlob.arrayBuffer();

                    // Try to upload to storage bucket first
                    let audioStorageUrl: string | null = null;
                    let base64Data: string | null = null; // To store base64 for DB log if storage fails
                    try {
                        const fileName = `audio/${user.id}/${Date.now()}-${crypto.randomUUID()}.wav`;

                        const { error: uploadError } = await supabaseAdmin.storage
                            .from("media-generations")
                            .upload(fileName, audioBuffer, {
                                contentType: "audio/wav",
                                cacheControl: "3600",
                                upsert: true,
                            });

                        if (!uploadError) {
                            const { data: { publicUrl } } = supabaseAdmin.storage
                                .from("media-generations")
                                .getPublicUrl(fileName);
                            audioStorageUrl = publicUrl;
                            console.log("✅ [Hugging Face] Uploaded to storage");
                        } else {
                            console.warn("⚠️ Storage upload failed (bucket may not exist), using base64 fallback:", uploadError.message);
                        }
                    } catch (uploadErr) {
                        console.warn("⚠️ Storage exception, using base64 fallback:", uploadErr);
                    }

                    // Fallback: encode as base64 data URL if storage failed
                    if (!audioStorageUrl) {
                        const uint8Array = new Uint8Array(audioBuffer);
                        let binary = "";
                        for (let i = 0; i < uint8Array.byteLength; i++) {
                            binary += String.fromCharCode(uint8Array[i]);
                        }
                        base64Data = btoa(binary);
                        audioStorageUrl = `data:audio/wav;base64,${base64Data}`;
                        console.log("✅ [Hugging Face] Using base64 data URL fallback");
                    }

                    audioUrl = audioStorageUrl;
                    usedProvider = "huggingface";
                    duration = Math.ceil(text.length / 15);
                    cost = 0;
                    console.log("✅ [Hugging Face] Generated and uploaded");

                    // Track generation in DB using Admin client
                    try {
                        await supabaseAdmin.from("generated_audios").insert({
                            user_id: user.id,
                            type: "tts",
                            url: audioUrl || `data:audio/wav;base64,${base64Data}`,
                            prompt: text,
                            provider: "huggingface",
                            voice,
                            duration,
                        });
                    } catch (dbErr) {
                        console.warn("⚠️ Audio DB log failed:", dbErr);
                    }

                } catch (error) {
                    console.error("❌ [Hugging Face] Failed:", error);
                    throw error;
                }
            } else {
                 console.warn("⚠️ [Hugging Face] API key not configured");
                 throw new Error("Hugging Face API key not configured");
            }
        }

        // Try ElevenLabs first
        if (!audioUrl && provider === "elevenlabs") {
            const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

            if (ELEVENLABS_API_KEY) {
                try {
                    console.log("🎙️ [ElevenLabs] Generating audio...");

                    // Call ElevenLabs API
                    const response = await fetch(
                        `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
                        {
                            method: "POST",
                            headers: {
                                "xi-api-key": ELEVENLABS_API_KEY,
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                                text,
                                model_id: "eleven_monolingual_v1",
                                voice_settings: {
                                    stability: style === "calm" ? 0.7 : style === "energetic" ? 0.3 : 0.5,
                                    similarity_boost: style === "expressive" ? 0.9 : 0.75,
                                },
                            }),
                        }
                    );

                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error("❌ [ElevenLabs] API Error:", response.status, errorText);
                        throw new Error(`ElevenLabs API failed: ${response.status}`);
                    }

                    // Get audio blob
                    const audioBlob = await response.blob();
                    const audioBuffer = await audioBlob.arrayBuffer();

                    console.log("✅ [ElevenLabs] Audio generated:", {
                        size: audioBuffer.byteLength,
                    });

                    // Upload to Supabase Storage
                    const fileName = `audio/${user.id}/${Date.now()}-${crypto.randomUUID()}.mp3`;

                    const { error: uploadError } = await supabaseAdmin.storage
                        .from("media-generations")
                        .upload(fileName, audioBuffer, {
                            contentType: "audio/mpeg",
                            upsert: false,
                        });

                    if (uploadError) {
                        console.error("❌ [Storage] Upload failed:", uploadError);
                        throw uploadError;
                    }

                    const {
                        data: { publicUrl },
                    } = supabaseAdmin.storage
                        .from("media-generations")
                        .getPublicUrl(fileName);

                    audioUrl = publicUrl;
                    usedProvider = "ElevenLabs";
                    duration = Math.ceil(text.length / 15); // Estimate: ~15 chars/sec
                    cost = Math.ceil(text.length / 1000) * 30; // 30 créditos por 1k chars

                    console.log("✅ [Storage] Uploaded to:", publicUrl);
                } catch (error) {
                    console.error("❌ [ElevenLabs] Failed:", error);
                    // Fallback to Google TTS
                    throw error;
                }
            } else {
                console.warn("⚠️ [ElevenLabs] API key not configured, falling back to Google TTS");
                throw new Error("ElevenLabs API key not configured");
            }
        }

        // Fallback: Google TTS (Free)
        if (!audioUrl) {
            console.log("🔄 [Google TTS] Using fallback...");

            // Use Google Cloud TTS API (Free tier: 1M chars/month)
            const GOOGLE_TTS_API_KEY = Deno.env.get("GOOGLE_TTS_API_KEY");

            if (GOOGLE_TTS_API_KEY) {
                const response = await fetch(
                    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            input: { text },
                            voice: {
                                languageCode: "pt-BR",
                                name: voice === "rachel" ? "pt-BR-Wavenet-C" : "pt-BR-Standard-A",
                            },
                            audioConfig: {
                                audioEncoding: "MP3",
                                speakingRate: style === "energetic" ? 1.2 : style === "calm" ? 0.9 : 1.0,
                            },
                        }),
                    }
                );

                if (!response.ok) {
                    throw new Error("Google TTS API failed");
                }

                const result = await response.json();

                // Decode base64 audio
                const audioBase64 = result.audioContent;
                const audioBuffer = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));

                // Upload to Supabase Storage
                const fileName = `audio/${user.id}/${Date.now()}-${crypto.randomUUID()}.mp3`;

                const { error: uploadError } = await supabaseAdmin.storage
                    .from("media-generations")
                    .upload(fileName, audioBuffer, {
                        contentType: "audio/mpeg",
                        upsert: false,
                    });

                if (uploadError) throw uploadError;

                const {
                    data: { publicUrl },
                } = supabaseAdmin.storage
                    .from("media-generations")
                    .getPublicUrl(fileName);

                audioUrl = publicUrl;
                usedProvider = "Google TTS";
                duration = Math.ceil(text.length / 15);
                cost = 0; // Free!

                console.log("✅ [Google TTS] Generated and uploaded");
            } else {
                throw new Error("No audio provider available");
            }
        }

        // Save to database
        const { error: dbError } = await supabaseAdmin.from("generated_audios").insert({
            user_id: user.id,
            type: "tts",
            provider: usedProvider,
            prompt: text,
            url: audioUrl,
            text,
            voice,
            duration
        });

        if (dbError) {
            console.error("⚠️ [Database] Failed to save:", dbError);
            // Don't fail the request, audio was generated successfully
        }

        console.log("✅ [Audio Generation] Complete:", {
            provider: usedProvider,
            duration,
            cost,
        });

        return new Response(
            JSON.stringify({
                success: true,
                audio: {
                    url: audioUrl,
                    voice,
                    text,
                    provider: usedProvider,
                    duration,
                    cost,
                    free: usedProvider === "Google TTS",
                },
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error: any) {
        console.error("❌ [Audio Generation] Error:", error);

        // Se for um erro que nós lançamos ativamente com mensagem em português (ex: chave vencida)
        // ou erro de provedor de terceiros, retornamos 400 (Bad Request) em vez de 500 
        // para que o painel mostre a notificação corretamente e o navegador não logue um crash interno grave.
        const status = error.message?.includes("Erro do Provedor") || error.message?.includes("expirou") || error.message?.includes("inicializando") 
            ? 400 
            : 500;

        return new Response(
            JSON.stringify({
                error: error.message || "Falha na geração de áudio devido a um erro interno no servidor",
                details: error.stack,
            }),
            {
                status,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});

