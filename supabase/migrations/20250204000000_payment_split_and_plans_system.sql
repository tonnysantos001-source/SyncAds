-- ============================================
-- SISTEMA DE SPLIT DE PAGAMENTO E PLANOS
-- Data: 04/02/2025
-- Descrição: Sistema completo de split inteligente de pagamento e gestão de planos com limites diários
-- ============================================

-- ============================================
-- PARTE 1: EXPANDIR TABELA DE PLANOS
-- ============================================

-- Adicionar novos campos à tabela Plan
ALTER TABLE "Plan"
  ADD COLUMN IF NOT EXISTS "maxAiMessagesDaily" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "maxAiImagesDaily" INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "maxCheckoutPages" INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "maxProducts" INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS "hasCustomDomain" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasAdvancedAnalytics" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasPrioritySupport" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "hasApiAccess" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "transactionFeePercentage" DECIMAL(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "transactionFeeFixed" DECIMAL(10,2) DEFAULT 0;

-- Atualizar planos existentes com valores padrão
UPDATE "Plan"
SET
  "maxAiMessagesDaily" = CASE
    WHEN slug = 'free' THEN 10
    WHEN slug = 'starter' THEN 50
    WHEN slug = 'pro' THEN 200
    WHEN slug = 'enterprise' THEN 1000
    ELSE 10
  END,
  "maxAiImagesDaily" = CASE
    WHEN slug = 'free' THEN 5
    WHEN slug = 'starter' THEN 20
    WHEN slug = 'pro' THEN 100
    WHEN slug = 'enterprise' THEN 500
    ELSE 5
  END,
  "maxCheckoutPages" = CASE
    WHEN slug = 'free' THEN 1
    WHEN slug = 'starter' THEN 3
    WHEN slug = 'pro' THEN 10
    WHEN slug = 'enterprise' THEN 999
    ELSE 1
  END
WHERE "maxAiMessagesDaily" = 0 OR "maxAiMessagesDaily" IS NULL;

-- ============================================
-- PARTE 2: TABELA DE USO DIÁRIO DE PLANOS
-- ============================================

CREATE TABLE IF NOT EXISTS "PlanDailyUsage" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Contadores de uso
  "aiMessagesUsed" INTEGER DEFAULT 0,
  "aiImagesUsed" INTEGER DEFAULT 0,

  -- Metadata
  "lastResetAt" TIMESTAMP DEFAULT NOW(),
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),

  UNIQUE("userId", date)
);

CREATE INDEX idx_plan_daily_usage_user ON "PlanDailyUsage"("userId");
CREATE INDEX idx_plan_daily_usage_date ON "PlanDailyUsage"(date);

-- ============================================
-- PARTE 3: TABELA DE REGRAS DE SPLIT DE PAGAMENTO
-- ============================================

CREATE TABLE IF NOT EXISTS "PaymentSplitRule" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Configuração
  name TEXT NOT NULL,
  description TEXT,

  -- A quem se aplica (NULL = global para todos)
  "userId" TEXT REFERENCES "User"(id) ON DELETE CASCADE,

  -- Tipo de regra
  type TEXT NOT NULL DEFAULT 'frequency' CHECK (type IN (
    'frequency',      -- A cada X transações
    'time',          -- A cada X horas/dias
    'value',         -- Transações acima de X reais
    'manual',        -- Controle manual
    'percentage'     -- X% das transações
  )),

  -- Configurações de frequência
  "frequencyEvery" INTEGER DEFAULT 10,           -- A cada X transações
  "frequencyTake" INTEGER DEFAULT 1,             -- Quantas transações pegar

  -- Configurações de tempo
  "timeInterval" TEXT CHECK ("timeInterval" IN ('hour', 'day', 'week')),
  "timeEvery" INTEGER DEFAULT 24,                -- A cada X horas/dias

  -- Configurações de valor
  "minValue" DECIMAL(10,2),                      -- Valor mínimo
  "maxValue" DECIMAL(10,2),                      -- Valor máximo

  -- Configurações de percentual
  percentage DECIMAL(5,2),                       -- % de transações para admin gateway

  -- Gateway do admin (seu gateway)
  "adminGatewayId" UUID REFERENCES "Gateway"(id) ON DELETE SET NULL,

  -- Controles
  "isActive" BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,                    -- Prioridade (maior número = maior prioridade)

  -- Contadores internos (não editar manualmente)
  "transactionCounter" INTEGER DEFAULT 0,
  "lastTriggeredAt" TIMESTAMP,

  -- Estatísticas
  "totalTransactions" INTEGER DEFAULT 0,
  "adminTransactions" INTEGER DEFAULT 0,
  "clientTransactions" INTEGER DEFAULT 0,
  "totalAdminRevenue" DECIMAL(15,2) DEFAULT 0,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_split_rule_user ON "PaymentSplitRule"("userId");
