# 🚨 AÇÕES IMEDIATAS - EXECUTAR HOJE

**Data:** Janeiro 2025  
**Tempo:** 2-3 horas  
**Status:** 🔴 CRÍTICO

---

## ⚡ RESUMO DO PROBLEMA

```
❌ 81 de 83 pedidos estão PENDING (97.6%)
❌ Carrinhos abandonados sem recuperação automática
❌ Sistema não limpa pedidos antigos
```

## ✅ SOLUÇÃO

```
✅ Limpar pedidos pendentes automaticamente
✅ Criar jobs de automação
✅ Implementar recuperação de carrinhos
✅ Configurar sistema para produção
```

---

## 📋 CHECKLIST (marque conforme executa)

- [ ] 1. Backup do banco (5 min)
- [ ] 2. Executar SQL de limpeza (10 min)
- [ ] 3. Deploy Edge Functions (15 min)
- [ ] 4. Configurar CRON Jobs (10 min)
- [ ] 5. Testar sistema (20 min)
- [ ] 6. Monitorar (30 min)

---

## 1️⃣ BACKUP (5 minutos)

### Acesse:
```
https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
→ Database → Backups → Create Backup
Nome: "backup-limpeza-checkout-jan-2025"
```

---

## 2️⃣ EXECUTAR SQL (10 minutos)

### Passo 1: Abra SQL Editor
```
Dashboard → SQL Editor → New Query
```

### Passo 2: Cole este conteúdo
```
Arquivo: EXECUTAR_AGORA_LIMPEZA_CHECKOUT.sql
```

### Passo 3: Execute (Ctrl+Enter)

### Resultado Esperado:
```
✅ ~81 pedidos cancelados
✅ Transações atualizadas
✅ Métricas de clientes recalculadas
✅ Índices de performance criados
```

---

## 3️⃣ DEPLOY EDGE FUNCTIONS (15 minutos)

### Instalar Supabase CLI (se necessário)

**Windows:**
```powershell
choco install supabase
```

**Mac:**
```bash
brew install supabase/tap/supabase
```

### Login e Deploy
```bash
# Login
supabase login

# Ir para pasta do projeto
cd C:\Users\dinho\Documents\GitHub\SyncAds

# Link ao projeto
supabase link --project-ref ovskepqggmxlfckxqgbr

# Deploy função 1: Limpeza
supabase functions deploy cleanup-pending-orders

# Deploy função 2: Recuperação
supabase functions deploy recover-abandoned-carts

# Testar
supabase functions invoke cleanup-pending-orders
```

---

## 4️⃣ CONFIGURAR VARIÁVEIS (5 minutos)

### No Supabase Dashboard:
```
Settings → Edge Functions → Secrets
```

### Adicionar estas variáveis:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=https://seu-dominio.vercel.app
WEBHOOK_SECRET=seu_secret_aqui
```

### Obter RESEND_API_KEY:
1. Cadastre-se: https://resend.com
2. Adicione seu domínio
3. Gere API Key
4. Cole na variável

---

## 5️⃣ CONFIGURAR CRON (10 minutos)

### Opção A: SQL (Recomendado)

```sql
-- No SQL Editor, execute:

-- Habilitar pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Job de limpeza (30 min)
SELECT cron.schedule(
  'cleanup-pending-orders',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url:='https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/cleanup-pending-orders',
    headers:='{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);

-- Job de recuperação (1 hora)
SELECT cron.schedule(
  'recover-carts',
  '0 * * * *',
  $$
  SELECT net.http_post(
    url:='https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/recover-abandoned-carts',
    headers:='{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '"}'::jsonb
  );
  $$
);

-- Verificar
SELECT * FROM cron.job;
```

### Opção B: GitHub Actions (Alternativa)

Crie: `.github/workflows/cleanup-orders.yml`
```yaml
name: Cleanup Orders
on:
  schedule:
    - cron: '*/30 * * * *'
jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - run: |
          curl -X POST \
            https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/cleanup-pending-orders \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_KEY }}"
```

---

## 6️⃣ TESTAR (20 minutos)

### Teste 1: Função de Limpeza
```bash
# Executar manualmente
curl -X POST \
  https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/cleanup-pending-orders \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY"

# Ver resultado
# Deve retornar: { "cancelled": X, "errors": 0 }
```

### Teste 2: Função de Recuperação
```bash
curl -X POST \
  https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/recover-abandoned-carts \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY"

