-- ============================================
-- SISTEMA DE FATURAMENTO E ASSINATURAS
-- Data: 30/10/2025
-- Descrição: Sistema completo de planos, assinaturas e faturamento
-- ============================================

-- ============================================
-- PARTE 1: TABELA DE PLANOS
-- ============================================

CREATE TABLE IF NOT EXISTS "Plan" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Preço
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BRL',
  interval TEXT DEFAULT 'month' CHECK (interval IN ('day', 'week', 'month', 'year', 'lifetime')),
  "intervalCount" INTEGER DEFAULT 1,
  
  -- Features
  features JSONB DEFAULT '[]',
  
  -- Limites do plano
  "maxAiMessages" INTEGER DEFAULT 0,
  "maxProjects" INTEGER DEFAULT 1,
  "maxIntegrations" INTEGER DEFAULT 1,
  
  -- Status
  active BOOLEAN DEFAULT true,
  "isPopular" BOOLEAN DEFAULT false,
  "sortOrder" INTEGER DEFAULT 0,
  
  -- Stripe
  "stripePriceId" TEXT,
  "stripeProductId" TEXT,
  
  -- Metadata
  metadata JSONB,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_plan_slug ON "Plan"(slug);
CREATE INDEX idx_plan_active ON "Plan"(active);

-- Inserir plano gratuito padrão
INSERT INTO "Plan" (name, slug, description, price, interval, features, "maxAiMessages", active, "sortOrder")
VALUES (
  'Gratuito',
  'free',
  'Checkout de pagamento gratuito para sempre',
  0,
  'lifetime',
  '["Checkout ilimitado", "Gateway de pagamento", "Domínio personalizado", "Relatórios básicos"]',
  0,
  true,
  1
) ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- PARTE 2: TABELA DE ASSINATURAS
-- ============================================

CREATE TABLE IF NOT EXISTS "Subscription" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "planId" UUID NOT NULL REFERENCES "Plan"(id) ON DELETE RESTRICT,
  
  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'trialing', 'past_due', 'canceled', 'incomplete', 'incomplete_expired', 'unpaid')),
  
  -- Datas
  "currentPeriodStart" TIMESTAMP NOT NULL,
  "currentPeriodEnd" TIMESTAMP NOT NULL,
  "trialStart" TIMESTAMP,
  "trialEnd" TIMESTAMP,
  "cancelAt" TIMESTAMP,
  "canceledAt" TIMESTAMP,
  "endedAt" TIMESTAMP,
  
  -- Stripe
  "stripeSubscriptionId" TEXT UNIQUE,
  "stripeCustomerId" TEXT,
  
  -- Uso (AI Messages)
  "usedAiMessages" INTEGER DEFAULT 0,
  "aiMessagesResetAt" TIMESTAMP DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscription_user ON "Subscription"("userId");
CREATE INDEX idx_subscription_plan ON "Subscription"("planId");
CREATE INDEX idx_subscription_status ON "Subscription"(status);
CREATE INDEX idx_subscription_stripe ON "Subscription"("stripeSubscriptionId");

-- ============================================
-- PARTE 3: TABELA DE INVOICES (FATURAS)
-- ============================================

CREATE TABLE IF NOT EXISTS "Invoice" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "subscriptionId" UUID REFERENCES "Subscription"(id) ON DELETE SET NULL,
  
  -- Invoice Info
  "invoiceNumber" TEXT NOT NULL UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'BRL',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  
  -- Payment
  "paymentMethod" TEXT,
  "paidAt" TIMESTAMP,
  "dueDate" TIMESTAMP,
  
  -- Stripe
  "stripeInvoiceId" TEXT UNIQUE,
  "stripeChargeId" TEXT,
  "hostedInvoiceUrl" TEXT,
  "invoicePdf" TEXT,
  
  -- Items
  items JSONB DEFAULT '[]',
  
  -- Metadata
  description TEXT,
  metadata JSONB,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_invoice_user ON "Invoice"("userId");
CREATE INDEX idx_invoice_subscription ON "Invoice"("subscriptionId");
CREATE INDEX idx_invoice_status ON "Invoice"(status);
CREATE INDEX idx_invoice_number ON "Invoice"("invoiceNumber");
CREATE INDEX idx_invoice_stripe ON "Invoice"("stripeInvoiceId");

