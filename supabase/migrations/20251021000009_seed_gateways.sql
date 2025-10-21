-- ============================================
-- SEED: 20 PRINCIPAIS GATEWAYS
-- ============================================

INSERT INTO "Gateway" (name, slug, type, "supportsPix", "supportsCreditCard", "supportsBoleto", "isActive", "isPopular") VALUES
('Mercado Pago', 'mercado-pago', 'PAYMENT_PROCESSOR', true, true, true, true, true),
('PagSeguro', 'pagseguro', 'PAYMENT_PROCESSOR', true, true, true, true, true),
('Pagar.me', 'pagarme', 'PAYMENT_PROCESSOR', true, true, true, true, true),
('Stripe', 'stripe', 'PAYMENT_PROCESSOR', false, true, false, true, true),
('Iugu', 'iugu', 'PAYMENT_PROCESSOR', true, true, true, true, false),
('Asaas', 'asaas', 'PAYMENT_PROCESSOR', true, true, true, true, false),
('PicPay', 'picpay', 'WALLET', true, false, false, true, false),
('Banco Inter', 'banco-inter', 'BANK', true, true, false, true, false),
('InfinitePay', 'infinitepay', 'PAYMENT_PROCESSOR', true, true, true, true, false),
('Vindi', 'vindi', 'PAYMENT_PROCESSOR', false, true, true, true, false),
('Juno', 'juno', 'PAYMENT_PROCESSOR', true, true, true, true, false),
('PayPal', 'paypal', 'PAYMENT_PROCESSOR', false, true, false, true, true),
('SafePay', 'safepay', 'PAYMENT_PROCESSOR', true, true, true, true, false),
('Paghiper', 'paghiper', 'PAYMENT_PROCESSOR', false, false, true, true, false),
('OpenPix', 'openpix', 'PAYMENT_PROCESSOR', true, false, false, true, false),
('Yapay', 'yapay', 'PAYMENT_PROCESSOR', true, true, true, true, false),
('Sicredi', 'sicredi', 'BANK', true, false, true, true, false),
('Openpay', 'openpay', 'PAYMENT_PROCESSOR', true, true, false, true, false),
('NeonPay', 'neonpay', 'PAYMENT_PROCESSOR', true, true, false, true, false),
('VendasPay', 'vendaspay', 'PAYMENT_PROCESSOR', true, true, true, true, false)
ON CONFLICT (slug) DO NOTHING;
