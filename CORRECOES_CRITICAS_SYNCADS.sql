-- =====================================================
-- CORREÇÕES CRÍTICAS SYNCADS - APLICAR IMEDIATAMENTE
-- Data: 25/10/2025
-- Prioridade: CRÍTICA
-- =====================================================

-- =====================================================
-- 1. FIX FUNCTIONS SEARCH_PATH (Security Definer Bypass)
-- =====================================================

ALTER FUNCTION public.is_super_admin() 
  SECURITY DEFINER 
  SET search_path = public, extensions;

ALTER FUNCTION public.encrypt_api_key(text) 
  SECURITY DEFINER 
  SET search_path = public, extensions;

ALTER FUNCTION public.decrypt_api_key(text) 
  SECURITY DEFINER 
  SET search_path = public, extensions;

ALTER FUNCTION public.expire_old_invites() 
  SECURITY DEFINER 
  SET search_path = public, extensions;

-- =====================================================
-- 2. CREATE INDEXES FOR FOREIGN KEYS (Performance)
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_campaign_userid ON "Campaign"("userId");
CREATE INDEX IF NOT EXISTS idx_cartitem_variantid ON "CartItem"("variantId");
CREATE INDEX IF NOT EXISTS idx_lead_customerid ON "Lead"("customerId");
CREATE INDEX IF NOT EXISTS idx_order_cartid ON "Order"("cartId");
CREATE INDEX IF NOT EXISTS idx_orderitem_variantid ON "OrderItem"("variantId");
CREATE INDEX IF NOT EXISTS idx_pendinginvite_invitedby ON "PendingInvite"("invitedBy");

-- Índices compostos críticos
CREATE INDEX IF NOT EXISTS idx_chat_msg_conv_date ON "ChatMessage"("conversationId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_org_status ON "Campaign"("organizationId", status);
CREATE INDEX IF NOT EXISTS idx_product_org_status ON "Product"("organizationId", status);

-- =====================================================
-- 3. FIX SCHEMA ISSUES (Campos faltantes)
-- =====================================================

-- Adicionar systemPrompt em GlobalAiConnection
ALTER TABLE "GlobalAiConnection" ADD COLUMN IF NOT EXISTS "systemPrompt" TEXT;

-- Adicionar isActive em Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- Criar função is_service_role() faltante
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
EXCEPTION
  WHEN OTHERS THEN RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, extensions;

-- =====================================================
-- 4. OPTIMIZE RLS POLICIES (Performance)
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
-- 5. CONSOLIDATE DUPLICATE POLICIES
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
-- 6. ADD MISSING TRIGGERS (updated_at)
-- =====================================================

-- Triggers para tabelas críticas
CREATE TRIGGER update_global_ai_updated_at 
  BEFORE UPDATE ON "GlobalAiConnection"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_ai_updated_at 
  BEFORE UPDATE ON "OrganizationAiConnection"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_updated_at 
  BEFORE UPDATE ON "ChatConversation"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_updated_at 
  BEFORE UPDATE ON "Integration"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_updated_at 
  BEFORE UPDATE ON "Subscription"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_usage_updated_at 
  BEFORE UPDATE ON "AiUsage"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_media_generation_updated_at 
  BEFORE UPDATE ON "MediaGeneration"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. ADD CHECK CONSTRAINTS
-- =====================================================

-- Organization constraints
ALTER TABLE "Organization" ADD CONSTRAINT IF NOT EXISTS check_plan 
  CHECK (plan IN ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'));

ALTER TABLE "Organization" ADD CONSTRAINT IF NOT EXISTS check_status 
  CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'));

-- Campaign constraints
ALTER TABLE "Campaign" ADD CONSTRAINT IF NOT EXISTS check_campaign_status 
  CHECK (status IN ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'));

-- Product constraints
ALTER TABLE "Product" ADD CONSTRAINT IF NOT EXISTS check_product_status 
  CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'));

-- =====================================================
-- 8. CREATE STORAGE BUCKET (se não existir)
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('media-generations', 'media-generations', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- CORREÇÕES APLICADAS COM SUCESSO!
-- =====================================================
