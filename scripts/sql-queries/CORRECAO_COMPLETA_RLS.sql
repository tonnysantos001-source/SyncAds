-- CORRECAO_COMPLETA_RLS.sql
-- Correção abrangente para problemas de RLS em todas as tabelas relevantes

-- =====================================================
-- CHATCONVERSATION TABLE
-- =====================================================

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

-- =====================================================
-- CHATMESSAGE TABLE
-- =====================================================

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

DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON "ChatMessage";
CREATE POLICY "Users can insert messages to their conversations" ON "ChatMessage"
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can update messages in their conversations" ON "ChatMessage";
CREATE POLICY "Users can update messages in their conversations" ON "ChatMessage"
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON "ChatMessage";
CREATE POLICY "Users can delete messages from their conversations" ON "ChatMessage"
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation" 
      WHERE id = "ChatMessage"."conversationId" 
      AND "userId" = auth.uid()::text
    )
  );

-- =====================================================
-- CAMPAIGN TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own campaigns" ON "Campaign";
CREATE POLICY "Users can view their own campaigns" ON "Campaign"
  FOR SELECT 
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own campaigns" ON "Campaign";
CREATE POLICY "Users can insert their own campaigns" ON "Campaign"
  FOR INSERT 
  WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own campaigns" ON "Campaign";
CREATE POLICY "Users can update their own campaigns" ON "Campaign"
  FOR UPDATE 
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own campaigns" ON "Campaign";
CREATE POLICY "Users can delete their own campaigns" ON "Campaign"
  FOR DELETE 
  USING ("userId" = auth.uid()::text);

-- =====================================================
-- INTEGRATION TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own integrations" ON "Integration";
CREATE POLICY "Users can view their own integrations" ON "Integration"
  FOR SELECT 
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own integrations" ON "Integration";
CREATE POLICY "Users can insert their own integrations" ON "Integration"
  FOR INSERT 
  WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own integrations" ON "Integration";
CREATE POLICY "Users can update their own integrations" ON "Integration"
  FOR UPDATE 
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own integrations" ON "Integration";
CREATE POLICY "Users can delete their own integrations" ON "Integration"
  FOR DELETE 
  USING ("userId" = auth.uid()::text);

-- =====================================================
-- PRODUCT TABLE
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own products" ON "Product";
CREATE POLICY "Users can view their own products" ON "Product"
  FOR SELECT 
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can insert their own products" ON "Product";
CREATE POLICY "Users can insert their own products" ON "Product"
  FOR INSERT 
  WITH CHECK ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own products" ON "Product";
CREATE POLICY "Users can update their own products" ON "Product"
  FOR UPDATE 
  USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own products" ON "Product";
CREATE POLICY "Users can delete their own products" ON "Product"
  FOR DELETE 
  USING ("userId" = auth.uid()::text);

-- Verificação final
DO $$
BEGIN
  RAISE NOTICE '✅ Todas as políticas RLS foram atualizadas para garantir compatibilidade entre desktop e mobile';
END $$;