-- =====================================================
-- MIGRATION: Add lastSeen to User Table
-- Data: 2024-01-01
-- Prioridade: MÉDIA
-- Descrição: Adiciona campo lastSeen para tracking de usuários online
-- =====================================================

BEGIN;

-- =====================================================
-- ADD LASTSEEN COLUMN
-- =====================================================

-- Adicionar coluna lastSeen se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'lastSeen'
  ) THEN
    ALTER TABLE "User"
    ADD COLUMN "lastSeen" TIMESTAMPTZ DEFAULT NOW();

    -- Atualizar registros existentes
    UPDATE "User" SET "lastSeen" = NOW() WHERE "lastSeen" IS NULL;
  END IF;
END $$;

-- =====================================================
-- INDEX PARA PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS "idx_user_lastSeen" ON "User"("lastSeen" DESC);

-- =====================================================
-- FUNÇÃO PARA ATUALIZAR LASTSEEN
-- =====================================================

CREATE OR REPLACE FUNCTION update_user_last_seen(p_user_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE "User"
  SET "lastSeen" = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON COLUMN "User"."lastSeen" IS 'Timestamp da última atividade do usuário (para tracking de usuários online)';
COMMENT ON FUNCTION update_user_last_seen IS 'Atualiza o timestamp de última atividade do usuário';

COMMIT;
