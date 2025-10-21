-- =====================================================
-- MIGRATION: Consolidate Duplicate Permissive Policies
-- Data: 21/10/2025
-- Prioridade: CRÍTICA (Performance)
-- =====================================================
-- Problema: Multiple permissive policies executadas 2x
-- Solução: Consolidar em 1 policy com OR

-- =====================================================
-- ORGANIZATION TABLE
-- =====================================================

-- Remover policies duplicadas
DROP POLICY IF EXISTS "org_all" ON "Organization";
DROP POLICY IF EXISTS "org_select" ON "Organization";

-- Consolidar SELECT
CREATE POLICY "organization_select" ON "Organization"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    id IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- =====================================================
-- ORGANIZATIONAICONNECTION TABLE
-- =====================================================

DROP POLICY IF EXISTS "org_ai_all" ON "OrganizationAiConnection";
DROP POLICY IF EXISTS "org_ai_select" ON "OrganizationAiConnection";

CREATE POLICY "org_ai_select" ON "OrganizationAiConnection"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- =====================================================
-- AIUSAGE TABLE
-- =====================================================

DROP POLICY IF EXISTS "ai_usage_all" ON "AiUsage";
DROP POLICY IF EXISTS "ai_usage_select" ON "AiUsage";

CREATE POLICY "ai_usage_select" ON "AiUsage"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- =====================================================
-- SUBSCRIPTION TABLE
-- =====================================================

DROP POLICY IF EXISTS "subscription_all" ON "Subscription";
DROP POLICY IF EXISTS "subscription_select" ON "Subscription";

CREATE POLICY "subscription_select" ON "Subscription"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- =====================================================
-- USAGETRACKING TABLE
-- =====================================================

DROP POLICY IF EXISTS "usage_all" ON "UsageTracking";
DROP POLICY IF EXISTS "usage_select" ON "UsageTracking";

CREATE POLICY "usage_select" ON "UsageTracking"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- =====================================================
-- REFRESHTOKEN - JÁ FEITO NA MIGRATION 02
-- (policies já consolidadas em refresh_token_select/insert/delete)
-- =====================================================

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
