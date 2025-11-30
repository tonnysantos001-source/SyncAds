-- ============================================
-- SYNCADS - LIMPEZA DE INTEGRAÇÕES
-- Remove integrações OAuth antigas (Google Ads, Meta, TikTok, etc)
-- Mantém apenas: VTEX, Nuvemshop, Shopify, WooCommerce, Loja Integrada
-- ============================================

-- IMPORTANTE: Execute este script em um ambiente de testes primeiro!
-- Crie um backup antes: pg_dump $DATABASE_URL > backup_before_cleanup.sql

BEGIN;

-- ============================================
-- 1. BACKUP DE SEGURANÇA
-- ============================================
CREATE TABLE IF NOT EXISTS integrations_backup AS
SELECT * FROM integrations;

CREATE TABLE IF NOT EXISTS pixels_backup AS
SELECT * FROM pixels;

-- ============================================
-- 2. LISTAR INTEGRAÇÕES ATUAIS
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INTEGRAÇÕES ANTES DA LIMPEZA:';
  RAISE NOTICE '========================================';
END $$;

SELECT
  platform,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active THEN 1 END) as ativas
FROM integrations
GROUP BY platform
ORDER BY total DESC;

-- ============================================
-- 3. IDENTIFICAR INTEGRAÇÕES A REMOVER
-- ============================================
DO $$
DECLARE
  removed_count INTEGER;
BEGIN
  -- Contar integrações que serão removidas
  SELECT COUNT(*) INTO removed_count
  FROM integrations
  WHERE platform NOT IN ('vtex', 'nuvemshop', 'shopify', 'woocommerce', 'loja_integrada');

  RAISE NOTICE '========================================';
  RAISE NOTICE 'INTEGRAÇÕES A REMOVER: %', removed_count;
  RAISE NOTICE '========================================';
END $$;

-- Listar detalhes das integrações que serão removidas
SELECT
  id,
  organization_id,
  platform,
  is_active,
  created_at
FROM integrations
WHERE platform NOT IN ('vtex', 'nuvemshop', 'shopify', 'woocommerce', 'loja_integrada')
ORDER BY platform, created_at;

-- ============================================
-- 4. REMOVER INTEGRAÇÕES ANTIGAS
-- ============================================

-- 4.1 Deletar integrações OAuth antigas
DELETE FROM integrations
WHERE platform IN (
  'google_ads',
  'google_analytics',
  'google_merchant_center',
  'meta_ads',
  'facebook_ads',
  'instagram_ads',
  'tiktok_ads',
  'linkedin_ads',
  'twitter_ads',
  'x_ads',
  'snapchat_ads',
  'pinterest_ads'
);

-- 4.2 Deletar integrações genéricas que não são e-commerce
DELETE FROM integrations
WHERE platform NOT IN ('vtex', 'nuvemshop', 'shopify', 'woocommerce', 'loja_integrada')
  AND platform NOT LIKE '%shop%'
  AND platform NOT LIKE '%store%'
  AND platform NOT LIKE '%ecommerce%';

-- ============================================
-- 5. LIMPAR COLUNAS OAUTH ANTIGAS
-- ============================================

-- Remover colunas OAuth se existirem
ALTER TABLE integrations DROP COLUMN IF EXISTS oauth_token CASCADE;
ALTER TABLE integrations DROP COLUMN IF EXISTS oauth_refresh_token CASCADE;
ALTER TABLE integrations DROP COLUMN IF EXISTS oauth_expires_at CASCADE;
ALTER TABLE integrations DROP COLUMN IF EXISTS oauth_token_type CASCADE;
ALTER TABLE integrations DROP COLUMN IF EXISTS oauth_scope CASCADE;

-- Remover configs específicas de plataformas antigas
ALTER TABLE integrations DROP COLUMN IF EXISTS google_ads_config CASCADE;
ALTER TABLE integrations DROP COLUMN IF EXISTS google_analytics_config CASCADE;
ALTER TABLE integrations DROP COLUMN IF EXISTS meta_ads_config CASCADE;
ALTER TABLE integrations DROP COLUMN IF EXISTS facebook_ads_config CASCADE;
ALTER TABLE integrations DROP COLUMN IF EXISTS tiktok_ads_config CASCADE;
ALTER TABLE integrations DROP COLUMN IF EXISTS linkedin_ads_config CASCADE;
ALTER TABLE integrations DROP COLUMN IF EXISTS twitter_ads_config CASCADE;

