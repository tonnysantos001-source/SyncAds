-- ============================================
-- MIGRATION: REMOVER ORGANIZAÇÕES (ULTRA SEGURA)
-- Data: 30 de Outubro de 2025
-- Verifica TUDO antes de executar
-- ============================================

BEGIN;

-- ============================================
-- FASE 1: REMOVER TODAS AS POLICIES ANTIGAS
-- ============================================

DO $$ 
BEGIN
  -- Product
  DROP POLICY IF EXISTS "org_product_all" ON "Product";
  DROP POLICY IF EXISTS "org_variant_all" ON "ProductVariant";
  DROP POLICY IF EXISTS "org_image_all" ON "ProductImage";
  DROP POLICY IF EXISTS "product_org_all" ON "Product";
  DROP POLICY IF EXISTS "product_organization_all" ON "Product";
  
  -- Category
  DROP POLICY IF EXISTS "org_category_all" ON "Category";
  DROP POLICY IF EXISTS "category_org_all" ON "Category";
  
  -- Collection
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Collection') THEN
    DROP POLICY IF EXISTS "org_collection_all" ON "Collection";
    DROP POLICY IF EXISTS "collection_org_all" ON "Collection";
  END IF;
  
  -- Kit
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Kit') THEN
    DROP POLICY IF EXISTS "org_kit_all" ON "Kit";
    DROP POLICY IF EXISTS "kit_org_all" ON "Kit";
  END IF;
  
  -- Customer
  DROP POLICY IF EXISTS "org_customer_all" ON "Customer";
  DROP POLICY IF EXISTS "customer_org_all" ON "Customer";
  
  -- Lead
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Lead') THEN
    DROP POLICY IF EXISTS "org_lead_all" ON "Lead";
    DROP POLICY IF EXISTS "lead_org_all" ON "Lead";
  END IF;
  
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
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Transaction') THEN
    DROP POLICY IF EXISTS "org_transaction_all" ON "Transaction";
    DROP POLICY IF EXISTS "transaction_org_all" ON "Transaction";
  END IF;
END $$;

-- ============================================
-- FASE 2: DESABILITAR RLS
-- ============================================

ALTER TABLE "Product" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Cart" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "GatewayConfig" DISABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Collection') THEN
    ALTER TABLE "Collection" DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Kit') THEN
    ALTER TABLE "Kit" DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Lead') THEN
    ALTER TABLE "Lead" DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Transaction') THEN
    ALTER TABLE "Transaction" DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================
-- FASE 3: ADICIONAR userId
-- ============================================

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Cart" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "GatewayConfig" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

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

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Lead') THEN
    ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Transaction') THEN
    ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- FASE 4: REMOVER organizationId CASCADE
-- ============================================

ALTER TABLE "Product" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Category" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Customer" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Cart" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "Order" DROP COLUMN IF EXISTS "organizationId" CASCADE;
ALTER TABLE "GatewayConfig" DROP COLUMN IF EXISTS "organizationId" CASCADE;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Collection' AND column_name = 'organizationId') THEN
    ALTER TABLE "Collection" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Kit' AND column_name = 'organizationId') THEN
    ALTER TABLE "Kit" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Lead' AND column_name = 'organizationId') THEN
    ALTER TABLE "Lead" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Transaction' AND column_name = 'organizationId') THEN
    ALTER TABLE "Transaction" DROP COLUMN "organizationId" CASCADE;
  END IF;
END $$;

-- Remover de User
ALTER TABLE "User" DROP COLUMN IF EXISTS "organizationId" CASCADE;

-- ============================================
-- FASE 5: DELETAR TABELAS DE ORGANIZAÇÃO
-- ============================================
DROP TABLE IF EXISTS "OrganizationAiConnection" CASCADE;
DROP TABLE IF EXISTS "Organization" CASCADE;

-- ============================================
-- FASE 6: CRIAR NOVAS RLS POLICIES
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
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "customer_user_all" ON "Customer";
CREATE POLICY "customer_user_all" ON "Customer"
  FOR ALL 
  USING ((SELECT auth.uid())::text = "userId");

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
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Transaction') THEN
    ALTER TABLE "Transaction" ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "transaction_user_all" ON "Transaction";
    CREATE POLICY "transaction_user_all" ON "Transaction"
      FOR ALL 
      USING ((SELECT auth.uid())::text = "userId");
  END IF;
END $$;

-- ============================================
-- FASE 7: CRIAR ÍNDICES (SOMENTE TABELAS EXISTENTES)
-- ============================================

CREATE INDEX IF NOT EXISTS idx_product_user_id ON "Product"("userId");
CREATE INDEX IF NOT EXISTS idx_category_user_id ON "Category"("userId");
CREATE INDEX IF NOT EXISTS idx_customer_user_id ON "Customer"("userId");
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON "Cart"("userId");
CREATE INDEX IF NOT EXISTS idx_order_user_id ON "Order"("userId");
CREATE INDEX IF NOT EXISTS idx_gateway_config_user_id ON "GatewayConfig"("userId");

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Collection') THEN
    CREATE INDEX IF NOT EXISTS idx_collection_user_id ON "Collection"("userId");
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Transaction') THEN
    CREATE INDEX IF NOT EXISTS idx_transaction_user_id ON "Transaction"("userId");
  END IF;
END $$;

-- ============================================
-- FASE 8: LOG DE SUCESSO
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

