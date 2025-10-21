-- ============================================
-- MÓDULO: CHECKOUT E TRACKING
-- Tabelas: CheckoutCustomization, CheckoutSection, Pixel, PixelEvent, SocialProof, Banner, Shipping
-- ============================================

-- ============================================
-- CHECKOUT CUSTOMIZATION
-- ============================================
CREATE TABLE IF NOT EXISTS "CheckoutCustomization" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  theme JSONB NOT NULL DEFAULT '{}', -- Colors, fonts, etc
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId", name)
);

CREATE INDEX idx_checkout_custom_org ON "CheckoutCustomization"("organizationId");

-- ============================================
-- CHECKOUT SECTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS "CheckoutSection" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "customizationId" UUID NOT NULL REFERENCES "CheckoutCustomization"(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('HEADER', 'NOTICE_BAR', 'BANNER', 'CART', 'CONTENT', 'FOOTER', 'SCARCITY', 'ORDER_BUMP')),
  config JSONB NOT NULL DEFAULT '{}',
  "order" INTEGER DEFAULT 0,
  "isVisible" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_checkout_section_custom ON "CheckoutSection"("customizationId");

-- ============================================
-- PIXELS
-- ============================================
CREATE TABLE IF NOT EXISTS "Pixel" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('FACEBOOK', 'GOOGLE_ANALYTICS', 'GOOGLE_ADS', 'TIKTOK', 'LINKEDIN', 'TWITTER')),
  "pixelId" TEXT NOT NULL,
  events TEXT[] DEFAULT ARRAY['page_view', 'add_to_cart', 'purchase']::TEXT[],
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pixel_org ON "Pixel"("organizationId");
CREATE INDEX idx_pixel_platform ON "Pixel"(platform);

-- ============================================
-- PIXEL EVENTS
-- ============================================
CREATE TABLE IF NOT EXISTS "PixelEvent" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "pixelId" UUID NOT NULL REFERENCES "Pixel"(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  data JSONB,
  "firedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pixel_event_pixel ON "PixelEvent"("pixelId");
CREATE INDEX idx_pixel_event_fired ON "PixelEvent"("firedAt");

-- ============================================
-- SOCIAL PROOF
-- ============================================
CREATE TABLE IF NOT EXISTS "SocialProof" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('RECENT_PURCHASE', 'LIVE_VIEWS', 'LOW_STOCK', 'COUNTDOWN', 'REVIEWS')),
  message TEXT NOT NULL,
  triggers JSONB, -- Condições para mostrar
  display JSONB NOT NULL DEFAULT '{}', -- Position, animation, etc
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_social_proof_org ON "SocialProof"("organizationId");
CREATE INDEX idx_social_proof_active ON "SocialProof"("isActive");

-- ============================================
-- BANNERS
-- ============================================
CREATE TABLE IF NOT EXISTS "Banner" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  "imageUrl" TEXT NOT NULL,
  "mobileImageUrl" TEXT,
  link TEXT,
  position TEXT NOT NULL CHECK (position IN ('TOP', 'MIDDLE', 'BOTTOM', 'SIDEBAR', 'POPUP')),
  "startsAt" TIMESTAMP,
  "endsAt" TIMESTAMP,
  "isActive" BOOLEAN DEFAULT true,
  "order" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_banner_org ON "Banner"("organizationId");
CREATE INDEX idx_banner_active ON "Banner"("isActive");

-- ============================================
-- SHIPPING
-- ============================================
CREATE TABLE IF NOT EXISTS "Shipping" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  carrier TEXT, -- CORREIOS, SEDEX, PAC, etc
  type TEXT NOT NULL CHECK (type IN ('FREE', 'FLAT_RATE', 'WEIGHT_BASED', 'PRICE_BASED', 'CALCULATED')),
  price DECIMAL(10,2),
  "minOrderValue" DECIMAL(10,2), -- Frete grátis acima de X
  "estimatedDays" INTEGER,
  zones TEXT[], -- Estados ou regiões
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_shipping_org ON "Shipping"("organizationId");
CREATE INDEX idx_shipping_active ON "Shipping"("isActive");
