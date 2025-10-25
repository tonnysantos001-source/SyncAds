-- =====================================================
-- SCRIPT: Verificação de Saúde do Banco de Dados
-- Data: 25/10/2025
-- Uso: Executar para verificar status atual
-- =====================================================

\echo '=========================================='
\echo '🔍 VERIFICAÇÃO DE SAÚDE - SYNCADS DATABASE'
\echo '=========================================='
\echo ''

-- =====================================================
-- 1. TABELAS
-- =====================================================
\echo '📊 1. ESTATÍSTICAS DE TABELAS'
\echo '------------------------------------------'

SELECT 
  schemaname,
  COUNT(*) as total_tables,
  SUM(CASE WHEN relpages > 0 THEN 1 ELSE 0 END) as tables_with_data
FROM pg_tables t
JOIN pg_class c ON t.tablename = c.relname
WHERE schemaname = 'public'
GROUP BY schemaname;

\echo ''
\echo '📋 Tabelas principais:'
SELECT 
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('Organization', 'User', 'Campaign', 'Product', 'ChatMessage', 'MediaGeneration')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =====================================================
-- 2. RLS POLICIES
-- =====================================================
\echo ''
\echo '🔒 2. ROW LEVEL SECURITY'
\echo '------------------------------------------'

SELECT 
  COUNT(*) as total_policies,
  COUNT(DISTINCT tablename) as tables_with_rls
FROM pg_policies
WHERE schemaname = 'public';

\echo ''
\echo '⚠️  Tabelas sem RLS habilitado:'
SELECT 
  t.tablename
FROM pg_tables t
LEFT JOIN pg_class c ON t.tablename = c.relname
WHERE t.schemaname = 'public'
  AND NOT c.relrowsecurity
  AND t.tablename NOT LIKE 'pg_%'
  AND t.tablename NOT LIKE 'sql_%'
LIMIT 10;

\echo ''
\echo '⚠️  Policies duplicadas (mesmo nome/tabela):'
SELECT 
  tablename,
  policyname,
  COUNT(*) as count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename, policyname
HAVING COUNT(*) > 1;

-- =====================================================
-- 3. ÍNDICES
-- =====================================================
\echo ''
\echo '📈 3. ÍNDICES'
\echo '------------------------------------------'

SELECT 
  COUNT(*) as total_indexes
FROM pg_indexes
WHERE schemaname = 'public';

\echo ''
\echo '⚠️  Foreign keys sem índice:'
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = tc.table_name
      AND indexdef LIKE '%' || kcu.column_name || '%'
  )
LIMIT 10;

-- =====================================================
-- 4. FUNCTIONS
-- =====================================================
\echo ''
\echo '⚙️  4. FUNCTIONS'
\echo '------------------------------------------'

SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'is_super_admin', 'is_service_role', 'update_updated_at_column',
    'check_and_use_quota', 'encrypt_api_key', 'decrypt_api_key'
  )
ORDER BY routine_name;

\echo ''
\echo '⚠️  Functions SECURITY DEFINER sem search_path:'
SELECT 
  p.proname as function_name,
  CASE 
    WHEN p.proconfig IS NULL THEN '❌ SEM SEARCH_PATH'
    ELSE '✅ OK'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prosecdef = true  -- SECURITY DEFINER
  AND p.proname IN (
    'is_super_admin', 'is_service_role', 'update_updated_at_column',
    'check_and_use_quota', 'encrypt_api_key', 'decrypt_api_key'
  );

-- =====================================================
-- 5. TRIGGERS
-- =====================================================
\echo ''
\echo '🔔 5. TRIGGERS'
\echo '------------------------------------------'

SELECT 
  COUNT(*) as total_triggers
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal;

\echo ''
\echo '⚠️  Tabelas com updatedAt sem trigger:'
SELECT 
  c.column_name as column_name,
  t.table_name
FROM information_schema.columns c
JOIN information_schema.tables t ON c.table_name = t.table_name
WHERE c.column_name = 'updatedAt'
  AND t.table_schema = 'public'
  AND NOT EXISTS (
    SELECT 1 FROM pg_trigger tr
    JOIN pg_class cls ON tr.tgrelid = cls.oid
    WHERE cls.relname = t.table_name
      AND tr.tgname LIKE '%updated_at%'
  )
