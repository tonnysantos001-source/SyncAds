# 🔑 COMO ATUALIZAR A API KEY DO OPENROUTER

## 🚨 PROBLEMA ATUAL

A API Key configurada está retornando erro:
```
{"error":{"message":"User not found.","code":401}}
```

Isso significa: **chave inválida, expirada ou sem créditos**.

---

## ✅ SOLUÇÃO RÁPIDA

### **Passo 1: Obter Nova API Key**

#### Opção A: OpenRouter (Gratuito)
1. Acesse: **https://openrouter.ai/keys**
2. Faça login (ou crie conta)
3. Clique em **"Create Key"**
4. Dê um nome: `SyncAds Chat`
5. **Copie a chave** (começa com `sk-or-v1-...`)

#### Opção B: OpenAI Direto (Pago)
1. Acesse: **https://platform.openai.com/api-keys**
2. Crie nova chave
3. **Copie** (começa com `sk-...`)

---

### **Passo 2: Atualizar no Sistema**

#### Via Interface (Recomendado):
1. **Abra:** http://localhost:5173/super-admin/global-ai
2. **Clique** no botão ✏️ **Editar** da IA `openai/gpt-oss-20b:free`
3. **Cole a nova API Key** no campo "API Key"
4. **Clique** em "Salvar"
5. **Teste** a conexão

#### Via SQL (Alternativo):
Execute este SQL no console do Supabase:

```sql
UPDATE "GlobalAiConnection"
SET "apiKey" = 'SUA_NOVA_CHAVE_AQUI'
WHERE id = 'ebdb5442-3bd4-4c11-a9be-49c76b11d0b8';
```

Substitua `SUA_NOVA_CHAVE_AQUI` pela chave real.

---

### **Passo 3: Testar Novamente**

1. **Vá para:** http://localhost:5173/super-admin/chat
2. **Envie:** "Olá! Você está funcionando?"
3. **Deve funcionar** ✅

---

## 🔍 VERIFICAR SE FUNCIONOU

### No Console (F12):
Você deve ver:
```
✅ User data: {...}
✅ OrgAiConnection: true
✅ GlobalAI found: true
✅ AI Config - Provider: OPENROUTER
✅ Resposta da IA: "Olá! Sim, estou funcionando..."
```

---

## 💡 DICAS

### OpenRouter (Gratuito):
- ✅ **Gratuito** para modelos free
- ✅ Sem cartão de crédito
- ✅ Limite de requisições por dia
- 🔗 https://openrouter.ai/keys

### OpenAI (Pago):
- 💳 Requer cartão de crédito
- 💰 ~$0.002 por 1000 tokens (GPT-3.5)
- ⚡ Mais rápido e confiável
- 🔗 https://platform.openai.com/api-keys

---

## 🐛 SE AINDA DER ERRO

### Erro: "Invalid API Key"
**Solução:** Verifique se copiou a chave completa, sem espaços

### Erro: "Insufficient credits"
**Solução:** Adicione créditos na plataforma (OpenRouter ou OpenAI)

### Erro: "Rate limit exceeded"
**Solução:** Aguarde alguns minutos e tente novamente

---

**🚀 Após atualizar a chave, teste imediatamente!**
