-- ===============================================
-- FIX URGENTE: Criar registros User faltantes
-- ===============================================

-- 1. VERIFICAR usuários no Auth que NÃO estão na tabela User
SELECT 
    au.id,
    au.email,
    au.created_at,
    u.id as user_table_id
FROM auth.users au
LEFT JOIN "User" u ON u.id = au.id::text
WHERE u.id IS NULL;

-- 2. CRIAR registros faltantes na tabela User
INSERT INTO "User" (
    id,
    email,
    name,
    "emailVerified",
    "authProvider",
    plan,
    role,
    "isActive",
    "isSuperAdmin",
    "createdAt",
    "updatedAt"
)
SELECT 
    au.id::text,
    au.email,
    COALESCE(au.raw_user_meta_data->>'name', SPLIT_PART(au.email, '@', 1)),
    CASE WHEN au.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    'EMAIL',
    'FREE',
    'MEMBER',
    true,
    false, -- Por padrão não é super admin
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN "User" u ON u.id = au.id::text
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- 3. VERIFICAR se agora todos os usuários Auth têm registro na tabela User
SELECT 
    au.id,
    au.email,
    u.id as user_exists,
    u."isSuperAdmin"
FROM auth.users au
LEFT JOIN "User" u ON u.id = au.id::text
ORDER BY au.created_at DESC;

-- 4. AJUSTAR RLS para permitir que usuários vejam seus próprios dados
DROP POLICY IF EXISTS "user_select_own" ON "User";

CREATE POLICY "user_select_own" ON "User"
FOR SELECT
TO authenticated
USING (
    -- Usuário pode ver seus próprios dados
    id = (SELECT auth.uid())::text
);

-- 5. Habilitar RLS (se não estiver habilitado)
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- 6. VERIFICAR políticas RLS da tabela User
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'User';

-- ===============================================
-- OPCIONAL: Tornar um usuário específico SuperAdmin
-- ===============================================
-- Descomente e substitua o email se quiser criar um super admin

/*
-- Criar tabela SuperAdmin se não existir
CREATE TABLE IF NOT EXISTS "SuperAdmin" (
    id TEXT PRIMARY KEY REFERENCES "User"(id) ON DELETE CASCADE,
    "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE "SuperAdmin" ENABLE ROW LEVEL SECURITY;

-- Política para ver apenas próprio registro
DROP POLICY IF EXISTS "superadmin_select_own" ON "SuperAdmin";
CREATE POLICY "superadmin_select_own" ON "SuperAdmin"
FOR SELECT
TO authenticated
USING (id = (SELECT auth.uid())::text);

-- Adicionar super admin (SUBSTITUA O EMAIL)
INSERT INTO "SuperAdmin" (id, "createdAt")
SELECT id, NOW()
FROM "User"
WHERE email = 'SEU_EMAIL_AQUI@example.com' -- ⚠️ SUBSTITUA PELO SEU EMAIL
ON CONFLICT (id) DO NOTHING;

-- Atualizar flag isSuperAdmin na tabela User
UPDATE "User"
SET "isSuperAdmin" = true
WHERE email = 'SEU_EMAIL_AQUI@example.com'; -- ⚠️ SUBSTITUA PELO SEU EMAIL
*/

-- Verificar resultado final
SELECT 
    u.id,
    u.email,
    u.name,
    u."isSuperAdmin",
    u.plan,
    u."isActive",
    sa.id as is_in_superadmin_table
FROM "User" u
LEFT JOIN "SuperAdmin" sa ON sa.id = u.id
ORDER BY u."createdAt" DESC
LIMIT 10;

