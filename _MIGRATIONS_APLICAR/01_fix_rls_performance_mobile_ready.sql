-- =====================================================
-- MIGRATION: Fix RLS Performance + Mobile Ready
-- Data: 31 de Outubro de 2025
-- Prioridade: CRÍTICA
-- Descrição: Otimiza RLS policies para performance e corrige sistema sem organizações
-- =====================================================

BEGIN;

-- =====================================================
-- USER TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
CREATE POLICY "Users can view their own profile" ON "User"
  FOR SELECT 
  USING ((select auth.uid())::text = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON "User";
CREATE POLICY "Users can update their own profile" ON "User"
  FOR UPDATE 
  USING ((select auth.uid())::text = id);

-- =====================================================
-- CAMPAIGN TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own campaigns" ON "Campaign";
CREATE POLICY "Users can view their own campaigns" ON "Campaign"
  FOR SELECT 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own campaigns" ON "Campaign";
CREATE POLICY "Users can insert their own campaigns" ON "Campaign"
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can update their own campaigns" ON "Campaign";
CREATE POLICY "Users can update their own campaigns" ON "Campaign"
  FOR UPDATE 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can delete their own campaigns" ON "Campaign";
CREATE POLICY "Users can delete their own campaigns" ON "Campaign"
  FOR DELETE 
  USING ((select auth.uid())::text = "userId");

-- =====================================================
-- CHATCONVERSATION TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own conversations" ON "ChatConversation";
CREATE POLICY "Users can view their own conversations" ON "ChatConversation"
  FOR SELECT 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own conversations" ON "ChatConversation";
CREATE POLICY "Users can insert their own conversations" ON "ChatConversation"
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can update their own conversations" ON "ChatConversation";
CREATE POLICY "Users can update their own conversations" ON "ChatConversation"
  FOR UPDATE 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can delete their own conversations" ON "ChatConversation";
CREATE POLICY "Users can delete their own conversations" ON "ChatConversation"
  FOR DELETE 
  USING ((select auth.uid())::text = "userId");

-- =====================================================
-- CHATMESSAGE TABLE - CRÍTICO PARA MOBILE
-- =====================================================

DROP POLICY IF EXISTS "Users can view messages from their conversations" ON "ChatMessage";
CREATE POLICY "Users can view messages from their conversations" ON "ChatMessage"
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON "ChatMessage";
CREATE POLICY "Users can insert messages to their conversations" ON "ChatMessage"
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "Users can update messages in their conversations" ON "ChatMessage";
CREATE POLICY "Users can update messages in their conversations" ON "ChatMessage"
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = (select auth.uid())::text
    )
  );

DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON "ChatMessage";
CREATE POLICY "Users can delete messages from their conversations" ON "ChatMessage"
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = (select auth.uid())::text
    )
  );

-- =====================================================
-- INTEGRATION TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own integrations" ON "Integration";
CREATE POLICY "Users can view their own integrations" ON "Integration"
  FOR SELECT 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own integrations" ON "Integration";
CREATE POLICY "Users can insert their own integrations" ON "Integration"
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can update their own integrations" ON "Integration";
CREATE POLICY "Users can update their own integrations" ON "Integration"
  FOR UPDATE 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can delete their own integrations" ON "Integration";
CREATE POLICY "Users can delete their own integrations" ON "Integration"
  FOR DELETE 
  USING ((select auth.uid())::text = "userId");

-- =====================================================
-- APIKEY TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own API keys" ON "ApiKey";
CREATE POLICY "Users can view their own API keys" ON "ApiKey"
  FOR SELECT 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own API keys" ON "ApiKey";
CREATE POLICY "Users can insert their own API keys" ON "ApiKey"
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can update their own API keys" ON "ApiKey";
CREATE POLICY "Users can update their own API keys" ON "ApiKey"
  FOR UPDATE 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can delete their own API keys" ON "ApiKey";
CREATE POLICY "Users can delete their own API keys" ON "ApiKey"
  FOR DELETE 
  USING ((select auth.uid())::text = "userId");

