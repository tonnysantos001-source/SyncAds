-- ============================================
-- MIGRATION: Add RLS Policies for IA System
-- Date: 2025-01-26
-- Description: Adiciona Row Level Security nas tabelas críticas do sistema de IA
-- ============================================

-- ============================================
-- 1. EXTENSION_COMMANDS - Comandos para Extensão
-- ============================================

-- Habilitar RLS
ALTER TABLE extension_commands ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios comandos
DROP POLICY IF EXISTS "Users can only see their own commands" ON extension_commands;
CREATE POLICY "Users can only see their own commands"
ON extension_commands FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Usuários podem criar comandos para si mesmos
DROP POLICY IF EXISTS "Users can create their own commands" ON extension_commands;
CREATE POLICY "Users can create their own commands"
ON extension_commands FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar apenas seus próprios comandos
DROP POLICY IF EXISTS "Users can update their own commands" ON extension_commands;
CREATE POLICY "Users can update their own commands"
ON extension_commands FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Usuários podem deletar apenas seus próprios comandos
DROP POLICY IF EXISTS "Users can delete their own commands" ON extension_commands;
CREATE POLICY "Users can delete their own commands"
ON extension_commands FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Service role bypass (para Edge Functions)
DROP POLICY IF EXISTS "Service role has full access to commands" ON extension_commands;
CREATE POLICY "Service role has full access to commands"
ON extension_commands FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 2. EXTENSION_DEVICES - Devices da Extensão
-- ============================================

-- Habilitar RLS
ALTER TABLE extension_devices ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios devices
DROP POLICY IF EXISTS "Users can only see their own devices" ON extension_devices;
CREATE POLICY "Users can only see their own devices"
ON extension_devices FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Usuários podem criar devices para si mesmos
DROP POLICY IF EXISTS "Users can create their own devices" ON extension_devices;
CREATE POLICY "Users can create their own devices"
ON extension_devices FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Usuários podem atualizar apenas seus próprios devices
DROP POLICY IF EXISTS "Users can update their own devices" ON extension_devices;
CREATE POLICY "Users can update their own devices"
ON extension_devices FOR UPDATE
USING (auth.uid() = user_id);

-- Policy: Usuários podem deletar apenas seus próprios devices
DROP POLICY IF EXISTS "Users can delete their own devices" ON extension_devices;
CREATE POLICY "Users can delete their own devices"
ON extension_devices FOR DELETE
USING (auth.uid() = user_id);

-- Policy: Service role bypass
DROP POLICY IF EXISTS "Service role has full access to devices" ON extension_devices;
CREATE POLICY "Service role has full access to devices"
ON extension_devices FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 3. ROUTING_ANALYTICS - Analytics de Roteamento
-- ============================================

-- Habilitar RLS
ALTER TABLE routing_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Usuários podem ver apenas seus próprios analytics
DROP POLICY IF EXISTS "Users can only see their own analytics" ON routing_analytics;
CREATE POLICY "Users can only see their own analytics"
ON routing_analytics FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Apenas service role pode inserir analytics
DROP POLICY IF EXISTS "Only service role can insert analytics" ON routing_analytics;
CREATE POLICY "Only service role can insert analytics"
ON routing_analytics FOR INSERT
WITH CHECK (auth.role() = 'service_role');

-- Policy: Service role bypass
DROP POLICY IF EXISTS "Service role has full access to analytics" ON routing_analytics;
CREATE POLICY "Service role has full access to analytics"
ON routing_analytics FOR ALL
USING (auth.role() = 'service_role');

-- ============================================
-- 4. CHATMESSAGE - Mensagens do Chat
-- ============================================

-- Verificar se a tabela existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ChatMessage') THEN
        -- Habilitar RLS
        ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;

        -- Policy: Usuários podem ver apenas suas próprias mensagens
        DROP POLICY IF EXISTS "Users can only see their own messages" ON "ChatMessage";
        CREATE POLICY "Users can only see their own messages"
        ON "ChatMessage" FOR SELECT
        USING (auth.uid() = "userId");

        -- Policy: Usuários podem criar mensagens para si mesmos
        DROP POLICY IF EXISTS "Users can create their own messages" ON "ChatMessage";
        CREATE POLICY "Users can create their own messages"
        ON "ChatMessage" FOR INSERT
        WITH CHECK (auth.uid() = "userId");

        -- Policy: Service role bypass
        DROP POLICY IF EXISTS "Service role has full access to messages" ON "ChatMessage";
        CREATE POLICY "Service role has full access to messages"
        ON "ChatMessage" FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
END $$;

