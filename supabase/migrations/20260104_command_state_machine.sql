-- =====================================================
-- MIGRATION: Command State Machine + Locks + Audit Trail
-- Created: 2026-01-04
-- Purpose: Robust command lifecycle management
-- =====================================================
-- =====================================================
-- 1. CREATE ENUM FOR COMMAND STATUS
-- =====================================================
-- Drop existing status column type if needed (backup first in production!)
-- ALTER TABLE extension_commands ALTER COLUMN status TYPE TEXT;
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'command_status_enum'
) THEN CREATE TYPE command_status_enum AS ENUM (
    'pending',
    -- Command created, awaiting processing
    'processing',
    -- Currently being executed
    'completed',
    -- Successfully completed
    'failed',
    -- Execution failed
    'timeout',
    -- Exceeded timeout threshold
    'cancelled' -- Manually cancelled or system abort
);
END IF;
END $$;
-- =====================================================
-- 2. ADD STATE TRACKING COLUMNS
-- =====================================================
-- Add columns if they don't exist
DO $$ BEGIN -- Status transitions log
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'extension_commands'
        AND column_name = 'status_transitions'
) THEN
ALTER TABLE extension_commands
ADD COLUMN status_transitions JSONB DEFAULT '[]'::jsonb;
END IF;
-- Lock tracking
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'extension_commands'
        AND column_name = 'locked_at'
) THEN
ALTER TABLE extension_commands
ADD COLUMN locked_at TIMESTAMPTZ;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'extension_commands'
        AND column_name = 'locked_by'
) THEN
ALTER TABLE extension_commands
ADD COLUMN locked_by TEXT;
END IF;
-- Attempt counter for retries
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'extension_commands'
        AND column_name = 'attempt_count'
) THEN
ALTER TABLE extension_commands
ADD COLUMN attempt_count INTEGER DEFAULT 0;
END IF;
-- Last error message
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'extension_commands'
        AND column_name = 'last_error'
) THEN
ALTER TABLE extension_commands
ADD COLUMN last_error TEXT;
END IF;
-- Updated At timestamp
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'extension_commands'
        AND column_name = 'updated_at'
) THEN
ALTER TABLE extension_commands
ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
END IF;
-- Conversation ID (optional)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'extension_commands'
        AND column_name = 'conversation_id'
) THEN
ALTER TABLE extension_commands
ADD COLUMN conversation_id UUID;
END IF;
-- Metadata (for signals and extra context)
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'extension_commands'
        AND column_name = 'metadata'
) THEN
ALTER TABLE extension_commands
ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
END IF;
END $$;
-- =====================================================
-- 3. CREATE STATUS TRANSITION VALIDATION FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION validate_command_status_transition() RETURNS TRIGGER AS $$
DECLARE valid_transition BOOLEAN := FALSE;
transition_record JSONB;
BEGIN -- If status hasn't changed, allow update
IF OLD.status IS NOT DISTINCT
FROM NEW.status THEN RETURN NEW;
END IF;
-- Define valid state transitions
CASE
    OLD.status
    WHEN 'pending' THEN valid_transition := NEW.status IN ('processing', 'cancelled', 'timeout');
