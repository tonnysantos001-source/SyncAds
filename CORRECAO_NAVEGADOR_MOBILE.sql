-- CORRECAO_NAVEGADOR_MOBILE.sql
-- Solução específica para o problema do chat no navegador mobile

-- Remover todas as políticas existentes para ChatConversation
DROP POLICY IF EXISTS "Users can view their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can insert their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can update their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can delete their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable read for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON "ChatConversation";
DROP POLICY IF EXISTS "ChatConversation_policy" ON "ChatConversation";
DROP POLICY IF EXISTS "mobile_chat_policy" ON "ChatConversation";

-- Criar políticas específicas para navegador mobile
-- Usando uma abordagem mais robusta com conversão explícita de tipos
CREATE POLICY "mobile_read_policy" ON "ChatConversation" 
  FOR SELECT 
  USING (CAST("userId" AS TEXT) = CAST(auth.uid() AS TEXT));

CREATE POLICY "mobile_insert_policy" ON "ChatConversation" 
  FOR INSERT 
  WITH CHECK (CAST("userId" AS TEXT) = CAST(auth.uid() AS TEXT));

CREATE POLICY "mobile_update_policy" ON "ChatConversation" 
  FOR UPDATE 
  USING (CAST("userId" AS TEXT) = CAST(auth.uid() AS TEXT));

CREATE POLICY "mobile_delete_policy" ON "ChatConversation" 
  FOR DELETE 
  USING (CAST("userId" AS TEXT) = CAST(auth.uid() AS TEXT));

-- Garantir que RLS está habilitado
ALTER TABLE "ChatConversation" ENABLE ROW LEVEL SECURITY;

-- Verificar se as políticas foram aplicadas
DO $$
BEGIN
  RAISE NOTICE '✅ Políticas RLS para ChatConversation foram atualizadas para compatibilidade com navegador mobile';
END $$;