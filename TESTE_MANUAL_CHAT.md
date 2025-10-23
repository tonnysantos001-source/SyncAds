# 🧪 TESTE MANUAL DO CHAT - PASSO A PASSO

**Data:** 23/10/2025 15:25  
**Status:** ✅ Deploy concluído - Pronto para testar

---

## ✅ O QUE FOI CORRIGIDO

1. **Filtro de mensagens inválidas** - Chat não quebra mais com dados ruins
2. **Validação de roles** - Apenas user/assistant/system aceitos
3. **Deploy bem-sucedido** - Edge Function v16 no ar

---

## 🧪 COMO TESTAR (5 MINUTOS)

### **Passo 1: Abrir o Chat**

1. No seu navegador, acesse:
   ```
   http://localhost:5173/super-admin/chat
   ```

2. Ou se estiver logado como cliente:
   ```
   http://localhost:5173/chat
   ```

---

### **Passo 2: Enviar Mensagens de Teste**

Digite as seguintes mensagens e confirme que a IA responde:

#### **Teste 1: Mensagem Simples**
```
Olá! Você está funcionando?
```

**Esperado:** ✅ IA responde algo como "Sim, estou funcionando perfeitamente!"

---

#### **Teste 2: Pesquisa Web**
```
Pesquise sobre inteligência artificial
```

**Esperado:** ✅ IA faz busca no DuckDuckGo e resume os resultados

---

#### **Teste 3: Analytics**
```
Mostre estatísticas do sistema
```

**Esperado:** ✅ IA mostra métricas (produtos, pedidos, clientes, etc)

---

#### **Teste 4: Listar Campanhas**
```
Liste minhas campanhas
```

**Esperado:** ✅ IA lista campanhas cadastradas (ou avisa que não há)

---

### **Passo 3: Verificar Histórico**

1. Recarregue a página (F5)
2. Verifique se as mensagens anteriores aparecem
3. **Esperado:** ✅ Últimas 50 mensagens carregadas

---

### **Passo 4: Confirmar Visual**

Verifique se:
- ✅ Texto da IA está visível (preto/cinza escuro)
- ✅ Menu lateral está escuro
- ✅ Conteúdo está claro
- ✅ Sem flash de tema escuro ao carregar

---

## ✅ CHECKLIST DE SUCESSO

Marque cada item conforme testa:

- [ ] ✅ Chat abre normalmente
- [ ] ✅ IA responde mensagem simples
- [ ] ✅ Pesquisa web funciona
- [ ] ✅ Analytics funciona
- [ ] ✅ Histórico persiste após reload
- [ ] ✅ Visual correto (texto visível)
- [ ] ✅ Sem erros no console (F12)

---

## 🐛 SE DER ERRO

### **Erro: "No AI configured"**
**Solução:** Verificar se GROQ está configurada
```sql
SELECT * FROM "GlobalAiConnection" WHERE "isActive" = true;
```

### **Erro: Console mostra erro 500**
**Ação:**
1. Abra DevTools (F12)
2. Vá em Network
3. Clique na chamada `chat-stream`
4. Veja o erro detalhado
5. Me envie o print

### **Chat não responde (fica carregando)**
**Verificar:**
1. Internet funcionando?
2. Console do navegador (F12) mostra erro?
3. GROQ API Key válida?

---

## 🎯 APÓS O TESTE

### **Se TUDO funcionou:** ✅
```
✅ Chat 100% operacional!
✅ Pronto para continuar com Dia 2 (DALL-E)
✅ Progresso: 30% → 35%
```

**Me avise:** "Tudo funcionou! Vamos para o próximo passo!"

---

### **Se algo falhou:** ❌
```
❌ Problema encontrado
```

**Me envie:**
1. Print do erro (se houver)
2. Print do console (F12)
3. Qual teste falhou
4. Mensagem exata do erro

Vou corrigir em 5 minutos!

---

## 📊 PROGRESSO ATUAL

```
Dia 1: Chat Funcionando
├── [x] Visual padronizado
├── [x] Quotas implementadas
├── [x] GROQ configurada
├── [x] Deploy bem-sucedido
└── [ ] Teste manual OK ← VOCÊ ESTÁ AQUI
```

---

## 🚀 PRÓXIMOS PASSOS (Após sucesso)

**Dia 2: Geração de Imagens**
- [ ] Configurar DALL-E
- [ ] Primeira imagem gerada
- [ ] Gallery implementada

**Dia 3: Meta Ads**
- [ ] OAuth completo
- [ ] Primeira campanha criada
- [ ] Métricas funcionando

---

## 💡 DICAS

1. **Teste em ordem** - Começe pelo teste 1, depois 2, etc
2. **Aguarde resposta** - IA pode demorar 3-5 segundos
3. **Console aberto** - Mantenha F12 aberto para ver logs
4. **Anote erros** - Se der erro, anote a mensagem exata

---

## 🎉 RESULTADO ESPERADO

Após testar com sucesso, você verá:

```
✅ Chat respondendo normalmente
✅ Pesquisa web funcionando
✅ Ferramentas integradas
✅ Histórico persistindo
✅ Visual profissional
```

**Sistema 30% → 35% completo!**

---

# 🧪 COMECE O TESTE AGORA!

1. Abra: http://localhost:5173/super-admin/chat
2. Digite: "Olá! Você está funcionando?"
3. Aguarde resposta
4. ✅ Me confirme o resultado!

**Vamos lá! 🚀**
