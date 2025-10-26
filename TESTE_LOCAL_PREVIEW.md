# ✅ VERIFICAR BUILD LOCAL

## 🎯 TESTE LOCAL PRIMEIRO

**Agora você tem o preview rodando em:**
- http://localhost:4173/

**TESTE AGORA:**
1. Abra: http://localhost:4173/
2. Faça login
3. Vá no chat
4. Abra o console (F12)
5. Envie uma mensagem
6. Veja se a URL aparece **completa** no console

**O que procurar no console:**
```
✅ CORRETO:
Calling chat-stream: https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/chat-stream

❌ ERRADO:
Calling chat-stream: ...supabase.co/functions/v_
```

---

## 📊 SE ESTIVER CORRETO LOCALMENTE:

O build está OK. O problema é que o **Vercel ainda está usando o build antigo**.

**Solução:**
1. Deletar **TODOS os deployments antigos** no Vercel
2. Fazer upload do `dist/` atual
3. OU esperar algum tempo para Vercel reconhecer mudanças

---

## 📊 SE AINDA ESTIVER ERRADO LOCALMENTE:

O build precisa ser refeito com as variáveis corretas.

**Solução:**
1. Verificar se o código em `src/lib/api/chat.ts` está com URL hardcoded
2. Rebuild: `npm run build`
3. Testar novamente

---

## 🔍 ME DIGA O RESULTADO:

Teste em http://localhost:4173/ e me diga:
1. A URL aparece completa ou truncada no console?
2. O erro de CORS aparece ou não?
3. O chat funciona ou dá erro?

**Com essas informações, corrigo definitivamente!** 🎯
