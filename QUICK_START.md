# ⚡ QUICK START - Começar Agora!

**Objetivo:** Implementar correções críticas em 5 dias  
**Resultado:** Áudio + Vídeo + Website funcionando

---

## 🚀 SETUP IMEDIATO (30 minutos)

### 1. Criar Contas (15 min)

#### ElevenLabs (Áudio)
1. Acesse: https://elevenlabs.io/sign-up
2. Escolha plano: **Starter ($22/mês)** - 30k caracteres
3. Copie API Key: Settings → API Key
4. Salve em: `ELEVENLABS_API_KEY=sua_key_aqui`

#### D-ID (Vídeo)
1. Acesse: https://studio.d-id.com/signup
2. Escolha plano: **Lite ($20/mês)** - 20 min de vídeo
3. Copie API Key: Settings → API Keys → Create Key
4. Salve em: `D_ID_API_KEY=sua_key_aqui`

### 2. Configurar Supabase (15 min)

```bash
# 1. Login no Supabase
cd c:\Users\dinho\Documents\GitHub\SyncAds
npx supabase login

# 2. Link ao projeto
npx supabase link --project-ref ovskepqggmxlfckxqgbr

# 3. Adicionar secrets
npx supabase secrets set ELEVENLABS_API_KEY=sua_elevenlabs_key_aqui
npx supabase secrets set D_ID_API_KEY=sua_did_key_aqui

# 4. Verificar
npx supabase secrets list
```

---

## 📝 DIA 1 - Implementar Áudio (8 horas)

### Passo 1: Criar Edge Function (2h)

```bash
# Criar nova function
cd supabase/functions
mkdir generate-audio
cd generate-audio
```

**Criar arquivo:** `supabase/functions/generate-audio/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing authorization");

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error("Unauthorized");

        const { text, voice = "rachel" } = await req.json();
        
        if (!text) throw new Error("Text is required");

        console.log("🎙️ Generating audio with ElevenLabs:", { textLength: text.length, voice });

        // Call ElevenLabs API
        const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
            {
                method: "POST",
                headers: {
                    "xi-api-key": ELEVENLABS_API_KEY!,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text,
                    model_id: "eleven_monolingual_v1",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`ElevenLabs API failed: ${error}`);
        }

        const audioBlob = await response.blob();
        const audioBuffer = await audioBlob.arrayBuffer();

        // Upload to Supabase Storage
        const fileName = `audio/${user.id}/${Date.now()}-${crypto.randomUUID()}.mp3`;
        const { error: uploadError } = await supabase.storage
            .from("media-generations")
            .upload(fileName, audioBuffer, {
                contentType: "audio/mpeg",
                upsert: false,
            });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from("media-generations")
            .getPublicUrl(fileName);

        // Save to database
        await supabase.from("MediaGeneration").insert({
            userId: user.id,
            type: "AUDIO",
            provider: "ElevenLabs",
            prompt: text,
            url: publicUrl,
            metadata: {
                voice,
                model: "eleven_monolingual_v1",
                duration: Math.ceil(text.length / 15), // Estimate: ~15 chars/sec
            },
            cost: Math.ceil(text.length / 1000) * 30, // 30 créditos por 1k chars
            status: "COMPLETED",
        });

        console.log("✅ Audio generated:", publicUrl);

        return new Response(
            JSON.stringify({
                success: true,
                audio: {
                    url: publicUrl,
                    voice,
                    text,
                    provider: "ElevenLabs",
                    duration: Math.ceil(text.length / 15),
                },
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("❌ Audio generation error:", error);
        return new Response(
            JSON.stringify({
                error: error.message || "Audio generation failed",
                details: error.stack,
            }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
```

### Passo 2: Deploy Function (1h)

```bash
# Deploy
npx supabase functions deploy generate-audio

# Testar
curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/generate-audio \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{"text": "Olá, este é um teste de áudio", "voice": "rachel"}'
```

### Passo 3: Atualizar audio-providers.ts (2h)

**Arquivo:** `src/lib/media/audio-providers.ts`

```typescript
// Linha 60-68, substituir:
generate: async (options) => {
    const { text, voice } = options;
    
    const response = await fetch(
        `${supabaseUrl}/functions/v1/generate-audio`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text, voice })
        }
    );
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Audio generation failed');
    }
    
    const data = await response.json();
    
    return {
        url: data.audio.url,
        type: 'tts',
        text: data.audio.text,
        provider: 'ElevenLabs',
        timestamp: Date.now(),
        cost: Math.ceil(text.length / 1000) * 30,
        metadata: {
            model: 'eleven_monolingual_v1',
            duration: data.audio.duration,
            voice: data.audio.voice
        }
    };
},
isAvailable: async () => {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
}
```

### Passo 4: Testar no Frontend (2h)

```bash
# Rodar app localmente
npm run dev

# Abrir http://localhost:5173
# Ir para AudioGalleryPro
# Testar geração de áudio
```

### Passo 5: Commit (30min)

```bash
git add .
git commit -m "feat: implement ElevenLabs TTS audio generation"
git push origin main
```

---

## 📝 DIA 2 - Fallback + Integração (8 horas)

### Implementar Play.ht (opcional, 4h)
### Integrar com AudioGalleryPro.tsx (4h)

---

## 📝 DIA 3 - Implementar Vídeo D-ID (8 horas)

### Passo 1: Atualizar generate-video/index.ts (4h)

