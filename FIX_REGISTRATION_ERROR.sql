/*
 * CORREÇÃO COMPLETA - Limpar VIEW e usar TABELA
 * 
 * PROBLEMA: Extensão tenta INSERT RETURNING mas VIEW/RULEs antigas estão bloqueando
 * SOLUÇÃO: Remover VIEW completamente e usar apenas a TABELA ExtensionDevice
 * 
 * EXECUTE ESTE SQL NO SUPABASE DASHBOARD:
 */
-- PASSO 1: Remover todas as RULEs antigas
DROP RULE IF EXISTS extension_devices_insert ON extension_devices CASCADE;
DROP RULE IF EXISTS extension_devices_update ON extension_devices CASCADE;
DROP RULE IF EXISTS extension_devices_delete ON extension_devices CASCADE;
-- PASSO 2: Remover triggers antigos
DROP TRIGGER IF EXISTS extension_devices_insert_trigger ON extension_devices CASCADE;
DROP FUNCTION IF EXISTS extension_devices_insert_fn() CASCADE;
-- PASSO 3: Se extension_devices for uma VIEW, deletar ela
DROP VIEW IF EXISTS extension_devices CASCADE;
-- PASSO 4: Criar extension_devices como TABELA (se não existir)
CREATE TABLE IF NOT EXISTS extension_devices (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    device_id text UNIQUE NOT NULL,
    user_id text NOT NULL,
    status text DEFAULT 'offline',
    last_seen timestamp with time zone DEFAULT now(),
    user_agent text,
    browser_name text,
    browser_version text,
    os_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
-- PASSO 5: Migrar dados de ExtensionDevice para extension_devices (se existir)
INSERT INTO extension_devices (
        device_id,
        user_id,
        status,
        last_seen,
        user_agent,
        browser_name,
        browser_version,
        os_name,
        created_at,
        updated_at
    )
SELECT "deviceId",
    "userId",
    CASE
        WHEN "isOnline" THEN 'online'
        ELSE 'offline'
    END,
    "lastSeen",
    "userAgent",
    "browserName",
    "browserVersion",
    "osName",
    "createdAt",
    "updatedAt"
FROM "ExtensionDevice"
WHERE "deviceId" NOT IN (
        SELECT device_id
        FROM extension_devices
    ) ON CONFLICT (device_id) DO NOTHING;
-- PASSO 6: Habilitar RLS
ALTER TABLE extension_devices ENABLE ROW LEVEL SECURITY;
-- PASSO 7: Remover políticas antigas
DROP POLICY IF EXISTS "Users can manage their own devices" ON extension_devices;
DROP POLICY IF EXISTS "Allow anon to create devices" ON extension_devices;
DROP POLICY IF EXISTS "Users can view their own devices" ON extension_devices;
DROP POLICY IF EXISTS "Users can insert their own devices" ON extension_devices;
-- PASSO 8: Criar políticas corretas
CREATE POLICY "Users can manage their own devices" ON extension_devices FOR ALL USING (
    auth.uid()::text = user_id
    OR auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
) WITH CHECK (
    auth.uid()::text = user_id
    OR auth.role() = 'service_role'
    OR auth.role() = 'authenticated'
);
CREATE POLICY "Allow anon to create devices" ON extension_devices FOR
INSERT TO anon WITH CHECK (true);
-- PASSO 9: Atualizar permissões
GRANT ALL ON extension_devices TO authenticated;
GRANT ALL ON extension_devices TO service_role;
GRANT INSERT,
    SELECT ON extension_devices TO anon;
-- PASSO 10: Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_extension_devices_user_id ON extension_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_extension_devices_device_id ON extension_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_extension_devices_status ON extension_devices(status);
-- Verificar resultado
SELECT 'SUCCESS! extension_devices agora é uma TABELA com INSERT RETURNING funcionando!' as status,
    count(*) as total_devices
FROM extension_devices;