-- ============================================
-- CRIAR GATEWAY PAGUE-X
-- Execute este SQL no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/ovskepqggmxlfckxqgbr/sql/new
-- ============================================

-- 1. LIMPAR GATEWAYS ANTIGOS
DELETE FROM "Gateway" WHERE slug IN ('fusionpay', 'paguex');

-- 2. CRIAR GATEWAY PAGUE-X
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
  "isPopular",
  "createdAt",
  "updatedAt"
) VALUES (
  'Pague-X',
  'paguex',
  'Gateway de pagamento Pague-X (inpagamentos.com) - Suporte completo a PIX, Cartão de Crédito/Débito e Boleto',
  'PAYMENT_PROCESSOR',
  true,
  true,
  true,
  true,
  '{"publicKey": "Chave Pública (Public Key)", "secretKey": "Chave Secreta (Secret Key)", "environment": "Ambiente (production/sandbox)"}'::jsonb,
  'https://app.inpagamentos.com/docs/intro/first-steps',
  true,
  false,
  NOW(),
  NOW()
);

-- 3. VERIFICAR RESULTADO
SELECT
  id,
  name,
  slug,
  "supportsPix" as pix,
  "supportsCreditCard" as cartao,
  "supportsBoleto" as boleto,
  "supportsDebit" as debito,
  "isActive" as ativo,
  "createdAt" as criado_em
FROM "Gateway"
WHERE slug = 'paguex';

-- ============================================
-- RESULTADO ESPERADO:
-- Deve retornar 1 linha mostrando:
-- - id: UUID do gateway criado
-- - name: Pague-X
-- - slug: paguex
-- - pix: true
-- - cartao: true
-- - boleto: true
-- - debito: true
-- - ativo: true
-- - criado_em: timestamp atual
-- ============================================

-- PRÓXIMOS PASSOS:
-- 1. Após executar este SQL com sucesso
-- 2. Acesse: Dashboard > Checkout > Gateways de Pagamento
-- 3. Localize "Pague-X" na lista
-- 4. Clique em "Configurar"
-- 5. Preencha:
--    - Public Key: sua chave pública da inpagamentos.com
--    - Secret Key: sua chave secreta da inpagamentos.com
--    - Environment: production
-- 6. Clique em "Verificar Credenciais"
-- 7. Após verificação, clique em "Salvar"
-- 8. Marque como "Gateway Padrão"
-- 9. Teste um pagamento!
