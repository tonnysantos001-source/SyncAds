-- ============================================
-- SYNCADS E-COMMERCE COMPLETE SCHEMA
-- Migration: E-commerce completo
-- Data: 21/10/2025
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- Para encriptar API keys

-- ============================================
-- 1. CATEGORIES (Categorias de Produtos)
-- ============================================
CREATE TABLE IF NOT EXISTS "Category" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  "parentId" UUID REFERENCES "Category"(id),
  "imageUrl" TEXT,
  position INTEGER DEFAULT 0,
  "isPublished" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", slug)
);

CREATE INDEX idx_category_org ON "Category"("organizationId");
CREATE INDEX idx_category_parent ON "Category"("parentId");
CREATE INDEX idx_category_published ON "Category"("isPublished");

-- ============================================
-- 2. PRODUCTS (Produtos)
-- ============================================
CREATE TABLE IF NOT EXISTS "Product" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  "shortDescription" TEXT,
  price DECIMAL(10,2) NOT NULL,
  "comparePrice" DECIMAL(10,2),
  cost DECIMAL(10,2),
  sku TEXT,
  barcode TEXT,
  stock INTEGER DEFAULT 0,
  "lowStockThreshold" INTEGER DEFAULT 10,
  "trackStock" BOOLEAN DEFAULT true,
  weight DECIMAL(10,2),
  width DECIMAL(10,2),
  height DECIMAL(10,2),
  length DECIMAL(10,2),
  status TEXT DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED')),
  "isFeatured" BOOLEAN DEFAULT false,
  "categoryId" UUID REFERENCES "Category"(id),
  tags TEXT[],
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", slug)
);

CREATE INDEX idx_product_org ON "Product"("organizationId");
CREATE INDEX idx_product_status ON "Product"(status);
CREATE INDEX idx_product_category ON "Product"("categoryId");
CREATE INDEX idx_product_sku ON "Product"(sku);
CREATE INDEX idx_product_featured ON "Product"("isFeatured");

-- ============================================
-- 3. PRODUCT VARIANTS (Variações)
-- ============================================
CREATE TABLE IF NOT EXISTS "ProductVariant" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  price DECIMAL(10,2),
  "comparePrice" DECIMAL(10,2),
  cost DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  "trackStock" BOOLEAN DEFAULT true,
  options JSONB,
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_variant_product ON "ProductVariant"("productId");
CREATE INDEX idx_variant_sku ON "ProductVariant"(sku);

-- ============================================
-- 4. PRODUCT IMAGES (Imagens)
-- ============================================
CREATE TABLE IF NOT EXISTS "ProductImage" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  "variantId" UUID REFERENCES "ProductVariant"(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  "altText" TEXT,
  position INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_image_product ON "ProductImage"("productId");
CREATE INDEX idx_image_variant ON "ProductImage"("variantId");

-- ============================================
-- 5. COLLECTIONS (Coleções)
-- ============================================
CREATE TABLE IF NOT EXISTS "Collection" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  "imageUrl" TEXT,
  "productIds" UUID[],
  rules JSONB,
  "isPublished" BOOLEAN DEFAULT false,
  "sortOrder" TEXT DEFAULT 'MANUAL',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", slug)
);

CREATE INDEX idx_collection_org ON "Collection"("organizationId");
CREATE INDEX idx_collection_published ON "Collection"("isPublished");

-- ============================================
-- 6. KITS (Kits de Produtos)
-- ============================================
CREATE TABLE IF NOT EXISTS "Kit" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  "imageUrl" TEXT,
  "totalPrice" DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  "finalPrice" DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", slug)
);

CREATE INDEX idx_kit_org ON "Kit"("organizationId");
CREATE INDEX idx_kit_status ON "Kit"(status);

