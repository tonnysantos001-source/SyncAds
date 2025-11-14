-- =====================================================
-- VALIDAÇÃO DE FLUXOS CRÍTICOS - SYNCADS
-- Data: 02/02/2025
-- Objetivo: Validar sistema antes de ir para produção
-- =====================================================

\echo '================================================'
\echo '🔍 INICIANDO VALIDAÇÃO DE FLUXOS CRÍTICOS'
\echo '================================================'
\echo ''

-- =====================================================
-- PARTE 1: VALIDAR AUTENTICAÇÃO E USUÁRIOS
-- =====================================================

\echo '📊 PARTE 1: AUTENTICAÇÃO E USUÁRIOS'
\echo '================================================'

-- 1.1 Verificar usuários ativos
DO $$
DECLARE
    v_total_users INTEGER;
    v_active_users INTEGER;
    v_super_admins INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total_users FROM "User";
    SELECT COUNT(*) INTO v_active_users FROM "User" WHERE "isActive" = true;
    SELECT COUNT(*) INTO v_super_admins FROM "User" WHERE "isSuperAdmin" = true;

    RAISE NOTICE '';
    RAISE NOTICE '👥 Estatísticas de Usuários:';
    RAISE NOTICE '   Total de usuários: %', v_total_users;
    RAISE NOTICE '   Usuários ativos: %', v_active_users;
    RAISE NOTICE '   Super admins: %', v_super_admins;

    IF v_total_users = 0 THEN
        RAISE WARNING '⚠️  Nenhum usuário cadastrado no sistema!';
    ELSIF v_active_users = 0 THEN
        RAISE WARNING '⚠️  Nenhum usuário ativo no sistema!';
    ELSE
        RAISE NOTICE '   ✅ Sistema tem usuários ativos';
    END IF;
END $$;

-- 1.2 Verificar função is_super_admin
DO $$
DECLARE
    v_exists BOOLEAN;
    v_has_search_path BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_proc WHERE proname = 'is_super_admin'
    ) INTO v_exists;

    IF v_exists THEN
        RAISE NOTICE '   ✅ Função is_super_admin() existe';

        -- Verificar se tem search_path configurado
        SELECT EXISTS (
            SELECT 1 FROM pg_proc
            WHERE proname = 'is_super_admin'
            AND proconfig IS NOT NULL
        ) INTO v_has_search_path;

        IF v_has_search_path THEN
            RAISE NOTICE '   ✅ Função tem search_path configurado (seguro)';
        ELSE
            RAISE WARNING '   ⚠️  Função sem search_path (risco de segurança)';
        END IF;
    ELSE
        RAISE WARNING '   ⚠️  Função is_super_admin() NÃO existe!';
    END IF;
END $$;

-- 1.3 Verificar RLS nas tabelas críticas
DO $$
DECLARE
    v_table_name TEXT;
    v_rls_enabled BOOLEAN;
    v_policies_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 RLS (Row Level Security):';

    FOR v_table_name IN
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN ('User', 'Order', 'Product', 'Integration', 'GlobalAiConnection', 'UTMTracking')
    LOOP
        SELECT relrowsecurity INTO v_rls_enabled
        FROM pg_class
        WHERE relname = v_table_name;

        SELECT COUNT(*) INTO v_policies_count
        FROM pg_policies
        WHERE tablename = v_table_name;

        IF v_rls_enabled THEN
            RAISE NOTICE '   ✅ % - RLS ativo (% políticas)', v_table_name, v_policies_count;
        ELSE
            RAISE WARNING '   ⚠️  % - RLS INATIVO!', v_table_name;
        END IF;
    END LOOP;
END $$;

\echo ''

-- =====================================================
-- PARTE 2: VALIDAR PEDIDOS E PRODUTOS
-- =====================================================

\echo '📦 PARTE 2: PEDIDOS E PRODUTOS'
\echo '================================================'

DO $$
DECLARE
    v_total_orders INTEGER;
    v_completed_orders INTEGER;
    v_total_products INTEGER;
    v_total_revenue NUMERIC;
