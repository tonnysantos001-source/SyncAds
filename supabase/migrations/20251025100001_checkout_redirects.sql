-- =====================================================
-- TABELA: CheckoutRedirect
-- Descrição: URLs de redirecionamento por forma de pagamento
-- =====================================================

CREATE TABLE IF NOT EXISTS "CheckoutRedirect" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "creditCardUrl" TEXT,
  "bankSlipUrl" TEXT,
  "pixUrl" TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("organizationId")
);

CREATE INDEX idx_checkout_redirect_org ON "CheckoutRedirect"("organizationId");

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Permitir que organizações vejam seus próprios redirecionamentos
CREATE POLICY "Organizations can view their own redirects" ON "CheckoutRedirect"
  FOR SELECT 
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );

-- Permitir que organizações atualizem seus próprios redirecionamentos
CREATE POLICY "Organizations can update their own redirects" ON "CheckoutRedirect"
  FOR UPDATE 
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );

-- Permitir que organizações criem seus próprios redirecionamentos
CREATE POLICY "Organizations can insert their own redirects" ON "CheckoutRedirect"
  FOR INSERT 
  WITH CHECK (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );

-- Permitir que organizações deletem seus próprios redirecionamentos
CREATE POLICY "Organizations can delete their own redirects" ON "CheckoutRedirect"
  FOR DELETE 
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );
