-- Migration: Add OAuth Configuration Table
-- Criada em: 2025-10-25 16:00:00
-- Descrição: Tabela para armazenar configurações OAuth de integrações (Meta, Google, LinkedIn, TikTok)

-- Criar tabela OAuthConfig
CREATE TABLE IF NOT EXISTS "OAuthConfig" (
  "platform" TEXT PRIMARY KEY,  -- META, GOOGLE, LINKEDIN, TIKTOK
  "clientId" TEXT NOT NULL,
  "clientSecret" TEXT NOT NULL,  -- Será criptografado no backend
  "scopes" TEXT[] NOT NULL DEFAULT '{}',
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comentários
COMMENT ON TABLE "OAuthConfig" IS 'Configurações OAuth 2.0 das plataformas de anúncios';
COMMENT ON COLUMN "OAuthConfig"."platform" IS 'Plataforma: META, GOOGLE, LINKEDIN, TIKTOK';
COMMENT ON COLUMN "OAuthConfig"."clientId" IS 'Client ID da aplicação OAuth';
COMMENT ON COLUMN "OAuthConfig"."clientSecret" IS 'Client Secret (criptografado)';
COMMENT ON COLUMN "OAuthConfig"."scopes" IS 'Scopes/permissões OAuth solicitadas';
COMMENT ON COLUMN "OAuthConfig"."isActive" IS 'Se a integração está ativa para os usuários';

-- Índices
CREATE INDEX IF NOT EXISTS "idx_oauth_config_active" ON "OAuthConfig" ("isActive");

-- RLS (Row Level Security)
ALTER TABLE "OAuthConfig" ENABLE ROW LEVEL SECURITY;

-- Policy: Apenas SUPERADMIN pode ler configs OAuth
CREATE POLICY "OAuthConfig_select_superadmin" ON "OAuthConfig"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User"."id"::text = auth.uid()::text
      AND "User"."role" = 'SUPERADMIN'
    )
  );

-- Policy: Apenas SUPERADMIN pode inserir/atualizar configs OAuth
CREATE POLICY "OAuthConfig_insert_update_superadmin" ON "OAuthConfig"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User"."id"::text = auth.uid()::text
      AND "User"."role" = 'SUPERADMIN'
    )
  );

-- Inserir configs padrão (desativadas, sem credenciais)
INSERT INTO "OAuthConfig" ("platform", "clientId", "clientSecret", "scopes", "isActive")
VALUES
  ('META', '', '', ARRAY['ads_management', 'ads_read', 'pages_read_engagement', 'pages_manage_ads'], false),
  ('GOOGLE', '', '', ARRAY['https://www.googleapis.com/auth/adwords', 'https://www.googleapis.com/auth/userinfo.email'], false),
  ('LINKEDIN', '', '', ARRAY['r_ads', 'r_ads_reporting', 'rw_ads'], false),
  ('TIKTOK', '', '', ARRAY['user.info.basic', 'video.list', 'video.upload'], false)
ON CONFLICT ("platform") DO NOTHING;
