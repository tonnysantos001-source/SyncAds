-- ============================================
-- CONSOLIDAR POLÍTICAS RLS DUPLICADAS
-- ============================================
-- Remove políticas RLS duplicadas antigas
-- As políticas otimizadas já foram criadas pelo APLICAR_RLS_FINAL_SEGURO.sql
-- ============================================

-- 🔍 Removendo políticas RLS duplicadas...

-- ============================================
-- REMOVER POLÍTICAS DUPLICADAS ANTIGAS
-- ============================================

-- User table
DROP POLICY IF EXISTS "Users can read own data" ON "User";
DROP POLICY IF EXISTS "Users can update own data" ON "User";
DROP POLICY IF EXISTS "Users can delete own data" ON "User";
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
DROP POLICY IF EXISTS "Users can update their own profile" ON "User";

-- Campaign table
DROP POLICY IF EXISTS "Users can read own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can create campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can update own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can delete own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can view their own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON "Campaign";

-- Analytics table (se existir)
DROP POLICY IF EXISTS "Users can read own analytics" ON "Analytics";
DROP POLICY IF EXISTS "Users can create analytics" ON "Analytics";

-- ChatConversation table
DROP POLICY IF EXISTS "Users can manage own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can read own conversations" ON "ChatConversation";

-- ChatMessage table
DROP POLICY IF EXISTS "Users can read own messages" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can create messages" ON "ChatMessage";

-- Integration table
DROP POLICY IF EXISTS "Users can manage own integrations" ON "Integration";

-- ApiKey table
DROP POLICY IF EXISTS "Users can manage own API keys" ON "ApiKey";

-- Notification table (se existir)
DROP POLICY IF EXISTS "Users can read own notifications" ON "Notification";
DROP POLICY IF EXISTS "Users can update own notifications" ON "Notification";

-- AiConnection table (se existir)
DROP POLICY IF EXISTS "Users can read own AI connections" ON "AiConnection";

-- AiPersonality table (se existir)
DROP POLICY IF EXISTS "Users can read AI personalities" ON "AiPersonality";

-- ============================================
-- VERIFICAR RESULTADO
-- ============================================

-- 📊 Verificando políticas consolidadas...

SELECT 
    schemaname,
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN policyname LIKE '%select%' THEN '🟢 SELECT'
        WHEN policyname LIKE '%insert%' THEN '🔵 INSERT'
        WHEN policyname LIKE '%update%' THEN '🟡 UPDATE'
        WHEN policyname LIKE '%delete%' THEN '🔴 DELETE'
        ELSE '⚪ OTHER'
    END as policy_type
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('User', 'Campaign', 'Analytics', 'ChatConversation', 'ChatMessage', 'Integration', 'ApiKey', 'Notification', 'AiConnection', 'AiPersonality')
ORDER BY tablename, operation, policyname;

-- ✅ Limpeza de políticas RLS duplicadas concluída!
-- 📈 Benefícios:
--    - Políticas mais claras e organizadas
--    - Melhor performance (sem conflitos)
--    - Fácil manutenção
--    - Nomenclatura padronizada
