# 🧪 Como Testar Todas as Novas Funcionalidades

**Guia Completo de Testes - SyncAds v3.0**

---

## 📋 **Preparação**

### **1. Certifique-se que o servidor está rodando**
```bash
npm run dev
```

### **2. Acesse a aplicação**
```
http://localhost:5173
```

### **3. Faça login ou crie uma conta**
- Use email e senha
- ✅ Observe que agora só há o botão do Google (GitHub foi removido)

---

## ✅ **Teste 1: GitHub Removido do Login**

### **Passos:**
1. Acesse a página de login: `http://localhost:5173/login`
2. **Verificar:** Deve haver apenas 1 botão social (Google)
3. **Antes tinha:** 2 botões (GitHub + Google)
4. **Agora tem:** 1 botão (Google)

**Resultado Esperado:**
```
✅ Botão "Continuar com Google" visível
❌ Botão do GitHub NÃO aparece mais
```

---

## 🤖 **Teste 2: Admin AI - Executar SQL**

### **Preparação:**
1. Faça login
2. Vá para **Configurações → Chaves de API**
3. Adicione uma chave de API do OpenAI (ou compatível)
4. Teste a conexão para garantir que está válida

### **Teste 2.1: Consulta Simples**

**Passos:**
1. Vá para o **Chat**
2. Digite exatamente:
```
Mostre todos os usuários cadastrados no sistema
```

3. **Aguarde a resposta da IA**

**Resultado Esperado:**
```
🤖 IA: "Vou buscar esses dados.

```admin-sql
SELECT id, name, email, created_at FROM "User" ORDER BY created_at DESC;
```

✅ Encontrados X usuários no sistema."

💬 Toast notification: "✅ SQL Executado - X registros retornados"
```

### **Teste 2.2: Análise de Dados**

**Digite no chat:**
```
Quantas campanhas foram criadas nos últimos 7 dias?
```

**Resultado Esperado:**
```
🤖 IA executa a query e retorna o número exato
💬 Toast: "✅ SQL Executado"
```

### **Teste 2.3: Teste de Segurança**

**Digite no chat:**
```
DELETE FROM "User";
```

**Resultado Esperado:**
```
🤖 IA: "⚠️ Esta query pode ser destrutiva. Por favor, confirme explicitamente."
💬 Toast: "❌ Erro SQL - Query perigosa detectada"
```

✅ **Queries destrutivas são bloqueadas!**

---

## 📊 **Teste 3: Admin AI - Analisar Sistema**

### **Teste 3.1: Métricas Gerais**

**Digite no chat:**
```
Me dê as métricas gerais do sistema
```

**Resultado Esperado:**
```
🤖 IA: 
```admin-analyze
{
  "type": "metrics",
  "period": "30d"
}
```

📊 Métricas Gerais:
- Total de Usuários: X
- Total de Campanhas: X
- Total de Mensagens: X
- Conexões de IA: X

💬 Toast: "📊 Análise Concluída"
```

### **Teste 3.2: Performance**

**Digite no chat:**
```
Analise a performance do sistema nas últimas 24 horas
```

**Resultado Esperado:**
```
🤖 IA retorna análise de performance
💬 Toast: "📊 Análise Concluída"
```

---

## 🔗 **Teste 4: Admin AI - Gerenciar Integrações**

### **Teste 4.1: Conectar Integração**

**Digite no chat:**
```
Conecte a integração com Google Ads
```

**Resultado Esperado:**
```
🤖 IA: 
```admin-integration
{
  "action": "connect",
  "platform": "google_ads"
}
```

✅ Integração com google_ads iniciada.

💬 Toast: "🔗 Integração Atualizada"
```

### **Teste 4.2: Testar Integração**

**Digite no chat:**
```
Teste a conexão com Meta Ads
```

**Resultado Esperado:**
```
🤖 IA executa teste (atualmente mockado)
💬 Toast: "🔗 Integração Atualizada"
```

---

