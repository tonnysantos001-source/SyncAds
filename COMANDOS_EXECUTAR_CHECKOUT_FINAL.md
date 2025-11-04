# 🚀 COMANDOS PARA EXECUTAR AGORA - CHECKOUT EM PRODUÇÃO
## SyncAds - Última Semana de Desenvolvimento

**Data:** Janeiro 2025  
**Prioridade:** 🔴 CRÍTICA  
**Tempo estimado:** 2-3 horas

---

## 📋 CHECKLIST RÁPIDO

- [ ] Backup do banco de dados
- [ ] Limpar pedidos pendentes (SQL)
- [ ] Deploy das Edge Functions
- [ ] Configurar CRON jobs
- [ ] Atualizar variáveis de ambiente
- [ ] Testar fluxo completo
- [ ] Monitorar por 1 hora

---

## 1️⃣ PASSO 1: BACKUP (5 minutos)

### Via Supabase Dashboard
```bash
# 1. Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr
# 2. Vá em Database > Backups
# 3. Clique em "Create Backup"
# 4. Nomeie: "backup-antes-limpeza-checkout-jan-2025"
```

### Via CLI (alternativa)
```bash
# Se tiver Supabase CLI instalado
supabase db dump --project-id ovskepqggmxlfckxqgbr > backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## 2️⃣ PASSO 2: EXECUTAR SQL DE LIMPEZA (10 minutos)

### Via Supabase SQL Editor

1. **Acesse o SQL Editor:**
   ```
   Dashboard > SQL Editor > New Query
   ```

2. **Cole o conteúdo do arquivo:**
   ```
   EXECUTAR_AGORA_LIMPEZA_CHECKOUT.sql
   ```

3. **Execute o script completo**
   - Clique em "Run" (Ctrl+Enter)
   - Aguarde a execução (pode demorar 1-2 minutos)

4. **Verifique os relatórios no final**
   - Deve mostrar quantos pedidos foram cancelados
   - Status de gateways e webhooks
   - Alertas de inconsistências

### Resultados Esperados:
```
✅ ~81 pedidos pendentes cancelados
✅ Histórico de cancelamento criado
✅ Métricas de clientes atualizadas
✅ Índices de performance criados
✅ Carrinhos antigos limpos
```

---

## 3️⃣ PASSO 3: DEPLOY EDGE FUNCTIONS (15 minutos)

### Instalar Supabase CLI (se ainda não tiver)

**Windows:**
```powershell
# Via Chocolatey
choco install supabase

# Via Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

**Mac/Linux:**
```bash
brew install supabase/tap/supabase
```

### Login no Supabase
```bash
# Fazer login
supabase login

# Verificar login
supabase projects list
```

### Link ao Projeto
```bash
# Na pasta raiz do projeto
cd C:\Users\dinho\Documents\GitHub\SyncAds

# Link ao projeto
supabase link --project-ref ovskepqggmxlfckxqgbr
```

### Deploy das Functions

**1. Função de Limpeza de Pedidos:**
```bash
supabase functions deploy cleanup-pending-orders \
  --project-ref ovskepqggmxlfckxqgbr
```

**2. Função de Recuperação de Carrinhos:**
```bash
supabase functions deploy recover-abandoned-carts \
  --project-ref ovskepqggmxlfckxqgbr
```

### Testar as Functions
```bash
# Testar cleanup
supabase functions invoke cleanup-pending-orders \
  --project-ref ovskepqggmxlfckxqgbr

# Testar recovery
supabase functions invoke recover-abandoned-carts \
  --project-ref ovskepqggmxlfckxqgbr
```

---

## 4️⃣ PASSO 4: CONFIGURAR VARIÁVEIS DE AMBIENTE (10 minutos)

### No Supabase Dashboard

1. **Acesse:**
   ```
   Dashboard > Settings > Edge Functions
   ```

2. **Adicionar variáveis:**

```bash
# Variáveis necessárias para Edge Functions
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
FRONTEND_URL=https://seu-dominio.vercel.app
WEBHOOK_SECRET=seu_webhook_secret_aqui
```

3. **Obter RESEND_API_KEY:**
   - Cadastre-se em: https://resend.com
   - Verifique seu domínio
   - Gere uma API Key
   - Cole na variável de ambiente

