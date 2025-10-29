-- ============================================
-- CONSOLIDAR POLÍTICAS RLS DUPLICADAS
-- ============================================
-- Remove políticas RLS duplicadas e consolida em uma única política por operação
-- ============================================

-- 🔍 Analisando políticas RLS duplicadas...

-- ============================================
-- 1. REMOVER POLÍTICAS DUPLICADAS
-- ============================================

-- User table - Manter apenas as políticas otimizadas
DO $$ 
BEGIN
    -- Drop duplicadas antigas
    DROP POLICY IF EXISTS "Users can read own data" ON "User";
    DROP POLICY IF EXISTS "Users can update own data" ON "User";
    DROP POLICY IF EXISTS "Users can delete own data" ON "User";
    
    -- Garantir que as otimizadas existem
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'User' AND policyname = 'user_select_own'
    ) THEN
        CREATE POLICY user_select_own ON "User"
            FOR SELECT
            USING ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'User' AND policyname = 'user_update_own'
    ) THEN
        CREATE POLICY user_update_own ON "User"
            FOR UPDATE
            USING ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'User' AND policyname = 'user_delete_own'
    ) THEN
        CREATE POLICY user_delete_own ON "User"
            FOR DELETE
            USING ((select auth.uid())::text = "userId");
    END IF;

    RAISE NOTICE '✅ User policies consolidated';
END $$;

-- Campaign table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read own campaigns" ON "Campaign";
    DROP POLICY IF EXISTS "Users can create campaigns" ON "Campaign";
    DROP POLICY IF EXISTS "Users can update own campaigns" ON "Campaign";
    DROP POLICY IF EXISTS "Users can delete own campaigns" ON "Campaign";
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Campaign' AND policyname = 'campaign_select_own'
    ) THEN
        CREATE POLICY campaign_select_own ON "Campaign"
            FOR SELECT
            USING ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Campaign' AND policyname = 'campaign_insert_own'
    ) THEN
        CREATE POLICY campaign_insert_own ON "Campaign"
            FOR INSERT
            WITH CHECK ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Campaign' AND policyname = 'campaign_update_own'
    ) THEN
        CREATE POLICY campaign_update_own ON "Campaign"
            FOR UPDATE
            USING ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Campaign' AND policyname = 'campaign_delete_own'
    ) THEN
        CREATE POLICY campaign_delete_own ON "Campaign"
            FOR DELETE
            USING ((select auth.uid())::text = "userId");
    END IF;

    RAISE NOTICE '✅ Campaign policies consolidated';
END $$;

-- Analytics table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read own analytics" ON "Analytics";
    DROP POLICY IF EXISTS "Users can create analytics" ON "Analytics";
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Analytics' AND policyname = 'analytics_select_own'
    ) THEN
        CREATE POLICY analytics_select_own ON "Analytics"
            FOR SELECT
            USING ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Analytics' AND policyname = 'analytics_insert_own'
    ) THEN
        CREATE POLICY analytics_insert_own ON "Analytics"
            FOR INSERT
            WITH CHECK ((select auth.uid())::text = "userId");
    END IF;

    RAISE NOTICE '✅ Analytics policies consolidated';
END $$;

-- ChatConversation table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage own conversations" ON "ChatConversation";
    DROP POLICY IF EXISTS "Users can read own conversations" ON "ChatConversation";
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ChatConversation' AND policyname = 'chat_conversation_select_own'
    ) THEN
        CREATE POLICY chat_conversation_select_own ON "ChatConversation"
            FOR SELECT
            USING ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ChatConversation' AND policyname = 'chat_conversation_insert_own'
    ) THEN
        CREATE POLICY chat_conversation_insert_own ON "ChatConversation"
            FOR INSERT
            WITH CHECK ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ChatConversation' AND policyname = 'chat_conversation_update_own'
    ) THEN
        CREATE POLICY chat_conversation_update_own ON "ChatConversation"
            FOR UPDATE
            USING ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ChatConversation' AND policyname = 'chat_conversation_delete_own'
    ) THEN
        CREATE POLICY chat_conversation_delete_own ON "ChatConversation"
            FOR DELETE
            USING ((select auth.uid())::text = "userId");
    END IF;

    RAISE NOTICE '✅ ChatConversation policies consolidated';
