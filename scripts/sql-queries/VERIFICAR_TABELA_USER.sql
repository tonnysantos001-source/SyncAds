-- ===============================================
-- SCRIPT: Verificar e corrigir tabela User
-- ===============================================

-- 1. Verificar estrutura da tabela User
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'User'
ORDER BY ordinal_position;

-- 2. Verificar se há usuários na tabela
SELECT 
    id,
    email,
    name,
    "isSuperAdmin",
    plan,
    "isActive",
    "createdAt"
FROM "User"
LIMIT 10;

-- 3. Verificar políticas RLS da tabela User
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'User';

-- 4. Verificar se RLS está ativado
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'User';

-- 5. Verificar tabela SuperAdmin
SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'SuperAdmin';

-- 6. Listar SuperAdmins
SELECT * FROM "SuperAdmin" LIMIT 10;

