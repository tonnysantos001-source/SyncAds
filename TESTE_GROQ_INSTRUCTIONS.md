# 🧪 Como Testar GROQ Tool Calling

## ✅ Nova Edge Function Deployada

A função `chat-stream-groq` foi deployada com **tool calling nativo do GROQ**.

## 📝 Opção 1: Testar via Frontend (RECOMENDADO)

### Passo 1: Atualizar o frontend temporariamente

Em `src/lib/api/chat.ts` (ou onde você chama a Edge Function), **temporariamente** mude:

```typescript
// De:
const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {

// Para:
const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream-groq`, {
```

### Passo 2: Recarregar o frontend

```bash
npm run dev
```

### Passo 3: Testar no chat

Envie a mensagem:
```
preciso que faça uma raspagem dos produtos nesse site https://www.kinei.com.br/produtos/tenis-masculino, depois crie um arquivo .csv para eu fazer download
```

### Passo 4: Ver os logs

Abra o Supabase Dashboard → Functions → `chat-stream-groq` → Logs

Você deverá ver:
```
🚀 [GROQ] Chamando API com tools...
🛠️  [TOOLS] Modelo solicitou 1 ferramenta(s)
🔧 [TOOL] Executando: web_scraping
🕷️  [WEB_SCRAPING] Iniciando scraping de: https://...
✅ [WEB_SCRAPING] Produtos encontrados: 24
✅ [TOOL] web_scraping concluído
🔄 [GROQ] Enviando resultados das ferramentas de volta...
✅ [GROQ] Resposta final gerada
```

---

## 📝 Opção 2: Testar via cURL (Manual)

### Passo 1: Pegar seu token de autenticação

No navegador, abra o DevTools → Application → Storage → Local Storage → procure por `sb-XXX-auth-token`

Ou use o token de um usuário de teste.

### Passo 2: Executar o teste

```bash
curl -X POST 'https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream-groq' \
  -H 'Authorization: Bearer SEU_TOKEN_AQUI' \
  -H 'Content-Type: application/json' \
  -d '{
    "message": "raspe produtos de https://www.kinei.com.br/produtos/tenis-masculino",
    "conversationId": "test-123",
    "chatHistory": []
  }'
```

---

## 🔍 O Que Esperar

### ✅ Sucesso

Resposta similar a:
```json
{
  "response": "✅ Raspagem concluída! 24 produtos encontrados.\n\n📄 CSV gerado:\n```csv\nname,price,image,url\nTênis Nike,R$ 299.90,...\n```\n\nTotal de 24 produtos raspados com sucesso!"
}
```

### ❌ Se ainda der erro

Verifique:
1. **GROQ está configurado?** → Supabase → Database → `GlobalAiConnection` → provider='GROQ' e isActive=true
2. **API Key está correta?** → Verifique no Dashboard do GROQ
3. **Modelo suportado?** → Use `llama-3.3-70b-versatile` ou `mixtral-8x7b-32768`

---

## 🔄 Substituir a Função Antiga (Opcional)

Se tudo funcionar perfeitamente, você pode:

1. **Deletar** `chat-stream` antiga
2. **Renomear** `chat-stream-groq` para `chat-stream`
3. Ou manter ambas e deixar o usuário escolher

---

## 📊 Diferença Entre as Implementações

### ❌ Implementação Antiga (chat-stream)

```typescript
// Detecção de intenção ANTES do GROQ
if (message.includes("raspar")) {
  result = await scrapeWebsite()
}

// Chama GROQ com tool_choice: "none"
// ❌ GROQ tenta usar tool mesmo assim → ERRO
```

### ✅ Nova Implementação (chat-stream-groq)

```typescript
// Deixa o GROQ decidir
const response = await groq({
  tools: [web_scraping, search_google],
  tool_choice: "auto" // ✅ GROQ decide quando usar
})

// Se GROQ retornar tool_calls
if (response.tool_calls) {
  // Executa as ferramentas
  // Retorna resultado ao GROQ
  // GROQ gera resposta final
}
```

---

## 🎯 Próximos Passos

1. ✅ Testar a nova função
2. ✅ Ver os logs para confirmar que funciona
3. ✅ Comparar a qualidade das respostas
4. ✅ Decidir se mantém a antiga ou substitui
5. ✅ Adicionar mais ferramentas se necessário

---

**🚀 Teste agora e me diga o resultado!**

