import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflightRequest } from "../_utils/cors.ts";

/**
 * Enhanced Image Generation with Multiple Providers
 * 
 * Priority:
 * 1. Pollinations.ai (FREE, no API key)
 * 2. DALL-E 3 (OpenAI, requires API key)
 * 3. Stable Diffusion (if configured)
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handlePreflightRequest();
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const body = await req.json();
    const {
      prompt,
      size = "1024x1024",
      quality = "standard",
      provider = "auto"
    } = body;

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log("🎨 [Image Gen] Request:", { userId: user.id, prompt, provider });

    let imageUrl: string | null = null;
    let usedProvider = "";
    let cost = 0;

    // ============================================
    // PROVIDER 1: POLLINATIONS.AI (FREE, NO API KEY)
    // ============================================
    if (provider === "auto" || provider === "pollinations") {
      try {
        console.log("🌸 Trying Pollinations.ai (free)...");

        // Pollinations.ai - Direct URL generation (no API call needed!)
        const encodedPrompt = encodeURIComponent(prompt);
        const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true`;

        // Verify the image exists
        const testResponse = await fetch(pollinationsUrl, { method: "HEAD" });

        if (testResponse.ok) {
          imageUrl = pollinationsUrl;
          usedProvider = "Pollinations.ai";
          cost = 0; // FREE!
          console.log("✅ [Image Gen] Pollinations.ai SUCCESS");
        } else {
          console.warn("⚠️ Pollinations.ai failed, trying next provider...");
        }
      } catch (error) {
        console.warn("⚠️ Pollinations.ai error:", error);
      }
    }

    // ============================================
    // PROVIDER 2: DALL-E 3 (OpenAI - requires API key)
    // ============================================
    if (!imageUrl && (provider === "auto" || provider === "dalle")) {
      try {
        console.log("🎨 Trying DALL-E 3...");

        const { data: openaiConfig } = await supabase
          .from("GlobalAiConnection")
          .select("apiKey")
          .eq("provider", "OPENAI")
          .eq("isActive", true)
          .single();

        if (openaiConfig?.apiKey) {
          const openaiResponse = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${openaiConfig.apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "dall-e-3",
              prompt: prompt,
              n: 1,
              size: size === "1024x1024" ? "1024x1024" : "1792x1024",
              quality: quality === "hd" ? "hd" : "standard",
            }),
          });

          if (openaiResponse.ok) {
            const data = await openaiResponse.json();
            imageUrl = data.data[0].url;
            usedProvider = "DALL-E 3";
            cost = quality === "hd" ? 0.08 : 0.04;
            console.log("✅ [Image Gen] DALL-E 3 SUCCESS");
          }
        } else {
          console.log("ℹ️ OpenAI not configured, skipping DALL-E");
        }
      } catch (error) {
        console.warn("⚠️ DALL-E error:", error);
      }
    }

    // ============================================
    // FALLBACK: Error if no provider worked
    // ============================================
    if (!imageUrl) {
      return new Response(
        JSON.stringify({
          error: "Failed to generate image with all providers",
          suggestion: "Try configuring OpenAI (DALL-E) in Super Admin for better results",
          providers_tried: provider === "auto" ? ["Pollinations.ai", "DALL-E 3"] : [provider],
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ============================================
    // UPLOAD TO SUPABASE STORAGE (optional)
    // ============================================
    let finalUrl = imageUrl;

    // Only download and upload if it's not Pollinations (which is already hosted)
    if (usedProvider !== "Pollinations.ai") {
      try {
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();
        const imageBuffer = await imageBlob.arrayBuffer();

        const fileName = `images/${user.id}/${Date.now()}-${crypto.randomUUID()}.png`;
        const { error: uploadError } = await supabase.storage
          .from("media-generations")
          .upload(fileName, imageBuffer, {
            contentType: "image/png",
            upsert: false,
          });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("media-generations")
            .getPublicUrl(fileName);
          finalUrl = publicUrl;
        }
      } catch (uploadError) {
        console.warn("⚠️ Upload to storage failed, using external URL:", uploadError);
      }
    }

    // ============================================
    // SAVE TO DATABASE
    // ============================================
    try {
      await supabase.from("MediaGeneration").insert({
        userId: user.id,
        type: "IMAGE",
        provider: usedProvider,
        prompt: prompt,
        url: finalUrl,
        size: size,
        quality: quality,
        cost: cost,
        status: "COMPLETED",
        metadata: {
          originalUrl: imageUrl,
          provider: usedProvider,
        },
      });
    } catch (dbError) {
      console.warn("⚠️ DB insert failed:", dbError);
    }

    // ============================================
    // SUCCESS RESPONSE
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        image: {
          url: finalUrl,
          prompt: prompt,
          size: size,
          quality: quality,
          provider: usedProvider,
          cost: cost,
          free: cost === 0,
        },
        message: `Imagem gerada com ${usedProvider}!`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [Image Gen] Error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error",
        details: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
