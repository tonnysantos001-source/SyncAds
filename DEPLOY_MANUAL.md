# 🚀 DEPLOY MANUAL - CORREÇÃO SHOPIFY

## ⚠️ PROBLEMA ATUAL

A edge function `sync-order-to-shopify` **NÃO FOI DEPLOYADA** ainda!

Por isso está dando erro de CORS e o pedido não aparece na Shopify.

---

## ✅ SOLUÇÃO (5 MINUTOS)

### PASSO 1: Deploy da Edge Function

```bash
cd SyncAds

supabase functions deploy sync-order-to-shopify
```

**AGUARDE** até aparecer:
```
✅ Deployed Function sync-order-to-shopify
```

---

### PASSO 2: Deploy do Frontend

```bash
git add .
git commit -m "fix: corrigir sync shopify"
git push origin main
```

**AGUARDE 2 MINUTOS** - Vercel faz deploy automático

---

### PASSO 3: Limpar Pedidos Antigos

Acesse: https://supabase.com/dashboard/project/ggutzkdfsoyrzqxbjxqd/sql

Cole e execute:

```sql
BEGIN;
DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM "Order");
DELETE FROM "OrderHistory" WHERE "orderId" IN (SELECT id FROM "Order");
DELETE FROM "Order";
DELETE FROM "ShopifyOrder";
COMMIT;
```

---

### PASSO 4: Testar

1. **Fazer NOVO pedido** com dados reais
2. **Abrir Console** (F12)
3. **Verificar mensagens:**

```
✅ [UPDATE] Pedido atualizado com sucesso!
✅ [SHOPIFY] Pedido sincronizado com sucesso!
   shopifyOrderId: 123456
```

4. **Verificar Shopify:**
   - https://admin.shopify.com/store/syncads-ai/orders
   - Pedido deve aparecer com dados corretos

---

## 🔍 VERIFICAR SE FUNCIONOU

### No Console (F12):

**✅ SUCESSO:**
```
📝 [UPDATE] Atualizando pedido...
✅ [UPDATE] Pedido atualizado!
🔄 [SHOPIFY] Sincronizando pedido...
✅ [SHOPIFY] Pedido sincronizado!
```

**❌ ERRO:**
```
❌ Access to fetch at '...' has been blocked by CORS
```
→ Edge function NÃO foi deployada

---

## 📋 CHECKLIST

- [ ] Deploy edge function: `supabase functions deploy sync-order-to-shopify`
- [ ] Git push: `git push origin main`
- [ ] Aguardou 2 minutos
- [ ] Limpou pedidos antigos (SQL)
- [ ] Fez NOVO pedido com dados reais
- [ ] Verificou console (F12)
- [ ] Verificou Shopify

---

## 💡 COMANDOS RESUMIDOS

```bash
# 1. Deploy edge function
supabase functions deploy sync-order-to-shopify

# 2. Deploy frontend
git add .
git commit -m "fix: sync shopify"
git push origin main

# 3. Aguardar 2 min

# 4. Limpar pedidos (SQL no Supabase)

# 5. Testar com novo pedido
```

---

## 🆘 SE DER ERRO

### "supabase: command not found"

Instale o Supabase CLI:

```bash
npm install -g supabase
```

Depois faça login:

```bash
supabase login
```

### "Error: Failed to send request"

A edge function tem um erro de sintaxe. Execute:

```bash
supabase functions serve sync-order-to-shopify
```

Para testar localmente e ver o erro.

### "Not authenticated"

Execute:

```bash
supabase login
```

E faça login com sua conta Supabase.

---

## ⏰ TEMPO TOTAL

- Deploy edge function: 1 min
- Deploy frontend: 2 min
- Limpar SQL: 1 min
- Teste: 2 min
- **TOTAL: 6 minutos**

---

## 🎯 RESULTADO ESPERADO

### SyncAds (`/orders/all`):
- ✅ Nome: João Silva
- ✅ Email: joao@email.com
- ✅ Telefone: (11) 98765-4321
- ✅ Clique "Ver Detalhes" → tudo completo

### Shopify:
- ✅ Pedido apareceu
- ✅ Cliente: João Silva
- ✅ Email: joao@email.com
- ✅ Produtos corretos
- ✅ Tag: "syncads"

---

## 🎉 PRONTO!

Depois de seguir TODOS os passos, faça um novo pedido e verifique.

Se aparecer as mensagens de sucesso no console = **FUNCIONOU!** ✅

---

**Links úteis:**
- Supabase Functions: https://supabase.com/dashboard/project/ggutzkdfsoyrzqxbjxqd/functions
- Supabase Logs: https://supabase.com/dashboard/project/ggutzkdfsoyrzqxbjxqd/logs/edge-functions
- Vercel Deployments: https://vercel.com/tonnysantos001-source/syncads/deployments
- Shopify Orders: https://admin.shopify.com/store/syncads-ai/orders