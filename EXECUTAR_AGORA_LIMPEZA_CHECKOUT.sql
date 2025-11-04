-- ============================================
-- SCRIPT DE LIMPEZA E CONFIGURAÇÃO DO CHECKOUT
-- SyncAds - Preparação para Produção
-- ============================================
-- Data: Janeiro 2025
-- Objetivo: Limpar pedidos pendentes e preparar sistema para produção
-- ============================================

-- ATENÇÃO: Execute este script em horário de baixo movimento
-- Recomendado: Fazer backup antes de executar

BEGIN;

-- ============================================
-- PARTE 1: ANÁLISE DO ESTADO ATUAL
-- ============================================

-- Verificar pedidos pendentes
SELECT
  'ANÁLISE: Pedidos Pendentes' as status,
  COUNT(*) as total,
  COUNT(CASE WHEN "createdAt" < NOW() - INTERVAL '24 hours' THEN 1 END) as mais_24h,
  COUNT(CASE WHEN "createdAt" < NOW() - INTERVAL '1 hour' THEN 1 END) as mais_1h,
  COUNT(CASE WHEN "createdAt" < NOW() - INTERVAL '30 minutes' THEN 1 END) as mais_30min,
  SUM(total) as valor_total
FROM "Order"
WHERE "paymentStatus" = 'PENDING';

-- Verificar carrinhos abandonados
SELECT
  'ANÁLISE: Carrinhos Abandonados' as status,
  COUNT(*) as total,
  COUNT(CASE WHEN "recoveryAttempts" = 0 THEN 1 END) as sem_tentativa,
  COUNT(CASE WHEN "recoveredAt" IS NOT NULL THEN 1 END) as recuperados
FROM "AbandonedCart";

-- Verificar gateways sem webhook
SELECT
  'ANÁLISE: Gateways sem Webhook' as status,
  COUNT(*) as total,
  string_agg(g.name, ', ') as gateways
FROM "GatewayConfig" gc
JOIN "Gateway" g ON gc."gatewayId" = g.id
WHERE gc."isActive" = true
  AND (gc."webhookUrl" IS NULL OR gc."webhookUrl" = '');

-- ============================================
-- PARTE 2: LIMPEZA DE PEDIDOS PENDENTES
-- ============================================

-- Cancelar pedidos pendentes com mais de 30 minutos
UPDATE "Order"
SET
  "paymentStatus" = 'CANCELLED',
  "status" = 'CANCELLED',
  "updatedAt" = NOW(),
  "notes" = COALESCE("notes" || E'\n\n', '') ||
            'Cancelado automaticamente: timeout de pagamento (30 minutos). ' ||
            'Data original: ' || "createdAt"::text
WHERE "paymentStatus" = 'PENDING'
  AND "createdAt" < NOW() - INTERVAL '30 minutes';

-- Obter IDs dos pedidos cancelados para adicionar histórico
WITH cancelled_orders AS (
  SELECT id, "userId", "orderNumber", "createdAt"
  FROM "Order"
  WHERE "paymentStatus" = 'CANCELLED'
    AND "status" = 'CANCELLED'
    AND "updatedAt" >= NOW() - INTERVAL '1 minute'
)
INSERT INTO "OrderHistory" (
  id,
  "orderId",
  "userId",
  action,
  "fromStatus",
  "toStatus",
  notes,
  metadata,
  "createdAt"
)
SELECT
  gen_random_uuid(),
  id,
  "userId",
  'ORDER_AUTO_CANCELLED',
  'PENDING',
  'CANCELLED',
  'Pedido cancelado automaticamente após timeout de pagamento',
  jsonb_build_object(
    'cancelledBy', 'system',
    'reason', 'payment_timeout',
    'duration', '30_minutes',
    'automatedAction', true,
    'originalCreatedAt', "createdAt"
  ),
  NOW()
FROM cancelled_orders;

-- ============================================
-- PARTE 3: LIMPAR TRANSAÇÕES ÓRFÃS
-- ============================================

-- Cancelar transações pendentes de pedidos cancelados
UPDATE "Transaction"
SET
  status = 'CANCELLED',
  "updatedAt" = NOW(),
  "failureReason" = 'Pedido cancelado automaticamente'
WHERE status IN ('PENDING', 'PROCESSING')
  AND "orderId" IN (
    SELECT id FROM "Order"
    WHERE "paymentStatus" = 'CANCELLED'
  );

