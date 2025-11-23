-- Migration: Create compatibility views and fix schema
-- Created: 2025-11-23
-- Purpose: Fix extension system compatibility issues

-- PASSO 1: Criar view de compatibilidade para extension_devices
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
  -- Também expor colunas originais para compatibilidade
  "deviceId",
  "userId",
  "isOnline",
  "lastSeen",
  "userAgent",
  "createdAt",
  "updatedAt"
FROM "ExtensionDevice";

-- PASSO 2: Criar regra INSTEAD OF UPDATE para a view
CREATE OR REPLACE RULE extension_devices_update AS
  ON UPDATE TO extension_devices
  DO INSTEAD
  UPDATE "ExtensionDevice"
  SET 
    "isOnline" = CASE 
      WHEN NEW.status = 'online' THEN true 
      WHEN NEW.isOnline IS NOT NULL THEN NEW.isOnline
      ELSE "isOnline"
    END,
    "lastSeen" = COALESCE(NEW.last_seen, NEW.lastSeen, "lastSeen"),
    "updatedAt" = NOW()
  WHERE "deviceId" = OLD.device_id OR "deviceId" = OLD.deviceId;

-- PASSO 3: Grant permissions
GRANT ALL ON extension_devices TO authenticated;
GRANT ALL ON extension_devices TO service_role;
GRANT ALL ON extension_devices TO anon;

-- PASSO 4: Verificar e renomear colunas se necessário em ExtensionCommand
DO $$
BEGIN
  -- Renomear 'type' para 'command' se existir
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ExtensionCommand' 
    AND column_name = 'type'
  ) THEN
    ALTER TABLE "ExtensionCommand" RENAME COLUMN "type" TO "command";
    RAISE NOTICE 'Renamed column type to command in ExtensionCommand';
  END IF;

  -- Renomear 'data' para 'params' se existir
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ExtensionCommand' 
    AND column_name = 'data'
  ) THEN
    ALTER TABLE "ExtensionCommand" RENAME COLUMN "data" TO "params";
    RAISE NOTICE 'Renamed column data to params in ExtensionCommand';
  END IF;
END $$;

-- PASSO 5: Adicionar índices de performance
CREATE INDEX IF NOT EXISTS idx_extension_device_user_online 
  ON "ExtensionDevice"("userId", "isOnline");
  
CREATE INDEX IF NOT EXISTS idx_extension_device_lastseen 
  ON "ExtensionDevice"("lastSeen" DESC);
  
CREATE INDEX IF NOT EXISTS idx_extension_command_device_status 
  ON "ExtensionCommand"("deviceId", status);
  
CREATE INDEX IF NOT EXISTS idx_extension_command_created 
  ON "ExtensionCommand"("createdAt" DESC);

-- PASSO 6: Limpar comandos antigos (mais de 7 dias)
DELETE FROM "ExtensionCommand"
WHERE "createdAt" < NOW() - INTERVAL '7 days'
  AND status IN ('COMPLETED', 'FAILED');
