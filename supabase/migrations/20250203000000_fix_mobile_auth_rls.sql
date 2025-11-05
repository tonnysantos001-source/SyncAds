-- =====================================================
-- MIGRATION: Fix Mobile Auth + RLS Complete
-- Data: 03 de Fevereiro de 2025
-- Prioridade: CRÍTICA
-- Descrição: Corrige autenticação mobile e RLS policies
-- =====================================================

BEGIN;

-- =====================================================
-- FUNÇÃO AUXILIAR: Pegar User ID de forma segura
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_id()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(
    (SELECT auth.uid()::text),
    current_setting('request.jwt.claims', true)::json->>'sub'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- DESABILITAR RLS TEMPORARIAMENTE PARA LIMPEZA
-- =====================================================

ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatConversation" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" DISABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- LIMPAR TODAS AS POLICIES ANTIGAS
-- =====================================================

-- User policies
DROP POLICY IF EXISTS "Users can view their own profile" ON "User";
DROP POLICY IF EXISTS "Users can update their own profile" ON "User";
DROP POLICY IF EXISTS "Users can insert their own profile" ON "User";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "User";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "User";
DROP POLICY IF EXISTS "Enable update for users based on id" ON "User";

-- ChatConversation policies
DROP POLICY IF EXISTS "Users can view their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can insert their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can update their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Users can delete their own conversations" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable update for users based on userId" ON "ChatConversation";
DROP POLICY IF EXISTS "Enable delete for users based on userId" ON "ChatConversation";

-- ChatMessage policies
DROP POLICY IF EXISTS "Users can view messages from their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can insert messages to their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON "ChatMessage";
DROP POLICY IF EXISTS "Users can delete messages from their conversations" ON "ChatMessage";

-- Integration policies
DROP POLICY IF EXISTS "Users can view their own integrations" ON "Integration";
DROP POLICY IF EXISTS "Users can insert their own integrations" ON "Integration";
DROP POLICY IF EXISTS "Users can update their own integrations" ON "Integration";
DROP POLICY IF EXISTS "Users can delete their own integrations" ON "Integration";

-- Campaign policies
DROP POLICY IF EXISTS "Users can view their own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can insert their own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can update their own campaigns" ON "Campaign";
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON "Campaign";

-- ApiKey policies
DROP POLICY IF EXISTS "Users can view their own API keys" ON "ApiKey";
DROP POLICY IF EXISTS "Users can insert their own API keys" ON "ApiKey";
DROP POLICY IF EXISTS "Users can update their own API keys" ON "ApiKey";
DROP POLICY IF EXISTS "Users can delete their own API keys" ON "ApiKey";

-- Product policies
DROP POLICY IF EXISTS "Users can view their own products" ON "Product";
DROP POLICY IF EXISTS "Users can insert their own products" ON "Product";
DROP POLICY IF EXISTS "Users can update their own products" ON "Product";
DROP POLICY IF EXISTS "Users can delete their own products" ON "Product";

-- Customer policies
DROP POLICY IF EXISTS "Users can view their own customers" ON "Customer";
DROP POLICY IF EXISTS "Users can insert their own customers" ON "Customer";
DROP POLICY IF EXISTS "Users can update their own customers" ON "Customer";

-- Order policies
DROP POLICY IF EXISTS "Users can view their own orders" ON "Order";
DROP POLICY IF EXISTS "Users can view orders without auth" ON "Order";
DROP POLICY IF EXISTS "Public can view orders" ON "Order";
DROP POLICY IF EXISTS "Users can insert orders" ON "Order";
DROP POLICY IF EXISTS "Users can update their own orders" ON "Order";

-- =====================================================
-- REABILITAR RLS
-- =====================================================

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatConversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ChatMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Integration" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Campaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ApiKey" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Customer" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USER TABLE - POLICIES ROBUSTAS
-- =====================================================

CREATE POLICY "user_select_own"
  ON "User"
  FOR SELECT
  USING (
    id = get_user_id() OR
    id = (auth.uid())::text
  );

CREATE POLICY "user_insert_own"
  ON "User"
  FOR INSERT
  WITH CHECK (
    id = get_user_id() OR
    id = (auth.uid())::text
  );

CREATE POLICY "user_update_own"
  ON "User"
  FOR UPDATE
  USING (
    id = get_user_id() OR
    id = (auth.uid())::text
  );

-- =====================================================
-- CHATCONVERSATION TABLE - CRÍTICO PARA MOBILE
-- =====================================================

CREATE POLICY "chat_conversation_select_own"
  ON "ChatConversation"
  FOR SELECT
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "chat_conversation_insert_own"
  ON "ChatConversation"
  FOR INSERT
  WITH CHECK (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "chat_conversation_update_own"
  ON "ChatConversation"
  FOR UPDATE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "chat_conversation_delete_own"
  ON "ChatConversation"
  FOR DELETE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

-- =====================================================
-- CHATMESSAGE TABLE - RELACIONADO COM CONVERSATION
-- =====================================================

CREATE POLICY "chat_message_select_own"
  ON "ChatMessage"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation"
      WHERE id = "ChatMessage"."conversationId"
      AND (
        "userId" = get_user_id() OR
        "userId" = (auth.uid())::text
      )
    )
  );

