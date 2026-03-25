import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * GENERATE-IMAGE EDGE FUNCTION
 * Priority: 1. HuggingFace FLUX.1 (via Router) -> 2. Pollinations.ai (Fallback)
 */

serve(async (req) => {
  // CORS Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const hfToken = Deno.env.get("HUGGINGFACE_API_KEY");

  // Admin client for DB/Storage
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    // Verify user JWT
    const supabaseUser = createClient(supabaseUrl, authHeader);
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const body = await req.json();
    const { prompt, size = "1024x1024", provider = "auto" } = body;

    if (!prompt) throw new Error("Prompt is required");

    console.log(`🎨 [GENERATE-IMAGE] Request from ${user.email}: "${prompt}"`);

    let imageUrl = null;
    let finalProvider = "auto";
    const [w, h] = size.split("x").map((s) => parseInt(s) || 1024);
    const seed = Math.floor(Math.random() * 999999);

    // --- PROVIDER 1: HUGGING FACE (FLUX.1-schnell) ---
    if (hfToken && (provider === "auto" || provider === "huggingface")) {
      try {
        console.log("⚡ Attempting Hugging Face FLUX.1...");
        const hfResponse = await fetch(
          "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
          {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${hfToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ inputs: prompt }),
          }
        );

        if (hfResponse.ok) {
          const buffer = await hfResponse.arrayBuffer();
          const fileName = `generations/${user.id}/${Date.now()}-flux.webp`;
          
          const { error: uploadError } = await supabaseAdmin.storage
            .from("media-generations")
            .upload(fileName, buffer, {
              contentType: "image/webp",
              cacheControl: "3600",
              upsert: true
            });

          if (!uploadError) {
            imageUrl = supabaseAdmin.storage.from("media-generations").getPublicUrl(fileName).data.publicUrl;
            finalProvider = "huggingface";
            console.log("✅ HF Success + Uploaded to Storage");
          } else {
            console.warn("⚠️ HF upload failed:", uploadError.message);
          }
        } else {
          const errText = await hfResponse.text();
          console.warn(`⚠️ HF API returned ${hfResponse.status}:`, errText);
        }
      } catch (hfErr) {
        console.warn("⚠️ HF Provider Error:", hfErr);
      }
    }

    // --- PROVIDER 2: POLLINATIONS (Fallback or Direct) ---
    if (!imageUrl || provider === "pollinations") {
      console.log("🌐 Using Pollinations.ai fallback...");
      const encodedPrompt = encodeURIComponent(prompt);
      imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&nologo=true&seed=${seed}&model=flux`;
      finalProvider = "pollinations";
      console.log("✅ Pollinations URL ready");
    }

    // Log to DB
    try {
      await supabaseAdmin.from("MediaGeneration").insert({
        userId: user.id,
        type: "IMAGE",
        url: imageUrl,
        prompt: prompt,
        provider: finalProvider,
        metadata: { size, model: "FLUX.1-schnell", source: "edge-function" }
      });
    } catch (dbErr) {
      console.warn("⚠️ DB log failed:", dbErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        image: {
          url: imageUrl,
          prompt: prompt,
          provider: finalProvider
        }
      }),
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
