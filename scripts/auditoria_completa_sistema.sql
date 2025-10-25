-- =====================================================
-- AUDITORIA COMPLETA DO SISTEMA SYNCADS
-- Data: 25/10/2025
-- =====================================================

\echo '========================================';
\echo '1. ESTRUTURA DO BANCO DE DADOS';
\echo '========================================';

-- 1.1 Tabelas principais
SELECT 
  'TABELAS CRIADAS' as categoria,
  COUNT(*) as total
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- 1.2 Verificar tabelas críticas
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('User', 'Organization', 'GlobalAiConnection', 'OrganizationAiConnection', 'ChatConversation', 'ChatMessage') 
    THEN '✅ CRITICA'
    ELSE 'Normal'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
  AND table_name IN ('User', 'Organization', 'GlobalAiConnection', 'OrganizationAiConnection', 'ChatConversation', 'ChatMessage', 'Integration', 'Campaign')
ORDER BY table_name;

\echo '';
\echo '========================================';
\echo '2. USUÁRIOS E ORGANIZAÇÕES';
\echo '========================================';

-- 2.1 Total de usuários
SELECT 
  'Total de usuarios' as metrica,
  COUNT(*) as valor
FROM "User";

-- 2.2 Usuários por role
SELECT 
  COALESCE(role, 'NULL') as role,
  COUNT(*) as total
FROM "User"
GROUP BY role
ORDER BY total DESC;

-- 2.3 Usuários com/sem organização
SELECT 
  CASE 
    WHEN "organizationId" IS NULL THEN '❌ SEM ORG'
    ELSE '✅ COM ORG'
  END as status,
  COUNT(*) as total
FROM "User"
GROUP BY CASE WHEN "organizationId" IS NULL THEN '❌ SEM ORG' ELSE '✅ COM ORG' END;

-- 2.4 Detalhes dos usuários
SELECT 
  id,
  email,
  role,
  "organizationId",
  "isActive",
  "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;

\echo '';
\echo '========================================';
\echo '3. IAs GLOBAIS';
\echo '========================================';

-- 3.1 IAs cadastradas
SELECT 
  id,
  provider,
  model,
  "isActive",
  "systemPrompt" IS NOT NULL as tem_prompt,
  "createdAt"
FROM "GlobalAiConnection"
ORDER BY "createdAt" DESC;

-- 3.2 Status das IAs
SELECT 
  CASE WHEN "isActive" THEN '✅ ATIVA' ELSE '❌ INATIVA' END as status,
  COUNT(*) as total
FROM "GlobalAiConnection"
GROUP BY "isActive";

\echo '';
\echo '========================================';
\echo '4. CONEXÕES IA → ORGANIZAÇÃO';
\echo '========================================';

-- 4.1 Organizações existentes
SELECT 
  id,
  name,
  slug,
  plan,
  status,
  "createdAt"
FROM "Organization"
ORDER BY "createdAt" DESC;

-- 4.2 Conexões IA-Org
SELECT 
  oac.id,
  o.name as organizacao,
  gai.provider || '/' || gai.model as ia_configurada,
  oac."isDefault",
  gai."isActive"
FROM "OrganizationAiConnection" oac
LEFT JOIN "Organization" o ON oac."organizationId" = o.id
LEFT JOIN "GlobalAiConnection" gai ON oac."globalAiConnectionId" = gai.id
ORDER BY oac."createdAt" DESC;

-- 4.3 Organizações SEM IA
SELECT 
  o.id,
  o.name,
  '❌ SEM IA CONFIGURADA' as problema
FROM "Organization" o
WHERE NOT EXISTS (
  SELECT 1 FROM "OrganizationAiConnection" 
  WHERE "organizationId" = o.id
);

\echo '';
\echo '========================================';
\echo '5. CHAT - CONVERSAS E MENSAGENS';
\echo '========================================';

-- 5.1 Total de conversas
SELECT 
  'Total de conversas' as metrica,
  COUNT(*) as valor
FROM "ChatConversation";

-- 5.2 Total de mensagens
SELECT 
  'Total de mensagens' as metrica,
  COUNT(*) as valor
FROM "ChatMessage";

-- 5.3 Conversas recentes
SELECT 
  id,
  title,
  "userId",
  "organizationId",
  "createdAt",
  (SELECT COUNT(*) FROM "ChatMessage" WHERE "conversationId" = "ChatConversation".id) as total_mensagens
FROM "ChatConversation"
ORDER BY "createdAt" DESC
LIMIT 10;

\echo '';
\echo '========================================';
\echo '6. RLS POLICIES';
\echo '========================================';

-- 6.1 Total de policies
SELECT 
  'Total de RLS policies' as metrica,
  COUNT(*) as valor
FROM pg_policies 
WHERE schemaname = 'public';

-- 6.2 Policies críticas
SELECT 
  tablename,
  policyname,
  cmd,
  CASE WHEN qual IS NOT NULL THEN '✅' ELSE '❌' END as tem_condicao
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN ('User', 'Organization', 'GlobalAiConnection', 'OrganizationAiConnection', 'ChatConversation', 'ChatMessage')
ORDER BY tablename, policyname;

