-- =====================================================
-- SCRIPT: Corrigir Conexão de IA para Usuários
-- Problema: Usuários não conseguem usar chat (IA não configurada)
-- =====================================================

-- PASSO 1: Verificar usuários e suas organizações
SELECT 
  u.id as user_id,
  u.email,
  u.organizationId,
  u.role,
  o.name as org_name
FROM "User" u
LEFT JOIN "Organization" o ON u.organizationId = o.id
WHERE u.role != 'SUPER_ADMIN' OR u.role IS NULL
ORDER BY u.email;

-- PASSO 2: Verificar IAs globais ativas
SELECT 
  id,
  provider,
  model,
  isActive,
  "createdAt"
FROM "GlobalAiConnection"
WHERE isActive = true
ORDER BY "createdAt" DESC;

-- PASSO 3: Verificar conexões IA-Organização existentes
SELECT 
  oac.id,
  oac.organizationId,
  oac.globalAiConnectionId,
  oac.isDefault,
  o.name as org_name,
  gai.provider,
  gai.model
FROM "OrganizationAiConnection" oac
LEFT JOIN "Organization" o ON oac.organizationId = o.id
LEFT JOIN "GlobalAiConnection" gai ON oac.globalAiConnectionId = gai.id
ORDER BY oac."createdAt" DESC;

-- PASSO 4: SOLUÇÃO - Criar conexão IA para TODAS organizações que não têm
-- (Execute DEPOIS de verificar os dados acima)

DO $$
DECLARE
  global_ai_id UUID;
  org_record RECORD;
BEGIN
  -- Buscar primeira IA global ativa
  SELECT id INTO global_ai_id
  FROM "GlobalAiConnection"
  WHERE isActive = true
  LIMIT 1;

  IF global_ai_id IS NULL THEN
    RAISE EXCEPTION 'Nenhuma IA global ativa encontrada. Configure uma IA primeiro.';
  END IF;

  RAISE NOTICE 'IA Global encontrada: %', global_ai_id;

  -- Para cada organização SEM conexão de IA
  FOR org_record IN 
    SELECT o.id, o.name
    FROM "Organization" o
    WHERE NOT EXISTS (
      SELECT 1 FROM "OrganizationAiConnection"
      WHERE organizationId = o.id
    )
  LOOP
    -- Criar conexão
    INSERT INTO "OrganizationAiConnection" (
      id,
      organizationId,
      globalAiConnectionId,
      isDefault,
      "createdAt",
      "updatedAt"
    ) VALUES (
      gen_random_uuid(),
      org_record.id,
      global_ai_id,
      true,
      NOW(),
      NOW()
    );

    RAISE NOTICE 'Conexão criada para organização: % (ID: %)', org_record.name, org_record.id;
  END LOOP;

  -- Garantir que pelo menos UMA conexão por org seja isDefault=true
  UPDATE "OrganizationAiConnection" oac1
  SET isDefault = true
  WHERE id IN (
    SELECT DISTINCT ON (organizationId) id
    FROM "OrganizationAiConnection"
    WHERE organizationId IN (
      SELECT organizationId 
      FROM "OrganizationAiConnection"
      GROUP BY organizationId
      HAVING SUM(CASE WHEN isDefault THEN 1 ELSE 0 END) = 0
    )
    ORDER BY organizationId, "createdAt" ASC
  );

  RAISE NOTICE '========================================';
  RAISE NOTICE 'Conexoes de IA criadas com sucesso!';
  RAISE NOTICE '========================================';
END $$;

-- PASSO 5: Verificar resultado final
SELECT 
  o.name as organizacao,
  o.id as org_id,
  COUNT(u.id) as total_usuarios,
  gai.provider || '/' || gai.model as ia_configurada,
  oac.isDefault as ia_padrao
FROM "Organization" o
LEFT JOIN "User" u ON u.organizationId = o.id
LEFT JOIN "OrganizationAiConnection" oac ON oac.organizationId = o.id
LEFT JOIN "GlobalAiConnection" gai ON gai.id = oac.globalAiConnectionId
GROUP BY o.id, o.name, gai.provider, gai.model, oac.isDefault
ORDER BY o.name;

-- PASSO 6: Contar usuários sem IA (deve ser 0 após correção)
SELECT COUNT(*) as usuarios_sem_ia
FROM "User" u
WHERE u.organizationId IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "OrganizationAiConnection" oac
    WHERE oac.organizationId = u.organizationId
    AND oac.isDefault = true
  );
