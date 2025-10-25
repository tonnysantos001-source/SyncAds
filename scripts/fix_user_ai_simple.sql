-- =====================================================
-- SOLUÇÃO SIMPLES: Atribuir IA para TODOS os usuários
-- SEM conceito de organizações
-- =====================================================

-- PASSO 1: Ver IAs globais ativas
SELECT 
  id,
  provider,
  model,
  "isActive",
  "createdAt"
FROM "GlobalAiConnection"
WHERE "isActive" = true
ORDER BY "createdAt" DESC;

-- PASSO 2: Ver todos os usuários
SELECT 
  id,
  email,
  "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;

-- PASSO 3: SOLUÇÃO - Garantir que existe UMA organização global
DO $$
DECLARE
  global_org_id UUID := '62f38421-3ea6-44c4-a5e0-d6437a627ab5'; -- ID fixo da org global
  global_ai_id UUID;
BEGIN
  -- Garantir que organização global existe
  INSERT INTO "Organization" (
    id, name, plan, status, "createdAt", "updatedAt"
  ) VALUES (
    global_org_id, 'SyncAds Global', 'ENTERPRISE', 'ACTIVE', NOW(), NOW()
  ) ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Organizacao global garantida: %', global_org_id;

  -- Buscar IA global ativa
  SELECT id INTO global_ai_id
  FROM "GlobalAiConnection"
  WHERE "isActive" = true
  LIMIT 1;

  IF global_ai_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma IA ativa! Configure no painel Super Admin primeiro.';
  END IF;

  RAISE NOTICE 'IA Global encontrada: %', global_ai_id;

  -- Atribuir IA para a organização global
  INSERT INTO "OrganizationAiConnection" (
    id,
    "organizationId",
    "globalAiConnectionId",
    "isDefault",
    "createdAt",
    "updatedAt"
  ) VALUES (
    gen_random_uuid(),
    global_org_id,
    global_ai_id,
    true,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE 'IA atribuida para organizacao global!';

  -- Atualizar TODOS usuários para usar organização global
  UPDATE "User"
  SET "organizationId" = global_org_id
  WHERE "organizationId" IS NULL OR "organizationId" != global_org_id;

  RAISE NOTICE 'Todos usuarios vinculados a organizacao global!';

  RAISE NOTICE '========================================';
  RAISE NOTICE 'CONFIGURACAO CONCLUIDA COM SUCESSO!';
  RAISE NOTICE '========================================';
END $$;

-- PASSO 4: Verificar resultado
SELECT 
  'Total de usuarios' as info,
  COUNT(*) as valor
FROM "User"
UNION ALL
SELECT 
  'Usuarios com org global' as info,
  COUNT(*) as valor
FROM "User"
WHERE "organizationId" = '62f38421-3ea6-44c4-a5e0-d6437a627ab5'
UNION ALL
SELECT 
  'IAs ativas' as info,
  COUNT(*) as valor
FROM "GlobalAiConnection"
WHERE "isActive" = true
UNION ALL
SELECT 
  'Conexoes IA-Org' as info,
  COUNT(*) as valor
FROM "OrganizationAiConnection"
WHERE "organizationId" = '62f38421-3ea6-44c4-a5e0-d6437a627ab5';
