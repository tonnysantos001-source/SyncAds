-- ============================================
-- CORREÇÃO URGENTE: RLS POLICIES PARA GlobalAiConnection
-- Permite que Edge Functions acessem as API keys
-- ============================================
-- Remover policies antigas que podem estar bloqueando
DROP POLICY IF EXISTS "GlobalAiConnection_select" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "GlobalAiConnection_read" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "allow_read_global_ai" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "enable_read_for_authenticated" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "allow_read_global_ai_connections" ON "GlobalAiConnection";
-- Criar policy permitindo leitura para todos os roles
CREATE POLICY "allow_read_global_ai_connections" ON "GlobalAiConnection" FOR
SELECT TO authenticated,
    anon,
    service_role USING (true);
-- Garantir que RLS está ativo
ALTER TABLE "GlobalAiConnection" ENABLE ROW LEVEL SECURITY;
-- Conceder permissões explícitas
GRANT SELECT ON "GlobalAiConnection" TO authenticated;
GRANT SELECT ON "GlobalAiConnection" TO anon;
GRANT ALL ON "GlobalAiConnection" TO service_role;