# 🧪 TESTAR INTEGRAÇÃO SHOPIFY - GUIA RÁPIDO

## ✅ CONFIGURAÇÕES CONCLUÍDAS

- ✅ Credenciais configuradas no Supabase
- ✅ SHOPIFY_API_KEY: daa699d0ff94bbf92516a58b9ef21810
- ✅ SHOPIFY_API_SECRET: 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
- ✅ REDIRECT_URI: https://syncads-dun.vercel.app/integrations/callback
- ✅ Edge Functions deployadas (3)
- ✅ Callback page configurada

## 🚀 COMO TESTAR AGORA

### OPÇÃO 1: Com loja Shopify real (se você tem)

1. Acesse: https://syncads-dun.vercel.app
2. Faça login no painel
3. Vá em **Integrações**
4. Encontre **Shopify**
5. Clique em **Conectar**
6. Digite o nome da sua loja (ex: minha-loja)
   - Sem .myshopify.com
7. Será redirecionado para Shopify
8. Clique em **"Install app"**
9. Aguarde redirect de volta
10. ✅ Pronto! Produtos sincronizados!

### OPÇÃO 2: Criar loja de desenvolvimento Shopify

Se você não tem loja, crie uma grátis:

1. Acesse: https://partners.shopify.com
2. Menu lateral > **Stores**
3. Clique em **"Add store"** > **"Development store"**
4. Preencha:
   - Store name: `syncads-test`
   - Store purpose: `Test an app or theme`
5. Clique em **"Create development store"**
6. Aguarde criação (1-2 minutos)
7. Sua loja estará em: `syncads-test.myshopify.com`
8. Agora siga os passos da **OPÇÃO 1** usando `syncads-test`

## 🔍 VERIFICAR SE FUNCIONOU

### No Supabase SQL Editor:

```sql
-- Ver integração criada
SELECT * FROM "ShopifyIntegration" WHERE "isActive" = true;

-- Ver produtos sincronizados
SELECT COUNT(*) as total FROM "ShopifyProduct";

-- Ver pedidos
SELECT COUNT(*) as total FROM "ShopifyOrder";

-- Ver últimos logs de sync
SELECT * FROM "ShopifySyncLog" ORDER BY "createdAt" DESC LIMIT 5;
```

### No Dashboard do seu painel:

1. Vá em **Integrações**
2. O card do Shopify deve mostrar **switch ativado** ✅
3. Deve aparecer o nome da loja conectada

## ⚠️ SE DER ERRO

### Erro: "Invalid OAuth request"
**Causa:** Redirect URI não coincide
**Solução:** Verifique no Shopify Partners se está exatamente:
```
https://syncads-dun.vercel.app/integrations/callback
```

### Erro: "App not installed"
**Causa:** App não foi aprovado
**Solução:** No Shopify Partners, vá no seu app e clique em "Install app" na loja de teste

### Erro: "Missing permissions"
**Causa:** Faltam scopes
**Solução:** No Shopify Partners, adicione os scopes:
```
read_products, write_products, read_orders, write_orders, 
read_customers, write_customers, read_checkouts
```

## 📊 DADOS QUE SERÃO SINCRONIZADOS

Após conectar, automaticamente será sincronizado:

- ✅ Até 250 produtos (com imagens, variantes, preços)
- ✅ Até 250 pedidos (com status, cliente, valores)
- ✅ Até 250 clientes (com emails, telefones)
- ✅ Carrinhos abandonados
- ✅ Webhooks configurados para updates em tempo real

## 🎯 PRÓXIMOS PASSOS APÓS TESTAR

1. ✅ Confirmar que produtos aparecem no banco
2. ✅ Testar criação de pedido
3. ✅ Verificar webhooks funcionando
4. ✅ Documentar para clientes finais

## 💡 DICA PRO

Se quiser ver os logs em tempo real:

```bash
# No terminal
supabase functions logs shopify-oauth --project-ref ovskepqggmxlfckxqgbr
```

Isso mostra tudo que acontece durante o OAuth e sync!

---

**Tudo configurado! Agora é só testar! 🚀**
