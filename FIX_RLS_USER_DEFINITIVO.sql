-- ===============================================
-- FIX DEFINITIVO: RLS da tabela User
-- ===============================================

-- PROBLEMA IDENTIFICADO:
-- As políticas RLS podem estar usando auth.uid() que retorna UUID,
-- mas User.id é TEXT, causando mismatch na comparação.

-- ===== SOLUÇÃO 1: REMOVER TODAS AS POLÍTICAS ANTIGAS =====

DROP POLICY IF EXISTS "user_select_own" ON "User";
DROP POLICY IF EXISTS "user_select_authenticated" ON "User";
DROP POLICY IF EXISTS "user_insert_own" ON "User";
DROP POLICY IF EXISTS "user_update_own" ON "User";
DROP POLICY IF EXISTS "Users can view own user data" ON "User";
DROP POLICY IF EXISTS "Users can update own user data" ON "User";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "User";

-- ===== SOLUÇÃO 2: CRIAR POLÍTICAS CORRETAS =====

-- Política 1: SELECT (usuário pode ver seus próprios dados)
CREATE POLICY "user_select_own_v2" ON "User"
FOR SELECT
TO authenticated
USING (
    id = (SELECT auth.uid())::text
    OR
    -- Service role pode ver tudo
    (SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
);

-- Política 2: INSERT (permitir registro de novos usuários)
CREATE POLICY "user_insert_own_v2" ON "User"
FOR INSERT
TO authenticated
WITH CHECK (
    id = (SELECT auth.uid())::text
    OR
    -- Service role pode inserir qualquer usuário
    (SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
);

-- Política 3: UPDATE (usuário pode atualizar seus próprios dados)
CREATE POLICY "user_update_own_v2" ON "User"
FOR UPDATE
TO authenticated
USING (
    id = (SELECT auth.uid())::text
    OR
    (SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
)
WITH CHECK (
    id = (SELECT auth.uid())::text
    OR
    (SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
);

-- ===== SOLUÇÃO 3: GARANTIR QUE RLS ESTÁ HABILITADO =====

ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- ===== SOLUÇÃO 4: VERIFICAR SUPERADMIN TABLE =====

-- Criar tabela SuperAdmin se não existir
CREATE TABLE IF NOT EXISTS "SuperAdmin" (
    id TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE "SuperAdmin" ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "superadmin_select_own" ON "SuperAdmin";
DROP POLICY IF EXISTS "superadmin_select_all" ON "SuperAdmin";

-- Política para SuperAdmin: usuário pode ver se ELE é super admin
CREATE POLICY "superadmin_select_own_v2" ON "SuperAdmin"
FOR SELECT
TO authenticated
USING (
    id = (SELECT auth.uid())::text
    OR
    (SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role')
);

-- ===== VERIFICAR RESULTADO =====

-- Listar políticas aplicadas
SELECT 
    tablename,
    policyname,
    cmd,
    roles,
    CASE 
        WHEN qual IS NOT NULL THEN LEFT(qual, 100)
        ELSE 'N/A'
    END as using_clause
FROM pg_policies 
WHERE tablename IN ('User', 'SuperAdmin')
ORDER BY tablename, policyname;

-- Contar usuários
SELECT 
    'Total Users' as metric,
    COUNT(*) as count
FROM "User";

-- Listar usuários recentes
SELECT 
    id,
    email,
    name,
    "isSuperAdmin",
    "isActive",
    "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 5;

