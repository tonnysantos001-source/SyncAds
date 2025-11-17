-- Verificar se as tabelas da extensão existem
SELECT 
  tablename,
  schemaname
FROM pg_tables
WHERE tablename IN ('ExtensionDevice', 'ExtensionCommand', 'ExtensionLog')
ORDER BY tablename;
