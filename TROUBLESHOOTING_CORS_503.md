# 🔍 TROUBLESHOOTING: Erro 503 no CORS

## 🚨 PROBLEMA IDENTIFICADO

A função está retornando **503 Service Unavailable**, o que significa que:

1. ❌ A função não está respondendo corretamente
2. ❌ O handlePreflightRequest pode não estar funcionando
3. ❌ Pode haver erro na lógica da função

---

## ✅ SOLUÇÃO 1: Verificar Logs no Dashboard

1. **Acesse:** https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/logs/edge-functions

2. **Clique em:** `chat-stream`

3. **Procure por:**
   - `❌ Error:` 
   - `✅ CORS preflight OK`
   - Qualquer mensagem de erro

---

## ✅ SOLUÇÃO 2: Testar a Função Via Dashboard

1. **Acesse:** https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/functions

2. **Clique em:** `chat-stream`

3. **Clique em:** "Invoke" ou "Test"

4. **Use este payload:**
```json
{
  "message": "test",
  "conversationId": "test-123",
  "conversationHistory": []
}
```

5. **Verifique a resposta:**
   - Deve retornar 200 OK
   - Se retornar erro, copie e cole aqui

---

## ✅ SOLUÇÃO 3: Redeploy Forçado

```bash
# Forçar redeploy sem verificar JWT
supabase functions deploy chat-stream --no-verify-jwt

# OU deletar e recriar
supabase functions delete chat-stream
supabase functions deploy chat-stream
```

---

## ✅ SOLUÇÃO 4: Verificar Variáveis de Ambiente

A função precisa destas variáveis no Supabase Dashboard:

1. **Acesse:** https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/settings/functions

2. **Verifique se estão configuradas:**
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`

3. **Se não estiverem, adicione-as**

---

## 🧪 SOLUÇÃO 5: Testar CORS Manualmente

Execute este comando no terminal:

```powershell
curl -i -X OPTIONS `
  https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream `
  -H "Origin: https://syncads-dun.vercel.app" `
  -H "Access-Control-Request-Method: POST"
```

**Resultado esperado:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: https://syncads-dun.vercel.app
```

**Se aparecer 503:** A função não está funcionando

---

## 📊 DIAGNÓSTICO

### **Status Atual:**
- ❌ OPTIONS retorna 503
- ✅ Deploy foi feito
- ❌ Função não está respondendo

### **Possíveis Causas:**
1. **Erro de sintaxe na função** - Função não compila
2. **Variáveis de ambiente faltando** - SUPABASE_URL não configurado
3. **Função antiga ainda ativa** - Deploy não atualizou
4. **Cache do Edge** - Cloudflare ainda usando versão antiga

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ Adicionei header `apikey` no AdminChatPage.tsx
2. ⚠️ Verifique os logs no Dashboard
3. ⚠️ Teste manualmente a função
4. ⚠️ Se não funcionar, force um redeploy

**Por favor, acesse os logs e me diga o que aparece!**

