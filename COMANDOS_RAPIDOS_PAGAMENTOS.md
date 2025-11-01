# ⚡ COMANDOS RÁPIDOS - SISTEMA DE PAGAMENTOS

## 🚀 DEPLOY RÁPIDO (Execute na ordem)

```bash
# 1. Aplicar migration
cd supabase
supabase db push

# 2. Deploy edge function
supabase functions deploy payment-retry-processor

# 3. Verificar status
supabase functions list
supabase status
```

---

## 🧪 TESTAR TUDO

```bash
# Executar script de teste
bash test-payment-system.sh

# Ou executar deploy completo
bash deploy-payment-system.sh
```

---

## 📊 CONSULTAS SQL ÚTEIS

### Ver métricas gerais
```sql
SELECT * FROM "CheckoutMetricsView";
```

### Ver performance por gateway
```sql
SELECT 
  "gatewayName",
  "totalTransactions",
  "totalRevenue",
  "successRate"
FROM "GatewayPerformanceView"
ORDER BY "totalRevenue" DESC;
```

### Ver alertas ativos
```sql
SELECT 
  "alertType",
  severity,
  title,
  message,
  "createdAt"
FROM "PaymentAlert"
WHERE status = 'active'
ORDER BY severity DESC;
```

### Ver fila de retry
```sql
SELECT 
  status,
  COUNT(*) as count,
  MIN("nextRetryAt") as next_retry
FROM "PaymentRetryQueue"
GROUP BY status;
```

### Ver gateways com problemas
```sql
SELECT * FROM "FailingGatewaysView"
ORDER BY "failureRate" DESC;
```

### Ver últimos eventos
```sql
SELECT 
  "eventType",
  severity,
  "errorMessage",
  "createdAt"
FROM "PaymentEvent"
ORDER BY "createdAt" DESC
LIMIT 20;
```

### Limpar eventos antigos (>90 dias)
```sql
DELETE FROM "PaymentEvent"
WHERE "createdAt" < NOW() - INTERVAL '90 days';
```

---

## 🔄 REFRESH MANUAL DE MÉTRICAS

```sql
-- Refresh todas as views
SELECT refresh_payment_metrics();

-- Refresh individual
REFRESH MATERIALIZED VIEW "CheckoutMetricsView";
REFRESH MATERIALIZED VIEW "GatewayPerformanceView";
REFRESH MATERIALIZED VIEW "FailingGatewaysView";
```

---

## 🎯 CONFIGURAR CRON JOBS

```sql
-- 1. Processar retry queue a cada 1 minuto
SELECT cron.schedule(
  'process-payment-retries',
  '*/1 * * * *',
  $$SELECT net.http_post(
      url:='https://SEU-PROJETO.supabase.co/functions/v1/payment-retry-processor',
      headers:='{"Authorization": "Bearer SEU_ANON_KEY"}'::jsonb
  );$$
);

-- 2. Refresh métricas a cada 5 minutos
SELECT cron.schedule(
  'refresh-payment-metrics',
  '*/5 * * * *',
  'SELECT refresh_payment_metrics()'
);

-- 3. Limpar cache expirado a cada hora
SELECT cron.schedule(
  'clean-expired-cache',
  '0 * * * *',
  'DELETE FROM "GatewayConfigCache" WHERE "expiresAt" < NOW()'
);

-- 4. Limpar eventos antigos diariamente
SELECT cron.schedule(
  'clean-old-events',
  '0 2 * * *',
  'DELETE FROM "PaymentEvent" WHERE "createdAt" < NOW() - INTERVAL ''90 days'''
);

-- 5. Cleanup retry queue
SELECT cron.schedule(
  'cleanup-retry-queue',
  '0 3 * * *',
  $$SELECT net.http_post(
      url:='https://SEU-PROJETO.supabase.co/functions/v1/payment-retry-processor?action=cleanup',
      headers:='{"Authorization": "Bearer SEU_ANON_KEY"}'::jsonb
  );$$
);

-- Ver cron jobs configurados
SELECT * FROM cron.job;

-- Remover um cron job
SELECT cron.unschedule('nome-do-job');
```

---

## 🌐 TESTAR EDGE FUNCTIONS

```bash
# Health check
curl 'https://SEU-PROJETO.supabase.co/functions/v1/payment-retry-processor?action=health'

# Processar fila manualmente
curl -X POST 'https://SEU-PROJETO.supabase.co/functions/v1/payment-retry-processor?action=process'

# Cleanup
curl -X POST 'https://SEU-PROJETO.supabase.co/functions/v1/payment-retry-processor?action=cleanup'

# Ver logs
supabase functions logs payment-retry-processor --tail

# Ver logs com filtro
supabase functions logs payment-retry-processor | grep ERROR
```

