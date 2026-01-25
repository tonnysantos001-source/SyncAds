-- ============================================
-- CORREÇÃO URGENTE: RLS POLICIES BLOQUEANDO ACESSO
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- ============================================
-- PASSO 1: Verificar quantas IAs existem (ignorando RLS)
SELECT COUNT(*) as total,
    provider,
    "isActive"
FROM "GlobalAiConnection"
GROUP BY provider,
    "isActive";
-- PASSO 2: Ver as policies atuais
SELECT *
FROM pg_policies
WHERE tablename = 'GlobalAiConnection';
-- PASSO 3: DESABILITAR RLS TEMPORARIAMENTE para ver os dados
-- ALTER TABLE "GlobalAiConnection" DISABLE ROW LEVEL SECURITY;
-- PASSO 4: CRIAR POLICY PARA PERMITIR LEITURA PÚBLICA DAS IAs GLOBAIS
-- As IAs globais devem ser acessíveis por qualquer usuário autenticado
-- Primeiro, remover policies antigas que podem estar bloqueando
DROP POLICY IF EXISTS "GlobalAiConnection_select" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "GlobalAiConnection_read" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "allow_read_global_ai" ON "GlobalAiConnection";
DROP POLICY IF EXISTS "enable_read_for_authenticated" ON "GlobalAiConnection";
-- Criar nova policy permitindo leitura para todos (service role e authenticated)
CREATE POLICY "allow_read_global_ai_connections" ON "GlobalAiConnection" FOR
SELECT TO authenticated,
    anon,
    service_role USING (true);
-- PASSO 5: Garantir que RLS está ativo mas com a policy correta
ALTER TABLE "GlobalAiConnection" ENABLE ROW LEVEL SECURITY;
-- PASSO 6: FORÇAR BYPASS RLS para service role (importante!)
ALTER TABLE "GlobalAiConnection" FORCE ROW LEVEL SECURITY;
-- Conceder permissões explícitas
GRANT SELECT ON "GlobalAiConnection" TO authenticated;
GRANT SELECT ON "GlobalAiConnection" TO anon;
GRANT ALL ON "GlobalAiConnection" TO service_role;
-- PASSO 7: VERIFICAR - Agora deve mostrar as 5 IAs
SELECT name,
    provider,
    LEFT("apiKey", 15) || '...' as "key_preview",
    "aiRole",
    "isActive"
FROM "GlobalAiConnection"
WHERE provider = 'GROQ'
ORDER BY name;
-- ============================================
-- RESULTADO ESPERADO após executar:
-- Você deve ver 5 registros:
-- 1. Grok Backup - EXECUTOR - true
-- 2. Grok Executor - EXECUTOR - true
-- 3. Grok Navegador - NAVIGATOR - true
-- 4. Grok Thinker - REASONING - true
-- 5. Groq Chat-Stream - EXECUTOR - true
-- ============================================