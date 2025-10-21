-- ============================================
-- MÓDULO: GATEWAYS E PAGAMENTOS
-- Tabelas: Gateway, GatewayConfig, Transaction
-- ============================================

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- GATEWAYS
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

-- ============================================
-- GATEWAY CONFIG (por organização)
-- ============================================
CREATE TABLE IF NOT EXISTS "GatewayConfig" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "gatewayId" UUID NOT NULL REFERENCES "Gateway"(id) ON DELETE CASCADE,
  
  -- Credentials (serão encriptadas)
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
-- TRANSACTIONS
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
  
  -- PIX specific
  "pixQrCode" TEXT,
  "pixCopyPaste" TEXT,
  "pixExpiresAt" TIMESTAMP,
  
  -- Boleto specific
  "boletoUrl" TEXT,
  "boletoBarcode" TEXT,
  "boletoExpiresAt" TIMESTAMP,
  
  -- Card specific
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
