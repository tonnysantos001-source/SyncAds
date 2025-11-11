-- Migration: Sistema de Filas de Pagamentos
-- Criado em: 2025-02-05
-- Descrição: Implementa sistema de filas para processar pagamentos de forma assíncrona

-- ============================================================================
-- 1. ENUMS
-- ============================================================================

-- Tipo de job na fila
CREATE TYPE payment_job_type AS ENUM (
  'PAYMENT_PROCESS',
  'SUBSCRIPTION_RENEWAL',
  'PAYMENT_REFUND',
  'PAYMENT_RETRY',
  'WEBHOOK_PROCESS',
  'PIX_VERIFICATION',
  'CHECKOUT_VALIDATION'
);

-- Status do job
CREATE TYPE payment_job_status AS ENUM (
  'PENDING',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
  'CANCELLED',
  'RETRYING'
);

-- Prioridade do job
CREATE TYPE payment_job_priority AS ENUM (
  'HIGH',
  'MEDIUM',
  'LOW'
);

-- ============================================================================
-- 2. TABELA PRINCIPAL: PaymentQueue
-- ============================================================================

CREATE TABLE IF NOT EXISTS "PaymentQueue" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "jobType" payment_job_type NOT NULL,
  "status" payment_job_status NOT NULL DEFAULT 'PENDING',
  "priority" payment_job_priority NOT NULL DEFAULT 'MEDIUM',

  -- Dados do job
  "payload" JSONB NOT NULL,
  "result" JSONB,

  -- Retry logic
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "maxAttempts" INTEGER NOT NULL DEFAULT 3,
  "nextRetryAt" TIMESTAMPTZ,
  "lastAttemptAt" TIMESTAMPTZ,

  -- Metadados
  "userId" TEXT,
  "orderId" UUID,
  "transactionId" TEXT,

  -- Rastreamento
  "error" TEXT,
  "errorDetails" JSONB,
  "processingStartedAt" TIMESTAMPTZ,
  "processingCompletedAt" TIMESTAMPTZ,

  -- Timestamps
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 3. ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Buscar jobs pendentes por prioridade
CREATE INDEX IF NOT EXISTS "idx_payment_queue_pending"
  ON "PaymentQueue" ("status", "priority", "nextRetryAt")
  WHERE "status" IN ('PENDING', 'RETRYING');

-- Buscar jobs por tipo
CREATE INDEX IF NOT EXISTS "idx_payment_queue_job_type"
  ON "PaymentQueue" ("jobType", "status", "createdAt");

-- Buscar jobs por usuário
CREATE INDEX IF NOT EXISTS "idx_payment_queue_user"
  ON "PaymentQueue" ("userId", "status");

-- Buscar jobs por pedido
CREATE INDEX IF NOT EXISTS "idx_payment_queue_order"
  ON "PaymentQueue" ("orderId", "status");

-- Buscar jobs para retry
CREATE INDEX IF NOT EXISTS "idx_payment_queue_retry"
  ON "PaymentQueue" ("nextRetryAt")
  WHERE "status" = 'RETRYING' AND "nextRetryAt" IS NOT NULL;

-- Buscar jobs em processamento (detectar travados)
CREATE INDEX IF NOT EXISTS "idx_payment_queue_processing"
  ON "PaymentQueue" ("processingStartedAt")
  WHERE "status" = 'PROCESSING';

-- ============================================================================
-- 4. TRIGGER PARA UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_payment_queue_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payment_queue_updated_at
  BEFORE UPDATE ON "PaymentQueue"
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_queue_updated_at();

-- ============================================================================
-- 5. FUNÇÕES AUXILIARES
-- ============================================================================

