-- ============================================================
-- MÓDULO: PIXELS DE RASTREAMENTO
-- Tabela: PixelConfig
-- Versão: 1.0 — 2026-06-17
-- ============================================================

-- Habilitar extensão uuid se necessário
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELA PRINCIPAL: PixelConfig
-- ============================================================
CREATE TABLE IF NOT EXISTS "PixelConfig" (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"      TEXT        NOT NULL,
  platform      TEXT        NOT NULL CHECK (platform IN ('FACEBOOK', 'TIKTOK', 'GOOGLE_ADS')),
  "pixelId"     TEXT        NOT NULL,
  name          TEXT,
  "accessToken" TEXT,
  "isActive"    BOOLEAN     NOT NULL DEFAULT true,
  events        TEXT[]      NOT NULL DEFAULT ARRAY['page_view','initiate_checkout','add_payment_info','purchase'],
  config        JSONB       NOT NULL DEFAULT '{}',
  "eventCount"  INTEGER     NOT NULL DEFAULT 0,
  "lastFiredAt" TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_pixel_config_user_id  ON "PixelConfig" ("userId");
CREATE INDEX IF NOT EXISTS idx_pixel_config_platform ON "PixelConfig" (platform);
CREATE INDEX IF NOT EXISTS idx_pixel_config_active   ON "PixelConfig" ("isActive");
CREATE INDEX IF NOT EXISTS idx_pixel_config_user_active ON "PixelConfig" ("userId", "isActive");

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE "PixelConfig" ENABLE ROW LEVEL SECURITY;

-- Cada usuário vê/edita apenas os próprios pixels
DROP POLICY IF EXISTS "pixel_config_select_own" ON "PixelConfig";
CREATE POLICY "pixel_config_select_own"
  ON "PixelConfig" FOR SELECT
  USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "pixel_config_insert_own" ON "PixelConfig";
CREATE POLICY "pixel_config_insert_own"
  ON "PixelConfig" FOR INSERT
  WITH CHECK (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "pixel_config_update_own" ON "PixelConfig";
CREATE POLICY "pixel_config_update_own"
  ON "PixelConfig" FOR UPDATE
  USING (auth.uid()::text = "userId");

DROP POLICY IF EXISTS "pixel_config_delete_own" ON "PixelConfig";
CREATE POLICY "pixel_config_delete_own"
  ON "PixelConfig" FOR DELETE
  USING (auth.uid()::text = "userId");

-- ============================================================
-- POLÍTICA PÚBLICA: checkout público lê pixels por userId
-- (sem autenticação — necessário para páginas de checkout)
-- ============================================================
DROP POLICY IF EXISTS "pixel_config_public_read" ON "PixelConfig";
CREATE POLICY "pixel_config_public_read"
  ON "PixelConfig" FOR SELECT
  USING ("isActive" = true);

-- ============================================================
-- FUNÇÃO: Incrementar contador de eventos disparados
-- ============================================================
CREATE OR REPLACE FUNCTION increment_pixel_event_count(p_pixel_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE "PixelConfig"
  SET
    "eventCount"  = "eventCount" + 1,
    "lastFiredAt" = NOW(),
    "updatedAt"   = NOW()
  WHERE id = p_pixel_id;
END;
$$;

-- ============================================================
-- TRIGGER: atualizar updatedAt automaticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_pixel_config_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_pixel_config_updated_at ON "PixelConfig";
CREATE TRIGGER trg_pixel_config_updated_at
  BEFORE UPDATE ON "PixelConfig"
  FOR EACH ROW
  EXECUTE FUNCTION update_pixel_config_updated_at();
