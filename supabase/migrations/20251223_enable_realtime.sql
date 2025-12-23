-- Enable Realtime for extension_commands
-- This allows the Chrome Extension to listen for new commands instantly
BEGIN;
-- Check if publication exists (default in Supabase)
-- If not, creating it might require superuser, but usually it exists.
-- We just add the table.
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'extension_commands'
) THEN ALTER PUBLICATION supabase_realtime
ADD TABLE extension_commands;
END IF;
END $$;
COMMIT;