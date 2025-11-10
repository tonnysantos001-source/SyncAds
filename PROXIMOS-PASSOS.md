# 🚀 PRÓXIMOS PASSOS - SYNCADS

**Status Atual:** ✅ Correções aplicadas, build OK, commit realizado
**Pendente:** Aplicar migrations no banco e testes finais
**Tempo Estimado:** 45-60 minutos

---

## 📋 CHECKLIST RÁPIDO

```
[ ] 1. Aplicar migrations no Supabase (10 min)
[ ] 2. Verificar RLS policies (5 min)
[ ] 3. Criar notificações de teste (5 min)
[ ] 4. Testar gateway Paggue-x (30 min)
[ ] 5. Testar integração Shopify (15 min)
[ ] 6. Deploy final (5 min)
```

---

## 🗄️ PASSO 1: APLICAR MIGRATIONS (10 min)

### Migration 1: Tabela Notification

1. **Abrir Supabase Dashboard:**
   - URL: https://supabase.com/dashboard
   - Projeto: SyncAds
   - Seção: SQL Editor

2. **Copiar migration:**
   - Arquivo: `supabase/migrations/20240101000000_create_notifications.sql`
   - Copiar TODO o conteúdo

3. **Executar no SQL Editor:**
   ```sql
   -- Cole aqui o conteúdo completo do arquivo
   -- Clique em "RUN" ou Ctrl+Enter
   ```

4. **Verificar sucesso:**
   ```sql
   -- Deve retornar estrutura da tabela:
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'Notification';
   
   -- Deve retornar pelo menos 4 policies:
   SELECT policyname 
   FROM pg_policies 
   WHERE tablename = 'Notification';
   ```

**✅ Resultado Esperado:**
- Tabela criada ✅
- 4+ policies ativas ✅
- Indexes criados ✅
- Função `create_notification()` disponível ✅

---

### Migration 2: Campo User.lastSeen

1. **SQL Editor (mesma página)**

2. **Copiar migration:**
   - Arquivo: `supabase/migrations/20240101000001_add_user_lastseen.sql`

3. **Executar:**
   ```sql
   -- Cole conteúdo completo
   -- RUN
   ```

4. **Verificar:**
   ```sql
   -- Deve mostrar coluna lastSeen:
   SELECT id, email, "lastSeen" 
   FROM "User" 
   LIMIT 3;
   
   -- Deve retornar timestamp atual:
   SELECT COUNT(*) FROM "User" WHERE "lastSeen" IS NOT NULL;
   ```

**✅ Resultado Esperado:**
- Campo `lastSeen` adicionado ✅
- Todos os users têm timestamp ✅
- Index criado ✅
- Função `update_user_last_seen()` disponível ✅

---

## 🔒 PASSO 2: VERIFICAR RLS (5 min)

```sql
-- Executar no SQL Editor:

-- 1. Verificar RLS está habilitado:
SELECT 
  tablename,
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('User', 'Campaign', 'ChatMessage', 'Notification')
ORDER BY tablename;

-- Resultado esperado: rowsecurity = true para todas

-- 2. Contar policies:
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('User', 'Campaign', 'ChatMessage', 'Notification')
GROUP BY tablename
ORDER BY tablename;

-- Resultado esperado:
-- User: 2+ policies
-- Campaign: 4+ policies
-- ChatMessage: 4+ policies
-- Notification: 4+ policies

-- 3. Ver detalhes das policies:
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename = 'Notification'
ORDER BY policyname;
```

**✅ Resultado Esperado:**
- RLS ativo em todas as tabelas ✅
- Policies implementadas ✅
- Segurança OK ✅

---

## 📬 PASSO 3: CRIAR NOTIFICAÇÕES DE TESTE (5 min)

### Obter seu User ID:

```sql
-- Encontrar seu usuário:
SELECT id, email, name 
FROM "User" 
WHERE email = 'SEU_EMAIL@AQUI.COM';

-- Copiar o ID retornado
```

### Criar notificações de exemplo:

