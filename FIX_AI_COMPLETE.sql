-- ============================================
-- SYNCADS - CONFIGURAÇÃO COMPLETA DE IAs
-- Data: Janeiro 2025
-- Descrição: Configura Grok e Gemini com capacidades corretas
-- ============================================

-- PASSO 1: LIMPAR CONFIGURAÇÕES ANTIGAS
-- ============================================
DELETE FROM "GlobalAiConnection" WHERE provider IN ('GROQ', 'GEMINI', 'GOOGLE');

-- PASSO 2: INSERIR GROK (CHAT RÁPIDO)
-- ============================================
INSERT INTO "GlobalAiConnection" (
  id,
  name,
  provider,
  "apiKey",
  "baseUrl",
  model,
  "maxTokens",
  temperature,
  "isActive",
  "systemPrompt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Grok (Llama 3.3 70B) - Chat Rápido',
  'GROQ',
  'SUA_GROQ_API_KEY_AQUI',
  'https://api.groq.com/openai/v1',
  'llama-3.3-70b-versatile',
  8000,
  0.7,
  true,
  'Você é uma IA superinteligente e rápida. Especializada em conversação natural, análise de dados, marketing e e-commerce. Use um tom amigável mas profissional. Responda de forma concisa mas completa.',
  NOW(),
  NOW()
) ON CONFLICT (provider) DO UPDATE SET
  "apiKey" = EXCLUDED."apiKey",
  "isActive" = true,
  model = EXCLUDED.model,
  "maxTokens" = EXCLUDED."maxTokens",
  temperature = EXCLUDED.temperature,
  "systemPrompt" = EXCLUDED."systemPrompt",
  "updatedAt" = NOW();

-- PASSO 3: INSERIR GEMINI (MULTIMODAL + IMAGENS)
-- ============================================
INSERT INTO "GlobalAiConnection" (
  id,
  name,
  provider,
  "apiKey",
  "baseUrl",
  model,
  "maxTokens",
  temperature,
  "isActive",
  "systemPrompt",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'Gemini 2.0 Flash - Multimodal & Imagens',
  'GEMINI',
  'SUA_GEMINI_API_KEY_AQUI',
  'https://generativelanguage.googleapis.com/v1beta',
  'gemini-2.0-flash-exp',
  1000000,
  0.8,
  true,
  'Você é Gemini, uma IA multimodal avançada do Google. Suas capacidades especiais:
- Geração de imagens realistas e criativas
- Análise de imagens e vídeos
- Processamento de documentos longos (1M tokens)
- Visão computacional e OCR
Responda em português brasileiro de forma criativa e detalhada quando necessário.',
  NOW(),
  NOW()
) ON CONFLICT (provider) DO UPDATE SET
  "apiKey" = EXCLUDED."apiKey",
  "isActive" = true,
  model = EXCLUDED.model,
  "maxTokens" = EXCLUDED."maxTokens",
  temperature = EXCLUDED.temperature,
  "systemPrompt" = EXCLUDED."systemPrompt",
  "updatedAt" = NOW();

-- PASSO 4: CRIAR TABELA DE CAPACIDADES DAS IAs (se não existir)
-- ============================================
CREATE TABLE IF NOT EXISTS "AiCapabilities" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "aiConnectionId" UUID NOT NULL REFERENCES "GlobalAiConnection"(id) ON DELETE CASCADE,
  capability TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 5,
  metadata JSONB DEFAULT '{}',
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- PASSO 5: LIMPAR CAPACIDADES ANTIGAS
-- ============================================
DELETE FROM "AiCapabilities" WHERE "aiConnectionId" IN (
  SELECT id FROM "GlobalAiConnection" WHERE provider IN ('GROQ', 'GEMINI')
);

-- PASSO 6: CONFIGURAR CAPACIDADES DO GROK
-- ============================================
INSERT INTO "AiCapabilities" ("aiConnectionId", capability, enabled, priority, metadata)
SELECT
  g.id,
  capability_data.capability,
  capability_data.enabled,
  capability_data.priority,
  capability_data.metadata::jsonb
FROM "GlobalAiConnection" g
CROSS JOIN (
  VALUES
    ('chat_conversation', true, 10, '{"speed": "fast", "tokens_per_sec": 800}'),
    ('text_analysis', true, 9, '{"strengths": ["sentiment", "summarization"]}'),
    ('code_generation', true, 8, '{"languages": ["python", "javascript", "typescript"]}'),
    ('data_analysis', true, 8, '{"capabilities": ["statistics", "insights"]}'),
    ('marketing_strategy', true, 7, '{"areas": ["content", "campaigns", "SEO"]}'),
    ('json_output', true, 9, '{"structured_data": true}'),
    ('multilingual', true, 8, '{"languages": ["pt-BR", "en", "es"]}')
) AS capability_data(capability, enabled, priority, metadata)
WHERE g.provider = 'GROQ';

