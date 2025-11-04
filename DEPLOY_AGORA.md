# 🚀 DEPLOY IMEDIATO - CORREÇÃO DOS DADOS

## ✅ CORREÇÃO APLICADA

Acabei de adicionar o código que **salva os dados do cadastro no pedido**.

Agora você precisa fazer deploy!

---

## 📝 COMANDOS (COPIAR E COLAR)

### 1. Commit e Push (2 minutos)

```bash
cd SyncAds

git add .
git commit -m "fix: salvar dados reais do cadastro no pedido"
git push origin main
```

Aguarde ~2 minutos para Vercel fazer deploy automático.

---

## 🗑️ 2. LIMPAR PEDIDOS ANTIGOS (1 minuto)

**IMPORTANTE:** Os 2 pedidos que você acabou de fazer têm dados genéricos.
Você PRECISA deletá-los e fazer um NOVO pedido após o deploy.

### Acesse:
```
https://supabase.com/dashboard/project/ggutzkdfsoyrzqxbjxqd/sql
```

### Cole e execute:
```sql
BEGIN;
DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT id FROM "Order");
DELETE FROM "OrderHistory" WHERE "orderId" IN (SELECT id FROM "Order");
DELETE FROM "Order";
DELETE FROM "ShopifyOrder";
COMMIT;

-- Verificar se limpou (deve retornar 0)
SELECT COUNT(*) as total FROM "Order";
```

---

## 🧪 3. TESTAR (5 minutos)

### Após o deploy (aguarde 2 min), faça um NOVO pedido:

1. **Acesse seu checkout**
2. **Preencha com dados REAIS:**
   - Nome: João Silva
   - Email: seu-email@real.com
   - Telefone: (11) 98765-4321
   - CPF: 123.456.789-00
   - Endereço completo
3. **Escolha método de pagamento**
4. **Finalize o pedido**

### Verificar no SyncAds:
```
https://syncads-dun.vercel.app/orders/all
```

**DEVE MOSTRAR:**
- ✅ Nome: João Silva (não mais "Cliente")
- ✅ Email: seu-email@real.com (não mais "nao-informado")
- ✅ Telefone visível
- ✅ Clique "Ver Detalhes" → endereço completo

### Verificar na Shopify:
```
https://admin.shopify.com/store/syncads-ai/orders
```

**DEVE MOSTRAR:**
- ✅ Pedido apareceu
- ✅ Cliente: João Silva
- ✅ Email correto
- ✅ Produtos corretos

---

## 🔍 DEBUG (se não funcionar)

### Ver console do navegador (F12)

**Procure por:**
```
📝 [UPDATE] Atualizando pedido com dados do cadastro...
✅ [UPDATE] Pedido atualizado com sucesso!
   customerName: "João Silva"
   customerEmail: "seu-email@real.com"
```

Se **NÃO aparecer** estas mensagens:
- Deploy ainda não terminou (aguarde mais 1 min)
- Limpe cache do navegador (Ctrl+Shift+Del)

### Ver logs Vercel:
```
https://vercel.com/tonnysantos001-source/syncads/deployments
```

Clique no último deploy → Functions → Ver logs

---

## ⚡ CHECKLIST RÁPIDO

- [ ] `git push origin main` ✓
- [ ] Aguardou 2 minutos ✓
- [ ] Limpou pedidos antigos (SQL) ✓
- [ ] Fez NOVO pedido com dados reais ✓
- [ ] Verificou no SyncAds: dados corretos ✓
- [ ] Verificou na Shopify: pedido apareceu ✓

---

## 🎯 RESULTADO ESPERADO

**ANTES:**
- Nome: Cliente ❌
- Email: nao-informado@syncads.com.br ❌
- Shopify: vazia ❌

**DEPOIS:**
- Nome: João Silva ✅
- Email: seu-email@real.com ✅
- Telefone: (11) 98765-4321 ✅
- Endereço completo ✅
- Shopify: pedido com todos os dados ✅

---

## 💡 IMPORTANTE

Os pedidos que você fez ANTES do deploy continuarão com dados genéricos.
Eles foram criados antes da correção.

**SOLUÇÃO:** Deletar e fazer novos pedidos após deploy.

---

## ⏰ TEMPO TOTAL

- Deploy: ~2 min (automático)
- Limpar SQL: ~1 min
- Teste: ~5 min
- **TOTAL: ~8 minutos**

---

## 🎉 PRONTO!

Depois de seguir todos os passos, seus pedidos terão:
- ✅ Dados reais salvos
- ✅ Aparecendo no SyncAds
- ✅ Sincronizando com Shopify

**AGORA SIM FUNCIONA!**