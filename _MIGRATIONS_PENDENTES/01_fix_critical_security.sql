-- =====================================================
-- MIGRATION: Fix Critical Security Issues
-- Data: 21/10/2025
-- Prioridade: CRÍTICA
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

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
