-- SOLUCAO_RAPIDA.sql
-- Solução rápida e direta para o problema do chat no celular

-- Remover todas as políticas existentes
DROP POLICY IF EXISTS "Users can view their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can insert their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can update their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can delete their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "ChatConversation_policy" ON "ChatConversation";

-- Criar uma política única e simples para ChatConversation
CREATE POLICY "mobile_chat_policy" ON "ChatConversation"
  USING ("userId"::text = auth.uid()::text);

-- Garantir que RLS está habilitado
ALTER TABLE "ChatConversation" ENABLE ROW LEVEL SECURITY;