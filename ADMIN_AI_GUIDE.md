# 🤖 Admin AI - Guia Completo

**Sistema de IA Administrativa com Controle Total do SyncAds**

---

## 📋 **Visão Geral**

O Admin AI é um sistema revolucionário que transforma a IA em um **administrador supremo** do SyncAds, com capacidade de:

- ✅ Executar queries SQL diretamente no banco de dados
- ✅ Gerenciar todas as integrações com plataformas externas
- ✅ Analisar métricas e performance do sistema
- ✅ Debugar problemas e corrigir bugs
- ✅ Testar APIs e endpoints
- ✅ Adicionar novas funcionalidades via comandos
- ✅ Controlar todo o sistema via chat

**Status:** ✅ Implementado e Funcional

---

## 🎯 **Capacidades do Admin AI**

### **1. Executar SQL** 🗄️

Execute queries SQL diretamente no banco de dados PostgreSQL.

**Comando:**
```
Usuário: "Mostre todos os usuários cadastrados nos últimos 7 dias"
```

**IA Responde:**
```
Entendi! Vou buscar esses dados.

```admin-sql
SELECT id, name, email, created_at
FROM "User"
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

✅ Resultado: 42 usuários cadastrados nos últimos 7 dias.
```

**Casos de Uso:**
- Análise de dados
- Busca de informações específicas
- Correção de inconsistências
- Auditoria de dados
- Relatórios customizados

**Segurança:**
- ⚠️ Queries destrutivas requerem confirmação explícita
- ⚠️ DROP DATABASE/SCHEMA bloqueados
- ⚠️ Todas as ações são registradas em AdminLog

---

### **2. Analisar Sistema** 📊

Obtenha métricas detalhadas do sistema.

**Comando:**
```
Usuário: "Me dê as métricas gerais do sistema"
```

**IA Responde:**
```
Vou analisar as métricas gerais.

```admin-analyze
{
  "type": "metrics",
  "period": "30d"
}
```

📊 Métricas Gerais:
- Total de Usuários: 1,247
- Total de Campanhas: 3,892
- Total de Mensagens: 45,234
- Conexões de IA: 156
```

**Tipos de Análise:**
- `metrics` - Métricas gerais
- `performance` - Performance e tempo de resposta
- `usage` - Padrões de uso
- `errors` - Análise de erros

**Períodos:**
- `24h` - Últimas 24 horas
- `7d` - Últimos 7 dias
- `30d` - Últimos 30 dias

---

### **3. Gerenciar Integrações** 🔗

Controle todas as integrações com plataformas externas.

**Comando:**
```
Usuário: "Conecte a integração com Google Ads e teste a conexão"
```

**IA Responde:**
```
Vou conectar e testar o Google Ads.

```admin-integration
{
  "action": "connect",
  "platform": "google_ads"
}
```

✅ Integração iniciada. Agora vou testar:

```admin-integration
{
  "action": "test",
  "platform": "google_ads"
}
```

🔍 Testando conexão... Status: OK
```

**Ações Disponíveis:**
- `connect` - Conectar plataforma
- `test` - Testar conexão
- `disconnect` - Desconectar
- `debug` - Debugar problemas

**Plataformas Suportadas:**
- `google_ads` - Google Ads API
- `meta_ads` - Meta Marketing API (Facebook/Instagram)
- `linkedin_ads` - LinkedIn Ads API
- Mais plataformas sendo adicionadas...

---

### **4. Obter Métricas Específicas** 📈

Busque métricas detalhadas e agregadas.

**Comando:**
```
Usuário: "Mostre a quantidade de campanhas criadas por dia nos últimos 30 dias"
```

**IA Responde:**
```
Vou buscar essas métricas.

```admin-metrics
{
  "metric": "campaigns",
  "aggregation": "count",
  "groupBy": "day"
}
```

📈 Campanhas por Dia (últimos 30 dias):
- 19/10: 45 campanhas
- 18/10: 38 campanhas
- 17/10: 52 campanhas
...
```

**Métricas Disponíveis:**
- `users` - Usuários
- `campaigns` - Campanhas
- `messages` - Mensagens do chat
- `errors` - Erros do sistema

**Agregações:**
- `count` - Contagem
- `sum` - Soma
- `avg` - Média

**Agrupamento:**
- `day` - Por dia
- `week` - Por semana
- `month` - Por mês

---

### **5. Ver Logs do Sistema** 📋

Acesse logs para debugging e auditoria.

**Comando:**
```
Usuário: "Mostre os últimos erros do sistema"
```

**IA Responde:**
```
```admin-logs
{
  "service": "api",
  "level": "error",
  "limit": 50
}
```

