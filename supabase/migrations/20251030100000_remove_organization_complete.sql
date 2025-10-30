-- ============================================
-- MIGRATION: REMOVER ORGANIZAÇÕES COMPLETAMENTE
-- Data: 30 de Outubro de 2025
-- Autor: Sistema SyncAds
-- Objetivo: Simplificar arquitetura removendo organizationId
-- ============================================

-- ⚠️ IMPORTANTE: BACKUP DO BANCO ANTES DE EXECUTAR!
-- Esta migration é DESTRUTIVA e NÃO PODE SER REVERTIDA facilmente

BEGIN;

-- ============================================
-- FASE 1: DESABILITAR RLS TEMPORARIAMENTE
-- ============================================
ALTER TABLE "Product" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Collection" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Kit" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Lead" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Cart" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "GatewayConfig" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Coupon" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Discount" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderBump" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Upsell" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CrossSell" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckoutCustomization" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Pixel" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "SocialProof" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Banner" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Shipping" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "PaymentDiscount" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "CheckoutRedirect" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ShippingMethod" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaGeneration" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "QuotaUsageHistory" DISABLE ROW LEVEL SECURITY;

-- ============================================
-- FASE 2: ADICIONAR COLUNA userId (se não existir)
-- ============================================

-- Produtos
ALTER TABLE "Product" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Category" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Collection" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Kit" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

-- Clientes
ALTER TABLE "Customer" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Lead" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

-- Carrinho e Pedidos
ALTER TABLE "Cart" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Order" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

-- Gateways e Transações
ALTER TABLE "GatewayConfig" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Transaction" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

-- Marketing
ALTER TABLE "Coupon" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Discount" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "OrderBump" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Upsell" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "CrossSell" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

-- Checkout
ALTER TABLE "CheckoutCustomization" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Pixel" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "SocialProof" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Banner" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "Shipping" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

-- Descontos e Redirects
ALTER TABLE "PaymentDiscount" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

ALTER TABLE "CheckoutRedirect" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

-- ShippingMethod
ALTER TABLE "ShippingMethod" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

-- Media Generation
-- MediaGeneration já tem userId, só precisa remover organizationId

-- Quota Usage
-- QuotaUsageHistory já tem userId, só precisa remover organizationId

-- ============================================
-- FASE 3: MIGRAR DADOS (se houver)
-- ============================================
-- Se existirem dados com organizationId, tentar migrar
-- (Assumindo que não há dados ou será descartado)

-- Exemplo de migração se necessário:
-- UPDATE "Product" SET "userId" = (
--   SELECT "User".id FROM "User" 
--   WHERE "User"."organizationId" = "Product"."organizationId" 
--   LIMIT 1
-- ) WHERE "userId" IS NULL;

-- ============================================
-- FASE 4: REMOVER CONSTRAINTS DE organizationId
-- ============================================

-- Produtos
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "Product_organizationId_fkey";
ALTER TABLE "Category" DROP CONSTRAINT IF EXISTS "Category_organizationId_fkey";
ALTER TABLE "Collection" DROP CONSTRAINT IF EXISTS "Collection_organizationId_fkey";
ALTER TABLE "Kit" DROP CONSTRAINT IF EXISTS "Kit_organizationId_fkey";

-- Clientes
ALTER TABLE "Customer" DROP CONSTRAINT IF EXISTS "Customer_organizationId_fkey";
ALTER TABLE "Lead" DROP CONSTRAINT IF EXISTS "Lead_organizationId_fkey";

-- Carrinho e Pedidos
ALTER TABLE "Cart" DROP CONSTRAINT IF EXISTS "Cart_organizationId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "Order_organizationId_fkey";

-- Gateways e Transações
ALTER TABLE "GatewayConfig" DROP CONSTRAINT IF EXISTS "GatewayConfig_organizationId_fkey";
ALTER TABLE "Transaction" DROP CONSTRAINT IF EXISTS "Transaction_organizationId_fkey";

-- Marketing
ALTER TABLE "Coupon" DROP CONSTRAINT IF EXISTS "Coupon_organizationId_fkey";
ALTER TABLE "Discount" DROP CONSTRAINT IF EXISTS "Discount_organizationId_fkey";
ALTER TABLE "OrderBump" DROP CONSTRAINT IF EXISTS "OrderBump_organizationId_fkey";
ALTER TABLE "Upsell" DROP CONSTRAINT IF EXISTS "Upsell_organizationId_fkey";
ALTER TABLE "CrossSell" DROP CONSTRAINT IF EXISTS "CrossSell_organizationId_fkey";

-- Checkout
ALTER TABLE "CheckoutCustomization" DROP CONSTRAINT IF EXISTS "CheckoutCustomization_organizationId_fkey";
ALTER TABLE "Pixel" DROP CONSTRAINT IF EXISTS "Pixel_organizationId_fkey";
ALTER TABLE "SocialProof" DROP CONSTRAINT IF EXISTS "SocialProof_organizationId_fkey";
ALTER TABLE "Banner" DROP CONSTRAINT IF EXISTS "Banner_organizationId_fkey";
ALTER TABLE "Shipping" DROP CONSTRAINT IF EXISTS "Shipping_organizationId_fkey";

