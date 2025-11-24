-- ============================================================================
-- MIGRATION: AI CACHE + SOFT DELETES
-- Data: 2024-01-24
-- Descrição: Adiciona tabela de cache de IA e soft deletes em tabelas principais
-- ============================================================================

-- ============================================================================
-- PARTE 1: TABELA DE CACHE DE IA
-- ============================================================================

-- Tabela de cache de IA
CREATE TABLE IF NOT EXISTS ai_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  response TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  expires_at TIMESTAMPTZ NOT NULL,
  hits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_hits ON ai_cache(hits DESC);
CREATE INDEX IF NOT EXISTS idx_ai_cache_tags ON ai_cache USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_ai_cache_created ON ai_cache(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_ai_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_cache_updated_at ON ai_cache;
CREATE TRIGGER ai_cache_updated_at
  BEFORE UPDATE ON ai_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_cache_updated_at();

-- Função para limpar cache expirado
CREATE OR REPLACE FUNCTION clean_expired_ai_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE ai_cache IS 'Cache de respostas da IA para reduzir custos e latência';
COMMENT ON COLUMN ai_cache.key IS 'Hash SHA-256 do prompt + contexto';
COMMENT ON COLUMN ai_cache.response IS 'Resposta serializada da IA';
COMMENT ON COLUMN ai_cache.hits IS 'Número de vezes que este cache foi utilizado';
COMMENT ON COLUMN ai_cache.tags IS 'Tags para invalidação em lote (ex: user:123, org:456)';
COMMENT ON COLUMN ai_cache.expires_at IS 'Data de expiração do cache';

-- ============================================================================
-- PARTE 2: SOFT DELETES
-- ============================================================================

-- Adicionar coluna deleted_at em tabelas que não têm (se não existir)
DO $$
BEGIN
  -- chat_messages
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_chat_messages_deleted ON chat_messages(deleted_at) WHERE deleted_at IS NULL;
  END IF;

  -- conversations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE conversations ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_conversations_deleted ON conversations(deleted_at) WHERE deleted_at IS NULL;
  END IF;

  -- integrations
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'integrations' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE integrations ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_integrations_deleted ON integrations(deleted_at) WHERE deleted_at IS NULL;
  END IF;

  -- products
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'products' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE products ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_products_deleted ON products(deleted_at) WHERE deleted_at IS NULL;
  END IF;

  -- orders
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE orders ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_orders_deleted ON orders(deleted_at) WHERE deleted_at IS NULL;
  END IF;

  -- users (User table)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE "User" ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_users_deleted ON "User"(deleted_at) WHERE deleted_at IS NULL;
  END IF;

  -- organizations (Organization table)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Organization' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE "Organization" ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_organizations_deleted ON "Organization"(deleted_at) WHERE deleted_at IS NULL;
  END IF;

  -- temp_files
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'temp_files' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE temp_files ADD COLUMN deleted_at TIMESTAMPTZ;
    CREATE INDEX idx_temp_files_deleted ON temp_files(deleted_at) WHERE deleted_at IS NULL;
  END IF;

END $$;

-- ============================================================================
-- PARTE 3: AUDIT LOGS (TABELA DE AUDITORIA)
-- ============================================================================

-- Tabela de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE')),
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Particionamento por mês (para audit_logs grandes)
-- Nota: Implementar conforme necessário no futuro

-- Comentários
COMMENT ON TABLE audit_logs IS 'Log de auditoria de todas as operações críticas';
COMMENT ON COLUMN audit_logs.action IS 'Tipo de ação: INSERT, UPDATE, DELETE, SOFT_DELETE, RESTORE';
COMMENT ON COLUMN audit_logs.changed_fields IS 'Lista de campos que foram modificados';
COMMENT ON COLUMN audit_logs.old_data IS 'Dados antes da modificação (apenas para UPDATE/DELETE)';
COMMENT ON COLUMN audit_logs.new_data IS 'Dados após a modificação (apenas para INSERT/UPDATE)';

-- ============================================================================
-- PARTE 4: FUNÇÕES AUXILIARES
-- ============================================================================

-- Função para soft delete
CREATE OR REPLACE FUNCTION soft_delete(
  p_table_name TEXT,
  p_record_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sql TEXT;
  v_old_data JSONB;
BEGIN
  -- Buscar dados antigos
  EXECUTE format('SELECT row_to_json(t) FROM %I t WHERE id = $1', p_table_name)
  INTO v_old_data
  USING p_record_id;

  -- Executar soft delete
  EXECUTE format('UPDATE %I SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL', p_table_name)
  USING p_record_id;

  -- Registrar no audit log
  INSERT INTO audit_logs (table_name, record_id, action, old_data, user_id)
  VALUES (p_table_name, p_record_id, 'SOFT_DELETE', v_old_data, p_user_id);

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Função para restaurar registro deletado
CREATE OR REPLACE FUNCTION restore_deleted(
  p_table_name TEXT,
  p_record_id UUID,
  p_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_sql TEXT;
  v_new_data JSONB;
BEGIN
  -- Executar restore
  EXECUTE format('UPDATE %I SET deleted_at = NULL WHERE id = $1 AND deleted_at IS NOT NULL', p_table_name)
  USING p_record_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Buscar dados atualizados
  EXECUTE format('SELECT row_to_json(t) FROM %I t WHERE id = $1', p_table_name)
  INTO v_new_data
  USING p_record_id;

  -- Registrar no audit log
  INSERT INTO audit_logs (table_name, record_id, action, new_data, user_id)
  VALUES (p_table_name, p_record_id, 'RESTORE', v_new_data, p_user_id);

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar registros soft-deleted antigos
CREATE OR REPLACE FUNCTION clean_old_soft_deleted(
  p_table_name TEXT,
  p_days_old INTEGER DEFAULT 90
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  EXECUTE format(
    'DELETE FROM %I WHERE deleted_at < NOW() - INTERVAL ''%s days''',
    p_table_name,
    p_days_old
  );
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PARTE 5: POLÍTICAS RLS PARA NOVAS TABELAS
-- ============================================================================

-- Habilitar RLS
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para ai_cache (todos podem ler, apenas sistema pode escrever)
CREATE POLICY "ai_cache_select_policy" ON ai_cache
  FOR SELECT
  USING (true);

CREATE POLICY "ai_cache_insert_policy" ON ai_cache
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "ai_cache_update_policy" ON ai_cache
  FOR UPDATE
  USING (true);

CREATE POLICY "ai_cache_delete_policy" ON ai_cache
  FOR DELETE
  USING (true);

-- Políticas para audit_logs (apenas leitura para usuários, escrita apenas sistema)
CREATE POLICY "audit_logs_select_policy" ON audit_logs
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Sistema pode inserir sempre
CREATE POLICY "audit_logs_insert_policy" ON audit_logs
  FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- PARTE 6: ESTATÍSTICAS E MANUTENÇÃO
-- ============================================================================

-- Atualizar estatísticas
ANALYZE ai_cache;
ANALYZE audit_logs;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