-- ============================================
-- 6. ADICIONAR/ATUALIZAR COLUNAS E-COMMERCE
-- ============================================

-- Adicionar colunas específicas para e-commerce se não existirem
ALTER TABLE integrations
  ADD COLUMN IF NOT EXISTS api_key TEXT,
  ADD COLUMN IF NOT EXISTS api_secret TEXT ENCRYPTED,
  ADD COLUMN IF NOT EXISTS store_url TEXT,
  ADD COLUMN IF NOT EXISTS store_id TEXT,
  ADD COLUMN IF NOT EXISTS store_domain TEXT,
  ADD COLUMN IF NOT EXISTS access_token TEXT ENCRYPTED,
  ADD COLUMN IF NOT EXISTS webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS sync_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_integrations_platform ON integrations(platform);
CREATE INDEX IF NOT EXISTS idx_integrations_org_platform ON integrations(organization_id, platform);
CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_integrations_sync_status ON integrations(sync_status);

-- ============================================
-- 7. LIMPAR PIXELS ANTIGOS
-- ============================================

-- Remover pixels de plataformas que não usaremos mais
DELETE FROM pixels
WHERE type IN ('GOOGLE_ADS', 'LINKEDIN', 'TWITTER', 'SNAPCHAT', 'PINTEREST');

-- Atualizar tipos de pixels remanescentes
UPDATE pixels
SET type = 'CONVERSION_TRACKING'
WHERE type IN ('FACEBOOK', 'TIKTOK');

-- Adicionar colunas úteis para pixels
ALTER TABLE pixels
  ADD COLUMN IF NOT EXISTS events_tracked JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS total_events INTEGER DEFAULT 0;

-- ============================================
-- 8. REMOVER TABELAS DE SINCRONIZAÇÃO ANTIGAS
-- ============================================

-- Tabelas de campanhas antigas
DROP TABLE IF EXISTS google_ads_campaigns CASCADE;
DROP TABLE IF EXISTS meta_ads_campaigns CASCADE;
DROP TABLE IF EXISTS facebook_ads_campaigns CASCADE;
DROP TABLE IF EXISTS tiktok_ads_campaigns CASCADE;
DROP TABLE IF EXISTS linkedin_ads_campaigns CASCADE;
DROP TABLE IF EXISTS twitter_ads_campaigns CASCADE;

-- Tabelas de métricas antigas
DROP TABLE IF EXISTS google_ads_metrics CASCADE;
DROP TABLE IF EXISTS meta_ads_metrics CASCADE;
DROP TABLE IF EXISTS facebook_ads_metrics CASCADE;
DROP TABLE IF EXISTS tiktok_ads_metrics CASCADE;

-- Tabelas de sincronização antigas
DROP TABLE IF EXISTS ads_sync_log CASCADE;
DROP TABLE IF EXISTS ads_sync_queue CASCADE;
DROP TABLE IF EXISTS oauth_tokens CASCADE;
DROP TABLE IF EXISTS oauth_refresh_tokens CASCADE;

-- ============================================
-- 9. LIMPAR POLÍTICAS RLS ANTIGAS
-- ============================================

-- Remover políticas antigas relacionadas a OAuth
DO $$
DECLARE
  policy_name TEXT;
BEGIN
  FOR policy_name IN
    SELECT policyname
    FROM pg_policies
    WHERE tablename = 'integrations'
      AND policyname LIKE '%oauth%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON integrations', policy_name);
    RAISE NOTICE 'Removida política: %', policy_name;
  END LOOP;
END $$;

-- Recriar políticas RLS simples
DROP POLICY IF EXISTS integrations_select_policy ON integrations;
DROP POLICY IF EXISTS integrations_insert_policy ON integrations;
DROP POLICY IF EXISTS integrations_update_policy ON integrations;
DROP POLICY IF EXISTS integrations_delete_policy ON integrations;

