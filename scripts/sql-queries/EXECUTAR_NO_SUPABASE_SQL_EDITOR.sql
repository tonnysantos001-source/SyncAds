-- ============================================
-- 🔧 EXECUTE ESTE SQL NO SUPABASE SQL EDITOR
-- ============================================
-- 
-- INSTRUÇÕES:
-- 1. Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/editor
-- 2. Clique em "SQL Editor" no menu lateral
-- 3. Clique em "+ New query"
-- 4. Cole TODO este código abaixo
-- 5. Clique em "Run" (ou pressione Ctrl+Enter)
-- 6. Aguarde a mensagem de sucesso
--
-- Tempo estimado: 10-15 segundos
-- ============================================

-- ===== 1. ADICIONAR CAMPO systemPrompt =====
ALTER TABLE "GlobalAiConnection" 
ADD COLUMN IF NOT EXISTS "systemPrompt" TEXT;

UPDATE "GlobalAiConnection" 
SET "systemPrompt" = 'Você é um assistente de marketing digital inteligente e útil. Ajude os usuários com suas campanhas, análises e estratégias.'
WHERE "systemPrompt" IS NULL;

-- ===== 2. ADICIONAR CAMPO isActive =====
ALTER TABLE "Product" 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true;

UPDATE "Product" 
SET "isActive" = true 
WHERE "isActive" IS NULL;

-- ===== 3. CRIAR FUNÇÃO is_service_role() =====
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() ->> 'role') = 'service_role';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog, public;

-- ===== 4. ADICIONAR ÍNDICES (PERFORMANCE) =====

-- Campaign.userId
CREATE INDEX IF NOT EXISTS idx_campaign_user ON "Campaign"("userId");

-- CartItem.variantId
CREATE INDEX IF NOT EXISTS idx_cartitem_variant ON "CartItem"("variantId");

-- Lead.customerId
CREATE INDEX IF NOT EXISTS idx_lead_customer ON "Lead"("customerId");

-- Order.cartId
CREATE INDEX IF NOT EXISTS idx_order_cart ON "Order"("cartId");

-- OrderItem.variantId
CREATE INDEX IF NOT EXISTS idx_orderitem_variant ON "OrderItem"("variantId");

-- Transaction.orderId
CREATE INDEX IF NOT EXISTS idx_transaction_order ON "Transaction"("orderId");

-- Índices compostos para queries frequentes
CREATE INDEX IF NOT EXISTS idx_campaign_org_status ON "Campaign"("organizationId", "status");
CREATE INDEX IF NOT EXISTS idx_product_org_active ON "Product"("organizationId", "isActive");
CREATE INDEX IF NOT EXISTS idx_order_org_status ON "Order"("organizationId", "status");
CREATE INDEX IF NOT EXISTS idx_transaction_gateway_status ON "Transaction"("gatewayId", "status");

-- ===== VERIFICAÇÃO FINAL =====
SELECT 
  'GlobalAiConnection.systemPrompt' as campo,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'GlobalAiConnection' AND column_name = 'systemPrompt'
  ) THEN '✅ OK' ELSE '❌ FALTA' END as status
UNION ALL
SELECT 
  'Product.isActive',
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Product' AND column_name = 'isActive'
  ) THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT 
  'Função is_service_role()',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'is_service_role'
  ) THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT 
  'Índice idx_campaign_user',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_campaign_user'
  ) THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT 
  'Índice idx_cartitem_variant',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_cartitem_variant'
  ) THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT 
  'Índice idx_lead_customer',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lead_customer'
  ) THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT 
  'Índice idx_order_cart',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_order_cart'
  ) THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT 
  'Índice idx_orderitem_variant',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orderitem_variant'
  ) THEN '✅ OK' ELSE '❌ FALTA' END
UNION ALL
SELECT 
  'Índice idx_transaction_order',
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transaction_order'
  ) THEN '✅ OK' ELSE '❌ FALTA' END;

-- ✅ SE TODOS MOSTRAREM "✅ OK", AS CORREÇÕES FORAM APLICADAS COM SUCESSO!

-- ============================================
-- 📦 MIGRATION 1: FIX CRITICAL SECURITY
-- ============================================

-- Corrigir search_path em functions SECURITY DEFINER
DO $$
DECLARE
  func_name TEXT;
  func_list TEXT[] := ARRAY[
    'is_super_admin',
    'encrypt_api_key',
    'decrypt_api_key',
    'expire_old_invites'
  ];
BEGIN
  FOREACH func_name IN ARRAY func_list
  LOOP
    -- Verificar se a função existe antes de alterar
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = func_name) THEN
      EXECUTE format('ALTER FUNCTION public.%I() SECURITY DEFINER SET search_path = public, extensions', func_name);
      RAISE NOTICE '✅ search_path corrigido para função: %', func_name;
    ELSE
      RAISE NOTICE '⏭️  Função % não existe, pulando...', func_name;
    END IF;
  END LOOP;
END $$;

