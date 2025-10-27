# 🚀 GUIA: Deploy da Correção de CORS

## ✅ O QUE FOI CORRIGIDO

### **Arquivos Atualizados:**
1. ✅ `supabase/functions/_utils/cors.ts` - Código CORS centralizado
2. ✅ `supabase/functions/chat-stream/index.ts` - Atualizado
3. ✅ `supabase/functions/chat/index.ts` - Atualizado
4. ✅ `supabase/functions/super-ai-tools/index.ts` - Atualizado
5. ✅ `supabase/functions/oauth-init/index.ts` - Atualizado

### **Mudanças Aplicadas:**

**ANTES:**
```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',  // ❌ Permite qualquer origem
}

if (req.method === 'OPTIONS') {
  return new Response('ok', { headers: corsHeaders })  // ❌ Retorna texto simples
}
```

**DEPOIS:**
```typescript
import { corsHeaders, handlePreflightRequest } from '../_utils/cors.ts'

// cors.ts usa:
const ALLOWED_ORIGIN = 'https://syncads-dun.vercel.app'  // ✅ Domínio específico

function handlePreflightRequest() {
  return new Response(null, {
    status: 200,  // ✅ 200 OK (não 204)
    headers: corsHeaders,
  })
}

if (req.method === 'OPTIONS') {
  return handlePreflightRequest()  // ✅ Retorna 200 OK
}
```

---

## 🔧 PASSO 1: Deploy no Supabase

### **Opção A: Via CLI (Recomendado)**

```bash
# 1. Fazer login no Supabase
npx supabase login

# 2. Linkar com o projeto
npx supabase link --project-ref ovskepqggmxlfckxqgbr

# 3. Deploy da função mais crítica (chat-stream)
npx supabase functions deploy chat-stream

# 4. Deploy das outras funções atualizadas
npx supabase functions deploy chat
npx supabase functions deploy super-ai-tools
npx supabase functions deploy oauth-init
```

### **Opção B: Via Dashboard**

1. Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
2. Vá em **Edge Functions**
3. Para cada função:
   - Clique em **Edit**
   - Cole o código atualizado
   - Clique em **Deploy**

---

## ⚙️ PASSO 2: Configurar CORS no Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
2. Vá em **Settings** > **API**
3. Role até **Allowed Origins**
4. Adicione:
   ```
   https://syncads-dun.vercel.app
   ```
5. Clique em **Save**

**IMPORTANTE:** Isso é NECESSÁRIO para que o CORS funcione completamente!

---

## 🧪 PASSO 3: Testar

### **1. Testar no Frontend (Produção)**

1. Abra: https://syncads-dun.vercel.app
2. Abra o Console do navegador (F12)
3. Faça login
4. Tente usar o chat
5. Verifique se NÃO há erros de CORS

### **2. Resultado Esperado no Console:**

**ANTES (com erro):**
```
❌ Access to fetch at 'https://ovskepqggmxlfckxqgbr.supabase.co/functions/v-'
from origin 'https://syncads-dun.vercel.app' has been blocked by CORS policy:
Response to preflight request doesn't pass access control check:
It does not have HTTP ok status.
```

**DEPOIS (funcionando):**
```
✅ Calling chat-stream: https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream
✅ Response status: 200
✅ Chat funciona normalmente
```

### **3. Verificar Logs no Supabase**

1. Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
2. Vá em **Logs** > **Edge Functions**
3. Clique em `chat-stream`
4. Verifique se aparece:
   ```
   ✅ CORS preflight OK
   === CHAT STREAM REQUEST START ===
   Response status: 200
   ```

---

## 🔍 VERIFICAÇÃO ADICIONAL

### **Teste Completo de CORS:**

Abra o Console do navegador e execute:

```javascript
// Testar OPTIONS (preflight)
fetch('https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream', {
  method: 'OPTIONS',
})
  .then(r => console.log('Preflight:', r.status)) // Deve ser 200
  .catch(e => console.error('Erro:', e))
```

**Resultado Esperado:**
```
Preflight: 200
```

**Se aparecer 204 ou erro:** A Edge Function ainda não foi atualizada.

---

## 📊 CHECKLIST DE DEPLOY

- [ ] Fazer deploy de `chat-stream`
- [ ] Fazer deploy de `chat`
- [ ] Fazer deploy de `super-ai-tools`
- [ ] Fazer deploy de `oauth-init`
- [ ] Adicionar domínio em Allowed Origins
- [ ] Testar no frontend
- [ ] Verificar logs no Supabase
- [ ] Confirmar que não há erros de CORS

---

## 🚨 PROBLEMAS COMUNS

### **1. Ainda aparece erro de CORS**

**Causa:** Deploy não foi feito corretamente  
**Solução:** Verificar logs no Supabase Dashboard

### **2. "Function not found"**

**Causa:** Nome da função está incorreto  
**Solução:** Verificar se o nome é exatamente `chat-stream`

### **3. Ainda usa wildcard `*`**

**Causa:** Função antiga ainda deployada  
**Solução:** Fazer deploy forçado:
```bash
npx supabase functions deploy chat-stream --no-verify-jwt
```

---

## ✅ RESULTADO FINAL ESPERADO

**No Console do Navegador:**
```
✅ Calling chat-stream: https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream
📝 Message: bom dia
💬 Conversation ID: xxx-xxx-xxx
📡 Response status: 200
✅ Chat funciona!
```

**No Supabase Logs:**
```
✅ CORS preflight OK
=== CHAT STREAM REQUEST START ===
Message: bom dia
ConversationId: xxx-xxx-xxx
Response status: 200
```

---

## 🎯 RESUMO

**O QUE FOI FEITO:**
- ✅ Código CORS centralizado
- ✅ Preflight retorna 200 OK
- ✅ Domínio específico configurado
- ✅ 4 funções principais atualizadas

**PRÓXIMO PASSO:**
- Deploy das funções corrigidas
- Configurar Allowed Origins no Dashboard
- Testar

**DEPOIS DO DEPLOY:**
- ✅ CORS funcionará corretamente
- ✅ Frontend poderá acessar Edge Functions
- ✅ Chat funcionará sem erros

