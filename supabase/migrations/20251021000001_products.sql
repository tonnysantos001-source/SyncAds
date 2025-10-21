-- ============================================
-- MÓDULO: PRODUTOS E CATÁLOGO
-- Tabelas: Category, Product, ProductVariant, ProductImage, Collection, Kit, KitItem
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES
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

-- ============================================
-- PRODUCTS
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

-- ============================================
-- PRODUCT VARIANTS
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
-- PRODUCT IMAGES
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
-- COLLECTIONS
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

-- ============================================
-- KITS
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

-- ============================================
-- KIT ITEMS
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
