# 🚀 APLICAR AGORA - SISTEMA DE SPLIT E PLANOS

## ⚡ PASSOS RÁPIDOS DE IMPLEMENTAÇÃO

### 1️⃣ APLICAR MIGRATION NO BANCO DE DADOS

**Opção A - Via Supabase Dashboard:**
1. Acesse: https://app.supabase.com
2. Selecione seu projeto SyncAds
3. Vá em **SQL Editor**
4. Clique em **+ New Query**
5. Copie TODO o conteúdo do arquivo: `supabase/migrations/20250204000000_payment_split_and_plans_system.sql`
6. Cole no editor
7. Clique em **RUN** (ou pressione Ctrl+Enter)
8. Aguarde confirmação ✅

**Opção B - Via Supabase CLI:**
```bash
cd C:\Users\dinho\Documents\GitHub\SyncAds
supabase db push
```

---

### 2️⃣ VERIFICAR SE APLICOU CORRETAMENTE

Execute no SQL Editor:
```sql
-- Verificar se tabelas foram criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('PaymentSplitRule', 'PaymentSplitLog', 'PlanDailyUsage')
ORDER BY table_name;

-- Deve retornar 3 linhas:
-- PaymentSplitLog
-- PaymentSplitRule
-- PlanDailyUsage
```

---

### 3️⃣ ACESSAR AS NOVAS PÁGINAS

**Página de Split de Pagamento:**
```
http://localhost:5173/super-admin/payment-split
```

**Página de Gestão de Planos:**
```
http://localhost:5173/super-admin/plans
```

---

### 4️⃣ CRIAR PRIMEIRO PLANO

1. Acesse `/super-admin/plans`
2. Clique em **"Novo Plano"**
3. Preencha:
   - **Nome:** Plano Pro
   - **Slug:** pro
   - **Preço:** 199.90
   - **Intervalo:** Mensal
   - **Mensagens IA por Dia:** 200
   - **Imagens IA por Dia:** 100
   - **Páginas de Checkout:** 10
   - **Produtos:** 100
4. Ative as features desejadas (Custom Domain, Analytics, etc)
5. Clique em **"Criar Plano"**

---

### 5️⃣ CRIAR PRIMEIRA REGRA DE SPLIT

1. Acesse `/super-admin/payment-split`
2. Clique em **"Nova Regra"**
3. Configure:
   - **Nome:** Split 20% Admin
   - **Tipo:** Frequência
   - **A cada quantas transações:** 10
   - **Quantas vão para o admin:** 2
   - **Gateway do Admin:** Selecione seu gateway
   - **Prioridade:** 10
   - **Ativa:** Sim
4. Clique em **"Criar"**

**Resultado:** A cada 10 vendas dos clientes, 2 vão pro seu gateway (20% de lucro direto)

---

### 6️⃣ INTEGRAR NO CHECKOUT (PRÓXIMO PASSO)

No arquivo onde você processa o pagamento, adicione:

```typescript
// Antes de processar o pagamento
const { data: splitDecision } = await supabase.rpc('determine_split_gateway', {
  p_user_id: userId,
  p_order_value: orderTotal
});

// Usar o gateway correto
const gatewayId = splitDecision.decision === 'admin' 
  ? splitDecision.gatewayId  // Seu gateway
  : clientGatewayId;         // Gateway do cliente

// Processar pagamento...
const payment = await processPayment({
  gatewayId,
  amount: orderTotal,
  // ... outros dados
});

// Registrar no log
await supabase.from('PaymentSplitLog').insert({
  transactionId: payment.id,
  orderId,
  userId,
  ruleId: splitDecision.ruleId,
  decision: splitDecision.decision,
  gatewayId,
  gatewayName: gateway.name,
  amount: orderTotal,
  adminRevenue: splitDecision.decision === 'admin' ? orderTotal : 0,
  clientRevenue: splitDecision.decision === 'client' ? orderTotal : 0,
  ruleType: splitDecision.ruleType,
  ruleName: splitDecision.ruleName,
  reason: splitDecision.reason
});
```

---

### 7️⃣ CONTROLAR LIMITES DIÁRIOS DE IA

Antes de processar mensagem de IA:

```typescript
// Verificar se pode usar
const { data: canUse } = await supabase.rpc('increment_daily_usage', {
  p_user_id: userId,
  p_message_type: 'message' // ou 'image'
});

if (!canUse) {
  throw new Error('Limite diário de mensagens atingido. Faça upgrade do seu plano!');
}

// Processar a mensagem IA...
```

---

### 8️⃣ TESTAR TUDO

**Teste 1 - Ver estatísticas:**
- Acesse `/super-admin/payment-split`
- Verifique os cards de estatísticas
- Devem mostrar 0 transações (ainda não tem dados)

**Teste 2 - Criar várias regras:**
- Crie uma regra de Frequência
- Crie uma regra de Percentual
- Crie uma regra de Valor
- Veja qual tem prioridade

