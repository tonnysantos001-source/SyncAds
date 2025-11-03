-- ============================================
-- SCRIPT: Configurar Gateway Pague-X
-- Executar no Supabase SQL Editor
-- Data: 2025-01-31
-- ============================================

BEGIN;

-- ========================================
-- 1. ATUALIZAR/CRIAR GATEWAY PAGUE-X
-- ========================================

-- Atualizar fusionpay existente para paguex
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

-- Criar gateway Pague-X se não existir
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
  true,
  true,
  true,
  true,
  false,
  true,
  'NACIONAL_GLOBAL',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM "Gateway" WHERE slug = 'paguex'
);

-- ========================================
-- 2. MIGRAR CONFIGURAÇÕES FUSIONPAY → PAGUEX
-- ========================================

UPDATE "GatewayConfig" gc
SET
  "gatewayId" = (SELECT id FROM "Gateway" WHERE slug = 'paguex'),
  "updatedAt" = NOW()
WHERE gc."gatewayId" IN (
  SELECT id FROM "Gateway" WHERE slug = 'fusionpay'
);

-- ========================================
-- 3. REMOVER GATEWAY ANTIGO
-- ========================================

DELETE FROM "Gateway"
WHERE slug = 'fusionpay'
AND NOT EXISTS (
  SELECT 1 FROM "GatewayConfig" WHERE "gatewayId" = "Gateway".id
);

-- ========================================
-- 4. VERIFICAR RESULTADO
-- ========================================

DO $$
DECLARE
  v_gateway_id UUID;
  v_config_count INTEGER;
BEGIN
  SELECT id INTO v_gateway_id FROM "Gateway" WHERE slug = 'paguex';
  SELECT COUNT(*) INTO v_config_count FROM "GatewayConfig" WHERE "gatewayId" = v_gateway_id;

  RAISE NOTICE '✅ PAGUE-X CONFIGURADO COM SUCESSO!';
  RAISE NOTICE 'Gateway ID: %', v_gateway_id;
  RAISE NOTICE 'Configurações: %', v_config_count;
  RAISE NOTICE 'API: https://api.inpagamentos.com/v1';
  RAISE NOTICE 'Credenciais: publicKey + secretKey';
END $$;

COMMIT;

-- ========================================
-- CONSULTAR GATEWAY CRIADO
-- ========================================

SELECT
  id,
  name,
  slug,
  "apiUrl",
  "supportsPix",
  "supportsCreditCard",
  "supportsBoleto",
  "supportsDebitCard",
  "isActive",
  "requiredCredentials"
FROM "Gateway"
WHERE slug = 'paguex';
