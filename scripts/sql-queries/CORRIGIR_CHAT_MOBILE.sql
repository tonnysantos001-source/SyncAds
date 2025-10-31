-- CORRIGIR_CHAT_MOBILE.sql
-- Correção rápida para o problema de RLS no chat mobile

-- Corrigir políticas RLS para ChatConversation
DROP POLICY IF EXISTS "Users can view their own conversations" ON "ChatConversation";
CREATE POLICY "Users can view their own conversations" ON "ChatConversation"
  FOR SELECT 
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own conversations" ON "ChatConversation";
CREATE POLICY "Users can insert their own conversations" ON "ChatConversation"
  FOR INSERT 
  WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own conversations" ON "ChatConversation";
CREATE POLICY "Users can update their own conversations" ON "ChatConversation"
  FOR UPDATE 
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own conversations" ON "ChatConversation";
CREATE POLICY "Users can delete their own conversations" ON "ChatConversation"
  FOR DELETE 
  USING ("userId" = auth.uid()::text);

-- Corrigir políticas RLS para ChatMessage
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON "ChatMessage";
CREATE POLICY "Users can view messages from their conversations" ON "ChatMessage"
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = auth.uid()::text
    )
  );