```sql
-- 1. Notificação de sucesso:
SELECT create_notification(
  'SEU_USER_ID_AQUI',
  'success',
  'Bem-vindo ao SyncAds!',
  'Sua conta foi criada com sucesso. Comece criando sua primeira campanha.'
);

-- 2. Notificação de campanha:
SELECT create_notification(
  'SEU_USER_ID_AQUI',
  'campaign',
  'Nova Campanha Criada',
  'Sua campanha "Lançamento 2024" está ativa e rodando.'
);

-- 3. Notificação de warning:
SELECT create_notification(
  'SEU_USER_ID_AQUI',
  'warning',
  'Limite de IA Atingido',
  'Você usou 45 de 50 mensagens do seu plano. Considere fazer upgrade.'
);

-- 4. Notificação de info:
SELECT create_notification(
  'SEU_USER_ID_AQUI',
  'info',
  'Atualização da Plataforma',
  'Novos recursos de análise foram adicionados ao dashboard.'
);
```

### Verificar notificações criadas:

```sql
SELECT 
  type,
  title,
  description,
  read,
  "createdAt"
FROM "Notification"
WHERE "userId" = 'SEU_USER_ID_AQUI'
ORDER BY "createdAt" DESC;
```

**✅ Resultado Esperado:**
- 4 notificações criadas ✅
- Aparecem no Header do frontend ✅
- Badge com contador funciona ✅

---

## 💳 PASSO 4: TESTAR GATEWAY PAGGUE-X (30 min)

### 4.1 Verificar Configuração

**Via Frontend:**
1. Login como admin
2. Ir para: `/super-admin/gateways`
3. Procurar: **Paggue-x**
4. Verificar: Status = Ativo ✅

**Via SQL:**
```sql
SELECT 
  gateway,
  "isActive",
  "createdAt"
FROM "GatewayConfig"
WHERE gateway = 'paggue-x';
```

---

### 4.2 Criar Transação de Teste

**Opção A - Via Frontend (Recomendado):**
1. Abrir checkout público: `https://seu-dominio/checkout/ALGUM_PRODUTO`
2. Preencher dados de teste
3. Escolher método: PIX
4. Clicar em "Gerar Pagamento"
5. Copiar QR Code ou código PIX

**Opção B - Via API (Avançado):**
```bash
curl -X POST https://seu-dominio/api/payments/create \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100,
    "currency": "BRL",
    "method": "pix",
    "customer": {
      "name": "Teste User",
      "email": "teste@syncads.com",
      "document": "12345678900"
    }
  }'
```

---

### 4.3 Verificar Transação no Banco

```sql
-- Listar transações recentes:
SELECT 
  id,
  amount,
  status,
  gateway,
  method,
  "createdAt"
FROM "PaymentTransaction"
ORDER BY "createdAt" DESC
LIMIT 5;
```

**✅ Resultado Esperado:**
- Status inicial: `pending` ✅
- Gateway: `paggue-x` ✅
- Method: `pix` ✅
- QR Code gerado ✅

---

### 4.4 Simular Webhook de Confirmação

**Painel Paggue-x:**
1. Login no painel de teste
2. Procurar transação criada
3. Marcar como "Paga"
4. Webhook será enviado automaticamente

**Ou manualmente (Dev):**
```bash
# Webhook endpoint:
# https://seu-dominio/api/webhooks/paggue-x

# Payload de exemplo (ajustar conforme Paggue-x):
curl -X POST https://seu-dominio/api/webhooks/paggue-x \
  -H "Content-Type: application/json" \
  -H "X-Paggue-Signature: SUA_ASSINATURA" \
  -d '{
    "transaction_id": "TRANSACTION_ID",
    "status": "paid",
    "amount": 100
  }'
```

---

### 4.5 Verificar Status Atualizado

```sql
-- Verificar se status mudou:
SELECT 
  id,
  status,
  "gatewayTransactionId",
  "updatedAt"
FROM "PaymentTransaction"
WHERE id = 'TRANSACTION_ID';
```

**✅ Resultado Esperado:**
- Status mudou: `pending` → `approved` ✅
- `updatedAt` atualizado ✅
- Webhook processado ✅

---

### 4.6 Verificar Logs

```sql
-- Ver logs de webhook (se tiver tabela de logs):
SELECT 
  gateway,
  status,
  payload,
  "createdAt"
FROM "WebhookLog"
WHERE gateway = 'paggue-x'
ORDER BY "createdAt" DESC
LIMIT 5;
```

**✅ Checklist Gateway:**
- [ ] Transação criada
- [ ] QR Code gerado
- [ ] Webhook recebido
- [ ] Status atualizado
- [ ] Logs registrados

---

## 🛍️ PASSO 5: TESTAR SHOPIFY (15 min)

### 5.1 Verificar Integração

