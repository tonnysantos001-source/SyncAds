-- ============================================
-- MÓDULO: PEDIDOS
-- Tabelas: Order, OrderItem, OrderHistory
-- ============================================

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS "Order" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "orderNumber" TEXT NOT NULL UNIQUE,
  "customerId" UUID NOT NULL REFERENCES "Customer"(id) ON DELETE RESTRICT,
  "cartId" UUID REFERENCES "Cart"(id),
  
  -- Customer Info (snapshot)
  "customerEmail" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT,
  "customerCpf" TEXT,
  
  -- Address (snapshot)
  "shippingAddress" JSONB NOT NULL,
  "billingAddress" JSONB,
  
  -- Items (snapshot)
  items JSONB NOT NULL,
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  shipping DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  -- Coupon
  "couponCode" TEXT,
  "couponDiscount" DECIMAL(10,2) DEFAULT 0,
  
  -- Payment
  "paymentMethod" TEXT NOT NULL,
  "paymentStatus" TEXT DEFAULT 'PENDING' CHECK ("paymentStatus" IN ('PENDING', 'PAID', 'FAILED', 'REFUNDED')),
  "paidAt" TIMESTAMP,
  
  -- Order Status
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED')),
  
  -- Tracking
  "trackingCode" TEXT,
  "shippingCarrier" TEXT,
  "shippedAt" TIMESTAMP,
  "deliveredAt" TIMESTAMP,
  
  -- UTM
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  
  -- Meta
  notes TEXT,
  metadata JSONB,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_org ON "Order"("organizationId");
CREATE INDEX idx_order_customer ON "Order"("customerId");
CREATE INDEX idx_order_number ON "Order"("orderNumber");
CREATE INDEX idx_order_status ON "Order"(status);
CREATE INDEX idx_order_payment_status ON "Order"("paymentStatus");
CREATE INDEX idx_order_created ON "Order"("createdAt");

-- ============================================
-- ORDER ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS "OrderItem" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "productId" UUID REFERENCES "Product"(id) ON DELETE SET NULL,
  "variantId" UUID REFERENCES "ProductVariant"(id) ON DELETE SET NULL,
  
  -- Snapshot (caso produto seja deletado)
  name TEXT NOT NULL,
  sku TEXT,
  "imageUrl" TEXT,
  
  -- Pricing
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_item_order ON "OrderItem"("orderId");
CREATE INDEX idx_order_item_product ON "OrderItem"("productId");

-- ============================================
-- ORDER HISTORY
-- ============================================
CREATE TABLE IF NOT EXISTS "OrderHistory" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "userId" TEXT, -- SEM foreign key - User.id pode ser TEXT no Supabase Auth
  action TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  notes TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_history_order ON "OrderHistory"("orderId");
CREATE INDEX idx_order_history_created ON "OrderHistory"("createdAt");
