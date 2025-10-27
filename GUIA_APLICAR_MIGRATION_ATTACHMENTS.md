# 📋 GUIA: APLICAR MIGRATION DE ANEXOS

**Importante:** Antes de usar o upload de arquivos, é necessário criar a tabela `ChatAttachment` no Supabase.

---

## 🗄️ PASSO A PASSO

### **1. Abrir Supabase Dashboard**

Acesse: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr

### **2. Vá para SQL Editor**

No menu lateral, clique em **"SQL Editor"**

### **3. Execute o SQL**

Cole e execute o seguinte SQL:

```sql
-- Criar tabela para anexos de arquivo
CREATE TABLE IF NOT EXISTS "ChatAttachment" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "messageId" UUID NOT NULL REFERENCES "ChatMessage"(id) ON DELETE CASCADE,
  "fileName" TEXT NOT NULL,
  "fileType" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileSize" INTEGER,
  "uploadedAt" TIMESTAMP DEFAULT NOW(),
  "metadata" JSONB,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_attachment_message ON "ChatAttachment"("messageId");
CREATE INDEX IF NOT EXISTS idx_chat_attachment_created ON "ChatAttachment"("createdAt");

-- RLS Policies
ALTER TABLE "ChatAttachment" ENABLE ROW LEVEL SECURITY;

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

-- Adicionar coluna metadata ao ChatMessage
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ChatMessage' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE "ChatMessage" ADD COLUMN "metadata" JSONB;
  END IF;
END $$;
```

### **4. Criar Bucket de Storage**

1. Vá para **"Storage"** no menu
2. Clique em **"Create bucket"**
3. Nome: `chat-attachments`
4. Public bucket: **NÃO** (privado)
5. Clique em **"Create bucket"**

### **5. Configurar Permissões do Bucket**

Na página do bucket `chat-attachments`, vá em **"Policies"** e adicione:

```sql
-- Allow users to upload files
CREATE POLICY "Users can upload to chat-attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments' AND
  (select auth.uid())::text = (storage.foldername(name))[1]
);

-- Allow users to read their own files
CREATE POLICY "Users can read their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'chat-attachments' AND
  (select auth.uid())::text = (storage.foldername(name))[1]
);
```

---

## ✅ VERIFICAÇÃO

Após aplicar, verifique:
1. Tabela `ChatAttachment` criada
2. Bucket `chat-attachments` existe
3. Policies configuradas

---

**Pronto!** O upload de arquivos funcionará agora! 🎉

