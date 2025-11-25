# 🔧 PATCH: Executar Comandos DOM Reais

## Problema
IA diz que abriu o site mas não executa a ação real.

## Solução
Adicione no início do `chat-enhanced/index.ts`:

```typescript
import { executeIfDOMCommand } from "../_utils/dom-command-handler.ts";
```

Depois, ANTES de chamar a IA, adicione:

```typescript
// ✅ DETECTAR E EXECUTAR COMANDOS DOM REAIS
console.log("🔍 Verificando se é comando DOM...");

const domResult = await executeIfDOMCommand(supabase, user.id, message);

if (domResult.executed) {
  console.log("✅ Comando DOM executado:", domResult);
  
  // Se teve erro, retornar erro
  if (domResult.error) {
    return new Response(
      JSON.stringify({
        response: domResult.response,
        commandExecuted: true,
        error: domResult.error,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
  
  // Comando executado com sucesso - retornar confirmação
  // Salvar mensagens no banco
  await supabase.from("ChatMessage").insert([
    {
      id: crypto.randomUUID(),
      conversationId,
      role: "USER",
      content: message,
      userId: user.id,
    },
    {
      id: crypto.randomUUID(),
      conversationId,
      role: "ASSISTANT",
      content: domResult.response,
      userId: user.id,
    },
  ]);
  
  return new Response(
    JSON.stringify({
      response: domResult.response,
      commandExecuted: true,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
}

console.log("❌ Não é comando DOM, prosseguindo com IA normal...");
// Continuar com fluxo normal da IA...
```

## Como Funciona

1. **Detecta** comandos como "abra o facebook"
2. **Envia** comando real para extensão
3. **Retorna** confirmação imediata
4. **Extensão** executa o comando de verdade

## Comandos Suportados

- "abra o site do facebook"
- "vá para o youtube"
- "acesse o instagram"
- "abra https://google.com"
- E mais 10+ sites populares

## Teste

Depois de aplicar, teste:
- "abra o facebook" → Deve abrir de verdade!
- "vá para o youtube" → Deve abrir de verdade!
- "acesse o google" → Deve abrir de verdade!
