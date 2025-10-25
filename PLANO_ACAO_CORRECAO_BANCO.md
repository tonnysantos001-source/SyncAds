# 🎯 PLANO DE AÇÃO - CORREÇÃO DO BANCO DE DADOS

**Data:** 25/10/2025  
**Prioridade:** CRÍTICA  
**Tempo estimado:** 90 minutos  
**Objetivo:** Corrigir todos os problemas identificados na auditoria

---

## 📋 PRÉ-REQUISITOS

### Ferramentas Necessárias
```bash
# 1. Supabase CLI
npm install -g supabase

# 2. PostgreSQL client (psql)
# Windows: incluído no Supabase CLI
# Linux: sudo apt install postgresql-client
# Mac: brew install postgresql

# 3. Acesso ao projeto Supabase
supabase link --project-ref ovskepqggmxlfckxqgbr
```

### Backup Obrigatório
```bash
# Antes de aplicar qualquer migration, fazer backup
supabase db dump -f backup_antes_correcao_$(date +%Y%m%d_%H%M%S).sql

# Ou via dashboard Supabase:
# Settings > Database > Backups > Create Backup
```

---

## 🚀 EXECUÇÃO PASSO A PASSO

### PASSO 1: Verificação Inicial (5 min)

**Objetivo:** Confirmar estado atual do banco

```bash
# 1. Conectar ao banco
supabase db reset --linked

# 2. Executar script de verificação
psql $DATABASE_URL -f scripts/verify-database-health.sql > health_check_before.txt

# 3. Revisar output
cat health_check_before.txt | grep "❌"
```

**Checklist:**
- [ ] Script executado sem erros
- [ ] Problemas identificados salvos em arquivo
- [ ] Backup criado

---

### PASSO 2: Aplicar Migration de Correção (20 min)

**Objetivo:** Aplicar todas as correções consolidadas

```bash
# Opção A: Via Supabase CLI (RECOMENDADO)
supabase db push

# Opção B: Via SQL direto
psql $DATABASE_URL -f supabase/migrations/20251025000000_fix_critical_issues_complete.sql

# Opção C: Via Supabase Dashboard
# SQL Editor > New Query > Colar conteúdo da migration > Run
```

**Monitorar output:**
```
✅ Schema: systemPrompt, isActive, status
✅ Functions: is_service_role, search_path
✅ Índices: +10 índices de performance
✅ RLS: Policies consolidadas e otimizadas
✅ Triggers: updated_at em 10+ tabelas
✅ Storage: Bucket media-generations
```

**Se houver erro:**
```bash
# Reverter para backup
psql $DATABASE_URL -f backup_antes_correcao_XXXXXXXX.sql

# Analisar erro
# Corrigir migration
# Tentar novamente
```

**Checklist:**
- [ ] Migration executada sem erros
- [ ] Mensagem "MIGRATION COMPLETA COM SUCESSO!" exibida
- [ ] Estatísticas finais mostradas

---

### PASSO 3: Verificação Pós-Correção (5 min)

**Objetivo:** Confirmar que correções foram aplicadas

```bash
# Executar verificação novamente
psql $DATABASE_URL -f scripts/verify-database-health.sql > health_check_after.txt

# Comparar antes e depois
diff health_check_before.txt health_check_after.txt
```

**Verificações manuais:**

```sql
-- 1. Verificar systemPrompt existe
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'GlobalAiConnection' AND column_name = 'systemPrompt';
-- Esperado: 1 linha

-- 2. Verificar is_service_role existe
SELECT proname FROM pg_proc WHERE proname = 'is_service_role';
-- Esperado: 1 linha

-- 3. Verificar policies consolidadas
SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'Organization' AND policyname LIKE 'org_%';
-- Esperado: 0 (removidas)

SELECT COUNT(*) FROM pg_policies 
WHERE tablename = 'Organization' AND policyname = 'organization_select';
-- Esperado: 1

-- 4. Verificar índices criados
SELECT indexname FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname IN ('idx_campaign_userid', 'idx_chat_message_conversation_created');
-- Esperado: 2 linhas

-- 5. Verificar bucket storage
SELECT id FROM storage.buckets WHERE id = 'media-generations';
-- Esperado: 1 linha
```

**Checklist:**
- [ ] Todas verificações SQL retornaram valores esperados
- [ ] Nenhum "❌" no health_check_after.txt
- [ ] Diferença entre before/after mostra melhorias

---

### PASSO 4: Atualizar Edge Functions (15 min)

**Objetivo:** Corrigir bugs nas Edge Functions

#### 4.1: Corrigir chat-stream

Não precisa alterar nada - a migration adicionou as colunas que faltavam.