CREATE POLICY "chat_message_insert_own"
  ON "ChatMessage"
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatConversation"
      WHERE id = "ChatMessage"."conversationId"
      AND (
        "userId" = get_user_id() OR
        "userId" = (auth.uid())::text
      )
    )
  );

CREATE POLICY "chat_message_update_own"
  ON "ChatMessage"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation"
      WHERE id = "ChatMessage"."conversationId"
      AND (
        "userId" = get_user_id() OR
        "userId" = (auth.uid())::text
      )
    )
  );

CREATE POLICY "chat_message_delete_own"
  ON "ChatMessage"
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM "ChatConversation"
      WHERE id = "ChatMessage"."conversationId"
      AND (
        "userId" = get_user_id() OR
        "userId" = (auth.uid())::text
      )
    )
  );

-- =====================================================
-- INTEGRATION TABLE - SHOPIFY E OUTRAS
-- =====================================================

CREATE POLICY "integration_select_own"
  ON "Integration"
  FOR SELECT
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "integration_insert_own"
  ON "Integration"
  FOR INSERT
  WITH CHECK (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "integration_update_own"
  ON "Integration"
  FOR UPDATE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "integration_delete_own"
  ON "Integration"
  FOR DELETE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

-- =====================================================
-- CAMPAIGN TABLE
-- =====================================================

CREATE POLICY "campaign_select_own"
  ON "Campaign"
  FOR SELECT
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "campaign_insert_own"
  ON "Campaign"
  FOR INSERT
  WITH CHECK (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "campaign_update_own"
  ON "Campaign"
  FOR UPDATE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "campaign_delete_own"
  ON "Campaign"
  FOR DELETE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

-- =====================================================
-- APIKEY TABLE
-- =====================================================

CREATE POLICY "apikey_select_own"
  ON "ApiKey"
  FOR SELECT
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "apikey_insert_own"
  ON "ApiKey"
  FOR INSERT
  WITH CHECK (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "apikey_update_own"
  ON "ApiKey"
  FOR UPDATE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "apikey_delete_own"
  ON "ApiKey"
  FOR DELETE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

-- =====================================================
-- PRODUCT TABLE
-- =====================================================

CREATE POLICY "product_select_own"
  ON "Product"
  FOR SELECT
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "product_insert_own"
  ON "Product"
  FOR INSERT
  WITH CHECK (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "product_update_own"
  ON "Product"
  FOR UPDATE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "product_delete_own"
  ON "Product"
  FOR DELETE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

-- =====================================================
-- CUSTOMER TABLE
-- =====================================================

CREATE POLICY "customer_select_own"
  ON "Customer"
  FOR SELECT
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "customer_insert_own"
  ON "Customer"
  FOR INSERT
  WITH CHECK (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

CREATE POLICY "customer_update_own"
  ON "Customer"
  FOR UPDATE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

-- =====================================================
-- ORDER TABLE - ACESSO PÚBLICO PARA CHECKOUT
-- =====================================================

CREATE POLICY "order_select_public"
  ON "Order"
  FOR SELECT
  USING (true); -- Público para checkout funcionar

CREATE POLICY "order_insert_public"
  ON "Order"
  FOR INSERT
  WITH CHECK (true); -- Público para checkout criar pedidos

CREATE POLICY "order_update_own"
  ON "Order"
  FOR UPDATE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text OR
    "userId" IS NULL -- Permite atualizar pedidos sem user (checkout público)
  );

CREATE POLICY "order_delete_own"
  ON "Order"
  FOR DELETE
  USING (
    "userId" = get_user_id() OR
    "userId" = (auth.uid())::text
  );

-- =====================================================
-- STORAGE BUCKETS - GARANTIR ACESSO MOBILE
-- =====================================================

-- Chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  true,
  52428800, -- 50MB
  ARRAY['image/*', 'application/pdf', 'text/*', 'audio/*', 'video/*']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/*', 'application/pdf', 'text/*', 'audio/*', 'video/*'];

-- Product images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB
  ARRAY['image/*']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/*'];

-- =====================================================
-- STORAGE POLICIES - MOBILE FRIENDLY
-- =====================================================

DROP POLICY IF EXISTS "Allow public read" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload product images" ON storage.objects;

-- Leitura pública para todos os buckets
CREATE POLICY "public_read_all"
  ON storage.objects
  FOR SELECT
  USING (true);

-- Upload para usuários autenticados
CREATE POLICY "authenticated_upload_all"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id IN ('chat-attachments', 'product-images') AND
    (
      get_user_id() IS NOT NULL OR
      (auth.uid())::text IS NOT NULL
    )
  );

-- Update para próprios arquivos
CREATE POLICY "authenticated_update_own"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id IN ('chat-attachments', 'product-images') AND
    (
      (storage.foldername(name))[1] = get_user_id() OR
      (storage.foldername(name))[1] = (auth.uid())::text
    )
  );

-- Delete para próprios arquivos
CREATE POLICY "authenticated_delete_own"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id IN ('chat-attachments', 'product-images') AND
    (
      (storage.foldername(name))[1] = get_user_id() OR
      (storage.foldername(name))[1] = (auth.uid())::text
    )
  );

-- =====================================================
-- ÍNDICES PARA PERFORMANCE MOBILE
-- =====================================================

-- ChatConversation
CREATE INDEX IF NOT EXISTS idx_chat_conversation_userid_mobile
  ON "ChatConversation"("userId");

CREATE INDEX IF NOT EXISTS idx_chat_conversation_createdat
  ON "ChatConversation"("createdAt" DESC);

-- ChatMessage
CREATE INDEX IF NOT EXISTS idx_chat_message_conversationid_mobile
  ON "ChatMessage"("conversationId");

CREATE INDEX IF NOT EXISTS idx_chat_message_createdat
  ON "ChatMessage"("createdAt" DESC);

-- Integration
CREATE INDEX IF NOT EXISTS idx_integration_userid_mobile
  ON "Integration"("userId");

CREATE INDEX IF NOT EXISTS idx_integration_platform
  ON "Integration"("platform");

-- Product
CREATE INDEX IF NOT EXISTS idx_product_userid_mobile
  ON "Product"("userId");

-- Campaign
CREATE INDEX IF NOT EXISTS idx_campaign_userid_mobile
  ON "Campaign"("userId");

-- Customer
CREATE INDEX IF NOT EXISTS idx_customer_userid_mobile
  ON "Customer"("userId");

-- Order
CREATE INDEX IF NOT EXISTS idx_order_userid_mobile
  ON "Order"("userId");

CREATE INDEX IF NOT EXISTS idx_order_createdat
  ON "Order"("createdAt" DESC);

-- =====================================================
-- FUNÇÃO DE DEBUG PARA TESTAR AUTH
-- =====================================================

CREATE OR REPLACE FUNCTION debug_auth_info()
RETURNS TABLE (
  auth_uid text,
  user_id_func text,
  jwt_claims json
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (auth.uid())::text as auth_uid,
    get_user_id() as user_id_func,
    current_setting('request.jwt.claims', true)::json as jwt_claims;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- GRANTS PARA FUNÇÕES
-- =====================================================

GRANT EXECUTE ON FUNCTION get_user_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_id() TO anon;
GRANT EXECUTE ON FUNCTION debug_auth_info() TO authenticated;

COMMIT;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Migration aplicada com sucesso!';
  RAISE NOTICE '📱 RLS policies otimizadas para mobile';
  RAISE NOTICE '🔐 Storage configurado para acesso público';
  RAISE NOTICE '⚡ Índices criados para performance';
  RAISE NOTICE '';
  RAISE NOTICE 'Para testar auth no mobile, execute:';
  RAISE NOTICE 'SELECT * FROM debug_auth_info();';
END $$;