CREATE INDEX idx_split_rule_active ON "PaymentSplitRule"("isActive");
CREATE INDEX idx_split_rule_type ON "PaymentSplitRule"(type);
CREATE INDEX idx_split_rule_priority ON "PaymentSplitRule"(priority DESC);

-- ============================================
-- PARTE 4: TABELA DE LOG DE SPLIT DE PAGAMENTO
-- ============================================

CREATE TABLE IF NOT EXISTS "PaymentSplitLog" (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Relacionamentos
  "transactionId" UUID REFERENCES "Transaction"(id) ON DELETE CASCADE,
  "orderId" UUID REFERENCES "Order"(id) ON DELETE CASCADE,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  "ruleId" UUID REFERENCES "PaymentSplitRule"(id) ON DELETE SET NULL,

  -- Decisão tomada
  decision TEXT NOT NULL CHECK (decision IN ('admin', 'client')),

  -- Gateway utilizado
  "gatewayId" UUID REFERENCES "Gateway"(id) ON DELETE SET NULL,
  "gatewayName" TEXT,

  -- Valores
  amount DECIMAL(10,2) NOT NULL,
  "adminRevenue" DECIMAL(10,2) DEFAULT 0,
  "clientRevenue" DECIMAL(10,2) DEFAULT 0,

  -- Detalhes da decisão
  "ruleType" TEXT,
  "ruleName" TEXT,
  reason TEXT,
  "counterValue" INTEGER,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  "createdAt" TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_split_log_transaction ON "PaymentSplitLog"("transactionId");
CREATE INDEX idx_split_log_order ON "PaymentSplitLog"("orderId");
CREATE INDEX idx_split_log_user ON "PaymentSplitLog"("userId");
CREATE INDEX idx_split_log_rule ON "PaymentSplitLog"("ruleId");
CREATE INDEX idx_split_log_decision ON "PaymentSplitLog"(decision);
CREATE INDEX idx_split_log_created ON "PaymentSplitLog"("createdAt" DESC);

-- ============================================
-- PARTE 5: FUNÇÃO PARA RESETAR CONTADORES DIÁRIOS
-- ============================================

CREATE OR REPLACE FUNCTION reset_daily_usage_counters()
RETURNS void AS $$
BEGIN
  -- Inserir novos registros para hoje se não existirem
  INSERT INTO "PlanDailyUsage" ("userId", date, "aiMessagesUsed", "aiImagesUsed")
  SELECT
    id,
    CURRENT_DATE,
    0,
    0
  FROM "User"
  WHERE "isActive" = true
  ON CONFLICT ("userId", date) DO NOTHING;

  -- Limpar registros antigos (mais de 90 dias)
  DELETE FROM "PlanDailyUsage"
  WHERE date < CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 6: FUNÇÃO PARA INCREMENTAR USO DIÁRIO
-- ============================================

CREATE OR REPLACE FUNCTION increment_daily_usage(
  p_user_id TEXT,
  p_message_type TEXT -- 'message' ou 'image'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_usage INTEGER;
  v_limit INTEGER;
  v_plan_id UUID;
BEGIN
  -- Buscar plano do usuário
  SELECT "currentPlanId" INTO v_plan_id
  FROM "User"
  WHERE id = p_user_id;

  IF v_plan_id IS NULL THEN
    RETURN false;
  END IF;

  -- Buscar limite do plano
  IF p_message_type = 'message' THEN
    SELECT "maxAiMessagesDaily" INTO v_limit
    FROM "Plan"
    WHERE id = v_plan_id;

    -- Buscar uso atual
    SELECT COALESCE("aiMessagesUsed", 0) INTO v_current_usage
    FROM "PlanDailyUsage"
    WHERE "userId" = p_user_id AND date = CURRENT_DATE;

  ELSIF p_message_type = 'image' THEN
    SELECT "maxAiImagesDaily" INTO v_limit
    FROM "Plan"
    WHERE id = v_plan_id;

    -- Buscar uso atual
    SELECT COALESCE("aiImagesUsed", 0) INTO v_current_usage
    FROM "PlanDailyUsage"
    WHERE "userId" = p_user_id AND date = CURRENT_DATE;

  ELSE
    RETURN false;
  END IF;

  -- Verificar se atingiu o limite (0 = ilimitado)
  IF v_limit > 0 AND v_current_usage >= v_limit THEN
    RETURN false;
  END IF;

  -- Incrementar contador
  INSERT INTO "PlanDailyUsage" ("userId", date, "aiMessagesUsed", "aiImagesUsed")
  VALUES (
    p_user_id,
    CURRENT_DATE,
    CASE WHEN p_message_type = 'message' THEN 1 ELSE 0 END,
    CASE WHEN p_message_type = 'image' THEN 1 ELSE 0 END
  )
  ON CONFLICT ("userId", date) DO UPDATE SET
    "aiMessagesUsed" = CASE
      WHEN p_message_type = 'message' THEN "PlanDailyUsage"."aiMessagesUsed" + 1
      ELSE "PlanDailyUsage"."aiMessagesUsed"
    END,
    "aiImagesUsed" = CASE
      WHEN p_message_type = 'image' THEN "PlanDailyUsage"."aiImagesUsed" + 1
      ELSE "PlanDailyUsage"."aiImagesUsed"
    END,
    "updatedAt" = NOW();

  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 7: FUNÇÃO PARA DETERMINAR GATEWAY DE SPLIT
-- ============================================

CREATE OR REPLACE FUNCTION determine_split_gateway(
  p_user_id TEXT,
  p_order_value DECIMAL(10,2)
)
RETURNS JSONB AS $$
DECLARE
  v_rule RECORD;
  v_result JSONB;
  v_decision TEXT;
  v_gateway_id UUID;
  v_reason TEXT;
BEGIN
  -- Buscar regra aplicável (ordem de prioridade)
  -- 1. Regra específica do usuário
  -- 2. Regra global

  FOR v_rule IN
    SELECT * FROM "PaymentSplitRule"
    WHERE "isActive" = true
      AND ("userId" = p_user_id OR "userId" IS NULL)
    ORDER BY
      CASE WHEN "userId" = p_user_id THEN 1 ELSE 2 END,
      priority DESC
    LIMIT 1
  LOOP
    -- Verificar tipo de regra
    IF v_rule.type = 'frequency' THEN
      -- Incrementar contador
      UPDATE "PaymentSplitRule"
      SET "transactionCounter" = "transactionCounter" + 1
      WHERE id = v_rule.id;

      -- Verificar se deve usar gateway admin
      IF (v_rule."transactionCounter" % v_rule."frequencyEvery") < v_rule."frequencyTake" THEN
        v_decision := 'admin';
        v_gateway_id := v_rule."adminGatewayId";
        v_reason := format('Frequency rule: %s of every %s transactions', v_rule."frequencyTake", v_rule."frequencyEvery");
      ELSE
        v_decision := 'client';
        v_reason := format('Frequency rule: client turn (counter: %s)', v_rule."transactionCounter");
      END IF;

    ELSIF v_rule.type = 'value' THEN
      -- Verificar valor da transação
      IF (v_rule."minValue" IS NULL OR p_order_value >= v_rule."minValue")
         AND (v_rule."maxValue" IS NULL OR p_order_value <= v_rule."maxValue") THEN
        v_decision := 'admin';
        v_gateway_id := v_rule."adminGatewayId";
        v_reason := format('Value rule: amount %s within range', p_order_value);
      ELSE
        v_decision := 'client';
        v_reason := 'Value rule: amount outside range';
      END IF;

    ELSIF v_rule.type = 'percentage' THEN
      -- Usar percentual para decidir
      IF (RANDOM() * 100) <= v_rule.percentage THEN
        v_decision := 'admin';
        v_gateway_id := v_rule."adminGatewayId";
        v_reason := format('Percentage rule: %s%% to admin', v_rule.percentage);
      ELSE
        v_decision := 'client';
        v_reason := format('Percentage rule: client turn');
      END IF;

    ELSE
      -- Default: cliente
      v_decision := 'client';
      v_reason := 'Default: client gateway';
    END IF;

    -- Atualizar estatísticas da regra
    UPDATE "PaymentSplitRule"
    SET
      "totalTransactions" = "totalTransactions" + 1,
      "adminTransactions" = CASE WHEN v_decision = 'admin' THEN "adminTransactions" + 1 ELSE "adminTransactions" END,
      "clientTransactions" = CASE WHEN v_decision = 'client' THEN "clientTransactions" + 1 ELSE "clientTransactions" END,
      "totalAdminRevenue" = CASE WHEN v_decision = 'admin' THEN "totalAdminRevenue" + p_order_value ELSE "totalAdminRevenue" END,
      "lastTriggeredAt" = NOW(),
      "updatedAt" = NOW()
    WHERE id = v_rule.id;

    -- Retornar resultado
    v_result := jsonb_build_object(
      'decision', v_decision,
      'gatewayId', v_gateway_id,
      'ruleId', v_rule.id,
      'ruleName', v_rule.name,
      'ruleType', v_rule.type,
      'reason', v_reason,
      'counterValue', v_rule."transactionCounter"
    );

    RETURN v_result;
  END LOOP;

  -- Se não encontrou regra, usar gateway do cliente
  v_result := jsonb_build_object(
    'decision', 'client',
    'gatewayId', NULL,
    'ruleId', NULL,
    'ruleName', 'Default',
    'ruleType', 'default',
    'reason', 'No active split rule found',
    'counterValue', NULL
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PARTE 8: TRIGGER PARA ATUALIZAR UPDATED_AT
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_plan_daily_usage_updated_at ON "PlanDailyUsage";
CREATE TRIGGER update_plan_daily_usage_updated_at
  BEFORE UPDATE ON "PlanDailyUsage"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_split_rule_updated_at ON "PaymentSplitRule";
CREATE TRIGGER update_payment_split_rule_updated_at
  BEFORE UPDATE ON "PaymentSplitRule"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- PARTE 9: INSERIR REGRA PADRÃO DE SPLIT
-- ============================================

INSERT INTO "PaymentSplitRule" (
  name,
  description,
  type,
  "frequencyEvery",
  "frequencyTake",
  "isActive",
  priority
) VALUES (
  'Regra Global Padrão',
  'A cada 10 transações, 2 vão para o gateway do SyncAds',
  'frequency',
  10,
  2,
  false, -- Desativado por padrão, admin ativa manualmente
  0
) ON CONFLICT DO NOTHING;

-- ============================================
-- PARTE 10: RLS POLICIES
-- ============================================

-- PlanDailyUsage
ALTER TABLE "PlanDailyUsage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_daily_usage_user_access" ON "PlanDailyUsage";
CREATE POLICY "plan_daily_usage_user_access" ON "PlanDailyUsage"
  FOR ALL
  USING (
    "userId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text
      AND "isSuperAdmin" = true
    )
  );

-- PaymentSplitRule
ALTER TABLE "PaymentSplitRule" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "split_rule_admin_only" ON "PaymentSplitRule";
CREATE POLICY "split_rule_admin_only" ON "PaymentSplitRule"
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text
      AND "isSuperAdmin" = true
    )
  );

