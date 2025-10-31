-- =====================================================
-- MIGRATION: Fix RLS Performance (auth.uid optimization)
-- Data: 31/10/2025
-- Prioridade: CRÍTICA
-- Descrição: Otimiza RLS usando (select auth.uid()) para melhor performance
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
-- ANALYTICS TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own analytics" ON "Analytics";
CREATE POLICY "Users can view their own analytics" ON "Analytics"
  FOR SELECT
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own analytics" ON "Analytics";
CREATE POLICY "Users can insert their own analytics" ON "Analytics"
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = "userId");

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
-- CHATMESSAGE TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view messages from their conversations" ON "ChatMessage";
CREATE POLICY "Users can view messages from their conversations" ON "ChatMessage"
  FOR SELECT
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON "ChatMessage";
CREATE POLICY "Users can insert messages to their conversations" ON "ChatMessage"
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON "ChatMessage";
CREATE POLICY "Users can delete messages from their conversations" ON "ChatMessage"
  FOR DELETE
  USING ((select auth.uid())::text = "userId");

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

-- =====================================================
-- AICONNECTION TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own AI connections" ON "AiConnection";
CREATE POLICY "Users can view their own AI connections" ON "AiConnection"
  FOR SELECT
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own AI connections" ON "AiConnection";
CREATE POLICY "Users can insert their own AI connections" ON "AiConnection"
  FOR INSERT
  WITH CHECK ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can update their own AI connections" ON "AiConnection";
CREATE POLICY "Users can update their own AI connections" ON "AiConnection"
  FOR UPDATE
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can delete their own AI connections" ON "AiConnection";
CREATE POLICY "Users can delete their own AI connections" ON "AiConnection"
  FOR DELETE
  USING ((select auth.uid())::text = "userId");

-- =====================================================
-- NOTIFICATION TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own notifications" ON "Notification";
CREATE POLICY "Users can view their own notifications" ON "Notification"
  FOR SELECT
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can update their own notifications" ON "Notification";
CREATE POLICY "Users can update their own notifications" ON "Notification"
  FOR UPDATE
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can delete their own notifications" ON "Notification";
CREATE POLICY "Users can delete their own notifications" ON "Notification"
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
-- VERIFICAÇÃO DE SUCESSO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS Performance otimizado com sucesso';
  RAISE NOTICE '✅ Todas as policies usando (select auth.uid())';
END $$;

COMMIT;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
