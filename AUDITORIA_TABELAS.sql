-- AUDITORIA FORENSE - Comandos da Extensão
-- Execute no Supabase SQL Editor
-- 1. LISTAR TODAS AS TABELAS
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- 2. VERIFICAR SE ExtensionCommand EXISTE
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename = 'ExtensionCommand';
-- 3. VER SCHEMA DA TABELA ExtensionCommand
SELECT column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'ExtensionCommand'
ORDER BY ordinal_position;
-- 4. VERIFICAR SE extension_commands (VIEW) EXISTE
SELECT viewname
FROM pg_views
WHERE schemaname = 'public'
    AND viewname = 'extension_commands';
-- 5. VER DEFINIÇÃO DA VIEW extension_commands
SELECT pg_get_viewdef('extension_commands', true);
-- 6. TESTAR SELECT COMO A EXTENSÃO FAZ
-- (substitua device_id_real pelo seu deviceId)
SELECT *
FROM extension_commands
WHERE device_id = 'DEVICE_ID_AQUI'
    AND status = 'pending'
ORDER BY created_at ASC
LIMIT 10;
-- 7. VER ÚLTIMOS COMANDOS NA TABELA BASE
SELECT id,
    "deviceId",
    "userId",
    command,
    params,
    status,
    "createdAt"
FROM "ExtensionCommand"
ORDER BY "createdAt" DESC
LIMIT 10;
-- 8. CONTAR COMANDOS POR STATUS
SELECT status,
    COUNT(*)
FROM "ExtensionCommand"
GROUP BY status;
-- 9. VER SE HÁ COMANDOS PENDING
SELECT COUNT(*)
FROM "ExtensionCommand"
WHERE status = 'pending';
-- 10. VER MAPPING DA VIEW
-- Se extension_commands mapeia deviceId → device_id
SELECT id,
    "deviceId" as backend_column,
    device_id as view_column
FROM extension_commands
LIMIT 1;