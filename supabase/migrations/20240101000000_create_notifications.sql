-- =====================================================
-- MIGRATION: Create Notifications Table
-- Data: 2024-01-01
-- Prioridade: ALTA
-- Descrição: Tabela de notificações do sistema
-- =====================================================

BEGIN;

-- =====================================================
-- CREATE NOTIFICATION TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "type" TEXT NOT NULL CHECK ("type" IN ('success', 'warning', 'info', 'campaign')),
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS "idx_notification_userId" ON "Notification"("userId");
CREATE INDEX IF NOT EXISTS "idx_notification_read" ON "Notification"("read");
CREATE INDEX IF NOT EXISTS "idx_notification_createdAt" ON "Notification"("createdAt" DESC);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver suas próprias notificações
DROP POLICY IF EXISTS "Users can view their own notifications" ON "Notification";
CREATE POLICY "Users can view their own notifications" ON "Notification"
  FOR SELECT
  USING ((select auth.uid())::text = "userId");

-- Usuários podem marcar suas notificações como lidas
DROP POLICY IF EXISTS "Users can update their own notifications" ON "Notification";
CREATE POLICY "Users can update their own notifications" ON "Notification"
  FOR UPDATE
  USING ((select auth.uid())::text = "userId");

-- Usuários podem deletar suas notificações
DROP POLICY IF EXISTS "Users can delete their own notifications" ON "Notification";
CREATE POLICY "Users can delete their own notifications" ON "Notification"
  FOR DELETE
  USING ((select auth.uid())::text = "userId");

-- Sistema pode criar notificações (service role)
DROP POLICY IF EXISTS "System can create notifications" ON "Notification";
CREATE POLICY "System can create notifications" ON "Notification"
  FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- TRIGGER PARA UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_notification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notification_updated_at ON "Notification";
CREATE TRIGGER trigger_notification_updated_at
  BEFORE UPDATE ON "Notification"
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_updated_at();

-- =====================================================
-- FUNÇÃO HELPER: Criar Notificação
-- =====================================================

CREATE OR REPLACE FUNCTION create_notification(
  p_user_id TEXT,
  p_type TEXT,
  p_title TEXT,
  p_description TEXT
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO "Notification" ("userId", "type", "title", "description")
  VALUES (p_user_id, p_type, p_title, p_description)
  RETURNING "id" INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMENTÁRIOS
-- =====================================================

COMMENT ON TABLE "Notification" IS 'Notificações do sistema para usuários';
COMMENT ON COLUMN "Notification"."type" IS 'Tipo: success, warning, info, campaign';
COMMENT ON COLUMN "Notification"."read" IS 'Se a notificação foi lida pelo usuário';
COMMENT ON FUNCTION create_notification IS 'Helper para criar notificações do sistema';

COMMIT;
