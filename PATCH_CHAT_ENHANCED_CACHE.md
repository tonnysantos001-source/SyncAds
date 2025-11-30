# PATCH: Adicionar Cache após resposta da IA

Adicione este código ANTES do `return new Response` final (linha ~última do arquivo):

```typescript
    // ✅ SALVAR RESPOSTA NO CACHE para uso futuro
    console.log("💾 Salvando resposta no cache:", cacheKey);
    
    await setCachedResponse(
      supabase,
      cacheKey,
      response,
      {
        provider: aiConnection.provider,
        model: aiConnection.model,
        tokensUsed,
        conversationId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      },
      86400 // TTL: 24 horas
    );
    
    // Registrar uso de IA no audit log
    await logAudit(
      supabase,
      "ai_requests",
      conversationId,
      "INSERT",
      null,
      {
        userId: user.id,
        provider: aiConnection.provider,
        model: aiConnection.model,
        tokensUsed,
        cached: false,
        cacheKey,
      },
      user.id
    );

    return new Response(
      JSON.stringify({
        response,
        tokensUsed,
        provider: aiConnection.provider,
        model: aiConnection.model,
        userMessageId: userMsgId,
        aiMessageId: assistantMsgId,
        cached: false, // ← ADICIONAR
        cacheKey, // ← ADICIONAR
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Cache": "MISS", // ← ADICIONAR
        },
      },
    );
```

