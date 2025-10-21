-- ============================================
-- SEED: +35 GATEWAYS ADICIONAIS (Total será 55)
-- ============================================

INSERT INTO "Gateway" (name, slug, type, "supportsPix", "supportsCreditCard", "supportsBoleto", "supportsDebit", "isActive", "isPopular") VALUES
-- Bancos Brasileiros
('Banco do Brasil', 'banco-do-brasil', 'BANK', true, true, true, true, true, false),
('Itaú', 'itau', 'BANK', true, true, true, true, true, false),
('Santander', 'santander', 'BANK', true, true, true, true, true, false),
('Caixa Econômica', 'caixa', 'BANK', true, true, true, true, true, false),
('Bradesco', 'bradesco', 'BANK', true, true, true, true, true, false),
('Nubank', 'nubank', 'BANK', true, true, false, true, true, true),
('C6 Bank', 'c6-bank', 'BANK', true, true, false, true, true, false),

-- Processadores Internacionais
('Adyen', 'adyen', 'PAYMENT_PROCESSOR', false, true, false, true, true, true),
('Braintree', 'braintree', 'PAYMENT_PROCESSOR', false, true, false, true, true, false),
('WorldPay', 'worldpay', 'PAYMENT_PROCESSOR', false, true, false, true, true, false),
('Square', 'square', 'PAYMENT_PROCESSOR', false, true, false, true, true, true),
('Authorize.net', 'authorize-net', 'PAYMENT_PROCESSOR', false, true, false, true, true, false),
('2Checkout', '2checkout', 'PAYMENT_PROCESSOR', false, true, false, true, true, false),

-- Processadores Brasil
('Cielo', 'cielo', 'PAYMENT_PROCESSOR', true, true, true, true, true, true),
('Rede', 'rede', 'PAYMENT_PROCESSOR', true, true, true, true, true, true),
('GetNet', 'getnet', 'PAYMENT_PROCESSOR', true, true, true, true, true, true),
('Stone', 'stone', 'PAYMENT_PROCESSOR', true, true, true, true, true, true),
('SafraPay', 'safrapay', 'PAYMENT_PROCESSOR', true, true, true, true, true, false),
('Granito', 'granito', 'PAYMENT_PROCESSOR', true, true, false, true, true, false),
('Zoop', 'zoop', 'PAYMENT_PROCESSOR', true, true, true, true, true, false),

-- Wallets e Alternativas
('Google Pay', 'google-pay', 'WALLET', false, true, false, false, true, true),
('Apple Pay', 'apple-pay', 'WALLET', false, true, false, false, true, true),
('Samsung Pay', 'samsung-pay', 'WALLET', false, true, false, false, true, false),
('Mercado Livre Pagamentos', 'mercado-livre-pagamentos', 'WALLET', true, true, false, false, true, false),
('Ame Digital', 'ame-digital', 'WALLET', true, false, false, false, true, false),
('Recarga Pay', 'recarga-pay', 'WALLET', true, false, false, false, true, false),

-- PIX Especializados
('Pix Manual', 'pix-manual', 'BANK', true, false, false, false, true, false),
('Celcoin', 'celcoin', 'PAYMENT_PROCESSOR', true, true, true, true, true, false),
('Shipay', 'shipay', 'PAYMENT_PROCESSOR', true, false, false, false, true, false),
('PixPDV', 'pixpdv', 'PAYMENT_PROCESSOR', true, false, false, false, true, false),

-- Fintechs
('99Pay', '99pay', 'PAYMENT_PROCESSOR', true, true, false, true, true, false),
('PagBank', 'pagbank', 'PAYMENT_PROCESSOR', true, true, true, true, true, true),
('PagVendas', 'pagvendas', 'PAYMENT_PROCESSOR', true, true, true, true, true, false),
('Hub de Pagamentos', 'hub-pagamentos', 'PAYMENT_PROCESSOR', true, true, true, true, true, false),
('eNoah', 'enoah', 'PAYMENT_PROCESSOR', true, true, true, true, true, false)

ON CONFLICT (slug) DO NOTHING;