\echo '';
\echo '========================================';
\echo '7. INTEGRAÇÕES OAUTH';
\echo '========================================';

-- 7.1 Total de integrações
SELECT 
  'Total de integracoes' as metrica,
  COUNT(*) as valor
FROM "Integration";

-- 7.2 Integrações por plataforma
SELECT 
  platform,
  COUNT(*) as total,
  SUM(CASE WHEN "isConnected" THEN 1 ELSE 0 END) as conectadas
FROM "Integration"
GROUP BY platform
ORDER BY total DESC;

-- 7.3 Integrações ativas
SELECT 
  id,
  platform,
  "userId",
  "organizationId",
  "isConnected",
  "createdAt"
FROM "Integration"
WHERE "isConnected" = true
ORDER BY "createdAt" DESC
LIMIT 10;

\echo '';
\echo '========================================';
\echo '8. CAMPANHAS';
\echo '========================================';

-- 8.1 Total de campanhas
SELECT 
  'Total de campanhas' as metrica,
  COUNT(*) as valor
FROM "Campaign";

-- 8.2 Campanhas por plataforma
SELECT 
  platform,
  COUNT(*) as total
FROM "Campaign"
GROUP BY platform
ORDER BY total DESC;

-- 8.3 Campanhas recentes
SELECT 
  id,
  name,
  platform,
  status,
  "userId",
  "organizationId",
  "createdAt"
FROM "Campaign"
ORDER BY "createdAt" DESC
LIMIT 10;

\echo '';
\echo '========================================';
\echo '9. MIGRATIONS APLICADAS';
\echo '========================================';

-- 9.1 Verificar tabela de migrations
SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
ORDER BY executed_at DESC
LIMIT 20;

\echo '';
\echo '========================================';
\echo '10. DIAGNÓSTICO DE PROBLEMAS';
\echo '========================================';

-- 10.1 Usuários sem organização
SELECT 
  '❌ USUARIOS SEM ORGANIZACAO' as problema,
  COUNT(*) as total
FROM "User"
WHERE "organizationId" IS NULL;

-- 10.2 Organizações sem IA
SELECT 
  '❌ ORGANIZACOES SEM IA' as problema,
  COUNT(*) as total
FROM "Organization" o
WHERE NOT EXISTS (
  SELECT 1 FROM "OrganizationAiConnection" 
  WHERE "organizationId" = o.id
);

-- 10.3 IAs inativas
SELECT 
  '⚠️ IAS INATIVAS' as problema,
  COUNT(*) as total
FROM "GlobalAiConnection"
WHERE "isActive" = false;

-- 10.4 Conversas sem mensagens
SELECT 
  '⚠️ CONVERSAS VAZIAS' as problema,
  COUNT(*) as total
FROM "ChatConversation" cc
WHERE NOT EXISTS (
  SELECT 1 FROM "ChatMessage" 
  WHERE "conversationId" = cc.id
);

\echo '';
\echo '========================================';
\echo 'RESUMO EXECUTIVO';
\echo '========================================';

SELECT 
  'USUARIOS' as entidade,
  (SELECT COUNT(*) FROM "User") as total,
  (SELECT COUNT(*) FROM "User" WHERE "organizationId" IS NOT NULL) as ok,
  (SELECT COUNT(*) FROM "User" WHERE "organizationId" IS NULL) as problemas
UNION ALL
SELECT 
  'ORGANIZACOES' as entidade,
  (SELECT COUNT(*) FROM "Organization") as total,
  (SELECT COUNT(DISTINCT o.id) FROM "Organization" o 
   INNER JOIN "OrganizationAiConnection" oac ON oac."organizationId" = o.id) as ok,
  (SELECT COUNT(*) FROM "Organization" o 
   WHERE NOT EXISTS (SELECT 1 FROM "OrganizationAiConnection" WHERE "organizationId" = o.id)) as problemas
UNION ALL
SELECT 
  'IAS GLOBAIS' as entidade,
  (SELECT COUNT(*) FROM "GlobalAiConnection") as total,
  (SELECT COUNT(*) FROM "GlobalAiConnection" WHERE "isActive" = true) as ok,
  (SELECT COUNT(*) FROM "GlobalAiConnection" WHERE "isActive" = false) as problemas
UNION ALL
SELECT 
  'CONVERSAS' as entidade,
  (SELECT COUNT(*) FROM "ChatConversation") as total,
  (SELECT COUNT(DISTINCT cc.id) FROM "ChatConversation" cc 
   INNER JOIN "ChatMessage" cm ON cm."conversationId" = cc.id) as ok,
  (SELECT COUNT(*) FROM "ChatConversation" cc 
   WHERE NOT EXISTS (SELECT 1 FROM "ChatMessage" WHERE "conversationId" = cc.id)) as problemas
UNION ALL
SELECT 
  'INTEGRACOES' as entidade,
  (SELECT COUNT(*) FROM "Integration") as total,
  (SELECT COUNT(*) FROM "Integration" WHERE "isConnected" = true) as ok,
  (SELECT COUNT(*) FROM "Integration" WHERE "isConnected" = false) as problemas;

\echo '';
\echo '========================================';
\echo 'AUDITORIA CONCLUIDA';
\echo '========================================';
