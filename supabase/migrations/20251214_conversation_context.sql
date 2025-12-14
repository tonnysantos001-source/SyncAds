-- ==========================================
-- Add context column to ChatConversation table
-- Separates web panel from extension chats
-- ==========================================
-- Add context column
ALTER TABLE "ChatConversation"
ADD COLUMN IF NOT EXISTS context TEXT DEFAULT 'web' CHECK (context IN ('web', 'extension'));
-- Update existing conversations to 'web' context
UPDATE "ChatConversation"
SET context = 'web'
WHERE context IS NULL;
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_chatconversation_user_context ON "ChatConversation"("userId", context, "updatedAt" DESC);
-- Add comment
COMMENT ON COLUMN "ChatConversation".context IS 'Separates conversations by source: web (panel) or extension';