-- ============================================
-- PARTE 4: ATUALIZAR MÉTRICAS DE CLIENTES
-- ============================================

-- Recalcular totais de clientes baseado em pedidos pagos
UPDATE "Customer" c
SET
  "totalOrders" = COALESCE(stats.total_orders, 0),
  "totalSpent" = COALESCE(stats.total_spent, 0),
  "averageOrderValue" = COALESCE(stats.avg_order, 0),
  "lastOrderAt" = stats.last_order,
  "updatedAt" = NOW()
FROM (
  SELECT
    o."customerId",
    COUNT(*) as total_orders,
    SUM(o.total) as total_spent,
    AVG(o.total) as avg_order,
    MAX(o."createdAt") as last_order
  FROM "Order" o
  WHERE o."paymentStatus" = 'PAID'
    AND o."customerId" IS NOT NULL
  GROUP BY o."customerId"
) stats
WHERE c.id = stats."customerId";

-- Zerar métricas de clientes sem pedidos pagos
UPDATE "Customer"
SET
  "totalOrders" = 0,
  "totalSpent" = 0,
  "averageOrderValue" = 0,
  "lastOrderAt" = NULL,
  "updatedAt" = NOW()
WHERE id NOT IN (
  SELECT DISTINCT "customerId"
  FROM "Order"
  WHERE "paymentStatus" = 'PAID'
    AND "customerId" IS NOT NULL
) AND "totalOrders" > 0;

-- ============================================
-- PARTE 5: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice para consultas de pedidos por status e data
CREATE INDEX IF NOT EXISTS idx_order_payment_status_created
ON "Order" ("paymentStatus", "createdAt" DESC);

-- Índice para consultas de pedidos por usuário
CREATE INDEX IF NOT EXISTS idx_order_user_status
ON "Order" ("userId", "paymentStatus", "createdAt" DESC);

-- Índice para consultas de transações por status
CREATE INDEX IF NOT EXISTS idx_transaction_status_created
ON "Transaction" (status, "createdAt" DESC);

-- Índice para transações por pedido
CREATE INDEX IF NOT EXISTS idx_transaction_order
ON "Transaction" ("orderId", status);

-- Índice para carrinhos abandonados por data
CREATE INDEX IF NOT EXISTS idx_abandoned_cart_recovery
ON "AbandonedCart" ("recoveryAttempts", "recoveredAt", "abandonedAt");

-- Índice para busca de pedidos por cliente
CREATE INDEX IF NOT EXISTS idx_order_customer
ON "Order" ("customerId", "paymentStatus");

-- Índice para histórico de pedidos
CREATE INDEX IF NOT EXISTS idx_order_history_order
ON "OrderHistory" ("orderId", "createdAt" DESC);

-- Índice para busca de produtos
CREATE INDEX IF NOT EXISTS idx_product_user_status
ON "Product" ("userId", "status", "isActive");

-- Índice para itens do carrinho
CREATE INDEX IF NOT EXISTS idx_cart_item_cart
ON "CartItem" ("cartId");

-- ============================================
-- PARTE 6: LIMPAR CARRINHOS ANTIGOS
-- ============================================

-- Deletar itens de carrinhos vazios com mais de 7 dias
DELETE FROM "CartItem"
WHERE "cartId" IN (
  SELECT id FROM "Cart"
  WHERE "createdAt" < NOW() - INTERVAL '7 days'
    AND id NOT IN (SELECT "cartId" FROM "AbandonedCart")
);

-- Deletar carrinhos vazios com mais de 7 dias
DELETE FROM "Cart"
WHERE "createdAt" < NOW() - INTERVAL '7 days'
  AND id NOT IN (SELECT "cartId" FROM "CartItem")
  AND id NOT IN (SELECT "cartId" FROM "AbandonedCart")
  AND id NOT IN (SELECT "cartId" FROM "Order" WHERE "cartId" IS NOT NULL);

-- Marcar carrinhos abandonados antigos como expirados
UPDATE "AbandonedCart"
SET
  "recoveryAttempts" = 999,
  metadata = COALESCE(metadata, '{}'::jsonb) ||
             jsonb_build_object('expired', true, 'expiredAt', NOW())
WHERE "recoveredAt" IS NULL
  AND "abandonedAt" < NOW() - INTERVAL '30 days'
  AND "recoveryAttempts" < 999;

-- ============================================
-- PARTE 7: RELATÓRIO FINAL
-- ============================================

