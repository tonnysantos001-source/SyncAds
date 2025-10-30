-- ============================================
-- MIGRATION: LIMPAR ORGANIZATIONID RESTANTES
-- Data: 30 de Outubro de 2025
-- Remove organizationId de TODAS as tabelas restantes
-- ============================================

BEGIN;

-- ============================================
-- REMOVER organizationId DAS TABELAS RESTANTES
-- ============================================

-- AiUsage
ALTER TABLE "AiUsage" DROP COLUMN IF EXISTS "organizationId" CASCADE;

-- Campaign
ALTER TABLE "Campaign" DROP COLUMN IF EXISTS "organizationId" CASCADE;

-- Catalog
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Catalog') THEN
    ALTER TABLE "Catalog" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- Coupon
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Coupon') THEN
    ALTER TABLE "Coupon" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- CrossSell
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'CrossSell') THEN
    ALTER TABLE "CrossSell" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- OrderBump
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'OrderBump') THEN
    ALTER TABLE "OrderBump" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- Integration
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Integration') THEN
    ALTER TABLE "Integration" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- MediaGeneration
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'MediaGeneration') THEN
    ALTER TABLE "MediaGeneration" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- Pixel
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Pixel') THEN
    ALTER TABLE "Pixel" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- Upsell
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Upsell') THEN
    ALTER TABLE "Upsell" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- Shipping
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Shipping') THEN
    ALTER TABLE "Shipping" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- SocialProof
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'SocialProof') THEN
    ALTER TABLE "SocialProof" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- Banner
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Banner') THEN
    ALTER TABLE "Banner" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- Subscription
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Subscription') THEN
    ALTER TABLE "Subscription" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- WebhookLog
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'WebhookLog') THEN
    ALTER TABLE "WebhookLog" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- ============================================
-- LOG DE SUCESSO
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ LIMPEZA FINAL CONCLUÍDA!';
  RAISE NOTICE '🗑️ organizationId removido de TODAS as tabelas restantes';
  RAISE NOTICE '🎯 Sistema 100%% limpo de organizações';
END $$;

COMMIT;