**Substituir todo conteúdo de `supabase/functions/generate-video/index.ts`:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_utils/cors.ts";

serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) throw new Error("Missing authorization");

        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
        );

        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) throw new Error("Unauthorized");

        const { prompt, duration = 30 } = await req.json();
        
        if (!prompt) throw new Error("Prompt is required");

        console.log("🎬 Generating video with D-ID:", { prompt, duration });

        const D_ID_API_KEY = Deno.env.get("D_ID_API_KEY");
        
        // Create talk
        const createResponse = await fetch("https://api.d-id.com/talks", {
            method: "POST",
            headers: {
                "Authorization": `Basic ${btoa(D_ID_API_KEY!)}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                script: {
                    type: "text",
                    input: prompt,
                    provider: {
                        type: "microsoft",
                        voice_id: "en-US-JennyNeural"
                    }
                },
                config: {
                    stitch: true,
                    result_format: "mp4"
                },
                source_url: "https://create-images-results.d-id.com/DefaultPresenters/Noelle_f/image.jpeg"
            })
        });

        if (!createResponse.ok) {
            const error = await createResponse.text();
            throw new Error(`D-ID create failed: ${error}`);
        }

        const { id } = await createResponse.json();
        console.log("🎬 D-ID talk created:", id);

        // Poll for completion
        let videoUrl = null;
        let attempts = 0;
        const maxAttempts = 150; // 5 min / 2 sec

        while (!videoUrl && attempts < maxAttempts) {
            await new Promise(r => setTimeout(r, 2000));
            
            const statusRes = await fetch(`https://api.d-id.com/talks/${id}`, {
                headers: {
                    "Authorization": `Basic ${btoa(D_ID_API_KEY!)}`
                }
            });
            
            const status = await statusRes.json();
            
            if (status.status === "done") {
                videoUrl = status.result_url;
                console.log("✅ Video ready:", videoUrl);
            } else if (status.status === "error") {
                throw new Error(`D-ID error: ${status.error}`);
            } else {
                console.log(`⏳ Status: ${status.status} (${attempts}/${maxAttempts})`);
            }
            
            attempts++;
        }

        if (!videoUrl) throw new Error("Video generation timeout");

        // Save to database
        await supabase.from("MediaGeneration").insert({
            userId: user.id,
            type: "VIDEO",
            provider: "D-ID",
            prompt,
            url: videoUrl,
            duration,
            metadata: {
                talkId: id,
                voice: "en-US-JennyNeural"
            },
            cost: Math.ceil(duration / 60) * 20, // ~$1/min
            status: "COMPLETED"
        });

        return new Response(
            JSON.stringify({
                success: true,
                video: {
                    url: videoUrl,
                    prompt,
                    duration,
                    provider: "D-ID"
                }
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error: any) {
        console.error("❌ Video generation error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
```

### Passo 2: Deploy e Testar (4h)

```bash
npx supabase functions deploy generate-video

# Testar
curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/generate-video \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type": application/json" \
  -d '{"prompt": "Olá! Bem-vindo ao SyncAds, sua plataforma de gestão de anúncios.", "duration": 10}'
```

---

## 📝 DIA 4 - Website Builder MVP (8 horas)

### Criar templates básicos + Edge Function
### Deploy e integração

---

## 📝 DIA 5 - Testes e Deploy Final (8 horas)

### Testar tudo end-to-end
### Corrigir bugs
### Deploy em produção

---

## ✅ CHECKLIST RÁPIDO

### Antes de Começar
- [ ] Criar conta ElevenLabs
- [ ] Criar conta D-ID
- [ ] Obter API Keys
- [ ] Adicionar keys no Supabase
- [ ] Verificar bucket `media-generations` existe
- [ ] Verificar tabela `MediaGeneration` existe

### Sprint 1 - Dia por Dia
- [ ] Dia 1: Áudio ElevenLabs funcionando
- [ ] Dia 2: Fallback e integração
- [ ] Dia 3: Vídeo D-ID funcionando
- [ ] Dia 4: Website Builder MVP
- [ ] Dia 5: Testes e deploy

### Após Sprint 1
- [ ] Áudio gera MP3 real ✅
- [ ] Vídeo gera MP4 real ✅
- [ ] Website gera HTML/CSS ✅
- [ ] Cliente pode usar tudo no SyncAds ✅

---

## 🚨 TROUBLESHOOTING

### Erro: "Missing authorization"
```bash
# Verificar se token está válido
npx supabase db inspect-db --limit 0
```

### Erro: "ElevenLabs API failed"
```bash
# Testar API key diretamente
curl https://api.elevenlabs.io/v1/voices \
  -H "xi-api-key: SUA_KEY_AQUI"
```

### Erro: "Upload failed"
```bash
# Verificar se bucket existe
npx supabase storage list

# Criar se não existir
npx supabase storage create media-generations --public
```

---

## 📞 SUPORTE

Se encontrar problemas:
1. Ver logs: `npx supabase functions logs generate-audio`
2. Ver tabela: `select * from "MediaGeneration" order by "createdAt" desc limit 10`
3. Testar API diretamente com curl

---

**PRONTO PARA COMEÇAR! 🚀**

Execute os passos acima e em 1 semana você terá:
- ✅ Áudio profissional funcionando
- ✅ Vídeo real (não placeholder)
- ✅ Website builder MVP

**Boa sorte! 💪**
