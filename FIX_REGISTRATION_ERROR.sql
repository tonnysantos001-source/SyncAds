/*
 * CORREÇÃO URGENTE - Erro de Registro
 * 
 * PROBLEMA: Registration failed: insufficient privilege for table "extension_devices"
 * CAUSA: extension_devices é uma VIEW sem RULE para INSERT
 * 
 * EXECUTE ESTE SQL NO SUPABASE DASHBOARD:
 * 1. Vá para: https://supabase.com/dashboard
 * 2. Selecione seu projeto SyncAds
 * 3. Vá em: SQL Editor
 * 4. Cole todo este conteúdo e clique em RUN
 */
-- PASSO 1: Criar regra INSTEAD OF INSERT para a view extension_devices
CREATE OR REPLACE RULE extension_devices_insert AS ON
INSERT TO extension_devices DO INSTEAD
INSERT INTO "ExtensionDevice" (
        "deviceId",
        "userId",
        "isOnline",
        "lastSeen",
        "userAgent",
        "browserName",
        "browserVersion",
        "osName",
        "createdAt",
        "updatedAt"
    )
VALUES (
        COALESCE(
            NEW.device_id,
            NEW.deviceId,
            gen_random_uuid()::text
        ),
        COALESCE(NEW.user_id, NEW.userId),
        COALESCE(
            CASE
                WHEN NEW.status = 'online' THEN true
                ELSE false
            END,
            NEW.isOnline,
            false
        ),
        COALESCE(NEW.last_seen, NEW.lastSeen, NOW()),
        COALESCE(NEW.user_agent, NEW.userAgent),
        NEW.browser_name,
        NEW.browser_version,
        NEW.os_name,
        COALESCE(NEW.created_at, NEW.createdAt, NOW()),
        COALESCE(NEW.updated_at, NEW.updatedAt, NOW())
    ) ON CONFLICT ("deviceId") DO
UPDATE
SET "isOnline" = EXCLUDED."isOnline",
    "lastSeen" = EXCLUDED."lastSeen",
    "updatedAt" = NOW()
RETURNING *;
-- PASSO 2: Criar regra INSTEAD OF DELETE
CREATE OR REPLACE RULE extension_devices_delete AS ON DELETE TO extension_devices DO INSTEAD
DELETE FROM "ExtensionDevice"
WHERE "deviceId" = OLD.device_id
    OR "deviceId" = OLD.deviceId;
-- PASSO 3: Habilitar RLS na tabela base
ALTER TABLE "ExtensionDevice" ENABLE ROW LEVEL SECURITY;
-- PASSO 4: Criar política para usuários autenticados
DROP POLICY IF EXISTS "Users can manage their own extension devices" ON "ExtensionDevice";
CREATE POLICY "Users can manage their own extension devices" ON "ExtensionDevice" FOR ALL USING (
    auth.uid()::text = "userId"
    OR auth.role() = 'service_role'
) WITH CHECK (
    auth.uid()::text = "userId"
    OR auth.role() = 'service_role'
);
-- PASSO 5: Política CRÍTICA - Permitir anon criar devices durante registro
DROP POLICY IF EXISTS "Allow anon to create extension devices" ON "ExtensionDevice";
CREATE POLICY "Allow anon to create extension devices" ON "ExtensionDevice" FOR
INSERT TO anon WITH CHECK (true);
-- PASSO 6: Atualizar permissões
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON "ExtensionDevice" TO authenticated;
GRANT SELECT,
    INSERT,
    UPDATE,
    DELETE ON "ExtensionDevice" TO service_role;
GRANT INSERT ON "ExtensionDevice" TO anon;
-- PASSO 7: Verificar se funcionou
SELECT 'Migration completed successfully!' as status;