CREATE POLICY integrations_select_policy ON integrations
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY integrations_insert_policy ON integrations
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY integrations_update_policy ON integrations
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY integrations_delete_policy ON integrations
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================
-- 10. CRIAR TABELA DE LOGS DE INTEGRAÇÃO
-- ============================================

CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES integrations(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'sync', 'error', 'webhook', 'api_call'
  status TEXT NOT NULL, -- 'success', 'error', 'warning'
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_integration ON integration_logs(integration_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created ON integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status ON integration_logs(status);

-- RLS para logs
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY integration_logs_select_policy ON integration_logs
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- 11. ATUALIZAR CONSTRAINT CHECK
-- ============================================

-- Adicionar constraint para garantir apenas plataformas válidas
ALTER TABLE integrations DROP CONSTRAINT IF EXISTS integrations_platform_check;

ALTER TABLE integrations
  ADD CONSTRAINT integrations_platform_check
  CHECK (platform IN ('vtex', 'nuvemshop', 'shopify', 'woocommerce', 'loja_integrada'));

-- ============================================
-- 12. VALIDAR RESULTADOS
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'INTEGRAÇÕES APÓS LIMPEZA:';
  RAISE NOTICE '========================================';
END $$;

SELECT
  platform,
  COUNT(*) as total,
  COUNT(CASE WHEN is_active THEN 1 END) as ativas,
  COUNT(CASE WHEN sync_enabled THEN 1 END) as sync_habilitado
FROM integrations
GROUP BY platform
ORDER BY platform;

-- Verificar tabelas removidas
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND (table_name LIKE '%_ads_%' OR table_name LIKE '%oauth%');

  RAISE NOTICE '========================================';
  RAISE NOTICE 'TABELAS ANTIGAS REMANESCENTES: %', table_count;
  RAISE NOTICE '========================================';
END $$;

-- Verificar colunas
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'integrations'
ORDER BY ordinal_position;

-- ============================================
-- 13. CRIAR FUNÇÃO DE AUDITORIA
-- ============================================

CREATE OR REPLACE FUNCTION log_integration_action()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO integration_logs (
    integration_id,
    organization_id,
    action,
    status,
    message,
    metadata
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    COALESCE(NEW.organization_id, OLD.organization_id),
    TG_OP,
    'success',
    format('Integration %s: %s', TG_OP, COALESCE(NEW.platform, OLD.platform)),
    jsonb_build_object(
      'old', to_jsonb(OLD),
      'new', to_jsonb(NEW)
    )
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS integration_audit_trigger ON integrations;
CREATE TRIGGER integration_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON integrations
  FOR EACH ROW
  EXECUTE FUNCTION log_integration_action();

-- ============================================
-- 14. ESTATÍSTICAS FINAIS
-- ============================================

DO $$
DECLARE
  total_integrations INTEGER;
  active_integrations INTEGER;
  total_pixels INTEGER;
  total_logs INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_integrations FROM integrations;
  SELECT COUNT(*) INTO active_integrations FROM integrations WHERE is_active = true;
  SELECT COUNT(*) INTO total_pixels FROM pixels;
  SELECT COUNT(*) INTO total_logs FROM integration_logs;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'ESTATÍSTICAS FINAIS:';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Total de integrações: %', total_integrations;
  RAISE NOTICE 'Integrações ativas: %', active_integrations;
  RAISE NOTICE 'Total de pixels: %', total_pixels;
  RAISE NOTICE 'Total de logs: %', total_logs;
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LIMPEZA CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '========================================';
END $$;

-- ============================================
-- COMMIT OU ROLLBACK
-- ============================================

-- Se tudo estiver OK, descomente a linha abaixo:
-- COMMIT;

-- Se quiser reverter as mudanças, descomente a linha abaixo:
-- ROLLBACK;

-- IMPORTANTE: Por padrão, este script NÃO faz commit automático
-- Revise os resultados e execute manualmente COMMIT ou ROLLBACK