#### 4.2: Criar Environment Variables

```bash
# 1. Verificar secrets existentes
supabase secrets list

# 2. Adicionar OPENAI_API_KEY se não existir (para generate-image)
supabase secrets set OPENAI_API_KEY=sk-proj-...

# 3. Verificar outras secrets necessárias
# SERPER_API_KEY (web search) - já existe
# SUPABASE_URL - automático
# SUPABASE_ANON_KEY - automático
# SUPABASE_SERVICE_ROLE_KEY - automático
```

#### 4.3: Re-deploy Edge Functions

```bash
# Deploy chat-stream
supabase functions deploy chat-stream

# Deploy generate-image
supabase functions deploy generate-image

# Verificar logs
supabase functions logs chat-stream
supabase functions logs generate-image
```

**Checklist:**
- [ ] Edge functions deployadas sem erro
- [ ] Logs não mostram erros de schema
- [ ] Teste manual: enviar mensagem no chat

---

### PASSO 5: Testes de Integração (20 min)

**Objetivo:** Validar que tudo funciona end-to-end

#### 5.1: Teste de Autenticação
```bash
# No frontend (dev server)
npm run dev

# Fazer login como usuário normal
# Verificar: Dashboard carrega sem erros
```

#### 5.2: Teste de Chat
```bash
# 1. Abrir /chat
# 2. Enviar mensagem: "Olá"
# 3. Verificar resposta da IA
# 4. Enviar comando: "/stats"
# 5. Verificar estatísticas aparecem
# 6. Enviar: "buscar sobre marketing digital"
# 7. Verificar web search funciona
```

#### 5.3: Teste de Campanhas
```bash
# 1. Abrir /campaigns
# 2. Criar nova campanha
# 3. Verificar aparece na lista
# 4. No chat: "liste minhas campanhas"
# 5. Verificar campanha criada aparece
```

#### 5.4: Teste de Produtos
```bash
# 1. Abrir /products (se existir)
# 2. Criar produto teste
# 3. Verificar campo isActive funciona
# 4. Verificar campo status funciona
```

#### 5.5: Teste de Geração de Imagem (se OPENAI_API_KEY configurado)
```bash
# No chat: "gere uma imagem de um cachorro"
# Verificar:
# - Quota decrementada
# - Imagem salva em MediaGeneration
# - URL pública acessível
# - Imagem aparece no storage bucket
```

**Checklist:**
- [ ] Login funcionando
- [ ] Chat respondendo
- [ ] Comandos /stats, /campanhas funcionam
- [ ] Web search funcionando
- [ ] Campanhas CRUD funcionando
- [ ] Produtos com isActive/status OK
- [ ] (Opcional) Geração de imagem OK

---

### PASSO 6: Testes de Performance (10 min)

**Objetivo:** Verificar melhorias de performance

```sql
-- 1. Queries antes lentas agora rápidas
EXPLAIN ANALYZE
SELECT * FROM "Campaign" 
WHERE "organizationId" = 'UUID_DA_ORG' AND status = 'ACTIVE';
-- Deve usar idx_campaign_org_status

EXPLAIN ANALYZE
SELECT * FROM "ChatMessage" 
WHERE "conversationId" = 'UUID_CONVERSA'
ORDER BY "createdAt" DESC LIMIT 20;
-- Deve usar idx_chat_message_conversation_created

-- 2. Policies não duplicadas
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('Organization', 'RefreshToken', 'AiUsage')
ORDER BY tablename, policyname;
-- Não deve ter policies com nomes "..._all" e "..._select" juntas

-- 3. auth.uid() otimizado
EXPLAIN SELECT * FROM "User" WHERE id = auth.uid()::text;
-- Deve mostrar apenas 1 scan, não múltiplos
```

**Métricas esperadas:**
- Query time reduzido em 50-70%
- Número de policies por tabela: 1-4 (não 6-8)
- Scans de auth.uid(): 1 (não N)

**Checklist:**
- [ ] EXPLAIN ANALYZE mostra uso de índices
- [ ] Policies consolidadas (sem duplicatas)
- [ ] Query time melhorou

---

### PASSO 7: Monitoramento Contínuo (5 min)

**Objetivo:** Configurar alertas e monitoring

#### 7.1: Supabase Dashboard
```
1. Ir em Database > Logs
2. Habilitar "Log slow queries" (threshold: 1000ms)
3. Configurar alerta para erros críticos
```

#### 7.2: Query Performance
```sql
-- Salvar view para monitorar queries lentas
CREATE OR REPLACE VIEW slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
WHERE mean_time > 100 -- mais de 100ms
ORDER BY mean_time DESC
LIMIT 20;

-- Agendar review semanal
```