---

## 🔔 CONFIGURAR WEBHOOKS

### Stripe
```
URL: https://SEU-PROJETO.supabase.co/functions/v1/payment-webhook/stripe
Events: 
  - payment_intent.succeeded
  - payment_intent.payment_failed
  - charge.refunded
```

### Mercado Pago
```
URL: https://SEU-PROJETO.supabase.co/functions/v1/payment-webhook/mercado-pago
Topics:
  - payment
  - merchant_order
```

### Asaas
```
URL: https://SEU-PROJETO.supabase.co/functions/v1/payment-webhook/asaas
Events:
  - PAYMENT_RECEIVED
  - PAYMENT_CONFIRMED
  - PAYMENT_OVERDUE
  - PAYMENT_REFUNDED
```

---

## 🧪 CRIAR DADOS DE TESTE

```sql
-- Criar evento de teste
INSERT INTO "PaymentEvent" (
  "organizationId",
  "eventType",
  severity,
  "eventData"
)
SELECT
  id,
  'test_event',
  'info',
  '{"test": true}'::jsonb
FROM "Organization"
LIMIT 1;

-- Criar alerta de teste
SELECT create_payment_alert(
  'ORG-UUID'::uuid,
  NULL,
  'high_failure_rate',
  'warning',
  'Teste de Alerta',
  'Este é um alerta de teste',
  25.5,
  '{"threshold": 20}'::jsonb
);

-- Adicionar transação na fila de retry
SELECT enqueue_payment_retry(
  'TRANSACTION-UUID'::uuid,
  'ORG-UUID'::uuid,
  'Erro de teste',
  5
);
```

---

## 🔍 DEBUGGING

### Ver transações falhas recentes
```sql
SELECT 
  t.id,
  t."orderId",
  g.name as gateway,
  t.amount,
  t."failureReason",
  t."createdAt"
FROM "Transaction" t
JOIN "Gateway" g ON g.id = t."gatewayId"
WHERE t.status = 'FAILED'
ORDER BY t."createdAt" DESC
LIMIT 20;
```

### Ver tentativas de retry por transação
```sql
SELECT 
  r.*,
  t."orderId",
  t.amount,
  t.status as transaction_status
FROM "PaymentRetryQueue" r
JOIN "Transaction" t ON t.id = r."transactionId"
WHERE r."transactionId" = 'TRANSACTION-UUID'
ORDER BY r."retryCount" DESC;
```

### Ver eventos de uma transação específica
```sql
SELECT *
FROM "PaymentEvent"
WHERE "transactionId" = 'TRANSACTION-UUID'
ORDER BY "createdAt" DESC;
```

### Verificar cache
```sql
SELECT 
  gc.id,
  g.name as gateway,
  gc."expiresAt",
  gc."hitCount",
  gc."lastUsedAt"
FROM "GatewayConfigCache" gc
JOIN "Gateway" g ON g.id = gc."gatewayId"
ORDER BY gc."lastUsedAt" DESC;
```

---

## 📈 ANÁLISES

### Taxa de sucesso por gateway (últimos 7 dias)
```sql
SELECT 
  g.name,
  COUNT(*) as total,
  COUNT(CASE WHEN t.status = 'PAID' THEN 1 END) as paid,
  ROUND(COUNT(CASE WHEN t.status = 'PAID' THEN 1 END)::DECIMAL / COUNT(*) * 100, 2) as success_rate
FROM "Transaction" t
JOIN "Gateway" g ON g.id = t."gatewayId"
WHERE t."createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY g.name
ORDER BY success_rate DESC;
```

### Receita por método de pagamento
```sql
SELECT 
  "paymentMethod",
  COUNT(*) as transactions,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_ticket
FROM "Transaction"
WHERE status = 'PAID'
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY "paymentMethod"
ORDER BY total_revenue DESC;
```

### Performance horária (hoje)
```sql
SELECT 
  DATE_TRUNC('hour', "createdAt") as hour,
  COUNT(*) as total,
  COUNT(CASE WHEN status = 'PAID' THEN 1 END) as paid,
  SUM(amount) as revenue
FROM "Transaction"
WHERE "createdAt" >= CURRENT_DATE
GROUP BY hour
ORDER BY hour;
```

