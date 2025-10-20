-- Fix RLS policies for User table to allow registration
-- Problema: Novos usuários não conseguem se registrar porque o INSERT é bloqueado

-- Drop existing INSERT policy if exists
DROP POLICY IF EXISTS "Users can insert their own profile" ON "User";
DROP POLICY IF EXISTS "Allow user registration" ON "User";

-- Create policy that allows INSERT during registration
-- Permite INSERT se o ID do novo usuário corresponde ao auth.uid() atual
CREATE POLICY "Allow user registration" ON "User"
  FOR INSERT 
  WITH CHECK (
    -- Permite se o ID corresponde ao usuário autenticado (recém-criado)
    -- Cast auth.uid() to TEXT para comparar com id
    id = (SELECT auth.uid())::TEXT
    OR
    -- OU se é um super admin fazendo a operação
    is_super_admin()
  );

-- Comentário explicativo
COMMENT ON POLICY "Allow user registration" ON "User" IS 
  'Permite que usuários recém-registrados criem seu perfil na tabela User. O ID deve corresponder ao auth.uid() do usuário autenticado.';
