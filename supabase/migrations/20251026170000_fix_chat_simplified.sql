-- ============================================================================
-- FIX: SIMPLIFICAR CHAT CONVERSATIONS (SEM ORGANIZAÇÃO OBRIGATÓRIA)
-- ============================================================================
-- Data: 25/10/2025
-- Prioridade: CRÍTICA
-- Problema: RLS policies exigem organizationId, mas sistema simplificado
-- Solução: Remover exigência de organizationId nas policies
-- ============================================================================

-- ============================================================================
-- 1. REMOVER ORGANIZATIONID OBRIGATÓRIO DAS RLS POLICIES
-- ============================================================================

-- ChatConversation: SIMPLIFICAR SELECT (sem organizationId)
DROP POLICY IF EXISTS "conversation_select" ON "ChatConversation";
CREATE POLICY "conversation_select" ON "ChatConversation"
  FOR SELECT 
  USING ((select auth.uid())::text = "userId");

-- ChatConversation: INSERT já está correto (só verifica userId)
-- Manter como está:
-- CREATE POLICY "conversation_insert" ON "ChatConversation"
--   FOR INSERT WITH CHECK ((select auth.uid())::text = "userId");

-- ChatConversation: UPDATE já está correto
-- ChatConversation: DELETE já está correto

-- ============================================================================
-- 2. REMOVER INDEX DE ORGANIZATION (OPCIONAL)
-- ============================================================================
-- Manter o índice, mas não é mais obrigatório ter organizationId

-- ============================================================================
-- 3. ATUALIZAR SCHEMA (OPCIONAL - SE PRECISAR)
-- ============================================================================
-- ALTER TABLE "ChatConversation" 
--   ALTER COLUMN "organizationId" DROP NOT NULL;

-- ============================================================================
-- MIGRATION CONCLUÍDA
-- ============================================================================