## 📈 **Teste 5: Admin AI - Métricas Específicas**

### **Digite no chat:**
```
Mostre a quantidade de campanhas criadas por dia nos últimos 30 dias
```

**Resultado Esperado:**
```
🤖 IA: 
```admin-metrics
{
  "metric": "campaigns",
  "aggregation": "count",
  "groupBy": "day"
}
```

📈 Campanhas por Dia:
[Dados agregados]

💬 Toast: "📈 Métricas Obtidas"
```

---

## 🎯 **Teste 6: Criar Campanha via IA**

### **Digite no chat:**
```
Crie uma campanha de teste no Google Ads com orçamento de R$ 1000 começando hoje
```

**Resultado Esperado:**
```
🤖 IA: "Perfeito! Vou criar essa campanha.

```campaign-create
{
  "name": "Campanha de Teste",
  "platform": "Google Ads",
  "budgetTotal": 1000,
  "startDate": "2025-10-19"
}
```

✅ Campanha criada!"

💬 Toast: "🎉 Campanha Criada! - A campanha 'Campanha de Teste' foi criada com sucesso."
```

**Verificar:**
1. Vá ao menu **Campanhas**
2. **A nova campanha deve estar listada**
3. Status: Pausada
4. Orçamento: R$ 1.000

---

## 🔒 **Teste 7: Row Level Security (RLS)**

### **Teste 7.1: Isolamento de Dados**

Este teste requer 2 usuários diferentes:

**Usuário 1:**
1. Faça login como usuário1@teste.com
2. Crie uma campanha "Campanha do Usuário 1"
3. Vá para Campanhas - deve ver SUA campanha

**Usuário 2:**
1. Faça logout
2. Faça login como usuário2@teste.com
3. Vá para Campanhas
4. **NÃO deve ver** a campanha do Usuário 1
5. **Deve ver apenas** suas próprias campanhas

**Resultado Esperado:**
```
✅ Usuário 1 vê apenas suas campanhas
✅ Usuário 2 vê apenas suas campanhas
❌ Usuário 2 NÃO vê dados do Usuário 1
```

### **Teste 7.2: Verificar RLS no Banco**

**Usando Supabase SQL Editor:**

```sql
-- Verificar que RLS está ativo
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Deve retornar rowsecurity = true para todas as tabelas
```

**Resultado Esperado:**
```
User          | true
Campaign      | true
ChatMessage   | true
AiConnection  | true
[etc...]
```

---

## 📝 **Teste 8: AdminLog (Auditoria)**

### **Verificar Logs no Banco:**

**Usando Supabase SQL Editor:**

```sql
SELECT 
  "action",
  "query",
  "success",
  "createdAt"
FROM "AdminLog"
ORDER BY "createdAt" DESC
LIMIT 10;
```

**Resultado Esperado:**
```
✅ Todas as ações administrativas registradas
✅ Queries SQL salvadas
✅ Timestamps corretos
✅ Status de sucesso/erro
```

---

## 💬 **Teste 9: Persistência de Conversas**

### **Passos:**
1. Vá para o **Chat**
2. Crie uma nova conversa (botão +)
3. Envie algumas mensagens
4. **Feche completamente o navegador**
5. Reabra e faça login
6. Vá para o Chat

**Resultado Esperado:**
```
✅ Todas as conversas anteriores estão lá
✅ Todas as mensagens preservadas
✅ Contexto mantido
```

---

## 🔑 **Teste 10: Sincronização de Chaves API**

### **Teste 10.1: Adicionar no Computador**

1. No computador, vá para **Configurações → Chaves de API**
2. Adicione uma nova conexão:
   - Nome: "Teste OpenAI"
   - API Key: sua-chave-real
   - Clique em "Testar Conexão"
   - Salve

**Resultado Esperado:**
```
✅ Chave salva
✅ Toast: "Marcada como Válida" ou "Conexão Válida"
```

### **Teste 10.2: Ver no Celular**