BEGIN
    SELECT COUNT(*) INTO v_total_orders FROM "Order";
    SELECT COUNT(*) INTO v_completed_orders FROM "Order" WHERE status = 'completed';
    SELECT COUNT(*) INTO v_total_products FROM "Product";
    SELECT COALESCE(SUM("totalAmount"), 0) INTO v_total_revenue
    FROM "Order" WHERE status = 'completed';

    RAISE NOTICE '';
    RAISE NOTICE '📊 Estatísticas de Pedidos:';
    RAISE NOTICE '   Total de pedidos: %', v_total_orders;
    RAISE NOTICE '   Pedidos completos: %', v_completed_orders;
    RAISE NOTICE '   Total de produtos: %', v_total_products;
    RAISE NOTICE '   Receita total: R$ %', v_total_revenue;

    IF v_total_orders > 0 THEN
        RAISE NOTICE '   ✅ Sistema com pedidos registrados';
    ELSE
        RAISE NOTICE '   ℹ️  Nenhum pedido registrado (sistema novo)';
    END IF;
END $$;

-- Verificar views de analytics
DO $$
DECLARE
    v_views TEXT[] := ARRAY[
        'ProductPerformance',
        'CheckoutDashboard',
        'CartRecoveryAnalytics',
        'CustomerAnalytics'
    ];
    v_view_name TEXT;
    v_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📈 Views de Analytics:';

    FOREACH v_view_name IN ARRAY v_views
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM pg_views WHERE viewname = v_view_name
        ) INTO v_exists;

        IF v_exists THEN
            RAISE NOTICE '   ✅ % existe', v_view_name;
        ELSE
            RAISE WARNING '   ⚠️  % NÃO existe', v_view_name;
        END IF;
    END LOOP;
END $$;

\echo ''

-- =====================================================
-- PARTE 3: VALIDAR IA E CHAT
-- =====================================================

\echo '🤖 PARTE 3: IA E CHAT'
\echo '================================================'

DO $$
DECLARE
    v_ai_connections INTEGER;
    v_active_ai INTEGER;
    v_chat_logs INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_ai_connections FROM "GlobalAiConnection";
    SELECT COUNT(*) INTO v_active_ai FROM "GlobalAiConnection" WHERE "isActive" = true;
    SELECT COUNT(*) INTO v_chat_logs
    FROM "ChatLog"
    WHERE "createdAt" > NOW() - INTERVAL '7 days';

    RAISE NOTICE '';
    RAISE NOTICE '🤖 Estatísticas de IA:';
    RAISE NOTICE '   Conexões IA configuradas: %', v_ai_connections;
    RAISE NOTICE '   Conexões ativas: %', v_active_ai;
    RAISE NOTICE '   Logs de chat (7 dias): %', v_chat_logs;

    IF v_active_ai = 0 THEN
        RAISE WARNING '   ⚠️  Nenhuma conexão IA ativa!';
    ELSE
        RAISE NOTICE '   ✅ Sistema com IA configurada';
    END IF;
END $$;

-- Verificar se a tabela de prompts existe
DO $$
DECLARE
    v_exists BOOLEAN;
    v_prompts_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_tables WHERE tablename = 'PromptTemplate'
    ) INTO v_exists;

    IF v_exists THEN
        SELECT COUNT(*) INTO v_prompts_count FROM "PromptTemplate";
        RAISE NOTICE '   ✅ PromptTemplate existe (% templates)', v_prompts_count;
    ELSE
        RAISE NOTICE '   ℹ️  PromptTemplate não existe (opcional)';
    END IF;
END $$;

\echo ''

-- =====================================================
-- PARTE 4: VALIDAR UTM E TRACKING
-- =====================================================

\echo '📍 PARTE 4: UTM E TRACKING'
\echo '================================================'

DO $$
DECLARE
    v_utm_count INTEGER;
    v_conversions INTEGER;
    v_utm_view_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO v_utm_count FROM "UTMTracking";
    SELECT COUNT(*) INTO v_conversions FROM "UTMTracking" WHERE converted = true;

    SELECT EXISTS (
        SELECT 1 FROM pg_views WHERE viewname = 'UTMAnalytics'
    ) INTO v_utm_view_exists;

    RAISE NOTICE '';
    RAISE NOTICE '📍 Estatísticas UTM:';
    RAISE NOTICE '   Total de rastreamentos: %', v_utm_count;
    RAISE NOTICE '   Conversões: %', v_conversions;

    IF v_utm_view_exists THEN
        RAISE NOTICE '   ✅ View UTMAnalytics existe';
    ELSE
        RAISE WARNING '   ⚠️  View UTMAnalytics NÃO existe';
    END IF;

    IF v_utm_count > 0 THEN
        RAISE NOTICE '   ✅ Sistema com tracking UTM ativo';
    ELSE
        RAISE NOTICE '   ℹ️  Nenhum rastreamento UTM (sistema novo)';
    END IF;
