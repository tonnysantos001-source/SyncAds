# 🚀 PLANO DE EXECUÇÃO - Transformação SyncAds em Super Gestor de Anúncios

**Data de Criação:** 13/12/2025  
**Baseado em:** Auditoria Completa Pré-Lançamento  
**Objetivo:** Implementar todas as correções e melhorias identificadas  
**Timeline:** 19 dias úteis (3-4 semanas)

---

## 📋 ÍNDICE
1. [Sprint 1 - Correções Críticas](#sprint-1)
2. [Sprint 2 - Novos Modais](#sprint-2)
3. [Sprint 3 - Ferramentas IA](#sprint-3)
4. [Sprint 4 - Testes e Deploy](#sprint-4)
5. [Checklist de Implementação](#checklist)

---

## 🔥 SPRINT 1 - Correções Críticas (5 dias)

### DIA 1: Setup e Geração de Áudio - Parte 1

#### Manhã (4h)
- [ ] Obter API key do ElevenLabs (https://elevenlabs.io)
- [ ] Adicionar `ELEVENLABS_API_KEY` no Supabase Secrets
- [ ] Criar Edge Function `generate-audio` (se não existir)
- [ ] Implementar integração com ElevenLabs API

**Arquivo:** `supabase/functions/generate-audio/index.ts`
```typescript
import serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
    const { text, voice = 'rachel', provider = 'elevenlabs' } = await req.json();
    
    const ELEVENLABS_API_KEY = Deno.env.get('ELEVENLABS_API_KEY');
    
    try {
        // Call ElevenLabs API
        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
            {
                method: 'POST',
                headers: {
                    'xi-api-key': ELEVENLABS_API_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text,
                    model_id: 'eleven_monolingual_v1',
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75
                    }
                })
            }
        );
        
        if (!response.ok) throw new Error('ElevenLabs API failed');
        
        const audioBlob = await response.blob();
        const audioBuffer = await audioBlob.arrayBuffer();
        
        // Upload to Supabase Storage
        const fileName = `audio/${Date.now()}-${crypto.randomUUID()}.mp3`;
        const { error: uploadError } = await supabase.storage
            .from('media-generations')
            .upload(fileName, audioBuffer, {
                contentType: 'audio/mpeg',
                upsert: false
            });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
            .from('media-generations')
            .getPublicUrl(fileName);
        
        // Save to database
        await supabase.from('MediaGeneration').insert({
            userId: user.id,
            type: 'AUDIO',
            provider: 'ElevenLabs',
            prompt: text,
            url: publicUrl,
            metadata: {
                voice,
                model: 'eleven_monolingual_v1',
                duration: estimateDuration(text)
            },
            cost: calculateCost(text.length),
            status: 'COMPLETED'
        });
        
        return new Response(JSON.stringify({
            success: true,
            audio: {
                url: publicUrl,
                voice,
                text,
                provider: 'ElevenLabs'
            }
        }), { headers: corsHeaders });
    } catch (error) {
        console.error('Audio generation error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
});
```

#### Tarde (4h)
- [ ] Atualizar `audio-providers.ts` para usar a nova Edge Function
- [ ] Testar geração de áudio com diferentes vozes
- [ ] Adicionar fallback para Google TTS (grátis) se ElevenLabs falhar
- [ ] Commit: `feat: implement ElevenLabs TTS generation`

**Arquivo:** `src/lib/media/audio-providers.ts`
```typescript
elevenlabs_tts: {
    // ... configuração existente ...
    generate: async (options) => {
        const response = await fetch('/functions/v1/generate-audio', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                text: options.text,
                voice: options.voice || 'rachel',
                provider: 'elevenlabs'
            })
        });
        
        if (!response.ok) throw new Error('Audio generation failed');
        
        return await response.json();
    },
    isAvailable: async () => {
        // Check if API key exists in backend
        return true; // Backend will handle the check
    }
}
```

---

### DIA 2: Geração de Áudio - Parte 2

#### Manhã (4h)
- [ ] Obter API key do Play.ht (fallback)
- [ ] Implementar Play.ht provider
- [ ] Criar sistema de fallback automático
- [ ] Adicionar indicador de custo estimado na UI

#### Tarde (4h)
- [ ] Integrar geração de áudio com `AudioGalleryPro.tsx`
- [ ] Testar fluxo completo: gerar → salvar → listar → download
- [ ] Adicionar voice preview (sample de cada voz)
- [ ] Commit: `feat: add Play.ht fallback and integrate with UI`

---

### DIA 3: Geração de Vídeo - D-ID Integration

#### Manhã (4h)
- [ ] Obter API key do D-ID (https://www.d-id.com/pricing/)
- [ ] Adicionar `D_ID_API_KEY` no Supabase Secrets
- [ ] Criar presenter images (3-5 avatares padrão)
- [ ] Upload avatares para Supabase Storage

#### Tarde (4h)
- [ ] Atualizar `generate-video/index.ts`
- [ ] Implementar D-ID API integration
- [ ] Implementar polling para status do vídeo
- [ ] Remover código de placeholder

**Arquivo:** `supabase/functions/generate-video/index.ts`
```typescript
// Substituir todo o código de Pollinations por D-ID:

async function generateWithDID(prompt: string, duration: number) {
    const D_ID_API_KEY = Deno.env.get('D_ID_API_KEY');
    
    // 1. Create talk
    const createResponse = await fetch('https://api.d-id.com/talks', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${btoa(D_ID_API_KEY)}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            script: {
                type: 'text',
                input: prompt,
                provider: {
                    type: 'microsoft',
                    voice_id: 'en-US-JennyNeural'
                }
            },
            config: {
                stitch: true,
                result_format: 'mp4'
            },
            source_url: 'https://...' // URL do avatar
        })
    });
    
    const { id } = await createResponse.json();
    
    // 2. Poll for completion (max 5 minutos)
    let videoUrl = null;
    let attempts = 0;
    const maxAttempts = 150; // 5 min / 2 sec
    
    while (!videoUrl && attempts < maxAttempts) {
        await new Promise(r => setTimeout(r, 2000)); // 2 segundos
        
        const statusRes = await fetch(`https://api.d-id.com/talks/${id}`, {
            headers: {
                'Authorization': `Basic ${btoa(D_ID_API_KEY}`
            }
        });
        
        const status = await statusRes.json();
        
        if (status.status === 'done') {
            videoUrl = status.result_url;
        } else if (status.status === 'error') {
            throw new Error('D-ID video generation failed');
        }
        
        attempts++;
    }
    
    if (!videoUrl) {
        throw new Error('Video generation timeout');
    }
    
    return videoUrl;
}
```

---

### DIA 4: Website/Landing Page Builder MVP

#### Manhã (4h)
- [ ] Criar 5 templates HTML/CSS básicos
- [ ] Criar Edge Function `generate-website`
- [ ] Implementar integração com Gemini para gerar conteúdo

**Templates:**
1. Landing Page - Hero + Features + CTA
2. Landing Page - Pricing Table
3. Landing Page - Coming Soon
4. Website - Portfolio
5. Website - Blog Post

#### Tarde (4h)
- [ ] Implementar lógica de preenchimento de template
- [ ] Upload para Supabase Storage
- [ ] Criar preview em iframe
- [ ] Botão de download HTML/CSS/JS
- [ ] Commit: `feat: add website/landing page generator MVP`

---

### DIA 5: Testes e Ajustes Críticos

#### Manhã (4h)
- [ ] Testar geração de áudio end-to-end
- [ ] Testar geração de vídeo end-to-end
- [ ] Testar geração de website end-to-end
- [ ] Corrigir bugs encontrados

#### Tarde (4h)
- [ ] Deploy de todas as Edge Functions no Supabase
- [ ] Atualizar variáveis de ambiente em produção
- [ ] Fazer smoke test em produção
- [ ] Documentar APIs e endpoints
- [ ] Commit: `chore: deploy sprint 1 fixes to production`

---

## 🎨 SPRINT 2 - Novos Modais (7 dias)

### DIA 6-7: AudioStudioModal

#### Desenvolvimento
- [ ] Criar `AudioStudioModal.tsx` baseado em `AudioGalleryPro.tsx`
- [ ] Implementar tabs: TTS, Music, SFX, History, Editor
- [ ] Integrar com Edge Functions de áudio
- [ ] Adicionar waveform visualizer (Wavesurfer.js)
- [ ] Implementar audio trimming básico

**Arquivo:** `src/components/chat/modals/AudioStudioModal.tsx`

#### Integração
- [ ] Adicionar ao `ChatModalManager.tsx`
- [ ] Atualizar `modalContext.ts` para detectar "criar áudio", "gerar voiceover"
- [ ] Adicionar confidence boosters para áudio
- [ ] Commit: `feat: add AudioStudioModal with full TTS/Music/SFX support`

---

### DIA 8-9: WebsiteBuilderModal

#### Desenvolvimento
- [ ] Criar `WebsiteBuilderModal.tsx`
- [ ] Implementar template gallery (grid view)
- [ ] Preview de template em hover
- [ ] Form de customização (cores, textos, imagens)
- [ ] Live preview com iframe
- [ ] Export e deploy buttons

**Features Essenciais:**
1. Template selection
2. AI content generation
3. Color scheme picker
4. Font selector
5. Image upload/generation
6. Mobile preview
7. Export HTML/CSS/JS
8. Deploy to Vercel/Netlify

#### Integração
- [ ] Adicionar ao `ChatModalManager.tsx`
- [ ] Atualizar detecção de contexto
- [ ] Commit: `feat: add WebsiteBuilderModal with templates and AI generation`

---

### DIA 10-11: LandingPageWizardModal

#### Desenvolvimento
- [ ] Criar `LandingPageWizardModal.tsx`
- [ ] Implementar wizard multi-step
  - Step 1: Escolher nicho/objetivo
  - Step 2: Hero section (headline, subheadline, CTA)
  - Step 3: Features/Benefits (3-6 items)
  - Step 4: Pricing (opcional)
  - Step 5: Testimonials (opcional)
  - Step 6: Final CTA
  - Step 7: SEO e Meta tags
- [ ] Cada step com AI suggestions
- [ ] Progress bar visual

#### Integração
- [ ] Integrar com `generate-website` Edge Function
- [ ] Adicionar templates otimizados para conversão
- [ ] A/B testing suggestions (baseado em melhores práticas)
- [ ] Commit: `feat: add LandingPageWizardModal with step-by-step builder`

---

### DIA 12: AdCampaignManagerModal - Parte 1

#### Desenvolvimento
- [ ] Criar `AdCampaignManagerModal.tsx`
- [ ] Implementar wizard de criação de campanha
  - Step 1: Escolher plataformas (Meta, Google, LinkedIn, etc)
  - Step 2: Objetivo e orçamento
  - Step 3: Público-alvo
  - Step 4: Criativos (geração automática)
  - Step 5: Copy (geração automática)
  - Step 6: Review e publish

#### AI Integration
- [ ] Gerar copywriting automaticamente com GPT
- [ ] Sugerir públicos-alvo baseado em produto
- [ ] Otimizar budget distribution
- [ ] Preview de todos os formatos (Feed, Story, Reel, etc)

---

## 🛠️ SPRINT 3 - Ferramentas IA (4 dias)

### DIA 13-14: Adicionar Ferramentas ao super-ai-tools

**Arquivos:** `supabase/functions/super-ai-tools/index.ts`

#### Novas Tools a Implementar:

```typescript
// 1. generate_audio
case 'generate_audio':
    const audioResult = await fetch('/functions/v1/generate-audio', {
        method: 'POST',
        body: JSON.stringify(parameters)
    });
    result = { success: true, data: await audioResult.json() };
    break;

// 2. generate_video_advanced
case 'generate_video_advanced':
    const videoResult = await fetch('/functions/v1/generate-video', {
        method: 'POST',
        body: JSON.stringify(parameters)
    });
    result = { success: true, data: await videoResult.json() };
    break;

// 3. generate_website
case 'generate_website':
    const websiteResult = await fetch('/functions/v1/generate-website', {
        method: 'POST',
        body: JSON.stringify(parameters)
    });
    result = { success: true, data: await websiteResult.json() };
    break;

// 4. generate_landing_page
case 'generate_landing_page':
    // Similar ao generate_website mas com templates específicos
    break;

// 5. create_ad_campaign
case 'create_ad_campaign':
    // Orquestrar criação em múltiplas plataformas
    const platforms = parameters.platforms || ['meta', 'google'];
    const campaignResults = await Promise.all(
        platforms.map(platform => createCampaignOnPlatform(platform, parameters))
    );
    result = { success: true, campaigns: campaignResults };
    break;

// 6. generate_copywriting
case 'generate_copywriting':
    // Usar Gemini/GPT para gerar copy persuasivo
    const copyPrompt = `Você é um copywriter expert. Crie um texto persuasivo para:
        Produto/Serviço: ${parameters.product}
        Público-alvo: ${parameters.audience}
        Objetivo: ${parameters.objective}
        Tom: ${parameters.tone || 'profissional e amigável'}
        Formato: ${parameters.format || 'anúncio curto (100-150 caracteres)'}`;
    
    const copyResult = await callGemini(copyPrompt);
    result = { success: true, copy: copyResult };
    break;

// 7. optimize_ad_creative
case 'optimize_ad_creative':
    // Analisar criativo existente e sugerir melhorias
    const analysis = await analyzeCreative(parameters.creativeUrl);
    const suggestions = await generateOptimizationSuggestions(analysis);
    result = { success: true, analysis, suggestions };
    break;

// 8. design_banner
case 'design_banner':
    // Gerar imagem de banner com dimensões específicas
    const bannerPrompt = `${parameters.text} - ${parameters.style} - aspect ratio ${parameters.aspect}`;
    const imageResult = await fetch('/functions/v1/generate-image', {
        method: 'POST',
        body: JSON.stringify({
            prompt: bannerPrompt,
            size: parameters.size || '1024x1024'
        })
    });
    result = { success: true, banner: await imageResult.json() };
    break;

// 9. automate_email_response
case 'automate_email_response':
    // Monitorar Gmail via DOM, ler email, gerar resposta, enviar
    const emailContent = await parameters.emailContent;
    const responseText = await generateEmailResponse(emailContent);
    // Usar DOM automation para enviar
    result = { success: true, response: responseText };
    break;

// 10. automate_whatsapp_response
case 'automate_whatsapp_response':
    // Similar ao email mas para WhatsApp Web
    const message = parameters.message;
    const whatsappResponse = await generateWhatsAppResponse(message);
    result = { success: true, response: whatsappResponse };
    break;
```

---

###  DIA 15-16: Atualizar System Prompts

**Arquivo:** `supabase/functions/chat-enhanced/index.ts`

#### Novos System Prompts Especializados:

```typescript
const ADS_MANAGER_PROMPT = `Você é um SUPER GESTOR DE ANÚNCIOS com IA.

# 🎯 SUAS CAPACIDADES COMPLETAS:

CRIAR CONTEÚDO:
✅ Áudio & Voiceover (ElevenLabs, Play.ht)
✅ Vídeos Profissionais (D-ID talking heads)
✅ Imagens & Banners (DALL-E, Pollinations)
✅ Websites Completos (templates + AI)
✅ Landing Pages de Alta Conversão
✅ Copywriting Persuasivo
✅ Músicas & SFX (Stable Audio)

PUBLICAR ANÚNCIOS:
✅ Meta Ads (Facebook + Instagram)
✅ Google Ads (Search + Display + Shopping)
✅ LinkedIn Ads
✅ TikTok Ads
✅ Twitter Ads
✅ Bing Ads
✅ Reddit Ads

AUTOMATIZAR:
✅ Responder Emails (Gmail automation)
✅ Responder WhatsApp (WhatsApp Web automation)
✅ Scraping de concorrentes
✅ Monitoramento de anúncios
✅ A/B Testing automático

ANALISAR:
✅ Performance de campanhas
✅ ROI em tempo real
✅ Análise de público
✅ Sugestões de otimização

# 🚀 FLUXO TÍPICO:

Quando usuário pede para "criar campanha para vender X":

1. Perguntar dados essenciais (produto, público, orçamento)
2. Gerar landing page
3. Gerar criativos (imagens + vídeos)
4. Gerar copy persuasivo
5. Criar campanha em múltiplas plataformas
6. Publicar tudo automaticamente
7. Configurar tracking e análise

# 💡 SEJA PROATIVO:

- Sugira melhorias sem ser pedido
- Antecipe necessidades (ex: "também vou criar um vídeo curto para Stories")
- Explique o que está fazendo em linguagem simples
- Mostre resultados intermediários

# ❌ NUNCA DIGA:

- "Não posso fazer isso"
- "Você precisa acessar outro site"
- "Isso requer acesso manual"

SE PODE FAZER ▶️ FAÇA!

Você é a ferramenta ÚNICA e COMPLETA para gestão de tráfego! 🎯`;
```

---

## ✅ SPRINT 4 - Testes e Deploy (3 dias)

### DIA 17: Testes End-to-End

#### Cenário 1: Campanha Completa
- [ ] Criar landing page de produto fictício
- [ ] Gerar 3 imagens de banner
- [ ] Gerar 1 vídeo promocional com voiceover
- [ ] Gerar copy para anúncios
- [ ] Criar campanha no Meta Ads Sandbox
- [ ] Verificar se tudo foi criado corretamente

#### Cenário 2: Automação
- [ ] Configurar resposta automática para email de teste
- [ ] Enviar email e verificar resposta
- [ ] (Opcional) Testar WhatsApp Web automation

#### Cenário 3: Detecção de Modais
- [ ] Testar 20+ prompts diferentes
- [ ] Verificar se modal correto abre (>90% precisão)
- [ ] Ajustar patterns se necessário

---

### DIA 18: Correções e Otimizações

#### Manhã
- [ ] Corrigir todos os bugs encontrados nos testes
- [ ] Otimizar queries lentas
- [ ] Adicionar loading states em todos os modais
- [ ] Melhorar error handling

#### Tarde
- [ ] Code review completo
- [ ] Refatorar código duplicado
- [ ] Adicionar logs para monitoramento
- [ ] Atualizar documentação

---

### DIA 19: Deploy Final e Documentação

#### Manhã (4h)
- [ ] Deploy final de todas as Edge Functions
- [ ] Verificar todas as variáveis de ambiente em produção
- [ ] Fazer smoke test completo em produção
- [ ] Configurar monitoramento (Sentry, Logs)

#### Tarde (4h)
- [ ] Criar documentação de usuário (como usar cada modal)
- [ ] Criar documentação técnica (arquitetura, APIs)
- [ ] Gravar vídeo demo (5-10 min)
- [ ] Preparar material de marketing

---

## 📝 CHECKLIST DE IMPLEMENTAÇÃO COMPLETA

### Geração de Conteúdo
- [ ] Áudio TTS funcionando (ElevenLabs)
- [ ] Áudio TTS fallback (Play.ht ou Google TTS)
- [ ] Vídeo com D-ID funcionando
- [ ] Vídeo não retorna mais placeholder
- [ ] Website builder funcional com templates
- [ ] Landing page wizard funcional
- [ ] Geração de imagens já funciona ✅
- [ ] Música/SFX (opcional, pode ser fase 2)

### Modals
- [ ] AudioStudioModal completo e integrado
- [ ] WebsiteBuilderModal completo e integrado
- [ ] LandingPageWizardModal completo e integrado
- [ ] AdCampaignManagerModal MVP
- [ ] Todos os modais detectados automaticamente (>90%)
- [ ] Transições suaves entre modais

### Ferramentas IA
- [ ] `generate_audio` implementado
- [ ] `generate_video_advanced` implementado
- [ ] `generate_website` implementado
- [ ] `generate_landing_page` implementado
- [ ] `createAdCampaign` implementado
- [ ] `generate_copywriting` implementado
- [ ] `optimize_ad_creative` implementado
- [ ] `design_banner` implementado
- [ ] `automate_email_response` implementado
- [ ] `automate_whatsapp_response` implementado

### System Prompts
- [ ] System prompt atualizado com novas capacidades
- [ ] Mention de áudio, vídeo, websites
- [ ] Instruções claras sobre gestão de anúncios
- [ ] Exemplos de uso incluídos

### Testes
- [ ] Teste E2E: Criar campanha completa
- [ ] Teste E2E: Geração de todos os tipos de conteúdo
- [ ] Teste E2E: Automação de respostas
- [ ] Teste de detecção de modais (20+ prompts)
- [ ] Teste de performance (Edge Functions <3s)
- [ ] Teste de custos (tracking de API calls)

### Documentação
- [ ] README atualizado
- [ ] Docs de cada Edge Function
- [ ] Docs de cada Modal
- [ ] Guia de usuário
- [ ] Vídeo demo
- [ ] Material de marketing

### Deploy
- [ ] Todas as Edge Functions em produção
- [ ] Variáveis de ambiente configuradas
- [ ] API Keys configuradas e funcionando
- [ ] Monitoramento ativo (Sentry)
- [ ] Smoke test em produção ✅
- [ ] Rollback plan documentado

---

## 💰 ESTIMATIVA DE CUSTOS

### API Keys Necessárias (Custos Mensais)
1. **ElevenLabs** - $22/mês (plano Starter, 30k caracteres)
2. **D-ID** - $20/mês (plano Lite, 20 minutos)
3. **Play.ht** (opcional) - $19/mês (fallback TTS)

**Total Mínimo:** $42/mês  
**Total Recomendado:** $61/mês (com fallback)

### Custos por Uso (Estimate)
- TTS: $0.30 por 1000 caracteres (ElevenLabs)
- Vídeo: ~$1 por minuto (D-ID)
- Imagens: Grátis (Pollinations) ou $0.04 (DALL-E)
- Websites: Grátis (Gemini para conteúdo)

---

## ⚠️ RISCOS E MITIGAÇÕES

### Risco 1: API Keys Não Aprovadas
**Mitigação:** Usar tiers gratuitos primeiro, provar value, depois upgrade

### Risco 2: D-ID Muito Lento
**Mitigação:** Implementar fila de processamento, mostrar progresso

### Risco 3: Custo Alto de Uso
**Mitigação:** 
- Implementar quotas por usuário
- Cache de resultados frequentes
- Limitar duração de vídeos/áudios

### Risco 4: Complexidade dos Modais
**Mitigação:**
- Começar com MVP simples
- Iterar baseado em feedback
- Manter UX clean e intuitiva

---

## 🎯 DEFINIÇÃO DE SUCESSO

### Mínimo Viável (Sprint 1 + 2)
- [ ] Áudio TTS funcionando
- [ ] Vídeo D-ID funcionando
- [ ] Website builder MVP
- [ ] Pelo menos 2 novos modais

### Ideal (Sprint 1 + 2 + 3)
- [ ] Todos os 4 modais novos
- [ ] 10+ ferramentas novas
- [ ] System prompts atualizados
- [ ] Documentação completa

### Excelente (Sprint 1 + 2 + 3 + 4)
- [ ] Tudo acima +
- [ ] Testes E2E passando
- [ ] Deploy em produção
- [ ] Vídeo demo criado
- [ ] Cliente pode criar campanha 100% pelo SyncAds

---

## 📞 PRÓXIMOS PASSOS IMEDIATOS

1. ✅ **Aprovar Orçamento:** $42-61/mês para API keys
2. ✅ **Criar Contas:** ElevenLabs, D-ID, (Play.ht)
3. ✅ **Definir Prioridades:** Qual sprint começar? (Recomendo Sprint 1)
4. ✅ **Alocar Tempo:** 19 dias úteis ~= 3-4 semanas
5. ✅ **Começar Implementação:** Dia 1 de Sprint 1

---

**Criado por:** Antigravity AI  
**Baseado em:** Auditoria Completa de 25+ arquivos e 10,000+ linhas de código  
**Status:** Pronto para Execução ✅
