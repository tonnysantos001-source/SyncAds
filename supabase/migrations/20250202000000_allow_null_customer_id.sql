-- ============================================
-- Migration: Allow NULL customerId in Order
-- ============================================
--
-- Permite que pedidos sejam criados sem cliente
-- vinculado inicialmente (para checkout Shopify)
--
-- ============================================

BEGIN;

-- 1. Remover constraint NOT NULL de customerId
ALTER TABLE "Order"
ALTER COLUMN "customerId" DROP NOT NULL;

-- 2. Atualizar a foreign key constraint para permitir SET NULL
-- Primeiro, precisamos remover a constraint existente
ALTER TABLE "Order"
DROP CONSTRAINT IF EXISTS "Order_customerId_fkey";

-- Recriar com SET NULL
ALTER TABLE "Order"
ADD CONSTRAINT "Order_customerId_fkey"
FOREIGN KEY ("customerId")
REFERENCES "Customer"(id)
ON DELETE SET NULL;

-- 3. Criar índice para melhorar performance em queries com customerId NULL
CREATE INDEX IF NOT EXISTS "idx_Order_customerId_null"
ON "Order" ("customerId")
WHERE "customerId" IS NULL;

-- 4. Comentário explicativo
COMMENT ON COLUMN "Order"."customerId" IS
'Customer ID - NULL permitido para pedidos temporários do checkout. Será preenchido após o cliente se cadastrar.';

COMMIT;