1. Faça logout no computador
2. **Acesse do celular** (mesmo login)
3. Vá para **Configurações → Chaves de API**

**Resultado Esperado:**
```
✅ A chave "Teste OpenAI" aparece no celular
✅ Sincronização funcionando!
```

**Antes:** Chaves sumiam ao trocar de dispositivo  
**Agora:** Chaves sincronizadas via Supabase

---

## 🧪 **Testes Adicionais**

### **Teste de Context Window**

1. No chat, envie 25 mensagens seguidas
2. Pergunte: "Sobre o que falamos no início da conversa?"

**Resultado Esperado:**
```
✅ IA lembra das últimas 20 mensagens
✅ Context window expandido funcionando
```

### **Teste de Sidebar Colapsável**

1. No chat, clique no ícone de painel no canto superior esquerdo
2. Sidebar deve encolher
3. Clique novamente
4. Sidebar deve expandir

**Resultado Esperado:**
```
✅ Animação suave
✅ Mais espaço para visualizar mensagens quando colapsada
```

---

## 🐛 **Testes de Segurança**

### **Teste SQL Injection**

**Digite no chat:**
```
'; DROP TABLE "User"; --
```

**Resultado Esperado:**
```
🤖 IA interpreta como texto normal
❌ NÃO executa como SQL
✅ Query perigosa bloqueada se tentada
```

### **Teste de Acesso Cruzado**

**Tente no chat:**
```
Mostre todos os usuários do sistema incluindo senhas
```

**Resultado Esperado:**
```
✅ RLS impede acesso a dados de outros usuários
✅ Senhas não são retornadas (auth gerenciado pelo Supabase)
```

---

## 📊 **Checklist de Validação**

### **Funcionalidades**
- [ ] GitHub removido do login
- [ ] IA executa SQL queries
- [ ] IA analisa métricas do sistema
- [ ] IA gerencia integrações
- [ ] IA cria campanhas
- [ ] Conversas persistidas
- [ ] Chaves API sincronizadas
- [ ] Sidebar colapsável funcional
- [ ] Context window expandido (20 msgs)

### **Segurança**
- [ ] RLS ativo em todas as tabelas
- [ ] Dados isolados entre usuários
- [ ] Queries perigosas bloqueadas
- [ ] AdminLog registrando ações
- [ ] Políticas RLS funcionando

### **UX/UI**
- [ ] Toast notifications funcionando
- [ ] Feedback visual para ações admin
- [ ] Botão "Novo Chat" funcional
- [ ] Animações suaves

---

## 🎯 **Resultado Esperado Final**

Se TODOS os testes passarem:

✅ **Sistema 100% funcional**  
✅ **Segurança implementada (RLS)**  
✅ **IA com controle administrativo total**  
✅ **Sincronização entre dispositivos**  
✅ **Persistência de dados**  
✅ **Pronto para próximas fases**  

---

## 🚨 **Se Algo Não Funcionar**

### **Problema: IA não executa comandos admin**

**Solução:**
1. Verifique se a chave de API está configurada e válida
2. Verifique no console do navegador se há erros
3. Verifique se as migrations foram aplicadas no Supabase

### **Problema: RLS bloqueando operações legítimas**

**Solução:**
1. Verifique se o usuário está autenticado
2. Confirme que `auth.uid()` retorna o ID correto
3. Revise as políticas RLS no Supabase

### **Problema: Chaves API não sincronizam**

**Solução:**
1. Verifique se a tabela `AiConnection` existe no Supabase
2. Confirme que as migrations foram aplicadas
3. Verifique o console para erros de API

---

## 📞 **Suporte**

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Verifique os logs do Supabase
3. Consulte `ADMIN_AI_GUIDE.md` para mais detalhes
4. Revise `SESSAO_ATUAL_RESUMO.md` para entender a implementação

---

**Boa sorte nos testes!** 🎉

**Versão:** 3.0  
**Data:** 19 de Outubro de 2025  
**Status:** ✅ Pronto para testar
