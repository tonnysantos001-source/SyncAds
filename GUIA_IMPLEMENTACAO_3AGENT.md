# 🚀 GUIA DE IMPLEMENTAÇÃO — ARQUITETURA 3-AGENT

**Data:** 2025-12-27  
**Objetivo:** Colocar a arquitetura 3-agent em produção  
**Tempo estimado:** 30-45 minutos  

---

## ✅ PRÉ-REQUISITOS

Antes de começar, você precisa de:

- [x] Acesso ao Supabase Project
- [x] Acesso ao GitHub (para commits)
- [x] GROQ API Key ativa
- [x] Hugging Face Playwright service rodando
- [x] Chrome Extension instalada (opcional)

---

## 📋 CHECKLIST DE IMPLEMENTAÇÃO

### FASE 1: Supabase Setup (10 min)

#### 1.1 Aplicar Migration SQL

1. Abra **Supabase Dashboard**
2. Vá em **SQL Editor**
3. Abra o arquivo:
   ```
   supabase/migrations/create_3agent_architecture_tables.sql
   ```
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. **IMPORTANTE:** Substitua `YOUR_GROQ_API_KEY_HERE` pela sua chave real Groq
7. Clique em **RUN**
8. Aguarde confirmação verde ✅

**Verificação:**
```sql
-- Execute isso para confirmar
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'action_logs',
  'action_results',
  'planner_outputs',
  'executor_outputs',
  'browser_sessions'
);
```

Deve retornar 5 linhas.

---

#### 1.2 Configurar Groq API Key (se não fez no SQL)

```sql
INSERT INTO public."GlobalAiConnection" (
  provider, apiKey, isActive, model, temperature, metadata
)
VALUES (
  'groq',
  'gsk_...', -- ⚠️ SUA CHAVE AQUI
  true,
  'llama-3.3-70b-versatile',
  0.7,
  jsonb_build_object(
    'planner_model', 'llama-3.3-70b-versatile',
    'executor_model', 'llama-3.3-70b-versatile',
    'planner_temperature', 0.3,
    'executor_temperature', 0.7
  )
)
ON CONFLICT (provider) DO UPDATE SET
  apiKey = EXCLUDED.apiKey,
  isActive = EXCLUDED.isActive;
```

---

#### 1.3 Deploy Supabase Functions

**No terminal:**

```powershell
# 1. Login no Supabase (se necessário)
cd C:\Users\dinho\Documents\GitHub\SyncAds
npx supabase login

# 2. Link ao projeto (se necessário)
npx supabase link --project-ref SEU_PROJECT_REF

# 3. Deploy action-router
npx supabase functions deploy action-router

# 4. Deploy chat-stream-v3
npx supabase functions deploy chat-stream-v3

# 5. Verificar
npx supabase functions list
```

Deve mostrar:
```
┌────────────────┬─────────┬────────┐
│ NAME           │ VERSION │ STATUS │
├────────────────┼─────────┼────────┤
│ action-router  │ 1       │ ACTIVE │
│ chat-stream-v3 │ 1       │ ACTIVE │
└────────────────┴─────────┴────────┘
```

---

### FASE 2: Testar Action Router Isoladamente (5 min)

#### 2.1 Teste Manual via cURL

```powershell
# Substituir SUPABASE_URL e SERVICE_ROLE_KEY
$url = "https://SEU_PROJECT.supabase.co/functions/v1/action-router"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # SERVICE_ROLE_KEY

$body = @{
  action = "BROWSER_NAVIGATE"
  params = @{
    url = "https://google.com"
  }
  context = @{
    userId = "test-user-123"
    sessionId = "test-session-123"
  }
} | ConvertTo-Json

Invoke-RestMethod -Uri $url `
  -Method POST `
  -Headers @{ Authorization = "Bearer $key"; "Content-Type" = "application/json" } `
  -Body $body
