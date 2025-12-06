// ================================================
// EDGE FUNCTION: Geração de Imagens com Google Gemini/Imagen
// URL: /functions/v1/generate-image
// ================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1. Criar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 2. Autenticar usuário
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // 3. Parsear body
    const body = await req.json();
    const { prompt, size = "1024x1024", quality = "standard" } = body;

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log("🎨 [Image Generation] Generating image:", {
      userId: user.id,
      prompt,
    });

    // 4. Buscar configuração do Gemini/Google da tabela GlobalAiConnection
    const { data: aiConfig, error: aiError } = await supabase
      .from("GlobalAiConnection")
      .select("apiKey, provider, model, baseUrl")
      .eq("provider", "GOOGLE")
      .eq("isActive", true)
      .limit(1)
      .single();

    if (aiError || !aiConfig) {
      console.error(
        "❌ [Image Generation] Google/Gemini não configurado:",
        aiError,
      );
      return new Response(
        JSON.stringify({
          error:
            "Para gerar imagens, configure a API Key da Google Gemini no painel Super Admin.",
          hint: "Vá em Configurações > IA Global e adicione uma IA com provider GOOGLE",
          needsConfig: true,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const googleApiKey = aiConfig.apiKey;
    const model = aiConfig.model || "gemini-2.0-flash-exp";

    console.log("✅ [Image Generation] Using Gemini model:", model);

    // 5. Gerar imagem com Google Gemini (Imagen 3)
    // Google Gemini pode gerar imagens nativamente com prompts
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${googleApiKey}`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: `Gere uma imagem baseada nesta descrição: ${prompt}. A imagem deve ser de alta qualidade, detalhada e visualmente atraente.`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
      },
    };

    console.log("📡 [Image Generation] Calling Gemini API...");

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(geminiPayload),
    });

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.text();
      console.error("❌ [Image Generation] Gemini API error:", errorData);

      return new Response(
        JSON.stringify({
          error: "Erro ao gerar imagem com Gemini",
          details: errorData,
          suggestion:
            "O Gemini 2.0 Flash pode não suportar geração de imagens diretamente. Considere usar DALL-E ou Stable Diffusion.",
          alternativeSolution:
            "Use o chat para gerar descrições e depois use uma API de imagem externa.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const geminiData = await geminiResponse.json();
    console.log("📦 [Image Generation] Gemini response received");

    // 6. Extrair texto da resposta do Gemini
    let imageDescription = "";
    let imageDataUrl = null;

    if (geminiData.candidates && geminiData.candidates[0]) {
      const parts = geminiData.candidates[0].content.parts;

      // Procurar por imagem em base64 ou URL na resposta
      for (const part of parts) {
        if (part.text) {
          imageDescription = part.text;
        }
        if (part.inlineData && part.inlineData.data) {
          imageDataUrl = part.inlineData.data;
        }
      }
    }

    // 7. Se não houver imagem direta, retornar erro informativo
    if (!imageDataUrl) {
      console.warn(
        "⚠️ [Image Generation] Gemini não retornou imagem, apenas texto",
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: "O Gemini 2.0 Flash não suporta geração de imagens nativa.",
          description: imageDescription,
          suggestion: "Para gerar imagens, você precisa:",
          options: [
            "1. Adicionar uma IA OpenAI (DALL-E 3) no painel",
            "2. Adicionar integração com Stable Diffusion",
            "3. Usar a descrição gerada para criar imagem em outra ferramenta",
          ],
          generatedDescription: imageDescription,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 8. Se houver imagem, fazer upload para Supabase Storage
    const imageBuffer = Uint8Array.from(atob(imageDataUrl), (c) =>
      c.charCodeAt(0),
    );

    const fileName = `${user.id}/${Date.now()}-${crypto.randomUUID()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("media-generations")
      .upload(fileName, imageBuffer, {
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("❌ [Image Generation] Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    console.log("✅ [Image Generation] Image uploaded to storage:", fileName);

    // 9. Gerar URL pública
    const {
      data: { publicUrl },
    } = supabase.storage.from("media-generations").getPublicUrl(fileName);

    // 10. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        image: {
          url: publicUrl,
          prompt: prompt,
          description: imageDescription,
          size: size,
          provider: "Google Gemini",
          model: model,
        },
        message: "Imagem gerada com sucesso!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    console.error("❌ [Image Generation] Fatal error:", error);

    return new Response(
      JSON.stringify({
        error: error.message || "Erro desconhecido ao gerar imagem",
        details: error.stack,
        suggestion:
          "Verifique se a API Key do Google está correta e se o modelo suporta geração de imagens.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
