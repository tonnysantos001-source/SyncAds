-- =====================================================
-- CONFIGURAÇÕES DE SEGURANÇA SUPABASE
-- Data: 25/10/2025
-- Prioridade: MÉDIA (Segurança)
-- =====================================================

-- =====================================================
-- 1. VERIFICAR CONFIGURAÇÕES ATUAIS
-- =====================================================

-- Verificar se RLS está habilitado em todas as tabelas
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'User', 'Organization', 'GlobalAiConnection', 'OrganizationAiConnection',
    'Campaign', 'ChatConversation', 'ChatMessage', 'Integration',
    'Subscription', 'UsageTracking', 'AiUsage', 'RefreshToken'
  )
ORDER BY tablename;

-- =====================================================
-- 2. VERIFICAR POLICIES ATIVAS
-- =====================================================

-- Contar policies por tabela
SELECT 
  tablename,
  cmd,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename IN (
    'User', 'Organization', 'GlobalAiConnection', 'OrganizationAiConnection',
    'Campaign', 'ChatConversation', 'ChatMessage', 'Integration',
    'Subscription', 'UsageTracking', 'AiUsage', 'RefreshToken'
  )
GROUP BY tablename, cmd
ORDER BY tablename, cmd;

-- =====================================================
-- 3. VERIFICAR FUNCTIONS DE SEGURANÇA
-- =====================================================

-- Verificar se functions críticas existem e têm search_path
SELECT 
  proname as function_name,
  CASE 
    WHEN proconfig IS NULL THEN '❌ SEM SEARCH_PATH'
    WHEN 'search_path' = ANY(proconfig) THEN '✅ COM SEARCH_PATH'
    ELSE '⚠️ CONFIGURAÇÃO INESPERADA'
  END as security_status,
  proconfig
FROM pg_proc 
WHERE proname IN (
  'is_super_admin', 
  'encrypt_api_key', 
  'decrypt_api_key', 
  'expire_old_invites',
  'is_service_role'
)
ORDER BY proname;

-- =====================================================
-- 4. VERIFICAR ÍNDICES DE PERFORMANCE
-- =====================================================

-- Verificar se índices críticos foram criados
SELECT 
  indexname,
  tablename,
  indexdef
FROM pg_indexes 
WHERE tablename IN (
  'Campaign', 'CartItem', 'Lead', 'Order', 'OrderItem', 'PendingInvite',
  'ChatMessage', 'Product'
)
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- 5. VERIFICAR TRIGGERS UPDATED_AT
-- =====================================================

-- Verificar triggers de updated_at
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers 
WHERE trigger_name LIKE '%updated_at%'
  AND event_object_schema = 'public'
ORDER BY event_object_table;

-- =====================================================
-- 6. VERIFICAR CONSTRAINTS CHECK
-- =====================================================

-- Verificar constraints CHECK
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('Organization', 'Campaign', 'Product')
ORDER BY tc.table_name, tc.constraint_name;

-- =====================================================
-- 7. VERIFICAR STORAGE BUCKETS
-- =====================================================

-- Verificar buckets de storage
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id IN ('media-generations', 'avatars', 'documents')
ORDER BY created_at;

-- =====================================================
-- 8. RESUMO DE SEGURANÇA
-- =====================================================

-- Resumo geral do status de segurança
SELECT 
  'RLS_HABILITADO' as categoria,
  COUNT(*) as total_tabelas,
  SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as com_rls
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'User', 'Organization', 'GlobalAiConnection', 'OrganizationAiConnection',
    'Campaign', 'ChatConversation', 'ChatMessage', 'Integration',
    'Subscription', 'UsageTracking', 'AiUsage', 'RefreshToken'
  )

UNION ALL

SELECT 
  'POLICIES_ATIVAS' as categoria,
  COUNT(*) as total_policies,
  COUNT(DISTINCT tablename) as tabelas_com_policies
FROM pg_policies 
WHERE schemaname = 'public'

UNION ALL

SELECT 
  'FUNCTIONS_SEGURAS' as categoria,
  COUNT(*) as total_functions,
  SUM(CASE WHEN proconfig IS NOT NULL THEN 1 ELSE 0 END) as com_search_path
FROM pg_proc 
WHERE proname IN (
  'is_super_admin', 'encrypt_api_key', 'decrypt_api_key', 
  'expire_old_invites', 'is_service_role'
)

UNION ALL

SELECT 
  'INDICES_PERFORMANCE' as categoria,
  COUNT(*) as total_indices,
  COUNT(DISTINCT tablename) as tabelas_com_indices
FROM pg_indexes 
WHERE tablename IN (
  'Campaign', 'CartItem', 'Lead', 'Order', 'OrderItem', 'PendingInvite',
  'ChatMessage', 'Product'
)
AND indexname LIKE 'idx_%';

-- =====================================================
-- VERIFICAÇÃO DE SEGURANÇA CONCLUÍDA!
-- =====================================================
