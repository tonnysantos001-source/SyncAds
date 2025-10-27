# 🎯 COMO CONFIGURAR ALLOWED ORIGINS (Passo a Passo Visual)

## 📋 O QUE VOCÊ VAI FAZER

Adicionar o domínio `https://syncads-dun.vercel.app` nas configurações de CORS do Supabase para permitir que seu frontend acesse as Edge Functions.

---

## 🚀 PASSO A PASSO (COM IMAGENS)

### **PASSO 1: Acessar o Supabase Dashboard**

1. Abra seu navegador (Chrome, Edge, Firefox, etc.)
2. Acesse: https://supabase.com/dashboard
3. Faça login com sua conta (se ainda não estiver)

---

### **PASSO 2: Selecionar o Projeto**

1. Na lista de projetos, clique em **SyncAds** (ou o nome do seu projeto)
2. Se não aparecer, procure por: `ovskepqggmxlfckxqgbr`
3. Clique nele para abrir

---

### **PASSO 3: Ir para Settings (Configurações)**

1. No menu lateral ESQUERDO, procure por **"Settings"** (Configurações)
   - Ícone: ⚙️ (engrenagem)
   - Geralmente está no final do menu
2. Clique nele

---

### **PASSO 4: Ir para API**

1. Dentro de Settings, você verá várias opções:
   - General
   - Database
   - API ← **CLIQUE AQUI**
   - Auth
   - Storage
   - Edge Functions
   - etc.

2. Clique em **"API"**

---

### **PASSO 5: Configurar Allowed Origins**

1. Role a página para baixo até encontrar a seção **"Allowed Origins"**
   
2. Você verá um campo de texto parecido com isto:
   ```
   [____________] + Add URL
   ```

3. **Digite ou cole** nesta ordem:
   ```
   https://syncads-dun.vercel.app
   ```
   ⚠️ **ATENÇÃO:** Copie EXATAMENTE assim, com o `https://`

4. Clique no botão **"+ Add URL"** OU **"Enter"**

5. Clique em **"Save"** (Salvar) no final da página

---

### **PASSO 6: Configurar Redirect URLs (EXTRA - Importante!)**

⚠️ **IMPORTANTE:** Faça isso TAMBÉM para garantir que funciona 100%

1. Ainda em Settings, clique em **"Auth"**

2. Role até **"Redirect URLs"**

3. Adicione:
   ```
   https://syncads-dun.vercel.app/**
   ```
   (com os `**` no final)

4. Clique em **"Save"**

---

### **PASSO 7: Verificar**

1. Volte para **Settings** > **API**
2. Verifique se o domínio aparece na lista de **Allowed Origins**
3. Deve mostrar algo como:
   ```
   ✅ https://syncads-dun.vercel.app
   ```

---

## 🎯 LOCAL EXATO NO DASHBOARD

```
https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/settings/api
                                              ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
                                              ABRA ESTE LINK DIRETAMENTE!
```

---

## 📸 IMAGEM MENTAL DE COMO FICA

```
┌─────────────────────────────────────┐
│  Settings > API                     │
├─────────────────────────────────────┤
│                                     │
│  Project URL:                       │
│  https://ovs...supabase.co          │
│                                     │
│  Project API keys:                  │
│  [anon] [service_role]              │
│                                     │
│  Allowed Origins ← AQUI!           │
│  ┌───────────────────────────────┐ │
│  │ https://syncads-dun.vercel.app│ │ ← COLE AQUI
│  └───────────────────────────────┘ │
│         [+ Add URL]                │
│                                     │
│  [         Save         ]          │ ← CLIQUE AQUI
└─────────────────────────────────────┘
```

---

## ✅ CONFIRMAÇÃO

Quando estiver pronto, me diga:
- ✅ "Pronto! Adicionei o domínio"
- ⚠️ "Não encontrei a opção"
- ❌ "Erro ao salvar"

E eu te ajudo no próximo passo!

---

## 🔗 LINKS RÁPIDOS

- **Dashboard:** https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
- **API Settings:** https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/settings/api
- **Auth Settings:** https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/settings/auth

