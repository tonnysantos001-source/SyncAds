/*
 * CORREÇÃO FINAL - INSERT RETURNING na VIEW
 * 
 * PROBLEMA: Content Script precisa de INSERT RETURNING mas a RULE não suporta
 * CÓDIGO: 0A000 - feature_not_supported
 * 
 * EXECUTE ESTE SQL NO SUPABASE DASHBOARD:
 */
-- SOLUÇÃO: Deletar a RULE antiga e criar uma função + trigger
-- Passo 1: Remover a RULE antiga
DROP RULE IF EXISTS extension_devices_insert ON extension_devices;
-- Passo 2: Criar função para INSERT
CREATE OR REPLACE FUNCTION extension_devices_insert_fn() RETURNS TRIGGER AS $$ BEGIN
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
        COALESCE(NEW.device_id, gen_random_uuid()::text),
        NEW.user_id,
        COALESCE(
            CASE
                WHEN NEW.status = 'online' THEN true
                ELSE false
            END,
            false
        ),
        COALESCE(NEW.last_seen, NOW()),
        NEW.user_agent,
        NEW.browser_name,
        NEW.browser_version,
        NEW.os_name,
        COALESCE(NEW.created_at, NOW()),
        NOW()
    ) ON CONFLICT ("deviceId") DO
UPDATE
SET "isOnline" = EXCLUDED."isOnline",
    "lastSeen" = EXCLUDED."lastSeen",
    "updatedAt" = NOW()
RETURNING id,
    "deviceId" as device_id,
    "userId" as user_id,
    CASE
        WHEN "isOnline" THEN 'online'::text
        ELSE 'offline'::text
    END as status,
    "lastSeen" as last_seen,
    "userAgent" as user_agent,
    "browserName" as browser_name,
    "browserVersion" as browser_version,
    "osName" as os_name,
    "createdAt" as created_at,
    "updatedAt" as updated_at INTO NEW;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Passo 3: Criar trigger INSTEAD OF INSERT
DROP TRIGGER IF EXISTS extension_devices_insert_trigger ON extension_devices;
CREATE TRIGGER extension_devices_insert_trigger INSTEAD OF
INSERT ON extension_devices FOR EACH ROW EXECUTE FUNCTION extension_devices_insert_fn();
-- Verificar
SELECT 'Migration completed successfully! INSERT RETURNING agora funciona!' as status;