END $$;

\echo ''

-- =====================================================
-- PARTE 5: VALIDAR ÍNDICES DE PERFORMANCE
-- =====================================================

\echo '⚡ PARTE 5: ÍNDICES DE PERFORMANCE'
\echo '================================================'

DO $$
DECLARE
    v_indices_count INTEGER;
    v_missing_indices TEXT[] := ARRAY[]::TEXT[];
    v_index_name TEXT;
BEGIN
    -- Verificar índices importantes
    SELECT COUNT(*) INTO v_indices_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('Order', 'Product', 'Integration', 'UTMTracking');

    RAISE NOTICE '';
    RAISE NOTICE '⚡ Índices:';
    RAISE NOTICE '   Total de índices: %', v_indices_count;

    -- Verificar índices específicos importantes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname LIKE '%Order_userId%') THEN
        v_missing_indices := array_append(v_missing_indices, 'Order.userId');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname LIKE '%Product_userId%') THEN
        v_missing_indices := array_append(v_missing_indices, 'Product.userId');
    END IF;

    IF array_length(v_missing_indices, 1) > 0 THEN
        RAISE WARNING '   ⚠️  Índices faltando: %', array_to_string(v_missing_indices, ', ');
    ELSE
        RAISE NOTICE '   ✅ Índices principais presentes';
    END IF;
END $$;

\echo ''

-- =====================================================
-- PARTE 6: VALIDAR VIEWS DE SEGURANÇA
-- =====================================================

\echo '🔒 PARTE 6: VIEWS DE SEGURANÇA (SECURITY DEFINER)'
\echo '================================================'

DO $$
DECLARE
    v_critical_views TEXT[] := ARRAY[
        'ActiveDiscountCodes',
        'v_active_users',
        'v_super_admins',
        'ProductPerformance',
        'CheckoutDashboard',
        'CartRecoveryAnalytics',
        'CustomerAnalytics',
        'UTMAnalytics',
        'checkout_trial_dashboard'
    ];
    v_view_name TEXT;
    v_exists BOOLEAN;
    v_missing INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Views Críticas (9 esperadas):';

    FOREACH v_view_name IN ARRAY v_critical_views
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM pg_views WHERE viewname = v_view_name
        ) INTO v_exists;

        IF v_exists THEN
            RAISE NOTICE '   ✅ %', v_view_name;
        ELSE
            RAISE WARNING '   ❌ % NÃO existe', v_view_name;
            v_missing := v_missing + 1;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    IF v_missing = 0 THEN
        RAISE NOTICE '   ✅ Todas as 9 views críticas estão presentes!';
    ELSE
        RAISE WARNING '   ⚠️  % views faltando de 9 esperadas', v_missing;
    END IF;
END $$;

\echo ''

-- =====================================================
-- PARTE 7: VALIDAR INTEGRAÇÕES
-- =====================================================

\echo '🔌 PARTE 7: INTEGRAÇÕES'
\echo '================================================'

DO $$
DECLARE
    v_integrations INTEGER;
    v_active_integrations INTEGER;
    v_shopify INTEGER;
    v_stripe INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_integrations FROM "Integration";
    SELECT COUNT(*) INTO v_active_integrations FROM "Integration" WHERE "isActive" = true;
    SELECT COUNT(*) INTO v_shopify FROM "Integration" WHERE type = 'shopify';
    SELECT COUNT(*) INTO v_stripe FROM "Integration" WHERE type = 'stripe';

    RAISE NOTICE '';
    RAISE NOTICE '🔌 Estatísticas de Integrações:';
    RAISE NOTICE '   Total de integrações: %', v_integrations;
    RAISE NOTICE '   Integrações ativas: %', v_active_integrations;
    RAISE NOTICE '   Shopify: %', v_shopify;
    RAISE NOTICE '   Stripe: %', v_stripe;

    IF v_active_integrations > 0 THEN
        RAISE NOTICE '   ✅ Sistema com integrações configuradas';
    ELSE
        RAISE NOTICE '   ℹ️  Nenhuma integração ativa (pode ser intencional)';
    END IF;
