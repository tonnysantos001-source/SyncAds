-- ============================================================================
-- ADD FILE ATTACHMENTS SUPPORT TO CHAT
-- Data: 27/10/2025
-- ============================================================================

-- Criar tabela para anexos de arquivo
CREATE TABLE IF NOT EXISTS "ChatAttachment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" UUID NOT NULL REFERENCES "ChatMessage"(id) ON DELETE CASCADE,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER,
  "uploadedAt" TIMESTAMP DEFAULT NOW(),
  
  -- Metadata adicional
  "metadata" JSONB,
  
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_attachment_message ON "ChatAttachment"("messageId");
CREATE INDEX IF NOT EXISTS idx_chat_attachment_created ON "ChatAttachment"("createdAt");

-- RLS Policies
ALTER TABLE "ChatAttachment" ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attachments from their messages
CREATE POLICY "attachments_select" ON "ChatAttachment"
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatMessage" 
      WHERE id = "ChatAttachment"."messageId"
      AND EXISTS (
        SELECT 1 FROM "ChatConversation" 
        WHERE id = "ChatMessage"."conversationId" 
        AND "userId" = (select auth.uid())::text
      )
    )
  );

-- Policy: Users can insert attachments to their messages
CREATE POLICY "attachments_insert" ON "ChatAttachment"
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM "ChatMessage" 
      WHERE id = "ChatAttachment"."messageId"
      AND EXISTS (
        SELECT 1 FROM "ChatConversation" 
        WHERE id = "ChatMessage"."conversationId" 
        AND "userId" = (select auth.uid())::text
      )
    )
  );

-- Policy: Users can update their own attachments
CREATE POLICY "attachments_update" ON "ChatAttachment"
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatMessage" 
      WHERE id = "ChatAttachment"."messageId"
      AND EXISTS (
        SELECT 1 FROM "ChatConversation" 
        WHERE id = "ChatMessage"."conversationId" 
        AND "userId" = (select auth.uid())::text
      )
    )
  );

-- Policy: Users can delete their own attachments
CREATE POLICY "attachments_delete" ON "ChatAttachment"
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM "ChatMessage" 
      WHERE id = "ChatAttachment"."messageId"
      AND EXISTS (
        SELECT 1 FROM "ChatConversation" 
        WHERE id = "ChatMessage"."conversationId" 
        AND "userId" = (select auth.uid())::text
      )
    )
  );

-- Adicionar coluna metadata ao ChatMessage (caso não exista)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ChatMessage' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE "ChatMessage" ADD COLUMN "metadata" JSONB;
  END IF;
END $$;

-- Comentários
COMMENT ON TABLE "ChatAttachment" IS 'Anexos de arquivo das mensagens de chat';
COMMENT ON COLUMN "ChatAttachment"."messageId" IS 'Referência para a mensagem que contém o anexo';
COMMENT ON COLUMN "ChatAttachment"."fileUrl" IS 'URL do arquivo no Supabase Storage';
COMMENT ON COLUMN "ChatAttachment"."fileType" IS 'Tipo MIME do arquivo';
COMMENT ON COLUMN "ChatAttachment"."fileSize" IS 'Tamanho do arquivo em bytes';

