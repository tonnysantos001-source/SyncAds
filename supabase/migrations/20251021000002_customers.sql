-- ============================================
-- MÓDULO: CLIENTES E LEADS
-- Tabelas: Customer, CustomerAddress, Lead
-- ============================================

-- ============================================
-- CUSTOMERS
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

-- ============================================
-- CUSTOMER ADDRESSES
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

-- ============================================
-- LEADS
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
