-- Migration: Fix extension_commands view to support all required fields
-- Purpose: Add missing command_type field and proper INSERT support
-- Drop existing view if exists
DROP VIEW IF EXISTS extension_commands CASCADE;
-- Create view with all needed fields
CREATE OR REPLACE VIEW extension_commands AS
SELECT id,
    "deviceId" as device_id,
    "userId" as user_id,
    command as type,
    -- Map command to type for backwards compatibility
    command,
    -- Keep command field
    command as command_type,
    -- Add command_type mapping
    params->>'selector' as selector,
    params->>'value' as value,
    params as options,
    status,
    result,
    error,
    "createdAt" as created_at,
    "executedAt" as executed_at,
    "completedAt" as completed_at,
    -- Also expose original Pascal case columns
    "deviceId",
    "userId",
    params,
    "createdAt",
    "executedAt",
    "completedAt"
FROM "ExtensionCommand";
-- Create INSTEAD OF INSERT rule
CREATE OR REPLACE RULE extension_commands_insert AS ON
INSERT TO extension_commands DO INSTEAD
INSERT INTO "ExtensionCommand" ("deviceId", "userId", command, params, status)
VALUES (
        COALESCE(NEW.device_id, NEW.deviceId),
        COALESCE(NEW.user_id, NEW.userId),
        COALESCE(NEW.type, NEW.command, NEW.command_type),
        jsonb_build_object(
            'url',
            (NEW.options->>'url'),
            'selector',
            NEW.selector,
            'value',
            NEW.value,
            'type',
            COALESCE(NEW.type, NEW.command, NEW.command_type)
        ) || COALESCE(NEW.options, '{}'::jsonb) || COALESCE(NEW.params, '{}'::jsonb),
        COALESCE(NEW.status, 'pending')
    )
RETURNING id,
    "deviceId" as device_id,
    "userId" as user_id,
    command as type,
    command,
    command as command_type,
    params->>'selector' as selector,
    params->>'value' as value,
    params as options,
    status,
    result,
    error,
    "createdAt" as created_at,
    "executedAt" as executed_at,
    "completedAt" as completed_at,
    "deviceId",
    "userId",
    params,
    "createdAt",
    "executedAt",
    "completedAt";
-- Create INSTEAD OF UPDATE rule
CREATE OR REPLACE RULE extension_commands_update AS ON UPDATE TO extension_commands DO INSTEAD
UPDATE "ExtensionCommand"
SET status = COALESCE(NEW.status, "ExtensionCommand".status),
    result = COALESCE(NEW.result, "ExtensionCommand".result),
    error = COALESCE(NEW.error, "ExtensionCommand".error),
    "executedAt" = COALESCE(
        NEW.executed_at,
        NEW.executedAt,
        "ExtensionCommand"."executedAt"
    ),
    "completedAt" = CASE
        WHEN NEW.status IN ('completed', 'failed', 'COMPLETED', 'FAILED') THEN COALESCE(NEW.completed_at, NEW.completedAt, NOW())
        ELSE "ExtensionCommand"."completedAt"
    END
WHERE id = OLD.id
RETURNING id,
    "deviceId" as device_id,
    "userId" as user_id,
    command as type,
    command,
    command as command_type,
    params->>'selector' as selector,
    params->>'value' as value,
    params as options,
    status,
    result,
    error,
    "createdAt" as created_at,
    "executedAt" as executed_at,
    "completedAt" as completed_at,
    "deviceId",
    "userId",
    params,
    "createdAt",
    "executedAt",
    "completedAt";
-- Grant permissions
GRANT ALL ON extension_commands TO authenticated;
GRANT ALL ON extension_commands TO service_role;
GRANT ALL ON extension_commands TO anon;
-- Create index on command field for performance
CREATE INDEX IF NOT EXISTS idx_extension_command_type ON "ExtensionCommand"(command);