WHEN 'processing' THEN valid_transition := NEW.status IN ('completed', 'failed', 'timeout');
WHEN 'completed',
'failed',
'timeout',
'cancelled' THEN -- Final states - no transitions allowed (except manual override)
-- Check if this is a manual override by checking user permissions
IF current_setting('request.jwt.claims', true)::jsonb->>'role' = 'service_role' THEN valid_transition := TRUE;
-- Allow service_role to override
ELSE valid_transition := FALSE;
END IF;
ELSE valid_transition := FALSE;
END CASE
;
-- Reject invalid transitions
IF NOT valid_transition THEN RAISE EXCEPTION 'Invalid status transition from % to % (command_id: %)',
OLD.status,
NEW.status,
NEW.id USING HINT = 'Valid transitions: pending→processing/cancelled, processing→completed/failed';
END IF;
-- Log the transition
transition_record := jsonb_build_object(
    'from',
    OLD.status,
    'to',
    NEW.status,
    'at',
    NOW(),
    'attempt',
    COALESCE(NEW.attempt_count, 0)
);
-- Append to transitions array
NEW.status_transitions := COALESCE(OLD.status_transitions, '[]'::jsonb) || transition_record;
-- Update attempt_count on retry
IF NEW.status = 'processing'
AND OLD.status = 'failed' THEN NEW.attempt_count := COALESCE(OLD.attempt_count, 0) + 1;
END IF;
-- Update updated_at
NEW.updated_at := NOW();
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- =====================================================
-- 4. CREATE TRIGGER FOR STATUS VALIDATION
-- =====================================================
DROP TRIGGER IF EXISTS enforce_command_status_transitions ON extension_commands;
CREATE TRIGGER enforce_command_status_transitions BEFORE
UPDATE OF status ON extension_commands FOR EACH ROW
    WHEN (
        OLD.status IS DISTINCT
        FROM NEW.status
    ) EXECUTE FUNCTION validate_command_status_transition();
-- =====================================================
-- 5. CREATE LOCK MANAGEMENT FUNCTIONS
-- =====================================================
-- Function to acquire lock on a command
CREATE OR REPLACE FUNCTION acquire_command_lock(
        p_command_id UUID,
        p_worker_id TEXT,
        p_lock_timeout_seconds INTEGER DEFAULT 30
    ) RETURNS TABLE(
        acquired BOOLEAN,
        command_row extension_commands
    ) AS $$ BEGIN RETURN QUERY
UPDATE extension_commands
SET locked_at = NOW(),
    locked_by = p_worker_id,
    status = CASE
        WHEN status = 'pending' THEN 'processing'::TEXT
        ELSE status
    END,
    started_at = CASE
        WHEN started_at IS NULL THEN NOW()
        ELSE started_at
    END
WHERE id = p_command_id -- Can acquire if not locked, or lock expired
    AND (
        locked_at IS NULL
        OR locked_at < NOW() - (p_lock_timeout_seconds || ' seconds')::INTERVAL
    ) -- Only lock pending or stale processing commands
    AND status IN ('pending', 'processing')
RETURNING TRUE as acquired,
    extension_commands.*;
-- If no rows updated, lock was not acquired
IF NOT FOUND THEN RETURN QUERY
SELECT FALSE as acquired,
    NULL::extension_commands;
END IF;
END;
$$ LANGUAGE plpgsql;
-- Function to release lock
CREATE OR REPLACE FUNCTION release_command_lock(
        p_command_id UUID,
        p_worker_id TEXT,
        p_final_status TEXT DEFAULT NULL,
        p_error_message TEXT DEFAULT NULL
    ) RETURNS BOOLEAN AS $$
DECLARE lock_released BOOLEAN;
BEGIN
UPDATE extension_commands
SET locked_at = NULL,
    locked_by = NULL,
    status = COALESCE(p_final_status, status),
    completed_at = CASE
        WHEN p_final_status IN ('completed', 'failed', 'timeout', 'cancelled') THEN NOW()
        ELSE completed_at
    END,
    last_error = COALESCE(p_error_message, last_error),
    error = COALESCE(p_error_message, error),
    updated_at = NOW()
WHERE id = p_command_id
    AND locked_by = p_worker_id
