-- ════════════════════════════════════════════════════════════
-- FIX: GatewayConfig não encontrada para usuário
-- ════════════════════════════════════════════════════════════
-- URL: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/sql/new
-- ════════════════════════════════════════════════════════════

-- 1. VERIFICAR SE GATEWAY PAGUE-X EXISTE
SELECT
  id,
  name,
  slug,
  "supportsPix",
  "supportsCreditCard",
  "supportsBoleto",
  "isActive"
FROM "Gateway"
WHERE slug = 'paguex';

-- Se retornar vazio, execute primeiro o arquivo: EXECUTAR_ESTE_SQL_AGORA.sql
-- ════════════════════════════════════════════════════════════

-- 2. VER TODOS OS USUÁRIOS (para pegar o ID do usuário correto)
SELECT
  id,
  name,
  email,
  "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;

-- ════════════════════════════════════════════════════════════

-- 3. VER SE JÁ EXISTE GATEWAYCONFIG PARA O USUÁRIO
-- SUBSTITUA 'SEU_USER_ID_AQUI' pelo ID do usuário da query acima
SELECT
  gc.id,
  gc."userId",
  gc."gatewayId",
  g.name as "gatewayName",
  g.slug as "gatewaySlug",
  gc."isActive",
  gc."isVerified",
  gc.environment,
  gc."createdAt"
FROM "GatewayConfig" gc
INNER JOIN "Gateway" g ON g.id = gc."gatewayId"
WHERE gc."userId" = 'SEU_USER_ID_AQUI';

-- ════════════════════════════════════════════════════════════

-- 4. CRIAR GATEWAYCONFIG PARA O USUÁRIO (SE NÃO EXISTIR)
-- SUBSTITUA 'SEU_USER_ID_AQUI' pelo ID do usuário
-- Este comando cria um GatewayConfig vazio que pode ser preenchido pela UI

INSERT INTO "GatewayConfig" (
  "userId",
  "gatewayId",
  "isActive",
  "isDefault",
  "isVerified",
  environment,
  credentials,
  "createdAt",
  "updatedAt"
)
SELECT
  'SEU_USER_ID_AQUI'::uuid as "userId",
  g.id as "gatewayId",
  false as "isActive",
  false as "isDefault",
  false as "isVerified",
  'production' as environment,
  '{}'::jsonb as credentials,
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "Gateway" g
WHERE g.slug = 'paguex'
  AND NOT EXISTS (
    SELECT 1 FROM "GatewayConfig" gc
    WHERE gc."userId" = 'SEU_USER_ID_AQUI'::uuid
      AND gc."gatewayId" = g.id
  );

-- ════════════════════════════════════════════════════════════

-- 5. VERIFICAR SE FOI CRIADO COM SUCESSO
SELECT
  gc.id,
  gc."userId",
  u.email as "userEmail",
  g.name as "gatewayName",
  g.slug as "gatewaySlug",
  gc."isActive",
  gc."isVerified",
  gc.environment,
  gc."createdAt"
FROM "GatewayConfig" gc
INNER JOIN "Gateway" g ON g.id = gc."gatewayId"
INNER JOIN "User" u ON u.id = gc."userId"
WHERE gc."userId" = 'SEU_USER_ID_AQUI'::uuid
  AND g.slug = 'paguex';

-- ════════════════════════════════════════════════════════════

-- ALTERNATIVA RÁPIDA (CRIA PARA TODOS OS USUÁRIOS)
-- Use apenas se tiver certeza de que quer criar para todos
-- ════════════════════════════════════════════════════════════

-- INSERT INTO "GatewayConfig" (
--   "userId",
--   "gatewayId",
--   "isActive",
--   "isDefault",
--   "isVerified",
--   environment,
--   credentials,
--   "createdAt",
--   "updatedAt"
-- )
-- SELECT
--   u.id as "userId",
--   g.id as "gatewayId",
--   false as "isActive",
--   false as "isDefault",
--   false as "isVerified",
--   'production' as environment,
--   '{}'::jsonb as credentials,
--   NOW() as "createdAt",
--   NOW() as "updatedAt"
-- FROM "User" u
-- CROSS JOIN "Gateway" g
-- WHERE g.slug = 'paguex'
--   AND NOT EXISTS (
--     SELECT 1 FROM "GatewayConfig" gc
--     WHERE gc."userId" = u.id
--       AND gc."gatewayId" = g.id
--   );

-- ════════════════════════════════════════════════════════════
-- RESULTADO ESPERADO:
-- Após executar, você deve conseguir:
-- 1. Ver o GatewayConfig criado nas queries de verificação
-- 2. Salvar credenciais pela UI sem erro
-- 3. Verificar credenciais normalmente
-- ════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════
-- TROUBLESHOOTING
-- ════════════════════════════════════════════════════════════

-- Se ainda der erro "GatewayConfig não encontrada":
-- 1. Verifique se o gateway existe (query 1)
-- 2. Verifique se o userId está correto (query 2)
-- 3. Limpe cache do navegador (Ctrl+Shift+R)
-- 4. Faça logout/login na aplicação
-- 5. Tente novamente

-- Se der erro de RLS (Row Level Security):
-- Execute para ver as políticas:
SELECT * FROM pg_policies WHERE tablename = 'GatewayConfig';

-- ════════════════════════════════════════════════════════════