-- Enfileirar novo job
CREATE OR REPLACE FUNCTION enqueue_payment_job(
  p_job_type payment_job_type,
  p_payload JSONB,
  p_priority payment_job_priority DEFAULT 'MEDIUM',
  p_user_id TEXT DEFAULT NULL,
  p_order_id UUID DEFAULT NULL,
  p_max_attempts INTEGER DEFAULT 3
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  INSERT INTO "PaymentQueue" (
    "jobType",
    "payload",
    "priority",
    "userId",
    "orderId",
    "maxAttempts",
    "status"
  )
  VALUES (
    p_job_type,
    p_payload,
    p_priority,
    p_user_id,
    p_order_id,
    p_max_attempts,
    'PENDING'
  )
  RETURNING "id" INTO v_job_id;

  RETURN v_job_id;
END;
$$;

-- Buscar próximo job para processar
CREATE OR REPLACE FUNCTION get_next_payment_job()
RETURNS TABLE(
  id UUID,
  job_type payment_job_type,
  payload JSONB,
  attempts INTEGER,
  max_attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
BEGIN
  -- Buscar e travar o próximo job disponível
  SELECT pq."id"
  INTO v_job_id
  FROM "PaymentQueue" pq
  WHERE (
    pq."status" = 'PENDING'
    OR (pq."status" = 'RETRYING' AND pq."nextRetryAt" <= NOW())
  )
  AND pq."attempts" < pq."maxAttempts"
  ORDER BY
    CASE pq."priority"
      WHEN 'HIGH' THEN 1
      WHEN 'MEDIUM' THEN 2
      WHEN 'LOW' THEN 3
    END,
    pq."createdAt" ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  -- Se encontrou um job, marcar como processando
  IF v_job_id IS NOT NULL THEN
    UPDATE "PaymentQueue"
    SET
      "status" = 'PROCESSING',
      "attempts" = "attempts" + 1,
      "lastAttemptAt" = NOW(),
      "processingStartedAt" = NOW()
    WHERE "id" = v_job_id;

    -- Retornar dados do job
    RETURN QUERY
    SELECT
      pq."id",
      pq."jobType",
      pq."payload",
      pq."attempts",
      pq."maxAttempts"
    FROM "PaymentQueue" pq
    WHERE pq."id" = v_job_id;
  END IF;
END;
$$;

-- Marcar job como completado
CREATE OR REPLACE FUNCTION complete_payment_job(
  p_job_id UUID,
  p_result JSONB DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE "PaymentQueue"
  SET
    "status" = 'COMPLETED',
    "result" = p_result,
    "processingCompletedAt" = NOW(),
    "error" = NULL,
    "errorDetails" = NULL
  WHERE "id" = p_job_id;

  RETURN FOUND;
END;
$$;

-- Marcar job como falho
CREATE OR REPLACE FUNCTION fail_payment_job(
  p_job_id UUID,
  p_error TEXT,
  p_error_details JSONB DEFAULT NULL,
  p_retry_after_seconds INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_attempts INTEGER;
  v_max_attempts INTEGER;
BEGIN
  -- Buscar tentativas
  SELECT "attempts", "maxAttempts"
  INTO v_attempts, v_max_attempts
  FROM "PaymentQueue"
  WHERE "id" = p_job_id;

  -- Se ainda há tentativas, marcar para retry
  IF v_attempts < v_max_attempts THEN
    UPDATE "PaymentQueue"
    SET
      "status" = 'RETRYING',
      "error" = p_error,
      "errorDetails" = p_error_details,
      "nextRetryAt" = NOW() + (p_retry_after_seconds || ' seconds')::INTERVAL,
      "processingCompletedAt" = NOW()
    WHERE "id" = p_job_id;
  ELSE
    -- Esgotou tentativas, marcar como falho
    UPDATE "PaymentQueue"
    SET
      "status" = 'FAILED',
      "error" = p_error,
      "errorDetails" = p_error_details,
      "processingCompletedAt" = NOW()
    WHERE "id" = p_job_id;
  END IF;

  RETURN FOUND;
END;
$$;

-- Cancelar job
CREATE OR REPLACE FUNCTION cancel_payment_job(
  p_job_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE "PaymentQueue"
  SET
    "status" = 'CANCELLED',
    "error" = p_reason,
    "processingCompletedAt" = NOW()
  WHERE "id" = p_job_id
  AND "status" IN ('PENDING', 'RETRYING', 'FAILED');

  RETURN FOUND;
END;
$$;

-- Limpar jobs antigos (completados há mais de 7 dias)
CREATE OR REPLACE FUNCTION cleanup_old_payment_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM "PaymentQueue"
  WHERE "status" IN ('COMPLETED', 'CANCELLED', 'FAILED')
  AND "processingCompletedAt" < NOW() - INTERVAL '7 days';

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;

-- Detectar jobs travados (processando há mais de 5 minutos)
CREATE OR REPLACE FUNCTION recover_stuck_payment_jobs()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recovered_count INTEGER;
BEGIN
  UPDATE "PaymentQueue"
  SET
    "status" = 'RETRYING',
    "nextRetryAt" = NOW() + INTERVAL '1 minute',
    "error" = 'Job stuck in processing state - recovered automatically'
  WHERE "status" = 'PROCESSING'
  AND "processingStartedAt" < NOW() - INTERVAL '5 minutes';

  GET DIAGNOSTICS v_recovered_count = ROW_COUNT;
  RETURN v_recovered_count;
END;
$$;

-- ============================================================================
-- 6. POLÍTICAS RLS
-- ============================================================================

ALTER TABLE "PaymentQueue" ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas seus próprios jobs
CREATE POLICY "Users can view their own payment jobs"
  ON "PaymentQueue"
  FOR SELECT
  USING (
    auth.uid()::TEXT = "userId"
    OR
    auth.jwt() ->> 'role' = 'service_role'
  );

-- Service role pode fazer tudo
CREATE POLICY "Service role has full access to payment queue"
  ON "PaymentQueue"
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- 7. GRANTS
-- ============================================================================

GRANT EXECUTE ON FUNCTION enqueue_payment_job(payment_job_type, JSONB, payment_job_priority, TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_next_payment_job() TO service_role;
GRANT EXECUTE ON FUNCTION complete_payment_job(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION fail_payment_job(UUID, TEXT, JSONB, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION cancel_payment_job(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_payment_jobs() TO service_role;
GRANT EXECUTE ON FUNCTION recover_stuck_payment_jobs() TO service_role;

-- ============================================================================
-- 8. COMENTÁRIOS
-- ============================================================================

COMMENT ON TABLE "PaymentQueue" IS 'Fila de processamento assíncrono de pagamentos';
COMMENT ON FUNCTION enqueue_payment_job IS 'Adiciona um novo job de pagamento na fila';
COMMENT ON FUNCTION get_next_payment_job IS 'Busca e trava o próximo job disponível para processar';
COMMENT ON FUNCTION complete_payment_job IS 'Marca um job como completado com sucesso';
COMMENT ON FUNCTION fail_payment_job IS 'Marca um job como falho e agenda retry se necessário';
COMMENT ON FUNCTION cancel_payment_job IS 'Cancela um job pendente ou com falha';
COMMENT ON FUNCTION cleanup_old_payment_jobs IS 'Remove jobs antigos (7+ dias) para economizar espaço';
COMMENT ON FUNCTION recover_stuck_payment_jobs IS 'Recupera jobs travados em processamento';

-- ============================================================================
-- 9. DADOS INICIAIS / TESTES (OPCIONAL)
-- ============================================================================

-- Inserir job de teste (comentado - descomentar para testar)
-- SELECT enqueue_payment_job(
--   'PAYMENT_PROCESS',
--   '{"orderId": "123", "amount": 100.00, "method": "credit_card"}'::JSONB,
--   'HIGH',
--   'test-user-id',
--   NULL::UUID,
--   3
-- );
