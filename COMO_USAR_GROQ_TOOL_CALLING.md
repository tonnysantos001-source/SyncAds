# 🛠️ GROQ Tool Calling - Implementação Correta

## 📋 O Que Foi Feito

Criamos uma **nova Edge Function** (`chat-stream-groq`) que implementa **tool calling NATIVO** do GROQ corretamente.

## ✅ Solução Implementada

### 1. Definição Correta das Ferramentas

```typescript
const tools = [
  {
    type: "function",
    function: {
      name: "web_scraping",
      description: "Raspa produtos de um site e-commerce",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL do site" },
          format: { type: "string", enum: ["csv", "json", "text"] }
        },
        required: ["url"]
      }
    }
  }
]
```

### 2. Chamada da API com `tool_choice: "auto"`

```typescript
await fetch('https://api.groq.com/openai/v1/chat/completions', {
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: messages,
    tools: tools,           // ✅ Ferramentas definidas
    tool_choice: "auto"     // ✅ Deixa o modelo decidir
  })
})
```

### 3. Processamento dos `tool_calls`

```typescript
if (assistantMessage.tool_calls) {
  for (const toolCall of assistantMessage.tool_calls) {
    const functionName = toolCall.function.name
    const functionArgs = JSON.parse(toolCall.function.arguments)
    
    // Executar a ferramenta
    const result = await executeWebScraping(functionArgs.url)
    
    // Preparar resultado
    toolResults.push({
      tool_call_id: toolCall.id,
      role: "tool",
      name: functionName,
      content: result
    })
  }
}
```

### 4. Enviar Resultado de Volta ao Modelo

```typescript
const messagesWithTools = [
  ...messages,
  assistantMessage,     // Mensagem com tool_calls
  ...toolResults        // Resultados das ferramentas
]

// Segunda chamada ao GROQ com os resultados
await fetch('https://api.groq.com/openai/v1/chat/completions', {
  body: JSON.stringify({
    model: 'llama-3.3-70b-versatile',
    messages: messagesWithTools
  })
})
```

## 🚀 Como Usar

### Opção 1: Usar a Nova Edge Function

Atualize o frontend para chamar `chat-stream-groq` ao invés de `chat-stream`:

```typescript
const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream-groq`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: userMessage,
    conversationId: currentConversationId,
    chatHistory: previousMessages
  })
})
```

### Opção 2: Substituir a Função Antiga

Se preferir, pode substituir o código da `chat-stream` pelo código da `chat-stream-groq`.

## 🧪 Teste

```bash
# Teste manual via curl
curl -X POST 'https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream-groq' \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "raspe produtos de https://www.kinei.com.br/produtos/tenis-masculino",
    "conversationId": "test-123",
    "chatHistory": []
  }'
```

## 📊 Logs Implementados

- `🕷️  [WEB_SCRAPING] Iniciando scraping de: URL`
- `✅ [WEB_SCRAPING] Produtos encontrados: N`
- `🔍 [GOOGLE_SEARCH] Buscando: query`
- `🛠️  [TOOLS] Modelo solicitou N ferramenta(s)`
- `🔧 [TOOL] Executando: nome_da_ferramenta`
- `✅ [TOOL] nome_da_ferramenta concluído`
- `🔄 [GROQ] Enviando resultados das ferramentas de volta...`

## ⚠️ Troubleshooting

### Erro: "Tool choice is none, but model called a tool"

**Causa:** Estava usando `tool_choice: "none"` ou `tools: []`  
**Solução:** Use `tool_choice: "auto"` e defina as ferramentas corretamente ✅

### Ferramentas não são chamadas

**Causa:** Descrição da ferramenta não é clara  
**Solução:** Melhore a `description` e `parameters.description` ✅

## 🎯 Próximos Passos

1. Testar a nova função no frontend
2. Adicionar mais ferramentas conforme necessário
3. Implementar rate limiting específico para tool calling
4. Adicionar métricas de uso de ferramentas

## 📝 Ferramentas Disponíveis

### 1. web_scraping
- **Função:** Raspa produtos de e-commerce
- **Parâmetros:** `url`, `format`
- **Retorno:** CSV ou JSON com produtos

### 2. search_google
- **Função:** Busca no Google via Serper
- **Parâmetros:** `query`
- **Retorno:** Top 5 resultados

