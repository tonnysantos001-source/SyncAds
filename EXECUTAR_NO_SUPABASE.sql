-- EXECUTAR NO SQL EDITOR DO SUPABASE
-- Dashboard → Projeto SyncAds → SQL Editor

-- 1. Criar view de compatibilidade
DROP VIEW IF EXISTS extension_devices CASCADE;

CREATE OR REPLACE VIEW extension_devices AS 
SELECT 
  id,
  "deviceId" as device_id,
  "userId" as user_id,
  CASE WHEN "isOnline" = true THEN 'online'::text ELSE 'offline'::text END as status,
  "lastSeen" as last_seen,
  "userAgent" as user_agent,
  "createdAt" as created_at,
  "deviceId", "userId", "isOnline", "lastSeen", "createdAt"
FROM "ExtensionDevice";

-- 2. Regra de UPDATE
CREATE OR REPLACE RULE extension_devices_update AS
  ON UPDATE TO extension_devices
  DO INSTEAD
  UPDATE "ExtensionDevice"
  SET 
    "isOnline" = CASE WHEN NEW.status = 'online' THEN true WHEN NEW.isOnline IS NOT NULL THEN NEW.isOnline ELSE "isOnline" END,
    "lastSeen" = COALESCE(NEW.last_seen, NEW.lastSeen, "lastSeen"),
    "updatedAt" = NOW()
  WHERE "deviceId" = OLD.device_id OR "deviceId" = OLD.deviceId;

-- 3. Permissions
GRANT ALL ON extension_devices TO authenticated;
GRANT ALL ON extension_devices TO service_role;

-- 4. Atualizar API Key Anthropic (COLE SUA CHAVE AQUI)
UPDATE "GlobalAiConnection"
SET 
  apiKey = 'sk-ant-COLE_SUA_CHAVE_AQUI_DEPOIS_DO_TRAÇO',
  isActive = true,
  model = 'claude-3-5-sonnet-20241022'
WHERE provider = 'ANTHROPIC';

-- 5. Verificar
SELECT provider, LENGTH(apiKey) as len, isActive FROM "GlobalAiConnection";