END $$;

-- ChatMessage table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read own messages" ON "ChatMessage";
    DROP POLICY IF EXISTS "Users can create messages" ON "ChatMessage";
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ChatMessage' AND policyname = 'chat_message_select_own'
    ) THEN
        CREATE POLICY chat_message_select_own ON "ChatMessage"
            FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM "ChatConversation"
                    WHERE id = "ChatMessage"."conversationId"
                    AND "userId" = (select auth.uid())::text
                )
            );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ChatMessage' AND policyname = 'chat_message_insert_own'
    ) THEN
        CREATE POLICY chat_message_insert_own ON "ChatMessage"
            FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM "ChatConversation"
                    WHERE id = "ChatMessage"."conversationId"
                    AND "userId" = (select auth.uid())::text
                )
            );
    END IF;

    RAISE NOTICE '✅ ChatMessage policies consolidated';
END $$;

-- Integration table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage own integrations" ON "Integration";
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Integration' AND policyname = 'integration_select_own'
    ) THEN
        CREATE POLICY integration_select_own ON "Integration"
            FOR SELECT
            USING ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Integration' AND policyname = 'integration_insert_own'
    ) THEN
        CREATE POLICY integration_insert_own ON "Integration"
            FOR INSERT
            WITH CHECK ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Integration' AND policyname = 'integration_update_own'
    ) THEN
        CREATE POLICY integration_update_own ON "Integration"
            FOR UPDATE
            USING ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'Integration' AND policyname = 'integration_delete_own'
    ) THEN
        CREATE POLICY integration_delete_own ON "Integration"
            FOR DELETE
            USING ((select auth.uid())::text = "userId");
    END IF;

    RAISE NOTICE '✅ Integration policies consolidated';
END $$;

-- ApiKey table
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can manage own API keys" ON "ApiKey";
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ApiKey' AND policyname = 'apikey_select_own'
    ) THEN
        CREATE POLICY apikey_select_own ON "ApiKey"
            FOR SELECT
            USING ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ApiKey' AND policyname = 'apikey_insert_own'
    ) THEN
        CREATE POLICY apikey_insert_own ON "ApiKey"
            FOR INSERT
            WITH CHECK ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ApiKey' AND policyname = 'apikey_update_own'
    ) THEN
        CREATE POLICY apikey_update_own ON "ApiKey"
            FOR UPDATE
            USING ((select auth.uid())::text = "userId");
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'ApiKey' AND policyname = 'apikey_delete_own'
    ) THEN
        CREATE POLICY apikey_delete_own ON "ApiKey"
            FOR DELETE
            USING ((select auth.uid())::text = "userId");
    END IF;

    RAISE NOTICE '✅ ApiKey policies consolidated';
END $$;

-- ============================================
-- 2. VERIFICAR RESULTADO
-- ============================================

-- 📊 Verificando políticas consolidadas...

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname LIKE '%_select_%' THEN '🟢 SELECT'
        WHEN policyname LIKE '%_insert_%' THEN '🔵 INSERT'
        WHEN policyname LIKE '%_update_%' THEN '🟡 UPDATE'
        WHEN policyname LIKE '%_delete_%' THEN '🔴 DELETE'
        ELSE '⚪ OTHER'
    END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('User', 'Campaign', 'Analytics', 'ChatConversation', 'ChatMessage', 'Integration', 'ApiKey', 'Notification', 'AiConnection', 'AiPersonality')
ORDER BY tablename, operation, policyname;

-- ✅ Consolidação de políticas RLS concluída!
-- 📈 Benefícios:
--    - Políticas mais claras e organizadas
--    - Melhor performance (sem conflitos)
--    - Fácil manutenção
--    - Nomenclatura padronizada

