-- ============================================
-- DIAGNÓSTICO DE COMANDOS DA EXTENSÃO
-- ============================================
-- Execute no Supabase SQL Editor
-- Substitua valores com ⚠️ pelos seus dados reais
-- ============================================
-- 1. VERIFICAR DISPOSITIVO DO USUÁRIO
-- ============================================
SELECT user_id,
    device_id,
    status,
    last_seen,
    created_at
FROM extension_devices
WHERE user_id = 'SEU_USER_ID_AQUI' -- ⚠️ Substituir com seu user.id
ORDER BY last_seen DESC;
-- Resultado esperado: 1 linha com status = 'online'
-- Copie o device_id para usar nos próximos passos
-- ============================================
-- 2. VERIFICAR COMANDOS NA TABELA BASE
-- ============================================
SELECT id,
    "deviceId",
    "userId",
    command,
    params,
    status,
    "createdAt",
    "executedAt",
    "completedAt"
FROM "ExtensionCommand"
WHERE "deviceId" = 'DEVICE_ID_AQUI' -- ⚠️ Substituir com deviceId do passo 1
ORDER BY "createdAt" DESC
LIMIT 10;
-- Resultado esperado: Ver comandos criados
-- ============================================
-- 3. TESTAR VIEW (como extensão faz)
-- ============================================
SELECT *
FROM extension_commands
WHERE device_id = 'DEVICE_ID_AQUI' -- ⚠️ Mesmo deviceId
    AND status = 'pending'
ORDER BY created_at ASC
LIMIT 10;
-- Resultado esperado: Ver mesmos comandos da tabela base
-- Se vazio, comandos foram executados ou não existem
-- ============================================
-- 4. CRIAR COMANDO DE TESTE MANUALMENTE
-- ============================================
INSERT INTO "ExtensionCommand" (
        "deviceId",
        "userId",
        command,
        params,
        status
    )
VALUES (
        'DEVICE_ID_AQUI',
        -- ⚠️ Substituir
        'SEU_USER_ID_AQUI',
        -- ⚠️ Substituir
        'NAVIGATE',
        '{"url": "https://google.com"}'::jsonb,
        'pending'
    )
RETURNING id,
    "deviceId",
    command,
    params,
    status,
    "createdAt";
-- ✅ CRITÉRIO DE SUCESSO:
-- Após executar este INSERT, aguarde 5 segundos
-- Abra DevTools da extensão
-- Deve aparecer: "📦 Found 1 pending commands"
-- ============================================
-- 5. VERIFICAR SE COMANDO APARECE NA VIEW
-- ============================================
SELECT *
FROM extension_commands
WHERE device_id = 'DEVICE_ID_AQUI' -- ⚠️ Mesmo deviceId
    AND status = 'pending'
ORDER BY created_at DESC
LIMIT 1;
-- Resultado esperado: Ver o comando criado no passo 4
-- ============================================
-- 6. VERIFICAR MAPPING DA VIEW
-- ============================================
SELECT "deviceId" as tabela_base_deviceId,
    device_id as view_device_id,
    command,
    status
FROM extension_commands
LIMIT 3;
-- Resultado esperado: deviceId deve ter valor igual em ambas colunas
-- ============================================
-- 7. CONTAR COMANDOS POR STATUS
-- ============================================
SELECT status,
    COUNT(*) as total
FROM "ExtensionCommand"
GROUP BY status
ORDER BY total DESC;
-- Resultado esperado: Ver distribuição de comandos
-- ============================================
-- 8. VER ÚLTIMOS COMANDOS CRIADOS (TODOS)
-- ============================================
SELECT id,
    "deviceId",
    command,
    status,
    "createdAt"
FROM "ExtensionCommand"
ORDER BY "createdAt" DESC
LIMIT 20;
-- Ver se backend está criando comandos
-- ============================================
-- 9. LIMPAR COMANDOS ANTIGOS (OPCIONAL)
-- ============================================
-- DELETE FROM "ExtensionCommand"
-- WHERE status IN ('completed', 'failed')
--   AND "createdAt" < NOW() - INTERVAL '1 hour';
-- Descomente para limpar comandos antigos
-- ============================================
-- 10. RESET COMANDO DE TESTE (se precisar)
-- ============================================
-- UPDATE "ExtensionCommand"
-- SET status = 'pending'
-- WHERE id = 'COMMAND_ID_AQUI';  -- ⚠️ ID do comando de teste
-- Descomente para resetar status e testar novamente
-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 
-- ✅ BOA PRÁTICA:
-- 1. Execute passo 1 primeiro para obter deviceId
-- 2. Use esse deviceId em TODOS os outros passos
-- 3. Copie e cole exatamente, sem espaços extras
-- 
-- ⚠️ TROUBLESHOOTING:
-- - Se passo 1 retorna vazio: Extensão não está conectada
-- - Se passo 2 retorna vazio: Backend não está criando comandos
-- - Se passo 3 retorna vazio mas passo 2 tem dados: VIEW está incorreta
-- - Se passo 4 + 5s não aparece na extensão: Polling não está rodando