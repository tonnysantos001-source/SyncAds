# ⚡ Início Rápido - SyncAds v3.0

**Comece a usar em 5 minutos!**

---

## 🚀 **Iniciar o Projeto**

```bash
# 1. Instalar dependências (se ainda não fez)
npm install

# 2. Iniciar servidor de desenvolvimento
npm run dev

# 3. Acessar
http://localhost:5173
```

✅ **Pronto! O sistema está rodando.**

---

## 🔐 **Fazer Login**

1. Acesse `http://localhost:5173/login`
2. Use suas credenciais ou crie uma nova conta
3. ✅ Observe: **Apenas Google OAuth** disponível (GitHub foi removido)

---

## 🤖 **Testar o Admin AI**

### **Passo 1: Configurar Chave de IA**
1. Faça login
2. Vá em **Configurações → Chaves de API**
3. Clique em **"Adicionar Conexão"**
4. Preencha:
   - **Nome:** "OpenAI GPT-4"
   - **API Key:** Sua chave da OpenAI
   - **Base URL:** (deixe vazio para OpenAI)
   - **Modelo:** gpt-4 ou gpt-3.5-turbo
5. Clique em **"Testar Conexão"**
6. Se válida, clique em **"Salvar"**

### **Passo 2: Conversar com a IA Admin**
1. Vá para o menu **Chat**
2. Digite um comando administrativo:

```
Exemplos:

"Mostre todos os usuários cadastrados"
→ IA executa SQL e retorna resultado

"Analise as métricas do sistema"
→ IA busca e apresenta métricas

"Quantas campanhas foram criadas hoje?"
→ IA consulta banco e responde

"Crie uma campanha de teste com R$ 1000"
→ IA cria automaticamente
```

3. **Aguarde a resposta**
4. ✅ Você verá:
   - Resposta formatada da IA
   - Toast notification com status
   - Resultado da ação

---

## 🎯 **Criar Campanha via IA**

Digite no chat:
```
Crie uma campanha de Black Friday no Meta com orçamento de R$ 5000 começando hoje
```

**O que acontece:**
1. IA entende o comando
2. Cria a campanha no banco
3. Notifica você: "🎉 Campanha Criada!"
4. Vá em **Campanhas** → Verá a nova campanha

---

## 🔍 **Verificar RLS (Segurança)**

### **Teste Simples:**
1. Crie 2 contas diferentes
2. Cada conta cria uma campanha
3. Faça login na conta 1 → Veja apenas suas campanhas
4. Faça login na conta 2 → Veja apenas suas campanhas

✅ **Dados completamente isolados!**

---

## 📊 **Comandos Admin Úteis**

### **Análise de Dados:**
```
"Quantos usuários temos?"
"Mostre as últimas 10 campanhas"
"Analise o desempenho desta semana"
```

### **Métricas:**
```
"Me dê as métricas gerais do sistema"
"Quantas mensagens foram enviadas hoje?"
"Qual a performance do chat?"
```

### **Integrações:**
```
"Conecte o Google Ads"
"Teste a integração com Meta"
"Liste todas as integrações"
```

### **Correções:**
```
"Corrija usuários com plano NULL para FREE"
"Atualize campanhas pausadas antigas"
```

---

## 🧪 **Testar Funcionalidades**

### **1. Novo Chat**
- No chat, clique no botão **+** no canto superior direito
- Cria nova conversa

### **2. Sidebar Colapsável**
- Clique no ícone de painel no canto superior esquerdo
- Sidebar encolhe/expande

### **3. Persistência**
- Envie mensagens
- Feche o navegador
- Reabra → Mensagens ainda lá!

### **4. Sincronização**
- Adicione chave API no computador
- Acesse do celular (mesmo login)
- Chave aparece no celular também!

---

## 📚 **Documentação**

### **Leitura Rápida (10 min):**
- `README_V3.md` - Resumo executivo

### **Guias Completos (30 min):**
- `ADMIN_AI_GUIDE.md` - Como usar Admin AI
- `COMO_TESTAR.md` - Testar cada funcionalidade

### **Referência Completa (1h):**
- `SESSAO_ATUAL_RESUMO.md` - Detalhes de implementação
- `RESUMO_FINAL.md` - Comparativos e métricas
- `PROXIMOS_PASSOS.md` - Roadmap futuro

---

## 🔧 **Troubleshooting**

### **Problema: IA não responde**
✅ **Solução:**
1. Verifique se chave de API está configurada
2. Vá em Configurações → Chaves de API
3. Teste a conexão
4. Se inválida, adicione uma nova chave

### **Problema: Erro ao executar SQL**
✅ **Solução:**
1. Verifique se as migrations foram aplicadas no Supabase
2. Vá no Supabase SQL Editor
3. Execute: `SELECT * FROM "AdminLog" LIMIT 1;`
4. Se der erro, migrations não foram aplicadas

### **Problema: RLS bloqueando operações**
✅ **Solução:**
1. Certifique-se que está autenticado
2. Verifique se o userId está correto
3. Use o Supabase SQL Editor para debug

### **Problema: TypeScript errors**
✅ **Nota:**
- Erros relacionados a `execute_admin_query` são esperados
- A função foi criada manualmente via migration
- Funciona perfeitamente em runtime
- Ignorar warnings de TypeScript neste caso

---

## 🎯 **Próximos Passos**

Agora que tudo está funcionando:

1. **Explore o Admin AI** - Teste diferentes comandos
2. **Crie campanhas** - Via IA e manual
3. **Teste a segurança** - RLS com múltiplos usuários
4. **Leia a documentação** - Entenda tudo que foi implementado
5. **Prepare para Fase 2** - Integrações reais (Google Ads, Meta, LinkedIn)

---

## 📞 **Recursos Rápidos**

| Precisa de | Arquivo |
|------------|---------|
| Visão Geral | `README_V3.md` |
| Usar Admin AI | `ADMIN_AI_GUIDE.md` |
| Testar Tudo | `COMO_TESTAR.md` |
| Implementação | `SESSAO_ATUAL_RESUMO.md` |
| Comparativos | `RESUMO_FINAL.md` |
| Futuro | `PROXIMOS_PASSOS.md` |

---

## 🎊 **Parabéns!**

Você tem agora um sistema onde a **IA controla tudo via chat!**

**Digite no chat e veja a mágica acontecer:**
```
"Mostre as métricas do sistema"
"Crie uma campanha de teste"
"Analise os últimos 30 dias"
"Conecte todas as integrações"
```

---

**SyncAds v3.0 - O Futuro do Marketing com IA** 🚀  
**Status:** ✅ Pronto para usar!