-- ============================================
-- 7. KIT ITEMS (Itens do Kit)
-- ============================================
CREATE TABLE IF NOT EXISTS "KitItem" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "kitId" UUID NOT NULL REFERENCES "Kit"(id) ON DELETE CASCADE,
  "productId" UUID NOT NULL REFERENCES "Product"(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_kit_item_kit ON "KitItem"("kitId");
CREATE INDEX idx_kit_item_product ON "KitItem"("productId");

-- ============================================
-- 8. CUSTOMERS (Clientes/Compradores)
-- ============================================
CREATE TABLE IF NOT EXISTS "Customer" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  cpf TEXT,
  "birthDate" DATE,
  gender TEXT,
  "totalOrders" INTEGER DEFAULT 0,
  "totalSpent" DECIMAL(10,2) DEFAULT 0,
  "averageOrderValue" DECIMAL(10,2) DEFAULT 0,
  "lastOrderAt" TIMESTAMP,
  tags TEXT[],
  notes TEXT,
  "acceptsMarketing" BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED')),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", email)
);

CREATE INDEX idx_customer_org ON "Customer"("organizationId");
CREATE INDEX idx_customer_email ON "Customer"(email);
CREATE INDEX idx_customer_cpf ON "Customer"(cpf);
CREATE INDEX idx_customer_status ON "Customer"(status);

-- ============================================
-- 9. CUSTOMER ADDRESSES (Endereços)
-- ============================================
CREATE TABLE IF NOT EXISTS "CustomerAddress" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "customerId" UUID NOT NULL REFERENCES "Customer"(id) ON DELETE CASCADE,
  label TEXT,
  street TEXT NOT NULL,
  number TEXT NOT NULL,
  complement TEXT,
  neighborhood TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  "zipCode" TEXT NOT NULL,
  country TEXT DEFAULT 'BR',
  "isDefault" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_address_customer ON "CustomerAddress"("customerId");
CREATE INDEX idx_address_default ON "CustomerAddress"("isDefault");

-- ============================================
-- 10. LEADS (Leads de vendas)
-- ============================================
CREATE TABLE IF NOT EXISTS "Lead" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  source TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  status TEXT DEFAULT 'NEW' CHECK (status IN ('NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST')),
  notes TEXT,
  "convertedAt" TIMESTAMP,
  "customerId" UUID REFERENCES "Customer"(id),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lead_org ON "Lead"("organizationId");
CREATE INDEX idx_lead_email ON "Lead"(email);
CREATE INDEX idx_lead_status ON "Lead"(status);

-- ============================================
-- 11. CARTS (Carrinhos)
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
-- 12. CART ITEMS (Itens do Carrinho)
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
-- 13. ABANDONED CARTS (Carrinhos Abandonados)
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

-- ============================================
-- 14. ORDERS (Pedidos)
-- ============================================
CREATE TABLE IF NOT EXISTS "Order" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "orderNumber" TEXT NOT NULL UNIQUE,
  "customerId" UUID NOT NULL REFERENCES "Customer"(id) ON DELETE RESTRICT,
  "cartId" UUID REFERENCES "Cart"(id),
  
  -- Customer Info
  "customerEmail" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT,
  "customerCpf" TEXT,
  
  -- Address
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
-- 15. ORDER ITEMS (Itens do Pedido)
-- ============================================
CREATE TABLE IF NOT EXISTS "OrderItem" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "productId" UUID REFERENCES "Product"(id) ON DELETE SET NULL,
  "variantId" UUID REFERENCES "ProductVariant"(id) ON DELETE SET NULL,
  
  -- Snapshot
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
-- 16. ORDER HISTORY (Histórico de Pedidos)
-- ============================================
CREATE TABLE IF NOT EXISTS "OrderHistory" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId" UUID NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  "fromStatus" TEXT,
  "toStatus" TEXT,
  notes TEXT,
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_order_history_order ON "OrderHistory"("orderId");
CREATE INDEX idx_order_history_created ON "OrderHistory"("createdAt");

