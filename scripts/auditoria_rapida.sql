-- =====================================================
-- AUDITORIA RÁPIDA - EXECUTE NO SUPABASE SQL EDITOR
-- =====================================================

-- 1. RESUMO GERAL DO SISTEMA
SELECT 
  'RESUMO GERAL' as secao,
  'Usuarios' as item,
  COUNT(*)::text as valor
FROM "User"
UNION ALL
SELECT 'RESUMO GERAL', 'Organizacoes', COUNT(*)::text FROM "Organization"
UNION ALL
SELECT 'RESUMO GERAL', 'IAs Globais', COUNT(*)::text FROM "GlobalAiConnection"
UNION ALL
SELECT 'RESUMO GERAL', 'IAs Ativas', COUNT(*)::text FROM "GlobalAiConnection" WHERE "isActive" = true
UNION ALL
SELECT 'RESUMO GERAL', 'Conversas', COUNT(*)::text FROM "ChatConversation"
UNION ALL
SELECT 'RESUMO GERAL', 'Mensagens', COUNT(*)::text FROM "ChatMessage"
UNION ALL
SELECT 'RESUMO GERAL', 'Campanhas', COUNT(*)::text FROM "Campaign"
UNION ALL
SELECT 'RESUMO GERAL', 'Integracoes', COUNT(*)::text FROM "Integration";

-- 2. PROBLEMAS CRÍTICOS
SELECT 
  'PROBLEMAS' as secao,
  'Usuarios sem org' as problema,
  COUNT(*)::text as total
FROM "User" WHERE "organizationId" IS NULL
UNION ALL
SELECT 'PROBLEMAS', 'Orgs sem IA', COUNT(*)::text
FROM "Organization" o
WHERE NOT EXISTS (SELECT 1 FROM "OrganizationAiConnection" WHERE "organizationId" = o.id)
UNION ALL
SELECT 'PROBLEMAS', 'IAs inativas', COUNT(*)::text
FROM "GlobalAiConnection" WHERE "isActive" = false;

-- 3. DETALHES DAS IAs
SELECT 
  'IAS GLOBAIS' as secao,
  id::text,
  provider,
  model,
  CASE WHEN "isActive" THEN 'ATIVA' ELSE 'INATIVA' END as status,
  CASE WHEN "systemPrompt" IS NOT NULL THEN 'SIM' ELSE 'NAO' END as tem_prompt
FROM "GlobalAiConnection"
ORDER BY "createdAt" DESC;

-- 4. CONEXÕES IA-ORGANIZAÇÃO
SELECT 
  'CONEXOES IA-ORG' as secao,
  o.name as organizacao,
  gai.provider || '/' || gai.model as ia,
  CASE WHEN oac."isDefault" THEN 'PADRAO' ELSE 'SECUNDARIA' END as tipo,
  CASE WHEN gai."isActive" THEN 'ATIVA' ELSE 'INATIVA' END as status
FROM "OrganizationAiConnection" oac
LEFT JOIN "Organization" o ON oac."organizationId" = o.id
LEFT JOIN "GlobalAiConnection" gai ON oac."globalAiConnectionId" = gai.id
ORDER BY o.name;

-- 5. USUÁRIOS E SUAS ORGANIZAÇÕES
SELECT 
  'USUARIOS' as secao,
  u.email,
  u.role,
  o.name as organizacao,
  CASE WHEN u."isActive" THEN 'ATIVO' ELSE 'INATIVO' END as status
FROM "User" u
LEFT JOIN "Organization" o ON u."organizationId" = o.id
ORDER BY u."createdAt" DESC
LIMIT 20;

-- 6. ESTRUTURA DAS TABELAS CRÍTICAS
SELECT 
  'COLUNAS' as secao,
  table_name,
  column_name,
  data_type,
  CASE WHEN is_nullable = 'NO' THEN 'OBRIGATORIO' ELSE 'OPCIONAL' END as obrigatorio
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('OrganizationAiConnection', 'Organization', 'User', 'GlobalAiConnection')
ORDER BY table_name, ordinal_position;
