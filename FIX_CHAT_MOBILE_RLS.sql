-- FIX_CHAT_MOBILE_RLS.sql
-- Correção para o problema de RLS na tabela ChatConversation que afeta o acesso mobile

-- Habilitar RLS para as tabelas se ainda não estiver habilitado
ALTER TABLE IF EXISTS "ChatConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "ChatMessage" ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes que podem estar causando o problema
DROP POLICY IF EXISTS "Users can view their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can insert their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can update their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can delete their own conversations" ON "ChatConversation";

-- Criar políticas corrigidas para ChatConversation
-- Usando auth.uid() diretamente sem cast para evitar problemas de tipo entre plataformas
CREATE POLICY "Users can view their own conversations" ON "ChatConversation"
  FOR SELECT 
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can insert their own conversations" ON "ChatConversation"
  FOR INSERT 
  WITH CHECK ("userId" = auth.uid()::text);

CREATE POLICY "Users can update their own conversations" ON "ChatConversation"
  FOR UPDATE 
  USING ("userId" = auth.uid()::text);

CREATE POLICY "Users can delete their own conversations" ON "ChatConversation"
  FOR DELETE 
  USING ("userId" = auth.uid()::text);

-- Remover políticas existentes para ChatMessage
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON "ChatMessage";

-- Criar políticas corrigidas para ChatMessage
-- Usando uma abordagem mais direta e consistente
CREATE POLICY "Users can view messages from their conversations" ON "ChatMessage"
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can insert messages to their conversations" ON "ChatMessage"
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can update messages in their conversations" ON "ChatMessage"
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = auth.uid()::text
    )
  );

CREATE POLICY "Users can delete messages from their conversations" ON "ChatMessage"
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = auth.uid()::text
    )
  );

-- Verificar se as políticas foram aplicadas corretamente
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para ChatConversation e ChatMessage foram atualizadas';
  
  -- Verificar se as políticas existem
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'ChatConversation' AND policyname = 'Users can view their own conversations'
  ) THEN
    RAISE NOTICE '✅ Política de visualização para ChatConversation está ativa';
  ELSE
    RAISE NOTICE '❌ Política de visualização para ChatConversation NÃO está ativa';
  END IF;
END $$;