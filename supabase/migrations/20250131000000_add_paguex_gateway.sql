-- ============================================
-- MIGRATION: Adicionar/Atualizar Gateway Pague-X
-- Data: 2025-01-31
-- Descrição: Adiciona ou atualiza gateway Pague-X (inpagamentos.com)
--            anteriormente chamado FusionPay
-- ============================================

BEGIN;

-- ========================================
-- 1. VERIFICAR E RENOMEAR FUSIONPAY PARA PAGUEX
-- ========================================

-- Atualizar gateway existente se for fusionpay
UPDATE "Gateway"
SET
  name = 'Pague-X',
  slug = 'paguex',
  "apiUrl" = 'https://api.inpagamentos.com/v1',
  "websiteUrl" = 'https://inpagamentos.com',
  "documentationUrl" = 'https://app.inpagamentos.com/docs/intro/first-steps',
  "requiredCredentials" = ARRAY['publicKey', 'secretKey']::text[],
  "supportsPix" = true,
  "supportsCreditCard" = true,
  "supportsBoleto" = true,
  "supportsDebitCard" = true,
  "supportsWallet" = false,
  "isActive" = true,
  scope = 'NACIONAL_GLOBAL',
  "updatedAt" = NOW()
WHERE slug = 'fusionpay';

-- ========================================
-- 2. CRIAR GATEWAY PAGUEX SE NÃO EXISTIR
-- ========================================

INSERT INTO "Gateway" (
  name,
  slug,
  "apiUrl",
  "websiteUrl",
  "documentationUrl",
  "requiredCredentials",
  "supportsPix",
  "supportsCreditCard",
  "supportsBoleto",
  "supportsDebitCard",
  "supportsWallet",
  "isActive",
  scope,
  "createdAt",
  "updatedAt"
)
SELECT
  'Pague-X',
  'paguex',
  'https://api.inpagamentos.com/v1',
  'https://inpagamentos.com',
  'https://app.inpagamentos.com/docs/intro/first-steps',
  ARRAY['publicKey', 'secretKey']::text[],
  true,  -- supportsPix
  true,  -- supportsCreditCard
  true,  -- supportsBoleto
  true,  -- supportsDebitCard
  false, -- supportsWallet
  true,  -- isActive
  'NACIONAL_GLOBAL',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Gateway" WHERE slug = 'paguex'
);

-- ========================================
-- 3. ATUALIZAR CONFIGURAÇÕES EXISTENTES
-- ========================================

-- Atualizar GatewayConfig que apontavam para fusionpay
UPDATE "GatewayConfig" gc
SET
  "gatewayId" = (SELECT id FROM "Gateway" WHERE slug = 'paguex'),
  "updatedAt" = NOW()
WHERE gc."gatewayId" IN (
  SELECT id FROM "Gateway" WHERE slug = 'fusionpay'
);

-- ========================================
-- 4. REMOVER GATEWAY FUSIONPAY ANTIGO (SE EXISTIR)
-- ========================================

-- Verificar se não há mais referências antes de deletar
DELETE FROM "Gateway"
WHERE slug = 'fusionpay'
AND NOT EXISTS (
  SELECT 1 FROM "GatewayConfig" WHERE "gatewayId" = "Gateway".id
);

-- ========================================
-- 5. CRIAR ÍNDICES SE NÃO EXISTIREM
-- ========================================

-- Índice para busca rápida por slug
CREATE INDEX IF NOT EXISTS idx_gateway_slug
ON "Gateway"(slug);

-- Índice para gateways ativos
CREATE INDEX IF NOT EXISTS idx_gateway_active
ON "Gateway"("isActive")
WHERE "isActive" = true;

-- Índice composto para GatewayConfig
CREATE INDEX IF NOT EXISTS idx_gateway_config_user_gateway
ON "GatewayConfig"("userId", "gatewayId", "isActive");

-- ========================================
-- 6. LOG DE SUCESSO
-- ========================================

DO $$
DECLARE
  v_gateway_id UUID;
  v_config_count INTEGER;
BEGIN
  -- Buscar ID do gateway
  SELECT id INTO v_gateway_id
  FROM "Gateway"
  WHERE slug = 'paguex';

  -- Contar configurações
  SELECT COUNT(*) INTO v_config_count
  FROM "GatewayConfig"
  WHERE "gatewayId" = v_gateway_id;

  RAISE NOTICE '✅ Gateway Pague-X configurado com sucesso!';
  RAISE NOTICE '   ID: %', v_gateway_id;
  RAISE NOTICE '   Configurações existentes: %', v_config_count;
  RAISE NOTICE '   API URL: https://api.inpagamentos.com/v1';
  RAISE NOTICE '   Credenciais necessárias: publicKey, secretKey';
  RAISE NOTICE '   Métodos suportados: PIX, Cartão de Crédito/Débito, Boleto';
END $$;

COMMIT;

-- ========================================
-- VERIFICAÇÃO FINAL
-- ========================================

-- Exibir informações do gateway criado/atualizado
SELECT
  id,
  name,
  slug,
  "apiUrl",
  "supportsPix",
  "supportsCreditCard",
  "supportsBoleto",
  "isActive",
  "createdAt"
FROM "Gateway"
WHERE slug = 'paguex';
