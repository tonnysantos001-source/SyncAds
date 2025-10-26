-- =====================================================
-- TABELA: PaymentDiscount
-- Descrição: Descontos por forma de pagamento por organização
-- =====================================================

CREATE TABLE IF NOT EXISTS "PaymentDiscount" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "creditCard" DECIMAL(5,2),
  "pix" DECIMAL(5,2),
  "bankSlip" DECIMAL(5,2),
  "bizum" DECIMAL(5,2),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId")
);

CREATE INDEX idx_payment_discount_org ON "PaymentDiscount"("organizationId");

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Permitir que organizações vejam seus próprios descontos
CREATE POLICY "Organizations can view their own payment discounts" ON "PaymentDiscount"
  FOR SELECT 
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );

-- Permitir que organizações atualizem seus próprios descontos
CREATE POLICY "Organizations can update their own payment discounts" ON "PaymentDiscount"
  FOR UPDATE 
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );

-- Permitir que organizações criem seus próprios descontos
CREATE POLICY "Organizations can insert their own payment discounts" ON "PaymentDiscount"
  FOR INSERT 
  WITH CHECK (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );

-- Permitir que organizações deletem seus próprios descontos
CREATE POLICY "Organizations can delete their own payment discounts" ON "PaymentDiscount"
  FOR DELETE 
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );
