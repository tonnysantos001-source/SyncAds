-- =====================================================
-- CORREÇÕES RLS POLICIES - EXECUTAR NO SUPABASE DASHBOARD
-- Data: 25/10/2025
-- Prioridade: CRÍTICA (Performance)
-- =====================================================

-- =====================================================
-- 1. OPTIMIZE RLS POLICIES (Performance)
-- =====================================================

-- USER TABLE
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
CREATE POLICY "Users can view their own profile" ON "User"
  FOR SELECT 
  USING ((select auth.uid())::text = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON "User";
CREATE POLICY "Users can update their own profile" ON "User"
  FOR UPDATE 
  USING ((select auth.uid())::text = id);

-- CAMPAIGN TABLE
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

-- CHATCONVERSATION TABLE
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

-- CHATMESSAGE TABLE
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

-- INTEGRATION TABLE
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
-- 2. CONSOLIDATE DUPLICATE POLICIES
-- =====================================================

-- ORGANIZATION TABLE
DROP POLICY IF EXISTS "org_all" ON "Organization";
DROP POLICY IF EXISTS "org_select" ON "Organization";

CREATE POLICY "organization_select" ON "Organization"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    id IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- ORGANIZATIONAICONNECTION TABLE
DROP POLICY IF EXISTS "org_ai_all" ON "OrganizationAiConnection";
DROP POLICY IF EXISTS "org_ai_select" ON "OrganizationAiConnection";

CREATE POLICY "org_ai_select" ON "OrganizationAiConnection"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- AIUSAGE TABLE
DROP POLICY IF EXISTS "ai_usage_all" ON "AiUsage";
DROP POLICY IF EXISTS "ai_usage_select" ON "AiUsage";

CREATE POLICY "ai_usage_select" ON "AiUsage"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- SUBSCRIPTION TABLE
DROP POLICY IF EXISTS "subscription_all" ON "Subscription";
DROP POLICY IF EXISTS "subscription_select" ON "Subscription";

CREATE POLICY "subscription_select" ON "Subscription"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- USAGETRACKING TABLE
DROP POLICY IF EXISTS "usage_all" ON "UsageTracking";
DROP POLICY IF EXISTS "usage_select" ON "UsageTracking";

CREATE POLICY "usage_select" ON "UsageTracking"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- REFRESHTOKEN TABLE
DROP POLICY IF EXISTS "Users can view their own refresh tokens" ON "RefreshToken";
DROP POLICY IF EXISTS "Users can create their own refresh tokens" ON "RefreshToken";
DROP POLICY IF EXISTS "Users can delete their own refresh tokens" ON "RefreshToken";

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
-- RLS POLICIES CORRIGIDAS COM SUCESSO!
-- =====================================================
