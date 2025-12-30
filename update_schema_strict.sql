-- =========================================================
-- MIGRATION: STRICT PLANNER-EXECUTOR SCHEMA
-- =========================================================
-- 1. Ensure 'payload' column exists (and migrate data if needed)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'extension_commands'
        AND column_name = 'payload'
) THEN
ALTER TABLE extension_commands
ADD COLUMN payload JSONB DEFAULT '{}';
-- Optional: Copy data to payload if you want to keep history
-- UPDATE extension_commands SET payload = data;
END IF;
END $$;
-- 2. Update Status Constraint to allow 'done' and 'error'
-- First, drop the old constraint if it exists
ALTER TABLE extension_commands DROP CONSTRAINT IF EXISTS extension_commands_status_check;
-- Add new constraint
ALTER TABLE extension_commands
ADD CONSTRAINT extension_commands_status_check CHECK (
        status IN (
            'pending',
            'processing',
            'done',
            'completed',
            'failed',
            'error'
        )
    );
-- Note: Included 'completed'/'failed' for backward compat just in case, but code uses 'done'/'error'
-- 3. Indexes for polling
CREATE INDEX IF NOT EXISTS idx_extension_commands_pending_strict ON extension_commands(device_id, status)
WHERE status = 'pending';
-- 4. Verify
SELECT column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'extension_commands';