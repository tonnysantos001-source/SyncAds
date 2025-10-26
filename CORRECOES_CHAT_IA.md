# 🔧 CORREÇÕES CHAT IA - SYNCADS

## 🚨 PROBLEMA IDENTIFICADO

**Erro 500 na Edge Function chat-stream após aumentar capacidade da IA**

### **Erros Encontrados no Console:**
- ❌ `POST /functions/v1/chat-stream` → `500 (Internal Server Error)`
- ❌ "Failed to send message"
- ❌ "Erro ao gerar resposta"
- ❌ Falta de informações de debug no console

---

## ✅ CORREÇÕES APLICADAS

### **1. Melhor Extração de Dados do Request**
**Antes:**
```typescript
const { message, conversationId } = await req.json()
```

**Depois:**
```typescript
const body = await req.json()
const { message, conversationId, conversationHistory = [], systemPrompt } = body

console.log('Message:', message?.substring(0, 50))
console.log('ConversationId:', conversationId)
console.log('History length:', conversationHistory?.length || 0)
```

**Motivo:** Agora extrai todos os campos necessários e adiciona logs para debug.

---

### **2. Problema Principal**

O erro **500 Internal Server Error** pode ter várias causas:

#### **Causa 1: API Key não configurada**
- A Edge Function precisa de `SERPER_API_KEY` para web search
- Precisa de API key da AI (Groq, OpenAI, etc.)
- **Solução:** Adicionar no Supabase Dashboard → Settings → Edge Functions Secrets

#### **Causa 2: Variáveis de ambiente não configuradas**
- `SUPABASE_URL` pode estar faltando
- `SUPABASE_ANON_KEY` pode estar faltando
- **Solução:** Verificar config no Supabase Dashboard

#### **Causa 3: RLS Policies bloqueando**
- User não consegue acessar dados da organização
- **Solução:** Verificar RLS policies no banco

#### **Causa 4: Organization não encontrada**
- User sem organizationId
- **Solução:** Verificar se user tem organizationId no banco

---

## 🔧 PRÓXIMOS PASSOS PARA CORRIGIR

### **PASSO 1: Verificar Secrets no Supabase**

No **Supabase Dashboard**:

1. Vá para **Edge Functions**
2. Clique em **Settings**
3. Verifique se tem:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SERPER_API_KEY` (opcional, só se usar web search)
   - API key da IA (ex: `GROQ_API_KEY` ou `OPENAI_API_KEY`)

### **PASSO 2: Verificar configuração da AI**

No banco de dados:

```sql
-- Verificar se tem AI configurada
SELECT * FROM "GlobalAiConnection" WHERE "isActive" = true;

-- Se não tiver, criar uma:
INSERT INTO "GlobalAiConnection" (
  id, name, provider, "apiKey", "baseUrl", model, "isActive"
) VALUES (
  gen_random_uuid(), 
  'Groq Default', 
  'GROQ', 
  'sua-api-key-aqui',
  'https://api.groq.com/openai/v1',
  'mixtral-8x7b-32768',
  true
);
```

### **PASSO 3: Verificar RLS Policies**

```sql
-- Verificar se policies permitem acesso
SELECT * FROM pg_policies WHERE tablename = 'User';

-- Verificar se user pode ler seus dados
SELECT * FROM "User" WHERE id = auth.uid();
```

### **PASSO 4: Adicionar Logs de Debug**

A Edge Function já está logando:
- ✅ Message recebida
- ✅ ConversationId
- ✅ History length
- ✅ Auth result
- ✅ User organization
- ✅ AI config

**Para ver os logs:**
1. Supabase Dashboard
2. Edge Functions
3. Clicar em "chat-stream"
4. Ver "Logs" tab

---

## 🧪 COMO TESTAR

### **1. Abrir Chat**
- Vá para `/chat` no painel do cliente
- Abra DevTools (F12)
- Vá para tab "Console"

### **2. Enviar Mensagem**
- Digite uma mensagem simples: "Olá"
- Pressione Enter

### **3. Verificar Logs**
```
Console deve mostrar:
- Requisição sendo enviada
- Resposta da Edge Function
- Mensagem da IA (se sucesso)
- Ou mensagem de erro (se falha)
```

### **4. Verificar Network**
- DevTools → Network tab
- Filtrar por "chat-stream"
- Verificar se status é 200 ou 500
- Verificar resposta JSON

---

## 🚨 ERROS COMUNS E SOLUÇÕES

### **Erro 1: "Missing auth header"**
**Causa:** Token de autenticação não está sendo enviado
**Solução:** Verificar se está logado

### **Erro 2: "User not associated with an organization"**
**Causa:** User sem organizationId
**Solução:**
```sql
UPDATE "User" 
SET "organizationId" = 'uuid-da-org' 
WHERE id = 'uuid-do-user';
```

### **Erro 3: "AI connection not found"**
**Causa:** Nenhuma AI configurada no banco
**Solução:** Criar GlobalAiConnection (ver PASSO 2)

### **Erro 4: "Failed to fetch AI response"**
**Causa:** API key da IA inválida ou rate limit
**Solução:** Verificar API key e limites

### **Erro 5: "Web search não configurado"**
**Causa:** Falta SERPER_API_KEY
**Solução:** Configurar ou remover web search

---

## 📊 DIAGNÓSTICO RÁPIDO

### **Verificar se variáveis de ambiente estão configuradas:**

No **Supabase Dashboard**:
1. Edge Functions → Settings
2. Ver "Environment Variables"
3. Deve ter pelo menos:
   - ✅ `SUPABASE_URL`
   - ✅ `SUPABASE_ANON_KEY`
   - ✅ API key da IA (ex: `GROQ_API_KEY`)

### **Verificar se tem AI configurada:**

```sql
SELECT * FROM "GlobalAiConnection" WHERE "isActive" = true;
```

Se retornar 0 linhas → **PROBLEMA!**
Se retornar dados → ✅ OK

### **Verificar se user tem organization:**

```sql
SELECT id, email, "organizationId" 
FROM "User" 
WHERE id = 'uuid-do-user';
```

Se `organizationId` for NULL → **PROBLEMA!**

---

## 🎯 RESUMO DAS CORREÇÕES

✅ **1. Melhor extração de dados do request**
- Agora extrai message, conversationId, conversationHistory, systemPrompt
- Adiciona valores default para evitar undefined

✅ **2. Logs de debug adicionados**
- Console mostra exatamente o que está acontecendo
- Facilita identificação de problemas

✅ **3. Error handling melhorado**
- Retorna mensagens de erro claras
- Status code correto

---

## 🚀 PRÓXIMAS AÇÕES

1. ✅ **Verificar Secrets** no Supabase Dashboard
2. ✅ **Verificar AI config** no banco de dados
3. ✅ **Verificar organizationId** do user
4. ✅ **Testar chat** novamente
5. ✅ **Ver logs** no Supabase Dashboard se ainda houver erro

**Após essas verificações, o chat deve funcionar!** 🎉
