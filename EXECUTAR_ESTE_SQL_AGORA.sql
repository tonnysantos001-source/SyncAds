-- ════════════════════════════════════════════════════════════
-- EXECUTAR NO SUPABASE SQL EDITOR AGORA!
-- URL: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/sql/new
-- ════════════════════════════════════════════════════════════

-- 1. VER O QUE EXISTE (opcional - só para debug)
-- SELECT id, name, slug FROM "Gateway" WHERE slug IN ('fusionpay', 'paguex');

-- 2. LIMPAR TUDO RELACIONADO A FUSIONPAY E PAGUEX ANTIGO
DELETE FROM "GatewayConfig" 
WHERE "gatewayId" IN (
  SELECT id FROM "Gateway" WHERE slug IN ('fusionpay', 'paguex', 'fusion-pay')
);

DELETE FROM "Gateway" 
WHERE slug IN ('fusionpay', 'paguex', 'fusion-pay');

-- 3. CRIAR PAGUE-X NOVO E LIMPO
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
);

-- 4. VERIFICAR RESULTADO
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

-- ════════════════════════════════════════════════════════════
-- RESULTADO ESPERADO:
-- Deve retornar 1 linha com:
-- - id: (UUID)
-- - name: Pague-X
-- - slug: paguex
-- - pix: t (true)
-- - cartao: t (true)
-- - boleto: t (true)
-- - ativo: t (true)
-- ════════════════════════════════════════════════════════════
