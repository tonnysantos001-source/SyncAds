# 🔔 CONFIGURAR WEBHOOKS DOS GATEWAYS

**Importante:** Depois de configurar os gateways, você precisa registrar as URLs de webhook em cada plataforma para receber notificações automáticas de pagamento.

---

## 🌐 URLs DE WEBHOOK

Todas as URLs seguem o padrão:
```
https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/payment-webhook/{gateway}
```

### URLs Específicas:

| Gateway | URL do Webhook |
|---------|---------------|
| **Stripe** | `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/payment-webhook/stripe` |
| **Mercado Pago** | `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/payment-webhook/mercadopago` |
| **Asaas** | `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/payment-webhook/asaas` |
| **PagSeguro** | `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/payment-webhook/pagseguro` |
| **PayPal** | `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/payment-webhook/paypal` |

---

## 💳 STRIPE

### 1. Acesse o Dashboard
https://dashboard.stripe.com/webhooks

### 2. Clique em "Add endpoint"

### 3. Configure:
- **Endpoint URL:** `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/payment-webhook/stripe`
- **Description:** SyncAds Payment Notifications
- **Events to send:**
  - ✅ `payment_intent.succeeded`
  - ✅ `payment_intent.payment_failed`
  - ✅ `payment_intent.canceled`

### 4. Copie o "Signing secret"
- Aparece como `whsec_...`
- Adicione ao `.env` como `STRIPE_WEBHOOK_SECRET`

---

## 🇧🇷 MERCADO PAGO

### 1. Acesse o Dashboard
https://www.mercadopago.com.br/developers/panel/app

### 2. Selecione sua aplicação

### 3. Vá em "Webhooks" no menu lateral

### 4. Clique em "Configurar Webhooks"

### 5. Configure:
- **URL de Produção:** `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/payment-webhook/mercadopago`
- **Eventos:**
  - ✅ `payment.created`
  - ✅ `payment.updated`

### 6. Salvar

**Observação:** O Mercado Pago não usa assinatura de webhook, mas valida pelo IP. Certifique-se de que o IP da Supabase está na whitelist se necessário.

---

## 💰 ASAAS

### 1. Acesse o Dashboard
https://www.asaas.com/config/webhook

### 2. Configure:
- **URL:** `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/payment-webhook/asaas`
- **Eventos:**
  - ✅ `PAYMENT_CONFIRMED`
  - ✅ `PAYMENT_RECEIVED`
  - ✅ `PAYMENT_REFUNDED`
  - ✅ `PAYMENT_DELETED`

### 3. Salvar

---

## 🔒 PAGSEGURO

### 1. Acesse o Dashboard
https://pagseguro.uol.com.br/

### 2. Vá em "Integrações" > "Token de Segurança"

### 3. Configure a URL de notificação:
- **URL:** `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/payment-webhook/pagseguro`

**Observação:** PagSeguro ainda precisa de implementação completa do handler.

---

## 🅿️ PAYPAL

### 1. Acesse o Dashboard
https://developer.paypal.com/dashboard/applications

### 2. Selecione sua aplicação

### 3. Vá em "Webhooks"

### 4. Clique em "Add Webhook"

### 5. Configure:
- **Webhook URL:** `https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/payment-webhook/paypal`
- **Event types:**
  - ✅ `PAYMENT.CAPTURE.COMPLETED`
  - ✅ `PAYMENT.CAPTURE.DENIED`
  - ✅ `PAYMENT.CAPTURE.REFUNDED`

**Observação:** PayPal ainda precisa de implementação completa do handler.

---

## 🧪 TESTANDO WEBHOOKS

### Stripe CLI (Recomendado para Stripe)
```bash
# Instalar Stripe CLI
npm install -g stripe-cli

# Escutar webhooks localmente
stripe listen --forward-to http://localhost:54321/functions/v1/payment-webhook/stripe

# Disparar evento de teste
stripe trigger payment_intent.succeeded
```

### Mercado Pago Sandbox
1. Use chaves de teste (TEST-...)
2. Faça pagamentos de teste com cartões de teste
3. Docs: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/test-cards

### Asaas Sandbox
1. Configure no modo sandbox
2. Use o ambiente de teste
3. Docs: https://docs.asaas.com/reference/testando-no-sandbox

---

## ✅ VERIFICAR SE ESTÁ FUNCIONANDO

### 1. Logs da Edge Function
```bash
# Ver logs em tempo real
supabase functions logs payment-webhook --project-ref ovskepqggmxlfckxqgbr
```

### 2. Verificar transações no banco
```sql
-- Executar no Supabase SQL Editor
SELECT 
  id,
  "gatewayTransactionId",
  status,
  amount,
  "updatedAt",
  metadata->'webhookData' as webhook_data
FROM "Transaction"
WHERE "updatedAt" > NOW() - INTERVAL '1 hour'
ORDER BY "updatedAt" DESC;
```

### 3. Verificar pedidos atualizados
```sql
-- Executar no Supabase SQL Editor
SELECT 
  id,
  status,
  "totalAmount",
  "updatedAt"
FROM "Order"
WHERE status IN ('paid', 'payment_failed')
AND "updatedAt" > NOW() - INTERVAL '1 hour'
ORDER BY "updatedAt" DESC;
```

---

## 🔐 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

Adicione ao seu arquivo `.env`:

```bash
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Mercado Pago
MERCADOPAGO_ACCESS_TOKEN=TEST-...

# Asaas
ASAAS_API_KEY=...

# PagSeguro (quando implementar)
PAGSEGURO_TOKEN=...
PAGSEGURO_EMAIL=...

# PayPal (quando implementar)
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
```

E configure nas **Supabase Edge Function Secrets**:
```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set MERCADOPAGO_ACCESS_TOKEN=TEST-...
supabase secrets set ASAAS_API_KEY=...
```

---

## 📊 O QUE OS WEBHOOKS FAZEM AUTOMATICAMENTE

Quando um pagamento é atualizado:

1. ✅ **Atualiza status da transação** (`Transaction.status`)
2. ✅ **Atualiza status do pedido** (`Order.status`)
3. ✅ **Salva dados do webhook** (`Transaction.metadata.webhookData`)
4. ✅ **Registra timestamp** (`Transaction.metadata.lastWebhookAt`)

### Próximos passos automáticos (TODO):
- 📧 Enviar email de confirmação de pagamento
- 🔔 Disparar webhooks customizados da organização
- 📦 Atualizar estoque de produtos
- 📊 Atualizar métricas em tempo real

---

## 🆘 PROBLEMAS COMUNS

### Webhook não está sendo recebido
1. Verifique se a URL está correta
2. Verifique se o gateway está no modo correto (test/production)
3. Veja os logs da Edge Function
4. Teste manualmente com cURL ou Postman

### Status não está atualizando
1. Verifique se `gatewayTransactionId` está correto
2. Veja se a transação existe no banco
3. Verifique os logs da função

### Erro de assinatura (Stripe)
1. Verifique se `STRIPE_WEBHOOK_SECRET` está configurado
2. Certifique-se de usar o secret correto (test vs production)

---

**Última atualização:** 29/10/2025

