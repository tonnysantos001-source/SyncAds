-- =========================================================================
-- MÓDULO: ARQUITETURA GLOBAL DE INTEGRAÇÕES (SyncAds AI)
-- Tabelas: IntegrationPlugin, IntegrationCapability, IntegrationConfig, IntegrationHealth
-- =========================================================================

-- 1. Registro Geral de Plugins de Integração
CREATE TABLE IF NOT EXISTS "IntegrationPlugin" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  version TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('payment', 'logistics', 'crm', 'antifraud', 'notification')),
  logo_url TEXT,
  description TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'beta', 'deprecated', 'waiting_docs', 'private_api')),
  config_fields JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(slug, version)
);

CREATE INDEX IF NOT EXISTS idx_integration_plugin_slug_version ON "IntegrationPlugin"(slug, version);
CREATE INDEX IF NOT EXISTS idx_integration_plugin_category ON "IntegrationPlugin"(category);
CREATE INDEX IF NOT EXISTS idx_integration_plugin_status ON "IntegrationPlugin"(status);

-- Habilitar RLS para IntegrationPlugin
ALTER TABLE "IntegrationPlugin" ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para IntegrationPlugin (Leitura pública/autenticada, escrita super-admin)
CREATE POLICY "Allow public read access to IntegrationPlugin"
  ON "IntegrationPlugin" FOR SELECT
  USING (true);

-- 2. Capabilities Granulares por Plugin
CREATE TABLE IF NOT EXISTS "IntegrationCapability" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_plugin_id UUID NOT NULL REFERENCES "IntegrationPlugin"(id) ON DELETE CASCADE,
  capabilities JSONB NOT NULL, -- flags dinâmicas (ex: supportsPix, supportsSplit)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_plugin_id)
);

-- Habilitar RLS para IntegrationCapability
ALTER TABLE "IntegrationCapability" ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para IntegrationCapability
CREATE POLICY "Allow public read access to IntegrationCapability"
  ON "IntegrationCapability" FOR SELECT
  USING (true);

-- 3. Configurações por Tenant (Lojista/Usuário)
CREATE TABLE IF NOT EXISTS "IntegrationConfig" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL, -- tenant proprietário
  integration_plugin_id UUID NOT NULL REFERENCES "IntegrationPlugin"(id) ON DELETE CASCADE,
  credentials JSONB NOT NULL, -- chaves sensíveis criptografadas
  is_active BOOLEAN DEFAULT false,
  is_test_mode BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}', -- configurações de prioridades/pesos por método
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, integration_plugin_id)
);

CREATE INDEX IF NOT EXISTS idx_integration_config_user ON "IntegrationConfig"(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_config_plugin ON "IntegrationConfig"(integration_plugin_id);
CREATE INDEX IF NOT EXISTS idx_integration_config_active ON "IntegrationConfig"(is_active);

-- Habilitar RLS para IntegrationConfig
ALTER TABLE "IntegrationConfig" ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para IntegrationConfig (Leitura/escrita apenas pelo proprietário)
CREATE POLICY "Allow owners to manage their IntegrationConfig"
  ON "IntegrationConfig" FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- 4. Métricas de Saúde e Monitoramento (Latência e Uptime)
CREATE TABLE IF NOT EXISTS "IntegrationHealth" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  integration_plugin_id UUID NOT NULL REFERENCES "IntegrationPlugin"(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('online', 'offline', 'degraded')),
  latency_avg INTEGER NOT NULL,
  latency_p95 INTEGER,
  latency_p99 INTEGER,
  uptime_pct DECIMAL(5,2),
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  last_error_message TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(integration_plugin_id)
);

-- Habilitar RLS para IntegrationHealth
ALTER TABLE "IntegrationHealth" ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para IntegrationHealth (Leitura pública/autenticada)
CREATE POLICY "Allow public read access to IntegrationHealth"
  ON "IntegrationHealth" FOR SELECT
  USING (true);
