-- ============================================
-- LIMPAR POLÍTICAS RLS DUPLICADAS - VERSÃO SIMPLES
-- ============================================
-- Copie TODO este conteúdo e cole no Supabase SQL Editor
-- ============================================

-- User
DROP POLICY IF EXISTS "Users can read own data" ON "User";
DROP POLICY IF EXISTS "Users can update own data" ON "User";
DROP POLICY IF EXISTS "Users can delete own data" ON "User";
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
DROP POLICY IF EXISTS "Users can update their own profile" ON "User";

-- Campaign
DROP POLICY IF EXISTS "Users can read own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can create campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can update own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can delete own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can view their own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON "Campaign";

-- ChatConversation
DROP POLICY IF EXISTS "Users can manage own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can read own conversations" ON "ChatConversation";

-- ChatMessage
DROP POLICY IF EXISTS "Users can read own messages" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can create messages" ON "ChatMessage";

-- Integration
DROP POLICY IF EXISTS "Users can manage own integrations" ON "Integration";

-- ApiKey
DROP POLICY IF EXISTS "Users can manage own API keys" ON "ApiKey";

-- ✅ CONCLUÍDO! Políticas duplicadas removidas.

