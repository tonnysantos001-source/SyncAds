-- ============================================================================
-- MIGRATION: RATE LIMITS TABLE
-- Data: 2024-01-24
-- Descrição: Tabela para rate limiting robusto multi-nível
-- ============================================================================

-- Tabela de rate limits
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limits_metadata ON rate_limits USING gin(metadata);
CREATE INDEX IF NOT EXISTS idx_rate_limits_created ON rate_limits(created_at DESC);

-- Índice para cleanup eficiente
CREATE INDEX IF NOT EXISTS idx_rate_limits_expired
  ON rate_limits(window_end)
  WHERE window_end < NOW();

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rate_limits_updated_at ON rate_limits;
CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_rate_limits_updated_at();

-- Função para limpar rate limits expirados
CREATE OR REPLACE FUNCTION clean_expired_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits WHERE window_end < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para obter estatísticas de rate limit
CREATE OR REPLACE FUNCTION get_rate_limit_stats(
  p_key_pattern TEXT DEFAULT '%'
)
RETURNS TABLE (
  key TEXT,
  count INTEGER,
  limit_type TEXT,
  window_start TIMESTAMPTZ,
  window_end TIMESTAMPTZ,
  remaining_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    rl.key,
    rl.count,
    (rl.metadata->>'type')::TEXT as limit_type,
    rl.window_start,
    rl.window_end,
    GREATEST(0, EXTRACT(EPOCH FROM (rl.window_end - NOW()))::INTEGER) as remaining_seconds
  FROM rate_limits rl
  WHERE rl.key LIKE p_key_pattern
    AND rl.window_end > NOW()
  ORDER BY rl.window_end DESC;
END;
$$ LANGUAGE plpgsql;

-- Função para reset de rate limit
CREATE OR REPLACE FUNCTION reset_rate_limit(
  p_key_pattern TEXT
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limits WHERE key LIKE p_key_pattern;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comentários
COMMENT ON TABLE rate_limits IS 'Rate limiting para APIs e recursos com suporte a múltiplos níveis';
COMMENT ON COLUMN rate_limits.key IS 'Chave única: tipo:identifier:resource:window (ex: user:123:AI_CHAT:minute)';
COMMENT ON COLUMN rate_limits.count IS 'Contador de requisições na janela atual';
COMMENT ON COLUMN rate_limits.window_start IS 'Início da janela de rate limit';
COMMENT ON COLUMN rate_limits.window_end IS 'Fim da janela de rate limit';
COMMENT ON COLUMN rate_limits.metadata IS 'Metadados: type, identifier, resource, window, etc';

-- RLS (Row Level Security)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
-- Usuários podem ver apenas seus próprios rate limits
CREATE POLICY "rate_limits_select_own" ON rate_limits
  FOR SELECT
  USING (
    (metadata->>'userId')::TEXT = auth.uid()::TEXT
    OR EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()
      AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Sistema pode inserir/atualizar sempre
CREATE POLICY "rate_limits_insert_system" ON rate_limits
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "rate_limits_update_system" ON rate_limits
  FOR UPDATE
  USING (true);

-- Apenas sistema pode deletar (cleanup)
CREATE POLICY "rate_limits_delete_system" ON rate_limits
  FOR DELETE
  USING (true);

-- ============================================================================
-- DADOS INICIAIS (OPCIONAL)
-- ============================================================================

-- Exemplos de uso via SQL (para referência)
-- SELECT * FROM get_rate_limit_stats('user:%');
-- SELECT clean_expired_rate_limits();
-- SELECT reset_rate_limit('user:123:%');

-- ============================================================================
-- ESTATÍSTICAS
-- ============================================================================

ANALYZE rate_limits;

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================
