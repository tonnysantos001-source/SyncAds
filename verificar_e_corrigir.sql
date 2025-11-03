-- ============================================
-- VERIFICAR E CORRIGIR GATEWAY
-- ============================================

-- 1. Ver o que existe atualmente
SELECT id, name, slug, type, "isActive"
FROM "Gateway"
WHERE slug IN ('fusionpay', 'paguex', 'fusion-pay')
ORDER BY slug;

-- 2. Ver configurações existentes
SELECT 
  gc.id,
  g.slug as gateway_slug,
  gc."userId",
  gc."isActive",
  gc."isDefault",
  gc.environment
FROM "GatewayConfig" gc
JOIN "Gateway" g ON g.id = gc."gatewayId"
WHERE g.slug IN ('fusionpay', 'paguex', 'fusion-pay')
ORDER BY gc."createdAt" DESC;

-- 3. DELETAR TUDO RELACIONADO A FUSIONPAY
DELETE FROM "GatewayConfig" 
WHERE "gatewayId" IN (
  SELECT id FROM "Gateway" WHERE slug IN ('fusionpay', 'fusion-pay')
);

DELETE FROM "Gateway" 
WHERE slug IN ('fusionpay', 'fusion-pay', 'paguex');

-- 4. CRIAR PAGUE-X LIMPO
INSERT INTO "Gateway" (
  name,
  slug,
  description,
  type,
  "supportsPix",
  "supportsCreditCard",
  "supportsBoleto",
  "supportsDebit",
  "requiredFields",
  documentation,
  "isActive",
  "isPopular"
) VALUES (
  'Pague-X',
  'paguex',
  'Gateway de pagamento Pague-X (inpagamentos.com) - PIX, Cartão e Boleto',
  'PAYMENT_PROCESSOR',
  true,
  true,
  true,
  true,
  '{"publicKey": "Chave Pública", "secretKey": "Chave Secreta"}'::jsonb,
  'https://app.inpagamentos.com/docs/intro/first-steps',
  true,
  false
)
RETURNING id, name, slug;

-- 5. VERIFICAR RESULTADO
SELECT 
  id,
  name,
  slug,
  type,
  "supportsPix" as pix,
  "supportsCreditCard" as cartao,
  "supportsBoleto" as boleto,
  "isActive" as ativo
FROM "Gateway"
WHERE slug = 'paguex';
