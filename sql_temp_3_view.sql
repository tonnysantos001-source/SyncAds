-- Script 3: CRIAR VIEW EXTENSÃO
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

GRANT ALL ON extension_devices TO authenticated, service_role, anon;
