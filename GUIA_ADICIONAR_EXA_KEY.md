# 🔑 PASSO A PASSO: ADICIONAR EXA_API_KEY

## ⚠️ IMPORTANTE: SECRET NÃO FOI ADICIONADA!

A IA ainda não consegue acessar a internet porque a **EXA_API_KEY não foi adicionada nas secrets do Supabase**.

---

## 📝 PASSO A PASSO (SUPABASE DASHBOARD)

### **1. Acesse o Dashboard:**
https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/settings/functions

### **2. Adicione a Secret:**

1. Vá em **Project Settings** > **Edge Functions**
2. Role até **"Secrets"**
3. Clique em **"Add new secret"**
4. Preencha:
   - **Name:** `EXA_API_KEY`
   - **Value:** `3ebc5beb-9f25-4fbe-82b9-2ee0b2904244`
5. Clique em **"Save"**

### **3. Redeploy das Funções (Opcional mas recomendado):**

Depois de adicionar a secret, faça:
```bash
npx supabase functions deploy chat-stream
```

Isso garante que a função tenha acesso à nova secret.

---

## ✅ DEPLOY REALIZADO

As funções **JÁ FORAM IMPLANTADAS**:
- ✅ `file-generator` - Gerador de arquivos
- ✅ `chat-stream` - Com Exa AI integrado
- ✅ `advanced-scraper` - Scraping avançado

**FALTA APENAS:**
- ❌ Adicionar `EXA_API_KEY` nas secrets do Supabase

---

## 🧪 COMO TESTAR

### **1. Adicione a Secret (passo acima)**

### **2. Teste a IA:**

```
Você: "baixe todos os produtos de https://www.santalolla.com.br/new-in"
```

### **3. Resultado Esperado:**

```
🤖 IA: 🔍 Iniciando scraping AVANÇADO...

✅ Fetching HTML
✅ Extracting products - 42 found
✅ Generating CSV
✅ Upload to storage

📊 Total de produtos: 42
📥 [Baixar produtos.csv]

💡 Preview:
1. Sandália X - R$ 89.90
2. Sandália Y - R$ 79.90
...
```

---

## 🐛 SE AINDA NÃO FUNCIONAR

### **1. Verifique as Secrets:**
- Dashboard > Settings > Edge Functions > Secrets
- Deve ter: `EXA_API_KEY`

### **2. Verifique os Logs:**
- Dashboard > Edge Functions > chat-stream > Logs
- Procure por erros

### **3. Teste manualmente:**
```bash
# Teste a função diretamente
curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "teste", "conversationId": "test"}'
```

---

## 🎯 RESUMO

**Status Atual:**
- ✅ Código implementado
- ✅ Funções deployadas
- ❌ Secret NÃO configurada ← **PRECISA FAZER ISSO!**

**Próximo Passo:**
1. Adicionar `EXA_API_KEY` no Supabase Dashboard
2. Testar com a IA
3. Ver se a IA consegue acessar a internet agora

---

## 💡 IMPORTANTE

A **Exa AI** e o **advanced-scraper** são **Edge Functions separadas**. A IA (chat-stream) é quem **chama** essas funções.

Fluxo:
```
Usuário → IA (chat-stream)
          ↓
      Detecta scraping
          ↓
    Chama advanced-scraper
          ↓
    Retorna resultado
          ↓
    IA exibe para usuário
```

**O problema atual:** A `EXA_API_KEY` está no código, mas não foi adicionada nas secrets do Supabase. As Edge Functions não conseguem acessar `Deno.env.get('EXA_API_KEY')` porque a variável não está configurada.

**Solução:** Adicionar a secret no Supabase Dashboard! ✅
