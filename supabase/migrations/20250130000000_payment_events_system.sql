-- ============================================
-- PAYMENT EVENTS & OPTIMIZATION SYSTEM
-- Migration: 20250130000000_payment_events_system.sql
-- ============================================
--
-- Implementa:
-- ✅ Tabela PaymentEvent para logs completos
-- ✅ Sistema de alertas para falhas
-- ✅ Relatórios de transações
-- ✅ Taxa de sucesso por gateway
-- ✅ Cache de configurações
-- ✅ Views materializadas para performance
-- ✅ Índices otimizados
-- ============================================

-- ============================================
-- 1. PAYMENT EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "PaymentEvent" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID REFERENCES "Organization"(id) ON DELETE CASCADE,
  "userId" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "transactionId" UUID REFERENCES "Transaction"(id) ON DELETE CASCADE,
  "orderId" UUID REFERENCES "Order"(id) ON DELETE CASCADE,
  "gatewayId" UUID REFERENCES "Gateway"(id) ON DELETE SET NULL,

  -- Event Info
  "eventType" TEXT NOT NULL,
  "eventData" JSONB,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),

  -- HTTP Info (for webhooks)
  "httpMethod" TEXT,
  "httpStatus" INTEGER,
  "requestHeaders" JSONB,
  "requestBody" TEXT,
  "responseBody" TEXT,

  -- Timing
  "processingTime" INTEGER, -- milliseconds

  -- Error Tracking
  "errorMessage" TEXT,
  "errorStack" TEXT,
  "retryCount" INTEGER DEFAULT 0,
  "nextRetryAt" TIMESTAMP,

  -- Metadata
  metadata JSONB,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Índices para PaymentEvent
CREATE INDEX idx_payment_event_org ON "PaymentEvent"("organizationId", "createdAt" DESC);
CREATE INDEX idx_payment_event_transaction ON "PaymentEvent"("transactionId");
CREATE INDEX idx_payment_event_order ON "PaymentEvent"("orderId");
CREATE INDEX idx_payment_event_gateway ON "PaymentEvent"("gatewayId");
CREATE INDEX idx_payment_event_type ON "PaymentEvent"("eventType");
CREATE INDEX idx_payment_event_severity ON "PaymentEvent"(severity) WHERE severity IN ('error', 'critical');
CREATE INDEX idx_payment_event_retry ON "PaymentEvent"("nextRetryAt") WHERE "nextRetryAt" IS NOT NULL;
CREATE INDEX idx_payment_event_created ON "PaymentEvent"("createdAt" DESC);

-- ============================================
-- 2. GATEWAY METRICS CACHE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "GatewayMetrics" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "gatewayId" UUID NOT NULL REFERENCES "Gateway"(id) ON DELETE CASCADE,

  -- Período
  period TEXT NOT NULL CHECK (period IN ('hour', 'day', 'week', 'month')),
  "periodStart" TIMESTAMP NOT NULL,
  "periodEnd" TIMESTAMP NOT NULL,

  -- Métricas
  "totalTransactions" INTEGER DEFAULT 0,
  "successfulTransactions" INTEGER DEFAULT 0,
  "failedTransactions" INTEGER DEFAULT 0,
  "pendingTransactions" INTEGER DEFAULT 0,
  "refundedTransactions" INTEGER DEFAULT 0,

  -- Valores
  "totalAmount" DECIMAL(12,2) DEFAULT 0,
  "successfulAmount" DECIMAL(12,2) DEFAULT 0,
  "refundedAmount" DECIMAL(12,2) DEFAULT 0,
  "averageAmount" DECIMAL(12,2) DEFAULT 0,

  -- Taxas
  "successRate" DECIMAL(5,2) DEFAULT 0, -- Percentual
  "failureRate" DECIMAL(5,2) DEFAULT 0, -- Percentual
  "refundRate" DECIMAL(5,2) DEFAULT 0, -- Percentual

  -- Performance
  "avgProcessingTime" INTEGER, -- milliseconds
  "maxProcessingTime" INTEGER,
  "minProcessingTime" INTEGER,

  -- Métodos de pagamento
  "pixCount" INTEGER DEFAULT 0,
  "boletoCount" INTEGER DEFAULT 0,
  "creditCardCount" INTEGER DEFAULT 0,
  "debitCardCount" INTEGER DEFAULT 0,

  "lastUpdated" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("organizationId", "gatewayId", period, "periodStart")
);

