-- =====================================================
-- MIGRATION: Setup Sistema Admin
-- =====================================================
-- 1. Criar tabela de logs de admin
CREATE TABLE IF NOT EXISTS admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tool TEXT NOT NULL,
    params JSONB,
    result JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    -- Índices para performance
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Índice para buscar logs por usuário
CREATE INDEX IF NOT EXISTS idx_admin_logs_user_id ON admin_logs(user_id);
-- Índice para buscar logs por data
CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON admin_logs(timestamp DESC);
-- 2. Adicionar campo role na tabela profiles (se não existir)
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
        AND column_name = 'role'
) THEN
ALTER TABLE profiles
ADD COLUMN role TEXT DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN', 'SUPER_ADMIN'));
END IF;
END $$;
-- 3. Criar RPC para executar SQL (apenas para admin)
CREATE OR REPLACE FUNCTION execute_sql(query TEXT) RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE result JSONB;
BEGIN -- Verificar se usuário é admin
IF (
    SELECT role
    FROM profiles
    WHERE id = auth.uid()
) NOT IN ('ADMIN', 'SUPER_ADMIN') THEN RAISE EXCEPTION 'Forbidden: Admin access required';
END IF;
-- Apenas permitir SELECT
IF query !~* '^\\s*(SELECT|EXPLAIN|WITH)' THEN RAISE EXCEPTION 'Only SELECT queries are allowed';
END IF;
-- Executar query e retornar como JSON
EXECUTE 'SELECT jsonb_agg(row_to_json(t)) FROM (' || query || ') t' INTO result;
RETURN result;
END;
$$;
-- 4. Políticas RLS para admin_logs
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;
-- Apenas admins podem ver logs
CREATE POLICY "Admins can view all logs" ON admin_logs FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE id = auth.uid()
                AND role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );
-- Sistema pode inserir logs
CREATE POLICY "System can insert logs" ON admin_logs FOR
INSERT WITH CHECK (true);
-- 5. Atualizar seu usuário para ADMIN
-- IMPORTANTE: Substitua 'SEU_USER_ID' pelo seu ID real
-- Você pode ver seu ID em: SELECT id, email FROM auth.users;
-- UPDATE profiles 
-- SET role = 'SUPER_ADMIN' 
-- WHERE id = 'SEU_USER_ID';
-- =====================================================
-- VERIFICAÇÃO
-- =====================================================
-- Ver estrutura da tabela admin_logs
SELECT column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_logs'
ORDER BY ordinal_position;
-- Ver usuários com roles
SELECT u.id,
    u.email,
    p.role
FROM auth.users u
    LEFT JOIN profiles p ON p.id = u.id
ORDER BY p.role DESC NULLS LAST;