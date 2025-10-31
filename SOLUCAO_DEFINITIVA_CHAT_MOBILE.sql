-- SOLUCAO_DEFINITIVA_CHAT_MOBILE.sql
-- Script para corrigir definitivamente o problema de RLS no chat mobile

-- =============================================
-- PARTE 1: DESATIVAR RLS TEMPORARIAMENTE
-- =============================================

-- Desativar RLS temporariamente para fazer as alterações
ALTER TABLE "ChatConversation" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" DISABLE ROW LEVEL SECURITY;

-- =============================================
-- PARTE 2: REMOVER TODAS AS POLÍTICAS EXISTENTES
-- =============================================

-- Remover todas as políticas existentes para ChatConversation
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "mobile_chat_policy" ON "ChatConversation";
DROP POLICY IF EXISTS "mobile_read_policy" ON "ChatConversation";
DROP POLICY IF EXISTS "mobile_insert_policy" ON "ChatConversation";
DROP POLICY IF EXISTS "mobile_update_policy" ON "ChatConversation";
DROP POLICY IF EXISTS "mobile_delete_policy" ON "ChatConversation";

-- Remover todas as políticas existentes para ChatMessage
DROP POLICY IF EXISTS "Enable read access for users based on user_id" ON "ChatMessage";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "ChatMessage";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "ChatMessage";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "ChatMessage";
DROP POLICY IF EXISTS "mobile_chat_message_policy" ON "ChatMessage";

-- =============================================
-- PARTE 3: CRIAR NOVAS POLÍTICAS ROBUSTAS
-- =============================================

-- Criar políticas para ChatConversation com conversão explícita de tipos
CREATE POLICY "chat_conversation_select_policy" 
ON "ChatConversation"
FOR SELECT 
USING (
    "userId"::TEXT = auth.uid()::TEXT
);

CREATE POLICY "chat_conversation_insert_policy" 
ON "ChatConversation"
FOR INSERT 
WITH CHECK (
    "userId"::TEXT = auth.uid()::TEXT
);

CREATE POLICY "chat_conversation_update_policy" 
ON "ChatConversation"
FOR UPDATE 
USING (
    "userId"::TEXT = auth.uid()::TEXT
);

CREATE POLICY "chat_conversation_delete_policy" 
ON "ChatConversation"
FOR DELETE 
USING (
    "userId"::TEXT = auth.uid()::TEXT
);

-- Criar políticas para ChatMessage com conversão explícita de tipos
CREATE POLICY "chat_message_select_policy" 
ON "ChatMessage"
FOR SELECT 
USING (
    "userId"::TEXT = auth.uid()::TEXT OR
    EXISTS (
        SELECT 1 FROM "ChatConversation"
        WHERE "ChatConversation"."id" = "ChatMessage"."conversationId"
        AND "ChatConversation"."userId"::TEXT = auth.uid()::TEXT
    )
);

CREATE POLICY "chat_message_insert_policy" 
ON "ChatMessage"
FOR INSERT 
WITH CHECK (
    "userId"::TEXT = auth.uid()::TEXT OR
    EXISTS (
        SELECT 1 FROM "ChatConversation"
        WHERE "ChatConversation"."id" = "ChatMessage"."conversationId"
        AND "ChatConversation"."userId"::TEXT = auth.uid()::TEXT
    )
);

CREATE POLICY "chat_message_update_policy" 
ON "ChatMessage"
FOR UPDATE 
USING (
    "userId"::TEXT = auth.uid()::TEXT OR
    EXISTS (
        SELECT 1 FROM "ChatConversation"
        WHERE "ChatConversation"."id" = "ChatMessage"."conversationId"
        AND "ChatConversation"."userId"::TEXT = auth.uid()::TEXT
    )
);

CREATE POLICY "chat_message_delete_policy" 
ON "ChatMessage"
FOR DELETE 
USING (
    "userId"::TEXT = auth.uid()::TEXT OR
    EXISTS (
        SELECT 1 FROM "ChatConversation"
        WHERE "ChatConversation"."id" = "ChatMessage"."conversationId"
        AND "ChatConversation"."userId"::TEXT = auth.uid()::TEXT
    )
);

-- =============================================
-- PARTE 4: REATIVAR RLS
-- =============================================

-- Reativar RLS para ambas as tabelas
ALTER TABLE "ChatConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;

-- =============================================
-- PARTE 5: VERIFICAÇÃO
-- =============================================

-- Verificar se as políticas foram criadas corretamente
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('ChatConversation', 'ChatMessage')
ORDER BY tablename, policyname;

-- Mensagem de confirmação
DO $$
BEGIN
    RAISE NOTICE 'SOLUÇÃO DEFINITIVA APLICADA COM SUCESSO!';
    RAISE NOTICE 'As políticas de RLS para ChatConversation e ChatMessage foram recriadas com conversão explícita de tipos.';
    RAISE NOTICE 'Isso deve resolver o problema de acesso ao chat no navegador móvel.';
END $$;