-- Descontos e Redirects
ALTER TABLE "PaymentDiscount" DROP CONSTRAINT IF EXISTS "PaymentDiscount_organizationId_fkey";
ALTER TABLE "CheckoutRedirect" DROP CONSTRAINT IF EXISTS "CheckoutRedirect_organizationId_fkey";

-- ShippingMethod
ALTER TABLE "ShippingMethod" DROP CONSTRAINT IF EXISTS "ShippingMethod_organizationId_fkey";

-- Media Generation
ALTER TABLE "MediaGeneration" DROP CONSTRAINT IF EXISTS "MediaGeneration_organizationId_fkey";

-- Quota Usage
ALTER TABLE "QuotaUsageHistory" DROP CONSTRAINT IF EXISTS "QuotaUsageHistory_organizationId_fkey";

-- ============================================
-- FASE 5: REMOVER COLUNAS organizationId
-- ============================================

-- Produtos
ALTER TABLE "Product" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Category" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Kit" DROP COLUMN IF EXISTS "organizationId";

-- Clientes
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Lead" DROP COLUMN IF EXISTS "organizationId";

-- Carrinho e Pedidos
ALTER TABLE "Cart" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Order" DROP COLUMN IF EXISTS "organizationId";

-- Gateways e Transações
ALTER TABLE "GatewayConfig" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "organizationId";

-- Marketing
ALTER TABLE "Coupon" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Discount" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "OrderBump" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Upsell" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "CrossSell" DROP COLUMN IF EXISTS "organizationId";

-- Checkout
ALTER TABLE "CheckoutCustomization" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Pixel" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "SocialProof" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Banner" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "Shipping" DROP COLUMN IF EXISTS "organizationId";

-- Descontos e Redirects
ALTER TABLE "PaymentDiscount" DROP COLUMN IF EXISTS "organizationId";
ALTER TABLE "CheckoutRedirect" DROP COLUMN IF EXISTS "organizationId";

-- ShippingMethod
ALTER TABLE "ShippingMethod" DROP COLUMN IF EXISTS "organizationId";

-- Media Generation
ALTER TABLE "MediaGeneration" DROP COLUMN IF EXISTS "organizationId";

-- Quota Usage
ALTER TABLE "QuotaUsageHistory" DROP COLUMN IF EXISTS "organizationId";

-- ============================================
-- FASE 6: REMOVER COLUNA organizationId de User
-- ============================================
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_organizationId_fkey";
ALTER TABLE "User" DROP COLUMN IF EXISTS "organizationId";

-- ============================================
-- FASE 7: DELETAR TABELAS DE ORGANIZAÇÃO
-- ============================================

-- Remover OrganizationAiConnection primeiro (tem FK)
DROP TABLE IF EXISTS "OrganizationAiConnection" CASCADE;

-- Remover Organization
DROP TABLE IF EXISTS "Organization" CASCADE;

-- ============================================
-- FASE 8: RECRIAR RLS POLICIES (SIMPLIFICADAS)
-- ============================================

