-- ============================================
-- SHOPIFY DISCOUNTS INTEGRATION
-- ============================================
-- Sincroniza descontos e cupons da Shopify
-- ============================================

-- ============================================
-- 1. SHOPIFY PRICE RULES (Regras de Desconto)
-- ============================================
CREATE TABLE IF NOT EXISTS "ShopifyPriceRule" (
  id BIGINT PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "integrationId" UUID NOT NULL REFERENCES "ShopifyIntegration"(id) ON DELETE CASCADE,

  -- Basic Info
  title TEXT NOT NULL,
  "valueType" TEXT NOT NULL CHECK ("valueType" IN ('percentage', 'fixed_amount')),
  value DECIMAL(10,2) NOT NULL,
  "targetType" TEXT NOT NULL CHECK ("targetType" IN ('line_item', 'shipping_line')),
  "targetSelection" TEXT NOT NULL CHECK ("targetSelection" IN ('all', 'entitled')),
  "allocationMethod" TEXT NOT NULL CHECK ("allocationMethod" IN ('each', 'across')),

  -- Conditions
  "prerequisiteSubtotalRange" JSONB,
  "prerequisiteQuantityRange" JSONB,
  "prerequisiteShippingPriceRange" JSONB,
  "prerequisiteToEntitlementQuantityRatio" JSONB,
  "entitledProductIds" BIGINT[],
  "entitledVariantIds" BIGINT[],
  "entitledCollectionIds" BIGINT[],
  "prerequisiteProductIds" BIGINT[],
  "prerequisiteVariantIds" BIGINT[],
  "prerequisiteCollectionIds" BIGINT[],
  "prerequisiteCustomerIds" BIGINT[],

  -- Usage Limits
  "usageLimit" INTEGER,
  "oncePerCustomer" BOOLEAN DEFAULT false,
  "customerSelection" TEXT CHECK ("customerSelection" IN ('all', 'prerequisite')),

  -- Dates
  "startsAt" TIMESTAMP,
  "endsAt" TIMESTAMP,

  -- Full Shopify Data
  "shopifyData" JSONB NOT NULL,

  -- Sync Info
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  "lastSyncAt" TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT "ShopifyPriceRule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT "ShopifyPriceRule_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ShopifyIntegration"(id) ON DELETE CASCADE
);

CREATE INDEX idx_shopify_price_rule_user ON "ShopifyPriceRule"("userId");
CREATE INDEX idx_shopify_price_rule_integration ON "ShopifyPriceRule"("integrationId");
CREATE INDEX idx_shopify_price_rule_dates ON "ShopifyPriceRule"("startsAt", "endsAt");

-- ============================================
-- 2. SHOPIFY DISCOUNT CODES
-- ============================================
CREATE TABLE IF NOT EXISTS "ShopifyDiscountCode" (
  id BIGINT PRIMARY KEY,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "integrationId" UUID NOT NULL REFERENCES "ShopifyIntegration"(id) ON DELETE CASCADE,
  "priceRuleId" BIGINT NOT NULL REFERENCES "ShopifyPriceRule"(id) ON DELETE CASCADE,

  -- Code Info
  code TEXT NOT NULL,

  -- Usage Stats
  "usageCount" INTEGER DEFAULT 0,

  -- Full Shopify Data
  "shopifyData" JSONB NOT NULL,

  -- Sync Info
  "createdAt" TIMESTAMP NOT NULL,
  "updatedAt" TIMESTAMP NOT NULL,
  "lastSyncAt" TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT "ShopifyDiscountCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE,
  CONSTRAINT "ShopifyDiscountCode_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ShopifyIntegration"(id) ON DELETE CASCADE,
  CONSTRAINT "ShopifyDiscountCode_priceRuleId_fkey" FOREIGN KEY ("priceRuleId") REFERENCES "ShopifyPriceRule"(id) ON DELETE CASCADE
);