END $$;

\echo ''

-- =====================================================
-- PARTE 8: RESUMO FINAL
-- =====================================================

\echo '================================================'
\echo '📋 RESUMO FINAL DA VALIDAÇÃO'
\echo '================================================'

DO $$
DECLARE
    v_users INTEGER;
    v_orders INTEGER;
    v_ai INTEGER;
    v_rls_count INTEGER;
    v_views_count INTEGER;
    v_issues INTEGER := 0;
    v_status TEXT;
BEGIN
    -- Coletar métricas principais
    SELECT COUNT(*) INTO v_users FROM "User" WHERE "isActive" = true;
    SELECT COUNT(*) INTO v_orders FROM "Order";
    SELECT COUNT(*) INTO v_ai FROM "GlobalAiConnection" WHERE "isActive" = true;

    SELECT COUNT(*) INTO v_rls_count
    FROM pg_class
    WHERE relname IN ('User', 'Order', 'Product', 'Integration')
    AND relrowsecurity = true;

    SELECT COUNT(*) INTO v_views_count
    FROM pg_views
    WHERE viewname IN (
        'ActiveDiscountCodes', 'v_active_users', 'v_super_admins',
        'ProductPerformance', 'CheckoutDashboard', 'CartRecoveryAnalytics',
        'CustomerAnalytics', 'UTMAnalytics', 'checkout_trial_dashboard'
    );

    RAISE NOTICE '';
    RAISE NOTICE '📊 Métricas Gerais:';
    RAISE NOTICE '   Usuários ativos: %', v_users;
    RAISE NOTICE '   Pedidos totais: %', v_orders;
    RAISE NOTICE '   IA configuradas: %', v_ai;
    RAISE NOTICE '   Tabelas com RLS: % de 4', v_rls_count;
    RAISE NOTICE '   Views críticas: % de 9', v_views_count;
    RAISE NOTICE '';

    -- Avaliar issues
    IF v_users = 0 THEN v_issues := v_issues + 1; END IF;
    IF v_rls_count < 4 THEN v_issues := v_issues + 1; END IF;
    IF v_views_count < 9 THEN v_issues := v_issues + 1; END IF;

    IF v_issues = 0 THEN
        v_status := '🎉 SISTEMA PRONTO PARA PRODUÇÃO!';
    ELSIF v_issues <= 2 THEN
        v_status := '⚠️  SISTEMA COM AVISOS - Revisar antes de produção';
    ELSE
        v_status := '❌ SISTEMA NÃO PRONTO - Corrigir issues críticos';
    END IF;

    RAISE NOTICE '================================================';
    RAISE NOTICE '%', v_status;
    RAISE NOTICE '================================================';
    RAISE NOTICE '';

    IF v_issues > 0 THEN
        RAISE NOTICE '🔧 Ações necessárias:';
        IF v_users = 0 THEN
            RAISE NOTICE '   - Criar pelo menos um usuário ativo';
        END IF;
        IF v_rls_count < 4 THEN
            RAISE NOTICE '   - Ativar RLS em todas as tabelas críticas';
        END IF;
        IF v_views_count < 9 THEN
            RAISE NOTICE '   - Executar script FIX_SECURITY_DEFINER_VIEWS.sql';
        END IF;
        RAISE NOTICE '';
    END IF;

    RAISE NOTICE '✅ Próximos passos:';
    RAISE NOTICE '   1. Corrigir issues (se houver)';
    RAISE NOTICE '   2. Executar build do frontend';
    RAISE NOTICE '   3. Testar login e fluxos principais';
    RAISE NOTICE '   4. Deploy para produção';
    RAISE NOTICE '';
END $$;

\echo '================================================'
\echo '✅ VALIDAÇÃO CONCLUÍDA!'
\echo '================================================'