# Deve retornar: { "sent": X, "failed": 0 }
```

### Teste 3: Verificar Banco
```sql
-- Ver status dos pedidos
SELECT 
  "paymentStatus",
  COUNT(*) as total
FROM "Order"
GROUP BY "paymentStatus";

-- Esperado:
-- PAID: 2-5
-- CANCELLED: 80-85
-- PENDING: 0-2
```

---

## 7️⃣ MONITORAR (30 minutos)

### Ver Logs das Functions
```bash
# Terminal 1: Limpeza
supabase functions logs cleanup-pending-orders --tail

# Terminal 2: Recuperação
supabase functions logs recover-abandoned-carts --tail
```

### Queries de Monitoramento
```sql
-- Pedidos nas últimas 24h
SELECT 
  "paymentStatus",
  COUNT(*) as qtd,
  SUM(total) as valor
FROM "Order"
WHERE "createdAt" > NOW() - INTERVAL '24 hours'
GROUP BY "paymentStatus";

-- Carrinhos abandonados
SELECT COUNT(*) as total,
  COUNT(*) FILTER (WHERE "recoveryAttempts" > 0) as tentativas
FROM "AbandonedCart";
```

---

## ✅ VALIDAÇÃO FINAL

Execute estas queries para confirmar sucesso:

```sql
-- 1. Pedidos pendentes devem ser < 5
SELECT COUNT(*) as pending_orders
FROM "Order"
WHERE "paymentStatus" = 'PENDING';
-- Esperado: 0-5

-- 2. Verificar functions
SELECT * FROM cron.job;
-- Esperado: 2 jobs ativos

-- 3. Estatísticas
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE "paymentStatus" = 'PAID') as paid,
  COUNT(*) FILTER (WHERE "paymentStatus" = 'PENDING') as pending,
  COUNT(*) FILTER (WHERE "paymentStatus" = 'CANCELLED') as cancelled
FROM "Order";
```

---

## 🎯 RESULTADO ESPERADO

Após executar tudo:

```
✅ Banco limpo (< 5 pedidos pendentes)
✅ Jobs automáticos funcionando
✅ Edge Functions deployadas
✅ Recuperação de carrinhos ativa
✅ Sistema monitorado
```

---

## 🆘 PROBLEMAS COMUNS

### ❌ Erro "column cancelledAt does not exist"
**Solução:** Use o SQL atualizado (EXECUTAR_AGORA_LIMPEZA_CHECKOUT.sql)

### ❌ Edge Function não executa
**Solução:** 
```bash
# Ver logs
supabase functions logs cleanup-pending-orders

# Verificar variáveis
supabase secrets list
```

### ❌ CRON não está rodando
**Solução:**
```sql
-- Verificar jobs
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

### ❌ Email não envia
**Solução:**
- Verificar RESEND_API_KEY está correto
- Confirmar domínio verificado no Resend
- Ver logs: https://resend.com/logs

---

## 📞 PRÓXIMOS PASSOS

Após hoje:
- [ ] Dia 2: Remover dados mockados do frontend
- [ ] Dia 3: Dashboard com dados reais
- [ ] Dia 4: Automações de email
- [ ] Dia 5: Testes finais

---

## 📚 ARQUIVOS DE REFERÊNCIA

```
📄 AUDITORIA_CHECKOUT_FINAL_PRODUCAO.md
   └─ Análise completa

📄 COMANDOS_EXECUTAR_CHECKOUT_FINAL.md
   └─ Guia detalhado passo a passo

📄 EXECUTAR_AGORA_LIMPEZA_CHECKOUT.sql
   └─ Script SQL corrigido

📄 RESUMO_EXECUTIVO_CHECKOUT.md
   └─ Visão geral do projeto
```

---

## ⏱️ TIMELINE DE HOJE

```
09:00 - Backup (5 min)
09:05 - SQL Limpeza (10 min)
09:15 - Deploy Functions (15 min)
09:30 - Config CRON (10 min)
09:40 - Testes (20 min)
10:00 - Monitorar (30 min)
10:30 - ✅ CONCLUÍDO
```

---

**🚀 COMECE AGORA!**

**Primeiro comando:**
```bash
# Fazer backup
# Dashboard → Backups → Create
```

*Última atualização: Janeiro 2025*
*Status: 🟡 AGUARDANDO EXECUÇÃO*