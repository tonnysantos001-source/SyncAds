-- ============================================
-- AI ROUTER - CONFIGURAÇÃO COMPLETA
-- ============================================
-- Execute este SQL no Supabase SQL Editor
-- Data: 27/01/2025
-- ============================================

-- ============================================
-- 1. CRIAR TABELA DE LOGS DE USO DE IA
-- ============================================

CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES "ChatConversation"(id) ON DELETE SET NULL,

  -- Informações da IA
  provider TEXT NOT NULL CHECK (provider IN ('GROQ', 'GEMINI', 'CLAUDE', 'GPT4')),
  model TEXT NOT NULL,
  selected_reason TEXT, -- Por que essa IA foi escolhida

  -- Tokens e custos
  prompt_tokens INTEGER DEFAULT 0,
  completion_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10,6) DEFAULT 0.00,

  -- Performance
  latency_ms INTEGER, -- Tempo de resposta em ms

  -- Status
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  error_code TEXT,

  -- Contexto da requisição
  message_length INTEGER, -- Tamanho da mensagem do usuário
  has_attachments BOOLEAN DEFAULT false,
  attachment_types TEXT[], -- ['image/png', 'application/pdf']

  -- Análise da tarefa
  needs_image BOOLEAN DEFAULT false,
  needs_multimodal BOOLEAN DEFAULT false,
  complexity TEXT CHECK (complexity IN ('low', 'medium', 'high')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- 2. ÍNDICES PARA PERFORMANCE
-- ============================================

-- Busca por provider e data (mais comum)
CREATE INDEX IF NOT EXISTS idx_ai_usage_provider_date
ON ai_usage_logs(provider, created_at DESC);

-- Busca por usuário
CREATE INDEX IF NOT EXISTS idx_ai_usage_user
ON ai_usage_logs(user_id, created_at DESC);

-- Busca por conversa
CREATE INDEX IF NOT EXISTS idx_ai_usage_conversation
ON ai_usage_logs(conversation_id, created_at DESC);

-- Busca por custo (para análise financeira)
CREATE INDEX IF NOT EXISTS idx_ai_usage_cost
ON ai_usage_logs(cost_usd DESC)
WHERE cost_usd > 0;

-- Busca por erros
CREATE INDEX IF NOT EXISTS idx_ai_usage_errors
ON ai_usage_logs(created_at DESC)
WHERE success = false;

-- Busca por latência (performance)
CREATE INDEX IF NOT EXISTS idx_ai_usage_latency
ON ai_usage_logs(latency_ms DESC)
WHERE latency_ms IS NOT NULL;

-- ============================================
-- 3. COMMENTS NA TABELA
-- ============================================

COMMENT ON TABLE ai_usage_logs IS 'Logs de uso das IAs (Groq, Gemini, etc) para análise de custos e performance';
COMMENT ON COLUMN ai_usage_logs.provider IS 'Provider da IA: GROQ, GEMINI, CLAUDE, GPT4';
COMMENT ON COLUMN ai_usage_logs.selected_reason IS 'Razão pela qual o AI Router escolheu esta IA';
COMMENT ON COLUMN ai_usage_logs.cost_usd IS 'Custo estimado em USD (0 para IAs gratuitas)';
COMMENT ON COLUMN ai_usage_logs.latency_ms IS 'Tempo de resposta em milissegundos';

-- ============================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Super admins podem ver tudo
CREATE POLICY "Super admins can view all AI logs"
ON ai_usage_logs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (
      auth.users.raw_user_meta_data->>'role' = 'super_admin'
      OR auth.users.email IN (
        SELECT email FROM auth.users
        WHERE raw_user_meta_data->>'is_super_admin' = 'true'
      )
    )
  )
);

-- Usuários podem ver apenas seus próprios logs
CREATE POLICY "Users can view their own AI logs"
ON ai_usage_logs FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Apenas service_role pode inserir (via Edge Functions)
CREATE POLICY "Service role can insert AI logs"
ON ai_usage_logs FOR INSERT
TO service_role
WITH CHECK (true);

-- ============================================
-- 5. VIEW PARA ESTATÍSTICAS (SUPER ADMIN)
-- ============================================

CREATE OR REPLACE VIEW ai_usage_statistics AS
SELECT
  provider,
  COUNT(*) as total_requests,
  COUNT(*) FILTER (WHERE success = true) as successful_requests,
  COUNT(*) FILTER (WHERE success = false) as failed_requests,
  ROUND(AVG(latency_ms)::numeric, 2) as avg_latency_ms,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms)::numeric, 2) as median_latency_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 2) as p95_latency_ms,
  SUM(total_tokens) as total_tokens_used,
  ROUND(SUM(cost_usd)::numeric, 4) as total_cost_usd,
  ROUND(AVG(cost_usd)::numeric, 6) as avg_cost_per_request,
  DATE_TRUNC('day', created_at) as date
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY provider, DATE_TRUNC('day', created_at)
ORDER BY date DESC, provider;

COMMENT ON VIEW ai_usage_statistics IS 'Estatísticas agregadas de uso das IAs por dia (últimos 30 dias)';

-- ============================================
-- 6. VIEW PARA CUSTOS (SUPER ADMIN)
-- ============================================

