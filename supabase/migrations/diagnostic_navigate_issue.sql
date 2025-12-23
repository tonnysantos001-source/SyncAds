-- =====================================================
-- DIAGNÓSTICO: NAVIGATE COMMANDS NÃO CRIADOS
-- =====================================================
-- 1. Verificar schema da tabela extension_commands
SELECT column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'extension_commands'
ORDER BY ordinal_position;
-- 2. Verificar devices online
SELECT user_id,
    device_id,
    status,
    "isOnline",
    last_heartbeat,
    created_at,
    NOW() - last_heartbeat as tempo_desde_heartbeat
FROM extension_devices
ORDER BY last_heartbeat DESC NULLS LAST
LIMIT 20;
-- 3. Verificar últimos comandos criados
SELECT id,
    device_id,
    user_id,
    type,
    command_type,
    status,
    created_at,
    completed_at,
    error
FROM extension_commands
ORDER BY created_at DESC
LIMIT 20;
-- 4. Contar comandos por status
SELECT status,
    COUNT(*) as total,
    MAX(created_at) as ultimo_comando
FROM extension_commands
GROUP BY status
ORDER BY total DESC;
-- 5. Verificar se há comandos pendentes antigos (stuck)
SELECT id,
    type,
    status,
    created_at,
    NOW() - created_at as idade
FROM extension_commands
WHERE status = 'pending'
    AND created_at < NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC
LIMIT 10;
-- 6. Verificar constraints da tabela
SELECT con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE
        con.contype
        WHEN 'c' THEN 'CHECK'
        WHEN 'f' THEN 'FOREIGN KEY'
        WHEN 'p' THEN 'PRIMARY KEY'
        WHEN 'u' THEN 'UNIQUE'
        WHEN 'n' THEN 'NOT NULL'
    END AS constraint_type_desc,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'extension_commands';
-- =====================================================
-- TESTES MANUAIS
-- =====================================================
-- 7. Tentar inserir comando de teste (SUBSTITUA os valores)
-- IMPORTANTE: Execute as queries acima primeiro para pegar device_id e user_id válidos
/*
 INSERT INTO extension_commands (
 device_id,
 user_id,
 type,
 command_type,
 options,
 status,
 created_at
 ) VALUES (
 'SEU_DEVICE_ID_AQUI',  -- pegar da query 2
 'SEU_USER_ID_AQUI',     -- pegar da query 2
 'NAVIGATE',
 'NAVIGATE',
 '{"url": "https://google.com"}',
 'pending',
 NOW()
 ) RETURNING *;
 */
-- 8. Forçar device como online (se necessário)
/*
 UPDATE extension_devices
 SET 
 status = 'online',
 "isOnline" = true,
 last_heartbeat = NOW()
 WHERE user_id = 'SEU_USER_ID_AQUI';
 */
-- 9. Limpar comandos antigos stuck (se necessário)
/*
 UPDATE extension_commands
 SET status = 'failed',
 error = 'Timeout: Comando muito antigo, marcado como failed automaticamente'
 WHERE status = 'pending'
 AND created_at < NOW() - INTERVAL '10 minutes';
 */