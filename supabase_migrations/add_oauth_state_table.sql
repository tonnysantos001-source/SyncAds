-- Migration: Adicionar tabela OAuthState para gerenciar estados OAuth temporários

-- Criar tabela OAuthState
CREATE TABLE IF NOT EXISTS "OAuthState" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "state" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "integrationSlug" TEXT NOT NULL,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS "OAuthState_state_idx" ON "OAuthState"("state");
CREATE INDEX IF NOT EXISTS "OAuthState_userId_idx" ON "OAuthState"("userId");
CREATE INDEX IF NOT EXISTS "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");

-- Habilitar RLS
ALTER TABLE "OAuthState" ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can manage their own OAuth states"
  ON "OAuthState"
  FOR ALL
  USING (auth.uid()::text = "userId");

-- Função para limpar states expirados (executar periodicamente)
CREATE OR REPLACE FUNCTION clean_expired_oauth_states()
RETURNS void AS $$
BEGIN
  DELETE FROM "OAuthState"
  WHERE "expiresAt" < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentários
COMMENT ON TABLE "OAuthState" IS 'Armazena estados OAuth temporários para validação de callbacks';
COMMENT ON COLUMN "OAuthState"."state" IS 'Token de estado único para validação OAuth';
COMMENT ON COLUMN "OAuthState"."expiresAt" IS 'Data de expiração do state (10 minutos após criação)';
