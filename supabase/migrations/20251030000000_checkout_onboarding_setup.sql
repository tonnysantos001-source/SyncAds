-- ============================================
-- CHECKOUT ONBOARDING - SETUP COMPLETO
-- Data: 30/10/2025
-- Descrição: Adiciona campos e tabelas para onboarding do checkout
-- ============================================

-- ============================================
-- PARTE 1: ADICIONAR CAMPOS EM USER
-- ============================================

-- Campos para Faturamento (Billing)
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS "subscriptionPlan" TEXT DEFAULT 'free';

-- Campos para Domínio (Domain)
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "domain" TEXT,
  ADD COLUMN IF NOT EXISTS "domainVerified" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "domainVerifiedAt" TIMESTAMP;

-- Comentários
COMMENT ON COLUMN "User"."stripeCustomerId" IS 'ID do cliente no Stripe (para cobrar uso da plataforma)';
COMMENT ON COLUMN "User"."subscriptionId" IS 'ID da assinatura ativa';
COMMENT ON COLUMN "User"."domain" IS 'Domínio verificado para usar o checkout';
COMMENT ON COLUMN "User"."domainVerified" IS 'Se o domínio foi verificado via DNS';

-- ============================================
-- PARTE 2: ATUALIZAR GATEWAYCONFIG (REMOVER ORGANIZATIONID)
-- ============================================

-- Adicionar userId se não existir
ALTER TABLE "GatewayConfig" 
  ADD COLUMN IF NOT EXISTS "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE;

-- Popular userId para registros existentes (se houver organizationId)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'GatewayConfig' AND column_name = 'organizationId'
  ) THEN
    -- Atualizar userId baseado em organizationId
    UPDATE "GatewayConfig" gc
    SET "userId" = u.id
    FROM "User" u
    WHERE u."organizationId" = gc."organizationId"
    AND gc."userId" IS NULL;
    
    -- Remover organizationId
    ALTER TABLE "GatewayConfig" DROP COLUMN IF EXISTS "organizationId";
    
    RAISE NOTICE '✅ GatewayConfig atualizada: organizationId removida, userId adicionada';
  ELSE
    RAISE NOTICE '⏭️ GatewayConfig já usa userId';
  END IF;
END $$;

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_gatewayconfig_user ON "GatewayConfig"("userId");

-- ============================================
-- PARTE 3: CRIAR TABELA SHIPPINGMETHOD
-- ============================================

CREATE TABLE IF NOT EXISTS "ShippingMethod" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  "estimatedDays" INTEGER,
  "freeShippingMinValue" DECIMAL(10,2),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_shippingmethod_user ON "ShippingMethod"("userId");
CREATE INDEX IF NOT EXISTS idx_shippingmethod_active ON "ShippingMethod"("userId", "isActive");

-- Comentários
COMMENT ON TABLE "ShippingMethod" IS 'Métodos de frete configurados pelos usuários';
COMMENT ON COLUMN "ShippingMethod"."userId" IS 'Usuário dono do método de frete';
COMMENT ON COLUMN "ShippingMethod"."price" IS 'Preço do frete em reais';
COMMENT ON COLUMN "ShippingMethod"."estimatedDays" IS 'Prazo estimado de entrega em dias';
COMMENT ON COLUMN "ShippingMethod"."freeShippingMinValue" IS 'Valor mínimo para frete grátis';

-- ============================================
-- PARTE 4: RLS POLICIES PARA SHIPPINGMETHOD
-- ============================================

ALTER TABLE "ShippingMethod" ENABLE ROW LEVEL SECURITY;

-- Policy SELECT
DROP POLICY IF EXISTS "shipping_select" ON "ShippingMethod";
CREATE POLICY "shipping_select" ON "ShippingMethod"
  FOR SELECT 
  USING ((select auth.uid())::text = "userId");

-- Policy INSERT
DROP POLICY IF EXISTS "shipping_insert" ON "ShippingMethod";
CREATE POLICY "shipping_insert" ON "ShippingMethod"
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = "userId");

-- Policy UPDATE
DROP POLICY IF EXISTS "shipping_update" ON "ShippingMethod";
CREATE POLICY "shipping_update" ON "ShippingMethod"
  FOR UPDATE 
  USING ((select auth.uid())::text = "userId");

-- Policy DELETE
DROP POLICY IF EXISTS "shipping_delete" ON "ShippingMethod";
CREATE POLICY "shipping_delete" ON "ShippingMethod"
  FOR DELETE 
  USING ((select auth.uid())::text = "userId");

-- ============================================
-- PARTE 5: TRIGGER UPDATED_AT PARA SHIPPINGMETHOD
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shippingmethod_updated_at ON "ShippingMethod";
CREATE TRIGGER update_shippingmethod_updated_at
  BEFORE UPDATE ON "ShippingMethod"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 6: VERIFICAÇÕES FINAIS
-- ============================================

DO $$
DECLARE
  missing_fields INTEGER := 0;
  missing_table INTEGER := 0;
BEGIN
  -- Verificar campos em User
  SELECT COUNT(*) INTO missing_fields
  FROM (
    SELECT 'stripeCustomerId' as col
    UNION ALL SELECT 'subscriptionId'
    UNION ALL SELECT 'domain'
    UNION ALL SELECT 'domainVerified'
  ) expected
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User'
    AND column_name = expected.col
  );
  
  -- Verificar tabela ShippingMethod
  SELECT COUNT(*) INTO missing_table
  FROM information_schema.tables
  WHERE table_name = 'ShippingMethod';
  
  -- Reportar resultados
  IF missing_fields > 0 THEN
    RAISE WARNING '⚠️ Faltam % campos em User', missing_fields;
  ELSE
    RAISE NOTICE '✅ Todos os campos adicionados em User';
  END IF;
  
  IF missing_table = 0 THEN
    RAISE WARNING '⚠️ Tabela ShippingMethod não foi criada';
  ELSE
    RAISE NOTICE '✅ Tabela ShippingMethod criada com sucesso';
  END IF;
  
  IF missing_fields = 0 AND missing_table > 0 THEN
    RAISE NOTICE '🎉 CHECKOUT ONBOARDING SETUP COMPLETO!';
  END IF;
END $$;