RETURNING TRUE INTO lock_released;
RETURN COALESCE(lock_released, FALSE);
END;
$$ LANGUAGE plpgsql;
-- =====================================================
-- 6. CREATE AUDIT TRAIL VIEW
-- =====================================================
CREATE OR REPLACE VIEW command_audit_trail AS
SELECT c.id AS command_id,
    c.type AS command_type,
    c.status,
    c.created_at,
    c.started_at,
    c.completed_at,
    c.updated_at,
    c.device_id,
    c.conversation_id,
    ed.user_id,
    c.status_transitions,
    c.locked_by,
    c.locked_at,
    c.attempt_count,
    c.last_error,
    c.error,
    -- Computed fields
    EXTRACT(
        EPOCH
        FROM (COALESCE(c.completed_at, NOW()) - c.created_at)
    ) AS total_duration_seconds,
    EXTRACT(
        EPOCH
        FROM (
                COALESCE(c.completed_at, NOW()) - COALESCE(c.started_at, c.created_at)
            )
    ) AS execution_duration_seconds,
    -- Health status
    CASE
        WHEN c.status = 'completed' THEN 'success'
        WHEN c.status IN ('failed', 'timeout') THEN 'error'
        WHEN c.status = 'cancelled' THEN 'cancelled'
        WHEN c.status = 'processing'
        AND c.locked_at < NOW() - INTERVAL '30 seconds' THEN 'stuck'
        WHEN c.status = 'processing' THEN 'active'
        WHEN c.status = 'pending' THEN 'waiting'
        ELSE 'unknown'
    END AS health_status,
    -- Is stale?
    CASE
        WHEN c.status = 'pending'
        AND c.created_at < NOW() - INTERVAL '5 minutes' THEN TRUE
        WHEN c.status = 'processing'
        AND c.started_at < NOW() - INTERVAL '2 minutes' THEN TRUE
        ELSE FALSE
    END AS is_stale,
    -- Metadata
    c.metadata,
    c.payload,
    c.options
FROM extension_commands c
    LEFT JOIN extension_devices ed ON c.device_id = ed.id
ORDER BY c.created_at DESC;
-- Grant access to authenticated users
GRANT SELECT ON command_audit_trail TO authenticated;
-- =====================================================
-- 7. CREATE INDEXES FOR PERFORMANCE
-- =====================================================
-- Index for locked commands (to find stuck commands)
CREATE INDEX IF NOT EXISTS idx_extension_commands_locked ON extension_commands(locked_at)
WHERE locked_at IS NOT NULL;
-- Index for status + device_id (common query)
CREATE INDEX IF NOT EXISTS idx_extension_commands_status_device ON extension_commands(status, device_id);
-- Index for pending commands by device
CREATE INDEX IF NOT EXISTS idx_extension_commands_pending_device ON extension_commands(device_id, created_at)
WHERE status = 'pending';
-- Index for processing commands
CREATE INDEX IF NOT EXISTS idx_extension_commands_processing ON extension_commands(started_at)
WHERE status = 'processing';
-- =====================================================
-- 8. CREATE CLEANUP FUNCTION (Optional)
-- =====================================================
-- Function to clean up old completed commands
CREATE OR REPLACE FUNCTION cleanup_old_commands(p_retention_days INTEGER DEFAULT 7) RETURNS INTEGER AS $$
DECLARE deleted_count INTEGER;
BEGIN
DELETE FROM extension_commands
WHERE status IN ('completed', 'failed', 'timeout', 'cancelled')
    AND completed_at < NOW() - (p_retention_days || ' days')::INTERVAL
RETURNING COUNT(*) INTO deleted_count;
RETURN COALESCE(deleted_count, 0);
END;
$$ LANGUAGE plpgsql;
-- =====================================================
-- 9. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON COLUMN extension_commands.status IS 'Command status with enforced state transitions';
COMMENT ON COLUMN extension_commands.status_transitions IS 'JSONB array of all status transitions with timestamps';
COMMENT ON COLUMN extension_commands.locked_at IS 'Timestamp when command was locked by a worker';
COMMENT ON COLUMN extension_commands.locked_by IS 'Worker ID that currently holds the lock';
COMMENT ON COLUMN extension_commands.attempt_count IS 'Number of execution attempts (for retries)';
COMMENT ON COLUMN extension_commands.last_error IS 'Last error message from failed attempt';
COMMENT ON FUNCTION acquire_command_lock IS 'Atomically acquire lock on a command for processing';
COMMENT ON FUNCTION release_command_lock IS 'Release lock and optionally set final status';
COMMENT ON FUNCTION validate_command_status_transition IS 'Trigger function to enforce valid status transitions';
COMMENT ON VIEW command_audit_trail IS 'Comprehensive audit view of command lifecycle with computed metrics';
-- =====================================================
-- END OF MIGRATION
-- =====================================================