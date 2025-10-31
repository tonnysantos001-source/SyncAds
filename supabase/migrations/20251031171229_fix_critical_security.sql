-- =====================================================
-- MIGRATION: Fix Critical Security Issues
-- Data: 31/10/2025
-- Prioridade: CRÍTICA
-- Descrição: Corrige vulnerabilidades de segurança e adiciona índices
-- =====================================================

BEGIN;

-- =====================================================
-- 1. FIX FUNCTIONS SEARCH_PATH (Security Definer Bypass)
-- =====================================================

-- Protege funções SECURITY DEFINER contra ataques de search_path
ALTER FUNCTION IF EXISTS public.is_super_admin()
  SECURITY DEFINER
  SET search_path = public, extensions;

ALTER FUNCTION IF EXISTS public.encrypt_api_key(text)
  SECURITY DEFINER
  SET search_path = public, extensions;

ALTER FUNCTION IF EXISTS public.decrypt_api_key(text)
  SECURITY DEFINER
  SET search_path = public, extensions;

ALTER FUNCTION IF EXISTS public.expire_old_invites()
  SECURITY DEFINER
  SET search_path = public, extensions;

-- =====================================================
-- 2. CREATE INDEXES FOR FOREIGN KEYS (Performance & Security)
-- =====================================================

-- Índices críticos para performance de queries RLS
CREATE INDEX IF NOT EXISTS idx_campaign_userid ON "Campaign"("userId");
CREATE INDEX IF NOT EXISTS idx_cartitem_variantid ON "CartItem"("variantId");
CREATE INDEX IF NOT EXISTS idx_lead_customerid ON "Lead"("customerId");
CREATE INDEX IF NOT EXISTS idx_order_cartid ON "Order"("cartId");
CREATE INDEX IF NOT EXISTS idx_orderitem_variantid ON "OrderItem"("variantId");
CREATE INDEX IF NOT EXISTS idx_pendinginvite_invitedby ON "PendingInvite"("invitedBy");

-- Índices adicionais para queries frequentes
CREATE INDEX IF NOT EXISTS idx_chatmessage_conversationid ON "ChatMessage"("conversationId");
CREATE INDEX IF NOT EXISTS idx_chatmessage_userid ON "ChatMessage"("userId");
CREATE INDEX IF NOT EXISTS idx_chatconversation_userid ON "ChatConversation"("userId");
CREATE INDEX IF NOT EXISTS idx_analytics_campaignid ON "Analytics"("campaignId");
CREATE INDEX IF NOT EXISTS idx_integration_userid ON "Integration"("userId");

-- Índices para timestamps (queries de ordenação)
CREATE INDEX IF NOT EXISTS idx_campaign_createdat ON "Campaign"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_order_createdat ON "Order"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_chatmessage_createdat ON "ChatMessage"("createdAt" ASC);

-- =====================================================
-- 3. VERIFICAÇÃO DE SEGURANÇA
-- =====================================================

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ Migração de segurança aplicada com sucesso';
  RAISE NOTICE '✅ Funções SECURITY DEFINER protegidas';
  RAISE NOTICE '✅ Índices de performance criados';
END $$;

COMMIT;

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