```sql
-- Ver configuração Shopify:
SELECT 
  platform,
  "isActive",
  config,
  "lastSyncAt"
FROM "Integration"
WHERE platform = 'shopify';
```

---

### 5.2 Sincronizar Produtos

**Via Frontend:**
1. Ir para: `/app/integrations/shopify`
2. Clicar: "Sincronizar Produtos"
3. Aguardar conclusão

**Via API:**
```bash
curl -X POST https://seu-dominio/api/integrations/shopify/sync \
  -H "Authorization: Bearer SEU_TOKEN"
```

---

### 5.3 Verificar Produtos Sincronizados

```sql
-- Contar produtos:
SELECT 
  source,
  COUNT(*) as total
FROM "Product"
GROUP BY source;

-- Ver últimos produtos:
SELECT 
  name,
  price,
  source,
  "createdAt"
FROM "Product"
WHERE source = 'shopify'
ORDER BY "createdAt" DESC
LIMIT 10;
```

**✅ Resultado Esperado:**
- Produtos importados ✅
- Preços corretos ✅
- Source = 'shopify' ✅

---

## 🚀 PASSO 6: DEPLOY FINAL (5 min)

### Via Vercel (Recomendado):

```bash
# 1. Push do código (você fará manual):
git push origin main

# 2. Vercel detecta automaticamente
# 3. Build inicia
# 4. Deploy em ~2 minutos
```

### Verificar Deploy:

1. **Abrir URL de produção**
2. **Testar login**
3. **Ver notificações no header** (deve mostrar as que criamos)
4. **Abrir dashboard**
5. **Verificar contadores**

---

## ✅ VALIDAÇÃO FINAL

### Checklist Completo:

```
Backend:
[ ] ✅ Migrations aplicadas
[ ] ✅ RLS policies ativas
[ ] ✅ Notificações criadas
[ ] ✅ Gateway funcionando
[ ] ✅ Shopify sincronizada

Frontend:
[ ] ✅ Build sucesso
[ ] ✅ Deploy concluído
[ ] ✅ Notificações aparecem
[ ] ✅ Dashboard carrega
[ ] ✅ Checkout funciona

Segurança:
[ ] ✅ Webhook valida assinatura
[ ] ✅ RLS protege dados
[ ] ✅ API keys seguras
[ ] ✅ Sem mocks em produção
```

---

## 🆘 TROUBLESHOOTING

### Problema: Notificações não aparecem

**Solução:**
```sql
-- Verificar RLS:
SELECT * FROM pg_policies WHERE tablename = 'Notification';

-- Verificar se user pode ler:
SET ROLE authenticated;
SELECT * FROM "Notification" WHERE "userId" = auth.uid()::text;
```

---

### Problema: Gateway não cria transação

**Verificar:**
1. Credenciais configuradas corretamente?
2. Ambiente correto (sandbox vs production)?
3. Logs de erro:

```sql
SELECT * FROM "ErrorLog" 
WHERE context LIKE '%paggue-x%' 
ORDER BY "createdAt" DESC 
LIMIT 10;
```

---

### Problema: Webhook não processa

**Verificar:**
1. Endpoint correto: `/api/webhooks/paggue-x`
2. Assinatura configurada
3. Logs de webhook:

```bash
# Ver logs na edge function:
# Supabase Dashboard → Edge Functions → payment-webhook → Logs
```

---

## 📞 SUPORTE

### Documentação:
- Auditoria: `AUDITORIA/RELATORIO-COMPLETO.md`
- Correções: `AUDITORIA/CORRECOES-APLICADAS.md`
- Testes: `AUDITORIA/TESTES-CRITICOS.md`

### Comandos Úteis:

```bash
# Build local:
npm run build

# Verificar tipos:
npm run type-check

# Ver logs Supabase:
# Dashboard → Logs → Selecionar serviço

# Rollback (se necessário):
git revert HEAD
git push origin main
```

---

## 🎉 APÓS CONCLUSÃO

### Você terá:

✅ Sistema 100% funcional
✅ Segurança implementada
✅ Dados reais (sem mocks)
✅ Gateway testado
✅ Shopify integrada
✅ Pronto para produção

### Próximas melhorias (não urgente):

- Code-splitting para chunks menores
- Analytics de usuários online em tempo real
- Dashboard de métricas avançado
- Testes automatizados E2E
- Documentação de API

---

**Boa sorte com o lançamento! 🚀**

_Criado pela auditoria técnica SyncAds - 2024-01-01_