-- Índices para GatewayMetrics
CREATE INDEX idx_gateway_metrics_org ON "GatewayMetrics"("organizationId");
CREATE INDEX idx_gateway_metrics_gateway ON "GatewayMetrics"("gatewayId");
CREATE INDEX idx_gateway_metrics_period ON "GatewayMetrics"(period, "periodStart" DESC);
CREATE INDEX idx_gateway_metrics_success_rate ON "GatewayMetrics"("successRate");

-- ============================================
-- 3. PAYMENT ALERTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "PaymentAlert" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "gatewayId" UUID REFERENCES "Gateway"(id) ON DELETE CASCADE,

  -- Alert Info
  "alertType" TEXT NOT NULL CHECK ("alertType" IN (
    'high_failure_rate',
    'gateway_down',
    'slow_processing',
    'unusual_refund_rate',
    'webhook_failure',
    'config_missing',
    'credential_expired'
  )),

  severity TEXT NOT NULL CHECK (severity IN ('warning', 'error', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Thresholds
  threshold JSONB,
  "currentValue" DECIMAL(10,2),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  "acknowledgedBy" UUID REFERENCES "User"(id) ON DELETE SET NULL,
  "acknowledgedAt" TIMESTAMP,
  "resolvedAt" TIMESTAMP,

  -- Notifications
  "notificationsSent" INTEGER DEFAULT 0,
  "lastNotificationAt" TIMESTAMP,

  -- Metadata
  metadata JSONB,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Índices para PaymentAlert
CREATE INDEX idx_payment_alert_org ON "PaymentAlert"("organizationId", status);
CREATE INDEX idx_payment_alert_gateway ON "PaymentAlert"("gatewayId");
CREATE INDEX idx_payment_alert_type ON "PaymentAlert"("alertType");
CREATE INDEX idx_payment_alert_status ON "PaymentAlert"(status) WHERE status = 'active';
CREATE INDEX idx_payment_alert_severity ON "PaymentAlert"(severity);

-- ============================================
-- 4. RETRY QUEUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS "PaymentRetryQueue" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "transactionId" UUID NOT NULL REFERENCES "Transaction"(id) ON DELETE CASCADE,
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,

  -- Retry Info
  "retryCount" INTEGER DEFAULT 0,
  "maxRetries" INTEGER DEFAULT 3,
  "nextRetryAt" TIMESTAMP NOT NULL,
  "lastAttemptAt" TIMESTAMP,

  -- Backoff Strategy
  "backoffStrategy" TEXT DEFAULT 'exponential' CHECK ("backoffStrategy" IN ('exponential', 'linear', 'fixed')),
  "baseDelay" INTEGER DEFAULT 1000, -- milliseconds

  -- Error Info
  "lastError" TEXT,
  "lastErrorCode" TEXT,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed', 'cancelled')),

  -- Priority
  priority INTEGER DEFAULT 5, -- 1 (highest) to 10 (lowest)

  -- Metadata
  metadata JSONB,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Índices para PaymentRetryQueue
CREATE INDEX idx_retry_queue_org ON "PaymentRetryQueue"("organizationId");
CREATE INDEX idx_retry_queue_transaction ON "PaymentRetryQueue"("transactionId");
CREATE INDEX idx_retry_queue_next_retry ON "PaymentRetryQueue"("nextRetryAt")
  WHERE status = 'pending' AND "retryCount" < "maxRetries";
CREATE INDEX idx_retry_queue_status ON "PaymentRetryQueue"(status);
CREATE INDEX idx_retry_queue_priority ON "PaymentRetryQueue"(priority, "nextRetryAt");

-- ============================================
-- 5. GATEWAY CONFIG CACHE
-- ============================================
CREATE TABLE IF NOT EXISTS "GatewayConfigCache" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "organizationId" UUID NOT NULL REFERENCES "Organization"(id) ON DELETE CASCADE,
  "gatewayId" UUID NOT NULL REFERENCES "Gateway"(id) ON DELETE CASCADE,

  -- Cache Data
  "configData" JSONB NOT NULL,
  "configHash" TEXT NOT NULL, -- MD5 hash para invalidação

  -- TTL
  "expiresAt" TIMESTAMP NOT NULL,
  "lastUsedAt" TIMESTAMP DEFAULT NOW(),
  "hitCount" INTEGER DEFAULT 0,

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("organizationId", "gatewayId")
);

-- Índices para GatewayConfigCache
CREATE INDEX idx_gateway_cache_org ON "GatewayConfigCache"("organizationId");
CREATE INDEX idx_gateway_cache_expires ON "GatewayConfigCache"("expiresAt");
CREATE INDEX idx_gateway_cache_last_used ON "GatewayConfigCache"("lastUsedAt");

-- ============================================
-- 6. VIEWS MATERIALIZADAS
-- ============================================

-- View: Métricas de Checkout em Tempo Real
CREATE MATERIALIZED VIEW IF NOT EXISTS "CheckoutMetricsView" AS
SELECT
  t."organizationId",
  COUNT(DISTINCT t.id) as "totalTransactions",
  COUNT(DISTINCT CASE WHEN t.status = 'PAID' THEN t.id END) as "successfulTransactions",
  COUNT(DISTINCT CASE WHEN t.status = 'FAILED' THEN t.id END) as "failedTransactions",
  COUNT(DISTINCT CASE WHEN t.status = 'PENDING' THEN t.id END) as "pendingTransactions",
  COUNT(DISTINCT CASE WHEN t.status = 'REFUNDED' THEN t.id END) as "refundedTransactions",

  COALESCE(SUM(CASE WHEN t.status = 'PAID' THEN t.amount ELSE 0 END), 0) as "totalRevenue",
  COALESCE(SUM(CASE WHEN t.status = 'REFUNDED' THEN t.amount ELSE 0 END), 0) as "refundedRevenue",
  COALESCE(AVG(CASE WHEN t.status = 'PAID' THEN t.amount END), 0) as "avgTicket",

  ROUND(
    (COUNT(CASE WHEN t.status = 'PAID' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100),
    2
  ) as "successRate",

  DATE_TRUNC('hour', NOW()) as "calculatedAt"
FROM "Transaction" t
WHERE t."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY t."organizationId";

CREATE UNIQUE INDEX idx_checkout_metrics_org ON "CheckoutMetricsView"("organizationId");

-- View: Métricas por Gateway
CREATE MATERIALIZED VIEW IF NOT EXISTS "GatewayPerformanceView" AS
SELECT
  t."organizationId",
  t."gatewayId",
  g.name as "gatewayName",
  g.slug as "gatewaySlug",

  COUNT(*) as "totalTransactions",
  COUNT(CASE WHEN t.status = 'PAID' THEN 1 END) as "successfulTransactions",
  COUNT(CASE WHEN t.status = 'FAILED' THEN 1 END) as "failedTransactions",

  COALESCE(SUM(CASE WHEN t.status = 'PAID' THEN t.amount ELSE 0 END), 0) as "totalRevenue",
  COALESCE(AVG(CASE WHEN t.status = 'PAID' THEN t.amount END), 0) as "avgTicket",

  ROUND(
    (COUNT(CASE WHEN t.status = 'PAID' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100),
    2
  ) as "successRate",

  -- Métricas por método
  COUNT(CASE WHEN t."paymentMethod" = 'PIX' THEN 1 END) as "pixCount",
  COUNT(CASE WHEN t."paymentMethod" = 'BOLETO' THEN 1 END) as "boletoCount",
  COUNT(CASE WHEN t."paymentMethod" = 'CREDIT_CARD' THEN 1 END) as "creditCardCount",

  DATE_TRUNC('hour', NOW()) as "calculatedAt"
FROM "Transaction" t
INNER JOIN "Gateway" g ON g.id = t."gatewayId"
WHERE t."createdAt" >= NOW() - INTERVAL '30 days'
GROUP BY t."organizationId", t."gatewayId", g.name, g.slug;

CREATE UNIQUE INDEX idx_gateway_performance_org_gateway
  ON "GatewayPerformanceView"("organizationId", "gatewayId");

-- View: Top Gateways com Falha
CREATE MATERIALIZED VIEW IF NOT EXISTS "FailingGatewaysView" AS
SELECT
  t."organizationId",
  t."gatewayId",
  g.name as "gatewayName",
  g.slug as "gatewaySlug",

  COUNT(CASE WHEN t.status = 'FAILED' THEN 1 END) as "failureCount",
  COUNT(*) as "totalAttempts",

  ROUND(
    (COUNT(CASE WHEN t.status = 'FAILED' THEN 1 END)::DECIMAL / NULLIF(COUNT(*), 0) * 100),
    2
  ) as "failureRate",

  MAX(t."createdAt") as "lastFailureAt",

  DATE_TRUNC('hour', NOW()) as "calculatedAt"
FROM "Transaction" t
INNER JOIN "Gateway" g ON g.id = t."gatewayId"
WHERE t."createdAt" >= NOW() - INTERVAL '7 days'
  AND t.status = 'FAILED'
GROUP BY t."organizationId", t."gatewayId", g.name, g.slug
HAVING COUNT(CASE WHEN t.status = 'FAILED' THEN 1 END) > 5;

CREATE UNIQUE INDEX idx_failing_gateways_org_gateway
  ON "FailingGatewaysView"("organizationId", "gatewayId");

-- ============================================
-- 7. FUNÇÕES DE REFRESH DAS VIEWS
-- ============================================

-- Função para atualizar todas as views materializadas
CREATE OR REPLACE FUNCTION refresh_payment_metrics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY "CheckoutMetricsView";
  REFRESH MATERIALIZED VIEW CONCURRENTLY "GatewayPerformanceView";
  REFRESH MATERIALIZED VIEW CONCURRENTLY "FailingGatewaysView";
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 8. FUNÇÕES AUXILIARES
-- ============================================

-- Função para calcular próximo retry com exponential backoff
CREATE OR REPLACE FUNCTION calculate_next_retry(
  p_retry_count INTEGER,
  p_base_delay INTEGER DEFAULT 1000,
  p_max_delay INTEGER DEFAULT 300000 -- 5 minutos
)
RETURNS TIMESTAMP AS $$
DECLARE
  v_delay INTEGER;
BEGIN
  -- Exponential backoff: base_delay * 2^retry_count
  v_delay := LEAST(p_base_delay * POWER(2, p_retry_count), p_max_delay);
  RETURN NOW() + (v_delay || ' milliseconds')::INTERVAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Função para adicionar transação na fila de retry
CREATE OR REPLACE FUNCTION enqueue_payment_retry(
  p_transaction_id UUID,
  p_organization_id UUID,
  p_error_message TEXT DEFAULT NULL,
  p_priority INTEGER DEFAULT 5
)
RETURNS UUID AS $$
DECLARE
  v_retry_id UUID;
  v_retry_count INTEGER;
BEGIN
  -- Verificar se já existe na fila
  SELECT "retryCount" INTO v_retry_count
  FROM "PaymentRetryQueue"
  WHERE "transactionId" = p_transaction_id
    AND status IN ('pending', 'processing');

  IF v_retry_count IS NULL THEN
    v_retry_count := 0;
  ELSE
    v_retry_count := v_retry_count + 1;
  END IF;

  -- Inserir ou atualizar na fila
  INSERT INTO "PaymentRetryQueue" (
    "transactionId",
    "organizationId",
    "retryCount",
    "nextRetryAt",
    "lastError",
    "lastAttemptAt",
    priority,
    "createdAt"
  )
  VALUES (
    p_transaction_id,
    p_organization_id,
    v_retry_count,
    calculate_next_retry(v_retry_count),
    p_error_message,
    NOW(),
    p_priority,
    NOW()
  )
  ON CONFLICT ("transactionId")
  DO UPDATE SET
    "retryCount" = v_retry_count,
    "nextRetryAt" = calculate_next_retry(v_retry_count),
    "lastError" = p_error_message,
    "lastAttemptAt" = NOW(),
    "updatedAt" = NOW()
  RETURNING id INTO v_retry_id;

  RETURN v_retry_id;
END;
$$ LANGUAGE plpgsql;

-- Função para registrar evento de pagamento
CREATE OR REPLACE FUNCTION log_payment_event(
  p_organization_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_transaction_id UUID DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_gateway_id UUID DEFAULT NULL,
  p_event_type TEXT DEFAULT 'info',
  p_event_data JSONB DEFAULT '{}'::JSONB,
  p_severity TEXT DEFAULT 'info'
)
RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO "PaymentEvent" (
    "organizationId",
    "userId",
    "transactionId",
    "orderId",
    "gatewayId",
    "eventType",
    "eventData",
    severity,
    "createdAt"
  )
  VALUES (
    p_organization_id,
    p_user_id,
    p_transaction_id,
    p_order_id,
    p_gateway_id,
    p_event_type,
    p_event_data,
    p_severity,
    NOW()
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- Função para criar alerta de pagamento
CREATE OR REPLACE FUNCTION create_payment_alert(
  p_organization_id UUID,
  p_gateway_id UUID DEFAULT NULL,
  p_alert_type TEXT DEFAULT 'high_failure_rate',
  p_severity TEXT DEFAULT 'warning',
  p_title TEXT DEFAULT 'Payment Alert',
  p_message TEXT DEFAULT '',
  p_current_value DECIMAL DEFAULT NULL,
  p_threshold JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
  v_existing_alert UUID;
BEGIN
  -- Verificar se já existe alerta ativo similar
  SELECT id INTO v_existing_alert
  FROM "PaymentAlert"
  WHERE "organizationId" = p_organization_id
    AND "gatewayId" IS NOT DISTINCT FROM p_gateway_id
    AND "alertType" = p_alert_type
    AND status = 'active'
  LIMIT 1;

  IF v_existing_alert IS NOT NULL THEN
    -- Atualizar alerta existente
    UPDATE "PaymentAlert"
    SET "currentValue" = p_current_value,
        "updatedAt" = NOW(),
        "notificationsSent" = "notificationsSent" + 1,
        "lastNotificationAt" = NOW()
    WHERE id = v_existing_alert;

    RETURN v_existing_alert;
  ELSE
    -- Criar novo alerta
    INSERT INTO "PaymentAlert" (
      "organizationId",
      "gatewayId",
      "alertType",
      severity,
      title,
      message,
      "currentValue",
      threshold,
      "createdAt"
    )
    VALUES (
      p_organization_id,
      p_gateway_id,
      p_alert_type,
      p_severity,
      p_title,
      p_message,
      p_current_value,
      p_threshold,
      NOW()
    )
    RETURNING id INTO v_alert_id;

    RETURN v_alert_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TRIGGERS
-- ============================================

-- Trigger para atualizar updatedAt automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_event_updated_at
  BEFORE UPDATE ON "PaymentEvent"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gateway_metrics_updated_at
  BEFORE UPDATE ON "GatewayMetrics"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_alert_updated_at
  BEFORE UPDATE ON "PaymentAlert"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_retry_queue_updated_at
  BEFORE UPDATE ON "PaymentRetryQueue"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gateway_cache_updated_at
  BEFORE UPDATE ON "GatewayConfigCache"
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para detectar high failure rate automaticamente
CREATE OR REPLACE FUNCTION check_gateway_failure_rate()
RETURNS TRIGGER AS $$
DECLARE
  v_failure_count INTEGER;
  v_total_count INTEGER;
  v_failure_rate DECIMAL;
  v_threshold DECIMAL := 20.0; -- 20% de falhas
BEGIN
  -- Contar falhas nas últimas 100 transações deste gateway
  SELECT
    COUNT(CASE WHEN status = 'FAILED' THEN 1 END),
    COUNT(*)
  INTO v_failure_count, v_total_count
  FROM (
    SELECT status
    FROM "Transaction"
    WHERE "gatewayId" = NEW."gatewayId"
      AND "organizationId" = NEW."organizationId"
    ORDER BY "createdAt" DESC
    LIMIT 100
  ) recent;

  IF v_total_count >= 10 THEN
    v_failure_rate := (v_failure_count::DECIMAL / v_total_count * 100);

    IF v_failure_rate > v_threshold THEN
      PERFORM create_payment_alert(
        NEW."organizationId",
        NEW."gatewayId",
        'high_failure_rate',
        CASE
          WHEN v_failure_rate > 50 THEN 'critical'
          WHEN v_failure_rate > 30 THEN 'error'
          ELSE 'warning'
        END,
        'Alta Taxa de Falha Detectada',
        format('Gateway está com %.2f%% de falhas nas últimas %s transações',
               v_failure_rate, v_total_count),
        v_failure_rate,
        jsonb_build_object('threshold', v_threshold, 'window', 100)
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_failure_rate
  AFTER INSERT OR UPDATE ON "Transaction"
  FOR EACH ROW
  WHEN (NEW.status = 'FAILED')
  EXECUTE FUNCTION check_gateway_failure_rate();

-- Trigger para enfileirar retry automático em falhas
CREATE OR REPLACE FUNCTION auto_enqueue_failed_transaction()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'FAILED' AND OLD.status != 'FAILED' THEN
    PERFORM enqueue_payment_retry(
      NEW.id,
      NEW."organizationId",
      NEW."failureReason",
      5 -- prioridade normal
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_retry
  AFTER UPDATE ON "Transaction"
  FOR EACH ROW
  WHEN (NEW.status = 'FAILED')
  EXECUTE FUNCTION auto_enqueue_failed_transaction();

-- ============================================
-- 10. JOBS AGENDADOS (via pg_cron)
-- ============================================

-- Nota: Estes comandos precisam ser executados manualmente pelo super admin
-- ou via script após a migration, pois requerem extensão pg_cron

-- Refresh de métricas a cada 5 minutos
-- SELECT cron.schedule('refresh-payment-metrics', '*/5 * * * *', 'SELECT refresh_payment_metrics()');

-- Limpar cache expirado a cada hora
-- SELECT cron.schedule('clean-expired-cache', '0 * * * *',
--   'DELETE FROM "GatewayConfigCache" WHERE "expiresAt" < NOW()');

-- Limpar eventos antigos (> 90 dias) diariamente
-- SELECT cron.schedule('clean-old-events', '0 2 * * *',
--   'DELETE FROM "PaymentEvent" WHERE "createdAt" < NOW() - INTERVAL ''90 days''');

-- Limpar retry queue completos (> 7 dias) diariamente
-- SELECT cron.schedule('clean-retry-queue', '0 3 * * *',
--   'DELETE FROM "PaymentRetryQueue" WHERE status IN (''success'', ''cancelled'')
--    AND "updatedAt" < NOW() - INTERVAL ''7 days''');

-- ============================================
-- 11. POLÍTICAS RLS (Row Level Security)
-- ============================================

-- PaymentEvent
ALTER TABLE "PaymentEvent" ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_event_select ON "PaymentEvent"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

CREATE POLICY payment_event_insert ON "PaymentEvent"
  FOR INSERT WITH CHECK (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- GatewayMetrics
ALTER TABLE "GatewayMetrics" ENABLE ROW LEVEL SECURITY;

CREATE POLICY gateway_metrics_select ON "GatewayMetrics"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- PaymentAlert
ALTER TABLE "PaymentAlert" ENABLE ROW LEVEL SECURITY;

CREATE POLICY payment_alert_select ON "PaymentAlert"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

CREATE POLICY payment_alert_update ON "PaymentAlert"
  FOR UPDATE USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- PaymentRetryQueue
ALTER TABLE "PaymentRetryQueue" ENABLE ROW LEVEL SECURITY;

CREATE POLICY retry_queue_select ON "PaymentRetryQueue"
  FOR SELECT USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- GatewayConfigCache
ALTER TABLE "GatewayConfigCache" ENABLE ROW LEVEL SECURITY;

CREATE POLICY gateway_cache_all ON "GatewayConfigCache"
  FOR ALL USING (
    "organizationId" IN (
      SELECT "organizationId" FROM "User" WHERE id = auth.uid()
    )
  );

-- ============================================
-- 12. GRANTS
-- ============================================

GRANT SELECT, INSERT ON "PaymentEvent" TO authenticated;
GRANT SELECT ON "GatewayMetrics" TO authenticated;
GRANT SELECT, UPDATE ON "PaymentAlert" TO authenticated;
GRANT SELECT ON "PaymentRetryQueue" TO authenticated;
GRANT ALL ON "GatewayConfigCache" TO authenticated;

GRANT SELECT ON "CheckoutMetricsView" TO authenticated;
GRANT SELECT ON "GatewayPerformanceView" TO authenticated;
GRANT SELECT ON "FailingGatewaysView" TO authenticated;

-- ============================================
-- 13. COMENTÁRIOS
-- ============================================

COMMENT ON TABLE "PaymentEvent" IS 'Registro completo de todos os eventos do sistema de pagamento';
COMMENT ON TABLE "GatewayMetrics" IS 'Cache de métricas agregadas por gateway e período';
COMMENT ON TABLE "PaymentAlert" IS 'Alertas de problemas no sistema de pagamento';
COMMENT ON TABLE "PaymentRetryQueue" IS 'Fila de retry automático com exponential backoff';
COMMENT ON TABLE "GatewayConfigCache" IS 'Cache de configurações de gateway para performance';

COMMENT ON FUNCTION refresh_payment_metrics() IS 'Atualiza todas as views materializadas de métricas';
COMMENT ON FUNCTION calculate_next_retry(INTEGER, INTEGER, INTEGER) IS 'Calcula próximo retry usando exponential backoff';
COMMENT ON FUNCTION enqueue_payment_retry(UUID, UUID, TEXT, INTEGER) IS 'Adiciona transação na fila de retry automático';
COMMENT ON FUNCTION log_payment_event(UUID, UUID
