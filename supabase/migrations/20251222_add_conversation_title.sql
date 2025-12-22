-- =====================================================
-- MIGRATION: Adicionar campo title em ChatConversation
-- =====================================================
-- 1. Adicionar campo title
ALTER TABLE "ChatConversation"
ADD COLUMN IF NOT EXISTS title TEXT;
-- 2. Gerar títulos automáticos para conversas existentes
-- Usando a primeira mensagem do usuário (até 50 caracteres)
UPDATE "ChatConversation" c
SET title = SUBSTRING(COALESCE(m.content, 'Nova conversa'), 1, 50)
FROM (
        SELECT DISTINCT ON ("conversationId") "conversationId",
            content
        FROM "ChatMessage"
        WHERE role = 'USER'
        ORDER BY "conversationId",
            "createdAt" ASC
    ) m
WHERE c.id = m."conversationId"
    AND c.title IS NULL;
-- 3. Marcar conversas sem mensagens como "Nova conversa"
UPDATE "ChatConversation"
SET title = 'Nova conversa'
WHERE title IS NULL;
-- 4. Criar função para auto-gerar título ao criar primeira mensagem
CREATE OR REPLACE FUNCTION auto_generate_conversation_title() RETURNS TRIGGER AS $$ BEGIN -- Se é a primeira mensagem de usuário da conversa
    IF NEW.role = 'USER'
    AND NOT EXISTS (
        SELECT 1
        FROM "ChatMessage"
        WHERE "conversationId" = NEW."conversationId"
            AND role = 'USER'
            AND id != NEW.id
    ) THEN -- Atualizar título da conversa
UPDATE "ChatConversation"
SET title = SUBSTRING(NEW.content, 1, 50)
WHERE id = NEW."conversationId";
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 5. Criar trigger
DROP TRIGGER IF EXISTS trigger_auto_generate_title ON "ChatMessage";
CREATE TRIGGER trigger_auto_generate_title
AFTER
INSERT ON "ChatMessage" FOR EACH ROW EXECUTE FUNCTION auto_generate_conversation_title();
-- 6. Verificação
SELECT id,
    title,
    context,
    "createdAt"
FROM "ChatConversation"
ORDER BY "createdAt" DESC
LIMIT 10;