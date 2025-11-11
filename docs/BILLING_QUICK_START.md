# 🚀 Billing System - Quick Start Guide

Guia rápido para colocar o sistema de faturamento em produção.

## ✅ Status Atual

### Implementado e Funcionando
- ✅ Banco de Dados (PaymentMethod, Subscription, Invoice)
- ✅ Frontend BillingPage com 4 planos
- ✅ API de Pagamentos (payment.ts)
- ✅ Integração com Split de Pagamento multi-gateway
- ✅ Edge Function process-payment (já existente)
- ✅ Edge Function renew-subscriptions (criada)
- ✅ Build passando sem erros

### Falta Implementar
- ⏳ Deploy da Edge Function renew-subscriptions
- ⏳ Configurar Cron Job para renovações
- ⏳ Implementar estorno automático do R$ 1,00
- ⏳ Testar fluxo completo end-to-end
- ⏳ Adicionar notificações por email

## 🎯 Configuração Inicial

### 1. Verificar Gateway Administrativo

O sistema precisa de um gateway padrão configurado:

```sql
-- Execute no SQL Editor do Supabase
SELECT 
  id,
  name,
  slug,
  "isDefault",
  "isActive"
FROM "GatewayConfig"
WHERE "userId" IS NULL
  AND "isDefault" = true
  AND "isActive" = true;
```

**Se não retornar nada:**
1. Acesse `/super-admin/payment-split`
2. Configure um gateway (ex: Mercado Pago)
3. Marque como "Default" e "Active"

### 2. Deploy Edge Function

```bash
# No diretório do projeto
cd supabase

# Login no Supabase (se necessário)
npx supabase login

# Link ao projeto
npx supabase link --project-ref ovskepqggmxlfckxqgbr

# Deploy da função de renovação
npx supabase functions deploy renew-subscriptions
```

### 3. Configurar Cron Job

**No Supabase Dashboard:**

1. Acesse: `Project` > `Edge Functions` > `Cron Jobs`
2. Clique em `Create Cron Job`
3. Configure:
   - **Function**: `renew-subscriptions`
   - **Schedule**: `0 * * * *` (a cada hora)
   - **Timezone**: `America/Sao_Paulo`
4. Clique em `Create`

### 4. Variáveis de Ambiente (Já Configuradas)

Verificar no Dashboard > Settings > Edge Functions:

```
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
```

## 🧪 Testes Rápidos

### Teste 1: Verificar Planos

Acesse: `https://seuapp.com/billing`

Você deve ver 4 planos:
- Free (Grátis)
- Starter (R$ 49,90)
- Pro (R$ 149,90) - Popular
- Enterprise (R$ 499,90)

### Teste 2: Adicionar Cartão

**Cartão de Teste:**
```
Número: 4111 1111 1111 1111
Nome: TESTE USUARIO
Validade: 12/25
CVV: 123
CPF: 123.456.789-00
```

**Verificações:**
1. Clique em "Adicionar Cartão"
2. Preencha os dados
3. Clique em "Adicionar Cartão"
4. Deve mostrar: "Cartão adicionado! R$ 1 será estornado em até 24h"

**No Banco de Dados:**
```sql
-- Verificar cartão salvo
SELECT * FROM "PaymentMethod"
WHERE "userId" = 'SEU_USER_ID'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Verificar log de split
SELECT * FROM "PaymentSplitLog"
WHERE "userId" = 'SEU_USER_ID'
  AND decision = 'admin'
  AND amount = 1.00
ORDER BY "createdAt" DESC
LIMIT 1;
```

### Teste 3: Criar Assinatura

1. Com cartão adicionado, clique em "Fazer Upgrade" no plano Starter
2. Confirme o upgrade
3. Deve mostrar: "Assinatura criada com sucesso! Você tem 7 dias grátis..."

**No Banco de Dados:**
```sql
-- Verificar assinatura
SELECT 
  id,
  plan,
  status,
  "trialEnd",
  "nextPaymentDate"
FROM "Subscription"
WHERE "userId" = 'SEU_USER_ID'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Status deve ser 'trialing'
-- trialEnd deve ser +7 dias
```

### Teste 4: Simular Renovação

```sql
-- 1. Forçar expiração do trial
UPDATE "Subscription"
SET "trialEnd" = NOW() - INTERVAL '1 hour',
    "nextPaymentDate" = NOW() - INTERVAL '1 hour'
WHERE "userId" = 'SEU_USER_ID'
  AND status = 'trialing';
```

```bash
# 2. Chamar função de renovação manualmente
curl -X POST \
  "https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/renew-subscriptions" \
  -H "Authorization: Bearer SEU_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

**Verificar resultado:**
```sql
-- Assinatura deve estar 'active'
SELECT status, "lastPaymentDate", "nextPaymentDate"
FROM "Subscription"
WHERE "userId" = 'SEU_USER_ID';

-- Deve ter invoice 'paid'
SELECT * FROM "Invoice"
WHERE "userId" = 'SEU_USER_ID'
  AND status = 'paid'
ORDER BY "createdAt" DESC
LIMIT 1;

-- Deve ter log de split com pagamento
SELECT * FROM "PaymentSplitLog"
WHERE "userId" = 'SEU_USER_ID'
  AND "ruleType" = 'admin_billing'
ORDER BY "createdAt" DESC
LIMIT 1;
```

## 📊 Monitoramento

### Logs da Edge Function

```bash
# Ver logs em tempo real
npx supabase functions logs renew-subscriptions --follow
```

### Dashboard SQL

```sql
-- Resumo de assinaturas
SELECT
  plan,
  status,
  COUNT(*) as quantidade,
  SUM(amount) as receita_mensal
