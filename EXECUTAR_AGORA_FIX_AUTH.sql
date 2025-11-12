-- ============================================
-- FIX DE EMERGÊNCIA: AUTENTICAÇÃO QUEBRADA
-- ============================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- https://supabase.com/dashboard/project/qniwgbdqxaslqwukekjn/sql/new
-- ============================================

BEGIN;

-- 1️⃣ DESABILITAR RLS TEMPORARIAMENTE (para diagnóstico)
ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;

-- 2️⃣ REMOVER TODAS AS POLICIES ANTIGAS QUE PODEM ESTAR CONFLITANDO
DROP POLICY IF EXISTS "Users can read their own data" ON "User";
DROP POLICY IF EXISTS "Users can update their own data" ON "User";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "User";
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON "User";
DROP POLICY IF EXISTS "Enable update for users based on id" ON "User";
DROP POLICY IF EXISTS "authenticated_users_read_own_data" ON "User";
DROP POLICY IF EXISTS "authenticated_users_update_own_data" ON "User";
DROP POLICY IF EXISTS "service_role_can_insert" ON "User";
DROP POLICY IF EXISTS "authenticated_users_insert_on_signup" ON "User";
DROP POLICY IF EXISTS "superadmin_read_all" ON "User";

-- 3️⃣ REABILITAR RLS
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- 4️⃣ CRIAR POLICIES CORRETAS E SIMPLES

-- Policy: Usuários autenticados podem ler seus próprios dados
CREATE POLICY "user_read_own_data" ON "User"
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id
    OR
    EXISTS (SELECT 1 FROM "SuperAdmin" WHERE "SuperAdmin".id = auth.uid())
  );

-- Policy: Usuários autenticados podem atualizar seus próprios dados
CREATE POLICY "user_update_own_data" ON "User"
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Permitir INSERT durante o registro (quando auth.uid() = id)
CREATE POLICY "user_insert_on_signup" ON "User"
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy: Service role pode fazer tudo (necessário para funções server-side)
CREATE POLICY "service_role_full_access" ON "User"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 5️⃣ GARANTIR PERMISSÕES CORRETAS
GRANT SELECT, INSERT, UPDATE ON "User" TO authenticated;
GRANT ALL ON "User" TO service_role;

-- 6️⃣ VERIFICAR CONFIGURAÇÃO DO SUPABASE AUTH
-- Se você estiver usando JWT, certifique-se de que auth.uid() funciona
-- Teste com: SELECT auth.uid();

-- 7️⃣ LOG DE SUCESSO
DO $$
BEGIN
  RAISE NOTICE '✅ RLS Policies corrigidas com sucesso!';
  RAISE NOTICE '✅ Permissões atualizadas!';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Limpe o cache do navegador (Ctrl+Shift+Delete)';
  RAISE NOTICE '2. Tente fazer login novamente';
  RAISE NOTICE '3. Se ainda não funcionar, execute: SELECT * FROM "User" WHERE id = auth.uid();';
END $$;

COMMIT;

-- ============================================
-- SCRIPT DE TESTE (Execute separadamente após o FIX)
-- ============================================

-- Teste 1: Verificar se você está autenticado
SELECT
  auth.uid() as seu_user_id,
  auth.jwt() as seu_token;

-- Teste 2: Verificar se consegue ler sua própria linha na tabela User
SELECT
  id,
  email,
  name,
  "isSuperAdmin"
FROM "User"
WHERE id = auth.uid();

-- Teste 3: Listar todas as policies ativas
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'User'
ORDER BY policyname;

-- Teste 4: Verificar se RLS está habilitado
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'User';
