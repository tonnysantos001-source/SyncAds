# 🎯 GUIA: CONFIGURAR APIs VISUALMENTE NO PAINEL ADMINISTRATIVO

## 📋 O QUE FAZER

Você **NÃO precisa** configurar APIs manualmente no Supabase Dashboard!

**Use a interface visual** que já existe em `/super-admin/ai-connections`:

---

## 🚀 PASSO A PASSO

### **1. Adicionar OpenAI para Imagens (DALL-E)**

1. Acesse o painel Super Admin
2. Vá em **"Conexões de IA Globais"**
3. Clique em **"+ Nova IA"**
4. Preencha:

```
Nome: OpenAI DALL-E
Provider: OpenAI
API Key: (sua chave OpenAI)
Modelo: dall-e-3
Base URL: https://api.openai.com/v1
Max Tokens: 4096
Temperature: 0.7
```

5. Clique em **"Criar IA"**

---

### **2. Adicionar Runway ML para Vídeos**

1. Na mesma página, clique em **"+ Nova IA"** novamente
2. Preencha:

```
Nome: Runway ML
Provider: ANTHROPIC (ou outro)
API Key: (sua chave Runway ML)
Modelo: gen3a
Base URL: https://api.runwayml.com/v1
Max Tokens: 4096
Temperature: 0.7
```

3. Clique em **"Criar IA"**

---

## 🔧 IMPORTANTE

**As Edge Functions já estão preparadas** para buscar as APIs da tabela `GlobalAiConnection`!

**NÃO configure via Supabase Dashboard → Secrets!**

**Use APENAS a interface visual** que já existe.

---

## ✅ O QUE JÁ ESTÁ PRONTO

- ✅ Interface visual de gerenciamento de IA
- ✅ Adicionar conexões via painel
- ✅ Testar conexões
- ✅ Ativar/desativar conexões
- ✅ Configurar prompts de sistema
- ✅ Edge Functions preparadas para ler da tabela

---

## 🎯 PRÓXIMO PASSO

Agora vou **ajustar as Edge Functions** para ler as APIs diretamente da tabela `GlobalAiConnection` em vez de usar `Deno.env.get()`.

Isso permitirá que você configure tudo pela interface visual!

