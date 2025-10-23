-- ================================================
-- MIGRATION: Adicionar Quotas de IA por Organização
-- Data: 23/10/2025
-- Descrição: Sistema de quotas para mensagens, imagens e vídeos
-- ================================================

-- 1. Adicionar colunas de quota na Organization
ALTER TABLE "Organization"
ADD COLUMN IF NOT EXISTS "aiMessagesQuota" INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS "aiMessagesUsed" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "aiImagesQuota" INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS "aiImagesUsed" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "aiVideosQuota" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "aiVideosUsed" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "quotaResetDate" DATE DEFAULT CURRENT_DATE;

-- 2. Atualizar quotas baseado no plano atual
UPDATE "Organization" SET
  "aiMessagesQuota" = CASE 
    WHEN plan = 'FREE' THEN 300 -- 10/dia * 30 dias
    WHEN plan = 'STARTER' THEN 3000 -- 100/dia * 30 dias
    WHEN plan = 'PROFESSIONAL' THEN 15000 -- 500/dia * 30 dias
    WHEN plan = 'ENTERPRISE' THEN 999999
    ELSE 100
  END,
  "aiImagesQuota" = CASE
    WHEN plan = 'FREE' THEN 0
    WHEN plan = 'STARTER' THEN 50
    WHEN plan = 'PROFESSIONAL' THEN 200
    WHEN plan = 'ENTERPRISE' THEN 1000
    ELSE 0
  END,
  "aiVideosQuota" = CASE
    WHEN plan = 'FREE' THEN 0
    WHEN plan = 'STARTER' THEN 5
    WHEN plan = 'PROFESSIONAL' THEN 20
    WHEN plan = 'ENTERPRISE' THEN 100
    ELSE 0
  END;

-- 3. Criar função para verificar e decrementar quota
CREATE OR REPLACE FUNCTION check_and_use_quota(
  org_id UUID,
  quota_type TEXT, -- 'messages', 'images', 'videos'
  amount INTEGER DEFAULT 1
)
RETURNS JSONB AS $$
DECLARE
  current_quota INTEGER;
  current_used INTEGER;
  result JSONB;
BEGIN
  -- Buscar quota atual
  IF quota_type = 'messages' THEN
    SELECT "aiMessagesQuota", "aiMessagesUsed" 
    INTO current_quota, current_used
    FROM "Organization" WHERE id = org_id;
    
    -- Verificar se tem quota disponível
    IF current_used + amount > current_quota THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Quota de mensagens excedida',
        'quota', current_quota,
        'used', current_used
      );
    END IF;
    
    -- Decrementar quota
    UPDATE "Organization"
    SET "aiMessagesUsed" = "aiMessagesUsed" + amount
    WHERE id = org_id;
    
  ELSIF quota_type = 'images' THEN
    SELECT "aiImagesQuota", "aiImagesUsed" 
    INTO current_quota, current_used
    FROM "Organization" WHERE id = org_id;
    
    IF current_used + amount > current_quota THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Quota de imagens excedida',
        'quota', current_quota,
        'used', current_used
      );
    END IF;
    
    UPDATE "Organization"
    SET "aiImagesUsed" = "aiImagesUsed" + amount
    WHERE id = org_id;
    
  ELSIF quota_type = 'videos' THEN
    SELECT "aiVideosQuota", "aiVideosUsed" 
    INTO current_quota, current_used
    FROM "Organization" WHERE id = org_id;
    
    IF current_used + amount > current_quota THEN
      RETURN jsonb_build_object(
        'success', false,
        'error', 'Quota de vídeos excedida',
        'quota', current_quota,
        'used', current_used
      );
    END IF;
    
    UPDATE "Organization"
    SET "aiVideosUsed" = "aiVideosUsed" + amount
    WHERE id = org_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'quota', current_quota,
    'used', current_used + amount,
    'remaining', current_quota - (current_used + amount)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Criar função para resetar quotas mensalmente (via cron job)
CREATE OR REPLACE FUNCTION reset_monthly_quotas()
RETURNS void AS $$
BEGIN
  UPDATE "Organization"
  SET 
    "aiMessagesUsed" = 0,
    "aiImagesUsed" = 0,
    "aiVideosUsed" = 0,
    "quotaResetDate" = CURRENT_DATE
  WHERE "quotaResetDate" < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- 5. Criar tabela para histórico de uso (analytics)
CREATE TABLE IF NOT EXISTS "QuotaUsageHistory" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" TEXT REFERENCES "User"(id),
  type TEXT NOT NULL CHECK (type IN ('MESSAGE', 'IMAGE', 'VIDEO')),
  amount INTEGER DEFAULT 1,
  cost NUMERIC(10, 4) DEFAULT 0,
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW()
);

-- RLS para QuotaUsageHistory
ALTER TABLE "QuotaUsageHistory" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org usage"
  ON "QuotaUsageHistory"
  FOR SELECT
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User"
      WHERE id = auth.uid()::text
    )
  );

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_quota_history_org ON "QuotaUsageHistory"("organizationId");
CREATE INDEX IF NOT EXISTS idx_quota_history_user ON "QuotaUsageHistory"("userId");
CREATE INDEX IF NOT EXISTS idx_quota_history_date ON "QuotaUsageHistory"("createdAt");

-- 7. Comentários
COMMENT ON COLUMN "Organization"."aiMessagesQuota" IS 'Quota mensal de mensagens IA';
COMMENT ON COLUMN "Organization"."aiMessagesUsed" IS 'Mensagens IA usadas no mês atual';
COMMENT ON COLUMN "Organization"."aiImagesQuota" IS 'Quota mensal de imagens geradas';
COMMENT ON COLUMN "Organization"."aiImagesUsed" IS 'Imagens geradas no mês atual';
COMMENT ON COLUMN "Organization"."aiVideosQuota" IS 'Quota mensal de vídeos gerados';
COMMENT ON COLUMN "Organization"."aiVideosUsed" IS 'Vídeos gerados no mês atual';
COMMENT ON COLUMN "Organization"."quotaResetDate" IS 'Data do último reset de quotas';