-- Resumo das alterações
SELECT
  'RESULTADO: Pedidos Cancelados (agora)' as acao,
  COUNT(*) as quantidade,
  SUM(total) as valor_total
FROM "Order"
WHERE "paymentStatus" = 'CANCELLED'
  AND "updatedAt" >= NOW() - INTERVAL '5 minutes'
UNION ALL
SELECT
  'RESULTADO: Pedidos Ativos (PENDING)' as acao,
  COUNT(*) as quantidade,
  SUM(total) as valor_total
FROM "Order"
WHERE "paymentStatus" = 'PENDING'
UNION ALL
SELECT
  'RESULTADO: Pedidos Pagos' as acao,
  COUNT(*) as quantidade,
  SUM(total) as valor_total
FROM "Order"
WHERE "paymentStatus" = 'PAID'
UNION ALL
SELECT
  'RESULTADO: Total de Pedidos' as acao,
  COUNT(*) as quantidade,
  SUM(total) as valor_total
FROM "Order";

-- Status de gateways
SELECT
  'RESULTADO: Gateways Ativos' as acao,
  COUNT(*) as quantidade,
  0 as valor_total
FROM "GatewayConfig"
WHERE "isActive" = true
UNION ALL
SELECT
  'RESULTADO: Gateways com Webhook' as acao,
  COUNT(*) as quantidade,
  0 as valor_total
FROM "GatewayConfig"
WHERE "isActive" = true
  AND "webhookUrl" IS NOT NULL
  AND "webhookUrl" != '';

-- Status de carrinhos abandonados
SELECT
  'RESULTADO: Carrinhos Recuperáveis' as categoria,
  COUNT(*) FILTER (WHERE "recoveredAt" IS NULL AND "recoveryAttempts" < 3) as recuperaveis,
  COUNT(*) FILTER (WHERE "recoveredAt" IS NOT NULL) as recuperados,
  COUNT(*) FILTER (WHERE "recoveryAttempts" >= 3 AND "recoveredAt" IS NULL) as perdidos,
  0 as total
FROM "AbandonedCart";

-- ============================================
-- PARTE 8: VALIDAÇÕES FINAIS
-- ============================================

-- Verificar se há pedidos pagos sem transação
SELECT
  'ALERTA: Pedidos pagos sem transação' as alerta,
  COUNT(*) as quantidade,
  string_agg("orderNumber", ', ') as pedidos
FROM "Order" o
WHERE o."paymentStatus" = 'PAID'
  AND NOT EXISTS (
    SELECT 1 FROM "Transaction" t
    WHERE t."orderId" = o.id
    AND t.status = 'PAID'
  );

-- Verificar transações pagas sem pedido pago
SELECT
  'ALERTA: Transações pagas com pedido não-pago' as alerta,
  COUNT(*) as quantidade
FROM "Transaction" t
JOIN "Order" o ON t."orderId" = o.id
WHERE t.status = 'PAID'
  AND o."paymentStatus" != 'PAID';

-- Verificar pedidos sem userId
SELECT
  'ALERTA: Pedidos sem userId' as alerta,
  COUNT(*) as quantidade,
  string_agg("orderNumber", ', ') as pedidos
FROM "Order"
WHERE "userId" IS NULL;

-- ============================================
-- FIM DO SCRIPT
-- ============================================

COMMIT;

-- Mensagem final
SELECT
  '✅ LIMPEZA CONCLUÍDA COM SUCESSO!' as status,
  NOW() as executado_em,
  'Verifique os relatórios acima para detalhes' as proximos_passos;

-- ============================================
-- ESTATÍSTICAS FINAIS
-- ============================================

SELECT
  '📊 ESTATÍSTICAS FINAIS' as titulo,
  (SELECT COUNT(*) FROM "Order") as total_pedidos,
  (SELECT COUNT(*) FROM "Order" WHERE "paymentStatus" = 'PAID') as pagos,
  (SELECT COUNT(*) FROM "Order" WHERE "paymentStatus" = 'PENDING') as pendentes,
  (SELECT COUNT(*) FROM "Order" WHERE "paymentStatus" = 'CANCELLED') as cancelados,
  (SELECT COUNT(*) FROM "Customer") as total_clientes,
  (SELECT COUNT(*) FROM "Product") as total_produtos,
  (SELECT COUNT(*) FROM "GatewayConfig" WHERE "isActive" = true) as gateways_ativos;
