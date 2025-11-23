-- ============================================
-- CORREÇÃO COMPLETA DO SISTEMA DE IA
-- Execute este script completo no SQL Editor
-- ============================================

-- PASSO 1: Atualizar chave API da Anthropic
UPDATE "GlobalAiConnection"
SET 
  "apiKey" = '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',
  "isActive" = true,
  model = 'claude-3-5-sonnet-20241022',
  "updatedAt" = NOW()
WHERE provider = 'ANTHROPIC';

-- PASSO 2: Criar view de compatibilidade extension_devices
DROP VIEW IF EXISTS extension_devices CASCADE;

CREATE OR REPLACE VIEW extension_devices AS 
SELECT 
  id,
  "deviceId" as device_id,
  "userId" as user_id,
  CASE 
    WHEN "isOnline" = true THEN 'online'::text
    ELSE 'offline'::text
  END as status,
  "lastSeen" as last_seen,
  "userAgent" as user_agent,
  "browserName" as browser_name,
  "browserVersion" as browser_version,
  "osName" as os_name,
  "createdAt" as created_at,
  "updatedAt" as updated_at,
  -- Também expor colunas originais para compatibilidade bidirecional
  "deviceId",
  "userId",
  "isOnline",
  "lastSeen",
  "userAgent",
  "createdAt",
  "updatedAt"
FROM "ExtensionDevice";

-- PASSO 3: Criar regra INSTEAD OF UPDATE para a view
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

-- PASSO 4: Grant permissions
GRANT ALL ON extension_devices TO authenticated;
GRANT ALL ON extension_devices TO service_role;
GRANT ALL ON extension_devices TO anon;

-- PASSO 5: Índices de performance
CREATE INDEX IF NOT EXISTS idx_extension_device_user_online 
  ON "ExtensionDevice"("userId", "isOnline");
  
CREATE INDEX IF NOT EXISTS idx_extension_device_lastseen 
  ON "ExtensionDevice"("lastSeen" DESC);
  
CREATE INDEX IF NOT EXISTS idx_extension_command_device_status 
  ON "ExtensionCommand"("deviceId", status);
  
CREATE INDEX IF NOT EXISTS idx_extension_command_created 
  ON "ExtensionCommand"("createdAt" DESC);

-- PASSO 6: Limpar comandos antigos
DELETE FROM "ExtensionCommand"
WHERE "createdAt" < NOW() - INTERVAL '7 days'
  AND status IN ('COMPLETED', 'FAILED');

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Verificar chave API atualizada
SELECT 
  'CHAVE API ATUALIZADA' as status,
  provider,
  LENGTH("apiKey") as tamanho_chave,
  LEFT("apiKey", 7) as inicio,
  "isActive",
  model
FROM "GlobalAiConnection"
WHERE provider = 'ANTHROPIC';

-- Verificar view criada
SELECT 
  'VIEW CRIADA COM SUCESSO' as status,
  COUNT(*) as total_devices
FROM extension_devices;

-- Verificar devices online
SELECT 
  'DEVICES ONLINE' as status,
  device_id,
  user_id,
  status,
  EXTRACT(EPOCH FROM (NOW() - last_seen)) as segundos_desde_ultimo_ping
FROM extension_devices
WHERE status = 'online'
ORDER BY last_seen DESC
LIMIT 5;

-- Comandos pendentes
SELECT 
  'COMANDOS PENDENTES' as status,
  COUNT(*) as total_pendentes
FROM "ExtensionCommand"
WHERE status = 'PENDING';

SELECT '✅ TODAS AS CORREÇÕES APLICADAS COM SUCESSO!' as resultado;
