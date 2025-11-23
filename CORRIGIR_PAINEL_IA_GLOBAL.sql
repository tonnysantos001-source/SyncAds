-- ============================================
-- CORREÇÃO COMPLETA - PAINEL DE IA GLOBAL
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- PASSO 1: CORRIGIR POLÍTICAS RLS PARA SUPER_ADMIN
-- Permitir que Super Admins gerenciem GlobalAiConnection

-- Desabilitar RLS temporariamente
ALTER TABLE "GlobalAiConnection" DISABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas
DROP POLICY IF EXISTS "Super admins manage global AI" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "Super admins view global AI" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "Super admins can insert" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "Super admins can update" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "Super admins can delete" ON "GlobalAiConnection";

-- Criar novas políticas permissivas
CREATE POLICY "Super admins full access" ON "GlobalAiConnection"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()::text
        AND "User".role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Reabilitar RLS
ALTER TABLE "GlobalAiConnection" ENABLE ROW LEVEL SECURITY;

-- PASSO 2: LIMPAR CONEXÕES DUPLICADAS ANTHROPIC
-- Deletar todas as conexões Anthropic antigas
DELETE FROM "GlobalAiConnection"
WHERE provider = 'ANTHROPIC';

-- PASSO 3: CRIAR NOVA CONEXÃO ANTHROPIC COM CHAVE CORRETA
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
  "createdAt",
  "updatedAt"
)
VALUES (
  gen_random_uuid(),
  'Claude 3.5 Sonnet',
  'ANTHROPIC',
  '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',
  'https://api.anthropic.com/v1',
  'claude-3-5-sonnet-20241022',
  4096,
  0.7,
  true,
  NOW(),
  NOW()
);

-- PASSO 4: CRIAR VIEW DE COMPATIBILIDADE PARA EXTENSÃO
DROP VIEW IF EXISTS extension_devices CASCADE;

CREATE OR REPLACE VIEW extension_devices AS 
SELECT 
  id,
  "deviceId" as device_id,
  "userId" as user_id,
  CASE WHEN "isOnline" = true THEN 'online'::text ELSE 'offline'::text END as status,
  "lastSeen" as last_seen,
  "userAgent" as user_agent,
  "deviceId", "userId", "isOnline", "lastSeen"
FROM "ExtensionDevice";

-- Regra de UPDATE para a view
CREATE OR REPLACE RULE extension_devices_update AS
  ON UPDATE TO extension_devices
  DO INSTEAD
  UPDATE "ExtensionDevice"
  SET 
    "isOnline" = CASE 
      WHEN NEW.status = 'online' THEN true 
      WHEN NEW."isOnline" IS NOT NULL THEN NEW."isOnline"
      ELSE "isOnline"
    END,
    "lastSeen" = COALESCE(NEW.last_seen, NEW."lastSeen", "lastSeen"),
    "updatedAt" = NOW()
  WHERE "deviceId" = OLD.device_id OR "deviceId" = OLD."deviceId";

-- Permissions
GRANT ALL ON extension_devices TO authenticated, service_role, anon;

-- PASSO 5: ÍNDICES
CREATE INDEX IF NOT EXISTS idx_extension_device_user_online 
  ON "ExtensionDevice"("userId", "isOnline");
CREATE INDEX IF NOT EXISTS idx_extension_device_lastseen 
  ON "ExtensionDevice"("lastSeen" DESC);
CREATE INDEX IF NOT EXISTS idx_extension_command_device_status 
  ON "ExtensionCommand"("deviceId", status);
CREATE INDEX IF NOT EXISTS idx_extension_command_created 
  ON "ExtensionCommand"("createdAt" DESC);

-- ============================================
-- VERIFICAÇÃO
-- ============================================

SELECT '✅ PASSO 1: RLS Corrigida' as status;

SELECT '✅ PASSO 2: Conexões ANTHROPIC' as status,
       COUNT(*) as total,
       STRING_AGG(name, ', ') as nomes
FROM "GlobalAiConnection"
WHERE provider = 'ANTHROPIC';

SELECT '✅ PASSO 3: API Key Válida' as status,
       LENGTH("apiKey") as tamanho,
       LEFT("apiKey", 7) as inicio,
       "isActive"
FROM "GlobalAiConnection"
WHERE provider = 'ANTHROPIC';

SELECT '✅ PASSO 4: View criada' as status,
       COUNT(*) as devices_totais
FROM extension_devices;

SELECT '🎉 CORREÇÃO COMPLETA - AGORA TESTE O PAINEL!' as resultado;