---

## 5️⃣ PASSO 5: CONFIGURAR CRON JOBS (10 minutos)

### Via SQL (Método Recomendado)

```sql
-- 1. Habilitar extensão pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Configurar job de limpeza (a cada 30 minutos)
SELECT cron.schedule(
  'cleanup-pending-orders-job',
  '*/30 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/cleanup-pending-orders',
      headers:='{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '", "Content-Type": "application/json"}'::jsonb
    ) as request_id;
  $$
);

-- 3. Configurar job de recuperação (a cada 1 hora)
SELECT cron.schedule(
  'recover-abandoned-carts-job',
  '0 * * * *',
  $$
  SELECT
    net.http_post(
      url:='https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/recover-abandoned-carts',
      headers:='{"Authorization": "Bearer ' || current_setting('app.settings.service_role_key') || '", "Content-Type": "application/json"}'::jsonb
    ) as request_id;
  $$
);

-- 4. Verificar jobs criados
SELECT * FROM cron.job;
```

### Alternativa: Usar serviço externo (mais fácil)

**Opção A: Vercel Cron Jobs**
```javascript
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-orders",
      "schedule": "*/30 * * * *"
    },
    {
      "path": "/api/cron/recover-carts",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Opção B: GitHub Actions**
```yaml
# .github/workflows/cleanup-orders.yml
name: Cleanup Pending Orders
on:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch:

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cleanup Function
        run: |
          curl -X POST \
            https://ovskepqggmxlfckxqgbr.supabase.co/functions/v1/cleanup-pending-orders \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}"
```

---

## 6️⃣ PASSO 6: ATUALIZAR WEBHOOK URLS (5 minutos)

### No SQL Editor, execute:

```sql
-- Atualizar URLs de webhook para seu domínio
-- SUBSTITUA https://seu-dominio.com pela URL real

UPDATE "GatewayConfig" gc
SET "webhookUrl" = 'https://seu-dominio.com/api/webhooks/payment/' || g.slug
FROM "Gateway" g
WHERE gc."gatewayId" = g.id
  AND gc."isActive" = true
  AND g.slug IN ('paguex', 'mercadopago', 'pagseguro', 'stripe', 'paypal');
```

### Verificar URLs atualizadas:
```sql
SELECT 
  g.name,
  g.slug,
  gc."webhookUrl",
  gc."isActive"
FROM "GatewayConfig" gc
JOIN "Gateway" g ON gc."gatewayId" = g.id
WHERE gc."isActive" = true
ORDER BY g.name;
```

---

## 7️⃣ PASSO 7: ATUALIZAR FRONTEND (5 minutos)

### Garantir que rotas estão corretas

```bash
# No arquivo src/App.tsx ou routes
# Verificar se estas rotas existem:

/app/orders/all                 # AllOrdersPage
/app/orders/abandoned-carts     # AbandonedCartsPage
/app/orders/pix-recovered       # PixRecoveredPage ✅
/app/reports/overview           # ReportsOverviewPage
/app/reports/audience           # AudiencePage
/app/reports/utms               # UtmsPage
```

### Deploy no Vercel

```bash
# Commit das alterações
git add .
git commit -m "feat: sistema de checkout completo com limpeza e recuperação"
git push origin main