📋 Últimos 50 erros:
[Implementação em desenvolvimento]
```

**Serviços:**
- `api` - API geral
- `auth` - Autenticação
- `campaigns` - Campanhas
- `chat` - Chat com IA

**Níveis:**
- `error` - Erros
- `warning` - Avisos
- `info` - Informações

---

### **6. Testar APIs Externas** 🧪

Teste endpoints de APIs externas.

**Comando:**
```
Usuário: "Teste a conexão com a API do Google Ads"
```

**IA Responde:**
```
```admin-test-api
{
  "service": "google_ads",
  "endpoint": "/v14/customers",
  "method": "GET"
}
```

🧪 Testando Google Ads API...
✅ Status: 200 OK
⏱️ Tempo de resposta: 342ms
```

---

### **7. Debug de Problemas** 🐛

Analise e resolva problemas reportados.

**Comando:**
```
Usuário: "Usuários relatam que campanhas não estão sendo criadas. Investigue."
```

**IA Responde:**
```
Vou investigar o problema de criação de campanhas.

```admin-debug
{
  "issue": "Campanhas não sendo criadas",
  "context": {
    "reports": 5,
    "last_occurrence": "2025-10-19"
  }
}
```

🐛 Análise do Problema:
1. Verificando tabela Campaign...
2. Verificando permissões...
3. Verificando logs de erro...

Possível causa identificada: [análise detalhada]
Sugestão de correção: [solução proposta]
```

---

## 🎨 **Exemplos Práticos**

### **Exemplo 1: Análise de Crescimento**

**Usuário:**
> "Quantos novos usuários tivemos por semana nos últimos 3 meses?"

**IA:**
```
Vou buscar esses dados de crescimento.

```admin-metrics
{
  "metric": "users",
  "aggregation": "count",
  "groupBy": "week"
}
```

📊 Crescimento de Usuários (últimos 3 meses):
- Semana 42: 127 novos usuários (+15%)
- Semana 41: 110 novos usuários (+8%)
- Semana 40: 102 novos usuários
...

📈 Tendência: Crescimento consistente de ~8-15% semana a semana
```

---

### **Exemplo 2: Correção de Dados**

**Usuário:**
> "Alguns usuários estão com plano NULL no banco. Corrija para FREE"

**IA:**
```
Entendi! Vou corrigir os planos NULL.

Primeiro, vou verificar quantos usuários estão afetados:

```admin-sql
SELECT COUNT(*) as affected_users
FROM "User"
WHERE plan IS NULL;
```

Encontrados: 23 usuários afetados.

Agora vou corrigi-los:

```admin-sql
UPDATE "User"
SET plan = 'FREE'
WHERE plan IS NULL;
```

✅ Correção aplicada! 23 usuários atualizados para plano FREE.
```

---

### **Exemplo 3: Análise de Performance**

**Usuário:**
> "O chat está lento. Analise a performance das últimas 24h"

**IA:**
```
Vou analisar a performance do chat.

```admin-analyze
{
  "type": "performance",
  "period": "24h"
}
```

⚡ Análise de Performance (24h):
- Tempo médio de resposta: 1.2s
- Total de requisições: 3,456
- Taxa de erro: 0.3%

```admin-sql
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_time,
  COUNT(*) as messages
FROM "ChatMessage"
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

📊 Performance por Hora:
- 09:00-10:00: 1.5s média (pico de uso)
- 08:00-09:00: 0.9s média
- 07:00-08:00: 0.7s média

💡 Recomendação: Considere escalar recursos durante o horário de pico (09:00-10:00)
```

---

## 🔒 **Segurança e Permissões**

### **Controle de Acesso**

Por padrão, apenas usuários com plano **ENTERPRISE** ou emails específicos têm acesso aos comandos administrativos.

**Verificação de Permissões:**
```typescript
async function isUserAdmin(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('User')
    .select('email, plan')
    .eq('id', userId)
    .single();

  return data.plan === 'ENTERPRISE' || data.email.includes('@admin');
}
```

### **Queries Bloqueadas**

Queries extremamente perigosas são bloqueadas automaticamente:
- `DROP DATABASE`
- `DROP SCHEMA`
- `TRUNCATE "User"`

### **Registro de Auditoria**

