-- ================================================
-- MIGRATION: Tabela para Geração de Mídia (Imagens/Vídeos)
-- Data: 23/10/2025
-- Descrição: Armazena histórico de imagens e vídeos gerados pela IA
-- ================================================

-- 1. Criar tabela MediaGeneration
CREATE TABLE IF NOT EXISTS "MediaGeneration" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('IMAGE', 'VIDEO')),
  provider TEXT NOT NULL CHECK (provider IN ('DALL-E', 'RUNWAY', 'MIDJOURNEY', 'STABLE_DIFFUSION', 'PIKA')),
  prompt TEXT NOT NULL,
  url TEXT NOT NULL,
  thumbnailUrl TEXT,
  size TEXT, -- '1024x1024', '1792x1024', etc
  duration INTEGER, -- Segundos (para vídeos)
  quality TEXT, -- 'standard', 'hd', etc
  cost NUMERIC(10, 4) DEFAULT 0,
  status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  metadata JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- 2. RLS Policies
ALTER TABLE "MediaGeneration" ENABLE ROW LEVEL SECURITY;

-- Users veem apenas mídias da sua organização
CREATE POLICY "Users can view their org media"
  ON "MediaGeneration"
  FOR SELECT
  USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User"
      WHERE id = auth.uid()::text
    )
  );

-- Users podem criar mídias
CREATE POLICY "Users can create media"
  ON "MediaGeneration"
  FOR INSERT
  WITH CHECK (
    "organizationId" IN (
      SELECT "organizationId" FROM "User"
      WHERE id = auth.uid()::text
    )
    AND "userId" = auth.uid()::text
  );

-- Users podem deletar suas próprias mídias
CREATE POLICY "Users can delete their media"
  ON "MediaGeneration"
  FOR DELETE
  USING (
    "userId" = auth.uid()::text
  );

-- 3. Índices para performance
CREATE INDEX IF NOT EXISTS idx_media_org ON "MediaGeneration"("organizationId");
CREATE INDEX IF NOT EXISTS idx_media_user ON "MediaGeneration"("userId");
CREATE INDEX IF NOT EXISTS idx_media_type ON "MediaGeneration"(type);
CREATE INDEX IF NOT EXISTS idx_media_date ON "MediaGeneration"("createdAt" DESC);
CREATE INDEX IF NOT EXISTS idx_media_status ON "MediaGeneration"(status) WHERE status != 'COMPLETED';

-- 4. Trigger para updated_at
CREATE TRIGGER update_media_generation_updated_at
  BEFORE UPDATE ON "MediaGeneration"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Função para buscar mídias por organização
CREATE OR REPLACE FUNCTION get_organization_media(
  org_id UUID,
  media_type TEXT DEFAULT NULL,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  provider TEXT,
  prompt TEXT,
  url TEXT,
  "thumbnailUrl" TEXT,
  cost NUMERIC,
  "createdAt" TIMESTAMP,
  "userId" TEXT,
  user_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mg.id,
    mg.type,
    mg.provider,
    mg.prompt,
    mg.url,
    mg."thumbnailUrl",
    mg.cost,
    mg."createdAt",
    mg."userId",
    u.email as user_email
  FROM "MediaGeneration" mg
  INNER JOIN "User" u ON u.id = mg."userId"
  WHERE mg."organizationId" = org_id
    AND (media_type IS NULL OR mg.type = media_type)
    AND mg.status = 'COMPLETED'
  ORDER BY mg."createdAt" DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Função para estatísticas de mídia
CREATE OR REPLACE FUNCTION get_media_stats(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalImages', COUNT(*) FILTER (WHERE type = 'IMAGE'),
    'totalVideos', COUNT(*) FILTER (WHERE type = 'VIDEO'),
    'totalCost', COALESCE(SUM(cost), 0),
    'thisMonth', COUNT(*) FILTER (
      WHERE "createdAt" >= DATE_TRUNC('month', CURRENT_DATE)
    ),
    'lastMonth', COUNT(*) FILTER (
      WHERE "createdAt" >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
        AND "createdAt" < DATE_TRUNC('month', CURRENT_DATE)
    ),
    'byProvider', (
      SELECT jsonb_object_agg(provider, count)
      FROM (
        SELECT provider, COUNT(*) as count
        FROM "MediaGeneration"
        WHERE "organizationId" = org_id
        GROUP BY provider
      ) providers
    )
  )
  INTO result
  FROM "MediaGeneration"
  WHERE "organizationId" = org_id
    AND status = 'COMPLETED';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Comentários
COMMENT ON TABLE "MediaGeneration" IS 'Histórico de imagens e vídeos gerados pela IA';
COMMENT ON COLUMN "MediaGeneration".prompt IS 'Descrição usada para gerar a mídia';
COMMENT ON COLUMN "MediaGeneration".url IS 'URL da mídia no Supabase Storage';
COMMENT ON COLUMN "MediaGeneration".cost IS 'Custo em USD da geração';
COMMENT ON COLUMN "MediaGeneration".metadata IS 'Dados extras: seed, steps, model, etc';
