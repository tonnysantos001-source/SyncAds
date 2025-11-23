-- ============================================
-- AUDITORIA E CORREÇÃO COMPLETA DO SISTEMA DE IA
-- ============================================

-- PASSO 1: VERIFICAR SCHEMA ATUAL
SELECT '=== VERIFICANDO TABELAS DE EXTENSÃO ===' as status;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name ILIKE '%extension%')
ORDER BY table_name;

SELECT '=== SCHEMA ExtensionCommand ===' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ExtensionCommand'
ORDER BY ordinal_position;

SELECT '=== SCHEMA ExtensionDevice ===' as status;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'ExtensionDevice'
ORDER BY ordinal_position;

-- PASSO 2: VERIFICAR AI CONNECTIONS
SELECT '=== GLOBAL AI CONNECTIONS ===' as status;
SELECT 
  id, 
  name, 
  provider, 
  LENGTH(apiKey) as key_length,
  SUBSTRING(apiKey, 1, 15) || '...' as key_preview,
  isActive,
  model
FROM "GlobalAiConnection"
ORDER BY provider;

-- PASSO 3: CRIAR VIEWS DE COMPATIBILIDADE
SELECT '=== CRIANDO VIEWS DE COMPATIBILIDADE ===' as status;

-- Drop existing view if exists
DROP VIEW IF EXISTS extension_devices CASCADE;

-- Create compatibility view for extension_devices
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
  -- Include original columns for updates
  "deviceId",
  "userId",
  "isOnline",
  "lastSeen"
FROM "ExtensionDevice";

-- Grant permissions
GRANT ALL ON extension_devices TO authenticated;
GRANT ALL ON extension_devices TO service_role;

-- Enable RLS on view
ALTER VIEW extension_devices SET (security_invoker = on);

-- PASSO 4: VERIFICAR SE PRECISA RENOMEAR COLUNAS
DO $$
DECLARE
  has_type_col boolean;
  has_command_col boolean;
BEGIN
  -- Check if 'type' column exists in ExtensionCommand
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ExtensionCommand' 
    AND column_name = 'type'
  ) INTO has_type_col;
  
  SELECT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ExtensionCommand' 
    AND column_name = 'command'
  ) INTO has_command_col;

  IF has_type_col AND NOT has_command_col THEN
    RAISE NOTICE 'Renomeando coluna type para command...';
    ALTER TABLE "ExtensionCommand" RENAME COLUMN "type" TO "command";
  END IF;

  -- Check for 'data' vs 'params'
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ExtensionCommand' 
    AND column_name = 'data'
  ) AND NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'ExtensionCommand' 
    AND column_name = 'params'
  ) THEN
    RAISE NOTICE 'Renomeando coluna data para params...';
    ALTER TABLE "ExtensionCommand" RENAME COLUMN "data" TO "params";
  END IF;
END $$;

-- PASSO 5: VERIFICAR COMANDOS PENDENTES
SELECT '=== COMANDOS PENDENTES ===' as status;
SELECT 
  id,
  "deviceId",
  command,
  status,
  "createdAt",
  error
FROM "ExtensionCommand"
WHERE status = 'PENDING'
ORDER BY "createdAt" DESC
LIMIT 10;

-- PASSO 6: VERIFICAR DEVICES ONLINE
SELECT '=== DEVICES ONLINE ===' as status;
SELECT 
  id,
  "deviceId",
  "userId",
  "isOnline",
  "lastSeen",
  EXTRACT(EPOCH FROM (NOW() - "lastSeen")) as seconds_since_last_seen
FROM "ExtensionDevice"
WHERE "isOnline" = true
ORDER BY "lastSeen" DESC;

-- PASSO 7: ÍNDICES PARA PERFORMANCE (se não existirem)
CREATE INDEX IF NOT EXISTS idx_extension_device_user_online 
  ON "ExtensionDevice"("userId", "isOnline");
  
CREATE INDEX IF NOT EXISTS idx_extension_device_lastseen 
  ON "ExtensionDevice"("lastSeen" DESC);
  
CREATE INDEX IF NOT EXISTS idx_extension_command_device_status 
  ON "ExtensionCommand"("deviceId", status);
  
CREATE INDEX IF NOT EXISTS idx_extension_command_created 
  ON "ExtensionCommand"("createdAt" DESC);

SELECT '=== CORREÇÕES APLICADAS COM SUCESSO ===' as status;