```

**Resultado esperado:**
```json
{
  "success": true,
  "action": "BROWSER_NAVIGATE",
  "executedAt": "2025-12-27T...",
  "executionTime": 2534,
  "result": {
    "url": "https://www.google.com/",
    "title": "Google"
  },
  "screenshot": "data:image/png;base64,...",
  "verification": {
    "method": "dom",
    "verified": true,
    "evidence": "Page title is 'Google'"
  },
  "logs": [...]
}
```

Se falhou:
1. Verifique se `HUGGINGFACE_PLAYWRIGHT_URL` está configurado nas env vars
2. Teste manualmente o Playwright service:
   ```powershell
   $hfUrl = "https://bigodetonton-syncads.hf.space/navigate"
   Invoke-RestMethod -Uri $hfUrl -Method POST `
     -Body '{"url":"https://google.com","sessionId":"test"}' `
     -ContentType "application/json"
   ```

---

#### 2.2 Verificar Logs no Supabase

```sql
-- Ver logs da execução
SELECT * FROM action_logs 
WHERE session_id = 'test-session-123'
ORDER BY created_at;

-- Ver resultado
SELECT * FROM action_results
WHERE session_id = 'test-session-123'
ORDER BY created_at DESC LIMIT 1;
```

Deve mostrar:
- `action_logs`: 3-5 linhas de log
- `action_results`: 1 linha com `success: true`

---

### FASE 3: Testar Chat Stream V3 Completo (10 min)

#### 3.1 Criar Conversa de Teste

No frontend ou via SQL:

```sql
-- Criar conversa
INSERT INTO public."Conversation" (
  id, userId, title, createdAt, updatedAt
)
VALUES (
  gen_random_uuid(),
  'SEU_USER_ID', -- ⚠️ Substituir
  'Teste Arquitetura 3-Agent',
  NOW(),
  NOW()
)
RETURNING id;
```

Copiar o ID retornado.

---

#### 3.2 Enviar Mensagem via API

```powershell
$chatUrl = "https://SEU_PROJECT.supabase.co/functions/v1/chat-stream-v3"
$userToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." # USER TOKEN

$body = @{
  message = "Abra o Google"
  conversationId = "UUID_DA_CONVERSA" # ⚠️ Substituir
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri $chatUrl `
  -Method POST `
  -Headers @{ 
    Authorization = "Bearer $userToken"
    "Content-Type" = "application/json"
  } `
  -Body $body

$response.content
```

**Resultado esperado:**
```
✅ **Google aberto com sucesso!**

📸 **Evidência confirmada:**
- Título da página: "Google"
- URL: https://www.google.com/
- Campo de busca detectado

🎯 **Próximo passo:** O que você gostaria de pesquisar?
```

---

#### 3.3 Verificar Dados Persistidos

```sql
-- 1. Ver plano gerado pelo Planner
SELECT 
  session_id,
  plan->>'goal' as goal,
  jsonb_array_length(plan->'actions') as num_actions,
  created_at
FROM planner_outputs
ORDER BY created_at DESC LIMIT 1;

-- 2. Ver resultados de ações
SELECT 
  action,
  success,
  verification->>'verified' as verified,
  verification->>'evidence' as evidence,
  execution_time
FROM action_results
ORDER BY created_at DESC LIMIT 3;

-- 3. Ver resposta do Executor
SELECT 
  executor_response,
  was_honest,
  created_at
FROM executor_outputs
ORDER BY created_at DESC LIMIT 1;

-- 4. Ver auditoria completa
SELECT * FROM execution_audit_trail
ORDER BY executed_at DESC LIMIT 1;
```

---

### FASE 4: Integração com Frontend (10 min)

#### 4.1 Atualizar Frontend para Usar chat-stream-v3

**Localização:** `src/lib/ai/chatService.ts` (ou similar)

```typescript
// ANTES
const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream`, {
  ...
});

// DEPOIS
const response = await fetch(`${SUPABASE_URL}/functions/v1/chat-stream-v3`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: userMessage,
    conversationId: conversationId
  })
});

const result = await response.json();

// ⭐ NOVO: result agora inclui metadata
console.log('Plan:', result.metadata.plan);
console.log('Action Results:', result.metadata.actionResults);

return result.content;
```

---

#### 4.2 Exibir Screenshots (Opcional)

Se quiser mostrar screenshots no chat:

```typescript
// No componente de mensagem
{message.metadata?.actionResults?.map((action: any, i: number) => (
  action.screenshot && (
    <img 
      key={i}
      src={action.screenshot}
      alt="Screenshot da ação"
      className="mt-2 rounded border"
    />
  )
))}
```

---

### FASE 5: Deploy e Verificação Final (5 min)

#### 5.1 Commit das Alterações

```powershell
cd C:\Users\dinho\Documents\GitHub\SyncAds

