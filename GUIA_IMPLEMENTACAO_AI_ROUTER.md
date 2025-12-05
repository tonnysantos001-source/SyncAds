# 🚀 GUIA DE IMPLEMENTAÇÃO - AI ROUTER
## Sistema Inteligente de Roteamento entre Groq e Gemini

**Data:** 27/01/2025  
**Tempo Estimado:** 30-60 minutos  
**Dificuldade:** Média  
**Status:** Pronto para implementar

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Pré-requisitos](#pré-requisitos)
3. [Passo 1: Deploy da Edge Function](#passo-1-deploy-da-edge-function)
4. [Passo 2: Criar Tabela de Logs](#passo-2-criar-tabela-de-logs)
5. [Passo 3: Integrar com Chat](#passo-3-integrar-com-chat)
6. [Passo 4: Testar Sistema](#passo-4-testar-sistema)
7. [Passo 5: Verificar Logs](#passo-5-verificar-logs)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 VISÃO GERAL

### O Que Vamos Fazer

Implementar um sistema que **escolhe automaticamente** entre Groq e Gemini baseado no tipo de pergunta:

```
"Crie um banner" → GEMINI (única com geração de imagens)
"Como melhorar CTR?" → GROQ (mais rápido, gratuito)
"Analise esta imagem" → GEMINI (multimodal)
```

### Arquitetura

```
Usuário → Chat → AI Router → Groq/Gemini → Resposta
                      ↓
                 Log de uso
```

### Benefícios

- ✅ Aproveita capacidades específicas de cada IA
- ✅ Otimiza custos (prioriza IAs gratuitas)
- ✅ Melhora performance (Groq é 10x mais rápido)
- ✅ Métricas detalhadas de uso

---

## ✅ PRÉ-REQUISITOS

### 1. Verificar IAs Configuradas

Execute no **Supabase SQL Editor:**

```sql
SELECT 
  name,
  provider,
  model,
  "isActive",
  LEFT("apiKey", 20) as api_key_preview
FROM "GlobalAiConnection"
WHERE "isActive" = true
ORDER BY "createdAt" DESC;
```

**Esperado:** Ver Groq e/ou Gemini ativos

### 2. Verificar Supabase CLI

```bash
# Verificar se Supabase CLI está instalado
supabase --version

# Se não estiver instalado:
npm install -g supabase
```

### 3. Verificar Login

```bash
# Login no Supabase
supabase login

# Verificar projeto linkado
supabase status
```

---

## 🔧 PASSO 1: DEPLOY DA EDGE FUNCTION

### 1.1 - Verificar Arquivo

O arquivo `supabase/functions/ai-router/index.ts` já foi criado.

Verificar se existe:

```bash
ls -la supabase/functions/ai-router/index.ts
```

**Se não existir**, copie o código do arquivo que foi criado.

### 1.2 - Deploy no Supabase

```bash
cd SyncAds

# Deploy apenas o ai-router
supabase functions deploy ai-router

# OU deploy todas as functions (se preferir)
supabase functions deploy
```

**Saída esperada:**
```
Deploying ai-router...
✓ Deployed Function ai-router
```

### 1.3 - Verificar Deploy

```bash
# Listar functions deployadas
supabase functions list

# Ver logs
supabase functions serve ai-router
```

### 1.4 - Testar Função (cURL)

```bash
# Substituir ANON_KEY pela sua
curl -X POST https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/ai-router \
  -H "Authorization: Bearer SEU_ANON_KEY_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Crie um banner para Black Friday",
    "context": {}
  }'
```

**Resposta esperada:**
```json
{
  "selection": {
    "provider": "GEMINI",
    "model": "gemini-2.0-flash-exp",
    "reason": "Geração de imagem solicitada - Gemini é a única IA com essa capacidade",
    "confidence": 100
  },
  "analysis": {
    "needsImage": true,
    "needsMultimodal": false,
    "hasAttachment": false,
    "complexity": "low",
    "messageLength": 34
  }
}
```

---

## 📊 PASSO 2: CRIAR TABELA DE LOGS

### 2.1 - Executar SQL

Abra **Supabase Dashboard** → SQL Editor

Copie e execute TODO o conteúdo do arquivo:
```
APLICAR_AGORA_AI_ROUTER.sql
```

### 2.2 - Verificar Criação

Execute:

```sql
-- Verificar tabela
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'ai_usage_logs'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'ai_usage_logs';

-- Verificar views
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
AND viewname LIKE 'ai_%';
```

**Esperado:**
- Tabela `ai_usage_logs` criada ✅
- 7 índices criados ✅
- 3 views criadas ✅

---

## 🔗 PASSO 3: INTEGRAR COM CHAT

### 3.1 - Atualizar chat-enhanced

Editar: `supabase/functions/chat-enhanced/index.ts`

**ADICIONAR** após a linha que busca `GlobalAiConnection` (linha ~80):

```typescript
// ============================================
// AI ROUTER - SELEÇÃO INTELIGENTE
// ============================================

// Chamar AI Router para escolher a melhor IA
const routerResponse = await fetch(
  `${Deno.env.get("SUPABASE_URL")}/functions/v1/ai-router`,
  {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      conversationId,
      userId: user.id,
      context: {
        extensionActive: extensionConnected,
        attachments: [] // TODO: detectar anexos se houver
      }
    })
  }
);

let selectedProvider = 'GROQ'; // fallback
let selectedReason = 'Default';

if (routerResponse.ok) {
  const routerData = await routerResponse.json();
  selectedProvider = routerData.selection.provider;
  selectedReason = routerData.selection.reason;
  
  console.log('🤖 AI Router selecionou:', {
    provider: selectedProvider,
    reason: selectedReason
  });
}

// Buscar configuração da IA selecionada
const { data: selectedAI, error: selectedAIError } = await supabase
  .from("GlobalAiConnection")
  .select("*")
  .eq("provider", selectedProvider)
  .eq("isActive", true)
  .maybeSingle();

// Se não encontrar, usar a primeira ativa como fallback
const aiConnection = selectedAI || aiConnection; // aiConnection já existe no código
```

### 3.2 - Adicionar Logging

**ADICIONAR** após a chamada da IA (linha ~300, após receber resposta):

```typescript
// ============================================
// LOGGING DE USO
// ============================================

const startTime = Date.now();

// ... (código de chamada da IA aqui)

const endTime = Date.now();
const latencyMs = endTime - startTime;

// Salvar log de uso
try {
  await supabase.from('ai_usage_logs').insert({
    user_id: user.id,
    conversation_id: conversationId,
    provider: selectedProvider,
    model: aiConnection.model,
    selected_reason: selectedReason,
    prompt_tokens: usage?.prompt_tokens || 0,
    completion_tokens: usage?.completion_tokens || 0,
    latency_ms: latencyMs,
    success: true,
    message_length: message.length,
    complexity: message.length > 1000 ? 'high' : message.length > 300 ? 'medium' : 'low',
    needs_image: /crie|gere.*imagem/.test(message.toLowerCase()),
    needs_multimodal: false
  });
} catch (logError) {
  console.error('Erro ao salvar log:', logError);
  // Não falhar a requisição por causa de logging
}
```

### 3.3 - Re-deploy chat-enhanced

```bash
supabase functions deploy chat-enhanced
```

---

## 🧪 PASSO 4: TESTAR SISTEMA

### Teste 1: Geração de Imagem → Gemini

No chat do usuário, digite:
```
Crie um banner 1200x628 para Black Friday
```

**Verificar:**
- Resposta deve vir da IA
- Verificar logs da Edge Function: deve ter escolhido GEMINI

### Teste 2: Chat Simples → Groq

No chat, digite:
```
Como posso melhorar a taxa de clique dos meus anúncios?
```

**Verificar:**
- Resposta rápida (Groq é mais veloz)
- Logs devem mostrar GROQ

### Teste 3: Análise de Imagem → Gemini

No chat, digite:
```
Analise esta imagem e me diga o que tem nela
```

**Verificar:**
- Deve escolher GEMINI (multimodal)

### Teste 4: Verificar Logs

Execute no SQL Editor:

```sql
-- Ver últimos 10 logs
SELECT 
  created_at,
  provider,
  model,
  selected_reason,
  latency_ms,
  success,
  message_length
FROM ai_usage_logs
ORDER BY created_at DESC
LIMIT 10;
```

**Esperado:** Ver logs dos testes acima

---

## 📊 PASSO 5: VERIFICAR LOGS

### 5.1 - Dashboard de Estatísticas

Execute no SQL Editor:

```sql
-- Estatísticas gerais
SELECT 
  provider,
  COUNT(*) as total_requests,
  ROUND(AVG(latency_ms)) as avg_latency_ms,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY provider
ORDER BY total_requests DESC;
```

### 5.2 - Ver Custos

```sql
-- Resumo de custos (últimos 7 dias)
SELECT * FROM ai_cost_summary
WHERE date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY date DESC, daily_cost_usd DESC;
```

### 5.3 - Ver Performance

```sql
-- Performance por IA
SELECT * FROM ai_performance_summary
ORDER BY total_requests DESC;
```

---

## 🐛 TROUBLESHOOTING

### Erro: "Function not found"

**Causa:** Edge Function não deployada

**Solução:**
```bash
supabase functions deploy ai-router
supabase functions list
```

### Erro: "Unauthorized"

**Causa:** Falta Authorization header

**Solução:** Verificar se `authHeader` está sendo passado no fetch

### Erro: "Table does not exist"

**Causa:** SQL não foi executado

**Solução:** Executar `APLICAR_AGORA_AI_ROUTER.sql` no SQL Editor

### Sempre escolhe a mesma IA

**Causa:** AI Router não está sendo chamado

**Solução:** Verificar se o código de integração foi adicionado em `chat-enhanced`

### Logs não aparecem

**Causa:** Erro ao inserir no banco

**Solução:**
1. Verificar RLS da tabela
2. Verificar se service_role tem permissão
3. Ver logs de erro: `supabase functions logs chat-enhanced`

---

## ✅ CHECKLIST FINAL

- [ ] Edge Function `ai-router` deployada
- [ ] Tabela `ai_usage_logs` criada
- [ ] Índices criados
- [ ] Views criadas
- [ ] `chat-enhanced` integrada
- [ ] Teste 1: Geração imagem → Gemini ✓
- [ ] Teste 2: Chat simples → Groq ✓
- [ ] Teste 3: Multimodal → Gemini ✓
- [ ] Logs aparecendo no banco ✓
- [ ] Estatísticas funcionando ✓

---

## 📈 PRÓXIMOS PASSOS

Depois de tudo funcionando:

1. **Criar Dashboard de Métricas** (Semana 2)
   - Página em `src/pages/super-admin/AIMetricsPage.tsx`
   - Gráficos com Recharts
   - Filtros por data

2. **Integrar OmniBrain** (Semana 3)
   - Detectar tarefas complexas
   - Chamar Railway quando necessário
   - Combinar resultados

3. **Otimizações** (Semana 4)
   - Cache de respostas comuns
   - Rate limiting inteligente
   - Fallback automático

---

## 📞 SUPORTE

### Logs Úteis

```bash
# Ver logs do AI Router
supabase functions logs ai-router

# Ver logs do chat-enhanced
supabase functions logs chat-enhanced

# Ver logs em tempo real
supabase functions logs --tail
```

### Comandos de Diagnóstico

```sql
-- Verificar última chamada
SELECT * FROM ai_usage_logs 
ORDER BY created_at DESC 
LIMIT 1;

-- Ver erros recentes
SELECT created_at, provider, error_message
FROM ai_usage_logs
WHERE success = false
AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Resetar tudo (cuidado!)
-- TRUNCATE ai_usage_logs;
```

---

## 🎉 CONCLUSÃO

Após seguir este guia, você terá:

✅ Sistema inteligente escolhendo entre Groq e Gemini  
✅ Logs detalhados de uso  
✅ Métricas de performance e custo  
✅ Base para otimizações futuras  

**Tempo total:** ~30-60 minutos  
**Dificuldade:** Concluída ✅  
**Impacto:** 80% da melhoria do sistema de IA  

---

**🚀 COMECE AGORA PELO PASSO 1!**

Para dúvidas, consulte:
- `AUDITORIA_SISTEMA_IA_COMPLETA_REAL.md`
- `PLANO_IA_REVISADO_BASEADO_REALIDADE.md`
