-- SOLUCAO_FINAL_CHAT_MOBILE.sql
-- Solução definitiva e simplificada para o problema do chat no celular

-- Remover TODAS as políticas existentes para garantir uma implementação limpa
DROP POLICY IF EXISTS "Users can view their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can insert their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can update their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can delete their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "ChatConversation";

-- Criar uma única política simplificada para ChatConversation que funcione em todos os dispositivos
CREATE POLICY "ChatConversation_policy" ON "ChatConversation"
  USING ("userId"::text = auth.uid()::text);

-- Remover políticas existentes para ChatMessage
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Enable read for users based on conversation" ON "ChatMessage";
DROP POLICY IF EXISTS "Enable insert for users based on conversation" ON "ChatMessage";
DROP POLICY IF EXISTS "Enable update for users based on conversation" ON "ChatMessage";
DROP POLICY IF EXISTS "Enable delete for users based on conversation" ON "ChatMessage";

-- Criar uma única política simplificada para ChatMessage
CREATE POLICY "ChatMessage_policy" ON "ChatMessage"
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE "ChatConversation"."id" = "ChatMessage"."conversationId" 
      AND "ChatConversation"."userId"::text = auth.uid()::text
    )
  );

-- Garantir que RLS está habilitado
ALTER TABLE IF EXISTS "ChatConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ChatMessage" ENABLE ROW LEVEL SECURITY;