LIMIT 10;

-- =====================================================
-- 6. DADOS
-- =====================================================
\echo ''
\echo '💾 6. DADOS'
\echo '------------------------------------------'

\echo 'Contagem de registros principais:'
SELECT 'Organizations' as tabela, COUNT(*) as registros FROM "Organization"
UNION ALL
SELECT 'Users', COUNT(*) FROM "User"
UNION ALL
SELECT 'Campaigns', COUNT(*) FROM "Campaign"
UNION ALL
SELECT 'Products', COUNT(*) FROM "Product"
UNION ALL
SELECT 'Customers', COUNT(*) FROM "Customer"
UNION ALL
SELECT 'Orders', COUNT(*) FROM "Order"
UNION ALL
SELECT 'ChatConversations', COUNT(*) FROM "ChatConversation"
UNION ALL
SELECT 'ChatMessages', COUNT(*) FROM "ChatMessage"
UNION ALL
SELECT 'MediaGenerations', COUNT(*) FROM "MediaGeneration"
UNION ALL
SELECT 'Gateways', COUNT(*) FROM "Gateway"
ORDER BY registros DESC;

-- =====================================================
-- 7. QUOTAS
-- =====================================================
\echo ''
\echo '📊 7. QUOTAS (se tabela existir)'
\echo '------------------------------------------'

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Organization' 
    AND column_name = 'aiMessagesQuota'
  ) THEN
    RAISE NOTICE 'Quotas de IA por organização:';
    PERFORM * FROM (
      SELECT 
        name,
        plan,
        "aiMessagesUsed" || '/' || "aiMessagesQuota" as messages,
        "aiImagesUsed" || '/' || "aiImagesQuota" as images,
        "aiVideosUsed" || '/' || "aiVideosQuota" as videos
      FROM "Organization"
    ) q;
  ELSE
    RAISE NOTICE '⚠️  Colunas de quota não encontradas';
  END IF;
END $$;

-- =====================================================
-- 8. SCHEMA CHECKS
-- =====================================================
\echo ''
\echo '🔍 8. VERIFICAÇÕES DE SCHEMA'
\echo '------------------------------------------'

\echo 'Verificando colunas críticas:'
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'GlobalAiConnection' AND column_name = 'systemPrompt'
    ) THEN '✅'
    ELSE '❌'
  END || ' GlobalAiConnection.systemPrompt' as check
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'isActive'
    ) THEN '✅'
    ELSE '❌'
  END || ' Product.isActive'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Product' AND column_name = 'status'
    ) THEN '✅'
    ELSE '❌'
  END || ' Product.status'
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'is_service_role'
    ) THEN '✅'
    ELSE '❌'
  END || ' Function is_service_role()';

-- =====================================================
-- 9. STORAGE
-- =====================================================
\echo ''
\echo '📦 9. STORAGE BUCKETS'
\echo '------------------------------------------'

SELECT 
  id,
  name,
  CASE WHEN public THEN '✅ Public' ELSE '🔒 Private' END as access
FROM storage.buckets
ORDER BY name;

-- =====================================================
-- 10. MIGRATIONS APLICADAS
-- =====================================================
\echo ''
\echo '📜 10. MIGRATIONS'
\echo '------------------------------------------'

SELECT 
  COUNT(*) as migrations_aplicadas
FROM supabase_migrations.schema_migrations;

\echo ''
\echo 'Últimas 5 migrations:'
SELECT 
  version,
  name,
  executed_at
FROM supabase_migrations.schema_migrations
ORDER BY executed_at DESC
LIMIT 5;

-- =====================================================
-- RESUMO FINAL
-- =====================================================
\echo ''
\echo '=========================================='
\echo '✅ VERIFICAÇÃO COMPLETA'
\echo '=========================================='
\echo ''
\echo 'Próximos passos:'
\echo '1. Revisar warnings acima'
\echo '2. Aplicar migration 20251025000000_fix_critical_issues_complete.sql'
\echo '3. Executar este script novamente para confirmar correções'
\echo ''
