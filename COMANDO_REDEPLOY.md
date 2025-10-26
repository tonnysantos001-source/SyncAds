# 🚀 FORÇAR REDEPLOY DO VERCEL - PASSO A PASSO

## ⚠️ IMPORTANTE

Você precisa fazer **Redeploy Manual** no Vercel porque:
1. ✅ Variáveis de ambiente já foram adicionadas
2. ❌ Mas o build antigo ainda está online
3. ❌ Build antigo não tem as variáveis

---

## 🎯 SOLUÇÃO: VIA DASHBOARD VERCEL

### **1. Acesse o Dashboard:**
https://vercel.com/dashboard/project/syncads

### **2. Vá na aba "Deployments":**
- Lista de deployments recentes

### **3. Encontre o último deployment (provavelmente commit "Force redeploy: Add environment variables to fix CORS")**
- Clique nos **"..."** (três pontos)
- Ou role até o mais recente

### **4. Clique "Redeploy":**
- Modal vai abrir
- **IMPORTANTE:** Desmarque "Use existing Build Cache"
- Clique "Redeploy"

### **5. Aguarde:**
- Build vai iniciar
- Vercel vai baixar as variáveis de ambiente
- Build vai usar as variáveis
- Deploy vai ser feito com URL correta

---

## 🔍 VERIFICAR SE FUNCIONOU

### **Após o deploy completar:**
1. Recarregue a página do chat
2. Abra o console (F12)
3. Envie uma mensagem
4. Verifique se aparece:

**✅ CORRETO:**
```
Calling chat-stream: https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream
Message: ola
Conversation ID: xxx
📡 Response status: 200
```

**❌ AINDA ERRADO:**
```
Calling chat-stream: ...supabase.co/functions/v_
❌ CORS Error
```

---

## 🐛 SE AINDA DER ERRO

### **1. Verificar se variáveis estão em PRODUCTION:**
No Vercel:
- Settings > Environment Variables
- Procure por `VITE_SUPABASE_URL`
- Verifique se está marcado para **Production** ✅

### **2. Verificar sintaxe:**
```
VITE_SUPABASE_URL=https://ovskepqggmxlfckxqgbr.supabase.co
```
- ✅ SEM espaços
- ✅ SEM aspas
- ✅ SEM vírgulas

### **3. Forçar rebuild completo:**
No Vercel:
- Settings > General
- Role até "Clearing Build Cache"
- Clique "Clear Build Cache"
- Faça novo redeploy

---

## 📝 CHECKLIST

- [ ] Variáveis adicionadas no Vercel (✅ já feito)
- [ ] Variáveis marcadas para PRODUCTION (verificar)
- [ ] Redeploy feito SEM cache (verificar)
- [ ] Build completado com sucesso (aguardar)
- [ ] Testar chat novamente (testar)

---

## 🎯 RESULTADO ESPERADO

Após o redeploy:
- ✅ URL completa aparece no console
- ✅ CORS não bloqueia mais
- ✅ Chat funciona normalmente
- ✅ Mensagens enviadas com sucesso

---

## 💡 DICA EXTRA

Se ainda não funcionar, adicione no Vercel também:
```
VITE_META_CLIENT_ID=1907637243430460
VITE_FACEBOOK_CLIENT_ID=1907637243430460
```

**Essas variáveis também são usadas pelo app e podem causar problemas futuros.**

---

## 🚀 AÇÃO AGORA

**Vá no Vercel e faça o redeploy AGORA:**
1. Dashboard
2. Deployments
3. Redeploy (SEM cache)
4. Aguarde
5. Teste

**Me avise quando completar o redeploy! 🎯**
