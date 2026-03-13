import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Auth check
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("Missing authorization header");
        }

        const supabaseClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

        if (authError || !user) {
            throw new Error("Unauthorized");
        }

        // Must be multipart/form-data
        const contentType = req.headers.get("content-type") || "";
        if (!contentType.includes("multipart/form-data")) {
            throw new Error("Request must be multipart/form-data");
        }

        const formData = await req.formData();
        const file = formData.get("file");
        const voiceName = formData.get("name");
        const description = formData.get("description") || "Voz clonada pelo usuário";

        if (!file || !(file instanceof File)) {
            throw new Error("Surgiu um erro com o arquivo enviado");
        }
        if (!voiceName) {
            throw new Error("O nome da voz é obrigatório");
        }

        const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
        if (!ELEVENLABS_API_KEY) {
            throw new Error("ElevenLabs API key not configured");
        }

        console.log(`🎙️ [Clone Voice] Sending to ElevenLabs API for user ${user.id}`);

        // Forward FormData to ElevenLabs
        const elevenLabsFormData = new FormData();
        elevenLabsFormData.append("name", voiceName as string);
        elevenLabsFormData.append("files", file);
        elevenLabsFormData.append("description", description as string);
        // By default elevenlabs accepts labels as a stringified json object
        elevenLabsFormData.append("labels", JSON.stringify({ userId: user.id }));

        const response = await fetch("https://api.elevenlabs.io/v1/voices/add", {
            method: "POST",
            headers: {
                "xi-api-key": ELEVENLABS_API_KEY,
            },
            body: elevenLabsFormData,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ [Clone Voice] API Error:", response.status, errorText);
            throw new Error("Falha ao clonar voz na ElevenLabs");
        }

        const result = await response.json();
        const voiceId = result.voice_id;

        console.log("✅ [Clone Voice] Voice cloned successfully:", voiceId);

        // Also save to user's cloned voices table or metadata
        // For now just returning it
        return new Response(
            JSON.stringify({
                success: true,
                voice_id: voiceId,
                name: voiceName,
            }),
            {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    } catch (error: any) {
        console.error("❌ [Clone Voice] Error:", error);

        return new Response(
            JSON.stringify({
                error: error.message || "Voice cloning failed",
            }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
