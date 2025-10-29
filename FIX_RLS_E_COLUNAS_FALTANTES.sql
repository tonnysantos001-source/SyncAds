-- ===============================================
-- FIX: RLS + Adicionar colunas faltantes
-- ===============================================

-- PASSO 1: VERIFICAR estrutura atual da tabela User
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- PASSO 2: ADICIONAR coluna isSuperAdmin se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'User' AND column_name = 'isSuperAdmin'
    ) THEN
        ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
    END IF;
END $$;

-- PASSO 3: REMOVER TODAS AS POLÍTICAS RLS ANTIGAS
DROP POLICY IF EXISTS "user_select_own" ON "User";
DROP POLICY IF EXISTS "user_select_own_v2" ON "User";
DROP POLICY IF EXISTS "user_select_authenticated" ON "User";
DROP POLICY IF EXISTS "user_insert_own" ON "User";
DROP POLICY IF EXISTS "user_insert_own_v2" ON "User";
DROP POLICY IF EXISTS "user_update_own" ON "User";
DROP POLICY IF EXISTS "user_update_own_v2" ON "User";
DROP POLICY IF EXISTS "Users can view own user data" ON "User";
DROP POLICY IF EXISTS "Users can update own user data" ON "User";
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON "User";

-- PASSO 4: CRIAR POLÍTICAS RLS CORRETAS

-- Política 1: SELECT (usuário pode ver seus próprios dados)
CREATE POLICY "user_select_own_final" ON "User"
FOR SELECT
TO authenticated
USING (
    id = (SELECT auth.uid())::text
);

-- Política 2: INSERT (permitir registro de novos usuários)
CREATE POLICY "user_insert_own_final" ON "User"
FOR INSERT
TO authenticated
WITH CHECK (
    id = (SELECT auth.uid())::text
);

-- Política 3: UPDATE (usuário pode atualizar seus próprios dados)
CREATE POLICY "user_update_own_final" ON "User"
FOR UPDATE
TO authenticated
USING (id = (SELECT auth.uid())::text)
WITH CHECK (id = (SELECT auth.uid())::text);

-- PASSO 5: GARANTIR QUE RLS ESTÁ HABILITADO
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- PASSO 6: CONFIGURAR TABELA SUPERADMIN

-- Criar tabela SuperAdmin se não existir
CREATE TABLE IF NOT EXISTS "SuperAdmin" (
    id TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE "SuperAdmin" ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas
DROP POLICY IF EXISTS "superadmin_select_own" ON "SuperAdmin";
DROP POLICY IF EXISTS "superadmin_select_own_v2" ON "SuperAdmin";
DROP POLICY IF EXISTS "superadmin_select_all" ON "SuperAdmin";

-- Criar política correta
CREATE POLICY "superadmin_select_final" ON "SuperAdmin"
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid())::text);

-- PASSO 7: SINCRONIZAR isSuperAdmin baseado na tabela SuperAdmin
UPDATE "User" u
SET "isSuperAdmin" = true
WHERE EXISTS (
    SELECT 1 FROM "SuperAdmin" sa 
    WHERE sa.id = u.id
);

UPDATE "User" u
SET "isSuperAdmin" = false
WHERE NOT EXISTS (
    SELECT 1 FROM "SuperAdmin" sa 
    WHERE sa.id = u.id
);

-- PASSO 8: VERIFICAR RESULTADO

-- Listar políticas aplicadas
SELECT 
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename IN ('User', 'SuperAdmin')
ORDER BY tablename, policyname;

-- Contar usuários
SELECT 
    'Total Users' as metric,
    COUNT(*) as count
FROM "User";

-- Listar usuários recentes (somente colunas que CERTAMENTE existem)
SELECT 
    id,
    email,
    name,
    "isActive",
    "createdAt"
FROM "User"
ORDER BY "createdAt" DESC
LIMIT 10;

-- Se isSuperAdmin existe, mostrar também
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'User' AND column_name = 'isSuperAdmin'
  ) THEN
    RAISE NOTICE 'Listando usuários COM isSuperAdmin:';
    PERFORM id, email, name, "isSuperAdmin" FROM "User" LIMIT 10;
  END IF;
END $$;

-- Verificar estrutura final
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'User'
ORDER BY ordinal_position;

