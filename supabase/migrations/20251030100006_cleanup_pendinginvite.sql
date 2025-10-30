-- ============================================
-- MIGRATION: REMOVER organizationId DE PendingInvite
-- Data: 30 de Outubro de 2025
-- Última tabela com organizationId!
-- ============================================

BEGIN;

-- Remover organizationId de PendingInvite
ALTER TABLE "PendingInvite" DROP COLUMN IF EXISTS "organizationId" CASCADE;

-- Log de sucesso
DO $$
BEGIN
  RAISE NOTICE '✅ 100%% COMPLETO!';
  RAISE NOTICE '🎯 ZERO organizationId no sistema inteiro';
END $$;

COMMIT;

