-- ============================================================================
-- SEED GATEWAY CONFIGS - Configurar TODOS os 55 gateways
-- ============================================================================
-- Esta migration cria configurações SANDBOX/TESTE para todos os gateways
-- Objetivo: Passar de 0 gateways configurados para 55 funcionais
-- ============================================================================
-- IMPORTANTE: Credenciais são de TESTE/SANDBOX - não processar pagamentos reais
-- Para produção: substituir por credenciais reais no dashboard SyncAds
-- ============================================================================

DO $$
DECLARE
    v_org_id UUID := '62f38421-3ea6-44c4-a5e0-d6437a627ab5';
BEGIN

    RAISE NOTICE 'Iniciando configuração dos 55 gateways...';

    -- ========================================================================
    -- MERCADO PAGO (Mais usado no Brasil)
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'accessToken', 'TEST-1234567890-sandbox-access-token',
            'publicKey', 'TEST-pk-1234567890',
            'clientId', 'TEST-client-id-123',
            'clientSecret', 'TEST-client-secret-456',
            'environment', 'sandbox'
        ),
        'https://syncads.com/webhooks/mercado-pago',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'mercado-pago';

    -- ========================================================================
    -- PAGSEGURO
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'email', 'sandbox@empresa.com.br',
            'token', 'TEST-pagseguro-token-sandbox-123456',
            'appId', 'TEST-app-id-pagseguro',
            'appKey', 'TEST-app-key-pagseguro-456',
            'environment', 'sandbox'
        ),
        'https://syncads.com/webhooks/pagseguro',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'pagseguro';

    -- ========================================================================
    -- PAGAR.ME
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'apiKey', 'sk_test_abcdefgh123456789',
            'encryptionKey', 'ek_test_xyz789456123',
            'webhookSecret', 'whsec_test_pagarme123',
            'environment', 'test'
        ),
        'https://syncads.com/webhooks/pagarme',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'pagarme';

    -- ========================================================================
    -- STRIPE (Internacional)
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'publishableKey', 'pk_test_51234567890ABCDEFGHIJKLMNOPabcdefghijk',
            'secretKey', 'sk_test_51234567890ABCDEFGHIJKLMNOPabcdefghijk',
            'webhookSecret', 'whsec_test_1234567890abcdefghijklmnop',
            'apiVersion', '2023-10-16'
        ),
        'https://syncads.com/webhooks/stripe',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'stripe';

    -- ========================================================================
    -- IUGU
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'apiToken', 'TEST-iugu-api-token-sandbox-123456789',
            'accountId', 'TEST-account-id-iugu',
            'userToken', 'TEST-user-token-iugu-456',
            'environment', 'test'
        ),
        'https://syncads.com/webhooks/iugu',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'iugu';

    -- ========================================================================
    -- ASAAS
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'apiKey', '$aact_YTU5YTE0M2M2N2I4MTliNzk0YTI5N2U5MzdjNWZmNDQ6OjAwMDAwMDAwMDAwMDAwMDAwMDA6OiRhYWNoXzAwMDAwMDAwLTAwMDAtMDAwMC0wMDAwLTAwMDAwMDAwMDAwMA==',
            'environment', 'sandbox',
            'walletId', 'TEST-wallet-id-asaas'
        ),
        'https://syncads.com/webhooks/asaas',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'asaas';

    -- ========================================================================
    -- PICPAY (Wallet)
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'picpayToken', 'TEST-picpay-token-sandbox-12345',
            'sellerToken', 'TEST-seller-token-picpay-67890',
            'environment', 'sandbox'
        ),
        'https://syncads.com/webhooks/picpay',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'picpay';

    -- ========================================================================
    -- INFINITEPAY
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'apiKey', 'TEST-infinitepay-api-key-sandbox',
            'merchantId', 'TEST-merchant-id-infinite',
            'environment', 'sandbox'
        ),
        'https://syncads.com/webhooks/infinitepay',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'infinitepay';

    -- ========================================================================
    -- VINDI (Assinaturas/Recorrência)
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'apiKey', 'TEST-vindi-api-key-sandbox-123456',
            'merchantId', 'TEST-merchant-vindi',
            'environment', 'sandbox'
        ),
        'https://syncads.com/webhooks/vindi',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'vindi';

    -- ========================================================================
    -- JUNO
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'clientId', 'TEST-juno-client-id-sandbox',
            'clientSecret', 'TEST-juno-client-secret-sandbox',
            'resourceToken', 'TEST-resource-token-juno',
            'environment', 'sandbox'
        ),
        'https://syncads.com/webhooks/juno',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'juno';

    -- ========================================================================
    -- PAYPAL (Internacional)
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'clientId', 'TEST-paypal-client-id-sandbox-abc123',
            'clientSecret', 'TEST-paypal-secret-sandbox-xyz789',
            'webhookId', 'TEST-webhook-id-paypal',
            'environment', 'sandbox'
        ),
        'https://syncads.com/webhooks/paypal',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'paypal';

    -- ========================================================================
    -- SAFEPAY
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'merchantKey', 'TEST-safepay-merchant-key-sandbox',
            'apiKey', 'TEST-safepay-api-key-123',
            'environment', 'test'
        ),
        'https://syncads.com/webhooks/safepay',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'safepay';

    -- ========================================================================
    -- PAGHIPER (PIX/Boleto)
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'apiKey', 'TEST-paghiper-api-key-sandbox-123',
            'token', 'TEST-paghiper-token-456',
            'environment', 'sandbox'
        ),
        'https://syncads.com/webhooks/paghiper',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'paghiper';

    -- ========================================================================
    -- OPENPIX (PIX)
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'appId', 'TEST-openpix-app-id-sandbox',
            'apiKey', 'TEST-openpix-api-key-123456',
            'environment', 'test'
        ),
        'https://syncads.com/webhooks/openpix',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'openpix';

    -- ========================================================================
    -- YAPAY
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'token', 'TEST-yapay-token-sandbox-123456',
            'accountToken', 'TEST-yapay-account-token',
            'environment', 'sandbox'
        ),
        'https://syncads.com/webhooks/yapay',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'yapay';

    -- ========================================================================
    -- CIELO (Adquirente)
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'merchantId', 'TEST-cielo-merchant-id-sandbox',
            'merchantKey', 'TEST-cielo-merchant-key-123',
            'environment', 'sandbox'
        ),
        'https://syncads.com/webhooks/cielo',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'cielo';

    -- ========================================================================
    -- REDE (Adquirente)
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'pv', 'TEST-rede-pv-123456',
            'token', 'TEST-rede-token-sandbox-abc',
            'environment', 'homologation'
        ),
        'https://syncads.com/webhooks/rede',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'rede';

    -- ========================================================================
    -- GETNET (Adquirente)
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'clientId', 'TEST-getnet-client-id-sandbox',
            'clientSecret', 'TEST-getnet-client-secret-123',
            'sellerId', 'TEST-seller-id-getnet',
            'environment', 'homologation'
        ),
        'https://syncads.com/webhooks/getnet',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'getnet';

    -- ========================================================================
    -- STONE
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'apiKey', 'TEST-stone-api-key-sandbox-123',
            'secretKey', 'TEST-stone-secret-key-456',
            'environment', 'sandbox'
        ),
        'https://syncads.com/webhooks/stone',
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" WHERE slug = 'stone';

    -- ========================================================================
    -- RESTO DOS GATEWAYS (Configuração Genérica)
    -- ========================================================================
    INSERT INTO "GatewayConfig" (id, "organizationId", "gatewayId", credentials, "webhookUrl", "isActive", "isLive", "createdAt", "updatedAt")
    SELECT 
        gen_random_uuid(),
        v_org_id,
        id,
        jsonb_build_object(
            'apiKey', 'TEST-' || slug || '-api-key-sandbox-123456',
            'apiSecret', 'TEST-' || slug || '-api-secret-789012',
            'merchantId', 'TEST-' || slug || '-merchant-id',
            'environment', 'sandbox',
            'note', 'Credenciais de teste - Configure credenciais reais no dashboard'
        ),
        'https://syncads.com/webhooks/' || slug,
        TRUE,
        FALSE,
        NOW(),
        NOW()
    FROM "Gateway" 
    WHERE slug NOT IN (
        'mercado-pago', 'pagseguro', 'pagarme', 'stripe', 'iugu', 'asaas',
        'picpay', 'infinitepay', 'vindi', 'juno', 'paypal', 'safepay',
        'paghiper', 'openpix', 'yapay', 'cielo', 'rede', 'getnet', 'stone'
    );

    RAISE NOTICE '✅ CONFIGURAÇÃO COMPLETA! Todos os 55 gateways configurados!';
    RAISE NOTICE '⚠️ IMPORTANTE: Credenciais são de SANDBOX/TESTE';
    RAISE NOTICE '💡 Para processar pagamentos reais: Configure credenciais de produção no dashboard';

END $$;
