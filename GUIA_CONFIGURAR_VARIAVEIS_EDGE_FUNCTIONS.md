# 🔧 GUIA: Configurar Variáveis de Ambiente para Edge Functions

## 📋 Visão Geral

As Edge Functions do Supabase precisam de variáveis de ambiente para funcionar corretamente. Elas NÃO usam o arquivo `.env` local - são configuradas diretamente no Supabase Dashboard.

---

## 🎯 Variáveis Necessárias

### **OBRIGATÓRIAS (já configuradas pelo Supabase):**
- ✅ `SUPABASE_URL` - Automática
- ✅ `SUPABASE_ANON_KEY` - Automática

### **OPCIONAIS (necessárias para funcionalidades avançadas):**
- ⚠️ `EXA_API_KEY` - Para pesquisa web inteligente (Exa AI)
- ⚠️ `TAVILY_API_KEY` - Para pesquisa web (Tavily)
- ⚠️ `SERPER_API_KEY` - Para pesquisa web (Serper)

---

## 📝 PASSO A PASSO

### **1. Acessar o Supabase Dashboard**

1. Abra: https://supabase.com/dashboard
2. Faça login com sua conta
3. Selecione o projeto: **ovskepqggmxlfckxqgbr**
4. No menu lateral esquerdo, clique em **"Edge Functions"**

### **2. Configurar Variáveis de Ambiente**

#### **Opção A: Para TODAS as Edge Functions (Recomendado)**

1. Na página de Edge Functions, clique em **"Manage"** ou **"Settings"**
2. Vá na aba **"Environment Variables"**
3. Adicione as variáveis:

```
SUPABASE_URL = https://ovskepqggmxlfckxqgbr.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

EXA_API_KEY = your_exa_api_key (opcional)
TAVILY_API_KEY = your_tavily_api_key (opcional)
SERPER_API_KEY = your_serper_api_key (opcional)
```

#### **Opção B: Para uma Edge Function específica**

1. Clique na Edge Function desejada (ex: `chat-stream`)
2. Vá em **"Settings"** ou **"Configure"**
3. Adicione as variáveis individuais

---

## 🔑 Como Obter API Keys (Opcional)

### **Exa AI (Busca Inteligente)**
1. Acesse: https://dashboard.exa.ai/
2. Crie uma conta ou faça login
3. Vá em "API Keys"
4. Copie a chave gerada

### **Tavily (Busca Web)**
1. Acesse: https://tavily.com/
2. Crie uma conta
3. Vá em "API Keys"
4. Copie a chave gerada

### **Serper (Busca Google)**
1. Acesse: https://serper.dev/
2. Crie uma conta
3. Vá em "Dashboard" > "API Keys"
4. Copie a chave gerada

---

## ✅ Verificar Se Está Funcionando

### **1. Testar Edge Function via Dashboard**

1. Vá em Edge Functions > Selecione `chat-stream`
2. Clique em "Invoke" ou "Test"
3. Use este payload:
```json
{
  "message": "Hello",
  "conversationId": "test-123",
  "conversationHistory": []
}
```
4. Verifique os logs para ver se as variáveis foram carregadas

### **2. Verificar Logs**

1. No dashboard, vá em **"Logs"** ou **"Invocations"**
2. Procure por logs que mostram:
```
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ EXA_API_KEY (se configurado)
❌ TAVILY_API_KEY (se não configurado)
```

### **3. Testar no Frontend**

1. Abra o app em `http://localhost:5173`
2. Faça login
3. Vá em "Chat"
4. Envie uma mensagem
5. Verifique se funciona sem erros

---

## 🚨 Problemas Comuns

### **Problema: "Environment variable not found"**

**Solução:**
- Certifique-se de que a variável foi adicionada no Dashboard
- Verifique o nome (case-sensitive)
- Faça um redeploy da Edge Function

### **Problema: "API key invalid"**

**Solução:**
- Verifique se copiou a chave completa
- Algumas keys têm expiração - gere uma nova
- Confirme que está usando o modo correto (sandbox vs production)

### **Problema: Edge Function não funciona**

**Solução:**
1. Vá em Logs e veja os erros
2. Verifique se todas as variáveis obrigatórias estão configuradas
3. Teste com uma versão simplificada da função

---

## 📊 Edge Functions que Precisam de API Keys

| Edge Function | Obrigatória | Opcional |
|---------------|------------|---------|
| `chat-stream` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | `EXA_API_KEY`, `TAVILY_API_KEY`, `SERPER_API_KEY` |
| `chat` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | - |
| `advanced-scraper` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | `EXA_API_KEY`, `TAVILY_API_KEY` |
| `super-ai-tools` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | `EXA_API_KEY` |
| `ai-tools` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | - |
| `generate-image` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | Provider-specific keys |
| `oauth-init` | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | OAuth client secrets |

---

## 🎯 Checklist Final

- [ ] Acessei o Supabase Dashboard
- [ ] Configurei `SUPABASE_URL` (já vem configurado)
- [ ] Configurei `SUPABASE_ANON_KEY` (já vem configurado)
- [ ] (Opcional) Adicionei `EXA_API_KEY`
- [ ] (Opcional) Adicionei `TAVILY_API_KEY`
- [ ] (Opcional) Adicionei `SERPER_API_KEY`
- [ ] Testei a Edge Function no dashboard
- [ ] Verifiquei os logs
- [ ] Testei no frontend

---

## 📞 Comandos Úteis

```bash
# Ver logs da Edge Function localmente
supabase functions logs chat-stream

# Deploy de uma Edge Function
supabase functions deploy chat-stream

# Ver variáveis de ambiente
supabase secrets list

# Adicionar variável de ambiente (local)
supabase secrets set EXA_API_KEY=your_key
```

---

## ✅ Conclusão

**Status Atual:**
- ✅ Variáveis obrigatórias já estão configuradas automaticamente
- ⚠️ Variáveis opcionais (EXA, TAVILY, SERPER) precisam ser adicionadas manualmente se quiser usar essas funcionalidades

**Próximo Passo:**
- Opcional: Adicionar API keys para pesquisa web avançada
- Testar o chat em produção

