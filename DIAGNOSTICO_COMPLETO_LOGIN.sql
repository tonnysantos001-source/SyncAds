-- ===============================================
-- DIAGNÓSTICO COMPLETO DO PROBLEMA DE LOGIN
-- ===============================================

-- 1. LISTAR TODOS OS USUÁRIOS (auth.users)
SELECT 
    'AUTH TABLE' as source,
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. LISTAR TODOS OS USUÁRIOS (User table)
SELECT 
    'USER TABLE' as source,
    id,
    email,
    name,
    "isSuperAdmin",
    "isActive",
    "createdAt"
FROM "User"
ORDER BY "createdAt" DESC;

-- 3. COMPARAR: Usuários que existem em Auth mas não em User
SELECT 
    'MISSING IN USER TABLE' as issue,
    au.id,
    au.email,
    au.created_at
FROM auth.users au
LEFT JOIN "User" u ON u.id = au.id::text
WHERE u.id IS NULL;

-- 4. VERIFICAR TIPOS DE DADOS (pode estar causando problema)
SELECT 
    table_name,
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'User' AND column_name = 'id';

-- 5. VERIFICAR RLS STATUS
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('User', 'SuperAdmin');

-- 6. LISTAR TODAS AS POLÍTICAS RLS DA TABELA USER
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check
FROM pg_policies 
WHERE tablename = 'User'
ORDER BY policyname;

-- 7. TESTAR SE auth.uid() FUNCIONA (simular usuário logado)
-- Isso mostra qual seria o ID retornado para comparação
SELECT 
    'CURRENT AUTH UID' as info,
    auth.uid() as current_user_id,
    (auth.uid())::text as current_user_id_as_text;

-- 8. VERIFICAR SE HÁ MATCH ENTRE auth.uid() e User.id
-- (Este SELECT só funciona quando você está logado, então pode retornar null aqui no editor)
SELECT 
    u.id,
    u.email,
    u.name,
    (SELECT auth.uid())::text as current_auth_uid,
    CASE 
        WHEN u.id = (SELECT auth.uid())::text THEN 'MATCH ✅'
        ELSE 'NO MATCH ❌'
    END as id_comparison
FROM "User" u;

-- 9. VERIFICAR SE O PROBLEMA É RLS: Tentar query SEM filtro
-- (Isso só funciona se RLS permitir ou se você for service_role)
SET ROLE postgres; -- Tentar como postgres (pode falhar se não tiver permissão)
SELECT COUNT(*) as total_users_without_rls FROM "User";
RESET ROLE;

-- 10. VERIFICAR FUNÇÃO is_service_role()
SELECT 
    proname as function_name,
    prosrc as function_source
FROM pg_proc 
WHERE proname = 'is_service_role';

