-- ============================================
-- MIGRATION: REMOVER ORGANIZAÇÕES (VERSÃO FINAL)
-- Data: 30 de Outubro de 2025
-- Ordem correta: Remove policies → Remove colunas → Cria novas policies
-- ============================================

BEGIN;

-- ============================================
-- FASE 1: REMOVER TODAS AS POLICIES ANTIGAS
-- ============================================

-- Product e relacionados
DROP POLICY IF EXISTS "org_product_all" ON "Product";
DROP POLICY IF EXISTS "org_variant_all" ON "ProductVariant";
DROP POLICY IF EXISTS "org_image_all" ON "ProductImage";
DROP POLICY IF EXISTS "product_org_all" ON "Product";
DROP POLICY IF EXISTS "product_organization_all" ON "Product";

-- Category
DROP POLICY IF EXISTS "org_category_all" ON "Category";
DROP POLICY IF EXISTS "category_org_all" ON "Category";

-- Collection
DROP POLICY IF EXISTS "org_collection_all" ON "Collection";
DROP POLICY IF EXISTS "collection_org_all" ON "Collection";

-- Kit
DROP POLICY IF EXISTS "org_kit_all" ON "Kit";
DROP POLICY IF EXISTS "kit_org_all" ON "Kit";

-- Customer
DROP POLICY IF EXISTS "org_customer_all" ON "Customer";
DROP POLICY IF EXISTS "customer_org_all" ON "Customer";

-- Lead
DROP POLICY IF EXISTS "org_lead_all" ON "Lead";
DROP POLICY IF EXISTS "lead_org_all" ON "Lead";

-- Cart
DROP POLICY IF EXISTS "org_cart_all" ON "Cart";
DROP POLICY IF EXISTS "cart_org_all" ON "Cart";

-- Order
DROP POLICY IF EXISTS "org_order_all" ON "Order";
DROP POLICY IF EXISTS "order_org_all" ON "Order";

-- GatewayConfig
DROP POLICY IF EXISTS "org_gateway_all" ON "GatewayConfig";
DROP POLICY IF EXISTS "gateway_org_all" ON "GatewayConfig";

-- Transaction
DROP POLICY IF EXISTS "org_transaction_all" ON "Transaction";
DROP POLICY IF EXISTS "transaction_org_all" ON "Transaction";

-- Marketing
DROP POLICY IF EXISTS "org_coupon_all" ON "Coupon";
DROP POLICY IF EXISTS "org_discount_all" ON "Discount";
DROP POLICY IF EXISTS "org_order_bump_all" ON "OrderBump";
DROP POLICY IF EXISTS "org_upsell_all" ON "Upsell";
DROP POLICY IF EXISTS "org_cross_sell_all" ON "CrossSell";

-- Checkout
DROP POLICY IF EXISTS "org_checkout_all" ON "CheckoutCustomization";
DROP POLICY IF EXISTS "org_pixel_all" ON "Pixel";
DROP POLICY IF EXISTS "org_social_proof_all" ON "SocialProof";
DROP POLICY IF EXISTS "org_banner_all" ON "Banner";
DROP POLICY IF EXISTS "org_shipping_all" ON "Shipping";

-- ShippingMethod
DROP POLICY IF EXISTS "org_shipping_method_all" ON "ShippingMethod";

-- Desabilitar RLS temporariamente para permitir alterações
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

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Coupon') THEN
    ALTER TABLE "Coupon" DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CheckoutCustomization') THEN
    ALTER TABLE "CheckoutCustomization" DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ShippingMethod') THEN
    ALTER TABLE "ShippingMethod" DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- FASE 2: ADICIONAR userId nas tabelas
-- ============================================

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Kit" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "GatewayConfig" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Coupon') THEN
    ALTER TABLE "Coupon" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Discount') THEN
    ALTER TABLE "Discount" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'OrderBump') THEN
    ALTER TABLE "OrderBump" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Upsell') THEN
    ALTER TABLE "Upsell" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CrossSell') THEN
    ALTER TABLE "CrossSell" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CheckoutCustomization') THEN
    ALTER TABLE "CheckoutCustomization" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Pixel') THEN
    ALTER TABLE "Pixel" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'SocialProof') THEN
    ALTER TABLE "SocialProof" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Banner') THEN
    ALTER TABLE "Banner" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Shipping') THEN
    ALTER TABLE "Shipping" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ShippingMethod') THEN
    ALTER TABLE "ShippingMethod" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'MediaGeneration') THEN
    -- MediaGeneration já tem userId, não precisa adicionar
  END IF;
