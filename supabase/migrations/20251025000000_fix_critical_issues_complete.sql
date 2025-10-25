-- =====================================================
-- MIGRATION: Correção Completa de Issues Críticos
-- Data: 25/10/2025
-- Prioridade: CRÍTICA
-- Descrição: Consolida todas as correções identificadas na auditoria
-- =====================================================

-- =====================================================
-- PARTE 1: CORREÇÕES DE SCHEMA
-- =====================================================

-- 1.1: Adicionar systemPrompt em GlobalAiConnection
ALTER TABLE "GlobalAiConnection" 
  ADD COLUMN IF NOT EXISTS "systemPrompt" TEXT;

-- 1.2: Adicionar isActive em Product
ALTER TABLE "Product" 
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

-- 1.3: Adicionar status em Product (usado em várias queries)
ALTER TABLE "Product" 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE' 
  CHECK (status IN ('DRAFT', 'ACTIVE', 'ARCHIVED'));

-- 1.4: Adicionar CHECKs em Organization
DO $$
BEGIN
  -- Remover constraint antigo se existir
  ALTER TABLE "Organization" DROP CONSTRAINT IF EXISTS check_plan;
  ALTER TABLE "Organization" DROP CONSTRAINT IF EXISTS check_status;
  
  -- Adicionar novos
  ALTER TABLE "Organization" ADD CONSTRAINT check_plan 
    CHECK (plan IN ('FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'));
    
  ALTER TABLE "Organization" ADD CONSTRAINT check_status 
    CHECK (status IN ('TRIAL', 'ACTIVE', 'SUSPENDED', 'CANCELLED'));
END $$;

-- =====================================================
-- PARTE 2: FUNCTIONS DE SEGURANÇA
-- =====================================================

-- 2.1: Criar is_service_role() (usada mas não existe)
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN current_setting('request.jwt.claims', true)::json->>'role' = 'service_role';
EXCEPTION
  WHEN OTHERS THEN RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
SET search_path = public, extensions;

-- 2.2: Corrigir search_path em functions existentes
DO $$
BEGIN
  -- Corrigir is_super_admin se existir
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'is_super_admin'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.is_super_admin() SET search_path = public, extensions';
  END IF;
  
  -- Corrigir update_updated_at_column se existir
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'update_updated_at_column'
  ) THEN
    EXECUTE 'ALTER FUNCTION public.update_updated_at_column() SET search_path = public, extensions';
  END IF;
  
  -- Apenas mensagem informativa sobre funcoes de encriptacao
  RAISE NOTICE 'Funcoes encrypt_api_key/decrypt_api_key nao existem - ok para pular';
END $$;

-- =====================================================
-- PARTE 3: INDICES DE PERFORMANCE
-- =====================================================

-- 3.1: Indices em Foreign Keys
CREATE INDEX IF NOT EXISTS idx_campaign_userid ON "Campaign"("userId");
CREATE INDEX IF NOT EXISTS idx_cartitem_variantid ON "CartItem"("variantId");
CREATE INDEX IF NOT EXISTS idx_lead_customerid ON "Lead"("customerId");
CREATE INDEX IF NOT EXISTS idx_order_cartid ON "Order"("cartId");
CREATE INDEX IF NOT EXISTS idx_orderitem_variantid ON "OrderItem"("variantId");