-- PASSO 7: CONFIGURAR CAPACIDADES DO GEMINI
-- ============================================
INSERT INTO "AiCapabilities" ("aiConnectionId", capability, enabled, priority, metadata)
SELECT
  g.id,
  capability_data.capability,
  capability_data.enabled,
  capability_data.priority,
  capability_data.metadata::jsonb
FROM "GlobalAiConnection" g
CROSS JOIN (
  VALUES
    ('image_generation', true, 10, '{"models": ["imagen-3"], "max_resolution": "4096x4096"}'),
    ('image_analysis', true, 10, '{"ocr": true, "object_detection": true, "scene_understanding": true}'),
    ('video_analysis', true, 9, '{"max_duration": "60s", "frame_extraction": true}'),
    ('document_processing', true, 9, '{"pdf": true, "max_pages": 1000}'),
    ('multimodal_chat', true, 10, '{"supports": ["text", "image", "video", "audio"]}'),
    ('long_context', true, 10, '{"max_tokens": 1000000, "context_window": "1M"}'),
    ('creative_writing', true, 8, '{"strengths": ["storytelling", "poetry", "scripts"]}'),
    ('design_generation', true, 9, '{"types": ["logos", "banners", "thumbnails"]}'),
    ('code_generation', true, 7, '{"languages": ["python", "javascript", "typescript"]}'),
    ('multilingual', true, 9, '{"languages": ["pt-BR", "en", "es", "fr", "de", "ja", "ko"]}'  )
) AS capability_data(capability, enabled, priority, metadata)
WHERE g.provider = 'GEMINI';

-- PASSO 8: CONFIGURAR POLÍTICAS RLS
-- ============================================
ALTER TABLE "GlobalAiConnection" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AiCapabilities" ENABLE ROW LEVEL SECURITY;

-- Políticas para GlobalAiConnection
DROP POLICY IF EXISTS "Anyone can read AI connections" ON "GlobalAiConnection";
CREATE POLICY "Anyone can read AI connections" ON "GlobalAiConnection"
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admins manage AI connections" ON "GlobalAiConnection";
CREATE POLICY "Super admins manage AI connections" ON "GlobalAiConnection"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Políticas para AiCapabilities
DROP POLICY IF EXISTS "Anyone can read AI capabilities" ON "AiCapabilities";
CREATE POLICY "Anyone can read AI capabilities" ON "AiCapabilities"
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Super admins manage AI capabilities" ON "AiCapabilities";
CREATE POLICY "Super admins manage AI capabilities" ON "AiCapabilities"
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- PASSO 9: CRIAR VIEW PARA FACILITAR CONSULTAS
-- ============================================
DROP VIEW IF EXISTS "AiConnectionsWithCapabilities";
CREATE VIEW "AiConnectionsWithCapabilities" AS
SELECT
  ai.id,
  ai.name,
  ai.provider,
  ai.model,
  ai."isActive",
  ai."maxTokens",
  ai.temperature,
  COALESCE(
    json_agg(
      json_build_object(
        'capability', cap.capability,
        'enabled', cap.enabled,
        'priority', cap.priority,
        'metadata', cap.metadata
      ) ORDER BY cap.priority DESC
    ) FILTER (WHERE cap.id IS NOT NULL),
    '[]'::json
  ) as capabilities
FROM "GlobalAiConnection" ai
LEFT JOIN "AiCapabilities" cap ON cap."aiConnectionId" = ai.id AND cap.enabled = true
GROUP BY ai.id, ai.name, ai.provider, ai.model, ai."isActive", ai."maxTokens", ai.temperature;

-- PASSO 10: VERIFICAÇÃO FINAL
-- ============================================
SELECT
  '✅ CONFIGURAÇÃO COMPLETA' as status,
  COUNT(*) as total_ias,
  COUNT(*) FILTER (WHERE "isActive" = true) as ias_ativas
FROM "GlobalAiConnection"
WHERE provider IN ('GROQ', 'GEMINI');

-- Mostrar capacidades configuradas
SELECT
  ai.provider,
  ai.name,
  COUNT(cap.id) as total_capacidades,
  json_agg(cap.capability ORDER BY cap.priority DESC) as capacidades_lista
FROM "GlobalAiConnection" ai
LEFT JOIN "AiCapabilities" cap ON cap."aiConnectionId" = ai.id
WHERE ai.provider IN ('GROQ', 'GEMINI')
GROUP BY ai.provider, ai.name;

-- ============================================
-- FIM DA CONFIGURAÇÃO
-- ============================================
--
-- PRÓXIMOS PASSOS:
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Verifique se as 2 IAs foram criadas
-- 3. Teste o AI Router no chat
-- 4. Solicite geração de imagem para testar Gemini
--
-- COMANDOS DE TESTE:
-- - "Olá" ou "me ajude com marketing" → deve usar GROK
-- - "Crie uma imagem de um gato astronauta" → deve usar GEMINI
-- - "Analise esta imagem" (com anexo) → deve usar GEMINI
-- ============================================