#### 7.3: Quota Monitoring
```sql
-- View para alertas de quota
CREATE OR REPLACE VIEW quota_alerts AS
SELECT 
  name,
  plan,
  ROUND(("aiMessagesUsed"::numeric / "aiMessagesQuota") * 100, 1) as msg_usage_pct,
  ROUND(("aiImagesUsed"::numeric / "aiImagesQuota") * 100, 1) as img_usage_pct,
  CASE 
    WHEN ("aiMessagesUsed"::numeric / "aiMessagesQuota") > 0.8 THEN '⚠️ ALERTA'
    WHEN ("aiMessagesUsed"::numeric / "aiMessagesQuota") > 0.9 THEN '🔴 CRÍTICO'
    ELSE '✅ OK'
  END as status
FROM "Organization"
WHERE "aiMessagesQuota" > 0;
```

**Checklist:**
- [ ] Logs habilitados no dashboard
- [ ] Views de monitoring criadas
- [ ] Alertas configurados (se aplicável)

---

## 📊 CHECKLIST FINAL

### Banco de Dados
- [ ] Migration 20251025000000 aplicada com sucesso
- [ ] Todas verificações do health_check passam
- [ ] Nenhum "❌" em verificações críticas
- [ ] Backup criado e validado

### Segurança
- [ ] Functions com search_path correto
- [ ] RLS policies consolidadas
- [ ] is_service_role() criada
- [ ] Storage policies criadas

### Performance
- [ ] 10+ índices adicionados
- [ ] auth.uid() otimizado em policies
- [ ] Queries usando índices corretamente
- [ ] Nenhuma policy duplicada

### Schema
- [ ] GlobalAiConnection.systemPrompt existe
- [ ] Product.isActive existe
- [ ] Product.status existe
- [ ] Triggers updated_at em todas tabelas

### Edge Functions
- [ ] chat-stream deployado e funcionando
- [ ] generate-image deployado e funcionando
- [ ] Logs sem erros de schema
- [ ] Testes manuais passando

### Frontend/Backend
- [ ] Login funcionando
- [ ] Chat funcionando
- [ ] Comandos funcionando
- [ ] CRUD de campanhas OK
- [ ] CRUD de produtos OK

---

## 🎉 RESULTADO ESPERADO

**Antes da correção:**
- ❌ 11 problemas críticos
- ⚠️ 8 problemas de performance
- 🟢 3 melhorias pendentes
- Status: 75% pronto

**Depois da correção:**
- ✅ 0 problemas críticos
- ✅ 0 problemas de performance
- ✅ 2 melhorias aplicadas
- Status: 100% pronto para produção

**Melhorias mensuráveis:**
- Query time: -50% a -70%
- Policies: -40% (consolidadas)
- Índices: +10 (performance)
- Vulnerabilidades: 0

---

## 🆘 TROUBLESHOOTING

### Erro: "relation does not exist"
```bash
# Verificar que todas migrations anteriores foram aplicadas
SELECT version FROM supabase_migrations.schema_migrations ORDER BY version;

# Se faltando alguma, aplicar em ordem:
supabase db push
```

### Erro: "policy already exists"
```sql
-- Remover policy manualmente
DROP POLICY IF EXISTS "nome_da_policy" ON "NomeDaTabela";

-- Reexecutar migration
```

### Erro: "function does not exist"
```sql
-- Verificar function existe
SELECT proname FROM pg_proc WHERE proname = 'nome_function';

-- Se não existe, criar manualmente (ver migration)
```

### Performance não melhorou
```sql
-- Forçar análise das tabelas
ANALYZE "Campaign";
ANALYZE "ChatMessage";
ANALYZE "User";

-- Verificar índices sendo usados
EXPLAIN ANALYZE SELECT ...;
```

### Edge Function com erro
```bash
# Ver logs detalhados
supabase functions logs chat-stream --tail

# Re-deploy
supabase functions deploy chat-stream --no-verify-jwt
```

---

## 📞 CONTATO E SUPORTE

**Documentação Criada:**
- ✅ AUDITORIA_BANCO_DADOS_25_10_2025.md (análise completa)
- ✅ 20251025000000_fix_critical_issues_complete.sql (migration)
- ✅ verify-database-health.sql (script de verificação)
- ✅ PLANO_ACAO_CORRECAO_BANCO.md (este arquivo)

**Tempo total estimado:** 90 minutos
**Prioridade:** CRÍTICA
**Status:** ⏳ Pronto para execução

---

**Última atualização:** 25/10/2025  
**Próxima revisão:** Após aplicação das correções