# Vercel vai fazer deploy automático
# Ou force deploy:
vercel --prod
```

---

## 8️⃣ PASSO 8: TESTAR FLUXO COMPLETO (20 minutos)

### Teste 1: Criar Pedido e Cancelamento Automático

1. **Criar um pedido de teste:**
   ```bash
   # Via Postman ou terminal
   curl -X POST https://seu-dominio.com/api/orders \
     -H "Content-Type: application/json" \
     -d '{
       "userId": "seu-user-id",
       "customerEmail": "teste@example.com",
       "customerName": "Teste Cliente",
       "total": 100,
       "items": [],
       "paymentMethod": "PIX"
     }'
   ```

2. **Aguardar 30 minutos** (ou chamar função manualmente)

3. **Verificar se foi cancelado:**
   ```sql
   SELECT * FROM "Order" 
   WHERE "customerEmail" = 'teste@example.com' 
   ORDER BY "createdAt" DESC LIMIT 1;
   ```

### Teste 2: Carrinho Abandonado

1. **Criar carrinho:**
   - Adicione produto ao carrinho
   - NÃO finalize a compra
   - Abandone o carrinho

2. **Aguardar 1 hora** (ou chamar função)

3. **Verificar email enviado:**
   - Checar logs da edge function
   - Verificar se email chegou (Resend Dashboard)

### Teste 3: PIX Real

1. **Fazer pedido com PIX:**
   - Valor baixo (R$ 1,00)
   - Gere QR Code
   - Pague via app do banco

2. **Verificar atualização:**
   - Status deve mudar para PAID
   - Transação deve ser criada
   - Cliente deve receber email

---

## 9️⃣ PASSO 9: MONITORAMENTO (1 hora)

### Logs das Edge Functions

```bash
# Ver logs em tempo real
supabase functions logs cleanup-pending-orders --project-ref ovskepqggmxlfckxqgbr
supabase functions logs recover-abandoned-carts --project-ref ovskepqggmxlfckxqgbr
```

### Queries de Monitoramento

```sql
-- Ver pedidos criados na última hora
SELECT 
  "orderNumber",
  "paymentStatus",
  "status",
  "total",
  "createdAt"
FROM "Order"
WHERE "createdAt" > NOW() - INTERVAL '1 hour'
ORDER BY "createdAt" DESC;

-- Ver carrinhos abandonados recentes
SELECT 
  email,
  "abandonedAt",
  "recoveryAttempts",
  "lastRecoveryAt"
FROM "AbandonedCart"
WHERE "abandonedAt" > NOW() - INTERVAL '24 hours'
ORDER BY "abandonedAt" DESC;

-- Ver transações PIX
SELECT 
  o."orderNumber",
  t."paymentMethod",
  t.status,
  t.amount,
  t."createdAt",
  t."paidAt"
FROM "Transaction" t
JOIN "Order" o ON t."orderId" = o.id
WHERE t."paymentMethod" = 'PIX'
  AND t."createdAt" > NOW() - INTERVAL '24 hours'
ORDER BY t."createdAt" DESC;
```

### Dashboard do Supabase

```
1. Database > Logs
   - Verificar erros
   - Monitorar queries lentas

2. Edge Functions > Logs
   - Ver execuções
   - Verificar erros

3. Auth > Logs
   - Monitorar logins
   - Verificar tentativas de acesso