git add .

git commit -m "feat: Implementa arquitetura 3-agent obrigatória com Action Router

- Adiciona Action Router (callExtensionRouter) como núcleo único de automação
- Implementa Planner AI (IA de Raciocínio) com prompts estruturados
- Implementa Executor AI (IA Executora) com regras anti-alucinação
- Cria tabelas Supabase para logging e auditoria completa
- Adiciona verificação pós-ação (screenshots, DOM read-after-write)
- Garante que NENHUMA IA chama Playwright diretamente
- Documenta arquitetura completa em ARQUITETURA_3AGENT_OBRIGATORIA.md"

git push origin main
```

---

#### 5.2 Deploy Frontend

Se usar Vercel:

```powershell
# Vercel vai detectar mudanças e fazer deploy automaticamente

# Ou forçar deploy:
npx vercel --prod
```

---

#### 5.3 Teste End-to-End

1. Abra a aplicação web
2. Crie uma nova conversa
3. Envie: **"Abra o Google"**
4. Aguarde resposta (deve demorar 3-5s)
5. Verifique:
   - ✅ Resposta inclui "✅ Google aberto com sucesso!"
   - ✅ Resposta inclui evidências (título, URL)
   - ✅ Screenshot (se implementou no frontend)
   - ✅ Navegador realmente abriu o Google

**No Supabase SQL Editor:**
```sql
-- Verificar última execução
SELECT 
  user_message,
  action,
  success,
  verification,
  executor_response
FROM execution_audit_trail
ORDER BY executed_at DESC LIMIT 1;
```

Deve mostrar `success: true` e `verification.verified: true`.

---

## 🎯 TESTE FINAL — CRITÉRIO DE SUCESSO

Execute este teste completo:

1. **Input:** "Pesquise iPhone 15 no Google"
2. **Expectativa:**
   - Planner gera 3 actions (NAVIGATE, TYPE, CLICK)
   - Action Router executa cada uma COM verificação
   - Executor reporta:
     ```
     ✅ Busca realizada com sucesso!
     
     📸 Evidência confirmada:
     - Naveguei para Google
     - Digitei "iPhone 15"
     - Cliquei em "Pesquisa Google"
     - Página de resultados carregada
     
     🎯 Próximo passo: ...
     ```

3. **Verificação SQL:**
   ```sql
   SELECT 
     session_id,
     COUNT(*) FILTER (WHERE success) as successful_actions,
     COUNT(*) FILTER (WHERE NOT success) as failed_actions,
     COUNT(*) FILTER (WHERE verification->>'verified' = 'true') as verified_actions
   FROM action_results
   WHERE session_id = (
     SELECT session_id FROM planner_outputs ORDER BY created_at DESC LIMIT 1
   )
   GROUP BY session_id;
   ```
   
   Deve retornar:
   ```
   successful_actions: 3
   failed_actions: 0
   verified_actions: 3 (ou 2, dependendo de quais actions têm verificação)
   ```

---

## ❌ TROUBLESHOOTING

### Problema: "Groq API error: 401"

**Solução:**
```sql
-- Verificar chave
SELECT provider, substring(apiKey, 1, 10) || '...' as key_preview, isActive
FROM "GlobalAiConnection"
WHERE provider = 'groq';

