-- ============================================
-- MIGRATION: Permitir shippingAddress NULL
-- Data: 2025-02-03
-- Motivo: Pedidos de preview do checkout não têm endereço até o cliente preencher
-- ============================================

-- Permitir NULL em shippingAddress para pedidos em preview/rascunho
ALTER TABLE "Order"
ALTER COLUMN "shippingAddress" DROP NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN "Order"."shippingAddress" IS 'Endereço de entrega (JSON). Pode ser NULL para pedidos em preview/rascunho';

-- Índice para buscar pedidos sem endereço (útil para limpeza)
CREATE INDEX IF NOT EXISTS idx_order_no_shipping
ON "Order"("shippingAddress")
WHERE "shippingAddress" IS NULL;

-- ============================================
-- VERIFICAÇÃO
-- ============================================
-- Após aplicar esta migration, pedidos podem ser criados sem shippingAddress
-- Exemplo:
-- INSERT INTO "Order" (
--   "organizationId", "orderNumber", "customerId",
--   "customerEmail", "customerName",
--   "items", "subtotal", "total", "paymentMethod"
-- ) VALUES (
--   '...', 'ORDER-001', '...',
--   'cliente@email.com', 'Cliente Teste',
--   '[]'::jsonb, 0, 0, 'PENDING'
-- );