-- 3.2: Indices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS idx_chat_message_conversation_created 
  ON "ChatMessage"("conversationId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_campaign_org_status 
  ON "Campaign"("organizationId", status);

CREATE INDEX IF NOT EXISTS idx_product_org_status 
  ON "Product"("organizationId", status) WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_order_org_created
  ON "Order"("organizationId", "createdAt" DESC);

CREATE INDEX IF NOT EXISTS idx_media_org_created
  ON "MediaGeneration"("organizationId", "createdAt" DESC);

-- =====================================================
-- PARTE 4: RLS PERFORMANCE - Consolidar Policies Duplicadas
-- =====================================================

-- 4.1: Organization
DROP POLICY IF EXISTS "org_all" ON "Organization";
DROP POLICY IF EXISTS "org_select" ON "Organization";
DROP POLICY IF EXISTS "Users see own organization" ON "Organization";
DROP POLICY IF EXISTS "organization_select" ON "Organization";

CREATE POLICY "organization_select" ON "Organization"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    id IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- 4.2: OrganizationAiConnection
DROP POLICY IF EXISTS "org_ai_all" ON "OrganizationAiConnection";
DROP POLICY IF EXISTS "org_ai_select" ON "OrganizationAiConnection";
DROP POLICY IF EXISTS "Users see assigned AI" ON "OrganizationAiConnection";

CREATE POLICY "org_ai_select" ON "OrganizationAiConnection"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- 4.3: AiUsage
DROP POLICY IF EXISTS "ai_usage_all" ON "AiUsage";
DROP POLICY IF EXISTS "ai_usage_select" ON "AiUsage";

CREATE POLICY "ai_usage_select" ON "AiUsage"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- 4.4: Subscription
DROP POLICY IF EXISTS "subscription_all" ON "Subscription";
DROP POLICY IF EXISTS "subscription_select" ON "Subscription";

CREATE POLICY "subscription_select" ON "Subscription"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- 4.5: UsageTracking
DROP POLICY IF EXISTS "usage_all" ON "UsageTracking";
DROP POLICY IF EXISTS "usage_select" ON "UsageTracking";

CREATE POLICY "usage_select" ON "UsageTracking"
  FOR SELECT 
  USING (
    is_super_admin() OR 
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

-- =====================================================
-- PARTE 5: RLS PERFORMANCE - Otimizar auth.uid()
-- =====================================================

-- 5.1: User table
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
DROP POLICY IF EXISTS "Users can update their own profile" ON "User";
DROP POLICY IF EXISTS "Users see org members" ON "User";
DROP POLICY IF EXISTS "user_select" ON "User";
DROP POLICY IF EXISTS "user_update" ON "User";

CREATE POLICY "user_select" ON "User"
  FOR SELECT 
  USING (
    is_super_admin() OR
    (select auth.uid())::text = id OR
    "organizationId" IN (SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text)
  );

CREATE POLICY "user_update" ON "User"
  FOR UPDATE 
  USING ((select auth.uid())::text = id);

-- 5.2: Campaign table
DROP POLICY IF EXISTS "Users can view their own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can update their own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users see org campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users insert org campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users update org campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users delete org campaigns" ON "Campaign";
DROP POLICY IF EXISTS "campaign_select" ON "Campaign";
DROP POLICY IF EXISTS "campaign_insert" ON "Campaign";
DROP POLICY IF EXISTS "campaign_update" ON "Campaign";
DROP POLICY IF EXISTS "campaign_delete" ON "Campaign";

CREATE POLICY "campaign_select" ON "Campaign"
  FOR SELECT 
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );

CREATE POLICY "campaign_insert" ON "Campaign"
  FOR INSERT 
  WITH CHECK (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );

CREATE POLICY "campaign_update" ON "Campaign"
  FOR UPDATE 
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );

CREATE POLICY "campaign_delete" ON "Campaign"
  FOR DELETE 
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );

-- 5.3: ChatConversation
DROP POLICY IF EXISTS "Users can view their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can insert their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can update their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can delete their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users see own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users create own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "conversation_select" ON "ChatConversation";
DROP POLICY IF EXISTS "conversation_insert" ON "ChatConversation";
DROP POLICY IF EXISTS "conversation_update" ON "ChatConversation";
DROP POLICY IF EXISTS "conversation_delete" ON "ChatConversation";

CREATE POLICY "conversation_select" ON "ChatConversation"
  FOR SELECT 
  USING (
    (select auth.uid())::text = "userId" OR 
    "organizationId" IN (
      SELECT "organizationId" FROM "User" 
      WHERE id = (select auth.uid())::text AND role = 'ADMIN'
    )
  );

CREATE POLICY "conversation_insert" ON "ChatConversation"
  FOR INSERT 
  WITH CHECK ((select auth.uid())::text = "userId");

CREATE POLICY "conversation_update" ON "ChatConversation"
  FOR UPDATE 
  USING ((select auth.uid())::text = "userId");

CREATE POLICY "conversation_delete" ON "ChatConversation"
  FOR DELETE 
  USING ((select auth.uid())::text = "userId");

-- 5.4: ChatMessage
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users see conversation messages" ON "ChatMessage";
DROP POLICY IF EXISTS "Users create messages" ON "ChatMessage";
DROP POLICY IF EXISTS "message_select" ON "ChatMessage";
DROP POLICY IF EXISTS "message_insert" ON "ChatMessage";

CREATE POLICY "message_select" ON "ChatMessage"
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = (select auth.uid())::text
    )
  );

CREATE POLICY "message_insert" ON "ChatMessage"
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = (select auth.uid())::text
    )
  );

-- 5.5: Integration
DROP POLICY IF EXISTS "Users see org integrations" ON "Integration";
DROP POLICY IF EXISTS "Users manage org integrations" ON "Integration";
DROP POLICY IF EXISTS "integration_all" ON "Integration";

