# 🔍 COMO DEBUGAR O PROBLEMA

## 🎯 SITUAÇÃO ATUAL

- ✅ GROQ funcionando (testado)
- ✅ Edge Function retorna 200
- ❌ Mensagens aparecem vazias no frontend
- ❌ Mensagens não são salvas no banco

---

## 📋 PASSO A PASSO PARA DEBUG

### **Opção 1: Ver Logs do Supabase (Recomendado)**

1. **Acesse:** https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/logs/edge-functions

2. **Filtre por:** `chat-stream`

3. **Envie uma mensagem** no chat

4. **Clique** na requisição mais recente

5. **Procure por:**
   ```
   AI Response length: XXX
   Salvando mensagens no banco...
   Mensagens salvas: 2
   ```

6. **Me diga** o que aparece!

---

### **Opção 2: Ver Response no Browser**

1. **Abra o chat:** http://localhost:5173/super-admin/chat

2. **Abra DevTools:** Pressione **F12**

3. **Vá na aba** **Network**

4. **Envie uma mensagem:** "teste"

5. **Clique** na requisição `chat-stream`

6. **Vá na aba** **Response**

7. **Copie** o conteúdo e me envie

---

### **Opção 3: Teste SQL Direto**

Vou inserir uma mensagem manualmente para testar:

```sql
-- Ver conversas disponíveis
SELECT id, title, "userId" 
FROM "ChatConversation" 
WHERE "userId" = (SELECT id FROM "User" WHERE email = 'fatimadrivia@gmail.com')
LIMIT 5;

-- Inserir mensagem de teste
INSERT INTO "ChatMessage" (
  "conversationId",
  role,
  content,
  "userId"
) VALUES (
  'COLE_ID_DA_CONVERSA_AQUI',
  'user',
  'Mensagem de teste manual',
  (SELECT id FROM "User" WHERE email = 'fatimadrivia@gmail.com')
);
```

---

## 🔧 POSSÍVEIS CAUSAS

### 1. **RLS Policy Bloqueando**
As policies podem estar impedindo o INSERT.

**Teste:**
```sql
-- Ver policies ativas
SELECT * FROM pg_policies 
WHERE tablename = 'ChatMessage';

-- Temporariamente desabilitar (APENAS PARA TESTE)
ALTER TABLE "ChatMessage" DISABLE ROW LEVEL SECURITY;
```

### 2. **ConversationId Inválido**
A conversa pode não existir ou pertencer a outro usuário.

**Verificar:**
```sql
SELECT 
  cc.id,
  cc.title,
  cc."userId",
  u.email
FROM "ChatConversation" cc
INNER JOIN "User" u ON u.id = cc."userId"
ORDER BY cc."createdAt" DESC
LIMIT 10;
```

### 3. **Stream Não Está Sendo Processado**
O GROQ pode estar retornando formato diferente.

**Verificar logs** do Edge Function para ver:
- "AI Response length: 0" ← PROBLEMA
- "AI Response length: 150" ← OK

---

## 💡 SOLUÇÃO RÁPIDA (Se nada funcionar)

Vou criar um endpoint de teste simples que:
1. Chama GROQ
2. Salva no banco
3. Retorna sucesso

Mas **primeiro**, me envie os logs/response para eu ver o que está acontecendo!

---

**🚀 POR FAVOR, FAÇA O DEBUG E ME ENVIE O RESULTADO!**

Preciso ver os logs ou o response para identificar o problema exato.
