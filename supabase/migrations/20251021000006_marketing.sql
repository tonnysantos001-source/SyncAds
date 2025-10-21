-- ============================================
-- MÓDULO: MARKETING E CONVERSÃO
-- Tabelas: Coupon, CouponUsage, Discount, OrderBump, Upsell, CrossSell
-- ============================================

-- ============================================
-- COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS "Coupon" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING')),
  value DECIMAL(10,2) NOT NULL,
  "minPurchaseAmount" DECIMAL(10,2),
  "maxDiscountAmount" DECIMAL(10,2),
  "usageLimit" INTEGER,
  "usageCount" INTEGER DEFAULT 0,
  "perCustomerLimit" INTEGER,
  "startsAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", code)
);

CREATE INDEX idx_coupon_org ON "Coupon"("organizationId");
CREATE INDEX idx_coupon_code ON "Coupon"(code);
CREATE INDEX idx_coupon_active ON "Coupon"("isActive");

-- ============================================
-- COUPON USAGE
-- ============================================
CREATE TABLE IF NOT EXISTS "CouponUsage" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "couponId" UUID NOT NULL REFERENCES "Coupon"(id) ON DELETE CASCADE,
  "customerId" UUID NOT NULL REFERENCES "Customer"(id) ON DELETE CASCADE,
  "orderId" UUID NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "discountAmount" DECIMAL(10,2) NOT NULL,
  "usedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_coupon_usage_coupon ON "CouponUsage"("couponId");
CREATE INDEX idx_coupon_usage_customer ON "CouponUsage"("customerId");
CREATE INDEX idx_coupon_usage_order ON "CouponUsage"("orderId");

-- ============================================
-- DISCOUNTS (Descontos Automáticos)
-- ============================================
CREATE TABLE IF NOT EXISTS "Discount" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('PERCENTAGE', 'FIXED_AMOUNT', 'BUY_X_GET_Y')),
  value DECIMAL(10,2) NOT NULL,
  "applyTo" TEXT NOT NULL CHECK ("applyTo" IN ('ALL', 'SPECIFIC_PRODUCTS', 'SPECIFIC_COLLECTIONS')),
  "productIds" UUID[],
  "collectionIds" UUID[],
  "minQuantity" INTEGER,
  "minPurchaseAmount" DECIMAL(10,2),
  "startsAt" TIMESTAMP,
  "expiresAt" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_discount_org ON "Discount"("organizationId");
CREATE INDEX idx_discount_active ON "Discount"("isActive");

-- ============================================
-- ORDER BUMPS
-- ============================================
CREATE TABLE IF NOT EXISTS "OrderBump" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "triggerProductIds" UUID[], -- Produtos que ativam o bump
  title TEXT NOT NULL,
  description TEXT,
  "discountType" TEXT CHECK ("discountType" IN ('PERCENTAGE', 'FIXED_AMOUNT')),
  "discountValue" DECIMAL(10,2),
  position TEXT DEFAULT 'BEFORE_PAYMENT' CHECK (position IN ('BEFORE_PAYMENT', 'AFTER_PAYMENT', 'IN_CART')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_bump_org ON "OrderBump"("organizationId");
CREATE INDEX idx_order_bump_product ON "OrderBump"("productId");
CREATE INDEX idx_order_bump_active ON "OrderBump"("isActive");

-- ============================================
-- UPSELLS
-- ============================================
CREATE TABLE IF NOT EXISTS "Upsell" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "fromProductId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "toProductId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "discountType" TEXT CHECK ("discountType" IN ('PERCENTAGE', 'FIXED_AMOUNT')),
  "discountValue" DECIMAL(10,2),
  timing TEXT DEFAULT 'CHECKOUT' CHECK (timing IN ('CHECKOUT', 'POST_PURCHASE', 'THANK_YOU_PAGE')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_upsell_org ON "Upsell"("organizationId");
CREATE INDEX idx_upsell_from ON "Upsell"("fromProductId");
CREATE INDEX idx_upsell_to ON "Upsell"("toProductId");
CREATE INDEX idx_upsell_active ON "Upsell"("isActive");

-- ============================================
-- CROSS-SELLS
-- ============================================
CREATE TABLE IF NOT EXISTS "CrossSell" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "relatedProductIds" UUID[] NOT NULL,
  title TEXT,
  description TEXT,
  "discountType" TEXT CHECK ("discountType" IN ('PERCENTAGE', 'FIXED_AMOUNT')),
  "discountValue" DECIMAL(10,2),
  position TEXT DEFAULT 'PRODUCT_PAGE' CHECK (position IN ('PRODUCT_PAGE', 'CART', 'CHECKOUT')),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cross_sell_org ON "CrossSell"("organizationId");
CREATE INDEX idx_cross_sell_product ON "CrossSell"("productId");
CREATE INDEX idx_cross_sell_active ON "CrossSell"("isActive");