DROP POLICY IF EXISTS "split_rule_user_read" ON "PaymentSplitRule";
CREATE POLICY "split_rule_user_read" ON "PaymentSplitRule"
  FOR SELECT
  USING (
    "userId" = auth.uid()::text
    OR "userId" IS NULL
  );

-- PaymentSplitLog
ALTER TABLE "PaymentSplitLog" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "split_log_user_access" ON "PaymentSplitLog";
CREATE POLICY "split_log_user_access" ON "PaymentSplitLog"
  FOR SELECT
  USING (
    "userId" = auth.uid()::text
    OR EXISTS (
      SELECT 1 FROM "User"
      WHERE id = auth.uid()::text
      AND "isSuperAdmin" = true
    )
  );

DROP POLICY IF EXISTS "split_log_admin_insert" ON "PaymentSplitLog";
CREATE POLICY "split_log_admin_insert" ON "PaymentSplitLog"
  FOR INSERT
  WITH CHECK (true); -- Sistema pode inserir logs

-- ============================================
-- COMENTÁRIOS
-- ============================================

COMMENT ON TABLE "PlanDailyUsage" IS 'Rastreamento de uso diário de recursos por usuário';
COMMENT ON TABLE "PaymentSplitRule" IS 'Regras configuráveis de split de pagamento entre admin e cliente';
COMMENT ON TABLE "PaymentSplitLog" IS 'Histórico completo de decisões de split de pagamento';

COMMENT ON COLUMN "Plan"."maxAiMessagesDaily" IS 'Limite diário de mensagens de IA (0 = ilimitado)';
COMMENT ON COLUMN "Plan"."transactionFeePercentage" IS 'Taxa percentual por transação do checkout';
COMMENT ON COLUMN "PaymentSplitRule"."frequencyEvery" IS 'A cada quantas transações aplicar a regra';
COMMENT ON COLUMN "PaymentSplitRule"."frequencyTake" IS 'Quantas transações consecutivas vão para o admin gateway';
COMMENT ON COLUMN "PaymentSplitLog"."decision" IS 'admin = vai pro gateway do SyncAds, client = vai pro gateway do cliente';

-- ============================================
-- FIM DA MIGRATION
-- ============================================
