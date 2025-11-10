-- =====================================================
-- FIX USER INSERT RLS POLICY
-- Permite criação de usuários durante signup
-- =====================================================

-- Remover política antiga que impede signup
DROP POLICY IF EXISTS "user_insert_own" ON "User";

-- Criar nova política que permite signup
-- Permite inserção quando:
-- 1. O ID do usuário corresponde ao auth.uid()
-- 2. Durante signup (quando auth está autenticado mas User ainda não existe)
CREATE POLICY "user_insert_during_signup"
  ON "User"
  FOR INSERT
  WITH CHECK (
    -- O ID deve corresponder ao usuário autenticado
    id = (auth.uid())::text
    -- Auth deve estar autenticado (garante que é signup legítimo)
    AND auth.uid() IS NOT NULL
  );

-- Garantir que outras políticas existem
DROP POLICY IF EXISTS "user_select_own" ON "User";
CREATE POLICY "user_select_own"
  ON "User"
  FOR SELECT
  USING (
    -- Usuário pode ver seu próprio registro
    id = (auth.uid())::text
  );

DROP POLICY IF EXISTS "user_update_own" ON "User";
CREATE POLICY "user_update_own"
  ON "User"
  FOR UPDATE
  USING (
    -- Usuário pode atualizar apenas seu próprio registro
    id = (auth.uid())::text
  )
  WITH CHECK (
    -- Garantir que não muda o ID
    id = (auth.uid())::text
  );

-- Política para Super Admins verem todos os usuários
DROP POLICY IF EXISTS "superadmin_select_all_users" ON "User";
CREATE POLICY "superadmin_select_all_users"
  ON "User"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "SuperAdmin"
      WHERE "SuperAdmin".id = (auth.uid())::text
    )
  );

-- Política para Super Admins atualizarem qualquer usuário
DROP POLICY IF EXISTS "superadmin_update_any_user" ON "User";
CREATE POLICY "superadmin_update_any_user"
  ON "User"
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM "SuperAdmin"
      WHERE "SuperAdmin".id = (auth.uid())::text
    )
  );

-- Garantir que RLS está habilitado
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
