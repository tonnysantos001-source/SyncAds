-- ============================================
-- SHOPIFY INTEGRATION - COMPLETE MIGRATION
-- ============================================
--
-- Implementa integração completa com Shopify:
-- ✅ OAuth e autenticação
-- ✅ Produtos e variantes
-- ✅ Pedidos e clientes
-- ✅ Carrinhos abandonados
-- ✅ Coleções
-- ✅ Sync logs
-- ✅ Webhooks tracking
--
-- ============================================

-- ============================================
-- 1. SHOPIFY INTEGRATION (OAuth & Config)
-- ============================================
CREATE TABLE IF NOT EXISTS "ShopifyIntegration" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,

  -- Store Info
  "shopName" TEXT NOT NULL,
  "shopDomain" TEXT NOT NULL,
  "shopEmail" TEXT,

  -- OAuth
  "accessToken" TEXT NOT NULL,
  "scope" TEXT NOT NULL,

  -- Webhooks
  "webhookSecret" TEXT,
  "webhooksConfigured" BOOLEAN DEFAULT false,

  -- Payment Gateway
  "gatewayRegistered" BOOLEAN DEFAULT false,
  "gatewayId" TEXT,

  -- Status
  "isActive" BOOLEAN DEFAULT true,
  "isTestMode" BOOLEAN DEFAULT true,

  -- Sync
  "lastSyncAt" TIMESTAMP,
  "lastSyncStatus" TEXT CHECK ("lastSyncStatus" IN ('success', 'error', 'in_progress')),
  "lastSyncError" TEXT,

  -- Metadata
  metadata JSONB,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("organizationId", "shopName")
);

CREATE INDEX idx_shopify_integration_org ON "ShopifyIntegration"("organizationId");
CREATE INDEX idx_shopify_integration_user ON "ShopifyIntegration"("userId");
CREATE INDEX idx_shopify_integration_shop ON "ShopifyIntegration"("shopName");
CREATE INDEX idx_shopify_integration_active ON "ShopifyIntegration"("isActive") WHERE "isActive" = true;

-- ============================================
-- 2. SHOPIFY PRODUCTS
-- ============================================
CREATE TABLE IF NOT EXISTS "ShopifyProduct" (
  id BIGINT PRIMARY KEY,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "integrationId" UUID NOT NULL REFERENCES "ShopifyIntegration"(id) ON DELETE CASCADE,

  -- Product Info
  title TEXT NOT NULL,
  handle TEXT NOT NULL,
  description TEXT,
  "bodyHtml" TEXT,
  vendor TEXT,
  "productType" TEXT,
  tags TEXT[],

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'draft')),
  "publishedAt" TIMESTAMP,

  -- Pricing
  "minPrice" DECIMAL(10,2),
  "maxPrice" DECIMAL(10,2),

  -- Inventory
  "totalInventory" INTEGER DEFAULT 0,

  -- SEO
  "metaTitle" TEXT,
  "metaDescription" TEXT,

  -- Images
  images JSONB,
  "featuredImage" TEXT,

  -- Variants
  "variantsCount" INTEGER DEFAULT 0,
  options JSONB,

  -- Full data from Shopify
  "shopifyData" JSONB,

  -- Sync
  "lastSyncAt" TIMESTAMP DEFAULT NOW(),
  "syncStatus" TEXT DEFAULT 'synced' CHECK ("syncStatus" IN ('synced', 'pending', 'error')),

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("organizationId", id)
);

CREATE INDEX idx_shopify_product_org ON "ShopifyProduct"("organizationId");
CREATE INDEX idx_shopify_product_user ON "ShopifyProduct"("userId");
CREATE INDEX idx_shopify_product_integration ON "ShopifyProduct"("integrationId");
CREATE INDEX idx_shopify_product_status ON "ShopifyProduct"(status);
CREATE INDEX idx_shopify_product_handle ON "ShopifyProduct"(handle);
CREATE INDEX idx_shopify_product_vendor ON "ShopifyProduct"(vendor);
CREATE INDEX idx_shopify_product_type ON "ShopifyProduct"("productType");
CREATE INDEX idx_shopify_product_tags ON "ShopifyProduct" USING GIN(tags);
CREATE INDEX idx_shopify_product_search ON "ShopifyProduct" USING GIN(to_tsvector('portuguese', title || ' ' || COALESCE(description, '')));

