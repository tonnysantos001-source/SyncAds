-- =====================================================
-- VERIFICAR E CORRIGIR RLS POLICIES
-- Data: 26/10/2025
-- Descrição: Verifica integridade das RLS policies e corrige problemas
-- =====================================================

-- =====================================================
-- 1. VERIFICAR SE TODAS AS TABELAS TÊM RLS HABILITADO
-- =====================================================

DO $$
DECLARE
    r RECORD;
    tables_without_rls TEXT[];
BEGIN
    -- Listar tabelas sem RLS habilitado
    SELECT array_agg(tablename::text) INTO tables_without_rls
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND NOT EXISTS (
          SELECT 1 FROM pg_class c
          JOIN pg_namespace n ON c.relnamespace = n.oid
          WHERE n.nspname = 'public'
            AND c.relname = tablename
            AND c.relrowsecurity = true
      );
    
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE NOTICE '⚠️  Tabelas sem RLS: %', array_to_string(tables_without_rls, ', ');
    ELSE
        RAISE NOTICE '✅ Todas as tabelas têm RLS habilitado';
    END IF;
END $$;

-- =====================================================
-- 2. GARANTIR RLS EM TABELAS PRINCIPAIS
-- =====================================================

-- Verificar e habilitar RLS nas tabelas críticas
DO $$
BEGIN
    -- Habilitar RLS em tabelas que não têm (segurança extra)
    ALTER TABLE IF EXISTS "GlobalAiConnection" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "OrganizationAiConnection" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "RefreshToken" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "PendingInvite" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "User" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "Organization" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "ChatConversation" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "ChatMessage" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "Integration" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "Campaign" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "Subscription" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "UsageTracking" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "AiUsage" ENABLE ROW LEVEL SECURITY;
    ALTER TABLE IF EXISTS "OAuthConfig" ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE '✅ RLS habilitado em todas as tabelas críticas';
END $$;

-- =====================================================
-- 3. CRIAR POLICIES FALTANTES PARA OAuthConfig
-- =====================================================

-- OAuthConfig: Apenas super admins podem ver (configurações sensíveis)
DROP POLICY IF EXISTS "oauth_config_select" ON "OAuthConfig";
CREATE POLICY "oauth_config_select" ON "OAuthConfig"
  FOR SELECT 
  USING (is_super_admin());

DROP POLICY IF EXISTS "oauth_config_insert" ON "OAuthConfig";
CREATE POLICY "oauth_config_insert" ON "OAuthConfig"
  FOR INSERT 
  WITH CHECK (is_super_admin());

DROP POLICY IF EXISTS "oauth_config_update" ON "OAuthConfig";
CREATE POLICY "oauth_config_update" ON "OAuthConfig"
  FOR UPDATE 
  USING (is_super_admin());

DROP POLICY IF EXISTS "oauth_config_delete" ON "OAuthConfig";
CREATE POLICY "oauth_config_delete" ON "OAuthConfig"
  FOR DELETE 
  USING (is_super_admin());

-- =====================================================
-- 4. CRIAR POLICIES PARA PendingInvite (se não existir)
-- =====================================================

DO $$
BEGIN
    -- Verificar se policies existem para PendingInvite
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PendingInvite' 
        AND policyname = 'Users can view their org invites'
    ) THEN
        EXECUTE '
        CREATE POLICY "Users can view their org invites" ON "PendingInvite"
          FOR SELECT 
          USING (
            "organizationId" IN (
              SELECT "organizationId" FROM "User" 
              WHERE id = (select auth.uid())::text
            )
          );';
        RAISE NOTICE '✅ Policy criada para PendingInvite SELECT';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PendingInvite' 
        AND policyname = 'Admins can insert invites'
    ) THEN
        EXECUTE '
        CREATE POLICY "Admins can insert invites" ON "PendingInvite"
          FOR INSERT 
          WITH CHECK (
            "organizationId" IN (
              SELECT "organizationId" FROM "User" 
              WHERE id = (select auth.uid())::text
              AND role = ''ADMIN''
            )
          );';
        RAISE NOTICE '✅ Policy criada para PendingInvite INSERT';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'PendingInvite' 
        AND policyname = 'Admins can delete invites'
    ) THEN
        EXECUTE '
        CREATE POLICY "Admins can delete invites" ON "PendingInvite"
          FOR DELETE 
          USING (
            "organizationId" IN (
              SELECT "organizationId" FROM "User" 
              WHERE id = (select auth.uid())::text
              AND role = ''ADMIN''
            )
          );';
        RAISE NOTICE '✅ Policy criada para PendingInvite DELETE';
    END IF;
END $$;

-- =====================================================
-- 5. CRIAR FUNÇÃO DE AUDITORIA RLS
-- =====================================================

CREATE OR REPLACE FUNCTION audit_rls_policies()
RETURNS TABLE (
    table_name TEXT,
    policy_name TEXT,
    policy_type TEXT,
    policy_definition TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.tablename::TEXT,
        p.policyname::TEXT,
        CASE 
            WHEN p.cmd = 'r' THEN 'SELECT'
            WHEN p.cmd = 'a' THEN 'INSERT'
            WHEN p.cmd = 'w' THEN 'UPDATE'
            WHEN p.cmd = 'd' THEN 'DELETE'
            ELSE 'ALL'
        END AS policy_type,
        p.qual::TEXT AS policy_definition
    FROM pg_policies p
    WHERE p.schemaname = 'public'
    ORDER BY p.tablename, p.policyname;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 6. COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================

COMMENT ON FUNCTION audit_rls_policies() IS 'Função para auditar todas as RLS policies do schema public';
COMMENT ON POLICY "oauth_config_select" ON "OAuthConfig" IS 'Apenas super admins podem ver configurações OAuth';
COMMENT ON POLICY "oauth_config_insert" ON "OAuthConfig" IS 'Apenas super admins podem inserir configurações OAuth';
COMMENT ON POLICY "oauth_config_update" ON "OAuthConfig" IS 'Apenas super admins podem atualizar configurações OAuth';
COMMENT ON POLICY "oauth_config_delete" ON "OAuthConfig" IS 'Apenas super admins podem deletar configurações OAuth';

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE '✅ Total de RLS policies: %', policy_count;
    RAISE NOTICE '✅ Migration concluída com sucesso!';
END $$;

