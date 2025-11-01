-- Adicionar colunas apiKey e apiSecret na tabela ShopifyIntegration
-- Migration: add_api_credentials_to_shopify_integration
-- Date: 2025-02-01

ALTER TABLE "ShopifyIntegration"
ADD COLUMN IF NOT EXISTS "apiKey" TEXT,
ADD COLUMN IF NOT EXISTS "apiSecret" TEXT;

-- Comentários para documentação
COMMENT ON COLUMN "ShopifyIntegration"."apiKey" IS 'Client ID do App Shopify Partners';
COMMENT ON COLUMN "ShopifyIntegration"."apiSecret" IS 'Client Secret do App Shopify Partners';

-- Índices para melhorar performance de buscas (opcional)
-- CREATE INDEX IF NOT EXISTS idx_shopify_integration_api_key ON "ShopifyIntegration"("apiKey");