CREATE OR REPLACE VIEW ai_cost_summary AS
SELECT
  provider,
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as requests,
  SUM(total_tokens) as tokens_used,
  ROUND(SUM(cost_usd)::numeric, 4) as daily_cost_usd,
  ROUND(AVG(cost_usd)::numeric, 6) as avg_cost_per_request
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY provider, DATE_TRUNC('day', created_at)
ORDER BY date DESC, daily_cost_usd DESC;

COMMENT ON VIEW ai_cost_summary IS 'Resumo de custos diários por provider (últimos 30 dias)';

-- ============================================
-- 7. VIEW PARA PERFORMANCE (SUPER ADMIN)
-- ============================================

CREATE OR REPLACE VIEW ai_performance_summary AS
SELECT
  provider,
  model,
  COUNT(*) as total_requests,
  ROUND(AVG(latency_ms)::numeric, 2) as avg_latency_ms,
  MIN(latency_ms) as min_latency_ms,
  MAX(latency_ms) as max_latency_ms,
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY latency_ms)::numeric, 2) as median_latency_ms,
  ROUND(PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY latency_ms)::numeric, 2) as p95_latency_ms,
  ROUND(PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY latency_ms)::numeric, 2) as p99_latency_ms,
  COUNT(*) FILTER (WHERE success = true) as successful,
  COUNT(*) FILTER (WHERE success = false) as failed,
  ROUND(COUNT(*) FILTER (WHERE success = true)::numeric / COUNT(*)::numeric * 100, 2) as success_rate_pct
FROM ai_usage_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY provider, model
ORDER BY total_requests DESC;

COMMENT ON VIEW ai_performance_summary IS 'Análise de performance por IA (últimos 7 dias)';

-- ============================================
-- 8. FUNÇÃO PARA CALCULAR CUSTO
-- ============================================

CREATE OR REPLACE FUNCTION calculate_ai_cost(
  p_provider TEXT,
  p_prompt_tokens INTEGER,
  p_completion_tokens INTEGER
) RETURNS DECIMAL(10,6) AS $$
BEGIN
  -- GROQ: Gratuito
  IF p_provider = 'GROQ' THEN
    RETURN 0.00;
  END IF;

  -- GEMINI: Gratuito (até rate limits)
  IF p_provider = 'GEMINI' THEN
    RETURN 0.00;
  END IF;

  -- CLAUDE: $3/1M input, $15/1M output
  IF p_provider = 'CLAUDE' THEN
    RETURN ROUND(
      (p_prompt_tokens * 0.003 + p_completion_tokens * 0.015) / 1000.0,
      6
    );
  END IF;

  -- GPT-4: $10/1M input, $30/1M output
  IF p_provider = 'GPT4' THEN
    RETURN ROUND(
      (p_prompt_tokens * 0.01 + p_completion_tokens * 0.03) / 1000.0,
      6
    );
  END IF;

  RETURN 0.00;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_ai_cost IS 'Calcula custo estimado baseado em tokens e provider';

-- ============================================
-- 9. TRIGGER PARA AUTO-CALCULAR CUSTO
-- ============================================

CREATE OR REPLACE FUNCTION auto_calculate_ai_cost()
RETURNS TRIGGER AS $$
BEGIN
  -- Se cost_usd não foi fornecido, calcular automaticamente
  IF NEW.cost_usd = 0 OR NEW.cost_usd IS NULL THEN
    NEW.cost_usd := calculate_ai_cost(
      NEW.provider,
      NEW.prompt_tokens,
      NEW.completion_tokens
    );
  END IF;

  -- Calcular total_tokens se não foi fornecido
  IF NEW.total_tokens = 0 OR NEW.total_tokens IS NULL THEN
    NEW.total_tokens := COALESCE(NEW.prompt_tokens, 0) + COALESCE(NEW.completion_tokens, 0);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_calculate_ai_cost
BEFORE INSERT ON ai_usage_logs
FOR EACH ROW
EXECUTE FUNCTION auto_calculate_ai_cost();

-- ============================================
-- 10. VERIFICAÇÃO FINAL
-- ============================================

-- Verificar se tabela foi criada
SELECT
  'ai_usage_logs' as table_name,
  COUNT(*) as row_count,
  pg_size_pretty(pg_total_relation_size('ai_usage_logs')) as table_size
FROM ai_usage_logs;

-- Verificar índices
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'ai_usage_logs'
ORDER BY indexname;

-- Verificar views
SELECT
  viewname,
  definition
FROM pg_views
WHERE schemaname = 'public'
AND viewname LIKE 'ai_%'
ORDER BY viewname;

-- ============================================
-- ✅ CONFIGURAÇÃO COMPLETA!
-- ============================================

SELECT '✅ AI Router configurado com sucesso!' as status,
       'Tabela, índices, RLS e views criadas' as details,
       NOW() as timestamp;

-- ============================================
-- 📊 COMO USAR
-- ============================================

-- Ver estatísticas:
-- SELECT * FROM ai_usage_statistics ORDER BY date DESC LIMIT 30;

-- Ver custos:
-- SELECT * FROM ai_cost_summary ORDER BY date DESC LIMIT 30;

-- Ver performance:
-- SELECT * FROM ai_performance_summary;

-- Inserir log manualmente (teste):
-- INSERT INTO ai_usage_logs (
--   user_id, provider, model, selected_reason,
--   prompt_tokens, completion_tokens, latency_ms,
--   success, message_length, complexity
-- ) VALUES (
--   auth.uid(), 'GROQ', 'llama-3.3-70b-versatile',
--   'Chat rápido e gratuito', 100, 200, 1500, true, 50, 'low'
-- );