### Top 10 clientes por receita
```sql
SELECT 
  u.email,
  COUNT(DISTINCT t.id) as transactions,
  SUM(t.amount) as total_spent
FROM "Transaction" t
JOIN "User" u ON u.id = t."userId"
WHERE t.status = 'PAID'
GROUP BY u.id, u.email
ORDER BY total_spent DESC
LIMIT 10;
```

---

## 🛠️ MANUTENÇÃO

### Reprocessar transação específica
```sql
-- Adicionar na fila de retry com alta prioridade
SELECT enqueue_payment_retry(
  'TRANSACTION-UUID'::uuid,
  'ORG-UUID'::uuid,
  'Reprocessamento manual',
  1  -- Alta prioridade
);
```

### Limpar fila de retry
```sql
-- Cancelar todos pendentes
UPDATE "PaymentRetryQueue"
SET status = 'cancelled'
WHERE status = 'pending';

-- Remover completados
DELETE FROM "PaymentRetryQueue"
WHERE status IN ('success', 'cancelled')
  AND "updatedAt" < NOW() - INTERVAL '7 days';
```

### Reconhecer alerta
```sql
UPDATE "PaymentAlert"
SET 
  status = 'acknowledged',
  "acknowledgedBy" = 'USER-UUID'::uuid,
  "acknowledgedAt" = NOW()
WHERE id = 'ALERT-UUID';
```

### Resolver alerta
```sql
UPDATE "PaymentAlert"
SET 
  status = 'resolved',
  "resolvedAt" = NOW()
WHERE id = 'ALERT-UUID';
```

### Invalidar cache de gateway
```sql
DELETE FROM "GatewayConfigCache"
WHERE "gatewayId" = 'GATEWAY-UUID';
```

---

## 📱 ACESSAR DASHBOARD

1. Abra o navegador
2. Faça login no sistema
3. Navegue para: **Relatórios > Visão Geral**
4. Visualize todas as métricas em tempo real

---

## 🆘 TROUBLESHOOTING

### Problema: Métricas não atualizam
```sql
-- Forçar refresh
SELECT refresh_payment_metrics();

-- Verificar última atualização
SELECT "calculatedAt" FROM "CheckoutMetricsView" LIMIT 1;
```

### Problema: Retry não processa
```bash
# Ver logs
supabase functions logs payment-retry-processor --tail

# Health check
curl 'https://SEU-PROJETO.supabase.co/functions/v1/payment-retry-processor?action=health'

# Processar manualmente
curl -X POST 'https://SEU-PROJETO.supabase.co/functions/v1/payment-retry-processor?action=process'
```

### Problema: Webhook não recebe
```sql
-- Ver últimos eventos recebidos
SELECT 
  "eventType",
  "httpMethod",
  "httpStatus",
  "createdAt"
FROM "PaymentEvent"
WHERE "httpMethod" IS NOT NULL
ORDER BY "createdAt" DESC
LIMIT 10;
```

### Problema: Gateway com muitas falhas
```sql
-- Ver detalhes das falhas
SELECT 
  "failureReason",
  COUNT(*) as occurrences
FROM "Transaction"
WHERE "gatewayId" = 'GATEWAY-UUID'
  AND status = 'FAILED'
  AND "createdAt" >= NOW() - INTERVAL '7 days'
GROUP BY "failureReason"
ORDER BY occurrences DESC;
```

---

## 📚 DOCUMENTAÇÃO COMPLETA

Para informações detalhadas, consulte:
- `AUDITORIA_PAGAMENTOS_STATUS.md` - Status completo da implementação
- `supabase/migrations/20250130000000_payment_events_system.sql` - Schema do banco
- `src/lib/api/paymentMetricsApi.ts` - API TypeScript
- `supabase/functions/payment-retry-processor/index.ts` - Edge Function

---

## ✅ CHECKLIST PRÉ-PRODUÇÃO

- [ ] Migration aplicada (`supabase db push`)
- [ ] Edge functions deployadas (`supabase functions deploy`)
- [ ] Cron jobs configurados
- [ ] Webhooks configurados nos 3 gateways prioritários
- [ ] Credenciais de produção adicionadas
- [ ] Testado em sandbox
- [ ] Métricas aparecendo no dashboard
- [ ] Alertas funcionando
- [ ] Retry automático testado
- [ ] Logs monitorados
- [ ] Documentação revisada

---

**Última atualização:** 30/01/2025  
**Versão:** 1.0  
**Status:** Pronto para produção 🚀