CREATE INDEX idx_shopify_discount_code_user ON "ShopifyDiscountCode"("userId");
CREATE INDEX idx_shopify_discount_code_integration ON "ShopifyDiscountCode"("integrationId");
CREATE INDEX idx_shopify_discount_code_price_rule ON "ShopifyDiscountCode"("priceRuleId");
CREATE INDEX idx_shopify_discount_code_code ON "ShopifyDiscountCode"("code");
CREATE UNIQUE INDEX idx_shopify_discount_code_unique ON "ShopifyDiscountCode"("userId", "code");

-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- ShopifyPriceRule policies
ALTER TABLE "ShopifyPriceRule" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own price rules"
  ON "ShopifyPriceRule"
  FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own price rules"
  ON "ShopifyPriceRule"
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own price rules"
  ON "ShopifyPriceRule"
  FOR UPDATE
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete their own price rules"
  ON "ShopifyPriceRule"
  FOR DELETE
  USING (auth.uid() = "userId");

-- ShopifyDiscountCode policies
ALTER TABLE "ShopifyDiscountCode" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own discount codes"
  ON "ShopifyDiscountCode"
  FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can insert their own discount codes"
  ON "ShopifyDiscountCode"
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own discount codes"
  ON "ShopifyDiscountCode"
  FOR UPDATE
  USING (auth.uid() = "userId");

CREATE POLICY "Users can delete their own discount codes"
  ON "ShopifyDiscountCode"
  FOR DELETE
  USING (auth.uid() = "userId");

-- ============================================
-- 4. HELPER FUNCTIONS
-- ============================================

-- Função para verificar se um código de desconto está ativo
CREATE OR REPLACE FUNCTION is_discount_code_active(discount_code_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  price_rule_record RECORD;
  now_timestamp TIMESTAMP;
BEGIN
  now_timestamp := NOW();

  SELECT pr.* INTO price_rule_record
  FROM "ShopifyPriceRule" pr
  JOIN "ShopifyDiscountCode" dc ON dc."priceRuleId" = pr.id
  WHERE dc.id = discount_code_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Verificar datas
  IF price_rule_record."startsAt" IS NOT NULL AND now_timestamp < price_rule_record."startsAt" THEN
    RETURN FALSE;
  END IF;

  IF price_rule_record."endsAt" IS NOT NULL AND now_timestamp > price_rule_record."endsAt" THEN
    RETURN FALSE;
  END IF;

  -- Verificar limite de uso
  IF price_rule_record."usageLimit" IS NOT NULL THEN
    DECLARE
      usage_count INTEGER;
    BEGIN
      SELECT COALESCE(SUM("usageCount"), 0) INTO usage_count
      FROM "ShopifyDiscountCode"
      WHERE "priceRuleId" = price_rule_record.id;

      IF usage_count >= price_rule_record."usageLimit" THEN
        RETURN FALSE;
      END IF;
    END;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 5. VIEWS
-- ============================================

-- View para listar todos os códigos de desconto ativos
CREATE OR REPLACE VIEW "ActiveDiscountCodes" AS
SELECT
  dc.id,
  dc."userId",
  dc."integrationId",
  dc.code,
  dc."usageCount",
  pr.title as "priceRuleTitle",
  pr."valueType",
  pr.value,
  pr."targetType",
  pr."usageLimit",
  pr."oncePerCustomer",
  pr."startsAt",
  pr."endsAt",
  CASE
    WHEN pr."startsAt" IS NOT NULL AND NOW() < pr."startsAt" THEN 'scheduled'
    WHEN pr."endsAt" IS NOT NULL AND NOW() > pr."endsAt" THEN 'expired'
    WHEN pr."usageLimit" IS NOT NULL AND dc."usageCount" >= pr."usageLimit" THEN 'exhausted'
    ELSE 'active'
  END as status
FROM "ShopifyDiscountCode" dc
JOIN "ShopifyPriceRule" pr ON dc."priceRuleId" = pr.id;

COMMENT ON TABLE "ShopifyPriceRule" IS 'Regras de desconto sincronizadas da Shopify';
COMMENT ON TABLE "ShopifyDiscountCode" IS 'Códigos de desconto sincronizados da Shopify';
COMMENT ON VIEW "ActiveDiscountCodes" IS 'View com todos os códigos de desconto e seus status';
