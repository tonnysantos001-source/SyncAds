-- =====================================================
-- MIGRATION: Auto-assign Free Plan to New Users
-- =====================================================
-- Descrição: Atribui automaticamente o plano gratuito
-- para todos os novos usuários no momento do cadastro
-- =====================================================

-- =====================================================
-- FUNÇÃO: Atribuir plano gratuito ao novo usuário
-- =====================================================

CREATE OR REPLACE FUNCTION assign_free_plan_to_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_free_plan_id UUID;
BEGIN
  -- Buscar o ID do plano gratuito (preço = 0)
  SELECT id INTO v_free_plan_id
  FROM "PricingPlan"
  WHERE price = 0
    AND active = true
  ORDER BY "createdAt" ASC
  LIMIT 1;

  -- Se encontrou o plano gratuito, atribuir ao usuário
  IF v_free_plan_id IS NOT NULL THEN
    NEW."currentPlanId" := v_free_plan_id;

    -- Log para debug (opcional)
    RAISE NOTICE 'Plano gratuito % atribuído ao usuário %', v_free_plan_id, NEW.id;
  ELSE
    -- Se não encontrou plano gratuito, logar warning mas não falhar
    RAISE WARNING 'Nenhum plano gratuito encontrado. Usuário % criado sem plano.', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER: Executar antes de inserir novo usuário
-- =====================================================

DROP TRIGGER IF EXISTS trigger_assign_free_plan ON "User";

CREATE TRIGGER trigger_assign_free_plan
  BEFORE INSERT ON "User"
  FOR EACH ROW
  WHEN (NEW."currentPlanId" IS NULL) -- Só se não tiver plano definido
  EXECUTE FUNCTION assign_free_plan_to_new_user();

-- =====================================================
-- COMENTÁRIOS: Documentação
-- =====================================================

COMMENT ON FUNCTION assign_free_plan_to_new_user() IS
  'Atribui automaticamente o plano gratuito (preço = 0) para novos usuários';

COMMENT ON TRIGGER trigger_assign_free_plan ON "User" IS
  'Trigger que atribui plano gratuito automaticamente ao criar usuário';

-- =====================================================
-- CORREÇÃO: Atualizar usuários existentes sem plano
-- =====================================================

DO $$
DECLARE
  v_free_plan_id UUID;
  v_updated_count INTEGER := 0;
BEGIN
  -- Buscar ID do plano gratuito
  SELECT id INTO v_free_plan_id
  FROM "PricingPlan"
  WHERE price = 0
    AND active = true
  ORDER BY "createdAt" ASC
  LIMIT 1;

  -- Se encontrou, atualizar usuários sem plano
  IF v_free_plan_id IS NOT NULL THEN
    UPDATE "User"
    SET "currentPlanId" = v_free_plan_id,
        "updatedAt" = NOW()
    WHERE "currentPlanId" IS NULL;

    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RAISE NOTICE 'Plano gratuito atribuído a % usuários existentes', v_updated_count;
  ELSE
    RAISE WARNING 'Nenhum plano gratuito encontrado para atualizar usuários existentes';
  END IF;
END $$;

-- =====================================================
-- VALIDAÇÃO: Verificar se trigger foi criado
-- =====================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trigger_assign_free_plan'
  ) THEN
    RAISE NOTICE '✅ Trigger criado com sucesso: trigger_assign_free_plan';
  ELSE
    RAISE WARNING '❌ Trigger não foi criado: trigger_assign_free_plan';
  END IF;
END $$;
