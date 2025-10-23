-- =====================================================
-- MIGRATION: Criar Organização Global SyncAds
-- Data: 23/10/2025
-- Descrição: Simplificação - todos usuários na mesma org
-- =====================================================

-- 1. Atualizar organização existente "Minha Empresa" para ser a global
UPDATE "Organization"
SET 
  name = 'SyncAds',
  plan = 'ENTERPRISE',
  status = 'ACTIVE',
  "maxUsers" = 999999,
  "maxCampaigns" = 999999,
  "maxChatMessages" = 999999,
  "updatedAt" = now()
WHERE id = '62f38421-3ea6-44c4-a5e0-d6437a627ab5';

-- 2. Migrar usuários órfãos para a org global
UPDATE "User" 
SET "organizationId" = '62f38421-3ea6-44c4-a5e0-d6437a627ab5'
WHERE "organizationId" IS NULL;

-- 3. Garantir que todos usuários tenham role
UPDATE "User"
SET role = 'MEMBER'
WHERE role IS NULL;

-- 4. Criar função helper para pegar org global
CREATE OR REPLACE FUNCTION get_global_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT '62f38421-3ea6-44c4-a5e0-d6437a627ab5'::uuid;
$$;

-- 5. Comentário para documentação
COMMENT ON FUNCTION get_global_organization_id() IS 
'Retorna ID da organização global SyncAds. Todos usuários pertencem a esta org.';
