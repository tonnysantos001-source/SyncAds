-- ============================================
-- MIGRATION: REMOVER ORGANIZAÇÕES (VERSÃO SEGURA)
-- Data: 30 de Outubro de 2025
-- Versão: SAFE - Ignora tabelas que não existem
-- ============================================

BEGIN;

-- ============================================
-- FASE 1: ADICIONAR userId nas tabelas EXISTENTES
-- ============================================

-- Produtos
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Product') THEN
    ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Category') THEN
    ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Collection') THEN
    ALTER TABLE "Collection" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Kit') THEN
    ALTER TABLE "Kit" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Clientes
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Customer') THEN
    ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Lead') THEN
    ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Carrinho e Pedidos
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Cart') THEN
    ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Order') THEN
    ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Gateways e Transações
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'GatewayConfig') THEN
    ALTER TABLE "GatewayConfig" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Transaction') THEN
    ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Marketing
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

-- Checkout
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

-- ShippingMethod
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ShippingMethod') THEN
    ALTER TABLE "ShippingMethod" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Media Generation (já tem userId, só precisa remover organizationId)
-- Quota Usage (já tem userId, só precisa remover organizationId)

-- ============================================
-- FASE 2: REMOVER organizationId das tabelas EXISTENTES
-- ============================================

-- Produtos
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Product' AND column_name = 'organizationId') THEN
    ALTER TABLE "Product" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Category' AND column_name = 'organizationId') THEN
    ALTER TABLE "Category" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Collection' AND column_name = 'organizationId') THEN
    ALTER TABLE "Collection" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Kit' AND column_name = 'organizationId') THEN
    ALTER TABLE "Kit" DROP COLUMN "organizationId";
  END IF;
END $$;

-- Clientes
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Customer' AND column_name = 'organizationId') THEN
    ALTER TABLE "Customer" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Lead' AND column_name = 'organizationId') THEN
    ALTER TABLE "Lead" DROP COLUMN "organizationId";
  END IF;
END $$;

-- Carrinho e Pedidos
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Cart' AND column_name = 'organizationId') THEN
    ALTER TABLE "Cart" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Order' AND column_name = 'organizationId') THEN
    ALTER TABLE "Order" DROP COLUMN "organizationId";
  END IF;
END $$;

-- Gateways e Transações
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'GatewayConfig' AND column_name = 'organizationId') THEN
    ALTER TABLE "GatewayConfig" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Transaction' AND column_name = 'organizationId') THEN
    ALTER TABLE "Transaction" DROP COLUMN "organizationId";
  END IF;
END $$;

-- Marketing
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Coupon' AND column_name = 'organizationId') THEN
    ALTER TABLE "Coupon" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Discount' AND column_name = 'organizationId') THEN
    ALTER TABLE "Discount" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'OrderBump' AND column_name = 'organizationId') THEN
    ALTER TABLE "OrderBump" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Upsell' AND column_name = 'organizationId') THEN
    ALTER TABLE "Upsell" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'CrossSell' AND column_name = 'organizationId') THEN
    ALTER TABLE "CrossSell" DROP COLUMN "organizationId";
  END IF;
END $$;

-- Checkout
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'CheckoutCustomization' AND column_name = 'organizationId') THEN
    ALTER TABLE "CheckoutCustomization" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Pixel' AND column_name = 'organizationId') THEN
    ALTER TABLE "Pixel" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'SocialProof' AND column_name = 'organizationId') THEN
    ALTER TABLE "SocialProof" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Banner' AND column_name = 'organizationId') THEN
    ALTER TABLE "Banner" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Shipping' AND column_name = 'organizationId') THEN
    ALTER TABLE "Shipping" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'ShippingMethod' AND column_name = 'organizationId') THEN
    ALTER TABLE "ShippingMethod" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'MediaGeneration' AND column_name = 'organizationId') THEN
    ALTER TABLE "MediaGeneration" DROP COLUMN "organizationId";
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'QuotaUsageHistory' AND column_name = 'organizationId') THEN
    ALTER TABLE "QuotaUsageHistory" DROP COLUMN "organizationId";
  END IF;
END $$;

-- ============================================
-- FASE 3: REMOVER organizationId de User
-- ============================================
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'organizationId') THEN
    ALTER TABLE "User" DROP COLUMN "organizationId";
  END IF;
END $$;

-- ============================================
-- FASE 4: DELETAR TABELAS DE ORGANIZAÇÃO
-- ============================================
DROP TABLE IF EXISTS "OrganizationAiConnection" CASCADE;
DROP TABLE IF EXISTS "Organization" CASCADE;

-- ============================================
-- FASE 5: RECRIAR RLS POLICIES (SIMPLIFICADAS)
-- ============================================

-- Product
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Product') THEN
    ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "product_user_all" ON "Product";
    CREATE POLICY "product_user_all" ON "Product"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- Category
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Category') THEN
    ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "category_user_all" ON "Category";
    CREATE POLICY "category_user_all" ON "Category"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- Collection
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Collection') THEN
    ALTER TABLE "Collection" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "collection_user_all" ON "Collection";
    CREATE POLICY "collection_user_all" ON "Collection"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- Kit
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Kit') THEN
    ALTER TABLE "Kit" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "kit_user_all" ON "Kit";
    CREATE POLICY "kit_user_all" ON "Kit"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- Customer
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Customer') THEN
    ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "customer_user_all" ON "Customer";
    CREATE POLICY "customer_user_all" ON "Customer"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- Lead
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Lead') THEN
    ALTER TABLE "Lead" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "lead_user_all" ON "Lead";
    CREATE POLICY "lead_user_all" ON "Lead"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- Cart
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Cart') THEN
    ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "cart_user_all" ON "Cart";
    CREATE POLICY "cart_user_all" ON "Cart"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- Order
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Order') THEN
    ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "order_user_all" ON "Order";
    CREATE POLICY "order_user_all" ON "Order"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- GatewayConfig
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'GatewayConfig') THEN
    ALTER TABLE "GatewayConfig" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "gateway_user_all" ON "GatewayConfig";
    CREATE POLICY "gateway_user_all" ON "GatewayConfig"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- Transaction
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Transaction') THEN
    ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "transaction_user_all" ON "Transaction";
    CREATE POLICY "transaction_user_all" ON "Transaction"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- Coupon
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Coupon') THEN
    ALTER TABLE "Coupon" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "coupon_user_all" ON "Coupon";
    CREATE POLICY "coupon_user_all" ON "Coupon"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- CheckoutCustomization
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CheckoutCustomization') THEN
    ALTER TABLE "CheckoutCustomization" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "checkout_customization_user_all" ON "CheckoutCustomization";
    CREATE POLICY "checkout_customization_user_all" ON "CheckoutCustomization"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- ShippingMethod
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ShippingMethod') THEN
    ALTER TABLE "ShippingMethod" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "shipping_method_user_all" ON "ShippingMethod";
    CREATE POLICY "shipping_method_user_all" ON "ShippingMethod"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- ============================================
-- FASE 6: CRIAR ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_user_id ON "Product"("userId");
CREATE INDEX IF NOT EXISTS idx_category_user_id ON "Category"("userId");
CREATE INDEX IF NOT EXISTS idx_customer_user_id ON "Customer"("userId");
CREATE INDEX IF NOT EXISTS idx_order_user_id ON "Order"("userId");
CREATE INDEX IF NOT EXISTS idx_gateway_config_user_id ON "GatewayConfig"("userId");
CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS idx_shipping_method_user_id ON "ShippingMethod"("userId");

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

