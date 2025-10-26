# 🔧 SOLUÇÃO ROBUSTA E PROFISSIONAL - CORREÇÃO API KEY INVALIDA

## 🚨 PROBLEMA IDENTIFICADO

**Erro: "Invalid API Key"**

### **Causa Raiz:**
A API key configurada no banco de dados está **inválida, expirada ou incorreta**.

---

## ✅ SOLUÇÕES IMPLEMENTADAS

### **1. Validação Robusta de API Key**

**Antes:**
```typescript
// Não verificava se API key existia
const aiConfig = await supabase
  .from('GlobalAiConnection')
  .select('*')
  .eq('isActive', true)
```

**Depois:**
```typescript
// Verifica se API key existe e está configurada
const aiConfig = await supabase
  .from('GlobalAiConnection')
  .select('*')
  .eq('isActive', true)

console.log('AI Config - API Key length:', aiConfig.apiKey?.length || 0, 'Has key:', !!aiConfig.apiKey)

if (!aiConfig.apiKey) {
  console.error('No API key configured')
  throw new Error('API key não configurada. Configure uma API key válida nas configurações da IA.')
}
```

### **2. Error Handling Melhorado**

**Antes:**
```typescript
if (!response.ok) {
  const errorText = await response.text()
  throw new Error(`AI API Error: ${errorText}`)
}
```

**Depois:**
```typescript
if (!response.ok) {
  const errorText = await response.text()
  console.error('AI API Error Response:', errorText.substring(0, 500))
  
  // Tentar parsear erro como JSON
  try {
    const errorJson = JSON.parse(errorText)
    throw new Error(`Erro na API da IA: ${errorJson.error?.message || errorJson.message || 'Erro desconhecido'}`)
  } catch {
    throw new Error(`Erro na API da IA: ${errorText.substring(0, 200)}`)
  }
}
```

### **3. Logs Detalhados**

Agora a Edge Function registra:
- ✅ Provider e Model da IA
- ✅ Comprimento da API key
- ✅ URL da API sendo chamada
- ✅ Headers (com API key oculta)
- ✅ Erro detalhado se API key inválida

---

## 🛠️ COMO CORRIGIR A API KEY

### **OPÇÃO 1: Atualizar via Super Admin Panel**

1. Acesse `/super-admin/ai-connections`
2. Clique na IA configurada
3. Cole uma nova API key válida
4. Salve

### **OPÇÃO 2: Atualizar via SQL**

```sql
-- Ver API keys atuais (não mostra a key completa por segurança)
SELECT 
  id, 
  name, 
  provider, 
  model, 
  isActive,
  LEFT(apiKey, 10) || '...' as apiKeyPreview,
  LENGTH(apiKey) as keyLength
FROM "GlobalAiConnection"
WHERE isActive = true;

-- Atualizar API key
UPDATE "GlobalAiConnection"
SET apiKey = 'sua-nova-api-key-aqui'
WHERE id = 'uuid-da-ai';

-- Ou criar nova AI connection
INSERT INTO "GlobalAiConnection" (
  id, name, provider, "apiKey", "baseUrl", model, "isActive", "systemPrompt"
) VALUES (
  gen_random_uuid(),
  'Groq Production',
  'GROQ',
  'gsk_sua_chave_aqui',
  'https://api.groq.com/openai/v1',
  'llama3-70b-8192',
  true,
  'Você é um assistente útil e sarcástico.'
);
```

---

## 🎯 VERIFICAÇÃO RÁPIDA

### **1. Verificar se AI está configurada:**

```sql
SELECT * FROM "GlobalAiConnection" WHERE "isActive" = true;
```

**Se retornar 0 linhas:** → Criar uma AI connection

**Se retornar dados:** → Verificar se apiKey não é NULL

### **2. Verificar API Key válida:**

No **Supabase Dashboard**:
1. Edge Functions → chat-stream → Logs
2. Ver mensagem: "AI Config - API Key length: X"
3. Se X = 0: → API key não configurada
4. Se X > 0: → Verificar se key é válida testando diretamente

### **3. Testar API Key:**

```bash
# Exemplo para Groq
curl -X POST "https://api.groq.com/openai/v1/chat/completions" \
  -H "Authorization: Bearer gsk_sua_chave_aqui" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama3-70b-8192",
    "messages": [{"role": "user", "content": "teste"}]
  }'
```

**Se retornar erro:** → API key inválida/expirada
**Se retornar resposta:** → API key válida

---

## 🚀 PASSOS PARA RESOLVER

### **PASSO 1: Verificar API Key Atual**

No **Supabase SQL Editor**:
```sql
SELECT 
  id, 
  name, 
  provider, 
  LEFT(apiKey, 10) || '...' as keyPrefix,
  LENGTH(apiKey) as keyLength
FROM "GlobalAiConnection" 
WHERE isActive = true;
```

### **PASSO 2: Obter Nova API Key**

**Groq:**
1. Acesse https://console.groq.com/
2. Vá para API Keys
3. Crie uma nova key
4. Copie a key (formato: `gsk_...`)

**OpenAI:**
1. Acesse https://platform.openai.com/
2. Vá para API Keys
3. Crie uma nova key
4. Copie a key (formato: `sk-...`)

**OpenRouter:**
1. Acesse https://openrouter.ai/
2. Vá para Keys
3. Crie uma nova key
4. Copie a key (formato: `sk-or-v1-...`)

### **PASSO 3: Atualizar no Banco**

No **Supabase SQL Editor**:
```sql
UPDATE "GlobalAiConnection"
SET apiKey = 'nova-api-key-aqui'
WHERE id = 'uuid-da-ai-ativa';
```

### **PASSO 4: Testar Chat**

1. Abrir chat no painel cliente ou admin
2. Enviar mensagem
3. Verificar se funciona
4. Se ainda houver erro, ver logs no Supabase

---

## 📊 DIAGNÓSTICO AVANÇADO

### **Ver Logs Detalhados:**

No **Supabase Dashboard**:
1. Edge Functions → chat-stream → Logs
2. Buscar por:
   - "AI Config - API Key length:"
   - "AI Config - Provider:"
   - "Calling AI API:"
   - "AI API Error Response:"

### **Erros Comuns:**

#### **"API key não configurada"**
**Solução:** Verificar se GlobalAiConnection tem apiKey não NULL

#### **"Invalid API Key"**
**Solução:** API key está incorreta/expirada → Obter nova key

#### **"Model not found"**
**Solução:** Verificar se model existe para o provider

#### **"Rate limit exceeded"**
**Solução:** Aguardar ou aumentar limite da API

---

## ✅ RESUMO

### **Correções Aplicadas:**
- ✅ Validação de API key antes de usar
- ✅ Logs detalhados de debug
- ✅ Error handling robusto
- ✅ Mensagens de erro claras

### **Ação Necessária:**
🔴 **Obter nova API key válida**
🔴 **Atualizar no banco de dados**
🔴 **Testar chat novamente**

---

## 🎯 CHECKLIST FINAL

- [ ] Verificar se GlobalAiConnection existe
- [ ] Verificar se apiKey não é NULL
- [ ] Obter API key válida do provider
- [ ] Atualizar apiKey no banco
- [ ] Testar API key diretamente (curl)
- [ ] Testar chat no painel cliente
- [ ] Testar chat no painel admin
- [ ] Verificar logs se ainda houver erro

**Após completar este checklist, o chat deve funcionar perfeitamente!** 🎉
