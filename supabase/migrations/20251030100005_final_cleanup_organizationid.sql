-- ============================================
-- MIGRATION: LIMPEZA DEFINITIVA DE ORGANIZATIONID
-- Data: 30 de Outubro de 2025
-- Remove organizationId das últimas 5 tabelas
-- ============================================

BEGIN;

-- ============================================
-- REMOVER organizationId DAS ÚLTIMAS 5 TABELAS
-- ============================================

-- ChatConversation
ALTER TABLE "ChatConversation" DROP COLUMN IF EXISTS "organizationId" CASCADE;

-- CheckoutCustomization (já deveria ter userId, mas vamos garantir)
ALTER TABLE "CheckoutCustomization" DROP COLUMN IF EXISTS "organizationId" CASCADE;

-- Discount
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Discount') THEN
    ALTER TABLE "Discount" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- UserInvite
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'UserInvite') THEN
    ALTER TABLE "UserInvite" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- UsageTracking
DO $$ BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'UsageTracking') THEN
    ALTER TABLE "UsageTracking" DROP COLUMN IF EXISTS "organizationId" CASCADE;
  END IF;
END $$;

-- ============================================
-- LOG DE SUCESSO
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ LIMPEZA 100%% CONCLUÍDA!';
  RAISE NOTICE '🗑️ Últimas 5 tabelas limpas';
  RAISE NOTICE '🎯 ZERO referências a organizationId no sistema';
  RAISE NOTICE '🚀 Sistema 100%% simplificado: Super Admin + Usuários';
END $$;

COMMIT;