FROM "Subscription"
GROUP BY plan, status
ORDER BY plan, status;

-- Receita total de billing
SELECT
  DATE("createdAt") as data,
  COUNT(*) as transacoes,
  SUM(amount) as receita
FROM "PaymentSplitLog"
WHERE "ruleType" = 'admin_billing'
  AND "createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY DATE("createdAt")
ORDER BY data DESC;

-- Taxa de conversão trial -> active
SELECT
  COUNT(*) FILTER (WHERE status = 'trialing') as em_trial,
  COUNT(*) FILTER (WHERE status = 'active') as ativos,
  COUNT(*) FILTER (WHERE status = 'past_due') as pagamento_falhou,
  COUNT(*) FILTER (WHERE status = 'canceled') as cancelados,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'active') /
    NULLIF(COUNT(*), 0),
    2
  ) as taxa_conversao_pct
FROM "Subscription";
```

## 🔧 Troubleshooting

### Erro: "Gateway administrativo não configurado"

**Solução:**
```sql
-- Verificar se existe gateway admin
SELECT * FROM "GatewayConfig"
WHERE "userId" IS NULL;

-- Se não existir, criar via /super-admin/payment-split
```

### Erro: "Método de pagamento não encontrado"

**Causas comuns:**
1. Cartão não foi verificado (isVerified = false)
2. Cartão foi removido
3. Cobrança de R$ 1,00 falhou

**Solução:**
```sql
-- Verificar status do cartão
SELECT 
  id,
  "cardBrand",
  "lastFourDigits",
  "isVerified"
FROM "PaymentMethod"
WHERE "userId" = 'USER_ID';
```

### Renovação não está executando

**Verificações:**
1. Cron Job está ativo no Dashboard?
2. Edge Function foi deployada?
3. Verificar logs:

```bash
npx supabase functions logs renew-subscriptions --limit 50
```

### Pagamento está falhando

**Debug:**
```sql
-- Ver últimas tentativas de pagamento
SELECT
  "createdAt",
  "userId",
  amount,
  status,
  metadata
FROM "Transaction"
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
ORDER BY "createdAt" DESC
LIMIT 20;

-- Ver faturas falhadas
SELECT
  "createdAt",
  "userId",
  amount,
  description,
  metadata->>'error' as erro
FROM "Invoice"
WHERE status = 'failed'
  AND "createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;
```

## 🚀 Deploy em Produção

### Checklist Pré-Deploy

- [ ] Gateway admin configurado e testado
- [ ] Edge Function renew-subscriptions deployada
- [ ] Cron Job configurado (a cada hora)
- [ ] Testado fluxo completo localmente
- [ ] Cartão de teste funcionando
- [ ] Trial de 7 dias funcionando
- [ ] Renovação manual testada
- [ ] Logs monitorados

### Deploy

```bash
# 1. Build final
npm run build

# 2. Deploy app (Vercel/outro)
# ... conforme seu processo de deploy

# 3. Verificar Edge Functions no Supabase
# Dashboard > Edge Functions > Status

# 4. Testar em produção com cartão de teste
```

### Pós-Deploy

1. **Monitorar primeiras 24h**
   - Verificar logs do renew-subscriptions
   - Acompanhar PaymentSplitLog
   - Verificar se renovações estão acontecendo

2. **Configurar Alertas** (opcional)
   ```sql
   -- Criar view para monitoramento
   CREATE OR REPLACE VIEW billing_health AS
   SELECT
     COUNT(*) FILTER (WHERE status = 'past_due') as pagamentos_pendentes,
     COUNT(*) FILTER (WHERE status = 'active') as assinaturas_ativas,
     COUNT(*) FILTER (WHERE status = 'trialing') as em_trial
   FROM "Subscription";
   ```

3. **Backup Regular**
   - PaymentMethod (tokens dos cartões)
   - Subscription (assinaturas ativas)
   - Invoice (histórico de fatura)

## 📈 Próximos Passos

### Curto Prazo (1-2 semanas)
- [ ] Implementar estorno automático do R$ 1,00
- [ ] Adicionar notificações por email
- [ ] Criar dashboard de métricas de billing
- [ ] Adicionar retry automático para falhas

### Médio Prazo (1 mês)
- [ ] Implementar webhooks dos gateways
- [ ] Adicionar cupons de desconto
- [ ] Gerar PDF de faturas
- [ ] Implementar downgrade de planos

### Longo Prazo (3+ meses)
- [ ] Analytics avançado de churn
- [ ] Previsão de receita (MRR)
- [ ] Testes A/B de pricing
- [ ] Programa de afiliados

## 📞 Suporte

### Logs Importantes

```bash
# Ver todos os logs de billing
SELECT * FROM "PaymentSplitLog"
WHERE "ruleType" = 'admin_billing'
ORDER BY "createdAt" DESC
LIMIT 100;

# Ver problemas recentes
SELECT
  s.id,
  s."userId",
  s.plan,
  s.status,
  s."nextPaymentDate",
  pm."cardBrand",
  pm."lastFourDigits"
FROM "Subscription" s
LEFT JOIN "PaymentMethod" pm ON s."paymentMethodId" = pm.id
WHERE s.status = 'past_due'
ORDER BY s."nextPaymentDate" DESC;
```

### Contatos

- **Logs**: Supabase Dashboard > Edge Functions
- **Database**: Supabase Dashboard > Table Editor
- **Documentação Completa**: `docs/BILLING_SYSTEM.md`

---

**Última atualização**: 2025-02-04  
**Versão**: 1.0.0  
**Projeto**: ovskepqggmxlfckxqgbr