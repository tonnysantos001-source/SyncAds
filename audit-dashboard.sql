-- ============================================
-- AUDITORIA COMPLETA - DASHBOARD DATA
-- ============================================

-- 1. Verificar estrutura da tabela Order
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'Order'
ORDER BY ordinal_position;

-- 2. Verificar se existe userId ou organizationId
SELECT 
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'userId') as has_userid,
  EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'organizationId') as has_orgid;

-- 3. Ver pedidos recentes (últimos 5)
SELECT 
  id,
  "orderNumber",
  "paymentStatus",
  total,
  "createdAt",
  CASE 
    WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'userId') 
    THEN "userId"::text
    ELSE NULL
  END as user_id_field
FROM "Order"
ORDER BY "createdAt" DESC
LIMIT 5;

-- 4. Contar pedidos por status
SELECT 
  "paymentStatus",
  COUNT(*) as total,
  SUM(CAST(total AS DECIMAL)) as revenue
FROM "Order"
GROUP BY "paymentStatus";

-- 5. Verificar estrutura da tabela Cart
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'Cart'
ORDER BY ordinal_position;

-- 6. Contar carrinhos
SELECT 
  COUNT(*) as total_carts,
  COUNT(CASE WHEN "completedAt" IS NOT NULL THEN 1 END) as completed_carts,
  COUNT(CASE WHEN "completedAt" IS NULL THEN 1 END) as abandoned_carts
FROM "Cart";

-- 7. Verificar tabela Transaction
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_name = 'Transaction'
ORDER BY ordinal_position;

-- 8. Ver últimas transações
SELECT 
  id,
  status,
  amount,
  "paymentMethod",
  "createdAt"
FROM "Transaction"
ORDER BY "createdAt" DESC
LIMIT 5;