END $$;

-- ============================================
-- FASE 3: REMOVER organizationId CASCADE
-- ============================================

ALTER TABLE "Product" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Category" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Collection" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Kit" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Lead" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Cart" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Order" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "GatewayConfig" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "organizationId" CASCADE;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Coupon' AND column_name = 'organizationId') THEN
    ALTER TABLE "Coupon" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Discount' AND column_name = 'organizationId') THEN
    ALTER TABLE "Discount" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'OrderBump' AND column_name = 'organizationId') THEN
    ALTER TABLE "OrderBump" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Upsell' AND column_name = 'organizationId') THEN
    ALTER TABLE "Upsell" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'CrossSell' AND column_name = 'organizationId') THEN
    ALTER TABLE "CrossSell" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'CheckoutCustomization' AND column_name = 'organizationId') THEN
    ALTER TABLE "CheckoutCustomization" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Pixel' AND column_name = 'organizationId') THEN
    ALTER TABLE "Pixel" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'SocialProof' AND column_name = 'organizationId') THEN
    ALTER TABLE "SocialProof" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Banner' AND column_name = 'organizationId') THEN
    ALTER TABLE "Banner" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Shipping' AND column_name = 'organizationId') THEN
    ALTER TABLE "Shipping" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ShippingMethod' AND column_name = 'organizationId') THEN
    ALTER TABLE "ShippingMethod" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'MediaGeneration' AND column_name = 'organizationId') THEN
    ALTER TABLE "MediaGeneration" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'QuotaUsageHistory' AND column_name = 'organizationId') THEN
    ALTER TABLE "QuotaUsageHistory" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

-- Remover de User
ALTER TABLE "User" DROP COLUMN IF EXISTS "organizationId" CASCADE;

-- ============================================
-- FASE 4: DELETAR TABELAS DE ORGANIZAÇÃO
-- ============================================
DROP TABLE IF EXISTS "OrganizationAiConnection" CASCADE;
DROP TABLE IF EXISTS "Organization" CASCADE;

-- ============================================
-- FASE 5: CRIAR NOVAS RLS POLICIES
-- ============================================

-- Product
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_user_all" ON "Product"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Category
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "category_user_all" ON "Category"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Collection
ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collection_user_all" ON "Collection"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Kit
ALTER TABLE "Kit" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "kit_user_all" ON "Kit"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Customer
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer_user_all" ON "Customer"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Lead
ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead_user_all" ON "Lead"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Cart
ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_user_all" ON "Cart"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Order
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order_user_all" ON "Order"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- GatewayConfig
ALTER TABLE "GatewayConfig" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gateway_user_all" ON "GatewayConfig"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Transaction
ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transaction_user_all" ON "Transaction"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

-- Coupon
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Coupon') THEN
    ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "coupon_user_all" ON "Coupon"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- CheckoutCustomization
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CheckoutCustomization') THEN
    ALTER TABLE "CheckoutCustomization" ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "checkout_customization_user_all" ON "CheckoutCustomization"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- ShippingMethod
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ShippingMethod') THEN
    ALTER TABLE "ShippingMethod" ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "shipping_method_user_all" ON "ShippingMethod"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- ============================================
-- FASE 6: CRIAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_user_id ON "Product"("userId");
CREATE INDEX IF NOT EXISTS idx_category_user_id ON "Category"("userId");
CREATE INDEX IF NOT EXISTS idx_customer_user_id ON "Customer"("userId");
CREATE INDEX IF NOT EXISTS idx_order_user_id ON "Order"("userId");
CREATE INDEX IF NOT EXISTS idx_gateway_config_user_id ON "GatewayConfig"("userId");
CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON "Transaction"("userId");

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ShippingMethod') THEN
    CREATE INDEX IF NOT EXISTS idx_shipping_method_user_id ON "ShippingMethod"("userId");
  END IF;
END $$;

-- ============================================
-- FASE 7: LOG DE SUCESSO
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

