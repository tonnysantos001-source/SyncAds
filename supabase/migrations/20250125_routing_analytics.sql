-- ============================================
-- ROUTING ANALYTICS TABLE
-- Armazena decisões de roteamento para analytics
-- ============================================

CREATE TABLE IF NOT EXISTS routing_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Comando info
  command_type TEXT NOT NULL,
  command_message TEXT,

  -- Decisão de roteamento
  executor_chosen TEXT NOT NULL CHECK (executor_chosen IN ('EXTENSION', 'PYTHON_AI', 'HYBRID', 'EDGE_FUNCTION')),
  confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),

  -- Complexidade
  complexity_score INTEGER NOT NULL CHECK (complexity_score >= 0 AND complexity_score <= 10),
  complexity_factors TEXT[] DEFAULT '{}',

  -- Métricas
  estimated_time DECIMAL(10,2),
  capabilities_needed TEXT[] DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_routing_analytics_executor ON routing_analytics(executor_chosen);
CREATE INDEX IF NOT EXISTS idx_routing_analytics_complexity ON routing_analytics(complexity_score);
CREATE INDEX IF NOT EXISTS idx_routing_analytics_created_at ON routing_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_routing_analytics_command_type ON routing_analytics(command_type);

-- RLS Policies
ALTER TABLE routing_analytics ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo
CREATE POLICY "Admins can view all routing analytics"
  ON routing_analytics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE "User".id = auth.uid()
      AND "User".role IN ('ADMIN', 'SUPER_ADMIN')
    )
  );

-- Sistema pode inserir (service role)
CREATE POLICY "Service role can insert routing analytics"
  ON routing_analytics
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Comentários
COMMENT ON TABLE routing_analytics IS 'Armazena decisões de roteamento inteligente entre Extension e Python AI';
COMMENT ON COLUMN routing_analytics.executor_chosen IS 'Executor escolhido: EXTENSION, PYTHON_AI, HYBRID ou EDGE_FUNCTION';
COMMENT ON COLUMN routing_analytics.confidence IS 'Confiança na decisão (0-1)';
COMMENT ON COLUMN routing_analytics.complexity_score IS 'Score de complexidade do comando (0-10)';
COMMENT ON COLUMN routing_analytics.complexity_factors IS 'Fatores que contribuíram para a complexidade';
