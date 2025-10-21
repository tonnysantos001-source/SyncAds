-- ============================================
-- MÓDULO: CARRINHO DE COMPRAS
-- Tabelas: Cart, CartItem, AbandonedCart
-- ============================================

-- ============================================
-- CART
-- ============================================
CREATE TABLE IF NOT EXISTS "Cart" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "customerId" UUID REFERENCES "Customer"(id) ON DELETE SET NULL,
  "sessionId" TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal DECIMAL(10,2) DEFAULT 0,
  discount DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) DEFAULT 0,
  "couponCode" TEXT,
  "expiresAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cart_org ON "Cart"("organizationId");
CREATE INDEX idx_cart_customer ON "Cart"("customerId");
CREATE INDEX idx_cart_session ON "Cart"("sessionId");
CREATE INDEX idx_cart_expires ON "Cart"("expiresAt");

-- ============================================
-- CART ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS "CartItem" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "cartId" UUID NOT NULL REFERENCES "Cart"(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "variantId" UUID REFERENCES "ProductVariant"(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  "originalPrice" DECIMAL(10,2),
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_cart_item_cart ON "CartItem"("cartId");
CREATE INDEX idx_cart_item_product ON "CartItem"("productId");

-- ============================================
-- ABANDONED CARTS
-- ============================================
CREATE TABLE IF NOT EXISTS "AbandonedCart" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "cartId" UUID NOT NULL REFERENCES "Cart"(id) ON DELETE CASCADE,
  "customerId" UUID REFERENCES "Customer"(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  "abandonedAt" TIMESTAMP NOT NULL,
  "recoveryAttempts" INTEGER DEFAULT 0,
  "lastRecoveryAt" TIMESTAMP,
  "recoveredAt" TIMESTAMP,
  "orderId" UUID,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_abandoned_cart ON "AbandonedCart"("cartId");
CREATE INDEX idx_abandoned_customer ON "AbandonedCart"("customerId");
CREATE INDEX idx_abandoned_recovered ON "AbandonedCart"("recoveredAt");
