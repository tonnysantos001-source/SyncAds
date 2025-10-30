import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, handlePreflightRequest, jsonResponse, errorResponse } from '../_utils/cors.ts'

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return handlePreflightRequest()
  }

  try {
    const { message, conversationHistory, systemPrompt } = await req.json()

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      throw new Error('Unauthorized')
    }

    // ✅ SISTEMA SIMPLIFICADO: SEM ORGANIZAÇÕES
    // Buscar GlobalAiConnection ativa (configurada pelo Super Admin)
    const { data: aiConnection, error: aiError } = await supabase
      .from('GlobalAiConnection')
      .select('*')
      .eq('isActive', true)
      .limit(1)
      .maybeSingle()

    if (aiError || !aiConnection) {
      return new Response(
        JSON.stringify({ 
          error: 'No AI configured',
          message: 'Nenhuma IA ativa configurada. Contate o administrador.'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (!aiConnection.isActive) {
      throw new Error('AI connection is not active')
    }

    // Use system prompt from AI connection or provided one
    const finalSystemPrompt = aiConnection.systemPrompt || systemPrompt || 'You are a helpful marketing assistant.'

    // Build messages array
    const messages = [
      { role: 'system', content: finalSystemPrompt },
      ...conversationHistory.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ]

    // Call appropriate AI provider
    let response: string
    let tokensUsed = 0

    // OpenAI-compatible providers (OpenAI, OpenRouter, Groq, Together, Fireworks, Mistral, Perplexity)
    const openaiCompatibleProviders = ['OPENAI', 'OPENROUTER', 'GROQ', 'TOGETHER', 'FIREWORKS', 'MISTRAL', 'PERPLEXITY']
    
    if (openaiCompatibleProviders.includes(aiConnection.provider)) {
      // Determine base URL
      const baseUrl = aiConnection.baseUrl || 'https://api.openai.com/v1'
      const endpoint = `${baseUrl}/chat/completions`
      
      // Determine headers based on provider
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (aiConnection.provider === 'OPENROUTER') {
        headers['Authorization'] = `Bearer ${aiConnection.apiKey}`
        headers['HTTP-Referer'] = 'https://syncads.com'
        headers['X-Title'] = 'SyncAds'
      } else {
        headers['Authorization'] = `Bearer ${aiConnection.apiKey}`
      }

      const openaiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: aiConnection.model || 'gpt-4-turbo',
          messages: messages,
          temperature: aiConnection.temperature || 0.7,
          max_tokens: aiConnection.maxTokens || 4096
        })
      })

      if (!openaiResponse.ok) {
        const error = await openaiResponse.text()
        throw new Error(`${aiConnection.provider} API error: ${error}`)
      }

      const data = await openaiResponse.json()
      response = data.choices[0].message.content
      tokensUsed = data.usage?.total_tokens || 0

    } else if (aiConnection.provider === 'ANTHROPIC') {
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': aiConnection.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: aiConnection.model || 'claude-3-opus-20240229',
          max_tokens: aiConnection.maxTokens || 4096,
          temperature: aiConnection.temperature || 0.7,
          messages: messages.filter(m => m.role !== 'system'),
          system: finalSystemPrompt
        })
      })

      if (!anthropicResponse.ok) {
        const error = await anthropicResponse.text()
        throw new Error(`Anthropic API error: ${error}`)
      }

      const data = await anthropicResponse.json()
      response = data.content[0].text
      tokensUsed = data.usage.input_tokens + data.usage.output_tokens

    } else if (aiConnection.provider === 'GOOGLE') {
      const googleResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${aiConnection.model || 'gemini-pro'}:generateContent?key=${aiConnection.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: messages.filter(m => m.role !== 'system').map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
            generationConfig: {
              temperature: aiConnection.temperature || 0.7,
              maxOutputTokens: aiConnection.maxTokens || 4096
            }
          })
        }
      )

      if (!googleResponse.ok) {
        const error = await googleResponse.text()
        throw new Error(`Google API error: ${error}`)
      }

      const data = await googleResponse.json()
      response = data.candidates[0].content.parts[0].text
      tokensUsed = data.usageMetadata.totalTokenCount || 0

    } else if (aiConnection.provider === 'COHERE') {
      // Convert messages to Cohere format
      const chatHistory = messages.slice(1, -1).map(m => ({
        role: m.role === 'assistant' ? 'CHATBOT' : 'USER',
        message: m.content
      }))

      const cohereResponse = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${aiConnection.apiKey}`
        },
        body: JSON.stringify({
          model: aiConnection.model || 'command-r-plus',
          message: message,
          chat_history: chatHistory,
          preamble: finalSystemPrompt,
          temperature: aiConnection.temperature || 0.7,
          max_tokens: aiConnection.maxTokens || 4096
        })
      })

      if (!cohereResponse.ok) {
        const error = await cohereResponse.text()
        throw new Error(`Cohere API error: ${error}`)
      }

      const data = await cohereResponse.json()
      response = data.text
      tokensUsed = (data.meta?.tokens?.input_tokens || 0) + (data.meta?.tokens?.output_tokens || 0)

    } else {
      throw new Error(`Unsupported AI provider: ${aiConnection.provider}`)
    }

    // Track AI usage (async, don't wait) - Sistema simplificado sem organizações
    supabase.from('AiUsage').upsert({
      userId: user.id,
      globalAiConnectionId: aiConnection.id,
      messageCount: 1,
      tokensUsed: tokensUsed,
      month: new Date().toISOString().substring(0, 7), // YYYY-MM
      cost: (tokensUsed / 1000) * 0.01 // Estimate: $0.01 per 1K tokens
    }, {
      onConflict: 'userId,globalAiConnectionId,month'
    })

    return new Response(
      JSON.stringify({ 
        response,
        tokensUsed,
        provider: aiConnection.provider,
        model: aiConnection.model
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Chat error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        message: 'Erro ao processar mensagem. Verifique se a IA está configurada corretamente.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