-- =====================================================
-- REFRESHTOKEN TABLE - Consolidar policies duplicadas
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own refresh tokens" ON "RefreshToken";
DROP POLICY IF EXISTS "Users can create their own refresh tokens" ON "RefreshToken";
DROP POLICY IF EXISTS "Users can delete their own refresh tokens" ON "RefreshToken";
DROP POLICY IF EXISTS "refresh_token_select" ON "RefreshToken";
DROP POLICY IF EXISTS "refresh_token_insert" ON "RefreshToken";
DROP POLICY IF EXISTS "refresh_token_delete" ON "RefreshToken";

-- Criar policies consolidadas
CREATE POLICY "refresh_token_select" ON "RefreshToken"
  FOR SELECT 
  USING (
    is_service_role() OR 
    (select auth.uid())::text = "userId"
  );

CREATE POLICY "refresh_token_insert" ON "RefreshToken"
  FOR INSERT 
  WITH CHECK (
    is_service_role() OR 
    (select auth.uid())::text = "userId"
  );

CREATE POLICY "refresh_token_delete" ON "RefreshToken"
  FOR DELETE 
  USING (
    is_service_role() OR 
    (select auth.uid())::text = "userId"
  );

-- =====================================================
-- PRODUCT TABLE (E-commerce)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own products" ON "Product";
CREATE POLICY "Users can view their own products" ON "Product"
  FOR SELECT 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own products" ON "Product";
CREATE POLICY "Users can insert their own products" ON "Product"
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can update their own products" ON "Product";
CREATE POLICY "Users can update their own products" ON "Product"
  FOR UPDATE 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can delete their own products" ON "Product";
CREATE POLICY "Users can delete their own products" ON "Product"
  FOR DELETE 
  USING ((select auth.uid())::text = "userId");

-- =====================================================
-- CUSTOMER TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own customers" ON "Customer";
CREATE POLICY "Users can view their own customers" ON "Customer"
  FOR SELECT 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own customers" ON "Customer";
CREATE POLICY "Users can insert their own customers" ON "Customer"
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can update their own customers" ON "Customer";
CREATE POLICY "Users can update their own customers" ON "Customer"
  FOR UPDATE 
  USING ((select auth.uid())::text = "userId");

-- =====================================================
-- GATEWAYCONFIG TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own gateway configs" ON "GatewayConfig";
CREATE POLICY "Users can view their own gateway configs" ON "GatewayConfig"
  FOR SELECT 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own gateway configs" ON "GatewayConfig";
CREATE POLICY "Users can insert their own gateway configs" ON "GatewayConfig"
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can update their own gateway configs" ON "GatewayConfig";
CREATE POLICY "Users can update their own gateway configs" ON "GatewayConfig"
  FOR UPDATE 
  USING ((select auth.uid())::text = "userId");

-- =====================================================
-- CRIAR ÍNDICES PARA MOBILE PERFORMANCE
-- =====================================================

-- Índice para ChatMessage.conversationId (muito usado em mobile)
CREATE INDEX IF NOT EXISTS idx_chatmessage_conversationid_createdat 
  ON "ChatMessage" ("conversationId", "createdAt" DESC);

-- Índice para ChatConversation.userId (lista de conversas)
CREATE INDEX IF NOT EXISTS idx_chatconversation_userid_updatedat 
  ON "ChatConversation" ("userId", "updatedAt" DESC);

-- Índice para Campaign.userId
CREATE INDEX IF NOT EXISTS idx_campaign_userid_createdat 
  ON "Campaign" ("userId", "createdAt" DESC);

-- Índice para Integration.userId
CREATE INDEX IF NOT EXISTS idx_integration_userid 
  ON "Integration" ("userId");

-- =====================================================
-- LOG DE SUCESSO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration aplicada com sucesso!';
  RAISE NOTICE '📊 RLS policies otimizadas para performance';
  RAISE NOTICE '📱 Índices adicionados para mobile';
  RAISE NOTICE '🚀 Sistema pronto para uso!';
END $$;

COMMIT;
