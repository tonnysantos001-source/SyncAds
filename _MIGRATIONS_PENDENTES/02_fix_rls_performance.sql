-- =====================================================
-- MIGRATION: Fix RLS Performance (auth.uid optimization)
-- Data: 21/10/2025
-- Prioridade: CRÍTICA
-- =====================================================
-- Problema: auth.uid() sem (select) causa re-avaliação por linha
-- Solução: Usar (select auth.uid()) para performance

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

DROP POLICY IF EXISTS "Users can update their own analytics" ON "Analytics";
CREATE POLICY "Users can update their own analytics" ON "Analytics"
  FOR UPDATE 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can delete their own analytics" ON "Analytics";
CREATE POLICY "Users can delete their own analytics" ON "Analytics"
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
-- CHATMESSAGE TABLE
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
-- AICONNECTION TABLE (deprecated)
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
-- AIPERSONALITY TABLE (deprecated)
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own AI personality" ON "AiPersonality";
CREATE POLICY "Users can view their own AI personality" ON "AiPersonality"
  FOR SELECT 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can insert their own AI personality" ON "AiPersonality";
CREATE POLICY "Users can insert their own AI personality" ON "AiPersonality"
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can update their own AI personality" ON "AiPersonality";
CREATE POLICY "Users can update their own AI personality" ON "AiPersonality"
  FOR UPDATE 
  USING ((select auth.uid())::text = "userId");

DROP POLICY IF EXISTS "Users can delete their own AI personality" ON "AiPersonality";
CREATE POLICY "Users can delete their own AI personality" ON "AiPersonality"
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
-- REFRESHTOKEN TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own refresh tokens" ON "RefreshToken";
DROP POLICY IF EXISTS "Users can create their own refresh tokens" ON "RefreshToken";
DROP POLICY IF EXISTS "Users can delete their own refresh tokens" ON "RefreshToken";

-- Consolidar em 1 policy por ação
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
-- FIM DA MIGRATION
-- =====================================================