-- Atualizar se necessário
UPDATE "GlobalAiConnection"
SET apiKey = 'gsk_SUA_CHAVE_AQUI'
WHERE provider = 'groq';
```

---

### Problema: "Action Router timeout"

**Causa:** Hugging Face Playwright service não responde

**Solução:**
1. Testar HF diretamente:
   ```powershell
   Invoke-RestMethod -Uri "https://bigodetonton-syncads.hf.space/health"
   ```
2. Se offline, reiniciar no Hugging Face Dashboard
3. Atualizar env var `HUGGINGFACE_PLAYWRIGHT_URL`

---

### Problema: "Planner retornou JSON inválido"

**Causa:** Prompt não foi carregado corretamente

**Solução:**
1. Verificar se arquivo existe:
   ```powershell
   Test-Path "supabase\functions\_prompts\PLANNER_SYSTEM_PROMPT.md"
   ```
2. Re-deploy função:
   ```powershell
   npx supabase functions deploy chat-stream-v3
   ```

---

### Problema: "Extension not responding"

**Causa:** Extension não está fazendo polling

**Solução:**
1. Verificar se Chrome Extension está instalada e ativa
2. Abrir DevTools da extensão (background.js)
3. Verificar logs de polling
4. Verificar se `extension_commands` table existe:
   ```sql
   SELECT * FROM extension_commands WHERE status = 'pending' LIMIT 5;
   ```

---

## 📊 DASHBOARD DE MONITORAMENTO

### Query: Taxa de Sucesso por Ação

```sql
SELECT 
  action,
  COUNT(*) as total_executions,
  SUM(CASE WHEN success THEN 1 ELSE 0 END) as successful,
  ROUND(AVG(CASE WHEN success THEN 1.0 ELSE 0.0 END) * 100, 2) as success_rate,
  ROUND(AVG(execution_time), 0) as avg_time_ms
FROM action_results
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY action
ORDER BY total_executions DESC;
```

---

### Query: Últimas Execuções com Contexto

```sql
SELECT 
  ea.executed_at,
  ea.user_id,
  ea.user_message,
  ea.action,
  ea.success,
  ea.verification->>'verified' as verified,
  SUBSTRING(ea.executor_response, 1, 100) || '...' as response_preview
FROM execution_audit_trail ea
ORDER BY ea.executed_at DESC
LIMIT 20;
```

---

### Query: Detecção de "Mentiras" do Executor

```sql
-- Casos onde action falhou MAS executor disse sucesso
SELECT 
  eo.session_id,
  ar.action,
  ar.success as action_success,
  eo.executor_response,
  CASE 
    WHEN ar.success = false AND eo.executor_response ILIKE '%sucesso%' THEN 'POSSÍVEL MENTIRA'
    WHEN ar.verification->>'verified' = 'false' AND eo.executor_response ILIKE '%confirmad%' THEN 'VERIFICAÇÃO IGNORADA'
    ELSE 'OK'
  END as honesty_check
FROM executor_outputs eo
JOIN action_results ar ON ar.session_id = eo.session_id
WHERE eo.created_at > NOW() - INTERVAL '24 hours'
  AND (
    (ar.success = false AND eo.executor_response ILIKE '%sucesso%')
    OR (ar.verification->>'verified' = 'false' AND eo.executor_response ILIKE '%confirmad%')
  );
```

---

## ✅ CHECKLIST FINAL

Antes de considerar a implementação completa:

- [ ] Migration SQL executada sem erros
- [ ] 5 tabelas novas criadas
- [ ] action-router function deployed e respondendo
- [ ] chat-stream-v3 function deployed e respondendo
- [ ] Teste "Abra o Google" funciona end-to-end
- [ ] Logs aparecem em `action_logs`
- [ ] Resultados aparecem em `action_results`
- [ ] Screenshots são capturados (se Playwright OK)
- [ ] Verificações retornam `verified: true` quando adequado
- [ ] Executor reporta evidências reais
- [ ] Frontend integrado (opcional)
- [ ] Commit feito no GitHub
- [ ] Código documentado em `ARQUITETURA_3AGENT_OBRIGATORIA.md`

---

## 🎉 CONCLUSÃO

Se todos os itens acima estão ✅, a arquitetura 3-agent está **COMPLETA E FUNCIONAL**.

O sistema agora:
- ✅ NÃO mente sobre execuções
- ✅ Verifica REAL que ações ocorreram
- ✅ Persiste evidências (screenshots, logs)
- ✅ Segue fluxo inquebrável: Planner → Router → Executor
- ✅ Auditável via `execution_audit_trail`

**Próximos passos:**
- Adicionar mais actions (SCROLL, WAIT, etc)
- Implementar GPT-4 Vision para verificação avançada
- Migrar polling → Supabase Realtime
- Dashboard de métricas no frontend

---

**FIM DO GUIA**  
**Sistema pronto para uso em produção! 🚀**