Todas as ações administrativas são registradas na tabela `AdminLog`:

```sql
CREATE TABLE "AdminLog" (
  "id" TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "query" TEXT,
  "result" JSONB,
  "success" BOOLEAN NOT NULL,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Visualizar Logs:**
```sql
SELECT * FROM "AdminLog" 
ORDER BY "createdAt" DESC 
LIMIT 100;
```

---

## 🎓 **Como Usar**

### **Para Usuários**

1. **Acesse o Chat**
2. **Digite comandos em linguagem natural**
3. **A IA detecta automaticamente comandos administrativos**
4. **Receba resultados formatados**

**Exemplo Simples:**
```
Usuário: "Me mostre as 10 campanhas mais recentes"

IA: [executa query] → [formata resultados] → [apresenta de forma clara]
```

### **Para Desenvolvedores**

**Adicionar Nova Capacidade:**

1. Criar novo parser em `adminTools.ts`:
```typescript
export function detectNewCommand(response: string): CommandData | null {
  const regex = /```admin-new-command\s*\n([\s\S]*?)```/;
  const match = response.match(regex);
  if (!match) return null;
  return JSON.parse(match[1].trim());
}
```

2. Adicionar no AdminTools class:
```typescript
async executeNewCommand(params: any): Promise<AdminToolResult> {
  // Implementação
}
```

3. Integrar no ChatPage:
```typescript
const newCommand = detectNewCommand(response);
if (newCommand) {
  await adminTools.executeNewCommand(newCommand);
}
```

---

## 📊 **Arquitetura**

```
┌─────────────┐
│   Usuário   │
└──────┬──────┘
       │ Chat Message
       ↓
┌─────────────────┐
│   ChatPage.tsx  │
│  (Frontend UI)  │
└──────┬──────────┘
       │ Sends to AI
       ↓
┌──────────────────┐
│  OpenAI API      │
│  (GPT-4/3.5)     │
└──────┬───────────┘
       │ Response with Admin Blocks
       ↓
┌──────────────────┐
│  Admin Parsers   │
│  detectAdminSQL  │
│  detectAdmin...  │
└──────┬───────────┘
       │ Parsed Command
       ↓
┌──────────────────┐
│   AdminTools     │
│   executeSQL     │
│   analyzeSystem  │
└──────┬───────────┘
       │ Database Query
       ↓
┌──────────────────┐
│    Supabase      │
│   PostgreSQL     │
└──────┬───────────┘
       │ Results
       ↓
┌──────────────────┐
│   AdminLog       │
│  (Audit Trail)   │
└──────────────────┘
```

---

## 🚀 **Próximas Melhorias**

### **Em Desenvolvimento**
- [ ] Sistema de logs completo
- [ ] Testes de API automatizados
- [ ] Dashboard de admin em tempo real
- [ ] Alertas automáticos

### **Planejado**
- [ ] Análise preditiva com ML
- [ ] Auto-healing (correção automática de problemas)
- [ ] Relatórios agendados
- [ ] Integração com Slack/Discord para notificações

---

## ⚠️ **Avisos Importantes**

### **Uso Responsável**
1. ✅ Sempre confirme ações destrutivas
2. ✅ Faça backup antes de alterações críticas
3. ✅ Teste em ambiente de desenvolvimento primeiro
4. ✅ Documente mudanças importantes

### **Limitações Atuais**
- ⚠️ Queries muito complexas podem ter timeout
- ⚠️ Logs de sistema em implementação
- ⚠️ Algumas APIs externas ainda mockadas

### **Segurança**
- 🔒 Implemente RLS antes de produção
- 🔒 Criptografe credenciais de APIs
- 🔒 Monitore logs de auditoria regularmente

---

## 📖 **Recursos Adicionais**

- [Supabase SQL Functions](https://supabase.com/docs/guides/database/functions)
- [PostgreSQL JSON Functions](https://www.postgresql.org/docs/current/functions-json.html)
- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)

---

## 🤝 **Contribuindo**

Para adicionar novas capacidades administrativas:

1. Fork o repositório
2. Crie um branch (`git checkout -b feature/new-admin-tool`)
3. Implemente a nova ferramenta em `adminTools.ts`
4. Adicione testes
5. Atualize este guia
6. Submeta um Pull Request

---

**Desenvolvido com ❤️ para dar à IA controle total do sistema**

**Versão:** 1.0  
**Data:** 19 de Outubro de 2025  
**Status:** ✅ Funcional
