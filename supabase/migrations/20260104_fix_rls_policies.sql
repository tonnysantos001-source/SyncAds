-- =====================================================
-- MIGRATION: Fix RLS Policies for Extension Tables
-- Created: 2026-01-04
-- Purpose: Ensure users can properly query and update their commands
-- =====================================================
-- =====================================================
-- 1. DROP EXISTING PROBLEMATIC POLICIES
-- =====================================================
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can read own commands" ON extension_commands;
DROP POLICY IF EXISTS "Users can update own commands" ON extension_commands;
DROP POLICY IF EXISTS "Users can insert commands" ON extension_commands;
DROP POLICY IF EXISTS "Service role has full access" ON extension_commands;
DROP POLICY IF EXISTS "Users can read own devices" ON extension_devices;
DROP POLICY IF EXISTS "Users can update own devices" ON extension_devices;
DROP POLICY IF EXISTS "Users can insert own devices" ON extension_devices;
-- =====================================================
-- 2. EXTENSION_DEVICES POLICIES
-- =====================================================
-- Allow users to read their own devices
CREATE POLICY "Users can read own devices" ON extension_devices FOR
SELECT TO authenticated USING (user_id = auth.uid()::text);
-- Allow users to update their own devices
CREATE POLICY "Users can update own devices" ON extension_devices FOR
UPDATE TO authenticated USING (user_id = auth.uid()::text) WITH CHECK (user_id = auth.uid()::text);
-- Allow users to insert their own devices
CREATE POLICY "Users can insert own devices" ON extension_devices FOR
INSERT TO authenticated WITH CHECK (user_id = auth.uid()::text);
-- Service role has full access
CREATE POLICY "Service role full access on devi ces" ON extension_devices FOR ALL TO service_role USING (true) WITH CHECK (true);
-- =====================================================
-- 3. EXTENSION_COMMANDS POLICIES
-- =====================================================
-- Allow users to SELECT commands for their devices
CREATE POLICY "Users can read own device commands" ON extension_commands FOR
SELECT TO authenticated USING (
        device_id IN (
            SELECT device_id
            FROM extension_devices
            WHERE user_id = auth.uid()::text
        )
    );
-- Allow users to UPDATE commands for their devices
CREATE POLICY "Users can update own device commands" ON extension_commands FOR
UPDATE TO authenticated USING (
        device_id IN (
            SELECT device_id
            FROM extension_devices
            WHERE user_id = auth.uid()::text
        )
    ) WITH CHECK (
        device_id IN (
            SELECT device_id
            FROM extension_devices
            WHERE user_id = auth.uid()::text
        )
    );
-- Allow users to INSERT commands for their devices
CREATE POLICY "Users can insert own device commands" ON extension_commands FOR
INSERT TO authenticated WITH CHECK (
        device_id IN (
            SELECT device_id
            FROM extension_devices
            WHERE user_id = auth.uid()::text
        )
    );
-- Service role has full access (for backend operations)
CREATE POLICY "Service role full access on commands" ON extension_commands FOR ALL TO service_role USING (true) WITH CHECK (true);
-- =====================================================
-- 4. ENABLE RLS ON TABLES (if not already enabled)
-- =====================================================
ALTER TABLE extension_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE extension_commands ENABLE ROW LEVEL SECURITY;
-- =====================================================
-- 5. GRANT NECESSARY PERMISSIONS
-- =====================================================
-- Grant authenticated users access to tables
GRANT SELECT,
    INSERT,
    UPDATE ON extension_devices TO authenticated;
GRANT SELECT,
    INSERT,
    UPDATE ON extension_commands TO authenticated;
-- Grant access to sequences (for INSERT operations)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
-- =====================================================
-- 6. CREATE HELPER FUNCTION FOR DEBUGGING RLS
-- =====================================================
-- Function to check if user can access a command
CREATE OR REPLACE FUNCTION can_access_command(
        p_command_id UUID,
        p_user_id UUID DEFAULT auth.uid()
    ) RETURNS TABLE(
        can_access BOOLEAN,
        reason TEXT,
        device_id TEXT,
        device_user_id TEXT
    ) AS $$ BEGIN RETURN QUERY
SELECT (
        c.device_id IN (
            SELECT d.device_id
            FROM extension_devices d
            WHERE d.user_id = p_user_id::text
        )
    ) AS can_access,
    CASE
        WHEN c.device_id IN (
            SELECT d.device_id
            FROM extension_devices d
            WHERE d.user_id = p_user_id::text
        ) THEN 'User owns device'
        ELSE 'User does not own device'
    END AS reason,
    c.device_id,
    ed.user_id AS device_user_id
FROM extension_commands c
    LEFT JOIN extension_devices ed ON c.device_id = ed.device_id
WHERE c.id = p_command_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- =====================================================
-- 7. COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON POLICY "Users can read own device commands" ON extension_commands IS 'Allows authenticated users to read commands belonging to their devices';
COMMENT ON POLICY "Users can update own device commands" ON extension_commands IS 'Allows authenticated users to update status and metadata of their device commands';
COMMENT ON POLICY "Service role full access on commands" ON extension_commands IS 'Backend services can manage all commands regardless of user';
COMMENT ON FUNCTION can_access_command IS 'Debug helper to check if current user can access a specific command';
-- =====================================================
-- END OF MIGRATION
-- =====================================================