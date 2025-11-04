-- ============================================
-- SCRIPT PARA LIMPAR TODOS OS PEDIDOS DE TESTE
-- ============================================
--
-- ⚠️ ATENÇÃO: Este script remove TODOS os pedidos
-- Use com cuidado!
--
-- Execute este script no Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- ============================================

BEGIN;

-- 1. Deletar OrderItems (itens dos pedidos)
-- Precisa ser deletado primeiro por causa da Foreign Key
DELETE FROM "OrderItem"
WHERE "orderId" IN (
  SELECT id FROM "Order"
);

-- 2. Deletar OrderHistory (histórico dos pedidos)
DELETE FROM "OrderHistory"
WHERE "orderId" IN (
  SELECT id FROM "Order"
);

-- 3. Deletar Orders (pedidos principais)
DELETE FROM "Order";

-- 4. Deletar ShopifyOrders (pedidos sincronizados da Shopify)
DELETE FROM "ShopifyOrder";

-- 5. Resetar sequências (se houver)
-- ALTER SEQUENCE "Order_id_seq" RESTART WITH 1;

COMMIT;

-- ============================================
-- VERIFICAR SE FOI LIMPO
-- ============================================

SELECT
  (SELECT COUNT(*) FROM "Order") as total_orders,
  (SELECT COUNT(*) FROM "OrderItem") as total_items,
  (SELECT COUNT(*) FROM "OrderHistory") as total_history,
  (SELECT COUNT(*) FROM "ShopifyOrder") as total_shopify_orders;

-- Resultado esperado: todas as contagens devem ser 0

-- ============================================
-- CASO PRECISE DELETAR APENAS PEDIDOS DE TESTE
-- (descomente as linhas abaixo e comente as de cima)
-- ============================================

/*
BEGIN;

-- Deletar apenas pedidos com email de teste
DELETE FROM "OrderItem"
WHERE "orderId" IN (
  SELECT id FROM "Order"
  WHERE "customerEmail" LIKE '%nao-informado@syncads.com.br%'
     OR "customerEmail" LIKE '%test%'
     OR "customerEmail" LIKE '%teste%'
     OR "customerName" ILIKE '%cliente%'
);

DELETE FROM "OrderHistory"
WHERE "orderId" IN (
  SELECT id FROM "Order"
  WHERE "customerEmail" LIKE '%nao-informado@syncads.com.br%'
     OR "customerEmail" LIKE '%test%'
     OR "customerEmail" LIKE '%teste%'
     OR "customerName" ILIKE '%cliente%'
);

DELETE FROM "Order"
WHERE "customerEmail" LIKE '%nao-informado@syncads.com.br%'
   OR "customerEmail" LIKE '%test%'
   OR "customerEmail" LIKE '%teste%'
   OR "customerName" ILIKE '%cliente%';

COMMIT;
*/

-- ============================================
-- FIM DO SCRIPT
-- ============================================
