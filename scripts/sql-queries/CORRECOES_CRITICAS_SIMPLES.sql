-- =====================================================
-- CORREÇÕES CRÍTICAS SYNCADS - EXECUTAR NO SUPABASE DASHBOARD
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
-- 4. ADD MISSING TRIGGERS (updated_at)
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
-- 5. ADD CHECK CONSTRAINTS
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
-- 6. CREATE STORAGE BUCKET (se não existir)
-- =====================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('media-generations', 'media-generations', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- CORREÇÕES APLICADAS COM SUCESSO!
-- =====================================================
