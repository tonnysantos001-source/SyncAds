-- Migration: Adicionar campos avançados na tabela ShippingMethod
-- Criado em: 2026-06-20

ALTER TABLE "ShippingMethod"
  ADD COLUMN IF NOT EXISTS "minOrderValue" NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "estimatedDaysMin" INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "estimatedDaysMax" INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS "isBusinessDays" BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS "price" NUMERIC(10,2) DEFAULT 0;

COMMENT ON COLUMN "ShippingMethod"."minOrderValue" IS 'Valor mínimo de pedido para habilitar este frete';
COMMENT ON COLUMN "ShippingMethod"."estimatedDaysMin" IS 'Prazo mínimo estimado de entrega em dias';
COMMENT ON COLUMN "ShippingMethod"."estimatedDaysMax" IS 'Prazo máximo estimado de entrega em dias';
COMMENT ON COLUMN "ShippingMethod"."isBusinessDays" IS 'Se o prazo de entrega é em dias úteis (true) ou corridos (false)';
COMMENT ON COLUMN "ShippingMethod"."price" IS 'Preço do frete';