-- ============================================
-- 5. CONVERSATION - Conversações
-- ============================================

-- Verificar se a tabela existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Conversation') THEN
        -- Habilitar RLS
        ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;

        -- Policy: Usuários podem ver apenas suas próprias conversações
        DROP POLICY IF EXISTS "Users can only see their own conversations" ON "Conversation";
        CREATE POLICY "Users can only see their own conversations"
        ON "Conversation" FOR SELECT
        USING (auth.uid() = "userId");

        -- Policy: Usuários podem criar conversações para si mesmos
        DROP POLICY IF EXISTS "Users can create their own conversations" ON "Conversation";
        CREATE POLICY "Users can create their own conversations"
        ON "Conversation" FOR INSERT
        WITH CHECK (auth.uid() = "userId");

        -- Policy: Usuários podem atualizar apenas suas próprias conversações
        DROP POLICY IF EXISTS "Users can update their own conversations" ON "Conversation";
        CREATE POLICY "Users can update their own conversations"
        ON "Conversation" FOR UPDATE
        USING (auth.uid() = "userId");

        -- Policy: Usuários podem deletar apenas suas próprias conversações
        DROP POLICY IF EXISTS "Users can delete their own conversations" ON "Conversation";
        CREATE POLICY "Users can delete their own conversations"
        ON "Conversation" FOR DELETE
        USING (auth.uid() = "userId");

        -- Policy: Service role bypass
        DROP POLICY IF EXISTS "Service role has full access to conversations" ON "Conversation";
        CREATE POLICY "Service role has full access to conversations"
        ON "Conversation" FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
END $$;

-- ============================================
-- 6. GLOBALAICONNECTION - Configuração Global de IA
-- ============================================

-- Verificar se a tabela existe
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'GlobalAiConnection') THEN
        -- Habilitar RLS
        ALTER TABLE "GlobalAiConnection" ENABLE ROW LEVEL SECURITY;

        -- Policy: Todos podem ler a configuração global ativa
        DROP POLICY IF EXISTS "Anyone can read active global AI config" ON "GlobalAiConnection";
        CREATE POLICY "Anyone can read active global AI config"
        ON "GlobalAiConnection" FOR SELECT
        USING ("isActive" = true);

        -- Policy: Apenas admins podem modificar
        DROP POLICY IF EXISTS "Only admins can modify global AI config" ON "GlobalAiConnection";
        CREATE POLICY "Only admins can modify global AI config"
        ON "GlobalAiConnection" FOR ALL
        USING (
            EXISTS (
                SELECT 1 FROM "User"
                WHERE id = auth.uid()
                AND role = 'ADMIN'
            )
        );

        -- Policy: Service role bypass
        DROP POLICY IF EXISTS "Service role has full access to global AI" ON "GlobalAiConnection";
        CREATE POLICY "Service role has full access to global AI"
        ON "GlobalAiConnection" FOR ALL
        USING (auth.role() = 'service_role');
    END IF;
END $$;

-- ============================================
-- 7. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Índice composto para queries comuns em extension_commands
CREATE INDEX IF NOT EXISTS idx_extension_commands_user_status_created
ON extension_commands(user_id, status, created_at DESC);

-- Índice composto para queries comuns em extension_devices
CREATE INDEX IF NOT EXISTS idx_extension_devices_user_status
ON extension_devices(user_id, status);

-- Índice para routing_analytics
CREATE INDEX IF NOT EXISTS idx_routing_analytics_user_created
ON routing_analytics(user_id, created_at DESC);

-- ============================================
-- 8. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ============================================

COMMENT ON POLICY "Users can only see their own commands" ON extension_commands IS
'Garante que usuários só possam visualizar comandos que pertencem a eles';

COMMENT ON POLICY "Users can only see their own devices" ON extension_devices IS
'Garante que usuários só possam visualizar devices que pertencem a eles';

COMMENT ON POLICY "Users can only see their own analytics" ON routing_analytics IS
'Garante que usuários só possam visualizar analytics que pertencem a eles';

-- ============================================
-- 9. VALIDAÇÃO
-- ============================================

-- Verificar se RLS está habilitado
DO $$
DECLARE
    table_name text;
    rls_enabled boolean;
BEGIN
    FOR table_name IN
        SELECT unnest(ARRAY['extension_commands', 'extension_devices', 'routing_analytics'])
    LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = table_name;

        IF NOT rls_enabled THEN
            RAISE EXCEPTION 'RLS not enabled on table: %', table_name;
        ELSE
            RAISE NOTICE 'RLS successfully enabled on table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- ============================================
-- FIM DA MIGRATION
-- ============================================