-- Product
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "product_user_all" ON "Product";
CREATE POLICY "product_user_all" ON "Product"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Category
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "category_user_all" ON "Category";
CREATE POLICY "category_user_all" ON "Category"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Collection
ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "collection_user_all" ON "Collection";
CREATE POLICY "collection_user_all" ON "Collection"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Kit
ALTER TABLE "Kit" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kit_user_all" ON "Kit";
CREATE POLICY "kit_user_all" ON "Kit"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Customer
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_user_all" ON "Customer";
CREATE POLICY "customer_user_all" ON "Customer"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Lead
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_user_all" ON "Lead";
CREATE POLICY "lead_user_all" ON "Lead"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Cart
ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cart_user_all" ON "Cart";
CREATE POLICY "cart_user_all" ON "Cart"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Order
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_user_all" ON "Order";
CREATE POLICY "order_user_all" ON "Order"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- GatewayConfig
ALTER TABLE "GatewayConfig" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "gateway_user_all" ON "GatewayConfig";
CREATE POLICY "gateway_user_all" ON "GatewayConfig"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Transaction
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "transaction_user_all" ON "Transaction";
CREATE POLICY "transaction_user_all" ON "Transaction"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Coupon
ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupon_user_all" ON "Coupon";
CREATE POLICY "coupon_user_all" ON "Coupon"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Discount
ALTER TABLE "Discount" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "discount_user_all" ON "Discount";
CREATE POLICY "discount_user_all" ON "Discount"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- OrderBump
ALTER TABLE "OrderBump" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "order_bump_user_all" ON "OrderBump";
CREATE POLICY "order_bump_user_all" ON "OrderBump"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Upsell
ALTER TABLE "Upsell" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "upsell_user_all" ON "Upsell";
CREATE POLICY "upsell_user_all" ON "Upsell"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- CrossSell
ALTER TABLE "CrossSell" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cross_sell_user_all" ON "CrossSell";
CREATE POLICY "cross_sell_user_all" ON "CrossSell"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- CheckoutCustomization
ALTER TABLE "CheckoutCustomization" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkout_customization_user_all" ON "CheckoutCustomization";
CREATE POLICY "checkout_customization_user_all" ON "CheckoutCustomization"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Pixel
ALTER TABLE "Pixel" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pixel_user_all" ON "Pixel";
CREATE POLICY "pixel_user_all" ON "Pixel"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- SocialProof
ALTER TABLE "SocialProof" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "social_proof_user_all" ON "SocialProof";
CREATE POLICY "social_proof_user_all" ON "SocialProof"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Banner
ALTER TABLE "Banner" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "banner_user_all" ON "Banner";
CREATE POLICY "banner_user_all" ON "Banner"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Shipping
ALTER TABLE "Shipping" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shipping_user_all" ON "Shipping";
CREATE POLICY "shipping_user_all" ON "Shipping"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- PaymentDiscount
ALTER TABLE "PaymentDiscount" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payment_discount_user_all" ON "PaymentDiscount";
CREATE POLICY "payment_discount_user_all" ON "PaymentDiscount"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- CheckoutRedirect
ALTER TABLE "CheckoutRedirect" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checkout_redirect_user_all" ON "CheckoutRedirect";
CREATE POLICY "checkout_redirect_user_all" ON "CheckoutRedirect"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- ShippingMethod
ALTER TABLE "ShippingMethod" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "shipping_method_user_all" ON "ShippingMethod";
CREATE POLICY "shipping_method_user_all" ON "ShippingMethod"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- MediaGeneration
ALTER TABLE "MediaGeneration" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "media_generation_user_all" ON "MediaGeneration";
CREATE POLICY "media_generation_user_all" ON "MediaGeneration"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- QuotaUsageHistory (pode ser visto por qualquer um, mas só criado pelo próprio user)
ALTER TABLE "QuotaUsageHistory" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quota_usage_user_all" ON "QuotaUsageHistory";
CREATE POLICY "quota_usage_user_all" ON "QuotaUsageHistory"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- ============================================
-- FASE 9: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

-- Indices em userId para melhor performance
CREATE INDEX IF NOT EXISTS idx_product_user_id ON "Product"("userId");
CREATE INDEX IF NOT EXISTS idx_category_user_id ON "Category"("userId");
CREATE INDEX IF NOT EXISTS idx_collection_user_id ON "Collection"("userId");
CREATE INDEX IF NOT EXISTS idx_kit_user_id ON "Kit"("userId");
CREATE INDEX IF NOT EXISTS idx_customer_user_id ON "Customer"("userId");
CREATE INDEX IF NOT EXISTS idx_lead_user_id ON "Lead"("userId");
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON "Cart"("userId");
CREATE INDEX IF NOT EXISTS idx_order_user_id ON "Order"("userId");
CREATE INDEX IF NOT EXISTS idx_gateway_config_user_id ON "GatewayConfig"("userId");
CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS idx_coupon_user_id ON "Coupon"("userId");
CREATE INDEX IF NOT EXISTS idx_discount_user_id ON "Discount"("userId");
CREATE INDEX IF NOT EXISTS idx_order_bump_user_id ON "OrderBump"("userId");
CREATE INDEX IF NOT EXISTS idx_upsell_user_id ON "Upsell"("userId");
CREATE INDEX IF NOT EXISTS idx_cross_sell_user_id ON "CrossSell"("userId");
CREATE INDEX IF NOT EXISTS idx_checkout_customization_user_id ON "CheckoutCustomization"("userId");
CREATE INDEX IF NOT EXISTS idx_pixel_user_id ON "Pixel"("userId");
CREATE INDEX IF NOT EXISTS idx_social_proof_user_id ON "SocialProof"("userId");
CREATE INDEX IF NOT EXISTS idx_banner_user_id ON "Banner"("userId");
CREATE INDEX IF NOT EXISTS idx_shipping_user_id ON "Shipping"("userId");
CREATE INDEX IF NOT EXISTS idx_payment_discount_user_id ON "PaymentDiscount"("userId");
CREATE INDEX IF NOT EXISTS idx_checkout_redirect_user_id ON "CheckoutRedirect"("userId");
CREATE INDEX IF NOT EXISTS idx_shipping_method_user_id ON "ShippingMethod"("userId");
CREATE INDEX IF NOT EXISTS idx_media_generation_user_id ON "MediaGeneration"("userId");
CREATE INDEX IF NOT EXISTS idx_quota_usage_user_id ON "QuotaUsageHistory"("userId");

-- ============================================
-- FASE 10: LOG DE SUCESSO
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ MIGRATION CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '📊 Organizações removidas completamente';
  RAISE NOTICE '🔒 RLS Policies atualizadas para userId';
  RAISE NOTICE '⚡ Índices criados para performance';
  RAISE NOTICE '🎯 Sistema simplificado: Super Admin + Usuários';
END $$;

COMMIT;

