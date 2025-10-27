// ================================================
// EDGE FUNCTION: Geração de Imagens com DALL-E 3
// URL: /functions/v1/generate-image
// ================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
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
      size = '1024x1024',
      quality = 'standard' 
    } = body

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    console.log('Generating image:', { organizationId, prompt, size, quality })

    // 5. Verificar quota
    const { data: quotaCheck, error: quotaError } = await supabase
      .rpc('check_and_use_quota', {
        org_id: organizationId,
        quota_type: 'images',
        amount: 1
      })

    if (quotaError) {
      throw new Error(`Quota check failed: ${quotaError.message}`)
    }

    if (!quotaCheck.success) {
      return new Response(
        JSON.stringify({
          error: quotaCheck.error,
          quota: quotaCheck.quota,
          used: quotaCheck.used
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 6. Buscar API Key da tabela GlobalAiConnection (configuração visual)
    const { data: aiConfig, error: aiError } = await supabase
      .from('GlobalAiConnection')
      .select('apiKey, provider, model, baseUrl')
      .eq('provider', 'OPENAI')
      .eq('isActive', true)
      .limit(1)
      .single()

    if (aiError || !aiConfig) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI não configurada. Adicione uma conexão de IA no painel Super Admin.',
          hint: 'Acesse /super-admin/ai-connections e adicione uma IA com provider OPENAI'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const openaiKey = aiConfig.apiKey

    const baseUrl = aiConfig.baseUrl || 'https://api.openai.com/v1'
    const dalleResponse = await fetch(`${baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + openaiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: size,
        quality: quality,
        response_format: 'url'
      })
    })

    if (!dalleResponse.ok) {
      const errorData = await dalleResponse.json()
      console.error('DALL-E error:', errorData)
      throw new Error(`DALL-E API error: ${errorData.error?.message || 'Unknown error'}`)
    }

    const dalleData = await dalleResponse.json()
    const imageUrl = dalleData.data[0].url
    const revisedPrompt = dalleData.data[0].revised_prompt

    console.log('Image generated:', imageUrl)

    // 7. Fazer download da imagem temporária
    const imageResponse = await fetch(imageUrl)
    const imageBlob = await imageResponse.blob()
    const imageBuffer = await imageBlob.arrayBuffer()

    // 8. Upload para Supabase Storage
    const fileName = `${organizationId}/${Date.now()}-${crypto.randomUUID()}.png`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('media-generations')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw new Error(`Failed to upload image: ${uploadError.message}`)
    }

    // 9. Gerar URL pública
    const { data: { publicUrl } } = supabase
      .storage
      .from('media-generations')
      .getPublicUrl(fileName)

    // 10. Calcular custo (DALL-E 3 pricing)
    const cost = quality === 'hd' ? 0.08 : 0.04 // USD

    // 11. Salvar no banco
    const { data: mediaRecord, error: insertError } = await supabase
      .from('MediaGeneration')
      .insert({
        organizationId: organizationId,
        userId: user.id,
        type: 'IMAGE',
        provider: 'DALL-E',
        prompt: prompt,
        url: publicUrl,
        size: size,
        quality: quality,
        cost: cost,
        status: 'COMPLETED',
        metadata: {
          revisedPrompt: revisedPrompt,
          originalUrl: imageUrl
        }
      })
      .select()
      .single()

    if (insertError) {
      console.error('Insert error:', insertError)
      throw new Error(`Failed to save record: ${insertError.message}`)
    }

    // 12. Registrar uso no histórico
    await supabase
      .from('QuotaUsageHistory')
      .insert({
        organizationId: organizationId,
        userId: user.id,
        type: 'IMAGE',
        amount: 1,
        cost: cost,
        metadata: {
          provider: 'DALL-E',
          size: size,
          quality: quality
        }
      })

    // 13. Retornar sucesso
    return new Response(
      JSON.stringify({
        success: true,
        image: {
          id: mediaRecord.id,
          url: publicUrl,
          prompt: prompt,
          revisedPrompt: revisedPrompt,
          size: size,
          quality: quality,
          cost: cost
        },
        quota: {
          remaining: quotaCheck.remaining,
          used: quotaCheck.used,
          total: quotaCheck.quota
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Generate image error:', error)
    
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
