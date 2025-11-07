-- Migration: Sistema de Automações
-- Cria tabela AutomationRule para regras de automação inteligente

-- Criar tabela AutomationRule
CREATE TABLE IF NOT EXISTS "AutomationRule" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,

  -- Trigger: condição que ativa a regra
  trigger JSONB NOT NULL,
  -- Exemplo: {"type": "metric_threshold", "metric": "cpc", "condition": ">", "value": 5, "platform": "META_ADS"}
  -- Exemplo: {"type": "roas_below", "value": 1, "campaignId": "123"}
  -- Exemplo: {"type": "schedule", "time": "09:00", "days": ["monday", "wednesday"]}

  -- Action: ação a ser executada
  action JSONB NOT NULL,
  -- Exemplo: {"type": "pause_campaign", "campaignId": "123"}
  -- Exemplo: {"type": "adjust_budget", "campaignId": "123", "amount": 20, "direction": "increase"}
  -- Exemplo: {"type": "send_notification", "message": "ROAS baixo detectado"}
  -- Exemplo: {"type": "create_alert", "severity": "high"}

  -- Configurações adicionais
  "cooldownMinutes" INTEGER DEFAULT 60, -- Tempo mínimo entre execuções
  "maxExecutions" INTEGER, -- Limite de execuções (null = ilimitado)
  "executionCount" INTEGER DEFAULT 0, -- Contador de execuções
  "lastExecutedAt" TIMESTAMP WITH TIME ZONE,

  -- Metadados
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS "AutomationRule_userId_idx" ON "AutomationRule"("userId");
CREATE INDEX IF NOT EXISTS "AutomationRule_isActive_idx" ON "AutomationRule"("isActive");
CREATE INDEX IF NOT EXISTS "AutomationRule_lastExecutedAt_idx" ON "AutomationRule"("lastExecutedAt");
CREATE INDEX IF NOT EXISTS "AutomationRule_createdAt_idx" ON "AutomationRule"("createdAt");

-- Índice GIN para busca em JSONB
CREATE INDEX IF NOT EXISTS "AutomationRule_trigger_idx" ON "AutomationRule" USING GIN (trigger);
CREATE INDEX IF NOT EXISTS "AutomationRule_action_idx" ON "AutomationRule" USING GIN (action);

-- Criar tabela de histórico de execuções
CREATE TABLE IF NOT EXISTS "AutomationRuleExecution" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "ruleId" UUID NOT NULL REFERENCES "AutomationRule"(id) ON DELETE CASCADE,
  "executedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'skipped')),

  -- Dados da execução
  "triggerData" JSONB, -- Dados que ativaram a regra
  "actionResult" JSONB, -- Resultado da ação executada
  error TEXT, -- Mensagem de erro se falhou

  -- Métricas
  "executionTimeMs" INTEGER, -- Tempo de execução em milissegundos

  CONSTRAINT "AutomationRuleExecution_executedAt_check" CHECK ("executedAt" <= NOW())
);

-- Índices para histórico
CREATE INDEX IF NOT EXISTS "AutomationRuleExecution_ruleId_idx" ON "AutomationRuleExecution"("ruleId");
CREATE INDEX IF NOT EXISTS "AutomationRuleExecution_executedAt_idx" ON "AutomationRuleExecution"("executedAt");
CREATE INDEX IF NOT EXISTS "AutomationRuleExecution_status_idx" ON "AutomationRuleExecution"(status);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_automation_rule_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_rule_updated_at_trigger
  BEFORE UPDATE ON "AutomationRule"
  FOR EACH ROW
  EXECUTE FUNCTION update_automation_rule_updated_at();

-- Enable Row Level Security
ALTER TABLE "AutomationRule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AutomationRuleExecution" ENABLE ROW LEVEL SECURITY;

-- RLS Policies para AutomationRule
CREATE POLICY "Users can view their own automation rules"
  ON "AutomationRule"
  FOR SELECT
  USING (auth.uid() = "userId");

CREATE POLICY "Users can create their own automation rules"
  ON "AutomationRule"
  FOR INSERT
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can update their own automation rules"
  ON "AutomationRule"
  FOR UPDATE
  USING (auth.uid() = "userId")
  WITH CHECK (auth.uid() = "userId");

CREATE POLICY "Users can delete their own automation rules"
  ON "AutomationRule"
  FOR DELETE
  USING (auth.uid() = "userId");

-- RLS Policies para AutomationRuleExecution
CREATE POLICY "Users can view their own automation rule executions"
  ON "AutomationRuleExecution"
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "AutomationRule"
      WHERE "AutomationRule".id = "AutomationRuleExecution"."ruleId"
        AND "AutomationRule"."userId" = auth.uid()
    )
  );

CREATE POLICY "System can insert automation rule executions"
  ON "AutomationRuleExecution"
  FOR INSERT
  WITH CHECK (true); -- Edge function usa service role

-- Comentários para documentação
COMMENT ON TABLE "AutomationRule" IS 'Regras de automação configuradas pelos usuários';
COMMENT ON TABLE "AutomationRuleExecution" IS 'Histórico de execuções das regras de automação';

COMMENT ON COLUMN "AutomationRule".trigger IS 'Condição que ativa a regra (formato JSON)';
COMMENT ON COLUMN "AutomationRule".action IS 'Ação a ser executada quando regra é ativada (formato JSON)';
COMMENT ON COLUMN "AutomationRule"."cooldownMinutes" IS 'Tempo mínimo entre execuções da mesma regra';
COMMENT ON COLUMN "AutomationRule"."maxExecutions" IS 'Limite máximo de execuções (null = ilimitado)';

-- Inserir algumas regras de exemplo (comentadas para produção)
-- INSERT INTO "AutomationRule" ("userId", name, description, trigger, action)
-- VALUES (
--   'user-uuid-aqui',
--   'Pausar campanhas com ROAS baixo',
--   'Pausa automaticamente campanhas quando ROAS fica abaixo de 1x',
--   '{"type": "roas_below", "value": 1, "platform": "META_ADS"}',
--   '{"type": "pause_campaign", "notify": true}'
-- );

-- Criar função helper para verificar se regra pode executar
CREATE OR REPLACE FUNCTION can_execute_automation_rule(rule_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  rule_record RECORD;
  time_since_last_execution INTERVAL;
BEGIN
  SELECT * INTO rule_record
  FROM "AutomationRule"
  WHERE id = rule_id;

  -- Verifica se regra está ativa
  IF NOT rule_record."isActive" THEN
    RETURN FALSE;
  END IF;

  -- Verifica limite de execuções
  IF rule_record."maxExecutions" IS NOT NULL AND
     rule_record."executionCount" >= rule_record."maxExecutions" THEN
    RETURN FALSE;
  END IF;

  -- Verifica cooldown
  IF rule_record."lastExecutedAt" IS NOT NULL THEN
    time_since_last_execution := NOW() - rule_record."lastExecutedAt";
    IF EXTRACT(EPOCH FROM time_since_last_execution) / 60 < rule_record."cooldownMinutes" THEN
      RETURN FALSE;
    END IF;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION can_execute_automation_rule IS 'Verifica se uma regra pode ser executada respeitando cooldown e limites';
