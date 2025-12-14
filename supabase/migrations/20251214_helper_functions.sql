-- ==========================================
-- Helper function to get tables info
-- ==========================================
CREATE OR REPLACE FUNCTION get_tables_info() RETURNS TABLE (
        name TEXT,
        columns INTEGER,
        row_count BIGINT
    ) LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN RETURN QUERY
SELECT t.table_name::TEXT as name,
    COUNT(c.column_name)::INTEGER as columns,
    0::BIGINT as row_count
FROM information_schema.tables t
    LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
    AND t.table_schema = c.table_schema
WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
GROUP BY t.table_name;
END;
$$;
GRANT EXECUTE ON FUNCTION get_tables_info() TO authenticated;