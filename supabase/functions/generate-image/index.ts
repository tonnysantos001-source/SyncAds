import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GENERATE-IMAGE EDGE FUNCTION (V3 - FIXED PIPELINE)
 * 
 * Changes from V2:
 * - Migrated from deprecated api-inference.huggingface.co (HTTP 410) 
 *   to router.huggingface.co (current HF Inference Providers API)
 * - Pollinations.ai is now primary fallback (always works, no key needed)
 * - Improved error logging to surface root causes
 */

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const hfToken = Deno.env.get("HUGGINGFACE_API_KEY");

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // --- AUTH ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ [GENERATE-IMAGE] Missing Authorization header");
      throw new Error("Missing Authorization header");
    }
    const token = authHeader.replace("Bearer ", "");

    // Decode JWT payload to check role (works for service_role and anon tokens)
    let jwtRole = "authenticated";
    try {
      const payloadB64 = token.split(".")[1];
      if (payloadB64) {
        const payload = JSON.parse(atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/")));
        jwtRole = payload.role || "authenticated";
      }
    } catch (_) { /* ignore decode errors */ }

    let user: { id: string; email: string } | null = null;

    if (jwtRole === "service_role" || jwtRole === "anon") {
      // Service key or anon key — allow bypass (chat-enhanced calls with user's session token or anon)
      console.log(`🔐 [GENERATE-IMAGE] JWT role: ${jwtRole} — system bypass`);
      user = { id: "system", email: "system@syncads.com.br" };
    } else {
      // Try to get actual user from session token
      const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !authUser) {
        console.error("❌ [GENERATE-IMAGE] Auth failed:", authError?.message, "| role:", jwtRole);
        throw new Error("Unauthorized");
      }
      user = { id: authUser.id, email: authUser.email || "" };
    }

    // --- PARSE BODY ---
    let body: { prompt?: string; size?: string; provider?: string };
    try {
      body = await req.json();
    } catch (e) {
      console.error("❌ [GENERATE-IMAGE] Failed to parse JSON body:", e);
      throw new Error("Invalid JSON body");
    }

    const { prompt, size = "1024x1024", provider = "auto" } = body;
    if (!prompt) {
      console.error("❌ [GENERATE-IMAGE] Prompt is missing from body");
      throw new Error("Prompt is required");
    }

    console.log(`🎨 [GENERATE-IMAGE] Prompt: "${prompt.substring(0, 80)}" | Provider: ${provider} | User: ${user.email}`);

    let imageUrl: string | null = null;
    let finalProvider = "unknown";
    const [w, h] = size.split("x").map((s) => parseInt(s) || 1024);
    const seed = Math.floor(Math.random() * 999999);

    // --- HUGGINGFACE PIPELINE (router.huggingface.co - new API) ---
    // HuggingFace models via router.huggingface.co
    // Correct URL format: https://router.huggingface.co/hf-inference/models/<model>
    const hfModels = [
      "black-forest-labs/FLUX.1-schnell",
      "stabilityai/stable-diffusion-xl-base-1.0",
    ];

    if (hfToken && (provider === "auto" || provider === "huggingface")) {
      for (const modelId of hfModels) {
        try {
          console.log(`⚡ [HF] Trying: ${modelId}...`);
          
          // Correct endpoint (no /v1/text-to-image suffix)
          const hfUrl = `https://router.huggingface.co/hf-inference/models/${modelId}`;
          
          const hfResponse = await fetch(hfUrl, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfToken}`,
              "Content-Type": "application/json",
              "x-wait-for-model": "true",
            },
            body: JSON.stringify({ inputs: prompt }),
            signal: AbortSignal.timeout(30000),
          });

          console.log(`[HF] ${modelId} response: ${hfResponse.status} ${hfResponse.headers.get('content-type')}`);

          if (hfResponse.ok) {
            const contentType = hfResponse.headers.get("content-type") || "";
            if (contentType.includes("image") || contentType.includes("octet-stream")) {
              const buffer = await hfResponse.arrayBuffer();
              const ext = contentType.includes("png") ? "png" : "jpeg";
              const fileName = `generations/${user.id}/${Date.now()}-${modelId.split("/").pop()}.${ext}`;

              const { error: uploadError } = await supabaseAdmin.storage
                .from("media-generations")
                .upload(fileName, buffer, {
                  contentType: contentType.split(";")[0],
                  cacheControl: "3600",
                  upsert: true,
                });

              if (!uploadError) {
                imageUrl = supabaseAdmin.storage.from("media-generations").getPublicUrl(fileName).data.publicUrl;
                finalProvider = `huggingface (${modelId.split("/").pop()})`;
                console.log(`✅ [HF] Success: ${modelId} → ${imageUrl}`);
                break;
              } else {
                console.error(`❌ [STORAGE] Upload error for ${modelId}:`, uploadError.message);
              }
            } else {
              // HF returned JSON (model loading, error, etc.)
              const text = await hfResponse.text();
              console.warn(`⚠️ [HF] Non-image response from ${modelId}:`, text.substring(0, 200));
            }
          } else {
            const errText = await hfResponse.text();
            console.warn(`⚠️ [HF] ${modelId} failed (${hfResponse.status}): ${errText.substring(0, 200)}`);
          }
        } catch (err: any) {
          console.error(`❌ [HF] Error with ${modelId}:`, err.message);
        }
      }
    } else if (!hfToken) {
      console.warn("⚠️ [HF] HUGGINGFACE_API_KEY not set — skipping HF pipeline");
    }

    // --- POLLINATIONS FALLBACK (always available, no auth needed) ---
    if (!imageUrl) {
      console.log("🔄 [POLLINATIONS] Using Pollinations fallback...");
      const encodedPrompt = encodeURIComponent(prompt);
      imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&nologo=true&seed=${seed}&enhance=true`;
      finalProvider = "pollinations";
      console.log(`✅ [POLLINATIONS] URL generated: ${imageUrl.substring(0, 100)}...`);
    }

    if (!imageUrl) {
      throw new Error("Falha total na geração da imagem. Nenhum provedor disponível.");
    }

    // --- LOG TO DB ---
    const logUserId = (user.id === "admin" || user.id === "system") ? null : user.id;
    try {
      const { error: dbError } = await supabaseAdmin.from("MediaGeneration").insert({
        ...(logUserId ? { userId: logUserId } : {}),
        type: "IMAGE",
        url: imageUrl,
        prompt: prompt,
        provider: finalProvider,
        metadata: { size, pipeline_version: "V3_FIXED", source: "edge-function" },
      });
      if (dbError) console.error("⚠️ [DB] Log error (non-fatal):", dbError.message);
    } catch (e: any) {
      console.error("⚠️ [DB] Log exception (non-fatal):", e.message);
    }

    console.log(`✅ [GENERATE-IMAGE] Done — Provider: ${finalProvider}`);

    return new Response(
      JSON.stringify({ success: true, image: { url: imageUrl, prompt, provider: finalProvider } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("❌ [GENERATE-IMAGE] Fatal error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