**Teste 3 - Ativar/Desativar:**
- Desative uma regra
- Reative
- Resete o contador

**Teste 4 - Editar regra:**
- Edite uma regra existente
- Mude de "A cada 10" para "A cada 5"
- Salve e veja a mudança

---

## 🎯 EXEMPLOS DE REGRAS REAIS

### Exemplo 1: Split Conservador (10%)
```
Nome: Split Conservador
Tipo: Frequência
A cada: 10 transações
Pegar: 1 transação
Gateway: Seu Mercado Pago
```

### Exemplo 2: Split Agressivo (30%)
```
Nome: Split Agressivo
Tipo: Frequência
A cada: 10 transações
Pegar: 3 transações
Gateway: Seu Stripe
```

### Exemplo 3: Vendas Premium
```
Nome: Vendas Premium
Tipo: Valor
Valor Mínimo: R$ 1000
Gateway: Seu PagSeguro
```

### Exemplo 4: Percentual Aleatório
```
Nome: Split 25%
Tipo: Percentual
Percentual: 25%
Gateway: Seu Asaas
```

---

## 📊 MONITORAMENTO

### Ver logs de split:
```sql
SELECT 
  decision,
  "gatewayName",
  amount,
  "ruleName",
  reason,
  "createdAt"
FROM "PaymentSplitLog"
ORDER BY "createdAt" DESC
LIMIT 50;
```

### Ver estatísticas por regra:
```sql
SELECT 
  name,
  type,
  "totalTransactions",
  "adminTransactions",
  "clientTransactions",
  "totalAdminRevenue",
  ROUND(("adminTransactions"::numeric / NULLIF("totalTransactions", 0) * 100), 2) as "splitPercentage"
FROM "PaymentSplitRule"
WHERE "isActive" = true
ORDER BY priority DESC;
```

### Ver uso diário de IA:
```sql
SELECT 
  u.email,
  p.name as plan_name,
  pdu."aiMessagesUsed",
  p."maxAiMessagesDaily",
  ROUND((pdu."aiMessagesUsed"::numeric / NULLIF(p."maxAiMessagesDaily", 0) * 100), 2) as "usagePercentage"
FROM "PlanDailyUsage" pdu
JOIN "User" u ON u.id = pdu."userId"
JOIN "Plan" p ON p.id = u."currentPlanId"
WHERE pdu.date = CURRENT_DATE
ORDER BY "usagePercentage" DESC;
```

---

## 🐛 TROUBLESHOOTING

### Problema: "relation PaymentSplitRule does not exist"
**Solução:** Migration não foi aplicada. Volte ao passo 1.

### Problema: Regra não está funcionando
**Verificar:**
```sql
SELECT * FROM "PaymentSplitRule" WHERE "isActive" = true;
```
- Confirme que `isActive = true`
- Confirme que `adminGatewayId` não é NULL
- Verifique a prioridade

### Problema: Limite diário não funciona
**Verificar:**
```sql
SELECT * FROM "Plan" WHERE id = '[seu_plan_id]';
```
- Confirme que `maxAiMessagesDaily > 0`
- Se for 0, significa ilimitado

### Problema: Contador não incrementa
**Testar manualmente:**
```sql
SELECT determine_split_gateway(
  '[user_id]'::text,
  100.00
);
```

---

## ✅ CHECKLIST FINAL

- [ ] Migration aplicada no Supabase
- [ ] Tabelas criadas (PaymentSplitRule, PaymentSplitLog, PlanDailyUsage)
- [ ] Acessou `/super-admin/payment-split`
- [ ] Acessou `/super-admin/plans`
- [ ] Criou pelo menos 1 plano
- [ ] Criou pelo menos 1 regra de split
- [ ] Testou ativar/desativar regra
- [ ] Testou editar regra
- [ ] Viu estatísticas no dashboard
- [ ] Entendeu como integrar no checkout

---

## 🎉 PRÓXIMOS PASSOS

1. **Integrar no Checkout** - Adicionar lógica de split no processamento de pagamento
2. **Integrar Limites de IA** - Bloquear uso quando atingir limite diário
3. **Criar Mais Planos** - Free, Starter, Pro, Enterprise
4. **Configurar Webhook Stripe** - Sincronizar assinaturas automaticamente
5. **Criar Dashboard de Receita** - Visualizar receita MRR vs Split
6. **Email de Notificação** - Alertar quando limite diário atingir 80%

---

## 📞 SUPORTE

Se algo não funcionar:
1. Verifique os logs no console do navegador (F12)
2. Verifique os logs do Supabase
3. Execute as queries de verificação acima
4. Consulte o arquivo `RESUMO_SPLIT_E_PLANOS.md`

---

**TUDO PRONTO! 🚀**

Agora você tem controle total de:
- ✅ Planos e limites diários de IA
- ✅ Split inteligente de pagamento
- ✅ Rastreamento completo de receita
- ✅ Dashboard de métricas

**Bora lucrar! 💰**