-- TESTE COMPLETO - Ver exatamente o que está acontecendo

-- 1. Verificar se a IA existe e tem todos os campos
SELECT 
  'PASSO 1: Verificar IA' as teste,
  id,
  name,
  provider,
  "apiKey" IS NOT NULL AND LENGTH("apiKey") > 50 as tem_apikey_valida,
  model,
  "maxTokens",
  temperature,
  "baseUrl",
  "isActive"
FROM "GlobalAiConnection"
WHERE "isActive" = true;

-- 2. Verificar se o usuário existe e pode acessar
SELECT 
  'PASSO 2: Verificar usuários SUPER_ADMIN' as teste,
  id,
  email,
  role
FROM "User"
WHERE role IN ('SUPER_ADMIN', 'ADMIN')
LIMIT 3;

-- 3. Testar a query EXATA que a Edge Function usa
SELECT 
  'PASSO 3: Query da Edge Function' as teste,
  *
FROM "GlobalAiConnection"
WHERE "isActive" = true
ORDER BY "createdAt" DESC
LIMIT 1;

-- 4. Verificar políticas RLS
SELECT 
  'PASSO 4: Políticas RLS' as teste,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'GlobalAiConnection';
