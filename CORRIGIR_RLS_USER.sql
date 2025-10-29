-- ===============================================
-- SCRIPT: Corrigir RLS da tabela User
-- ===============================================

-- 1. DESABILITAR RLS temporariamente (para verificar se esse é o problema)
-- ALTER TABLE "User" DISABLE ROW LEVEL SECURITY;

-- 2. OU criar política mais permissiva para autenticados
DROP POLICY IF EXISTS "user_select_authenticated" ON "User";

CREATE POLICY "user_select_authenticated" ON "User"
FOR SELECT
TO authenticated
USING (
  -- Usuário pode ver seus próprios dados
  id = (select auth.uid())::text
  OR
  -- Service role pode ver tudo
  EXISTS (
    SELECT 1 FROM pg_roles 
    WHERE rolname = current_user 
    AND rolname IN ('service_role', 'postgres')
  )
);

-- 3. Política para INSERT (registro)
DROP POLICY IF EXISTS "user_insert_own" ON "User";

CREATE POLICY "user_insert_own" ON "User"
FOR INSERT
TO authenticated
WITH CHECK (id = (select auth.uid())::text);

-- 4. Política para UPDATE (atualização própria)
DROP POLICY IF EXISTS "user_update_own" ON "User";

CREATE POLICY "user_update_own" ON "User"
FOR UPDATE
TO authenticated
USING (id = (select auth.uid())::text)
WITH CHECK (id = (select auth.uid())::text);

-- 5. Criar política permissiva para SuperAdmin (se a tabela existir)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'SuperAdmin'
  ) THEN
    -- Drop e recria política para SuperAdmin
    DROP POLICY IF EXISTS "superadmin_select_all" ON "SuperAdmin";
    
    CREATE POLICY "superadmin_select_all" ON "SuperAdmin"
    FOR SELECT
    TO authenticated
    USING (
      -- Usuário pode verificar se ELE MESMO é super admin
      id = (select auth.uid())::text
      OR
      -- Service role pode ver tudo
      EXISTS (
        SELECT 1 FROM pg_roles 
        WHERE rolname = current_user 
        AND rolname IN ('service_role', 'postgres')
      )
    );
  END IF;
END $$;

-- 6. Verificar políticas aplicadas
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('User', 'SuperAdmin')
ORDER BY tablename, policyname;

