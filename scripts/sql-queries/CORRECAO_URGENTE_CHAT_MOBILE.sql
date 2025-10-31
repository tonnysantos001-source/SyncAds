-- CORRECAO_URGENTE_CHAT_MOBILE.sql
-- Solução definitiva para o problema de RLS no chat mobile

-- Primeiro, garantir que RLS está habilitado
ALTER TABLE IF EXISTS "ChatConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ChatMessage" ENABLE ROW LEVEL SECURITY;

-- Remover TODAS as políticas existentes para garantir uma implementação limpa
DROP POLICY IF EXISTS "Users can view their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can insert their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can update their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can delete their own conversations" ON "ChatConversation";

-- Criar políticas simplificadas e robustas para ChatConversation
-- Usando uma abordagem direta com comparação simples
CREATE POLICY "Enable read for users based on user_id" ON "ChatConversation"
  FOR SELECT 
  USING ("userId"::text = auth.uid()::text);

CREATE POLICY "Enable insert for users based on user_id" ON "ChatConversation"
  FOR INSERT 
  WITH CHECK ("userId"::text = auth.uid()::text);

CREATE POLICY "Enable update for users based on user_id" ON "ChatConversation"
  FOR UPDATE 
  USING ("userId"::text = auth.uid()::text);

CREATE POLICY "Enable delete for users based on user_id" ON "ChatConversation"
  FOR DELETE 
  USING ("userId"::text = auth.uid()::text);

-- Remover políticas existentes para ChatMessage
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON "ChatMessage";

-- Criar políticas simplificadas para ChatMessage
CREATE POLICY "Enable read for users based on conversation" ON "ChatMessage"
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE "ChatConversation"."id" = "ChatMessage"."conversationId" 
      AND "ChatConversation"."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Enable insert for users based on conversation" ON "ChatMessage"
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE "ChatConversation"."id" = "ChatMessage"."conversationId" 
      AND "ChatConversation"."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Enable update for users based on conversation" ON "ChatMessage"
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE "ChatConversation"."id" = "ChatMessage"."conversationId" 
      AND "ChatConversation"."userId"::text = auth.uid()::text
    )
  );

CREATE POLICY "Enable delete for users based on conversation" ON "ChatMessage"
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE "ChatConversation"."id" = "ChatMessage"."conversationId" 
      AND "ChatConversation"."userId"::text = auth.uid()::text
    )
  );

-- Verificar e confirmar que as políticas foram aplicadas
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para ChatConversation e ChatMessage foram atualizadas com uma abordagem mais robusta';
END $$;