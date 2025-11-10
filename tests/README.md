# Testes - SyncAds

Este diretório contém scripts de teste end-to-end para validar funcionalidades do SyncAds.

## Teste de Pedido com Frete

### Arquivo: `test-order-with-shipping.ts`

Este teste valida todo o fluxo de criação de pedido com aplicação de frete:

**O que o teste faz:**
1. Autentica o usuário
2. Verifica/cria métodos de frete (Frete Grátis, PAC, SEDEX)
3. Cria um produto de teste
4. Cria um cliente de teste
5. Cria um pedido aplicando frete
6. Valida os cálculos (subtotal + frete = total)
7. Verifica o pedido no banco de dados
8. (Opcional) Limpa os dados de teste

### Como executar:

1. **Configurar credenciais**
   
   Edite o arquivo `test-order-with-shipping.ts` e altere as credenciais de autenticação:
   
   ```typescript
   const user = await authenticateUser(
     'seu-email@example.com', // ALTERE AQUI
     'sua-senha' // ALTERE AQUI
   );
   ```

2. **Executar o teste**
   
   ```bash
   cd SyncAds
   npx tsx tests/test-order-with-shipping.ts
   ```

3. **Interpretar resultados**
   
   O teste exibirá logs detalhados de cada etapa:
   - ✅ = Sucesso
   - ❌ = Erro
   
   Ao final, você verá um resumo com validações dos cálculos.

### Estrutura do Teste

```
🚀 Iniciando teste
├── 🔐 Autenticação
├── 📦 Verificação de métodos de frete
├── 🛍️ Criação de produto
├── 👤 Criação de cliente
├── 🛒 Criação de pedido com frete
├── 🔍 Verificação do pedido
├── ✨ Validações
└── 🧹 Limpeza (opcional)
```

### Limpeza de Dados

Por padrão, a limpeza está **comentada** para permitir inspeção manual dos dados criados.

Para ativar a limpeza automática, descomente a linha:

```typescript
await cleanup(product.id, customer.id, orderResult.orderId);
```

### Troubleshooting

**Erro de autenticação:**
- Verifique se o email e senha estão corretos
- Verifique se o usuário existe no banco de dados

**Erro ao criar métodos de frete:**
- Verifique se a tabela `ShippingMethod` existe
- Verifique as políticas RLS da tabela

**Erro ao criar pedido:**
- Verifique se a tabela `Order` possui os campos: `shipping`, `shippingCarrier`, `shippingAddress`
- Verifique as políticas RLS da tabela `Order`

### Verificação Manual

Após executar o teste, você pode verificar os dados criados diretamente no Supabase:

```sql
-- Ver métodos de frete
SELECT * FROM "ShippingMethod" WHERE "userId" = 'seu-user-id';

-- Ver pedido criado
SELECT 
  id, 
  subtotal, 
  shipping, 
  total, 
  "shippingCarrier",
  status 
FROM "Order" 
WHERE id = 'order-id-do-teste';
```

## Próximos Testes

Outros testes que podem ser adicionados:
- Teste de cálculo de frete por peso
- Teste de frete por valor mínimo
- Teste de frete grátis acima de X valor
- Teste de múltiplos métodos de entrega
- Teste de endereços em diferentes regiões