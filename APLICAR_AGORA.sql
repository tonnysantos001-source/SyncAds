-- MIGRATIONS ESSENCIAIS - APLICAR NO SUPABASE

-- 1. AI CACHE
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

CREATE INDEX IF NOT EXISTS idx_ai_cache_key ON ai_cache(key);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_ai_cache_hits ON ai_cache(hits DESC);

CREATE OR REPLACE FUNCTION update_ai_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_cache_updated_at ON ai_cache;
CREATE TRIGGER ai_cache_updated_at BEFORE UPDATE ON ai_cache FOR EACH ROW EXECUTE FUNCTION update_ai_cache_updated_at();

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

-- 2. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION log_audit(
  p_table_name TEXT,
  p_record_id UUID,
  p_action TEXT,
  p_old_data JSONB DEFAULT NULL,
  p_new_data JSONB DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO audit_logs (table_name, record_id, action, old_data, new_data, user_id)
  VALUES (p_table_name, p_record_id, p_action, p_old_data, p_new_data, p_user_id)
  RETURNING id INTO v_audit_id;
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

-- 3. RATE LIMITS
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL,
  window_end TIMESTAMPTZ NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_end ON rate_limits(window_end);

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

CREATE OR REPLACE FUNCTION check_rate_limit(p_key TEXT, p_limit INTEGER, p_window_seconds INTEGER DEFAULT 60)
RETURNS JSONB AS $$
DECLARE
  v_current_count INTEGER;
  v_window_end TIMESTAMPTZ;
BEGIN
  SELECT count, window_end INTO v_current_count, v_window_end
  FROM rate_limits WHERE key = p_key AND window_end > NOW();

  IF v_current_count IS NULL THEN
    v_window_end := NOW() + (p_window_seconds || ' seconds')::INTERVAL;
    INSERT INTO rate_limits (key, count, window_start, window_end)
    VALUES (p_key, 1, NOW(), v_window_end);
    RETURN jsonb_build_object('allowed', true, 'remaining', p_limit - 1, 'current', 1);
  END IF;

  IF v_current_count < p_limit THEN
    UPDATE rate_limits SET count = count + 1 WHERE key = p_key;
    RETURN jsonb_build_object('allowed', true, 'remaining', p_limit - v_current_count - 1, 'current', v_current_count + 1);
  ELSE
    RETURN jsonb_build_object('allowed', false, 'remaining', 0, 'current', v_current_count);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 4. RLS
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ai_cache_policy" ON ai_cache;
CREATE POLICY "ai_cache_policy" ON ai_cache FOR ALL USING (true);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "audit_logs_policy" ON audit_logs;
CREATE POLICY "audit_logs_policy" ON audit_logs FOR ALL USING (true);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "rate_limits_policy" ON rate_limits;
CREATE POLICY "rate_limits_policy" ON rate_limits FOR ALL USING (true);

-- 5. STATS
CREATE OR REPLACE FUNCTION get_ai_cache_stats()
RETURNS TABLE (total_entries BIGINT, total_hits BIGINT, cache_size_mb NUMERIC) AS $$
BEGIN
  RETURN QUERY SELECT COUNT(*)::BIGINT, COALESCE(SUM(hits), 0)::BIGINT, ROUND(pg_total_relation_size('ai_cache')::NUMERIC / 1024 / 1024, 2) FROM ai_cache;
END;
$$ LANGUAGE plpgsql;

-- CONCLUIDO
SELECT 'Migrations aplicadas com sucesso!' as status;
