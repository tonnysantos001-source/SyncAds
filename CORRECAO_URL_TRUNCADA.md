# 🚨 ERRO CORS - URL TRUNCADA `/functions/v-`

## ⚠️ PROBLEMA IDENTIFICADO

**Console mostra:**
```
Calling chat-stream: https://ovskepqggmxlfckxqgbr.supabase.co/functions/v-
```

**URL está truncada para `/functions/v-`** em vez de `/functions/v1/chat-stream`

**Isso significa que:**
- `import.meta.env.VITE_SUPABASE_URL` está retornando string vazia ou undefined
- A URL final fica incompleta
- Fetch falha com erro de CORS

---

## 🔧 CAUSA RAIZ

### **No desenvolvimento local (.env):**
```bash
VITE_SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
✅ Funciona corretamente
```

### **No Vercel (em produção):**
```bash
Variáveis de ambiente NÃO configuradas
❌ import.meta.env.VITE_SUPABASE_URL = undefined
❌ URL fica incompleta
❌ CORS falha
```

---

## ✅ SOLUÇÃO: ADICIONAR VARIÁVEIS NO VERCEL

### **Opção 1: Via Dashboard Vercel**
1. Acesse: https://vercel.com/dashboard
2. Selecione o projeto `syncads`
3. Vá em **Settings** > **Environment Variables**
4. Adicione:
   ```
   VITE_SUPABASE_URL = https://ovskepqggmxlfckxqgbr.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGci...
   ```
5. Clique **Save**
6. Faça **Redeploy**

### **Opção 2: Via CLI Vercel**
```bash
vercel env add VITE_SUPABASE_URL production
# Cole: https://ovskepqggmxlfckxqgbr.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Cole: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel --prod
```

---

## 🔍 VERIFICAR DEPLOYMENT

### **1. Código já está correto:**
```typescript
const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-stream`;
```

### **2. Problema é só falta de variáveis no Vercel**

### **3. Após adicionar:**
- Redeploy da aplicação
- Teste novamente
- URL ficará completa

---

## 📋 CHECKLIST

- [ ] Adicionar `VITE_SUPABASE_URL` no Vercel
- [ ] Adicionar `VITE_SUPABASE_ANON_KEY` no Vercel
- [ ] Fazer redeploy da aplicação
- [ ] Testar chat novamente
- [ ] Verificar URL completa no console

---

## 🎯 RESULTADO ESPERADO

**Antes:**
```
Calling chat-stream: ...supabase.co/functions/v-
❌ CORS Error
```

**Depois:**
```
Calling chat-stream: https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream
✅ Funciona!
```

---

## 💡 EXTRAS

Também adicione no Vercel (opcional):
```
VITE_META_CLIENT_ID=1907637243430460
VITE_FACEBOOK_CLIENT_ID=1907637243430460
```

**Após adicionar as variáveis e fazer redeploy, o erro será resolvido! 🚀**
