import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handlePreflightRequest } from "../_utils/cors.ts";

/**
 * Enhanced Video Generation with D-ID Talking Heads
 * 
 * Priority:
 * 1. D-ID (Premium talking avatar videos)
 * 2. Runway ML (Creative AI videos)
 * 3. Google TTS + Static Image (FREE fallback)
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
      duration = 10,
      quality = "standard",
      provider = "auto",
      voice = "en-US-JennyNeural",
    } = body;

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log("🎬 [Video Gen] Request:", { userId: user.id, prompt, duration, provider });

    let videoUrl: string | null = null;
    let usedProvider = "";
    let cost = 0;

    // ============================================
    // PROVIDER 1: D-ID TALKING HEADS
    // ============================================
    if (provider === "auto" || provider === "did") {
      const D_ID_API_KEY = Deno.env.get("D_ID_API_KEY");

      if (D_ID_API_KEY) {
        try {
          console.log("🎭 [D-ID] Creating talking head video...");

          // Step 1: Create talk
          const createResponse = await fetch("https://api.d-id.com/talks", {
            method: "POST",
            headers: {
              "Authorization": `Basic ${btoa(D_ID_API_KEY)}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              script: {
                type: "text",
                input: prompt,
                provider: {
                  type: "microsoft",
                  voice_id: voice,
                },
              },
              config: {
                stitch: true,
                result_format: "mp4",
              },
              // Default presenter (woman)
              source_url: "https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg",
            }),
          });

          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error("❌ [D-ID] Create failed:", createResponse.status, errorText);
            throw new Error(`D-ID create failed: ${createResponse.status}`);
          }

          const createData = await createResponse.json();
          const talkId = createData.id;

          console.log("🎭 [D-ID] Talk created:", talkId);

          // Step 2: Poll for completion (max 5 minutes)
          let attempts = 0;
          const maxAttempts = 150; // 5 min / 2 sec
          let videoReady = false;

          while (!videoReady && attempts < maxAttempts) {
            await new Promise((r) => setTimeout(r, 2000)); // Wait 2 seconds

            const statusResponse = await fetch(`https://api.d-id.com/talks/${talkId}`, {
              headers: {
                "Authorization": `Basic ${btoa(D_ID_API_KEY)}`,
              },
            });

            if (!statusResponse.ok) {
              console.error("❌ [D-ID] Status check failed:", statusResponse.status);
              break;
            }

            const statusData = await statusResponse.json();
            console.log(`⏳ [D-ID] Status: ${statusData.status} (attempt ${attempts + 1}/${maxAttempts})`);

            if (statusData.status === "done") {
              videoUrl = statusData.result_url;
              usedProvider = "D-ID";
              cost = Math.ceil(duration / 60) * 20; // ~$1/min = 100 créditos/min
              videoReady = true;
              console.log("✅ [D-ID] Video ready:", videoUrl);
            } else if (statusData.status === "error") {
              console.error("❌ [D-ID] Generation error:", statusData.error);
              throw new Error(`D-ID error: ${statusData.error || "Unknown error"}`);
            }

            attempts++;
          }

          if (!videoReady) {
            throw new Error("D-ID video generation timeout (5 minutes)");
          }
        } catch (error) {
          console.error("❌ [D-ID] Failed:", error);
          // Continue to fallback
        }
      } else {
        console.log("⚠️ [D-ID] API key not configured");
      }
    }

    // ============================================
    // PROVIDER 2: RUNWAY ML (requires API key)
    // ============================================
    if (!videoUrl && (provider === "auto" || provider === "runway")) {
      const RUNWAY_API_KEY = Deno.env.get("RUNWAY_API_KEY");

      if (RUNWAY_API_KEY) {
        try {
          console.log("🎬 [Runway] Starting generation...");

          const runwayResponse = await fetch("https://api.runwayml.com/v1/generate", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${RUNWAY_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: prompt,
              duration: Math.min(duration, 10),
              model: "gen2",
            }),
          });

          if (runwayResponse.ok) {
            const data = await runwayResponse.json();
            videoUrl = data.video_url || data.url;
            usedProvider = "Runway ML";
            cost = Math.ceil(duration) * 10; // $0.10/sec
            console.log("✅ [Runway] Video generated");
          } else {
            console.warn("⚠️ [Runway] Failed:", await runwayResponse.text());
          }
        } catch (error) {
          console.error("❌ [Runway] Error:", error);
        }
      } else {
        console.log("⚠️ [Runway] API key not configured");
      }
    }

    // ============================================
    // FALLBACK: Google TTS + Static Image
    // ============================================
    if (!videoUrl) {
      console.log("🔄 [Fallback] Using Google TTS + Static Image...");

      try {
        // Generate audio with Google TTS (FREE)
        const GOOGLE_TTS_API_KEY = Deno.env.get("GOOGLE_TTS_API_KEY");

        if (GOOGLE_TTS_API_KEY) {
          const ttsResponse = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${GOOGLE_TTS_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                input: { text: prompt },
                voice: { languageCode: "pt-BR", name: "pt-BR-Standard-A" },
                audioConfig: { audioEncoding: "MP3" },
              }),
            }
          );

          if (ttsResponse.ok) {
            const ttsData = await ttsResponse.json();
            const audioBase64 = ttsData.audioContent;

            // Create static video: Image + Audio
            // For now, just return image URL + audio URL separately
            // Client can combine them or we can use FFmpeg in future

            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true`;

            videoUrl = imageUrl; // Temporary: return image URL
            usedProvider = "Google TTS + Static Image (FREE)";
            cost = 0;

            console.log("✅ [Fallback] Generated free alternative");

            // Return with clear message
            return new Response(
              JSON.stringify({
                success: true,
                video: {
                  url: videoUrl,
                  provider: usedProvider,
                  note: "This is an image + audio alternative. For real video, configure D-ID API key.",
                  cost: 0,
                  free: true,
                },
                metadata: {
                  type: "static-alternative",
                  imageUrl: imageUrl,
                  audioData: audioBase64, // Base64 audio
                  suggestion: "Configure D_ID_API_KEY for real talking head videos",
                },
              }),
              {
                status: 200,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              }
            );
          }
        }

        // Ultimate fallback: just image
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1280&height=720&nologo=true`;

        return new Response(
          JSON.stringify({
            success: false,
            error: "Video generation not available",
            suggestion: {
              message: "Configure D-ID or Runway ML API key for video generation",
              alternatives: [
                "D-ID: Premium talking head videos ($20/month)",
                "Runway ML: Creative AI videos",
                "Google TTS: Free audio + static image",
              ],
            },
            placeholder: {
              url: imageUrl,
              note: "Static image placeholder",
            },
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (fallbackError) {
        console.error("❌ [Fallback] Failed:", fallbackError);
      }
    }

    // ============================================
    // SUCCESS: Save to database
    // ============================================
    if (videoUrl && usedProvider !== "Google TTS + Static Image (FREE)") {
      console.log("💾 [Database] Saving video generation...");

      const { error: dbError } = await supabase.from("MediaGeneration").insert({
        userId: user.id,
        type: "VIDEO",
        provider: usedProvider,
        prompt: prompt,
        url: videoUrl,
        duration: duration,
        metadata: {
          voice: voice,
          quality: quality,
        },
        cost: cost,
        status: "COMPLETED",
      });

      if (dbError) {
        console.error("⚠️ [Database] Save failed:", dbError);
        // Don't fail the request
      }
    }

    console.log("✅ [Video Gen] Complete:", {
      provider: usedProvider,
      duration,
      cost,
    });

    return new Response(
      JSON.stringify({
        success: true,
        video: {
          url: videoUrl,
          provider: usedProvider,
          duration,
          cost,
          free: cost === 0,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ [Video Gen] Error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Video generation failed",
        details: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