CREATE POLICY "integration_all" ON "Integration"
  FOR ALL 
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = (select auth.uid())::text
    )
  );

-- 5.6: RefreshToken (consolidar)
DROP POLICY IF EXISTS "Users can view their own refresh tokens" ON "RefreshToken";
DROP POLICY IF EXISTS "Users can create their own refresh tokens" ON "RefreshToken";
DROP POLICY IF EXISTS "Users can delete their own refresh tokens" ON "RefreshToken";
DROP POLICY IF EXISTS "refresh_token_select" ON "RefreshToken";
DROP POLICY IF EXISTS "refresh_token_insert" ON "RefreshToken";
DROP POLICY IF EXISTS "refresh_token_delete" ON "RefreshToken";

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
-- PARTE 6: TRIGGERS updated_at FALTANTES
-- =====================================================

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

CREATE TRIGGER update_media_updated_at 
  BEFORE UPDATE ON "MediaGeneration"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- E-commerce triggers
CREATE TRIGGER update_category_updated_at 
  BEFORE UPDATE ON "Category"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_updated_at 
  BEFORE UPDATE ON "Product"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_updated_at 
  BEFORE UPDATE ON "Customer"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_kit_updated_at 
  BEFORE UPDATE ON "Kit"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PARTE 7: STORAGE BUCKET (se não existir)
-- =====================================================

-- Criar bucket para media-generations
INSERT INTO storage.buckets (id, name, public)
VALUES ('media-generations', 'media-generations', true)
ON CONFLICT (id) DO NOTHING;

-- Policy para upload
DROP POLICY IF EXISTS "Users can upload media" ON storage.objects;
CREATE POLICY "Users can upload media"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'media-generations');

DROP POLICY IF EXISTS "Users can view media" ON storage.objects;
CREATE POLICY "Users can view media"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'media-generations');

-- =====================================================
-- PARTE 8: COMENTARIOS E DOCUMENTACAO
-- =====================================================

COMMENT ON TABLE "GlobalAiConnection" IS 'IAs globais gerenciadas pelo Super Admin';
COMMENT ON TABLE "OrganizationAiConnection" IS 'Atribuicao de IAs para organizacoes';
COMMENT ON TABLE "MediaGeneration" IS 'Historico de imagens/videos gerados pela IA';
COMMENT ON TABLE "QuotaUsageHistory" IS 'Historico de uso de quotas';

COMMENT ON COLUMN "GlobalAiConnection"."systemPrompt" IS 'Prompt de sistema padrao da IA';
COMMENT ON COLUMN "Product"."isActive" IS 'Se o produto esta ativo e visivel';
COMMENT ON COLUMN "Product".status IS 'Status do produto (DRAFT/ACTIVE/ARCHIVED)';

COMMENT ON FUNCTION is_service_role() IS 'Verifica se a requisicao e do service role';
COMMENT ON FUNCTION is_super_admin() IS 'Verifica se o usuario e super admin';

-- =====================================================
-- PARTE 9: ATUALIZAR DADOS EXISTENTES
-- =====================================================

-- Garantir que produtos existentes tenham isActive
UPDATE "Product" SET "isActive" = true WHERE "isActive" IS NULL;

-- Garantir que produtos existentes tenham status
UPDATE "Product" SET status = 'ACTIVE' WHERE status IS NULL;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================

-- Estatísticas
DO $$
DECLARE
  total_tables INTEGER;
  total_policies INTEGER;
  total_indexes INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_tables 
  FROM information_schema.tables 
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
  
  SELECT COUNT(*) INTO total_policies 
  FROM pg_policies 
  WHERE schemaname = 'public';
  
  SELECT COUNT(*) INTO total_indexes 
  FROM pg_indexes 
  WHERE schemaname = 'public';
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETA COM SUCESSO!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de tabelas: %', total_tables;
  RAISE NOTICE 'Total de policies: %', total_policies;
  RAISE NOTICE 'Total de indices: %', total_indexes;
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Correcoes aplicadas:';
  RAISE NOTICE '- Schema: systemPrompt, isActive, status';
  RAISE NOTICE '- Functions: is_service_role, search_path';
  RAISE NOTICE '- Indices: +10 indices de performance';
  RAISE NOTICE '- RLS: Policies consolidadas e otimizadas';
  RAISE NOTICE '- Triggers: updated_at em 10+ tabelas';
  RAISE NOTICE '- Storage: Bucket media-generations';
  RAISE NOTICE '========================================';
END $$;