```

---

## 🔟 PASSO 10: CONFIGURAR ALERTAS (10 minutos)

### Configurar Email de Alertas

```sql
-- Criar função para enviar alertas
CREATE OR REPLACE FUNCTION send_admin_alert(
  alert_type text,
  alert_message text
)
RETURNS void AS $$
BEGIN
  -- Registrar alerta na tabela
  INSERT INTO "SystemAlert" (
    "userId",
    type,
    severity,
    title,
    message,
    "createdAt"
  )
  VALUES (
    NULL, -- Alerta do sistema
    alert_type,
    'high',
    'Alerta Checkout: ' || alert_type,
    alert_message,
    NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger para pedidos com falha
CREATE OR REPLACE FUNCTION alert_payment_failures()
RETURNS trigger AS $$
BEGIN
  IF NEW."paymentStatus" = 'FAILED' THEN
    PERFORM send_admin_alert(
      'PAYMENT_FAILED',
      'Pedido #' || NEW."orderNumber" || ' falhou. Valor: R$ ' || NEW.total
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_failure_alert
  AFTER UPDATE ON "Order"
  FOR EACH ROW
  WHEN (NEW."paymentStatus" = 'FAILED' AND OLD."paymentStatus" != 'FAILED')
  EXECUTE FUNCTION alert_payment_failures();
```

---

## 📊 VERIFICAÇÃO FINAL

### Executar estas queries e conferir:

```sql
-- 1. Status dos pedidos
SELECT 
  "paymentStatus",
  COUNT(*) as total,
  SUM(total) as valor
FROM "Order"
GROUP BY "paymentStatus"
ORDER BY total DESC;

-- Esperado:
-- PAID: 2-5 pedidos
-- CANCELLED: 80-85 pedidos (os antigos pendentes)
-- PENDING: 0-2 pedidos (apenas recentes)

-- 2. Gateways configurados
SELECT 
  COUNT(*) FILTER (WHERE "isActive" = true) as ativos,
  COUNT(*) FILTER (WHERE "webhookUrl" IS NOT NULL) as com_webhook,
  COUNT(*) FILTER (WHERE "isActive" = true AND "webhookUrl" IS NOT NULL) as prontos
FROM "GatewayConfig";

-- Esperado:
-- ativos: 53
-- com_webhook: 50+
-- prontos: 50+

-- 3. Edge Functions deployadas
```
```bash
supabase functions list --project-ref ovskepqggmxlfckxqgbr
```
```
-- Esperado:
-- ✓ cleanup-pending-orders
-- ✓ recover-abandoned-carts

-- 4. Variáveis de ambiente
```
```bash
supabase secrets list --project-ref ovskepqggmxlfckxqgbr
```
```
-- Esperado:
-- ✓ RESEND_API_KEY
-- ✓ FRONTEND_URL
-- ✓ WEBHOOK_SECRET
```

---

## ✅ CRITÉRIOS DE SUCESSO

### Checklist Final:

- [ ] **Banco limpo:** Menos de 5 pedidos PENDING
- [ ] **Functions deployadas:** 2 edge functions ativas
- [ ] **CRON configurado:** Jobs rodando automaticamente
- [ ] **Webhooks ativos:** URLs configuradas nos gateways
- [ ] **Emails funcionando:** Resend configurado e testado
- [ ] **Monitoramento ativo:** Logs sendo gerados
- [ ] **Dashboard funcional:** Todos menus acessíveis
- [ ] **Dados reais:** Sem mock, apenas dados reais
- [ ] **Performance OK:** Queries < 500ms
- [ ] **Testes passando:** Fluxo completo funciona

---

## 🚨 TROUBLESHOOTING

### Problema: Edge Function não executa

**Solução:**
```bash
# Ver logs detalhados
supabase functions logs cleanup-pending-orders \
  --project-ref ovskepqggmxlfckxqgbr \
  --tail

# Testar localmente
supabase functions serve cleanup-pending-orders
```

### Problema: CRON não está rodando

**Solução:**
```sql
-- Verificar jobs
SELECT * FROM cron.job;

-- Ver execuções
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 10;

-- Desabilitar e recriar
SELECT cron.unschedule('cleanup-pending-orders-job');
-- (executar novamente o schedule)
```

### Problema: Email não está sendo enviado

**Solução:**
```bash
# Verificar API key da Resend
curl https://api.resend.com/emails \
  -H "Authorization: Bearer re_sua_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "test@syncads.com.br",
    "to": "seu-email@example.com",
    "subject": "Teste",
    "html": "<p>Teste</p>"
  }'

# Ver logs da Resend
# Dashboard: https://resend.com/logs
```

### Problema: Webhook não recebe notificação

**Solução:**
1. Verificar URL está correta no gateway
2. Testar endpoint manualmente
3. Ver logs do servidor
4. Verificar firewall/CORS
5. Usar ferramentas como webhook.site para debug

---

## 📞 SUPORTE

### Documentação
- Supabase: https://supabase.com/docs
- Resend: https://resend.com/docs
- Vercel: https://vercel.com/docs

### Comunidade
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/seu-usuario/syncads/issues

---

## 🎯 PRÓXIMOS PASSOS (PÓS-DEPLOY)

1. **Dia 1-2:** Monitorar intensivamente
2. **Dia 3-4:** Ajustar baseado em feedback
3. **Dia 5-7:** Otimizações de performance
4. **Semana 2:** Adicionar features avançadas
5. **Semana 3:** A/B testing e melhorias

---

## 📈 MÉTRICAS A ACOMPANHAR

### Diariamente:
- Taxa de conversão de checkout
- Pedidos cancelados automaticamente
- Carrinhos recuperados
- Taxa de aprovação PIX

### Semanalmente:
- Performance das queries
- Uso de Edge Functions
- Erros e exceções
- Tempo médio de checkout

### Mensalmente:
- ROI de recuperação de carrinhos
- Custo por transação
- Taxa de chargeback
- NPS de checkout

---

**🎉 BOA SORTE! SISTEMA PRONTO PARA PRODUÇÃO!**

*Última atualização: Janeiro 2025*