-- ============================================
-- 17. GATEWAYS (Gateways de Pagamento)
-- ============================================
CREATE TABLE IF NOT EXISTS "Gateway" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  "logoUrl" TEXT,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('PAYMENT_PROCESSOR', 'WALLET', 'BANK')),
  
  -- Supported methods
  "supportsPix" BOOLEAN DEFAULT false,
  "supportsCreditCard" BOOLEAN DEFAULT false,
  "supportsBoleto" BOOLEAN DEFAULT false,
  "supportsDebit" BOOLEAN DEFAULT false,
  
  -- Config
  "requiredFields" JSONB,
  "webhookUrl" TEXT,
  documentation TEXT,
  
  -- Status
  "isActive" BOOLEAN DEFAULT true,
  "isPopular" BOOLEAN DEFAULT false,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_gateway_slug ON "Gateway"(slug);
CREATE INDEX idx_gateway_active ON "Gateway"("isActive");
CREATE INDEX idx_gateway_popular ON "Gateway"("isPopular");

-- ============================================
-- 18. GATEWAY CONFIG (Configuração por Org)
-- ============================================
CREATE TABLE IF NOT EXISTS "GatewayConfig" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "gatewayId" UUID NOT NULL REFERENCES "Gateway"(id) ON DELETE CASCADE,
  
  -- Credentials (ENCRIPTADAS com pgcrypto)
  credentials JSONB NOT NULL,
  
  -- Settings
  "isActive" BOOLEAN DEFAULT false,
  "isDefault" BOOLEAN DEFAULT false,
  "webhookUrl" TEXT,
  
  -- Fees
  "pixFee" DECIMAL(5,2),
  "creditCardFee" DECIMAL(5,2),
  "boletoFee" DECIMAL(5,2),
  
  -- Limits
  "minAmount" DECIMAL(10,2),
  "maxAmount" DECIMAL(10,2),
  
  -- Testing
  "isTestMode" BOOLEAN DEFAULT true,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  
  UNIQUE("organizationId", "gatewayId")
);

CREATE INDEX idx_gateway_config_org ON "GatewayConfig"("organizationId");
CREATE INDEX idx_gateway_config_gateway ON "GatewayConfig"("gatewayId");
CREATE INDEX idx_gateway_config_active ON "GatewayConfig"("isActive");

-- ============================================
-- 19. TRANSACTIONS (Transações)
-- ============================================
CREATE TABLE IF NOT EXISTS "Transaction" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "orderId" UUID NOT NULL REFERENCES "Order"(id) ON DELETE CASCADE,
  "gatewayId" UUID NOT NULL REFERENCES "Gateway"(id) ON DELETE RESTRICT,
  
  -- Transaction Info
  "transactionId" TEXT,
  "paymentMethod" TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  -- Status
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED')),
  "failureReason" TEXT,
  
  -- Timestamps
  "processedAt" TIMESTAMP,
  "paidAt" TIMESTAMP,
  "refundedAt" TIMESTAMP,
  "cancelledAt" TIMESTAMP,
  
  -- PIX
  "pixQrCode" TEXT,
  "pixCopyPaste" TEXT,
  "pixExpiresAt" TIMESTAMP,
  
  -- Boleto
  "boletoUrl" TEXT,
  "boletoBarcode" TEXT,
  "boletoExpiresAt" TIMESTAMP,
  
  -- Card
  "cardBrand" TEXT,
  "cardLast4" TEXT,
  installments INTEGER DEFAULT 1,
  
  -- Fees
  "gatewayFee" DECIMAL(10,2),
  "netAmount" DECIMAL(10,2),
  
  -- Metadata
  metadata JSONB,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_transaction_org ON "Transaction"("organizationId");
CREATE INDEX idx_transaction_order ON "Transaction"("orderId");
CREATE INDEX idx_transaction_gateway ON "Transaction"("gatewayId");
CREATE INDEX idx_transaction_status ON "Transaction"(status);
CREATE INDEX idx_transaction_id ON "Transaction"("transactionId");
CREATE INDEX idx_transaction_created ON "Transaction"("createdAt");

-- (Continua na próxima parte...)