-- ============================================
-- 3. SHOPIFY PRODUCT VARIANTS
-- ============================================
CREATE TABLE IF NOT EXISTS "ShopifyProductVariant" (
  id BIGINT PRIMARY KEY,
  "productId" BIGINT NOT NULL REFERENCES "ShopifyProduct"(id) ON DELETE CASCADE,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,

  -- Variant Info
  title TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,

  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  "compareAtPrice" DECIMAL(10,2),
  "costPerItem" DECIMAL(10,2),

  -- Inventory
  "inventoryQuantity" INTEGER DEFAULT 0,
  "inventoryManagement" TEXT,
  "inventoryPolicy" TEXT,

  -- Physical
  weight DECIMAL(10,2),
  "weightUnit" TEXT DEFAULT 'kg',
  "requiresShipping" BOOLEAN DEFAULT true,

  -- Tax
  taxable BOOLEAN DEFAULT true,
  "taxCode" TEXT,

  -- Options
  option1 TEXT,
  option2 TEXT,
  option3 TEXT,
  position INTEGER,

  -- Images
  "imageId" BIGINT,

  -- Full data
  "shopifyData" JSONB,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_variant_product ON "ShopifyProductVariant"("productId");
CREATE INDEX idx_variant_org ON "ShopifyProductVariant"("organizationId");
CREATE INDEX idx_variant_sku ON "ShopifyProductVariant"(sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_variant_barcode ON "ShopifyProductVariant"(barcode) WHERE barcode IS NOT NULL;

-- ============================================
-- 4. SHOPIFY ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS "ShopifyOrder" (
  id BIGINT PRIMARY KEY,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "integrationId" UUID NOT NULL REFERENCES "ShopifyIntegration"(id) ON DELETE CASCADE,

  -- Order Info
  "orderNumber" INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,

  -- Status
  status TEXT DEFAULT 'pending',
  "financialStatus" TEXT,
  "fulfillmentStatus" TEXT,
  "cancelledAt" TIMESTAMP,
  "cancelReason" TEXT,

  -- Pricing
  "totalPrice" DECIMAL(10,2) NOT NULL,
  "subtotalPrice" DECIMAL(10,2),
  "totalTax" DECIMAL(10,2) DEFAULT 0,
  "totalDiscounts" DECIMAL(10,2) DEFAULT 0,
  "totalShipping" DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',

  -- Payment
  "paidAt" TIMESTAMP,
  "paymentGatewayNames" TEXT[],

  -- Customer
  "customerId" BIGINT,
  "customerData" JSONB,

  -- Addresses
  "shippingAddress" JSONB,
  "billingAddress" JSONB,

  -- Line Items
  "lineItems" JSONB,
  "lineItemsCount" INTEGER DEFAULT 0,

  -- Fulfillment
  "fulfilledAt" TIMESTAMP,
  fulfillments JSONB,

  -- Tracking
  "trackingNumber" TEXT,
  "trackingUrl" TEXT,

  -- Notes
  note TEXT,
  "noteAttributes" JSONB,
  tags TEXT[],

  -- Source
  "sourceIdentifier" TEXT,
  "sourceName" TEXT,
  "sourceUrl" TEXT,

  -- Full data
  "shopifyData" JSONB,

  -- Sync
  "lastSyncAt" TIMESTAMP DEFAULT NOW(),

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("organizationId", id)
);

CREATE INDEX idx_shopify_order_org ON "ShopifyOrder"("organizationId");
CREATE INDEX idx_shopify_order_user ON "ShopifyOrder"("userId");
CREATE INDEX idx_shopify_order_integration ON "ShopifyOrder"("integrationId");
CREATE INDEX idx_shopify_order_number ON "ShopifyOrder"("orderNumber");
CREATE INDEX idx_shopify_order_email ON "ShopifyOrder"(email);
CREATE INDEX idx_shopify_order_phone ON "ShopifyOrder"(phone);
CREATE INDEX idx_shopify_order_status ON "ShopifyOrder"("financialStatus", "fulfillmentStatus");
CREATE INDEX idx_shopify_order_customer ON "ShopifyOrder"("customerId");
CREATE INDEX idx_shopify_order_created ON "ShopifyOrder"("createdAt" DESC);

-- ============================================
-- 5. SHOPIFY ABANDONED CARTS
-- ============================================
CREATE TABLE IF NOT EXISTS "ShopifyAbandonedCart" (
  id BIGINT PRIMARY KEY,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "integrationId" UUID NOT NULL REFERENCES "ShopifyIntegration"(id) ON DELETE CASCADE,

  -- Customer Info
  email TEXT,
  phone TEXT,
  "customerId" BIGINT,

  -- Cart Info
  token TEXT NOT NULL,
  "cartToken" TEXT,

  -- Pricing
  "totalPrice" DECIMAL(10,2) NOT NULL,
  "subtotalPrice" DECIMAL(10,2),
  "totalTax" DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'BRL',

  -- Line Items
  "lineItems" JSONB,
  "lineItemsCount" INTEGER DEFAULT 0,

  -- Recovery
  "abandonedCheckoutUrl" TEXT,
  "recoveredAt" TIMESTAMP,
  "orderId" BIGINT,

  -- Tracking
  "abandonedAt" TIMESTAMP NOT NULL,
  "emailsSent" INTEGER DEFAULT 0,
  "lastEmailSentAt" TIMESTAMP,

  -- Full data
  "shopifyData" JSONB,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("organizationId", id)
);

CREATE INDEX idx_abandoned_cart_org ON "ShopifyAbandonedCart"("organizationId");
CREATE INDEX idx_abandoned_cart_user ON "ShopifyAbandonedCart"("userId");
CREATE INDEX idx_abandoned_cart_integration ON "ShopifyAbandonedCart"("integrationId");
CREATE INDEX idx_abandoned_cart_email ON "ShopifyAbandonedCart"(email) WHERE email IS NOT NULL;
CREATE INDEX idx_abandoned_cart_phone ON "ShopifyAbandonedCart"(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_abandoned_cart_recovered ON "ShopifyAbandonedCart"("recoveredAt") WHERE "recoveredAt" IS NULL;
CREATE INDEX idx_abandoned_cart_abandoned_at ON "ShopifyAbandonedCart"("abandonedAt" DESC);

-- ============================================
-- 6. SHOPIFY COLLECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS "ShopifyCollection" (
  id BIGINT PRIMARY KEY,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "integrationId" UUID NOT NULL REFERENCES "ShopifyIntegration"(id) ON DELETE CASCADE,

  -- Collection Info
  title TEXT NOT NULL,
  handle TEXT NOT NULL,
  description TEXT,
  "bodyHtml" TEXT,

  -- Type
  "collectionType" TEXT CHECK ("collectionType" IN ('smart', 'custom')),

  -- Status
  "publishedAt" TIMESTAMP,

  -- Products
  "productCount" INTEGER DEFAULT 0,
  products JSONB,

  -- Rules (for smart collections)
  rules JSONB,

  -- Sort
  "sortOrder" TEXT,

  -- Image
  image JSONB,

  -- SEO
  "metaTitle" TEXT,
  "metaDescription" TEXT,

  -- Full data
  "shopifyData" JSONB,

  -- Sync
  "lastSyncAt" TIMESTAMP DEFAULT NOW(),

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("organizationId", id)
);

CREATE INDEX idx_shopify_collection_org ON "ShopifyCollection"("organizationId");
CREATE INDEX idx_shopify_collection_user ON "ShopifyCollection"("userId");
CREATE INDEX idx_shopify_collection_integration ON "ShopifyCollection"("integrationId");
CREATE INDEX idx_shopify_collection_handle ON "ShopifyCollection"(handle);
CREATE INDEX idx_shopify_collection_type ON "ShopifyCollection"("collectionType");

-- ============================================
-- 7. SHOPIFY CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS "ShopifyCustomer" (
  id BIGINT PRIMARY KEY,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "integrationId" UUID NOT NULL REFERENCES "ShopifyIntegration"(id) ON DELETE CASCADE,

  -- Customer Info
  email TEXT,
  phone TEXT,
  "firstName" TEXT,
  "lastName" TEXT,

  -- Status
  state TEXT,
  "verifiedEmail" BOOLEAN DEFAULT false,
  "acceptsMarketing" BOOLEAN DEFAULT false,
  "acceptsMarketingUpdatedAt" TIMESTAMP,

  -- Marketing
  "marketingOptInLevel" TEXT,
  "emailMarketingConsent" JSONB,
  "smsMarketingConsent" JSONB,

  -- Stats
  "ordersCount" INTEGER DEFAULT 0,
  "totalSpent" DECIMAL(10,2) DEFAULT 0,

  -- Dates
  "lastOrderId" BIGINT,
  "lastOrderName" TEXT,

  -- Addresses
  addresses JSONB,
  "defaultAddress" JSONB,

  -- Tags
  tags TEXT[],
  note TEXT,

  -- Full data
  "shopifyData" JSONB,

  -- Sync
  "lastSyncAt" TIMESTAMP DEFAULT NOW(),

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("organizationId", id)
);

CREATE INDEX idx_shopify_customer_org ON "ShopifyCustomer"("organizationId");
CREATE INDEX idx_shopify_customer_user ON "ShopifyCustomer"("userId");
CREATE INDEX idx_shopify_customer_integration ON "ShopifyCustomer"("integrationId");
CREATE INDEX idx_shopify_customer_email ON "ShopifyCustomer"(email) WHERE email IS NOT NULL;
CREATE INDEX idx_shopify_customer_phone ON "ShopifyCustomer"(phone) WHERE phone IS NOT NULL;
CREATE INDEX idx_shopify_customer_tags ON "ShopifyCustomer" USING GIN(tags);

-- ============================================
-- 8. SHOPIFY SYNC LOG
-- ============================================
CREATE TABLE IF NOT EXISTS "ShopifySyncLog" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "integrationId" UUID NOT NULL REFERENCES "ShopifyIntegration"(id) ON DELETE CASCADE,

  -- Sync Info
  "syncType" TEXT NOT NULL CHECK ("syncType" IN (
    'products', 'orders', 'customers', 'collections',
    'abandoned_carts', 'inventory', 'all'
  )),

  -- Status
  status TEXT NOT NULL CHECK (status IN ('started', 'in_progress', 'completed', 'error')),

  -- Progress
  "totalItems" INTEGER DEFAULT 0,
  "processedItems" INTEGER DEFAULT 0,
  "failedItems" INTEGER DEFAULT 0,
  "skippedItems" INTEGER DEFAULT 0,

  -- Timing
  "startedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMP,
  "durationMs" INTEGER,

  -- Error
  "errorMessage" TEXT,
  "errorStack" TEXT,

  -- Details
  details JSONB,

  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sync_log_org ON "ShopifySyncLog"("organizationId");
CREATE INDEX idx_sync_log_integration ON "ShopifySyncLog"("integrationId");
CREATE INDEX idx_sync_log_type ON "ShopifySyncLog"("syncType");
CREATE INDEX idx_sync_log_status ON "ShopifySyncLog"(status);
CREATE INDEX idx_sync_log_started ON "ShopifySyncLog"("startedAt" DESC);

-- ============================================
-- 9. SHOPIFY WEBHOOK LOG
-- ============================================
CREATE TABLE IF NOT EXISTS "ShopifyWebhookLog" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "integrationId" UUID REFERENCES "ShopifyIntegration"(id) ON DELETE SET NULL,

  -- Webhook Info
  topic TEXT NOT NULL,
  "shopDomain" TEXT NOT NULL,

  -- Request
  "requestHeaders" JSONB,
  "requestBody" JSONB,

  -- Processing
  status TEXT NOT NULL CHECK (status IN ('received', 'processing', 'processed', 'error')),
  "processingTime" INTEGER,

  -- Error
  "errorMessage" TEXT,
  "errorStack" TEXT,

  -- Response
  "responseStatus" INTEGER,
  "responseBody" JSONB,

  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_log_org ON "ShopifyWebhookLog"("organizationId");
CREATE INDEX idx_webhook_log_integration ON "ShopifyWebhookLog"("integrationId");
CREATE INDEX idx_webhook_log_topic ON "ShopifyWebhookLog"(topic);
CREATE INDEX idx_webhook_log_status ON "ShopifyWebhookLog"(status);
CREATE INDEX idx_webhook_log_created ON "ShopifyWebhookLog"("createdAt" DESC);

-- ============================================
-- 10. TRIGGERS
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_shopify_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_shopify_integration_updated
  BEFORE UPDATE ON "ShopifyIntegration"
  FOR EACH ROW
  EXECUTE FUNCTION update_shopify_updated_at();

CREATE TRIGGER trigger_shopify_product_updated
  BEFORE UPDATE ON "ShopifyProduct"
  FOR EACH ROW
  EXECUTE FUNCTION update_shopify_updated_at();

CREATE TRIGGER trigger_shopify_variant_updated
  BEFORE UPDATE ON "ShopifyProductVariant"
  FOR EACH ROW
  EXECUTE FUNCTION update_shopify_updated_at();

CREATE TRIGGER trigger_shopify_order_updated
  BEFORE UPDATE ON "ShopifyOrder"
  FOR EACH ROW
  EXECUTE FUNCTION update_shopify_updated_at();

CREATE TRIGGER trigger_shopify_cart_updated
  BEFORE UPDATE ON "ShopifyAbandonedCart"
  FOR EACH ROW
  EXECUTE FUNCTION update_shopify_updated_at();

CREATE TRIGGER trigger_shopify_collection_updated
  BEFORE UPDATE ON "ShopifyCollection"
  FOR EACH ROW
  EXECUTE FUNCTION update_shopify_updated_at();

CREATE TRIGGER trigger_shopify_customer_updated
  BEFORE UPDATE ON "ShopifyCustomer"
  FOR EACH ROW
  EXECUTE FUNCTION update_shopify_updated_at();

-- ============================================
-- 11. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE "ShopifyIntegration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopifyProduct" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopifyProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopifyOrder" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopifyAbandonedCart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopifyCollection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopifyCustomer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopifySyncLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ShopifyWebhookLog" ENABLE ROW LEVEL SECURITY;

-- Policies for ShopifyIntegration
CREATE POLICY shopify_integration_select ON "ShopifyIntegration"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

CREATE POLICY shopify_integration_insert ON "ShopifyIntegration"
  FOR INSERT WITH CHECK (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

CREATE POLICY shopify_integration_update ON "ShopifyIntegration"
  FOR UPDATE USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- Policies for Products
CREATE POLICY shopify_product_select ON "ShopifyProduct"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- Policies for Orders
CREATE POLICY shopify_order_select ON "ShopifyOrder"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- Policies for Abandoned Carts
CREATE POLICY shopify_cart_select ON "ShopifyAbandonedCart"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- Policies for Collections
CREATE POLICY shopify_collection_select ON "ShopifyCollection"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- Policies for Customers
CREATE POLICY shopify_customer_select ON "ShopifyCustomer"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- Policies for Sync Log
CREATE POLICY shopify_sync_log_select ON "ShopifySyncLog"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- Policies for Webhook Log
CREATE POLICY shopify_webhook_log_select ON "ShopifyWebhookLog"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- ============================================
-- 12. GRANTS
-- ============================================

GRANT SELECT, INSERT, UPDATE ON "ShopifyIntegration" TO authenticated;
GRANT SELECT ON "ShopifyProduct" TO authenticated;
GRANT SELECT ON "ShopifyProductVariant" TO authenticated;
GRANT SELECT ON "ShopifyOrder" TO authenticated;
GRANT SELECT ON "ShopifyAbandonedCart" TO authenticated;
GRANT SELECT ON "ShopifyCollection" TO authenticated;
GRANT SELECT ON "ShopifyCustomer" TO authenticated;
GRANT SELECT ON "ShopifySyncLog" TO authenticated;
GRANT SELECT ON "ShopifyWebhookLog" TO authenticated;

-- ============================================
-- 13. COMMENTS
-- ============================================

COMMENT ON TABLE "ShopifyIntegration" IS 'Configuração OAuth e status da integração Shopify';
COMMENT ON TABLE "ShopifyProduct" IS 'Produtos sincronizados da Shopify';
COMMENT ON TABLE "ShopifyProductVariant" IS 'Variantes de produtos Shopify';
COMMENT ON TABLE "ShopifyOrder" IS 'Pedidos sincronizados da Shopify';
COMMENT ON TABLE "ShopifyAbandonedCart" IS 'Carrinhos abandonados para recuperação';
COMMENT ON TABLE "ShopifyCollection" IS 'Coleções de produtos Shopify';
COMMENT ON TABLE "ShopifyCustomer" IS 'Clientes sincronizados da Shopify';
COMMENT ON TABLE "ShopifySyncLog" IS 'Logs de sincronização para debugging';
COMMENT ON TABLE "ShopifyWebhookLog" IS 'Logs de webhooks recebidos';