-- ============================================
-- PARTE 4: TABELA DE PAYMENT METHODS
-- ============================================

CREATE TABLE IF NOT EXISTS "PaymentMethod" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  
  -- Card Info
  type TEXT DEFAULT 'card' CHECK (type IN ('card', 'pix', 'boleto')),
  brand TEXT,
  "last4" TEXT,
  "expiryMonth" INTEGER,
  "expiryYear" INTEGER,
  
  -- Status
  "isDefault" BOOLEAN DEFAULT false,
  
  -- Stripe
  "stripePaymentMethodId" TEXT UNIQUE,
  
  -- Metadata
  metadata JSONB,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_method_user ON "PaymentMethod"("userId");
CREATE INDEX idx_payment_method_default ON "PaymentMethod"("userId", "isDefault");

-- ============================================
-- PARTE 5: ATUALIZAR TABELA USER
-- ============================================

-- Adicionar campos necessários se não existirem
ALTER TABLE "User" 
  ADD COLUMN IF NOT EXISTS "currentPlanId" UUID REFERENCES "Plan"(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS "currentSubscriptionId" UUID REFERENCES "Subscription"(id) ON DELETE SET NULL;

-- Atualizar usuários existentes para o plano gratuito
UPDATE "User" 
SET "currentPlanId" = (SELECT id FROM "Plan" WHERE slug = 'free' LIMIT 1)
WHERE "currentPlanId" IS NULL;

-- ============================================
-- PARTE 6: FUNÇÃO PARA AUTO-GERAR INVOICE NUMBER
-- ============================================

CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  year_month TEXT;
  sequence_number INTEGER;
  new_invoice_number TEXT;
BEGIN
  -- Formato: INV-YYYYMM-0001
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  -- Pegar o último número da sequência do mês
  SELECT COALESCE(MAX(
    CAST(SPLIT_PART("invoiceNumber", '-', 3) AS INTEGER)
  ), 0) + 1
  INTO sequence_number
  FROM "Invoice"
  WHERE "invoiceNumber" LIKE 'INV-' || year_month || '-%';
  
  -- Gerar novo número
  new_invoice_number := 'INV-' || year_month || '-' || LPAD(sequence_number::TEXT, 4, '0');
  
  NEW."invoiceNumber" := new_invoice_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-gerar invoice number
DROP TRIGGER IF EXISTS trigger_generate_invoice_number ON "Invoice";
CREATE TRIGGER trigger_generate_invoice_number
  BEFORE INSERT ON "Invoice"
  FOR EACH ROW
  WHEN (NEW."invoiceNumber" IS NULL)
  EXECUTE FUNCTION generate_invoice_number();

-- ============================================
-- PARTE 7: FUNÇÃO PARA GARANTIR APENAS UM PAYMENT METHOD DEFAULT
-- ============================================

CREATE OR REPLACE FUNCTION ensure_single_default_payment_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW."isDefault" = true THEN
    -- Remove default de outros payment methods do usuário
    UPDATE "PaymentMethod"
    SET "isDefault" = false
    WHERE "userId" = NEW."userId" AND id != NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ensure_single_default_payment_method ON "PaymentMethod";
CREATE TRIGGER trigger_ensure_single_default_payment_method
  BEFORE INSERT OR UPDATE ON "PaymentMethod"
  FOR EACH ROW
  WHEN (NEW."isDefault" = true)
  EXECUTE FUNCTION ensure_single_default_payment_method();

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE "Plan" IS 'Planos de assinatura disponíveis';
COMMENT ON TABLE "Subscription" IS 'Assinaturas ativas dos usuários';
COMMENT ON TABLE "Invoice" IS 'Faturas geradas para os usuários';
COMMENT ON TABLE "PaymentMethod" IS 'Métodos de pagamento salvos dos usuários';

COMMENT ON COLUMN "Plan"."maxAiMessages" IS 'Quantidade máxima de mensagens de IA por mês (0 = ilimitado)';
COMMENT ON COLUMN "Subscription"."usedAiMessages" IS 'Quantidade de mensagens de IA usadas no período atual';
COMMENT ON COLUMN "Subscription"."aiMessagesResetAt" IS 'Data do último reset do contador de mensagens';

