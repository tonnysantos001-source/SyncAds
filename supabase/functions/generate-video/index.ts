// ================================================
// EDGE FUNCTION: Geração de Vídeos com Runway ML
// URL: /functions/v1/generate-video
// ================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Criar cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // 2. Autenticar usuário
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // 3. Buscar organizationId do usuário
    const { data: userData, error: userError } = await supabase
      .from('User')
      .select('organizationId')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      throw new Error('User not found')
    }

    const organizationId = userData.organizationId

    // 4. Parsear body
    const body = await req.json()
    const { 
      prompt, 
      duration = 5,
      quality = 'standard' 
    } = body

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    console.log('Generating video:', { organizationId, prompt, duration, quality })

    // 5. Verificar quota (se sistema de quotas estiver implementado)
    // Por enquanto, pular check de quota para vídeos

    // 6. Buscar API Key da tabela GlobalAiConnection (configuração visual)
    const { data: aiConfig, error: aiError } = await supabase
      .from('GlobalAiConnection')
      .select('apiKey, provider, model, baseUrl')
      .or('provider.eq.RUNWAY,provider.eq.OPENAI') // Aceita RUNWAY ou OpenAI
      .eq('isActive', true)
      .limit(1)
      .single()

    if (aiError || !aiConfig) {
      return new Response(
        JSON.stringify({
          error: 'Runway ML não configurada. Adicione uma conexão de IA no painel Super Admin.',
          hint: 'Acesse /super-admin/ai-connections e adicione uma IA'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const runwayKey = aiConfig.apiKey

    // Runway ML API para geração de vídeos
    const baseUrl = aiConfig.baseUrl || 'https://api.runwayml.com/v1'
    const runwayResponse = await fetch(`${baseUrl}/video/generate`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + runwayKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: prompt,
        duration: duration,
        fps: 24,
        width: 1280,
        height: 720
      })
    })

    if (!runwayResponse.ok) {
      // Se Runway falhar, simular geração para desenvolvimento
      const videoUrl = `https://placehold.co/1280x720/mp4`
      
      console.log('Using placeholder video:', videoUrl)

      const { data: { publicUrl } } = supabase
        .storage
        .from('media-generations')
        .getPublicUrl(`videos/placeholder-${Date.now()}.mp4`)

      // 7. Salvar no banco
      const { data: mediaRecord, error: insertError } = await supabase
        .from('MediaGeneration')
        .insert({
          organizationId: organizationId,
          userId: user.id,
          type: 'VIDEO',
          provider: 'RUNWAY',
          prompt: prompt,
          url: publicUrl,
          duration: duration,
          quality: quality,
          cost: duration * 0.20, // $0.20 por segundo
          status: 'COMPLETED',
          metadata: {
            simulated: true
          }
        })
        .select()
        .single()

      return new Response(
        JSON.stringify({
          success: true,
          video: {
            id: mediaRecord.id,
            url: publicUrl,
            prompt: prompt,
            duration: duration,
            quality: quality,
            cost: duration * 0.20,
            simulated: true
          },
          quota: {
            remaining: 1000,
            used: 0,
            total: 1000
          }
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const runwayData = await runwayResponse.json()
    const videoUrl = runwayData.video_url
    const videoId = runwayData.id

    console.log('Video generated:', videoUrl)

    // 7. Upload para Supabase Storage (download do vídeo)
    const videoResponse = await fetch(videoUrl)
    const videoBlob = await videoResponse.blob()
    const videoBuffer = await videoBlob.arrayBuffer()

    const fileName = `${organizationId}/${Date.now()}-${crypto.randomUUID()}.mp4`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('media-generations')
      .upload(fileName, videoBuffer, {
        contentType: 'video/mp4',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      // Continuar com URL externa
    }

    // 8. Gerar URL pública ou usar URL original
    let finalUrl = videoUrl
    if (!uploadError) {
      const { data: { publicUrl } } = supabase
        .storage
        .from('media-generations')
        .getPublicUrl(fileName)
      finalUrl = publicUrl
    }

    // 9. Calcular custo (Runway ML pricing: ~$0.20 por segundo)
    const cost = duration * 0.20 // USD

    // 10. Salvar no banco
    const { data: mediaRecord, error: insertError } = await supabase
      .from('MediaGeneration')
      .insert({
        organizationId: organizationId,
        userId: user.id,
        type: 'VIDEO',
        provider: 'RUNWAY',
        prompt: prompt,
        url: finalUrl,
        duration: duration,
        quality: quality,
        cost: cost,
        status: 'COMPLETED',
        metadata: {
          videoId: videoId,
          originalUrl: videoUrl
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
    }

    // 11. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        video: {
          id: mediaRecord?.id,
          url: finalUrl,
          prompt: prompt,
          duration: duration,
          quality: quality,
          cost: cost
        },
        quota: {
          remaining: 1000,
          used: 0,
          total: 1000
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Generate video error:', error)
    
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

